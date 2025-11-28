# Implementation Plan: Jira, GitHub, and Bitbucket Providers

## Overview

This plan outlines the implementation of three new tool providers for the plexify-planner-v2 frontend. Each provider follows the existing architecture established by the Trello integration.

---

## Current Architecture Summary

### Provider Interface (`IToolProvider`)
All providers must implement:
- `meta: ToolProviderMeta` - Provider metadata and capabilities
- `isConnected(): Promise<boolean>` - Check connection status
- `getBoards(): Promise<ProviderResult<UnifiedBoard[]>>` - Fetch boards/projects
- `getTasks(filter?): Promise<ProviderResult<UnifiedTask[]>>` - Fetch user's tasks
- `getTask(taskId): Promise<ProviderResult<UnifiedTask>>` - Fetch single task
- `getTasksForBoard(boardId): Promise<ProviderResult<UnifiedTask[]>>` - Fetch board tasks

### Backend API Pattern
Backend endpoints follow: `/planner/api/v1/{tool}/{resource}`
- Example: `/planner/api/v1/trello/boards`, `/planner/api/v1/trello/tasks`

### Type Normalization
All tools map to unified types:
- `TaskSource`: `'trello' | 'jira' | 'github' | 'azure-devops'`
- `TaskStatus`: `'todo' | 'in_progress' | 'done' | 'blocked'`
- `TaskPriority`: `'low' | 'medium' | 'high' | 'critical'`

---

## 1. Jira Provider Implementation

### 1.1 Create Directory Structure
```
src/providers/tools/jira/
├── index.ts
├── JiraService.ts
├── JiraProvider.ts
└── types.ts (optional, for Jira-specific types)
```

### 1.2 JiraService.ts - API Wrapper

**Backend Endpoints (assumed):**
- `GET /planner/api/v1/jira/projects` - List user's projects
- `GET /planner/api/v1/jira/issues` - List issues assigned to user
- `GET /planner/api/v1/jira/issues/:issueKey` - Get single issue

**Jira-Specific Types:**
```typescript
interface JiraProject {
  id: string;
  key: string;
  name: string;
  description?: string;
  avatarUrls?: { [size: string]: string };
  projectTypeKey?: string;
}

interface JiraIssue {
  id: string;
  key: string;              // e.g., "PROJ-123"
  self: string;             // API URL
  fields: {
    summary: string;
    description?: string;
    status: { name: string; statusCategory: { key: string } };
    priority?: { name: string; id: string };
    duedate?: string;
    created?: string;
    updated?: string;
    project: { id: string; key: string; name: string };
    labels?: string[];
    assignee?: { displayName: string; emailAddress: string };
    subtasks?: JiraIssue[];
    progress?: { percent?: number };
  };
}
```

### 1.3 JiraProvider.ts - Provider Implementation

**Status Mapping Strategy:**
```typescript
// Jira statusCategory.key → TaskStatus
'new' | 'undefined' → 'todo'
'indeterminate' → 'in_progress'
'done' → 'done'
// Additional heuristics for 'blocked' based on status name
```

**Priority Mapping:**
```typescript
// Jira priority.name → TaskPriority
'Highest' | 'Blocker' → 'critical'
'High' → 'high'
'Medium' → 'medium'
'Low' | 'Lowest' → 'low'
```

**Capabilities:**
```typescript
const JIRA_CAPABILITIES: ToolCapabilities = {
  canFetchTasks: true,
  canFetchBoards: true,
  canCreateTask: false,   // Phase 2
  canUpdateTask: false,   // Phase 2
  canDeleteTask: false,   // Phase 2
  canAssignTask: false,   // Phase 2
  supportsChecklists: true,  // Via subtasks
  supportsLabels: true,
  supportsDueDate: true,
  supportsPriority: true,
};
```

