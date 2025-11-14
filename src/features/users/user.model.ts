// src/features/users/user.model.ts
import mongoose, { Schema, Document, Types, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { Query } from 'mongoose';

export interface IUser {
    email: string;
    username: string;
    password: string;
    avatar: string;
    banner: string;
    bio: string;
    batPoints: number;
    totalPointsEarned: number;
    totalPointsSent: number;
    followers: Types.ObjectId[];
    following: Types.ObjectId[];
    privacyScore?: number;
    signupBonus: {
        claimed: boolean;
        claimedAt?: Date;
        ipAddress: string;
        deviceFingerprint: string;
    };
    lastActive: Date;
}

export interface IUserDocument extends IUser, Document {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IUserModel extends Model<IUserDocument> {
    findByEmail(email: string): Query<IUserDocument | null, IUserDocument>;
    findByUsername(username: string): Query<IUserDocument | null, IUserDocument>;
}

const userSchema = new Schema<IUserDocument, IUserModel>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
        },
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 3,
            maxlength: 30,
            index: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
            select: false, // Don't return password by default
        },
        avatar: {
            type: String,
            default: 'https://api.dicebear.com/7.x/avataaars/svg?seed=',
        },
        banner: {
            type: String,
            default: '',
        },
        bio: {
            type: String,
            default: '',
            maxlength: 500,
        },
        batPoints: {
            type: Number,
            default: 0,
            min: 0,
        },
        totalPointsEarned: {
            type: Number,
            default: 0,
            min: 0,
        },
        totalPointsSent: {
            type: Number,
            default: 0,
            min: 0,
        },
        followers: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        following: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        privacyScore: {
            type: Number,
            min: 0,
            max: 100,
        },
        signupBonus: {
            claimed: {
                type: Boolean,
                default: false,
            },
            claimedAt: Date,
            ipAddress: {
                type: String,
                required: true,
            },
            deviceFingerprint: {
                type: String,
                required: true,
            },
        },
        lastActive: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform: (_: any, ret: any) => {
                delete ret.__v;
                delete ret.password; // Never expose password in JSON
                if (ret.signupBonus) {
                    delete ret.signupBonus.ipAddress;
                    delete ret.signupBonus.deviceFingerprint;
                }
                return ret;
            },
        },
    }
);

// Indexes for performance
userSchema.index({ totalPointsEarned: -1 });
userSchema.index({ totalPointsSent: -1 });
userSchema.index({ createdAt: -1 });

// Static methods
userSchema.statics.findByEmail = function (email: string) {
    return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByUsername = function (username: string) {
    return this.findOne({ username: username.toLowerCase() });
};

// Instance method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

// Hash password before saving
userSchema.pre('save', async function (next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error: any) {
        next(error);
    }
});

// Pre-save hook to set default avatar
userSchema.pre('save', function (next) {
    if (this.isNew && !this.avatar.includes('seed=')) {
        this.avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.username}`;
    }
    next();
});


export const User = mongoose.model<IUserDocument, IUserModel>('User', userSchema);
