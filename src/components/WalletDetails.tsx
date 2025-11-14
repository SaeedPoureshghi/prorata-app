import { useEffect, useState } from "react";
import { getContract, type Account, type WalletClient } from "viem";
import abi from "@/contracts/InstantWallet.json";

const WalletDetails = (props: {
  address: string;
  client: WalletClient;
  account: string;
}) => {
  const [detail, setDetail] = useState<WalletDetail>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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

    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
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
  return (
    <div className="flex flex-col gap-6 py-6 px-4 rounded-xl border border-slate-200 bg-white shadow-md max-w-lg mx-auto">
      <div className="flex items-center gap-4 border-b pb-4 border-slate-100">
        <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-indigo-100 shadow">
          <span className="text-2xl font-bold text-indigo-600">
            {detail?._name?.charAt(0) || "W"}
          </span>
        </div>
        <div>
          <div className="text-lg font-semibold text-slate-900">
            {detail?._name || "Wallet Name"}
          </div>
          <div className="flex gap-2 items-center mt-1">
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                detail?._status
                  ? "bg-green-100 text-green-600"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {detail?._status}
            </span>
            {/* <span className="ml-1 bg-indigo-50 text-indigo-500 border border-indigo-100 px-2 py-0.5 rounded text-xs font-semibold tracking-wide">
              {detail?._type || "Instant"}
            </span> */}
          </div>
        </div>
      </div>

      <div>
        <div className="font-medium text-sm text-slate-500 mb-2">Owners</div>
        <div className="flex flex-col gap-2">
          {detail?._list.map((owner, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded bg-slate-50 px-4 py-2 shadow-sm"
            >
              <span className="font-mono text-slate-800 text-sm select-all truncate">
                {owner.slice(0, 8)}...{owner.slice(-6)}
              </span>
              <span className="ml-auto bg-indigo-100 text-indigo-500 px-2 py-0.5 rounded text-xs">
                {detail?._percent[index]}%
              </span>
              <button
                className="ml-2 text-indigo-400 hover:text-indigo-600 transition-colors text-xs font-medium inline-flex items-center bg-indigo-50 border border-indigo-100 rounded px-2 py-1"
                onClick={() => navigator.clipboard.writeText(owner)}
                title="Copy Address"
                type="button"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WalletDetails;
