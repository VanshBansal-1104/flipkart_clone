import type { ShippingAddress } from "@/store/useStore";
import { apiUrl } from "@/lib/apiBase";

export type AuthUser = {
  id: number;
  email: string;
  name: string | null;
  savedAddress: ShippingAddress | null;
};

export async function apiLogin(email: string, password: string) {
  const res = await fetch(apiUrl("/api/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || "Login failed");
  }
  return data as { token: string; user: AuthUser };
}

export async function apiRegister(email: string, password: string, name?: string) {
  const res = await fetch(apiUrl("/api/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || "Registration failed");
  }
  return data as { token: string; user: AuthUser };
}

export async function fetchMe(token: string): Promise<AuthUser> {
  const res = await fetch(apiUrl("/api/auth/me"), {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || "Failed to load profile");
  }
  return (data as { user: AuthUser }).user;
}

export async function saveMyAddress(token: string, address: ShippingAddress): Promise<AuthUser> {
  const res = await fetch(apiUrl("/api/auth/me/address"), {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(address),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || "Could not save address");
  }
  return (data as { user: AuthUser }).user;
}