### 1.4 Task Mapping Function
```typescript
function mapJiraIssueToTask(issue: JiraIssue): UnifiedTask {
  return {
    id: `jira-${issue.id}`,
    source: 'jira',
    sourceId: issue.id,
    title: issue.fields.summary,
    description: issue.fields.description,
    status: mapJiraStatus(issue.fields.status),
    priority: mapJiraPriority(issue.fields.priority),
    dueDate: issue.fields.duedate,
    url: `https://your-domain.atlassian.net/browse/${issue.key}`,
    boardId: issue.fields.project.id,
    boardName: issue.fields.project.name,
    labels: issue.fields.labels?.map(l => ({ id: l, name: l })),
    percentComplete: issue.fields.progress?.percent,
    checklistTotal: issue.fields.subtasks?.length,
    checklistCompleted: issue.fields.subtasks?.filter(s =>
      s.fields.status.statusCategory.key === 'done'
    ).length,
    createdAt: issue.fields.created,
    updatedAt: issue.fields.updated,
  };
}
```

---

## 2. GitHub Provider Implementation

### 2.1 Create Directory Structure
```
src/providers/tools/github/
├── index.ts
├── GitHubService.ts
├── GitHubProvider.ts
└── types.ts
```

### 2.2 GitHubService.ts - API Wrapper

**Backend Endpoints (assumed):**
- `GET /planner/api/v1/github/repos` - List user's repositories
- `GET /planner/api/v1/github/issues` - List issues assigned to user
- `GET /planner/api/v1/github/issues/:owner/:repo/:issueNumber` - Get single issue
- `GET /planner/api/v1/github/pulls` - List PRs assigned to user (for code review tasks)

**GitHub-Specific Types:**
```typescript
interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description?: string;
  html_url: string;
  private: boolean;
  owner: { login: string; avatar_url: string };
}

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body?: string;
  state: 'open' | 'closed';
  html_url: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  labels: GitHubLabel[];
  milestone?: { title: string; due_on?: string };
  assignees?: { login: string }[];
  repository?: { id: number; name: string; full_name: string };
  pull_request?: object;  // Present if issue is a PR
}

interface GitHubLabel {
  id: number;
  name: string;
  color: string;
  description?: string;
}
```

### 2.3 GitHubProvider.ts - Provider Implementation

**Status Mapping Strategy:**
```typescript
// GitHub state + labels → TaskStatus
'closed' → 'done'
'open' + label 'blocked' | 'waiting' → 'blocked'
'open' + label 'in progress' | 'wip' → 'in_progress'
'open' → 'todo'
```

**Priority Mapping (from labels):**
```typescript
// GitHub labels → TaskPriority
label 'priority: critical' | 'P0' → 'critical'
label 'priority: high' | 'P1' → 'high'
label 'priority: medium' | 'P2' → 'medium'
label 'priority: low' | 'P3' → 'low'
```

**Capabilities:**
```typescript
const GITHUB_CAPABILITIES: ToolCapabilities = {
  canFetchTasks: true,
  canFetchBoards: true,   // Repos as boards
  canCreateTask: false,   // Phase 2
  canUpdateTask: false,   // Phase 2
  canDeleteTask: false,   // Phase 2
  canAssignTask: false,   // Phase 2
  supportsChecklists: false,  // GitHub uses task lists in markdown
  supportsLabels: true,
  supportsDueDate: true,  // Via milestones
  supportsPriority: false, // Uses labels
};
```

### 2.4 Task Mapping Function
```typescript
function mapGitHubIssueToTask(issue: GitHubIssue): UnifiedTask {
  return {
    id: `github-${issue.id}`,
    source: 'github',
    sourceId: issue.id.toString(),
    title: issue.title,
    description: issue.body,
    status: mapGitHubStatus(issue),
    priority: inferPriorityFromLabels(issue.labels),
    dueDate: issue.milestone?.due_on,
    url: issue.html_url,
    boardId: issue.repository?.id.toString(),
    boardName: issue.repository?.full_name,
    labels: issue.labels.map(l => ({
      id: l.id.toString(),
      name: l.name,
      color: `#${l.color}`,
    })),
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
  };
}
```

### 2.5 Pull Requests as Tasks (Optional Enhancement)
Consider mapping open PRs assigned for review as tasks with:
- `status: 'in_progress'` or custom status
- `listName: 'Code Review'`
- Track review state (pending, approved, changes requested)

---

## 3. Bitbucket Provider Implementation

### 3.1 Create Directory Structure
```
src/providers/tools/bitbucket/
├── index.ts
├── BitbucketService.ts
├── BitbucketProvider.ts
└── types.ts
```

### 3.2 BitbucketService.ts - API Wrapper

**Backend Endpoints (assumed):**
- `GET /planner/api/v1/bitbucket/repositories` - List user's repos
- `GET /planner/api/v1/bitbucket/issues` - List issues (if enabled on repos)
- `GET /planner/api/v1/bitbucket/pullrequests` - List PRs assigned to user

**Bitbucket-Specific Types:**
```typescript
interface BitbucketRepo {
  uuid: string;
  name: string;
  full_name: string;
  description?: string;
  links: { html: { href: string } };
  is_private: boolean;
  owner: { display_name: string; uuid: string };
  project?: { key: string; name: string };
}

