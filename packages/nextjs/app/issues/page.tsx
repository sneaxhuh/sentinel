"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther, parseEther } from "viem";
import { CONTRACT_ABI } from "@/app/config/abi";
import { 
  Clock, 
  DollarSign, 
  User, 
  Calendar,
  Tag,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  GitBranch,
  Zap,
  Filter,
  Search,
  Plus,
  X,
  Info,
  TrendingUp,
  Shield,
  Target
} from "lucide-react";
import Link from "next/link";

const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '').trim() as `0x${string}`;

// Use the simplified ABI directly

interface Issue {
  id: bigint;
  creator: string;
  assignedTo: string;
  bounty: bigint;
  createdAt: bigint;
  deadline: bigint;
  difficulty: number;
  isCompleted: boolean;
}

const difficultyLabels = ['Easy', 'Medium', 'Hard'];
const difficultyColors = ['bg-[#56DF7C]', 'bg-[#FF9A51]', 'bg-[#B490FF]'];

export default function IssuesPage() {
  const { address, isConnected } = useAccount();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [takingIssue, setTakingIssue] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stakeAmount, setStakeAmount] = useState("");

  // Contract write hook for taking issues
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  // Wait for transaction receipt
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Get all issues directly using the new getAllIssues function
  const { data: allIssues, isError: issuesError, isLoading: issuesLoading, error: contractError } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getAllIssues',
    query: {
      enabled: Boolean(CONTRACT_ADDRESS),
    },
  });

  // Debug logging
  useEffect(() => {
    console.log('Contract Address:', CONTRACT_ADDRESS);
    console.log('Issues Error:', issuesError);
    console.log('Contract Error:', contractError);
    console.log('Issues Loading:', issuesLoading);
    console.log('All Issues Data:', allIssues);
  }, [CONTRACT_ADDRESS, issuesError, contractError, issuesLoading, allIssues]);

  // Update issues state when data is loaded
  useEffect(() => {
    if (allIssues && Array.isArray(allIssues)) {
      // Add index as ID for each issue since the new ABI doesn't include ID
      const validIssues = allIssues.map((issue, index) => ({
        ...issue,
        id: BigInt(index)
      })).filter(issue => issue && issue.creator !== "0x0000000000000000000000000000000000000000");
      setIssues(validIssues);
    }
    setLoading(false);
  }, [allIssues]);

  // Filter issues based on search and filters
  useEffect(() => {
    let filtered = issues;

    // Search filter (simplified since we don't have description/URL in new contract)
    if (searchTerm) {
      filtered = filtered.filter(issue => 
        issue.creator.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.id.toString().includes(searchTerm)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(issue => {
        switch (statusFilter) {
          case "open":
            return !issue.isCompleted && issue.assignedTo === "0x0000000000000000000000000000000000000000";
          case "assigned":
            return !issue.isCompleted && issue.assignedTo !== "0x0000000000000000000000000000000000000000";
          case "completed":
            return issue.isCompleted;
          case "under-review":
            return false; // Simplified contract doesn't track review state
          default:
            return true;
        }
      });
    }

    // Difficulty filter
    if (difficultyFilter !== "all") {
      const difficultyIndex = ["easy", "medium", "hard"].indexOf(difficultyFilter);
      filtered = filtered.filter(issue => issue.difficulty === difficultyIndex);
    }

    setFilteredIssues(filtered);
  }, [issues, searchTerm, statusFilter, difficultyFilter]);

  const getIssueStatus = (issue: Issue) => {
    if (issue.isCompleted) return { label: "Completed", color: "bg-[#56DF7C]", icon: CheckCircle2 };
    // Removed under review state (not in simplified contract)
    if (issue.assignedTo !== "0x0000000000000000000000000000000000000000") {
      const isExpired = issue.deadline > BigInt(0) && BigInt(Math.floor(Date.now() / 1000)) > issue.deadline;
      return { 
        label: isExpired ? "Expired" : "Assigned", 
        color: isExpired ? "bg-red-500" : "bg-[#FF9A51]", 
        icon: isExpired ? AlertCircle : User 
      };
    }
    return { label: "Open", color: "bg-[#7CC0FF]", icon: GitBranch };
  };

  const formatTimeAgo = (timestamp: bigint) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - Number(timestamp);
    
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const openIssueModal = (issue: Issue) => {
    setSelectedIssue(issue);
    setIsModalOpen(true);
    // Set default stake to 10% of bounty
    const defaultStake = formatEther(issue.bounty / BigInt(10));
    setStakeAmount(defaultStake);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedIssue(null);
    setStakeAmount("");
  };

  const handleTakeIssueFromModal = async () => {
    if (!selectedIssue || !isConnected || !address || !stakeAmount) {
      alert('Please connect your wallet and enter a stake amount');
      return;
    }

    try {
      setTakingIssue(selectedIssue.id.toString());
      
      const stakeAmountWei = parseEther(stakeAmount);
      
      console.log('Taking issue:', selectedIssue.id.toString());
      console.log('Stake amount (wei):', stakeAmountWei.toString());
      
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'takeIssue',
        args: [selectedIssue.id],
        value: stakeAmountWei,
      });
      
      console.log('Take issue transaction submitted successfully');
    } catch (error) {
      console.error('Error taking issue:', error);
      alert('Failed to take issue. Please try again.');
      setTakingIssue(null);
    }
  };

  const handleTakeIssue = async (issueId: bigint, bounty: bigint) => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      setTakingIssue(issueId.toString());
      
      // Calculate stake (10% of bounty as example)
      const stakeAmount = bounty / BigInt(10);
      
      console.log('Taking issue:', issueId.toString());
      console.log('Stake amount (wei):', stakeAmount.toString());
      
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'takeIssue',
        args: [issueId],
        value: stakeAmount,
      });
      
      console.log('Take issue transaction submitted successfully');
    } catch (error) {
      console.error('Error taking issue:', error);
      alert('Failed to take issue. Please try again.');
      setTakingIssue(null);
    }
  };

  // Reset taking issue state when transaction is confirmed
  useEffect(() => {
    if (isConfirmed) {
      setTakingIssue(null);
      // Refresh issues list
      window.location.reload();
    }
  }, [isConfirmed]);

  const extractRepoFromUrl = (url: string) => {
    const match = url.match(/github\.com\/([^\/]+\/[^\/]+)/);
    return match ? match[1] : url;
  };

  if (issuesLoading || loading) {
    return (
      <div className="min-h-screen bg-black bg-cover bg-center bg-fixed font-upheaval flex items-center justify-center" 
           style={{ backgroundImage: "url('/background.webp')" }}>
        <div className="absolute inset-0 bg-green-400/10 pointer-events-none"></div>
        <div className="text-center relative z-10">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-green-400" />
          <p className="text-lg font-mono text-green-300">Loading issues...</p>
        </div>
      </div>
    );
  }

  if (issuesError) {
    return (
      <div className="min-h-screen bg-black bg-cover bg-center bg-fixed font-upheaval flex items-center justify-center"
           style={{ backgroundImage: "url('/background.webp')" }}>
        <div className="absolute inset-0 bg-green-400/10 pointer-events-none"></div>
        <div className="text-center max-w-md relative z-10">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <p className="text-lg font-mono text-green-300 mb-4">Error loading issues. Please try again later.</p>
          {contractError && (
            <details className="text-left bg-black/80 p-4 border border-red-400 backdrop-blur-sm">
              <summary className="cursor-pointer font-bold text-red-400 font-mono">Error Details</summary>
              <pre className="text-xs mt-2 text-red-300 whitespace-pre-wrap font-mono">
                {contractError.message || JSON.stringify(contractError, null, 2)}
              </pre>
            </details>
          )}
          <div className="mt-4 text-sm text-green-300/70">
            <p className="font-mono">Possible causes:</p>
            <ul className="text-left mt-2 space-y-1 font-mono">
              <li>• Wrong network selected in wallet</li>
              <li>• Contract not deployed on current network</li>
              <li>• RPC connection issues</li>
              <li>• Contract address not configured</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black bg-cover bg-center bg-fixed font-upheaval" 
         style={{ backgroundImage: "url('/background.webp')" }}>
      <div className="absolute inset-0 bg-green-400/10 pointer-events-none"></div>
      {/* Header Section */}
      <section className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-upheaval text-green-400 mb-6 italic">
            ALL ISSUES
          </h1>
          <p className="text-lg font-mono text-green-300 max-w-3xl mx-auto mb-8">
            Browse and contribute to open-source issues with <em className="italic text-green-400">decentralized bounties</em> on the Moonbase Alpha blockchain.
          </p>
          
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center mb-8">
            <Link href="/create-issue">
              <Button className="bg-green-600 text-black px-8 py-4 border border-green-400 hover:bg-green-400 font-upheaval text-lg transition-all">
                <Plus className="w-5 h-5 mr-2" />
                CREATE ISSUE
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-black/80 border border-green-400 backdrop-blur-sm p-6 mb-8">
          <div className="grid md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-400" />
              <input
                type="text"
                placeholder="Search issues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-green-400 bg-black text-green-300 focus:outline-none focus:border-green-300 font-mono"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-green-400 bg-black text-green-300 focus:outline-none focus:border-green-300 font-mono"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="assigned">Assigned</option>
              <option value="under-review">Under Review</option>
              <option value="completed">Completed</option>
            </select>

            {/* Difficulty Filter */}
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="px-4 py-3 border border-green-400 bg-black text-green-300 focus:outline-none focus:border-green-300 font-mono"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            {/* Results Count */}
            <div className="flex items-center justify-center bg-green-600 text-black px-4 py-3 border border-green-400 font-mono font-bold">
              {filteredIssues.length} ISSUES
            </div>
          </div>
        </div>

        {/* Issues Grid */}
        {filteredIssues.length === 0 ? (
          <div className="text-center py-16">
            <GitBranch className="w-16 h-16 mx-auto mb-4 text-green-400 opacity-50" />
            <h3 className="text-3xl font-upheaval text-green-400 mb-2">NO ISSUES FOUND</h3>
            <p className="font-mono text-green-300">
              {issues.length === 0 
                ? "No issues have been created yet. Be the first to create one!"
                : "Try adjusting your search or filter criteria."
              }
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIssues.map((issue) => {
              const status = getIssueStatus(issue);
              const StatusIcon = status.icon;
              
              return (
                <div
                  key={issue.id.toString()}
                  onClick={() => openIssueModal(issue)}
                  className="bg-black/80 border border-green-400 backdrop-blur-sm hover:border-green-300 transition-all cursor-pointer"
                >
                  {/* Issue Header */}
                  <div className="p-6 border-b border-green-400/30">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-mono text-green-400">#{issue.id.toString()}</span>
                        <div className="bg-green-600 border border-green-400 px-2 py-1">
                          <span className="text-sm font-mono text-black font-bold">
                            {difficultyLabels[issue.difficulty]}
                          </span>
                        </div>
                      </div>
                      <div className="bg-green-500 border border-green-400 px-3 py-1 flex items-center gap-1">
                        <StatusIcon className="w-4 h-4 text-black" />
                        <span className="text-sm font-mono text-black font-bold">{status.label}</span>
                      </div>
                    </div>

                    <h3 className="text-lg font-upheaval text-green-400 mb-2 line-clamp-2">
                      Issue #{issue.id.toString()} - {difficultyLabels[issue.difficulty]} Level Bounty
                    </h3>

                    <div className="flex items-center gap-2 text-green-300 mb-4">
                      <GitBranch className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-mono truncate">
                        Contract Issue #{issue.id.toString()}
                      </span>
                    </div>
                  </div>

                  {/* Issue Details */}
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-mono text-green-300 font-bold">
                          {formatEther(issue.bounty)} DEV
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-mono text-green-300">
                          {formatTimeAgo(issue.createdAt)}
                        </span>
                      </div>
                    </div>

                    {issue.assignedTo !== "0x0000000000000000000000000000000000000000" && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-green-400" />
                          <span className="text-sm font-mono text-green-400 font-bold">ASSIGNED TO:</span>
                        </div>
                        <span className="text-sm font-mono text-green-300">
                          {issue.assignedTo.slice(0, 6)}...{issue.assignedTo.slice(-4)}
                        </span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <a
                        href="#"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1"
                      >
                        <Button className="w-full bg-black text-green-400 border border-green-400 hover:bg-green-400 hover:text-black font-mono font-bold transition-all">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          VIEW ON GITHUB
                        </Button>
                      </a>
                      
                      {!issue.isCompleted && issue.assignedTo === "0x0000000000000000000000000000000000000000" && isConnected && (
                        <Button 
                          onClick={() => handleTakeIssue(issue.id, issue.bounty)}
                          disabled={takingIssue === issue.id.toString() || isPending || isConfirming}
                          className="bg-green-600 text-black border border-green-400 hover:bg-green-400 font-mono font-bold px-4 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          {takingIssue === issue.id.toString() || (isPending && takingIssue === issue.id.toString()) ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Zap className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Issue Detail Modal */}
      {isModalOpen && selectedIssue && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
          <div className="bg-black border border-green-400 backdrop-blur-sm max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-green-400/20 border-b border-green-400 p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-upheaval text-green-400 font-bold">ISSUE #{selectedIssue.id.toString()}</h2>
                <div className="bg-green-600 border border-green-400 px-3 py-1">
                  <span className="text-sm font-mono text-black font-bold">
                    {difficultyLabels[selectedIssue.difficulty]}
                  </span>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="bg-black text-green-400 border border-green-400 hover:bg-green-400 hover:text-black p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8">
              {/* Issue Status */}
              <div className="mb-6">
                {(() => {
                  const status = getIssueStatus(selectedIssue);
                  const StatusIcon = status.icon;
                  return (
                    <div className="bg-green-500 border border-green-400 px-4 py-2 inline-flex items-center gap-2">
                      <StatusIcon className="w-5 h-5 text-black" />
                      <span className="font-mono text-black font-bold">{status.label}</span>
                    </div>
                  );
                })()}
              </div>

              {/* Issue Description */}
              <div className="mb-8">
                <h3 className="text-xl font-upheaval text-green-400 mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  DESCRIPTION
                </h3>
                <div className="bg-black/80 border border-green-400 p-6 backdrop-blur-sm">
                  <p className="font-mono text-green-300 leading-relaxed">
                    This is Issue #{selectedIssue.id.toString()} with {difficultyLabels[selectedIssue.difficulty]} difficulty level.
                    Created by: {selectedIssue.creator.slice(0, 6)}...{selectedIssue.creator.slice(-4)}
                  </p>
                </div>
              </div>

              {/* Issue Details Grid */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="bg-black/80 border border-green-400 p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-5 h-5 text-green-400" />
                      <span className="text-sm font-mono text-green-400 font-bold">BOUNTY</span>
                    </div>
                    <span className="text-lg font-mono text-green-300">{formatEther(selectedIssue.bounty)} DEV</span>
                  </div>

                  <div className="bg-black/80 border border-green-400 p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-green-400" />
                      <span className="text-sm font-mono text-green-400 font-bold">CREATED</span>
                    </div>
                    <span className="font-mono text-green-300">{formatTimeAgo(selectedIssue.createdAt)}</span>
                  </div>

                  <div className="bg-black/80 border border-green-400 p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <GitBranch className="w-5 h-5 text-green-400" />
                      <span className="text-sm font-mono text-green-400 font-bold">REPOSITORY</span>
                    </div>
                    <span className="font-mono text-green-300">Contract Issue #{selectedIssue.id.toString()}</span>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {selectedIssue.assignedTo !== "0x0000000000000000000000000000000000000000" && (
                    <div className="bg-black/80 border border-green-400 p-4 backdrop-blur-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-5 h-5 text-green-400" />
                        <span className="text-sm font-mono text-green-400 font-bold">ASSIGNED TO</span>
                      </div>
                      <span className="font-mono text-green-300">
                        {selectedIssue.assignedTo.slice(0, 6)}...{selectedIssue.assignedTo.slice(-4)}
                      </span>
                    </div>
                  )}

                  {/* Progress tracking removed - not available in simplified contract */}
                </div>
              </div>

              {/* Staking Section */}
              {!selectedIssue.isCompleted && selectedIssue.assignedTo === "0x0000000000000000000000000000000000000000" && isConnected && (
                <div className="bg-black/80 border border-green-400 p-6 mb-6 backdrop-blur-sm">
                  <h3 className="text-xl font-upheaval text-green-400 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    STAKE & CONTRIBUTE
                  </h3>
                  <p className="font-mono text-green-300 mb-4">
                    To work on this issue, you need to stake DEV as a commitment. The stake will be returned when you complete the work.
                  </p>
                  
                  <div className="mb-4">
                    <label className="text-sm font-mono text-green-400 font-bold mb-2 block">
                      STAKE AMOUNT (DEV)
                    </label>
                    <input
                      type="number"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      placeholder="Enter stake amount"
                      className="w-full px-4 py-3 border border-green-400 bg-black text-green-300 focus:outline-none focus:border-green-300 font-mono"
                      step="0.01"
                      min="0"
                    />
                    <p className="text-sm font-mono text-green-300/70 mt-1">
                      Recommended: {formatEther(selectedIssue.bounty / BigInt(10))} DEV (10% of bounty)
                    </p>
                  </div>

                  <Button
                    onClick={handleTakeIssueFromModal}
                    disabled={takingIssue === selectedIssue.id.toString() || isPending || isConfirming || !stakeAmount}
                    className="w-full bg-green-600 text-black px-8 py-4 border border-green-400 hover:bg-green-400 font-upheaval text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {takingIssue === selectedIssue.id.toString() || (isPending && takingIssue === selectedIssue.id.toString()) ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        TAKING ISSUE...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 mr-2" />
                        STAKE & TAKE ISSUE
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button className="w-full bg-black text-green-400 border border-green-400 hover:bg-green-400 hover:text-black font-mono font-bold py-3 transition-all">
                    <ExternalLink className="w-5 h-5 mr-2" />
                    VIEW ON GITHUB
                  </Button>
                </a>
                
                <Button
                  onClick={closeModal}
                  variant="outline"
                  className="bg-black text-green-400 px-8 py-3 border border-green-400 hover:bg-green-400 hover:text-black font-mono font-bold transition-all"
                >
                  CLOSE
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}