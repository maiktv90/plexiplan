# GitHub Integration Fix - Implementation Plan

## Problem Analysis

### Root Cause of 500 Error
The 500 error on `GET /api/v1/github/repo` occurs because **OAuth access tokens are not being persisted to the database** after successful OAuth authentication.

**Current Flow (Broken):**
1. User initiates GitHub OAuth via `/api/v1/tools/oauth/initiate?provider=github`
2. OAuth flow completes successfully
3. `DynamicRedirectAuthSuccessHandler` creates a `ToolEntity` for the user
4. **OAuth access token is NOT saved** - Spring Security uses `InMemoryReactiveOAuth2AuthorizedClientService` by default
5. User is redirected to frontend with success
6. Frontend calls `/api/v1/github/repo`
7. `BearerTokenService.getTokenFor("github")` tries to get token from `UserTokenRepository`
8. **No token found** → Error propagates → 500 Internal Server Error

### Evidence
- `OAuth2LoginSecurityConfig.kt.disabled` - Custom token storage config is disabled
- `AccessTokenProvider.getBearerToken()` queries `UserTokenRepository` for `OAuth2TokenEntity`
- No code currently saves `OAuth2TokenEntity` during OAuth callback
- `ToolEntity` is created but it only records the connection, not the actual token

## Implementation Plan

### Phase 1: Fix OAuth Token Persistence (Critical)

#### 1.1 Create DatabaseReactiveOAuth2AuthorizedClientService
**File:** `/auth/oauth/service/DatabaseReactiveOAuth2AuthorizedClientService.kt`

```kotlin
@Service
class DatabaseReactiveOAuth2AuthorizedClientService(
    private val userTokenRepository: UserTokenRepository,
    private val plexUserRepository: PlexUserRepository,
    private val cryptService: CryptService,
    private val clientRegistrationRepository: ReactiveClientRegistrationRepository,
) : ReactiveOAuth2AuthorizedClientService {

    override fun loadAuthorizedClient<T : OAuth2AuthorizedClient>(
        clientRegistrationId: String,
        principalName: String
    ): Mono<T>

    override fun saveAuthorizedClient(
        authorizedClient: OAuth2AuthorizedClient,
        principal: Authentication
    ): Mono<Void>

    override fun removeAuthorizedClient(
        clientRegistrationId: String,
        principalName: String
    ): Mono<Void>
}
```

**Key responsibilities:**
- Save OAuth2 tokens to `UserTokenEntity.OAuth2TokenEntity` table
- Encrypt access/refresh tokens before storage
- Load tokens back when needed
- Handle token removal on disconnect

#### 1.2 Update JwtSecurityConfig
**File:** `/auth/external/configuration/JwtSecurityConfig.kt`

Add the custom OAuth2 authorized client service to the security configuration:
```kotlin
.oauth2Login { oauth2Login ->
    oauth2Login
        .authorizedClientService(databaseOAuth2AuthorizedClientService)
        .authenticationSuccessHandler(...)
}
```

#### 1.3 Update DynamicRedirectAuthSuccessHandler
Modify to also save the OAuth token when creating the tool:
- Extract access token from `OAuth2AuthenticationToken`
- Save to `UserTokenRepository` via the new service

### Phase 2: Improve GitHub Repository Fetching

#### 2.1 Current Limitations
- `getAllRepos()` only fetches user's personal repos
- `getOrgReposFromGithub(org)` requires user to configure an org manually
- No automatic discovery of user's organizations

#### 2.2 Enhancements
**File:** `/shared/webclient/GithubWebClient.kt`

Add new methods:
```kotlin
// Get all repos user has access to (personal + org)
fun getAllAccessibleRepos(): Flux<GHRepository>

// Get user's organizations
fun getUserOrganizations(): Flux<GHOrganization>

// Get repos for multiple orgs
fun getReposForOrganizations(orgs: List<String>): Flux<GHRepository>
```

**File:** `/api/github/service/adapter/GithubRepoProvider.kt`

Update `listUserRepos()` to:
1. Fetch user's personal repositories
2. Fetch user's organizations
3. Fetch repositories from each organization
4. Return combined list (with deduplication)

### Phase 3: Improve Pull Request Fetching

