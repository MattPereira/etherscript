import { task } from "hardhat/config";
import chalk from "chalk";
import {
  AlphaRouter,
  SwapOptionsSwapRouter02,
  SwapType,
} from "@uniswap/smart-order-router";
import { BaseProvider } from "@ethersproject/providers";
import { Percent, CurrencyAmount, TradeType, Token } from "@uniswap/sdk-core";
import {
  wrapETH,
  approveToken,
  logTxHashLink,
  getTokenMetadata,
} from "../../scripts/helper";
import { prompt } from "../../utils";
import { addressBook } from "../../addressBook";
import { HardhatRuntimeEnvironment } from "hardhat/types";

/** Use smart order router to compute optimal routes and execute swaps
 * https://docs.uniswap.org/sdk/v3/guides/routing
 *
 * First live swap on "Hot Script" wallet
 * https://arbiscan.io/tx/0x7440a99dbd09cbfe55ed5e5cad947ab590cd9f0ef23fad077e49380e2a368863
 *
 * TODO:
 * - figure out max fee per gas and max priority fee per gas
 *
 * EXAMPLE:
 * hh swap --in USDC --amount 100 --out rETH
 */

// CONSTANTS
const V3_SWAP_ROUTER_ADDRESS = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45";
const MAX_FEE_PER_GAS = 170000000;
const MAX_PRIORITY_FEE_PER_GAS = 0;

type TokenKeys = "USDC" | "wETH" | "rETH";

type TokenAddressMap = {
  USDC: string;
  wETH: string;
  rETH: string;
};

task(
  "swap",
  "Use uniswap smart order router to execute swap between two tokens"
)
  .addParam("in", "The symbol of the token to swap in")
  .addParam("amount", "The human readable amount of the token to swap in")
  .addParam("out", "The symbol of the token to swap out")
  .setAction(async (taskArgs, hre) => {
    const { ethers } = hre;

    if (!["USDC", "wETH", "rETH"].includes(taskArgs.in)) {
      throw new Error(`Invalid token: ${taskArgs.in}`);
    }
    if (!["USDC", "wETH", "rETH"].includes(taskArgs.out)) {
      throw new Error(`Invalid token: ${taskArgs.out}`);
    }

    const signer = (await ethers.getSigners())[0];
    const chainId = (await ethers.provider.getNetwork()).chainId;

    let routerProvider: BaseProvider;

    // Uniswap router requires a live network provider on localhost
    if (hre.network.name === "hardhat") {
      routerProvider = new ethers.providers.JsonRpcProvider(
        (hre.network.config as any).forking.url
      );
    } else {
      routerProvider = ethers.provider;
    }

    const tokenAddress: TokenAddressMap = addressBook[chainId].tokenAddress;

    console.log("Fetching token metadata...");
    const TOKEN_IN = await getTokenMetadata(
      hre,
      tokenAddress[taskArgs.in as TokenKeys]
    );
    const TOKEN_OUT = await getTokenMetadata(
      hre,
      tokenAddress[taskArgs.out as TokenKeys]
    );

    const SWAP_CONFIG = {
      tokenIn: TOKEN_IN,
      amountIn: "100",
      tokenOut: TOKEN_OUT,
    };

    const router = new AlphaRouter({
      chainId: chainId,
      provider: routerProvider,
    });

    // Change recipient to "HOT ALT" wallet???
    const options: SwapOptionsSwapRouter02 = {
      recipient: signer.address,
      slippageTolerance: new Percent(50, 10_000),
      deadline: Math.floor(Date.now() / 1000 + 1800),
      type: SwapType.SWAP_ROUTER_02,
    };

    // If on local fork, wrap 1 eth and exchange for SWAP_CONFIG.tokenIn
    if (hre.network.name === "hardhat") {
      const WETH_TOKEN = await getTokenMetadata(hre, tokenAddress["wETH"]);
      const amount = "1";
      await wrapETH(hre, amount);
      await executeSwap({
        router: router,
        options: options,
        swapConfig: {
          tokenIn: WETH_TOKEN,
          amountIn: amount,
          tokenOut: SWAP_CONFIG.tokenIn,
        },
        hre,
      });
    }

    // Execute the target swap
    await executeSwap({
      hre,
      router: router,
      options: options,
      swapConfig: SWAP_CONFIG,
    });
  });

interface IExecuteSwap {
  hre: HardhatRuntimeEnvironment;
  router: AlphaRouter;
  options: SwapOptionsSwapRouter02;
  swapConfig: {
    tokenIn: Token;
    amountIn: string;
    tokenOut: Token;
  };
}

/**
 * @param router the router instance
 * @param options who receives the swap, slippage tolerance, deadline, swap type
 * @param swapConfig Sets the tokenIn, amountIn, tokenOut
 * @param signer who sends the transaction to swap
 */

async function executeSwap({ router, options, swapConfig, hre }: IExecuteSwap) {
  const { ethers } = hre;
  const signer = (await ethers.getSigners())[0];
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

  const quoteMessage = chalk.yellow(
    `Swap ${amountIn} ${tokenIn.symbol} to ${route?.quote.toExact()} ${
      tokenOut.symbol
    } using $${txCost} worth of gas?`
  );

  console.log();
  if (hre.network.name === "hardhat") {
    console.log(quoteMessage);
    console.log();
  } else {
    await prompt(quoteMessage);
  }

  // Approve tokenIn to be transferred by the router
  await approveToken(hre, tokenIn.address, V3_SWAP_ROUTER_ADDRESS, amountIn);

  console.log("Sending swap transaction...");
  const swapTx = await signer.sendTransaction({
    data: route?.methodParameters?.calldata,
    to: V3_SWAP_ROUTER_ADDRESS,
    value: route?.methodParameters?.value,
    from: signer.address,
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
  });

  logTxHashLink(swapTx.hash, hre);

  const swapTxReceipt = await swapTx.wait();
  if (swapTxReceipt.status !== 1) {
    console.log("swapTxReceipt", swapTxReceipt);
    throw new Error("Swap failed!");
  }

  // console.log(swapTxReceipt);

  const tokenOutBalance = "tokenOutBalance";

  console.log(
    chalk.green(
      `Swapped ${amountIn} ${tokenIn.symbol} for ${tokenOutBalance} ${tokenOut.symbol}`
    )
  );
}
