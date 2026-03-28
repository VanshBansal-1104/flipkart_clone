import { Link } from "react-router-dom";
import { Star, Heart } from "lucide-react";
import { Product } from "@/data/products";
import { useStore } from "@/store/useStore";

const ProductCard = ({ product }: { product: Product }) => {
  const toggleWishlist = useStore((s) => s.toggleWishlist);
  const isInWishlist = useStore((s) => s.isInWishlist(product.id));

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);

  return (
    <div className="bg-card rounded-sm border border-border/70 fk-shadow hover:fk-shadow-hover transition-shadow duration-200 group cursor-pointer relative">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleWishlist(product);
        }}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-full hover:bg-muted transition-colors"
      >
        <Heart
          className={`w-4 h-4 ${isInWishlist ? "fill-destructive text-destructive" : "text-muted-foreground"}`}
        />
      </button>

      <Link to={`/product/${product.id}`} className="block p-4 text-center">
        <div className="aspect-square flex items-center justify-center mb-3 overflow-hidden">
          <img
            src={product.images[0]}
            alt={product.name}
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
            onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/200x160?text=No+Image')}
          />
        </div>

        <div className="text-sm text-foreground line-clamp-2 mb-2 leading-snug text-left">
          {product.name}
        </div>

        <div className="flex items-center gap-1.5 mb-2 justify-center">
          <span className="bg-fk-green text-primary-foreground text-xs px-1.5 py-0.5 rounded-sm flex items-center gap-0.5 font-medium">
            <Star className="w-3 h-3 fill-current" />
            {product.rating}
          </span>
          <span className="text-xs text-muted-foreground">
            ({product.ratingCount.toLocaleString()})
          </span>
        </div>

        <div className="text-left">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-base font-medium text-foreground">{formatPrice(product.price)}</span>
            <span className="text-xs text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
            <span className="text-xs text-fk-green font-medium">{product.discount}% off</span>
          </div>
          <div className="text-xs text-primary font-semibold">✦ Flipkart Assured</div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
