import { useEffect, useState } from "react";
import {
  getContract,
  type Account,
  type WalletClient,
  formatEther,
} from "viem";
import abi from "@/contracts/InstantWallet.json";

const WalletDetails = (props: {
  address: string;
  client: WalletClient;
  account: string;
  onClose?: () => void;
}) => {
  const [detail, setDetail] = useState<WalletDetail>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [showOutTransactions, setShowOutTransactions] = useState(false);

  useEffect(() => {
    if (!props.address) return;

    setIsLoading(true);
    setIsLoadingTransactions(true);
    setDetail(undefined);
    setTransactions([]);

    const contract = getContract({
      address: props.address as `0x${string}`,
      abi: abi.abi,
      client: props.client,
    });

    const getData = async () => {
      console.log("start get info from ", props.address, "by ", props.account);
      const result = await contract.read.getWallet({
        account: props.account as unknown as Account,
      });
      console.log("result", result);
      setDetail(result as WalletDetail);
      setIsLoading(false);
    };

    const getTransactions = async () => {
      try {
        console.log("Fetching transactions from ", props.address);
        const txns = await contract.read.getTransactions({
          account: props.account as unknown as Account,
        });
        console.log("transactions", txns);
        setTransactions(txns as Transaction[]);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setIsLoadingTransactions(false);
      }
    };

    getData();
    getTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.address, props.account]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 h-full">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="animate-spin h-8 w-8 text-indigo-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-slate-500 text-sm font-medium">
            Loading wallet details...
          </span>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4 sm:gap-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-3 sm:pb-4 border-slate-200">
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg">
            <span className="text-lg sm:text-2xl font-bold text-white">
              {detail?._name?.charAt(0) || "W"}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-base sm:text-lg md:text-xl font-semibold text-slate-900 truncate">
              {detail?._name || "Wallet Name"}
            </div>
            <div className="flex gap-1.5 sm:gap-2 items-center mt-1 flex-wrap">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  detail?._status
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {detail?._status ? "Stoped" : "Active"}
              </span>
              <span className="font-mono text-xs text-slate-500 bg-slate-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded break-all">
                {props.address.slice(0, 6)}...{props.address.slice(-4)}
              </span>
            </div>
          </div>
        </div>
        {props.onClose && (
          <button
            onClick={props.onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Close Details"
            type="button"
          >
            <svg
              className="w-5 h-5 text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Owners Section */}
      <div>
        <div className="font-semibold text-sm text-slate-700 mb-2 sm:mb-3 flex items-center gap-2">
          <svg
            className="w-4 h-4 text-indigo-500"
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
          Owners ({detail?._list?.length || 0})
        </div>
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
          {detail?._list?.map((owner, index) => (
            <div
              key={index}
              className="flex items-center gap-2 sm:gap-3 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 px-3 sm:px-4 py-2 sm:py-3 border border-slate-200 hover:border-indigo-200 transition-colors"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-xs font-semibold text-indigo-600">
                  {index + 1}
                </span>
              </div>
              <span className="font-mono text-slate-800 text-xs sm:text-sm select-all truncate flex-1 min-w-0">
                {owner.slice(0, 10)}...{owner.slice(-8)}
              </span>
              <span className="bg-indigo-500 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold flex-shrink-0">
                {detail?._percent[index]}%
              </span>
              <button
                className="p-1.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded transition-colors"
                onClick={() => navigator.clipboard.writeText(owner)}
                title="Copy Address"
                type="button"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 20 20"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <rect
                    x="6"
                    y="6"
                    width="9"
                    height="9"
                    rx="2"
                    className="stroke-current"
                  />
                  <rect
                    x="3"
                    y="3"
                    width="9"
                    height="9"
                    rx="2"
                    className="stroke-current opacity-30"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="font-semibold text-sm text-slate-700 flex items-center gap-2">
            <svg
              className="w-4 h-4 text-indigo-500 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            Transactions
          </div>
          <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer flex-shrink-0">
            <span className="text-xs text-slate-600 font-medium">Show OUT</span>
            <div className="relative">
              <input
                type="checkbox"
                checked={showOutTransactions}
                onChange={(e) => setShowOutTransactions(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-11 h-6 rounded-full transition-colors duration-200 ${
                  showOutTransactions ? "bg-indigo-500" : "bg-slate-300"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                    showOutTransactions ? "translate-x-5" : "translate-x-0.5"
                  } mt-0.5`}
                />
              </div>
            </div>
          </label>
        </div>
        {isLoadingTransactions ? (
          <div className="flex items-center justify-center py-4">
            <svg
              className="animate-spin h-5 w-5 text-indigo-400 mr-2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span className="text-slate-400 text-sm">
              Loading transactions...
            </span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {(() => {
              if (!transactions || !Array.isArray(transactions)) {
                return (
                  <div className="text-slate-400 text-sm py-8 text-center bg-slate-50 rounded-lg border border-slate-200">
                    No transactions found
                  </div>
                );
              }

              const filteredTransactions = showOutTransactions
                ? transactions
                : transactions.filter((tx) => {
                    const side = tx._side?.toLowerCase()?.trim();
                    return side === "in";
                  });

              return filteredTransactions.length === 0 ? (
                <div className="text-slate-400 text-sm py-8 text-center bg-slate-50 rounded-lg border border-slate-200">
                  No {showOutTransactions ? "" : "IN "}transactions found
                </div>
              ) : (
                <div className="flex flex-col gap-2 sm:gap-3">
                  {filteredTransactions.map((tx, index) => (
                    <div
                      key={index}
                      className="flex flex-col gap-2 sm:gap-3 rounded-lg bg-gradient-to-br from-white to-slate-50 px-3 sm:px-4 py-2 sm:py-3 border border-slate-200 hover:border-indigo-200 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              tx._side === "in" ? "bg-green-500" : "bg-red-500"
                            }`}
                          />
                          <span className="text-xs font-medium text-slate-500">
                            From:
                          </span>
                          <span className="font-mono text-slate-800 text-xs sm:text-sm select-all truncate">
                            {tx._from.slice(0, 10)}...{tx._from.slice(-8)}
                          </span>
                        </div>
                        <span
                          className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                            tx._side === "in"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {tx._side?.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                        <span className="text-xs font-medium text-slate-500 flex-shrink-0">
                          To:
                        </span>
                        <span className="font-mono text-slate-800 text-xs sm:text-sm select-all truncate">
                          {tx._to.slice(0, 10)}...{tx._to.slice(-8)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 gap-2">
                        <span className="text-xs font-medium text-slate-500 flex-shrink-0">
                          Amount:
                        </span>
                        <span className="font-bold text-slate-900 text-sm sm:text-base truncate text-right">
                          {formatEther(tx._amount)} ETH
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletDetails;
