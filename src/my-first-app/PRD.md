# React Native Template Specification (January 2026)

**Purpose:** A boring, opinionated, fast template that lets you ship any mobile app in under 30 minutes.

---

## Stack (Locked — No Debate)

| Layer | Choice | Version | Reason |
|-------|--------|---------|--------|
| Framework | React Native + Expo | SDK 54 / RN 0.81 | OTA updates, precompiled XCFrameworks (10x faster iOS builds), New Architecture default |
| Language | TypeScript | 5.6+ | Catch bugs early, better autocomplete |
| Routing | Expo Router | v4 | File-based, type-safe, native tabs in v6 coming with SDK 55 |
| Client State | Zustand | v5.0.10 | Zero boilerplate, uses native useSyncExternalStore, smaller bundle |
| Server State | TanStack Query | v5 | Caching, refetching, loading states for free |
| HTTP | Axios | v1.7+ | Interceptors for auth, centralized error handling |
| Secure Storage | Expo SecureStore | ~14.0 | Encrypted storage for tokens |
| Code Quality | ESLint + Prettier | Latest | Consistency, no style debates |

**Why SDK 54 specifically:**
- React Native 0.81 with React 19.1
- New Architecture is now default (75%+ of EAS projects use it)
- iOS builds ship as precompiled XCFrameworks — dramatically faster
- Legacy Architecture support ends in SDK 55 (January 2026)
- iOS 26 Liquid Glass support ready
- Android 16 edge-to-edge default

**Anything beyond this is bloat.**

---

## Folder Structure (Locked — Do Not Touch After Setup)

```
app/                    → Routes (Expo Router)
  _layout.tsx           → Root layout, providers
  index.tsx             → Home (protected)
  login.tsx             → Auth screen (public)

src/
  api/
    client.ts           → Axios instance, interceptors
    types.ts            → Request/response types
  
  store/
    auth.ts             → Auth state (Zustand v5)
  
  hooks/
    useAuth.ts          → Auth logic wrapper
  
  lib/
    storage.ts          → SecureStore wrapper
```

**That's it. No components folder, no utils, no constants. Add them when you need them, not before.**

---

## What the Template Must Have

### 1. App Boots
- Single home screen
- Single login screen
- Route protection (redirect if not authenticated)
- New Architecture enabled (default in SDK 54)

### 2. Auth Skeleton (Mocked)
- Login screen with email/password inputs
- Token stored in SecureStore
- Logout clears token
- No real backend — just mocks

### 3. API Layer
- Axios instance with base URL placeholder
- Request interceptor: attach token
- Response interceptor: handle 401, logout on unauthorized
- Typed responses

### 4. State Management (Zustand v5 specifics)
- Uses `create` from `zustand` (not deprecated patterns)
- Uses `useShallow` for object/array selectors (prevents infinite loops)
- Hydration on app start (check for existing token)
- No providers needed

### 5. Scripts
- `pnpm start` → dev server
- `pnpm android` → Android emulator
- `pnpm ios` → iOS simulator
- `pnpm lint` → run linter
- `pnpm typecheck` → TypeScript check

---

## What the Template Must NOT Have

| Avoid | Why |
|-------|-----|
| UI component library | Add when you know your design |
| Animations / Reanimated | Add per-app (also requires v4 for New Arch) |
| Theme/dark mode setup | Add per-app |
| Navigation tabs/drawers | App-specific |
| Form libraries | Overkill for most cases |
| Analytics | App-specific |
| Push notifications | App-specific (requires dev build anyway) |
| Splash screen customization | Do it per-app |
| iOS 26 Liquid Glass icons | Do it per-app |
| 20-page README | Waste of time |
| Tests | Add when you have features to test |

---

## Critical 2026 Notes

### New Architecture is Default
- SDK 54 enables New Architecture by default
- Do NOT disable it — legacy support ends with RN 0.82
- Most libraries already support it
- Run `npx expo-doctor@latest` to check compatibility

### Zustand v5 Breaking Changes
- `useShallow` hook required for object/array selectors
- No custom equality function in `create` — use `createWithEqualityFn` if needed
- Persist middleware behavior changed — initial state not auto-stored

### Expo SecureStore
- Works only in development builds, NOT Expo Go
- For dev testing, use AsyncStorage fallback or create dev build early

### Push Notifications
- No longer supported in Expo Go (as of SDK 52)
- Requires development build from day one if you need them

---

## Customization Points (Per App)

When you clone the template for a new app, change only:

1. `app.json` → name, slug, bundle identifier
2. `src/api/client.ts` → base URL
3. `src/api/types.ts` → your API types

Everything else stays the same.

---

## Time Budget

| Task | Time |
|------|------|
| Initial setup (create-expo-app + deps) | 15 min |
| Folder structure + config files | 30 min |
| Auth skeleton (store, hook, screens) | 2 hrs |
| API layer (axios, interceptors, types) | 1 hr |
| Testing it works end-to-end | 30 min |
| **Total** | **~4-5 hours** |

If it takes longer than 1-2 focused days, you're overengineering.

---

## Definition of Done

The template is complete when:

- [ ] `pnpm start` boots the app
- [ ] Login screen appears if no token
- [ ] Fake login stores token and redirects to home
- [ ] Home screen shows "Welcome" and logout button
- [ ] Logout clears token and redirects to login
- [ ] Lint passes with zero errors
- [ ] TypeScript compiles with zero errors
- [ ] New Architecture enabled (verify in Metro logs)

**Nothing more.**

---

## Usage (Future You)

```
1. Clone the template repo
2. Change app name in app.json
3. Change API base URL
4. Run pnpm start
5. Ship
```

**Time from clone to running app: under 30 minutes.**

---

## Optional Bolt-Ons (Add When Needed)

### Persistence Layer (Offline-First Apps)

**When to add:** Apps that need to work offline, show cached data on cold start, or queue mutations.

**Not needed for:** Always-online dashboards, simple CRUD apps, MVPs where flicker is acceptable.

**What to add:**
| Package | Purpose |
|---------|---------|
| react-native-mmkv | Fast key-value storage (10x faster than AsyncStorage) |
| @tanstack/query-persist-client | Persist React Query cache |

**What it solves:**
- App reloads → cached data shows immediately (no flicker)
- Offline → stale data visible, mutations queued
- Cold start → UI renders with last-known state

**Implementation notes:**
- Create MMKV storage instance in `src/lib/storage.ts`
- Wrap QueryClient with `persistQueryClient`
- Set reasonable `gcTime` (garbage collection) for cached queries
- Auth token stays in SecureStore (encrypted), query cache goes in MMKV (fast)

**Time to add:** ~1-2 hours when needed.

---

## Upcoming (SDK 55 — January 2026)

- React Native 0.83 with React 19.2
- Expo Router v6 with native tabs
- Legacy Architecture fully removed
- Keep template on SDK 54 until SDK 55 stable release

---

## The Hard Question

> When your exam ends, will you ship or will you keep polishing?

If the answer is "polish," you're lying to yourself.

Build boring. Ship fast.