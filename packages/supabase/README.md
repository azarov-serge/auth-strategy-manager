# @auth-strategy-manager/supabase

Supabase strategy for auth-strategy-manager.

## 🌍 Documentation in Other Languages

- [🇷🇺 Русский (Russian)](README_RU.md)
- [🇺🇸 English (Current)](README.md)

## Installation

```bash
npm install @auth-strategy-manager/supabase @auth-strategy-manager/core @supabase/supabase-js
```

## Usage

```typescript
import { AuthStrategyManager } from '@auth-strategy-manager/core';
import { SupabaseStrategy, SupabaseConfig } from '@auth-strategy-manager/supabase';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Create Supabase strategy
const supabaseStrategy = new SupabaseStrategy({
  supabase,
  name: 'supabase',
  signInUrl: 'https://myapp.com/login',
} satisfies SupabaseConfig);

// Use with strategy manager
const authManager = new AuthStrategyManager([supabaseStrategy]);

// Check authentication
const isAuthenticated = await supabaseStrategy.checkAuth();

// Sign in
const signInResult = await supabaseStrategy.signIn({
  email: 'user@example.com',
  password: 'password123',
});

// Sign up
const signUpResult = await supabaseStrategy.signUp({
  email: 'user@example.com',
  password: 'password123',
  username: 'user',
});

// Sign out
await supabaseStrategy.signOut();

// Refresh token
await supabaseStrategy.refreshToken();
```

## Configuration

### SupabaseConfig

```typescript
type SupabaseConfig = {
  supabase: SupabaseClient;
  name?: string;
  /** URL for redirecting to the authorization page */
  signInUrl?: string;
};
```

### Parameters

- `supabase` - Supabase client instance
- `name` - Strategy name (default: 'supabase')
- `signInUrl` - URL for redirect after logout

## API

### SupabaseStrategy

#### Constructor

```typescript
constructor(config: SupabaseConfig)
```

#### Methods

- `checkAuth(): Promise<boolean>` - Check authentication
- `signIn<T = unknown, D = undefined>(config?: D): Promise<T>` - Sign in user (expects `{ email, password }`)
- `signUp<T = unknown, D = undefined>(config?: D): Promise<T>` - Sign up user (expects `{ email, password, username }`)
- `signOut(): Promise<void>` - Sign out user
- `refreshToken<T>(args?: T): Promise<void>` - Refresh token
- `clear(): void` - Clear authentication state
- `getCurrentUserId(): Promise<string | null>` - Get current user id from session
- `getSessionInfo(): Promise<SessionInfo>` - Get session info (isAuthenticated, userId)

#### Properties

- `name: string` - Strategy name
- `supabase: SupabaseClient` - Supabase client instance
- `token?: string` - Current access token
- `isAuthenticated: boolean` - Authentication status

## Token handling

Tokens are stored in memory inside the strategy instance (`token` property) and in Supabase auth session. The strategy uses Supabase SDK to manage session and tokens.

## License

ISC

