# Pocketify

Pocketify is a starter boilerplate to ship mobile apps fast with **React + Capacitor + shadcn/ui**.

It includes:
- React + Vite + TypeScript
- Capacitor setup for iOS and Android
- Tailwind CSS v4 + shadcn/ui components
- Mobile-first layout with safe-area handling

## Tech Stack

- React 19
- Vite 7
- TypeScript 5
- Capacitor 8
- Tailwind CSS v4
- shadcn/ui

## Prerequisites

- Node.js 20+
- npm
- For iOS development: Xcode (macOS)
- For Android development: Android Studio + Android SDK

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Start the web app:

```bash
npm run dev
```

## Mobile Development

This project already contains `ios/` and `android/` native projects.

### Run Vite for live reload on a real device

```bash
npm run dev:mobile
```

This script exposes Vite on your local network and sets `CAP_SERVER_URL` automatically, so your iOS/Android physical device can use Capacitor live reload.

### Open native projects

```bash
npx cap open ios
npx cap open android
```

### Build and sync web assets to native

Use this before native release/testing with bundled assets:

```bash
npx cap sync
npm run build
```

## Available Scripts

- `npm run dev` - start Vite dev server
- `npm run dev:mobile` - start Vite for Capacitor live reload on a real device
- `npm run build` - build web assets into `dist/`
- `npm run preview` - preview production build
- `npm run lint` - run ESLint

## App Store Links

GitHub Pages publishes the static pages in `docs/` for App Store Connect:

- Privacy Policy: `https://adrienadv.github.io/Pocketify/privacy/`
- Support URL: `https://adrienadv.github.io/Pocketify/support/`

## Project Structure

```text
Pocketify/
├── src/
│   ├── components/        # UI components (including shadcn/ui)
│   ├── layouts/           # App layouts (tab layout)
│   ├── lib/               # Utilities
│   ├── pages/             # App screens
│   ├── app.tsx            # Root app component
│   ├── main.tsx           # Providers + router bootstrap
│   └── router.tsx         # Route definitions
├── android/               # Native Android project
├── ios/                   # Native iOS project
├── scripts/dev-mobile.mjs # Mobile dev server helper
├── capacitor.config.ts    # Capacitor app configuration
```

## Important Config to Update

Before shipping your app, update:

- `capacitor.config.ts`
  - `appId` (currently `com.example.app`)
  - `appName`
- App icons/splash screens in native projects (`ios/` and `android/`)

## Notes

- This boilerplate is mobile-first but can be developed in the browser.
- Safe-area CSS variables are already configured for notch/status-bar devices.
