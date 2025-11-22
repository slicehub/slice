import React from "react";
import { Layout, Text } from "@stellar/design-system";
import { Sudoku } from "../components/Sudoku";
import { ContractConfig } from "../components/ContractConfig";
import { PrizePool } from "../components/PrizePool";
import { Box } from "../components/layout/Box";
import { VoteComponent } from "../components/VoteComponent";

const Home: React.FC = () => {
  return (
    <Layout.Content>
      <Layout.Inset>
        <Text as="h1" size="xl">
          Sudoku Proof Generator
        </Text>
        <Text as="p" size="md">
          Solve Sudoku puzzles and generate zero-knowledge proofs that verify
          your solution on the Stellar blockchain using the UltraHonk proof
          system.
        </Text>

        <Box gap="md" direction="column" style={{ marginTop: "2rem" }}>
          <ContractConfig />
          <PrizePool />
          <VoteComponent />
          <Sudoku />
        </Box>
      </Layout.Inset>
    </Layout.Content>
  );
};

export default Home;
