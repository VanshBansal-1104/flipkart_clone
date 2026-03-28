import { apiUrl } from "@/lib/apiBase";

export type ApiOrderItem = {
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
  };
  quantity: number;
};

export type ApiOrder = {
  id: string;
  total: number;
  date: string;
  address: Record<string, string>;
  items: ApiOrderItem[];
};

export async function fetchOrders(token: string): Promise<ApiOrder[]> {
  const res = await fetch(apiUrl("/api/orders"), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to load orders");
  const data = (await res.json()) as { orders: ApiOrder[] };
  return data.orders;
}
