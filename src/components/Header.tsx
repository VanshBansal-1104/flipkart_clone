import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  ShoppingCart,
  User,
  ChevronDown,
  Plane,
  MoreHorizontal,
  UserCircle,
  Sparkles,
  Package,
  Heart,
  Store,
  Gift,
  Bell,
  Headphones,
  Megaphone,
  Smartphone,
  Medal,
  Home,
  ChevronRight,
  Bike,
  ShoppingBasket,
  Star,
  Zap,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { useAuthStore } from "@/store/authStore";
import { checkoutHref, formatAddressSnippet, getEffectiveCheckoutAddress } from "@/lib/checkoutStorage";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const menuIcon = "w-4 h-4 text-[#878787] shrink-0";

export type HeaderVariant = "default" | "blue" | "pdp";

type HeaderProps = { variant?: HeaderVariant };

const Header = ({ variant = "default" }: HeaderProps) => {
  const isBlue = variant === "blue";
  const isPdp = variant === "pdp";
  const cartCount = useStore((s) => s.getCartCount());
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const deliveryAddr = getEffectiveCheckoutAddress(token, user);
  const savedHeaderLine = deliveryAddr ? formatAddressSnippet(deliveryAddr) : null;
  const logout = useAuthStore((s) => s.logout);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/?search=${encodeURIComponent(search.trim())}`);
    }
  };

  const navBtn = cn(
    "flex items-center gap-1 text-sm font-medium px-2 sm:px-3 py-2 rounded-lg transition-colors",
    isBlue ? "text-white hover:bg-white/15" : "text-[#212121] hover:bg-[#f0f2f5]",
  );

  const guestMenuLabel = isBlue || isPdp ? "Flipkart" : "Login";

  return (
    <header
      className={cn(
        "sticky top-0 z-50",
        isBlue ? "bg-[#2874f0] shadow-[0_1px_4px_rgba(0,0,0,0.15)]" : "bg-white",
        isPdp ? "border-b border-[#e0e0e0] shadow-none" : !isBlue && "shadow-[0_1px_3px_rgba(0,0,0,0.06)]",
      )}
    >
      {/* Home only: service tabs + location / Supercoins */}
      {!isBlue && !isPdp && (
        <div className="bg-white border-b border-[#e8e8e8]">
          <div className="max-w-[1280px] mx-auto flex flex-wrap items-center justify-between gap-2 px-2 sm:px-4 py-2">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide min-w-0 pb-0.5">
              <Link
                to="/"
                className="flex-shrink-0 flex items-center gap-2 rounded-xl bg-[#FFE11B] hover:bg-[#f5d922] px-3 py-2 shadow-sm border border-[#e6c300]/40"
              >
                <span className="text-[#2874f0] font-black italic text-base sm:text-lg tracking-tight leading-none">f</span>
                <span className="text-[#212121] font-bold italic text-sm sm:text-base tracking-tight">Flipkart</span>
              </Link>
              <button
                type="button"
                className="flex-shrink-0 flex items-center gap-1.5 rounded-xl bg-[#f0f2f5] hover:bg-[#e8eaed] px-3 py-2 text-xs sm:text-sm font-medium text-[#212121]"
              >
                <Bike className="w-4 h-4 text-[#e53935] shrink-0" strokeWidth={2} />
                Minutes
              </button>
              <button
                type="button"
                className="flex-shrink-0 flex items-center gap-1.5 rounded-xl bg-[#f0f2f5] hover:bg-[#e8eaed] px-3 py-2 text-xs sm:text-sm font-medium text-[#212121]"
              >
                <Plane className="w-4 h-4 text-[#e53935] shrink-0" strokeWidth={2} />
                Travel
              </button>
              <button
                type="button"
                className="flex-shrink-0 flex items-center gap-1.5 rounded-xl bg-[#f0f2f5] hover:bg-[#e8eaed] px-3 py-2 text-xs sm:text-sm font-medium text-[#212121]"
              >
                <ShoppingBasket className="w-4 h-4 text-[#388e3c] shrink-0" strokeWidth={2} />
                Grocery
              </button>
            </div>
            <div className="flex items-center gap-3 sm:gap-5 flex-shrink-0">
              {savedHeaderLine ? (
                <Link
                  to={checkoutHref(token, user)}
                  className="hidden sm:flex items-center gap-1.5 text-xs text-[#212121] max-w-[220px] lg:max-w-[320px] text-left hover:opacity-80"
                >
                  <Home className="w-4 h-4 text-[#878787] shrink-0" strokeWidth={2} />
                  <span className="font-bold text-[11px] uppercase text-[#212121] shrink-0">Home</span>
                  <span className="truncate text-[#878787]">{savedHeaderLine}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#878787] shrink-0" />
                </Link>
              ) : (
                <Link
                  to={token ? "/checkout?step=address" : "/login"}
                  className="hidden sm:inline text-xs font-medium text-[#2874f0] hover:underline max-w-[200px] truncate"
                >
                  {token ? "Add delivery address" : "Login to set delivery location"}
                </Link>
              )}
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#212121]">
                <span className="w-7 h-7 rounded-full bg-[#FFD814] flex items-center justify-center shadow-sm border border-[#e6c200]/50">
                  <Zap className="w-4 h-4 text-[#1565c0]" strokeWidth={2.5} />
                </span>
                <span>0</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1280px] mx-auto flex flex-wrap items-center gap-3 px-3 sm:px-4 py-3">
        {isPdp && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex-shrink-0 flex items-center gap-0.5 rounded-xl bg-[#FFE11B] hover:bg-[#f5d922] px-3 py-2 shadow-sm border border-[#e6c300]/40"
              >
                <span className="text-[#2874f0] font-black italic text-base sm:text-lg tracking-tight leading-none">Flipkart</span>
                <ChevronDown className="w-4 h-4 text-[#212121] shrink-0 opacity-80" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuItem asChild>
                <Link to="/">Home</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/cart">My Cart</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/orders">My Orders</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/wishlist">Wishlist</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {isBlue && (
          <Link to="/" className="flex-shrink-0 flex flex-col justify-center pr-2 min-h-[48px]">
            <span className="text-white font-black italic text-xl sm:text-2xl tracking-tight leading-none drop-shadow-sm">
              Flipkart
            </span>
            <span className="text-[10px] sm:text-[11px] mt-1 flex items-center gap-0.5 text-[#ffe500] font-medium">
              Explore <span className="font-bold">Plus</span>
              <Star className="w-3 h-3 fill-[#ffe500] text-[#ffe500]" />
            </span>
          </Link>
        )}

        <form onSubmit={handleSearch} className="flex-1 min-w-[200px] order-last sm:order-none w-full sm:w-auto">
          <div
            className={cn(
              "flex items-center overflow-hidden rounded-xl",
              isBlue
                ? "bg-white pl-3 pr-1 py-1.5 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]"
                : "bg-white pl-3 sm:pl-4 py-1.5 border border-[#87b5f7] shadow-[0_1px_3px_rgba(40,116,240,0.12)]",
              isPdp && "pr-3 sm:pr-4",
            )}
          >
            {!isBlue && <Search className="w-5 h-5 text-[#9ca3af] shrink-0 mr-2" />}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                isBlue
                  ? "Search for products, brands and more"
                  : "Search for Products, Brands and More"
              }
              className="flex-1 min-w-0 py-2 text-sm text-[#212121] placeholder:text-[#878787] bg-transparent border-none outline-none"
            />
            {(isBlue || !isPdp) && (
              <button
                type="submit"
                className={cn(
                  "shrink-0 p-2 rounded-lg",
                  isBlue ? "text-[#2874f0] hover:bg-[#f5f5f5]" : "hover:bg-[#f0f5ff] text-[#2874f0]",
                )}
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
            )}
          </div>
        </form>

        {isBlue && (
          <a href="#" className="hidden lg:inline text-white text-sm font-medium hover:underline whitespace-nowrap">
            Become a Seller
          </a>
        )}

        <div className="flex items-center gap-1 sm:gap-2 ml-auto">
          {token && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className={navBtn}>
                  <User className="w-5 h-5" />
                  <span className="hidden sm:inline max-w-[100px] truncate">
                    {user.name || user.email.split("@")[0]}
                  </span>
                  <ChevronDown className="w-4 h-4 opacity-70 hidden sm:inline" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 p-0">
                <div className="px-3 py-2 border-b border-[#f0f0f0]">
                  <p className="text-xs text-[#878787]">Hello</p>
                  <p className="text-sm font-semibold text-[#212121] truncate">{user.name || user.email}</p>
                </div>
                <div className="py-1 max-h-[min(70vh,420px)] overflow-y-auto">
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/profile" className="flex items-center gap-3 px-3 py-2">
                      <UserCircle className={menuIcon} />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 cursor-pointer">
                    <Sparkles className={menuIcon} />
                    Flipkart Plus Zone
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/orders" className="flex items-center gap-3 px-3 py-2">
                      <Package className={menuIcon} />
                      Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/wishlist" className="flex items-center gap-3 px-3 py-2">
                      <Heart className={menuIcon} />
                      Wishlist
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 cursor-pointer">
                    <Store className={menuIcon} />
                    Become a Seller
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 cursor-pointer">
                    <Gift className={menuIcon} />
                    Gift Cards
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 cursor-pointer">
                    <Bell className={menuIcon} />
                    Notification Preferences
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 cursor-pointer">
                    <Headphones className={menuIcon} />
                    24x7 Customer Care
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 cursor-pointer">
                    <Megaphone className={menuIcon} />
                    Advertise
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 cursor-pointer">
                    <Smartphone className={menuIcon} />
                    Download App
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-[#2874f0] font-medium cursor-pointer"
                    onClick={() => {
                      logout();
                      navigate("/");
                    }}
                  >
                    Logout
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className={navBtn}>
                  <User className="w-5 h-5" />
                  <span className="hidden sm:inline">{guestMenuLabel}</span>
                  <ChevronDown className="w-4 h-4 opacity-70 hidden sm:inline" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 p-0">
                <div className="py-1 max-h-[min(70vh,480px)] overflow-y-auto">
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/login?register=1" className="text-[#2874f0] font-semibold flex items-center gap-3 px-3 py-2.5">
                      <UserCircle className="w-4 h-4 shrink-0" />
                      New customer? Sign Up
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/login" className="flex items-center gap-3 px-3 py-2">
                      <UserCircle className={menuIcon} />
                      Login
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 cursor-pointer">
                    <UserCircle className={menuIcon} />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 cursor-pointer">
                    <Sparkles className={menuIcon} />
                    Flipkart Plus Zone
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/orders" className="flex items-center gap-3 px-3 py-2">
                      <Package className={menuIcon} />
                      Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/wishlist" className="flex items-center gap-3 px-3 py-2">
                      <Heart className={menuIcon} />
                      Wishlist
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 cursor-pointer">
                    <Store className={menuIcon} />
                    Become a Seller
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 cursor-pointer">
                    <Medal className={menuIcon} />
                    Rewards
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 cursor-pointer">
                    <Gift className={menuIcon} />
                    Gift Cards
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 cursor-pointer">
                    <Bell className={menuIcon} />
                    Notification Preferences
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 cursor-pointer">
                    <Headphones className={menuIcon} />
                    24x7 Customer Care
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 cursor-pointer">
                    <Megaphone className={menuIcon} />
                    Advertise
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 cursor-pointer">
                    <Smartphone className={menuIcon} />
                    Download App
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className={cn(navBtn, "hidden md:flex")}>
                <span>More</span>
                <ChevronDown className="w-4 h-4 opacity-70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>Notification preferences</DropdownMenuItem>
              <DropdownMenuItem>24x7 Customer Care</DropdownMenuItem>
              <DropdownMenuItem>Advertise</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button type="button" className={cn("md:hidden p-2 rounded-lg", isBlue ? "text-white hover:bg-white/15" : "text-[#212121] hover:bg-[#f0f2f5]")} aria-label="More">
            <MoreHorizontal className="w-5 h-5" />
          </button>

          <Link
            to="/cart"
            className={cn(
              "rounded-lg transition-colors relative",
              isPdp
                ? "flex flex-row items-center gap-1.5 text-sm font-medium text-[#212121] px-2 py-2 hover:bg-[#f0f2f5]"
                : "flex flex-col items-center gap-0.5 text-xs px-2 py-1",
              isBlue ? "text-white font-bold hover:bg-white/15" : !isPdp && "text-[#212121] font-medium hover:bg-[#f0f2f5]",
            )}
          >
            <ShoppingCart className={cn(isPdp ? "w-5 h-5" : "w-6 h-6")} />
            <span className={isPdp ? "inline" : "hidden sm:inline"}>Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-0.5 right-0 sm:right-1 bg-[#ff6161] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
