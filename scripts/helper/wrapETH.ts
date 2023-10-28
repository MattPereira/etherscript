import hre from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { networkConfig } from "../../hardhat-helper-config";

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

  console.log(`Wrapping ${amount} ETH...`);
  const wethContract = new ethers.Contract(
    networkConfig[chainId].tokenAddress.WETH,
    WETH_ABI,
    signer
  );

  const wrapTx = await wethContract.deposit({
    value: ethers.utils.parseEther(amount),
  });
  await wrapTx.wait();

  const wethBalance = await wethContract.balanceOf(signer.address);

  console.log(
    `Wrapped ${amount} ETH into ${ethers.utils.formatUnits(
      wethBalance,
      18
    )} WETH`
  );
}
