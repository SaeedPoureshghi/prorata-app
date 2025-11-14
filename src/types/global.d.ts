import type { EIP1193Provider, PublicClient } from "viem";

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }

  interface Wallets {
    client: PublicClient;
    account?: string;
    setSelected?: React.Dispatch<React.SetStateAction<string | undefined>>;
  }
  interface Wallet {
    _name: string;
    _address: string;
    _type: string;
  }
  interface WalletDetail {
    _name: string;
    _list: string[];
    _percent: number[];
    _status: boolean;
    _total: number;
  }
}

export {};
