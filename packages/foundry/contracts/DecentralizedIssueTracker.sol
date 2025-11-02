// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/utils/ReentrancyGuard.sol";
import "@openzeppelin/access/Ownable.sol";
import "@openzeppelin/utils/Pausable.sol";

contract DecentralizedIssueTracker is ReentrancyGuard, Pausable {
    
    event IssueCreated(uint256 indexed issueId, address indexed creator, string githubIssueUrl, uint256 bounty, Difficulty difficulty);
    event IssueAssigned(uint256 indexed issueId, address indexed contributor, uint256 deadline);
    event IssueCompleted(uint256 indexed issueId, address indexed contributor, uint256 reward);
    event BountyIncreased(uint256 indexed issueId, uint256 newBounty);
    event DeadlineExpired(uint256 indexed issueId, address indexed contributor);
    event AIPaymentSent(address indexed from, uint256 amount);
    event StakeForfeited(uint256 indexed issueId, address indexed contributor, uint256 amount);
    
    enum Difficulty { EASY, MEDIUM, HARD }
    
    struct Issue {
        uint256 id;
        address creator;
        string githubIssueUrl;
        string description;
        uint256 bounty;
        address assignedTo;
        bool isCompleted;
        uint256 percentageCompleted;
        uint256 claimedPercentage;
        bool isUnderReview;
        uint256 createdAt;
        Difficulty difficulty;
        uint256 deadline;
        uint256 easyDuration;
        uint256 mediumDuration;
        uint256 hardDuration;
        uint256 presentHackerConfidenceScore;
        uint256 minimumBountyCompletionPercentageForStakeReturn;
    }

    mapping(uint256 => Issue) public issues;
    mapping(address => uint256) public contributorStakes;
    mapping(address => uint256[]) public creatorIssues;
    mapping(address => uint256[]) public contributorAssignedIssues;
    mapping(uint256 => address[]) public issuePreviousContributors;
    mapping(uint256 => mapping(address => uint256)) public issueToUserWithdrawAmountLeft;
    mapping(uint256 => mapping(address => bool)) public hasAttemptedIssue;
    mapping(address => uint256) public addressToNullifier;
    mapping(uint256 => address) public nullifierToAddress;
    
    uint256 public nextIssueId = 1;
    uint256 public constant AI_SERVICE_FEE = 0.00001 ether;
    address public AI_AGENT_ADDRESS;

    uint256 public constant MIN_CONTRIBUTOR_STAKE_PERCENTAGE = 5;
    uint256 public constant MAX_CONTRIBUTOR_STAKE_PERCENTAGE = 20;
    
    uint256 public constant DEFAULT_EASY_DURATION = 7 days;      
    uint256 public constant DEFAULT_MEDIUM_DURATION = 30 days;   
    uint256 public constant DEFAULT_HARD_DURATION = 150 days;

    modifier onlyAIAgent() {
        require(AI_AGENT_ADDRESS == msg.sender, "Only AI Agent can call this");
        _;
    }
    modifier onlyVerified() {
        require(addressToNullifier[msg.sender] != 0, "User not verified");
        _;
    }
    
    constructor(address _aiAgentAddress) {
        require(_aiAgentAddress != address(0), "Invalid AI agent address");
        AI_AGENT_ADDRESS = _aiAgentAddress;
    }


    function storeNullifier( uint256 _nullifier) external  {
        require(msg.sender != address(0), "Invalid user address");
        require(_nullifier > 0, "Invalid nullifier");
        require(addressToNullifier[msg.sender] == 0, "Nullifier already exists");
        require(nullifierToAddress[_nullifier] == address(0), "Nullifier already mapped");
        addressToNullifier[msg.sender] = _nullifier;
        nullifierToAddress[_nullifier] = msg.sender;

    }
    
    function createIssue(
        string memory _githubIssueUrl,
        string memory _description,
        Difficulty _difficulty,
        uint256 _easyDuration,
        uint256 _mediumDuration,
        uint256 _hardDuration, 
        uint256 _minimumBountyCompletionPercentageForStakeReturn
    ) external payable nonReentrant onlyVerified returns (uint256) {
        require(msg.value > AI_SERVICE_FEE, "Insufficient payment (must exceed AI service fee)");
        require(bytes(_githubIssueUrl).length > 0, "GitHub issue URL cannot be empty");
        require(_minimumBountyCompletionPercentageForStakeReturn <= 100, "Minimum percentage cannot exceed 100");
        
        payable(AI_AGENT_ADDRESS).transfer(AI_SERVICE_FEE);
        emit AIPaymentSent(msg.sender, AI_SERVICE_FEE);
        uint256 bounty = msg.value - AI_SERVICE_FEE;
        
        uint256 easyDur = _easyDuration > 0 ? _easyDuration : DEFAULT_EASY_DURATION;
        uint256 mediumDur = _mediumDuration > 0 ? _mediumDuration : DEFAULT_MEDIUM_DURATION;
        uint256 hardDur = _hardDuration > 0 ? _hardDuration : DEFAULT_HARD_DURATION;
        
        uint256 issueId = nextIssueId++;
        
        issues[issueId] = Issue({
            id: issueId,
            creator: msg.sender,
            githubIssueUrl: _githubIssueUrl,
            description: _description,
            bounty: bounty,
            assignedTo: address(0),
            isCompleted: false,
            isUnderReview: false,
            percentageCompleted: 0, 
            claimedPercentage: 0,
            createdAt: block.timestamp,
            difficulty: _difficulty,
            deadline: 0,
            easyDuration: easyDur,
            mediumDuration: mediumDur,
            hardDuration: hardDur,
            presentHackerConfidenceScore: 0,
            minimumBountyCompletionPercentageForStakeReturn: _minimumBountyCompletionPercentageForStakeReturn
        });
        
        creatorIssues[msg.sender].push(issueId);
        
        emit IssueCreated(issueId, msg.sender, _githubIssueUrl, bounty, _difficulty);
        return issueId;
    }
    
    function takeIssue(uint256 _issueId) external payable nonReentrant onlyVerified{
        Issue storage issue = issues[_issueId];
        require(issue.bounty > 0, "Issue bounty has been depleted");
        require(issue.id != 0, "Issue does not exist");
        require(issue.assignedTo == address(0), "Issue already assigned");
        require(msg.sender != issue.creator, "Creator cannot assign issue to themselves");
        require(!hasAttemptedIssue[_issueId][msg.sender], "You have already attempted this issue");
        
        uint256 requiredStake = (issue.bounty * MIN_CONTRIBUTOR_STAKE_PERCENTAGE) / 100;
        uint256 maxStake = (issue.bounty * MAX_CONTRIBUTOR_STAKE_PERCENTAGE) / 100;
        
        require(msg.value >= requiredStake && msg.value <= maxStake, "Invalid stake amount");
        
        uint256 deadline;
        if (issue.difficulty == Difficulty.EASY) {
            deadline = block.timestamp + issue.easyDuration;
        } else if (issue.difficulty == Difficulty.MEDIUM) {
            deadline = block.timestamp + issue.mediumDuration;
        } else {
            deadline = block.timestamp + issue.hardDuration;
        }
        
        issue.assignedTo = msg.sender;
        issue.deadline = deadline;
        
        hasAttemptedIssue[_issueId][msg.sender] = true;
        issuePreviousContributors[_issueId].push(msg.sender);
        
        contributorStakes[msg.sender] += msg.value;
        contributorAssignedIssues[msg.sender].push(_issueId);
        issueToUserWithdrawAmountLeft[_issueId][msg.sender] = msg.value;
        
        emit IssueAssigned(_issueId, msg.sender, deadline);
    }
    
    function gradeIssueByAI(uint256 _issueId, uint256 _confidenceScore) external nonReentrant onlyAIAgent {
        Issue storage issue = issues[_issueId];
        require(issue.id != 0, "Issue does not exist");
        require(issue.assignedTo != address(0), "Issue not assigned");
        require(!issue.isCompleted, "Issue already completed");
        require(_confidenceScore <= 100, "Confidence score must be between 0 and 100");
        
        issue.presentHackerConfidenceScore = _confidenceScore;
    }

    function completeIssue(uint256 _issueId) external nonReentrant onlyVerified {
        Issue storage issue = issues[_issueId];
        require(issue.id != 0, "Issue does not exist");
        require(msg.sender == issue.creator, "Only issue creator can complete issue");
        require(issue.assignedTo != address(0), "Issue not assigned");
        require(!issue.isCompleted, "Issue already completed");
        
        issue.isCompleted = true;
        uint256 contributorStake = issueToUserWithdrawAmountLeft[_issueId][issue.assignedTo];
        uint256 totalReward = issue.bounty + contributorStake;
        contributorStakes[issue.assignedTo] -= contributorStake;
        issueToUserWithdrawAmountLeft[_issueId][issue.assignedTo] = 0;
        payable(issue.assignedTo).transfer(totalReward);
        
        emit IssueCompleted(_issueId, issue.assignedTo, totalReward);
    }

    function increaseIssueDeadline(uint256 _issueId, uint256 _time) external nonReentrant onlyVerified {
        Issue storage issue = issues[_issueId];
        require(issue.id != 0, "Issue does not exist");
        require(msg.sender == issue.creator, "Only issue creator can extend deadline");
        require(issue.assignedTo != address(0), "Issue not assigned");
        require(!issue.isCompleted, "Issue already completed");
        require(_time > 0, "Time extension must be greater than zero");
        
        issue.deadline += _time;
    }

    function increaseIssueDifficulty(uint256 _issueId, Difficulty _difficulty) external nonReentrant onlyVerified{
        Issue storage issue = issues[_issueId];
        require(issue.id != 0, "Issue does not exist");
        require(msg.sender == issue.creator, "Only issue creator can extend deadline");
        require(issue.assignedTo != address(0), "Issue not assigned");
        require(!issue.isCompleted, "Issue already completed");
        require(_difficulty > issue.difficulty, "New difficulty must be greater than previous");
        issue.difficulty = _difficulty;
    }


    function submitIssuePercentageClaim(uint256 _issueId, uint256 _claimedPercentage) external nonReentrant onlyVerified {
        Issue storage issue = issues[_issueId];
        require(issue.id != 0, "Issue does not exist");
        require(issue.assignedTo != address(0), "Issue not assigned");
        require(!issue.isCompleted, "Issue already completed");
        require(msg.sender == issue.assignedTo, "Only assigned contributor can submit percentage");
        require(_claimedPercentage > 0 && _claimedPercentage <= 100, "Invalid percentage");
        require(_claimedPercentage > issue.percentageCompleted, "New percentage must be greater than previous");
        issue.isUnderReview = true;
        issue.claimedPercentage = _claimedPercentage;
    }

    function submitIssuePercentageClaimResponse(uint256 _issueId, bool _isAccepted) external nonReentrant onlyVerified{
        Issue storage issue = issues[_issueId];
        require(issue.id != 0, "Issue does not exist");
        require(issue.assignedTo != address(0), "Issue not assigned");
        require(!issue.isCompleted, "Issue already completed");
        require(msg.sender == issue.creator, "Only issue creator can respond to claim");
        require(issue.claimedPercentage > 0, "No claimed percentage to respond to");
        
        if (_isAccepted) {
            issue.percentageCompleted = issue.claimedPercentage;
        }
        issue.claimedPercentage = 0;
        issue.isUnderReview = false;
    }
    
    function claimExpiredIssue(uint256 _issueId) external nonReentrant onlyVerified{
        Issue storage issue = issues[_issueId];
        require(issue.id != 0, "Issue does not exist");
        require(issue.assignedTo != address(0), "Issue not assigned");
        require(!issue.isCompleted, "Issue already completed");
        require(issue.assignedTo == msg.sender, "Only assigned contributor can claim");
        require(block.timestamp > issue.deadline, "Deadline has not passed");
        
        issue.assignedTo = address(0);
        issue.deadline = 0;
        issue.presentHackerConfidenceScore = 0;
        
        uint256 contributorStake = issueToUserWithdrawAmountLeft[_issueId][msg.sender];
        uint256 fractionalBounty = (issue.bounty * issue.percentageCompleted) / 100;
        
        // If minimum completion not met, forfeit stake to bounty
        if(issue.percentageCompleted < issue.minimumBountyCompletionPercentageForStakeReturn){
            uint256 forfeitedAmount = contributorStake;
            issue.bounty += forfeitedAmount;  // Add forfeited stake to bounty
            contributorStake = 0;
            emit StakeForfeited(_issueId, msg.sender, forfeitedAmount);  
        }
        
        uint256 totalPayout = fractionalBounty + contributorStake;
        issue.bounty -= fractionalBounty;
        contributorStakes[msg.sender] -= issueToUserWithdrawAmountLeft[_issueId][msg.sender];  
        issueToUserWithdrawAmountLeft[_issueId][msg.sender] = 0;
        _removeIssueFromContributor(msg.sender, _issueId);
        
        if(totalPayout > 0) {
            payable(msg.sender).transfer(totalPayout);
        }
        
        emit DeadlineExpired(_issueId, msg.sender);
    }
    
    function _removeIssueFromContributor(address _contributor, uint256 _issueId) internal {
        uint256[] storage assignedIssues = contributorAssignedIssues[_contributor];
        for (uint256 i = 0; i < assignedIssues.length; i++) {
            if (assignedIssues[i] == _issueId) {
                assignedIssues[i] = assignedIssues[assignedIssues.length - 1];
                assignedIssues.pop();
                break;
            }
        }
    }
    
    function increaseBounty(uint256 _issueId) external payable onlyVerified nonReentrant{
        Issue storage issue = issues[_issueId];
        require(issue.id != 0, "Issue does not exist");
        require(issue.creator == msg.sender, "Only issue creator can increase bounty");
        require(!issue.isCompleted, "Cannot increase bounty for completed issue");
        require(msg.value > 0, "Must send some ETH");
        
        issue.bounty += msg.value;
        
        emit BountyIncreased(_issueId, issue.bounty);
    }
    
    
    function getIssueInfo(uint256 _issueId) external view returns (
        Issue memory issue
    ) {
        return issues[_issueId];
    }

    function getOrganisationIssues() external view returns (uint256[] memory) {
        uint256 totalIssues = nextIssueId - 1;
        uint256[] memory allIssues = new uint256[](totalIssues);
        for (uint256 i = 1; i <= totalIssues; i++) {
            allIssues[i - 1] = i;
        }
        return allIssues;
    }

    function getIssueDurations(uint256 _issueId) external view returns (uint256, uint256, uint256) {
        Issue storage issue = issues[_issueId];
        return (issue.easyDuration, issue.mediumDuration, issue.hardDuration);
    }
    
    function getCreatorIssues(address _creator) external view returns (uint256[] memory) {
        return creatorIssues[_creator];
    }
    
    function getContributorAssignedIssues(address _contributor) external view returns (uint256[] memory) {
        return contributorAssignedIssues[_contributor];
    }
    
    function getIssuePreviousContributors(uint256 _issueId) external view returns (address[] memory) {
        return issuePreviousContributors[_issueId];
    }
    
    function hasContributorAttemptedIssue(uint256 _issueId, address _contributor) external view returns (bool) {
        return hasAttemptedIssue[_issueId][_contributor];
    }
    
    function isIssueExpired(uint256 _issueId) external view returns (bool) {
        Issue storage issue = issues[_issueId];
        return issue.assignedTo != address(0) && !issue.isCompleted && block.timestamp > issue.deadline;
    }
    
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function isAddressVerified(address _user) external view returns (bool) {
        return addressToNullifier[_user] != 0;
    }
    
}
