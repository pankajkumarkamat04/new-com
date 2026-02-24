import mongoose from 'mongoose';

const connectDB = async () => {

  console.log(process.env.MONGODB_URI );
  
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27018/new-com');
    console.log(`MongoDB Connected: ${conn.connection.host}:${conn.connection.port}`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

export default connectDB;
