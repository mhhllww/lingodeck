# Agent Prompt: LingoDeck — User Account Menu in Header

## Context

Auth system is fully implemented. Users can register, login, and their session is restored via `AuthProvider` on app load. The `useAuth()` hook returns `{ user, isAuthenticated, logout }`.

**One thing is missing:** there is no UI to see current account info or log out. Fix that.

---

## Task

Add a **user dropdown menu** to the existing `Header.tsx` component. No new files needed — everything goes into the header.

---

## What to Build

A small avatar button in the top-right of the header (next to `ThemeToggle`). On click — a dropdown appears with:

1. User's name (bold)
2. User's email (muted, smaller)
3. Divider
4. "Log out" button

```
[LingoDeck logo]         [ThemeToggle]  [Avatar ▾]
                                        ┌──────────────────┐
                                        │ Danil            │  ← user.name, font-medium
                                        │ danil@mail.com   │  ← user.email, text-muted
                                        ├──────────────────┤
                                        │ 🚪  Log out      │  ← destructive color on hover
                                        └──────────────────┘
```

---

## Implementation

### Component: use shadcn/ui `DropdownMenu`

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
```

### Avatar Button (trigger)

- If `user.avatarUrl` exists → show `<img>` with it (Google OAuth users will have a photo)
- Otherwise → show a circle with the **first letter** of `user.name`, uppercase
- Size: `h-8 w-8`, rounded-full
- Subtle border: `border border-border`

```tsx
<DropdownMenuTrigger asChild>
  <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
    {user.avatarUrl ? (
      <img src={user.avatarUrl} alt={user.name} className="h-8 w-8 rounded-full object-cover" />
    ) : (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
        {user.name.charAt(0).toUpperCase()}
      </span>
    )}
  </Button>
</DropdownMenuTrigger>
```

### Dropdown Content

```tsx
<DropdownMenuContent align="end" className="w-48">
  <DropdownMenuLabel className="font-normal">
    <div className="flex flex-col gap-0.5">
      <span className="font-medium">{user.name}</span>
      <span className="text-xs text-muted-foreground truncate">{user.email}</span>
    </div>
  </DropdownMenuLabel>
  <DropdownMenuSeparator />
  <DropdownMenuItem
    onClick={handleLogout}
    className="text-destructive focus:text-destructive gap-2 cursor-pointer"
  >
    <LogOut className="h-4 w-4" />
    Log out
  </DropdownMenuItem>
</DropdownMenuContent>
```

### Logout Handler

```tsx
const { user, logout } = useAuth();

const handleLogout = async () => {
  await logout();
  // useAuth's logout already redirects to /login
};
```

### Conditional Render

Only show the avatar menu when `isAuthenticated`. On auth pages (`/login`, `/register`) the header is not shown at all (separate layout), so no extra guards needed.

```tsx
{isAuthenticated && user && (
  <DropdownMenu>
    ...
  </DropdownMenu>
)}
```

---

## Constraints

- **Edit only `Header.tsx`** — no new files
- **No new dependencies** — `DropdownMenu` is already in shadcn/ui, `LogOut` is in lucide-react
- Keep `ThemeToggle` in place — avatar goes to the right of it
- Do not touch sidebar, layout, or any other component
