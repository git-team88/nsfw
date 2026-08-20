import { EthereumProvider } from '@walletconnect/ethereum-provider';
import { WALLETCONNECT_PROJECT_ID, ACTIVE_CHAIN_ID_DECIMAL, ACTIVE_RPC_URL } from '@/util/config';

let wcProvider: InstanceType<typeof EthereumProvider> | null = null;

async function destroyProvider() {
  if (!wcProvider) return;
  try {
    await wcProvider.disconnect();
  } catch {}
  wcProvider = null;
}

function createProviderOpts() {
  return {
    projectId: WALLETCONNECT_PROJECT_ID,
    chains: [ACTIVE_CHAIN_ID_DECIMAL],
    optionalChains: [ACTIVE_CHAIN_ID_DECIMAL] as [number, ...number[]],
    methods: ['eth_sendTransaction', 'eth_sign', 'personal_sign', 'eth_signTypedData', 'eth_signTypedData_v4', 'eth_call', 'eth_estimateGas'],
    events: ['chainChanged', 'accountsChanged'],
    rpcMap: {
      [ACTIVE_CHAIN_ID_DECIMAL]: ACTIVE_RPC_URL,
    },
    showQrModal: true,
    metadata: {
      name: 'Moegen',
      description: 'Moegen Platform',
      url: window.location.origin,
      icons: [window.location.origin + '/favicon.ico'],
    },
  };
}

export async function connectWalletConnect(): Promise<string[]> {
  await destroyProvider();

  const provider = await EthereumProvider.init(createProviderOpts());
  wcProvider = provider;

  try {
    await provider.connect({
      chains: [ACTIVE_CHAIN_ID_DECIMAL],
    });
    const accounts = await provider.request<string[]>({ method: 'eth_requestAccounts' });
    return accounts;
  } catch (error) {
    await destroyProvider();
    throw error;
  }
}

export function getWalletConnectProvider(): any {
  return wcProvider;
}
