import PersonMaster from "../schema/PersonMaster.js";
import bcrypt from "bcryptjs";
import { OAuth2Client } from 'google-auth-library';
import { generateToken } from "../middlewares/token.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export default class Signup{
    async createuser(req,res){
        try {
            const {first_name, last_name, email, password, contact_number, country, user_type} = req.body;
            const check_existing_user = await PersonMaster.findOne({email})
            if(!first_name || !last_name || !email || !password || !contact_number || !country || !user_type){
                return res.status(400).json({message: "Please fill required fields"});
            } 
            if(check_existing_user){
                return res.status(400).json({message: "User already exists"});
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            const personName = first_name + " " + last_name;
            
            const newUser = new PersonMaster({
                first_name,
                last_name,
                personName,
                password: hashedPassword,
                email,
                contact_number,
                country,
                user_type,
                status: 1,
            });

            const savedUser = await newUser.save();
            return res.status(201).json({
                message: "User created successfully",
                user: {
                    _id: savedUser._id,
                    first_name: savedUser.first_name,
                    last_name: savedUser.last_name,
                    personName: savedUser.personName,
                    email: savedUser.email,
                    contact_number: savedUser.contact_number,
                    country: savedUser.country,
                    user_type: savedUser.user_type,
                    status: savedUser.status,
                    createdAt: savedUser.createdAt,
                }
            });
        } catch (error) {
            console.error("Error creating user:", error);
            return res.status(500).json({message: "Failed to create user", error: error.message});
        }
    }

    async googleSignup(req, res) {
        try {
            const { token } = req.body;
            const userRole = req.headers.userrole;
            
            if (!token) {
                return res.status(400).json({ message: "Google token is required" });
            }

            if (!userRole) {
                return res.status(400).json({ message: "User role is required" });
            }

            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });

            const payload = ticket.getPayload();
            const { sub: googleId, email, given_name, family_name, picture, name } = payload;

            // Check if user already exists
            let user = await PersonMaster.findOne({ googleId });
            
            if (!user) {
                user = await PersonMaster.findOne({ email });
                
                if (user) {
                    return res.status(400).json({ 
                        message: "User already exists with this email. Please use login instead." 
                    });
                }
            } else {
                return res.status(400).json({ 
                    message: "User already exists. Please use login instead." 
                });
            }

            // Create new user
            const newUser = new PersonMaster({
                googleId,
                email,
                first_name: given_name,
                last_name: family_name || ' ',
                personName: name,
                profile_pic: picture,
                user_type: userRole,
                email_verified: 1,
                status: 1,
            });

            const savedUser = await newUser.save();

            // Generate JWT token
            const newtoken = generateToken({
                id: String(savedUser._id),
                username: savedUser.personName,
                role: savedUser.user_type,
                email: savedUser.email
            });

            return res.json({
                message: "User created successfully",
                newtoken,
                user: {
                    _id: savedUser._id,
                    first_name: savedUser.first_name,
                    last_name: savedUser.last_name,
                    personName: savedUser.personName,
                    email: savedUser.email,
                    user_type: savedUser.user_type,
                    profile_pic: savedUser.profile_pic,
                    status: savedUser.status,
                    createdAt: savedUser.createdAt,
                }
            });

        } catch (error) {
            console.error("Error in Google signup:", error);
            return res.status(500).json({ 
                message: "Failed to create user with Google", 
                error: error.message 
            });
        }
    }
}