interface BitbucketPullRequest {
  id: number;
  title: string;
  description?: string;
  state: 'OPEN' | 'MERGED' | 'DECLINED' | 'SUPERSEDED';
  links: { html: { href: string } };
  created_on: string;
  updated_on: string;
  author: { display_name: string };
  destination: { repository: { full_name: string } };
  reviewers?: { display_name: string; approved: boolean }[];
}

// Note: Bitbucket Cloud issues are less common;
// most teams use Jira. Consider focusing on PRs.
```

### 3.3 BitbucketProvider.ts - Provider Implementation

**Focus on Pull Requests:**
Since Bitbucket is primarily used with Jira for issue tracking, this provider should focus on:
1. Repositories as boards
2. Pull Requests as tasks (code review work)
3. Optionally: Bitbucket Issues (if enabled on repos)

**Status Mapping for PRs:**
```typescript
'OPEN' → 'in_progress'
'MERGED' → 'done'
'DECLINED' | 'SUPERSEDED' → 'done' (or filter out)
```

**Capabilities:**
```typescript
const BITBUCKET_CAPABILITIES: ToolCapabilities = {
  canFetchTasks: true,    // PRs as tasks
  canFetchBoards: true,   // Repos as boards
  canCreateTask: false,
  canUpdateTask: false,
  canDeleteTask: false,
  canAssignTask: false,
  supportsChecklists: false,
  supportsLabels: false,  // Bitbucket uses reviewers instead
  supportsDueDate: false,
  supportsPriority: false,
};
```

---

## 4. Update TaskSource Type

**File:** `src/types/task.types.ts`

```typescript
// Current:
export type TaskSource = 'trello' | 'jira' | 'github' | 'azure-devops';

// Add 'bitbucket' if not already included:
export type TaskSource = 'trello' | 'jira' | 'github' | 'bitbucket' | 'azure-devops';
```

---

## 5. Register Providers

**File:** `src/providers/tools/index.ts`

```typescript
import { ToolProviderRegistry } from './ToolProviderRegistry';
import { trelloProvider } from './trello';
import { jiraProvider } from './jira';
import { githubProvider } from './github';
import { bitbucketProvider } from './bitbucket';

export function initializeToolProviders(): void {
  ToolProviderRegistry.register(trelloProvider);
  ToolProviderRegistry.register(jiraProvider);
  ToolProviderRegistry.register(githubProvider);
  ToolProviderRegistry.register(bitbucketProvider);
}
```

---

## 6. Update Helper Functions

**File:** `src/api/hooks/useUnifiedTasks.ts`

Add icons and colors for new sources:

```typescript
export function getTaskSourceIcon(source: TaskSource): string {
  const icons: Record<TaskSource, string> = {
    trello: 'trello',
    jira: 'jira',
    github: 'github',
    bitbucket: 'bitbucket',
    'azure-devops': 'azure',
  };
  return icons[source] || 'task';
}

