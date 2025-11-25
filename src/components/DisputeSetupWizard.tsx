import React, { useState } from "react"; // Removed useEffect
import { Button, Input, Text, Card } from "@stellar/design-system"; // Removed Loader
import { Box } from "./layout/Box";
import { useWallet } from "../hooks/useWallet";
import { useNotification } from "../hooks/useNotification";
import { StellarContractService } from "../services/StellarContractService";
import slice from "../contracts/slice";
import { Buffer } from "buffer";

export const DisputeSetupWizard: React.FC = () => {
  const { address, signTransaction } = useWallet();
  const { addNotification } = useNotification();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [disputeId, setDisputeId] = useState<bigint | null>(null);
  const [defenderAddress, setDefenderAddress] = useState("");

  const getSigner = async (xdr: string) => {
    if (!signTransaction || !address) throw new Error("Wallet not connected");
    const { signedTxXdr } = await signTransaction(xdr);
    return { signedTxXdr };
  };

  const handleCreate = async () => {
    if (!address || !defenderAddress) {
      addNotification(
        "Please connect wallet and enter defender address",
        "error",
      );
      return;
    }
    setIsLoading(true);
    try {
      slice.options.publicKey = address;

      try {
        const catTx = await slice.add_category({ name: "General" });
        await catTx.signAndSend({ signTransaction: getSigner });
      } catch (e) {
        /* Ignore */
      }

      const metaHash = Buffer.alloc(32, 1);
      const tx = await slice.create_dispute({
        claimer: address,
        defender: defenderAddress,
        meta_hash: metaHash,
        min_amount: BigInt(1),
        max_amount: BigInt(10000),
        category: "General",
        allowed_jurors: undefined,
        jurors_required: 5,
        limits: {
          pay_seconds: BigInt(3600),
          commit_seconds: BigInt(3600),
          reveal_seconds: BigInt(3600),
        },
      });

      const res = await tx.signAndSend({ signTransaction: getSigner });
      const data = StellarContractService.extractTransactionData(res);

      if (data.success && res.result) {
        const newId = res.result.unwrap();
        setDisputeId(newId);
        addNotification(`Dispute #${newId} Created!`, "success");
        setStep(2);
      }
    } catch (err) {
      console.error(err);
      addNotification("Failed to create dispute", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFund = async () => {
    if (!address || !disputeId) return;
    setIsLoading(true);
    try {
      slice.options.publicKey = address;

      const tx = await slice.pay_dispute({
        caller: address,
        dispute_id: disputeId,
        amount: BigInt(500),
      });

      const res = await tx.signAndSend({ signTransaction: getSigner });
      const data = StellarContractService.extractTransactionData(res);

      if (data.success) {
        addNotification("Funds deposited successfully!", "success");
        setStep((prev) => (prev === 2 ? 3 : 4));
      } else {
        addNotification("Payment failed", "error");
      }
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (msg.includes("#7")) {
        addNotification(
          "Error: This wallet already paid. Switch wallets!",
          "error",
        );
      } else {
        addNotification("Payment failed. Check console.", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <Box gap="md" direction="column">
        <Text as="h2" size="lg">
          Dispute Setup Wizard
        </Text>

        {step === 1 && (
          <Box gap="sm" direction="column">
            <Text as="p" size="sm">
              Step 1: Create a new dispute. You (Connected Wallet) will be the{" "}
              <strong>Claimer</strong>.
            </Text>
            <Input
              id="defender-addr"
              label="Defender Address"
              fieldSize="md" // Added fieldSize
              placeholder="Enter Public Key (G...)"
              value={defenderAddress}
              onChange={(e) => setDefenderAddress(e.target.value)}
            />
            <Button
              variant="primary" // Added variant
              size="md" // Added size
              onClick={() => void handleCreate()}
              disabled={isLoading || !defenderAddress}
              isLoading={isLoading}
            >
              Create Dispute
            </Button>
          </Box>
        )}

        {step === 2 && (
          <Box gap="sm" direction="column">
            <Text as="p" size="sm" style={{ color: "#00d4aa" }}>
              ✓ Dispute #{disputeId?.toString()} Created.
            </Text>
            <Text as="p" size="sm">
              Step 2: Fund as <strong>Claimer</strong>.
            </Text>
            <Text as="p" size="xs">
              Ensure you are connected with the Creator wallet:{" "}
              {address?.slice(0, 6)}...
            </Text>
            <Button
              variant="primary" // Added variant
              size="md" // Added size
              onClick={() => void handleFund()}
              disabled={isLoading}
              isLoading={isLoading}
            >
              Deposit 500 XLM (Claimer)
            </Button>
          </Box>
        )}

        {step === 3 && (
          <Box gap="sm" direction="column">
            <Text as="p" size="sm" style={{ color: "#00d4aa" }}>
              ✓ Claimer Funded.
            </Text>
            <Text as="p" size="sm">
              Step 3: Fund as <strong>Defender</strong>.
            </Text>
            <div
              style={{
                background: "#FFF4E5",
                padding: "10px",
                borderRadius: "4px",
              }}
            >
              <Text as="p" size="sm" weight="bold">
                ⚠️ ACTION REQUIRED:
              </Text>
              <Text as="p" size="xs">
                Open your wallet extension and{" "}
                <strong>switch to the Defender account</strong>:{" "}
                {defenderAddress.slice(0, 6)}...
              </Text>
            </div>
            {address === defenderAddress ? (
              <Button
                variant="primary" // Added variant
                size="md" // Added size
                onClick={() => void handleFund()}
                disabled={isLoading}
                isLoading={isLoading}
              >
                Deposit 500 XLM (Defender)
              </Button>
            ) : (
              <Button size="md" disabled variant="secondary">
                Waiting for Wallet Switch...
              </Button>
            )}
          </Box>
        )}

        {step === 4 && (
          <Box gap="md" direction="column" align="center">
            <Text as="h2" size="lg" style={{ color: "#00d4aa" }}>
              🎉 Setup Complete!
            </Text>
            <Text as="p" size="sm">
              Dispute #{disputeId?.toString()} is funded and ready for jurors.
            </Text>
            <Button
              size="md"
              onClick={() => {
                setStep(1);
                setDisputeId(null);
                setDefenderAddress("");
              }}
              variant="secondary"
            >
              Start Over
            </Button>
          </Box>
        )}
      </Box>
    </Card>
  );
};
