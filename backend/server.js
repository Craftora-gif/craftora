const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const crypto = require("crypto");

require("dotenv").config();

const User = require("./models/User");
const Order = require("./models/Order");
const Product = require("./models/Product");

const app = express();

const PORT = 5000;


/* =========================
   ADMIN SESSION STORE
========================= */

const adminSessions = new Set();


/* =========================
   MIDDLEWARE
========================= */

app.use(cors());

app.use(express.json());


/* =========================
   HOME
========================= */

app.get("/", (req, res) => {

    res.json({

        message:
            "Craftora Backend is Running 🚀",

        database:
            mongoose.connection.readyState === 1
                ? "MongoDB Connected ✅"
                : "MongoDB Not Connected ❌"

    });

});


/* =========================
   REGISTER
========================= */

app.post("/api/register", async (req, res) => {

    try {

        const {
            name,
            mobile
        } = req.body;


        if (!name || !mobile) {

            return res.status(400).json({

                success: false,

                message:
                    "Name and mobile number are required."

            });

        }


        if (!/^[0-9]{10}$/.test(mobile)) {

            return res.status(400).json({

                success: false,

                message:
                    "Please enter a valid 10-digit mobile number."

            });

        }


        const existingUser =
            await User.findOne({
                mobile: mobile
            });


        if (existingUser) {

            return res.status(400).json({

                success: false,

                message:
                    "This mobile number is already registered."

            });

        }


        const user =
            await User.create({

                name:
                    name.trim(),

                mobile:
                    mobile

            });


        res.status(201).json({

            success: true,

            message:
                "Account created successfully!",

            user: {

                id:
                    user._id,

                name:
                    user.name,

                mobile:
                    user.mobile

            }

        });

    }

    catch (error) {

        console.error(
            "Registration Error:",
            error.message
        );


        res.status(500).json({

            success: false,

            message:
                "Something went wrong while creating account."

        });

    }

});


/* =========================
   LOGIN
========================= */

app.post("/api/login", async (req, res) => {

    try {

        const {
            mobile
        } = req.body;


        if (!mobile) {

            return res.status(400).json({

                success: false,

                message:
                    "Mobile number is required."

            });

        }


        if (!/^[0-9]{10}$/.test(mobile)) {

            return res.status(400).json({

                success: false,

                message:
                    "Please enter a valid 10-digit mobile number."

            });

        }


        const user =
            await User.findOne({
                mobile: mobile
            });


        if (!user) {

            return res.status(404).json({

                success: false,

                message:
                    "No account found with this mobile number. Please register first."

            });

        }


        res.status(200).json({

            success: true,

            message:
                "User verified successfully!",

            user: {

                id:
                    user._id,

                name:
                    user.name,

                mobile:
                    user.mobile

            }

        });

    }

    catch (error) {

        console.error(
            "Login Error:",
            error.message
        );


        res.status(500).json({

            success: false,

            message:
                "Something went wrong while logging in."

        });

    }

});


/* =========================
   CREATE ORDER
========================= */

app.post("/api/orders", async (req, res) => {

    try {

        const {

            userId,
            customer,
            items,
            subtotal,
            shipping,
            total,
            paymentMethod,
            orderNumber

        } = req.body;


        if (!userId) {

            return res.status(400).json({

                success: false,

                message:
                    "User ID is required."

            });

        }


        if (
            !customer ||
            !customer.name ||
            !customer.email ||
            !customer.phone ||
            !customer.address ||
            !customer.city ||
            !customer.pincode
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Complete delivery information is required."

            });

        }


        if (
            !Array.isArray(items) ||
            items.length === 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Order must contain at least one product."

            });

        }


        const user =
            await User.findById(userId);


        if (!user) {

            return res.status(404).json({

                success: false,

                message:
                    "User not found."

            });

        }


        const order =
            await Order.create({

                userId:
                    user._id,

                customer: {

                    name:
                        customer.name.trim(),

                    email:
                        customer.email.trim(),

                    phone:
                        customer.phone.trim(),

                    address:
                        customer.address.trim(),

                    city:
                        customer.city.trim(),

                    pincode:
                        customer.pincode.trim()

                },

                items:
                    items,

                subtotal:
                    Number(subtotal),

                shipping:
                    Number(shipping),

                total:
                    Number(total),

                paymentMethod:
                    paymentMethod || "cod",

                orderNumber:
                    orderNumber

            });


        res.status(201).json({

            success: true,

            message:
                "Order placed successfully!",

            order: {

                id:
                    order._id,

                orderNumber:
                    order.orderNumber,

                status:
                    order.status,

                total:
                    order.total

            }

        });

    }

    catch (error) {

        console.error(
            "Order Error:",
            error.message
        );


        res.status(500).json({

            success: false,

            message:
                "Something went wrong while placing order."

        });

    }

});


