### Harhdat Typescript Guide

1. Explain the hardhat runtime environment
2. Explain the hardhat config

## Scripts

- good for executing code that doesnt require parameters

```
hh run scripts/<script-name>.ts
```

## Tasks

- good for executing code that requires parameters
- must import into hardhat.config.ts to make available on command line

```
hh <task-name> <params>
```

#### Details

- Not allowed to import hre into scripts that are imported and used by tasks
