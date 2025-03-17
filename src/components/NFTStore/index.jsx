import { useState, useEffect } from "react";
import { Contract, parseEther } from "ethers"; 
import { useAppContext } from "../../contexts/appContext";
import NFT_ABI from "../../ABI/nft.json";
import { useAccount, useChainId, useConfig } from "wagmi";
import { getEthersProvider, getEthersSigner } from "../../config/wallet-connection/adapter";
import { isSupportedNetwork } from "../../utils";

// NFTCard component that's contained within this file
const NFTCard = ({ nft, listNFTForSale, cancelListing }) => {
    const [showModal, setShowModal] = useState(false);
    const [price, setPrice] = useState("");

    return (
        <div key={nft.tokenId} className="border rounded-lg p-4 shadow-md">
            {nft.metadata.image && (
                <img 
                    src={nft.metadata.image} 
                    alt={nft.metadata.name || "NFT"} 
                    className="w-full h-48 object-cover rounded-md mb-3"
                />
            )}
            <h3 className="text-lg font-bold mb-2">{nft.metadata.name || `NFT #${nft.tokenId}`}</h3>
            {nft.metadata.description && (
                <p className="text-sm text-gray-600 mb-3">{nft.metadata.description}</p>
            )}
             {nft.listed ? (
                <button
                    onClick={() => cancelListing(nft.tokenId)}
                    className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition"
                >
                    Cancel Listing
                </button>
            ) : (
                <button 
                    onClick={() => setShowModal(true)}
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
                >
                    List for Sale
                </button>
            )}
            
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-80 max-w-md">
                        <h3 className="text-xl font-bold mb-4">List NFT For Sale</h3>
                        <input 
                            type="text" 
                            placeholder="Enter price in ETH" 
                            value={price} 
                            onChange={(e) => setPrice(e.target.value)}
                            className="w-full border p-2 mb-4 rounded" 
                        />
                        <div className="flex justify-end space-x-2">
                            <button 
                                onClick={() => setShowModal(false)}
                                className="py-2 px-4 border rounded hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => { 
                                    if (price) {
                                        listNFTForSale(nft.tokenId, price); 
                                        setShowModal(false);
                                    } else {
                                        alert("Please enter a price");
                                    }
                                }}
                                className="py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                Sell
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const NFTStore = ({ mintToken }) => {
  const { mintPrice, nextTokenId } = useAppContext();
  const [userNFTs, setUserNFTs] = useState([]);
  const [loadingNFTs, setLoadingNFTs] = useState(true);
  const { address } = useAccount();
  const chainId = useChainId();
  const wagmiConfig = useConfig();


  useEffect(() => {
    // Checks
    if (!address) {
      setLoadingNFTs(false);
      return;
    }

    if (!isSupportedNetwork(chainId)) {
      console.log("Unsupported network:", chainId);
      alert("Unsupported network");
      setLoadingNFTs(false);
      return;
    }

    fetchUserNFTs();
  }, [address, chainId]);

  const fetchUserNFTs = async () => {
    if (!address || !chainId) return;
    
    setLoadingNFTs(true);
    
    try {
      // Get the provider using wagmi client
      const provider = await getEthersProvider(wagmiConfig, { chainId });
      if (!provider) {
        console.log("Failed to get provider");
        alert("Failed to get provider");
        setLoadingNFTs(false);
        return;
      }

      // Initialize the contract with the provider
      const contract = new Contract(
        import.meta.env.VITE_NFT_CONTRACT_ADDRESS,
        NFT_ABI,
        provider
      );

      // Get the balance of NFTs the user owns
      const balance = await contract.balanceOf(address);
      const balanceNumber = parseInt(balance.toString(), 10);
      console.log("NFT Balance as number:", balanceNumber);

      if (balanceNumber === 0) {
        console.log("User does not own any NFTs.");
        setUserNFTs([]);
        setLoadingNFTs(false);
        return;
      }

      const totalSupply = await contract.totalSupply();
      console.log("Total NFT supply:", totalSupply.toString());

      const userTokens = [];

      // Fetch the tokenId and metadata for each NFT owned by the user
      for (let tokenId = 0; tokenId < totalSupply; tokenId++) {
        try {
          const owner = await contract.ownerOf(tokenId);
          if (owner.toLowerCase() === address.toLowerCase()) {
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

              const listing = await contract.listings(tokenId); // Fetch the listing data
              const isListed = listing.isListed; // Check if it's listed


              // Ensure we have a valid metadata object
              userTokens.push({ 
                tokenId, 
                metadata: metadata || {},
                listed: isListed 
              });
            } catch (error) {
              console.log(`Error fetching metadata for token ${tokenId}:`, error);
              // Add with empty metadata if fetch fails
              userTokens.push({ 
                tokenId, 
                metadata: {} 
              });
            }
          }
        } catch (error) {
          console.log(`Error checking owner for token ${tokenId}:`, error);
        }
      }
      
      // Set the user's NFTs in the state
      console.log("User NFTs:", userTokens);
      setUserNFTs(userTokens);
      
      // Only show alert if NFTs were found
      if (userTokens.length > 0) {
        alert("NFTs fetched successfully!");
      }
    } catch (error) {
      console.error("Error fetching NFTs:", error);
    } finally {
      setLoadingNFTs(false);
    }
  };

  const listNFTForSale = async (tokenId, price) => {
    if (!price) return alert("Please enter a price");
    if (!address || !chainId) return alert("Wallet not connected");
    
    try {
      const provider = await getEthersProvider(wagmiConfig, { chainId });
      if (!provider) {
        return alert("Failed to get provider");
      }
      
      const signer = await getEthersSigner(wagmiConfig, { chainId });
      if (!signer) {
        return alert("Failed to get signer");
      }
      
      // Initialize the contract with the signer
      const contract = new Contract(
        import.meta.env.VITE_NFT_CONTRACT_ADDRESS,
        NFT_ABI,
        signer
      );   
      
      
      const approvalTx = await contract.approve( import.meta.env.VITE_NFT_CONTRACT_ADDRESS, tokenId);
      await approvalTx.wait();  // Wait for approval transaction to complete
      alert("Contract is now approved to transfer your NFT");
       
      const formattedPrice = parseEther(price);
      const tx = await contract.listNFTForSale( 
        tokenId, 
        formattedPrice
      );
      await tx.wait();
      alert("NFT listed for sale successfully!");
    } catch (error) {
      console.error("Error listing NFT for sale:", error);
      alert(`Error listing NFT: ${error.message}`);
    }
  };

  const cancelListing = async (tokenId) => {
    if (!address || !chainId) return alert("Wallet not connected");

    try {
        const provider = await getEthersProvider(wagmiConfig, { chainId });
        if (!provider) return alert("Failed to get provider");

        const signer = await getEthersSigner(wagmiConfig, { chainId });
        if (!signer) return alert("Failed to get signer");

        const contract = new Contract(
            import.meta.env.VITE_NFT_CONTRACT_ADDRESS,
            NFT_ABI,
            signer
        );

        const tx = await contract.cancelListing(tokenId);
        await tx.wait();

        alert("NFT listing cancelled successfully!");
        fetchUserNFTs(); // Refresh the user's NFTs after canceling the listing

    } catch (error) {
        console.error("Error canceling NFT listing:", error);
        alert(`Error canceling NFT: ${error.message}`);
    }
};


  return (
    <div className="p-4">
      {loadingNFTs ? (
        <p className="text-center text-lg">Loading your NFTs...</p>
      ) : !address ? (
        <p className="text-center text-lg">Please connect your wallet to view your NFTs</p>
      ) : userNFTs.length === 0 ? (
        <p className="text-center text-lg">No NFTs owned yet. Start minting!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {userNFTs.map((nft) => (
            nft ? (
              <NFTCard
                key={nft.tokenId}
                nft={nft} // Pass the entire NFT object
                listNFTForSale={listNFTForSale}
                cancelListing={cancelListing}
              />
            ) : null
          ))}
        </div>
      )}
    </div>
  );
};

export default NFTStore;