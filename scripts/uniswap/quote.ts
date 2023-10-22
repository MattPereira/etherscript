import hre from "hardhat";
import chalk from "chalk";

import { computePoolAddress } from "@uniswap/v3-sdk";
import Quoter from "@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json";
import IUniswapV3PoolABI from "@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json";

import { getPoolInfo } from "./libs/pool";
import {
  POOL_FACTORY_CONTRACT_ADDRESS,
  QUOTER_CONTRACT_ADDRESS,
} from "./libs/constants";
import { SwapConfig } from "./libs/config";

/** GET A PRICE QUOTE
 *
 * https://docs.uniswap.org/sdk/v3/guides/quoting
 *
 * hh run scripts/uniswap/quote.ts --network mainnet
 */

const { ethers } = hre;
const { provider } = ethers;
const { tokenIn, amountIn, tokenOut } = SwapConfig;

async function main() {
  const quoterContract = new ethers.Contract(
    QUOTER_CONTRACT_ADDRESS,
    Quoter.abi,
    provider
  );
  console.log("Fetching pool info...");
  const poolConstants = await getPoolInfo();

  console.log("Fetching quote...");
  const quotedAmountOut = await quoterContract.quoteExactInputSingle.staticCall(
    poolConstants.token0,
    poolConstants.token1,
    poolConstants.fee,
    ethers.parseUnits(amountIn, tokenIn.decimals),
    0
  );

  // prettier-ignore
  console.log(chalk.red(`${amountIn} ${tokenIn.symbol} = ${ethers.formatUnits(quotedAmountOut,tokenOut.decimals)} ${tokenOut.symbol}`));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
