import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPost {
    author: Types.ObjectId;
    content: string;
    images?: string[];
    videos?: string[];
    likes: Types.ObjectId[];
    totalTips: number;
    totalTipAmount: number;
}

export interface IPostDocument extends IPost, Document {
    createdAt: Date;
    updatedAt: Date;
}

const postSchema = new Schema<IPostDocument>(
    {
        author: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        content: {
            type: String,
            required: true,
            maxlength: 1000,
        },
        images: [
            {
                type: String,
            },
        ],
        videos: {
            type: [String],
            default: [],
            validate: {
                validator: function (arr: string[]) {
                    return arr.length <= 2; // Max 2 videos per post
                },
                message: 'Maximum 2 videos allowed per post',
            },
        },
        likes: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        totalTips: {
            type: Number,
            default: 0,
        },
        totalTipAmount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

postSchema.index({ createdAt: -1 });
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ totalTipAmount: -1 });

export const Post = mongoose.model<IPostDocument>('Post', postSchema);
