import { recoverPersonalSignature } from '@metamask/eth-sig-util';
import { UnauthorizedError } from './errors';

export const verifyWalletSignature = (
    message: string,
    signature: string,
    expectedAddress: string
): boolean => {
    try {
        const recoveredAddress = recoverPersonalSignature({
            data: message,
            signature: signature,
        });

        return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
    } catch (error) {
        throw new UnauthorizedError('Invalid signature');
    }
};

export const generateAuthMessage = (walletAddress: string): string => {
    const timestamp = Date.now();
    return `Sign this message to authenticate with Socinex.\n\nWallet: ${walletAddress}\nTimestamp: ${timestamp}`;
};
