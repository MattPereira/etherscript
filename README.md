# 📜 Etherscript

A collection of useful scripts for interacting with EVM compatible blockchains from the command line

- [Environment Variable Management](#environment-variable-management)
  - [Usage](#usage)
- [Hardhat Guide](#hardhat-guide)
  - [Scripts](#scripts)
  - [Tasks](#tasks)
- [Script Glossary](#script-glossary)
  - [swap](#swap)

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

### Scripts

- good for executing code that doesnt require parameters

```
yarn hardhat run scripts/<path-to-script>
```

### Tasks

- good for executing scripts that require parameters passed on the command line
- not allowed to import hre into scripts that are imported and used by tasks

```
yarn hardhat <task-name> <task-params>
```

## Script Glossary

### swap

Swap tokens using the uniswap sdk that leverages the smart order router to compute optimal routes and execute swaps.

##### Required flags

| Parameter | Description                                       |
| --------- | ------------------------------------------------- |
| `amount`  | The human readable amount of the token to swap in |
| `in`      | The symbol of the token to swap in                |
| `out`     | The symbol of the token to swap out               |

##### Optional flags

| Parameter | Description                                      |
| --------- | ------------------------------------------------ |
| `network` | Which network to use (defaults to local hardhat) |

##### Example usage

```
hh swap --in USDC --amount 100 --out rETH
```

_example executes swap on the local hardhat network that is configured as fork of arbitrum_
