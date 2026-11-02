import { randomUUID } from 'crypto';
import { Schema, model, models } from 'mongoose';

const UserSchema = new Schema(
  {
    _id: { type: String, default: randomUUID },
    clerkId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    displayName: { type: String, required: true },
    bio: String,
    avatarUrl: String,
    city: String,
    region: String,
    isTrustedApologist: { type: Boolean, default: false },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, required: true },
    accountType: { type: String, default: 'adult_unverified', index: true },
    statementOfFaithAccepted: { type: Boolean, default: false },
    parentEmail: String,
    parentConsentGiven: { type: Boolean, default: false },
    parentConsentToken: String,
    isBanned: { type: Boolean, default: false },
    bannedAt: Date,
    bannedBy: String,
  },
  { timestamps: true, versionKey: false }
);

export const User = models.User || model('User', UserSchema);
