import Header from "./components/Header";
import Footer from "./components/Footer";
import { useAppContext } from "./contexts/appContext";
import NFTCard from "./components/NFTCard";
import useMintToken from "./hooks/useMintToken";
import { useState } from "react";
import NFTStore from "./components/NFTStore";
import Marketplace from "./components/NFTMarketplace";



function App() {
    const { nextTokenId, tokenMetaData, mintPrice } = useAppContext();

    console.log("nextTokenId: ", nextTokenId);
    const tokenMetaDataArray = Array.from(tokenMetaData.values());
    const mintToken = useMintToken();

    const [activeTab, setActiveTab] = useState("mint");

    return (
        <div>
            <Header />
            <main className="h-full min-h-[calc(100vh-128px)] p-4">
                <div className="text-center">
                    <h1 className="text-3xl font-bold">NFT dApp</h1>
                    <p className="text-primary font-medium">Mint and manage your NFTs</p>
                </div>

                {/* Tabs Navigation */}
                <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-4  mt-6">
                    <button 
                        className={`p-4 text-xl font-semibold ${activeTab === "mint" ? "border-b-4 border-primary text-primary" : "text-gray-500"}`}
                        onClick={() => setActiveTab("mint")}
                    >
                        Mint NFT
                    </button>
                    <button 
                        className={`p-4 text-xl font-semibold ${activeTab === "manage" ? "border-b-4 border-primary text-primary" : "text-gray-500"}`}
                        onClick={() => setActiveTab("manage")}
                    >
                        Manage NFTs
                    </button>
                    <button 
                        className={`p-4 text-xl font-semibold ${activeTab === "marketplace" ? "border-b-4 border-primary text-primary" : "text-gray-500"}`}
                        onClick={() => setActiveTab("marketplace")}
                    >
                        Marketplace
                    </button>
                </div>

                {/* Tab Content */}
                <div className="mt-6">
                    {activeTab === "mint" && (
                        <div>
                            <h1 className="text-xl font-bold">Mint NFT</h1>
                            <p className="text-gray-500">Mint your NFT and make it available for sale</p>
                            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                                {tokenMetaDataArray.map((token, i) => (
                                    <NFTCard
                                        key={token.name.split(" ").join("")}
                                        metadata={token}
                                        mintPrice={mintPrice}
                                        tokenId={i}
                                        nextTokenId={nextTokenId}
                                        mintNFT={mintToken}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === "manage" && (
                        <div>
                            <h1 className="text-xl font-bold">Manage NFTs</h1>
                            <p className="text-gray-500">View and manage your minted NFTs</p>
                            <div className="mt-4">
                                <NFTStore
                                    mintPrice={mintPrice}
                                    nextTokenId={nextTokenId}
                                    mintToken={mintToken}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === "marketplace" && (
                        <div>
                            <h1 className="text-xl font-bold">Marketplace</h1>
                            <p className="text-gray-500">Buy and sell NFTs on the marketplace</p>
                            <div className="mt-4">
                                <Marketplace />
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default App;
