/**
 * NoirService - Handles Noir circuit execution and UltraHonk proof generation
 *
 * This service provides methods to:
 * - Load compiled Noir circuits
 * - Execute circuits with user inputs to generate witnesses
 * - Generate UltraHonk proofs using the bb.js backend
 * - Build proof blobs compatible with the Stellar verifier contract
 */

import { Noir } from "@noir-lang/noir_js";
import { UltraHonkBackend } from "@aztec/bb.js";
import { keccak_256 } from "@noble/hashes/sha3.js";

type AbiVisibility = "private" | "public";

type AbiIntegerType = { kind: "integer"; width: number };
type AbiFieldType = { kind: "field" };
type AbiArrayType = { kind: "array"; length: number; type: AbiScalarType };

type AbiScalarType = AbiIntegerType | AbiFieldType;
type AbiType = AbiArrayType | AbiScalarType;

export interface AbiParameter {
  name: string;
  visibility: AbiVisibility;
  type: AbiType;
}

interface CircuitAbi {
  parameters: AbiParameter[];
}

export interface CompiledCircuit {
  abi: CircuitAbi;
  bytecode: Uint8Array | number[];
  [key: string]: unknown;
}

export type CircuitInputs = Record<string, number | bigint | string | number[]>;

export interface ProofArtifacts {
  proof: Uint8Array;
  publicInputs: Uint8Array;
  proofBlob: Uint8Array;
  vkJson: Uint8Array;
  proofId: string;
  proofTime: string;
}

/**
 * Service for generating UltraHonk proofs from Noir circuits
 */
export class NoirService {
  /**
   * Generates an UltraHonk proof for a given circuit and inputs
   *
   * The proof generation process:
   * 1. Loads the compiled circuit from /circuits/{circuitName}.json
   * 2. Executes the circuit with provided inputs to generate a witness
   * 3. Generates an UltraHonk proof using bb.js with keccak oracle hash
   * 4. Extracts public inputs from circuit parameters (not from bb.js compact format)
   * 5. Builds a proof blob: u32_be(total_fields) || public_inputs || proof
   * 6. Computes proof ID as Keccak-256 hash of the proof blob
   * 7. Loads the pre-generated verification key
   *
   * @param circuitName - Name of the circuit (e.g., 'simple_circuit', 'zkp_maze', 'sudoku')
   * @param inputs - Circuit input values as key-value pairs
   * @returns Proof data including proof bytes, public inputs, proof blob, VK, and proof ID
   */
  async generateProof(
    circuitName: string,
    inputs: CircuitInputs,
  ): Promise<ProofArtifacts> {
    console.log(`[NoirService] Starting proof generation for ${circuitName}`);

    // Load the compiled circuit
    console.log(`[1/6] Loading circuit...`);
    const response = await fetch(`/circuits/${circuitName}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load circuit: ${circuitName}`);
    }
    const circuitJson = (await response.json()) as CompiledCircuit;
    const circuitBytecode =
      circuitJson.bytecode instanceof Uint8Array
        ? circuitJson.bytecode
        : new Uint8Array(circuitJson.bytecode as ArrayLike<number>);
    const circuit: CompiledCircuit = {
      ...circuitJson,
      bytecode: circuitBytecode,
    };
    console.log(`[1/6] Circuit loaded`);

    // Initialize Noir with the circuit
    console.log(`[2/6] Initializing Noir...`);
    const noir = new Noir(circuit);
    console.log(`[2/6] Noir initialized`);

    // Execute the circuit to generate witness
    console.log(`[3/6] Executing circuit with inputs:`, inputs);
    const { witness } = await noir.execute(inputs);
    console.log(`[3/6] Witness generated, length:`, witness.length);

    // Debug: Check circuit public parameters
    const publicParams = circuit.abi.parameters.filter(
      (p) => p.visibility === "public",
    );
    console.log(
      `[DEBUG] Circuit has ${publicParams.length} public parameter(s):`,
      publicParams.map((p) => `${p.name} (${p.type.kind})`),
    );

    // Initialize UltraHonk backend
    console.log(`[4/6] Initializing UltraHonkBackend...`);
    const backend = new UltraHonkBackend(circuit.bytecode);
    console.log(`[4/6] Backend initialized`);

    // Generate proof (use keccak oracle hash for Stellar verification)
    console.log(`[5/6] Generating proof (this may take 30-60 seconds)...`);
    const proofStart = performance.now();
    const proof = await backend.generateProof(witness, { keccak: true });
    const proofTime = ((performance.now() - proofStart) / 1000).toFixed(2);
    console.log(`[5/6] Proof generated in ${proofTime}s`);

    // Extract proof bytes
    const proofBytes = proof.proof;

    // Build public inputs from circuit inputs using helper method
    const publicInputsBytes = this.encodePublicInputs(circuit, inputs);
    console.log(
      `[DEBUG] Total public inputs: ${publicInputsBytes.length} bytes (${publicInputsBytes.length / 32} fields)`,
    );

    // Build proof blob using helper method
    const { proofBlob, proofId } = this.buildProofBlob(
      publicInputsBytes,
      proofBytes,
    );

    // Load pre-generated VK using helper method
    console.log(`[6/6] Loading verification key...`);
    const vkJson = await this.loadVk(circuitName);

