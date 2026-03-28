import { useSearchParams, Link } from "react-router-dom";
import { products as fallbackProducts, categories } from "@/data/products";
import ProductCard from "@/components/ProductCard";
import Header from "@/components/Header";
import CategoryBar from "@/components/CategoryBar";
import Hero from "@/components/Hero";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "@/lib/productsApi";
import { SlidersHorizontal, X, ChevronDown, ChevronRight } from "lucide-react";
import type { Product } from "@/data/products";

type SortOption = "relevance" | "price-low" | "price-high" | "rating" | "discount";

const sortLabels: Record<SortOption, string> = {
  relevance: "Relevance",
  "price-low": "Price: Low to High",
  "price-high": "Price: High to Low",
  rating: "Rating",
  discount: "Discount",
};

async function loadProducts(params: { search?: string; category?: string }) {
  try {
    return await fetchProducts(params);
  } catch {
    return fallbackProducts.filter((p) => {
      const s = params.search?.toLowerCase() ?? "";
      const matchSearch =
        !s || p.name.toLowerCase().includes(s) || p.brand.toLowerCase().includes(s);
      const matchCat = !params.category || p.category === params.category;
      return matchSearch && matchCat;
    });
  }
}

function sortProducts(list: Product[], sortBy: SortOption) {
  const copy = [...list];
  switch (sortBy) {
    case "price-low":
      return copy.sort((a, b) => a.price - b.price);
    case "price-high":
      return copy.sort((a, b) => b.price - a.price);
    case "rating":
      return copy.sort((a, b) => b.rating - a.rating);
    case "discount":
      return copy.sort((a, b) => b.discount - a.discount);
    default:
      return copy;
  }
}

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const categoryParam = searchParams.get("category") || "";
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [showFilters, setShowFilters] = useState(false);

  const isHomePage = !searchQuery && !categoryParam;

  const { data: homeCatalog = [], isLoading: homeLoading } = useQuery({
    queryKey: ["products", "catalog"],
    queryFn: () => loadProducts({}),
    enabled: isHomePage,
  });

  const { data: listCatalog = [], isLoading: listLoading } = useQuery({
    queryKey: ["products", "list", searchQuery, categoryParam],
    queryFn: () =>
      loadProducts({
        search: searchQuery || undefined,
        category: categoryParam || undefined,
      }),
    enabled: !isHomePage,
  });

  const filtered = useMemo(
    () => sortProducts(isHomePage ? homeCatalog : listCatalog, sortBy),
    [isHomePage, homeCatalog, listCatalog, sortBy],
  );

  if (isHomePage) {
    const sections = [
      { title: "Best Sellers in Electronics", cat: "Mobiles" },
      { title: "Trending in Fashion", cat: "Fashion" },
      { title: "Home & Kitchen Deals", cat: "Home & Furniture" },
      { title: "Must-Read Books", cat: "Books" },
      { title: "Beauty & Personal Care", cat: "Beauty & Health" },
    ];

    const deals = [
      { title: "Men's Clothing", link: "?category=Fashion", emoji: "👔" },
      { title: "Women's Ethnic Sets", link: "?category=Fashion", emoji: "👗" },
      { title: "Jeans & Trousers", link: "?category=Fashion", emoji: "👖" },
      { title: "Jewelry", link: "?category=Fashion", emoji: "💍" },
      { title: "Watches", link: "?category=Fashion", emoji: "⌚" },
    ];

    const hotPick = homeCatalog[0];
    const suggested = homeCatalog.slice(0, 12);

    return (
      <div className="min-h-screen bg-white">
        <Header />
        <CategoryBar />

        <Hero />

        {/* Today's Hot Pick — wide single promo card */}
        <div className="max-w-[1280px] mx-auto px-3 sm:px-4 py-4">
          <h2 className="text-lg font-bold text-[#212121] mb-3">Today&apos;s Hot Pick</h2>
          {homeLoading ? (
            <div className="rounded-2xl bg-[#f5f5f5] h-40 animate-pulse" />
          ) : hotPick ? (
            <Link
              to={`/product/${hotPick.id}`}
              className="relative block rounded-2xl overflow-hidden bg-gradient-to-r from-[#e3f2fd] to-[#fafafa] border border-[#e8e8e8] shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow"
            >
              <span className="absolute top-3 right-3 z-10 text-[10px] font-bold text-[#878787] bg-white/95 px-2 py-0.5 rounded border border-[#e0e0e0]">
                AD
              </span>
              <div className="flex flex-col sm:flex-row items-center gap-4 p-5 sm:p-8">
                <div className="flex-1 text-center sm:text-left min-w-0">
                  <p className="text-xs font-bold text-[#2874f0] tracking-wide mb-1">{hotPick.brand}</p>
                  <p className="text-lg sm:text-2xl font-bold text-[#212121] line-clamp-2 leading-tight">{hotPick.name}</p>
                  <p className="text-sm text-[#388e3c] font-semibold mt-2">
                    From {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(hotPick.price)}*
                  </p>
                  <p className="text-xs text-[#878787] mt-1">Segment&apos;s best · Limited time</p>
                </div>
                <div className="w-full sm:w-[220px] h-[160px] sm:h-[140px] flex items-center justify-center flex-shrink-0">
                  <img src={hotPick.images[0]} alt="" className="max-h-full max-w-full object-contain drop-shadow-md" />
                </div>
              </div>
            </Link>
          ) : null}
        </div>

        {/* Suggested for you — horizontal scroll */}
        <div className="max-w-[1280px] mx-auto px-3 sm:px-4 pb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-[#212121]">Suggested for you</h2>
            <Link
              to="/?category=Mobiles"
              className="w-9 h-9 rounded-full bg-[#2874f0] text-white flex items-center justify-center shadow-md hover:bg-[#1c5fd4] transition-colors"
              aria-label="View more"
            >
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
          {homeLoading ? (
            <p className="text-sm text-[#878787]">Loading…</p>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
              {suggested.map((product) => (
                <div key={product.id} className="min-w-[160px] sm:min-w-[180px] flex-shrink-0">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's Deals */}
        <div className="max-w-[1300px] mx-auto px-4 py-2 bg-[#f1f3f6]">
          <div className="mb-4">
            <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#e8e8e8]">
                <h2 className="text-lg sm:text-xl font-semibold text-[#212121] tracking-tight">Today&apos;s top deals</h2>
                <button
                  type="button"
                  className="text-[#2874f0] text-sm font-semibold hover:underline flex items-center gap-0.5"
                >
                  View All
                  <span aria-hidden>›</span>
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {deals.map((deal, index) => (
                  <Link
                    key={index}
                    to={deal.link}
                    className="rounded-xl bg-[#f8f9fa] p-3 text-center hover:bg-[#f0f2f5] transition-colors border border-[#eee]"
                  >
                    <div className="w-14 h-14 mx-auto rounded-full bg-white flex items-center justify-center text-2xl mb-2 shadow-sm border border-[#e8e8e8]">
                      {deal.emoji}
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-[#212121] leading-snug">{deal.title}</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Featured Sections */}
        <div className="max-w-[1300px] mx-auto px-4 pb-8 bg-[#f1f3f6]">
          {sections.map((section) => {
            const sectionProducts = homeCatalog.filter((p) => p.category === section.cat).slice(0, 6);
            return (
              <div key={section.cat} className="mb-4">
                <div className="fk-card-surface p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/80">
                    <h2 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">{section.title}</h2>
                    <Link
                      to={`/?category=${encodeURIComponent(section.cat)}`}
                      className="text-[#2874f0] text-sm font-semibold hover:underline flex items-center gap-0.5"
                    >
                      View All
                      <span aria-hidden>›</span>
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                    {homeLoading ? (
                      <p className="text-sm text-muted-foreground col-span-full">Loading products…</p>
                    ) : (
                      sectionProducts.map((product) => <ProductCard key={product.id} product={product} />)
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <Header />
      <CategoryBar />

      <main className="max-w-[1300px] mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-medium text-[#212121]">
              {searchQuery ? `Results for "${searchQuery}"` : categoryParam || "All Products"}
            </h1>
            <p className="text-xs text-[#878787]">
              {listLoading ? "Loading…" : `Showing ${filtered.length} product${filtered.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="appearance-none bg-white border border-[#e0e0e0] rounded-lg px-3 py-1.5 pr-8 text-sm text-[#212121] cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#2874f0]"
              >
                {Object.entries(sortLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-[#878787] pointer-events-none" />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center gap-1 text-sm text-[#2874f0] font-medium"
            >
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </button>
          </div>
        </div>

        <div className="flex gap-4">
          <aside
            className={`${showFilters ? "fixed inset-0 z-40 bg-white p-4 animate-slide-in" : "hidden"} md:block md:static md:w-[220px] flex-shrink-0`}
          >
            <div className="flex items-center justify-between mb-4 md:hidden">
              <h2 className="font-medium">Filters</h2>
              <button type="button" onClick={() => setShowFilters(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="fk-card-surface p-4">
              <h3 className="text-xs font-bold text-[#212121] uppercase tracking-wide mb-3 border-b border-border pb-2">
                Category
              </h3>
              <button
                type="button"
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  next.delete("category");
                  setSearchParams(next);
                  setShowFilters(false);
                }}
                className={`block w-full text-left text-sm py-1.5 ${!categoryParam ? "text-[#2874f0] font-medium" : "text-[#212121] hover:text-[#2874f0]"}`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    const next = new URLSearchParams(searchParams);
                    next.set("category", cat);
                    setSearchParams(next);
                    setShowFilters(false);
                  }}
                  className={`block w-full text-left text-sm py-1.5 ${categoryParam === cat ? "text-[#2874f0] font-medium" : "text-[#212121] hover:text-[#2874f0]"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </aside>

          <div className="flex-1">
            {listLoading ? (
              <div className="fk-card-surface p-12 text-center text-muted-foreground">Loading products…</div>
            ) : filtered.length === 0 ? (
              <div className="fk-card-surface p-12 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-lg text-muted-foreground">No products found</p>
                <p className="text-sm text-muted-foreground mt-1">Try a different search or category</p>
              </div>
            ) : (
              <div className="fk-card-surface p-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {filtered.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
