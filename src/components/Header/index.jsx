import { Box, Flex, Text } from "@radix-ui/themes";
import React from "react";
import WalletConnection from "./WalletConnection";

const Header = () => {
    return (
        <Flex
            gap="3"
            as="header"
            width="100%"
            align="center"
            justify="between"
            className="bg-primary p-4 items-center h-18"
        >
            <Box>
                <Text
                    className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-yellow-500 font-bold text-2xl"
                    as="span"
                    role="img"
                    aria-label="logo"
                >
                    DApp de Mayo 🚀
                </Text>
            </Box>
            <WalletConnection />
        </Flex>
    );
};

export default Header;
