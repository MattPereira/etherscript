import { task } from "hardhat/config";
import ERC20_ABI from "@chainlink/contracts/abi/v0.8/ERC20.json";
import { Token } from "@uniswap/sdk-core";
import { HardhatRuntimeEnvironment } from "hardhat/types";

/** Creates Token object for use with uniswap sdk
 *
 * @param tokenAddress the token address
 * @returns Token object as defined by uniswap sdk
 */

export async function getTokenMetadata(
  tokenAddress: string,
  hre: HardhatRuntimeEnvironment
) {
  const { ethers } = hre;
  const { provider } = ethers;

  const chainId = (await ethers.provider.getNetwork()).chainId;

  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  const decimals = await tokenContract.decimals();
  const symbol = await tokenContract.symbol();
  const name = await tokenContract.name();

  return new Token(chainId, tokenAddress, decimals, symbol, name);
}

task(
  "get-token-metadata",
  "Gets the token metadata for a given token contract address"
)
  .addParam("address", "The token contract's address")
  .setAction(async (taskArgs, hre) => {
    const metadata = await getTokenMetadata(taskArgs.address, hre);
    console.log(metadata);
  });
