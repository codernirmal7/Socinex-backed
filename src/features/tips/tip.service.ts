import { Tip, ITipDocument } from './tip.model';
import { User } from '../users/user.model';
import { Post } from '../posts/post.model';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../utils/errors';
import mongoose from 'mongoose';

export class TipService {
    async sendTip(
        senderId: string,
        recipientId: string,
        amount: number,
        message?: string,
        postId?: string
    ): Promise<ITipDocument> {
        // Validate sender
        const sender = await User.findById(senderId);
        if (!sender) {
            throw new NotFoundError('Sender not found');
        }

        // Validate recipient
        const recipient = await User.findById(recipientId);
        if (!recipient) {
            throw new NotFoundError('Recipient not found');
        }

        // Check if trying to tip self
        if (senderId === recipientId) {
            throw new BadRequestError('You cannot tip yourself');
        }

        // Check if sender has enough balance
        if (sender.batPoints < amount) {
            throw new BadRequestError(`Insufficient balance. You have ${sender.batPoints} BAT Points`);
        }

        // Validate amount
        if (amount < 1 || amount > 1000) {
            throw new BadRequestError('Tip amount must be between 1 and 1000 BAT Points');
        }

        // If postId provided, validate it exists
        if (postId) {
            const post = await Post.findById(postId);
            if (!post) {
                throw new NotFoundError('Post not found');
            }
        }

        // Start a session for transaction
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Deduct from sender
            sender.batPoints -= amount;
            await sender.save({ session });

            // Add to recipient
            recipient.batPoints += amount;
            await recipient.save({ session });

            // Create tip record
            const tip = await Tip.create(
                [
                    {
                        sender: senderId,
                        recipient: recipientId,
                        amount,
                        message,
                        post: postId ? new mongoose.Types.ObjectId(postId) : undefined,
                    },
                ],
                { session }
            );

            // If tip is for a post, update post's tip stats
            if (postId) {
                await Post.findByIdAndUpdate(
                    postId,
                    {
                        $inc: {
                            totalTips: 1,
                            totalTipAmount: amount,
                        },
                    },
                    { session }
                );
            }

            await session.commitTransaction();

            // Populate sender and recipient
            await tip[0].populate('sender recipient', 'username avatar');

            return tip[0];
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async getMySentTips(userId: string, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const tips = await Tip.find({ sender: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('recipient', 'username avatar')
            .populate('post', 'content')
            .lean();

        const total = await Tip.countDocuments({ sender: userId });

        return { tips, total, page, limit, pages: Math.ceil(total / limit) };
    }

    async getMyReceivedTips(userId: string, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const tips = await Tip.find({ recipient: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('sender', 'username avatar')
            .populate('post', 'content')
            .lean();

        const total = await Tip.countDocuments({ recipient: userId });

        return { tips, total, page, limit, pages: Math.ceil(total / limit) };
    }

    async getTipById(tipId: string): Promise<ITipDocument> {
        const tip = await Tip.findById(tipId)
            .populate('sender recipient', 'username avatar')
            .populate('post', 'content');

        if (!tip) {
            throw new NotFoundError('Tip not found');
        }

        return tip;
    }
}
