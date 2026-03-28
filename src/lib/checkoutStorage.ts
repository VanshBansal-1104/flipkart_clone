import type { ShippingAddress } from "@/store/useStore";
import type { AuthUser } from "@/lib/authApi";

const KEY = "fk-delivery-address";

/**
 * Address used at checkout: account `savedAddress` when complete; else session draft
 * (same browser). Header / cart “saved address” UI still uses only `user.savedAddress`.
 */
export function getEffectiveCheckoutAddress(
  token: string | null,
  user: AuthUser | null,
): ShippingAddress | null {
  const session = getStoredAddress();
  const complete = (p: ShippingAddress | null | undefined) =>
    !!(p?.fullName && p?.phone && p?.pincode && p?.address && p?.city && p?.state);

  if (token && user) {
    if (complete(user.savedAddress)) return user.savedAddress!;
    if (complete(session)) return session!;
    return null;
  }
  return session;
}

/** Use for primary “go to checkout” links so users with a saved DB (or session) address skip re-entering it. */
export function checkoutHref(token: string | null, user: AuthUser | null): string {
  const step = getEffectiveCheckoutAddress(token, user) ? "summary" : "address";
  return `/checkout?step=${step}`;
}

export function formatAddressSnippet(a: ShippingAddress): string {
  const line = [a.address, a.city, a.state, a.pincode].filter(Boolean).join(", ");
  return line.length > 48 ? `${line.slice(0, 45)}…` : line;
}

export function getStoredAddress(): ShippingAddress | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as ShippingAddress;
    if (p?.fullName && p?.phone && p?.pincode && p?.address && p?.city && p?.state) return p;
    return null;
  } catch {
    return null;
  }
}

export function setStoredAddress(a: ShippingAddress) {
  sessionStorage.setItem(KEY, JSON.stringify(a));
}

export function clearStoredAddress() {
  sessionStorage.removeItem(KEY);
}
