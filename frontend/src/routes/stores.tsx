import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Truck,
  ShieldCheck,
  CheckCircle2,
  Search,
  ArrowRight,
  MapPin,
  Clock,
  Banknote,
  RotateCcw,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/stores")({
  head: () => ({
    meta: [
      { title: "77 Districts Delivery Coverage & Transit Times — DOVAN" },
      {
        name: "description",
        content:
          "Check delivery transit times, Cash on Delivery availability, and regional dispatch hubs across all 77 districts of Nepal.",
      },
      { property: "og:title", content: "77 Districts Delivery Coverage — DOVAN" },
      {
        property: "og:description",
        content:
          "Nationwide delivery coverage across all 77 districts with Cash on Delivery and doorstep inspection.",
      },
    ],
  }),
  component: StoresPage,
});

const DISTRICT_DATA: Record<
  string,
  { province: string; days: string; cod: boolean; hub: string }
> = {
  // Bagmati
  Kathmandu: { province: "Bagmati", days: "24 – 48 Hours", cod: true, hub: "Kathmandu Central Hub" },
  Lalitpur: { province: "Bagmati", days: "24 – 48 Hours", cod: true, hub: "Kathmandu Central Hub" },
  Bhaktapur: { province: "Bagmati", days: "24 – 48 Hours", cod: true, hub: "Kathmandu Central Hub" },
  Chitwan: { province: "Bagmati", days: "2 – 3 Days", cod: true, hub: "Narayangarh Transit Depot" },
  Makwanpur: { province: "Bagmati", days: "2 – 3 Days", cod: true, hub: "Hetauda Hub" },
  Kavrepalanchok: { province: "Bagmati", days: "2 – 3 Days", cod: true, hub: "Dhulikhel / Banepa Depot" },
  Dhading: { province: "Bagmati", days: "2 – 3 Days", cod: true, hub: "Dhading Besi Hub" },
  Nuwakot: { province: "Bagmati", days: "2 – 3 Days", cod: true, hub: "Battar / Bidur Hub" },
  Sindhupalchok: { province: "Bagmati", days: "3 – 4 Days", cod: true, hub: "Chautara Depot" },
  Dolakha: { province: "Bagmati", days: "3 – 4 Days", cod: true, hub: "Charikot Hub" },
  Ramechhap: { province: "Bagmati", days: "3 – 4 Days", cod: true, hub: "Manthali Depot" },
  Sindhuli: { province: "Bagmati", days: "3 – 4 Days", cod: true, hub: "Sindhulimadi Hub" },
  Rasuwa: { province: "Bagmati", days: "3 – 5 Days", cod: true, hub: "Dhunche Mountain Express" },

  // Gandaki
  Kaski: { province: "Gandaki", days: "2 – 3 Days", cod: true, hub: "Pokhara Regional Center" },
  Tanahun: { province: "Gandaki", days: "2 – 3 Days", cod: true, hub: "Damauli Hub" },
  Syangja: { province: "Gandaki", days: "2 – 3 Days", cod: true, hub: "Putalibazar Depot" },
  Gorkha: { province: "Gandaki", days: "2 – 4 Days", cod: true, hub: "Gorkha Bazaar Depot" },
  Lamjung: { province: "Gandaki", days: "2 – 4 Days", cod: true, hub: "Besisahar Hub" },
  Nawalpur: { province: "Gandaki", days: "2 – 3 Days", cod: true, hub: "Kawasoti Depot" },
  Parbat: { province: "Gandaki", days: "3 – 4 Days", cod: true, hub: "Kusma Hub" },
  Baglung: { province: "Gandaki", days: "3 – 4 Days", cod: true, hub: "Baglung Bazaar Depot" },
  Myagdi: { province: "Gandaki", days: "3 – 5 Days", cod: true, hub: "Beni Hub" },
  Mustang: { province: "Gandaki", days: "4 – 6 Days", cod: true, hub: "Jomsom Mountain Express" },
  Manang: { province: "Gandaki", days: "4 – 6 Days", cod: true, hub: "Chame Mountain Express" },

  // Koshi
  Morang: { province: "Koshi", days: "2 – 3 Days", cod: true, hub: "Biratnagar Eastern Depot" },
  Sunsari: { province: "Koshi", days: "2 – 3 Days", cod: true, hub: "Dharan / Itahari Hub" },
  Jhapa: { province: "Koshi", days: "3 – 4 Days", cod: true, hub: "Birtamode Hub" },
  Ilam: { province: "Koshi", days: "3 – 4 Days", cod: true, hub: "Ilam Bazaar Depot" },
  Dhankuta: { province: "Koshi", days: "3 – 4 Days", cod: true, hub: "Dhankuta Hub" },
  Udayapur: { province: "Koshi", days: "3 – 4 Days", cod: true, hub: "Gaighat Depot" },
  Bhojpur: { province: "Koshi", days: "4 – 5 Days", cod: true, hub: "Bhojpur Hub" },
  Terhathum: { province: "Koshi", days: "4 – 5 Days", cod: true, hub: "Myanglung Depot" },
  Panchthar: { province: "Koshi", days: "4 – 5 Days", cod: true, hub: "Phidim Hub" },
  Khotang: { province: "Koshi", days: "4 – 5 Days", cod: true, hub: "Diktel Hub" },
  Okhaldhunga: { province: "Koshi", days: "4 – 5 Days", cod: true, hub: "Okhaldhunga Hub" },
  Sankhuwasabha: { province: "Koshi", days: "4 – 6 Days", cod: true, hub: "Khandbari Hub" },
  Taplejung: { province: "Koshi", days: "4 – 6 Days", cod: true, hub: "Fungling Hub" },
  Solukhumbu: { province: "Koshi", days: "4 – 6 Days", cod: true, hub: "Salleri Mountain Express" },

  // Madhesh
  Parsa: { province: "Madhesh", days: "2 – 3 Days", cod: true, hub: "Birgunj Central Depot" },
  Dhanusha: { province: "Madhesh", days: "2 – 3 Days", cod: true, hub: "Janakpur Hub" },
  Bara: { province: "Madhesh", days: "2 – 3 Days", cod: true, hub: "Kalaiya / Simara Depot" },
  Rautahat: { province: "Madhesh", days: "3 – 4 Days", cod: true, hub: "Gaur Hub" },
  Sarlahi: { province: "Madhesh", days: "3 – 4 Days", cod: true, hub: "Malangwa Hub" },
  Mahottari: { province: "Madhesh", days: "3 – 4 Days", cod: true, hub: "Jaleshwor Hub" },
  Siraha: { province: "Madhesh", days: "3 – 4 Days", cod: true, hub: "Lahan Depot" },
  Saptari: { province: "Madhesh", days: "3 – 4 Days", cod: true, hub: "Rajbiraj Hub" },

  // Lumbini
  Rupandehi: { province: "Lumbini", days: "2 – 3 Days", cod: true, hub: "Butwal Express Depot" },
  Banke: { province: "Lumbini", days: "2 – 3 Days", cod: true, hub: "Nepalgunj Western Hub" },
  Dang: { province: "Lumbini", days: "2 – 4 Days", cod: true, hub: "Ghorahi / Tulsipur Depot" },
  Kapilvastu: { province: "Lumbini", days: "3 – 4 Days", cod: true, hub: "Taulihawa Hub" },
  Palpa: { province: "Lumbini", days: "3 – 4 Days", cod: true, hub: "Tansen Hub" },
  Bardiya: { province: "Lumbini", days: "3 – 4 Days", cod: true, hub: "Gulariya Hub" },
  Nawalparasi: { province: "Lumbini", days: "2 – 3 Days", cod: true, hub: "Parasi Depot" },
  Gulmi: { province: "Lumbini", days: "3 – 5 Days", cod: true, hub: "Tamghas Hub" },
  Arghakhanchi: { province: "Lumbini", days: "3 – 5 Days", cod: true, hub: "Sandhikharka Depot" },
  Pyuthan: { province: "Lumbini", days: "4 – 5 Days", cod: true, hub: "Pyuthan Hub" },
  Rolpa: { province: "Lumbini", days: "4 – 5 Days", cod: true, hub: "Liwang Depot" },
  "Eastern Rukum": { province: "Lumbini", days: "4 – 6 Days", cod: true, hub: "Rukumkot Hub" },

  // Karnali
  Surkhet: { province: "Karnali", days: "3 – 4 Days", cod: true, hub: "Birendranagar Karnali Hub" },
  Dailekh: { province: "Karnali", days: "4 – 5 Days", cod: true, hub: "Dailekh Bazaar Depot" },
  Salyan: { province: "Karnali", days: "4 – 5 Days", cod: true, hub: "Salyan Hub" },
  Jajarkot: { province: "Karnali", days: "4 – 6 Days", cod: true, hub: "Khalanga Depot" },
  Jumla: { province: "Karnali", days: "4 – 6 Days", cod: true, hub: "Jumla Mountain Express" },
  Kalikot: { province: "Karnali", days: "5 – 7 Days", cod: true, hub: "Manma Depot" },
  "Western Rukum": { province: "Karnali", days: "4 – 6 Days", cod: true, hub: "Musikot Hub" },
  Mugu: { province: "Karnali", days: "5 – 7 Days", cod: true, hub: "Gamgadhi Mountain Express" },
  Humla: { province: "Karnali", days: "5 – 7 Days", cod: true, hub: "Simikot Air Courier" },
  Dolpa: { province: "Karnali", days: "5 – 7 Days", cod: true, hub: "Dunai Mountain Express" },

  // Sudurpashchim
  Kailali: { province: "Sudurpashchim", days: "3 – 4 Days", cod: true, hub: "Dhangadhi Regional Hub" },
  Kanchanpur: { province: "Sudurpashchim", days: "3 – 4 Days", cod: true, hub: "Mahendranagar Depot" },
  Doti: { province: "Sudurpashchim", days: "4 – 5 Days", cod: true, hub: "Dipayal Silgadhi Hub" },
  Dadeldhura: { province: "Sudurpashchim", days: "4 – 5 Days", cod: true, hub: "Amargadhi Hub" },
  Achham: { province: "Sudurpashchim", days: "4 – 6 Days", cod: true, hub: "Mangalsen Depot" },
  Baitadi: { province: "Sudurpashchim", days: "4 – 6 Days", cod: true, hub: "Dasharathchand Hub" },
  Bajhang: { province: "Sudurpashchim", days: "5 – 7 Days", cod: true, hub: "Chainpur Depot" },
  Darchula: { province: "Sudurpashchim", days: "5 – 7 Days", cod: true, hub: "Darchula Border Depot" },
  Bajura: { province: "Sudurpashchim", days: "5 – 7 Days", cod: true, hub: "Martadi Mountain Express" },
};

