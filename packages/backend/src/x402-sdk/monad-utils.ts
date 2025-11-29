import {
    JsonRpcProvider,
    Provider,
    TransactionReceipt,
    TransactionRequest,
    Signer,
    FeeData,
} from "ethers";
import {
    Network,
    PaymentRequirements,
    TokenType,
    TransactionFailedError,
    TransactionStatus,
} from "./x402-types";

const NETWORK_CONFIG: Record<
    Network | "monad-mainnet",
    { rpcUrl: string; chainId: number; symbol: string }
> = {
    "monad-testnet": {
        rpcUrl: process.env.X402_RPC_URL || "https://testnet-rpc.monad.xyz",
        chainId: 10143,
        symbol: "MON",
    },
    // Allow mainnet configuration if env opts in
    "monad-mainnet": {
        rpcUrl: process.env.X402_RPC_URL || "https://rpc.monad.xyz",
        chainId: 10143, // TODO: update to real mainnet chainId when confirmed
        symbol: "MON",
    },
};

const TOKEN_DECIMALS: Record<TokenType, number> = {
    MON: 18,
};

export function getRpcEndpoint(
    network: Network | "monad-mainnet",
    customEndpoint?: string
): string {
    if (customEndpoint) return customEndpoint;
    const cfg = NETWORK_CONFIG[network] || NETWORK_CONFIG["monad-testnet"];
    if (!NETWORK_CONFIG[network]) {
        console.warn(
            `[monad-utils] Unsupported Monad network "${network}", falling back to "monad-testnet"`
        );
    }
    return cfg.rpcUrl;
}

export function getChainId(network: Network | "monad-mainnet"): number {
    const cfg = NETWORK_CONFIG[network] || NETWORK_CONFIG["monad-testnet"];
    if (!NETWORK_CONFIG[network]) {
        console.warn(
            `[monad-utils] Unsupported Monad network "${network}" for chainId, falling back to "monad-testnet"`
        );
    }
    return cfg.chainId;
}

export function createConnection(
    network: Network,
    customEndpoint?: string
): JsonRpcProvider {
    const endpoint = getRpcEndpoint(network, customEndpoint);
    const chainId = getChainId(network);
    return new JsonRpcProvider(endpoint, {
        name: network,
        chainId,
    });
}

export function amountToBaseUnits(amount: string, token: TokenType): bigint {
    const decimals = TOKEN_DECIMALS[token];
    const [whole, fraction = ""] = amount.split(".");
    const normalizedFraction = fraction.padEnd(decimals, "0").slice(0, decimals);
    return BigInt(`${whole}${normalizedFraction}`);
}

export function baseUnitsToAmount(baseUnits: bigint, token: TokenType): string {
    const decimals = TOKEN_DECIMALS[token];
    const str = baseUnits.toString().padStart(decimals + 1, "0");
    const whole = str.slice(0, -decimals) || "0";
    const fraction = str.slice(-decimals).replace(/0+$/, "");
    return fraction ? `${whole}.${fraction}` : whole;
}

export async function createPaymentTransaction(
    provider: Provider,
    payer: string,
    requirements: PaymentRequirements
): Promise<TransactionRequest> {
    const feeData = (await provider.getFeeData()) as FeeData;

    const tx: TransactionRequest = {
        to: requirements.recipient,
        from: payer,
        value: BigInt(requirements.amount),
        chainId: requirements.chainId,
    };

    if (feeData.maxFeePerGas) {
        tx.maxFeePerGas = feeData.maxFeePerGas;
    }
    if (feeData.maxPriorityFeePerGas) {
        tx.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
    }

    return tx;
}

export async function signAndSendTransaction(
    signer: Signer,
    request: TransactionRequest
): Promise<string> {
    try {
        const populated = await signer.populateTransaction(request);
        const response = await signer.sendTransaction(populated);
        return response.hash;
    } catch (error) {
        throw new TransactionFailedError(
            `Failed to send transaction: ${error instanceof Error ? error.message : "Unknown error"}`,
            error
        );
    }
}

export async function confirmTransaction(
    provider: Provider,
    hash: string,
    confirmations = 1
): Promise<boolean> {
    try {
        const receipt = await provider.waitForTransaction(hash, confirmations, 60_000);
        return Boolean(receipt?.status);
    } catch (error) {
        throw new TransactionFailedError(
            `Failed to confirm transaction: ${error instanceof Error ? error.message : "Unknown error"}`,
            error
        );
    }
}

export async function getTransactionStatus(
    provider: Provider,
    hash: string
): Promise<TransactionStatus> {
    try {
        const receipt = await provider.getTransactionReceipt(hash);
        if (!receipt) {
            const tx = await provider.getTransaction(hash);
            return tx ? "pending" : "failed";
        }

        if (receipt.status === 1) {
            const confirmations = Number(receipt.confirmations || 0);
            return confirmations > 5 ? "finalized" : "confirmed";
        }

        if (receipt.status === 0) {
            return "failed";
        }

        return "pending";
    } catch {
        return "failed";
    }
}

export async function verifyPaymentTransaction(
    provider: Provider,
    hash: string,
    requirements: PaymentRequirements
): Promise<boolean> {
    try {
        const tx = await provider.getTransaction(hash);

        if (!tx) {
            console.error("Transaction not found:", hash);
            return false;
        }

        if (!tx.to || tx.to.toLowerCase() !== requirements.recipient.toLowerCase()) {
            console.error("Recipient mismatch");
            return false;
        }

        const expectedAmount = BigInt(requirements.amount);
        if (BigInt(tx.value ?? 0n) < expectedAmount) {
            console.error("Insufficient value transferred");
            return false;
        }

        if (Number(tx.chainId) !== requirements.chainId) {
            console.error("Chain ID mismatch");
            return false;
        }

        const receipt: TransactionReceipt | null = await provider.getTransactionReceipt(hash);
        if (!receipt) {
            console.warn("Receipt not available yet");
            return false;
        }

        if (receipt.status !== 1) {
            console.error("Transaction failed on-chain");
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error verifying payment:", error);
        return false;
    }
}