/* =========================
   GET USER ORDERS
========================= */

app.get(
    "/api/orders/:userId",
    async (req, res) => {

        try {

            const {
                userId
            } = req.params;


            if (
                !mongoose.Types.ObjectId.isValid(
                    userId
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid user ID."

                });

            }


            const user =
                await User.findById(
                    userId
                );


            if (!user) {

                return res.status(404).json({

                    success: false,

                    message:
                        "User not found."

                });

            }


            const orders =
                await Order.find({

                    userId:
                        userId

                })
                .sort({

                    createdAt:
                        -1

                });


            res.status(200).json({

                success: true,

                count:
                    orders.length,

                orders:
                    orders

            });

        }

        catch (error) {

            console.error(
                "Order History Error:",
                error.message
            );


            res.status(500).json({

                success: false,

                message:
                    "Something went wrong while loading orders."

            });

        }

    }
);


/* =========================
   ADMIN LOGIN
========================= */

app.post(
    "/api/admin/login",
    (req, res) => {

        try {

            const {

                username,
                password

            } = req.body;


            if (
                !username ||
                !password
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Username and password are required."

                });

            }


            const adminUsername =
                process.env.ADMIN_USERNAME;

            const adminPassword =
                process.env.ADMIN_PASSWORD;


            if (
                username !== adminUsername ||
                password !== adminPassword
            ) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid admin username or password."

                });

            }


            const token =
                crypto
                .randomBytes(32)
                .toString("hex");


            adminSessions.add(
                token
            );


            res.status(200).json({

                success: true,

                message:
                    "Admin login successful!",

                token:
                    token

            });

        }

        catch (error) {

            console.error(
                "Admin Login Error:",
                error.message
            );


            res.status(500).json({

                success: false,

                message:
                    "Something went wrong during admin login."

            });

        }

    }
);


/* =========================
   ADMIN AUTH MIDDLEWARE
========================= */

function adminAuth(
    req,
    res,
    next
) {

    const authHeader =
        req.headers.authorization;


    if (
        !authHeader ||
        !authHeader.startsWith(
            "Bearer "
        )
    ) {

        return res.status(401).json({

            success: false,

            message:
                "Admin authentication required."

        });

    }


    const token =
        authHeader.substring(7);


    if (
        !adminSessions.has(
            token
        )
    ) {

        return res.status(401).json({

            success: false,

            message:
                "Admin session expired or invalid."

        });

    }


    next();

}


/* =========================
   ADMIN LOGOUT
========================= */

app.post(
    "/api/admin/logout",
    adminAuth,
    (req, res) => {

        const token =
            req.headers.authorization
            .substring(7);


        adminSessions.delete(
            token
        );


        res.json({

            success:
                true,

            message:
                "Admin logged out successfully."

        });

    }
);


/* =========================
   ADMIN — GET ALL ORDERS
========================= */

app.get(
    "/api/admin/orders",
    adminAuth,
    async (req, res) => {

        try {

            const orders =
                await Order.find()
                .populate(
                    "userId",
                    "name mobile"
                )
                .sort({

                    createdAt:
                        -1

                });


            res.status(200).json({

                success:
                    true,

                count:
                    orders.length,

                orders:
                    orders

            });

        }

        catch (error) {

            console.error(
                "Admin Orders Error:",
                error.message
            );


            res.status(500).json({

                success:
                    false,

                message:
                    "Something went wrong while loading admin orders."

            });

        }

    }
);


/* =========================
   ADMIN — UPDATE ORDER STATUS
========================= */

