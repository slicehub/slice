// src/components/DevSetupButton.tsx
import React from "react";
import { Button, Text, Loader } from "@stellar/design-system";
import { useDevSetup } from "../hooks/useDevSetup";
import { Box } from "./layout/Box";

export const DevSetupButton: React.FC = () => {
  const { setupDemoDispute, isLoading, status } = useDevSetup();

  return (
    <Box gap="xs" direction="column" align="center">
      <Button
        onClick={() => void setupDemoDispute()}
        disabled={isLoading}
        variant="secondary"
        size="md"
      >
        {isLoading ? <Loader /> : "⚡ Initialize Demo Dispute"}
      </Button>
      {status && (
        <Text as="span" size="xs" style={{ color: "#8c8fff" }}>
          {status}
        </Text>
      )}
    </Box>
  );
};
