interface NetworkConfigEntryTypes {
  name: string;
  chainlink?: {
    priceFeedAddresses: {
      BTC_ETH: string;
      ETH_USD: string;
      LINK_USD: string;
    };
  };
  uniswap?: {
    V3_SWAP_ROUTER_ADDRESS: string;
  };
  tokenAddress: {
    WETH: string;
    USDC: string;
  };
}

/**
 * using ARB addresses for localhost cus thats my fork target
 */
const networkConfig: { [key: number]: NetworkConfigEntryTypes } = {
  31337: {
    name: "localhost",
    uniswap: {
      V3_SWAP_ROUTER_ADDRESS: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
    },
    tokenAddress: {
      WETH: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
      USDC: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    },
  },
  42161: {
    name: "arbitrum",
    uniswap: {
      V3_SWAP_ROUTER_ADDRESS: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
    },
    tokenAddress: {
      WETH: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
      USDC: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    },
  },
};

export { networkConfig };
