import { useEffect, useMemo, useState, Suspense, lazy } from "react";
import "./App.css";
import { createWalletClient, custom, publicActions } from "viem";
import { bscTestnet } from "viem/chains";

// Lazy load components for code splitting
const WalletList = lazy(() => import("./components/WalletsList"));
const WalletDetails = lazy(() => import("./components/WalletDetails"));
const CreateInstantWalletModal = lazy(
  () => import("./components/modal/CreateInstantWalletModal")
);

function App() {
  const [address, setAddress] = useState("");
  const [selected, setSelected] = useState();
  const [showDisconnectMenu, setShowDisconnectMenu] = useState(false);
  const [showCreateWalletModal, setShowCreateWalletModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(
    typeof window !== "undefined" && typeof window.ethereum !== "undefined"
  );

  const walletClient = useMemo(() => {
    if (typeof window === "undefined" || !window.ethereum) {
      return null;
    }
    try {
      return createWalletClient({
        chain: bscTestnet,
        transport: custom(window.ethereum),
      }).extend(publicActions);
    } catch {
      return null;
    }
  }, []);

  const connectWallet = async () => {
    try {
      const ethereum = window.ethereum;
      if (!ethereum || !walletClient) {
        setIsMetaMaskInstalled(false);
        return;
      }
      setIsMetaMaskInstalled(true);
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
    if (!ethereum) {
      setIsMetaMaskInstalled(false);
      return;
    }
    setIsMetaMaskInstalled(true);
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
      <div className="flex min-h-dvh w-full flex-col px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <header className="flex items-center justify-between py-3 sm:py-4 px-1 sm:px-2">
          <div className="flex items-center gap-2">
            <img
              src="/favicon.svg"
              alt="ProRata Wallet"
              className="h-8 w-8 rounded-lg"
            />
            <div className="flex flex-col">
              <div className="text-base sm:text-lg font-semibold tracking-tight">
                ProRata Wallet
              </div>
              <span className="rounded bg-red-100 px-1.5 sm:px-2 py-0.5 text-xs font-semibold text-red-700 w-fit">
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
                  className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg border border-slate-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
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
            ) : isMetaMaskInstalled ? (
              <button
                type="button"
                onClick={connectWallet}
                className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                Connect Wallet
              </button>
            ) : (
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:shadow-md hover:scale-105 transition-all"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Install MetaMask
              </a>
            )}
          </div>
        </header>

        {!address ? (
          <div className="flex flex-1 items-center justify-center py-8 sm:py-12">
            <div className="w-full max-w-4xl px-4 sm:px-6">
              {/* MetaMask Not Installed Warning */}
              {!isMetaMaskInstalled && (
                <div className="mb-6 sm:mb-8 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 border-2 border-amber-200 p-6 sm:p-8 shadow-lg">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                        MetaMask Required
                      </h3>
                      <p className="text-sm sm:text-base text-slate-700 mb-4 leading-relaxed">
                        ProRata Wallet requires MetaMask to function. Please
                        install MetaMask browser extension to continue.
                      </p>
                      <a
                        href="https://metamask.io/download/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2.5 text-sm sm:text-base font-semibold text-white shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                        Install MetaMask
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Hero Section */}
              <div className="text-center mb-8 sm:mb-12">
                <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 mb-6 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-2xl shadow-indigo-500/50 animate-pulse">
                  <svg
                    className="w-10 h-10 sm:w-12 sm:h-12 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Welcome to ProRata Wallet
                </h1>
                <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                  The next-generation sharing wallet for collaborative asset
                  management. Built for teams, communities, and decentralized
                  organizations.
                </p>
              </div>

              {/* Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
                {/* Feature 1 */}
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-slate-50 p-6 border border-slate-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Multi-Owner Wallets
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Create shared wallets with multiple owners. Each owner has
                      a customizable percentage stake.
                    </p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-slate-50 p-6 border border-slate-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 shadow-lg">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Secure & Transparent
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Built on blockchain technology. All transactions are
                      transparent, verifiable, and secure.
                    </p>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-slate-50 p-6 border border-slate-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center mb-4 shadow-lg">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Instant Setup
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Create and deploy wallets instantly. No complex setup
                      required. Start collaborating in seconds.
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA Section */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-3xl" />
                <div className="relative rounded-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200/50 p-8 sm:p-10 text-center backdrop-blur-sm">
                  <div className="mb-6">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
                      Ready to Get Started?
                    </h2>
                    <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto">
                      Connect your wallet to create your first shared wallet or
                      join an existing one. Experience the future of
                      collaborative finance.
                    </p>
                  </div>
                  {isMetaMaskInstalled ? (
                    <button
                      type="button"
                      onClick={connectWallet}
                      className="group relative inline-flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-base sm:text-lg font-semibold text-white shadow-lg shadow-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/50 hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      <svg
                        className="w-5 h-5 sm:w-6 sm:h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      Connect Wallet
                      <svg
                        className="w-5 h-5 sm:w-6 sm:h-6 transform group-hover:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </button>
                  ) : (
                    <a
                      href="https://metamask.io/download/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative inline-flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-4 text-base sm:text-lg font-semibold text-white shadow-lg shadow-orange-500/50 hover:shadow-xl hover:shadow-orange-500/50 hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                    >
                      <svg
                        className="w-5 h-5 sm:w-6 sm:h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Install MetaMask
                      <svg
                        className="w-5 h-5 sm:w-6 sm:h-6 transform group-hover:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  )}
                  <div className="mt-6 flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-500">
                    <svg
                      className="w-4 h-4 text-emerald-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Secure • Decentralized • Trustless</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <main className="flex-1 flex flex-col min-h-0 w-full">
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-[400px_1fr] xl:grid-cols-[450px_1fr] gap-4 sm:gap-6 min-h-0 w-full">
              {/* Wallet List Section */}
              <div className="flex flex-col min-h-0 w-full">
                <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 md:p-6 flex-1 flex flex-col min-h-0">
                  {walletClient && (
                    <Suspense
                      fallback={
                        <div className="flex items-center justify-center flex-1">
                          <div className="text-slate-500">
                            Loading wallets...
                          </div>
                        </div>
                      }
                    >
                      <WalletList
                        key={refreshKey}
                        client={
                          walletClient as NonNullable<typeof walletClient>
                        }
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
                    </Suspense>
                  )}
                </div>
              </div>

              {/* Wallet Details Section */}
              <div className="flex flex-col min-h-0 w-full">
                {selected && walletClient ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 md:p-6 flex-1 flex flex-col min-h-0 shadow-sm">
                    <Suspense
                      fallback={
                        <div className="flex items-center justify-center flex-1">
                          <div className="text-slate-500">
                            Loading wallet details...
                          </div>
                        </div>
                      }
                    >
                      <WalletDetails
                        client={
                          walletClient as NonNullable<typeof walletClient>
                        }
                        address={selected as string}
                        account={address}
                        onClose={() => setSelected(undefined)}
                      />
                    </Suspense>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 sm:p-8 md:p-12 flex-1 flex items-center justify-center">
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
        {address && walletClient && (
          <Suspense fallback={null}>
            <CreateInstantWalletModal
              isOpen={showCreateWalletModal}
              onClose={handleCloseCreateWalletModal}
              walletClient={walletClient as NonNullable<typeof walletClient>}
              account={address}
              onSuccess={handleWalletCreated}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}

export default App;
