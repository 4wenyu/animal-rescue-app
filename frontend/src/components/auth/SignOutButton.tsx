/**
 * SignOutButton — explicit, highly-visible auth terminus.
 * ======================================================
 * Closes a session via next-auth/react's `signOut()` and bounces the
 * user back to /login (with `callbackUrl=/login` so they re-land cleanly
 * if they were redirected mid-flight).
 *
 * Two variants:
 *   - <SignOutButton />          → solid red, dropdown-style, prominent
 *   - <SignOutButton variant="icon" /> → minimal icon-only for header bars
 *
 * Both variants use `useTransition` so the click feels instant and the
 * button can be disabled while the signOut() promise resolves (avoids
 * a momentary "double-click" race).
 */

"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, Loader2 } from "lucide-react";

export type SignOutButtonVariant = "primary" | "ghost" | "icon";

export interface SignOutButtonProps {
  variant?: SignOutButtonVariant;
  /** Override destination — defaults to /login. */
  callbackUrl?: string;
  /** Optional className passthrough for layout sizing. */
  className?: string;
}

export function SignOutButton({
  variant = "primary",
  callbackUrl = "/login",
  className = "",
}: SignOutButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      // signOut() either redirects (if `redirect: true` and `callbackUrl`
      // set, default behavior) or returns a promise. We use redirect
      // semantics so the cookie is nulled server-side and we land on
      // /login naturally.
      await signOut({ callbackUrl });
      // Belt-and-suspenders: explicit router push in case signOut's
      // client redirect was swallowed by a stale module.
      router.push(callbackUrl);
      router.refresh();
    });
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-label="Sign Out"
        title="Sign Out"
        className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition-all hover:bg-rose-100 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LogOut className="h-4 w-4" />
        )}
      </button>
    );
  }

  if (variant === "ghost") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold text-rose-600 transition-all hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        {pending ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Signing Out…
          </>
        ) : (
          <>
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </>
        )}
      </button>
    );
  }

  // default: prominent solid-rose pill
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={`inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition-all duration-200 hover:from-rose-500 hover:to-red-400 hover:shadow-rose-500/35 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Signing Out…
        </>
      ) : (
        <>
          <LogOut className="h-4 w-4" />
          Sign Out
        </>
      )}
    </button>
  );
}

export default SignOutButton;