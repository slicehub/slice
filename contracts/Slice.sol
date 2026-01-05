// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// TODO:
// - Require parties to pay requiredStake + arbitrationFee.
// - Switch from "First-Come-First-Serve" to a "Lottery System" using Chainlink VRF.
interface IERC20 {
    function transfer(
        address recipient,
        uint256 amount
    ) external returns (bool);

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    function balanceOf(address account) external view returns (uint256);
}

contract Slice {
    // --- Enums & Structs ---
    enum DisputeStatus {
        Created,
        Commit,
        Reveal,
        Finished
    }

    struct DisputeConfig {
        address claimer;
        address defender;
        string category;
        string ipfsHash;
        uint256 jurorsRequired;
        uint256 paySeconds;
        uint256 evidenceSeconds;
        uint256 commitSeconds;
        uint256 revealSeconds;
    }

    struct Dispute {
        uint256 id;
        address claimer;
        address defender;
        string category;
        uint256 requiredStake;
        uint256 jurorsRequired;
        string ipfsHash;
        // state
        uint256 commitsCount;
        uint256 revealsCount;
        DisputeStatus status;
        bool claimerPaid;
        bool defenderPaid;
        address winner;
        // deadlines
        uint256 payDeadline;
        uint256 evidenceDeadline;
        uint256 commitDeadline;
        uint256 revealDeadline;
    }

    struct JurorStats {
        uint256 totalDisputes; // Matches played
        uint256 coherentVotes; // Matches won
        uint256 totalEarnings; // Total score (in USDC units)
    }

    // --- State Variables ---
    uint256 public disputeCount;
    mapping(uint256 => Dispute) internal disputeStore;
    IERC20 public immutable stakingToken;

    // --- Mappings ---
    // 1. Core Logic Mappings
    mapping(uint256 => address[]) public disputeJurors;
    mapping(uint256 => mapping(address => bytes32)) public commitments;
    mapping(uint256 => mapping(address => uint256)) public revealedVotes;
    mapping(uint256 => mapping(address => bool)) public hasRevealed;
    mapping(uint256 => address[]) public candidates;
    mapping(uint256 => address[]) public disputeCandidates;
    mapping(address => uint256) public balances;

    // --- Constants ---
    // Assuming 6 decimals like USDC.
    // 1 * 10^6 = 1 USDC minimum
    // 100 * 10^6 = 100 USDC maximum (Prevents whale dominance)
    uint256 public constant MIN_STAKE = 1000000;
    uint256 public constant MAX_STAKE = 100000000;

    // Dispute ID => Juror Address => Amount Staked
    mapping(uint256 => mapping(address => uint256)) public jurorStakes;
    mapping(address => JurorStats) public jurorStats;

    // 2. UX / Tracking Mappings
    mapping(address => uint256[]) private jurorDisputes; // IDs where I am a juror
    mapping(address => uint256[]) private userDisputes; // IDs where I am claimer/defender

    // --- Events ---
    event DisputeCreated(uint256 indexed id, address claimer, address defender);
    event FundsDeposited(uint256 indexed id, address role, uint256 amount);
    event EvidenceSubmitted(
        uint256 indexed id,
        address indexed party,
        string ipfsHash
    );
    event JurorJoined(uint256 indexed id, address juror);
    event StatusChanged(uint256 indexed id, DisputeStatus newStatus);
    event VoteCommitted(uint256 indexed id, address juror);
    event VoteRevealed(uint256 indexed id, address juror, uint256 vote);
    event RulingExecuted(uint256 indexed id, address winner);
    event FundsWithdrawn(address indexed user, uint256 amount);

    constructor(address _stakingToken) {
        stakingToken = IERC20(_stakingToken);
    }

    // --- Logic ---
    function createDispute(
        DisputeConfig calldata _config
    ) external returns (uint256) {
        require(msg.sender != _config.defender, "Self-dispute not allowed");
        require(
            _config.claimer != _config.defender,
            "Claimer cannot be Defender"
        );

        disputeCount++;
        uint256 id = disputeCount;

        Dispute storage d = disputeStore[id];
        d.id = id;

        d.claimer = _config.claimer;
        d.defender = _config.defender;
        d.category = _config.category;

        // 1 USDC = 1,000,000 units
        d.requiredStake = 1000000;
        d.jurorsRequired = _config.jurorsRequired;
        d.ipfsHash = _config.ipfsHash;
        d.status = DisputeStatus.Created;

        // Concurrent pay and evidence deadlines
        d.payDeadline = block.timestamp + _config.paySeconds;
        d.evidenceDeadline = d.payDeadline + _config.evidenceSeconds;
        d.commitDeadline = d.payDeadline + _config.commitSeconds;
        d.revealDeadline = d.commitDeadline + _config.revealSeconds;

        // Tracking: Add to user lists
        userDisputes[msg.sender].push(id);
        userDisputes[_config.defender].push(id);

        emit DisputeCreated(id, msg.sender, _config.defender);
        return id;
    }

    function submitEvidence(uint256 _id, string calldata _ipfsHash) external {
        Dispute storage d = disputeStore[_id];
        require(d.status != DisputeStatus.Finished, "Dispute finished");
        require(
            d.status != DisputeStatus.Reveal,
            "Evidence closed (Reveal phase)"
        );
        require(
            block.timestamp <= d.evidenceDeadline,
            "Evidence deadline passed"
        );
        require(
            msg.sender == d.claimer || msg.sender == d.defender,
            "Only parties can submit"
        );

        emit EvidenceSubmitted(_id, msg.sender, _ipfsHash);
    }

    // --- View Functions ---

    function disputes(uint256 _id) external view returns (Dispute memory) {
        return disputeStore[_id];
    }

    // Get all disputes for a Juror (For "My Votes" page)
    function getJurorDisputes(
        address _user
    ) external view returns (uint256[] memory) {
        return jurorDisputes[_user];
    }

    // Get all disputes for a Claimer/Defender (For "Profile" page)
    function getUserDisputes(
        address _user
    ) external view returns (uint256[] memory) {
        return userDisputes[_user];
    }

    // --- Actions ---
    function payDispute(uint256 _id) external {
        Dispute storage d = disputeStore[_id];
        require(d.status == DisputeStatus.Created, "Payment closed");
        require(block.timestamp <= d.payDeadline, "Deadline passed");

        if (msg.sender == d.claimer) {
            require(!d.claimerPaid, "Already paid");
            d.claimerPaid = true;
        } else if (msg.sender == d.defender) {
            require(!d.defenderPaid, "Already paid");
            d.defenderPaid = true;
        } else {
            revert("Only disputants can pay");
        }

        bool success = stakingToken.transferFrom(
            msg.sender,
            address(this),
            d.requiredStake
        );
        require(success, "Transfer failed");

        emit FundsDeposited(_id, msg.sender, d.requiredStake);

        if (d.claimerPaid && d.defenderPaid) {
            d.status = DisputeStatus.Commit;
            emit StatusChanged(_id, DisputeStatus.Commit);
        }
    }

    function joinDispute(uint256 _id, uint256 _amount) external {
        Dispute storage d = disputeStore[_id];

        // 1. Validations: Ensure we are in the registration phase
        require(d.status == DisputeStatus.Created, "Registration closed");
        require(
            block.timestamp <= d.payDeadline,
            "Registration deadline passed"
        );
        require(
            msg.sender != d.claimer && msg.sender != d.defender,
            "Parties cannot be jurors"
        );

        // 2. Variable Stake Check
        require(_amount >= MIN_STAKE, "Stake too low");
        require(_amount <= MAX_STAKE, "Stake too high");

        // 3. Check for duplicates in the candidate pool
        // Renamed local variable to _candidates to avoid shadowing
        address[] memory _candidates = candidates[_id];
        for (uint i = 0; i < _candidates.length; i++) {
            require(_candidates[i] != msg.sender, "Already registered");
        }

        // 4. Transfer Amount
        bool success = stakingToken.transferFrom(
            msg.sender,
            address(this),
            _amount
        );
        require(success, "Transfer failed");

        // 5. Update State
        candidates[_id].push(msg.sender);
        jurorStakes[_id][msg.sender] = _amount;
        jurorDisputes[msg.sender].push(_id);

        emit JurorJoined(_id, msg.sender);
    }

    function selectJurors(uint256 _id) external {
        Dispute storage d = disputeStore[_id];
        require(block.timestamp > d.payDeadline, "Too early");
        require(disputeJurors[_id].length == 0, "Already selected");

        uint256 poolSize = candidates[_id].length;
        require(poolSize >= d.jurorsRequired, "Not enough candidates");

        for (uint i = 0; i < d.jurorsRequired; i++) {
            // Use block properties to generate a pseudo-random index
            uint256 randomIndex = uint256(
                keccak256(
                    abi.encodePacked(
                        block.timestamp,
                        block.prevrandao, // Use prevrandao for better entropy on PoS
                        i
                    )
                )
            ) % poolSize;

            address selected = candidates[_id][randomIndex];
            disputeJurors[_id].push(selected);
        }

        d.status = DisputeStatus.Commit;
    }

    function commitVote(uint256 _id, bytes32 _commitment) external {
        Dispute storage d = disputeStore[_id];
        require(d.status == DisputeStatus.Commit, "Not voting phase");
        require(block.timestamp <= d.commitDeadline, "Voting ended");
        require(_isJuror(_id, msg.sender), "Not a juror");
        require(
            commitments[_id][msg.sender] == bytes32(0),
            "Already committed"
        );

        commitments[_id][msg.sender] = _commitment;
        d.commitsCount++;
        emit VoteCommitted(_id, msg.sender);

        if (
            disputeJurors[_id].length == d.jurorsRequired &&
            d.commitsCount == d.jurorsRequired
        ) {
            d.status = DisputeStatus.Reveal;
            emit StatusChanged(_id, DisputeStatus.Reveal);
        }
    }

    function revealVote(uint256 _id, uint256 _vote, uint256 _salt) external {
        Dispute storage d = disputeStore[_id];
        if (
            d.status == DisputeStatus.Commit &&
            block.timestamp > d.commitDeadline
        ) {
            d.status = DisputeStatus.Reveal;
        }

        require(d.status == DisputeStatus.Reveal, "Not reveal phase");
        require(_isJuror(_id, msg.sender), "Not a juror");
        require(!hasRevealed[_id][msg.sender], "Already revealed");

        bytes32 verify = keccak256(abi.encodePacked(_vote, _salt));
        require(verify == commitments[_id][msg.sender], "Hash mismatch");

        revealedVotes[_id][msg.sender] = _vote;
        hasRevealed[_id][msg.sender] = true;

        d.revealsCount++;

        emit VoteRevealed(_id, msg.sender, _vote);
    }

    /**
     * @notice Executes the ruling for a dispute.
     * @dev Uses internal helpers to avoid stack too deep errors.
     */
    function executeRuling(uint256 _id) external {
        Dispute storage d = disputeStore[_id];

        // 1. Validate Phase
        if (
            d.status == DisputeStatus.Commit &&
            block.timestamp > d.commitDeadline
        ) {
            d.status = DisputeStatus.Reveal;
        }

        // Check if reveal phase is over or everyone has revealed
        bool timePassed = block.timestamp > d.revealDeadline;
        bool allRevealed = (d.commitsCount > 0 &&
            d.commitsCount == d.revealsCount);

        require(d.status == DisputeStatus.Reveal, "Wrong phase");
        require(timePassed || allRevealed, "Cannot execute yet");

        // 2. Determine Winner
        uint256 winningChoice = _determineWinner(_id);

        address winnerAddr = winningChoice == 1 ? d.claimer : d.defender;
        d.winner = winnerAddr;
        d.status = DisputeStatus.Finished;

        // 3. Pay Principal (Winner gets 2x required stake)
        balances[winnerAddr] += d.requiredStake * 2;

        // 4. Distribute Juror Rewards
        _distributeRewards(_id, winningChoice);

        emit RulingExecuted(_id, winnerAddr);
    }

    // Helper: Count votes and return winner (0 or 1)
    function _determineWinner(uint256 _id) internal view returns (uint256) {
        uint256 votesFor0 = 0;
        uint256 votesFor1 = 0;
        address[] memory jurors = disputeJurors[_id];

        for (uint i = 0; i < jurors.length; i++) {
            address j = jurors[i];
            if (hasRevealed[_id][j]) {
                uint256 v = revealedVotes[_id][j];
                uint256 weight = jurorStakes[_id][j];
                if (v == 0) votesFor0 += weight;
                else if (v == 1) votesFor1 += weight;
            }
        }
        return votesFor1 > votesFor0 ? 1 : 0;
    }

    // Helper: Calculate pools and distribute rewards to coherent jurors
    function _distributeRewards(uint256 _id, uint256 winningChoice) internal {
        address[] memory jurors = disputeJurors[_id];
        uint256 totalWinningStake = 0;
        uint256 totalLosingStake = 0;

        // A. Sum up pools
        for (uint i = 0; i < jurors.length; i++) {
            address j = jurors[i];
            uint256 s = jurorStakes[_id][j];

            if (hasRevealed[_id][j] && revealedVotes[_id][j] == winningChoice) {
                totalWinningStake += s;
            } else {
                totalLosingStake += s;
            }
        }

        // B. Distribute Rewards & Update Stats
        for (uint i = 0; i < jurors.length; i++) {
            address j = jurors[i];

            jurorStats[j].totalDisputes++;

            // Check if this specific juror won
            bool isWinner = hasRevealed[_id][j] &&
                revealedVotes[_id][j] == winningChoice;

            if (isWinner) {
                jurorStats[j].coherentVotes++;

                uint256 myStake = jurorStakes[_id][j];

                // Safety check to avoid division by 0
                if (totalWinningStake > 0) {
                    // Pro-rata share of losing pool
                    uint256 myShare = (myStake * totalLosingStake) /
                        totalWinningStake;

                    jurorStats[j].totalEarnings += myShare;

                    // Update Balance (Principal + Profit)
                    balances[j] += (myStake + myShare);
                } else {
                    // Edge case: Winner exists, but totalWinningStake is somehow 0
                    balances[j] += myStake;
                }
            }
        }
    }

    // Allow users to withdraw their earnings/stakes
    function withdraw(address _token) external {
        uint256 amount = balances[msg.sender];

        require(amount > 0, "No funds to withdraw");
        require(_token == address(stakingToken), "Wrong token address");

        // (Reentrancy Protection)
        // We zero out the balance BEFORE sending money.
        // This prevents a hacker from calling withdraw() recursively
        // to drain the contract.
        balances[msg.sender] = 0;

        bool success = stakingToken.transfer(msg.sender, amount);
        require(success, "Transfer failed");

        emit FundsWithdrawn(msg.sender, amount);
    }

    function _isJuror(uint256 _id, address _user) internal view returns (bool) {
        address[] memory jurors = disputeJurors[_id];
        for (uint i = 0; i < jurors.length; i++) {
            if (jurors[i] == _user) return true;
        }
        return false;
    }

    function disputeCountView() external view returns (uint256) {
        return disputeCount;
    }
}
