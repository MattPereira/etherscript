import axios from "axios";
import { HardhatRuntimeEnvironment } from "hardhat/types";

/** Get price in usd from chainlink price feed
 *
 * @param address the address of the price feed
 * @returns Token object as defined by uniswap sdk
 */

export async function getPriceUSD(
  hre: HardhatRuntimeEnvironment,
  address: string
) {
  const { ethers } = hre;

  let provider;

  if (hre.network.name === "hardhat") {
    provider = new ethers.providers.JsonRpcProvider(
      (hre.network.config as any).forking.url
    );
  } else {
    provider = ethers.provider;
  }

  const priceFeed = new ethers.Contract(
    address,
    [
      {
        inputs: [],
        name: "decimals",
        outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "latestRoundData",
        outputs: [
          { internalType: "uint80", name: "roundId", type: "uint80" },
          { internalType: "int256", name: "answer", type: "int256" },
          { internalType: "uint256", name: "startedAt", type: "uint256" },
          { internalType: "uint256", name: "updatedAt", type: "uint256" },
          { internalType: "uint80", name: "answeredInRound", type: "uint80" },
        ],
        stateMutability: "view",
        type: "function",
      },
    ],
    provider
  );

  const decimals = await priceFeed.decimals();
  const latestRound = await priceFeed.latestRoundData();
  return ethers.utils.formatUnits(latestRound.answer, decimals);
}
