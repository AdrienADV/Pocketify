# Pocketify

Pocketify is an **open-source mobile app** built to manage Coolify from your phone.

> "Coolify in your pocket"

The app connects to the Coolify API (Cloud or self-hosted) using a personal API token, so you can monitor and manage your resources directly on iOS and Android.

## What Pocketify is

Pocketify is the community-driven mobile app for Coolify, designed for real daily usage.

Today, the project already includes:

- connection to **Coolify Cloud** (`app.coolify.io`) or a **self-hosted** instance;
- authentication with an **API Token**;
- native mobile navigation powered by Capacitor;
- dedicated views for applications, services, databases, servers, deployments, and logs.

## Tech stack

- **React 19** + **TypeScript**
- **Vite** (web build)
- **Capacitor 8** (native iOS/Android container)
- **React Router 7**
- **TanStack React Query**
- **openapi-fetch** + **openapi-react-query** (typed API client)
- **Tailwind CSS v4** + UI components

## Open-source philosophy

Pocketify is developed as open source:

- public source code;
- external contributions are welcome;
- maintainable architecture to make future improvements easier.

If you use Coolify, you can audit the code, propose improvements, and adapt the app to your own needs.

## Prerequisites

- Node.js 20+
- bun
- iOS: Xcode (macOS)
- Android: Android Studio + Android SDK

## Quick start

1. Install dependencies:

```bash
bun install
```

2. Start the web app locally:

```bash
bun run dev
```

## Mobile development (Capacitor)

The repository already contains native `ios/` and `android/` projects.

### Live reload on a physical device

```bash
bun run dev:mobile
```

This command exposes Vite on your local network and configures the server URL for native apps.

### Open native projects

```bash
npx cap open ios
npx cap open android
```

### Build and sync web assets

```bash
bun run sync
```

## Useful scripts

- `bun run dev`: start Vite
- `bun run dev:mobile`: start mobile live-reload mode
- `bun run build`: build production web assets
- `bun run sync`: build + Capacitor sync
- `bun run preview`: preview production build
- `bun run lint`: run ESLint
- `bun run typecheck`: run TypeScript checks

## Coolify API configuration

Pocketify uses Coolify API v1.

- default API URL via `VITE_COOLIFY_API_URL`
- token stored locally on the device
- support for custom self-hosted URL (normalized with `/api/v1`)

To connect successfully, the token must include the permissions shown in the app onboarding flow.

## App Store Connect links (GitHub Pages)

Static pages inside `docs/` are used for App Store metadata:

- Privacy Policy: `https://adrienadv.github.io/Pocketify/privacy/`
- Support URL: `https://adrienadv.github.io/Pocketify/support/`
- Marketing URL: `https://adrienadv.github.io/Pocketify/marketing/`

## Project structure

```text
Pocketify/
├── src/
│   ├── components/        # UI components
│   ├── layouts/           # Navigation layouts
│   ├── lib/               # Auth, API client, utilities
│   ├── pages/             # App screens
│   ├── app.tsx            # Root component
│   ├── main.tsx           # Providers + bootstrap
│   └── router.tsx         # Routes
├── ios/                   # Native iOS project
├── android/               # Native Android project
├── docs/                  # Published legal/marketing pages
├── capacitor.config.ts    # Capacitor configuration
└── package.json
```

## Contributing

1. Fork + feature branch
2. Develop + run local checks
3. Open a Pull Request with a clear description

Issues and PRs are welcome to improve the mobile experience around Coolify.
