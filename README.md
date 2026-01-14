# @kritix/create-rn-app

CLI to scaffold React Native apps with optional Firebase and Superwall integration.

## Usage

```bash
npx @kritix/create-rn-app
```

Or install globally:

```bash
npm install -g @kritix/create-rn-app
create-rn-app
```

## Features

### Base Template
- Expo SDK 54 with React Native 0.81
- TypeScript
- Expo Router (file-based routing)
- Zustand v5 (state management)
- TanStack Query v5 (server state)
- Axios (HTTP client with interceptors)
- SecureStore (token storage)
- ESLint + Prettier

### Optional: Firebase
- Firebase Auth
- Firestore
- Analytics
- Pre-configured hooks

### Optional: Superwall
- Paywall integration
- In-App Purchases
- Subscription management hook

## Interactive Prompts

```
◆ What is your project name?
│ my-awesome-app
│
◆ Add Firebase? (Auth, Firestore, Analytics)
│ ● Yes / ○ No
│
◆ Add Superwall? (Paywalls + In-App Purchases)
│ ○ Yes / ● No
```

## After Creation

```bash
cd my-awesome-app
pnpm start
```

## Configuration

### Firebase
Edit `src/lib/firebase.ts` with your Firebase config.

### Superwall
Edit `src/lib/superwall.ts` with your Superwall API key.

## License

MIT
