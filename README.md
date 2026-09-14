# HRM Mobile

Mobile application for the HRM system, built with Expo, React Native, and TypeScript.

## Requirements

- Node.js 20 or newer
- npm
- Expo Go installed on a physical iOS or Android device, or an Android/iOS simulator
- Git

## Setup

Clone the repository and move into the mobile folder:

```bash
git clone https://github.com/hungvult/HRM-mobile.git
cd HRM-mobile
```

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Update `.env` with the backend API URL:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
```

For a physical device, replace `localhost` with your computer's LAN IP address so the device can reach the backend.

## Run Locally

Start the Expo development server:

```bash
npm start
```

Start with a tunnel:

```bash
npm run dev
```

Run on Android:

```bash
npm run android
```

Run on iOS:

```bash
npm run ios
```

Run in a browser:

```bash
npm run web
```

## TypeScript

Check TypeScript configuration with:

```bash
npx tsc --noEmit
```

## Project Structure

```text
App.tsx
index.ts
src/
  components/
  constants/
  hooks/
  navigation/
  screens/
  services/
  types/
assets/
```

## Environment Variables

| Name | Description | Example |
| --- | --- | --- |
| `EXPO_PUBLIC_API_URL` | Backend API base URL used by the mobile app | `http://localhost:3000/api/v1` |

## Troubleshooting

- If Expo Go cannot connect, use `npm run dev` to start with a tunnel.
- If a physical device cannot call the API, replace `localhost` with your computer's LAN IP address.
- If packages fail to install, delete `node_modules` and run `npm install` again.
