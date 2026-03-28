import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
  {
    brand: "DAIKIN",
    line1: "The air specialist",
    line2: "Shop now",
    sub: "Easy EMI | Cashback: upto ₹3,000",
    bg: "bg-gradient-to-br from-[#0a4a8c] via-[#1565c0] to-[#0d47a1]",
    text: "text-white",
  },
  {
    brand: "motorola",
    line1: "Smart ACs From ₹28,990*",
    line2: "Enjoy benefits worth ₹10,750",
    sub: "FREE INSTALLATION · 3 YEARS WARRANTY",
    bg: "bg-gradient-to-br from-[#0d3d6b] via-[#1565c0] to-[#0a2540]",
    text: "text-white",
  },
  {
    brand: "SAMSUNG",
    line1: "10% AI energy saving",
    line2: "From ₹2,111/M*",
    sub: "Topup cashback ₹2,500*",
    bg: "bg-gradient-to-br from-[#f5f5f5] to-[#e8e8e8]",
    text: "text-[#212121]",
  },
];

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const n = slides.length;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % n);
    }, 5000);
    return () => clearInterval(timer);
  }, [n]);

  return (
    <div className="bg-white max-w-[1280px] mx-auto px-3 sm:px-4 pt-4 pb-2">
      <div className="relative rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{
              width: `${n * 100}%`,
              transform: `translateX(-${(currentSlide * 100) / n}%)`,
            }}
          >
            {slides.map((slide, index) => (
              <div
                key={index}
                style={{ width: `${100 / n}%` }}
                className={`min-h-[180px] sm:min-h-[220px] flex flex-col justify-center px-8 sm:px-14 py-8 ${slide.bg} ${slide.text}`}
              >
                <p className="text-xs sm:text-sm font-bold tracking-widest opacity-90 mb-2">{slide.brand}</p>
                <h2 className="text-xl sm:text-3xl font-bold leading-tight mb-1">{slide.line1}</h2>
                <p className="text-sm sm:text-lg font-medium opacity-95 mb-2">{slide.line2}</p>
                <p className="text-[11px] sm:text-xs opacity-80">{slide.sub}</p>
                <button
                  type="button"
                  className="mt-4 self-start px-5 py-2 rounded-lg bg-white text-[#2874f0] text-sm font-bold shadow-md hover:bg-[#f5f5f5] transition-colors"
                >
                  Shop now
                </button>
              </div>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCurrentSlide((currentSlide - 1 + n) % n)}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 shadow-md flex items-center justify-center text-[#2874f0] hover:bg-white z-10"
          aria-label="Previous"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => setCurrentSlide((currentSlide + 1) % n)}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 shadow-md flex items-center justify-center text-[#2874f0] hover:bg-white z-10"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentSlide(index)}
              className={`h-1.5 rounded-full transition-all ${index === currentSlide ? "w-6 bg-[#212121]/50" : "w-1.5 bg-[#212121]/25"}`}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Hero;
