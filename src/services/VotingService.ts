/**
 * VotingService - Service for interacting with the voting contract
 */

import { Buffer } from 'buffer';
import votingContract from '../contracts/voting';
import { StellarContractService } from './StellarContractService';
import { NoirService } from './NoirService';
import {
  bytesToHex,
  calculateCommitment,
  calculateNullifier,
} from '../util/votingUtils';

export interface Proposal {
  id: number;
  description: string;
  deadline: number;
  creator: string;
}

export interface VoteResult {
  nullifier: string;
  commitment: string;
  proofId?: string;
}

export interface RevealResult {
  success: boolean;
  txHash?: string;
}

/**
 * Service for voting contract interactions
 */
export class VotingService {
  private noirService: NoirService;

  constructor() {
    this.noirService = new NoirService();
  }

  /**
   * Set the contract address (after deployment)
   */
  setContractAddress(contractId: string) {
    // Voting contract will be generated after deployment
    // For now, we'll need to update the contract import
    if ((votingContract as any).options) {
      (votingContract as any).options.contractId = contractId;
    }
  }

  /**
   * Create a new proposal
   * Any wallet can create proposals (disputes for voting)
   */
  async createProposal(
    userAddress: string,
    description: string,
    deadline: number,
    signTransaction: (xdr: string) => Promise<any>
  ): Promise<number> {
    try {
      // Set the publicKey to the user address
      if ((votingContract as any).options) {
        (votingContract as any).options.publicKey = userAddress;
      }

      const descriptionBytes = Buffer.from(description, 'utf-8');

      const tx = await (votingContract as any).create_proposal({
        creator: userAddress,
        description: descriptionBytes,
        deadline,
      });

      // The result might be in tx.result (simulation result) before sending
      const simulatedResult = tx?.result;

      const result = await tx.signAndSend({ signTransaction });

      // Try different ways to get the result
      let proposalId: number | undefined;
      
      // Helper function to convert BigInt or number to number
      const toNumber = (value: any): number | undefined => {
        if (value === undefined || value === null) return undefined;
        if (typeof value === 'number') return value;
        if (typeof value === 'bigint') return Number(value);
        // Try to convert string to number
        if (typeof value === 'string') {
          const num = Number(value);
          return isNaN(num) ? undefined : num;
        }
        return undefined;
      };

      // First check the simulation result (might be BigInt)
      if (simulatedResult !== undefined) {
        const num = toNumber(simulatedResult);
        if (num !== undefined) {
          proposalId = num;
        }
      }
      
      // If we don't have proposalId yet, check the result from signAndSend
      if (proposalId === undefined && result && typeof result === 'object') {
        // Check result.result
        if (result.result !== undefined) {
          const num = toNumber(result.result);
          if (num !== undefined) {
            proposalId = num;
          }
        }
        // Check result.returnValue
        if (proposalId === undefined && result.returnValue !== undefined) {
          const num = toNumber(result.returnValue);
          if (num !== undefined) {
            proposalId = num;
          }
        }
        // Check if result has a method to get the return value
        if (proposalId === undefined && typeof result.getReturnValue === 'function') {
          try {
            const returnValue = result.getReturnValue();
            const num = toNumber(returnValue);
            if (num !== undefined) {
              proposalId = num;
            }
          } catch (e) {
            // Ignore errors
          }
        }
      }

      if (proposalId !== undefined) {
        return proposalId;
      }

      // If we got here, the transaction succeeded but we couldn't extract the result
      const txData = StellarContractService.extractTransactionData(result);
      console.warn('Transaction succeeded but result not found in expected format:', { result, simulatedResult, tx });
      throw new Error(`Failed to extract proposal ID from transaction result. Transaction hash: ${txData.txHash || 'Unknown'}`);
    } catch (error: any) {
      console.error('Error creating proposal:', error);
      // Extract more detailed error message
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      throw new Error(`Failed to create proposal: ${errorMessage}`);
    }
  }

  /**
   * Get the last proposal ID
   */
  async getLastProposalId(): Promise<number> {
    try {
      const tx = await (votingContract as any).last_proposal_id();
      const result = (tx).result;
      // Convert BigInt to number if needed
      if (typeof result === 'bigint') {
        return Number(result);
      }
      return result || 0;
    } catch (error: any) {
      // Silently fail if function doesn't exist (old contract) or if there's any error
      // This will trigger sequential loading as fallback
      // Only log if it's not a "function doesn't exist" error
      if (!error?.message?.includes('non-existent contract function')) {
        console.log('[VotingService] last_proposal_id not available, using sequential loading');
      }
      return 0;
    }
  }

  /**
   * Get proposal details
   */
  async getProposal(proposalId: number): Promise<Proposal | null> {
    try {
      const tx = await (votingContract as any).get_proposal({ proposal_id: proposalId });
      const result = (tx).result;

      if (!result || !Array.isArray(result) || result.length !== 3) {
        return null;
      }

      const [descriptionBytes, deadline, creator] = result;
      const description = Buffer.from(descriptionBytes as Buffer | Uint8Array).toString('utf-8');

      return {
        id: proposalId,
        description,
        deadline: deadline as number,
        creator: creator as string,
      };
    } catch (error) {
      console.error('Failed to get proposal:', error);
      return null;
    }
  }

