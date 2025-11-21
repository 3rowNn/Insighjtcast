// db.js (ES Module)
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // ตรวจสอบว่า MONGO_URI ถูกโหลดใน server.js ก่อนแล้ว
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ Error connecting to MongoDB: ${err.message}`);
    process.exit(1); // Exit process with failure
  }
};

export default connectDB; // ใช้ export default