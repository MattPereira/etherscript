import * as dotenv from "dotenv";
import chalk from "chalk";
import hre from "hardhat";
import {
  AlphaRouter,
  SwapOptionsSwapRouter02,
  SwapType,
} from "@uniswap/smart-order-router";
import { BaseProvider } from "@ethersproject/providers";
import {
  ForkSwapConfig,
  RealSwapConfig,
  ISwapConfig,
  MAX_FEE_PER_GAS,
  MAX_PRIORITY_FEE_PER_GAS,
} from "./libs/config";
import { Percent, CurrencyAmount, TradeType, ChainId } from "@uniswap/sdk-core";
import { wrapETH, approveToken, getTokenBalance } from "../helper";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { V3_SWAP_ROUTER_ADDRESS } from "./libs/constants";

// Environment setup
dotenv.config();
const { ethers } = hre;

/** Use smart order router to compute optimal routes and execute swaps
 * https://docs.uniswap.org/sdk/v3/guides/routing
 *
 * TODO:
 * - figure out max fee per gas and max priority fee per gas
 * - refactor swap config to be better
 * - create a wallet and fill with limited USDC for swapping
 */

async function main() {
  const signer = (await ethers.getSigners())[0];

  let routerProvider: BaseProvider;
  let routerChainId: ChainId;

  // Routing is not supported for local forks. Must use live network provider
  if (hre.network.name === "hardhat") {
    routerProvider = new ethers.providers.JsonRpcProvider(
      (hre.network.config as any).forking.url
    );
    routerChainId = ChainId.ARBITRUM_ONE;
  } else {
    routerProvider = hre.ethers.provider;
    routerChainId = (await routerProvider.getNetwork()).chainId;
  }

  const router = new AlphaRouter({
    chainId: routerChainId,
    provider: routerProvider,
  });

  // option to set recipient to not the signer!
  const options: SwapOptionsSwapRouter02 = {
    recipient: signer.address,
    slippageTolerance: new Percent(50, 10_000),
    deadline: Math.floor(Date.now() / 1000 + 1800),
    type: SwapType.SWAP_ROUTER_02,
  };

  // If on local fork, wrap eth and exchange for USDC
  if (hre.network.name === "hardhat") {
    await wrapETH(signer, ForkSwapConfig.amountIn);
    await executeSwap({
      router: router,
      options: options,
      swapConfig: ForkSwapConfig,
      signer: signer,
    });
  }
  // the real swap
  await executeSwap({
    router: router,
    options: options,
    swapConfig: RealSwapConfig,
    signer: signer,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

interface IExecuteSwap {
  router: AlphaRouter;
  options: SwapOptionsSwapRouter02;
  swapConfig: ISwapConfig;
  signer: SignerWithAddress;
}

/**
 * @param router the router instance
 * @param options who receives the swap, slippage tolerance, deadline, swap type
 * @param swapConfig Sets the tokenIn, amountIn, tokenOut
 * @param signer who sends the transaction to swap
 */

async function executeSwap({
  router,
  options,
  swapConfig,
  signer,
}: IExecuteSwap) {
  const { tokenIn, amountIn, tokenOut } = swapConfig;

  // create the route using tokenIn, amountIn, tokenOut
  const route = await router.route(
    CurrencyAmount.fromRawAmount(
      tokenIn,
      ethers.utils.parseUnits(amountIn, tokenIn.decimals).toString()
    ),
    tokenOut,
    TradeType.EXACT_INPUT,
    options
  );

  if (!route) {
    throw new Error("No route found for the specified swap.");
  }

  const txCost = (+route.estimatedGasUsedUSD.toExact()).toFixed(2);
  console.log(
    "Route Quote: " +
      chalk.magenta(
        `${amountIn} ${tokenIn.symbol} to ${route?.quote.toExact()} ${
          tokenOut.symbol
        } using $${txCost} worth of gas`
      )
  );

  // Approve tokenIn to be transferred by the router
  await approveToken(tokenIn.address, V3_SWAP_ROUTER_ADDRESS, amountIn, signer);

  console.log("Sending swap transaction...");
  const swapTx = await signer.sendTransaction({
    data: route?.methodParameters?.calldata,
    to: V3_SWAP_ROUTER_ADDRESS,
    value: route?.methodParameters?.value,
    from: signer.address,
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
  });
  console.log("txHash", chalk.blue(swapTx.hash));
  const swapTxReceipt = await swapTx.wait();
  if (swapTxReceipt.status !== 1) {
    throw new Error("Swap failed");
  }

  const tokenOutBalance = await getTokenBalance(
    signer.address,
    tokenOut.address
  );

  console.log(
    chalk.yellow(
      `Swapped ${amountIn} ${tokenIn.symbol} for ${tokenOutBalance} ${tokenOut.symbol}`
    )
  );
}
