import ERC20_ABI from "@chainlink/contracts/abi/v0.8/ERC20.json";
import { Token, ChainId } from "@uniswap/sdk-core";
import { HardhatRuntimeEnvironment } from "hardhat/types";

/** Creates Token object for use with uniswap sdk
 *
 * @param tokenAddress the token address
 * @returns Token object as defined by uniswap sdk
 */

export async function getTokenMetadata(
  hre: HardhatRuntimeEnvironment,
  tokenAddress: string
) {
  const { ethers } = hre;
  const { provider } = ethers;

  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  const decimals = await tokenContract.decimals();
  const symbol = await tokenContract.symbol();
  const name = await tokenContract.name();

  return new Token(ChainId.ARBITRUM_ONE, tokenAddress, decimals, symbol, name);
}
