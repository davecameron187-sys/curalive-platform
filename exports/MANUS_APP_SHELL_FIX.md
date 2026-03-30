# THE PROBLEM IS IN APP.TSX OR MAIN.TSX — NOT SHADOWMODE

You proved it: even a minimal `<h1>TEST</h1>` component at route `/` doesn't render. This means **the entire React app crashes before reaching any route.** The problem is NOT wouter's Router wrapper — wouter does NOT need a Router wrapper. Our Replit production code uses `<Switch>` and `<Route>` directly without any Router wrapper and it works.

**The real problem is one of these (in order of likelihood):**

1. An import in `App.tsx` is failing (one of the 80+ page component imports)
2. A provider in `main.tsx` is crashing (tRPC client, QueryClient)
3. A component wrapping the routes is crashing (ErrorBoundary, ThemeProvider, Toaster, etc.)

---

## FIX: BYPASS EVERYTHING AND TEST PURE REACT

**Do this RIGHT NOW to prove React itself works:**

Open `/client/src/main.tsx` and TEMPORARILY replace the ENTIRE file with:

```tsx
import { createRoot } from "react-dom/client";

function TestApp() {
  return (
    <div style={{ padding: 40, background: "#0a0a0f", color: "white", minHeight: "100vh" }}>
      <h1>REACT IS WORKING</h1>
      <p>If you see this, React renders fine. The problem is in App.tsx.</p>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<TestApp />);
```

Save. Refresh browser.

**RESULT A — You see "REACT IS WORKING":**
- React and Vite are fine. The crash is in App.tsx. Go to STEP 2.

**RESULT B — Still blank:**
- Check `index.html` has `<div id="root"></div>` in the body
- Check the **Vite dev server terminal** for any red errors
- Check browser console (F12) for any errors

---

## STEP 2: ADD BACK PROVIDERS ONE AT A TIME

Once "REACT IS WORKING" shows, add back the providers from main.tsx one at a time:

### 2A: Add tRPC + QueryClient

```tsx
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "./lib/trpc";
import superjson from "superjson";

const queryClient = new QueryClient();

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
    }),
  ],
});

function TestApp() {
  return (
    <div style={{ padding: 40, background: "#0a0a0f", color: "white", minHeight: "100vh" }}>
      <h1>TRPC + REACT IS WORKING</h1>
      <p>Providers loaded successfully.</p>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <TestApp />
    </QueryClientProvider>
  </trpc.Provider>
);
```

**If this FAILS:** The problem is in your tRPC client setup. Check:
- Is `@trpc/client` installed? Run: `pnpm list @trpc/client`
- Is `@tanstack/react-query` installed? Run: `pnpm list @tanstack/react-query`
- Is `superjson` installed? Run: `pnpm list superjson`
- Does `./lib/trpc.ts` exist and export `trpc`?
- Does `./lib/trpc.ts` import the correct `AppRouter` type from your server?

**If this WORKS:** Go to 2B.

### 2B: Add wouter routing

```tsx
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "./lib/trpc";
import superjson from "superjson";
import { Route, Switch } from "wouter";

const queryClient = new QueryClient();

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
    }),
  ],
});

function HomePage() {
  return (
    <div style={{ padding: 40, background: "#0a0a0f", color: "white", minHeight: "100vh" }}>
      <h1>ROUTING IS WORKING</h1>
      <p>wouter Switch + Route at "/" renders correctly.</p>
    </div>
  );
}

function TestApp() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
    </Switch>
  );
}

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <TestApp />
    </QueryClientProvider>
  </trpc.Provider>
);
```

**If this FAILS:** The problem is in wouter. Check:
- Is `wouter` installed? Run: `pnpm list wouter`
- What version? Run: `pnpm list wouter` — if version 3.x, `Switch` was renamed to `Router` in some builds. Try importing `Router` instead of `Switch`.

**If this WORKS:** Go to 2C.

### 2C: Add App.tsx back

Restore your original main.tsx. Now the crash is somewhere in App.tsx. Open App.tsx and:

1. **Comment out ALL page imports** — every single `import XyzPage from "./pages/XyzPage"` line
2. **Comment out ALL routes** inside the Switch except the ShadowMode route
3. Keep only:

```tsx
import { Route, Switch } from "wouter";
import ShadowMode from "./pages/ShadowMode";

function Router() {
  return (
    <Switch>
      <Route path="/" component={ShadowMode} />
    </Switch>
  );
}

function App() {
  return <Router />;
}

export default App;
```

**If this WORKS:** The crash is in one of the other page imports or wrapper components (ErrorBoundary, ThemeProvider, Toaster, TooltipProvider). Add them back one at a time until it breaks.

**If this FAILS:** The crash is in ShadowMode.tsx itself. But we know the minimal version doesn't work either, so if you're still using the minimal version from Step 1 and it STILL fails here, the issue is the import path. Check:
- Does the file exist at `./pages/ShadowMode.tsx`?
- Try: `import ShadowMode from "../pages/ShadowMode"` (different relative path)
- Check the Vite dev server terminal for the exact import error

---

## STEP 3: REPORT WHAT YOU FIND

After each step above, report EXACTLY:
- What you see in the browser
- What you see in the browser console (F12 → Console)
- What you see in the dev server terminal

**Do not theorize. Do not write hypotheses. Just report what you see.**

---

## IMPORTANT: WOUTER DOES NOT NEED A ROUTER WRAPPER

Your hypothesis about needing a Router wrapper is **wrong**. Wouter v2 and v3 work without any wrapper. Our production Replit code uses this exact pattern — no Router wrapper:

```tsx
import { Route, Switch } from "wouter";

// This works. No Router wrapper needed.
<Switch>
  <Route path="/" component={ShadowMode} />
</Switch>
```

**Do NOT add a Router wrapper.** It's not the issue.

---

## THE FASTEST PATH TO RESOLUTION

1. Replace main.tsx with the pure React test (Step 1 above) — **30 seconds**
2. If it works, add providers back one at a time — **2 minutes each**
3. The step that breaks tells you exactly what's wrong
4. Fix that one thing
5. Done

**Execute now. Report what you see at each step.**
