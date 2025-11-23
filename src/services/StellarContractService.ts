/**
 * StellarContractService - Utility functions for Stellar blockchain interactions
 *
 * This module provides utility functions for wallet operations, transaction data extraction,
 * and formatting. Components should use contract bindings directly.
 */

import { Buffer } from "buffer";
import type { SentTransaction } from "@stellar/stellar-sdk/contract";
import { Api } from "@stellar/stellar-sdk/rpc";
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

type SignAndSendResult = TransactionResult | SentTransaction<unknown>;

const isSentTransaction = (
  value: SignAndSendResult,
): value is SentTransaction<unknown> => {
  if (!value || typeof value !== "object") return false;
  return "sendTransactionResponse" in value || "getTransactionResponse" in value;
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
  static extractTransactionData(result: SignAndSendResult): TransactionData {
    const txHash =
      typeof result === "string"
        ? result
        : isSentTransaction(result)
          ? result.getTransactionResponse?.txHash ||
            result.sendTransactionResponse?.hash ||
            ""
          : result?.hash || result?.transactionHash || "";
    let fee: string | undefined;

    // Try to get transaction response for fee information
    const resolveResponse = ():
      | TransactionResponse
      | Api.GetTransactionResponse
      | undefined => {
      if (typeof result === "string") return undefined;

      if (isSentTransaction(result)) {
        return result.getTransactionResponse;
      }

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
      const resultXdr =
        "resultXdr" in txResponse ? txResponse.resultXdr : undefined;
      const hasFeeCharged =
        resultXdr &&
        typeof resultXdr === "object" &&
        "feeCharged" in resultXdr &&
        typeof (resultXdr as { feeCharged?: () => { toString(): string } })
          .feeCharged === "function";

      if (hasFeeCharged) {
        const feeValue = (
          resultXdr as { feeCharged: () => { toString(): string } }
        ).feeCharged();
        fee = feeValue.toString();
      } else if (
        "feeCharged" in txResponse &&
        txResponse.feeCharged !== undefined
      ) {
        fee = txResponse.feeCharged.toString();
      } else if ("fee" in txResponse && txResponse.fee !== undefined) {
        fee = txResponse.fee.toString();
      }
    }

    const failedSend =
      isSentTransaction(result) &&
      result.sendTransactionResponse?.status === "ERROR";
    const failedGet =
      isSentTransaction(result) &&
      result.getTransactionResponse?.status === Api.GetTransactionStatus.FAILED;

    const success = !(failedSend || failedGet);

    return {
      txHash,
      fee,
      success,
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
