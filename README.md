# 📜 Etherscript

A collection of useful scripts for interacting with EVM compatible blockchains from the command line

- [Environment Variable Management](#environment-variable-management)
  - [Usage](#usage)
- [Hardhat Guide](#hardhat-guide)
  - [Scripts](#scripts)
  - [Tasks](#tasks)
- [Script Glossary](#script-glossary)
  - [smart-swap](#smart-swap)
  - [get-price](#get-price)
  - [get-abi](#get-abi)

## Environment Variable Management

This repository uses the NPM package `@chainlink/env-enc` to keep private keys, RPC URLs, and other secrets encrypted at rest. This helps reduce the risk of leaking your private key.

By default, the `@chainlink/env-enc` package will store your encrypted environment variables in a file named `.env.enc` in the root directory of this repository. Ensure that your .gitignore file includes`.env.enc`

### Usage

Set the encryption password by running the command

```
npx env-enc set-pw
```

Set a new environment variable by running the command

```
npx env-enc set
```

See all your currently set environment variables

```
npx env-enc view
```

Remove an environment variable

```
npx env-enc remove SOME_ENV_VAR_NAME
```

## Hardhat Guide

- `hardhat.config.ts` specifies the settings like imports, networks, solidity verions, etc that will all be made available through the hre (hardhat runtime environment)

- all scripts and tasks are by default executed on the local hardhat network, but can be configured to run on other networks by passing the `--network` flag .i.e. `yarn hardhat NAME_OF_TASK --network arbitrum`

### Scripts

- good for executing code that doesnt require parameters

```
yarn hardhat run scripts/PATH_TO_SCRIPT.ts
```

### Tasks

- good for executing scripts that require parameters passed on the command line
- to see all availalble tasks run `yarn hardhat`
- to see which flags you need to pass run `yarn hardhat NAME_OF_TASK --help`
- not allowed to import hre into scripts that are imported and used by tasks

```
yarn hardhat NAME_OF_TASK --NAME_OF_FLAG VALUE_OF_FLAG
```

## Script Glossary

### smart-swap

Swap tokens using the uniswap sdk that leverages the smart order router to compute optimal routes and execute swaps.

##### Required flags

| Parameter | Description                                       |
| --------- | ------------------------------------------------- |
| `amount`  | The human readable amount of the token to swap in |
| `in`      | The symbol of the token to swap in                |
| `out`     | The symbol of the token to swap out               |

##### Example usage

Execute a swap on the local hardhat network that is configured as fork of arbitrum

```
yarn hardhat swap --in USDC --amount 100 --out rETH
```

### get-abi

Fetches abi from etherscan API and outputs the result to a .json file inside the `./abis` directory

##### Required flags

| Parameter   | Description                                                   |
| ----------- | ------------------------------------------------------------- |
| `contract`  | The target contract address (must be verified on etherscan)   |
| `file-name` | The name for the file that will be output into abis directory |

##### Example usage

```
yarn hardhat get-abi --contract 0x514910771AF9Ca656af840dff83E8264EcF986CA --file-name link-token-abi --network mainnet
```

### get-price

Gets the price for a base asset in terms of a quote asset using chainlink price feeds

##### Required flags

| Parameter  | Description                               |
| ---------- | ----------------------------------------- |
| `contract` | The chainlink price feed contract address |

##### Example usage

Fetch the price of ETH in USD on mainnet

```
yarn hardhat get-price --contract 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419 --network mainnet
```
