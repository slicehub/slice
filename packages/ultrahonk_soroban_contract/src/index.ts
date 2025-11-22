import { Buffer } from "buffer";
import { Address } from '@stellar/stellar-sdk';
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from '@stellar/stellar-sdk/contract';
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Typepoint,
  Duration,
} from '@stellar/stellar-sdk/contract';
export * from '@stellar/stellar-sdk'
export * as contract from '@stellar/stellar-sdk/contract'
export * as rpc from '@stellar/stellar-sdk/rpc'

if (typeof window !== 'undefined') {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  standalone: {
    networkPassphrase: "Standalone Network ; February 2017",
    contractId: "CCBDMYDBPMYDOSZNC7LWBTYVOTMZK3XZF3N2RABGMZFK4A5MYR7BJBBC",
  }
} as const

export const Errors = {
  1: {message:"VkParseError"},
  2: {message:"ProofParseError"},
  3: {message:"VerificationFailed"},
  4: {message:"VkNotSet"}
}

export interface Client {
  /**
   * Construct and simulate a verify_proof transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Verify an UltraHonk proof; on success store proof_id (= keccak256(proof_blob))
   */
  verify_proof: ({vk_json, proof_blob}: {vk_json: Buffer, proof_blob: Buffer}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<Buffer>>>

  /**
   * Construct and simulate a set_vk transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Set verification key JSON and cache its hash. Returns vk_hash
   */
  set_vk: ({vk_json}: {vk_json: Buffer}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<Buffer>>>

  /**
   * Construct and simulate a verify_proof_with_stored_vk transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Verify using the on-chain stored VK
   */
  verify_proof_with_stored_vk: ({proof_blob}: {proof_blob: Buffer}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<Buffer>>>

  /**
   * Construct and simulate a is_verified transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Query if a proof_id was previously verified
   */
  is_verified: ({proof_id}: {proof_id: Buffer}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<boolean>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAABAAAAAAAAAAMVmtQYXJzZUVycm9yAAAAAQAAAAAAAAAPUHJvb2ZQYXJzZUVycm9yAAAAAAIAAAAAAAAAElZlcmlmaWNhdGlvbkZhaWxlZAAAAAAAAwAAAAAAAAAIVmtOb3RTZXQAAAAE",
        "AAAAAAAAAE5WZXJpZnkgYW4gVWx0cmFIb25rIHByb29mOyBvbiBzdWNjZXNzIHN0b3JlIHByb29mX2lkICg9IGtlY2NhazI1Nihwcm9vZl9ibG9iKSkAAAAAAAx2ZXJpZnlfcHJvb2YAAAACAAAAAAAAAAd2a19qc29uAAAAAA4AAAAAAAAACnByb29mX2Jsb2IAAAAAAA4AAAABAAAD6QAAA+4AAAAgAAAAAw==",
        "AAAAAAAAAD1TZXQgdmVyaWZpY2F0aW9uIGtleSBKU09OIGFuZCBjYWNoZSBpdHMgaGFzaC4gUmV0dXJucyB2a19oYXNoAAAAAAAABnNldF92awAAAAAAAQAAAAAAAAAHdmtfanNvbgAAAAAOAAAAAQAAA+kAAAPuAAAAIAAAAAM=",
        "AAAAAAAAACNWZXJpZnkgdXNpbmcgdGhlIG9uLWNoYWluIHN0b3JlZCBWSwAAAAAbdmVyaWZ5X3Byb29mX3dpdGhfc3RvcmVkX3ZrAAAAAAEAAAAAAAAACnByb29mX2Jsb2IAAAAAAA4AAAABAAAD6QAAA+4AAAAgAAAAAw==",
        "AAAAAAAAACtRdWVyeSBpZiBhIHByb29mX2lkIHdhcyBwcmV2aW91c2x5IHZlcmlmaWVkAAAAAAtpc192ZXJpZmllZAAAAAABAAAAAAAAAAhwcm9vZl9pZAAAA+4AAAAgAAAAAQAAAAE=" ]),
      options
    )
  }
  public readonly fromJSON = {
    verify_proof: this.txFromJSON<Result<Buffer>>,
        set_vk: this.txFromJSON<Result<Buffer>>,
        verify_proof_with_stored_vk: this.txFromJSON<Result<Buffer>>,
        is_verified: this.txFromJSON<boolean>
  }
}