#### 3.1 Current Limitations
- `listPRsAssignedToMe()` iterates all orgs → performance issue
- Only checks if user is reviewer or assignee
- Missing PRs created by the user

#### 3.2 Enhancements
**File:** `/shared/webclient/GithubWebClient.kt`

```kotlin
// Get PRs created by current user
fun listPRsCreatedByMe(): Flux<GHPullRequest>

// Get PRs where user is requested reviewer
fun listPRsToReview(): Flux<GHPullRequest>

// Get all PRs relevant to user (created + reviewing + assigned)
fun listMyPullRequests(): Flux<GHPullRequest>
```

**Implementation approach:**
- Use GitHub Search API for efficient querying:
  - `is:pr author:@me` - PRs created by user
  - `is:pr review-requested:@me` - PRs pending review
  - `is:pr assignee:@me` - PRs assigned to user

**File:** `/api/github/service/PullRequestService.kt`

Add methods:
```kotlin
fun listPRsCreatedByMe(): Flux<PullRequestResponse>
fun listPRsToReview(): Flux<PullRequestResponse>
fun listAllMyPRs(): Flux<PullRequestResponse>
```

#### 3.3 New API Endpoints
**File:** `/api/ApiConfig.kt`

Add new routes:
```kotlin
GET("/api/v1/github/pr/created")  // PRs I created
GET("/api/v1/github/pr/review")   // PRs I need to review
GET("/api/v1/github/pr/all")      // All my PRs (combined)
```

### Phase 4: Frontend Integration

#### 4.1 Update GitHubService
**File:** `/providers/tools/github/GitHubService.ts`

```typescript
export const GitHubService = {
  async getRepos(): Promise<GitHubRepo[]>,
  async getPullRequests(): Promise<GitHubPullRequest[]>,
  async getPullRequestsCreatedByMe(): Promise<GitHubPullRequest[]>,
  async getPullRequestsToReview(): Promise<GitHubPullRequest[]>,
}
```

#### 4.2 Update GitHubProvider
**File:** `/providers/tools/github/GitHubProvider.ts`

Map GitHub data to unified task format for dashboard display.

## Implementation Order

1. **Phase 1.1-1.3** - Fix OAuth token persistence (CRITICAL - blocks everything)
2. **Phase 2.1-2.2** - Improve repo fetching
3. **Phase 3.1-3.3** - Improve PR fetching
4. **Phase 4.1-4.2** - Frontend updates

## Files to Create/Modify

### Backend (plexify-planner-backend)
| File | Action | Description |
|------|--------|-------------|
| `/auth/oauth/service/DatabaseReactiveOAuth2AuthorizedClientService.kt` | CREATE | Custom OAuth token storage |
| `/auth/external/configuration/JwtSecurityConfig.kt` | MODIFY | Add OAuth client service |
| `/auth/oauth/configuration/DynamicRedirectAuthSuccessHandler.kt` | MODIFY | Ensure token is saved |
| `/shared/webclient/GithubWebClient.kt` | MODIFY | Add new methods |
| `/api/github/service/adapter/GithubRepoProvider.kt` | MODIFY | Fetch all accessible repos |
| `/api/github/service/PullRequestService.kt` | MODIFY | Add new PR methods |
| `/api/github/handler/PullRequestHandler.kt` | MODIFY | Add new handlers |
| `/api/ApiConfig.kt` | MODIFY | Add new routes |

### Frontend (plexify-planner-v2)
| File | Action | Description |
|------|--------|-------------|
| `/providers/tools/github/GitHubService.ts` | MODIFY | Add new API methods |
| `/providers/tools/github/GitHubProvider.ts` | MODIFY | Update data mapping |

## Testing Plan

1. **Token Persistence Test:**
   - Connect GitHub OAuth
   - Verify `user_tokens` table has new `OAuth2TokenEntity` record
   - Refresh page, verify repos load successfully

2. **Repository Fetch Test:**
   - Verify personal repos are returned
   - Verify organization repos are returned
   - Verify no duplicates

3. **Pull Request Test:**
   - Create a PR on GitHub
   - Verify it appears in "created by me"
   - Request review from yourself
   - Verify it appears in "to review"
