import hre from "hardhat";
import chalk from "chalk";

import {
  Currency,
  CurrencyAmount,
  TradeType,
  Token,
  Percent,
} from "@uniswap/sdk-core";
import {
  Pool,
  Route,
  SwapQuoter,
  Trade,
  SwapOptions,
  SwapRouter,
} from "@uniswap/v3-sdk";
import {
  QUOTERV2_CONTRACT_ADDRESS,
  ERC20_ABI,
  WETH_ABI,
  SWAP_ROUTER_ADDRESS,
  MAX_FEE_PER_GAS,
  MAX_PRIORITY_FEE_PER_GAS,
  WETH_TOKEN,
} from "./libs/constants";

import { getPoolInfo } from "./libs/pool";
import { SwapConfig } from "./libs/config";

const { ethers } = hre;
const { provider } = ethers;
const { tokenIn, amountIn, tokenOut, poolFee } = SwapConfig;

type TokenTrade = Trade<Token, Token, TradeType>;

/** Execute a swap through a specific uniswap pool
 *
 * https://docs.uniswap.org/sdk/v3/guides/trading
 *
 * hh run scripts/uniswap/simple-swap.ts --network hardhat
 */

// Execute a trade between two ERC20 tokens (i.e. gotta wrap the ETH)
async function main() {
  const [signer] = await ethers.getSigners();

  await wrapETH(); // only for testing on hardhat fork of mainnet

  //prettier-ignore
  console.log(chalk.cyan(`Approving uniswap router contract to spend ${amountIn} ${tokenIn.symbol}...`));

  const tokenContract = new ethers.Contract(tokenIn.address, ERC20_ABI, signer);

  const approveTx = await tokenContract.approve(
    SWAP_ROUTER_ADDRESS,
    ethers.parseUnits(amountIn, tokenIn.decimals)
  );

  const approveTxReceipt = await approveTx.wait();

  if (approveTxReceipt.status !== 1) {
    throw new Error("Transfer approval failed");
  }

  const options: SwapOptions = {
    slippageTolerance: new Percent(50, 10_000), // 50 bips, or 0.50%
    deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from the current Unix time
    recipient: signer.address,
  };

  const trade = await createTrade();

  const methodParameters = SwapRouter.swapCallParameters([trade], options);

  const tx = {
    data: methodParameters.calldata,
    to: SWAP_ROUTER_ADDRESS,
    value: methodParameters.value,
    from: signer.address,
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
  };

  // prettier-ignore
  console.log(chalk.cyan(`Sending tx to swap ${amountIn} ${tokenIn.symbol} for ${tokenOut.symbol}...`));

  const txResponse = await signer.sendTransaction(tx);
  await txResponse.wait();

  // only for usdc swaps
  const usdcContract = new ethers.Contract(tokenOut.address, ERC20_ABI, signer);
  const usdcBalance = await usdcContract.balanceOf(signer.address);
  //prettier-ignore
  console.log(chalk.cyan(`Swapped ${amountIn} ${tokenIn.symbol} for ${ethers.formatUnits(usdcBalance,tokenOut.decimals)} ${tokenOut.symbol}`));
}

async function createTrade(): Promise<TokenTrade> {
  // Construct a pool
  const poolInfo = await getPoolInfo();

  const pool = new Pool(
    tokenIn,
    tokenOut,
    poolFee,
    poolInfo.sqrtPriceX96.toString(),
    poolInfo.liquidity.toString(),
    Number(poolInfo.tick)
  );

  // Construct a route
  const swapRoute = new Route([pool], tokenIn, tokenOut);

  // Construct a trade
  const amountOut = await getOutputQuote(swapRoute);

  const uncheckedTrade = Trade.createUncheckedTrade({
    route: swapRoute,
    inputAmount: CurrencyAmount.fromRawAmount(
      tokenIn,
      ethers.parseUnits(amountIn, tokenIn.decimals).toString()
    ),
    outputAmount: CurrencyAmount.fromRawAmount(tokenOut, amountOut.toString()),
    tradeType: TradeType.EXACT_INPUT,
  });

  return uncheckedTrade;
}

// HELPER FUNCTIONS
async function getOutputQuote(route: Route<Currency, Currency>) {
  if (!provider) {
    throw new Error("Provider required to get pool state");
  }

  const { calldata } = await SwapQuoter.quoteCallParameters(
    route,
    CurrencyAmount.fromRawAmount(
      tokenIn,
      ethers.parseUnits(amountIn, tokenIn.decimals).toString()
    ),
    TradeType.EXACT_INPUT,
    {
      useQuoterV2: true,
    }
  );

  const quoteCallReturnData = await provider.call({
    to: QUOTERV2_CONTRACT_ADDRESS,
    data: calldata,
  });

  const abiCoder = new ethers.AbiCoder();
  return abiCoder.decode(["uint256"], quoteCallReturnData);
}

async function wrapETH() {
  const [signer] = await ethers.getSigners();
  const amount = "1";

  const wethContract = new ethers.Contract(
    WETH_TOKEN.address,
    WETH_ABI,
    signer
  );

  const wrapTx = await wethContract.deposit({
    value: ethers.parseEther(amount),
  });
  await wrapTx.wait();

  const wethBalance = await wethContract.balanceOf(signer.address);

  console.log(
    `Wrapped ${amount} ETH into ${ethers.formatUnits(wethBalance, 18)} WETH`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
