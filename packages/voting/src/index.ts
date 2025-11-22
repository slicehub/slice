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
    contractId: "CCJUC74PEVVW2LYGJVB3A2G2WOTBTYCSPJLA4IT5ZGCAGSDHS5ZBEBBB",
  }
} as const

export const Errors = {
  /**
   * Failed to verify proof
   */
  1: {message:"ProofVerificationFailed"},
  /**
   * Nullifier already used (double vote attempt)
   */
  2: {message:"NullifierAlreadyUsed"},
  /**
   * Proposal not found
   */
  3: {message:"ProposalNotFound"},
  /**
   * Proposal deadline has passed
   */
  4: {message:"ProposalDeadlinePassed"},
  /**
   * Commitment not found for reveal
   */
  5: {message:"CommitmentNotFound"},
  /**
   * Invalid commitment (doesn't match reveal)
   */
  6: {message:"InvalidCommitment"},
  /**
   * Vote already revealed
   */
  7: {message:"VoteAlreadyRevealed"},
  /**
   * Invalid vote value
   */
  8: {message:"InvalidVoteValue"},
  /**
   * Only admin can perform this action
   */
  9: {message:"Unauthorized"}
}

export interface Client {
  /**
   * Construct and simulate a admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get current admin
   */
  admin: (options?: {
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
  }) => Promise<AssembledTransaction<Option<string>>>

  /**
   * Construct and simulate a create_proposal transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Create a new proposal
   * Returns proposal_id
   */
  create_proposal: ({creator, description, deadline}: {creator: string, description: Buffer, deadline: u64}, options?: {
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
  }) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a last_proposal_id transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get the last proposal ID (next proposal ID - 1)
   */
  last_proposal_id: (options?: {
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
  }) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a get_proposal transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get proposal details
   */
  get_proposal: ({proposal_id}: {proposal_id: u64}, options?: {
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
  }) => Promise<AssembledTransaction<Option<readonly [Buffer, u64, string]>>>

