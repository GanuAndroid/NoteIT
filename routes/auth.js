require('dotenv').config({ path: 'authentication.env' });
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const Support = require("../models/support");



const { successResponse, errorResponse } = require("../utils/apiResponse");

router.post("/register", async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    const mobileNumber = Number(mobile);
    if (isNaN(mobileNumber)) {
      return errorResponse(res, "Invalid mobile number", 400, "mobile");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      mobile: mobileNumber,
      password: hashedPassword,
    });

    await newUser.save();

    return successResponse(
      res,
      "User registered successfully!",
      {
        name: newUser.name,
        email: newUser.email,
        mobile: newUser.mobile
      },
      201
    );

  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const fieldError =
        field === "email"
          ? "Email already registered"
          : field === "mobile"
          ? "Mobile number already registered"
          : "Duplicate value";

      return errorResponse(res, fieldError, 400, field);
    }

    console.error("Registration error:", error);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
});


// Login
router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return errorResponse(res, "Email/Mobile and Password are required", 400);
    }

    let user;
    if (isNaN(identifier)) {
      user = await User.findOne({ email: identifier });
    } else {
      user = await User.findOne({ mobile: identifier });
    }

    if (!user) {
      return errorResponse(res, "User not found", 400);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return errorResponse(res, "Invalid credentials", 400);
    }

    return successResponse(res, "Login successful", {
      id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile
    });

  } catch (err) {
    console.error(err);
    return errorResponse(res, "Server error", 500);
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

router.post("/update-profile", async (req, res) => {
  try {
    const { id, name, email,mobile } = req.body;

    // 1️⃣ Validate input
    if (!id || !name || !email || !mobile) {
      return errorResponse(res, "All fields are required", 400);
    }

    // 2️⃣ Find user by ID
    const user = await User.findById(id);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }


     // 3️⃣ Update values
    user.name = name;
    user.email = email;
    user.mobile = mobile;
     await user.save();

    // 5️⃣ Update profile
     return successResponse(res, "User Profile Updated Sucessfully", {
      id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile
    });

   
  } catch (error) {
    console.error("Profile Updated:", error);
    return errorResponse(res, "Server error", 500);
  }
});


router.post("/delete-account", async (req, res) => {
  try {
    const { id, password } = req.body;

    // 1️⃣ Validate input
    if (!id || !password) {
      return errorResponse(res, "User ID and password are required", 400);
    }

    // 2️⃣ Find user
    const user = await User.findById(id);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    // 3️⃣ Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return errorResponse(res, "Incorrect password", 400, "password");
    }

    // 4️⃣ Delete account
    await User.findByIdAndDelete(id);

    return successResponse(res, "Account deleted successfully");

  } catch (error) {
    console.error("Delete account error:", error);
    return errorResponse(res, "Server error", 500);
  }
});

router.post("/help-support", async (req, res) => {
  try {
    const { userId, message } = req.body;

    // 1️⃣ Validate
    if (!userId || !message) {
      return errorResponse(res, "User ID and message are required", 400);
    }

    // 2️⃣ Check user exists
    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    // 3️⃣ Save support request
    const supportTicket = await Support.create({
      userId,
      message
    });

    return successResponse(res, "Support request submitted successfully", {
      ticketId: supportTicket._id,
      status: supportTicket.status,
      message: supportTicket.message
    });

  } catch (error) {
    console.error("Help support error:", error);
    return errorResponse(res, "Server error", 500);
  }
});



module.exports = router;
