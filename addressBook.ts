interface IAddressBook {
  name: string;
  chainlink: {
    priceFeedAddress: {
      ETH_USD: string;
    };
  };
  uniswap: {
    V3_SWAP_ROUTER: string;
  };
  tokenAddress: {
    USDC: string;
    WBTC: string;
    WETH: string;
    RETH: string;
    LINK: string;
  };
}

// Lookup contract address by chainId
const addressBook: { [key: number]: IAddressBook } = {
  1: {
    name: "mainnet",
    chainlink: {
      priceFeedAddress: {
        ETH_USD: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
      },
    },
    uniswap: {
      V3_SWAP_ROUTER: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
    },
    tokenAddress: {
      WBTC: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
      WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      RETH: "0xae78736Cd615f374D3085123A210448E74Fc6393",
      USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      LINK: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    },
  },
  42161: {
    name: "arbitrum",
    chainlink: {
      priceFeedAddress: {
        ETH_USD: "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612",
      },
    },
    uniswap: {
      V3_SWAP_ROUTER: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
    },
    tokenAddress: {
      WBTC: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",
      WETH: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
      RETH: "0xEC70Dcb4A1EFa46b8F2D97C310C9c4790ba5ffA8",
      USDC: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      LINK: "0xf97f4df75117a78c1A5a0DBb814Af92458539FB4",
    },
  },
};

export { addressBook, IAddressBook };
