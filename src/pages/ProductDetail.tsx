import { useParams, useNavigate, Link } from "react-router-dom";
import { products as fallbackProducts } from "@/data/products";
import Header from "@/components/Header";
import { useStore } from "@/store/useStore";
import { useAuthStore } from "@/store/authStore";
import { checkoutHref } from "@/lib/checkoutStorage";
import {
  Star,
  ShoppingCart,
  Heart,
  Check,
  ChevronRight,
  Play,
  Share2,
  ShieldCheck,
  Truck,
  BadgeCheck,
  MapPin,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { fetchProduct } from "@/lib/productsApi";

type MediaCell = { kind: "image" | "video"; src: string };

const STORAGE_PRESETS = ["256 GB + 12 GB", "512 GB + 12 GB", "1024 GB + 12 GB"];

function buildMediaGrid(images: string[]): MediaCell[] {
  const base = images.length ? images : [""];
  const a = base[0];
  const b = base[1] ?? base[0];
  const c = base[2] ?? base[0];
  return [
    { kind: "image", src: a },
    { kind: "video", src: b },
    { kind: "image", src: b },
    { kind: "video", src: c },
    { kind: "image", src: c },
    { kind: "image", src: a },
  ];
}

function formatDeliveryDate(d: Date) {
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const addToCart = useStore((s) => s.addToCart);
  const cart = useStore((s) => s.cart);
  const toggleWishlist = useStore((s) => s.toggleWishlist);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const [selectedStorage, setSelectedStorage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);

  const { data: product, isLoading, isError, error } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      if (!id) throw new Error("Missing id");
      try {
        return await fetchProduct(id);
      } catch {
        const p = fallbackProducts.find((x) => x.id === id);
        if (!p) throw new Error("not found");
        return p;
      }
    },
    enabled: !!id,
  });

  const isInWishlist = useStore((s) => (product ? s.isInWishlist(product.id) : false));

  const mediaGrid = useMemo(() => (product ? buildMediaGrid(product.images) : []), [product]);

  const showStorageChips = useMemo(() => {
    if (!product) return false;
    return (
      product.category === "Mobiles" ||
      /phone|galaxy|iphone|pixel/i.test(product.name) ||
      product.specifications["Storage"] !== undefined
    );
  }, [product]);

  const colorSwatches = useMemo(() => {
    if (!product) return [0, 1, 2];
    return [0, 1, 2];
  }, [product]);

  const deliveryEta = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return formatDeliveryDate(d);
  }, []);

  if (!id) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f0f2f5]">
        <Header variant="pdp" />
        <div className="flex items-center justify-center h-[50vh] text-[#878787]">Loading product…</div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="min-h-screen bg-[#f0f2f5]">
        <Header variant="pdp" />
        <div className="flex flex-col items-center justify-center h-[50vh] text-[#878787] gap-2">
          <p>Product not found</p>
          {error instanceof Error && <p className="text-xs">{error.message}</p>}
        </div>
      </div>
    );
  }

  const isInCart = cart.some((item) => item.product.id === product.id);
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);

  const lowestPrice = Math.max(product.price - 4000, Math.round(product.price * 0.97));
  const emiMonthly = Math.ceil(product.price / 9);
  const exchangeValue = Math.min(47350, Math.round(product.originalPrice * 0.35));

  const handleAddToCart = () => {
    addToCart(product);
    toast.success("Added to cart!");
  };

  const handleBuyNow = () => {
    if (!isInCart) addToCart(product);
    navigate(checkoutHref(token, user));
  };

  const breadcrumbTail = [
    { label: "Home", to: "/" },
    { label: product.category, to: `/?category=${encodeURIComponent(product.category)}` },
    { label: product.brand, to: `/?search=${encodeURIComponent(product.brand)}` },
    { label: product.name, to: null },
  ];

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <Header variant="pdp" />

      <main className="max-w-[1280px] mx-auto px-3 sm:px-4 py-3">
        {/* Breadcrumbs */}
        <nav className="text-[11px] sm:text-xs text-[#878787] flex flex-wrap items-center gap-1 mb-4 leading-relaxed">
          {breadcrumbTail.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="w-3 h-3 shrink-0 opacity-50" />}
              {crumb.to ? (
                <Link to={crumb.to} className="hover:text-[#2874f0]">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-[#565656] line-clamp-2">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left: media mosaic */}
          <div className="lg:col-span-5">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {mediaGrid.map((cell, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-xl border border-[#e8e8e8] bg-white overflow-hidden group"
                >
                  <img src={cell.src} alt="" className="w-full h-full object-contain p-3" />
                  {cell.kind === "video" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/15 pointer-events-none">
                      <span className="w-12 h-12 rounded-full bg-white/95 flex items-center justify-center shadow-md">
                        <Play className="w-6 h-6 text-[#2874f0] ml-0.5" fill="currentColor" />
                      </span>
                    </div>
                  )}
                  {idx === 0 && (
                    <div className="absolute top-2 right-2 flex gap-1.5 z-10">
                      <button
                        type="button"
                        onClick={() => toggleWishlist(product)}
                        className="p-2 rounded-full bg-white/95 shadow border border-[#eee] hover:bg-white"
                        aria-label="Wishlist"
                      >
                        <Heart
                          className={`w-4 h-4 ${isInWishlist ? "fill-red-500 text-red-500" : "text-[#565656]"}`}
                        />
                      </button>
                      <button
                        type="button"
                        className="p-2 rounded-full bg-white/95 shadow border border-[#eee] hover:bg-white"
                        aria-label="Share"
                        onClick={() => {
                          void navigator.clipboard?.writeText(window.location.href);
                          toast.message("Link copied");
                        }}
                      >
                        <Share2 className="w-4 h-4 text-[#565656]" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <p className="text-[11px] text-[#878787] text-center mt-3 hidden lg:block">Swipe or tap thumbnails on mobile</p>
          </div>

          {/* Right: purchase panel — sticky */}
          <div className="lg:col-span-7 lg:sticky lg:top-24 lg:self-start space-y-4">
            {showStorageChips && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-[#212121]">
                  Selected Color: <span className="text-[#565656]">Black</span>
                </p>
                <div className="flex gap-2">
                  {colorSwatches.map((ci) => (
                    <button
                      key={ci}
                      type="button"
                      onClick={() => setSelectedColor(ci)}
                      className={`w-11 h-11 rounded-full border-2 overflow-hidden shrink-0 ${
                        selectedColor === ci ? "border-[#2874f0] ring-2 ring-[#2874f0]/30" : "border-[#e0e0e0]"
                      }`}
                      style={{ filter: ci === 1 ? "saturate(0.6)" : ci === 2 ? "hue-rotate(180deg)" : undefined }}
                    >
                      <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>

                <p className="text-xs font-medium text-[#212121] pt-1">Storage & RAM</p>
                <div className="flex flex-wrap gap-2">
                  {STORAGE_PRESETS.map((label, i) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setSelectedStorage(i)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                        selectedStorage === i
                          ? "border-[#2874f0] bg-[#e8f0fe] text-[#2874f0]"
                          : "border-[#e0e0e0] bg-white text-[#212121] hover:border-[#bdbdbd]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h1 className="text-base sm:text-lg font-semibold text-[#212121] leading-snug">{product.name}</h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="inline-flex items-center gap-0.5 bg-[#26a541] text-white text-xs font-bold px-1.5 py-0.5 rounded">
                  {product.rating} <Star className="w-3 h-3 fill-white" />
                </span>
                <span className="text-sm text-[#878787]">{product.ratingCount.toLocaleString()} Ratings</span>
              </div>
            </div>

            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-[#212121]">{formatPrice(product.price)}</span>
              <span className="text-sm text-[#878787] line-through">{formatPrice(product.originalPrice)}</span>
              <span className="text-sm font-semibold text-[#26a541]">{product.discount}% off</span>
            </div>
            <p className="text-xs text-[#565656]">
              Free delivery <span className="mx-1">·</span> Net Price / Monthly EMI available
            </p>

            {/* Offers card */}
            <div className="rounded-xl border border-[#e0e0e0] overflow-hidden bg-white shadow-sm">
              <div className="bg-[#2874f0] text-white text-sm font-semibold px-4 py-2.5">Apply offers for maximum savings</div>
              <div className="p-4 space-y-4">
                <div className="flex flex-wrap justify-between gap-2 border-b border-[#f0f0f0] pb-3">
                  <div>
                    <p className="text-xs text-[#878787]">Lowest price for you</p>
                    <p className="text-lg font-bold text-[#212121]">{formatPrice(lowestPrice)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#878787]">EMI from</p>
                    <p className="text-sm font-semibold text-[#212121]">
                      {formatPrice(emiMonthly)} × 9m
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#212121] mb-1">Exchange offer</p>
                  <p className="text-xs text-[#565656]">
                    Up to {formatPrice(exchangeValue)} off on old device <span className="text-[#2874f0] font-medium">Know more</span>
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-[#212121]">Bank offer</p>
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#e8e8e8] px-3 py-2">
                    <span className="text-xs text-[#565656]">{formatPrice(4000)} off on Flipkart Axis Bank Credit Card</span>
                    <button type="button" className="text-xs font-bold text-[#2874f0] px-2 py-1 rounded border border-[#2874f0] hover:bg-[#e8f0fe]">
                      Apply
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#e8e8e8] px-3 py-2">
                    <span className="text-xs text-[#565656]">5% Cashback on Flipkart SBI Credit Card</span>
                    <button type="button" className="text-xs font-bold text-[#2874f0] px-2 py-1 rounded border border-[#2874f0] hover:bg-[#e8f0fe]">
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery & seller */}
            <div className="rounded-xl border border-[#e8e8e8] bg-white p-4 space-y-3 text-sm">
              <div className="flex items-start gap-2 text-[#565656]">
                <MapPin className="w-4 h-4 text-[#2874f0] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[#878787]">Location not set — </span>
                  <button type="button" className="text-[#2874f0] font-medium">
                    Select delivery location
                  </button>
                  <p className="text-xs mt-1 text-[#212121]">Delivery by {deliveryEta}</p>
                </div>
              </div>
              <div className="border-t border-[#f0f0f0] pt-3">
                <p className="text-[#212121] font-medium">Fulfilled by Akshnav Online</p>
                <p className="text-xs text-[#878787] mt-0.5">
                  Seller rating <span className="text-[#26a541] font-semibold">4.5 ★</span>
                </p>
              </div>
              <p className="text-xs text-[#565656] leading-relaxed">
                1 Year Manufacturer Warranty for device and 6 months for in-box accessories.
              </p>
            </div>

            {/* Trust row */}
            <div className="flex flex-wrap gap-4 text-[11px] text-[#565656]">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-[#26a541]" /> 7 day replacement
              </span>
              <span className="inline-flex items-center gap-1">
                <Truck className="w-4 h-4 text-[#2874f0]" /> Cash on Delivery
              </span>
              <span className="inline-flex items-center gap-1">
                <BadgeCheck className="w-4 h-4 text-[#2874f0]" /> Flipkart Assured
              </span>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => toast.message("EMI checkout — use Buy Now to proceed")}
                className="flex-1 py-3.5 rounded-lg border-2 border-[#FFD814] bg-white text-[#212121] font-bold text-sm hover:bg-[#fffef5] transition-colors"
              >
                Buy with EMI
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                className="flex-1 py-3.5 rounded-lg bg-[#FFD814] text-[#212121] font-bold text-sm hover:bg-[#e6cf00] transition-colors shadow-sm"
              >
                Buy Now
              </button>
            </div>
            <button
              type="button"
              onClick={isInCart ? () => navigate("/cart") : handleAddToCart}
              className="w-full py-3 rounded-lg border border-[#ff9f00] bg-white text-[#ff9f00] font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#fff8f0]"
            >
              <ShoppingCart className="w-5 h-5" />
              {isInCart ? "GO TO CART" : "ADD TO CART"}
            </button>

            {/* Highlights & specs */}
            <div className="pt-4 border-t border-[#e8e8e8] space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-[#212121] mb-2">Highlights</h3>
                <ul className="space-y-1.5">
                  {product.highlights.map((h, i) => (
                    <li key={i} className="text-sm text-[#565656] flex items-start gap-2">
                      <Check className="w-4 h-4 text-[#26a541] flex-shrink-0 mt-0.5" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#212121] mb-2">Specifications</h3>
                <div className="rounded-lg border border-[#e8e8e8] overflow-hidden">
                  {Object.entries(product.specifications).map(([key, value], i) => (
                    <div key={key} className={`flex text-sm ${i > 0 ? "border-t border-[#e8e8e8]" : ""}`}>
                      <span className="w-[36%] py-2.5 px-3 text-[#878787] bg-[#fafafa]">{key}</span>
                      <span className="flex-1 py-2.5 px-3 text-[#212121]">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#212121] mb-2">Description</h3>
                <p className="text-sm text-[#565656] leading-relaxed">{product.description}</p>
              </div>
              {product.inStock ? (
                <p className="text-sm text-[#26a541] font-medium flex items-center gap-1">
                  <Check className="w-4 h-4" /> In stock
                </p>
              ) : (
                <p className="text-sm text-red-600 font-medium">Out of Stock</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductDetail;
