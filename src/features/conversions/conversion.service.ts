import { Conversion } from './conversion.model';
import { User } from '../users/user.model';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import { config } from '../../config';
import mongoose from 'mongoose';
import { BlockchainService } from './blockchain.service';

export class ConversionService {
    private bc = new BlockchainService();

    async convertNow(userId: string, pointsAmount: number, walletAddress?: string) {
        const user = await User.findById(userId);
        if (!user) throw new NotFoundError('User not found');

        const min = config.app.minConversionPoints;
        const step = config.app.conversionStepPoints;
        const rate = config.app.pointsToTokenRate;

        // Validation
        if (pointsAmount < min) {
            throw new BadRequestError(`Minimum conversion is ${min} points`);
        }
        if (pointsAmount % step !== 0) {
            throw new BadRequestError(`Points must be in multiples of ${step}`);
        }
        if (user.batPoints < pointsAmount) {
            throw new BadRequestError('Insufficient BAT Points');
        }

        const estimatedBatTokens = Number((pointsAmount * rate).toFixed(8));

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Create conversion record as processing
            const conversion = await Conversion.create(
                [
                    {
                        user: userId,
                        pointsAmount,
                        estimatedBatTokens,
                        status: 'processing',
                        rateAtRequest: rate,
                        tokenDecimals: config.chain.tokenDecimals,
                        chainId: config.chain.chainId,
                    },
                ],
                { session }
            );
            const conv = conversion[0];

            console.log(`🔄 Processing conversion: ${pointsAmount} points → ${estimatedBatTokens} BAT tokens`);

            // Perform on-chain transfer
            const txHash = await this.bc.transferTokens(
                walletAddress as string,
                estimatedBatTokens.toString(),
                config.chain.tokenDecimals
            );

            console.log(`✅ Transfer successful: ${txHash}`);

            // Deduct points and finalize
            user.batPoints -= pointsAmount;
            await user.save({ session });

            conv.status = 'completed';
            conv.transactionHash = txHash;
            conv.processedAt = new Date();
            await conv.save({ session });

            await session.commitTransaction();
            return conv;
        } catch (e: any) {
            console.error('❌ Conversion failed:', e);
            await session.abortTransaction();

            // Mark as failed
            const conv = await Conversion.findOne({ user: userId, pointsAmount }).sort({ createdAt: -1 });
            if (conv && conv.status === 'processing') {
                conv.status = 'failed';
                conv.errorMessage = e.message || 'Processing failed';
                await conv.save();
            }

            throw new BadRequestError(e.message || 'Conversion failed');
        } finally {
            session.endSession();
        }
    }

    async getConversionHistory(userId: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const conversions = await Conversion.find({ user: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await Conversion.countDocuments({ user: userId });
        return { conversions, total, page, limit };
    }

    async getConversionById(conversionId: string, userId: string) {
        const conv = await Conversion.findOne({ _id: conversionId, user: userId });
        if (!conv) throw new NotFoundError('Conversion not found');
        return conv;
    }
}
