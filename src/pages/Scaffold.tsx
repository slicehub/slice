// src/pages/Scaffold.tsx
import React from "react";
import { Layout, Text } from "@stellar/design-system";
import { Box } from "../components/layout/Box";
import { ContractConfig } from "../components/ContractConfig";
import { AssignJurorButton } from "../components/AssignJurorButton";
import { VoteComponent } from "../components/VoteComponent";
// Import the new Wizard
import { DisputeSetupWizard } from "../components/DisputeSetupWizard";

const Scaffold: React.FC = () => {
  return (
    <Layout.Content>
      <Layout.Inset>
        <Text as="h1" size="xl">Slice Protocol Dev Tools</Text>

        <Box gap="xl" direction="column" style={{ marginTop: "2rem" }}>

          {/* 1. Setup Section */}
          <Box gap="md">
            <Text as="h2" size="lg">1. Setup & Config</Text>
            <ContractConfig />
            <DisputeSetupWizard /> {/* <--- NEW COMPONENT HERE */}
          </Box>

          {/* 2. Juror Actions */}
          <Box gap="md">
            <Text as="h2" size="lg">2. Juror Actions</Text>
            <AssignJurorButton />
            <VoteComponent />
          </Box>

        </Box>
      </Layout.Inset>
    </Layout.Content>
  );
};

export default Scaffold;
