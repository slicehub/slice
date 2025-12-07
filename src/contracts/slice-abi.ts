export const sliceAddress = process.env.NEXT_PUBLIC_SLICE_ADDRESS
  ? process.env.NEXT_PUBLIC_SLICE_ADDRESS
  : "0x0DF84bFD1e6eA2125e84cEB935192E3b3D23346f"; // TODO: Update with deployed Base contract address

export const sliceAbi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "claimer",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "defender",
        type: "address",
      },
    ],
    name: "DisputeCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "role",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "FundsDeposited",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "juror",
        type: "address",
      },
    ],
    name: "JurorJoined",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "winner",
        type: "address",
      },
    ],
    name: "RulingExecuted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "enum Slice.DisputeStatus",
        name: "newStatus",
        type: "uint8",
      },
    ],
    name: "StatusChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "juror",
        type: "address",
      },
    ],
    name: "VoteCommitted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "juror",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "vote",
        type: "uint256",
      },
    ],
    name: "VoteRevealed",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_id",
        type: "uint256",
      },
      {
        internalType: "bytes32",
        name: "_commitment",
        type: "bytes32",
      },
    ],
    name: "commitVote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_defender",
        type: "address",
      },
      {
        internalType: "string",
        name: "_category",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "_jurorsRequired",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_paySeconds",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_commitSeconds",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_revealSeconds",
        type: "uint256",
      },
    ],
    name: "createDispute",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_id",
        type: "uint256",
      },
    ],
    name: "executeRuling",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_id",
        type: "uint256",
      },
    ],
    name: "joinDispute",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_id",
        type: "uint256",
      },
    ],
    name: "payDispute",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_id",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_vote",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_salt",
        type: "uint256",
      },
    ],
    name: "revealVote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "disputeCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "disputes",
    outputs: [
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "claimer",
        type: "address",
      },
      {
        internalType: "address",
        name: "defender",
        type: "address",
      },
      {
        internalType: "string",
        name: "category",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "requiredStake",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "jurorStake",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "jurorsRequired",
        type: "uint256",
      },
      {
        internalType: "enum Slice.DisputeStatus",
        name: "status",
        type: "uint8",
      },
      {
        internalType: "bool",
        name: "claimerPaid",
        type: "bool",
      },
      {
        internalType: "bool",
        name: "defenderPaid",
        type: "bool",
      },
      {
        internalType: "address",
        name: "winner",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "payDeadline",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "commitDeadline",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "revealDeadline",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_id",
        type: "uint256",
      },
    ],
    name: "getDisputeDetails",
    outputs: [
      {
        internalType: "address",
        name: "claimer",
        type: "address",
      },
      {
        internalType: "address",
        name: "defender",
        type: "address",
      },
      {
        internalType: "enum Slice.DisputeStatus",
        name: "status",
        type: "uint8",
      },
      {
        internalType: "uint256",
        name: "jurorsJoined",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "isClaimerPaid",
        type: "bool",
      },
      {
        internalType: "bool",
        name: "isDefenderPaid",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];
