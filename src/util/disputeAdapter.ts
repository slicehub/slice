import { formatUnits } from "viem";
import { fetchJSONFromIPFS } from "@/util/ipfs";

export interface DisputeUI {
  id: string;
  title: string;
  category: string;
  status: number;
  phase: "VOTE" | "REVEAL" | "WITHDRAW" | "CLOSED";
  deadlineLabel: string;
  isUrgent: boolean;
  stake: string;
  jurorsRequired: number;
  revealDeadline: number;
  evidenceDeadline?: number;
  description: string;
  evidence: string[];
  claimer: string;
  defender: string;
  winner?: string;

  // Real Data Fields
  claimerName?: string;
  defenderName?: string;
  audioEvidence?: string | null;
  carouselEvidence?: string[];

  // Defender Specific Fields
  defenderDescription?: string;
  defenderAudioEvidence?: string | null;
  defenderCarouselEvidence?: string[];
}

/**
 * Safely extracts a value from contract data that may be returned as an object (struct)
 * or as an array, depending on the ABI configuration and Viem version.
 */
function getField<T>(
  data: any,
  fieldName: string,
  arrayIndex: number,
  defaultValue: T,
): T {
  if (data === null || data === undefined) return defaultValue;

  // Try object property access first (preferred for named structs)
  if (data[fieldName] !== undefined) {
    return data[fieldName] as T;
  }

  // Fallback to array index access (for unnamed/tuple returns)
  if (Array.isArray(data) && data[arrayIndex] !== undefined) {
    return data[arrayIndex] as T;
  }

  // If data is an object with numeric keys (array-like object from Viem)
  if (typeof data === "object" && data[arrayIndex] !== undefined) {
    return data[arrayIndex] as T;
  }

  return defaultValue;
}

export async function transformDisputeData(
  contractData: any,
  decimals: number = 6,
): Promise<DisputeUI> {
  // Extract fields using safe accessor with fallbacks
  // Struct field order based on Solidity Dispute struct:
  // 0: id, 1: claimer, 2: defender, 3: category, 4: requiredStake,
  // 5: jurorsRequired, 6: ipfsHash, 7: commitsCount, 8: revealsCount,
  // 9: status, 10: claimerPaid, 11: defenderPaid, 12: winner,
  // 13: payDeadline, 14: evidenceDeadline, 15: commitDeadline, 16: revealDeadline

  const id = (
    getField(contractData, "id", 0, BigInt(0)) ?? contractData.id
  ).toString();
  const claimer = getField<string>(
    contractData,
    "claimer",
    1,
    "0x0000000000000000000000000000000000000000",
  );
  const defender = getField<string>(
    contractData,
    "defender",
    2,
    "0x0000000000000000000000000000000000000000",
  );
  const categoryRaw = getField<string>(contractData, "category", 3, "General");
  const requiredStake = getField<bigint>(
    contractData,
    "requiredStake",
    4,
    BigInt(0),
  );
  const jurorsRequired = Number(
    getField<bigint>(contractData, "jurorsRequired", 5, BigInt(3)),
  );
  const ipfsHash = getField<string>(contractData, "ipfsHash", 6, "");
  const status = Number(getField<number>(contractData, "status", 9, 0));
  const winnerRaw = getField<string>(
    contractData,
    "winner",
    12,
    "0x0000000000000000000000000000000000000000",
  );
  // Treat zero address as no winner
  const winner =
    winnerRaw === "0x0000000000000000000000000000000000000000"
      ? undefined
      : winnerRaw;
  const evidenceDeadline = Number(
    getField<bigint>(contractData, "evidenceDeadline", 14, BigInt(0)),
  );
  const commitDeadline = Number(
    getField<bigint>(contractData, "commitDeadline", 15, BigInt(0)),
  );
  const revealDeadline = Number(
    getField<bigint>(contractData, "revealDeadline", 16, BigInt(0)),
  );

  const now = Math.floor(Date.now() / 1000);

  // Defaults
  let title = `Dispute #${id}`;
  let description = "No description provided.";
  let defenderDescription = undefined;
  let category = categoryRaw || "General";
  let evidence: string[] = [];

  // Containers for metadata
  let audioEvidence: string | null = null;
  let carouselEvidence: string[] = [];

  // New Containers
  let defenderAudioEvidence: string | null = null;
  let defenderCarouselEvidence: string[] = [];

  let aliases = { claimer: null, defender: null };

  // Fetch IPFS Metadata
  if (ipfsHash) {
    const meta = await fetchJSONFromIPFS(ipfsHash);
    if (meta) {
      title = meta.title || title;
      description = meta.description || description;
      if (meta.category) category = meta.category;
      evidence = meta.evidence || [];

      // Capture extra fields
      audioEvidence = meta.audioEvidence || null;
      carouselEvidence = meta.carouselEvidence || [];

      // Map Defender Data
      defenderDescription = meta.defenderDescription;
      defenderAudioEvidence = meta.defenderAudioEvidence || null;
      defenderCarouselEvidence = meta.defenderCarouselEvidence || [];

      if (meta.aliases) aliases = meta.aliases;
    }
  }

  // Phase Logic
  let phase: DisputeUI["phase"] = "CLOSED";
  let deadline = 0;

  if (status === 1) {
    phase = "VOTE";
    deadline = commitDeadline;
  } else if (status === 2) {
    phase = "REVEAL";
    deadline = revealDeadline;
    if (now > deadline) phase = "WITHDRAW";
  } else if (status === 3) {
    phase = "CLOSED";
  }

  // Time Logic
  const diff = deadline - now;
  const isUrgent = diff < 86400 && diff > 0;
  const hours = Math.ceil(diff / 3600);
  const deadlineLabel =
    status < 3 ? (diff > 0 ? `${hours}h left` : "Ended") : "Resolved";

  return {
    id,
    title,
    category,
    status,
    phase,
    deadlineLabel,
    isUrgent,
    stake: requiredStake ? formatUnits(requiredStake, decimals) : "0",
    jurorsRequired,
    revealDeadline,
    evidenceDeadline,
    description,
    evidence,
    claimer,
    defender,
    winner,

    // Map new fields using the aliases found in IPFS
    claimerName: aliases.claimer || claimer,
    defenderName: aliases.defender || defender,
    audioEvidence,
    carouselEvidence,
    defenderDescription,
    defenderAudioEvidence,
    defenderCarouselEvidence,
  };
}
