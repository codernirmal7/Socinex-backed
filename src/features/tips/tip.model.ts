import mongoose, { Document, Schema } from 'mongoose';

export interface ITip {
    sender: mongoose.Types.ObjectId;
    recipient: mongoose.Types.ObjectId;
    amount: number;
    message?: string;
    post?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export interface ITipDocument extends ITip, Document { }

const tipSchema = new Schema<ITipDocument>(
    {
        sender: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        recipient: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 1,
            max: 1000,
        },
        message: {
            type: String,
            maxlength: 200,
            trim: true,
        },
        post: {
            type: Schema.Types.ObjectId,
            ref: 'Post',
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient queries
tipSchema.index({ sender: 1, createdAt: -1 });
tipSchema.index({ recipient: 1, createdAt: -1 });
tipSchema.index({ post: 1 });

export const Tip = mongoose.model<ITipDocument>('Tip', tipSchema);
