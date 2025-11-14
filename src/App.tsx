import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { createWalletClient, custom, publicActions, type Address } from "viem";
import { bscTestnet } from "viem/chains";
import abi from "@/contracts/ProRataFactory.json";
import Wallets from "./components/Wallets";
import WalletList from "./components/WalletsList";
import WalletDetails from "./components/WalletDetails";

function App() {
  const [address, setAddress] = useState("");
  const [selected, setSelected] = useState();

  const walletClient = useMemo(
    () =>
      createWalletClient({
        chain: bscTestnet,
        transport: custom(window.ethereum!),
      }).extend(publicActions),
    []
  );

  //   const client = useMemo(
  //  () =>
  //   createPublicClient({
  //     chain: bscTestnet,
  //     transport: custom(window.ethereum!),
  //   })
  //  ,[]
  //   )

  // const UserWalletsCount = async () => {
  //   const wallets_count = await walletClient.readContract({
  //     address: abi.networks["97"].address as `0x${string}`,
  //     abi: abi.abi,
  //     functionName: "getUserWalletsCount",
  //   });

  //   return <div>{wallets_count as React.ReactNode}</div>;
  // };

  const connectWallet = async () => {
    try {
      const ethereum = window.ethereum;
      if (!ethereum) return;
      const chainIdHex: string = await ethereum.request({
        method: "eth_chainId",
      });
      void parseInt(chainIdHex, 16);
      const accounts = await walletClient.requestAddresses();
      setAddress(accounts[0] ?? "");
    } catch {
      // ignore
    }
  };

  const truncated = (addr: string) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

  useEffect(() => {
    const ethereum = window.ethereum;
    if (!ethereum) return;
    const checkConnection = async () => {
      try {
        const accounts: string[] = await ethereum.request({
          method: "eth_accounts",
        });
        setAddress(accounts?.[0] ?? "");
      } catch {
        // ignore
      }
    };
    checkConnection();
  }, []);

  useEffect(() => {
    const ethereum = window.ethereum;
    if (!ethereum?.on) return;
    const handleAccountsChanged = (accounts: string[]) =>
      setAddress(accounts?.[0] ?? "");
    const handleDisconnect = () => setAddress("");

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleChainChanged = (_chainIdHex: string) => {
      // no-op for now
    };
    ethereum.on("accountsChanged", handleAccountsChanged);
    ethereum.on("disconnect", handleDisconnect);
    ethereum.on("chainChanged", handleChainChanged);
    return () => {
      if (!ethereum?.removeListener) return;
      ethereum.removeListener("accountsChanged", handleAccountsChanged);
      ethereum.removeListener("disconnect", handleDisconnect);
      ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  const createInstantWallet = async () => {
    const { request } = await walletClient.simulateContract({
      address: abi.networks["97"].address as `0x${string}`,
      abi: abi.abi,
      functionName: "createInstantWallet",
      args: [
        [
          "0xDae6DC89541e9179EB8eDa47f3aBcC10C5bfB1D2",
          "0x76e6B9d92007055e8BFa9893346b03D335d58e3B",
        ],
        ["10", "90"],
        "Test Wallet",
      ],
      account: address as Address,
    });

    const resp = await walletClient.writeContractSync(request);
    console.log(resp);
  };

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900 font-poppins">
      <div className="mx-auto flex min-h-dvh w-full max-w-[900px] flex-col px-4 py-8">
        <header className="flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-600" />
            <div className="text-lg font-semibold tracking-tight">
              ProRata Wallet
            </div>
          </div>
          <div>
            {address ? (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm"
                title={address}
              >
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                {truncated(address)}
              </button>
            ) : (
              <button
                type="button"
                onClick={connectWallet}
                className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </header>

        {!address ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <div className="mb-3 text-xl font-semibold text-slate-800">
                Welcome to ProRata Wallet
              </div>
              <div className="mb-4 text-base text-slate-600">
                ProRata is a sharing wallet: collaborate with others to manage
                and share assets seamlessly, transparently, and securely.
              </div>
            </div>
          </div>
        ) : (
          <main className="flex-1 space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-xs text-slate-500">Total Balance</div>
                <div className="mt-1 text-2xl font-semibold tracking-tight">
                  —
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-xs text-slate-500">Wallets</div>
                <div className="mt-1 text-2xl font-semibold tracking-tight">
                  <Wallets client={walletClient} />
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-xs text-slate-500">Network</div>
                <div className="mt-1 text-2xl font-semibold tracking-tight">
                  {bscTestnet.name}
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold">Recent Activity</div>
              <div className="mt-2 text-sm text-slate-500">
                No recent activity.
              </div>
              <button
                type="button"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                onClick={() => {
                  createInstantWallet();
                }}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create New Instant Wallet
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <WalletList
                client={walletClient}
                account={address}
                setSelected={
                  setSelected as React.Dispatch<
                    React.SetStateAction<string | undefined>
                  >
                }
              />
              {selected && (
                <WalletDetails
                  client={walletClient}
                  address={selected as string}
                  account={address}
                />
              )}
            </div>
          </main>
        )}
      </div>
    </div>
  );
}

export default App;
