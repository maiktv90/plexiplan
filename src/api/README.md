# Auth API

This directory contains the authentication API for the plexify-planner-v2 application.

## Files

- `auth.ts` - Main authentication API with KeyCloak integration

## Key Functions

### `openKeycloakLogin()`
Opens KeyCloak login page, handling both extension and web contexts.

### `logout(clientKey, userUrl, callback)`
Logs out user from KeyCloak and clears local storage.

### `checkUserAuthStatus()`
Checks current authentication status with KeyCloak backend.

### `refreshAuthState()`
Refreshes authentication state and updates local storage.

### Personal Access Token Management
- `savePersonalAccessToken()`
- `deletePersonalAccessToken()`
- `registerCustomServerConnection()`

## Usage

The auth API is integrated with the React hooks in `src/hooks/useAuth.ts` and provides the same functionality as the original plexify-planner-connector application.

## KeyCloak Configuration

The auth API uses the same KeyCloak configuration as defined in `src/config/auth.config.ts`:

- Client Registration ID: `baseuser`
- Auth endpoints configured for localhost:7777
- CSRF token support
- Extension and web app compatibility