import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
await mongoose.connect(process.env.MONGODB_URI);
const result = await mongoose.connection.db
    .collection('users')
    .updateOne({ username: 'admin' }, { $set: { mustChangePassword: false } });
console.log(
    '✅ mustChangePassword set to false. Modified:',
    result.modifiedCount
);
await mongoose.disconnect();
