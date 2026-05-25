const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/userModels"); // adjust path if needed
const jwt = require("jsonwebtoken");

const router = express.Router();

// SIGNUP ROUTE
router.post("/signup", async (req, res) => {
    try {
        const { name, email, password, phoneNo, role } = req.body;

        // Check required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Check user already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User already exists"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            phoneNo,
            role
        });

        // Remove password from response
        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            phoneNo: user.phoneNo,
            role: user.role,
            createdAt: user.createdAt
        };

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: userResponse
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
});


router.post("/signin", async (req, res) => {

    try {

        const { email, password } = req.body;

        // Check fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and Password are required"
            });
        }

        // Find user
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid Password"
            });
        }

        // Create JWT Token
        const token = jwt.sign(
            {
                id: user._id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        // Save token in cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: false, // true in production with HTTPS
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // Response
        res.status(200).json({
            success: true,
            message: "Login Successful",
            token
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
});


module.exports = router;