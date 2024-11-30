import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    userName: { type: String, required: true, unique: true },
    userPassword: { type: String, required: true },
    email: { type: String },
    nickname: { type: String },
    phone: { type: String },
    avatar: { type: String },
    booklist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Story' }],
    voiceList: [{ type: String }],
}, {
    timestamps: true
});

export const userModel = mongoose.model('User', userSchema);
