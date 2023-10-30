import chalk from "chalk";
import { addressBook } from "../../addressBook";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { logTxHashLink } from "../../utils/logTxHashLink";

const WETH_ABI = [
  // Wrap ETH
  "function deposit() payable",
  // Unwrap ETH
  "function withdraw(uint wad) public",
  // get WETH balance
  "function balanceOf(address owner) view returns (uint256)",
];

export async function wrapETH(hre: HardhatRuntimeEnvironment, amount: string) {
  const { ethers } = hre;

  const signer = (await ethers.getSigners())[0];
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId;

  const wethContract = new ethers.Contract(
    addressBook[chainId].tokenAddress.WETH,
    WETH_ABI,
    signer
  );

  console.log(`Wrapping ${amount} ETH...`);
  const depositTx = await wethContract.deposit({
    value: ethers.utils.parseEther(amount),
  });
  logTxHashLink(depositTx.hash, hre);
  await depositTx.wait();
  const wethBalance = await wethContract.balanceOf(signer.address);

  console.log(
    chalk.green(
      `Wrapped ${amount} ETH into ${ethers.utils.formatUnits(
        wethBalance,
        18
      )} WETH`
    )
  );
}
