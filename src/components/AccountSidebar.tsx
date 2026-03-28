import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { User, ClipboardList, CreditCard, Bookmark, LogOut, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";

type Props = { active: "orders" | "wishlist" | "profile" | "payments" };

const AccountSidebar = ({ active }: Props) => {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const item = (key: Props["active"], href: string, label: string, icon: ReactNode) => (
    <Link
      to={href}
      className={`flex items-center gap-3 px-4 py-3 text-sm border-b border-[#f0f0f0] hover:bg-[#fafafa] ${
        active === key ? "text-[#2874f0] font-semibold bg-[#f8fbff]" : "text-[#212121]"
      }`}
    >
      <span className="text-[#2874f0]">{icon}</span>
      <span className="flex-1">{label}</span>
      <ChevronRight className="w-4 h-4 text-[#bdbdbd]" />
    </Link>
  );

  return (
    <aside className="w-full md:w-[280px] flex-shrink-0 space-y-3">
      <div className="bg-white rounded-lg border border-[#e0e0e0] p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[#FFD814] flex items-center justify-center">
          <User className="w-7 h-7 text-[#2874f0]" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-[#878787]">Hello,</p>
          <p className="text-sm font-semibold text-[#212121] truncate">
            {user?.name || user?.email?.split("@")[0] || "Flipkart Customer"}
          </p>
        </div>
      </div>

      <nav className="bg-white rounded-lg border border-[#e0e0e0] overflow-hidden">
        <p className="text-xs font-bold text-[#878787] px-4 pt-3 pb-1 uppercase tracking-wide">My Activity</p>
        {item("orders", "/orders", "My Orders", <ClipboardList className="w-5 h-5" />)}
        {item("wishlist", "/wishlist", "My Wishlist", <Bookmark className="w-5 h-5" />)}
        {item("profile", "/profile", "Profile Information", <User className="w-5 h-5" />)}
        {item("payments", "/profile", "Saved Payments", <CreditCard className="w-5 h-5" />)}
        <button
          type="button"
          onClick={() => {
            logout();
            navigate("/");
          }}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#212121] hover:bg-[#fafafa] border-t border-[#f0f0f0]"
        >
          <LogOut className="w-5 h-5 text-[#2874f0]" />
          Logout
        </button>
      </nav>
    </aside>
  );
};

export default AccountSidebar;
