// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Slice} from "./Slice.sol"; // Adjust path if needed
import {Test} from "forge-std/Test.sol";

// 1. Simple Mock Token to simulate USDC
contract MockUSDC {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) public {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(
        address recipient,
        uint256 amount
    ) external returns (bool) {
        return _transfer(msg.sender, recipient, amount);
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool) {
        require(allowance[sender][msg.sender] >= amount, "Allowance exceeded");
        allowance[sender][msg.sender] -= amount;
        return _transfer(sender, recipient, amount);
    }

    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

// 2. The Slice Test
contract SliceTest is Test {
    Slice slice;
    MockUSDC token;

    // Test Users
    address claimer = address(0x10);
    address defender = address(0x20);
    address juror = address(0x30);

    function setUp() public {
        // Deploy Token & Slice
        token = new MockUSDC();
        slice = new Slice(address(token));

        // Setup: Give everyone money & approve Slice
        _setupUser(claimer);
        _setupUser(defender);
        _setupUser(juror);
    }

    function _setupUser(address user) internal {
        token.mint(user, 1000000); // Mint 1.00 USDC (assuming 6 decimals logic in contract)
        vm.prank(user);
        token.approve(address(slice), 1000000);
    }

    // Test 1: Happy Path - Create a dispute
    function test_CreateDispute() public {
        vm.prank(claimer);

        Slice.DisputeConfig memory config = Slice.DisputeConfig({
            defender: defender,
            category: "General",
            ipfsHash: "QmTest123",
            jurorsRequired: 3,
            paySeconds: 1 days,
            commitSeconds: 1 days,
            revealSeconds: 1 days
        });

        uint256 id = slice.createDispute(config);

        assertEq(id, 1);
        assertEq(slice.disputeCount(), 1);

        // Check data
        Slice.Dispute memory d = slice.disputes(1);
        assertEq(d.claimer, claimer);
        assertEq(d.defender, defender);
        assertEq(uint(d.status), 0); // 0 = Created
    }

    // Test 2: Funding the dispute
    function test_PayDispute() public {
        // First create one
        test_CreateDispute();

        // 1. Claimer pays
        vm.prank(claimer);
        slice.payDispute(1);

        // Check state
        Slice.Dispute memory d1 = slice.disputes(1);
        assertTrue(d1.claimerPaid);
        assertFalse(d1.defenderPaid);

        // 2. Defender pays
        vm.prank(defender);
        slice.payDispute(1);

        // Check Status update to Commit (1)
        Slice.Dispute memory d2 = slice.disputes(1);
        assertTrue(d2.defenderPaid);
        assertEq(uint(d2.status), 1); // 1 = Commit
    }

    // Test 3: Juror Joining
    function test_JurorJoin() public {
        // Run payment flow first so status is Commit
        test_PayDispute();

        // Juror joins
        vm.prank(juror);
        slice.joinDispute(1);

        // Check tracking
        uint256[] memory myDisputes = slice.getJurorDisputes(juror);
        assertEq(myDisputes.length, 1);
        assertEq(myDisputes[0], 1);
    }

    // Test 4: Fail if deadline passed
    function test_FailPayAfterDeadline() public {
        test_CreateDispute();

        // Time travel 2 days into future
        vm.warp(block.timestamp + 2 days);

        vm.prank(claimer);
        vm.expectRevert("Deadline passed");
        slice.payDispute(1);
    }
}
