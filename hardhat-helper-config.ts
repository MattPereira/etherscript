interface NetworkConfigEntryTypes {
  name: string;
  priceFeedAddresses: {
    BTC_ETH: string;
    ETH_USD: string;
    LINK_USD: string;
  };
}

const networkConfig: { [key: number]: NetworkConfigEntryTypes } = {
  11155111: {
    name: "sepolia",
    priceFeedAddresses: {
      BTC_ETH: "0x5fb1616F78dA7aFC9FF79e0371741a747D2a7F22",
      ETH_USD: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
      LINK_USD: "0xc59E3633BAAC79493d908e63626716e204A45EdF",
    },
  },
  1: {
    name: "mainnet",
    priceFeedAddresses: {
      BTC_ETH: "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      ETH_USD: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
      LINK_USD: "0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c",
    },
  },
};

export { networkConfig };
