import Header from "@/components/Header";
import { useStore, ShippingAddress } from "@/store/useStore";
import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  getEffectiveCheckoutAddress,
  setStoredAddress,
} from "@/lib/checkoutStorage";
import { saveMyAddress } from "@/lib/authApi";
import { useAuthStore } from "@/store/authStore";
import { ChevronDown, Star, PackageOpen, HeartHandshake } from "lucide-react";

const FEES = 7;

type Step = "address" | "summary" | "payment";

const Checkout = () => {
  const { cart, getCartTotal, placeOrder, updateQuantity } = useStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);

  const step = (searchParams.get("step") as Step) || "summary";
  const validStep: Step = ["address", "summary", "payment"].includes(step) ? step : "summary";

  const stored = getEffectiveCheckoutAddress(token, user);
  const hasSavedAddress = !!stored;

  const [address, setAddress] = useState<ShippingAddress>({
    fullName: "",
    phone: "",
    pincode: "",
    address: "",
    city: "",
    state: "",
  });

  useEffect(() => {
    const eff = getEffectiveCheckoutAddress(token, user);
    if (eff) setAddress(eff);
  }, [token, user?.savedAddress]);

  /** Cannot review order or pay without a delivery address */
  useEffect(() => {
    if (cart.length === 0) return;
    const addr = getEffectiveCheckoutAddress(token, user);
    if (addr) return;
    if (validStep === "summary" || validStep === "payment") {
      setSearchParams({ step: "address" }, { replace: true });
    }
  }, [cart.length, token, user?.savedAddress, validStep, setSearchParams]);

  const [addressType, setAddressType] = useState("Home");
  const [donation, setDonation] = useState<number | null>(null);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);

  const totalOriginal = cart.reduce((t, item) => t + item.product.originalPrice * item.quantity, 0);
  const subtotal = getCartTotal();
  const discount = totalOriginal - subtotal;
  const grandTotal = subtotal + FEES;

  const setStep = (s: Step) => {
    setSearchParams({ step: s });
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#f1f3f6]">
        <Header />
        <div className="max-w-[1280px] mx-auto px-4 py-16">
          <div className="bg-white rounded-xl border border-[#e0e0e0] p-16 text-center">
            <p className="text-[#878787]">Your cart is empty</p>
            <Link to="/" className="inline-block mt-4 bg-[#fb641b] text-white px-8 py-3 rounded font-bold text-sm">
              Shop Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const saveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.fullName || !address.phone || !address.pincode || !address.address || !address.city || !address.state) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (address.phone.length !== 10 || Number.isNaN(Number(address.phone))) {
      toast.error("Enter a valid 10-digit mobile number");
      return;
    }
    if (address.pincode.length !== 6 || Number.isNaN(Number(address.pincode))) {
      toast.error("Enter a valid 6-digit pincode");
      return;
    }
    const normalized = { ...address };
    setStoredAddress(normalized);
    if (token) {
      try {
        const updated = await saveMyAddress(token, normalized);
        setAuth(token, updated);
        toast.success("Address saved to your account");
        setStep("summary");
      } catch (err) {
        console.error(err);
        toast.error(
          err instanceof Error
            ? err.message
            : "Could not save address to your account. Is the API running?",
        );
      }
      return;
    }
    toast.success("Address saved for checkout");
    setStep("summary");
  };

  const handlePlaceOrder = async () => {
    const addr = getEffectiveCheckoutAddress(token, user);
    if (!addr) {
      toast.error("Add a delivery address first");
      setStep("address");
      return;
    }
    try {
      const orderId = await placeOrder(addr);
      navigate(`/order-confirmation/${orderId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not place order. Is the API running?");
    }
  };

  const inputClass =
    "w-full border border-[#e0e0e0] rounded-lg px-3 py-2.5 text-sm text-[#212121] bg-white focus:outline-none focus:ring-1 focus:ring-[#2874f0] placeholder:text-[#a0a0a0]";

  const Stepper = () => (
    <div className="bg-white border-b border-[#e0e0e0]">
      <div className="max-w-[1280px] mx-auto px-4 py-4">
        <div className="flex items-center justify-center gap-2 sm:gap-8 text-sm">
          {[
            { id: "address" as const, label: "Address", done: hasSavedAddress },
            { id: "summary" as const, label: "Order Summary", done: validStep === "payment" },
            { id: "payment" as const, label: "Payment", done: false },
          ].map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                if (s.id === "payment" && !hasSavedAddress) {
                  toast.error("Save address first");
                  setStep("address");
                  return;
                }
                setStep(s.id);
              }}
              className={`flex items-center gap-2 ${validStep === s.id ? "text-[#2874f0] font-bold" : "text-[#878787]"}`}
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                  s.done ? "bg-[#2874f0] border-[#2874f0] text-white" : validStep === s.id ? "border-[#2874f0] text-[#2874f0]" : "border-[#e0e0e0] text-[#bdbdbd]"
                }`}
              >
                {s.done ? "✓" : i + 1}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const PriceSidebar = ({ actionLabel, onAction }: { actionLabel: string; onAction: () => void }) => (
    <div className="w-full lg:w-[360px] flex-shrink-0">
      <div className="lg:sticky lg:top-28 space-y-3">
        <div className="bg-white rounded-xl border border-[#e0e0e0] p-4 shadow-sm">
          <h2 className="text-xs font-bold text-[#878787] uppercase tracking-wide mb-4 pb-3 border-b border-[#e8e8e8]">
            Price Details
          </h2>
          <div className="space-y-2.5 text-sm text-[#212121]">
            <div className="flex justify-between">
              <span>MRP</span>
              <span>{formatPrice(totalOriginal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Fees</span>
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
        <div className="bg-white rounded-xl border border-[#e0e0e0] p-3 flex items-center justify-between gap-3 shadow-sm">
          <div>
            <p className="text-xs text-[#878787]">Total</p>
            <p className="text-lg font-bold text-[#212121]">{formatPrice(grandTotal)}</p>
          </div>
          <button
            type="button"
            onClick={onAction}
            className="flex-1 max-w-[220px] bg-[#fb641b] hover:bg-[#fa5723] text-white font-bold py-3 px-4 rounded shadow-sm text-sm"
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f1f3f6]">
      <Header />
      <Stepper />

      {validStep === "address" && (
        <main className="max-w-[1280px] mx-auto px-3 sm:px-4 py-6 flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl border border-[#e0e0e0] overflow-hidden shadow-sm">
              <div className="bg-[#2874f0] text-white px-4 py-3 font-semibold">Delivery Address</div>
              <form onSubmit={saveAddress} className="p-5 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#878787] mb-1">Full name *</label>
                    <input
                      type="text"
                      value={address.fullName}
                      onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#878787] mb-1">Mobile *</label>
                    <input
                      type="text"
                      maxLength={10}
                      value={address.phone}
                      onChange={(e) => setAddress({ ...address, phone: e.target.value.replace(/\D/g, "") })}
                      className={inputClass}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#878787] mb-1">Pincode *</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={address.pincode}
                    onChange={(e) => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, "") })}
                    className={inputClass}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#878787] mb-1">State *</label>
                    <select
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      className={inputClass}
                      required
                    >
                      <option value="">Select State</option>
                      <option>Delhi</option>
                      <option>Karnataka</option>
                      <option>Maharashtra</option>
                      <option>Tamil Nadu</option>
                      <option>Telangana</option>
                      <option>Uttar Pradesh</option>
                      <option>West Bengal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#878787] mb-1">City *</label>
                    <input
                      type="text"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      className={inputClass}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#878787] mb-1">Address *</label>
                  <textarea
                    value={address.address}
                    onChange={(e) => setAddress({ ...address, address: e.target.value })}
                    rows={3}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <p className="text-xs text-[#878787] mb-2">Address type</p>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="radio" name="addrtype" checked={addressType === "Home"} onChange={() => setAddressType("Home")} className="accent-[#2874f0]" />
                      Home
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="radio" name="addrtype" checked={addressType === "Work"} onChange={() => setAddressType("Work")} className="accent-[#2874f0]" />
                      Work
                    </label>
                  </div>
                </div>
                <button type="submit" className="w-full bg-[#fb641b] text-white font-bold py-3 rounded-lg hover:opacity-95">
                  Save & Continue to Summary
                </button>
              </form>
            </div>
          </div>
          <PriceSidebar
            actionLabel="Continue"
            onAction={() => (hasSavedAddress ? setStep("summary") : toast.error("Save address first"))}
          />
        </main>
      )}

      {validStep === "summary" && (
        <main className="max-w-[1280px] mx-auto px-3 sm:px-4 py-6 flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0 space-y-4">
            {!stored && (
              <div className="bg-[#fff8e1] border border-[#ffe082] rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-[#212121]">Add a delivery address to continue.</p>
                <button type="button" onClick={() => setStep("address")} className="text-sm font-bold text-[#2874f0]">
                  Add address
                </button>
              </div>
            )}

            {stored && (
              <div className="bg-white rounded-xl border border-[#e0e0e0] p-4 flex flex-wrap items-start justify-between gap-3 shadow-sm">
                <div>
                  <p className="text-xs font-bold text-[#878787] mb-1">Deliver to:</p>
                  <p className="font-semibold text-[#212121]">
                    {stored.fullName}{" "}
                    <span className="text-xs font-normal text-[#878787] border border-[#e0e0e0] rounded px-1.5 py-0.5 ml-1">
                      {addressType}
                    </span>
                  </p>
                  <p className="text-sm text-[#212121] mt-1">{stored.address}</p>
                  <p className="text-sm text-[#212121]">
                    {stored.city}, {stored.state} — {stored.pincode}
                  </p>
                  <p className="text-sm text-[#212121] mt-1">Phone: {stored.phone}</p>
                </div>
                <button type="button" onClick={() => setStep("address")} className="text-sm font-bold text-[#2874f0]">
                  Change
                </button>
              </div>
            )}

            {cart.map((item) => {
              const p = item.product;
              return (
                <div key={p.id} className="bg-white rounded-xl border border-[#e0e0e0] p-4 shadow-sm flex flex-col sm:flex-row gap-4">
                  <Link to={`/product/${p.id}`} className="w-full sm:w-28 h-28 flex-shrink-0 border border-[#e8e8e8] rounded-lg p-2 bg-[#fafafa]">
                    <img src={p.images[0]} alt="" className="w-full h-full object-contain" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#212121]">{p.name}</p>
                    <p className="text-xs text-[#878787] mt-1">{p.brand}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-bold bg-[#388e3c] text-white">
                        <Star className="w-3 h-3 fill-white" />
                        {p.rating.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-baseline gap-2 mt-2">
                      <span className="text-sm text-[#878787] line-through">{formatPrice(p.originalPrice)}</span>
                      <span className="text-lg font-bold text-[#212121]">{formatPrice(p.price)}</span>
                      <span className="text-sm text-[#388e3c] font-semibold">{p.discount}% off</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      <div className="relative">
                        <select
                          value={item.quantity}
                          onChange={(e) => updateQuantity(p.id, Number(e.target.value))}
                          className="appearance-none pl-3 pr-8 py-1.5 border border-[#e0e0e0] rounded text-sm bg-white"
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
                  </div>
                </div>
              );
            })}

            <div className="bg-[#fff8e1] border border-[#ffe082] rounded-xl p-4 flex gap-3">
              <PackageOpen className="w-8 h-8 text-[#f9a825] shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[#212121]">Open Box Delivery</p>
                <p className="text-xs text-[#878787] mt-1">
                  Our agent may open the package for inspection. OTP verification may be required.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#e0e0e0] p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <HeartHandshake className="w-5 h-5 text-[#2874f0]" />
                <span className="text-sm font-semibold text-[#212121]">Donate to Flipkart Foundation</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[10, 20, 50].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDonation(donation === amt ? null : amt)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium ${
                      donation === amt ? "border-[#2874f0] bg-[#e8f0fe] text-[#2874f0]" : "border-[#e0e0e0] text-[#212121]"
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <PriceSidebar
            actionLabel="Continue"
            onAction={() => {
              if (!stored) {
                toast.error("Add a delivery address first");
                setStep("address");
                return;
              }
              setStep("payment");
            }}
          />
        </main>
      )}

      {validStep === "payment" && (
        <main className="max-w-[1280px] mx-auto px-3 sm:px-4 py-6 flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl border border-[#e0e0e0] p-5 shadow-sm">
              <h2 className="text-lg font-bold text-[#212121] mb-4">Payment options</h2>
              <label className="flex items-center gap-3 p-3 border border-[#2874f0] rounded-lg bg-[#f8fbff] cursor-pointer mb-3">
                <input type="radio" name="pay" defaultChecked className="accent-[#2874f0]" />
                <span className="text-sm font-medium text-[#212121]">UPI / Cards / Netbanking (simulated)</span>
              </label>
              <p className="text-xs text-[#878787]">You will be charged {formatPrice(grandTotal)} on confirmation.</p>
            </div>
          </div>
          <PriceSidebar actionLabel="Place Order" onAction={handlePlaceOrder} />
        </main>
      )}
    </div>
  );
};

export default Checkout;
