import mongoose from 'mongoose';
import dns from 'dns';

// Ensure Windows DNS resolvers handle MongoDB Atlas SRV records properly
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore if not permitted
}

let connectionPromise: Promise<typeof mongoose> | null = null;

export function connectMongo(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose);
  }

  if (!connectionPromise) {
    const uri = process.env.DATABASE_URL || process.env.MONGO_URI;
    if (!uri || !uri.startsWith('mongodb')) {
      return Promise.reject(new Error('DATABASE_URL must be a MongoDB connection string'));
    }

    connectionPromise = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 10000,
      })
      .catch((error) => {
        connectionPromise = null;
        throw error;
      });
  }

  return connectionPromise;
}

export function isMongoConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
