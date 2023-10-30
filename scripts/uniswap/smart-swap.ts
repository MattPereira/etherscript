import chalk from "chalk";
import hre from "hardhat";
import {
  AlphaRouter,
  SwapOptionsSwapRouter02,
  SwapType,
} from "@uniswap/smart-order-router";
import { BaseProvider } from "@ethersproject/providers";
import {
  Percent,
  CurrencyAmount,
  TradeType,
  ChainId,
  Token,
} from "@uniswap/sdk-core";
import {
  wrapETH,
  approveToken,
  getTokenBalance,
  getTokenMetadata,
} from "../helper";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { prompt } from "../utils";
import { addressBook } from "../../addressBook";
// Environment setup
const { ethers } = hre;

/** Use smart order router to compute optimal routes and execute swaps
 * https://docs.uniswap.org/sdk/v3/guides/routing
 *
 * First live swap on "Hot Script" wallet
 * https://arbiscan.io/tx/0x7440a99dbd09cbfe55ed5e5cad947ab590cd9f0ef23fad077e49380e2a368863
 *
 * TODO:
 * - figure out max fee per gas and max priority fee per gas
 * - refactor swap config to be better
 */

// same router address on mainnet and arbitrum
const V3_SWAP_ROUTER_ADDRESS = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45";
const MAX_FEE_PER_GAS = 170000000;
const MAX_PRIORITY_FEE_PER_GAS = 0;

async function main() {
  const signer = (await ethers.getSigners())[0];

  let routerProvider: BaseProvider;
  let chainId;

  if (hre.network.name === "hardhat") {
    // using arbitrum fork for this script
    chainId = ChainId.ARBITRUM_ONE;
    // Uniswap router requires a live network provider
    routerProvider = new ethers.providers.JsonRpcProvider(
      (hre.network.config as any).forking.url
    );
  } else {
    // use chainId and provider set by --network flag
    chainId = (await ethers.provider.getNetwork()).chainId;
    routerProvider = ethers.provider;
  }

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

  const WETH_TOKEN = await getTokenMetadata(addressBook[chainId].token["wETH"]);
  const USDC_TOKEN = await getTokenMetadata(addressBook[chainId].token["USDC"]);
  const RETH_TOKEN = await getTokenMetadata(addressBook[chainId].token["rETH"]);

  const SWAP_CONFIG = {
    tokenIn: USDC_TOKEN,
    amountIn: "100",
    tokenOut: RETH_TOKEN,
  };

  // If on local fork, wrap 1 eth and exchange for SWAP_CONFIG.tokenIn
  if (hre.network.name === "hardhat") {
    const amount = "1";
    await wrapETH(signer, amount);
    await executeSwap({
      router: router,
      options: options,
      swapConfig: {
        tokenIn: WETH_TOKEN,
        amountIn: amount,
        tokenOut: SWAP_CONFIG.tokenIn,
      },
      signer: signer,
    });
  }

  // Execute the target swap
  await executeSwap({
    router: router,
    options: options,
    swapConfig: SWAP_CONFIG,
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
  swapConfig: {
    tokenIn: Token;
    amountIn: string;
    tokenOut: Token;
  };
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

  await prompt(
    "Route Quote: " +
      chalk.magenta(
        `${amountIn} ${tokenIn.symbol} to ${route?.quote.toExact()} ${
          tokenOut.symbol
        } using $${txCost} worth of gas`
      )
  );

  // Approve tokenIn to be transferred by the router
  await approveToken(tokenIn.address, V3_SWAP_ROUTER_ADDRESS, amountIn, signer);

  // TODO: figure out how best practice for setting max fee per gas and max priority fee per gas
  // const block = await ethers.provider.getBlock("latest");
  // console.log(block.baseFeePerGas?.div(10 ** 9).toString());

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
