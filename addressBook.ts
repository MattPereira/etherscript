interface IAddressBook {
  name: string;
  chainlink?: {
    priceFeedAddress: {
      ETH_USD: string;
    };
  };
  uniswap?: {
    V3_SWAP_ROUTER: string;
  };
  tokenAddress?: {
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
