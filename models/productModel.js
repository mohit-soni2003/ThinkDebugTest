const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        required: true
    },

    price: {
        type: Number,
        required: true
    },

    stock: {
        type: Number,
        required: true,
        default: 0
    },

    images: [
        {
            type: String
        }
    ],

    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    isActive: {
        type: Boolean,
        default: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;