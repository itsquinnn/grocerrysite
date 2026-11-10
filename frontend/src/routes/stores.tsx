import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Search, ArrowRight, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/stores")({
  head: () => ({
    meta: [
      { title: "77 Districts Delivery Coverage and Transit Times : DOVAN" },
      {
        name: "description",
        content:
          "Check delivery transit times, Cash on Delivery availability, and regional dispatch hubs across all 77 districts of Nepal.",
      },
      { property: "og:title", content: "77 Districts Delivery Coverage : DOVAN" },
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
  Kathmandu: { province: "Bagmati", days: "24-48 Hours", cod: true, hub: "Kathmandu Central Hub" },
  Lalitpur: { province: "Bagmati", days: "24-48 Hours", cod: true, hub: "Kathmandu Central Hub" },
  Bhaktapur: { province: "Bagmati", days: "24-48 Hours", cod: true, hub: "Kathmandu Central Hub" },
  Chitwan: { province: "Bagmati", days: "2-3 Days", cod: true, hub: "Narayangarh Transit Depot" },
  Makwanpur: { province: "Bagmati", days: "2-3 Days", cod: true, hub: "Hetauda Hub" },
  Kavrepalanchok: { province: "Bagmati", days: "2-3 Days", cod: true, hub: "Dhulikhel / Banepa Depot" },
  Dhading: { province: "Bagmati", days: "2-3 Days", cod: true, hub: "Dhading Besi Hub" },
  Nuwakot: { province: "Bagmati", days: "2-3 Days", cod: true, hub: "Battar / Bidur Hub" },
  Sindhupalchok: { province: "Bagmati", days: "3-4 Days", cod: true, hub: "Chautara Depot" },
  Dolakha: { province: "Bagmati", days: "3-4 Days", cod: true, hub: "Charikot Hub" },
  Ramechhap: { province: "Bagmati", days: "3-4 Days", cod: true, hub: "Manthali Depot" },
  Sindhuli: { province: "Bagmati", days: "3-4 Days", cod: true, hub: "Sindhulimadi Hub" },
  Rasuwa: { province: "Bagmati", days: "3-5 Days", cod: true, hub: "Dhunche Mountain Express" },

  // Gandaki
  Kaski: { province: "Gandaki", days: "2-3 Days", cod: true, hub: "Pokhara Regional Center" },
  Tanahun: { province: "Gandaki", days: "2-3 Days", cod: true, hub: "Damauli Hub" },
  Syangja: { province: "Gandaki", days: "2-3 Days", cod: true, hub: "Putalibazar Depot" },
  Gorkha: { province: "Gandaki", days: "2-4 Days", cod: true, hub: "Gorkha Bazaar Depot" },
  Lamjung: { province: "Gandaki", days: "2-4 Days", cod: true, hub: "Besisahar Hub" },
  Nawalpur: { province: "Gandaki", days: "2-3 Days", cod: true, hub: "Kawasoti Depot" },
  Parbat: { province: "Gandaki", days: "3-4 Days", cod: true, hub: "Kusma Hub" },
  Baglung: { province: "Gandaki", days: "3-4 Days", cod: true, hub: "Baglung Bazaar Depot" },
  Myagdi: { province: "Gandaki", days: "3-5 Days", cod: true, hub: "Beni Hub" },
  Mustang: { province: "Gandaki", days: "4-6 Days", cod: true, hub: "Jomsom Mountain Express" },
  Manang: { province: "Gandaki", days: "4-6 Days", cod: true, hub: "Chame Mountain Express" },

  // Koshi
  Morang: { province: "Koshi", days: "2-3 Days", cod: true, hub: "Biratnagar Eastern Depot" },
  Sunsari: { province: "Koshi", days: "2-3 Days", cod: true, hub: "Dharan / Itahari Hub" },
  Jhapa: { province: "Koshi", days: "3-4 Days", cod: true, hub: "Birtamode Hub" },
  Ilam: { province: "Koshi", days: "3-4 Days", cod: true, hub: "Ilam Bazaar Depot" },
  Dhankuta: { province: "Koshi", days: "3-4 Days", cod: true, hub: "Dhankuta Hub" },
  Udayapur: { province: "Koshi", days: "3-4 Days", cod: true, hub: "Gaighat Depot" },
  Bhojpur: { province: "Koshi", days: "4-5 Days", cod: true, hub: "Bhojpur Hub" },
  Terhathum: { province: "Koshi", days: "4-5 Days", cod: true, hub: "Myanglung Depot" },
  Panchthar: { province: "Koshi", days: "4-5 Days", cod: true, hub: "Phidim Hub" },
  Khotang: { province: "Koshi", days: "4-5 Days", cod: true, hub: "Diktel Hub" },
  Okhaldhunga: { province: "Koshi", days: "4-5 Days", cod: true, hub: "Okhaldhunga Hub" },
  Sankhuwasabha: { province: "Koshi", days: "4-6 Days", cod: true, hub: "Khandbari Hub" },
  Taplejung: { province: "Koshi", days: "4-6 Days", cod: true, hub: "Fungling Hub" },
  Solukhumbu: { province: "Koshi", days: "4-6 Days", cod: true, hub: "Salleri Mountain Express" },

  // Madhesh
  Parsa: { province: "Madhesh", days: "2-3 Days", cod: true, hub: "Birgunj Central Depot" },
  Dhanusha: { province: "Madhesh", days: "2-3 Days", cod: true, hub: "Janakpur Hub" },
  Bara: { province: "Madhesh", days: "2-3 Days", cod: true, hub: "Kalaiya / Simara Depot" },
  Rautahat: { province: "Madhesh", days: "3-4 Days", cod: true, hub: "Gaur Hub" },
  Sarlahi: { province: "Madhesh", days: "3-4 Days", cod: true, hub: "Malangwa Hub" },
  Mahottari: { province: "Madhesh", days: "3-4 Days", cod: true, hub: "Jaleshwor Hub" },
  Siraha: { province: "Madhesh", days: "3-4 Days", cod: true, hub: "Lahan Depot" },
  Saptari: { province: "Madhesh", days: "3-4 Days", cod: true, hub: "Rajbiraj Hub" },

  // Lumbini
  Rupandehi: { province: "Lumbini", days: "2-3 Days", cod: true, hub: "Butwal Express Depot" },
  Banke: { province: "Lumbini", days: "2-3 Days", cod: true, hub: "Nepalgunj Western Hub" },
  Dang: { province: "Lumbini", days: "2-4 Days", cod: true, hub: "Ghorahi / Tulsipur Depot" },
  Kapilvastu: { province: "Lumbini", days: "3-4 Days", cod: true, hub: "Taulihawa Hub" },
  Palpa: { province: "Lumbini", days: "3-4 Days", cod: true, hub: "Tansen Hub" },
  Bardiya: { province: "Lumbini", days: "3-4 Days", cod: true, hub: "Gulariya Hub" },
  Nawalparasi: { province: "Lumbini", days: "2-3 Days", cod: true, hub: "Parasi Depot" },
  Gulmi: { province: "Lumbini", days: "3-5 Days", cod: true, hub: "Tamghas Hub" },
  Arghakhanchi: { province: "Lumbini", days: "3-5 Days", cod: true, hub: "Sandhikharka Depot" },
  Pyuthan: { province: "Lumbini", days: "4-5 Days", cod: true, hub: "Pyuthan Hub" },
  Rolpa: { province: "Lumbini", days: "4-5 Days", cod: true, hub: "Liwang Depot" },
  "Eastern Rukum": { province: "Lumbini", days: "4-6 Days", cod: true, hub: "Rukumkot Hub" },

  // Karnali
  Surkhet: { province: "Karnali", days: "3-4 Days", cod: true, hub: "Birendranagar Karnali Hub" },
  Dailekh: { province: "Karnali", days: "4-5 Days", cod: true, hub: "Dailekh Bazaar Depot" },
  Salyan: { province: "Karnali", days: "4-5 Days", cod: true, hub: "Salyan Hub" },
  Jajarkot: { province: "Karnali", days: "4-6 Days", cod: true, hub: "Khalanga Depot" },
  Jumla: { province: "Karnali", days: "4-6 Days", cod: true, hub: "Jumla Mountain Express" },
  Kalikot: { province: "Karnali", days: "5-7 Days", cod: true, hub: "Manma Depot" },
  "Western Rukum": { province: "Karnali", days: "4-6 Days", cod: true, hub: "Musikot Hub" },
  Mugu: { province: "Karnali", days: "5-7 Days", cod: true, hub: "Gamgadhi Mountain Express" },
  Humla: { province: "Karnali", days: "5-7 Days", cod: true, hub: "Simikot Air Courier" },
  Dolpa: { province: "Karnali", days: "5-7 Days", cod: true, hub: "Dunai Mountain Express" },

  // Sudurpashchim
  Kailali: { province: "Sudurpashchim", days: "3-4 Days", cod: true, hub: "Dhangadhi Regional Hub" },
  Kanchanpur: { province: "Sudurpashchim", days: "3-4 Days", cod: true, hub: "Mahendranagar Depot" },
  Doti: { province: "Sudurpashchim", days: "4-5 Days", cod: true, hub: "Dipayal Silgadhi Hub" },
  Dadeldhura: { province: "Sudurpashchim", days: "4-5 Days", cod: true, hub: "Amargadhi Hub" },
  Achham: { province: "Sudurpashchim", days: "4-6 Days", cod: true, hub: "Mangalsen Depot" },
  Baitadi: { province: "Sudurpashchim", days: "4-6 Days", cod: true, hub: "Dasharathchand Hub" },
  Bajhang: { province: "Sudurpashchim", days: "5-7 Days", cod: true, hub: "Chainpur Depot" },
  Darchula: { province: "Sudurpashchim", days: "5-7 Days", cod: true, hub: "Darchula Border Depot" },
  Bajura: { province: "Sudurpashchim", days: "5-7 Days", cod: true, hub: "Martadi Mountain Express" },
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

  const hasActiveFilters = districtQuery.trim().length > 0 || selectedProvince !== "All Provinces";

  const clearFilters = () => {
    setDistrictQuery("");
    setSelectedProvince("All Provinces");
  };

  return (
    <div className="container-page py-5 sm:py-7 space-y-6 sm:space-y-8">
      {/* 1. Header / Manifesto */}
      <section className="space-y-2">
        <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
          {isNepali ? "लजिस्टिक्स सञ्जाल / ७७ जिल्ला" : "Logistics Directory / 77 Districts"}
        </p>
        <h1 className="font-display text-2xl sm:text-3xl md:text-4xl text-foreground font-normal tracking-tight leading-[1.12]">
          {isNepali ? "नेपालका सबै ७७ जिल्लामा डेलिभरी कभरेज" : "Nationwide Delivery Directory"}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-3xl">
          {isNepali
            ? "दोभानले काठमाडौं चक्रपथ बाहिर पनि उत्तिकै विश्वासका साथ सेवा प्रदान गर्छ। नेपालका सबै ७७ जिल्लामा क्यास अन डेलिभरी (COD), पार्सल खोलेर जाँच गर्ने सुविधा र सिधा ट्र्याकिङसहित सामान पुर्‍याइन्छ।"
            : "DOVAN operates a dedicated delivery logistics network reaching every district of Nepal. All orders feature door-to-door transit, verified open-box inspection prior to payment, and Cash on Delivery across all 7 provinces."}
        </p>
      </section>

      {/* 2. Operational Guarantees Ledger */}
      <section className="border-y border-border/80 grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border/70">
        <div className="py-3.5 sm:py-4 px-3 sm:px-5 space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block font-medium">
            {isNepali ? "मापदण्ड ०१ / भुक्तानी" : "Standard 01 / Payment"}
          </span>
          <h2 className="font-display text-base sm:text-lg font-normal text-foreground">
            {isNepali ? "१००% क्यास अन डेलिभरी" : "100% Cash on Delivery"}
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isNepali
              ? "सामान हातमा परेपछि र गुणस्तर जाँचेपछि मात्र नगद वा Fonepay QR मार्फत भुक्तानी गर्नुहोस्।"
              : "Open and examine your parcel upon courier arrival before completing payment via cash or Fonepay QR."}
          </p>
        </div>

        <div className="py-3.5 sm:py-4 px-3 sm:px-5 space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block font-medium">
            {isNepali ? "मापदण्ड ०२ / ढुवानी" : "Standard 02 / Transit"}
          </span>
          <h2 className="font-display text-base sm:text-lg font-normal text-foreground">
            {isNepali ? "दैनिक एक्सप्रेस डिस्प्याच" : "Daily Regional Dispatch"}
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isNepali
              ? "काठमाडौं मुख्य हबबाट दैनिक प्रस्थान: उपत्यकामा २४-४८ घण्टा, मुख्य सहरहरूमा २-३ दिन।"
              : "Continuous dispatches from Kathmandu Central Hub to provincial distribution points with full tracking."}
          </p>
        </div>

        <div className="py-3.5 sm:py-4 px-3 sm:px-5 space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block font-medium">
            {isNepali ? "मापदण्ड ०३ / फिर्ता" : "Standard 03 / Exchanges"}
          </span>
          <h2 className="font-display text-base sm:text-lg font-normal text-foreground">
            {isNepali ? "सहज ७ दिने साट्ने सुविधा" : "Simple 7-Day Exchange"}
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isNepali
              ? "साइज वा वस्तु नमिलेमा सहज साटासाट। प्रमुख सहरहरूमा घरदैलोबाटै कुरियर पिकअप।"
              : "Effortless exchange and size adjustment with doorstep courier pickup arranged across major towns."}
          </p>
        </div>
      </section>

      {/* 3. 77 Districts Directory Search & Filters */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-border/80 pb-3">
          <div>
            <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
              {isNepali ? "तालिका / जिल्ला निर्देशिका" : "Directory / District Index"}
            </p>
            <h2 className="font-display text-xl sm:text-2xl text-foreground font-normal">
              {isNepali ? "जिल्ला अनुसार ढुवानी समय" : "Transit Times by District"}
            </h2>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <span>{isNepali ? "जिल्ला सङ्ख्या:" : "Districts:"}</span>
            <span className="font-semibold text-foreground">{filteredDistricts.length}</span>
            <span className="text-border">/</span>
            <span>77 Total</span>
          </div>
        </div>

        {/* Search Bar & Province Filter Tabs */}
        <div className="border border-border/80 bg-muted/20 p-3 sm:p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={districtQuery}
                onChange={(e) => setDistrictQuery(e.target.value)}
                placeholder={
                  isNepali
                    ? "जिल्लाको नाम खोज्नुहोस् (उदा: कास्की, झापा, चितवन, मुस्ताङ...)"
                    : "Search district by name (e.g. Kaski, Jhapa, Chitwan, Mustang...)"
                }
                className="pl-9 h-9 text-xs border-border/80 rounded-none bg-background focus-visible:ring-1 focus-visible:ring-foreground"
              />
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="h-9 px-3 border border-border/80 bg-background text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-foreground transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <X className="h-3 w-3" />
                <span>{isNepali ? "फिल्टर हटाउनुहोस्" : "Reset Filters"}</span>
              </button>
            )}
          </div>

          {/* Architectural Province Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {PROVINCES.map((prov) => {
              const isActive = selectedProvince === prov;
              return (
                <button
                  key={prov}
                  type="button"
                  onClick={() => setSelectedProvince(prov)}
                  className={`h-7 px-2.5 text-[11px] font-mono uppercase tracking-wider border transition-colors cursor-pointer ${
                    isActive
                      ? "bg-foreground text-background border-foreground font-semibold"
                      : "border-border/80 bg-background text-muted-foreground hover:border-foreground/60 hover:text-foreground"
                  }`}
                >
                  {prov}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Architectural Districts Ledger Table */}
        {filteredDistricts.length === 0 ? (
          <div className="border-t border-b border-border/80 py-12 text-center space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {isNepali ? "खोज नतिजा शून्य" : "Search Query Notice"}
            </p>
            <h3 className="font-display text-xl text-foreground font-normal">
              {isNepali ? "कुनै जिल्ला फेला परेन" : "No District Records Found"}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
              {isNepali
                ? "तपाईंले खोज्नुभएको नामसँग मेल खाने जिल्ला भेटिएन। कृपया हिज्जे जाँच्नुहोस् वा फिल्टर रिसेट गर्नुहोस्।"
                : "No delivery districts match the current search filters. Check the spelling or clear the province selector."}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={clearFilters}
                className="h-9 px-4 border border-foreground/30 bg-background text-xs font-medium text-foreground hover:border-foreground transition-colors cursor-pointer inline-flex items-center"
              >
                {isNepali ? "सम्पूर्ण ७७ जिल्ला हेर्नुहोस्" : "View All 77 Districts"}
              </button>
            </div>
          </div>
        ) : (
          <div className="border border-border/80 overflow-hidden bg-background">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/40 font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="py-2.5 px-3 sm:px-5 font-medium">
                      {isNepali ? "जिल्ला" : "District"}
                    </th>
                    <th className="py-2.5 px-3 font-medium">
                      {isNepali ? "प्रदेश" : "Province"}
                    </th>
                    <th className="py-2.5 px-3 font-medium">
                      {isNepali ? "ढुवानी समय" : "Transit Window"}
                    </th>
                    <th className="py-2.5 px-3 font-medium">
                      {isNepali ? "क्षेत्रीय हब / डिपो" : "Dispatch Hub"}
                    </th>
                    <th className="py-2.5 px-3 sm:px-5 font-medium text-right">
                      {isNepali ? "भुक्तानी" : "Payment"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredDistricts.map((dist, idx) => {
                    const info = DISTRICT_DATA[dist] ?? {
                      province: "Nepal",
                      days: "3-5 Days",
                      cod: true,
                      hub: "Nearest Regional Hub",
                    };
                    return (
                      <tr
                        key={dist}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-2.5 px-3 sm:px-5 font-medium text-foreground">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-muted-foreground/60 w-5">
                              {String(idx + 1).padStart(2, "0")}
                            </span>
                            <span>{dist}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">
                          {info.province}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs text-foreground font-medium">
                          {info.days}
                        </td>
                        <td className="py-2.5 px-3 text-xs text-muted-foreground">
                          {info.hub}
                        </td>
                        <td className="py-2.5 px-3 sm:px-5 text-right">
                          <span className="inline-flex items-center gap-1.5 border border-foreground/20 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-foreground">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                            COD Active
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* 5. Company Call to Action Box */}
      <section className="border border-border/80 bg-muted/20 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="max-w-2xl space-y-1.5">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block font-medium">
            {isNepali ? "अनलाइन अर्डर" : "Nationwide Dispatch"}
          </span>
          <h2 className="font-display text-lg sm:text-xl md:text-2xl font-normal text-foreground leading-snug">
            {isNepali
              ? "तपाईंको ठेगानामा सिधा डेलिभरीका साथ अर्डर गर्नुहोस्।"
              : "Order authentic goods delivered directly to your home."}
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isNepali
              ? "क्याटलग हेर्नुहोस्, आफ्नो जिल्ला चयन गर्नुहोस् र सामान प्राप्त भएपछि मात्र भुक्तानी गर्नुहोस्।"
              : "Browse our active collection of pantry staples, dry fruits, apparel, and lifestyle wares. Inspect before paying."}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/shop"
            className="h-9 px-4 text-xs font-medium bg-foreground text-background border border-foreground hover:bg-foreground/90 transition-colors inline-flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <span>{isNepali ? "क्याटलग हेर्नुहोस्" : "Explore Collection"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          <Link
            to="/faq"
            className="h-9 px-3 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center cursor-pointer"
          >
            <span>{isNepali ? "प्रायः सोधिने प्रश्नहरू" : "Read FAQs"}</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
