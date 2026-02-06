const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");

const authRoutes = require("./routes/auth"); // adjust path if needed
const noteRoutes = require("./routes/noteRoutes"); // adjust path if needed

const app = express();

app.use(cors());
app.use(bodyParser.json());


require("dotenv").config();

//mongoose.connect(process.env.MONGO_URI)
// Connect MongoDB
// Force DNS resolution using public DNS servers
const { setServers } = require("dns");
setServers(["1.1.1.1", "8.8.8.8"]);

mongoose.connect(process.env.MONGO_ATLAS)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

console.log("authRoutes:", authRoutes);
console.log("noteRoutes:", noteRoutes);
console.log("Connecting with URI:", process.env.MONGO_ATLAS);


// Use auth routes
app.use("/", authRoutes); // This mounts /register and /login routes
app.use("/api/notes", noteRoutes); // Notes API


// Serve static files (your index.html)
app.use(express.static(path.join(__dirname, "public")));


app.listen(5000,"0.0.0.0",() => console.log("Server running on http://localhost:5000"));
