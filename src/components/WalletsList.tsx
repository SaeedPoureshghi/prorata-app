import abi from "@/contracts/ProRataFactory.json";
import { useEffect, useState } from "react";
import { getContract, type Account } from "viem";

const WalletList = (props: Wallets) => {
  const [list, setList] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const contract = getContract({
      address: abi.networks["97"].address as `0x${string}`,
      abi: abi.abi,
      client: props.client,
    });

    const getData = async () => {
      try {
        const result = await contract.read.getUserWallets({
          account: props.account as unknown as Account,
        });
        setList(result as Wallet[]);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        console.log((error as Error).message);
      }
    };

    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg
          className="animate-spin h-7 w-7 text-indigo-400 mr-4"
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
        <span className="text-slate-400 text-base">Loading wallets...</span>
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-lg font-medium text-slate-500">
          No Wallets Defined
        </div>
        <div className="mt-2 text-slate-400 text-sm">
          Create a new wallet to get started.
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {list.map((w, idx) => (
        <div
          key={idx}
          className="rounded-xl border border-slate-100 shadow bg-white/80 backdrop-blur-sm p-6 flex flex-col gap-3 transition hover:shadow-md hover:border-indigo-100"
          style={{
            boxShadow:
              "0 2px 16px 0 rgba(60, 140, 240, 0.07), 0 1.5px 6px 0 rgba(60, 100, 180, 0.04)",
            border: "1px solid #e5e9f2",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-indigo-200 border-2 border-indigo-300 mr-1"></div>
            <span className="font-semibold text-indigo-900/90 text-lg tracking-tight">
              {w._name}
            </span>
            <span className="ml-auto px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-400 border border-indigo-100">
              {w._type}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-slate-700 text-[15px] bg-slate-100 rounded px-3 py-1.5 select-all shadow-sm">
              {w._address.slice(0, 8)}...{w._address.slice(-6)}
            </span>
            <button
              className="ml-2 text-indigo-400 hover:text-indigo-600 transition-colors text-xs font-medium inline-flex items-center bg-indigo-50 border border-indigo-100 rounded px-2 py-1"
              onClick={() => {
                navigator.clipboard.writeText(w._address);
              }}
              title="Copy Address"
              type="button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mr-1 h-4 w-4"
                fill="none"
                viewBox="0 0 20 20"
                stroke="currentColor"
                strokeWidth={1.5}
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
              Copy
            </button>
            {props.setSelected && (
              <button
                className="ml-2 text-white bg-indigo-500 hover:bg-indigo-600 transition-colors text-xs font-medium inline-flex items-center rounded px-3 py-1"
                onClick={() => {
                  if (props.setSelected) {
                    props.setSelected(w._address);
                  }
                }}
                title="Select Wallet"
                type="button"
              >
                Select
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default WalletList;
