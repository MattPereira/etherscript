import hre from "hardhat";

/** use ethersjs to get suggested maxFeePerGas & maxPriorityFeePerGas */
async function main() {
  const { ethers } = hre;

  const feeData = await ethers.provider.getFeeData();

  for (const [key, value] of Object.entries(feeData)) {
    if (value !== null) {
      console.log(
        `${key}: ${value.toString()} wei`,
        `( ${ethers.utils.formatUnits(value, "gwei")} gwei )`
      );
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
