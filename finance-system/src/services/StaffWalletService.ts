export class StaffWalletService {
    // In-memory store for demo purposes, would be DB in production
    private staffBalances: Map<string, number> = new Map();
    private staffWalletAddresses: Map<string, string> = new Map();

    async getBalance(staffId: string): Promise<number> {
        return this.staffBalances.get(staffId) || 0;
    }

    async creditAccount(staffId: string, amount: number, reason: string) {
        const current = await this.getBalance(staffId);
        this.staffBalances.set(staffId, current + amount);
        console.log(`Credited ${amount} to staff ${staffId}. Reason: ${reason}`);
        // Log to AccountingLedger here
    }

    async registerWallet(staffId: string, walletAddress: string) {
        // Validate address format
        if (!walletAddress.startsWith("0x")) {
            throw new Error("Invalid wallet address format");
        }
        this.staffWalletAddresses.set(staffId, walletAddress);
        console.log(`Registered wallet ${walletAddress} for staff ${staffId}`);
    }

    async requestWithdrawal(staffId: string, amount: number) {
        const balance = await this.getBalance(staffId);
        if (balance < amount) {
            throw new Error("Insufficient balance");
        }

        const wallet = this.staffWalletAddresses.get(staffId);
        if (!wallet) {
            throw new Error("No wallet address registered for this staff member");
        }

        // Deduct balance internally
        this.staffBalances.set(staffId, balance - amount);

        // Initiate transfer via PaymentEngine
        console.log(`Processing withdrawal of ${amount} to ${wallet} for staff ${staffId}`);
        // await paymentEngine.processCryptoPayment(wallet, amount, ...)
        
        return { success: true, txHash: "pending_tx_hash" };
    }
}
