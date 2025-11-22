/**
 * StellarContractService - Utility functions for Stellar blockchain interactions
 *
 * This module provides utility functions for wallet operations, transaction data extraction,
 * and formatting. Components should use contract bindings directly.
 */

import { Buffer } from "buffer";
import game from "../contracts/guess_the_puzzle";

type InstructionsValue =
  | { toString: () => string }
  | string
  | number
  | undefined
  | null;

interface SimulationResources {
  _attributes?: {
    instructions?: InstructionsValue;
  };
}

interface SimulationDataAttributes {
  resources?: SimulationResources;
}

interface SimulationData {
  _attributes?: SimulationDataAttributes;
}

interface TransactionDataWrapper {
  _data?: SimulationData;
}

interface SimulationResult {
  transactionData?: TransactionDataWrapper;
}

interface TxWithSimulation {
  simulation?: SimulationResult;
}

type TransactionResponse = {
  resultXdr?: { feeCharged?: () => { toString(): string } };
  feeCharged?: string | number;
  fee?: string | number;
};

type TransactionResult =
  | string
  | {
      hash?: string;
      transactionHash?: string;
      response?: TransactionResponse;
      transactionResponse?: TransactionResponse;
      getTransactionResponse?: () => TransactionResponse | undefined;
    };

/**
 * Transaction data extracted from a transaction result
 */
export interface TransactionData {
  /** Transaction hash */
  txHash?: string;
  /** Transaction fee in stroops */
  fee?: string;
  /** CPU instructions consumed */
  cpuInstructions?: number;
  /** Whether transaction was successful */
  success: boolean;
}

/**
 * Utility functions for Stellar contract interactions
 */
export class StellarContractService {
  /**
   * Extract CPU instructions from a transaction simulation
   *
   * @param tx - Assembled transaction with simulation data
   * @returns CPU instructions consumed, or undefined if not available
   */
  static extractCpuInstructions(
    tx: TxWithSimulation | undefined,
  ): number | undefined {
    const instructionsValue =
      tx?.simulation?.transactionData?._data?._attributes?.resources
        ?._attributes?.instructions;

    if (instructionsValue === undefined || instructionsValue === null) {
      return undefined;
    }

    const instructionString =
      typeof instructionsValue === "string"
        ? instructionsValue
        : typeof instructionsValue === "number"
          ? instructionsValue.toString()
          : typeof instructionsValue?.toString === "function"
            ? instructionsValue.toString()
            : undefined;

    if (!instructionString) {
      return undefined;
    }

    const parsed = Number(instructionString);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  /**
   * Extract transaction data from a signed transaction result
   *
   * @param result - Result from signAndSend
   * @returns Transaction data including hash, fee, and success status
   */
  static extractTransactionData(result: TransactionResult): TransactionData {
    // signAndSend throws on error, so if we got here, the transaction succeeded
    const txHash =
      typeof result === "string"
        ? result
        : result?.hash || result?.transactionHash || "";
    let fee: string | undefined;

    // Try to get transaction response for fee information
    const resolveResponse = (): TransactionResponse | undefined => {
      if (typeof result === "string") return undefined;

      if (typeof result?.getTransactionResponse === "function") {
        try {
          return result.getTransactionResponse();
        } catch {
          return undefined;
        }
      }

      if (result?.response) {
        return result.response;
      }

      if (result?.transactionResponse) {
        return result.transactionResponse;
      }

      return undefined;
    };

    const txResponse = resolveResponse();

    // Extract fee if available
    if (txResponse) {
      if (
        txResponse.resultXdr &&
        typeof txResponse.resultXdr.feeCharged === "function"
      ) {
        fee = txResponse.resultXdr.feeCharged().toString();
      } else if (txResponse.feeCharged) {
        fee = txResponse.feeCharged.toString();
      } else if (txResponse.fee) {
        fee = txResponse.fee.toString();
      }
    }

    // signAndSend throws on error, so if we got here without an exception, it succeeded
    return {
      txHash,
      fee,
      success: true,
    };
  }

  /**
   * Format stroops to XLM
   *
   * @param stroops - Amount in stroops (string or number)
   * @returns Formatted XLM amount as string
   */
  static formatStroopsToXlm(stroops: string | number): string {
    const stroopsNum =
      typeof stroops === "string" ? parseInt(stroops) : stroops;
    return (stroopsNum / 10_000_000).toFixed(7);
  }

  /**
   * Convert Uint8Array to Buffer (for contract method calls)
   *
   * @param data - Uint8Array data
   * @returns Buffer
   */
  static toBuffer(data: Uint8Array): Buffer {
    return Buffer.from(data);
  }
}

/**
 * Export contract client for direct use by components
 */
export { game as contractClient };
