// This file stores web3 related constants such as addresses, token definitions, ETH currency references and ABI's
import { ChainId, Token } from "@uniswap/sdk-core";

// EVERYTHIN IS ARBITRUM ONE

// CONTRACT ADDRESSES

// Smart Swap tutorial
export const V3_SWAP_ROUTER_ADDRESS =
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

// ABIS
export const ERC20_ABI = [
  // Read-Only Functions
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",

  // Authenticated Functions
  "function transfer(address to, uint amount) returns (bool)",
  "function approve(address _spender, uint256 _value) returns (bool)",

  // Events
  "event Transfer(address indexed from, address indexed to, uint amount)",
];

export const WETH_ABI = [
  // Wrap ETH
  "function deposit() payable",

  // Unwrap ETH
  "function withdraw(uint wad) public",

  // get WETH balance
  "function balanceOf(address owner) view returns (uint256)",
];

// Transactions

export const MAX_FEE_PER_GAS = 100000000000;
export const MAX_PRIORITY_FEE_PER_GAS = 100000000000;
