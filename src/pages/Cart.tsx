import Header from "@/components/Header";
import { useStore } from "@/store/useStore";
import { useAuthStore } from "@/store/authStore";
import {
  formatAddressSnippet,
  getEffectiveCheckoutAddress,
  checkoutHref,
} from "@/lib/checkoutStorage";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "@/lib/productsApi";
import { products as fallbackProducts } from "@/data/products";
import { ChevronDown, Star, Trash2, Bookmark, Zap, ShieldCheck } from "lucide-react";
import ProductCard from "@/components/ProductCard";

const FEES = 7;

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, getCartTotal, toggleWishlist } = useStore();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const deliveryAddr = getEffectiveCheckoutAddress(token, user);

  const { data: catalog = [] } = useQuery({
    queryKey: ["products", "cart-recs"],
    queryFn: async () => {
      try {
        return await fetchProducts({});
      } catch {
        return fallbackProducts;
      }
    },
  });

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);

  const totalOriginal = cart.reduce((t, item) => t + item.product.originalPrice * item.quantity, 0);
  const subtotal = getCartTotal();
  const discount = totalOriginal - subtotal;
  const grandTotal = subtotal + FEES;

  const cartIds = new Set(cart.map((c) => c.product.id));
  const missed = catalog.filter((p) => !cartIds.has(p.id)).slice(0, 8);

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#f1f3f6]">
        <Header />
        <div className="max-w-[1280px] mx-auto px-4 py-16">
          <div className="bg-white rounded-2xl border border-[#e0e0e0] p-16 text-center shadow-sm">
            <div className="text-7xl mb-6">🛒</div>
            <h2 className="text-2xl font-semibold text-[#212121] mb-2">Your cart is empty!</h2>
            <p className="text-[#878787] mb-6">Add items to it now.</p>
            <Link
              to="/"
              className="inline-block bg-[#fb641b] text-white px-8 py-3 rounded font-bold text-sm hover:opacity-95 shadow-sm"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f3f6]">
      <Header />

      <main className="max-w-[1280px] mx-auto px-3 sm:px-4 py-4 flex flex-col lg:flex-row gap-4">
        <div className="flex-1 min-w-0 space-y-3">
          {/* Address strip — only for logged-in users with a saved profile address */}
          <div className="bg-white rounded-xl border border-[#e0e0e0] px-4 py-3 flex flex-wrap items-center justify-between gap-2 shadow-sm">
            {deliveryAddr ? (
              <>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#212121]">
                    Deliver to <span className="font-semibold">{deliveryAddr.fullName}</span>
                  </p>
                  <p className="text-xs text-[#878787] truncate mt-0.5">{formatAddressSnippet(deliveryAddr)}</p>
                </div>
                <Link
                  to="/checkout?step=address"
                  className="text-sm font-semibold text-[#2874f0] hover:underline shrink-0"
                >
                  Change
                </Link>
              </>
            ) : (
              <>
                <span className="text-sm text-[#212121]">
                  {token ? "No saved delivery address yet" : "Login to save and show your delivery address"}
                </span>
                <Link
                  to={token ? "/checkout?step=address" : "/login"}
                  className="text-sm font-semibold text-[#2874f0] hover:underline shrink-0"
                >
                  {token ? "Add address" : "Login"}
                </Link>
              </>
            )}
          </div>

          {cart.map((item) => {
            const p = item.product;
            const lineOriginal = p.originalPrice * item.quantity;
            const lineSale = p.price * item.quantity;
            const coins = Math.max(0, Math.round(lineSale * 0.055));
            const altPay = Math.max(0, lineSale - coins);

            return (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-[#e0e0e0] shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden"
              >
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
                  <Link to={`/product/${p.id}`} className="w-full sm:w-28 h-28 flex-shrink-0 border border-[#e8e8e8] rounded-lg p-2 bg-[#fafafa] mx-auto sm:mx-0">
                    <img src={p.images[0]} alt={p.name} className="w-full h-full object-contain" />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${p.id}`} className="text-[15px] font-medium text-[#212121] hover:text-[#2874f0] line-clamp-2">
                      {p.name}
                    </Link>
                    <p className="text-xs text-[#878787] mt-1">
                      Size: One size · {p.brand}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-bold bg-[#388e3c] text-white">
                        <Star className="w-3 h-3 fill-white" />
                        {p.rating.toFixed(1)}
                      </span>
                      <span className="text-xs text-[#878787]">
                        ({typeof p.ratingCount === "number" ? p.ratingCount.toLocaleString("en-IN") : "—"})
                      </span>
                    </div>

                    <div className="flex flex-wrap items-baseline gap-2 mt-2">
                      <span className="text-lg font-bold text-[#212121]">{formatPrice(p.price)}</span>
                      <span className="text-sm text-[#878787] line-through">{formatPrice(p.originalPrice)}</span>
                      <span className="text-sm font-semibold text-[#388e3c]">↓{p.discount}%</span>
                    </div>
                    <p className="text-xs text-[#212121] mt-1">
                      Or Pay {formatPrice(altPay)} + {coins} coins
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-4">
                      <div className="relative">
                        <select
                          value={item.quantity}
                          onChange={(e) => updateQuantity(p.id, Number(e.target.value))}
                          className="appearance-none pl-3 pr-8 py-1.5 border border-[#e0e0e0] rounded text-sm font-medium text-[#212121] bg-white cursor-pointer"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((q) => (
                            <option key={q} value={q}>
                              Qty: {q}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-[#878787] pointer-events-none" />
                      </div>
                      <p className="text-xs text-[#878787]">
                        Delivery by{" "}
                        {new Date(Date.now() + 5 * 86400000).toLocaleDateString("en-IN", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-0 mt-4 pt-3 border-t border-[#f0f0f0] text-sm">
                      <button
                        type="button"
                        onClick={() => {
                          toggleWishlist(p);
                          removeFromCart(p.id);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 text-[#212121] hover:text-[#2874f0] font-medium"
                      >
                        <Bookmark className="w-4 h-4" />
                        Save for later
                      </button>
                      <span className="text-[#e0e0e0] hidden sm:inline">|</span>
                      <button
                        type="button"
                        onClick={() => removeFromCart(p.id)}
                        className="flex items-center gap-1.5 px-3 py-2 text-[#212121] hover:text-[#c62828] font-medium"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                      <span className="text-[#e0e0e0] hidden sm:inline">|</span>
                      <Link to={`/product/${p.id}`} className="flex items-center gap-1.5 px-3 py-2 text-[#2874f0] font-semibold">
                        <Zap className="w-4 h-4" />
                        Buy this now
                      </Link>
                    </div>
                  </div>

                  <div className="text-right sm:min-w-[72px]">
                    <div className="text-base font-semibold text-[#212121]">{formatPrice(lineSale)}</div>
                    <div className="text-xs text-[#388e3c] mt-1">Save {formatPrice(lineOriginal - lineSale)}</div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Promo strip */}
          <div className="rounded-xl bg-gradient-to-r from-[#1565c0] to-[#0d47a1] text-white px-4 py-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium">Flipkart Axis Bank Credit Card — extra savings</span>
            <button type="button" className="text-sm font-bold bg-white text-[#1565c0] px-4 py-1.5 rounded-lg">
              Apply now
            </button>
          </div>

          {/* Missed items */}
          {missed.length > 0 && (
            <div className="bg-white rounded-xl border border-[#e0e0e0] p-4 shadow-sm">
              <h3 className="text-base font-bold text-[#212121] mb-3">Items you may have missed</h3>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                {missed.map((product) => (
                  <div key={product.id} className="min-w-[140px] max-w-[160px] flex-shrink-0">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Price sidebar */}
        <div className="w-full lg:w-[360px] flex-shrink-0">
          <div className="lg:sticky lg:top-24 space-y-3">
            <div className="bg-white rounded-xl border border-[#e0e0e0] p-4 shadow-sm">
              <h2 className="text-xs font-bold text-[#878787] uppercase tracking-wide mb-4 pb-3 border-b border-[#e8e8e8]">
                Price Details
              </h2>
              <div className="space-y-2.5 text-sm text-[#212121]">
                <div className="flex justify-between">
                  <span>Price ({cart.reduce((c, i) => c + i.quantity, 0)} items)</span>
                  <span>{formatPrice(totalOriginal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1">
                    Fees
                    <span className="text-[#878787] text-xs">ⓘ</span>
                  </span>
                  <span>{formatPrice(FEES)}</span>
                </div>
                <div className="flex justify-between text-[#388e3c] font-medium">
                  <span>Discounts</span>
                  <span>−{formatPrice(discount)}</span>
                </div>
                <div className="border-t border-[#e0e0e0] pt-3 flex justify-between font-bold text-base">
                  <span>Total Amount</span>
                  <span>{formatPrice(grandTotal)}</span>
                </div>
                <div className="rounded-lg bg-[#e8f5e9] text-[#388e3c] text-sm font-medium px-3 py-2 mt-2">
                  You&apos;ll save {formatPrice(discount)} on this order!
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 text-xs text-[#878787] px-1">
              <ShieldCheck className="w-5 h-5 text-[#388e3c] shrink-0" />
              <p>Safe and secure payments. Easy returns. 100% Authentic products.</p>
            </div>

            <div className="bg-white rounded-xl border border-[#e0e0e0] p-3 flex items-center justify-between gap-3 shadow-sm lg:shadow-md">
              <div>
                <p className="text-xs text-[#878787]">Total</p>
                <p className="text-lg font-bold text-[#212121]">{formatPrice(grandTotal)}</p>
              </div>
              <button
                type="button"
                onClick={() => navigate(checkoutHref(token, user))}
                className="flex-1 max-w-[200px] bg-[#fb641b] hover:bg-[#fa5723] text-white font-bold py-3 px-4 rounded shadow-sm text-sm"
              >
                Place Order
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Cart;
