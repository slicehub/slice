import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button, Text } from "@stellar/design-system";
import { useWallet } from "../hooks/useWallet";
import { useWalletBalance } from "../hooks/useWalletBalance";
import { usePrizePool } from "../contexts/PrizePoolContext";
import { generateRandomSudoku } from "../util/sudokuGenerator";
import {
  NoirService,
  type CompiledCircuit,
  type ProofArtifacts,
} from "../services/NoirService";
import {
  contractClient,
  StellarContractService,
} from "../services/StellarContractService";
import styles from "./Sudoku.module.css";

// Example puzzle data
const EXAMPLE_PUZZLE = [
  5, 3, 0, 0, 7, 0, 0, 0, 0, 6, 0, 0, 1, 9, 5, 0, 0, 0, 0, 9, 8, 0, 0, 0, 0, 6,
  0, 8, 0, 0, 0, 6, 0, 0, 0, 3, 4, 0, 0, 8, 0, 3, 0, 0, 1, 7, 0, 0, 0, 2, 0, 0,
  0, 6, 0, 6, 0, 0, 0, 0, 2, 8, 0, 0, 0, 0, 4, 1, 9, 0, 0, 5, 0, 0, 0, 0, 8, 0,
  0, 7, 9,
];
const EXAMPLE_SOLUTION = [
  5, 3, 4, 6, 7, 8, 9, 1, 2, 6, 7, 2, 1, 9, 5, 3, 4, 8, 1, 9, 8, 3, 4, 2, 5, 6,
  7, 8, 5, 9, 7, 6, 1, 4, 2, 3, 4, 2, 6, 8, 5, 3, 7, 9, 1, 7, 1, 3, 9, 2, 4, 8,
  5, 6, 9, 6, 1, 5, 3, 7, 2, 8, 4, 2, 8, 7, 4, 1, 9, 6, 3, 5, 3, 4, 5, 2, 8, 6,
  1, 7, 9,
];

const createEmptyGrid = (): number[] =>
  Array.from<number>({ length: 81 }, () => 0);
const createEmptyIndexSet = (): Set<number> => new Set<number>();

