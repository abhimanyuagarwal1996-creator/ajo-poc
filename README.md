# AJO Server-Side Experience Decisioning POC (Next.js)

Small Proof of Concept (POC) website that simulates **Adobe Journey Optimizer (AJO) Server-Side Experience Decisioning**:

- **Server-side offer fetch** (mocked) based on a selected user profile
- **Server-rendered HTML** with the offer embedded before the page loads
- **Client-side interactions** (view/click/dismiss/conversion) sent back to the server via an API route

## Tech stack

- Next.js (App Router, Server Components)
- Tailwind CSS
- No database (mock services only)

## Pages

- **`/`**: Landing page with a dummy “login” (User A/User B selector)
- **`/offers`**: **Server Component** that fetches personalized offers on the server before rendering
- **`/success`**: Confirmation page that sends a mock “conversion” event

## Mock AJO integration

- **`src/lib/ajo-decisioning.ts`**
  - `fetchOffers(userId)`: simulates a server-to-server request returning offer JSON
  - `sendExperienceEvent(eventId, trackingToken, action)`: simulates sending metrics back to AJO (logged on the server)

## Folder structure (key files)

```text
ajo-poc/
  src/
    app/
      api/
        select-user/route.ts   # sets user cookie and redirects to /offers
        track/route.ts         # receives view/click/dismiss/conversion events
      offers/
        offer-card.tsx         # client component: buttons + view event
        page.tsx               # server component: fetch + render offer
      success/
        success-client.tsx     # client component: conversion event
        page.tsx
      layout.tsx
      page.tsx
    lib/
      ajo-decisioning.ts       # mock AJO decisioning + tracking
```

## Run locally

1) Install dependencies

```bash
npm install
```

2) Start the dev server

```bash
npm run dev
```

3) Open the app

- `http://localhost:3000`

## How to demo the flow

1) Go to **Home** (`/`) and click **Continue as User A** or **User B**
2) You’ll land on **`/offers`** where the offer is already server-rendered
3) On the offer card:
   - **Interested** → sends a **click** event, then navigates to **`/success`**
   - **Dismiss** → sends a **dismiss** event, then returns to **`/`**
4) `\/success` sends a **conversion** event on load

Server logs will show the mocked “AJO event” payloads.

## Deploy for free on Vercel (recommended)

Because this POC uses server-side rendering and API routes, deploy it on Vercel (GitHub Pages won’t support SSR).

1) Create a GitHub repo and push this folder (`ajo-poc/`)
2) Go to Vercel and click **Add New → Project**
3) Import your repo
4) Vercel should auto-detect Next.js
   - **Build Command**: `npm run build`
   - **Output**: default (do not set a static output)
5) Click **Deploy**

That’s it—Vercel will host the app with SSR + API routes working.
