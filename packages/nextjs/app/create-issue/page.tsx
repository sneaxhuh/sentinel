"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { GitHubAPI, createDifficultyLabels } from "@/lib/github-api";
import { CONTRACT_ABI } from '../config/abi';
import { 
  Plus, 
  GitBranch, 
  Clock, 
  DollarSign, 
  AlertCircle, 
  CheckCircle2, 
  X,
  User,
  Calendar,
  Tag,
  ExternalLink,
  Loader2,
  Zap
} from "lucide-react";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

if (!CONTRACT_ADDRESS) {
  throw new Error('NEXT_PUBLIC_CONTRACT_ADDRESS environment variable is not set');
}

// GitHub Issue interface
interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  user: {
    login: string;
    avatar_url: string;
  };
  labels: Array<{
    name: string;
    color: string;
  }>;
}

interface AnalysisResult {
  agents_discovered: number;
  agents_used: number;
  analysis_method: string;
  repository: string;
  selected_agents: string[];
  success: boolean;
  github_payload: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    assignees: any[];
    body: string;
    labels: string[];
    title: string;
  };
  synthesized_analysis: {
    acceptance_criteria: string[];
    body: string;
    difficulty: string;
    implementation_estimate: string;
    labels: string[];
    priority: string;
    technical_requirements: string[];
    title: string;
  };
}

enum Difficulty {
  EASY = 0,
  MEDIUM = 1,
  HARD = 2
}

const DIFFICULTY_CONFIG = {
  [Difficulty.EASY]: {
    label: "Easy",
    color: "bg-[#56DF7C]",
    duration: 7,
    description: "Simple bug fixes, documentation updates"
  },
  [Difficulty.MEDIUM]: {
    label: "Medium", 
    color: "bg-[#7CC0FF]",
    duration: 30,
    description: "Feature implementations, moderate complexity"
  },
  [Difficulty.HARD]: {
    label: "Hard",
    color: "bg-[#FF9A51]", 
    duration: 150,
    description: "Complex features, architectural changes"
  }
};

