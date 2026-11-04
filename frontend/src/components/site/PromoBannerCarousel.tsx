import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PromoSlide {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  ctaSearch?: Record<string, any>;
  image: string;
  align: "left" | "right";
  gradient: string;
  badge?: string;
}

const PROMO_SLIDES: PromoSlide[] = [
  {
    id: "dashain-adventure",
    eyebrow: "Dashain Offer",
    title: "Rs. 500 off the trail",
    description: "Code DASHAIN500 on orders above Rs. 5,000.",
    ctaText: "Shop outdoors",
    ctaLink: "/shop",
    ctaSearch: { category: "sports" },
    image: "/assets/banners/promo.jpg",
    align: "right",
    gradient: "from-black/90 via-black/50 to-transparent",
    badge: "Festival Deal",
  },
  {
    id: "farm-fresh",
    eyebrow: "Farm to Table · Daily Harvest",
    title: "100% Organic & Farm Fresh",
    description: "Crisp seasonal vegetables, orchard fruits, and pure dairy harvested daily from local farms.",
    ctaText: "Explore fresh produce",
    ctaLink: "/shop",
    ctaSearch: { category: "fresh-vegetables" },
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=80",
    align: "left",
    gradient: "from-emerald-950/95 via-emerald-950/50 to-transparent",
    badge: "Harvest Fresh",
  },
  {
    id: "himalayan-heritage",
    eyebrow: "Artisan Heritage Collection",
    title: "Timeless Himalayan Craftsmanship",
    description: "Hand-spun pure Pashmina shawls, authentic Dhaka weaves, and generational pottery made with care.",
    ctaText: "Explore artisan collection",
    ctaLink: "/shop",
    ctaSearch: { category: "organic-local" },
    image: "/assets/banners/heritage.jpg",
    align: "right",
    gradient: "from-stone-950/90 via-stone-900/50 to-transparent",
    badge: "Heritage Craft",
  },
  {
    id: "express-delivery",
    eyebrow: "Nationwide Doorstep Delivery",
    title: "Express 30-Min Delivery in Kathmandu",
    description: "Cash on delivery available across all 77 districts of Nepal with live GPS tracking on every order.",
    ctaText: "View special offers",
    ctaLink: "/shop",
    ctaSearch: { sale: true },
    image: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1600&q=80",
    align: "left",
    gradient: "from-slate-950/95 via-slate-900/55 to-transparent",
    badge: "All 77 Districts",
  },
];

export function PromoBannerCarousel() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % PROMO_SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrent((prev) => (prev - 1 + PROMO_SLIDES.length) % PROMO_SLIDES.length);
  }, []);

  // Auto-rotate every 5 seconds, paused when hovering or interacting
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 45) {
      nextSlide();
    } else if (diff < -45) {
      prevSlide();
    }
    touchStartX.current = null;
  };

  return (
    <section className="container-page mt-12 md:mt-16 select-none">
      <div
        className="group relative h-84 sm:h-96 md:h-[440px] w-full overflow-hidden rounded-2xl shadow-lg ring-1 ring-border/30 bg-muted transform-gpu"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        role="region"
        aria-label="Promotional Banners Carousel"
      >
        {/* Slides */}
        {PROMO_SLIDES.map((slide, idx) => {
          const isActive = idx === current;
          return (
            <div
              key={slide.id}
              className={cn(
                "absolute inset-0 transition-all duration-700 ease-out transform-gpu will-change-transform",
                isActive
                  ? "opacity-100 scale-100 z-10 pointer-events-auto"
                  : "opacity-0 scale-105 z-0 pointer-events-none"
              )}
              aria-hidden={!isActive}
            >
              {/* Background Image */}
              <img
                src={slide.image}
                alt={slide.title}
                loading={idx === 0 ? "eager" : "lazy"}
                decoding="async"
                width={1600}
                height={800}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/assets/banners/promo.jpg";
                }}
                className="h-full w-full object-cover object-center transform-gpu"
              />

              {/* Gradient Overlay for Readability */}
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r",
                  slide.align === "right"
                    ? "md:bg-gradient-to-l from-black/90 via-black/55 md:to-transparent"
                    : "from-black/90 via-black/55 md:to-transparent",
                  slide.gradient
                )}
              />

              {/* Content Box */}
              <div
                className={cn(
                  "absolute inset-y-0 flex flex-col justify-center p-6 sm:p-8 md:p-14 text-white max-w-lg z-20",
                  slide.align === "right"
                    ? "right-0 text-left md:text-right md:items-end"
                    : "left-0 text-left md:items-start"
                )}
              >
                {slide.badge && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white mb-2.5 w-fit border border-white/25 shadow-xs">
                    <Sparkles className="h-3 w-3 text-amber-300 fill-amber-300" />
                    <span>{slide.badge}</span>
                  </span>
                )}

                <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.18em] text-white/85">
                  {slide.eyebrow}
                </p>

                <h2 className="mt-1.5 text-2xl sm:text-4xl md:text-5xl font-display font-semibold leading-tight text-white drop-shadow-sm">
                  {slide.title}
                </h2>

                <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm leading-relaxed text-white/90 font-normal drop-shadow-xs max-w-md">
                  {slide.description}
                </p>

                <div className="mt-5 sm:mt-6">
                  <Button
                    size="lg"
                    className="font-semibold shadow-md cursor-pointer transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98] bg-white text-gray-900 hover:bg-white/95"
                    asChild
                  >
                    <Link to={slide.ctaLink} search={slide.ctaSearch}>
                      {slide.ctaText} &rarr;
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Previous Button */}
        <button
          type="button"
          onClick={prevSlide}
          className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-30 h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-black/35 hover:bg-black/60 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all duration-200 opacity-80 group-hover:opacity-100 hover:scale-110 active:scale-95 cursor-pointer shadow-md"
          aria-label="Previous banner"
        >
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        {/* Next Button */}
        <button
          type="button"
          onClick={nextSlide}
          className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-30 h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-black/35 hover:bg-black/60 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all duration-200 opacity-80 group-hover:opacity-100 hover:scale-110 active:scale-95 cursor-pointer shadow-md"
          aria-label="Next banner"
        >
          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        {/* Bottom Carousel Navigation Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full bg-black/30 backdrop-blur-md px-3 py-1.5 border border-white/15">
          {PROMO_SLIDES.map((slide, idx) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setCurrent(idx)}
              className={cn(
                "h-2 rounded-full transition-all duration-300 cursor-pointer",
                idx === current
                  ? "w-7 bg-white shadow-xs"
                  : "w-2 bg-white/40 hover:bg-white/70"
              )}
              aria-label={`Go to slide ${idx + 1}: ${slide.title}`}
              aria-current={idx === current ? "true" : undefined}
            />
          ))}
          <span className="ml-1 text-[10px] font-mono font-medium text-white/70 tracking-wider">
            0{current + 1} / 0{PROMO_SLIDES.length}
          </span>
        </div>
      </div>
    </section>
  );
}

