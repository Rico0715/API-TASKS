const express = require("express");
const mongoose = require("mongoose");

const connectDB = require("./config/database");
const app = express();
const PORT = process.env.PORT || 6001;
require("dotenv").config();

//connection db

connectDB();

app.use(express.json()); 
app.use(express.urlencoded({extended: false }));

const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/taches");


app.use("/tasks", taskRoutes);
app.use("/", authRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});   