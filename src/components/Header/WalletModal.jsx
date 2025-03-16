import { Icon } from "@iconify/react/dist/iconify.js";
import { Dialog, Flex } from "@radix-ui/themes";
import React, { useState } from "react";
import { useConnectors } from "wagmi";

const WalletModal = () => {
    const connectors = useConnectors();

    const [pendingConnectorUID, setPendingConnectorUID] = useState(null);

    const walletConnectConnector = connectors.find(
        (connector) => connector.id === "walletConnect"
    );

    const otherConnectors = connectors.filter(
        (connector) => connector.id !== "walletConnect"
    );

    const connectWallet = async (connector) => {
        try {
            setPendingConnectorUID(connector.id);
            await connector.connect();
        } catch (error) {
            console.error(error);
        } finally {
            setPendingConnectorUID(null);
        }
    };

    return (
        <Dialog.Root>
            <Dialog.Trigger>
                <button className="bg-secondary text-primary px-4 py-2 rounded-md cursor-pointer">
                    Connect Wallet
                </button>
            </Dialog.Trigger>

            <Dialog.Content maxWidth="450px">
                <Dialog.Title className="text-primary">
                    Available Wallets
                </Dialog.Title>

                <Flex direction="column" gap="3">
                    {walletConnectConnector && (
                        <button
                            onClick={() =>
                                connectWallet(walletConnectConnector)
                            }
                            disabled={
                                pendingConnectorUID ===
                                walletConnectConnector.uid
                            }
                            className="w-full flex gap-4 items-center p-4 bg-primary/85 text-secondary rounded-md"
                        >
                            <img
                                src="https://logosarchive.com/wp-content/uploads/2022/02/WalletConnect-icon.svg"
                                className="w-6 h-6"
                            />
                            <span className="ml-2">WalletConnect</span>

                            {pendingConnectorUID ===
                                walletConnectConnector.uid && (
                                <Icon icon="codex:loader" className="w-4 h-4" />
                            )}
                        </button>
                    )}
                    <div className="flex flex-col gap-4">
                        {otherConnectors.map((connector) => (
                            <button
                                key={connector.id}
                                onClick={() => connectWallet(connector)}
                                disabled={pendingConnectorUID === connector.uid}
                                className="w-full flex gap-4 items-center p-4 bg-primary/85 text-secondary rounded-md"
                            >
                                <img src={connector.icon} className="w-6 h-6" />
                                <span className="ml-2">{connector.name}</span>

                                {pendingConnectorUID === connector.uid && (
                                    <Icon
                                        icon="codex:loader"
                                        className="w-4 h-4"
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );
};

export default WalletModal;
