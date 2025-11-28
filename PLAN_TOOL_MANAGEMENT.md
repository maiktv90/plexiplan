# Tool Management Feature - Implementation Plan

## Overview

This plan outlines the implementation of a Tool Management feature that allows users to connect and manage external development tools (GitHub, Bitbucket, Jira, Trello) from a centralized Settings page.

## Current State Analysis

### Backend (plexify-planner-backend) - Already Implemented
- **Entities**: `ToolEntity`, `Tool`, `SelfHostedServerTool` with single-table inheritance
- **DTOs**: `ToolDto`, `IntegrationsDto` (connected + available tools)
- **Services**: `IntegrationConfigService`, `OAuth2IntegrationService`, `PATIntegrationService`
- **OAuth Support**: Full OAuth2 flow with `DynamicRedirectAuthSuccessHandler`
- **PAT Support**: Register/delete PAT with encrypted storage
- **Existing Endpoints**:
  - `GET /auth/integrations` - Get all integrations (disabled, needs enabling)
  - `POST /auth/pat/{clientRegistrationId}` - Register PAT
  - `DELETE /auth/pat/{clientRegistrationId}` - Delete PAT
  - `/oauth2/authorization/{clientRegistrationId}` - Start OAuth flow

### Frontend (plexify-planner-v2) - To Be Built
- **ConfigService**: Basic structure exists for tool configs
- **Config files**: `github.config.ts`, `jira.config.ts` exist with client registration IDs
- **No Settings page** currently exists

---

## Implementation Tasks

### Phase 1: Types & Configuration

#### Task 1.1: Create Tool Types
**File**: `src/types/tool.types.ts`

```typescript
export type ToolCategory = 'project_management' | 'code_management';
export type AuthType = 'oauth2' | 'pat' | 'custom';
export type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'pending';

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: ToolCategory;
  authType: AuthType;
  clientRegistrationId: string;
  configFields?: ConfigField[];
}

export interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'url' | 'password';
  required: boolean;
  placeholder?: string;
  helpText?: string;
}

export interface ConnectedTool {
  clientKey: string;
  label: string;
  type: string;
  authMethod: AuthType;
  domain?: string;
  connectUrl?: string;
  user?: {
    name: string;
    email?: string;
    avatarUrl?: string;
  };
}

export interface IntegrationsResponse {
  connectedTools: ConnectedTool[];
  availableTools: ConnectedTool[];
}
```

#### Task 1.2: Create Tools Configuration
**File**: `src/config/tools.config.ts`

Define supported tools:
- GitHub (oauth2)
- Bitbucket (oauth2)
- Jira Cloud (oauth2)
- Jira Server (pat)
- Trello (custom)

---

### Phase 2: API Layer

#### Task 2.1: Create ToolService
**File**: `src/api/services/ToolService.ts`

Methods:
- `getIntegrations()` - GET /auth/integrations
- `initiateOAuthConnection(clientRegistrationId)` - Redirect to /oauth2/authorization/{id}
- `registerPAT(clientRegistrationId, token, domain?)` - POST /auth/pat/{id}
- `disconnectTool(clientRegistrationId)` - DELETE /auth/pat/{id}

#### Task 2.2: Create useTools Hook
**File**: `src/api/hooks/useTools.ts`

React Query hooks:
- `useIntegrationsQuery()` - Fetch connected/available tools
- `useRegisterPATMutation()` - Register PAT
- `useDisconnectToolMutation()` - Disconnect a tool

#### Task 2.3: Create API Client Instance
**File**: `src/api/client/instances.ts`

Add: `authApiClient` for `/auth` endpoints

---

### Phase 3: State Management

#### Task 3.1: Create Tool Store
**File**: `src/stores/useToolStore.ts`

State:
- `connectingTool: string | null` - Tool currently being connected
- `disconnectingTool: string | null` - Tool being disconnected
- Actions for managing connection state

---

### Phase 4: UI Components

#### Task 4.1: ToolStatusBadge Component
**File**: `src/components/features/tools/ToolStatusBadge.tsx`

Visual status indicator:
- Connected (green checkmark)
- Disconnected (gray circle)
- Error (red warning)
- Pending (spinning loader)

#### Task 4.2: ToolCard Component
**File**: `src/components/features/tools/ToolCard.tsx`

Card displaying:
- Tool icon and name
- Connection status badge
- Connected user info (if connected)
- Action buttons (Connect/Disconnect/Settings)

#### Task 4.3: ToolList Component
**File**: `src/components/features/tools/ToolList.tsx`

Grid of ToolCards grouped by category:
- Code Management tools
- Project Management tools

#### Task 4.4: ToolConnectionDialog Component
**File**: `src/components/features/tools/ToolConnectionDialog.tsx`

Modal for:
- OAuth tools: Permission explanation + redirect button
- PAT tools: Form with server URL + token input + validation

#### Task 4.5: ToolDisconnectDialog Component
**File**: `src/components/features/tools/ToolDisconnectDialog.tsx`

Confirmation dialog for disconnecting a tool.

#### Task 4.6: Create Barrel Export
**File**: `src/components/features/tools/index.ts`

Export all tool components.

---

### Phase 5: Settings Page

#### Task 5.1: Create SettingsSidebar Component
**File**: `src/components/features/settings/SettingsSidebar.tsx`

