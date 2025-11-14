import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IConversion {
    user: Types.ObjectId;
    pointsAmount: number;
    estimatedBatTokens: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    transactionHash?: string;
    errorMessage?: string;
    processedAt?: Date;
    rateAtRequest: number;
    tokenDecimals: number;
    chainId: number;
}

export interface IConversionDocument extends IConversion, Document {
    createdAt: Date;
    updatedAt: Date;
}

const conversionSchema = new Schema<IConversionDocument>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        pointsAmount: {
            type: Number,
            required: true,
            min: 1,
        },
        estimatedBatTokens: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'failed'],
            default: 'pending',
        },
        transactionHash: {
            type: String,
        },
        errorMessage: {
            type: String,
        },
        processedAt: {
            type: Date,
        },
        rateAtRequest: { type: Number, required: true },
        tokenDecimals: { type: Number, required: true, default: 18 },
        chainId: { type: Number, required: true },
    },
    {
        timestamps: true,
    }
);

conversionSchema.index({ user: 1, createdAt: -1 });
conversionSchema.index({ status: 1 });

export const Conversion = mongoose.model<IConversionDocument>('Conversion', conversionSchema);
