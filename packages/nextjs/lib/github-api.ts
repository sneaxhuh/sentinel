// GitHub API utilities for issue management
import { Session } from "next-auth";

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  description: string;
  private: boolean;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  default_branch: string;
  open_issues_count: number;
  stargazers_count: number;
  forks_count: number;
  language: string;
  updated_at: string;
  created_at: string;
  permissions?: {
    admin: boolean;
    maintain: boolean;
    push: boolean;
    triage: boolean;
    pull: boolean;
  };
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  labels: Array<{
    id: number;
    name: string;
    color: string;
    description: string;
  }>;
  user: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  assignee?: {
    login: string;
    avatar_url: string;
  };
  assignees: Array<{
    login: string;
    avatar_url: string;
  }>;
  milestone?: {
    title: string;
    number: number;
    state: string;
  };
  comments: number;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  html_url: string;
  pull_request?: object; // Present if this is a PR
}

export interface CreateIssueParams {
  title: string;
  body: string;
  labels?: string[];
  assignees?: string[];
  milestone?: number;
}

export class GitHubAPI {
  constructor(private accessToken: string) {}

  // Get authenticated user's repositories
  async getUserRepos(options: {
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
    direction?: 'asc' | 'desc';
    per_page?: number;
    type?: 'all' | 'owner' | 'member';
  } = {}): Promise<GitHubRepo[]> {
    // Fetch owned repositories
    const ownedParams = new URLSearchParams({
      sort: options.sort || 'updated',
      direction: options.direction || 'desc',
      per_page: String(options.per_page || 50),
      type: 'owner'
    });

    const ownedResponse = await fetch(`https://api.github.com/user/repos?${ownedParams}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!ownedResponse.ok) {
      throw new Error(`Failed to fetch repositories: ${ownedResponse.statusText}`);
    }

    const ownedRepos = await ownedResponse.json();

    // Fetch repositories where user is a collaborator with push access
    const collabParams = new URLSearchParams({
      sort: options.sort || 'updated',
      direction: options.direction || 'desc',
      per_page: String(options.per_page || 50),
      type: 'member'
    });

    try {
      const collabResponse = await fetch(`https://api.github.com/user/repos?${collabParams}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (collabResponse.ok) {
        const collabRepos = await collabResponse.json();
        // Filter for repositories with push access
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const writableCollabRepos = collabRepos.filter((repo: any) => 
          repo.permissions && repo.permissions.push
        );
        
        // Combine and deduplicate
        const allRepos = [...ownedRepos, ...writableCollabRepos];
        const uniqueRepos = allRepos.filter((repo, index, self) => 
          index === self.findIndex(r => r.id === repo.id)
        );
        
        return uniqueRepos;
      }
    } catch (error) {
      console.warn('Could not fetch collaborator repositories:', error);
    }

    // Return only owned repositories if collaborator fetch fails
    return ownedRepos;
  }

  // Get issues for a specific repository
  async getRepoIssues(owner: string, repo: string, options: {
    state?: 'open' | 'closed' | 'all';
    labels?: string;
    sort?: 'created' | 'updated' | 'comments';
    direction?: 'asc' | 'desc';
    since?: string;
    per_page?: number;
    page?: number;
  } = {}): Promise<GitHubIssue[]> {
    const params = new URLSearchParams({
      state: options.state || 'open',
      sort: options.sort || 'updated',
      direction: options.direction || 'desc',
      per_page: String(options.per_page || 50),
      page: String(options.page || 1)
    });

    if (options.labels) params.append('labels', options.labels);
    if (options.since) params.append('since', options.since);

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues?${params}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch issues: ${response.statusText}`);
    }

    const issues = await response.json();
    // Filter out pull requests (GitHub API includes PRs in issues endpoint)
    return issues.filter((issue: GitHubIssue) => !issue.pull_request);
  }

  // Create a new issue
  async createIssue(owner: string, repo: string, issueData: CreateIssueParams): Promise<GitHubIssue> {
    // Validate and clean the issue data
    const cleanedIssueData = {
      title: (issueData.title || '').trim(),
      body: (issueData.body || '').trim(),
      labels: Array.isArray(issueData.labels) ? 
        [...new Set(issueData.labels)] // Remove duplicates
          .filter(label => label && typeof label === 'string' && label.trim())
          .map(label => label.trim())
          .filter(label => label.length <= 50) // GitHub label length limit
        : [],
      assignees: Array.isArray(issueData.assignees) ? issueData.assignees.filter(assignee => assignee && typeof assignee === 'string' && assignee.trim()) : undefined,
      milestone: issueData.milestone || undefined
    };

    // Remove undefined fields
    Object.keys(cleanedIssueData).forEach(key => {
      if (cleanedIssueData[key as keyof typeof cleanedIssueData] === undefined) {
        delete cleanedIssueData[key as keyof typeof cleanedIssueData];
      }
    });

    // Basic validation
    if (!cleanedIssueData.title) {
      throw new Error('Issue title is required and cannot be empty');
    }

    if (!cleanedIssueData.body) {
      throw new Error('Issue description is required and cannot be empty');
    }

    console.log('Creating issue with data:', {
      title: cleanedIssueData.title,
      bodyLength: cleanedIssueData.body.length,
      labels: cleanedIssueData.labels,
      assignees: cleanedIssueData.assignees
    });

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cleanedIssueData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('GitHub API Error:', {
        status: response.status,
        statusText: response.statusText,
        error,
        url: `https://api.github.com/repos/${owner}/${repo}/issues`,
        requestBody: cleanedIssueData
      });
      
      if (response.status === 404) {
        throw new Error(`Repository ${owner}/${repo} not found or you don't have access to create issues. Make sure the repository exists and you have write permissions.`);
      } else if (response.status === 403) {
        throw new Error(`Permission denied. You don't have write access to ${owner}/${repo} or your token doesn't have the required permissions.`);
      } else if (response.status === 422) {
        console.log('Detailed validation error:', error);
        let validationErrors = 'Validation failed';
        
        if (error.errors && Array.isArray(error.errors)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          validationErrors = error.errors.map((e: any) => {
            if (e.field && e.message) {
              return `${e.field}: ${e.message}`;
            } else if (e.message) {
              return e.message;
            } else {
              return JSON.stringify(e);
            }
          }).join(', ');
        } else if (error.message) {
          validationErrors = error.message;
        }
        
        throw new Error(`Issue creation failed: ${validationErrors}`);
      } else {
        throw new Error(`Failed to create issue: ${error.message || response.statusText} (${response.status})`);
      }
    }

    return response.json();
  }

  // Get a specific issue
  async getIssue(owner: string, repo: string, issueNumber: number): Promise<GitHubIssue> {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch issue: ${response.statusText}`);
    }

    return response.json();
  }

  // Update an existing issue
  async updateIssue(owner: string, repo: string, issueNumber: number, updates: Partial<CreateIssueParams>): Promise<GitHubIssue> {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to update issue: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  // Add labels to an issue
  async addLabelsToIssue(owner: string, repo: string, issueNumber: number, labels: string[]): Promise<void> {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/labels`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(labels),
    });

    if (!response.ok) {
      throw new Error(`Failed to add labels: ${response.statusText}`);
    }
  }

  // Get repository labels
  async getRepoLabels(owner: string, repo: string): Promise<Array<{name: string, color: string, description: string}>> {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/labels`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch labels: ${response.statusText}`);
    }

    return response.json();
  }

  // Search issues across repositories
  async searchIssues(query: string, options: {
    sort?: 'comments' | 'reactions' | 'reactions-+1' | 'reactions--1' | 'reactions-smile' | 'reactions-thinking_face' | 'reactions-heart' | 'reactions-tada' | 'interactions' | 'created' | 'updated';
    order?: 'desc' | 'asc';
    per_page?: number;
    page?: number;
  } = {}): Promise<{total_count: number, items: GitHubIssue[]}> {
    const params = new URLSearchParams({
      q: query,
      sort: options.sort || 'updated',
      order: options.order || 'desc',
      per_page: String(options.per_page || 30),
      page: String(options.page || 1)
    });

    const response = await fetch(`https://api.github.com/search/issues?${params}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to search issues: ${response.statusText}`);
    }

    return response.json();
  }
}

