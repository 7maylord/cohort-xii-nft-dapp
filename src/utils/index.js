import { JsonRpcProvider } from "ethers";
import { supportedNetworks } from "../config/wallet-connection/wagmi";

export const shortenAddress = (address, length = 4) => {
    return `${address.slice(0, length)}...${address.slice(-length)}`;
};

export const truncateString = (str, num) => {
    if (str.length <= num) {
        return str;
    }
    return str.slice(0, num) + "...";
};

let readonlyProvider = null;

export const getReadOnlyProvider = () => {
    if (readonlyProvider) return readonlyProvider;
    readonlyProvider = new JsonRpcProvider(
        supportedNetworks[0].rpcUrls.default.http[0]
    );

    return readonlyProvider;
};

export const isSupportedNetwork = (chainId) => {
    return supportedNetworks.some((network) => network.id === chainId);
};
