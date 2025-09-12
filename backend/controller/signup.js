import PersonMaster from "../schema/PersonMaster.js";
import bcrypt from "bcryptjs";

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
}