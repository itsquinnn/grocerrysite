import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Phone, Clock, Truck, ShieldCheck, CheckCircle2, Search, Store } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/stores")({
  head: () => ({
    meta: [
      { title: "Stores & Delivery Coverage — DOVAN" },
      { name: "description", content: "Visit our flagship stores in Kathmandu, Lalitpur, and Pokhara, or check delivery times across all 77 districts of Nepal." },
      { property: "og:title", content: "Stores & Delivery Coverage — DOVAN" },
      { property: "og:description", content: "DOVAN stores and nationwide delivery coverage." },
    ],
  }),
  component: StoresPage,
});

const STORES_EN = [
  {
    name: "DOVAN Flagship Store",
    city: "Kathmandu",
    address: "Durbar Marg (Near Narayanhiti Gate), Kathmandu 44600",
    phone: "+977 1 4220192",
    hours: "Sunday – Friday: 10:00 AM – 8:00 PM | Saturday: 11:00 AM – 7:00 PM",
    features: ["Full Collection Showcase", "Click & Collect Pickup", "Personal Styling & Tailoring"],
  },
  {
    name: "DOVAN Artisan Gallery & Cafe",
    city: "Lalitpur",
    address: "Jhamsikhel Road (Opposite St. Mary's lane), Lalitpur 44700",
    phone: "+977 1 5539481",
    hours: "Sunday – Saturday: 9:30 AM – 8:30 PM",
    features: ["Handcrafted Pottery & Dhaka", "Artisan Workshops", "Instant Exchange Hub"],
  },
  {
    name: "DOVAN Himalayan Outpost",
    city: "Pokhara",
    address: "Lakeside 6, Baidam (Near Center Point), Pokhara 33700",
    phone: "+977 61 462910",
    hours: "Monday – Sunday: 8:00 AM – 9:00 PM",
    features: ["Trekking & Outdoor Gear", "Gear Rental & Testing", "Express Pickup"],
  },
  {
    name: "DOVAN Eastern Regional Hub",
    city: "Biratnagar",
    address: "Main Road (Near Traffic Chowk), Biratnagar 56613",
    phone: "+977 21 528390",
    hours: "Sunday – Friday: 10:00 AM – 7:00 PM",
    features: ["Eastern Nepal Dispatch Hub", "Cash on Delivery Support", "Customer Support Desk"],
  },
];

const STORES_NE = [
  {
    name: "दोभान मुख्य स्टोर (Flagship)",
    city: "काठमाडौँ",
    address: "दरबारमार्ग (नारायणहिटी गेट नजिकै), काठमाडौँ ४४६००",
    phone: "+९७७ १ ४२२०१९२",
    hours: "आइतबार – शुक्रबार: १०:०० बिहान – ८:०० साँझ | शनिबार: ११:०० बिहान – ७:०० साँझ",
    features: ["सम्पूर्ण संग्रह प्रदर्शन", "अनलाइन अर्डर पिकअप", "व्यक्तिगत स्टाइल तथा सिलाई"],
  },
  {
    name: "दोभान हस्तकला ग्यालरी तथा क्याफे",
    city: "ललितपुर",
    address: "झम्सिखेल सडक (सेन्ट मेरिज लेन अगाडि), ललितपुर ४४७००",
    phone: "+९७७ १ ५५३९४८१",
    hours: "आइतबार – शनिबार: ९:३० बिहान – ८:३० साँझ",
    features: ["हस्तनिर्मित भाँडा तथा ढाका", "शिल्पकार कार्यशाला", "तत्काल साटफेर केन्द्र"],
  },
  {
    name: "दोभान हिमालयन आउटपोस्ट",
    city: "पोखरा",
    address: "लेकसाइड ६, बैदाम (सेन्टर पोइन्ट नजिक), पोखरा ३३७००",
    phone: "+९७७ ६१ ४६२९१०",
    hours: "सोमबार – आइतबार: ८:०० बिहान – ९:०० साँझ",
    features: ["ट्रेकिङ तथा आउटडोर गियर", "गियर परीक्षण", "द्रुत पिकअप केन्द्र"],
  },
  {
    name: "दोभान पूर्वी क्षेत्रीय केन्द्र",
    city: "विराटनगर",
    address: "मेन रोड (ट्राफिक चोक नजिक), विराटनगर ५६६१३",
    phone: "+९७७ २१ ५२८३९०",
    hours: "आइतबार – शुक्रबार: १०:०० बिहान – ७:०० साँझ",
    features: ["पूर्व नेपाल डेलिभरी हब", "क्यास अन डेलिभरी सहायता", "ग्राहक सेवा केन्द्र"],
  },
];

const DISTRICT_DATA: Record<string, { days: string; cod: boolean; hub: string }> = {
  Kathmandu: { days: "24 – 48 Hours", cod: true, hub: "Kathmandu Central Hub" },
  Lalitpur: { days: "24 – 48 Hours", cod: true, hub: "Kathmandu Central Hub" },
  Bhaktapur: { days: "24 – 48 Hours", cod: true, hub: "Kathmandu Central Hub" },
  Kaski: { days: "2 – 3 Days", cod: true, hub: "Pokhara Regional Center" },
  Chitwan: { days: "2 – 3 Days", cod: true, hub: "Narayangarh Depot" },
  Morang: { days: "2 – 3 Days", cod: true, hub: "Biratnagar Eastern Depot" },
  Sunsari: { days: "2 – 3 Days", cod: true, hub: "Dharan / Itahari" },
  Rupandehi: { days: "2 – 3 Days", cod: true, hub: "Butwal Express Depot" },
  Jhapa: { days: "3 – 4 Days", cod: true, hub: "Birtamode Hub" },
  Banke: { days: "3 – 4 Days", cod: true, hub: "Nepalgunj Hub" },
  Kavrepalanchok: { days: "2 – 3 Days", cod: true, hub: "Dhulikhel / Banepa" },
  Makwanpur: { days: "2 – 3 Days", cod: true, hub: "Hetauda Hub" },
  Dhanusha: { days: "3 – 4 Days", cod: true, hub: "Janakpur Hub" },
  Parsa: { days: "2 – 3 Days", cod: true, hub: "Birgunj Depot" },
  Surkhet: { days: "4 – 5 Days", cod: true, hub: "Birendranagar Depot" },
  Kailali: { days: "3 – 5 Days", cod: true, hub: "Dhangadhi Depot" },
  Mustang: { days: "4 – 6 Days", cod: true, hub: "Jomsom Mountain Express" },
};

