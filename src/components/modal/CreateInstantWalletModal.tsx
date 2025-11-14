import { useState } from "react";
import {
  type WalletClient,
  type Address,
  isAddress,
  createPublicClient,
  http,
} from "viem";
import { bscTestnet } from "viem/chains";
import abi from "@/contracts/ProRataFactory.json";

interface AddressShare {
  address: string;
  share: string;
}

interface CreateInstantWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletClient: WalletClient;
  account: string;
  onSuccess?: () => void;
}

const CreateInstantWalletModal = ({
  isOpen,
  onClose,
  walletClient,
  account,
  onSuccess,
}: CreateInstantWalletModalProps) => {
  const [walletName, setWalletName] = useState("");
  const [addressShares, setAddressShares] = useState<AddressShare[]>([
    { address: "", share: "" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWaitingConfirmation, setIsWaitingConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const addAddressShare = () => {
    setAddressShares([...addressShares, { address: "", share: "" }]);
  };

  const removeAddressShare = (index: number) => {
    if (addressShares.length > 1) {
      setAddressShares(addressShares.filter((_, i) => i !== index));
    }
  };

  const updateAddressShare = (
    index: number,
    field: "address" | "share",
    value: string
  ) => {
    const updated = [...addressShares];
    updated[index] = { ...updated[index], [field]: value };
    setAddressShares(updated);
  };

  const validateForm = (): string | null => {
    if (!walletName.trim()) {
      return "Wallet name is required";
    }

    if (addressShares.length === 0) {
      return "At least one address is required";
    }

    // Validate all addresses
    for (let i = 0; i < addressShares.length; i++) {
      const { address, share } = addressShares[i];
      if (!address.trim()) {
        return `Address ${i + 1} is required`;
      }
      if (!isAddress(address.trim())) {
        return `Address ${i + 1} is not a valid Ethereum address`;
      }
      if (!share.trim()) {
        return `Share ${i + 1} is required`;
      }
      const shareNum = parseFloat(share);
      if (isNaN(shareNum) || shareNum <= 0 || shareNum > 100) {
        return `Share ${i + 1} must be a number between 0 and 100`;
      }
    }

    // Check for duplicate addresses
    const addresses = addressShares.map((as) =>
      as.address.toLowerCase().trim()
    );
    const uniqueAddresses = new Set(addresses);
    if (addresses.length !== uniqueAddresses.size) {
      return "Duplicate addresses are not allowed";
    }

    // Check if shares sum to 100
    const totalShare = addressShares.reduce(
      (sum, as) => sum + parseFloat(as.share || "0"),
      0
    );
    if (Math.abs(totalShare - 100) > 0.01) {
      return `Shares must sum to 100% (currently ${totalShare.toFixed(2)}%)`;
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setIsWaitingConfirmation(false);
    setError(null);

    try {
      const addresses = addressShares.map(
        (as) => as.address.trim() as `0x${string}`
      );
      const shares = addressShares.map((as) => parseFloat(as.share).toString());

      // Create a public client for simulation and waiting for receipt
      const publicClient = createPublicClient({
        chain: bscTestnet,
        transport: http(),
      });

      // Simulate the contract call
      const { request } = await publicClient.simulateContract({
        address: abi.networks["97"].address as `0x${string}`,
        abi: abi.abi,
        functionName: "createInstantWallet",
        args: [addresses, shares, walletName.trim()],
        account: account as Address,
      });

      // Submit transaction
      const hash = await walletClient.writeContract(request);
      console.log("Transaction hash:", hash);

      // Wait for transaction confirmation
      setIsSubmitting(false);
      setIsWaitingConfirmation(true);

      // Wait for transaction confirmation
      await publicClient.waitForTransactionReceipt({
        hash,
        timeout: 60_000, // 60 seconds timeout
      });

      console.log("Transaction confirmed:", hash);

      // Delay to ensure blockchain state is fully updated and indexed
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Reset form
      setWalletName("");
      setAddressShares([{ address: "", share: "" }]);
      setError(null);
      setIsWaitingConfirmation(false);

      // Call success callback and close modal
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error("Error creating wallet:", err);

      // Check if user rejected the transaction
      // Error code 4001 is the standard EIP-1193 user rejection error
      const errorCode = (err as { code?: number | string })?.code;
      const errorMessage =
        err instanceof Error ? err.message.toLowerCase() : "";

      const isUserRejection =
        errorCode === 4001 ||
        errorCode === "4001" ||
        errorMessage.includes("user rejected") ||
        errorMessage.includes("user denied") ||
        errorMessage.includes("rejected") ||
        errorMessage.includes("denied transaction") ||
        errorMessage.includes("user cancelled");

      if (isUserRejection) {
        setError(
          "Transaction was rejected. Please try again if you want to create the wallet."
        );
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to create wallet. Please try again."
        );
      }

      setIsSubmitting(false);
      setIsWaitingConfirmation(false);
    }
  };

  const totalShare = addressShares.reduce(
    (sum, as) => sum + parseFloat(as.share || "0"),
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl mx-4 bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">
            Create New Instant Wallet
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            disabled={isSubmitting || isWaitingConfirmation}
          >
            <svg
              className="h-6 w-6"
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
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Wallet Name */}
            <div>
              <label
                htmlFor="walletName"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Wallet Name
              </label>
              <input
                type="text"
                id="walletName"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="Enter wallet name"
                disabled={isSubmitting || isWaitingConfirmation}
                required
              />
            </div>

            {/* Addresses and Shares */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-slate-700">
                  Addresses & Shares
                </label>
                <button
                  type="button"
                  onClick={addAddressShare}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-1"
                  disabled={isSubmitting || isWaitingConfirmation}
                >
                  <svg
                    className="h-4 w-4"
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
                  Add Address
                </button>
              </div>

              <div className="space-y-3">
                {addressShares.map((as, index) => (
                  <div
                    key={index}
                    className="flex gap-3 items-start p-4 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="flex-1 space-y-3">
                      <div>
                        <label
                          htmlFor={`address-${index}`}
                          className="block text-xs font-medium text-slate-600 mb-1"
                        >
                          Address {index + 1}
                        </label>
                        <input
                          type="text"
                          id={`address-${index}`}
                          value={as.address}
                          onChange={(e) =>
                            updateAddressShare(index, "address", e.target.value)
                          }
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
                          placeholder="0x..."
                          disabled={isSubmitting || isWaitingConfirmation}
                          required
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`share-${index}`}
                          className="block text-xs font-medium text-slate-600 mb-1"
                        >
                          Share (%)
                        </label>
                        <input
                          type="number"
                          id={`share-${index}`}
                          value={as.share}
                          onChange={(e) =>
                            updateAddressShare(index, "share", e.target.value)
                          }
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                          placeholder="0"
                          min="0"
                          max="100"
                          step="0.01"
                          disabled={isSubmitting || isWaitingConfirmation}
                          required
                        />
                      </div>
                    </div>
                    {addressShares.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAddressShare(index)}
                        className="mt-7 text-slate-400 hover:text-red-600 transition-colors"
                        disabled={isSubmitting || isWaitingConfirmation}
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Total Share Display */}
              <div className="mt-3 px-4 py-2 bg-slate-100 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">
                    Total Share:
                  </span>
                  <span
                    className={`font-semibold ${
                      Math.abs(totalShare - 100) < 0.01
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {totalShare.toFixed(2)}%
                  </span>
                </div>
                {Math.abs(totalShare - 100) >= 0.01 && (
                  <p className="text-xs text-red-600 mt-1">
                    Shares must sum to exactly 100%
                  </p>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              disabled={isSubmitting || isWaitingConfirmation}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              disabled={
                isSubmitting ||
                isWaitingConfirmation ||
                Math.abs(totalShare - 100) >= 0.01
              }
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
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
                  Submitting...
                </>
              ) : isWaitingConfirmation ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
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
                  Waiting for confirmation...
                </>
              ) : (
                "Create Wallet"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateInstantWalletModal;
