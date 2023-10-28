import * as dotenv from "dotenv";
import chalk from "chalk";
import hre from "hardhat";
import {
  AlphaRouter,
  SwapOptionsSwapRouter02,
  SwapRoute,
  SwapType,
  V3Route,
} from "@uniswap/smart-order-router";
import { BaseProvider } from "@ethersproject/providers";
import { ForkSwapConfig, RealSwapConfig, ISwapConfig } from "./libs/config";
import { Percent, CurrencyAmount, TradeType, ChainId } from "@uniswap/sdk-core";
import {
  ERC20_ABI,
  V3_SWAP_ROUTER_ADDRESS,
  MAX_FEE_PER_GAS,
  MAX_PRIORITY_FEE_PER_GAS,
} from "./libs/constants";
import { wrapETH } from "../helper/wrapETH";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

// Environment setup
dotenv.config();
const { ethers } = hre;

/** Use smart order router to compute optimal routes and execute swaps
 * https://docs.uniswap.org/sdk/v3/guides/routing
 *
 * TODO:
 * - figure out max fee per gas and max priority fee per gas
 * - refactor swap config to be better
 *
 */

async function main() {
  const signer = (await ethers.getSigners())[0];

  let routerProvider: BaseProvider;
  let routerChainId: ChainId;

  // Routing is not supported for local forks. Must use mainnet/arb provider
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

  // If on local ARB fork, wrap eth and exchange for USDC
  if (hre.network.name === "hardhat") {
    // Wrap ETH for testing on hardhat fork of mainnet
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

interface IExecuteTypes {
  router: AlphaRouter;
  options: SwapOptionsSwapRouter02;
  swapConfig: ISwapConfig;
  signer: SignerWithAddress;
}

/**
 * @param {router} - The router instance
 * @param {options} - Options for transaction
 * @param {swapConfig} - The swap configuration -> tokenIn, amountIn, tokenOut
 * @param {signer} - The signer of the transaction
 */

async function executeSwap({
  router,
  options,
  swapConfig,
  signer,
}: IExecuteTypes) {
  const { tokenIn, amountIn, tokenOut } = swapConfig;

  // create the route
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

  console.log(
    `Route Quote ${amountIn} ${tokenIn.symbol} = ${route?.quote.toExact()} ${
      tokenOut.symbol
    }`
  );

  // Approve token In to be transferred by the router
  const tokenContract = new ethers.Contract(tokenIn.address, ERC20_ABI, signer);
  console.log("Approving token transfer...");
  const approveTx = await tokenContract.approve(
    V3_SWAP_ROUTER_ADDRESS,
    ethers.utils.parseUnits(amountIn, tokenIn.decimals)
  );
  const approveTxReceipt = await approveTx.wait();
  if (approveTxReceipt.status !== 1) {
    throw new Error("Transfer approval failed");
  }

  // Send the swap transaction
  const swapTx = await signer.sendTransaction({
    data: route?.methodParameters?.calldata,
    to: V3_SWAP_ROUTER_ADDRESS,
    value: route?.methodParameters?.value,
    from: signer.address,
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
  });

  const swapTxReceipt = await swapTx.wait();
  if (swapTxReceipt.status !== 1) {
    throw new Error("Swap failed");
  }

  const tokenOutContract = new ethers.Contract(
    tokenOut.address,
    ERC20_ABI,
    ethers.provider
  );
  const tokenOutBalance = await tokenOutContract.balanceOf(signer.address);
  // prettier-ignore
  console.log(chalk.cyan(`Swapped ${amountIn} ${tokenIn.symbol} for ${ethers.utils.formatUnits(tokenOutBalance,tokenOut.decimals)} ${tokenOut.symbol}`));
}
