import { Token } from "@uniswap/sdk-core";
import { FeeAmount } from "@uniswap/v3-sdk";
import { USDC_TOKEN, WETH_TOKEN } from "./constants";

export interface ISwapConfig {
  tokenIn: Token;
  amountIn: string;
  tokenOut: Token;
  poolFee: number;
}

/**
 * @param tokenIn - The token you want to swap from
 * @param amountIn - The amount of tokenIn you want to swap (in human readable form i.e. not wei)
 * @param tokenOut - The token you want to swap to
 * @param poolFee - The uniswap pool fee you want to use (i.e. 500 = 0.05%)
 */

// ONLY EXECUTED ON LOCAL FORK TESTING
export const ForkSwapConfig: ISwapConfig = {
  tokenIn: WETH_TOKEN,
  amountIn: "1",
  tokenOut: USDC_TOKEN,
  poolFee: FeeAmount.LOWEST,
};

// THE REAL SWAP
export const RealSwapConfig: ISwapConfig = {
  tokenIn: USDC_TOKEN,
  amountIn: "100",
  tokenOut: WETH_TOKEN,
  poolFee: FeeAmount.LOWEST,
};
