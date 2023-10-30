# Etherscript

A collection of useful scripts for interacting with EVM compatible blockchains from the command line!

#### Details

- Not allowed to import hre into scripts that are imported and used by tasks

## Script Glossary

#### swap

Swap tokens using the uniswap sdk.

example usage

```
hh swap --in USDC --amount 100 --out rETH
```

## Hardhat Notes

- hardhat.config.ts specifies the settings like imports, networks, solidity verions, etc that will all be made available through the hre (hardhat runtime environment)

## Scripts Notes

- good for executing code that doesnt require parameters

```
yarn hardhat run scripts/<path-to-script>
```

## Tasks Notes

- good for executing code that requires parameters
- must import into hardhat.config.ts to make available on command line

```
yarn hardhat <task-name> <task-params>
```
