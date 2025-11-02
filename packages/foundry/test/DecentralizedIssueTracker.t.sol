// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/DecentralizedIssueTracker.sol";

contract MockAIAgent {
    receive() external payable {}
}

contract DecentralizedIssueTrackerTest is Test {
    DecentralizedIssueTracker public tracker;
    MockAIAgent public aiAgentContract;
    
    address public aiAgent;
    address public creator = address(0x2);
    address public contributor = address(0x3);
    address public contributor2 = address(0x4);
    
    uint256 constant AI_FEE = 0.00001 ether;
    uint256 constant BOUNTY = 1 ether;
    
    function setUp() public {
        // Deploy mock AI agent that can receive ETH
        aiAgentContract = new MockAIAgent();
        aiAgent = address(aiAgentContract);
        
        tracker = new DecentralizedIssueTracker(aiAgent);
        
        vm.deal(creator, 100 ether);
        vm.deal(contributor, 100 ether);
        vm.deal(contributor2, 100 ether);
        
        // Store nullifiers for verified users
        vm.prank(creator);
        tracker.storeNullifier(1001);
        
        vm.prank(contributor);
        tracker.storeNullifier(1002);
        
        vm.prank(contributor2);
        tracker.storeNullifier(1003);
    }
    
    function testStoreNullifier() public {
        address newUser = address(0x5);
        vm.prank(newUser);
        tracker.storeNullifier(2000);
        
        assertEq(tracker.addressToNullifier(newUser), 2000);
        assertEq(tracker.nullifierToAddress(2000), newUser);
    }
    
    function testStoreNullifierFailsIfAlreadyExists() public {
        vm.prank(creator);
        vm.expectRevert("Nullifier already exists");
        tracker.storeNullifier(3000);
    }
    
    function testCreateIssue() public {
        vm.prank(creator);
        uint256 issueId = tracker.createIssue{value: BOUNTY + AI_FEE}(
            "https://github.com/test/issue/1",
            "Fix bug in contract",
            DecentralizedIssueTracker.Difficulty.MEDIUM,
            0, 0, 0, 50
        );
        
        assertEq(issueId, 1);
        
        DecentralizedIssueTracker.Issue memory issue = tracker.getIssueInfo(1);
        assertEq(issue.creator, creator);
        assertEq(issue.bounty, BOUNTY);
        assertEq(uint(issue.difficulty), uint(DecentralizedIssueTracker.Difficulty.MEDIUM));
    }
    
    function testCreateIssueFailsWithoutVerification() public {
        address unverified = address(0x99);
        vm.deal(unverified, 10 ether);
        
        vm.prank(unverified);
        vm.expectRevert("User not verified");
        tracker.createIssue{value: BOUNTY + AI_FEE}(
            "https://github.com/test/issue/1",
            "Fix bug",
            DecentralizedIssueTracker.Difficulty.EASY,
            0, 0, 0, 50
        );
    }
    
    function testTakeIssue() public {
        vm.prank(creator);
        uint256 issueId = tracker.createIssue{value: BOUNTY + AI_FEE}(
            "https://github.com/test/issue/1",
            "Fix bug",
            DecentralizedIssueTracker.Difficulty.EASY,
            0, 0, 0, 50
        );
        
        uint256 stake = (BOUNTY * 10) / 100; // 10% stake
        
        vm.prank(contributor);
        tracker.takeIssue{value: stake}(issueId);
        
        DecentralizedIssueTracker.Issue memory issue = tracker.getIssueInfo(issueId);
        assertEq(issue.assignedTo, contributor);
        assertGt(issue.deadline, block.timestamp);
    }
    
    function testTakeIssueFailsWithInvalidStake() public {
        vm.prank(creator);
        uint256 issueId = tracker.createIssue{value: BOUNTY + AI_FEE}(
            "https://github.com/test/issue/1",
            "Fix bug",
            DecentralizedIssueTracker.Difficulty.EASY,
            0, 0, 0, 50
        );
        
        uint256 lowStake = (BOUNTY * 3) / 100; // 3% - too low
        
        vm.prank(contributor);
        vm.expectRevert("Invalid stake amount");
        tracker.takeIssue{value: lowStake}(issueId);
    }
    
    function testCreatorCannotTakeOwnIssue() public {
        vm.prank(creator);
        uint256 issueId = tracker.createIssue{value: BOUNTY + AI_FEE}(
            "https://github.com/test/issue/1",
            "Fix bug",
            DecentralizedIssueTracker.Difficulty.EASY,
            0, 0, 0, 50
        );
        
        uint256 stake = (BOUNTY * 10) / 100;
        
        vm.prank(creator);
        vm.expectRevert("Creator cannot assign issue to themselves");
        tracker.takeIssue{value: stake}(issueId);
    }
    
    function testGradeIssueByAI() public {
        vm.prank(creator);
        uint256 issueId = tracker.createIssue{value: BOUNTY + AI_FEE}(
            "https://github.com/test/issue/1",
            "Fix bug",
            DecentralizedIssueTracker.Difficulty.EASY,
            0, 0, 0, 50
        );
        
        uint256 stake = (BOUNTY * 10) / 100;
        vm.prank(contributor);
        tracker.takeIssue{value: stake}(issueId);
        
        vm.prank(aiAgent);
        tracker.gradeIssueByAI(issueId, 85);
        
        DecentralizedIssueTracker.Issue memory issue = tracker.getIssueInfo(issueId);
        assertEq(issue.presentHackerConfidenceScore, 85);
    }
    
    function testCompleteIssue() public {
        vm.prank(creator);
        uint256 issueId = tracker.createIssue{value: BOUNTY + AI_FEE}(
            "https://github.com/test/issue/1",
            "Fix bug",
            DecentralizedIssueTracker.Difficulty.EASY,
            0, 0, 0, 50
        );
        
        uint256 stake = (BOUNTY * 10) / 100;
        vm.prank(contributor);
        tracker.takeIssue{value: stake}(issueId);
        
        uint256 contributorBalanceBefore = contributor.balance;
        
        vm.prank(creator);
        tracker.completeIssue(issueId);
        
        DecentralizedIssueTracker.Issue memory issue = tracker.getIssueInfo(issueId);
        assertTrue(issue.isCompleted);
        assertEq(contributor.balance, contributorBalanceBefore + BOUNTY + stake);
    }
    
    function testSubmitAndApprovePercentageClaim() public {
        vm.prank(creator);
        uint256 issueId = tracker.createIssue{value: BOUNTY + AI_FEE}(
            "https://github.com/test/issue/1",
            "Fix bug",
            DecentralizedIssueTracker.Difficulty.EASY,
            0, 0, 0, 50
        );
        
        uint256 stake = (BOUNTY * 10) / 100;
        vm.prank(contributor);
        tracker.takeIssue{value: stake}(issueId);
        
        vm.prank(contributor);
        tracker.submitIssuePercentageClaim(issueId, 60);
        
        DecentralizedIssueTracker.Issue memory issue = tracker.getIssueInfo(issueId);
        assertTrue(issue.isUnderReview);
        assertEq(issue.claimedPercentage, 60);
        
        vm.prank(creator);
        tracker.submitIssuePercentageClaimResponse(issueId, true);
        
        issue = tracker.getIssueInfo(issueId);
        assertFalse(issue.isUnderReview);
        assertEq(issue.percentageCompleted, 60);
        assertEq(issue.claimedPercentage, 0);
    }
    
    function testClaimExpiredIssueWithSufficientCompletion() public {
        vm.prank(creator);
        uint256 issueId = tracker.createIssue{value: BOUNTY + AI_FEE}(
            "https://github.com/test/issue/1",
            "Fix bug",
            DecentralizedIssueTracker.Difficulty.EASY,
            1 days, 0, 0, 50
        );
        
        uint256 stake = (BOUNTY * 10) / 100;
        vm.prank(contributor);
        tracker.takeIssue{value: stake}(issueId);
        
        // Submit and approve 60% completion
        vm.prank(contributor);
        tracker.submitIssuePercentageClaim(issueId, 60);
        
        vm.prank(creator);
        tracker.submitIssuePercentageClaimResponse(issueId, true);
        
        // Fast forward past deadline
        vm.warp(block.timestamp + 2 days);
        
        uint256 contributorBalanceBefore = contributor.balance;
        
        vm.prank(contributor);
        tracker.claimExpiredIssue(issueId);
        
        uint256 expectedBounty = (BOUNTY * 60) / 100;
        uint256 expectedTotal = expectedBounty + stake;
        
        assertEq(contributor.balance, contributorBalanceBefore + expectedTotal);
    }
    
    function testClaimExpiredIssueForfeitsStake() public {
        vm.prank(creator);
        uint256 issueId = tracker.createIssue{value: BOUNTY + AI_FEE}(
            "https://github.com/test/issue/1",
            "Fix bug",
            DecentralizedIssueTracker.Difficulty.EASY,
            1 days, 0, 0, 50
        );
        
        uint256 stake = (BOUNTY * 10) / 100;
        vm.prank(contributor);
        tracker.takeIssue{value: stake}(issueId);
        
        // Submit only 30% completion (below 50% minimum)
        vm.prank(contributor);
        tracker.submitIssuePercentageClaim(issueId, 30);
        
        vm.prank(creator);
        tracker.submitIssuePercentageClaimResponse(issueId, true);
        
        // Fast forward past deadline
        vm.warp(block.timestamp + 2 days);
        
        uint256 contributorBalanceBefore = contributor.balance;
        
        vm.prank(contributor);
        tracker.claimExpiredIssue(issueId);
        
        // Should only get 30% of bounty, stake is forfeited
        uint256 expectedBounty = (BOUNTY * 30) / 100;
        
        assertEq(contributor.balance, contributorBalanceBefore + expectedBounty);
        
        // Check stake was added to bounty
        DecentralizedIssueTracker.Issue memory issue = tracker.getIssueInfo(issueId);
        assertEq(issue.bounty, BOUNTY - expectedBounty + stake);
    }
    
    function testIncreaseBounty() public {
        vm.prank(creator);
        uint256 issueId = tracker.createIssue{value: BOUNTY + AI_FEE}(
            "https://github.com/test/issue/1",
            "Fix bug",
            DecentralizedIssueTracker.Difficulty.EASY,
            0, 0, 0, 50
        );
        
        uint256 additionalBounty = 0.5 ether;
        
        vm.prank(creator);
        tracker.increaseBounty{value: additionalBounty}(issueId);
        
        DecentralizedIssueTracker.Issue memory issue = tracker.getIssueInfo(issueId);
        assertEq(issue.bounty, BOUNTY + additionalBounty);
    }
    
    function testCannotTakeIssueAlreadyAttempted() public {
        vm.prank(creator);
        uint256 issueId = tracker.createIssue{value: BOUNTY + AI_FEE}(
            "https://github.com/test/issue/1",
            "Fix bug",
            DecentralizedIssueTracker.Difficulty.EASY,
            1 days, 0, 0, 50
        );
        
        uint256 stake = (BOUNTY * 10) / 100;
        vm.prank(contributor);
        tracker.takeIssue{value: stake}(issueId);
        
        // Fast forward and expire
        vm.warp(block.timestamp + 2 days);
        
        vm.prank(contributor);
        tracker.claimExpiredIssue(issueId);
        
        // Try to take again
        vm.prank(contributor);
        vm.expectRevert("You have already attempted this issue");
        tracker.takeIssue{value: stake}(issueId);
    }
}