export const Sudoku: React.FC = () => {
  const { address, signTransaction } = useWallet();
  const { updateBalance } = useWalletBalance();
  const { loadPrizePot } = usePrizePool();
  const [grid, setGrid] = useState<number[]>(createEmptyGrid);
  const [, setSolution] = useState<number[]>(createEmptyGrid);
  const [givenIndices, setGivenIndices] =
    useState<Set<number>>(createEmptyIndexSet);
  const [difficulty, setDifficulty] = useState(30);
  const [validationErrors, setValidationErrors] =
    useState<Set<number>>(createEmptyIndexSet);
  const [validationValid, setValidationValid] =
    useState<Set<number>>(createEmptyIndexSet);
  const [output, setOutput] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const cellRefs = useRef<(HTMLInputElement | null)[]>([]);
  const noirService = useRef(new NoirService());
  const getErrorMessage = useCallback((error: unknown) => {
    if (error instanceof Error) {
      return error.message;
    }
    return typeof error === "string" ? error : "Unknown error";
  }, []);

  // Initialize grid on mount
  useEffect(() => {
    loadExample();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateCell = useCallback(
    (index: number, value: number) => {
      if (givenIndices.has(index)) return;

      setGrid((prev) => {
        const newGrid = [...prev];
        newGrid[index] = value;
        return newGrid;
      });

      // Clear validation states when cell is edited
      setValidationErrors((prev) => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
      setValidationValid((prev) => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    },
    [givenIndices],
  );

  const handleCellChange = (index: number, value: string) => {
    // Only allow digits 1-9
    const numValue = value.replace(/[^1-9]/g, "");
    if (numValue.length > 1) {
      return;
    }
    updateCell(index, numValue ? parseInt(numValue) : 0);
  };

  const handleCellKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (
      givenIndices.has(index) &&
      (e.key === "Backspace" || e.key === "Delete")
    ) {
      e.preventDefault();
      return;
    }

    let newIndex = index;
    switch (e.key) {
      case "ArrowUp":
        newIndex = index - 9;
        e.preventDefault();
        break;
      case "ArrowDown":
        newIndex = index + 9;
        e.preventDefault();
        break;
      case "ArrowLeft":
        newIndex = index - 1;
        e.preventDefault();
        break;
      case "ArrowRight":
        newIndex = index + 1;
        e.preventDefault();
        break;
    }

    if (newIndex >= 0 && newIndex < 81) {
      cellRefs.current[newIndex]?.focus();
    }
  };

  const setGivenCells = useCallback((puzzle: number[]) => {
    const newGivenIndices = new Set<number>();
    const newGrid = new Array(81).fill(0);

    puzzle.forEach((value, index) => {
      if (value > 0) {
        newGivenIndices.add(index);
        newGrid[index] = value;
      }
    });

    setGivenIndices(newGivenIndices);
    setGrid(newGrid);
  }, []);

  const clearGrid = useCallback(() => {
    setGrid(new Array(81).fill(0));
    setSolution(new Array(81).fill(0));
    setGivenIndices(new Set());
    setValidationErrors(new Set());
    setValidationValid(new Set());
    setOutput("");
  }, []);

  const generateRandomGame = useCallback(() => {
    clearGrid();
    setOutput("Generating random Sudoku...");

    const { puzzle, solution: generatedSolution } =
      generateRandomSudoku(difficulty);
    setGivenCells(puzzle);

    // Store solution separately for proof generation
    setSolution(generatedSolution);

    setOutput(
      `✓ Random game generated with ${puzzle.filter((v) => v > 0).length} givens. Fill in the empty cells to complete the puzzle.`,
    );
  }, [difficulty, clearGrid, setGivenCells]);

  const loadExample = useCallback(() => {
    clearGrid();
    setGivenCells(EXAMPLE_PUZZLE);
    // Fill in the complete solution (given cells are already set and locked)
    setGrid(EXAMPLE_SOLUTION);
    setSolution(EXAMPLE_SOLUTION);
    const preFilledCount = EXAMPLE_PUZZLE.filter((v) => v > 0).length;
    setDifficulty(preFilledCount);
    setOutput("✓ Example sudoku loaded.");
  }, [clearGrid, setGivenCells]);

  const resetPuzzle = useCallback(() => {
    setGrid((prev) =>
      prev.map((value, index) => {
        if (givenIndices.has(index)) {
          return value;
        }
        return 0;
      }),
    );
    setValidationErrors(new Set());
    setValidationValid(new Set());
    setOutput("");
  }, [givenIndices]);

  const validateSudokuGrid = useCallback(() => {
    // Clear previous validation
    setValidationErrors(new Set());
    setValidationValid(new Set());

    // Check if grid is full
    const emptyCells = grid.filter((v) => v === 0).length;
    if (emptyCells > 0) {
      setOutput(
        `Grid is not complete! ${emptyCells} empty cells remaining. Please fill all cells before validating.`,
      );
      return;
    }

    const errorIndices = new Set<number>();
    const validIndices = new Set<number>();

    // Check rows
    for (let row = 0; row < 9; row++) {
      const rowValues: Map<number, number[]> = new Map();
      for (let col = 0; col < 9; col++) {
        const index = row * 9 + col;
        const value = grid[index];
        if (value !== undefined && value > 0) {
          if (!rowValues.has(value)) {
            rowValues.set(value, []);
          }
          const indices = rowValues.get(value);
          if (indices) {
            indices.push(index);
          }
        }
      }
      rowValues.forEach((indices) => {
        if (indices.length > 1) {
          indices.forEach((idx) => errorIndices.add(idx));
        } else {
          indices.forEach((idx) => validIndices.add(idx));
        }
      });
    }

    // Check columns
    for (let col = 0; col < 9; col++) {
      const colValues: Map<number, number[]> = new Map();
      for (let row = 0; row < 9; row++) {
        const index = row * 9 + col;
        const value = grid[index];
        if (value !== undefined && value > 0) {
          if (!colValues.has(value)) {
            colValues.set(value, []);
          }
          const indices = colValues.get(value);
          if (indices) {
            indices.push(index);
          }
        }
      }
      colValues.forEach((indices) => {
        if (indices.length > 1) {
          indices.forEach((idx) => errorIndices.add(idx));
        } else {
          indices.forEach((idx) => validIndices.add(idx));
        }
      });
    }

    // Check 3x3 boxes
    for (let boxRow = 0; boxRow < 3; boxRow++) {
      for (let boxCol = 0; boxCol < 3; boxCol++) {
        const boxValues: Map<number, number[]> = new Map();
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            const row = boxRow * 3 + i;
            const col = boxCol * 3 + j;
            const index = row * 9 + col;
            const value = grid[index];
            if (value !== undefined && value > 0) {
              if (!boxValues.has(value)) {
                boxValues.set(value, []);
              }
              const indices = boxValues.get(value);
              if (indices) {
                indices.push(index);
              }
            }
          }
        }
        boxValues.forEach((indices) => {
          if (indices.length > 1) {
            indices.forEach((idx) => errorIndices.add(idx));
          } else {
            indices.forEach((idx) => validIndices.add(idx));
          }
        });
      }
    }

    setValidationErrors(errorIndices);
    setValidationValid(validIndices);

    if (errorIndices.size === 0) {
      setOutput("✓ Validation passed! No duplicates found.");
    } else {
      setOutput(
        "❌ Validation failed: Found duplicates in rows, columns, or 3x3 boxes.",
      );
    }
  }, [grid]);

  const collectSudokuGridData = useCallback((): {
    puzzle: number[];
    solution: number[];
  } => {
    // Solution is the current grid state (what user has filled in)
    const finalSolution = grid;
    // Puzzle is only the given cells
    const puzzle = grid.map((value, index) => {
      if (givenIndices.has(index)) {
        return value;
      }
      return 0;
    });
    return { puzzle, solution: finalSolution };
  }, [grid, givenIndices]);

  const generateProof = useCallback(async () => {
    if (!address || !signTransaction) {
      setOutput("Error: Please connect your wallet first.");
      return;
    }

    const walletSignTransaction = async (xdr: string) => {
      const signed = await signTransaction(xdr);
      return {
        signedTxXdr: signed.signedTxXdr,
        signerAddress: signed.signerAddress ?? address,
      };
    };

    const { puzzle, solution } = collectSudokuGridData();

    // Validate that solution is complete
    const emptyCells = solution.filter((v) => v === 0).length;
    if (emptyCells > 0) {
      setOutput(`Solution is incomplete! ${emptyCells} empty cells remaining.`);
      return;
    }

    // Validate that all values are 1-9
    const invalidSolution = solution.some((v) => v < 1 || v > 9);
    if (invalidSolution) {
      setOutput("Solution contains invalid values! All cells must be 1-9.");
      return;
    }

    setIsGenerating(true);
    setOutput("Generating proof...\n");

    let noirError: Error | null = null;
    let proofResult: ProofArtifacts | null = null;

    // Try to generate proof with Noir
    try {
      proofResult = await noirService.current.generateProof("sudoku", {
        puzzle,
        solution,
      });
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      noirError = error instanceof Error ? error : new Error(message);
      console.error("Noir proof generation error:", message);
    }

    let outputText = "";

    // If Noir failed, show the error but still try to submit to contract
    if (noirError) {
      outputText = `❌ Noir Proof Generation Failed

Error: ${noirError.message}

This indicates the sudoku solution is invalid (does not satisfy the circuit constraints).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STELLAR VERIFICATION ATTEMPT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Attempting to submit to smart contract to see contract-level validation...
`.trim();

      // Try to create an invalid proof blob using helper methods
      try {
        // Load circuit and VK using helper methods
        const circuitResponse = await fetch("/circuits/sudoku.json");
        if (!circuitResponse.ok) {
          throw new Error("Failed to load circuit");
        }
        const circuit = (await circuitResponse.json()) as CompiledCircuit;
        const vkJson = await noirService.current.loadVk("sudoku");

        // Encode public inputs using helper method
        const publicInputsBytes = noirService.current.encodePublicInputs(
          circuit,
          { puzzle },
        );

        // Create dummy proof data (all zeros - will fail verification)
        // Use standard proof size: 440 fields * 32 bytes
        const proofBytes = new Uint8Array(440 * 32);

        // Build proof blob using helper method
        const { proofBlob } = noirService.current.buildProofBlob(
          publicInputsBytes,
          proofBytes,
        );

        outputText += `\n\nSubmitting invalid proof to contract (properly formatted but with invalid proof data)...\n`;

        try {
          contractClient.options.publicKey = address;
          const vkBuffer = StellarContractService.toBuffer(vkJson);
          const proofBuffer = StellarContractService.toBuffer(proofBlob);

          const tx = await contractClient.verify_puzzle({
            guesser: address,
            vk_json: vkBuffer,
            proof_blob: proofBuffer,
          });

          const result = await tx.signAndSend({
            signTransaction: walletSignTransaction,
          });
          const txData = StellarContractService.extractTransactionData(result);

          // Refresh prize pool and wallet balance after verification attempt
          setTimeout(() => {
            void loadPrizePot();
            void updateBalance();
          }, 2000);

          if (txData.success) {
            outputText += `\n⚠️ Unexpected: Contract accepted invalid proof!`;
          } else {
            outputText += `\n\n✗ Contract Verification Failed (as expected)

The smart contract also rejected the invalid proof, confirming that both client-side (Noir) and on-chain validation work correctly.`;
          }
        } catch (contractError: unknown) {
          // Refresh prize pool and wallet balance after verification attempt (even on error)
          setTimeout(() => {
            void loadPrizePot();
            void updateBalance();
          }, 2000);

          outputText += `\n\n✗ Contract Verification Failed (as expected)

Contract Error: ${getErrorMessage(contractError)}

The smart contract also rejected the invalid proof, confirming that both client-side (Noir) and on-chain validation work correctly.`;
        }
      } catch (error: unknown) {
        outputText += `\n\n✗ Failed to submit to contract: ${getErrorMessage(error)}`;
      }
    } else if (proofResult) {
      // Noir succeeded, proceed with normal flow
      outputText = `
✓ Proof generated successfully!

Proof ID: ${proofResult.proofId}
Proof Size: ${proofResult.proof.length} bytes
Public Inputs: ${proofResult.publicInputs.length} bytes
VK Size: ${proofResult.vkJson.length} bytes
Time: ${proofResult.proofTime}s

Proof Blob (first 100 bytes):
${Array.from(proofResult.proofBlob.slice(0, 100))
  .map((byte) => byte.toString(16).padStart(2, "0"))
  .join(" ")}...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STELLAR VERIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();

      // Verify on Stellar
      try {
        contractClient.options.publicKey = address;
        const vkBuffer = StellarContractService.toBuffer(proofResult.vkJson);
        const proofBuffer = StellarContractService.toBuffer(
          proofResult.proofBlob,
        );

        const tx = await contractClient.verify_puzzle({
          guesser: address,
          vk_json: vkBuffer,
          proof_blob: proofBuffer,
        });

        const cpuInstructions =
          StellarContractService.extractCpuInstructions(tx);
        const result = await tx.signAndSend({
          signTransaction: walletSignTransaction,
        });
        const txData = StellarContractService.extractTransactionData(result);

        // Refresh prize pool and wallet balance after verification attempt
        setTimeout(() => {
          void loadPrizePot();
          void updateBalance();
        }, 2000);

        if (txData.success) {
          outputText += `\n\n✓ Proof verified on Stellar!

Verification Status: ✓ VERIFIED`;

          if (txData.txHash) {
            outputText += `\nTransaction Hash: ${txData.txHash}`;
          }
          if (cpuInstructions) {
            outputText += `\nCPU Instructions: ${cpuInstructions.toLocaleString()}`;
          }
          if (txData.fee) {
            const stroops = parseInt(txData.fee);
            const xlm = StellarContractService.formatStroopsToXlm(txData.fee);
            outputText += `\nFee: ${stroops.toLocaleString()} stroops (${xlm} XLM)`;
          }
        } else {
          outputText += `\n\n✗ Verification failed`;
        }
      } catch (error: unknown) {
        // Refresh prize pool and wallet balance after verification attempt (even on error)
        setTimeout(() => {
          void loadPrizePot();
          void updateBalance();
        }, 2000);

        outputText += `\n\n✗ Verification failed: ${getErrorMessage(error)}`;
      }
    }

    setOutput(outputText);
    setIsGenerating(false);
  }, [
    address,
    signTransaction,
    collectSudokuGridData,
    loadPrizePot,
    updateBalance,
    getErrorMessage,
  ]);

  if (!address) {
    return (
      <Text as="p" size="md">
        Connect wallet to play Sudoku and generate proofs
      </Text>
    );
  }

  return (
    <div>
      {/* Difficulty slider */}
      <div className={styles.sudokuDifficulty}>
        <label htmlFor="difficulty-slider">Pre-filled numbers: </label>
        <input
          type="range"
          id="difficulty-slider"
          min="17"
          max="60"
          value={difficulty}
          step="1"
          onChange={(e) => {
            const value = parseInt(e.target.value);
            setDifficulty(value);
            generateRandomGame();
          }}
        />
        <span className={styles.difficultyValue}>{difficulty}</span>
      </div>

      {/* Control buttons */}
      <div className={styles.sudokuControls}>
        <Button onClick={generateRandomGame} variant="secondary" size="md">
          Generate Random
        </Button>
        <Button onClick={loadExample} variant="secondary" size="md">
          Load Example
        </Button>
        <Button onClick={resetPuzzle} variant="secondary" size="md">
          Reset Puzzle
        </Button>
        <Button
          onClick={validateSudokuGrid}
          variant="secondary"
          size="md"
          className={styles.validateGrid}
        >
          Validate Grid
        </Button>
        <Button
          onClick={() => void generateProof()}
          variant="primary"
          size="md"
          disabled={isGenerating}
        >
          {isGenerating ? "Generating..." : "Generate Proof"}
        </Button>
      </div>

      {/* Sudoku grid */}
      <div className={styles.sudokuContainer}>
        <div className={styles.sudokuGrid}>
          {Array.from({ length: 81 }, (_, i) => {
            const isGiven = givenIndices.has(i);
            const hasError = validationErrors.has(i);
            const isValid = validationValid.has(i);
            const cellClasses = [
              styles.sudokuCell,
              isGiven ? styles.locked : "",
              hasError ? styles.error : "",
              isValid ? styles.valid : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <input
                key={i}
                ref={(el) => {
                  cellRefs.current[i] = el;
                }}
                type="text"
                className={cellClasses}
                maxLength={1}
                value={grid[i] > 0 ? grid[i].toString() : ""}
                readOnly={isGiven}
                onChange={(e) => handleCellChange(i, e.target.value)}
                onKeyDown={(e) => handleCellKeyDown(i, e)}
              />
            );
          })}
        </div>
      </div>

      {/* Output */}
      {output && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            background: "#f5f5f5",
            borderRadius: "4px",
            whiteSpace: "pre-wrap",
            fontFamily: "monospace",
            fontSize: "12px",
          }}
        >
          {output}
        </div>
      )}
    </div>
  );
};
