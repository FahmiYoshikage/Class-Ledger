import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        absen: {
            type: Number,
            required: true,
            unique: true,
        },
        status: {
            type: String,
            enum: ['Aktif', 'Tidak Aktif', 'Alumni'],
            default: 'Aktif',
        },
        phoneNumber: {
            type: String,
            trim: true,
            validate: {
                validator: function (v) {
                    // Validasi nomor WA Indonesia: 08xx atau 628xx
                    return !v || /^(08|628)\d{8,12}$/.test(v);
                },
                message: (props) =>
                    `${props.value} bukan format nomor WhatsApp yang valid!`,
            },
        },
        enableNotification: {
            type: Boolean,
            default: true,
        },
        lastNotificationSent: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model('Student', studentSchema);
