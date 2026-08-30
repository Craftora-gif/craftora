const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        customer: {
            name: {
                type: String,
                required: true,
                trim: true
            },

            email: {
                type: String,
                required: true,
                trim: true
            },

            phone: {
                type: String,
                required: true,
                trim: true
            },

            address: {
                type: String,
                required: true,
                trim: true
            },

            city: {
                type: String,
                required: true,
                trim: true
            },

            pincode: {
                type: String,
                required: true,
                trim: true
            }
        },

        items: [
            {
                name: {
                    type: String,
                    required: true
                },

                price: {
                    type: Number,
                    required: true
                },

                image: {
                    type: String,
                    default: ""
                },

                quantity: {
                    type: Number,
                    required: true,
                    min: 1
                }
            }
        ],

        subtotal: {
            type: Number,
            required: true
        },

        shipping: {
            type: Number,
            required: true
        },

        total: {
            type: Number,
            required: true
        },

        paymentMethod: {
            type: String,
            enum: ["cod", "upi", "card"],
            default: "cod"
        },

        orderNumber: {
            type: String,
            required: true,
            unique: true
        },

        enum: [
    "Pending",
    "Confirmed",
    "Processing",
    "Shipped",
    "Out for Delivery",
    "Delivered",
    "Cancelled"
],
            ],
            default: "Pending"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Order", orderSchema);