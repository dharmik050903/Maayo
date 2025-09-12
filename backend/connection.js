import mongoose from "mongoose";

export default async function connect() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
  } catch (error) {
    console.log("Database connection failed");
  }
} ;

