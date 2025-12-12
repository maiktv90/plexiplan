# Multi-Account Tool Management

This feature allows users to connect **multiple accounts from the same provider** (e.g., "Work GitHub" + "Personal GitHub", or "Client A Trello" + "Client B Trello") and **order them individually** to control how tasks and data appear across the app.

---

## Previous Architecture (Single Account)

### How It Worked

In the original implementation, each tool connection was uniquely identified by only two fields:

```kotlin
// Old unique constraint
@Table(
    uniqueConstraints = [
        UniqueConstraint(
            columnNames = ["plex_user_id", "client_registration_id"]
        )
    ]
)
```

**Database Schema (Simplified):**
```
tools
├── id (PK)
├── plex_user_id (FK) ──────┐
├── client_registration_id ─┼── UNIQUE constraint
├── access_token            │
├── refresh_token           │
└── ...                     │
```

This meant: **one user → one tool per provider**.

### Token Storage & Lookup

```kotlin
// Old token lookup - single result
fun getTokenFor(clientRegistrationId: String): Mono<String> {
    return plexUserService.findCurrentUser()
        .map { user -> user.getTool(clientRegistrationId) }  // Returns single tool
        .flatMap { tool -> getTokenForTool(tool) }
}
```

The `getTool(clientRegistrationId)` method returned a single `ToolEntity`, assuming only one exists per provider.

### OAuth Flow Problem

```
User clicks "Connect GitHub"
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  Browser redirects to GitHub OAuth                          │
│  GitHub checks browser session → finds logged-in account    │
│  GitHub auto-authorizes (if previously authorized)          │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
Backend receives OAuth callback
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  Find existing tool: WHERE user_id = ? AND client = ?       │
│  If found → UPDATE tokens (overwrites previous account!)    │
│  If not found → INSERT new tool                             │
└─────────────────────────────────────────────────────────────┘
```

**The critical issue:** If a user was logged into their personal GitHub in the browser but wanted to connect their work GitHub, the OAuth flow would silently connect the personal account instead, and if they previously had work GitHub connected, it would be **overwritten**.

### Data Fetching (Single Account)

```kotlin
// Old approach - fetch from single token
fun getTasks(): Flux<TrelloTask> {
    return bearerTokenService.getTokenFor(TRELLO)  // Single token
        .flatMapMany { token ->
            fetchTasksWithToken(token)
        }
}
```

All tasks came from one account. No way to aggregate data from multiple accounts.

### Technical Limitations

| Limitation | Impact |
|------------|--------|
| **Unique constraint on `(user_id, provider)`** | Database physically prevented multiple accounts |
| **`getTool()` returns single entity** | Code assumed one tool per provider throughout |
| **Token lookup returns `Mono<String>`** | Single token, not a collection |
| **No account identifier stored** | No way to distinguish which provider account |
| **OAuth overwrites existing** | Connecting new account replaced old one |
| **No ordering per account** | Only provider-level ordering possible |

### User Experience Problems

1. **Accidental account switching:** User connects GitHub at work, goes home, connects GitHub (auto-picks personal) → work account gone

2. **No multi-client support:** Freelancers couldn't connect Client A's Jira and Client B's Jira simultaneously

3. **Browser session dependency:** The connected account depended on which account was logged into the browser, not user choice

4. **Silent overwrites:** No warning when replacing an existing connection

---

## New Architecture (Multi-Account)

### Key Changes

| Component | Before | After |
|-----------|--------|-------|
| **Unique constraint** | `(user_id, provider)` | `(user_id, provider, external_account_id)` |
| **Tool lookup** | `getTool(provider): Tool` | `getToolsForProvider(provider): List<Tool>` |
| **Token service** | `getTokenFor(): Mono<String>` | `getAllTokensFor(): Flux<String>` |
| **Data fetching** | Single account | Iterate all accounts, merge results |
| **Account identity** | None | `externalAccountId` from provider |
| **Ordering** | Per provider | Per account |

### Solution Summary

1. **`externalAccountId`** - Store the provider's unique user ID (e.g., GitHub user ID `12345`)
2. **Updated constraint** - Allow multiple rows with same `(user_id, provider)` as long as `external_account_id` differs
3. **Multi-token fetching** - New methods to get all tokens for a provider
4. **Data aggregation** - Fetch from all accounts, tag results with account info
5. **Per-account ordering** - Each account has its own `displayOrder`

---

## Implementation Details

### 1. Backend - Database & Entity Changes

