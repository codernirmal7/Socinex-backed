import mongoose, { Schema, Document, Types } from 'mongoose';

export interface INotification {
    user: Types.ObjectId;
    type: 'tip_received' | 'follow' | 'rank_change' | 'conversion_completed';
    data: any;
    read: boolean;
}

export interface INotificationDocument extends INotification, Document {
    createdAt: Date;
    updatedAt: Date;
}

const notificationSchema = new Schema<INotificationDocument>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ['tip_received', 'follow', 'rank_change', 'conversion_completed'],
            required: true,
        },
        data: {
            type: Schema.Types.Mixed,
            required: true,
        },
        read: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.model<INotificationDocument>(
    'Notification',
    notificationSchema
);
