import AggregatorV3InterfaceABI from "@chainlink/contracts/abi/v0.8/AggregatorV3Interface.json";
import hre from "hardhat";
import { networkConfig } from "../../hardhat-helper-config";
import chalk from "chalk";

/** Get prices from chainlink price feed aggregator denominated in USD
 *
 * @docs https://docs.chain.link/data-feeds/price-feeds/addresses
 * @docs https://data.chain.link/ethereum/mainnet/crypto-usd/eth-usd
 *
 * @dev ONLY WORKS ON SEPOLIA AND MAINNET
 * @run hh run scripts/get-prices.ts --network mainnet
 * @run hh run scripts/get-prices.ts --network sepolia
 *
 */

async function main() {
  const { ethers } = hre;
  const { provider } = ethers;
  // const signer = (await ethers.getSigners())[0];

  //dynamically get chainId
  const chainId = await ethers.provider
    .getNetwork()
    .then((network) => Number(network.chainId));

  // look up price feed addresses in hardhat-helper-config networkConfig mapping
  const { priceFeedAddresses } = networkConfig[chainId];

  const btcContract = new ethers.Contract(
    priceFeedAddresses.BTC_ETH,
    AggregatorV3InterfaceABI,
    provider
  );

  const ethContract = new ethers.Contract(
    priceFeedAddresses.ETH_USD,
    AggregatorV3InterfaceABI,
    provider
  );

  const linkContract = new ethers.Contract(
    priceFeedAddresses.LINK_USD,
    AggregatorV3InterfaceABI,
    provider
  );

  // watch out for decimals!!
  const btcData = await btcContract.latestRoundData();
  const ethData = await ethContract.latestRoundData();
  const linkData = await linkContract.latestRoundData();

  const btcDecimals = await btcContract.decimals();
  const ethDecimals = await ethContract.decimals();
  const linkDecimals = await linkContract.decimals();

  const btcUsdPrice = ethers.utils.formatUnits(btcData.answer, btcDecimals);
  const ethUsdPrice = ethers.utils.formatUnits(ethData.answer, ethDecimals);
  const linkUsdPrice = ethers.utils.formatUnits(linkData.answer, linkDecimals);

  console.log(chalk.red("BTC/USD:"), `$${btcUsdPrice}`);
  console.log(chalk.blue("ETH/USD:"), `$${ethUsdPrice}`);
  console.log(chalk.yellow("LINK/USD:"), `$${linkUsdPrice}`);
}

main().catch((error) => {
  if (
    error instanceof TypeError &&
    error.message.includes("Cannot destructure property")
  ) {
    console.error(
      chalk.red("Please include the --network flag with a configured network")
    );
  } else {
    console.error(error);
  }
});