#### `ToolEntity.kt`
```kotlin
@Entity
@Table(
    uniqueConstraints = [
        UniqueConstraint(
            name = "uk_tools_user_provider_account",
            columnNames = ["plex_user_id", "client_registration_id", "external_account_id"]
        )
    ]
)
abstract class ToolEntity {
    abstract val clientRegistrationId: String
    abstract val externalAccountId: String  // Unique ID from provider
    abstract var accountLabel: String?       // User-friendly name
    abstract var displayOrder: Int           // Custom ordering
}
```

**Key Changes:**
- Added `externalAccountId` - unique identifier from the provider (e.g., GitHub user ID, Trello account ID)
- Added `accountLabel` - user-friendly name (e.g., "Work GitHub")
- Added `displayOrder` - for custom ordering per account
- Updated unique constraint to allow multiple tools per provider: `(user_id, client_registration_id, external_account_id)`

#### `ITool.kt`
```kotlin
sealed interface ITool {
    val clientRegistrationId: String
    val externalAccountId: String?
    val accountLabel: String?
    // ... other properties
}
```

---

### 2. Backend - OAuth Multi-Account Support

#### OAuth Handlers
- Extract `externalAccountId` from provider responses during OAuth callback
- Connecting a new account with a different `externalAccountId` creates a new tool entry instead of updating existing

#### `BearerTokenService.kt` - New Methods
```kotlin
/**
 * Get tokens from ALL connected accounts for a provider
 */
fun getAllTokensFor(clientRegistrationId: String): Flux<String>

/**
 * Get tools with their tokens for multi-account data fetching
 */
fun getAllToolsWithTokensFor(clientRegistrationId: String): Flux<ToolWithToken>

data class ToolWithToken(
    val tool: ITool,
    val token: String,
)
```

---

### 3. Backend - Multi-Account Data Fetching

#### `TrelloWebClient.kt`
```kotlin
private fun getTasksFromAllAccounts(statusFilter: String): Flux<TrelloTask> {
    return bearerTokenService.getAllToolsWithTokensFor(TRELLO)
        .flatMap { toolWithToken ->
            val token = toolWithToken.token
            val accountLabel = toolWithToken.tool.accountLabel
                ?: toolWithToken.tool.externalAccountId

            getUserByToken(token)
                .flatMapMany { user ->
                    getTasksForUserWithToken(user.id, statusFilter, token)
                        .map { task ->
                            // Tag tasks with account info
                            task.copy(
                                accountLabel = accountLabel,
                                externalAccountId = toolWithToken.tool.externalAccountId
                            )
                        }
                }
                .onErrorResume { e ->
                    logger.warn("Failed to fetch for account {}: {}", accountLabel, e.message)
                    Flux.empty()
                }
        }
}
```