const PROVINCES = [
  "All Provinces",
  "Bagmati",
  "Gandaki",
  "Koshi",
  "Madhesh",
  "Lumbini",
  "Karnali",
  "Sudurpashchim",
];

function StoresPage() {
  const { isNepali } = useI18n();
  const [districtQuery, setDistrictQuery] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("All Provinces");

  const allDistricts = useMemo(() => Object.keys(DISTRICT_DATA), []);

  const filteredDistricts = useMemo(() => {
    return allDistricts.filter((d) => {
      const matchQuery = districtQuery.trim()
        ? d.toLowerCase().includes(districtQuery.trim().toLowerCase())
        : true;
      const matchProvince =
        selectedProvince === "All Provinces" ||
        DISTRICT_DATA[d]?.province === selectedProvince;
      return matchQuery && matchProvince;
    });
  }, [allDistricts, districtQuery, selectedProvince]);

  return (
    <div className="container-page space-y-12 py-8 md:space-y-16 md:py-12">
      {/* 1. Header */}
      <div className="max-w-3xl">
        <p className="eyebrow text-accent font-semibold tracking-wider">
          {isNepali ? "नेपालभरि घरदैलो डेलिभरी" : "Nationwide Doorstep Delivery"}
        </p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl md:text-6xl text-foreground">
          {isNepali ? "७७ वटै जिल्लामा सेवा कभरेज" : "77 Districts Delivery Coverage"}
        </h1>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
          {isNepali
            ? "हामी नेपालका सबै ७७ जिल्लामा क्यास अन डेलिभरी (COD) र सुरक्षित ढुवानीका साथ सामान पुर्‍याउँछौं।"
            : "DOVAN operates nationwide. We deliver considered goods right to your doorstep across all 77 districts of Nepal with Cash on Delivery (COD) and real-time tracking."}
        </p>
      </div>

      {/* 2. Key Logistics Guarantees */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 sm:p-6 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Banknote className="h-5 w-5" />
          </div>
          <h3 className="mt-3.5 font-semibold text-base text-foreground">
            {isNepali ? "१००% क्यास अन डेलिभरी" : "100% Cash on Delivery"}
          </h3>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {isNepali
              ? "सामान हातमा परेपछि मात्र नगद वा Fonepay QR मार्फत भुक्तानी गर्नुहोस्।"
              : "Inspect your package upon arrival and pay comfortably with cash or Fonepay QR."}
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-5 sm:p-6 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Truck className="h-5 w-5" />
          </div>
          <h3 className="mt-3.5 font-semibold text-base text-foreground">
            {isNepali ? "दैनिक एक्सप्रेस डिस्प्याच" : "Daily Express Dispatch"}
          </h3>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {isNepali
              ? "काठमाडौं मुख्य हबबाट २४-४८ घण्टा र बाहिरी जिल्लाहरूमा २-४ दिनभित्र डेलिभरी।"
              : "Dispatched daily from our Kathmandu fulfillment center and regional hubs."}
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-5 sm:p-6 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <RotateCcw className="h-5 w-5" />
          </div>
          <h3 className="mt-3.5 font-semibold text-base text-foreground">
            {isNepali ? "सहज ७ दिने साट्ने सुविधा" : "Easy 7-Day Exchange"}
          </h3>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {isNepali
              ? "साइज वा सामान नमिलेमा सहजै साट्न वा फिर्ता गर्न सकिने।"
              : "Doorstep courier pickups arranged directly from your location across major cities."}
          </p>
        </div>
      </div>

      {/* 3. 77 Districts Delivery Lookup Tool */}
      <section className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2.5 text-foreground">
            <Truck className="h-6 w-6 text-accent" />
            {isNepali ? "जिल्ला अनुसार डेलिभरी समय जाँच" : "77 Districts Delivery Lookup"}
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
            {isNepali
              ? "आफ्नो जिल्ला खोजेर अनुमानित डेलिभरी समय, क्षेत्रीय हब र भुक्तानी सुविधा हेर्नुहोस्।"
              : "Search your home district to view estimated transit times, regional logistics hubs, and Cash on Delivery availability."}
          </p>
        </div>

        {/* Search bar & Province Filters */}
        <div className="mt-6 space-y-3.5">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={districtQuery}
              onChange={(e) => setDistrictQuery(e.target.value)}
              placeholder={
                isNepali
                  ? "जिल्ला खोज्नुहोस् (उदा: कास्की, झापा, चितवन, मुस्ताङ...)"
                  : "Search district (e.g. Kaski, Jhapa, Chitwan, Mustang...)"
              }
              className="pl-10 h-11 text-sm rounded-xl"
            />
          </div>

          {/* Province Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {PROVINCES.map((prov) => {
              const isActive = selectedProvince === prov;
              return (
                <button
                  key={prov}
                  type="button"
                  onClick={() => setSelectedProvince(prov)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  }`}
                >
                  {prov}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-6 flex items-center justify-between border-b pb-3 text-xs text-muted-foreground">
          <span>
            {isNepali ? "भेटिएका जिल्लाहरू:" : "Showing Districts:"}{" "}
            <strong className="text-foreground">{filteredDistricts.length}</strong> / 77
          </span>
          <span className="text-success font-medium flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {isNepali ? "सबै ७७ जिल्लामा COD सक्रिय" : "COD Active in All Districts"}
          </span>
        </div>

        {/* Districts Grid */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-[600px] overflow-y-auto pr-1">
          {filteredDistricts.map((dist) => {
            const info = DISTRICT_DATA[dist] ?? {
              province: "Nepal",
              days: "3 – 5 Days",
              cod: true,
              hub: "Nearest Regional Hub",
            };
            return (
              <div
                key={dist}
                className="rounded-xl border bg-background/50 p-4 transition-all duration-150 hover:border-foreground/30 hover:bg-background"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base text-foreground">
                      {dist}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      {info.province} Province
                    </p>
                  </div>
                  <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-[11px] font-semibold text-success flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {"COD"}
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-xs text-muted-foreground border-t pt-2.5">
                  <div className="flex items-center justify-between">
                    <span>{isNepali ? "डेलिभरी समय:" : "Transit Time:"}</span>
                    <span className="font-medium text-foreground">{info.days}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span>{isNepali ? "क्षेत्रीय हब:" : "Regional Hub:"}</span>
                    <span className="text-foreground/80 truncate max-w-[150px]">
                      {info.hub}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Bottom CTA */}
      <section className="rounded-2xl border bg-muted/40 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {isNepali ? "अनलाइन अर्डर गर्न तयार हुनुहुन्छ?" : "Ready to Order Online?"}
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            {isNepali
              ? "हाम्रो सम्पूर्ण क्याटलग हेर्नुहोस् र क्यास अन डेलिभरीको साथ अर्डर गर्नुहोस्।"
              : "Explore our collection of authentic Himalayan goods delivered directly to your doorstep."}
          </p>
        </div>
        <Button asChild size="default" className="rounded-full px-6 shrink-0">
          <Link to="/shop">
            {isNepali ? "सामानहरू हेर्नुहोस्" : "Explore Products"}
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
      </section>
    </div>
  );
}
