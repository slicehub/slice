import { formatUnits } from "ethers";
import { fetchJSONFromIPFS } from "@/util/ipfs";

// Define the unified UI model here
export interface DisputeUI {
    id: string;
    title: string;
    category: string;
    status: number; // 0=Created, 1=Vote, 2=Reveal, 3=Executed
    phase: "VOTE" | "REVEAL" | "WITHDRAW" | "CLOSED";
    deadlineLabel: string;
    isUrgent: boolean;
    stake: string;
    jurorsRequired: number;
    revealDeadline: number;
    description?: string;
    evidence?: any[];
    claimer: string;
    defender: string;
    winner?: string;
}

export async function transformDisputeData(
    contractData: any
): Promise<DisputeUI> {
    const id = contractData.id.toString();
    const status = Number(contractData.status);
    const now = Math.floor(Date.now() / 1000);

    // Default Metadata
    let title = `Dispute #${id}`;
    let description = "No description available.";
    let category = contractData.category || "General";
    let evidence = [];

    // IPFS Fetch
    if (contractData.ipfsHash) {
        const meta = await fetchJSONFromIPFS(contractData.ipfsHash);
        if (meta) {
            title = meta.title || title;
            description = meta.description || description;
            if (meta.category) category = meta.category;
            evidence = meta.evidence || [];
        }
    }

    // Phase Logic
    let phase: DisputeUI["phase"] = "CLOSED";
    let deadline = 0;

    if (status === 1) {
        phase = "VOTE";
        deadline = Number(contractData.commitDeadline);
    } else if (status === 2) {
        // If user has local secret but hasn't revealed on-chain, they need to REVEAL
        // Otherwise, check if reveal deadline passed for WITHDRAW
        phase = "REVEAL";
        deadline = Number(contractData.revealDeadline);
        if (now > deadline) phase = "WITHDRAW";
    } else if (status === 3) {
        phase = "CLOSED";
    }

    // Time Logic
    const diff = deadline - now;
    const isUrgent = diff < 86400 && diff > 0;
    const hours = Math.ceil(diff / 3600);
    const deadlineLabel = status < 3
        ? (diff > 0 ? `${hours}h left` : "Ended")
        : "Resolved";

    return {
        id,
        title,
        category,
        status,
        phase,
        deadlineLabel,
        isUrgent,
        stake: contractData.requiredStake ? formatUnits(contractData.requiredStake, 6) : "0",
        jurorsRequired: Number(contractData.jurorsRequired),
        revealDeadline: Number(contractData.revealDeadline),
        description,
        evidence,
        claimer: contractData.claimer,
        defender: contractData.defender,
        winner: contractData.winner
    };
}
