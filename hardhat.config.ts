import { config as envEncConfig } from "@chainlink/env-enc";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

envEncConfig();

// import all tasks so hh makes availalbe on CLI
import "./tasks/accounts";
import "./tasks/get-abi";
import "./tasks/balance";

const providerApiKey = process.env.ALCHEMY_API_KEY!;
const privateKey = process.env.PRIVATE_KEY!;

/**
 * BEWARE OF THE FORK URL
 */
const config: HardhatUserConfig = {
  solidity: "0.8.19",
  networks: {
    hardhat: {
      forking: {
        url: `https://arb-mainnet.alchemyapi.io/v2/${providerApiKey}`,
      },
    },
    mainnet: {
      chainId: 1,
      url: `https://eth-mainnet.alchemyapi.io/v2/${providerApiKey}`,
      accounts: [privateKey],
    },
    sepolia: {
      chainId: 11155111,
      url: `https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [privateKey],
    },
    arbitrum: {
      url: `https://arb-mainnet.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [privateKey],
    },
  },
};
export default config;
