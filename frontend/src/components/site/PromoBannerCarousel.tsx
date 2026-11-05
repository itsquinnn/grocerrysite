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
  badge?: string;
}

const PROMO_SLIDES: PromoSlide[] = [
  {
    id: "dashain-adventure",
    eyebrow: "Seasonal Outdoor Gear",
    title: "Rs. 500 Off the Trail",
    description: "Equip your Himalayan journey. Use code DASHAIN500 on all orders above Rs. 5,000.",
    ctaText: "Shop Outdoors",
    ctaLink: "/shop",
    ctaSearch: { category: "sports" },
    image: "/assets/banners/promo.jpg",
    align: "right",
    badge: "Festival Deal",
  },
  {
    id: "artisan-living",
    eyebrow: "Home & Daily Rituals",
    title: "Artisan Decor for Mindful Living",
    description: "Hand-thrown pottery, woven Dhaka throws, and warm brass lamps crafted for tranquil Nepali homes.",
    ctaText: "Explore Home Living",
    ctaLink: "/shop",
    ctaSearch: { category: "home" },
    image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=75",
    align: "left",
    badge: "New Arrivals",
  },
  {
    id: "himalayan-heritage",
    eyebrow: "Artisan Heritage Collection",
    title: "Timeless Himalayan Craftsmanship",
    description: "Hand-spun pure Pashmina shawls, authentic Dhaka weaves, and generational pottery made with care.",
    ctaText: "Explore Collection",
    ctaLink: "/shop",
    ctaSearch: { category: "organic-local" },
    image: "/assets/banners/heritage.jpg",
    align: "right",
    badge: "Heritage Craft",
  },
  {
    id: "nationwide-delivery",
    eyebrow: "Nationwide Doorstep Delivery",
    title: "Delivered Across All 77 Districts",
    description: "Shop with peace of mind. Doorstep delivery from Mechi to Mahakali with Cash on Delivery and easy returns.",
    ctaText: "View Delivery Hubs",
    ctaLink: "/stores",
    image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=75",
    align: "left",
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

  // Performance-optimized auto-rotate with Page Visibility API support
  useEffect(() => {
    if (isPaused) return;

    let intervalId: NodeJS.Timeout | null = null;

    const startTimer = () => {
      if (!intervalId && !document.hidden) {
        intervalId = setInterval(nextSlide, 5000);
      }
    };

    const stopTimer = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibility = () => {
      if (document.hidden) stopTimer();
      else startTimer();
    };

    startTimer();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stopTimer();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isPaused, nextSlide]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current !== null) {
      const diff = touchStartX.current - e.changedTouches[0].clientX;
      if (diff > 40) {
        nextSlide();
      } else if (diff < -40) {
        prevSlide();
      }
      touchStartX.current = null;
    }
    setIsPaused(false);
  };

  return (
    <section className="container-page mt-8 sm:mt-12 md:mt-16 select-none">
      <div
        className="group relative h-[360px] xs:h-[380px] sm:h-[420px] md:h-[460px] w-full overflow-hidden rounded-2xl shadow-md ring-1 ring-border/20 bg-muted"
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
                "absolute inset-0 transition-opacity duration-500 ease-in-out",
                isActive
                  ? "opacity-100 z-10 pointer-events-auto"
                  : "opacity-0 z-0 pointer-events-none"
              )}
              aria-hidden={!isActive}
            >
              {/* Background Image with performance-conscious sizing & loading */}
              <img
                src={slide.image}
                alt={slide.title}
                loading={idx === 0 ? "eager" : "lazy"}
                decoding="async"
                sizes="(max-width: 768px) 100vw, 1200px"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/assets/banners/promo.jpg";
                }}
                className="h-full w-full object-cover object-center"
              />

              {/* Scrim Gradient for 100% Crisp Legibility */}
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/35",
                  slide.align === "right"
                    ? "md:bg-gradient-to-l md:from-black/90 md:via-black/55 md:to-black/20"
                    : "md:bg-gradient-to-r md:from-black/90 md:via-black/55 md:to-black/20"
                )}
              />

              {/* Content Box */}
              <div
                className={cn(
                  "absolute inset-y-0 flex flex-col justify-center p-6 sm:p-10 md:p-14 text-white max-w-lg z-20",
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

                <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-white/85">
                  {slide.eyebrow}
                </p>

                <h2 className="mt-1.5 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-medium tracking-tight leading-[1.18] text-white drop-shadow-sm">
                  {slide.title}
                </h2>

                <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm leading-relaxed text-white/90 font-normal drop-shadow-xs max-w-sm sm:max-w-md">
                  {slide.description}
                </p>

                <div className="mt-5 sm:mt-6">
                  <Button
                    size="default"
                    className="h-10 sm:h-11 px-6 rounded-full font-medium text-xs sm:text-sm bg-white text-gray-900 hover:bg-white/95 shadow-md cursor-pointer transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]"
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

        {/* Previous Button - Hidden on mobile to prevent covering text, visible on desktop hover */}
        <button
          type="button"
          onClick={prevSlide}
          className="hidden md:flex absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 z-30 h-11 w-11 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/20 items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
          aria-label="Previous banner"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Next Button - Hidden on mobile to prevent covering text, visible on desktop hover */}
        <button
          type="button"
          onClick={nextSlide}
          className="hidden md:flex absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 z-30 h-11 w-11 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/20 items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
          aria-label="Next banner"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Bottom Carousel Navigation Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full bg-black/40 backdrop-blur-md px-3 py-1.5 border border-white/15">
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
          <span className="ml-1 text-[10px] font-mono font-medium text-white/75 tracking-wider">
            0{current + 1} / 0{PROMO_SLIDES.length}
          </span>
        </div>
      </div>
    </section>
  );
}
