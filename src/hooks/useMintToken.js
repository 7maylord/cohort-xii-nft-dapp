import { useCallback } from "react";
import { useAccount, useChainId, useConfig } from "wagmi";
import { useAppContext } from "../contexts/appContext";
import { Contract } from "ethers";
import NFT_ABI from "../ABI/nft.json";
import { getEthersSigner } from "../config/wallet-connection/adapter";
import { isSupportedNetwork } from "../utils";
import { toast } from "react-toastify";
// import { config } from "../config/wallet-connection/wagmi";

const useMintToken = () => {
    const { address } = useAccount();
    const chainId = useChainId();
    const wagmiConfig = useConfig();
    const { nextTokenId, maxSupply, mintPrice } = useAppContext();
    return useCallback(async () => {
        if (!address) return toast.warn("Please connect your wallet");
        if (!isSupportedNetwork(chainId)) return toast.warn("Unsupported network");
        if (nextTokenId >= maxSupply) return toast.warn("No more tokens to mint");

        const signer = await getEthersSigner(wagmiConfig);

        const contract = new Contract(
            import.meta.env.VITE_NFT_CONTRACT_ADDRESS,
            NFT_ABI,
            signer
        );

        try {
            const tx = await contract.mint({ value: mintPrice });
            const receipt = await tx.wait();
            if (receipt.status === 0) {
                throw new Error("Transaction failed");
            }

            console.log("Token minted successfully");
        } catch (error) {
            console.error("error: ", error);
        }
    }, [address, chainId, maxSupply, mintPrice, nextTokenId, wagmiConfig]);
};

export default useMintToken;
