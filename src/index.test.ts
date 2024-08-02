import { ethers, keccak256 } from 'ethers';
import { ZrSign__factory } from '../src/contract/ZrSign__factory';
import { zrKeyReq, zrSignTx, estimateFee, rlpEncodeTx, zrSignHash, generateRawTxHash, zrSignData } from '../src/index';
import { SignTypes } from '../src/contract/ZrSign';
import * as dotenv from 'dotenv';
import { EVM_WALLET_TYPE_ID, SEPOLIA_CHAIN_ID, TO_ADDRESS, ZR_SIGN_ADDRESS } from './consts';

dotenv.config();

describe('ZrSign Function Tests', () => {
    let provider: ethers.JsonRpcProvider;
    let contract: any;
    let wallet: ethers.HDNodeWallet;

    beforeAll(async () => {
        const rpcUrl = process.env.RPC_URL || '';
        provider = new ethers.JsonRpcProvider(rpcUrl);

        const mnemonic = process.env.MNEMONIC || '';
        wallet = ethers.Wallet.fromPhrase(mnemonic).connect(provider);

        contract = ZrSign__factory.connect(ZR_SIGN_ADDRESS, wallet);
    });

    it('should estimate fee correctly', async () => {
        const options = ethers.parseUnits('1', 'wei');
        const fee: ethers.BigNumberish | undefined = await estimateFee(provider, contract, options);

        if (fee === undefined) {
            throw new Error('Failed to estimate fee');
        }

        expect(typeof fee).toBe('bigint');
        console.log('Estimated Fee:', fee.toString());
    });

    it('should call zrKeyReq correctly', async () => {
        const walletTypeId: ethers.BytesLike = ethers.getBytes(EVM_WALLET_TYPE_ID);

        const params: SignTypes.ZrKeyReqParamsStruct = {
            walletTypeId,
            options: Number(1)
        };

        const txResponse = await zrKeyReq(provider, params);

        expect(typeof txResponse).toBe('object');
        console.log('Transaction Response:', txResponse);
    });

    it('should call zrSignTx correctly', async () => {
        const walletTypeId: ethers.BytesLike = ethers.getBytes(EVM_WALLET_TYPE_ID);

        const rlpEncodedTx = await rlpEncodeTx(
            TO_ADDRESS,
            BigInt(ethers.parseUnits('0.01', 'ether').toString()),
            21000, // gasLimit
            Number(ethers.parseUnits('20', 'gwei')),
            BigInt(0),
            "0x",
        );

        const params: SignTypes.ZrSignParamsStruct = {
            walletTypeId,
            walletIndex: Number(0),
            dstChainId: ethers.getBytes(SEPOLIA_CHAIN_ID),
            payload: rlpEncodedTx,
            broadcast: false
        };

        const txResponse = await zrSignTx(provider, params);

        expect(typeof txResponse).toBe('object');
        console.log('Transaction Response:', txResponse);
    });
    
    it('should call zrSignHash correctly', async () => {
        const walletTypeId: ethers.BytesLike = ethers.getBytes(EVM_WALLET_TYPE_ID);

        const hash = await generateRawTxHash(
            TO_ADDRESS,
            BigInt(ethers.parseUnits('0.01', 'ether').toString()),
            21000, // gasLimit
            Number(ethers.parseUnits('20', 'gwei')),
            BigInt(0),
            "0x",
        );
        if(!hash){
            throw Error("error generating hash")
        }
        console.log(hash)
        const params: SignTypes.ZrSignParamsStruct = {
            walletTypeId,
            walletIndex: Number(0),
            dstChainId: ethers.getBytes(SEPOLIA_CHAIN_ID),
            payload: hash,
            broadcast: false
        };

        const txResponse = await zrSignHash(provider, params);

        expect(typeof txResponse).toBe('object');
        console.log('Transaction Response:', txResponse);
    });

    it('should call zrSignData correctly', async () => {
        const walletTypeId: ethers.BytesLike = ethers.getBytes(EVM_WALLET_TYPE_ID);
        const data: ethers.BytesLike = ethers.toUtf8Bytes("Hello World!");
        const params: SignTypes.ZrSignParamsStruct = {
            walletTypeId,
            walletIndex: Number(0),
            dstChainId: ethers.getBytes(SEPOLIA_CHAIN_ID),
            payload: data,
            broadcast: false
        };

        const txResponse = await zrSignData(provider, params);

        expect(typeof txResponse).toBe('object');
        console.log('Transaction Response:', txResponse);
    });
});