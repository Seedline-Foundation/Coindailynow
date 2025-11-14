# VS Code TypeScript Server Issue - How to Fix

## Issue
VS Code is showing the error:
```
Cannot find module '@/lib/api-proxy' or its corresponding type declarations.
```

## Why This Happens
This is a VS Code TypeScript language server cache issue. The file `src/lib/api-proxy.ts` exists and is correctly configured, and the build compiles successfully. VS Code just needs to reload its TypeScript server to recognize the new file.

## Solution

### Option 1: Reload TypeScript Server (Recommended)
1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type "TypeScript: Restart TS Server"
3. Press Enter

### Option 2: Reload VS Code Window
1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type "Developer: Reload Window"
3. Press Enter

### Option 3: Close and Reopen VS Code
Simply close VS Code completely and reopen it.

## Verification
After following any of the above solutions:
- The red squiggly lines under `'@/lib/api-proxy'` should disappear
- IntelliSense should work correctly
- No further action is needed

## Technical Details
- The file `frontend/src/lib/api-proxy.ts` exists and exports `createProxyHandler`
- The path alias `@/lib/*` is correctly configured in `tsconfig.json`
- The build compiles successfully (`npm run build` works)
- This is purely a VS Code IntelliSense caching issue

## Confirmation
The build is working correctly - all 175 pages build successfully!
