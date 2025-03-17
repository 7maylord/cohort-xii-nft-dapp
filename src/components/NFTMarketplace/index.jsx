import React, { useState, useEffect } from "react";
import { Contract, ethers } from "ethers";
import NFT_ABI from "../../ABI/nft.json";
import { useChainId, useConfig } from "wagmi";
import {
  getEthersProvider,
  getEthersSigner,
} from "../../config/wallet-connection/adapter";

const Marketplace = () => {
  const [marketplaceListings, setMarketplaceListings] = useState([]);
  const [nftMetadata, setNftMetadata] = useState({});
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
    } catch (error) {
      console.error("Error fetching marketplace listings:", error);
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
      console.error(`Error fetching metadata for token ${tokenId}:`, error);
      return null;
    }
  };

  const handleBuyNFT = async (tokenId, price) => {
    if (!price) return alert("Invalid price");
    try {
      const provider = await getEthersProvider(wagmiConfig, { chainId });
      if (!provider) {
        return alert("Failed to get provider");
      }

      const signer = await getEthersSigner(wagmiConfig, { chainId });
      if (!signer) {
        return alert("Failed to get signer");
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

      alert("NFT purchased successfully!");
      fetchMarketplaceListings(); // Refresh the listings after purchase
    } catch (error) {
      console.error("Error buying NFT:", error);
      alert("Error buying NFT: " + error.message);
    }
  };

  return (
    <div>
      <h2>Marketplace Listings</h2>
      <div>
        {marketplaceListings.length > 0 ? (
          marketplaceListings.map((listing) => (
            <div
              key={listing.tokenId}
              className="border p-4 mb-4 rounded-lg"
            >
              {/* NFT Image */}
              {listing.metadata && listing.metadata.image && (
                <img
                  src={listing.metadata.image}
                  alt={listing.metadata.name}
                  className="w-full h-48 object-cover rounded-md mb-3"
                />
              )}

              {/* NFT Name */}
              <h3 className="text-lg font-bold">{listing.metadata?.name || "NFT #" + listing.tokenId}</h3>

              {/* NFT Description */}
              {listing.metadata?.description && (
                <p className="text-sm text-gray-600 mb-3">{listing.metadata.description}</p>
              )}

              {/* NFT Attributes */}
              {listing.metadata?.attributes && (
                <div className="mb-3">
                  <h4 className="text-sm font-semibold">Attributes:</h4>
                  <ul>
                    {listing.metadata.attributes.map((attr, index) => (
                      <li key={index} className="text-sm text-gray-500">
                        {attr.trait_type}: {attr.value}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Price and Seller */}
              <p>Price: {listing.price} ETH</p>
              <p>Seller: {listing.seller}</p>

              {/* Buy Button */}
              <button
                onClick={() => handleBuyNFT(listing.tokenId, listing.price)}
                className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
              >
                Buy NFT
              </button>
            </div>
          ))
        ) : (
          <p>No NFTs listed in the marketplace</p>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
