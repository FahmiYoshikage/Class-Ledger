import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const NEW_PASSWORD = 'admin123456';

async function resetAdmin() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // List all admin users
    const users = await mongoose.connection.db
        .collection('users')
        .find({ role: 'admin' })
        .toArray();

    if (users.length === 0) {
        console.log('❌ No admin users found. Creating a new super admin...\n');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(NEW_PASSWORD, salt);

        await mongoose.connection.db.collection('users').insertOne({
            username: 'superadmin',
            fullName: 'Super Admin',
            password: hashedPassword,
            role: 'admin',
            isActive: true,
            mustChangePassword: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        console.log('✅ New super admin created!');
        console.log(`   Username: superadmin`);
        console.log(`   Password: ${NEW_PASSWORD}`);
    } else {
        console.log(`Found ${users.length} admin user(s):\n`);
        users.forEach((u, i) => {
            console.log(
                `  ${i + 1}. ${u.username} (${u.fullName}) - Active: ${u.isActive}`
            );
        });

        // Reset password for the first admin
        const admin = users[0];
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(NEW_PASSWORD, salt);

        await mongoose.connection.db.collection('users').updateOne(
            { _id: admin._id },
            {
                $set: {
                    password: hashedPassword,
                    isActive: true,
                    mustChangePassword: true,
                    updatedAt: new Date(),
                },
            }
        );

        console.log(`\n✅ Password reset for "${admin.username}"!`);
        console.log(`   Username: ${admin.username}`);
        console.log(`   Password: ${NEW_PASSWORD}`);
    }

    console.log('\n⚠️  Please change this password immediately after login!');
    await mongoose.disconnect();
}

resetAdmin().catch((err) => {
    console.error('Error:', err);
    process.exit(1);
});
