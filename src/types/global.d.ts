import type { EIP1193Provider, PublicClient } from "viem";

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }

  interface Wallets {
    client: PublicClient;
    account?: string;
    selected?: string;
    setSelected?: React.Dispatch<React.SetStateAction<string | undefined>>;
    onCreateWallet?: () => void | Promise<void>;
    refreshTrigger?: number;
  }
  interface Wallet {
    _name: string;
    _address: string;
    _type: string;
    _isShared?: boolean;
  }
  interface WalletDetail {
    _name: string;
    _list: string[];
    _percent: number[];
    _status: boolean;
    _total: number;
  }
  interface Transaction {
    _from: string;
    _to: string;
    _side: string;
    _amount: bigint;
  }
}

export {};
