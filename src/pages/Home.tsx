import React from "react";
import { Layout, Text } from "@stellar/design-system";
import { Voting } from "../components/Voting";
import { ContractConfig } from "../components/ContractConfig";
import { Box } from "../components/layout/Box";

const Home: React.FC = () => {
  return (
    <Layout.Content>
      <Layout.Inset>
        <Text as="h1" size="xl">
          Anonymous Voting System
        </Text>
        <Text as="p" size="md">
          Participate in anonymous voting using zero-knowledge proofs on the Stellar blockchain.
          Your vote is hidden until you reveal it, ensuring privacy and preventing vote manipulation.
        </Text>
        
        <Box gap="md" direction="column" style={{ marginTop: "2rem" }}>
          <ContractConfig />
          <Voting />
        </Box>
      </Layout.Inset>
    </Layout.Content>
  );
};

export default Home;
