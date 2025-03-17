import { useState, useEffect } from "react";
import { Contract } from "ethers"; // Ethers v6 Contract import
import { useAppContext } from "../../contexts/appContext";
import NFTCard from "../NFTCard";
import NFT_ABI from "../../ABI/nft.json";
import { useAccount, useChainId, useConfig } from "wagmi";
import { getEthersProvider } from "../../config/wallet-connection/adapter"; // Import the provider function
import { isSupportedNetwork } from "../../utils";

const NFTStore = ({ mintToken }) => {
    const { mintPrice, nextTokenId, baseTokenURI } = useAppContext();
    const [userNFTs, setUserNFTs] = useState([]);
    const [loadingNFTs, setLoadingNFTs] = useState(true);
    const { address } = useAccount();
    const chainId = useChainId();
    const wagmiConfig = useConfig();

    useEffect(() => {
        async function fetchUserNFTs() {
            console.log("Starting to fetch user NFTs...");

            if (!address) {
                console.log("No wallet address found.");
                return alert("Please connect your wallet");
            }
            console.log("Wallet address:", address);

            if (!isSupportedNetwork(chainId)) {
                console.log("Unsupported network:", chainId);
                return alert("Unsupported network");
            }
            
            // Get the provider using wagmi client
            const provider = await getEthersProvider(wagmiConfig, { chainId });
            if (!provider) {
                console.log("Failed to get provider");
                return alert("Failed to get provider");
            }
            console.log("Provider successfully fetched:", provider);

            // Initialize the contract with the provider
            const contract = new Contract(
                import.meta.env.VITE_NFT_CONTRACT_ADDRESS, // Contract address from environment variable
                NFT_ABI, // ABI of the NFT contract
                provider // Using provider for read-only calls
            );

            try {
                // Get the balance of NFTs the user owns
                const balance = await contract.balanceOf(address);
                
                console.log("NFT Balance:", balance.toString());

                const balanceNumber = parseInt(balance.toString(), 10);
                console.log("NFT Balance as number:", balanceNumber);

                if (balance === 0) {
                    console.log("User does not own any NFTs.");  // Debug log
                    return;
                }

                const totalSupply = await contract.totalSupply();
                console.log("Total NFT supply:", totalSupply.toString());

                const userTokens = [];

                console.log("Fetching token metadata...", userTokens);

                // Fetch the tokenId and metadata for each NFT owned by the user
                for (let tokenId = 0; tokenId < totalSupply; tokenId++) {
                    const owner = await contract.ownerOf(tokenId);
                    console.log(`Token ID ${tokenId} owner:`, owner);
                    if (owner.toLowerCase() === address.toLowerCase()) {
                       
                        console.log(`Fetching metadata for token ID: ${tokenId.toString()}`);
                        
                        //let tokenURI = `${baseTokenURI}${tokenId}.json`;
                         let tokenURI = await contract.tokenURI(tokenId);
                         console.log(`Token URI for Token ID ${tokenId}:`, tokenURI);

                        try {
                            // Fetch metadata from the tokenURI
                            const metadataResponse = await fetch(tokenURI);
                            if (!metadataResponse.ok) {
                                console.log(`Failed to fetch metadata for token ${tokenId}`);
                                continue;
                            }
                            const metadata = await metadataResponse.json();
                            console.log(`Metadata fetched for token ${tokenId}:`, metadata);

                            userTokens.push({ tokenId, metadata });
                        } catch (error) {
                            console.log(`Error fetching metadata for token ${tokenId}:`, error);
                        }
                    }
                }
                // Set the user's NFTs in the state
                setUserNFTs(userTokens);
                console.log("User NFTs:", userTokens);
                alert("NFTs fetched successfully!");
            } catch (error) {
                console.error("Error fetching NFTs:", error);
            } finally {
                setLoadingNFTs(false);
            }
        }

        fetchUserNFTs();
    }, [address, baseTokenURI, chainId, wagmiConfig]);

    return (
        <div>
            {loadingNFTs ? (
                <p>Loading your NFTs...</p>
            ) : userNFTs.length === 0 ? (
                <p>No NFTs owned yet. Start minting!</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {userNFTs.map((nft) => (
                        <NFTCard
                            key={nft.tokenId}
                            metadata={nft.metadata}
                            mintPrice={mintPrice}
                            tokenId={nft.tokenId}
                            nextTokenId={nextTokenId}
                            mintNFT={mintToken}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default NFTStore;
