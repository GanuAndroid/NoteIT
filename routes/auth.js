require('dotenv').config({ path: 'authentication.env' });
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const nodemailer = require("nodemailer");
const crypto = require("crypto");


router.get("/config", (req, res) => {
  res.json({
    BACKEND_URL: process.env.BACKEND_URL
  });
});


router.post("/register", async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    // Validate mobile number
    const mobileNumber = Number(mobile);
    if (isNaN(mobileNumber)) {
      return res.status(400).json({ field: "mobile", error: "Invalid mobile number" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      mobile: mobileNumber,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully!" });

  } catch (error) {
    // ✅ Catch MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const fieldError = field === "email"
        ? "Email already registered"
        : field === "mobile"
        ? "Mobile number already registered"
        : "Duplicate value";

      return res.status(400).json({ field, error: fieldError });
    }

    console.error("Registration error:", error);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body; 
    // identifier = email OR mobile

    if (!identifier || !password) {
      return res.status(400).json({ message: "Email/Mobile and Password are required" });
    }

    // Decide if identifier is email or mobile
    let user;
    if (isNaN(identifier)) {
      user = await User.findOne({ email: identifier });
    } else {
      user = await User.findOne({ mobile: identifier });
    }

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});



router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found with this email" });
        }

        // Generate random 6-digit numeric password
        const newPassword = Math.floor(100000 + Math.random() * 900000).toString();

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user password in DB
        user.password = hashedPassword;
        await user.save();

        // Configure NodeMailer
        const transporter = nodemailer.createTransport({
            service: "Gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Email options
        const mailOptions = {
            from: `"Support" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: "Your New Temporary Password",
            text: `Hello ${user.name},\n\nYour new temporary password is: ${newPassword}\n\nPlease log in and change it immediately.\n\nRegards,\nTeam`,
        };

        // Send email
        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: "A new password has been sent to your email." });

    } catch (err) {
        console.error("Forgot password error:", err);
        res.status(500).json({ message: "Server error" });
    }
});


module.exports = router;
