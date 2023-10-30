import { HardhatRuntimeEnvironment } from "hardhat/types";
import chalk from "chalk";

/**
 *  Logs the tx hash to the console
 * @param txHash the transaction hash
 * @param hre hardhat runtime environment
 *
 * @notice if not on local network, logs link to scanner
 */

export async function logTxHashLink(
  txHash: string,
  hre: HardhatRuntimeEnvironment
) {
  let message;
  if (hre.network.name === "hardhat") {
    message = `txHash: ${txHash}`;
  } else {
    message = `https://arbiscan.io/tx/${txHash}`;
  }

  console.log(chalk.blue(message));
}
