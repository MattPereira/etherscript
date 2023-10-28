import hre from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { networkConfig } from "../../hardhat-helper-config";
import chalk from "chalk";
const { ethers } = hre;

export const WETH_ABI = [
  // Wrap ETH
  "function deposit() payable",

  // Unwrap ETH
  "function withdraw(uint wad) public",

  // get WETH balance
  "function balanceOf(address owner) view returns (uint256)",
];

export async function wrapETH(signer: SignerWithAddress, amount: string) {
  const network = await hre.ethers.provider.getNetwork();
  const chainId = network.chainId;

  const wethContract = new ethers.Contract(
    networkConfig[chainId].tokenAddress.WETH,
    WETH_ABI,
    signer
  );

  console.log(`Wrapping ${amount} ETH...`);
  const depositTx = await wethContract.deposit({
    value: ethers.utils.parseEther(amount),
  });
  console.log(
    "Waiting for depositTx confirmation... \n",
    chalk.blue(depositTx.hash)
  );
  await depositTx.wait();

  const wethBalance = await wethContract.balanceOf(signer.address);

  console.log(
    chalk.yellow(
      `Wrapped ${amount} ETH into ${ethers.utils.formatUnits(
        wethBalance,
        18
      )} WETH`
    )
  );
}
