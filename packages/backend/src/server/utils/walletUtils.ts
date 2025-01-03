import { ethers } from 'ethers';

/**
 * Verifies a wallet signature.
 *
 * @param walletAddress The Ethereum wallet address of the user.
 * @param signedMessage The signed message provided by the user.
 * @param expectedMessage The original message that was signed.
 * @returns A boolean indicating whether the signature is valid.
 */
export async function verifyWalletSignature(walletAddress: string, signedMessage: string, expectedMessage: string): Promise<boolean> {
    try {
        const recoveredAddress = ethers.utils.verifyMessage(expectedMessage, signedMessage);
        return recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
    } catch (error) {
        console.error('Signature verification failed:', error);
        return false;
    }
}
