import { randomUUID } from 'crypto';
import { Schema, model, models } from 'mongoose';

const ParticipantSchema = new Schema(
  {
    userId: { type: String, required: true },
    lastReadAt: { type: Date, default: null },
  },
  { _id: false }
);

const ConversationSchema = new Schema(
  {
    _id: { type: String, default: randomUUID },
    participants: [ParticipantSchema],
    lastMessageAt: { type: Date, default: null, index: true },
    lastMessagePreview: { type: String, default: null },
  },
  { timestamps: true, versionKey: false }
);

export const Conversation = models.Conversation || model('Conversation', ConversationSchema);