app.patch(
    "/api/admin/orders/:orderId/status",
    adminAuth,
    async (req, res) => {

        try {

            const {
                orderId
            } = req.params;


            const {
                status
            } = req.body;


            const allowedStatuses = [

                "Pending",
                "Confirmed",
                "Shipped",
                "Delivered",
                "Cancelled"

            ];


            if (
                !allowedStatuses.includes(
                    status
                )
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Invalid order status."

                });

            }


            if (
                !mongoose.Types.ObjectId.isValid(
                    orderId
                )
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Invalid order ID."

                });

            }


            const order =
                await Order.findByIdAndUpdate(

                    orderId,

                    {
                        status:
                            status
                    },

                    {
                        new:
                            true
                    }

                );


            if (!order) {

                return res.status(404).json({

                    success:
                        false,

                    message:
                        "Order not found."

                });

            }


            res.status(200).json({

                success:
                    true,

                message:
                    "Order status updated successfully!",

                order: {

                    id:
                        order._id,

                    orderNumber:
                        order.orderNumber,

                    status:
                        order.status

                }

            });

        }

        catch (error) {

            console.error(
                "Status Update Error:",
                error.message
            );


            res.status(500).json({

                success:
                    false,

                message:
                    "Something went wrong while updating order status."

            });

        }

    }
);


/* =========================================================
   PRODUCT MANAGEMENT
========================================================= */


/* =========================
   GET ALL ACTIVE PRODUCTS
   CUSTOMER SIDE
========================= */

app.get(
    "/api/products",
    async (req, res) => {

        try {

            const products =
                await Product.find({

                    isActive:
                        true

                })
                .sort({

                    createdAt:
                        -1

                });


            res.status(200).json({

                success:
                    true,

                count:
                    products.length,

                products:
                    products

            });

        }

        catch (error) {

            console.error(
                "Products Error:",
                error.message
            );


            res.status(500).json({

                success:
                    false,

                message:
                    "Unable to load products."

            });

        }

    }
);


/* =========================
   GET SINGLE PRODUCT
========================= */

app.get(
    "/api/products/:productId",
    async (req, res) => {

        try {

            const {
                productId
            } = req.params;


            const product =
                await Product.findOne({

                    productId:
                        productId,

                    isActive:
                        true

                });


            if (!product) {

                return res.status(404).json({

                    success:
                        false,

                    message:
                        "Product not found."

                });

            }


            res.status(200).json({

                success:
                    true,

                product:
                    product

            });

        }

        catch (error) {

            console.error(
                "Single Product Error:",
                error.message
            );


            res.status(500).json({

                success:
                    false,

                message:
                    "Unable to load product."

            });

        }

    }
);


/* =========================
   ADMIN — GET ALL PRODUCTS
========================= */

app.get(
    "/api/admin/products",
    adminAuth,
    async (req, res) => {

        try {

            const products =
                await Product.find()
                .sort({

                    createdAt:
                        -1

                });


            res.status(200).json({

                success:
                    true,

                count:
                    products.length,

                products:
                    products

            });

        }

        catch (error) {

            console.error(
                "Admin Products Error:",
                error.message
            );


            res.status(500).json({

                success:
                    false,

                message:
                    "Unable to load admin products."

            });

        }

    }
);


/* =========================
   ADMIN — ADD PRODUCT
========================= */

app.post(
    "/api/admin/products",
    adminAuth,
    async (req, res) => {

        try {

            const {

                name,
                price,
                image,
                description,
                category,
                stock,
                productId

            } = req.body;


            if (
                !name ||
                price === undefined ||
                price === null ||
                !productId
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Product name, price and product ID are required."

                });

            }


            const existingProduct =
                await Product.findOne({

                    productId:
                        productId

                });


            if (existingProduct) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "A product with this product ID already exists."

                });

            }


            const product =
                await Product.create({

                    name:
                        name.trim(),

                    price:
                        Number(price),

                    image:
                        image || "",

                    description:
                        description || "",

                    category:
                        category || "Other",

                    stock:
                        Number(stock || 0),

                    productId:
                        productId.trim(),

                    isActive:
                        true

                });


            res.status(201).json({

                success:
                    true,

                message:
                    "Product added successfully!",

                product:
                    product

            });

        }

        catch (error) {

            console.error(
                "Add Product Error:",
                error.message
            );


            res.status(500).json({

                success:
                    false,

                message:
                    "Unable to add product."

            });

        }

    }
);


