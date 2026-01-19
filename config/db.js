import mongoose from "mongoose";
import keys from "./keys.js";

export const connectDB = async () => {
    try {
        await mongoose.connect(keys.mongoUri);
        console.log("MongoDB connected");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error.message);
    }
}