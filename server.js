const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const path = require("path");

const app = express();

// --- MIDDLEWARE ---
app.use(cors()); 
app.use(express.json()); 

// This line allows the browser to see your HTML and images folder
app.use(express.static(__dirname)); 

// --- DATABASE CONNECTION ---
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "admin456", // Use your MySQL password
    database: "phoolmitra"
});

db.connect((err) => {
    if (err) {
        console.error("❌ MySQL Connection Error: " + err.message);
        return;
    }
    console.log("✅ Connected to MySQL: phoolmitra");
});

// --- SIGNUP ROUTE ---
app.post("/signup", async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
        db.query(sql, [username, email, hashedPassword], (err, result) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true });
        });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// --- LOGIN ROUTE ---
app.post("/login", (req, res) => {
    const { email, password } = req.body;
    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
        if (err || results.length === 0) return res.json({ success: false, message: "User not found" });
        const isMatch = await bcrypt.compare(password, results[0].password);
        if (isMatch) res.json({ success: true, username: results[0].username });
        else res.json({ success: false, message: "Wrong password" });
    });
});

// --- ORDER ROUTE ---
app.post('/api/orders', (req, res) => {
    const { order_number, total_amount, tracking_id, flower_items } = req.body;

    console.log("📦 Received New Order:", order_number);

    // Note: flower_items should be passed as a string if your DB column is TEXT or VARCHAR
    const itemsString = typeof flower_items === 'object' ? JSON.stringify(flower_items) : flower_items;

    const sql = "INSERT INTO orders (order_number, total_amount, tracking_id, flower_items) VALUES (?, ?, ?, ?)";
    
    db.query(sql, [order_number, total_amount, tracking_id, itemsString], (err, result) => {
        if (err) {
            console.error("❌ SQL ERROR:", err.sqlMessage);
            return res.status(500).json({ error: err.sqlMessage });
        }
        console.log("✅ Order Saved to DB! ID:", result.insertId);
        res.json({ success: true, message: "Order stored" });
    });
});

// --- START SERVER ---
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`✅ Images and HTML are being served from: ${__dirname}`);
});