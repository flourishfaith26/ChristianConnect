import { randomUUID } from 'crypto';
import { Schema, model, models } from 'mongoose';

const BlockSchema = new Schema(
  {
    _id: { type: String, default: randomUUID },
    initiatorId: { type: String, required: true, index: true },
    targetId: { type: String, required: true, index: true },
  },
  { timestamps: true, versionKey: false }
);

BlockSchema.index({ initiatorId: 1, targetId: 1 }, { unique: true });

export const Block = models.Block || model('Block', BlockSchema);