export function getTaskSourceColor(source: TaskSource): string {
  const colors: Record<TaskSource, string> = {
    trello: '#0079BF',
    jira: '#0052CC',
    github: '#24292F',
    bitbucket: '#0052CC',
    'azure-devops': '#0078D4',
  };
  return colors[source] || '#6B7280';
}
```

---

## 7. Implementation Order

### Phase 1: Core Read-Only Integration
1. **Jira Provider** (highest priority - most common project management tool)
   - JiraService.ts
   - JiraProvider.ts with status/priority mapping
   - Register in ToolProviderRegistry

2. **GitHub Provider**
   - GitHubService.ts
   - GitHubProvider.ts with label-based status inference
   - Register in ToolProviderRegistry

3. **Bitbucket Provider**
   - BitbucketService.ts
   - BitbucketProvider.ts (PR-focused)
   - Register in ToolProviderRegistry

### Phase 2: Enhanced Features (Future)
- Create/Update/Delete task mutations
- PR review status integration
- Webhook support for real-time updates
- Cross-tool task linking

---

## 8. Backend Requirements

Each provider requires corresponding backend endpoints. Verify with backend team:

### Jira
- [ ] `GET /planner/api/v1/jira/projects`
- [ ] `GET /planner/api/v1/jira/issues` (assigned to current user)
- [ ] `GET /planner/api/v1/jira/issues/:key`

### GitHub
- [ ] `GET /planner/api/v1/github/repos`
- [ ] `GET /planner/api/v1/github/issues` (assigned to current user)
- [ ] `GET /planner/api/v1/github/issues/:owner/:repo/:number`
- [ ] `GET /planner/api/v1/github/pulls` (optional)

### Bitbucket
- [ ] `GET /planner/api/v1/bitbucket/repositories`
- [ ] `GET /planner/api/v1/bitbucket/pullrequests`
- [ ] `GET /planner/api/v1/bitbucket/issues` (optional)

---

## 9. Testing Checklist

For each provider:
- [ ] Connection status detection works
- [ ] Boards/projects load correctly
- [ ] Tasks load and map to unified format
- [ ] Status inference is accurate
- [ ] Priority mapping works (Jira)
- [ ] Labels display correctly
- [ ] Due dates parse correctly
- [ ] Task URLs open in correct tool
- [ ] Error handling for API failures
- [ ] Works alongside other providers (aggregation)
- [ ] Filter by source works

---

## 10. Files to Create/Modify

### New Files
```
src/providers/tools/jira/index.ts
src/providers/tools/jira/JiraService.ts
src/providers/tools/jira/JiraProvider.ts

src/providers/tools/github/index.ts
src/providers/tools/github/GitHubService.ts
src/providers/tools/github/GitHubProvider.ts

src/providers/tools/bitbucket/index.ts
src/providers/tools/bitbucket/BitbucketService.ts
src/providers/tools/bitbucket/BitbucketProvider.ts
```

### Modified Files
```
src/types/task.types.ts          # Add 'bitbucket' to TaskSource
src/providers/tools/index.ts     # Register new providers
src/api/hooks/useUnifiedTasks.ts # Add icons/colors for new sources
```

---

## Summary

This implementation adds three new tool providers following the established architecture:

| Provider | Primary Entities | Status Source | Priority Source |
|----------|-----------------|---------------|-----------------|
| Jira | Projects, Issues | statusCategory | priority field |
| GitHub | Repos, Issues/PRs | state + labels | labels |
| Bitbucket | Repos, PRs | PR state | N/A |

All providers map to the same `UnifiedTask` and `UnifiedBoard` interfaces, enabling seamless aggregation in the dashboard and task views.
