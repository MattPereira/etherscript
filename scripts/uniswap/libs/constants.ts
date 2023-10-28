// This file stores web3 related constants such as addresses, token definitions, ETH currency references and ABI's
import { ChainId, Token } from "@uniswap/sdk-core";

// CONTRACT ADDRESSES
export const V3_SWAP_ROUTER_ADDRESS =
  // same contract on every popoular network?
  "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45";

// TOKENS
export const WETH_TOKEN = new Token(
  ChainId.ARBITRUM_ONE,
  "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
  18,
  "WETH",
  "Wrapped Ether"
);

export const USDC_TOKEN = new Token(
  ChainId.ARBITRUM_ONE,
  "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  6,
  "USDC",
  "USD Coin"
);

// PROGRAMMATICALLY CREATE SDK TOKEN OBJECT ?
// async function createToken(chainId: number, address: string): Token {
//   const { ethers } = hre;
//   const tokenContract = new ethers.Contract(
//     address,
//     ERC20_ABI,
//     ethers.provider
//   );

//   console.log("here");

//   console.log(await tokenContract.decimals());
//   const decimals = 18;
//   const symbol = "WETH";
//   const name = "Wrapped Ether";

//   return new Token(chainId, address, decimals, symbol, name);
// }
