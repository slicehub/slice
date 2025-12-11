interface VoteData {
  vote: number;
  salt: string; // Stored as string to handle BigInt safely
  timestamp: number;
}

/**
 * Generates a unique, collision-resistant storage key.
 * Format: slice_v2_<contract_address>_dispute_<id>_user_<user_address>
 */
export const getVoteStorageKey = (
  contractAddress: string | undefined,
  disputeId: string | number,
  userAddress: string | null | undefined
): string => {
  // Fallback values prevent crashes if data isn't ready, though logic should prevent this
  const safeContract = contractAddress ? contractAddress.toLowerCase() : "unknown_contract";
  const safeUser = userAddress ? userAddress.toLowerCase() : "unknown_user";

  return `slice_v2_${safeContract}_dispute_${disputeId}_user_${safeUser}`;
};

/**
 * Saves the vote commitment data (Salt + Vote Choice).
 */
export const saveVoteData = (
  contractAddress: string,
  disputeId: string | number,
  userAddress: string,
  vote: number,
  salt: bigint
) => {
  if (!contractAddress || !userAddress) return;

  const key = getVoteStorageKey(contractAddress, disputeId, userAddress);
  const data: VoteData = {
    vote,
    salt: salt.toString(), // Convert BigInt to string for JSON serialization
    timestamp: Date.now(),
  };

  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Slice: Failed to save vote data to LocalStorage", e);
  }
};

/**
 * Retrieves the stored vote data. Returns null if not found.
 */
export const getVoteData = (
  contractAddress: string | undefined,
  disputeId: string | number,
  userAddress: string | null | undefined
): VoteData | null => {
  if (!contractAddress || !userAddress) return null;

  const key = getVoteStorageKey(contractAddress, disputeId, userAddress);
  const item = localStorage.getItem(key);

  if (!item) return null;

  try {
    return JSON.parse(item) as VoteData;
  } catch (e) {
    console.error("Slice: Error parsing vote data from storage", e);
    return null;
  }
};

/**
 * Boolean check: Did the user vote on *this specific contract instance*?
 */
export const hasLocalVote = (
  contractAddress: string | undefined,
  disputeId: string | number,
  userAddress: string | null | undefined
): boolean => {
  return !!getVoteData(contractAddress, disputeId, userAddress);
};