    console.log(`[6/6] Complete! Proof ID: ${proofId}`);

    return {
      proof: proofBytes,
      publicInputs: publicInputsBytes,
      proofBlob,
      vkJson,
      proofId,
      proofTime,
    };
  }

  /**
   * Loads the verification key for a circuit
   *
   * @param circuitName - Name of the circuit
   * @returns Verification key as raw bytes
   */
  async loadVk(circuitName: string): Promise<Uint8Array> {
    const vkResponse = await fetch(`/circuits/${circuitName}_vk.json`);
    if (!vkResponse.ok) {
      throw new Error(`Failed to load VK for circuit: ${circuitName}`);
    }
    const vkArrayBuffer = await vkResponse.arrayBuffer();
    return new Uint8Array(vkArrayBuffer);
  }

  /**
   * Encodes public inputs from circuit inputs based on circuit ABI
   *
   * @param circuit - The compiled circuit JSON
   * @param inputs - Circuit input values as key-value pairs
   * @returns Encoded public inputs as bytes
   */
  encodePublicInputs(
    circuit: CompiledCircuit,
    inputs: CircuitInputs,
  ): Uint8Array {
    const publicParams = circuit.abi.parameters.filter(
      (p) => p.visibility === "public",
    );
    const publicInputFields: Uint8Array[] = [];

    if (publicParams.length > 0) {
      publicParams.forEach((p) => {
        const inputValue = inputs[p.name];

        // Helper function to encode a single value as a 32-byte field element
        const encodeField = (
          value: number | string | bigint,
          elementType: "integer" | "field",
          width?: number,
        ): Uint8Array => {
          const field = new Uint8Array(32);
          const bigIntValue = BigInt(value);

          if (elementType === "integer" && width) {
            const numBytes = width / 8;
            let val = bigIntValue;
            for (let i = 0; i < numBytes; i++) {
              field[32 - 1 - i] = Number(val & BigInt(0xff));
              val = val >> BigInt(8);
            }
          } else {
            let val = bigIntValue;
            for (let i = 0; i < 32; i++) {
              field[32 - 1 - i] = Number(val & BigInt(0xff));
              val = val >> BigInt(8);
            }
          }
          return field;
        };

        // Handle array types (e.g., puzzle: pub [Field; 81])
        if (p.type.kind === "array") {
          const arrayLength = p.type.length;
          const elementType = p.type.type;
          const elementKind = elementType.kind;
          const elementWidth =
            elementType.kind === "integer" ? elementType.width : undefined;

          if (!Array.isArray(inputValue)) {
            throw new Error(
              `Expected array for public parameter ${p.name}, got ${typeof inputValue}`,
            );
          }
          if (inputValue.length !== arrayLength) {
            throw new Error(
              `Array length mismatch for ${p.name}: expected ${arrayLength}, got ${inputValue.length}`,
            );
          }

          const typedArray = inputValue as Array<number | string | bigint>;
          typedArray.forEach((element) => {
            const field = encodeField(element, elementKind, elementWidth);
            publicInputFields.push(field);
          });
        }
        // Handle scalar integer types
        else if (p.type.kind === "integer") {
          const field = encodeField(
            inputValue as number | string | bigint,
            "integer",
            p.type.width,
          );
          publicInputFields.push(field);
        }
        // Handle scalar field types
        else if (p.type.kind === "field") {
          const field = encodeField(
            inputValue as number | string | bigint,
            "field",
          );
          publicInputFields.push(field);
        } else {
          throw new Error(
            `Unsupported public parameter type: ${p.type.kind} for parameter ${p.name}`,
          );
        }
      });
    }

    // Concatenate all public input fields
    const totalPublicInputBytes = publicInputFields.length * 32;
    const publicInputsBytes = new Uint8Array(totalPublicInputBytes);
    publicInputFields.forEach((field, i) => {
      publicInputsBytes.set(field, i * 32);
    });

    return publicInputsBytes;
  }

  /**
   * Builds a proof blob from public inputs and proof bytes
   *
   * @param publicInputsBytes - Encoded public inputs
   * @param proofBytes - Proof bytes (can be dummy/invalid for testing)
   * @returns Proof blob and proof ID
   */
  buildProofBlob(
    publicInputsBytes: Uint8Array,
    proofBytes: Uint8Array,
  ): { proofBlob: Uint8Array; proofId: string } {
    const proofFieldCount = proofBytes.length / 32;
    const publicInputFieldCount = publicInputsBytes.length / 32;
    const totalFields = proofFieldCount + publicInputFieldCount;

    // Create header (4 bytes, big-endian u32)
    const header = new Uint8Array(4);
    const view = new DataView(header.buffer);
    view.setUint32(0, totalFields, false); // false = big-endian

    // Concatenate: header || publicInputs || proof
    const proofBlob = new Uint8Array(
      header.length + publicInputsBytes.length + proofBytes.length,
    );
    proofBlob.set(header, 0);
    proofBlob.set(publicInputsBytes, header.length);
    proofBlob.set(proofBytes, header.length + publicInputsBytes.length);

    // Compute proof ID (Keccak-256 hash of proof blob)
    const proofIdBytes = keccak_256(proofBlob);
    const proofId = Array.from(proofIdBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return { proofBlob, proofId };
  }
}