export default function CreateIssuePage() {
  const { data: session } = useSession();
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check token scopes on mount
  useEffect(() => {
    const checkTokenScopes = async () => {
      if (session?.accessToken) {
        try {
          const userResponse = await fetch('https://api.github.com/user', {
            headers: {
              'Authorization': `Bearer ${session.accessToken}`,
              'Accept': 'application/vnd.github.v3+json',
            },
          });
          
          if (userResponse.ok) {
            const scopes = userResponse.headers.get('X-OAuth-Scopes');
            console.log('Token scopes check:', scopes);
            setHasRepoScope(scopes?.includes('repo') || false);
          }
        } catch (error) {
          console.warn('Could not check token scopes:', error);
        }
      }
    };

    checkTokenScopes();
  }, [session]);
  
  // State management
  const [githubIssues, setGithubIssues] = useState<GitHubIssue[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [repositories, setRepositories] = useState<any[]>([]);
  const [repositoriesLoaded, setRepositoriesLoaded] = useState(false);
  const [repositoriesLoading, setRepositoriesLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<string>(""); // Format: "owner/repo"
  
  // AI Analysis states
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [approvingIssue, setApprovingIssue] = useState(false);
  const [hasRepoScope, setHasRepoScope] = useState<boolean | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    githubUrl: "",
    difficulty: Difficulty.EASY,
    bountyAmount: "0.1",
    customDurations: {
      easy: 0,
      medium: 0, 
      hard: 0
    },
    minimumCompletionPercentage: 80
  });

  // Contract interaction
  const { data: contractWriteData, writeContract, isPending: isContractLoading, error: contractError } = useWriteContract();

  const { isLoading: isTransactionLoading, isSuccess: isTransactionSuccess, error: transactionError } = useWaitForTransactionReceipt({
    hash: contractWriteData,
  });

  // Store the created GitHub issue temporarily until blockchain confirmation
  const [pendingGitHubIssue, setPendingGitHubIssue] = useState<GitHubIssue | null>(null);

  // Fetch user repositories only when needed (removed automatic fetching)

  // Fetch GitHub issues
  useEffect(() => {
    if (session?.accessToken && selectedRepo) {
      fetchGitHubIssues();
    }
  }, [session, selectedRepo]);

  // Handle transaction success/failure
  useEffect(() => {
    if (isTransactionSuccess) {
      // If we created a new GitHub issue, add it to the list
      if (pendingGitHubIssue) {
        console.log('Transaction successful, adding new issue to list');
        setGithubIssues(prev => [pendingGitHubIssue, ...prev]);
      }
      
      // Transaction succeeded - close form and reset
      setShowCreateForm(false);
      setFormData({
        title: "",
        description: "",
        githubUrl: "",
        difficulty: Difficulty.EASY,
        bountyAmount: "0.1",
        customDurations: { easy: 0, medium: 0, hard: 0 },
        minimumCompletionPercentage: 80
      });
      setPendingGitHubIssue(null);
      alert('Bounty created successfully! 🎉');
    }
  }, [isTransactionSuccess, pendingGitHubIssue]);

  // Handle transaction/contract errors
  useEffect(() => {
    if (contractError || transactionError) {
      console.error('Transaction failed:', contractError || transactionError);
      
      let errorMessage = 'Failed to create bounty on blockchain. ';
      const error = contractError || transactionError;
      
      if (error?.message?.includes('User not verified')) {
        errorMessage += 'Please verify your account first.';
      } else if (error?.message?.includes('Insufficient payment')) {
        errorMessage += 'Bounty amount must be greater than the AI service fee.';
      } else if (error?.message?.includes('rejected')) {
        errorMessage += 'Transaction was rejected by user.';
      } else {
        errorMessage += error?.message || 'Please try again.';
      }
      
      alert(errorMessage);
      setPendingGitHubIssue(null);
    }
  }, [contractError, transactionError]);

  const fetchRepositories = async () => {
    if (!session?.accessToken || repositoriesLoading) return;
    
    setRepositoriesLoading(true);
    try {
      const githubApi = new GitHubAPI(session.accessToken);
      const allRepos = await githubApi.getUserRepos();
      console.log(`Found ${allRepos.length} repositories from API`);
      
      // For now, let's not verify each repository individually as it's slow
      // Instead, rely on the getUserRepos method to return only accessible repos
      setRepositories(allRepos);
      setRepositoriesLoaded(true);
      console.log(`Loaded ${allRepos.length} repositories for selection`);
      
      // Log some repository info for debugging
      if (allRepos.length > 0) {
        console.log('Sample repositories:', allRepos.slice(0, 3).map(repo => ({
          name: repo.full_name,
          private: repo.private,
          permissions: repo.permissions
        })));
      }
    } catch (error) {
      console.error('Error fetching repositories:', error);
    } finally {
      setRepositoriesLoading(false);
    }
  };

  const handleRepositoryDropdownClick = () => {
    // Only fetch repositories when user actually clicks the dropdown
    if (session?.accessToken && !repositoriesLoaded) {
      fetchRepositories();
    }
  };

  const fetchGitHubIssues = async () => {
    if (!session?.accessToken || !selectedRepo) return;
    
    setLoading(true);
    try {
      const githubApi = new GitHubAPI(session.accessToken);
      const [owner, repo] = selectedRepo.split('/');
      const issues = await githubApi.getRepoIssues(owner, repo);
      setGithubIssues(issues);
    } catch (error) {
      console.error('Error fetching GitHub issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const createGitHubIssue = async () => {
    if (!session?.accessToken || !selectedRepo) return null;
    
    try {
      const githubApi = new GitHubAPI(session.accessToken);
      const [owner, repo] = selectedRepo.split('/');
      
      // Create difficulty labels if they don't exist
      await createDifficultyLabels(session.accessToken, owner, repo);
      
      const newIssue = await githubApi.createIssue(owner, repo, {
        title: formData.title,
        body: formData.description,
        labels: [
          `difficulty:${DIFFICULTY_CONFIG[formData.difficulty].label.toLowerCase()}`,
          'bounty',
          'sentinel'
        ]
      });
      
      return newIssue;
    } catch (error) {
      console.error('Error creating GitHub issue:', error);
    }
    return null;
  };

  const analyzeRepository = async () => {
    if (!selectedRepo) {
      alert('Please select a repository first');
      return;
    }

    setIsAnalyzing(true);
    try {
      const repoUrl = `https://github.com/${selectedRepo}`;
      const response = await fetch('http://localhost:5000/api/analyze-repo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repo_url: repoUrl
        }),
      });

      if (response.ok) {
        const result: AnalysisResult = await response.json();
        setAnalysisResult(result);
        setShowSuggestion(true);
      } else {
        console.error('Analysis failed:', response.statusText);
        alert('Analysis failed. Please try again.');
      }
    } catch (error) {
      console.error('Error analyzing repository:', error);
      alert('Error connecting to analysis service. Make sure the service is running on localhost:5000');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const approveAndCreateIssue = async () => {
    if (!session?.accessToken || !selectedRepo || !analysisResult) return;

    setApprovingIssue(true);
    try {
      const githubApi = new GitHubAPI(session.accessToken);
      const [owner, repo] = selectedRepo.split('/');
      
      console.log('Creating issue for:', { owner, repo, selectedRepo });
      console.log('Session user:', session.user);
      console.log('Access token available:', !!session.accessToken);
      
      // Test token scopes
      try {
        const userResponse = await fetch('https://api.github.com/user', {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        });
        
        if (userResponse.ok) {
          const scopes = userResponse.headers.get('X-OAuth-Scopes');
          console.log('Token scopes:', scopes);
          
          if (!scopes?.includes('repo')) {
            console.warn('Token does not have repo scope - cannot create issues');
            throw new Error('❌ Insufficient GitHub permissions.\n\nYour GitHub token does not have the required "repo" scope to create issues.\n\n🔧 To fix this:\n1. Sign out of GitHub in the navbar\n2. Sign back in to get updated permissions\n3. The app will now request the correct permissions\n\nNote: You may need to clear your browser cache or restart the app.');
          }
        }
      } catch (scopeError) {
        console.warn('Could not check token scopes:', scopeError);
      }
      
      // Check if the user has write access to the repository
      try {
        // First, try to get repository info to verify access
        const repoUrl = `https://api.github.com/repos/${owner}/${repo}`;
        console.log('Checking repository access:', repoUrl);
        
        const repoInfo = await fetch(repoUrl, {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        });
        
        console.log('Repository check response:', {
          status: repoInfo.status,
          statusText: repoInfo.statusText,
          ok: repoInfo.ok
        });
        
        if (!repoInfo.ok) {
          const errorData = await repoInfo.json().catch(() => ({}));
          console.error('Repository access error details:', errorData);
          throw new Error(`Repository not found or no access: ${repoInfo.statusText} (${repoInfo.status})`);
        }
        
        const repoData = await repoInfo.json();
        console.log('Repository permissions:', repoData.permissions);
        console.log('Repository info:', {
          name: repoData.name,
          full_name: repoData.full_name,
          private: repoData.private,
          owner: repoData.owner?.login
        });
        
        if (!repoData.permissions?.push) {
          throw new Error(`You don&apos;t have write access to ${selectedRepo}. You can only create issues in repositories you own or have write access to.`);
        }
        
        console.log('✅ Repository access verified - proceeding with issue creation');
      } catch (repoError) {
        console.error('Repository access error:', repoError);
        
        // Provide specific guidance based on the error
        if (repoError instanceof Error && repoError.message.includes('404')) {
          throw new Error(`❌ Repository &quot;${selectedRepo}&quot; not found.\n\nPossible issues:\n• Repository doesn&apos;t exist\n• Repository is private and you don&apos;t have access\n• Repository name has changed\n• You&apos;re not logged in with the correct GitHub account\n\nPlease verify the repository exists and you have access to it.`);
        }
        throw repoError;
      }
      
      // Create difficulty labels if they don't exist (only if we have write access)
      try {
        await createDifficultyLabels(session.accessToken, owner, repo);
      } catch (labelError) {
        console.warn('Could not create labels:', labelError);
        // Continue anyway - labels might already exist
      }
      
      // Map difficulty string to enum (for future use if needed)
      // const difficultyMap: { [key: string]: Difficulty } = {
      //   'Easy': Difficulty.EASY,
      //   'Medium': Difficulty.MEDIUM,
      //   'Hard': Difficulty.HARD
      // };
      // const difficulty = difficultyMap[analysisResult.synthesized_analysis.difficulty] || Difficulty.MEDIUM;
      
      // Create the GitHub issue with AI-suggested content
      const baseLabels = [
        ...(Array.isArray(analysisResult.github_payload.labels) ? analysisResult.github_payload.labels : []),
        `difficulty:${analysisResult.synthesized_analysis.difficulty.toLowerCase()}`,
        'bounty',
        'sentinel',
        'ai-generated'
      ];

      // Remove duplicates and filter valid labels
      const labels = [...new Set(baseLabels)]
        .filter(label => label && typeof label === 'string' && label.trim() && label.length <= 50);

      console.log('Creating issue with labels:', labels);
      console.log('Issue title:', analysisResult.github_payload.title);
      console.log('Issue body length:', analysisResult.github_payload.body?.length || 0);

      const newIssue = await githubApi.createIssue(owner, repo, {
        title: analysisResult.github_payload.title || 'Generated Issue',
        body: analysisResult.github_payload.body || 'This issue was generated by Sentinel.',
        labels: labels
      });

      if (newIssue) {
        // Update the issues list
        setGithubIssues(prev => [newIssue, ...prev]);
        
        // Hide the suggestion
        setShowSuggestion(false);
        setAnalysisResult(null);
        
        alert('Issue created successfully!');
      }
    } catch (error: unknown) {
      console.error('Error creating approved issue:', error);
      const errorMessage = (error as Error).message || 'Failed to create issue. Please try again.';
      alert(errorMessage);
    } finally {
      setApprovingIssue(false);
    }
  };

  const handleCreateBounty = async () => {
    if (!isConnected || !session) return;

    try {
      // Create bounty on blockchain with simplified parameters
      const bountyInWei = parseEther(formData.bountyAmount);
      
      console.log('Creating issue with difficulty:', formData.difficulty);
      console.log('Bounty amount (wei):', bountyInWei.toString());
      
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'createIssue',
        args: [formData.difficulty],
        value: bountyInWei,
      });
      
      console.log('Issue creation transaction submitted successfully');
      
    } catch (error) {
      console.error('Error creating bounty:', error);
      alert('Failed to create bounty. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDifficultyFromLabels = (labels: GitHubIssue['labels']) => {
    const diffLabel = labels.find(label => label.name.startsWith('difficulty:'));
    if (diffLabel?.name.includes('easy')) return Difficulty.EASY;
    if (diffLabel?.name.includes('medium')) return Difficulty.MEDIUM;
    if (diffLabel?.name.includes('hard')) return Difficulty.HARD;
    return Difficulty.EASY;
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black text-green-400 font-mono flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 mx-auto mb-6 bg-green-400/20 animate-pulse rounded border border-green-400"></div>
          <div className="h-8 bg-green-400/20 animate-pulse rounded mb-4 border border-green-400"></div>
          <div className="h-4 bg-green-400/20 animate-pulse rounded mb-6 border border-green-400"></div>
          <div className="h-12 bg-green-400/20 animate-pulse rounded border border-green-400"></div>
        </div>
      </div>
    );
  }

  if (!session || !isConnected) {
    return (
      <div className="min-h-screen bg-black text-green-400 font-mono flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 border border-green-400 bg-gray-900/50">
          <AlertCircle className="w-16 h-16 mx-auto mb-6 text-green-400" />
          <h1 className="text-2xl font-bold text-green-400 mb-4 font-mono uppercase tracking-wider">Authentication Required</h1>
          <p className="text-green-300 mb-6 text-sm">
            Please connect your GitHub account and Polkadot wallet to create and manage issues.
          </p>
          <Button className="bg-green-600 hover:bg-green-700 text-black px-8 py-3 border-2 border-green-400 font-bold font-mono uppercase tracking-wide">
            Connect Accounts
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-black font-upheaval relative"
      style={{
        backgroundImage: "url('/background.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "repeat",
        backgroundAttachment: "scroll"
      }}
    >
      {/* Background overlays */}
      <div className="absolute inset-0 bg-black/30 z-0"></div>
      <div className="absolute inset-0 opacity-40 z-0" 
           style={{
             backgroundImage: `
               linear-gradient(rgba(34, 197, 94, 0.3) 1px, transparent 1px),
               linear-gradient(90deg, rgba(34, 197, 94, 0.3) 1px, transparent 1px)
             `,
             backgroundSize: '40px 40px'
           }}>
      </div>

      {/* Header */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h1 className="text-4xl md:text-6xl font-bold text-green-400 uppercase tracking-wider mb-2">ISSUE MANAGEMENT</h1>
            <p className="text-lg text-green-100 max-w-2xl">
              Create blockchain-backed issues with bounties and manage your repository&apos;s development workflow
            </p>
          </div>
          
          <div className="flex gap-4">
            {/* Repository Selector */}
            <div className="flex flex-col">
              <select 
                value={selectedRepo}
                onChange={(e) => setSelectedRepo(e.target.value)}
                onClick={handleRepositoryDropdownClick}
                onFocus={handleRepositoryDropdownClick}
                className="px-4 py-2 border-2 border-green-400 bg-black/80 text-green-400 font-bold font-upheaval uppercase tracking-wider hover:border-green-300 focus:border-green-300 transition-colors duration-300"
                disabled={repositoriesLoading || (repositories.length === 0 && repositoriesLoaded)}
              >
                <option value="">
                  {repositoriesLoading ? "LOADING REPOSITORIES..." :
                   !repositoriesLoaded ? "CLICK TO LOAD REPOSITORIES..." : 
                   repositories.length === 0 ? "NO REPOSITORIES FOUND" : "SELECT REPOSITORY"}
                </option>
                {repositories.map((repo) => (
                  <option key={repo.id} value={repo.full_name}>
                    {repo.full_name.toUpperCase()}
                  </option>
                ))}
              </select>
              <p className="text-xs text-green-100 mt-1 opacity-75 font-upheaval">
                {repositoriesLoading
                  ? "FETCHING YOUR REPOSITORIES FROM GITHUB..."
                  : !repositoriesLoaded 
                    ? "CLICK DROPDOWN TO LOAD YOUR REPOSITORIES" 
                    : repositories.length === 0 
                      ? "YOU NEED REPOSITORIES WITH WRITE ACCESS TO CREATE ISSUES"
                      : "ONLY SHOWING REPOSITORIES WHERE YOU CAN CREATE ISSUES"
                }
              </p>
            </div>
            
            <Button
              onClick={analyzeRepository}
              disabled={!selectedRepo || isAnalyzing || hasRepoScope === false}
              className="bg-green-400/20 text-green-400 px-6 py-3 border-2 border-green-400 font-bold font-upheaval uppercase tracking-wider hover:bg-green-400 hover:text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Zap className="w-5 h-5 mr-2" />
              )}
              {isAnalyzing ? 'ANALYZING...' : 'AI ANALYZE REPO'}
            </Button>
            
            <Button
              onClick={() => setShowCreateForm(true)}
              disabled={hasRepoScope === false}
              className="bg-green-400 text-black px-6 py-3 border-2 border-green-400 font-bold font-upheaval uppercase tracking-wider hover:bg-green-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5 mr-2" />
              CREATE NEW ISSUE
            </Button>
          </div>
        </div>

        {/* Token Scope Warning */}
        {hasRepoScope === false && (
          <div className="bg-red-500/20 border-2 border-red-400 p-6 mb-8 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold text-red-400 mb-2 font-upheaval uppercase">⚠️ GITHUB PERMISSIONS REQUIRED</h3>
                <p className="text-red-100 mb-4">
                  Your GitHub token doesn&apos;t have the required permissions to create issues. 
                  The app needs &quot;repo&quot; scope to create issues and manage labels.
                </p>
                <div className="bg-black/40 border-2 border-red-400/50 p-4 mb-4 backdrop-blur-sm">
                  <p className="text-red-100 mb-2 font-upheaval"><strong>CURRENT SCOPES:</strong> read:user, user:email</p>
                  <p className="text-red-100 font-upheaval"><strong>REQUIRED SCOPES:</strong> read:user, user:email, repo</p>
                </div>
                <p className="text-red-100 font-upheaval">
                  <strong>TO FIX THIS:</strong> Sign out from GitHub in the navbar above, then sign back in. 
                  The app will request the updated permissions automatically.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* AI Suggestion Section */}
        {showSuggestion && analysisResult && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-upheaval text-green-400 italic">AI SUGGESTED ISSUE</h2>
              <Button
                onClick={() => setShowSuggestion(false)}
                className="bg-black text-green-400 px-4 py-2 border border-green-400 font-mono hover:bg-green-400 hover:text-black transition-all"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Analysis Summary */}
            <div className="bg-black/80 border border-green-400 p-6 mb-6 backdrop-blur-sm">
              <h3 className="text-xl font-upheaval text-green-400 mb-2">AI ANALYSIS REPORT</h3>
              <p className="text-green-300 mb-4 font-mono text-sm">{analysisResult.synthesized_analysis.body}</p>
              <div className="flex flex-wrap gap-4 text-sm font-mono text-green-300">
                <span><strong className="text-green-400">Repository:</strong> {analysisResult.repository}</span>
                <span><strong className="text-green-400">Method:</strong> {analysisResult.analysis_method}</span>
                <span><strong className="text-green-400">Agents Used:</strong> {analysisResult.agents_used}/{analysisResult.agents_discovered}</span>
              </div>
            </div>

            {/* Suggested Issue Card */}
            <div className="bg-black/80 border border-green-400 p-6 backdrop-blur-sm hover:border-green-300 transition-all">
              {/* Issue Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex flex-wrap gap-2">
                  <div className={`${
                    analysisResult.synthesized_analysis.difficulty === 'Easy' ? 'bg-green-600' :
                    analysisResult.synthesized_analysis.difficulty === 'Medium' ? 'bg-yellow-600' :
                    'bg-red-600'
                  } border border-green-400 px-2 py-1`}>
                    <span className="text-sm font-mono text-black">{analysisResult.synthesized_analysis.difficulty}</span>
                  </div>
                  <div className={`${
                    analysisResult.synthesized_analysis.priority === 'Low' ? 'bg-green-600' :
                    analysisResult.synthesized_analysis.priority === 'Medium' ? 'bg-yellow-600' :
                    'bg-red-600'
                  } border border-green-400 px-2 py-1`}>
                    <span className="text-sm font-mono text-black">{analysisResult.synthesized_analysis.priority}</span>
                  </div>
                </div>
              </div>
              
              {/* Issue Title */}
              <h3 className="text-xl font-upheaval text-green-400 mb-4">
                {analysisResult.github_payload.title}
              </h3>
              
              {/* Issue Description */}
              <div className="text-green-300 mb-4 font-mono text-sm">
                <p>{analysisResult.synthesized_analysis.body}</p>
              </div>
              
              {/* Technical Requirements */}
              {analysisResult.synthesized_analysis.technical_requirements.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-lg font-upheaval text-green-400 mb-2">TECHNICAL REQUIREMENTS:</h4>
                  <ul className="list-disc list-inside text-sm text-green-300 space-y-1 font-mono">
                    {analysisResult.synthesized_analysis.technical_requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Acceptance Criteria */}
              {analysisResult.synthesized_analysis.acceptance_criteria.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-upheaval text-green-400 mb-2">ACCEPTANCE CRITERIA:</h4>
                  <ul className="list-disc list-inside text-sm text-green-300 space-y-1 font-mono">
                    {analysisResult.synthesized_analysis.acceptance_criteria.map((criteria, index) => (
                      <li key={index}>{criteria}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Issue Details */}
              <div className="flex flex-wrap gap-4 mb-6 text-sm font-mono text-green-300">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-400" />
                  <span>{analysisResult.synthesized_analysis.implementation_estimate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-green-400" />
                  <span>{analysisResult.synthesized_analysis.labels.join(', ')}</span>
                </div>
              </div>
              
              {/* Approve Button */}
              <Button
                onClick={approveAndCreateIssue}
                disabled={approvingIssue}
                className="w-full bg-green-600 text-black px-6 py-3 border border-green-400 font-upheaval hover:bg-green-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {approvingIssue ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    CREATING ISSUE...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    APPROVE & CREATE GITHUB ISSUE
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Issues Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-green-400" />
            <span className="ml-2 font-mono text-green-300">Loading issues...</span>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {githubIssues.map((issue) => {
              const difficulty = getDifficultyFromLabels(issue.labels);
              const config = DIFFICULTY_CONFIG[difficulty];
              
              return (
                <div
                  key={issue.id}
                  className="bg-black/80 border border-green-400 p-6 backdrop-blur-sm hover:border-green-300 transition-all"
                >
                  {/* Issue Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-5 h-5 text-green-400" />
                      <span className="font-mono text-green-400">#{issue.number}</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="bg-green-600 border border-green-400 px-2 py-1">
                        <span className="text-sm font-mono text-black">{config.label}</span>
                      </div>
                      {issue.state === 'open' && (
                        <div className="bg-green-500 border border-green-400 px-2 py-1">
                          <span className="text-sm font-mono text-black">OPEN</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Issue Title */}
                  <h3 className="text-lg font-upheaval text-green-400 mb-3 line-clamp-2">
                    {issue.title}
                  </h3>
                  
                  {/* Issue Description */}
                  <p className="text-sm font-mono text-green-300 mb-4 line-clamp-3">
                    {issue.body || "No description provided"}
                  </p>
                  
                  {/* Labels */}
                  {issue.labels.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {issue.labels.slice(0, 3).map((label) => (
                        <div
                          key={label.name}
                          className="bg-black border border-green-400 px-2 py-1"
                          style={{ backgroundColor: `#${label.color}20`, borderColor: `#${label.color}` }}
                        >
                          <span className="text-xs font-mono text-green-300">{label.name}</span>
                        </div>
                      ))}
                      {issue.labels.length > 3 && (
                        <div className="bg-black border border-green-400 px-2 py-1">
                          <span className="text-xs font-mono text-green-300">+{issue.labels.length - 3} more</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Issue Meta */}
                  <div className="flex items-center justify-between text-green-300 mb-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-mono">{issue.user.login}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-mono">{formatDate(issue.created_at)}</span>
                    </div>
                  </div>
                  
                  {/* Bounty Info */}
                  <div className="bg-green-400/10 border border-green-400 p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-mono text-green-400 font-bold">STAKED AMOUNT BY MAINTAINER</span>
                      </div>
                      <span className="text-sm font-mono text-green-400 font-bold">0.0 DEV</span>
                    </div>
                    <p className="text-xs font-mono text-green-300 mt-1">No active bounty - Click &quot;Add Bounty&quot; to stake DEV</p>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-black text-green-400 px-4 py-2 border border-green-400 font-mono text-sm hover:bg-green-400 hover:text-black transition-all"
                      onClick={() => window.open(issue.html_url, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      VIEW ON GITHUB
                    </Button>
                    <Button
                      className="bg-green-600 text-black px-4 py-2 border border-green-400 font-mono text-sm hover:bg-green-400 transition-all"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          githubUrl: issue.html_url,
                          title: issue.title,
                          description: issue.body || ""
                        }));
                        setShowCreateForm(true);
                      }}
                    >
                      <DollarSign className="w-4 h-4 mr-1" />
                      ADD BOUNTY
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && githubIssues.length === 0 && (
          <div className="text-center py-20">
            <GitBranch className="w-16 h-16 mx-auto mb-6 text-green-400 opacity-50" />
            <h3 className="text-3xl font-upheaval text-green-400 mb-4">NO ISSUES FOUND</h3>
            <p className="font-mono text-green-300 mb-6">
              {selectedRepo ? "This repository has no open issues." : "Select a repository to view issues."}
            </p>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-green-600 text-black px-6 py-3 border border-green-400 font-upheaval hover:bg-green-400 transition-all"
            >
              CREATE YOUR FIRST ISSUE
            </Button>
          </div>
        )}
      </div>

      {/* Create Bounty Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
          <div className="bg-black border border-green-400 max-w-2xl w-full max-h-[90vh] overflow-y-auto backdrop-blur-sm">
            {/* Modal Header */}
            <div className="bg-green-400/20 border-b border-green-400 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-upheaval text-green-400 italic">CREATE BOUNTY FOR ISSUE</h2>
              <Button
                onClick={() => setShowCreateForm(false)}
                className="bg-black text-green-400 p-2 border border-green-400 hover:bg-green-400 hover:text-black transition-all"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Issue Title */}
              <div>
                <label className="text-sm font-mono text-green-400 mb-2 block">ISSUE TITLE *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border border-green-400 bg-black text-green-300 font-mono focus:border-green-300 focus:outline-none"
                  placeholder="Brief description of the issue"
                />
              </div>
              
              {/* Issue Description */}
              <div>
                <label className="text-sm font-mono text-green-400 mb-2 block">DESCRIPTION *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 border border-green-400 bg-black text-green-300 font-mono resize-none focus:border-green-300 focus:outline-none"
                  placeholder="Detailed description of the issue, requirements, and acceptance criteria"
                />
              </div>
              
              {/* Difficulty Selection */}
              <div>
                <label className="text-sm font-mono text-green-400 mb-2 block">DIFFICULTY LEVEL</label>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(DIFFICULTY_CONFIG).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setFormData(prev => ({ ...prev, difficulty: Number(key) as Difficulty }))}
                      className={`bg-black border ${
                        formData.difficulty === Number(key) ? 'border-green-300' : 'border-green-400'
                      } p-4 text-left transition-all hover:border-green-300`}
                    >
                      <div className="text-lg font-upheaval text-green-400 mb-1">{config.label}</div>
                      <div className="text-sm font-mono text-green-300 mb-2">{config.description}</div>
                      <div className="flex items-center gap-1 text-green-300">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-mono">{config.duration} days</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Bounty Amount */}
              <div>
                <label className="text-sm font-mono text-green-400 mb-2 block">BOUNTY AMOUNT (DEV) *</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.001"
                    min="0.01"
                    value={formData.bountyAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, bountyAmount: e.target.value }))}
                    className="w-full px-4 py-3 border border-green-400 bg-black text-green-300 font-mono pr-16 focus:border-green-300 focus:outline-none"
                    placeholder="0.100"
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <span className="text-sm font-mono text-green-400">DEV</span>
                  </div>
                </div>
                <p className="text-sm font-mono text-green-300 mt-1">
                  Minimum: 0.01 DEV (≈ $0.50)
                </p>
              </div>
              
              {/* Completion Percentage */}
              <div>
                <label className="text-sm font-mono text-green-400 mb-2 block">MINIMUM COMPLETION FOR STAKE RETURN (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.minimumCompletionPercentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, minimumCompletionPercentage: Number(e.target.value) }))}
                  className="w-full px-4 py-3 border border-green-400 bg-black text-green-300 font-mono focus:border-green-300 focus:outline-none"
                  placeholder="80"
                />
                <p className="text-sm font-mono text-green-300 mt-1">
                  Contributors need to complete at least this percentage to avoid stake forfeiture
                </p>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="bg-green-400/10 border-t border-green-400 p-6 flex gap-4">
              <Button
                onClick={() => setShowCreateForm(false)}
                className="flex-1 bg-black text-green-400 px-6 py-3 border border-green-400 font-mono hover:bg-green-400 hover:text-black transition-all"
              >
                CANCEL
              </Button>
              <Button
                onClick={handleCreateBounty}
                disabled={!formData.title || !formData.description || isContractLoading || isTransactionLoading || pendingGitHubIssue !== null}
                className="flex-1 bg-green-600 text-black px-6 py-3 border border-green-400 font-mono hover:bg-green-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isContractLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {formData.githubUrl ? 'CREATING BOUNTY...' : 'CREATING ISSUE & BOUNTY...'}
                  </>
                ) : isTransactionLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    CONFIRMING BLOCKCHAIN TRANSACTION...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    CREATE BOUNTY ({formData.bountyAmount} DEV)
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}