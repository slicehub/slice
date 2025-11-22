import { useState, useEffect } from "react";
import { Button, Input, Text } from "@stellar/design-system";
import { Box } from "./layout/Box";
import { useWallet } from "../hooks/useWallet";
import { usePrizePool } from "../contexts/PrizePoolContext";
import {
  contractClient,
  StellarContractService,
} from "../services/StellarContractService";

export const PrizePool = () => {
  const { address, signTransaction } = useWallet();
  const { balance, isLoading, loadPrizePot } = usePrizePool();
  const [isAdding, setIsAdding] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    void loadPrizePot();
  }, [loadPrizePot]);

  const handleAddFunds = async () => {
    if (!address || !signTransaction) {
      setMessage({ type: "error", text: "Please connect your wallet" });
      return;
    }

    if (!amount.trim()) {
      setMessage({ type: "error", text: "Please enter an amount" });
      return;
    }

    // Convert XLM to stroops if user enters XLM amount
    // Assume if amount contains decimal point, it's XLM, otherwise stroops
    let amountInStroops: string;
    if (amount.includes(".")) {
      // XLM amount - convert to stroops
      const xlmAmount = parseFloat(amount);
      if (isNaN(xlmAmount) || xlmAmount <= 0) {
        setMessage({ type: "error", text: "Invalid amount" });
        return;
      }
      amountInStroops = Math.floor(xlmAmount * 10_000_000).toString();
    } else {
      // Stroops amount
      const stroopsAmount = parseInt(amount);
      if (isNaN(stroopsAmount) || stroopsAmount <= 0) {
        setMessage({ type: "error", text: "Invalid amount" });
        return;
      }
      amountInStroops = amount;
    }

    setIsAdding(true);
    setMessage(null);

    try {
      contractClient.options.publicKey = address;
      const amountBigInt = BigInt(amountInStroops);

      const tx = await contractClient.add_funds({
        funder: address,
        amount: amountBigInt,
      });

      const result = await tx.signAndSend({ signTransaction });
      const txData = StellarContractService.extractTransactionData(result);

      if (txData.success) {
        setMessage({
          type: "success",
          text: `Successfully added funds! Transaction: ${txData.txHash?.slice(0, 8)}...`,
        });
        setAmount("");
        // Refresh balance after successful transaction
        setTimeout(() => {
          void loadPrizePot();
        }, 2000);
      } else {
        setMessage({ type: "error", text: "Failed to add funds" });
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to add funds";
      setMessage({
        type: "error",
        text: message,
      });
    } finally {
      setIsAdding(false);
    }
  };

  if (!address) {
    return (
      <Box gap="md" direction="column">
        <Text as="h2" size="lg">
          Prize Pool
        </Text>
        <Text as="p" size="sm" style={{ color: "#6b7280" }}>
          Connect your wallet to view and manage the prize pool
        </Text>
      </Box>
    );
  }

  return (
    <Box gap="xs" direction="column">
      <Box gap="sm" direction="row" align="center" wrap="wrap">
        <Text as="h2" size="md" style={{ margin: 0 }}>
          Prize Pool
        </Text>
        {balance && (
          <Box gap="xs" direction="row" align="baseline" wrap="nowrap">
            <Text as="p" size="sm" style={{ margin: 0, color: "#6b7280" }}>
              Balance:
            </Text>
            <Text
              as="p"
              size="md"
              style={{ fontWeight: "bold", color: "#00d4aa", margin: 0 }}
            >
              {balance.xlm} XLM
            </Text>
          </Box>
        )}
      </Box>
      {isLoading && !balance && (
        <Text as="p" size="xs" style={{ margin: 0, color: "#6b7280" }}>
          Loading...
        </Text>
      )}
      {address && (
        <Box gap="sm" direction="row" align="end" wrap="nowrap">
          <Input
            label="Add Funds"
            id="add-funds-amount"
            fieldSize="md"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setMessage(null);
            }}
            placeholder="Amount (XLM)"
            type="text"
            style={{ width: "150px", flexShrink: 0 }}
          />
          <Button
            onClick={() => void handleAddFunds()}
            disabled={isAdding || !amount.trim()}
            variant="primary"
            size="md"
            style={{ flexShrink: 0 }}
          >
            {isAdding ? "Adding..." : "Add"}
          </Button>
        </Box>
      )}
      {message && (
        <Text
          as="p"
          size="xs"
          style={{
            color: message.type === "success" ? "#00d4aa" : "#ff3864",
            margin: 0,
          }}
        >
          {message.text}
        </Text>
      )}
    </Box>
  );
};
