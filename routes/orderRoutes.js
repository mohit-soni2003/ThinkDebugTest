const express = require("express");
const mongoose = require("mongoose");

const Order = require("../models/orderModel");
const Product = require("../models/productModel");

const authMiddleware = require("../middlewares/authMiddlewares");
const authorizeRoles = require("../middlewares/roleMiddleware");

const router = express.Router();


// ================= PLACE ORDER =================

router.post(
    "/create",
    authMiddleware,
    authorizeRoles(["customer"]),
    async (req, res) => {

        try {

            const { items } = req.body;

            // Validate items
            if (!items || items.length === 0) {

                return res.status(400).json({
                    success: false,
                    message: "Order items are required"
                });
            }

            let totalAmount = 0;

            const orderItems = [];

            // ================= CHECK PRODUCTS =================

            for (const item of items) {

                const product = await Product.findById(
                    item.productId
                );

                // Product exists?
                if (!product) {

                    return res.status(404).json({
                        success: false,
                        message: "Product not found"
                    });
                }

                // Product active?
                if (!product.isActive) {

                    return res.status(400).json({
                        success: false,
                        message: `${product.name} is inactive`
                    });
                }

                // Check stock
                if (product.stock < item.quantity) {

                    return res.status(400).json({
                        success: false,
                        message:
                            `Insufficient stock for ${product.name}`
                    });
                }

                // Reduce stock
                product.stock =
                    product.stock - item.quantity;

                await product.save();

                // Calculate total
                const itemTotal =
                    product.price * item.quantity;

                totalAmount += itemTotal;

                // Push order item
                orderItems.push({

                    productId: product._id,

                    quantity: item.quantity,

                    price: product.price
                });
            }

            // ================= CREATE ORDER =================

            const order = await Order.create({

                userId: req.user.id,

                items: orderItems,

                totalAmount,

                status: "pending"
            });

            res.status(201).json({
                success: true,
                message: "Order placed successfully",
                order
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

// ================= GET ALL ORDERS OF LOGGED-IN USER =================

router.get(
    "/my-orders",
    authMiddleware,
    async (req, res) => {

        try {

            const orders = await Order.find({
                userId: req.user.id
            })
            .populate(
                "items.productId",
                "name price images"
            )
            .sort({ createdAt: -1 });

            res.status(200).json({
                success: true,
                totalOrders: orders.length,
                orders
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

// ================= GET ORDER BY ID =================

router.get(
    "/:id",
    authMiddleware,
    async (req, res) => {

        try {

            const order = await Order.findById(req.params.id)
                .populate(
                    "userId",
                    "name email role"
                )
                .populate(
                    "items.productId",
                    "name price images"
                );

            // Check order exists
            if (!order) {

                return res.status(404).json({
                    success: false,
                    message: "Order not found"
                });
            }

            // Only owner or admin can access
            if (
                order.userId._id.toString() !== req.user.id &&
                req.user.role !== "admin"
            ) {

                return res.status(403).json({
                    success: false,
                    message: "Access Denied"
                });
            }

            res.status(200).json({
                success: true,
                order
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