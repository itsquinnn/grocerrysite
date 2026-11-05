import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, HeartHandshake, Compass, Truck } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our Story — DOVAN" },
      { name: "description", content: "Learn about DOVAN: the confluence of traditional Nepali craftsmanship and contemporary design. Delivering across all 77 districts." },
      { property: "og:title", content: "Our Story — DOVAN" },
      { property: "og:description", content: "Learn about DOVAN: the confluence of traditional Nepali craftsmanship and contemporary design." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { isNepali } = useI18n();

  return (
    <div className="space-y-16 py-8 md:space-y-24 md:py-12">
      {/* Hero Header */}
      <section className="container-page">
        <div className="max-w-3xl">
          <p className="eyebrow">{"Our Story & Heritage"}</p>
          <h1 className="mt-2 font-display text-4xl leading-tight sm:text-5xl md:text-6xl">
            {"Where Himalayan craftsmanship meets contemporary living."}
          </h1>
          <p className="mt-5 text-base text-muted-foreground sm:text-lg">
            {"DOVAN was founded on a simple conviction: that fewer, better things created with intention, local materials, and deep respect for makers bring lasting value to our homes, wardrobes, and daily rituals."}
          </p>
        </div>
      </section>

      {/* Hero Image Banner */}
      <section className="container-page">
        <div className="relative overflow-hidden rounded-xl">
          <img
            src="/assets/banners/hero.jpg"
            alt="Handcrafted goods in a sunlit studio"
            className="h-[360px] w-full object-cover md:h-[480px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-primary-foreground md:bottom-10 md:left-10">
            <p className="eyebrow text-primary-foreground/80">{"The Meaning of DOVAN"}</p>
            <p className="mt-1 font-display text-2xl font-normal md:text-3xl">
              {'"DOVAN" — The sacred confluence where two rivers unite as one.'}
            </p>
            <p className="mt-2 max-w-xl text-xs text-primary-foreground/80 sm:text-sm">
              {"We stand at the meeting point of generational Nepali artisan heritage and clean modern aesthetics."}
            </p>
          </div>
        </div>
      </section>

      {/* Stats Counter Row */}
      <section className="border-y bg-card py-10">
        <div className="container-page grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <p className="font-display text-4xl font-semibold md:text-5xl">{"77"}</p>
            <p className="mt-1 text-sm font-medium">{"Districts Delivered"}</p>
            <p className="text-xs text-muted-foreground">{"From Jhapa to Darchula"}</p>
          </div>
          <div>
            <p className="font-display text-4xl font-semibold md:text-5xl">{"100+"}</p>
            <p className="mt-1 text-sm font-medium">{"Local Artisan Partners"}</p>
            <p className="text-xs text-muted-foreground">{"Fair wages & zero middlemen"}</p>
          </div>
          <div>
            <p className="font-display text-4xl font-semibold md:text-5xl">{"100%"}</p>
            <p className="mt-1 text-sm font-medium">{"Cash on Delivery"}</p>
            <p className="text-xs text-muted-foreground">{"Pay when goods reach you"}</p>
          </div>
          <div>
            <p className="font-display text-4xl font-semibold md:text-5xl">{"4.9 / 5"}</p>
            <p className="mt-1 text-sm font-medium">{"Customer Rating"}</p>
            <p className="text-xs text-muted-foreground">{"Loved across Nepal"}</p>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="container-page">
        <div className="text-center md:text-left">
          <p className="eyebrow">{"Our Guiding Pillars"}</p>
          <h2 className="mt-1 font-display text-3xl md:text-4xl">
            {"What we stand for"}
          </h2>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-card p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-accent">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-semibold text-lg">{"Pure Himalayan Materials"}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {"We source cruelty-free Chyangra pashmina from the high Mustang plateau, organic orthodox green tea from Ilam, and handwoven Dhaka cotton from Palpa."}
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-accent">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-semibold text-lg">{"Fair Artisan Trade"}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {"We work directly with craft guilds in Patan, Bhaktapur, and rural communities, ensuring ethical working conditions, fair prices, and dignity of labor."}
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-accent">
              <Compass className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-semibold text-lg">{"Built for the Trail & Home"}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {"Every garment and travel gear piece is tested in the unique topography of Nepal — rugged enough for the Annapurna Circuit, refined for city cafes."}
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-accent">
              <Truck className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-semibold text-lg">{"Nationwide Accessibility"}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {"E-commerce shouldn't stop at ring road. We partner with reliable ground couriers to deliver verified packages with cash-on-delivery all across Nepal."}
            </p>
          </div>
        </div>
      </section>

      {/* Story Narrative Box */}
      <section className="container-page">
        <div className="grid gap-10 rounded-xl border bg-secondary/50 p-8 md:grid-cols-2 md:p-12">
          <div>
            <p className="eyebrow">{"Our Philosophy"}</p>
            <h2 className="mt-2 font-display text-3xl md:text-4xl">
              {"Fewer, better things that grow with you."}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
              {"In a world flooded with disposable fast fashion and unverified knockoffs, we wanted to build an alternative. Every product in the DOVAN catalog is selected because it solves a real need, lasts for years, and tells a genuine story of craft."}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
              {"Whether it's a hand-thrown ceramic mug made by 4th generation potters in Bhaktapur, or our technical weatherproof jackets tailored for mountain rain, you can feel the distinction from the moment you unpack it."}
            </p>
          </div>
          <div className="flex flex-col justify-between rounded-lg border bg-card p-6 shadow-sm">
            <div>
              <p className="font-display text-lg italic text-foreground">
                {'"Quality is remembering the human hands behind what you wear and use every day. DOVAN exists to celebrate Nepali craftspeople and bring their finest works to your doorstep."'}
              </p>
              <p className="mt-4 font-semibold text-sm">
                {"— The DOVAN Collective, Kathmandu"}
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/shop">{"Explore the Collection"}</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/stores">{"Visit Our Stores"}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
