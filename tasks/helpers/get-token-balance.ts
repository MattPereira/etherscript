// import chalk from "chalk";
import { task } from "hardhat/config";
import ERC20_ABI from "@chainlink/contracts/abi/v0.8/ERC20.json";
import { HardhatRuntimeEnvironment } from "hardhat/types";

/** Get token balance for a given address
 * @param accountAddress the address to check
 * @param tokenAddress the token address
 *
 * @returns the token balance in human readable format
 */

export async function getTokenBalance(
  hre: HardhatRuntimeEnvironment,
  accountAddress: string,
  tokenAddress: string
) {
  const { ethers } = hre;
  const { provider } = ethers;

  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  const decimals = await tokenContract.decimals();
  const symbol = await tokenContract.symbol();
  const rawBalance = await tokenContract.balanceOf(accountAddress);
  const formattedBalance = ethers.utils.formatUnits(rawBalance, decimals);

  // prettier-ignore
  console.log((`Address: ${accountAddress} has ${formattedBalance} ${symbol}`));

  return formattedBalance;
}

task("get-token-balance", "Gets the token balance for a given address")
  .addParam("account", "The account's address")
  .addParam("token", "The token's contract address")
  .setAction(async (taskArgs, hre) => {
    await getTokenBalance(hre, taskArgs.account, taskArgs.token);
  });