Navigation sidebar with sections:
- Tools (active)
- Account (future)
- Preferences (future)

#### Task 5.2: Create SettingsPage
**File**: `src/pages/SettingsPage.tsx`

Full-page layout with:
- Header with back button
- Sidebar navigation
- Content area (ToolList by default)

#### Task 5.3: Update Router
**File**: `src/router/AppRouter.tsx`

Add route: `{ path: 'settings', element: <SettingsPage /> }`

#### Task 5.4: Update Pages Index
**File**: `src/pages/index.ts`

Export `SettingsPage`.

---

### Phase 6: Navigation Integration

#### Task 6.1: Add Settings Link to Navbar
**File**: `src/components/layout/Navbar.tsx`

Add settings icon/link next to logout button.

#### Task 6.2: Add Settings Link to Dashboard (Optional)
Consider adding a "Connected Tools" widget to dashboard for quick access.

---

### Phase 7: OAuth Callback Handling

#### Task 7.1: Create OAuth Callback Handler
The backend handles OAuth callbacks and redirects back to the app.
Frontend needs to:
- Detect OAuth success/error via URL params or redirect path
- Show success/error toast notification
- Refresh integrations list

---

## File Structure Summary

```
src/
├── types/
│   └── tool.types.ts                    # NEW
├── config/
│   └── tools.config.ts                  # NEW
├── api/
│   ├── services/
│   │   └── ToolService.ts               # NEW
│   ├── hooks/
│   │   └── useTools.ts                  # NEW
│   └── client/
│       └── instances.ts                 # MODIFY (add authApiClient)
├── stores/
│   └── useToolStore.ts                  # NEW
├── components/
│   └── features/
│       ├── tools/
│       │   ├── ToolStatusBadge.tsx      # NEW
│       │   ├── ToolCard.tsx             # NEW
│       │   ├── ToolList.tsx             # NEW
│       │   ├── ToolConnectionDialog.tsx # NEW
│       │   ├── ToolDisconnectDialog.tsx # NEW
│       │   └── index.ts                 # NEW
│       └── settings/
│           ├── SettingsSidebar.tsx      # NEW
│           └── index.ts                 # NEW
├── pages/
│   ├── SettingsPage.tsx                 # NEW
│   └── index.ts                         # MODIFY
├── router/
│   └── AppRouter.tsx                    # MODIFY
└── components/layout/
    └── Navbar.tsx                       # MODIFY
```

---

## UI Component Mockups

### ToolCard (Connected)
```
┌─────────────────────────────────────┐
│  🐙 GitHub                    ✅    │
│                                     │
│  @username                          │
│  Connected                          │
│                                     │
│  [Disconnect]                       │
└─────────────────────────────────────┘
```

### ToolCard (Available)
```
┌─────────────────────────────────────┐
│  🔷 Jira Cloud                ○     │
│                                     │
│  Issue tracking and                 │
│  project management                 │
│                                     │
│  [Connect]                          │
└─────────────────────────────────────┘
```

### Settings Page Layout
```
┌──────────────────────────────────────────────────────────┐
│  ← Dashboard                                    Settings │
├──────────────┬───────────────────────────────────────────┤
│              │                                           │
│  Tools  ●    │  Connected Tools                          │
│  Account     │  ┌─────────┐ ┌─────────┐                 │
│  Preferences │  │ GitHub  │ │ Jira    │                 │
│              │  │ ✅      │ │ ✅      │                 │
│              │  └─────────┘ └─────────┘                 │
│              │                                           │
│              │  Available Tools                          │
│              │                                           │
│              │  Code Management                          │
│              │  ┌─────────┐                             │
│              │  │Bitbucket│                             │
│              │  │ Connect │                             │
│              │  └─────────┘                             │
│              │                                           │
│              │  Project Management                       │
│              │  ┌─────────┐                             │
│              │  │ Trello  │                             │
│              │  └─────────┘                             │
└──────────────┴───────────────────────────────────────────┘
```

---

## Implementation Order

1. **Types & Config** (Task 1.1, 1.2) - Foundation
2. **API Layer** (Task 2.1, 2.2, 2.3) - Backend communication
3. **Store** (Task 3.1) - State management
4. **UI Components** (Task 4.1-4.6) - Building blocks
5. **Settings Page** (Task 5.1-5.4) - Main page
6. **Navigation** (Task 6.1) - Accessibility
7. **OAuth Handling** (Task 7.1) - Complete flow

---

## Backend Requirements (if changes needed)

The backend already has most functionality. May need:

1. **Enable `/auth/integrations` endpoint** - Currently disabled in AuthApiConfig.kt
2. **Add disconnect endpoint for OAuth tools** - Currently only PAT can be deleted
3. **Add connection validation endpoint** - Test credentials before saving

---

## Acceptance Criteria

- [ ] User can view all available tools on Settings page
- [ ] User can see which tools are already connected
- [ ] User can connect GitHub via OAuth (redirects to GitHub, returns connected)
- [ ] User can connect Jira Cloud via OAuth
- [ ] User can connect Jira Server via PAT (form with URL + token)
- [ ] User can connect Bitbucket via OAuth
- [ ] User can connect Trello
- [ ] User can disconnect any connected tool
- [ ] Connection errors are displayed clearly
- [ ] Settings page is accessible from navigation
- [ ] Dark mode is supported throughout
