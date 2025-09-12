import PersonMaster from "../schema/PersonMaster.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../middlewares/token.js";
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
export default class Login {
    async authenticate(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ message: "Email and password are required" });
            }

            const user = await PersonMaster.findOne({ email });
            if (!user) {
                return res.status(401).json({ message: "Invalid credentials" });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: "Invalid credentials" });
            }

            const token = generateToken({
                id: String(user._id),
                username: user.personName || `${user.first_name} ${user.last_name}`,
                role: user.user_type,
                email: user.email
            });

            await PersonMaster.updateOne(
                { _id: user._id },
                { $set: { last_login: new Date().toISOString() } }
            );

            return res.json({
                message: "Login successful",
                token,
                user: {
                    _id: user._id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    personName: user.personName,
                    email: user.email,
                    contact_number: user.contact_number,
                    country: user.country,
                    user_type: user.user_type,
                    status: user.status,
                    createdAt: user.createdAt,
                    last_login: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error("Error during login:", error);
            return res.status(500).json({ message: "Failed to login", error: error.message });
        }
    }
    async googleLogin(req, res) {
        try {
            const { token } = req.body;
            if (!token) {
                return res.status(400).json({ message: "Google token is required" });
            }

            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });

            const payload = ticket.getPayload();
            const { sub: googleId, email, given_name, family_name, picture, name } = payload;

            let user = await PersonMaster.findOne({ googleId });

            if (!user) {
                // If no user with googleId, check if a user with that email exists
                user = await PersonMaster.findOne({ email });

                if (user) {
                    // Link Google account to existing local account
                    user.googleId = googleId;
                    user.profile_pic = user.profile_pic || picture;
                    await user.save();
                } else {
                    // Create a new user
                    const newUser = new PersonMaster({
                        googleId,
                        email,
                        first_name: given_name,
                        last_name: family_name || ' ',
                        personName: name,
                        profile_pic: picture,
                        user_type: 'client', // Or determine this from frontend
                        email_verified: 1,
                        status: 1,
                    });
                    user = await newUser.save();
                }
            }

            // Generate JWT token
            const jwtToken = generateToken({
                id: String(user._id),
                username: user.personName || `${user.first_name} ${user.last_name}`,
                role: user.user_type,
                email: user.email
            });

            await PersonMaster.updateOne(
                { _id: user._id },
                { $set: { last_login: new Date().toISOString() } }
            );

            return res.status(200).json({
                message: "Google login successful",
                token: jwtToken,
                user: {
                    _id: user._id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    personName: user.personName,
                    email: user.email,
                    user_type: user.user_type,
                    profile_pic: user.profile_pic,
                    status: user.status,
                    last_login: new Date().toISOString()
                }
            });

        } catch (error) {
            res.status(500).json({ message: "Google login failed", error: error.message });
            console.log(error);
        }
    }
}

