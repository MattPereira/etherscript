import * as dotenv from "dotenv";
dotenv.config();
import chalk from "chalk";
import hre from "hardhat";
import { networkConfig } from "../../hardhat-helper-config";

// import {ChainId, AlphaRouter} from "@uniswap/smart-order-router"

/** Use smart order router to compute optimal routes and execute swaps
 *
 * https://docs.uniswap.org/sdk/v3/guides/routing
 */

async function main() {
  const { ethers } = hre;
  const { provider } = ethers;
  // const signer = (await ethers.getSigners())[0];

  //dynamically get chainId
  const chainId = await ethers.provider
    .getNetwork()
    .then((network) => Number(network.chainId));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
