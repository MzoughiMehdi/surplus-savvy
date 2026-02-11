

# Fix: Admin access race condition

## Problem

`AdminLayout` redirects to `/` when `!loading && !isAdmin`. However, `loading` (auth session) resolves before `profileLoading` (role fetch) completes. This causes the admin to be redirected before `isAdmin` becomes `true`.

## Solution

Update `AdminLayout` to also check `profileLoading` before making the redirect decision.

### File: `src/pages/admin/AdminLayout.tsx`

**Change 1** - Import `profileLoading` from useAuth (line 31):

```typescript
const { user, isAdmin, loading, profileLoading, signOut } = useAuth();
```

**Change 2** - Update the useEffect guard (lines 35-39):

```typescript
useEffect(() => {
  if (!loading && !profileLoading && (!user || !isAdmin)) {
    navigate("/");
  }
}, [user, isAdmin, loading, profileLoading, navigate]);
```

**Change 3** - Update the loading check (lines 41-47):

```typescript
if (loading || profileLoading) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-muted-foreground">Chargement...</p>
    </div>
  );
}
```

This ensures AdminLayout waits for both the auth session AND the profile/role fetch to complete before deciding whether to redirect or render.

## Files modified

| File | Change |
|------|--------|
| `src/pages/admin/AdminLayout.tsx` | Add `profileLoading` to guard logic (3 small edits) |

No other changes needed.

