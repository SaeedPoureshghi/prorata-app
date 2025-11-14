import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { createWalletClient, custom, publicActions } from "viem";
import { bscTestnet } from "viem/chains";
import WalletList from "./components/WalletsList";
import WalletDetails from "./components/WalletDetails";
import CreateInstantWalletModal from "./components/modal/CreateInstantWalletModal";

function App() {
  const [address, setAddress] = useState("");
  const [selected, setSelected] = useState();
  const [showDisconnectMenu, setShowDisconnectMenu] = useState(false);
  const [showCreateWalletModal, setShowCreateWalletModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const walletClient = useMemo(
    () =>
      createWalletClient({
        chain: bscTestnet,
        transport: custom(window.ethereum!),
      }).extend(publicActions),
    []
  );

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

  const disconnectWallet = async () => {
    try {
      const ethereum = window.ethereum;
      if (ethereum) {
        // Attempt to revoke permissions from MetaMask
        // Note: Some wallets may not support this, so we handle errors gracefully
        await ethereum.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        });
      }
    } catch (error) {
      // If revoke fails (e.g., not supported), still disconnect locally
      // User can manually disconnect from MetaMask's connected sites if needed
      console.error("Error revoking permissions:", error);
    } finally {
      setSelected(undefined);
      setAddress("");
      setShowDisconnectMenu(false);
    }
  };

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

  const handleOpenCreateWalletModal = () => {
    setShowCreateWalletModal(true);
  };

  const handleCloseCreateWalletModal = () => {
    setShowCreateWalletModal(false);
  };

  const handleWalletCreated = () => {
    // Trigger refresh of wallet list
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900 font-poppins">
      <div className="flex min-h-dvh w-full flex-col px-6 py-8">
        <header className="flex items-center justify-between py-4 px-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-600" />
            <div className="text-lg font-semibold tracking-tight">
              ProRata Wallet
              <span className="ml-2 rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 align-middle">
                Testnet
              </span>
            </div>
          </div>
          <div className="relative">
            {address ? (
              <div>
                <button
                  type="button"
                  onClick={() => setShowDisconnectMenu(!showDisconnectMenu)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                  title={address}
                >
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                  {truncated(address)}
                  <svg
                    className={`h-4 w-4 transition-transform ${
                      showDisconnectMenu ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {showDisconnectMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowDisconnectMenu(false)}
                    />
                    <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-slate-200 bg-white shadow-lg">
                      <div className="py-1">
                        <button
                          type="button"
                          onClick={disconnectWallet}
                          className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                        >
                          <div className="flex items-center gap-2">
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                              />
                            </svg>
                            Disconnect
                          </div>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
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
          <main className="flex-1 flex flex-col min-h-0 w-full">
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-[400px_1fr] xl:grid-cols-[450px_1fr] gap-6 min-h-0 w-full px-2">
              {/* Wallet List Section */}
              <div className="flex flex-col min-h-0 w-full">
                <div className="rounded-xl border border-slate-200 bg-white p-6 flex-1 flex flex-col min-h-0">
                  <WalletList
                    key={refreshKey}
                    client={walletClient}
                    account={address}
                    refreshTrigger={refreshKey}
                    selected={selected as string | undefined}
                    setSelected={
                      setSelected as React.Dispatch<
                        React.SetStateAction<string | undefined>
                      >
                    }
                    onCreateWallet={handleOpenCreateWalletModal}
                  />
                </div>
              </div>

              {/* Wallet Details Section */}
              <div className="flex flex-col min-h-0 w-full">
                {selected ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-6 flex-1 flex flex-col min-h-0 shadow-sm">
                    <WalletDetails
                      client={walletClient}
                      address={selected as string}
                      account={address}
                      onClose={() => setSelected(undefined)}
                    />
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-200 flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      </div>
                      <div className="text-lg font-semibold text-slate-600 mb-2">
                        No Wallet Selected
                      </div>
                      <div className="text-sm text-slate-500">
                        Select a wallet from the list to view details
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        )}

        {/* Create Wallet Modal */}
        {address && (
          <CreateInstantWalletModal
            isOpen={showCreateWalletModal}
            onClose={handleCloseCreateWalletModal}
            walletClient={walletClient}
            account={address}
            onSuccess={handleWalletCreated}
          />
        )}
      </div>
    </div>
  );
}

export default App;
