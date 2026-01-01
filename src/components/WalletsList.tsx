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
        <span className="text-[var(--text-secondary)] text-base">
          Loading wallets...
        </span>
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
        <div className="grid grid-cols-1 gap-4 sm:gap-5 px-1 sm:px-0 py-2">
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
                className={`relative rounded-2xl p-4 sm:p-5 md:p-6 flex flex-col gap-3 sm:gap-4 transition-all duration-200 cursor-pointer overflow-hidden border ${
                  isSelected
                    ? "border-[var(--primary-color)]/60"
                    : "border-[#3a3a3a] hover:border-[var(--primary-color)]/40"
                }`}
                style={{
                  background: isSelected
                    ? "linear-gradient(145deg, #2a2a2a 0%, #1f1f1f 50%, #252525 100%)"
                    : "linear-gradient(145deg, #252525 0%, #1a1a1a 50%, #202020 100%)",
                  boxShadow: isSelected
                    ? `
                      inset 0 1px 0 0 rgba(255,255,255,0.12),
                      inset 0 -2px 4px 0 rgba(0,0,0,0.3),
                      0 4px 12px -2px rgba(0,0,0,0.5),
                      0 8px 24px -4px rgba(204, 255, 0, 0.15),
                      0 0 0 1px var(--primary-color)
                    `
                    : `
                      inset 0 1px 0 0 rgba(255,255,255,0.06),
                      inset 0 -1px 2px 0 rgba(0,0,0,0.2),
                      0 4px 12px -2px rgba(0,0,0,0.5),
                      0 8px 20px -4px rgba(0,0,0,0.4)
                    `,
                }}
              >
                {/* Top highlight edge for bevel effect */}
                <div
                  className="absolute inset-x-0 top-0 h-[1px] rounded-t-2xl"
                  style={{
                    background: isSelected
                      ? "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)"
                      : "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
                  }}
                />

                {/* Bottom shadow edge for bevel effect */}
                <div
                  className="absolute inset-x-0 bottom-0 h-[2px] rounded-b-2xl"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(0,0,0,0.2), transparent)",
                  }}
                />

                <div className="flex items-center gap-2 sm:gap-3 flex-wrap relative z-10">
                  <div
                    className={`w-4 h-4 rounded-full flex-shrink-0 transition-all ${
                      isSelected
                        ? "bg-[var(--primary-color)] shadow-[0_0_8px_var(--primary-color)]"
                        : "bg-[var(--primary-color)]/40"
                    }`}
                    style={{
                      boxShadow: isSelected
                        ? "inset 0 -2px 4px rgba(0,0,0,0.3), 0 0 10px var(--primary-color, #3b82f6)"
                        : "inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.2)",
                    }}
                  />
                  <span
                    className={`font-bold text-base sm:text-lg tracking-tight flex-shrink-0 ${
                      isSelected
                        ? "text-[var(--primary-color)] drop-shadow-[0_0_8px_var(--primary-color)]"
                        : "text-[var(--text-primary)]"
                    }`}
                  >
                    {w._name}
                  </span>
                  <div className="ml-auto flex items-center gap-2 sm:gap-2.5 flex-wrap">
                    {w._isShared && (
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${
                          isSelected
                            ? "bg-[var(--secondary-color)]/25 text-[var(--secondary-color)] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                            : "bg-[var(--secondary-color)]/15 text-[var(--secondary-color)]"
                        }`}
                        style={{
                          boxShadow:
                            "inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 2px rgba(0,0,0,0.1)",
                        }}
                      >
                        Member
                      </span>
                    )}
                    {!w._isShared && (
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${
                          isSelected
                            ? "bg-[var(--secondary-color)]/25 text-[var(--secondary-color)]"
                            : "bg-[var(--secondary-color)]/15 text-[var(--secondary-color)]"
                        }`}
                        style={{
                          boxShadow:
                            "inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 2px rgba(0,0,0,0.1)",
                        }}
                      >
                        Owner
                      </span>
                    )}
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        isSelected
                          ? "bg-[var(--primary-color)]/25 text-[var(--primary-color)]"
                          : "text-[var(--text-secondary)]"
                      }`}
                      style={{
                        background: isSelected
                          ? undefined
                          : "rgba(60, 60, 60, 0.6)",
                        boxShadow:
                          "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 2px rgba(0,0,0,0.15)",
                      }}
                    >
                      {w._type}
                    </span>
                  </div>
                </div>

                <div className="h-[1px] bg-gradient-to-r from-transparent via-[#4a4a4a] to-transparent my-1" />

                <div className="flex items-center gap-2 sm:gap-3 flex-wrap relative z-10">
                  <span
                    className="font-mono text-[var(--text-primary)] text-xs sm:text-sm md:text-[15px] rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 select-all break-all"
                    style={{
                      background: "linear-gradient(145deg, #161616, #111111)",
                      boxShadow:
                        "inset 0 2px 4px rgba(0,0,0,0.4), inset 0 -1px 0 rgba(255,255,255,0.03), 0 1px 2px rgba(0,0,0,0.3)",
                    }}
                  >
                    {w._address.slice(0, 8)}...{w._address.slice(-6)}
                  </span>
                  <button
                    className="text-[var(--primary-color)] hover:text-[var(--primary-light)] transition-all duration-150 text-xs font-semibold inline-flex items-center rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 flex-shrink-0 hover:scale-105 active:scale-95"
                    style={{
                      background:
                        "linear-gradient(145deg, rgba(204,255,0,0.15), rgba(204,255,0,0.08))",
                      boxShadow:
                        "inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 2px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.2)",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(w._address);
                    }}
                    title="Copy Address"
                    type="button"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="mr-1.5 h-4 w-4"
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
                        className="stroke-current opacity-40"
                      />
                    </svg>
                    Copy
                  </button>
                  {props.setSelected && (
                    <button
                      className={`transition-all duration-150 text-xs font-bold inline-flex items-center rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 flex-shrink-0 uppercase tracking-wide hover:scale-105 active:scale-95 ${
                        isSelected
                          ? "text-[var(--primary-color)]"
                          : "text-[#0a0a0a]"
                      }`}
                      style={{
                        background: isSelected
                          ? "linear-gradient(145deg, #2a2a2a, #1f1f1f)"
                          : "linear-gradient(145deg, #E5FF4D, #CCFF00)",
                        boxShadow: isSelected
                          ? "inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -2px 4px rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.3), 0 0 0 1px var(--primary-color)"
                          : "inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.15), 0 4px 8px rgba(0,0,0,0.4)",
                      }}
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
