import mongoose from 'mongoose';

/**
 * Database Connection Configuration
 * Establishes connection to MongoDB with proper error handling
 */
const connectDB = async () => {
  try {
    const options = {
      // Mongoose 6+ no longer needs these options, but included for compatibility
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
      
      // Connection pool settings
      maxPoolSize: 10,
      minPoolSize: 5,
      
      // Timeout settings
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      
      // Auto-indexing (disable in production for performance)
      autoIndex: process.env.NODE_ENV !== 'production',
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database Name: ${conn.connection.name}`);

    // Connection event listeners
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('Error during MongoDB disconnection:', err);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('Full error:', error);
    process.exit(1); // Exit with failure
  }
};

export default connectDB;
