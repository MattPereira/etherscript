import chalk from "chalk";
import ERC20_ABI from "@chainlink/contracts/abi/v0.8/ERC20.json";
import { logTxHashLink } from "../../utils";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getGasSpentInUSD } from "../../utils/getGasSpentInUSD";

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

  const gasSpentInUSD = await getGasSpentInUSD(approveTxReceipt, hre);

  const allowance = await tokenContract.allowance(
    signer.address,
    spenderAddress
  );
  const symbol = await tokenContract.symbol();
  // prettier-ignore
  console.log(chalk.green(`Approved ${spenderAddress} to spend ${ethers.utils.formatUnits(allowance, decimals)} ${symbol} using ${gasSpentInUSD} worth of gas`));
}