  /**
   * Vote on a proposal (commit phase)
   * Calculates commitment and nullifier first, then generates proof with these as public inputs
   */
  async vote(
    voter: string,
    proposalId: number,
    vote: number, // 0 or 1
    identitySecret: bigint,
    salt: bigint,
    signTransaction: (xdr: string) => Promise<any>
  ): Promise<VoteResult> {
    // Step 1: Calculate commitment and nullifier by executing the circuit once
    // The circuit calculates these internally, so we execute it to get computed values
    const circuit = await this.loadCircuit('voting');
    const { Noir } = await import('@noir-lang/noir_js');
    const noir = new Noir(circuit);

    // Execute circuit to calculate commitment and nullifier
    // We need these values before generating proof because they're public inputs
    const computed = await this.calculateCommitmentAndNullifier(
      noir,
      vote,
      salt,
      identitySecret,
      proposalId
    );

    // Step 2: Generate proof with calculated values as public inputs
    const proofResult = await this.noirService.generateProof('voting', {
      identity_secret: identitySecret.toString(),
      vote,
      salt: salt.toString(),
      commitment: computed.commitment.toString(),
      nullifier: computed.nullifier.toString(),
      proposal_id: proposalId.toString(),
    });

    // Step 3: Extract public inputs from proof (these match what we passed)
    const publicInputs = this.extractPublicInputs(proofResult.publicInputs);
    const commitmentHex = publicInputs.commitment;
    const nullifierHex = publicInputs.nullifier;

    const commitmentBuffer = Buffer.from(commitmentHex, 'hex');
    const nullifierBuffer = Buffer.from(nullifierHex, 'hex');

    const vkBuffer = StellarContractService.toBuffer(proofResult.vkJson);
    const proofBuffer = StellarContractService.toBuffer(proofResult.proofBlob);

    // Step 4: Submit vote to contract
    const tx = await (votingContract as any).vote({
      voter,
      proposal_id: proposalId,
      commitment: commitmentBuffer,
      nullifier: nullifierBuffer,
      vk_json: vkBuffer,
      proof_blob: proofBuffer,
    });

    const result = await tx.signAndSend({ signTransaction });
    const txData = StellarContractService.extractTransactionData(result);

    return {
      nullifier: nullifierHex,
      commitment: commitmentHex,
      proofId: txData.txHash,
    };
  }

  /**
   * BN254 field modulus
   * This is the prime modulus used in the BN254 elliptic curve
   * Values must be in range [0, BN254_MODULUS)
   */
  private static readonly BN254_MODULUS = BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617');

  /**
   * Convert bytes to Field value (modulo BN254 modulus)
   * This ensures the value fits within the BN254 field
   */
  private bytesToField(bytes: Uint8Array): bigint {
    // Convert bytes to bigint
    let value = BigInt(0);
    for (let i = 0; i < bytes.length; i++) {
      value = value * BigInt(256) + BigInt(bytes[i]);
    }
    // Apply modulo to fit within BN254 field
    return value % VotingService.BN254_MODULUS;
  }

  /**
   * Calculate commitment and nullifier
   * 
   * Strategy: Execute the circuit to let it calculate values internally, then extract from witness.
   * Currently the circuit doesn't calculate hashes (MVP simplified), so we calculate externally.
   * Once the circuit calculates hashes internally, we'll extract them from the witness.
   * 
   * @param noir - Noir instance with the voting circuit loaded
   * @param vote - Vote value (0 or 1)
   * @param salt - Salt value
   * @param identitySecret - Identity secret
   * @param proposalId - Proposal ID
   * @returns Commitment and nullifier values (as BigInt modulo BN254)
   */
  private async calculateCommitmentAndNullifier(
    noir: any,
    vote: number,
    salt: bigint,
    identitySecret: bigint,
    proposalId: number
  ): Promise<{ commitment: bigint; nullifier: bigint }> {
    // Step 1: Calculate commitment and nullifier using standard keccak256
    // TODO: Once circuit calculates hashes internally, extract from witness instead
    const commitmentBytes = calculateCommitment(vote, salt);
    const nullifierBytes = calculateNullifier(identitySecret, salt, proposalId);
    
    // Convert bytes to Field values (apply BN254 modulo to ensure they fit in the field)
    const commitment = this.bytesToField(commitmentBytes);
    const nullifier = this.bytesToField(nullifierBytes);
    
    // Step 2: Execute circuit with calculated values to validate they match
    // This also allows us to extract values from witness if circuit calculates them internally
    try {
      const { witness } = await noir.execute({
        identity_secret: identitySecret.toString(),
        vote,
        salt: salt.toString(),
        commitment: commitment.toString(),
        nullifier: nullifier.toString(),
        proposal_id: proposalId.toString(),
      });
      
      // Extract values from witness using param_witnesses indices:
      // commitment is at index [3, 4) = witness[3]
      // nullifier is at index [4, 5) = witness[4]
      // proposal_id is at index [5, 6) = witness[5]
      const witnessCommitment = BigInt(witness[3]);
      const witnessNullifier = BigInt(witness[4]);
      
      // For MVP: Use externally calculated values (circuit doesn't calculate hashes yet)
      // TODO: Once circuit calculates hashes, use witnessCommitment and witnessNullifier instead
      console.log('[VotingService] Extracted from witness:', {
        commitment: witnessCommitment.toString(),
        nullifier: witnessNullifier.toString(),
        usingExternal: true, // Circuit doesn't calculate hashes yet
      });
      
      return { commitment, nullifier };
    } catch (error) {
      console.error('[VotingService] Circuit execution failed, using external calculation:', error);
      // Fallback to externally calculated values if circuit execution fails
      return { commitment, nullifier };
    }
  }

