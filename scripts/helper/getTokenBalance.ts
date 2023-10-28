import hre from "hardhat";
import chalk from "chalk";

/** Get token balance for a given address
 *
 */

async function main() {
  const { ethers } = hre;
  const { provider } = ethers;

  const usdcContract = new ethers.Contract(
    "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    ["function balanceOf(address account) external view returns (uint256)"],
    provider
  );

  const balance = await usdcContract.balanceOf(
    "0xe0e05fD63F068c552E4D58615119A2D1700EB95D"
  );
  // prettier-ignore
  console.log(chalk.cyan(`Balance: ${ethers.utils.formatUnits(balance,6)}`));
}

main().catch((error) => {
  console.error(error);
});
