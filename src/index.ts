import { ethers, keccak256 } from 'ethers';
import { ZrSign__factory } from './contract/ZrSign__factory';
import { ZR_SIGN_ADDRESS } from './consts';
import { SignTypes, ZrSign } from './contract/ZrSign';
import RLP from 'rlp';

export async function zrKeyReq(
    provider: ethers.JsonRpcProvider,
    params: SignTypes.ZrKeyReqParamsStruct
): Promise<ethers.ContractTransactionResponse | void> {
    if (!params) {
        throw new Error("Params must be provided and cannot be undefined.");
    }

    const wallet = ethers.Wallet.fromPhrase(process.env.MNEMONIC!, provider);
    const contract = ZrSign__factory.connect(ZR_SIGN_ADDRESS, wallet);
    const fee = await estimateFee(provider, contract, params.options);
    return await contract.zrKeyReq(params, { value: fee });
}

export async function zrSignTx(
    provider: ethers.JsonRpcProvider,
    params: SignTypes.ZrSignParamsStruct
): Promise<ethers.ContractTransactionResponse> {
    if (!params) {
        throw new Error("Params must be provided and cannot be undefined.");
    }
    const wallet = ethers.Wallet.fromPhrase(process.env.MNEMONIC!, provider);
    const owner = wallet.address
    const contract = ZrSign__factory.connect(ZR_SIGN_ADDRESS, wallet);
    const walletReg = await contract.getWalletRegistry(params.walletTypeId, params.walletIndex, owner)
    const fee = await estimateFee(provider, contract, walletReg.options);
    return await contract.zrSignTx(params, { value: fee });
}

export async function zrSignHash(
    provider: ethers.JsonRpcProvider,
    params: SignTypes.ZrSignParamsStruct
): Promise<ethers.ContractTransactionResponse> {
    if (!params) {
        throw new Error("Params must be provided and cannot be undefined.");
    }
    const wallet = ethers.Wallet.fromPhrase(process.env.MNEMONIC!, provider);
    const owner = wallet.address
    const contract = ZrSign__factory.connect(ZR_SIGN_ADDRESS, wallet);
    const walletReg = await contract.getWalletRegistry(params.walletTypeId, params.walletIndex, owner)
    const fee = await estimateFee(provider, contract, walletReg.options);
    return await contract.zrSignHash(params, { value: fee });
}

export async function zrSignData(
    provider: ethers.JsonRpcProvider,
    params: SignTypes.ZrSignParamsStruct
): Promise<ethers.ContractTransactionResponse> {
    if (!params) {
        throw new Error("Params must be provided and cannot be undefined.");
    }
    const wallet = ethers.Wallet.fromPhrase(process.env.MNEMONIC!, provider);
    const owner = wallet.address
    const contract = ZrSign__factory.connect(ZR_SIGN_ADDRESS, wallet);
    const walletReg = await contract.getWalletRegistry(params.walletTypeId, params.walletIndex, owner)
    const fee = await estimateFee(provider, contract, walletReg.options);
    return await contract.zrSignData(params, { value: fee });
}

export async function estimateFee(provider: ethers.JsonRpcProvider, contract: ZrSign, options: ethers.BigNumberish): Promise<ethers.BigNumberish | undefined> {
    try {
        // Fetching the values from the contract
        const [mpcFee, respGas, respGasPriceBuffer] = await Promise.all([
            contract.getMPCFee(),
            contract.getRespGas(),
            contract.getRespGasPriceBuffer()
        ]);

        const block = await provider.getBlock("latest");

        if (!block || !block.baseFeePerGas) {
            throw new Error("Could not retrieve block base fee.");
        }

        // Convert the fetched values to bigints
        const mpcFeeBigInt = BigInt(mpcFee);
        const respGasBigInt = BigInt(respGas);
        const respGasPriceBufferBigInt = BigInt(respGasPriceBuffer);
        const baseFeePerGasBigInt = BigInt(block.baseFeePerGas);

        // Calculate the fees
        const mpc = mpcFeeBigInt * BigInt(options);
        const netResp = respGasBigInt * ((baseFeePerGasBigInt * respGasPriceBufferBigInt) / BigInt(100));
        const total = mpc + netResp;
        const increasedTotal = (total * BigInt(120)) / BigInt(100);
        return increasedTotal;
    } catch (error) {
        console.error("Error estimating fee:", error);
        return undefined;
    }
}

export async function rlpEncodeTx(to: string, value: bigint, gasLimit: number, gasPrice: number, nonce: bigint, data: string) {
    const transaction = [
        ethers.toBeHex(nonce).replace(/^0x0+/, '0x'), // Remove leading zeros
        ethers.toBeHex(gasPrice).replace(/^0x0+/, '0x'), // Remove leading zeros
        ethers.toBeHex(gasLimit).replace(/^0x0+/, '0x'), // Remove leading zeros
        ethers.getAddress(to),
        ethers.toBeHex(value).replace(/^0x0+/, '0x'), // Remove leading zeros
        data,
        '0x', // v
        '0x', // r
        '0x'  // s
    ];
    const rlpPayload = RLP.encode(transaction);
    // const rlpPayload = ethers.encodeRlp(transaction);
    return rlpPayload;
}

export async function generateRawTxHash(
    to: string,
    value: bigint,
    gasLimit: number,
    gasPrice: number,
    nonce: bigint,
    data: string
) {
    const transaction = [
        ethers.toBeArray(nonce), 
        ethers.toBeArray(ethers.getBigInt(gasPrice)), 
        ethers.toBeArray(ethers.getBigInt(gasLimit)), 
        ethers.getAddress(to),
        ethers.toBeArray(value),
        data,
        '0x', // v
        '0x', // r
        '0x'  // s
    ];

    console.log("Transaction Array:", transaction); // Add this line for debugging

    // RLP encode the transaction
    const rlpEncodedTx = RLP.encode(transaction);
    console.log("rlpEncodedTx:", Buffer.from(rlpEncodedTx).toString('hex')); // Add this line for debugging

    // Hash the RLP encoded transaction
    const rawTxHash = ethers.keccak256(rlpEncodedTx);

    return rawTxHash;
}
