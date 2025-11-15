import abi from "@/contracts/ProRataFactory.json";
import instantWalletAbi from "@/contracts/InstantWallet.json";
import { useEffect, useState } from "react";
import { getContract, type Account } from "viem";

const WalletList = (props: Wallets) => {
  const [list, setList] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const factoryContract = getContract({
      address: abi.networks["97"].address as `0x${string}`,
      abi: abi.abi,
      client: props.client,
    });

    const getData = async () => {
      setLoading(true);
      try {
        // Get created wallets
        const createdWallets = await factoryContract.read.getUserWallets({
          account: props.account as unknown as Account,
        });

        // Get shared wallet addresses
        const sharedWalletAddresses =
          await factoryContract.read.getSharedWallets({
            account: props.account as unknown as Account,
          });

        // Fetch details for shared wallets
        const sharedWalletsPromises = (sharedWalletAddresses as string[]).map(
          async (address: string) => {
            try {
              const walletContract = getContract({
                address: address as `0x${string}`,
                abi: instantWalletAbi.abi,
                client: props.client,
              });

              const walletDetail = await walletContract.read.getWallet({
                account: props.account as unknown as Account,
              });

              const detail = walletDetail as WalletDetail;

              return {
                _name: detail._name || "Unknown",
                _address: address,
                _type: "Instant",
                _isShared: true,
              } as Wallet;
            } catch (error) {
              console.error(`Error fetching shared wallet ${address}:`, error);
              return {
                _name: "Unknown",
                _address: address,
                _type: "Instant",
                _isShared: true,
              } as Wallet;
            }
          }
        );

        const sharedWallets = await Promise.all(sharedWalletsPromises);

        // Mark created wallets
        const createdWalletsWithFlag = (createdWallets as Wallet[]).map(
          (w) => ({
            ...w,
            _isShared: false,
          })
        );

        // Combine both lists
        const allWallets = [...createdWalletsWithFlag, ...sharedWallets];
        setList(allWallets);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        console.log((error as Error).message);
      }
    };

    if (props.account) {
      getData();
    }
  }, [props.account, props.client, props.refreshTrigger]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg
          className="animate-spin h-7 w-7 text-[var(--primary-color)] mr-4"
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
        <span className="text-[var(--text-secondary)] text-base">Loading wallets...</span>
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-lg font-medium text-[var(--text-secondary)]">
          No Wallets Defined
        </div>
        <div className="mt-2 text-[var(--text-muted)] text-sm mb-6">
          Create a new wallet to get started.
        </div>
        {props.onCreateWallet && (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary-color)] px-4 py-2 text-sm font-semibold text-[var(--neutral-dark)] shadow-sm transition hover:bg-[var(--primary-light)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
            onClick={props.onCreateWallet}
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
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {props.onCreateWallet && (
        <div className="flex justify-end mb-3 sm:mb-4">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg bg-[var(--primary-color)] px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-[var(--neutral-dark)] shadow-sm transition hover:bg-[var(--primary-light)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
            onClick={props.onCreateWallet}
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
      )}
      <div className="flex-1 overflow-y-auto min-h-0 -mx-1 sm:mx-0">
        <div className="grid grid-cols-1 gap-2 sm:gap-3 px-1 sm:px-0">
          {list.map((w, idx) => {
            const isSelected = props.selected === w._address;
            return (
              <div
                key={idx}
                onClick={() => {
                  if (props.setSelected) {
                    if (isSelected) {
                      props.setSelected(undefined);
                    } else {
                      props.setSelected(w._address);
                    }
                  }
                }}
                className={`rounded-xl border p-3 sm:p-4 md:p-5 flex flex-col gap-2 sm:gap-3 transition-all cursor-pointer ${
                  isSelected
                    ? "border-[var(--primary-color)] bg-[var(--primary-color)]/10 shadow-lg ring-2 ring-[var(--primary-color)]/30"
                    : "border-[var(--neutral-lighter)] bg-[var(--neutral-medium)] hover:shadow-md hover:border-[var(--primary-color)]"
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <div
                    className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${
                      isSelected
                        ? "bg-[var(--primary-color)] border-[var(--primary-dark)]"
                        : "bg-[var(--primary-color)]/30 border-[var(--primary-color)]/50"
                    }`}
                  ></div>
                  <span
                    className={`font-semibold text-base sm:text-lg tracking-tight flex-shrink-0 ${
                      isSelected ? "text-[var(--primary-color)]" : "text-[var(--text-primary)]"
                    }`}
                  >
                    {w._name}
                  </span>
                  <div className="ml-auto flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    {w._isShared && (
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold border ${
                          isSelected
                            ? "bg-[var(--secondary-color)]/20 text-[var(--secondary-color)] border-[var(--secondary-color)]/30"
                            : "bg-[var(--secondary-color)]/10 text-[var(--secondary-color)] border-[var(--secondary-color)]/20"
                        }`}
                      >
                        Member
                      </span>
                    )}
                    {!w._isShared && (
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold border ${
                          isSelected
                            ? "bg-[var(--secondary-color)]/20 text-[var(--secondary-color)] border-[var(--secondary-color)]/30"
                            : "bg-[var(--secondary-color)]/10 text-[var(--secondary-color)] border-[var(--secondary-color)]/20"
                        }`}
                      >
                        Owner
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium border ${
                        isSelected
                          ? "bg-[var(--primary-color)]/20 text-[var(--primary-color)] border-[var(--primary-color)]/30"
                          : "bg-[var(--neutral-light)] text-[var(--text-secondary)] border-[var(--neutral-lighter)]"
                      }`}
                    >
                      {w._type}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap">
                  <span className="font-mono text-[var(--text-primary)] text-xs sm:text-sm md:text-[15px] bg-[var(--neutral-light)] rounded px-2 sm:px-3 py-1 sm:py-1.5 select-all shadow-sm break-all">
                    {w._address.slice(0, 8)}...{w._address.slice(-6)}
                  </span>
                  <button
                    className="text-[var(--primary-color)] hover:text-[var(--primary-light)] transition-colors text-xs font-medium inline-flex items-center bg-[var(--primary-color)]/10 border border-[var(--primary-color)]/20 rounded px-1.5 sm:px-2 py-0.5 sm:py-1 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
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
                      className={`transition-colors text-xs font-semibold inline-flex items-center rounded px-2 sm:px-3 py-1 sm:py-1.5 flex-shrink-0 ${
                        isSelected
                          ? "text-[var(--primary-color)] bg-[var(--neutral-medium)] border border-[var(--primary-color)] hover:bg-[var(--primary-color)]/10"
                          : "text-[var(--neutral-dark)] bg-[var(--primary-color)] hover:bg-[var(--primary-light)]"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (props.setSelected) {
                          if (isSelected) {
                            props.setSelected(undefined);
                          } else {
                            props.setSelected(w._address);
                          }
                        }
                      }}
                      title={isSelected ? "Deselect Wallet" : "Select Wallet"}
                      type="button"
                    >
                      {isSelected ? "Selected" : "Select"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WalletList;
