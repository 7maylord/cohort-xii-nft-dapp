import React, { useState, useEffect } from "react";
import { Contract, ethers } from "ethers";
import NFT_ABI from "../../ABI/nft.json";
import { useChainId, useConfig } from "wagmi";
import { getEthersProvider, getEthersSigner } from "../../config/wallet-connection/adapter";
import { toast } from "react-toastify";
import { shortenAddress, truncateString } from "../../utils";
import { Icon } from "@iconify/react/dist/iconify.js";

const Marketplace = () => {
  const [marketplaceListings, setMarketplaceListings] = useState([]);
  const chainId = useChainId();
  const wagmiConfig = useConfig();

  useEffect(() => {
    fetchMarketplaceListings();
  }, [chainId]);

  const fetchMarketplaceListings = async () => {
    try {
      const provider = await getEthersProvider(wagmiConfig, { chainId });

      // Initialize the contract with the provider
      const contract = new Contract(
        import.meta.env.VITE_NFT_CONTRACT_ADDRESS,
        NFT_ABI,
        provider
      );

      // Fetch the total supply of NFTs
      const totalSupply = await contract.totalSupply();

      const listings = [];
      // Loop through each token and check if it's listed
      for (let tokenId = 0; tokenId < totalSupply; tokenId++) {
        const listing = await contract.listings(tokenId);
        if (listing.isListed) {
          const metadata = await fetchNFTMetadata(tokenId, contract);
          listings.push({
            tokenId: tokenId.toString(),
            price: ethers.formatEther(listing.price),
            seller: listing.seller,
            metadata: metadata,
          });
        }
      }

      setMarketplaceListings(listings);
      toast.success("Marketplace listings fetched successfully");
    } catch (error) {
      toast.error("Error fetching marketplace listings:", error);
    }
  };

  // Function to fetch metadata for each NFT
  const fetchNFTMetadata = async (tokenId, contract) => {
    try {
      const tokenURI = await contract.tokenURI(tokenId);
      const response = await fetch(tokenURI);
      const metadata = await response.json();
      return metadata;
    } catch (error) {
      toast.error(`Error fetching metadata for token ${tokenId}:::`, error);
      return null;
    }
  };

  const handleBuyNFT = async (tokenId, price) => {
    if (!price) return toast.warn("Invalid price");
    try {
      const provider = await getEthersProvider(wagmiConfig, { chainId });
      if (!provider) {
        return toast.warn("Failed to get provider");
      }

      const signer = await getEthersSigner(wagmiConfig, { chainId });
      if (!signer) {
        return toast.warn("Failed to get signer");
      }

      const contract = new Contract(
        import.meta.env.VITE_NFT_CONTRACT_ADDRESS,
        NFT_ABI,
        signer
      );

      const formattedPrice = ethers.parseEther(price);

      // Call the buyNFT function from your contract
      const tx = await contract.buyNFT(tokenId, { value: formattedPrice });
      await tx.wait();

      toast.success("NFT purchased successfully!");
      fetchMarketplaceListings(); // Refresh the listings after purchase
    } catch (error) {
      toast.error("Error buying NFT: " + error.message);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {marketplaceListings.length > 0 ? (
          marketplaceListings.map((listing) => (
            <div key={listing.tokenId} className="border p-4 rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300">
              {/* NFT Image */}
              {listing.metadata && listing.metadata.image && (
                <img
                  src={listing.metadata.image}
                  alt={listing.metadata.name}
                  className="rounded-xl w-full h-64"
                />
              )}

              {/* NFT Name */}
              <h3 className="text-xl font-semibold text-center">{listing.metadata?.name || `NFT #${listing.tokenId}`}</h3>

              {/* NFT Description */}
              {listing.metadata?.description && (
                <p className="text-sm text-gray-600 mt-2">{truncateString(listing.metadata.description, 100)}</p>
              )}

              {/* NFT Attributes */}
              {listing.metadata?.attributes && (
                <div className="mt-3 flex gap-2">
                <Icon icon="ri:file-list-3-line" className="w-6 h-6" />
                <span>{listing.metadata.attributes.length} Attributes</span>
                </div>
              )}

              {/* Price */}
              <div className="mt-3 flex gap-2 text-center">
              <Icon icon="ri:eth-line" className="w-6 h-6" />
              <span className="font-bold">{listing.price} ETH</span>                
              </div>

              {/* seller */}
              <div className="mt-3 flex gap-2">
              <Icon icon="material-symbols:person-rounded" className="w-6 h-6" />
              <p className="text-sm text-gray-500"> {shortenAddress(listing.seller)}</p>
              </div>

              {/* Buy Button */}
              <div className="mt-4 text-center">
                <button
                  onClick={() => handleBuyNFT(listing.tokenId, listing.price)}
                  className="bg-blue-500 w-full p-4 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors duration-300"
                >
                  Buy NFT
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="col-span-4 text-center">No NFTs listed in the marketplace</p>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
