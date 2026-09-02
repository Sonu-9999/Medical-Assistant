import mongoose from 'mongoose';

let isConnected = false;

export async function connectDB(): Promise<boolean> {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medisummarize';

  try {
    mongoose.set('strictQuery', false);
    // Attempt connection with a short timeout so app starts swiftly even if local mongod is offline
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000,
    });
    isConnected = true;
    console.log(`[Database] MongoDB connected successfully to ${mongoUri}`);
    return true;
  } catch (error: any) {
    isConnected = false;
    console.warn(`[Database] MongoDB connection to ${mongoUri} could not be established (${error.message}).`);
    console.info(`[Database] Running with in-memory persistent storage fallback. All patient registration, report uploads, and Gemini AI summarizations will work normally.`);
    return false;
  }
}

export function isMongoConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

export default connectDB;