function StoresPage() {
  const { isNepali } = useI18n();
  const [districtQuery, setDistrictQuery] = useState("");
  const allDistricts = Object.keys(DISTRICT_DATA);

  const matched = districtQuery.trim()
    ? allDistricts.filter((d) => d.toLowerCase().includes(districtQuery.trim().toLowerCase()))
    : ["Kathmandu", "Lalitpur", "Kaski", "Chitwan", "Morang", "Rupandehi"];

  const stores = isNepali ? STORES_NE : STORES_EN;

  return (
    <div className="container-page space-y-12 py-8 md:space-y-16 md:py-12">
      {/* Header */}
      <div>
        <p className="eyebrow">{isNepali ? "स्टोर तथा देशव्यापी डेलिभरी" : "Stores & Nationwide Delivery"}</p>
        <h1 className="mt-1 font-display text-4xl sm:text-5xl">
          {isNepali ? "हाम्रा शाखाहरू र डेलिभरी क्षेत्र" : "Our Locations & Coverage"}
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          {isNepali
            ? "काठमाडौँ उपत्यका र पोखराका हाम्रा स्टोरहरूमा आएर प्रत्यक्ष अनुभव लिनुहोस्, वा नेपालका ७७ वटै जिल्लामा क्यास अन डेलिभरी पाउनुहोस्।"
            : "Experience our considered goods in person at our flagship locations across Kathmandu Valley and Pokhara, or enjoy doorstep delivery with Cash on Delivery anywhere in Nepal."}
        </p>
      </div>

      {/* Stores Grid */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Store className="h-5 w-5 text-accent" />
            {isNepali ? "भौतिक स्टोर तथा अनुभव केन्द्रहरू" : "Physical Stores & Experience Galleries"}
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {stores.map((s) => (
            <div key={s.name} className="flex flex-col justify-between rounded-lg border bg-card p-6 shadow-sm">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
                    {s.city}
                  </span>
                  <span className="text-xs text-success font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {isNepali ? "आज खुला छ" : "Open Today"}
                  </span>
                </div>

                <h3 className="mt-3 font-semibold text-xl">{s.name}</h3>

                <div className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-foreground" />
                    <span>{s.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0 text-foreground" />
                    <a href={`tel:${s.phone}`} className="hover:text-foreground hover:underline">
                      {s.phone}
                    </a>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 shrink-0 mt-0.5 text-foreground" />
                    <span>{s.hours}</span>
                  </div>
                </div>

                <div className="mt-5 border-t pt-3">
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    {isNepali ? "उपलब्ध सेवाहरू" : "Services Available"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {s.features.map((f) => (
                      <span key={f} className="rounded-md bg-secondary px-2.5 py-1 text-xs text-foreground/80">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t flex items-center gap-3">
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(s.name + " " + s.address)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {isNepali ? "गुगल नक्सामा हेर्नुहोस्" : "View on Map"}
                  </a>
                </Button>
                <Button size="sm" asChild className="flex-1">
                  <Link to="/shop">{isNepali ? "स्टोर क्याटलग हेर्नुहोस्" : "Shop Store Catalog"}</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Nationwide Coverage District Checker */}
      <section className="rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Truck className="h-5 w-5 text-accent" />
            {isNepali ? "७७ वटै जिल्लामा डेलिभरी समय" : "77 Districts Delivery Lookup"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isNepali
              ? "आफ्नो जिल्ला खोजेर अनुमानित डेलिभरी समय र क्यास अन डेलिभरी उपलब्धता हेर्नुहोस्।"
              : "Search your home district to see estimated delivery transit times and Cash on Delivery availability."}
          </p>
        </div>

        <div className="mt-5 max-w-md">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={districtQuery}
              onChange={(e) => setDistrictQuery(e.target.value)}
              placeholder={isNepali ? "जिल्लाको नाम खोज्नुहोस् (उदा. Kaski, Jhapa, Morang)..." : "Search by district name, e.g. Kaski, Jhapa, Morang..."}
              className="pl-9"
            />
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {matched.map((dist) => {
            const info = DISTRICT_DATA[dist] ?? { days: "3 – 5 Days", cod: true, hub: "Nearest District Hub" };
            return (
              <div key={dist} className="rounded-lg border bg-background/50 p-4 transition hover:border-foreground/30">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-base">{dist}</h3>
                  <span className="rounded bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">
                    {isNepali ? "क्यास अन डेलिभरी उपलब्ध" : "COD Available"}
                  </span>
                </div>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">{isNepali ? "डेलिभरी समय:" : "Estimated Delivery:"}</span> {info.days}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">{isNepali ? "डेलिभरी हब:" : "Regional Hub:"}</span> {info.hub}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
