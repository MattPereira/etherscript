import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

/** Get price from chainlink price feed contract on ethereum mainnet
 *
 * @param address the address of chainlink price feed contract
 * @returns price of asset pair specified by price feed contract
 *
 * https://docs.chain.link/data-feeds/price-feeds/addresses?network=ethereum&page=1
 */

export async function getPrice(
  address: string,
  hre: HardhatRuntimeEnvironment
) {
  const { ethers } = hre;

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
    ethers.provider
  );

  const decimals = await priceFeed.decimals();
  const latestRound = await priceFeed.latestRoundData();
  return ethers.utils.formatUnits(latestRound.answer, decimals);
}

task(
  "get-price",
  "Gets the price for a base asset in terms of a quote asset using chainlink price feeds"
)
  .addParam(
    "contract",
    "The chainlink price feed contract address",
    undefined,
    types.string,
    false
  )
  .setAction(async (taskArgs, hre) => {
    const price = await getPrice(taskArgs.contract, hre);

    console.log(`Price: ${price}`);
  });
