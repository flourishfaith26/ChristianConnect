import { randomUUID } from 'crypto';
import { Schema, model, models } from 'mongoose';

const MessageSchema = new Schema(
  {
    _id: { type: String, default: randomUUID },
    conversationId: { type: String, required: true, index: true },
    senderId: { type: String, required: true, index: true },
    content: { type: String, default: null },
    mediaUrl: { type: String, default: null },
    mediaType: { type: String, default: null },
    moderationStatus: {
      type: String,
      enum: ['pending', 'approved', 'flagged', 'auto_rejected'],
      default: 'pending',
      index: true,
    },
    moderationReason: { type: String, default: null },
    moderatedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

export const Message = models.Message || model('Message', MessageSchema);

