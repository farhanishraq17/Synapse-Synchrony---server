import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function resetTestUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connected\n');

    // Reset login attempts and unlock accounts
    const result = await User.updateMany(
      {
        email: { $in: ['testuser1@synapse.com', 'testuser2@synapse.com', 'testuser3@synapse.com'] }
      },
      {
        $set: {
          loginAttempts: 0,
          isActive: true,
          isVerified: true
        },
        $unset: {
          lockUntil: 1
        }
      }
    );

    console.log(`✅ Reset ${result.modifiedCount} user accounts`);
    console.log('   - Unlocked accounts');
    console.log('   - Reset login attempts');
    console.log('   - Activated accounts\n');

    // Verify users
    const users = await User.find({
      email: { $in: ['testuser1@synapse.com', 'testuser2@synapse.com', 'testuser3@synapse.com'] }
    }).select('email name isActive loginAttempts lockUntil');

    console.log('📋 Test Users Status:');
    users.forEach(user => {
      console.log(`   - ${user.email}: Active=${user.isActive}, LoginAttempts=${user.loginAttempts}, Locked=${!!user.lockUntil}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Done! You can now run tests.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetTestUsers();
