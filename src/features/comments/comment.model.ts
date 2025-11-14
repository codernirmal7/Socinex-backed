import mongoose, { Document, Schema } from 'mongoose';

export interface IComment {
    post: mongoose.Types.ObjectId;
    author: mongoose.Types.ObjectId;
    content: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICommentDocument extends IComment, Document { }

const commentSchema = new Schema<ICommentDocument>(
    {
        post: {
            type: Schema.Types.ObjectId,
            ref: 'Post',
            required: true,
            index: true,
        },
        author: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        content: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500,
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient queries
commentSchema.index({ post: 1, createdAt: -1 });

export const Comment = mongoose.model<ICommentDocument>('Comment', commentSchema);
