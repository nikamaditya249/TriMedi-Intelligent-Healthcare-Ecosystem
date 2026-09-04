import bcrypt from "bcryptjs";
import User from "../models/User.js";

export const POST = async (req, res) => {
  try {
    const { name = "", email, username, password } = req.body;
    const userEmail = email || username;

    if (!userEmail || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name: name || userEmail.split("@")[0],
      email: userEmail,
      password: hashedPassword,
    });

    await newUser.save();
    return res.status(201).json({
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const GET = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    return res.status(200).json(users);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const PUT = async (req, res) => {
  try {
    const { id, name, email, username } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { name, email: email || username },
      { new: true }
    ).select("-password");
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json(updatedUser);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
