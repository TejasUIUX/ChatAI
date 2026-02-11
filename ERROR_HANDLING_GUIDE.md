# Error Handling & Debugging Guide

This guide will help you catch and fix errors faster during development.

## Why Errors Show Up Now (vs. Blank Screen Before)

**You have an ErrorBoundary component** (`src/components/ErrorBoundary.tsx`) that catches React errors and displays them nicely. This is why you saw:

> "Something went wrong. Failed to execute 'setItem' on 'Storage': Setting the value of 'chatSessions' exceeded the quota."

Without the ErrorBoundary, you'd just see a blank screen!

---

## 🚀 Tips for Faster Error Debugging

### 1. Always Keep Browser Console Open

**Shortcut**: `F12` or `Ctrl+Shift+I` (Windows)

- The ErrorBoundary logs detailed error info to the console (lines 23-28 in ErrorBoundary.tsx)
- You'll see error messages, stack traces, and component stacks
- localStorage errors, network failures, and API issues all show up here

### 2. Enable React DevTools

Install the [React Developer Tools](https://react.dev/learn/react-developer-tools) browser extension:
- Chrome: https://chrome.google.com/webstore (search "React Developer Tools")
- Firefox: https://addons.mozilla.org/en-US/firefox/addon/react-devtools/

**Benefits**:
- Inspect component state and props
- See which component is causing errors
- Track re-renders and performance issues

### 3. Improve Error Logging in Development

Add better error logging to catch issues earlier:

```typescript
// Add to src/main.tsx at the top, after imports:

if (import.meta.env.DEV) {
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        console.error('🚨 Unhandled Promise Rejection:', event.reason);
    });

    // Catch global errors
    window.addEventListener('error', (event) => {
        console.error('🚨 Global Error:', event.error);
    });

    // Log localStorage usage (to catch quota issues early)
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
        try {
            originalSetItem.apply(this, [key, value]);
            const size = new Blob([value]).size;
            console.log(`📦 localStorage.setItem("${key}") - Size: ${(size / 1024).toFixed(2)} KB`);
        } catch (e) {
            console.error(`❌ localStorage.setItem("${key}") FAILED:`, e);
            throw e;
        }
    };
}
```

### 4. Add TypeScript Strict Mode

Update `tsconfig.json` to catch errors at compile time:

```json
{
  "compilerOptions": {
    "strict": true,           // Enable all strict checks
    "noUnusedLocals": true,   // Flag unused variables
    "noUnusedParameters": true,
    "noImplicitReturns": true
  }
}
```

### 5. Use Vite's Error Overlay

Vite automatically shows errors in the browser during development. Make sure you're running:

```bash
npm run dev
```

Not `npm run build` or `npm run preview` (production mode hides some errors).

### 6. Add Error Monitoring for Specific Areas

For critical operations (like API calls), add try-catch with detailed logging:

```typescript
try {
    const response = await fetch(url);
    // ...
} catch (error) {
    console.error('❌ API Error:', {
        url,
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
    });
    throw error; // Re-throw so ErrorBoundary can catch it
}
```

### 7. Browser Storage Debugging

Check localStorage/sessionStorage usage:

**In Browser Console**:
```javascript
// See all localStorage keys and their sizes
Object.keys(localStorage).forEach(key => {
    const size = new Blob([localStorage.getItem(key)]).size;
    console.log(`${key}: ${(size / 1024).toFixed(2)} KB`);
});

// Check total localStorage usage
const totalSize = Object.keys(localStorage).reduce((total, key) => {
    return total + new Blob([localStorage.getItem(key)]).size;
}, 0);
console.log(`Total: ${(totalSize / 1024).toFixed(2)} KB / ~5000 KB limit`);
```

---

## 🛠️ Quick Debugging Checklist

When you encounter an error:

- [ ] **Check browser console** (F12) - read the full error message and stack trace
- [ ] **Check the Network tab** - see if API calls are failing
- [ ] **Check the Application/Storage tab** - inspect localStorage, sessionStorage, cookies
- [ ] **Reproduce the error** - try to trigger it again to understand the pattern
- [ ] **Check recent changes** - what code did you modify before the error appeared?
- [ ] **Use React DevTools** - inspect component state when the error occurs
- [ ] **Add console.logs** - strategically log values before the error point
- [ ] **Check the ErrorBoundary logs** - detailed component stack trace

---

## 🔧 Common Errors & Quick Fixes

### Blank Screen (No Error Message)

**Causes**:
- Syntax error in a component (check console)
- Import path wrong
- Component not wrapped in ErrorBoundary

**Fix**: Make sure all main components are wrapped in ErrorBoundary (already done in App.tsx)

### "Cannot read property of undefined"

**Cause**: Trying to access a property on null/undefined

**Fix**: Use optional chaining:
```typescript
// ❌ Bad
const title = session.messages[0].content;

// ✅ Good
const title = session?.messages?.[0]?.content ?? 'Default';
```

### localStorage Quota Exceeded

**Cause**: Storing too much data (images, large files)

**Fix**: Filter large data before storage (already implemented in App.tsx)

### API/Network Errors

**Causes**: Invalid API key, CORS issues, network offline

**Fix**: Check Network tab in DevTools, verify API key in .env file

---

## 📊 Monitoring localStorage Usage (Bonus)

You can add a localStorage monitor to your app:

```typescript
// Add to App.tsx or a utility file
export const getLocalStorageStats = () => {
    const stats = Object.keys(localStorage).map(key => {
        const value = localStorage.getItem(key) || '';
        const size = new Blob([value]).size;
        return { key, size };
    });
    
    const total = stats.reduce((sum, s) => sum + s.size, 0);
    const quota = 5 * 1024 * 1024; // ~5MB typical limit
    
    console.table(stats);
    console.log(`Total: ${(total / 1024).toFixed(2)} KB / ${(quota / 1024).toFixed(2)} KB`);
    console.log(`Usage: ${((total / quota) * 100).toFixed(1)}%`);
};

// Call it occasionally in development
if (import.meta.env.DEV) {
    (window as any).storageStats = getLocalStorageStats;
    console.log('💡 Tip: Run storageStats() in console to check localStorage usage');
}
```

---

## Summary

**To debug errors faster in the future:**

1. ✅ Keep browser console open (F12)
2. ✅ Install React DevTools
3. ✅ Run in dev mode (`npm run dev`)
4. ✅ Add detailed error logging (see section 3)
5. ✅ Use TypeScript strict mode
6. ✅ Check localStorage usage regularly

**Your ErrorBoundary is already working great** - it's the reason you saw a helpful error message instead of a blank screen this time! 🎉
