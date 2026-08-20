import i18n from '@/lang/i18n';
import { toast } from '@/util/toast';
import BigNumber from 'bignumber.js';
import { ACTIVE_CHAIN_ID, ACTIVE_CHAIN_NAME, USDT_CONTRACT_ADDRESS } from '@/util/config';

export function getWalletProvider(walletId: string): any {
  const w = window as any;
  switch (walletId) {
    case 'metamask':
      return w.ethereum || null;
    case 'okx':
      return w.okxwallet || null;
    case 'phantom':
      return w.phantom?.ethereum || null;
    default:
      return null;
  }
}

export async function ensureChain(provider: any): Promise<boolean> {
  const t = i18n.global.t as (key: string, named?: Record<string, unknown>) => string;

  try {
    const currentChainId = await provider.request({ method: 'eth_chainId' });

    if (currentChainId === ACTIVE_CHAIN_ID) {
      return true;
    }

    toast(t('subscribe.switchingChain', { network: ACTIVE_CHAIN_NAME }));

    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ACTIVE_CHAIN_ID }],
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      const newChainId = await provider.request({ method: 'eth_chainId' });
      if (newChainId !== ACTIVE_CHAIN_ID) {
        console.error('[ensureChain] Chain did not switch. Expected:', ACTIVE_CHAIN_ID, 'Got:', newChainId);
        toast(t('subscribe.switchChainFailed'));
        return false;
      }

      return true;
    } catch (switchError: any) {
      if (switchError.code === 4001) {
        toast(t('subscribe.chainSwitchRejected'));
        return false;
      }
      console.error('[ensureChain] Failed to switch chain:', switchError);
      toast(t('subscribe.switchChainFailed'));
      return false;
    }
  } catch (error: any) {
    console.error('[ensureChain] Failed to get chain ID:', error);
    toast(t('subscribe.switchChainFailed'));
    return false;
  }
}

export async function checkUsdtBalance(provider: any, account: string, amount: string): Promise<boolean> {
  const t = i18n.global.t as (key: string, named?: Record<string, unknown>) => string;

  const BALANCE_OF_SELECTOR = '0x70a08231';
  const DECIMALS_SELECTOR = '0x313ce567';
  const paddedAddress = account.toLowerCase().replace(/^0x/, '').padStart(64, '0');

  try {
    const currentChainId = await provider.request({ method: 'eth_chainId' });
    console.log('[checkUsdtBalance] currentChainId:', currentChainId, 'expected:', ACTIVE_CHAIN_ID);
    if (currentChainId !== ACTIVE_CHAIN_ID) {
      console.error('[checkUsdtBalance] Not on target chain, aborting');
      toast(t('subscribe.switchChainFailed'));
      return false;
    }

    const decimalsHex = await provider.request({
      method: 'eth_call',
      params: [{ to: USDT_CONTRACT_ADDRESS, data: DECIMALS_SELECTOR }, 'latest'],
    });
    const decimals = parseInt(decimalsHex, 16);
    if (isNaN(decimals)) {
      console.error('[checkUsdtBalance] Failed to parse decimals:', decimalsHex);
      toast(t('subscribe.insufficientUsdtBalance', { network: ACTIVE_CHAIN_NAME }));
      return false;
    }

    const balanceHex = await provider.request({
      method: 'eth_call',
      params: [{ to: USDT_CONTRACT_ADDRESS, data: BALANCE_OF_SELECTOR + paddedAddress }, 'latest'],
    });
    const balance = new BigNumber(balanceHex);
    if (balance.isNaN()) {
      console.error('[checkUsdtBalance] Failed to parse balance:', balanceHex);
      toast(t('subscribe.insufficientUsdtBalance', { network: ACTIVE_CHAIN_NAME }));
      return false;
    }

    const needAmount = new BigNumber(amount).times(new BigNumber(10).pow(decimals));

    console.log('[checkUsdtBalance] balance:', balance.toString(), 'needAmount:', needAmount.toString(), 'decimals:', decimals, 'account:', account);

    if (balance.isLessThan(needAmount)) {
      toast(t('subscribe.insufficientUsdtBalance', { network: ACTIVE_CHAIN_NAME }));
      return false;
    }
    return true;
  } catch (error: any) {
    console.error('[checkUsdtBalance] Failed to check USDT balance:', error);
    toast(t('subscribe.insufficientUsdtBalance', { network: ACTIVE_CHAIN_NAME }));
    return false;
  }
}
