

## Diagnosis

Your `vite.config.ts` (lines 94-106) **already contains** the correct `NetworkOnly` rule for Supabase:

```ts
{
  urlPattern: /^https:\/\/[^/]*\.supabase\.co\/.*/i,
  handler: 'NetworkOnly',
},
```

There are two separate issues:

1. **"transient infra error... 503"** -- This is a Lovable sandbox infrastructure error, not a code issue. It means the preview sandbox couldn't start. This resolves by retrying (refresh the preview or wait).

2. **"FetchEvent... the promise was rejected"** -- An **old service worker** (built before the NetworkOnly rule was added) is still active in the browser. The new config is correct but hasn't been deployed to replace the cached SW yet.

## Plan (2 changes)

### Step 1: Force old service workers to unregister in preview/iframe contexts

Add a guard in `src/main.tsx` (before React renders) that unregisters stale service workers when running in the Lovable preview or in an iframe. This prevents the old cached SW from intercepting requests.

```ts
// At top of src/main.tsx, before createRoot
const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

if (isPreviewHost || isInIframe) {
  navigator.serviceWorker?.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
}
```

### Step 2: Add `devOptions: { enabled: false }` to VitePWA config

In `vite.config.ts`, add `devOptions: { enabled: false }` inside the `VitePWA({...})` block so the service worker never activates during development previews. This is a one-line addition.

---

These two changes ensure old SWs are cleaned up and new ones don't interfere during development. The Supabase NetworkOnly rule is already correct and will work once the fresh SW is deployed.

