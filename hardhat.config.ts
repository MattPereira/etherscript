import { config as envEncConfig } from "@chainlink/env-enc";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

envEncConfig();

import "./tasks"; // makes tasks available via cli

const providerApiKey = process.env.ALCHEMY_API_KEY!;
const privateKey = process.env.PRIVATE_KEY!;

/**
 * Configured to fork arbitrum for local testing
 */

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  networks: {
    hardhat: {
      // set chainId to be arbitrum since we are forking it for testing
      chainId: 42161,
      forking: {
        url: `https://arb-mainnet.alchemyapi.io/v2/${providerApiKey}`,
      },
    },
    mainnet: {
      chainId: 1,
      url: `https://eth-mainnet.alchemyapi.io/v2/${providerApiKey}`,
      accounts: [privateKey],
    },
    arbitrum: {
      chainId: 42161,
      url: `https://arb-mainnet.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [privateKey],
    },
  },
};
export default config;
