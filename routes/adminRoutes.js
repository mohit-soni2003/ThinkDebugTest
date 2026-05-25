// routes/productRoutes.js

const express = require("express");
const Product = require("../models/productModel");
const Order = require("../models/orderModel");

const authMiddleware = require("../middlewares/authMiddlewares");
const authorizeRoles = require("../middlewares/roleMiddleware");
const upload = require("../middlewares/uploadMiddleware");

const router = express.Router();


// ================= ADMIN GET ALL PRODUCTS WITH FILTERS =================

router.get(
    "/products",
    authMiddleware,
    authorizeRoles("admin"),
    async (req, res) => {

        try {

            const {
                isActive,
                minPrice,
                maxPrice,
                minStock,
                maxStock,
                sortBy,
                order
            } = req.query;

            // ================= FILTER OBJECT =================

            const filter = {};

            // Filter by active status
            if (isActive !== undefined) {

                filter.isActive =
                    isActive === "true";
            }

            // ================= PRICE FILTER =================

            if (minPrice || maxPrice) {

                filter.price = {};

                // Price >= x
                if (minPrice) {
                    filter.price.$gte =
                        Number(minPrice);
                }

                // Price <= x
                if (maxPrice) {
                    filter.price.$lte =
                        Number(maxPrice);
                }
            }

            // ================= STOCK FILTER =================

            if (minStock || maxStock) {

                filter.stock = {};

                // Stock >= x
                if (minStock) {
                    filter.stock.$gte =
                        Number(minStock);
                }

                // Stock <= x
                if (maxStock) {
                    filter.stock.$lte =
                        Number(maxStock);
                }
            }

            // ================= SORTING =================

            const sortOptions = {};

            /*
                sortBy options:
                - createdAt
                - stock
                - price
            */

            if (sortBy) {

                // asc or desc
                const sortOrder =
                    order === "asc" ? 1 : -1;

                sortOptions[sortBy] = sortOrder;
            }
            else {

                // Default sorting
                sortOptions.createdAt = -1;
            }

            // ================= FETCH PRODUCTS =================

            const products = await Product.find(filter)
                .populate(
                    "sellerId",
                    "name email role"
                )
                .sort(sortOptions);

            // ================= RESPONSE =================

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
// This is the Documentation for the admin route to get all products with filters and sorting. 
// Admins can filter products based on active status, price range, and stock range. 
// They can also sort the results by created date, price, or stock in ascending or descending order.
// | Query Parameter | Type    | Description                                   | Example |
// | --------------- | ------- | --------------------------------------------- | ------- |
// | isActive        | Boolean | Filter active/inactive products               | `true`  |
// | minPrice        | Number  | Products price greater than or equal to value | `1000`  |
// | maxPrice        | Number  | Products price less than or equal to value    | `5000`  |
// | minStock        | Number  | Products stock greater than or equal to value | `10`    |
// | maxStock        | Number  | Products stock less than or equal to value    | `50`    |
// | sortBy          | String  | Sort field                                    | `price` |
// | order           | String  | Sorting order (`asc` or `desc`)               | `asc`   |


// ============================================================
// 1. SELLER-WISE REVENUE AND TOTAL ORDERS
// ============================================================

router.get(
    "/analytics/seller-revenue",
    authMiddleware,
    authorizeRoles(["admin"]),
    async (req, res) => {

        try {

            const analytics = await Order.aggregate([

                // Break items array
                {
                    $unwind: "$items"
                },

                // Join product collection
                {
                    $lookup: {
                        from: "products",
                        localField: "items.productId",
                        foreignField: "_id",
                        as: "productDetails"
                    }
                },

                {
                    $unwind: "$productDetails"
                },

                // Group by seller
                {
                    $group: {

                        _id: "$productDetails.sellerId",

                        totalRevenue: {
                            $sum: {
                                $multiply: [
                                    "$items.quantity",
                                    "$items.price"
                                ]
                            }
                        },

                        totalOrders: {
                            $sum: 1
                        }
                    }
                },

                // Join seller details
                {
                    $lookup: {
                        from: "users",
                        localField: "_id",
                        foreignField: "_id",
                        as: "seller"
                    }
                },

                {
                    $unwind: "$seller"
                },

                // Final response fields
                {
                    $project: {

                        sellerName: "$seller.name",

                        sellerEmail: "$seller.email",

                        totalRevenue: 1,

                        totalOrders: 1
                    }
                }
            ]);

            res.status(200).json({
                success: true,
                analytics
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


// ============================================================
// 2. TOP 5 PRODUCTS BY QUANTITY SOLD
// ============================================================

router.get(
    "/analytics/top-products",
    authMiddleware,
    authorizeRoles(["admin"]),
    async (req, res) => {

        try {

            const topProducts = await Order.aggregate([

                {
                    $unwind: "$items"
                },

                {
                    $group: {

                        _id: "$items.productId",

                        totalSold: {
                            $sum: "$items.quantity"
                        }
                    }
                },

                {
                    $sort: {
                        totalSold: -1
                    }
                },

                {
                    $limit: 5
                },

                {
                    $lookup: {
                        from: "products",
                        localField: "_id",
                        foreignField: "_id",
                        as: "product"
                    }
                },

                {
                    $unwind: "$product"
                },

                {
                    $project: {

                        productName: "$product.name",

                        totalSold: 1,

                        price: "$product.price",

                        images: "$product.images"
                    }
                }
            ]);

            res.status(200).json({
                success: true,
                topProducts
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


// ============================================================
// 3. MONTHLY REVENUE GROUPED BY MONTH & YEAR
// ============================================================

router.get(
    "/analytics/monthly-revenue",
    authMiddleware,
    authorizeRoles(["admin"]),
    async (req, res) => {

        try {

            const revenue = await Order.aggregate([

                {
                    $group: {

                        _id: {

                            year: {
                                $year: "$createdAt"
                            },

                            month: {
                                $month: "$createdAt"
                            }
                        },

                        totalRevenue: {
                            $sum: "$totalAmount"
                        },

                        totalOrders: {
                            $sum: 1
                        }
                    }
                },

                {
                    $sort: {
                        "_id.year": 1,
                        "_id.month": 1
                    }
                }
            ]);

            res.status(200).json({
                success: true,
                revenue
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


// ============================================================
// 4. ADMIN DASHBOARD SUMMARY
// ============================================================

router.get(
    "/analytics/dashboard-summary",
    authMiddleware,
    authorizeRoles(["admin"]),
    async (req, res) => {

        try {

            const totalProducts =
                await Product.countDocuments();

            const activeProducts =
                await Product.countDocuments({
                    isActive: true
                });

            const totalOrders =
                await Order.countDocuments();

            const revenueData =
                await Order.aggregate([
                    {
                        $group: {
                            _id: null,
                            totalRevenue: {
                                $sum: "$totalAmount"
                            }
                        }
                    }
                ]);

            const totalRevenue =
                revenueData[0]?.totalRevenue || 0;

            res.status(200).json({
                success: true,

                summary: {

                    totalProducts,

                    activeProducts,

                    totalOrders,

                    totalRevenue
                }
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


// ============================================================
// 5. LOW STOCK REPORT PER SELLER
// ============================================================

router.get(
    "/analytics/low-stock",
    authMiddleware,
    authorizeRoles(["admin"]),
    async (req, res) => {

        try {

            // default threshold = 5
            const threshold =
                Number(req.query.threshold) || 5;

            const lowStockProducts =
                await Product.find({

                    stock: {
                        $lte: threshold
                    },

                    isActive: true
                })
                .populate(
                    "sellerId",
                    "name email"
                )
                .sort({ stock: 1 });

            res.status(200).json({
                success: true,
                threshold,
                totalProducts:
                    lowStockProducts.length,
                lowStockProducts
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