import { useMemo, useState } from "react";
import Header from "@/components/Header";
import AccountCategoryBar from "@/components/AccountCategoryBar";
import AccountSidebar from "@/components/AccountSidebar";
import { useStore, Order } from "@/store/useStore";
import { useAuthStore } from "@/store/authStore";
import { Link } from "react-router-dom";
import { Search, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchOrders, type ApiOrder } from "@/lib/ordersApi";

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);

function orderYear(dateStr: string) {
  return new Date(dateStr).getFullYear();
}

const Orders = () => {
  const token = useAuthStore((s) => s.token);
  const localOrders = useStore((s) => s.orders);

  const { data: apiOrders, isLoading } = useQuery({
    queryKey: ["orders", token],
    queryFn: () => fetchOrders(token!),
    enabled: !!token,
  });

  const orders: (Order | ApiOrder)[] = token ? apiOrders ?? [] : localOrders;

  const [q, setQ] = useState("");
  const [statusOnWay, setStatusOnWay] = useState(false);
  const [statusDelivered, setStatusDelivered] = useState(true);
  const [statusCancelled, setStatusCancelled] = useState(false);
  const [statusReturned, setStatusReturned] = useState(false);
  const [time30, setTime30] = useState(true);
  const [time2024, setTime2024] = useState(false);
  const [time2023, setTime2023] = useState(false);
  const [timeOlder, setTimeOlder] = useState(false);

  const filtered = useMemo(() => {
    const search = q.trim().toLowerCase();
    const anyStatus = statusOnWay || statusDelivered || statusCancelled || statusReturned;
    const anyTime = time30 || time2024 || time2023 || timeOlder;

    return orders.filter((order) => {
      if (anyStatus && !statusDelivered) return false;

      const date = order.date;
      const y = orderYear(date);
      const days = (Date.now() - new Date(date).getTime()) / 86400000;

      let timeOk = true;
      if (anyTime) {
        timeOk = false;
        if (time30 && days <= 30) timeOk = true;
        if (time2024 && y === 2024) timeOk = true;
        if (time2023 && y === 2023) timeOk = true;
        if (timeOlder && y < 2023) timeOk = true;
      }

      if (!timeOk) return false;

      const items = order.items;
      const matchSearch =
        !search ||
        items.some((it) => {
          const name = it.product.name;
          return name.toLowerCase().includes(search);
        });

      return matchSearch;
    });
  }, [
    orders,
    q,
    time30,
    time2024,
    time2023,
    timeOlder,
    statusOnWay,
    statusDelivered,
    statusCancelled,
    statusReturned,
  ]);

  const renderOrderRows = (order: Order | ApiOrder) => {
    const items = order.items;
    const deliveredDate = new Date(order.date);
    const displayDate = deliveredDate.toLocaleDateString("en-IN", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    return (
      <div className="divide-y divide-[#e8e8e8]">
        {items.map((item, idx) => {
          const product = item.product;
          const pid = product.id;
          const name = product.name;
          const img = product.images[0];
          const price = product.price * item.quantity;

          return (
            <div
              key={`${order.id}-${pid}-${idx}`}
              className="flex flex-wrap items-center gap-4 p-4 hover:bg-[#fafafa] transition-colors"
            >
              <Link to={`/product/${pid}`} className="w-20 h-20 flex-shrink-0 border border-[#e8e8e8] rounded-lg p-2 bg-white">
                <img src={img} alt="" className="w-full h-full object-contain" />
              </Link>
              <div className="flex-1 min-w-[200px]">
                <Link to={`/product/${pid}`} className="text-sm font-medium text-[#212121] hover:text-[#2874f0] line-clamp-2">
                  {name}
                </Link>
                <p className="text-xs text-[#878787] mt-1">Color: Assorted</p>
              </div>
              <div className="text-sm font-semibold text-[#212121] w-24 text-center">{formatPrice(price)}</div>
              <div className="flex-1 min-w-[200px] text-right md:text-left">
                <p className="text-sm text-[#212121] flex items-center justify-end md:justify-start gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#388e3c]" />
                  Delivered on {displayDate}
                </p>
                <p className="text-xs text-[#878787] mt-0.5">Your item has been delivered</p>
                <button type="button" className="text-[#2874f0] text-sm font-semibold mt-2 inline-flex items-center gap-1 hover:underline">
                  <Star className="w-4 h-4 fill-[#2874f0] text-[#2874f0]" />
                  Rate &amp; Review Product
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f1f3f6]">
      <Header variant="blue" />
      <AccountCategoryBar />

      <div className="max-w-[1280px] mx-auto px-3 sm:px-4 py-4 flex flex-col lg:flex-row gap-4 items-start">
        <AccountSidebar active="orders" />

        <div className="flex-1 min-w-0 w-full flex flex-col lg:flex-row gap-4">
          {/* Filters — desktop left */}
          <aside className="w-full lg:w-[240px] flex-shrink-0 space-y-3 order-2 lg:order-1">
            <p className="text-xs text-[#878787] px-1">
              <Link to="/" className="hover:text-[#2874f0]">
                Home
              </Link>
              {" "}
              &gt;{" "}
              <span>My Account</span> &gt; <span className="text-[#212121]">My Orders</span>
            </p>
            <div className="bg-white rounded-xl border border-[#e0e0e0] p-4 shadow-sm">
              <h2 className="font-bold text-[#212121] mb-3">Filters</h2>
              <p className="text-xs font-bold text-[#878787] uppercase mb-2">Order Status</p>
              <label className="flex items-center gap-2 text-sm text-[#212121] py-1.5 cursor-pointer">
                <input type="checkbox" checked={statusOnWay} onChange={(e) => setStatusOnWay(e.target.checked)} className="accent-[#2874f0]" />
                On the way
              </label>
              <label className="flex items-center gap-2 text-sm text-[#212121] py-1.5 cursor-pointer">
                <input type="checkbox" checked={statusDelivered} onChange={(e) => setStatusDelivered(e.target.checked)} className="accent-[#2874f0]" />
                Delivered
              </label>
              <label className="flex items-center gap-2 text-sm text-[#212121] py-1.5 cursor-pointer">
                <input type="checkbox" checked={statusCancelled} onChange={(e) => setStatusCancelled(e.target.checked)} className="accent-[#2874f0]" />
                Cancelled
              </label>
              <label className="flex items-center gap-2 text-sm text-[#212121] py-1.5 cursor-pointer">
                <input type="checkbox" checked={statusReturned} onChange={(e) => setStatusReturned(e.target.checked)} className="accent-[#2874f0]" />
                Returned
              </label>

              <p className="text-xs font-bold text-[#878787] uppercase mt-4 mb-2">Order Time</p>
              <label className="flex items-center gap-2 text-sm text-[#212121] py-1.5 cursor-pointer">
                <input type="checkbox" checked={time30} onChange={(e) => setTime30(e.target.checked)} className="accent-[#2874f0]" />
                Last 30 days
              </label>
              <label className="flex items-center gap-2 text-sm text-[#212121] py-1.5 cursor-pointer">
                <input type="checkbox" checked={time2024} onChange={(e) => setTime2024(e.target.checked)} className="accent-[#2874f0]" />
                2024
              </label>
              <label className="flex items-center gap-2 text-sm text-[#212121] py-1.5 cursor-pointer">
                <input type="checkbox" checked={time2023} onChange={(e) => setTime2023(e.target.checked)} className="accent-[#2874f0]" />
                2023
              </label>
              <label className="flex items-center gap-2 text-sm text-[#212121] py-1.5 cursor-pointer">
                <input type="checkbox" checked={timeOlder} onChange={(e) => setTimeOlder(e.target.checked)} className="accent-[#2874f0]" />
                Older
              </label>
            </div>
          </aside>

          <div className="flex-1 min-w-0 order-1 lg:order-2 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#878787]" />
                <input
                  type="search"
                  placeholder="Search your orders here"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full border border-[#e0e0e0] rounded-lg pl-10 pr-3 py-2.5 text-sm text-[#212121] bg-white"
                />
              </div>
              <button
                type="button"
                className="bg-[#2874f0] text-white font-semibold px-6 py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-[#1c5fd4]"
              >
                <Search className="w-4 h-4" />
                Search Orders
              </button>
            </div>

            {token && isLoading ? (
              <div className="bg-white rounded-xl border border-[#e0e0e0] p-12 text-center text-[#878787]">Loading orders…</div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-xl border border-[#e0e0e0] p-12 text-center">
                <p className="text-[#878787]">No orders found</p>
                <Link to="/" className="inline-block mt-4 text-[#2874f0] font-semibold">
                  Shop now
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((order) => (
                  <div key={order.id} className="bg-white rounded-xl border border-[#e0e0e0] shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#e8e8e8] flex flex-wrap justify-between gap-2 bg-[#fafafa]">
                      <span className="text-sm font-semibold text-[#212121]">Order #{order.id}</span>
                      <span className="text-sm font-bold text-[#212121]">{formatPrice(order.total)}</span>
                    </div>
                    {renderOrderRows(order)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Orders;
