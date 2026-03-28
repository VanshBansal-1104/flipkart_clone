import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";

const links: { label: string; to: string; chevron?: boolean }[] = [
  { label: "Electronics", to: "/?category=Electronics", chevron: true },
  { label: "TVs & Appliances", to: "/?category=Appliances", chevron: true },
  { label: "Men", to: "/?category=Fashion", chevron: true },
  { label: "Women", to: "/?category=Fashion", chevron: true },
  { label: "Baby & Kids", to: "/?category=Fashion", chevron: true },
  { label: "Home & Furniture", to: "/?category=Home%20%26%20Furniture", chevron: true },
  { label: "Sports", to: "/?category=Sports", chevron: true },
  { label: "Books & More", to: "/?category=Books", chevron: true },
  { label: "Flights", to: "/" },
  { label: "Offer Zone", to: "/" },
  { label: "Grocery", to: "/" },
];

/** White category row under blue header (orders / wishlist / account) */
const AccountCategoryBar = () => (
  <div className="bg-white border-b border-[#e0e0e0] shadow-sm">
    <div className="max-w-[1280px] mx-auto flex overflow-x-auto items-center gap-0.5 px-2 py-2.5 scrollbar-hide">
      {links.map((l) => (
        <Link
          key={l.label}
          to={l.to}
          className="flex items-center gap-0.5 whitespace-nowrap px-2.5 sm:px-3 py-1.5 text-sm text-[#212121] hover:text-[#2874f0] rounded-md hover:bg-[#f5f5f5]"
        >
          {l.label}
          {l.chevron !== false && l.chevron ? <ChevronDown className="w-3.5 h-3.5 text-[#878787]" /> : null}
        </Link>
      ))}
    </div>
  </div>
);

export default AccountCategoryBar;
