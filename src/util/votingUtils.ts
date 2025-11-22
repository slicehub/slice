import { keccak_256 } from '@noble/hashes/sha3.js';

/**
 * Generate a random identity secret for voting
 * This should be stored securely by the user (e.g., in localStorage)
 */
export function generateIdentitySecret(): bigint {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  // Convert to bigint (taking first 31 bytes to fit in Field)
  let value = BigInt(0);
  for (let i = 0; i < 31; i++) {
    value = value * BigInt(256) + BigInt(array[i]);
  }
  return value;
}

/**
 * Generate a random salt for voting
 */
export function generateSalt(): bigint {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  // Convert to bigint (taking first 31 bytes to fit in Field)
  let value = BigInt(0);
  for (let i = 0; i < 31; i++) {
    value = value * BigInt(256) + BigInt(array[i]);
  }
  return value;
}

/**
 * Calculate commitment: hash(vote || salt)
 * Returns the commitment as a 32-byte array
 */
export function calculateCommitment(vote: number, salt: bigint): Uint8Array {
  const voteBytes = new Uint8Array(1);
  voteBytes[0] = vote;
  
  const saltBytes = new Uint8Array(32);
  // Convert bigint to bytes (big-endian)
  let saltValue = salt;
  for (let i = 31; i >= 0; i--) {
    saltBytes[i] = Number(saltValue & BigInt(0xff));
    saltValue = saltValue >> BigInt(8);
  }
  
  // Concatenate vote and salt
  const input = new Uint8Array(voteBytes.length + saltBytes.length);
  input.set(voteBytes, 0);
  input.set(saltBytes, voteBytes.length);
  
  // Hash using Keccak-256
  return keccak_256(input);
}

/**
 * Calculate nullifier: hash(identity_secret || salt || proposal_id)
 * Returns the nullifier as a 32-byte array
 */
export function calculateNullifier(
  identitySecret: bigint,
  salt: bigint,
  proposalId: number
): Uint8Array {
  const identityBytes = new Uint8Array(32);
  let identityValue = identitySecret;
  for (let i = 31; i >= 0; i--) {
    identityBytes[i] = Number(identityValue & BigInt(0xff));
    identityValue = identityValue >> BigInt(8);
  }
  
  const saltBytes = new Uint8Array(32);
  let saltValue = salt;
  for (let i = 31; i >= 0; i--) {
    saltBytes[i] = Number(saltValue & BigInt(0xff));
    saltValue = saltValue >> BigInt(8);
  }
  
  const proposalBytes = new Uint8Array(8);
  // Convert proposal_id to big-endian bytes
  let proposalValue = BigInt(proposalId);
  for (let i = 7; i >= 0; i--) {
    proposalBytes[i] = Number(proposalValue & BigInt(0xff));
    proposalValue = proposalValue >> BigInt(8);
  }
  
  // Concatenate all inputs
  const input = new Uint8Array(identityBytes.length + saltBytes.length + proposalBytes.length);
  input.set(identityBytes, 0);
  input.set(saltBytes, identityBytes.length);
  input.set(proposalBytes, identityBytes.length + saltBytes.length);
  
  // Hash using Keccak-256
  return keccak_256(input);
}

/**
 * Convert Uint8Array to hex string
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert hex string to Uint8Array
 */
export function hexToBytes(hex: string): Uint8Array {
  const hexWithoutPrefix = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(hexWithoutPrefix.length / 2);
  for (let i = 0; i < hexWithoutPrefix.length; i += 2) {
    bytes[i / 2] = parseInt(hexWithoutPrefix.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Convert Uint8Array to Buffer (for Stellar SDK)
 */
export function bytesToBuffer(bytes: Uint8Array): Buffer {
  return Buffer.from(bytes);
}

