const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const auth = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT;
const { User } = require("../../models");
auth.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, userName, password, gender, phone } =
      req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      userName,
      password: hashedPassword,
      gender,
      phone,
      is_active: true,
    });
    res.status(200).json({
      message: "User Account registered successfully",
      userId: newUser,
    });
  } catch (error) {
    console.error("error in /register:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

auth.get("/users", async (req, res) => {
  try {
    const users = await User.findAll();
    res.status(200).json({ users });
  } catch (error) {
    console.error("error in /users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

auth.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const userEmail = await User.findOne({
      where: { email },
    });
    if (!userEmail) {
      return res.status(404).json({ message: "User not found" });
    }
    const isPasswordValid = await bcrypt.compare(password, userEmail.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid password",
      });
    }
    const token = jwt.sign(
      {
        id: userEmail.id,
        email: userEmail.email,
      },
      JWT_SECRET,
      {
        expiresIn:"1d"
      }
    );
    res.json({
      message: "Login successful",
      userId: userEmail.id,
      token,
    });
  } catch (error) {
    console.error("error in /login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = auth;
