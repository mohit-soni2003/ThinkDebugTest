const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/userModels"); // adjust path if needed
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middlewares/authMiddlewares"); // adjust path if needed

const router = express.Router();

// SIGNUP ROUTE
router.get("/profile", authMiddleware,async (req, res) => {
   res.status(200).json({
        success: true,
        message: "Protected Route Accessed",
        user: req.user
    });

});





module.exports = router;