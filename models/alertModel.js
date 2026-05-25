// models/alertModel.js

const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    title: {
        type: String,
        required: true
    },

    message: {
        type: String,
        required: true
    },

    type: {
        type: String,
        enum: [
            "low_stock",
            "order",
            "payment",
            "system",
            "security"
        ],
        default: "system"
    },

    severity: {
        type: String,
        enum: [
            "low",
            "medium",
            "high",
            "critical"
        ],
        default: "low"
    },

    isResolved: {
        type: Boolean,
        default: false
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

const Alert = mongoose.model(
    "Alert",
    alertSchema
);

module.exports = Alert;