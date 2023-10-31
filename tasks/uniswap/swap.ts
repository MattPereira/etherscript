import { task } from "hardhat/config";
import chalk from "chalk";
import {
  AlphaRouter,
  SwapOptionsSwapRouter02,
  SwapType,
} from "@uniswap/smart-order-router";
import { BaseProvider } from "@ethersproject/providers";
import { Percent, CurrencyAmount, TradeType, Token } from "@uniswap/sdk-core";
import { wrapETH, approveToken, getTokenMetadata } from "../helpers";
import { logTxHashLink, prompt, getGasSpentInUSD } from "../../utils";
import { addressBook } from "../../addressBook";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import ERC20_ABI from "@chainlink/contracts/abi/v0.8/ERC20.json";

/** Use smart order router to compute optimal routes and execute swaps
 * https://docs.uniswap.org/sdk/v3/guides/routing
 *
 * See first live swap tx using my "Hot Script" wallet
 * https://arbiscan.io/tx/0x7440a99dbd09cbfe55ed5e5cad947ab590cd9f0ef23fad077e49380e2a368863
 *
 * EXAMPLE:
 * hh swap --in USDC --amount 100 --out rETH
 */

// Constants
const V3_SWAP_ROUTER_ADDRESS = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45";
const MAX_FEE_PER_GAS = 170000000;
const MAX_PRIORITY_FEE_PER_GAS = 0;

task(
  "swap",
  "Use uniswap smart order router to execute swap between two tokens"
)
  .addParam("in", "The symbol of the token to swap in")
  .addParam("amount", "The human readable amount of the token to swap in")
  .addParam("out", "The symbol of the token to swap out")
  .setAction(async (taskArgs, hre) => {
    const onHardhatNetwork = hre.network.name === "hardhat";
    if (onHardhatNetwork) {
      console.log("Simulating swap on local fork...");
    } else {
      console.log("Executing swap on live network...");
    }

    const { ethers } = hre;
    const signer = (await ethers.getSigners())[0]; // who sends the transaction
    const chainId = (await ethers.provider.getNetwork()).chainId;
    const recipient = signer.address; // who receives tokenOut from the swap

    const tokenInSymbol =
      taskArgs.in.toUpperCase() as keyof typeof tokenAddress;
    const tokenOutSymbol =
      taskArgs.out.toUpperCase() as keyof typeof tokenAddress;

    // sanitize & validate the token symbols passed in cli
    const tokenList = Object.keys(addressBook[chainId].tokenAddress);
    if (!tokenList.includes(tokenInSymbol)) {
      throw new Error(`Invalid in token: ${taskArgs.in}`);
    }
    if (!tokenList.includes(tokenOutSymbol)) {
      throw new Error(`Invalid out token: ${taskArgs.out}`);
    }

    console.log("Fetching token metadata...");
    const tokenAddress = addressBook[chainId].tokenAddress;
    const TOKEN_IN = await getTokenMetadata(hre, tokenAddress[tokenInSymbol]);
    const TOKEN_OUT = await getTokenMetadata(hre, tokenAddress[tokenOutSymbol]);

    // TOKEN_IN and TOKEN_OUT must be type Token from uniswap sdk
    const SWAP_CONFIG = {
      tokenIn: TOKEN_IN,
      amountIn: taskArgs.amount,
      tokenOut: TOKEN_OUT,
    };

    let routerProvider: BaseProvider;
    // Uniswap router requires a live network provider on localhost
    if (onHardhatNetwork) {
      routerProvider = new ethers.providers.JsonRpcProvider(
        (hre.network.config as any).forking.url
      );
    } else {
      routerProvider = ethers.provider;
    }

    const router = new AlphaRouter({
      chainId: chainId,
      provider: routerProvider,
    });

    // Change recipient to "HOT ALT" wallet???
    const options: SwapOptionsSwapRouter02 = {
      recipient: recipient,
      slippageTolerance: new Percent(50, 10_000),
      deadline: Math.floor(Date.now() / 1000 + 1800),
      type: SwapType.SWAP_ROUTER_02,
    };

    // If on local fork, wrap 1 eth and exchange for SWAP_CONFIG.tokenIn
    if (onHardhatNetwork) {
      const WETH_TOKEN = await getTokenMetadata(hre, tokenAddress["WETH"]);
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
  await approveToken(tokenIn.address, V3_SWAP_ROUTER_ADDRESS, amountIn, hre);

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

  const gasSpentInUSD = await getGasSpentInUSD(swapTxReceipt, hre);

  /** Parsing the logs to get the tokenOut balance
   *
   * @notice we dont catch all the event logs as shown on etherscan
   * @notice we are targeting the erc20 event "Transfer"
   * @notice we are filtering the "Tranfer" events for "to" the signer.address
   *
   * think there should be only one event log with "to" the signer.address
   */

  const logs = swapTxReceipt.logs;
  const erc20Interface = new ethers.utils.Interface(ERC20_ABI);

  let tokenOutAmount = "?";

  const transferEventSignatureHash = erc20Interface.getEventTopic("Transfer");

  // find the event log that shows amount of tokenOut received
  const tokenOutLog = logs.find((log) => {
    if (
      log.topics &&
      // first topic is always reserved for the event signature hash
      log.topics[0] === transferEventSignatureHash &&
      // only looking for the event log associated with tokenOut.address
      log.address.toLowerCase() === tokenOut.address.toLowerCase()
    ) {
      const parsedLog = erc20Interface.parseLog(log);
      return parsedLog.args.to === signer.address;
    }
    return false;
  });

  if (tokenOutLog) {
    const parsedLog = erc20Interface.parseLog(tokenOutLog);
    const rawTokenOutAmount = parsedLog.args.value;
    tokenOutAmount = ethers.utils.formatUnits(
      rawTokenOutAmount,
      tokenOut.decimals
    );
  }

  console.log(
    chalk.green(
      `Swapped ${amountIn} ${tokenIn.symbol} for ${tokenOutAmount} ${tokenOut.symbol} using ${gasSpentInUSD} worth of gas`
    )
  );
}
