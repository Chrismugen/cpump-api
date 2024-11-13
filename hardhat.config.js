require("@nomicfoundation/hardhat-verify");

module.exports = {
  solidity: {
    version:  "0.8.20",
    settings: {
      optimizer: {
        enabled: true,   // Enable the optimizer
        runs: 1 
      }
    }
  }, // specify your solidity version
  networks: {
    core: {      
      chainId: 1116,
      network: "core",
      url: "https://rpc-core-cpump.icecreamswap.com",
      // accounts: [private_key],
    },
  },
  etherscan: {
    apiKey: {
        core : process.env.SCAN_API_KEY, // Replace with your Etherscan API key
    },
    customChains: [
        {
          network: "core",
          chainId: 1116,
          urls: {
            apiURL: "https:///openapi.coredao.org/api",
            browserURL: "https://scan.coredao.org/"
          }
        }
      ]
  }
};
