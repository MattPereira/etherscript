/**
 * If you have a transaction that is stuck in the mempool,
 * you can send a dummy transaction with the same nonce and a higher gas price to clear the roadblock.
 *
 * beware that all pending transactions stacked up with higher nonces will instantly execute aftewords
 *
 */

// CONVERT TO TASK

// async function main() {
//   const { ethers } = hre;
//   const { provider } = ethers;
//   const signer = (await ethers.getSigners())[0];

//   let nonce = 305;

//   // https://docs.ethers.org/v6/api/providers/#Provider-getFeeData
//   const { maxFeePerGas, maxPriorityFeePerGas } = await provider.getFeeData();

//   const extraMaxFeePerGas = maxFeePerGas!.add(1000000000n);
//   const extraMaxPriorityFeePerGas = maxPriorityFeePerGas!.add(1000000000n);

//   const tx = {
//     to: signer.address,
//     value: ethers.utils.parseEther("0.0"),
//     nonce: nonce,
//     maxFeePerGas: extraMaxFeePerGas,
//     maxPriorityFeePerGas: extraMaxPriorityFeePerGas,
//   };

//   console.log("sending dummy tx with nonce", nonce);
//   const txResponse = await signer.sendTransaction(tx);
//   console.log("txResponse", txResponse);
//   const txReceipt = await txResponse.wait();
//   console.log("txReceipt", txReceipt);
// }

// main().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });
