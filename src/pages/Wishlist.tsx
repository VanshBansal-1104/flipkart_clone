import Header from "@/components/Header";
import AccountCategoryBar from "@/components/AccountCategoryBar";
import AccountSidebar from "@/components/AccountSidebar";
import ProductCard from "@/components/ProductCard";
import { useStore } from "@/store/useStore";
import { Link } from "react-router-dom";

const Wishlist = () => {
  const wishlist = useStore((s) => s.wishlist);

  return (
    <div className="min-h-screen bg-[#f1f3f6]">
      <Header variant="blue" />
      <AccountCategoryBar />

      <div className="max-w-[1280px] mx-auto px-3 sm:px-4 py-6 flex flex-col md:flex-row gap-4 items-start">
        <AccountSidebar active="wishlist" />

        <main className="flex-1 min-w-0 w-full bg-white rounded-xl border border-[#e0e0e0] shadow-sm min-h-[420px] flex flex-col">
          {wishlist.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="w-48 h-36 mb-8 rounded-2xl bg-gradient-to-b from-[#e3f2fd] to-[#fafafa] border border-[#e8e8e8] flex items-center justify-center text-6xl shadow-inner">
                💻
              </div>
              <h1 className="text-xl font-bold text-[#212121] mb-2">Empty Wishlist</h1>
              <p className="text-sm text-[#878787] max-w-md mb-6">You have no items in your wishlist. Start adding!</p>
              <Link to="/" className="bg-[#fb641b] text-white font-bold px-8 py-3 rounded-lg text-sm hover:opacity-95 shadow-sm">
                Continue shopping
              </Link>
            </div>
          ) : (
            <>
              <div className="px-5 py-4 border-b border-[#e8e8e8]">
                <h1 className="text-lg font-bold text-[#212121]">My Wishlist ({wishlist.length})</h1>
              </div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {wishlist.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Wishlist;