  /**
   * Construct and simulate a vote transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Vote (commit phase): Submit a zero-knowledge proof of a vote commitment
   */
  vote: ({voter, proposal_id, commitment, nullifier, vk_json, proof_blob}: {voter: string, proposal_id: u64, commitment: Buffer, nullifier: Buffer, vk_json: Buffer, proof_blob: Buffer}, options?: {
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
   * Construct and simulate a reveal_vote transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Reveal vote: Reveal the vote and salt to verify commitment
   * This is called after voting period ends
   */
  reveal_vote: ({voter, proposal_id, nullifier, vote, salt}: {voter: string, proposal_id: u64, nullifier: Buffer, vote: u32, salt: Buffer}, options?: {
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
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_vote_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get vote count for a specific vote option in a proposal
   */
  get_vote_count: ({proposal_id, vote}: {proposal_id: u64, vote: u32}, options?: {
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
  }) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a is_nullifier_used transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Check if a nullifier has been used
   */
  is_nullifier_used: ({nullifier}: {nullifier: Buffer}, options?: {
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

  /**
   * Construct and simulate a is_vote_revealed transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Check if a vote has been revealed
   */
  is_vote_revealed: ({proposal_id, nullifier}: {proposal_id: u64, nullifier: Buffer}, options?: {
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
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {admin}: {admin: string},
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
    return ContractClient.deploy({admin}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAACQAAABZGYWlsZWQgdG8gdmVyaWZ5IHByb29mAAAAAAAXUHJvb2ZWZXJpZmljYXRpb25GYWlsZWQAAAAAAQAAACxOdWxsaWZpZXIgYWxyZWFkeSB1c2VkIChkb3VibGUgdm90ZSBhdHRlbXB0KQAAABROdWxsaWZpZXJBbHJlYWR5VXNlZAAAAAIAAAASUHJvcG9zYWwgbm90IGZvdW5kAAAAAAAQUHJvcG9zYWxOb3RGb3VuZAAAAAMAAAAcUHJvcG9zYWwgZGVhZGxpbmUgaGFzIHBhc3NlZAAAABZQcm9wb3NhbERlYWRsaW5lUGFzc2VkAAAAAAAEAAAAH0NvbW1pdG1lbnQgbm90IGZvdW5kIGZvciByZXZlYWwAAAAAEkNvbW1pdG1lbnROb3RGb3VuZAAAAAAABQAAAClJbnZhbGlkIGNvbW1pdG1lbnQgKGRvZXNuJ3QgbWF0Y2ggcmV2ZWFsKQAAAAAAABFJbnZhbGlkQ29tbWl0bWVudAAAAAAAAAYAAAAVVm90ZSBhbHJlYWR5IHJldmVhbGVkAAAAAAAAE1ZvdGVBbHJlYWR5UmV2ZWFsZWQAAAAABwAAABJJbnZhbGlkIHZvdGUgdmFsdWUAAAAAABBJbnZhbGlkVm90ZVZhbHVlAAAACAAAACJPbmx5IGFkbWluIGNhbiBwZXJmb3JtIHRoaXMgYWN0aW9uAAAAAAAMVW5hdXRob3JpemVkAAAACQ==",
        "AAAAAAAAADRDb25zdHJ1Y3RvciB0byBpbml0aWFsaXplIHRoZSBjb250cmFjdCB3aXRoIGFuIGFkbWluAAAADV9fY29uc3RydWN0b3IAAAAAAAABAAAAAAAAAAVhZG1pbgAAAAAAABMAAAAA",
        "AAAAAAAAABFHZXQgY3VycmVudCBhZG1pbgAAAAAAAAVhZG1pbgAAAAAAAAAAAAABAAAD6AAAABM=",
        "AAAAAAAAAClDcmVhdGUgYSBuZXcgcHJvcG9zYWwKUmV0dXJucyBwcm9wb3NhbF9pZAAAAAAAAA9jcmVhdGVfcHJvcG9zYWwAAAAAAwAAAAAAAAAHY3JlYXRvcgAAAAATAAAAAAAAAAtkZXNjcmlwdGlvbgAAAAAOAAAAAAAAAAhkZWFkbGluZQAAAAYAAAABAAAABg==",
        "AAAAAAAAAC9HZXQgdGhlIGxhc3QgcHJvcG9zYWwgSUQgKG5leHQgcHJvcG9zYWwgSUQgLSAxKQAAAAAQbGFzdF9wcm9wb3NhbF9pZAAAAAAAAAABAAAABg==",
        "AAAAAAAAABRHZXQgcHJvcG9zYWwgZGV0YWlscwAAAAxnZXRfcHJvcG9zYWwAAAABAAAAAAAAAAtwcm9wb3NhbF9pZAAAAAAGAAAAAQAAA+gAAAPtAAAAAwAAAA4AAAAGAAAAEw==",
        "AAAAAAAAAEdWb3RlIChjb21taXQgcGhhc2UpOiBTdWJtaXQgYSB6ZXJvLWtub3dsZWRnZSBwcm9vZiBvZiBhIHZvdGUgY29tbWl0bWVudAAAAAAEdm90ZQAAAAYAAAAAAAAABXZvdGVyAAAAAAAAEwAAAAAAAAALcHJvcG9zYWxfaWQAAAAABgAAAAAAAAAKY29tbWl0bWVudAAAAAAD7gAAACAAAAAAAAAACW51bGxpZmllcgAAAAAAA+4AAAAgAAAAAAAAAAd2a19qc29uAAAAAA4AAAAAAAAACnByb29mX2Jsb2IAAAAAAA4AAAABAAAD6QAAA+4AAAAgAAAAAw==",
        "AAAAAAAAAGJSZXZlYWwgdm90ZTogUmV2ZWFsIHRoZSB2b3RlIGFuZCBzYWx0IHRvIHZlcmlmeSBjb21taXRtZW50ClRoaXMgaXMgY2FsbGVkIGFmdGVyIHZvdGluZyBwZXJpb2QgZW5kcwAAAAAAC3JldmVhbF92b3RlAAAAAAUAAAAAAAAABXZvdGVyAAAAAAAAEwAAAAAAAAALcHJvcG9zYWxfaWQAAAAABgAAAAAAAAAJbnVsbGlmaWVyAAAAAAAD7gAAACAAAAAAAAAABHZvdGUAAAAEAAAAAAAAAARzYWx0AAAD7gAAACAAAAABAAAD6QAAA+0AAAAAAAAAAw==",
        "AAAAAAAAADdHZXQgdm90ZSBjb3VudCBmb3IgYSBzcGVjaWZpYyB2b3RlIG9wdGlvbiBpbiBhIHByb3Bvc2FsAAAAAA5nZXRfdm90ZV9jb3VudAAAAAAAAgAAAAAAAAALcHJvcG9zYWxfaWQAAAAABgAAAAAAAAAEdm90ZQAAAAQAAAABAAAABg==",
        "AAAAAAAAACJDaGVjayBpZiBhIG51bGxpZmllciBoYXMgYmVlbiB1c2VkAAAAAAARaXNfbnVsbGlmaWVyX3VzZWQAAAAAAAABAAAAAAAAAAludWxsaWZpZXIAAAAAAAPuAAAAIAAAAAEAAAAB",
        "AAAAAAAAACFDaGVjayBpZiBhIHZvdGUgaGFzIGJlZW4gcmV2ZWFsZWQAAAAAAAAQaXNfdm90ZV9yZXZlYWxlZAAAAAIAAAAAAAAAC3Byb3Bvc2FsX2lkAAAAAAYAAAAAAAAACW51bGxpZmllcgAAAAAAA+4AAAAgAAAAAQAAAAE=" ]),
      options
    )
  }
  public readonly fromJSON = {
    admin: this.txFromJSON<Option<string>>,
        create_proposal: this.txFromJSON<u64>,
        last_proposal_id: this.txFromJSON<u64>,
        get_proposal: this.txFromJSON<Option<readonly [Buffer, u64, string]>>,
        vote: this.txFromJSON<Result<Buffer>>,
        reveal_vote: this.txFromJSON<Result<void>>,
        get_vote_count: this.txFromJSON<u64>,
        is_nullifier_used: this.txFromJSON<boolean>,
        is_vote_revealed: this.txFromJSON<boolean>
  }
}