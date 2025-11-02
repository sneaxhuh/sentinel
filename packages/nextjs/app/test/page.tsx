'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { Button } from '@/components/ui/button';
import { CONTRACT_ABI } from '@/app/config/abi';
import { 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  ExternalLink, 
  Terminal,
  Play,
  Trash2,
  Eye,
  Search,
  Zap,
  Target
} from 'lucide-react';

// Contract configuration - use the new Polkadot Asset Hub contract
const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x0156962e58CA27B884a0ea120c184b2355A83D50').trim() as `0x${string}`;

// Using the new simplified ABI from config

// Difficulty enum
enum Difficulty {
  EASY = 0,
  MEDIUM = 1,
  HARD = 2
}

interface TestFormData {
  githubUrl: string;
  description: string;
  bountyAmount: string;
  difficulty: Difficulty;
  easyDuration: number;
  mediumDuration: number;
  hardDuration: number;
  completionPercentage: number;
}

export default function TestPage() {
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  // Transaction states
  const { 
    isLoading: isTransactionLoading, 
    isSuccess: isTransactionSuccess 
  } = useWaitForTransactionReceipt({
    hash,
  });

  // Form states
  const [formData, setFormData] = useState<TestFormData>({
    githubUrl: '',
    description: '',
    bountyAmount: '0.1',
    difficulty: Difficulty.EASY,
    easyDuration: 7,
    mediumDuration: 14,
    hardDuration: 21,
    completionPercentage: 80
  });

  // Test states
  const [activeTest, setActiveTest] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const [issueId, setIssueId] = useState<string>('');

  // Add to logs function
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // Test Function 1: CREATE ISSUE
    const testCreateIssue = async () => {
    if (!isConnected || !address) {
      addLog('⚠️ Please connect your wallet first');
      return;
    }
    
    setActiveTest('createIssue');
    addLog(`Starting CREATE ISSUE test...`);
    addLog(`Connected: ${address}`);
    
    try {
      const bountyInWei = parseEther(formData.bountyAmount);
      
      // Log all form data (for testing purposes)
      addLog(`📋 Form Data:`);
      addLog(`  - GitHub URL: ${formData.githubUrl || 'None'}`);
      addLog(`  - Description: ${formData.description || 'None'}`);
      addLog(`  - Bounty: ${formData.bountyAmount} ETH`);
      addLog(`  - Difficulty: ${Object.keys(Difficulty)[formData.difficulty]}`);
      addLog(`  - Durations: Easy(${formData.easyDuration}d), Medium(${formData.mediumDuration}d), Hard(${formData.hardDuration}d)`);
      addLog(`  - Completion %: ${formData.completionPercentage}%`);
      
      
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'createIssue',
        args: [formData.difficulty],
        value: bountyInWei,
      });
      
      addLog('✅ Create issue transaction submitted!');
      
    } catch (error) {
      addLog(`❌ CREATE ISSUE failed: ${error}`);
      console.error('Create issue error:', error);
    }
  };

  // Test Function 2: GET ISSUE (using getIssueInfo from new ABI)
  const { refetch: refetchIssue } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getIssueInfo',
    args: issueId ? [BigInt(issueId)] : undefined,
    query: {
      enabled: false, // Don't auto-fetch
    }
  });

  const testGetIssue = async () => {
    if (!issueId) {
      addLog('⚠️ Please enter an Issue ID');
      return;
    }
    
    setActiveTest('getIssue');
    addLog(`Getting issue #${issueId}...`);
    
    try {
      const result = await refetchIssue();
      if (result.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const issue = result.data as any;
        addLog(`✅ Issue Found:`);
        addLog(`  - ID: #${issueId}`);
        addLog(`  - Bounty: ${formatEther(issue.bounty)} ETH`);
        addLog(`  - Creator: ${issue.creator}`);
        addLog(`  - Assigned To: ${issue.assignedTo}`);
        addLog(`  - Completed: ${issue.isCompleted}`);
        addLog(`  - Difficulty: ${Object.keys(Difficulty)[issue.difficulty]} (${issue.difficulty})`);
        addLog(`  - Created: ${new Date(Number(issue.createdAt) * 1000).toLocaleString()}`);
        addLog(`  - Deadline: ${new Date(Number(issue.deadline) * 1000).toLocaleString()}`);
      } else {
        addLog('❌ No issue found with that ID');
      }
    } catch (error) {
      addLog(`❌ GET ISSUE failed: ${error}`);
      console.error('Get issue error:', error);
    }
  };

  // Test Function 3: TAKE ISSUE
  const testTakeIssue = async () => {
    if (!isConnected || !issueId) return;
    
    setActiveTest('takeIssue');
    addLog(`Taking issue #${issueId}...`);
    
    try {
      // Calculate stake amount (for example, require some ETH as stake)
      const stakeAmount = parseEther('0.01'); // 0.01 ETH stake
      
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'takeIssue',
        args: [BigInt(issueId)],
        value: stakeAmount,
      });
      
      addLog('✅ Take issue transaction submitted!');
      
    } catch (error) {
      addLog(`❌ TAKE ISSUE failed: ${error}`);
      console.error('Take issue error:', error);
    }
  };

  // Test Function 4: GET ALL ISSUES (using simplified ABI)
  const { refetch: refetchAllIssues } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getAllIssues',
    query: {
      enabled: false,
    }
  });

  const testGetAllIssues = async () => {
    setActiveTest('getAllIssues');
    addLog('Getting all issues...');
    
    try {
      const result = await refetchAllIssues();
      if (result.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const issues = result.data as any[];
        addLog(`✅ Found ${issues.length} total issues:`);
        
        if (issues.length === 0) {
          addLog('📋 No issues found. Create one first!');
          return;
        }
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        issues.forEach((issue: any, index: number) => {
          addLog(`Issue #${index}:`);
          addLog(`  - Bounty: ${formatEther(issue.bounty)} ETH`);
          addLog(`  - Creator: ${issue.creator}`);
          addLog(`  - Status: ${issue.isCompleted ? 'Completed' : 'Open'}`);
          addLog(`  - Assigned To: ${(issue.assignedTo !== '0x0000000000000000000000000000000000000000') ? issue.assignedTo : 'Unassigned'}`);
          addLog(`  - Difficulty: ${Object.keys(Difficulty)[issue.difficulty]} (${issue.difficulty})`);
          addLog(`  - Created: ${new Date(Number(issue.createdAt) * 1000).toLocaleString()}`);
          addLog(`  - Deadline: ${new Date(Number(issue.deadline) * 1000).toLocaleString()}`);
          addLog('---');
        });
      } else {
        addLog('❌ No data returned from contract');
      }
    } catch (error) {
      addLog(`❌ GET ALL ISSUES failed: ${error}`);
      console.error('Get all issues error:', error);
    }
  };

  // Clear logs
  const clearLogs = () => {
    setLogs([]);
    setActiveTest('');
  };

  // Update form data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateFormData = (field: keyof TestFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Any connected address is treated as a judge address
  const isJudgeAddress = !!address;

  // Debug logging
  useEffect(() => {
    console.log('Contract Address:', CONTRACT_ADDRESS);
    console.log('Using simplified ABI with functions:', ['createIssue', 'takeIssue', 'getAllIssues', 'getIssueInfo']);
  }, []);

  // Monitor transaction success
  useEffect(() => {
    if (isTransactionSuccess && hash) {
      addLog(`✅ Transaction successful! Hash: ${hash}`);
      setActiveTest('');
    }
  }, [isTransactionSuccess, hash]);

  // Monitor transaction errors
  useEffect(() => {
    if (error) {
      addLog(`❌ Transaction failed: ${error.message}`);
      setActiveTest('');
    }
  }, [error]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black text-green-400 font-mono">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-6 text-green-400" />
            <h1 className="text-3xl font-bold mb-4">WALLET CONNECTION REQUIRED</h1>
            <p className="text-xl">Please connect your wallet to access the test suite</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono relative overflow-hidden">
      {/* Matrix background effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300ff00' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-green-400 font-mono tracking-wider">
            POLKADOT ASSET HUB TEST SUITE
          </h1>
          <p className="text-xl text-green-300">Simplified Contract Testing Interface</p>
          <div className="mt-4 p-4 bg-gray-900 border border-green-400 rounded">
            <p className="text-sm">Connected Address: <span className="text-cyan-400">{address}</span></p>
            <p className="text-sm">Contract: <span className="text-cyan-400">{CONTRACT_ADDRESS}</span></p>
            <p className="text-sm">Network: <span className="text-cyan-400">Polkadot Asset Hub Paseo (420420422)</span></p>
            <p className="text-sm text-green-400">✅ All addresses supported - No verification required!</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Panel - Test Controls */}
          <div className="space-y-6">
            {/* Issue Creation Form */}
            <div className="bg-gray-900 border-green-400 border-2 rounded-lg">
              <div className="p-6 border-b border-green-400">
                <h3 className="text-green-400 font-mono text-lg font-semibold flex items-center gap-2">
                  <Terminal className="w-5 h-5" />
                  1. CREATE ISSUE TEST
                </h3>
                <p className="text-green-300 text-sm mt-1">
                  Test simplified issue creation with just difficulty and bounty
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-green-400 text-sm font-medium block mb-2">Bounty Amount (ETH)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={formData.bountyAmount}
                      onChange={(e) => updateFormData('bountyAmount', e.target.value)}
                      className="w-full px-3 py-2 bg-black border border-green-400 text-green-400 rounded focus:outline-none focus:border-green-300"
                      placeholder="0.1"
                    />
                  </div>
                  <div>
                    <label className="text-green-400 text-sm font-medium block mb-2">Difficulty</label>
                    <select 
                      value={formData.difficulty} 
                      onChange={(e) => updateFormData('difficulty', parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-black border border-green-400 text-green-400 rounded focus:outline-none focus:border-green-300"
                    >
                      <option value={0}>Easy</option>
                      <option value={1}>Medium</option>
                      <option value={2}>Hard</option>
                    </select>
                  </div>
                </div>

                {/* Additional Form Fields (for testing/UI purposes) */}
                <div>
                  <label className="text-green-400 text-sm font-medium block mb-2">GitHub Issue URL</label>
                  <input 
                    type="text"
                    value={formData.githubUrl}
                    onChange={(e) => updateFormData('githubUrl', e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-green-400 text-green-400 rounded focus:outline-none focus:border-green-300"
                    placeholder="https://github.com/owner/repo/issues/123"
                  />
                </div>

                <div>
                  <label className="text-green-400 text-sm font-medium block mb-2">Description</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-black border border-green-400 text-green-400 rounded focus:outline-none focus:border-green-300"
                    placeholder="Describe the issue or task..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-green-400 text-sm font-medium block mb-2">Completion % Required</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="100"
                      value={formData.completionPercentage}
                      onChange={(e) => updateFormData('completionPercentage', parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-black border border-green-400 text-green-400 rounded focus:outline-none focus:border-green-300"
                      placeholder="80"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-green-400 text-sm font-medium block mb-2">Easy Duration (days)</label>
                    <input 
                      type="number" 
                      min="1"
                      value={formData.easyDuration}
                      onChange={(e) => updateFormData('easyDuration', parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-black border border-green-400 text-green-400 rounded focus:outline-none focus:border-green-300"
                      placeholder="7"
                    />
                  </div>
                  <div>
                    <label className="text-green-400 text-sm font-medium block mb-2">Medium Duration (days)</label>
                    <input 
                      type="number" 
                      min="1"
                      value={formData.mediumDuration}
                      onChange={(e) => updateFormData('mediumDuration', parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-black border border-green-400 text-green-400 rounded focus:outline-none focus:border-green-300"
                      placeholder="14"
                    />
                  </div>
                  <div>
                    <label className="text-green-400 text-sm font-medium block mb-2">Hard Duration (days)</label>
                    <input 
                      type="number" 
                      min="1"
                      value={formData.hardDuration}
                      onChange={(e) => updateFormData('hardDuration', parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-black border border-green-400 text-green-400 rounded focus:outline-none focus:border-green-300"
                      placeholder="21"
                    />
                  </div>
                </div>

                

                <Button 
                  onClick={testCreateIssue}
                  disabled={isPending || isTransactionLoading || activeTest === 'createIssue'}
                  className="w-full bg-green-600 hover:bg-green-700 text-black font-mono font-bold py-3"
                >
                  {(isPending || isTransactionLoading || activeTest === 'createIssue') && 
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  }
                  <Play className="w-4 h-4 mr-2" />
                  CREATE ISSUE TEST
                </Button>
              </div>
            </div>

            {/* Other Test Functions */}
            <div className="bg-gray-900 border-green-400 border-2 rounded-lg">
              <div className="p-6 border-b border-green-400">
                <h3 className="text-green-400 font-mono text-lg font-semibold flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  2. ISSUE OPERATIONS
                </h3>
                <p className="text-green-300 text-sm mt-1">
                  Test issue retrieval and assignment
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-green-400 text-sm font-medium block mb-2">Issue ID</label>
                  <input 
                    type="number" 
                    value={issueId}
                    onChange={(e) => setIssueId(e.target.value)}
                    placeholder="Enter issue ID (0, 1, 2...)"
                    className="w-full px-3 py-2 bg-black border border-green-400 text-green-400 rounded focus:outline-none focus:border-green-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    onClick={testGetIssue}
                    disabled={activeTest === 'getIssue'}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-mono py-3"
                  >
                    {activeTest === 'getIssue' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <Eye className="w-4 h-4 mr-2" />
                    GET ISSUE
                  </Button>
                  
                  <Button 
                    onClick={testTakeIssue}
                    disabled={isPending || isTransactionLoading || activeTest === 'takeIssue'}
                    className="bg-yellow-600 hover:bg-yellow-700 text-black font-mono py-3"
                  >
                    {(isPending || isTransactionLoading || activeTest === 'takeIssue') && 
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    }
                    <Zap className="w-4 h-4 mr-2" />
                    TAKE ISSUE
                  </Button>
                </div>

                <Button 
                  onClick={testGetAllIssues}
                  disabled={activeTest === 'getAllIssues'}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-mono py-3"
                >
                  {activeTest === 'getAllIssues' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Search className="w-4 h-4 mr-2" />
                  GET ALL ISSUES
                </Button>
              </div>
            </div>
          </div>

          {/* Right Panel - Logs and Results */}
          <div className="space-y-6">
            {/* Transaction Status */}
            {(isPending || isTransactionLoading) && (
              <div className="border border-yellow-400 bg-yellow-900/20 p-4 rounded-lg">
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin text-yellow-400 mr-3" />
                  <div className="text-yellow-400">
                    Transaction in progress... Please wait.
                  </div>
                </div>
              </div>
            )}

            

            {error && (
              <div className="border border-red-400 bg-red-900/20 p-4 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-red-400 mr-3" />
                  <div className="text-red-400">
                    Error: {error.message}
                  </div>
                </div>
              </div>
            )}

            {/* Logs Panel */}
            <div className="bg-gray-900 border-green-400 border-2 rounded-lg">
              <div className="flex items-center justify-between p-6 border-b border-green-400">
                <h3 className="text-green-400 font-mono text-lg font-semibold">EXECUTION LOGS</h3>
                <Button 
                  onClick={clearLogs}
                  className="bg-gray-700 hover:bg-gray-600 text-green-400 border border-green-400 px-3 py-1 text-sm"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  CLEAR
                </Button>
              </div>
              <div className="p-6">
                <div className="bg-black border border-green-400 rounded p-4 h-96 overflow-y-auto">
                  {logs.length === 0 ? (
                    <p className="text-green-600 italic">No logs yet. Run a test to see execution details.</p>
                  ) : (
                    <div className="space-y-1">
                      {logs.map((log, index) => (
                        <div key={index} className="text-sm text-green-400 font-mono break-all">
                          {log}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Debug Info */}
            <div className="bg-gray-900 border-green-400 border-2 rounded-lg">
              <div className="p-6 border-b border-green-400">
                <h3 className="text-green-400 font-mono text-lg font-semibold">DEBUG INFO</h3>
              </div>
              <div className="p-6 text-sm">
                <div className="grid grid-cols-2 gap-4 text-green-300 font-mono">
                  <div>isPending: {isPending.toString()}</div>
                  <div>isTransactionLoading: {isTransactionLoading.toString()}</div>
                  <div>isTransactionSuccess: {isTransactionSuccess.toString()}</div>
                  <div>activeTest: {activeTest || 'none'}</div>
                  <div>isJudgeAddress: {isJudgeAddress?.toString() || 'false'}</div>
                  <div>hash: {hash ? `${hash.slice(0, 10)}...` : 'none'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}