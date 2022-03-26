import { InjectedConnector } from "@web3-react/injected-connector";
import { WalletConnectConnector } from "@web3-react/walletconnect-connector";

// Connect wallet
const suportIds = [1,3,4,5]
const WALLETCONNECT_BRIDGE_URL = "https://bridge.walletconnect.org";
const INFURA_KEY = "10df728faa6e46bea492bea63eaba945";
const NETWORK_URLS = {
  1: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
  4: `https://rinkeby.infura.io/v3/${INFURA_KEY}`,
  5: `https://goerli.infura.io/v3/${INFURA_KEY}`,
};
export const injected = new InjectedConnector({ supportedChainIds: suportIds });
export const walletConnect = new WalletConnectConnector({
  supportedChainIds: [1, 4, 5],
  rpc: NETWORK_URLS,
  bridge: WALLETCONNECT_BRIDGE_URL,
  qrcode: true,
});

// Address
export const SC_WETH = "0xc778417E063141139Fce010982780140Aa0cD5Ab";
export const SC_MasterChef = "0x9da687e88b0A807e57f1913bCD31D56c49C872c2";
export const SC_DD2 = "0xb1745657CB84c370DD0Db200a626d06b28cc5872";
export const SC_MULTICALL = "0x42ad527de7d4e9d9d011ac45b31d8551f8fe9821";

// Chain
export const CHAIN_LIST = {
  1: "Ethereum",
  2: "Morden (disused), Expanse mainnet",
  3: "Ropsten",
  4: "Rinkeby",
  5: "Goerli",
};
