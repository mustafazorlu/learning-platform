import "dotenv/config";
import mongoose from "mongoose";

const dbUrl: string = process.env.DB_URL || "";
const connectDB = async () => {
    try {
        await mongoose.connect(dbUrl).then((data: any) => {
            console.log("database connected");
        });
    } catch (error: any) {
        console.log(error.message);
        setTimeout(connectDB, 10000);
    }
};
export default connectDB;