// Utility functions for working with GitHub data
export const getDifficultyFromLabels = (labels: GitHubIssue['labels']) => {
  const diffLabel = labels.find(label => label.name.toLowerCase().includes('difficulty'));
  if (!diffLabel) return 0; // Default to EASY
  
  const labelName = diffLabel.name.toLowerCase();
  if (labelName.includes('easy')) return 0;
  if (labelName.includes('medium')) return 1;
  if (labelName.includes('hard')) return 2;
  return 0;
};

export const formatGitHubDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getRepoFromUrl = (url: string): {owner: string, repo: string} | null => {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (match) {
    return { owner: match[1], repo: match[2] };
  }
  return null;
};

export const createDifficultyLabels = async (accessToken: string, owner: string, repo: string) => {
  const difficultyLabels = [
    { name: 'difficulty:easy', color: '56DF7C', description: 'Simple bug fixes, documentation updates' },
    { name: 'difficulty:medium', color: '7CC0FF', description: 'Feature implementations, moderate complexity' },
    { name: 'difficulty:hard', color: 'FF9A51', description: 'Complex features, architectural changes' },
    { name: 'bounty', color: 'FCFF52', description: 'Issue has blockchain bounty attached' },
    { name: 'sentinel', color: 'B490FF', description: 'Managed by Sentinel platform' }
  ];

  // First, check which labels already exist
  try {
    const existingLabelsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/labels`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    const existingLabels = existingLabelsResponse.ok ? await existingLabelsResponse.json() : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingLabelNames = new Set(existingLabels.map((label: any) => label.name));

    // Only create labels that don't exist
    const labelsToCreate = difficultyLabels.filter(label => !existingLabelNames.has(label.name));

    if (labelsToCreate.length === 0) {
      console.log('All required labels already exist');
      return;
    }

    for (const label of labelsToCreate) {
      try {
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/labels`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(label),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (response.status === 422) {
            console.log(`Label ${label.name} already exists (race condition)`);
          } else if (response.status === 404) {
            console.warn(`Repository ${owner}/${repo} not found or no access for label creation`);
          } else {
            console.warn(`Failed to create label ${label.name}:`, response.status, errorData.message || response.statusText);
          }
        } else {
          console.log(`Successfully created label: ${label.name}`);
        }
      } catch (error) {
        console.warn(`Error creating label ${label.name}:`, error);
      }
    }
  } catch (error) {
    console.warn('Error checking existing labels:', error);
    // Fallback to original behavior if we can't check existing labels
    for (const label of difficultyLabels) {
      try {
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/labels`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(label),
        });

        if (!response.ok && response.status !== 422) {
          const errorData = await response.json().catch(() => ({}));
          console.warn(`Failed to create label ${label.name}:`, response.status, errorData.message || response.statusText);
        }
      } catch (labelError) {
        console.warn(`Error creating label ${label.name}:`, labelError);
      }
    }
  }
};