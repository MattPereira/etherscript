import hre from "hardhat";

import IUniswapV3PoolABI from "@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json";
import { computePoolAddress } from "@uniswap/v3-sdk";

import { POOL_FACTORY_CONTRACT_ADDRESS } from "./constants";
import { SwapConfig } from "./config";

/**
 * Grab liquidity pool information
 */

const { ethers } = hre;
const { provider } = ethers;
const { tokenIn, amountIn, tokenOut, poolFee } = SwapConfig;

interface PoolInfo {
  token0: string;
  token1: string;
  fee: number;
  tickSpacing: number;
  sqrtPriceX96: bigint;
  liquidity: bigint;
  tick: number;
}

export async function getPoolInfo(): Promise<PoolInfo> {
  if (!provider) {
    throw new Error("No provider");
  }

  const currentPoolAddress = computePoolAddress({
    factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
    tokenA: tokenIn,
    tokenB: tokenOut,
    fee: poolFee,
  });

  const poolContract = new ethers.Contract(
    currentPoolAddress,
    IUniswapV3PoolABI.abi,
    provider
  );

  const [token0, token1, fee, tickSpacing, liquidity, slot0] =
    await Promise.all([
      poolContract.token0(),
      poolContract.token1(),
      poolContract.fee(),
      poolContract.tickSpacing(),
      poolContract.liquidity(),
      poolContract.slot0(),
    ]);

  return {
    token0,
    token1,
    fee,
    tickSpacing,
    liquidity,
    sqrtPriceX96: slot0[0],
    tick: slot0[1],
  };
}