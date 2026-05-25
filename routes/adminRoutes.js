// routes/productRoutes.js

const express = require("express");
const Product = require("../models/productModel");
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

// | Query Parameter | Type    | Description                                   | Example |
// | --------------- | ------- | --------------------------------------------- | ------- |
// | isActive        | Boolean | Filter active/inactive products               | `true`  |
// | minPrice        | Number  | Products price greater than or equal to value | `1000`  |
// | maxPrice        | Number  | Products price less than or equal to value    | `5000`  |
// | minStock        | Number  | Products stock greater than or equal to value | `10`    |
// | maxStock        | Number  | Products stock less than or equal to value    | `50`    |
// | sortBy          | String  | Sort field                                    | `price` |
// | order           | String  | Sorting order (`asc` or `desc`)               | `asc`   |

module.exports = router;