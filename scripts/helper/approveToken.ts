import hre from "hardhat";
import chalk from "chalk";
import ERC20_ABI from "@chainlink/contracts/abi/v0.8/ERC20.json";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

/** Approve token for spending by third party
 * @param tokenAddress the token address
 * @param spenderAddress the address of the third party
 * @param amount the amount to approve in human readable format
 * @param signer the signer of the approval transaction
 */

export async function approveToken(
  tokenAddress: string,
  spenderAddress: string,
  amount: string,
  signer: SignerWithAddress
) {
  const { ethers } = hre;
  console.log("Approving token transfer...");

  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
  const decimals = await tokenContract.decimals();
  const rawAmount = ethers.utils.parseUnits(amount, decimals);

  const approveTx = await tokenContract.approve(spenderAddress, rawAmount);
  console.log("txHash", chalk.blue(approveTx.hash));
  const approveTxReceipt = await approveTx.wait();
  if (approveTxReceipt.status !== 1) {
    throw new Error("Transfer approval failed");
  }
  const { effectiveGasPrice, cumulativeGasUsed } = approveTxReceipt;
  const gasSpent = cumulativeGasUsed.mul(effectiveGasPrice);
  console.log("Gas spent:", chalk.red(gasSpent.toString()));

  const allowance = await tokenContract.allowance(
    signer.address,
    spenderAddress
  );
  const symbol = await tokenContract.symbol();
  // prettier-ignore
  console.log((`Approved ${spenderAddress} to spend ${ethers.utils.formatUnits(allowance, decimals)} ${symbol}`));
}
