import { computePoolAddress } from "@uniswap/v3-sdk";
import Quoter from "@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json";
import IUniswapV3PoolABI from "@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json";
import {
  POOL_FACTORY_CONTRACT_ADDRESS,
  QUOTER_CONTRACT_ADDRESS,
} from "./libs/constants";
import { USDC_TOKEN, WETH_TOKEN } from "./libs/constants";
import { FeeAmount } from "@uniswap/v3-sdk";

import hre from "hardhat";
import chalk from "chalk";

/**
 * SDK DOCS: https://docs.uniswap.org/sdk/v3/guides/quoting
 *
 * hh run scripts/uniswap/quote.ts --network mainnet
 */

const { ethers } = hre;
const { provider } = ethers;

const TOKENS = {
  in: USDC_TOKEN,
  amountIn: 1000,
  out: WETH_TOKEN,
  poolFee: FeeAmount.MEDIUM,
};

async function main() {
  const quoterContract = new ethers.Contract(
    QUOTER_CONTRACT_ADDRESS,
    Quoter.abi,
    provider
  );
  const poolConstants = await getPoolConstants();

  const quotedAmountOut = await quoterContract.quoteExactInputSingle.staticCall(
    poolConstants.token0,
    poolConstants.token1,
    poolConstants.fee,
    ethers.parseUnits(TOKENS.amountIn.toString(), TOKENS.in.decimals),
    0
  );

  console.log(chalk.blue("PRICE QUOTE"));
  console.log(chalk.red("IN:", TOKENS.amountIn, TOKENS.in.symbol));
  console.log(
    chalk.green(
      "OUT:",
      ethers.formatUnits(quotedAmountOut, TOKENS.out.decimals),
      TOKENS.out.symbol
    )
  );
}

async function getPoolConstants(): Promise<{
  token0: string;
  token1: string;
  fee: number;
}> {
  const currentPoolAddress = computePoolAddress({
    factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
    tokenA: TOKENS.in,
    tokenB: TOKENS.out,
    fee: TOKENS.poolFee,
  });

  const poolContract = new ethers.Contract(
    currentPoolAddress,
    IUniswapV3PoolABI.abi,
    provider
  );
  const [token0, token1, fee] = await Promise.all([
    poolContract.token0(),
    poolContract.token1(),
    poolContract.fee(),
  ]);

  return {
    token0,
    token1,
    fee,
  };
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
