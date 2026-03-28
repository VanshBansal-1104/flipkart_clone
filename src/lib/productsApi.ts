import type { Product } from "@/data/products";
import { apiUrl } from "@/lib/apiBase";

type ProductsResponse = { products: Product[] };
type ProductResponse = { product: Product };

export async function fetchProducts(params: { search?: string; category?: string }): Promise<Product[]> {
  const sp = new URLSearchParams();
  if (params.search) sp.set("search", params.search);
  if (params.category) sp.set("category", params.category);
  const q = sp.toString();
  const res = await fetch(apiUrl(`/api/products${q ? `?${q}` : ""}`));
  if (!res.ok) throw new Error("Failed to load products");
  const data = (await res.json()) as ProductsResponse;
  return data.products;
}

export async function fetchProduct(id: string): Promise<Product> {
  const res = await fetch(apiUrl(`/api/products/${encodeURIComponent(id)}`));
  if (!res.ok) throw new Error("Product not found");
  const data = (await res.json()) as ProductResponse;
  return data.product;
}
