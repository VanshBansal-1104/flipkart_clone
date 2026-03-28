import Header from "@/components/Header";
import { useStore } from "@/store/useStore";
import { useParams, Link } from "react-router-dom";

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const orders = useStore((s) => s.orders);
  const order = orders.find((o) => o.id === orderId);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);

  const deliveryDate = new Date(Date.now() + Math.floor(Math.random() * 3 + 3) * 86400000).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-[700px] mx-auto px-4 py-16">
        <div className="fk-card-surface p-10 text-center">
          <div className="text-6xl mb-5">✅</div>
          <h1 className="text-2xl font-bold text-fk-green mb-2">Order Placed Successfully!</h1>
          <p className="text-muted-foreground mb-5">Your order has been placed and is being processed.</p>

          <div className="bg-muted rounded p-4 mb-4 inline-block min-w-80">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Order ID</p>
            <p className="text-lg font-mono text-foreground font-bold">{orderId}</p>
          </div>

          <div className="bg-blue-50 rounded p-3 mb-4 text-sm text-blue-800">
            📦 Estimated delivery by <strong>{deliveryDate}</strong> to {order?.address.city}, {order?.address.state} - {order?.address.pincode}
          </div>

          {order && (
            <div className="text-left text-sm text-muted-foreground mb-6">
              <p className="font-semibold text-foreground mb-2">Order Summary:</p>
              {order.items.map((item) => (
                <div key={item.product.id} className="py-1">
                  • {item.product.name.slice(0, 50)} × {item.quantity} — {formatPrice(item.product.price * item.quantity)}
                </div>
              ))}
              <div className="mt-3 pt-2 border-t border-border font-semibold text-foreground">
                Total Paid: {formatPrice(order.total + 49)}
              </div>
            </div>
          )}

          <Link
            to="/"
            className="bg-primary text-primary-foreground px-8 py-3 rounded font-medium hover:opacity-90 inline-block"
          >
            Continue Shopping
          </Link>
        </div>
      </main>
    </div>
  );
};

export default OrderConfirmation;
