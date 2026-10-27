import dns from "node:dns";
import mongoose from "mongoose";


dns.setServers(["8.8.8.8", "1.1.1.1"]);

export const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is missing in .env");
    process.exit(1);
  }
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    console.error("DB connection failed:", err.message);
    process.exit(1);
  }
};