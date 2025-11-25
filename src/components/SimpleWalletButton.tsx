import { useWallet } from "../hooks/useWallet";
import { connectWallet, disconnectWallet } from "../util/wallet";

export const SimpleWalletButton = () => {
  const { address, isPending } = useWallet();

  const handleClick = () => {
    if (address) {
      // Simple confirmation to prevent accidental disconnects
      if (confirm("Disconnect wallet?")) {
        void disconnectWallet();
      }
    } else {
      void connectWallet();
    }
  };

  // Show "..." while loading, otherwise truncated address or "Connect"
  const label = isPending
    ? "..."
    : address
      ? `${address.slice(0, 4)}...${address.slice(-4)}`
      : "Connect Wallet";

  return (
    <button
      onClick={handleClick}
      style={{
        // Styling to match the Disputes theme
        backgroundColor: address ? "#1b1c23" : "#ffffff",
        color: address ? "#ffffff" : "#1b1c23",
        border: "1px solid #1b1c23",
        borderRadius: "14px",
        padding: "8px 16px",
        fontFamily: '"Manrope", sans-serif',
        fontWeight: 800,
        fontSize: "12px",
        cursor: isPending ? "wait" : "pointer",
        boxShadow: "0px 2px 8px rgba(0,0,0,0.08)",
        transition: "all 0.2s ease",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
};
