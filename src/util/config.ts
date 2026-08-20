export const baseUrl = "https://test.addaiaroot.com/";
export const redirectUrl = "https://testapp.addaiaroot.com";
export const aiUrl = "https://testapi.addaiaroot.com/";
export const siteKey = "6LdALkssAAAAAAB9dLSGTM-vNEyMAMEXLEfi-UhF";

// export const baseUrl = "https://api.moegen.ai/";
// export const redirectUrl = "https://www.moegen.ai";
// export const aiUrl = "https://api2.moegen.ai/";

// Chain environment: true = testnet, false = mainnet
export const IS_TESTNET = true;

// BSC Testnet
export const BSC_TESTNET_CHAIN_ID = '0x61';
export const BSC_TESTNET_CHAIN_ID_DECIMAL = 97;
export const BSC_TESTNET_RPC_URL = 'https://data-seed-prebsc-1-s1.bnbchain.org:8545';
export const BSC_TESTNET_CHAIN_NAME = 'BSC Testnet';
export const BSC_TESTNET_BLOCK_EXPLORER_URL = 'https://testnet.bscscan.com';
export const BSC_TESTNET_NATIVE_CURRENCY = { name: 'tBNB', symbol: 'tBNB', decimals: 18 };

// BSC Mainnet
export const BSC_MAINNET_CHAIN_ID = '0x38';
export const BSC_MAINNET_CHAIN_ID_DECIMAL = 56;
export const BSC_MAINNET_RPC_URL = 'https://bsc-dataseed.bnbchain.org';
export const BSC_MAINNET_CHAIN_NAME = 'BSC Mainnet';
export const BSC_MAINNET_BLOCK_EXPLORER_URL = 'https://bscscan.com';
export const BSC_MAINNET_NATIVE_CURRENCY = { name: 'BNB', symbol: 'BNB', decimals: 18 };

// Active chain config (switches based on IS_TESTNET)
export const ACTIVE_CHAIN_ID = IS_TESTNET ? BSC_TESTNET_CHAIN_ID : BSC_MAINNET_CHAIN_ID;
export const ACTIVE_CHAIN_ID_DECIMAL = IS_TESTNET ? BSC_TESTNET_CHAIN_ID_DECIMAL : BSC_MAINNET_CHAIN_ID_DECIMAL;
export const ACTIVE_RPC_URL = IS_TESTNET ? BSC_TESTNET_RPC_URL : BSC_MAINNET_RPC_URL;
export const ACTIVE_CHAIN_NAME = IS_TESTNET ? BSC_TESTNET_CHAIN_NAME : BSC_MAINNET_CHAIN_NAME;
export const ACTIVE_BLOCK_EXPLORER_URL = IS_TESTNET ? BSC_TESTNET_BLOCK_EXPLORER_URL : BSC_MAINNET_BLOCK_EXPLORER_URL;

export const ACTIVE_CHAIN_PARAMS = {
  chainId: ACTIVE_CHAIN_ID,
  chainName: ACTIVE_CHAIN_NAME,
  nativeCurrency: IS_TESTNET ? BSC_TESTNET_NATIVE_CURRENCY : BSC_MAINNET_NATIVE_CURRENCY,
  rpcUrls: [ACTIVE_RPC_URL],
  blockExplorerUrls: [ACTIVE_BLOCK_EXPLORER_URL],
};

export const PAY_NETWORK = ACTIVE_CHAIN_NAME;

// USDT contract address (testnet uses test USDT, mainnet uses real USDT on BSC)
export const USDT_CONTRACT_ADDRESS = IS_TESTNET
  ? '0x2C008b46924B1eE48BD17f44E23b888568335A52'
  : '0x55d398326f99059fF775485246999027B3197955';

export const SUBSCRIPTION_RECEIVER_ADDRESS = '0xc4daDFc58295ce8C6f5B974E2b86BC8497cb87f6';
export const WALLETCONNECT_PROJECT_ID = '363499d6898a66a994cc34a96b530d68';
