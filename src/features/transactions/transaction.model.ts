import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction {
    user: mongoose.Types.ObjectId;
    type: 'tip_sent' | 'tip_received' | 'signup_bonus' | 'admin_adjustment' | 'conversion';
    amount: number;
    description: string;
    relatedPost?: mongoose.Types.ObjectId;
    relatedUser?: mongoose.Types.ObjectId;
    createdAt: Date;
}

export interface ITransactionDocument extends ITransaction, Document { }

const transactionSchema = new Schema<ITransactionDocument>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ['tip_sent', 'tip_received', 'signup_bonus', 'admin_adjustment', 'conversion'],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        relatedPost: {
            type: Schema.Types.ObjectId,
            ref: 'Post',
        },
        relatedUser: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient queries
transactionSchema.index({ user: 1, createdAt: -1 });

export const Transaction = mongoose.model<ITransactionDocument>('Transaction', transactionSchema);