/* =========================
   ADMIN — EDIT PRODUCT
========================= */

app.put(
    "/api/admin/products/:id",
    adminAuth,
    async (req, res) => {

        try {

            const {
                id
            } = req.params;


            if (
                !mongoose.Types.ObjectId.isValid(
                    id
                )
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Invalid product ID."

                });

            }


            const {

                name,
                price,
                image,
                description,
                category,
                stock,
                productId,
                isActive

            } = req.body;


            const updateData = {};


            if (
                name !== undefined
            ){

                updateData.name =
                    name.trim();

            }


            if (
                price !== undefined
            ){

                updateData.price =
                    Number(price);

            }


            if (
                image !== undefined
            ){

                updateData.image =
                    image;

            }


            if (
                description !== undefined
            ){

                updateData.description =
                    description;

            }


            if (
                category !== undefined
            ){

                updateData.category =
                    category;

            }


            if (
                stock !== undefined
            ){

                updateData.stock =
                    Number(stock);

            }


            if (
                productId !== undefined
            ){

                updateData.productId =
                    productId.trim();

            }


            if (
                isActive !== undefined
            ){

                updateData.isActive =
                    Boolean(isActive);

            }


            const product =
                await Product.findByIdAndUpdate(

                    id,

                    updateData,

                    {
                        new:
                            true,

                        runValidators:
                            true
                    }

                );


            if (!product) {

                return res.status(404).json({

                    success:
                        false,

                    message:
                        "Product not found."

                });

            }


            res.status(200).json({

                success:
                    true,

                message:
                    "Product updated successfully!",

                product:
                    product

            });

        }

        catch (error) {

            console.error(
                "Edit Product Error:",
                error.message
            );


            res.status(500).json({

                success:
                    false,

                message:
                    "Unable to update product."

            });

        }

    }
);


/* =========================
   ADMIN — DELETE PRODUCT
========================= */

app.delete(
    "/api/admin/products/:id",
    adminAuth,
    async (req, res) => {

        try {

            const {
                id
            } = req.params;


            if (
                !mongoose.Types.ObjectId.isValid(
                    id
                )
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Invalid product ID."

                });

            }


            const product =
                await Product.findByIdAndUpdate(

                    id,

                    {
                        isActive:
                            false
                    },

                    {
                        new:
                            true
                    }

                );


            if (!product) {

                return res.status(404).json({

                    success:
                        false,

                    message:
                        "Product not found."

                });

            }


            res.status(200).json({

                success:
                    true,

                message:
                    "Product removed successfully.",

                product:
                    product

            });

        }

        catch (error) {

            console.error(
                "Delete Product Error:",
                error.message
            );


            res.status(500).json({

                success:
                    false,

                message:
                    "Unable to delete product."

            });

        }

    }
);


/* =========================
   ADMIN — RESTORE PRODUCT
========================= */

app.patch(
    "/api/admin/products/:id/restore",
    adminAuth,
    async (req, res) => {

        try {

            const {
                id
            } = req.params;


            if (
                !mongoose.Types.ObjectId.isValid(
                    id
                )
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Invalid product ID."

                });

            }


            const product =
                await Product.findByIdAndUpdate(

                    id,

                    {
                        isActive:
                            true
                    },

                    {
                        new:
                            true
                    }

                );


            if (!product) {

                return res.status(404).json({

                    success:
                        false,

                    message:
                        "Product not found."

                });

            }


            res.status(200).json({

                success:
                    true,

                message:
                    "Product restored successfully.",

                product:
                    product

            });

        }

        catch (error) {

            console.error(
                "Restore Product Error:",
                error.message
            );


            res.status(500).json({

                success:
                    false,

                message:
                    "Unable to restore product."

            });

        }

    }
);


/* =========================
   MONGODB
========================= */

mongoose.connect(
    process.env.MONGODB_URI
)

.then(() => {

    console.log(
        "MongoDB Connected Successfully"
    );


    app.listen(
        PORT,
        () => {

            console.log(
                "Craftora server running at http://localhost:" +
                PORT
            );

        }
    );

})

.catch((error) => {

    console.error(
        "MongoDB Connection Failed"
    );

    console.error(
        error.message
    );

});