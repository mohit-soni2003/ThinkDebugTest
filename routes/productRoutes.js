// routes/productRoutes.js

const express = require("express");
const Product = require("../models/productModel");
const authMiddleware = require("../middlewares/authMiddlewares");
const authorizeRoles = require("../middlewares/roleMiddleware");
const upload = require("../middlewares/uploadMiddleware");

const router = express.Router();


// ================= CREATE PRODUCT =================

router.post( "/create", authMiddleware,  authorizeRoles("seller", "admin"),  upload.array("images", 5),
    async (req, res) => {

        try {

            const {
                name,
                description,
                price,
                stock
            } = req.body;

            // Validation
            if (!name || !description || !price || !stock) {
                return res.status(400).json({
                    success: false,
                    message: "All fields are required"
                });
            }

            // Get uploaded image paths
            const images = req.files.map(file => file.path);

            // Create product
            const product = await Product.create({
                name,
                description,
                price,
                stock,
                images,
                sellerId: req.user.id
            });

            res.status(201).json({
                success: true,
                message: "Product created successfully",
                product
            });

        } catch (error) {

            console.log(error);

            res.status(500).json({
                success: false,
                message: "Server Error"
            });
        }
    }
);

// ================= GET ALL PRODUCTS OF LOGGED-IN SELLER =================

router.get(
    "/my-products",
    authMiddleware,
    authorizeRoles("seller", "admin"),
    async (req, res) => {

        try {

            const products = await Product.find({
                sellerId: req.user.id,
                isActive: true
            });

            res.status(200).json({
                success: true,
                totalProducts: products.length,
                products
            });

        } catch (error) {

            console.log(error);

            res.status(500).json({
                success: false,
                message: "Server Error"
            });
        }
    }
);

// ================= GET PRODUCT BY ID =================

router.get("/:id", async (req, res) => {

    try {

        const product = await Product.findById(req.params.id)
            .populate("sellerId", "name email role");

        // Check product exists
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Check active product
        if (!product.isActive) {
            return res.status(404).json({
                success: false,
                message: "Product is inactive"
            });
        }

        res.status(200).json({
            success: true,
            product
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
});


// ================= UPDATE PRODUCT =================

router.patch(
    "/update/:id",
    authMiddleware,
    authorizeRoles("seller", "admin"),
    upload.array("images", 5),
    async (req, res) => {

        try {

            const productId = req.params.id;

            // Find product
            const product = await Product.findById(productId);

            // Check product exists
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found"
                });
            }

            // Only owner or admin can update
            if (
                product.sellerId.toString() !== req.user.id &&
                req.user.role !== "admin"
            ) {
                return res.status(403).json({
                    success: false,
                    message: "Access Denied"
                });
            }

            // Update only provided fields

            if (req.body.name !== undefined) {
                product.name = req.body.name;
            }

            if (req.body.description !== undefined) {
                product.description = req.body.description;
            }

            if (req.body.price !== undefined) {
                product.price = req.body.price;
            }

            if (req.body.stock !== undefined) {
                product.stock = req.body.stock;
            }

            // Update images only if uploaded
            if (req.files && req.files.length > 0) {

                product.images = req.files.map(
                    file => file.path
                );
            }

            // Save updated product
            await product.save();

            res.status(200).json({
                success: true,
                message: "Product updated successfully",
                product
            });

        } catch (error) {

            console.log(error);

            res.status(500).json({
                success: false,
                message: "Server Error"
            });
        }
    }
);

// ================= DELETE PRODUCT (SOFT DELETE) =================

router.delete(
    "/delete/:id",
    authMiddleware,
    authorizeRoles("seller", "admin"),
    async (req, res) => {

        try {

            const productId = req.params.id;

            // Find product
            const product = await Product.findById(productId);

            // Check product exists
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found"
                });
            }

            // Only owner or admin can delete
            console.log(product.sellerId.toString(), req.user.id, req.user.role);
            console.log("frgsggsfsdff");
            if (
                product.sellerId.toString() !== req.user.id &&
                req.user.role !== "admin"
            ) {
                return res.status(403).json({
                    success: false,
                    message: "Access Denied"
                });
            }

            // Soft delete
            product.isActive = false;

            await product.save();

            res.status(200).json({
                success: true,
                message: "Product deleted successfully"
            });

        } catch (error) {

            console.log(error);

            res.status(500).json({
                success: false,
                message: "Server Error"
            });
        }
    }
);

module.exports = router;