  /**
   * Load circuit JSON
   */
  private async loadCircuit(circuitName: string): Promise<any> {
    const response = await fetch(`/circuits/${circuitName}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load circuit: ${circuitName}`);
    }
    return response.json();
  }

  /**
   * Extract public inputs from proof public inputs bytes
   * Order: commitment (32 bytes), nullifier (32 bytes), proposal_id (32 bytes)
   */
  private extractPublicInputs(publicInputsBytes: Uint8Array): {
    commitment: string;
    nullifier: string;
    proposalId: number;
  } {
    // Each field is 32 bytes
    const commitmentBytes = publicInputsBytes.slice(0, 32);
    const nullifierBytes = publicInputsBytes.slice(32, 64);
    const proposalIdBytes = publicInputsBytes.slice(64, 96);

    const commitment = bytesToHex(commitmentBytes);
    const nullifier = bytesToHex(nullifierBytes);
    
    // Convert proposal_id bytes to number (big-endian)
    let proposalId = 0;
    for (let i = 0; i < 8; i++) {
      proposalId = proposalId * 256 + proposalIdBytes[i];
    }

    return { commitment, nullifier, proposalId };
  }

  /**
   * Reveal a vote
   */
  async revealVote(
    voter: string,
    proposalId: number,
    nullifierHex: string,
    vote: number,
    salt: bigint,
    signTransaction: (xdr: string) => Promise<any>
  ): Promise<RevealResult> {
    if ((votingContract as any).options) {
      (votingContract as any).options.publicKey = voter;
    }

    const nullifier = Buffer.from(nullifierHex, 'hex');
    const saltBytes = Buffer.allocUnsafe(32);
    let saltValue = salt;
    for (let i = 31; i >= 0; i--) {
      saltBytes[i] = Number(saltValue & BigInt(0xff));
      saltValue = saltValue >> BigInt(8);
    }

    const tx = await (votingContract as any).reveal_vote({
      voter,
      proposal_id: proposalId,
      nullifier,
      vote,
      salt: saltBytes,
    });

    const result = await tx.signAndSend({ signTransaction });
    const txData = StellarContractService.extractTransactionData(result);

    return {
      success: txData.success,
      txHash: txData.txHash,
    };
  }

  /**
   * Get vote count for a proposal
   */
  async getVoteCount(proposalId: number, vote: number): Promise<number> {
    try {
      const tx = await (votingContract as any).get_vote_count({
        proposal_id: proposalId,
        vote,
      });
      return Number((tx).result || 0);
    } catch (error) {
      console.error('Failed to get vote count:', error);
      return 0;
    }
  }

  /**
   * Check if nullifier has been used
   */
  async isNullifierUsed(nullifierHex: string): Promise<boolean> {
    try {
      const nullifier = Buffer.from(nullifierHex, 'hex');
      const tx = await (votingContract as any).is_nullifier_used({ nullifier });
      return (tx).result === true;
    } catch (error) {
      console.error('Failed to check nullifier:', error);
      return false;
    }
  }

  /**
   * Check if vote has been revealed
   */
  async isVoteRevealed(proposalId: number, nullifierHex: string): Promise<boolean> {
    try {
      // Validate hex string length (64 chars = 32 bytes)
      const cleanHex = nullifierHex.startsWith('0x') ? nullifierHex.slice(2) : nullifierHex;
      if (cleanHex.length !== 64 || !/^[0-9a-fA-F]+$/.test(cleanHex)) {
        return false;
      }

      const nullifier = Buffer.from(cleanHex, 'hex');
      if (nullifier.length !== 32) {
        return false;
      }

      const tx = await (votingContract as any).is_vote_revealed({
        proposal_id: proposalId,
        nullifier,
      });
      return (tx).result === true;
    } catch (error) {
      // Silently fail - return false if check fails
      return false;
    }
  }
}

// Export singleton instance
export const votingService = new VotingService();

