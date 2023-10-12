import * as dotenv from "dotenv";
dotenv.config();
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";

// import all tasks so hh makes availalbe on CLI
import "./tasks/accounts";
import "./tasks/get-abi";
import "./tasks/balance";

const providerApiKey = process.env.ALCHEMY_API_KEY!;
const privateKey = process.env.PRIVATE_KEY!;

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  networks: {
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
