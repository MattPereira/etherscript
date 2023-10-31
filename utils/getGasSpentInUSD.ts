import { TransactionReceipt } from "@ethersproject/providers";
import { getPrice } from "../tasks/helpers";
import { addressBook } from "../addressBook";
import { ChainId } from "@uniswap/sdk-core";
import { HardhatRuntimeEnvironment } from "hardhat/types";

/** Get the amount of gas spent on a transaction
 *
 * @param txReceipt the transaction receipt object from ethers
 *
 * @returns the gas cost of transaction in USD as string, e.g. "$1.99"
 */

export async function getGasSpentInUSD(
  txReceipt: TransactionReceipt,
  hre: HardhatRuntimeEnvironment
) {
  const { ethers } = hre;
  const { effectiveGasPrice, gasUsed } = txReceipt;

  const gasSpentWei = gasUsed.mul(effectiveGasPrice);

  // gas is always paid in ETH
  const usdPrice = await getPrice(
    hre,
    addressBook[ChainId.MAINNET].chainlink?.priceFeedAddress.ETH_USD!
  );

  const usdSpent = +usdPrice * +ethers.utils.formatEther(gasSpentWei);

  return `$${usdSpent.toFixed(2)}`;
}
