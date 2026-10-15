import User from '../models/User.js';

export const POST = async (req, res) => {
    try {
        const { name = "", username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required." });
        }

        const newUser = new User({
            name,
            username
        });
        newUser.setPassword(password);
        await newUser.save();
        return res.status(201).json({
            id: newUser._id,
            name: newUser.name,
            username: newUser.username
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: err });
    }
}

export const GET = async (req, res) => {
    try {
        const users = await User.find().select("-passwordHash -passwordSalt");
        return res.status(200).json(users);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: err });
    }
}

export const PUT = async (req, res) => {
    try {
        const { id, name, username } = req.body;
        const updatedUser = await User.findByIdAndUpdate(id, { name, username }, { new: true }).select("-passwordHash -passwordSalt");
        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.status(200).json(updatedUser);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: err });
    }
}
