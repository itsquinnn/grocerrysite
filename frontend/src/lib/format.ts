export const formatNPR = (n: number | string | null | undefined) =>
  "Rs. " + Number(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

export const discountPct = (price: number, compare?: number | null) =>
  compare && compare > price ? Math.round(((compare - price) / compare) * 100) : 0;

export const statusLabel = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export const TRACK_STEPS = ["pending", "confirmed", "processing", "shipped", "out_for_delivery", "delivered"] as const;

export const NEPAL_PROVINCES = [
  "Koshi", "Madhesh", "Bagmati", "Gandaki", "Lumbini", "Karnali", "Sudurpashchim",
];

export const NEPAL_DISTRICTS_BY_PROVINCE: Record<string, string[]> = {
  Koshi: [
    "Bhojpur", "Dhankuta", "Ilam", "Jhapa", "Khotang", "Morang",
    "Okhaldhunga", "Panchthar", "Sankhuwasabha", "Solukhumbu",
    "Sunsari", "Taplejung", "Terhathum", "Udayapur",
  ],
  Madhesh: [
    "Bara", "Dhanusha", "Mahottari", "Parsa",
    "Rautahat", "Saptari", "Sarlahi", "Siraha",
  ],
  Bagmati: [
    "Bhaktapur", "Chitwan", "Dhading", "Dolakha", "Kathmandu",
    "Kavrepalanchok", "Lalitpur", "Makwanpur", "Nuwakot",
    "Ramechhap", "Rasuwa", "Sindhuli", "Sindhupalchok",
  ],
  Gandaki: [
    "Baglung", "Gorkha", "Kaski", "Lamjung", "Manang",
    "Mustang", "Myagdi", "Nawalpur", "Parbat", "Syangja", "Tanahun",
  ],
  Lumbini: [
    "Arghakhanchi", "Banke", "Bardiya", "Dang", "Eastern Rukum",
    "Gulmi", "Kapilvastu", "Nawalparasi", "Palpa", "Pyuthan",
    "Rolpa", "Rupandehi",
  ],
  Karnali: [
    "Dailekh", "Dolpa", "Humla", "Jajarkot", "Jumla",
    "Kalikot", "Mugu", "Salyan", "Surkhet", "Western Rukum",
  ],
  Sudurpashchim: [
    "Achham", "Baitadi", "Bajhang", "Bajura", "Dadeldhura",
    "Darchula", "Doti", "Kailali", "Kanchanpur",
  ],
};

export const NEPAL_CITIES_BY_DISTRICT: Record<string, string[]> = {
  // Koshi (14 districts)
  Bhojpur: ["Bhojpur", "Shadanand", "Hatuwagadhi", "Ramprasad Rai", "Aamchok", "Tyamke Maiyum", "Arun", "Pauwadungma", "Salpasilichho"],
  Dhankuta: ["Dhankuta", "Pakhribas", "Mahalaxmi", "Sangurigadhi", "Chaubise", "Chhathar Jorpati", "Sahidbhumi"],
  Ilam: ["Ilam", "Deumai", "Mai", "Suryodaya (Fikkal)", "Phakphokthum", "Maijogmai", "Chulachuli", "Rong", "Mangsebung", "Sandakpur"],
  Jhapa: ["Birtamod", "Damak", "Bhadrapur", "Mechinagar (Kakarbhitta)", "Arjundhara", "Kankai (Surunga)", "Shivasatakshi", "Gauradaha", "Kamal", "Buddhashanti"],
  Khotang: ["Diktel Rupakot Majhuwagadhi", "Halesi Tuwachung", "Khotehang", "Diprung Chuichumma", "Aiselukharka", "Jantedhunga", "Rawabesi", "Barahapokhari", "Sakela", "Kepilasgadhi"],
  Morang: ["Biratnagar", "SundarHaraicha (Birat Chowk)", "Belbari", "Pathari Shanischare", "Urlabari", "Rangeli", "Ratuwamai", "Sunbarshi", "Letang", "Budhiganga", "Katahari"],
  Okhaldhunga: ["Siddhicharan", "Manebhanjyang", "Champadevi", "Sunkoshi", "Molung", "Chisankhugadhi", "Khijidemba", "Likhu"],
  Panchthar: ["Phidim", "Phalelung", "Phalgunanda", "Hilihang", "Kummayak", "Miklajung", "Tumbewa", "Yangwarak"],
  Sankhuwasabha: ["Khandbari", "Chainpur", "Dharmadevi", "Madi", "Panchakhapan", "Bhotkhola", "Chichila", "Makalu", "Sabhapokhari", "Silichong"],
  Solukhumbu: ["Solu Dudhkunda (Salleri)", "Namche Bazaar", "Lukla", "Thulung Dudhkoshi", "Nechasalyan", "Khumbu Pasanglhamu"],
  Sunsari: ["Dharan", "Itahari", "Inaruwa", "Duhabi", "Ramdhuni (Jhumka)", "Barahakshetra", "Koshi", "Gadhi", "Barju", "Bhokraha Narsingh", "Harinagar"],
  Taplejung: ["Phungling", "Aathrai Tribeni", "Sidingwa", "Faktanglung", "Mikwakhola", "Meringden", "Maiwakhola", "Pathibhara Yangwarak", "Sirijangha"],
  Terhathum: ["Myanglung", "Laligurans (Basantapur)", "Aathrai", "Chhathar", "Menchayayem", "Phedap"],
  Udayapur: ["Triyuga (Gaighat)", "Katari", "Chaudandigadhi (Beltar)", "Belaka (Rampur)", "Udayapurgadhi", "Rautamai"],

  // Madhesh (8 districts)
  Bara: ["Kalaiya", "Jitpur Simara", "Nijgadh", "Kolhabi", "Mahagadhimai", "Simraungadh", "Pacharauta", "Pheta"],
  Dhanusha: ["Janakpurdham", "Chhireshwarnath (Mahendranagar)", "Dhanusadham", "Ganeshman Charnath", "Mithila (Dhalkebar)", "Sabaila", "Shahidnagar", "Bideha"],
  Mahottari: ["Jaleshwar", "Bardibas", "Gaushala", "Bhangaha", "Loharpatti", "Balwa", "Manara Shiswa", "Matihani", "Ramgopalpur"],
  Parsa: ["Birgunj", "Bahudaramai", "Parsagadhi", "Pokhariya", "Bindabasini", "Thori"],
  Rautahat: ["Gaur", "Chandrapur (Chandranigahapur)", "Garuda", "Gujara", "Brindaban", "Dewahi Gonahi", "Gadhimai", "Maulapur"],
  Saptari: ["Rajbiraj", "Kanchanrup", "Dakneshwori", "Bodebarsain", "Hanumannagar Kankalini", "Khadak", "Shambhunath", "Surunga"],
  Sarlahi: ["Malangwa", "Barahathwa", "Harion", "Lalbandi", "Ishworpur (Bayalbas)", "Bagmati", "Balara", "Godaita", "Hariwan"],
  Siraha: ["Lahan", "Siraha", "Golbazar", "Mirchaiya", "Kalyanpur", "Dhangadhimai", "Sukhipur", "Karjanha"],

  // Bagmati (13 districts)
  Bhaktapur: ["Bhaktapur", "Madhyapur Thimi", "Suryabinayak", "Changunarayan"],
  Chitwan: ["Bharatpur", "Bharatpur Metropolitan City (Narayangarh)", "Ratnanagar (Tandi)", "Khairahani", "Rapti (Bhandara)", "Kalika", "Madi", "Ichhyakamana (Mugling)"],
  Dhading: ["Nilkantha (Dhading Besi)", "Dhunibesi (Khanikhola)", "Galchhi", "Gajuri", "Benighat Rorang", "Malekhu"],
  Dolakha: ["Bhimeshwar (Charikot)", "Jiri", "Kalinchok", "Melung", "Sailung", "Gaurishankar"],
  Kathmandu: ["Kathmandu", "Kathmandu Metropolitan City", "Kirtipur", "Budhanilkantha", "Chandragiri", "Tokha", "Tarakeshwor", "Gokarneshwor", "Nagarjun", "Shankharapur", "Kageshwori Manohara", "Dakshinkali"],
  Kavrepalanchok: ["Banepa", "Dhulikhel", "Panauti", "Panchkhal", "Namobuddha", "Mandandeupur"],
  Lalitpur: ["Lalitpur", "Lalitpur Metropolitan City (Patan)", "Mahalaxmi", "Godawari", "Konjyosom", "Bagmati", "Mahankal"],
  Makwanpur: ["Hetauda", "Thaha (Palung)", "Bhimphedi", "Makawanpurgadhi", "Manahari"],
  Nuwakot: ["Bidur (Battar)", "Belkotgadhi", "Kakani", "Suryagadhi", "Shivapuri", "Trishuli"],
  Ramechhap: ["Manthali", "Ramechhap", "Khandadevi", "Likhu Tamakoshi", "Doramba"],
  Rasuwa: ["Dhunche (Gosaikunda)", "Syaphrubesi", "Uttargaya", "Kalika", "Naukunda"],
  Sindhuli: ["Kamalamai (Sindhulimadhi)", "Dudhouli", "Golanjor", "Khurkot", "Hariharpurgadhi", "Marin"],
  Sindhupalchok: ["Chautara Sangachokgadhi", "Melamchi", "Barhabise", "Tatopani (Bhotekoshi)", "Helambu", "Sukute"],

  // Gandaki (11 districts)
  Baglung: ["Baglung", "Galkot (Hatiya)", "Jaimini", "Dhorpatan (Burtibang)"],
  Gorkha: ["Gorkha", "Palungtar", "Barpak Sulikot", "Aarughat", "Manakamana (Shahid Lakhan)"],
  Kaski: ["Pokhara", "Pokhara Metropolitan City", "Lekhnath", "Annapurna", "Machhapuchhre", "Sarangkot"],
  Lamjung: ["Besisahar", "Sundarbazar", "Rainas", "Madhya Nepal"],
  Manang: ["Chame", "Manang Ngisyang", "Dharapani (Nason)"],
  Mustang: ["Jomsom (Gharpajhong)", "Muktinath (Baragung Muktikshetra)", "Marpha", "Lomanthang", "Lete"],
  Myagdi: ["Beni", "Galeshwor", "Annapurna (Tatopani)", "Dhaulagiri"],
  Nawalpur: ["Kawasoti", "Gaindakot", "Devchuli (Daldale)", "Madhyabindu (Chormara)", "Dumkibas (Binayi Tribeni)"],
  Parbat: ["Kushma", "Phalewas", "Jaljala", "Paiyun"],
  Syangja: ["Putalibazar", "Waling", "Chapakot", "Galyang", "Bhirkot (Bayarghari)"],
  Tanahun: ["Vyas (Damauli)", "Shuklagandaki (Dulegaunda / Khairenitar)", "Bandipur", "Anbukhaireni", "Bhanu", "Bhimad"],

  // Lumbini (12 districts)
  Arghakhanchi: ["Sandhikharka", "Shitganga", "Bhumikasthan", "Chhatradev"],
  Banke: ["Nepalgunj", "Kohalpur", "Khajura", "Baijanath"],
  Bardiya: ["Gulariya", "Bansgadhi", "Rajapur", "Thakurbaba (Bhurigaun)", "Madhuwan", "Barbardiya"],
  Dang: ["Ghorahi", "Tulsipur", "Lamahi", "Bhalubang (Rapti)", "Gadhawa"],
  "Eastern Rukum": ["Rukumkot (Sisne)", "Bhume", "Putha Uttarganga"],
  Gulmi: ["Tamghas (Resunga)", "Musikot", "Ridi (Ruru)", "Chandrakot", "Satyawati"],
  Kapilvastu: ["Kapilvastu (Taulihawa)", "Banganga (4 No. Jitpur)", "Buddhabhumi (Gorusinge)", "Shivaraj (Chandrauta)", "Krishnanagar"],
  Nawalparasi: ["Ramgram (Parasi)", "Bardaghat", "Sunwal", "Triveni"],
  Palpa: ["Tansen", "Rampur", "Arya Bhanjyang", "Rainadevi Chhahara"],
  Pyuthan: ["Pyuthan (Khalanga)", "Bijuwar", "Swargadwari", "Chakchake"],
  Rolpa: ["Liwang (Rolpa)", "Runtigadhi (Holeri)", "Sulichaur (Sunil Smriti)"],
  Rupandehi: ["Butwal", "Siddharthanagar (Bhairahawa)", "Tilottama (Manigram / Drivertole)", "Sainamaina (Murgiya)", "Devdaha (Khaireni)", "Lumbini Sanskritik"],

  // Karnali (10 districts)
  Dailekh: ["Narayan (Dailekh Bazaar)", "Dullu", "Chamunda Bindrasaini", "Aathbis"],
  Dolpa: ["Dunai (Thuli Bheri)", "Tripura Sundari", "Shey Phoksundo"],
  Humla: ["Simkot", "Kharpunath", "Hilsa (Namkha)"],
  Jajarkot: ["Bheri (Khalanga)", "Chhedagad", "Nalgad"],
  Jumla: ["Chandannath (Khalanga)", "Tatopani", "Sinja"],
  Kalikot: ["Manma (Khandachakra)", "Raskot", "Tilagukha"],
  Mugu: ["Gamgadhi (Chhayanath Rara)", "Rara Lake", "Soru"],
  Salyan: ["Sharada (Salyan Khalanga / Srinagar)", "Bagchaur", "Bangad Kupinde", "Kapurkot"],
  Surkhet: ["Birendranagar", "Bheriganga (Chhinchu)", "Subhakuna", "Gurbhakot (Mehalkuna)", "Babiyachaur (Panchapuri)"],
  "Western Rukum": ["Musikot (Salle / Khalanga)", "Chaurjahari", "Aathbiskot"],

  // Sudurpashchim (9 districts)
  Achham: ["Mangalsen", "Sanfebagar", "Kamalbazar", "Bayalgada"],
  Baitadi: ["Dasharathchand (Gothalapani / Jhulaghat)", "Patan", "Purchaudi", "Melauli"],
  Bajhang: ["Chainpur (Jayaprithvi)", "Bungal", "Talkot"],
  Bajura: ["Martadi (Badimalika)", "Kolti (Budhinanda)", "Tribeni"],
  Dadeldhura: ["Amargadhi (Dadeldhura Bazaar)", "Parashuram (Jogbuda)"],
  Darchula: ["Khalanga (Mahakali)", "Gokuleshwor (Shailyashikhar)"],
  Doti: ["Dipayal Silgadhi", "Rajpur", "Shikhar"],
  Kailali: ["Dhangadhi", "Tikapur", "Godawari (Attariya)", "Lamki Chuha", "Ghodaghodi (Sukhad)", "Bhajani", "Gauriganga (Chauraha)"],
  Kanchanpur: ["Bhimdatta (Mahendranagar)", "Bedkot (Daijee)", "Belauri", "Shuklaphanta (Jhalari)", "Krishnapur (Gulariya)", "Punarbas", "Dodhara Chandani"],
};

// Districts with express (2-day) delivery coverage
export const EXPRESS_DISTRICTS = ["kathmandu", "lalitpur", "bhaktapur", "kaski", "chitwan", "morang", "rupandehi", "sunsari", "parsa"];

export function deliveryEstimate(district: string) {
  const d = district.trim().toLowerCase();
  if (!d) return null;
  if (EXPRESS_DISTRICTS.includes(d)) return { days: "1–2 days", express: true };
  return { days: "3–6 days", express: false };
}
