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
        contractId: "CC35VHPZLQGE7EEW4SZYR2WRBYGE537METEHLJUFCQ3ES5S3FZCCCKPW",
    }
};
export const Errors = {
    /**
     * The contract failed to transfer XLM to the guesser
     */
    1: { message: "FailedToTransferToGuesser" },
    /**
     * The guesser failed to transfer XLM to the contract
     */
    2: { message: "FailedToTransferFromGuesser" },
    /**
     * The contract has no balance to transfer to the guesser
     */
    3: { message: "NoBalanceToTransfer" }
};
export class Client extends ContractClient {
    options;
    static async deploy(
    /** Constructor/Initialization Args for the contract's `__constructor` method */
    { admin }, 
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options) {
        return ContractClient.deploy({ admin }, options);
    }
    constructor(options) {
        super(new ContractSpec(["AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAAAwAAADJUaGUgY29udHJhY3QgZmFpbGVkIHRvIHRyYW5zZmVyIFhMTSB0byB0aGUgZ3Vlc3NlcgAAAAAAGUZhaWxlZFRvVHJhbnNmZXJUb0d1ZXNzZXIAAAAAAAABAAAAMlRoZSBndWVzc2VyIGZhaWxlZCB0byB0cmFuc2ZlciBYTE0gdG8gdGhlIGNvbnRyYWN0AAAAAAAbRmFpbGVkVG9UcmFuc2ZlckZyb21HdWVzc2VyAAAAAAIAAAA2VGhlIGNvbnRyYWN0IGhhcyBubyBiYWxhbmNlIHRvIHRyYW5zZmVyIHRvIHRoZSBndWVzc2VyAAAAAAATTm9CYWxhbmNlVG9UcmFuc2ZlcgAAAAAD",
            "AAAAAAAAAEhDb25zdHJ1Y3RvciB0byBpbml0aWFsaXplIHRoZSBjb250cmFjdCB3aXRoIGFuIGFkbWluIGFuZCBhIHJhbmRvbSBudW1iZXIAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAEAAAAAAAAABWFkbWluAAAAAAAAEwAAAAA=",
            "AAAAAAAAAAAAAAAKc2V0X3B1enpsZQAAAAAAAQAAAAAAAAAGcHV6emxlAAAAAAAOAAAAAA==",
            "AAAAAAAAACVWZXJpZnkgdGhlIHB1enpsZSBpcyBjb3JyZWN0bHkgc29sdmVkAAAAAAAADXZlcmlmeV9wdXp6bGUAAAAAAAADAAAAAAAAAAdndWVzc2VyAAAAABMAAAAAAAAAB3ZrX2pzb24AAAAADgAAAAAAAAAKcHJvb2ZfYmxvYgAAAAAADgAAAAEAAAPpAAAD7gAAACAAAAAD",
            "AAAAAAAAAAAAAAAJcHJpemVfcG90AAAAAAAAAAAAAAEAAAAL",
            "AAAAAAAAACZBZGQgbW9yZSBmdW5kcyB0byB0aGUgY29udHJhY3QsIGluIFhMTQAAAAAACWFkZF9mdW5kcwAAAAAAAAIAAAAAAAAABmZ1bmRlcgAAAAAAEwAAAAAAAAAGYW1vdW50AAAAAAAGAAAAAA==",
            "AAAAAAAAADlVcGdyYWRlIHRoZSBjb250cmFjdCB0byBuZXcgd2FzbS4gT25seSBjYWxsYWJsZSBieSBhZG1pbi4AAAAAAAAHdXBncmFkZQAAAAABAAAAAAAAAA1uZXdfd2FzbV9oYXNoAAAAAAAD7gAAACAAAAAA",
            "AAAAAAAAACxSZWFkIG9ubHkgZnVuY3Rpb24gdG8gZ2V0IHRoZSBjdXJyZW50IG51bWJlcgAAAAZwdXp6bGUAAAAAAAAAAAABAAAADg==",
            "AAAAAAAAABFHZXQgY3VycmVudCBhZG1pbgAAAAAAAAVhZG1pbgAAAAAAAAAAAAABAAAD6AAAABM=",
            "AAAAAAAAAChTZXQgYSBuZXcgYWRtaW4uIE9ubHkgY2FsbGFibGUgYnkgYWRtaW4uAAAACXNldF9hZG1pbgAAAAAAAAEAAAAAAAAABWFkbWluAAAAAAAAEwAAAAA="]), options);
        this.options = options;
    }
    fromJSON = {
        set_puzzle: (this.txFromJSON),
        verify_puzzle: (this.txFromJSON),
        prize_pot: (this.txFromJSON),
        add_funds: (this.txFromJSON),
        upgrade: (this.txFromJSON),
        puzzle: (this.txFromJSON),
        admin: (this.txFromJSON),
        set_admin: (this.txFromJSON)
    };
}
