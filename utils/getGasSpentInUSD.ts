import { TransactionReceipt } from "@ethersproject/providers";
import { addressBook } from "../addressBook";
import { ChainId } from "@uniswap/sdk-core";
import { HardhatRuntimeEnvironment } from "hardhat/types";

/** Get the amount of gas spent on a transaction in USD terms
 *
 * @param txReceipt the transaction receipt object from ethers
 * @returns the gas cost of transaction in USD as string, e.g. "$1.99"
 *
 * @notice forces mainnet for price feed address and provider
 */

export async function getGasSpentInUSD(
  txReceipt: TransactionReceipt,
  hre: HardhatRuntimeEnvironment
) {
  const { ethers } = hre;

  const { effectiveGasPrice, gasUsed } = txReceipt;
  const gasSpentWei = gasUsed.mul(effectiveGasPrice);

  const ethUSDPriceFeedAddress =
    addressBook[ChainId.MAINNET].chainlink?.priceFeedAddress.ETH_USD;

  const provider = new ethers.providers.JsonRpcProvider(
    (hre.config.networks.mainnet as any).url
  );

  // hardcoded because gas is always paid in ETH
  const priceFeed = new ethers.Contract(
    ethUSDPriceFeedAddress,
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
  const ethUsdPrice = ethers.utils.formatUnits(latestRound.answer, decimals);

  const usdSpent = +ethUsdPrice * +ethers.utils.formatEther(gasSpentWei);

  return `$${usdSpent.toFixed(2)}`;
}