**Pattern:**
1. Get all connected accounts for the provider
2. Fetch data from each account using its token
3. Tag results with account info
4. Merge all results into a single stream
5. Handle errors per-account (don't fail entire request)

---

### 4. Backend - Dashboard Integration

#### `DashboardDto.kt`
```kotlin
data class DashboardTask(
    val id: String,
    val source: String,
    val title: String,
    // ... other fields
    val externalAccountId: String? = null,  // Added
    val accountLabel: String? = null,        // Added
)
```

#### `DashboardService.kt`
```kotlin
private fun mapTrelloTaskToDashboardTask(task: TrelloTask): DashboardTask {
    return DashboardTask(
        // ... other mappings
        externalAccountId = task.externalAccountId,
        accountLabel = task.accountLabel,
    )
}
```

---

### 5. Backend - Tool Order API

#### `ToolOrderDto.kt`
```kotlin
data class ToolOrderUpdate(
    val clientKey: String,
    val order: Int,
    val externalAccountId: String? = null  // For multi-account support
)
```

#### `ToolOrderService.kt`
```kotlin
private fun findTool(
    tools: List<ToolEntity>,
    clientKey: String,
    externalAccountId: String?
): ToolEntity? {
    return if (externalAccountId != null) {
        // Find specific account
        tools.find {
            it.clientRegistrationId == clientKey &&
            it.externalAccountId == externalAccountId
        }
    } else {
        // Legacy: find by clientKey only
        tools.find { it.clientRegistrationId == clientKey }
    }
}
```

---

### 6. Frontend - Types

#### `tool.types.ts`
```typescript
export interface ConnectedTool {
  clientKey: string;
  label: string;
  authMethod: AuthMethod;
  order?: number;
  externalAccountId?: string;  // Added
  accountLabel?: string;        // Added
  // ... other fields
}

export interface ToolOrderUpdate {
  clientKey: string;
  order: number;
  externalAccountId?: string;  // Added
}
```

#### `task.types.ts`
```typescript
export interface UnifiedTask {
  // ... other fields
  externalAccountId?: string;  // Added
  accountLabel?: string;        // Added
}
```

---

### 7. Frontend - Settings Page (Tool List)

#### New Components

**`ConnectedToolListItem.tsx`**
- Compact list item for connected tools
- Shows: drag handle, tool icon (tooltip), account label, status badge, date, actions

**`SortableConnectedToolListItem.tsx`**
- Wrapper with dnd-kit integration for drag-and-drop

#### `ToolList.tsx` - Category-Based Layout
```tsx
// Connected tools grouped by category
{categories.map((category) => (
  <ConnectedToolsList
    key={category}
    title={CATEGORY_LABELS[category]}
    connectedTools={getConnectedToolsByCategory(category)}
    allConnectedTools={connectedTools}
    onReorder={handleReorder}
    // ...
  />
))}
```

**Layout:**
```
Project Management
├── Jira - Work Account      [drag] [settings] [disconnect]
├── Trello - Client A        [drag] [settings] [disconnect]
├── Jira - Personal          [drag] [settings] [disconnect]
└── [+ Add Jira] [+ Add Trello]

Code Management
├── GitHub - Work            [drag] [settings] [disconnect]
├── Bitbucket - Company      [drag] [settings] [disconnect]
└── [+ Add GitHub] [+ Add Bitbucket]

Available Tools
└── [Tool cards for unconnected providers]
```

---

### 8. Frontend - Tasks Page (Per-Account Grouping)

#### `TasksPage.tsx`
```tsx
// Group tasks by account (source + externalAccountId)
const groupedByAccount = useMemo(() => {
  const groups: Record<string, {
    source: TaskSource;
    accountLabel?: string;
    externalAccountId?: string;
    tasks: UnifiedTask[];
  }> = {};

  for (const task of filteredTasks) {
    const accountKey = task.externalAccountId
      ? `${task.source}:${task.externalAccountId}`
      : task.source;

    if (!groups[accountKey]) {
      groups[accountKey] = {
        source: task.source,
        accountLabel: task.accountLabel,
        externalAccountId: task.externalAccountId,
        tasks: [],
      };
    }
    groups[accountKey].tasks.push(task);
  }
  return groups;
}, [filteredTasks]);

// Sort by configured tool order
const sortedAccountKeys = useMemo(() => {
  return Object.keys(groupedByAccount).sort((a, b) => {
    const aOrder = toolOrderMap.get(a) ?? toolOrderMap.get(source) ?? 999;
    const bOrder = toolOrderMap.get(b) ?? toolOrderMap.get(source) ?? 999;
    return aOrder - bOrder;
  });
}, [groupedByAccount, toolOrderMap]);
```

**Result:** Tasks can be interleaved by account order:
- Jira A (order 1) → Trello Work (order 2) → Jira B (order 3)

---

### 9. Frontend - Disconnect with Account ID

#### `ToolService.ts`
```typescript
async disconnectTool(
  clientRegistrationId: string,
  externalAccountId?: string
): Promise<void> {
  const params = externalAccountId
    ? `?externalAccountId=${encodeURIComponent(externalAccountId)}`
    : '';
  await toolsApiClient.delete(`/pat/${clientRegistrationId}${params}`);
}
```

---

## User Flow

1. **Connect first account:** User connects GitHub → stored with `externalAccountId: "12345"`

2. **Connect second account:** User clicks "Add GitHub" → OAuth with different GitHub account → stored with `externalAccountId: "67890"`

3. **Label accounts:** Backend can set `accountLabel` from provider username, or user can customize

4. **Reorder:** User drags accounts in Settings to set display order within each category

5. **View tasks:** Tasks page shows tasks grouped by account in the configured order

6. **Disconnect specific account:** User can disconnect individual accounts without affecting others

---

## Files Modified

| Area | Files |
|------|-------|
| **Backend Entities** | `ToolEntity.kt`, `ITool.kt` |
| **Backend DTOs** | `ToolOrderDto.kt`, `DashboardDto.kt` |
| **Backend Services** | `BearerTokenService.kt`, `ToolOrderService.kt`, `DashboardService.kt` |
| **Backend WebClients** | `TrelloWebClient.kt` |
| **Backend Models** | `TrelloTask.kt`, `TrelloBoard.kt` |
| **Frontend Types** | `tool.types.ts`, `task.types.ts`, `DashboardService.ts` |
| **Frontend Components** | `ToolList.tsx`, `ConnectedToolListItem.tsx`, `SortableConnectedToolListItem.tsx` |
| **Frontend Pages** | `TasksPage.tsx`, `SettingsPage.tsx` |

---

## Future Enhancements

- [ ] Add multi-account support to Jira WebClient
- [ ] Add multi-account support to GitHub WebClient
- [ ] Add multi-account support to Bitbucket WebClient
- [ ] Allow users to edit `accountLabel` in the UI
- [ ] Sync `accountLabel` from provider username during OAuth
