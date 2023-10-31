import * as dotenv from "dotenv";
dotenv.config();
import chalk from "chalk";
import axios from "axios";
import * as fs from "fs";
import * as path from "path";

import { task } from "hardhat/config";

/** Grab abi for any contract that is verified on etherscan
 *
 * @param address the contract address
 * @param name the name for the file output to abis folder
 */
task(
  "get-abi",
  "Fetches abi from etherscan API and outputs .json to abi folder"
)
  .addParam(
    "contract",
    "The target contract address (must be verified on etherscan)"
  )
  .addParam("fileName", "The name for the file that will be output")
  .setAction(async (taskArgs, hre) => {
    const response = await axios.get(
      `https://api.etherscan.io/api?module=contract&action=getabi&address=${taskArgs.contract}&apikey=${process.env.ETHERSCAN_API_KEY}`
    );

    console.log("response", response.data);

    if (response.data.result) {
      const result: string = response.data.result;
      console.log("result", result);
      const abi = JSON.parse(result);

      // moves back one folder i.e. "../abis"
      const folderPath = path.join(__dirname, "../../", "abis");

      // Check if the folder exists, if not, create the folder
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const filePath = path.join(folderPath, taskArgs.fileName + ".json");

      // Write the JSON object to a file
      fs.writeFileSync(filePath, JSON.stringify(abi, null, 4), "utf-8");
      console.log("ABI has been written to contractABI.json");
    } else {
      console.log(chalk.red("Error in fetching ABI"));
      console.log(response.data);
    }
  });
