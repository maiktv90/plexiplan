import { githubApiUrl } from '../config/github.config';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface BranchArgs {
  taskId: string;
  clientRegistrationId: string;
}

interface FeatureBranchArgs {
  taskId: string;
  body: FeatureBranchBody;
  csrf: string;
}

interface FeatureBranchBody {
  repo: string;
  branchName: string;
  org: string;
  taskSource: string;
}

interface RepoBranchesArgs {
  repoName: string;
}

// Fetch functions
const fetchRepos = () => fetch(`${githubApiUrl}/repo`).then(res => res.json());

const fetchPullRequests = () => fetch(`${githubApiUrl}/pr`).then(res => res.json());

const fetchBranchForTask = ({ taskId, clientRegistrationId }: BranchArgs) =>
  fetch(`${githubApiUrl}/branch/task/${taskId}?source=${clientRegistrationId}`).then(res => res.json());

const fetchBranchesForRepo = ({ repoName }: RepoBranchesArgs) =>
  fetch(`${githubApiUrl}/repo/${repoName}/branches`).then(res => res.json());

const createFeatureBranch = ({ taskId, body, csrf }: FeatureBranchArgs) =>
  fetch(`${githubApiUrl}/branch/task/${taskId}`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-XSRF-TOKEN': csrf 
    },
    body: JSON.stringify(body),
  }).then(res => res.json());

const linkExistingBranch = ({ taskId, body, csrf }: FeatureBranchArgs) =>
  fetch(`${githubApiUrl}/branch/${body.branchName}/task/${taskId}`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-XSRF-TOKEN': csrf 
    },
    body: JSON.stringify(body),
  }).then(res => res.json());

// React Query hooks
export const useGetReposQuery = () => useQuery({
  queryKey: ['repos'],
  queryFn: fetchRepos
});

export const useGetPullRequestsQuery = () => useQuery({
  queryKey: ['pullRequests'],
  queryFn: fetchPullRequests
});

export const useGetBranchForTaskQuery = (args: BranchArgs, enabled = true) =>
  useQuery({
    queryKey: ['branchForTask', args.taskId, args.clientRegistrationId],
    queryFn: () => fetchBranchForTask(args),
    enabled
  });

export const useLazyGetBranchesForRepoQuery = () => {
  const queryClient = useQueryClient();
  return (args: RepoBranchesArgs) => 
    queryClient.fetchQuery({
      queryKey: ['repoBranches', args.repoName],
      queryFn: () => fetchBranchesForRepo(args)
    });
};

export const useCreateFeatureBranchForTaskMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFeatureBranch,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['branchForTask', variables.taskId] });
    },
  });
};

export const useLinkExistingFeatureBranchMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: linkExistingBranch,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['branchForTask', variables.taskId] });
    },
  });
};

export const invalidateRepoApiCache = () => {
  // This function can be implemented with useQueryClient if needed
  console.warn('invalidateRepoApiCache needs to be called within a React component with useQueryClient');
};
