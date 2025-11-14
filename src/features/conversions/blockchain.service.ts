// src/features/conversions/blockchain.service.ts
import { ethers } from 'ethers';
import { config } from '../../config';

const SEPOLIA_NETWORK = { chainId: 11155111, name: 'sepolia' };

// Minimal ABI with transfer, balanceOf, decimals, and optional mint
const ERC20_ABI = [
    'function transfer(address to, uint256 amount) returns (bool)',
    'function balanceOf(address account) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function mint(address to, uint256 amount) returns (bool)', // if your token supports mint
];

export class BlockchainService {
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private token: ethers.Contract;

    constructor() {
        const rpcUrl = config.chain.rpcUrl; // e.g., https://rpc.ankr.com/eth_sepolia
        this.provider = new ethers.JsonRpcProvider(rpcUrl, SEPOLIA_NETWORK);
        this.wallet = new ethers.Wallet(config.chain.treasuryPrivateKey, this.provider);
        this.token = new ethers.Contract(config.chain.batTokenAddress, ERC20_ABI, this.wallet);
    }

    // Get token decimals from chain (fallback to config if call fails)
    private async getTokenDecimals(): Promise<number> {
        try {
            const d: number = await this.token.decimals();
            return Number(d);
        } catch {
            return config.chain.tokenDecimals;
        }
    }

    // Check if contract has a mint function (signature present)
    private hasMint(): boolean {
        return typeof (this.token as any).mint === 'function';
    }

    // Check treasury token balance
    private async getTreasuryTokenBalance(): Promise<bigint> {
        const bal: bigint = await this.token.balanceOf(this.wallet.address);
        return bal;
    }

    async transferTokens(to: string, wholeTokens: string, overrideDecimals?: number): Promise<string> {
        const decimals = overrideDecimals ?? (await this.getTokenDecimals());
        const amount = ethers.parseUnits(wholeTokens, decimals);
        const tx = await this.token.transfer(to, amount);
        const rc = await tx.wait();
        if (!rc?.status) throw new Error('Token transfer failed');
        return tx.hash;
    }

    // New: try transfer, else mint if supported
    async transferOrMint(to: string, wholeTokens: string, overrideDecimals?: number): Promise<string> {
        const decimals = overrideDecimals ?? (await this.getTokenDecimals());
        const amount = ethers.parseUnits(wholeTokens, decimals);

        // 1) Attempt transfer if treasury has enough tokens
        const treBal = await this.getTreasuryTokenBalance();
        if (treBal >= amount) {
            const tx = await this.token.transfer(to, amount);
            const rc = await tx.wait();
            if (!rc?.status) throw new Error('Token transfer failed');
            return tx.hash;
        }

        // 2) If not enough balance and mint is available, mint to recipient
        if (this.hasMint()) {
            const tx = await (this.token as any).mint(to, amount);
            const rc = await tx.wait();
            if (!rc?.status) throw new Error('Token mint failed');
            return tx.hash;
        }

        // 3) Otherwise fail with a clear message
        const have = ethers.formatUnits(treBal, decimals);
        throw new Error(
            `Treasury token balance too low (${have} < ${wholeTokens}); ` +
            `pre-mint tokens to ${this.wallet.address} or grant MINTER_ROLE to enable mint()`
        );
    }

    async getWalletBalance(): Promise<string> {
        const balance = await this.provider.getBalance(this.wallet.address);
        return ethers.formatEther(balance);
    }

    async getTokenBalance(address: string): Promise<string> {
        const d = await this.getTokenDecimals();
        const bal: bigint = await this.token.balanceOf(address);
        return ethers.formatUnits(bal, d);
    }
}
