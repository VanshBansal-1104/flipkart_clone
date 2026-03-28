import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  Smartphone,
  Shirt,
  Home,
  Armchair,
  ShoppingBag,
  Palette,
  Gamepad2,
  Apple,
  CookingPot,
  Laptop,
  CarFront,
  Bike,
  BookOpen,
  Dumbbell,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Home page category strip — icon row matches Flipkart-style nav */
const categories: { id: string; name: string; Icon: typeof Smartphone; query: string }[] = [
  { id: "foryou", name: "For You", Icon: ShoppingBag, query: "" },
  { id: "fashion", name: "Fashion", Icon: Shirt, query: "Fashion" },
  { id: "mobiles", name: "Mobiles", Icon: Smartphone, query: "Mobiles" },
  { id: "beauty", name: "Beauty", Icon: Palette, query: "Beauty & Health" },
  { id: "electronics", name: "Electronics", Icon: Laptop, query: "Electronics" },
  { id: "home", name: "Home", Icon: Home, query: "Home & Furniture" },
  { id: "appliances", name: "Appliances", Icon: CookingPot, query: "Appliances" },
  { id: "toys", name: "Toys, ba...", Icon: Gamepad2, query: "Sports" },
  { id: "food", name: "Food & H...", Icon: Apple, query: "Beauty & Health" },
  { id: "auto", name: "Auto Acc...", Icon: CarFront, query: "Electronics" },
  { id: "two_wheel", name: "2 Wheele...", Icon: Bike, query: "Sports" },
  { id: "sports", name: "Sports & ...", Icon: Dumbbell, query: "Sports" },
  { id: "books", name: "Books & ...", Icon: BookOpen, query: "Books" },
  { id: "furniture", name: "Furniture", Icon: Armchair, query: "Home & Furniture" },
];

const CategoryBar = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get("category") || "";
  const searchQ = searchParams.get("search") || "";

  const isActive = (cat: (typeof categories)[0]) => {
    if (cat.id === "foryou") {
      return location.pathname === "/" && !categoryParam && !searchQ;
    }
    return categoryParam === cat.query;
  };

  const hrefFor = (cat: (typeof categories)[0]) => {
    if (cat.id === "foryou") return "/";
    return `/?category=${encodeURIComponent(cat.query)}`;
  };

  return (
    <div className="bg-white border-t border-b border-[#e8e8e8]">
      <div className="max-w-[1280px] mx-auto flex overflow-x-auto px-2 py-2 scrollbar-hide gap-0.5">
        {categories.map((cat) => {
          const active = isActive(cat);
          return (
            <Link
              key={cat.id}
              to={hrefFor(cat)}
              className={cn(
                "flex flex-col items-center min-w-[68px] px-1.5 py-2 rounded-xl transition-colors relative",
                active ? "text-[#2874f0]" : "text-[#212121] hover:bg-[#f5f5f5]",
              )}
            >
              <span
                className={cn(
                  "w-[52px] h-[52px] sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-1.5 border-2 shadow-sm",
                  active ? "border-[#2874f0] bg-[#e8f0fe]" : "border-[#e8e8e8] bg-[#fafafa]",
                )}
              >
                <cat.Icon className={cn("w-6 h-6 sm:w-7 sm:h-7", active ? "text-[#2874f0]" : "text-[#212121]")} strokeWidth={1.5} />
              </span>
              <span className="text-[10px] sm:text-[11px] font-medium text-center leading-tight max-w-[72px] truncate">
                {cat.name}
              </span>
              {active && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 sm:w-10 h-[3px] rounded-t bg-[#2874f0]" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryBar;
