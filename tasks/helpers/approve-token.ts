import chalk from "chalk";
import ERC20_ABI from "@chainlink/contracts/abi/v0.8/ERC20.json";
import { getPrice } from "../helpers";
import { logTxHashLink } from "../../utils";
import { HardhatRuntimeEnvironment } from "hardhat/types";

/** Approve token for spending by third party
 * @param tokenAddress the token address
 * @param spenderAddress the address of the third party
 * @param amount the amount to approve in human readable format
 */

export async function approveToken(
  tokenAddress: string,
  spenderAddress: string,
  amount: string,
  hre: HardhatRuntimeEnvironment
) {
  const { ethers } = hre;
  const signer = (await hre.ethers.getSigners())[0];

  console.log("Approving token transfer...");
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
  const decimals = await tokenContract.decimals();
  const rawAmount = ethers.utils.parseUnits(amount, decimals);

  const approveTx = await tokenContract.approve(spenderAddress, rawAmount);
  logTxHashLink(approveTx.hash, hre);

  const approveTxReceipt = await approveTx.wait();
  if (approveTxReceipt.status !== 1) {
    throw new Error("Transfer approval failed");
  }

  const { effectiveGasPrice, cumulativeGasUsed, gasUsed } = approveTxReceipt;
  const gasSpentWei = gasUsed.mul(effectiveGasPrice);
  // using the ETH/USD price feed from the chainlink contract deployed on arbitrum?
  const usdPrice = await getPrice(
    hre,
    "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612"
  );

  const usdSpent = +usdPrice * +ethers.utils.formatEther(gasSpentWei);

  console.log("Spent" + " $" + usdSpent.toFixed(2) + " on gas");

  const allowance = await tokenContract.allowance(
    signer.address,
    spenderAddress
  );
  const symbol = await tokenContract.symbol();
  // prettier-ignore
  console.log(chalk.green(`Approved ${spenderAddress} to spend ${ethers.utils.formatUnits(allowance, decimals)} ${symbol}`));
}
