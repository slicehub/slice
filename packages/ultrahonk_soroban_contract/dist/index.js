import { Buffer } from "buffer";
import { Client as ContractClient, Spec as ContractSpec, } from '@stellar/stellar-sdk/contract';
export * from '@stellar/stellar-sdk';
export * as contract from '@stellar/stellar-sdk/contract';
export * as rpc from '@stellar/stellar-sdk/rpc';
if (typeof window !== 'undefined') {
    //@ts-ignore Buffer exists
    window.Buffer = window.Buffer || Buffer;
}
export const networks = {
    standalone: {
        networkPassphrase: "Standalone Network ; February 2017",
        contractId: "CCBDMYDBPMYDOSZNC7LWBTYVOTMZK3XZF3N2RABGMZFK4A5MYR7BJBBC",
    }
};
export const Errors = {
    1: { message: "VkParseError" },
    2: { message: "ProofParseError" },
    3: { message: "VerificationFailed" },
    4: { message: "VkNotSet" }
};
export class Client extends ContractClient {
    options;
    static async deploy(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options) {
        return ContractClient.deploy(null, options);
    }
    constructor(options) {
        super(new ContractSpec(["AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAABAAAAAAAAAAMVmtQYXJzZUVycm9yAAAAAQAAAAAAAAAPUHJvb2ZQYXJzZUVycm9yAAAAAAIAAAAAAAAAElZlcmlmaWNhdGlvbkZhaWxlZAAAAAAAAwAAAAAAAAAIVmtOb3RTZXQAAAAE",
            "AAAAAAAAAE5WZXJpZnkgYW4gVWx0cmFIb25rIHByb29mOyBvbiBzdWNjZXNzIHN0b3JlIHByb29mX2lkICg9IGtlY2NhazI1Nihwcm9vZl9ibG9iKSkAAAAAAAx2ZXJpZnlfcHJvb2YAAAACAAAAAAAAAAd2a19qc29uAAAAAA4AAAAAAAAACnByb29mX2Jsb2IAAAAAAA4AAAABAAAD6QAAA+4AAAAgAAAAAw==",
            "AAAAAAAAAD1TZXQgdmVyaWZpY2F0aW9uIGtleSBKU09OIGFuZCBjYWNoZSBpdHMgaGFzaC4gUmV0dXJucyB2a19oYXNoAAAAAAAABnNldF92awAAAAAAAQAAAAAAAAAHdmtfanNvbgAAAAAOAAAAAQAAA+kAAAPuAAAAIAAAAAM=",
            "AAAAAAAAACNWZXJpZnkgdXNpbmcgdGhlIG9uLWNoYWluIHN0b3JlZCBWSwAAAAAbdmVyaWZ5X3Byb29mX3dpdGhfc3RvcmVkX3ZrAAAAAAEAAAAAAAAACnByb29mX2Jsb2IAAAAAAA4AAAABAAAD6QAAA+4AAAAgAAAAAw==",
            "AAAAAAAAACtRdWVyeSBpZiBhIHByb29mX2lkIHdhcyBwcmV2aW91c2x5IHZlcmlmaWVkAAAAAAtpc192ZXJpZmllZAAAAAABAAAAAAAAAAhwcm9vZl9pZAAAA+4AAAAgAAAAAQAAAAE="]), options);
        this.options = options;
    }
    fromJSON = {
        verify_proof: (this.txFromJSON),
        set_vk: (this.txFromJSON),
        verify_proof_with_stored_vk: (this.txFromJSON),
        is_verified: (this.txFromJSON)
    };
}
