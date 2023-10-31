import chalk from "chalk";
import { task, types } from "hardhat/config";
import { BaseProvider } from "@ethersproject/providers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { config as envEncConfig } from "@chainlink/env-enc";
import ERC20_ABI from "@chainlink/contracts/abi/v0.8/ERC20.json";
// internal helper functions
import { wrapETH, approveToken, getTokenMetadata } from "../helpers";
import { logTxHashLink, prompt, getGasSpentInUSD } from "../../utils";
import { addressBook } from "../../addressBook";
// uniswap sdk imports
import { Percent, CurrencyAmount, TradeType, Token } from "@uniswap/sdk-core";
import {
  AlphaRouter,
  SwapOptionsSwapRouter02,
  SwapType,
} from "@uniswap/smart-order-router";

envEncConfig();

/** Use uniswap's smart order router to compute optimal routes and execute swaps
 * https://docs.uniswap.org/sdk/v3/guides/routing
 *
 * @notice the default recipient is the signer, you can choose any account to receive the swap
 *  by setting RECIPIENT_WALLET_ADDRESS env var via the command `npx env-enc set`
 */

task(
  "smart-swap",
  "Use the uniswap smart order router to compute optimal routes and execute a swap between two tokens"
)
  .addParam(
    "in",
    "The symbol of the token to swap in",
    undefined,
    types.string,
    false
  )
  .addParam(
    "amount",
    "The human readable amount of the token to swap in",
    undefined,
    types.int,
    false
  )
  .addParam(
    "out",
    "The symbol of the token to swap out",
    undefined,
    types.string,
    false
  )
  .setAction(async (taskArgs, hre) => {
    const { ethers } = hre;
    const onHardhatNetwork = hre.network.name === "hardhat";
    if (onHardhatNetwork) {
      console.log("Simulating swap on local fork...");
    } else {
      console.log("Executing swap on live network...");
    }

    const chainId = (await ethers.provider.getNetwork()).chainId;

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

    const swapConfig = {
      tokenIn: TOKEN_IN,
      amountIn: taskArgs.amount.toString(),
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

    const options: SwapOptionsSwapRouter02 = {
      recipient: await ethers.provider.getSigner(0).getAddress(),
      slippageTolerance: new Percent(50, 10_000),
      deadline: Math.floor(Date.now() / 1000 + 1800),
      type: SwapType.SWAP_ROUTER_02,
    };

    // If on local fork, wrap 1 eth and exchange for swapConfig.tokenIn
    if (onHardhatNetwork) {
      const WETH_TOKEN = await getTokenMetadata(hre, tokenAddress["WETH"]);
      const amount = "1";
      await wrapETH(hre, amount);
      const forkSwapConfig = {
        tokenIn: WETH_TOKEN,
        amountIn: amount,
        tokenOut: swapConfig.tokenIn,
      };

      await executeSwap(router, options, forkSwapConfig, hre);
    }

    // set the recipient of swap to my "Hot Alt" wallet
    if (process.env.RECIPIENT_WALLET_ADDRESS) {
      options.recipient = process.env.RECIPIENT_WALLET_ADDRESS;
    }

    // The actual swap
    await executeSwap(router, options, swapConfig, hre);
  });

/** Function to execute the swap tx
 * @param router the router instance
 * @param options who receives the swap, slippage tolerance, deadline, swap type
 * @param swapConfig Sets the tokenIn, amountIn, tokenOut
 * @param signer who sends the transaction to swap
 */

async function executeSwap(
  router: AlphaRouter,
  options: SwapOptionsSwapRouter02,
  swapConfig: {
    tokenIn: Token;
    amountIn: string;
    tokenOut: Token;
  },
  hre: HardhatRuntimeEnvironment
) {
  const { ethers } = hre;
  const signer = (await ethers.getSigners())[0];
  const chainId = (await ethers.provider.getNetwork()).chainId;
  const V3_SWAP_ROUTER_ADDRESS = addressBook[chainId].uniswap.V3_SWAP_ROUTER;
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

  const { maxFeePerGas, maxPriorityFeePerGas } =
    await ethers.provider.getFeeData();

  if (!maxFeePerGas || !maxPriorityFeePerGas) {
    throw new Error("Failed to fetch gas fee data");
  }

  console.log("Sending swap transaction...");
  const swapTx = await signer.sendTransaction({
    data: route?.methodParameters?.calldata,
    to: V3_SWAP_ROUTER_ADDRESS,
    value: route?.methodParameters?.value,
    from: signer.address,
    maxFeePerGas: maxFeePerGas,
    maxPriorityFeePerGas: maxPriorityFeePerGas,
  });

  logTxHashLink(swapTx.hash, hre);

  const swapTxReceipt = await swapTx.wait();
  if (swapTxReceipt.status !== 1) {
    console.log("swapTxReceipt", swapTxReceipt);
    throw new Error("Swap failed!");
  }

  const gasSpentInUSD = await getGasSpentInUSD(swapTxReceipt, hre);

  const logs = swapTxReceipt.logs;
  // set up interface to parse the logs
  const erc20Interface = new ethers.utils.Interface(ERC20_ABI);
  // looking for the "Transfer" event
  const transferEventSignatureHash = erc20Interface.getEventTopic("Transfer");
  const tokenOutLog = logs.find((log) => {
    if (
      log.topics &&
      // first topic is always reserved for the event signature hash
      log.topics[0] === transferEventSignatureHash &&
      // only looking for the event log associated with tokenOut.address
      log.address.toLowerCase() === tokenOut.address.toLowerCase()
    ) {
      const parsedLog = erc20Interface.parseLog(log);
      // only looking for the event log where the "to" address is the recipient
      return parsedLog.args.to === options.recipient;
    }
    return false;
  });

  let tokenOutAmount = "?";
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
