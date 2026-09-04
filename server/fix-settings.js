import mongoose from 'mongoose';
import Setting from './server/models/Setting.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kas-kelas';

async function fixSettings() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Set correct settings
        const startDate = '2025-10-27'; // START_DATE dari .env
        const pausedWeek = 7; // Di-pause 2 minggu lalu = week 7
        
        await Setting.findOneAndUpdate(
            { key: 'start_date' },
            { value: startDate },
            { upsert: true }
        );
        
        await Setting.findOneAndUpdate(
            { key: 'paused_week' },
            { value: pausedWeek },
            { upsert: true }
        );
        
        await Setting.findOneAndUpdate(
            { key: 'semester_status' },
            { value: 'paused' },
            { upsert: true }
        );

        console.log('\n✅ Settings updated:');
        console.log(`   start_date: ${startDate}`);
        console.log(`   paused_week: ${pausedWeek}`);
        console.log(`   semester_status: paused`);
        
        // Verify
        const allSettings = await Setting.find({
            key: { $in: ['start_date', 'paused_week', 'semester_status'] }
        });
        
        console.log('\n📊 Current settings:');
        allSettings.forEach(s => {
            console.log(`   ${s.key}: ${s.value}`);
        });
        
        await mongoose.disconnect();
        console.log('\n✅ Done!');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixSettings();
