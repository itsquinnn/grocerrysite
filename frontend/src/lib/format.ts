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

export const NEPAL_MUNICIPALITIES_BY_DISTRICT: Record<string, string[]> = {
  // Koshi (14 districts)
  Bhojpur: ["Bhojpur Municipality", "Shadanand Municipality", "Hatuwagadhi Rural Municipality", "Ramprasad Rai Rural Municipality", "Aamchok Rural Municipality", "Tyamke Maiyum Rural Municipality", "Arun Rural Municipality", "Pauwadungma Rural Municipality", "Salpasilichho Rural Municipality"],
  Dhankuta: ["Dhankuta Municipality", "Pakhribas Municipality", "Mahalaxmi Municipality", "Sangurigadhi Rural Municipality", "Chaubise Rural Municipality", "Chhathar Jorpati Rural Municipality", "Sahidbhumi Rural Municipality"],
  Ilam: ["Ilam Municipality", "Deumai Municipality", "Mai Municipality", "Suryodaya Municipality", "Phakphokthum Rural Municipality", "Maijogmai Rural Municipality", "Chulachuli Rural Municipality", "Rong Rural Municipality", "Mangsebung Rural Municipality", "Sandakpur Rural Municipality"],
  Jhapa: ["Birtamod Municipality", "Damak Municipality", "Bhadrapur Municipality", "Mechinagar Municipality", "Arjundhara Municipality", "Kankai Municipality", "Shivasatakshi Municipality", "Gauradaha Municipality", "Kamal Rural Municipality", "Buddhashanti Rural Municipality", "Haldibari Rural Municipality", "Kachankawal Rural Municipality", "Barhadashi Rural Municipality", "Jhapa Rural Municipality", "Gauriganj Rural Municipality"],
  Khotang: ["Diktel Rupakot Majhuwagadhi Municipality", "Halesi Tuwachung Municipality", "Khotehang Rural Municipality", "Diprung Chuichumma Rural Municipality", "Aiselukharka Rural Municipality", "Jantedhunga Rural Municipality", "Rawabesi Rural Municipality", "Barahapokhari Rural Municipality", "Sakela Rural Municipality", "Kepilasgadhi Rural Municipality"],
  Morang: ["Biratnagar Metropolitan City", "SundarHaraicha Municipality", "Belbari Municipality", "Pathari Shanischare Municipality", "Urlabari Municipality", "Rangeli Municipality", "Ratuwamai Municipality", "Sunbarshi Municipality", "Letang Municipality", "Budhiganga Rural Municipality", "Katahari Rural Municipality", "Kanepokhari Rural Municipality", "Gramthan Rural Municipality", "Jahada Rural Municipality", "Kerabari Rural Municipality", "Miklajung Rural Municipality"],
  Okhaldhunga: ["Siddhicharan Municipality", "Manebhanjyang Rural Municipality", "Champadevi Rural Municipality", "Sunkoshi Rural Municipality", "Molung Rural Municipality", "Chisankhugadhi Rural Municipality", "Khijidemba Rural Municipality", "Likhu Rural Municipality"],
  Panchthar: ["Phidim Municipality", "Phalelung Rural Municipality", "Phalgunanda Rural Municipality", "Hilihang Rural Municipality", "Kummayak Rural Municipality", "Miklajung Rural Municipality", "Tumbewa Rural Municipality", "Yangwarak Rural Municipality"],
  Sankhuwasabha: ["Khandbari Municipality", "Chainpur Municipality", "Dharmadevi Municipality", "Madi Municipality", "Panchakhapan Municipality", "Bhotkhola Rural Municipality", "Chichila Rural Municipality", "Makalu Rural Municipality", "Sabhapokhari Rural Municipality", "Silichong Rural Municipality"],
  Solukhumbu: ["Solu Dudhkunda Municipality", "Thulung Dudhkoshi Rural Municipality", "Nechasalyan Rural Municipality", "Khumbu Pasanglhamu Rural Municipality", "Dudhkaushika Rural Municipality", "Likhu Pike Rural Municipality", "Mahakulung Rural Municipality", "Sotang Rural Municipality"],
  Sunsari: ["Dharan Sub-Metropolitan City", "Itahari Sub-Metropolitan City", "Inaruwa Municipality", "Duhabi Municipality", "Ramdhuni Municipality", "Barahakshetra Municipality", "Koshi Rural Municipality", "Gadhi Rural Municipality", "Barju Rural Municipality", "Bhokraha Narsingh Rural Municipality", "Harinagar Rural Municipality", "Dewanganj Rural Municipality"],
  Taplejung: ["Phungling Municipality", "Aathrai Tribeni Rural Municipality", "Sidingwa Rural Municipality", "Faktanglung Rural Municipality", "Mikwakhola Rural Municipality", "Meringden Rural Municipality", "Maiwakhola Rural Municipality", "Pathibhara Yangwarak Rural Municipality", "Sirijangha Rural Municipality"],
  Terhathum: ["Myanglung Municipality", "Laligurans Municipality", "Aathrai Rural Municipality", "Chhathar Rural Municipality", "Menchayayem Rural Municipality", "Phedap Rural Municipality"],
  Udayapur: ["Triyuga Municipality", "Katari Municipality", "Chaudandigadhi Municipality", "Belaka Municipality", "Udayapurgadhi Rural Municipality", "Rautamai Rural Municipality", "Tapli Rural Municipality", "Limchungbung Rural Municipality"],

  // Madhesh (8 districts)
  Bara: ["Kalaiya Sub-Metropolitan City", "Jitpur Simara Sub-Metropolitan City", "Kolhabi Municipality", "Nijgadh Municipality", "Mahagadhimai Municipality", "Simraungadh Municipality", "Pacharauta Municipality", "Pheta Rural Municipality", "Baraagadhi Rural Municipality", "Karaiyamai Rural Municipality", "Prasauni Rural Municipality", "Bishrampur Rural Municipality", "Devtal Rural Municipality", "Subarna Rural Municipality", "Adarsh Kotwal Rural Municipality"],
  Dhanusha: ["Janakpurdham Sub-Metropolitan City", "Chhireshwarnath Municipality", "Dhanusadham Municipality", "Ganeshman Charnath Municipality", "Mithila Municipality", "Sabaila Municipality", "Shahidnagar Municipality", "Bideha Municipality", "Hansapur Municipality", "Kamala Municipality", "Mithila Bihari Municipality", "Nagarain Municipality", "Allau Rural Municipality", "Bateshwar Rural Municipality", "Janaknandani Rural Municipality", "Lakshminiya Rural Municipality", "Aurahi Rural Municipality", "Mukhiyapatti Musharniya Rural Municipality"],
  Mahottari: ["Jaleshwar Municipality", "Bardibas Municipality", "Gaushala Municipality", "Bhangaha Municipality", "Loharpatti Municipality", "Balwa Municipality", "Manara Shiswa Municipality", "Matihani Municipality", "Ramgopalpur Municipality", "Aurahi Municipality", "Ekdara Rural Municipality", "Pipara Rural Municipality", "Mahottari Rural Municipality", "Samsi Rural Municipality", "Sonama Rural Municipality"],
  Parsa: ["Birgunj Metropolitan City", "Bahudaramai Municipality", "Parsagadhi Municipality", "Pokhariya Municipality", "Bindabasini Rural Municipality", "Thori Rural Municipality", "Dhobini Rural Municipality", "Chhipaharmai Rural Municipality", "Jagarnathpur Rural Municipality", "Jirabhawani Rural Municipality", "Kalikamai Rural Municipality", "Pakahamainpur Rural Municipality", "Paterwa Sugauli Rural Municipality", "Sakhuwa Prasauni Rural Municipality"],
  Rautahat: ["Gaur Municipality", "Chandrapur Municipality", "Garuda Municipality", "Gujara Municipality", "Brindaban Municipality", "Dewahi Gonahi Municipality", "Gadhimai Municipality", "Maulapur Municipality", "Fatuwa Bijaypur Municipality", "Ishnath Municipality", "Katahariya Municipality", "Madhav Narayan Municipality", "Paroha Municipality", "Rajdevi Municipality", "Rajpur Municipality", "Yamunamai Rural Municipality", "Durga Bhagwati Rural Municipality"],
  Saptari: ["Rajbiraj Municipality", "Kanchanrup Municipality", "Dakneshwori Municipality", "Bodebarsain Municipality", "Hanumannagar Kankalini Municipality", "Khadak Municipality", "Shambhunath Municipality", "Surunga Municipality", "Saptakoshi Municipality", "Agnisair Krishnasavaran Rural Municipality", "Chhinnamasta Rural Municipality", "Mahadeva Rural Municipality", "Rupani Rural Municipality", "Tilathi Koiladi Rural Municipality", "Tirahut Rural Municipality", "Balan-Bihul Rural Municipality", "Bishnupur Rural Municipality"],
  Sarlahi: ["Malangwa Municipality", "Barahathwa Municipality", "Harion Municipality", "Lalbandi Municipality", "Ishworpur Municipality", "Bagmati Municipality", "Balara Municipality", "Godaita Municipality", "Hariwan Municipality", "Kabilasi Municipality", "Basbariya Rural Municipality", "Brahmapuri Rural Municipality", "Chakraghatta Rural Municipality", "Chandranagar Rural Municipality", "Dhankaul Rural Municipality", "Kaudena Rural Municipality", "Parsa Rural Municipality", "Pipariya Rural Municipality", "Ramnagar Rural Municipality", "Bishnu Rural Municipality"],
  Siraha: ["Lahan Municipality", "Siraha Municipality", "Golbazar Municipality", "Mirchaiya Municipality", "Kalyanpur Municipality", "Dhangadhimai Municipality", "Sukhipur Municipality", "Karjanha Municipality", "Bhagwanpur Rural Municipality", "Aurahi Rural Municipality", "Bishnupur Rural Municipality", "Bariyarpatti Rural Municipality", "Lakshmipur Patari Rural Municipality", "Naraha Rural Municipality", "Sakhuwanankarkatti Rural Municipality", "Arnama Rural Municipality", "Navarajpur Rural Municipality"],

  // Bagmati (13 districts)
  Bhaktapur: ["Bhaktapur Municipality", "Madhyapur Thimi Municipality", "Suryabinayak Municipality", "Changunarayan Municipality"],
  Chitwan: ["Bharatpur Metropolitan City", "Ratnanagar Municipality", "Khairahani Municipality", "Rapti Municipality", "Kalika Municipality", "Madi Municipality", "Ichhyakamana Rural Municipality"],
  Dhading: ["Nilkantha Municipality", "Dhunibesi Municipality", "Galchhi Rural Municipality", "Gajuri Rural Municipality", "Benighat Rorang Rural Municipality", "Jwalamukhi Rural Municipality", "Siddhalek Rural Municipality", "Tripurasundari Rural Municipality", "Gangajamuna Rural Municipality", "Netrawati Dabjong Rural Municipality", "Khaniyabas Rural Municipality", "Ruby Valley Rural Municipality", "Thakre Rural Municipality"],
  Dolakha: ["Bhimeshwar Municipality", "Jiri Municipality", "Kalinchok Rural Municipality", "Melung Rural Municipality", "Sailung Rural Municipality", "Bigu Rural Municipality", "Gaurishankar Rural Municipality", "Baiteshwor Rural Municipality", "Tamakoshi Rural Municipality"],
  Kathmandu: ["Kathmandu Metropolitan City", "Kirtipur Municipality", "Budhanilkantha Municipality", "Chandragiri Municipality", "Tokha Municipality", "Tarakeshwor Municipality", "Gokarneshwor Municipality", "Nagarjun Municipality", "Shankharapur Municipality", "Kageshwori Manohara Municipality", "Dakshinkali Municipality"],
  Kavrepalanchok: ["Banepa Municipality", "Dhulikhel Municipality", "Panauti Municipality", "Panchkhal Municipality", "Namobuddha Municipality", "Mandandeupur Municipality", "Bethanchowk Rural Municipality", "Bhumlu Rural Municipality", "Chaurideurali Rural Municipality", "Khanikhola Rural Municipality", "Mahabharat Rural Municipality", "Roshi Rural Municipality", "Temal Rural Municipality"],
  Lalitpur: ["Lalitpur Metropolitan City", "Mahalaxmi Municipality", "Godawari Municipality", "Konjyosom Rural Municipality", "Bagmati Rural Municipality", "Mahankal Rural Municipality"],
  Makwanpur: ["Hetauda Sub-Metropolitan City", "Thaha Municipality", "Bhimphedi Rural Municipality", "Makawanpurgadhi Rural Municipality", "Manahari Rural Municipality", "Raksirang Rural Municipality", "Bakaiya Rural Municipality", "Bagmati Rural Municipality", "Kailash Rural Municipality", "Indrasarowar Rural Municipality"],
  Nuwakot: ["Bidur Municipality", "Belkotgadhi Municipality", "Kakani Rural Municipality", "Suryagadhi Rural Municipality", "Shivapuri Rural Municipality", "Dupcheshwar Rural Municipality", "Likhu Rural Municipality", "Meghang Rural Municipality", "Panchakanya Rural Municipality", "Kispang Rural Municipality", "Tadi Rural Municipality", "Tarkeshwar Rural Municipality"],
  Ramechhap: ["Manthali Municipality", "Ramechhap Municipality", "Khandadevi Rural Municipality", "Likhu Tamakoshi Rural Municipality", "Doramba Rural Municipality", "Gokulganga Rural Municipality", "Sunapati Rural Municipality", "Umakunda Rural Municipality"],
  Rasuwa: ["Gosaikunda Rural Municipality", "Uttargaya Rural Municipality", "Kalika Rural Municipality", "Naukunda Rural Municipality", "Amachodingmo Rural Municipality"],
  Sindhuli: ["Kamalamai Municipality", "Dudhouli Municipality", "Golanjor Rural Municipality", "Hariharpurgadhi Rural Municipality", "Marin Rural Municipality", "Sunkoshi Rural Municipality", "Tinpatan Rural Municipality", "Phikkal Rural Municipality", "Ghyanglekh Rural Municipality"],
  Sindhupalchok: ["Chautara Sangachokgadhi Municipality", "Melamchi Municipality", "Barhabise Municipality", "Bhotekoshi Rural Municipality", "Helambu Rural Municipality", "Indrawati Rural Municipality", "Jugal Rural Municipality", "Lisankhu Pakhar Rural Municipality", "Panchpokhari Thangpal Rural Municipality", "Tripurasundari Rural Municipality", "Balefi Rural Municipality", "Sunkoshi Rural Municipality"],

  // Gandaki (11 districts)
  Baglung: ["Baglung Municipality", "Galkot Municipality", "Jaimini Municipality", "Dhorpatan Municipality", "Bareng Rural Municipality", "Badigad Rural Municipality", "Nisikhola Rural Municipality", "Kothekhola Rural Municipality", "Tarakhola Rural Municipality", "Tamankhola Rural Municipality"],
  Gorkha: ["Gorkha Municipality", "Palungtar Municipality", "Barpak Sulikot Rural Municipality", "Siranchok Rural Municipality", "Ajirkot Rural Municipality", "Dharche Rural Municipality", "Gandaki Rural Municipality", "Bhimsen Thapa Rural Municipality", "Shahid Lakhan Rural Municipality", "Aarughat Rural Municipality", "Chumanubri Rural Municipality"],
  Kaski: ["Pokhara Metropolitan City", "Annapurna Rural Municipality", "Machhapuchhre Rural Municipality", "Madi Rural Municipality", "Rupa Rural Municipality"],
  Lamjung: ["Besisahar Municipality", "Sundarbazar Municipality", "Rainas Municipality", "Madhya Nepal Municipality", "Dordi Rural Municipality", "Dudhpokhari Rural Municipality", "Kwholasothar Rural Municipality", "Marsyangdi Rural Municipality"],
  Manang: ["Chame Rural Municipality", "Nason Rural Municipality", "Narpa Bhumi Rural Municipality", "Manang Ngisyang Rural Municipality"],
  Mustang: ["Gharpajhong Rural Municipality", "Thasang Rural Municipality", "Baragung Muktikshetra Rural Municipality", "Lomanthang Rural Municipality", "Lo-Ghekar Damodarkunda Rural Municipality"],
  Myagdi: ["Beni Municipality", "Annapurna Rural Municipality", "Dhaulagiri Rural Municipality", "Malika Rural Municipality", "Mangala Rural Municipality", "Raghuganga Rural Municipality"],
  Nawalpur: ["Kawasoti Municipality", "Gaindakot Municipality", "Devchuli Municipality", "Madhyabindu Municipality", "Binayi Tribeni Rural Municipality", "Bulingtar Rural Municipality", "Boudikali Rural Municipality", "Hupsekot Rural Municipality"],
  Parbat: ["Kushma Municipality", "Phalewas Municipality", "Jaljala Rural Municipality", "Paiyun Rural Municipality", "Mahashila Rural Municipality", "Modi Rural Municipality", "Bihadi Rural Municipality"],
  Syangja: ["Putalibazar Municipality", "Waling Municipality", "Chapakot Municipality", "Bhirkot Municipality", "Galyang Municipality", "Andhikhola Rural Municipality", "Arjun Chaupari Rural Municipality", "Biruwa Rural Municipality", "Harinas Rural Municipality", "Kaligandaki Rural Municipality", "Phedikhola Rural Municipality"],
  Tanahun: ["Vyas Municipality", "Shuklagandaki Municipality", "Bhanu Municipality", "Bhimad Municipality", "Anbukhaireni Rural Municipality", "Bandipur Rural Municipality", "Devghat Rural Municipality", "Myagde Rural Municipality", "Rishing Rural Municipality", "Ghiring Rural Municipality"],

  // Lumbini (12 districts)
  Arghakhanchi: ["Sandhikharka Municipality", "Shitganga Municipality", "Bhumikasthan Municipality", "Chhatradev Rural Municipality", "Panini Rural Municipality", "Malarani Rural Municipality"],
  Banke: ["Nepalgunj Sub-Metropolitan City", "Kohalpur Municipality", "Baijanath Rural Municipality", "Khajura Rural Municipality", "Janaki Rural Municipality", "Duduwa Rural Municipality", "Narainapur Rural Municipality", "Rapti Sonari Rural Municipality"],
  Bardiya: ["Gulariya Municipality", "Madhuwan Municipality", "Rajapur Municipality", "Thakurbaba Municipality", "Bansgadhi Municipality", "Barbardiya Municipality", "Badhaiyatal Rural Municipality", "Geruwa Rural Municipality"],
  Dang: ["Ghorahi Sub-Metropolitan City", "Tulsipur Sub-Metropolitan City", "Lamahi Municipality", "Gadhawa Rural Municipality", "Rajpur Rural Municipality", "Shantinagar Rural Municipality", "Rapti Rural Municipality", "Babai Rural Municipality", "Dangisharan Rural Municipality", "Banglachuli Rural Municipality"],
  "Eastern Rukum": ["Sisne Rural Municipality", "Bhume Rural Municipality", "Putha Uttarganga Rural Municipality"],
  Gulmi: ["Resunga Municipality", "Musikot Municipality", "Chandrakot Rural Municipality", "Chhatrakot Rural Municipality", "Dhurkot Rural Municipality", "Gulmidarbar Rural Municipality", "Isma Rural Municipality", "Kaligandaki Rural Municipality", "Madane Rural Municipality", "Malika Rural Municipality", "Ruru Rural Municipality", "Satyawati Rural Municipality"],
  Kapilvastu: ["Kapilvastu Municipality", "Banganga Municipality", "Buddhabhumi Municipality", "Shivaraj Municipality", "Krishnanagar Municipality", "Maharajgunj Municipality", "Mayadevi Rural Municipality", "Yashodhara Rural Municipality", "Suddhodhan Rural Municipality", "Bijayanagar Rural Municipality"],
  Nawalparasi: ["Ramgram Municipality", "Bardaghat Municipality", "Sunwal Municipality", "Palhinandan Rural Municipality", "Pratapapur Rural Municipality", "Sarawal Rural Municipality", "Susta Rural Municipality"],
  Palpa: ["Tansen Municipality", "Rampur Municipality", "Rainadevi Chhahara Rural Municipality", "Mathagadhi Rural Municipality", "Nisdi Rural Municipality", "Purbakhola Rural Municipality", "Rambha Rural Municipality", "Ribdikot Rural Municipality", "Tinau Rural Municipality", "Bagnaskali Rural Municipality"],
  Pyuthan: ["Pyuthan Municipality", "Swargadwari Municipality", "Gaumukhi Rural Municipality", "Mandavi Rural Municipality", "Sarumarani Rural Municipality", "Mallarani Rural Municipality", "Naubahini Rural Municipality", "Jhimruk Rural Municipality", "Airawati Rural Municipality"],
  Rolpa: ["Rolpa Municipality", "Runtigadhi Rural Municipality", "Sunil Smriti Rural Municipality", "Triveni Rural Municipality", "Lungri Rural Municipality", "Gangadev Rural Municipality", "Thabang Rural Municipality", "Madi Rural Municipality", "Paribartan Rural Municipality"],
  Rupandehi: ["Butwal Sub-Metropolitan City", "Siddharthanagar Municipality", "Tilottama Municipality", "Devdaha Municipality", "Sainamaina Municipality", "Lumbini Sanskritik Municipality", "Gaidahawa Rural Municipality", "Kanchan Rural Municipality", "Kotahimai Rural Municipality", "Marchawari Rural Municipality", "Mayadevi Rural Municipality", "Omsatiya Rural Municipality", "Rohini Rural Municipality", "Sammarimai Rural Municipality", "Siyari Rural Municipality", "Suddhodhan Rural Municipality"],

  // Karnali (10 districts)
  Dailekh: ["Narayan Municipality", "Dullu Municipality", "Chamunda Bindrasaini Municipality", "Aathbis Municipality", "Bhagawatimai Rural Municipality", "Gurans Rural Municipality", "Dungeshwar Rural Municipality", "Naumule Rural Municipality", "Mahabu Rural Municipality", "Bhairabi Rural Municipality", "Thantikandh Rural Municipality"],
  Dolpa: ["Thuli Bheri Municipality", "Tripura Sundari Municipality", "Dolpo Buddha Rural Municipality", "Shey Phoksundo Rural Municipality", "Jagadulla Rural Municipality", "Mudkechula Rural Municipality", "Kaike Rural Municipality", "Chharka Tangsong Rural Municipality"],
  Humla: ["Simkot Rural Municipality", "Namkha Rural Municipality", "Kharpunath Rural Municipality", "Sarkegad Rural Municipality", "Chankheli Rural Municipality", "Adanchuli Rural Municipality", "Tanjakot Rural Municipality"],
  Jajarkot: ["Bheri Municipality", "Chhedagad Municipality", "Nalgad Municipality", "Barekot Rural Municipality", "Kuse Rural Municipality", "Junichande Rural Municipality", "Shivalaya Rural Municipality"],
  Jumla: ["Chandannath Municipality", "Tila Rural Municipality", "Tatopani Rural Municipality", "Sinja Rural Municipality", "Hima Rural Municipality", "Kanakasundari Rural Municipality", "Patarasi Rural Municipality", "Guthichaur Rural Municipality"],
  Kalikot: ["Khandachakra Municipality", "Raskot Municipality", "Tilagukha Municipality", "Pachaljharana Rural Municipality", "Sanni Triveni Rural Municipality", "Narharinath Rural Municipality", "Shubha Kalika Rural Municipality", "Mahawai Rural Municipality", "Palata Rural Municipality"],
  Mugu: ["Chhayanath Rara Municipality", "Mugum Karmarong Rural Municipality", "Soru Rural Municipality", "Khatyad Rural Municipality"],
  Salyan: ["Sharada Municipality", "Bagchaur Municipality", "Bangad Kupinde Municipality", "Kalimati Rural Municipality", "Tribeni Rural Municipality", "Kapurkot Rural Municipality", "Chatreshwari Rural Municipality", "Siddha Kumakh Rural Municipality", "Kumakh Rural Municipality", "Darma Rural Municipality"],
  Surkhet: ["Birendranagar Municipality", "Gurbhakot Municipality", "Bheriganga Municipality", "Panchapuri Municipality", "Lekbeshi Municipality", "Chaukunne Rural Municipality", "Barahatal Rural Municipality", "Simta Rural Municipality", "Chingad Rural Municipality"],
  "Western Rukum": ["Musikot Municipality", "Chaurjahari Municipality", "Aathbiskot Municipality", "Banfikot Rural Municipality", "Sanibheri Rural Municipality", "Tribeni Rural Municipality"],

  // Sudurpashchim (9 districts)
  Achham: ["Mangalsen Municipality", "Sanfebagar Municipality", "Kamalbazar Municipality", "Panchadeval Binayak Municipality", "Chaurpati Rural Municipality", "Mellekh Rural Municipality", "Bannigadhi Jayagadh Rural Municipality", "Ramaroshan Rural Municipality", "Turmakhand Rural Municipality", "Dhakari Rural Municipality"],
  Baitadi: ["Dasharathchand Municipality", "Patan Municipality", "Melauli Municipality", "Purchaudi Municipality", "Sunary Rural Municipality", "Dilasaini Rural Municipality", "Dogadakedar Rural Municipality", "Pancheshwar Rural Municipality", "Surnaya Rural Municipality", "Sigas Rural Municipality", "Shivanath Rural Municipality"],
  Bajhang: ["Jayaprithvi Municipality", "Bungal Municipality", "Talkot Rural Municipality", "Masta Rural Municipality", "Khaptadchhanna Rural Municipality", "Thalara Rural Municipality", "Bitthadchir Rural Municipality", "Surma Rural Municipality", "Chhabispathibhera Rural Municipality", "Durgathali Rural Municipality", "Kedarsyu Rural Municipality", "Saipal Rural Municipality"],
  Bajura: ["Badimalika Municipality", "Tribeni Municipality", "Budhiganga Municipality", "Budhinanda Municipality", "Gaumul Rural Municipality", "Pandav Gupha Rural Municipality", "Swami Kartik Khapar Rural Municipality", "Chhededaha Rural Municipality", "Himali Rural Municipality"],
  Dadeldhura: ["Amargadhi Municipality", "Parashuram Municipality", "Alital Rural Municipality", "Ajaymeru Rural Municipality", "Bhagwatigadhi Rural Municipality", "Navadurga Rural Municipality", "Ganyapdhura Rural Municipality"],
  Darchula: ["Mahakali Municipality", "Shailyashikhar Municipality", "Malikarjun Rural Municipality", "Apihimal Rural Municipality", "Duhun Rural Municipality", "Naugad Rural Municipality", "Marma Rural Municipality", "Lekam Rural Municipality", "Byas Rural Municipality"],
  Doti: ["Dipayal Silgadhi Municipality", "Shikhar Municipality", "Purbichowki Rural Municipality", "Badikedar Rural Municipality", "Jorayal Rural Municipality", "Sayal Rural Municipality", "Aadarsha Rural Municipality", "K.I. Singh Rural Municipality", "Bogatan Phudsil Rural Municipality"],
  Kailali: ["Dhangadhi Sub-Metropolitan City", "Tikapur Municipality", "Godawari Municipality", "Lamki Chuha Municipality", "Ghodaghodi Municipality", "Bhajani Municipality", "Gauriganga Municipality", "Janaki Rural Municipality", "Bardgoriya Rural Municipality", "Mohanyal Rural Municipality", "Kailari Rural Municipality", "Chure Rural Municipality", "Joshipur Rural Municipality"],
  Kanchanpur: ["Bhimdatta Municipality", "Bedkot Municipality", "Belauri Municipality", "Shuklaphanta Municipality", "Krishnapur Municipality", "Punarbas Municipality", "Dodhara Chandani Municipality", "Beldandi Rural Municipality", "Laljhadi Rural Municipality"],
};

export const NEPAL_CITIES_BY_MUNICIPALITY: Record<string, string[]> = {
  // Kathmandu Municipalities
  "Kathmandu Metropolitan City": [
    "New Road", "Thamel", "Baneshwor", "Koteshwor", "Baluwatar", "Putalisadak", "Maharajgunj",
    "Chabahil", "Kalanki", "Durbarmarg", "Asan", "Anamnagar", "Dillibazar", "Tripureshwor",
    "Kalimati", "Balkhu", "Lazimpat", "Battisputali", "Sinamangal", "Teku", "Babar Mahal",
    "Naxal", "Maitighar", "Minbhawan", "Tinkune", "Gaushala", "Kapan Marg",
  ],
  "Kirtipur Municipality": [
    "Kirtipur Bazaar", "Naya Bazaar", "Panga", "Tyanglaphat", "Chobhar", "Palikhel", "Bhatkyapati",
  ],
  "Budhanilkantha Municipality": [
    "Budhanilkantha", "Mandikhatar", "Golfutar", "Narayanthan", "Chapali", "Hattigauda", "Chunikhel", "Bhangal", "Pasikot",
  ],
  "Chandragiri Municipality": [
    "Thankot", "Gurjudhara", "Naikap", "Matatirtha", "Satungal", "Badbhanjyang", "Checkpost",
  ],
  "Tokha Municipality": [
    "Tokha Bazaar", "Grande (Dhapasi)", "Baniyatar", "Jhor", "Chandeshwori",
  ],
  "Tarakeshwor Municipality": [
    "Manamaiju", "Dharmasthali", "Kavresthali", "Goldhunga", "Jitpurphedi", "Sangla",
  ],
  "Gokarneshwor Municipality": [
    "Jorpati", "Gokarna", "Sundarijal", "Besigaun", "Nayabasti", "Attarkhel",
  ],
  "Nagarjun Municipality": [
    "Sitapaila", "Ramkot", "Ichhangunarayan", "Syuchatar", "Bhimdhunga",
  ],
  "Shankharapur Municipality": [
    "Sankhu", "Jaharsingh Pauwa", "Pukhulachhi", "Lapsiphedi", "Nagarkot Gate",
  ],
  "Kageshwori Manohara Municipality": [
    "Mulpani", "Thali", "Kandaghari", "Danchhi", "Gothatar",
  ],
  "Dakshinkali Municipality": [
    "Pharping", "Dakshinkali", "Chhaimale", "Sheshnarayan", "Talku Dudechaur",
  ],

  // Lalitpur Municipalities
  "Lalitpur Metropolitan City": [
    "Patan (Durbar Square)", "Jawalakhel", "Jhamsikhel", "Pulchowk", "Kupondole", "Sanepa",
    "Lagankhel", "Kumaripati", "Gwarko", "Balkumari", "Ekantakuna", "Dhobighat", "Satdobato",
    "Mangalbazar", "Chakupat", "Bakhundole", "Nakkhu", "Bhaisepati",
  ],
  "Mahalaxmi Municipality": [
    "Imadol", "Lubhu", "Tikathali", "Siddhi Thakurani", "Sirutar border",
  ],
  "Godawari Municipality": [
    "Godawari", "Bajrabarahi", "Chapagaun", "Thecho", "Lele", "Badikhel", "Harisiddhi",
  ],

  // Bhaktapur Municipalities
  "Bhaktapur Municipality": [
    "Bhaktapur Durbar Square", "Taumadhi", "Dattatreya", "Byasi", "Kamalbinayak", "Suryamadhi", "Bholachhen",
  ],
  "Madhyapur Thimi Municipality": [
    "Thimi", "Sanothimi", "Radhe Radhe", "Lokanthali", "Kaushaltar", "Gaththaghar", "Bode", "Nagadesh",
  ],
  "Suryabinayak Municipality": [
    "Suryabinayak", "Katunje", "Sipadol", "Nankhel", "Dadhikot", "Sirutar", "Gundu", "Balkot",
  ],
  "Changunarayan Municipality": [
    "Changunarayan", "Duwakot", "Jhaukhel", "Kharipati", "Bageshwori", "Telkot",
  ],

  // Kaski / Pokhara
  "Pokhara Metropolitan City": [
    "Lakeside (Baidam)", "Mahendrapool", "Prithvi Chowk", "Chipledhunga", "New Road", "Birauta",
    "Bagar", "Nadipur", "Kundahar", "Lamachaur", "Hemja", "Talchowk (Lekhnath)", "Gagangauda",
    "Sarangkot", "Sisuwa", "Amarsingh Chowk", "Rambazar",
  ],

  // Chitwan
  "Bharatpur Metropolitan City": [
    "Narayangarh", "Chaubiskothi", "Bharatpur Height", "Hakim Chowk", "Lions Chowk", "Bhojad", "Rampur", "Fulbari", "Gitanagar", "Patihani", "Meghauli",
  ],
  "Ratnanagar Municipality": [
    "Tandi", "Sauraha", "Bakulahar", "Panchakanya", "Jaymangala",
  ],

  // Morang
  "Biratnagar Metropolitan City": [
    "Main Road (Biratnagar)", "Traffic Chowk", "Roadcess Chowk", "Rani (Border)", "Bargachhi", "Kanchanbari", "Tintoliya", "Tinpaini", "Jatuwa",
  ],
  "SundarHaraicha Municipality": [
    "Birat Chowk", "Salakpur", "Gothgaun", "Dulari", "Indrapur", "Khorsane",
  ],

  // Sunsari
  "Dharan Sub-Metropolitan City": [
    "Bhanu Chowk", "Bhotepul", "Putali Line", "Chatara Line", "Ghopa Camp (BPKIHS)", "Bijayapur", "Dharan-15",
  ],
  "Itahari Sub-Metropolitan City": [
    "Main Chowk (Itahari)", "Tarahara", "Khanar", "Pachrukhi", "Labipur", "Halgada",
  ],

  // Rupandehi
  "Butwal Sub-Metropolitan City": [
    "Traffic Chowk", "Amarpath", "Golpark", "Kalikanagar", "Milan Chowk", "Devinagar", "Deepnagar", "Hospital Line", "Rajmarga Chauraha",
  ],
  "Siddharthanagar Municipality": [
    "Bhairahawa Bazaar", "Bank Road", "Belahiya (Sunauli Border)", "Galla Mandi", "Airport Area", "Milan Chowk",
  ],
  "Tilottama Municipality": [
    "Manigram", "Drivertole", "Bhalwari", "Kotihawa", "Mangalapur", "Yogikuti",
  ],

  // Dhanusha
  "Janakpurdham Sub-Metropolitan City": [
    "Janaki Mandir Area", "Ramanand Chowk", "Bhanu Chowk", "Station Road", "Muralichowk", "Kadam Chowk", "Pidari Chowk",
  ],

  // Parsa
  "Birgunj Metropolitan City": [
    "Ghantaghar", "Adarshanagar", "Main Road (Birgunj)", "Maisthan", "Alau", "Customs Area", "Power House Chowk", "Murli", "Pipara",
  ],

  // Banke
  "Nepalgunj Sub-Metropolitan City": [
    "Tribhuvan Chowk", "Dhamboji Chowk", "Surkhet Road", "Ganeshman Chowk", "Karkando", "Rani Talau", "BP Chowk", "Belaspur",
  ],
  "Kohalpur Municipality": [
    "Kohalpur Chowk", "Chhinchu Road", "Medical College Area", "Matshya Kendra", "High School Chowk",
  ],

  // Dang
  "Ghorahi Sub-Metropolitan City": [
    "Ghorahi Bazaar", "Tulsipur Chowk", "Naya Bazaar", "Shahid Gate", "Deepshikha Road",
  ],
  "Tulsipur Sub-Metropolitan City": [
    "Tulsipur Bazaar", "BP Chowk", "Araniko Maidan", "Airport Road", "Tarigaun",
  ],

  // Kailali
  "Dhangadhi Sub-Metropolitan City": [
    "Main Road (Dhangadhi)", "Chauraha", "Campus Road", "Hasanpur", "Boradandi", "Bishalnagar", "Trinagar Border",
  ],
  "Godawari Municipality": [
    "Attariya Chowk", "Malakheti", "Teghari", "Godawari Dham",
  ],

  // Kanchanpur
  "Bhimdatta Municipality": [
    "Mahendranagar Bazaar", "Traffic Chowk", "Gaddachauki Border", "Ulta Kham", "Suda",
  ],

  // Jhapa
  "Birtamod Municipality": [
    "Mukti Chowk", "Bhadrapur Road", "Sanischare Road", "Charpane", "Garamani", "Bus Park",
  ],
  "Damak Municipality": [
    "Damak Chowk", "Thana Road", "Beldangi Road", "Campus Mode", "Baghmara",
  ],
  "Mechinagar Municipality": [
    "Kakarbhitta Border", "Dhulabari", "Itabhatta", "Bahundangi", "Charali",
  ],

  // Makwanpur
  "Hetauda Sub-Metropolitan City": [
    "Seemachowk", "Main Road (Hetauda)", "Buddha Chowk", "Kantirajpath", "Chaugadha", "Huprachaur", "Sanopokhara", "Hetauda Industrial Area",
  ],

  // Bara
  "Kalaiya Sub-Metropolitan City": [
    "Kalaiya Bazaar", "Bhartaganj", "Adarsh Chowk", "Barewa", "Rajaura",
  ],
  "Jitpur Simara Sub-Metropolitan City": [
    "Simara Airport Area", "Jitpur Bazaar", "Piluwa", "Amlekhganj", "Bakaiya",
  ],

  // Kavrepalanchok
  "Banepa Municipality": ["Banepa Bazaar", "Chandeshwori", "Nala Road", "Tindobato", "Budol"],
  "Dhulikhel Municipality": ["Dhulikhel Bazaar", "Saraswoti Bazaar", "Bhattedanda", "Hospital Area"],
  "Panauti Municipality": ["Panauti Durbar Area", "Triveni Ghat", "Khopasi", "Malpi"],

  // Tanahun
  "Vyas Municipality": ["Damauli", "Traffic Chowk (Damauli)", "Bhakunde", "Chhabise"],
  "Shuklagandaki Municipality": ["Dulegaunda", "Khairenitar", "Belchautara", "Kotre"],

  // Nawalpur
  "Kawasoti Municipality": ["Kawasoti Bazaar", "Thana Chowk", "Danda", "Hasna"],
  "Gaindakot Municipality": ["Narayani Bridge Area", "Congress Chowk", "Gaindakot-1", "Bhedabari"],
  "Devchuli Municipality": ["Daldale", "Pragatinagar", "Rampur", "Kirtipur"],

  // Syangja
  "Waling Municipality": ["Waling Bazaar", "Bhusaldanda", "Grahau Sur", "Bayarghari"],
  "Putalibazar Municipality": ["Putalibazar", "Bhadgaun", "Badhkhola", "Sarangdanda"],

  // Surkhet
  "Birendranagar Municipality": ["Birendranagar Bazaar", "Mangalgadhi Chowk", "Yari Chowk", "Airport Area", "Dhuliyabit"],

  // Palpa
  "Tansen Municipality": ["Tansen Bazaar", "Bishal Bazaar", "Silkhana", "Bartung", "Holangdi"],

  // Kapilvastu
  "Kapilvastu Municipality": ["Taulihawa Bazaar", "Naya Bus Park", "Gaucharan", "Tilaurakot"],
  "Banganga Municipality": ["4 No. Jitpur", "Pipara", "Motipur", "Kopawa"],

  // Nawalparasi West
  "Ramgram Municipality": ["Parasi Bazaar", "Buddha Chowk", "Ghurahawa", "Manjhariya"],
  "Bardaghat Municipality": ["Bardaghat Chowk", "Chisapani", "Bhuwans"],
  "Sunwal Municipality": ["Sunwal Bazaar", "Somnath", "Jyamire", "Mahalaxmi"],

  // Siraha
  "Lahan Municipality": ["Lahan Bazaar", "Hospital Chowk", "Shahid Chowk", "Basti Road"],
  "Siraha Municipality": ["Siraha Bazaar", "Thana Chowk", "Hempur", "Radha Krishna Chowk"],

  // Saptari
  "Rajbiraj Municipality": ["Rajbiraj Bazaar", "Setu Palkhi Chowk", "Netraganj", "Rampur"],

  // Sarlahi
  "Malangwa Municipality": ["Malangwa Bazaar", "Hospital Road", "Brahmapuri Road"],
  "Lalbandi Municipality": ["Lalbandi Bazaar", "Chorpur", "Kharbariya", "Janaki Chowk"],
  "Harion Municipality": ["Harion Bazaar", "Chaturbhujeshwor", "Pidarimode"],

  // Rautahat
  "Gaur Municipality": ["Gaur Bazaar", "Customs Area", "Garuda Road"],
  "Chandrapur Municipality": ["Chandranigahapur (Chapur)", "Balchanpur", "Santapur"],
};

// Aliased export for backwards compatibility
export const NEPAL_CITIES_BY_DISTRICT = NEPAL_MUNICIPALITIES_BY_DISTRICT;

// Districts with express (2-day) delivery coverage
export const EXPRESS_DISTRICTS = ["kathmandu", "lalitpur", "bhaktapur", "kaski", "chitwan", "morang", "rupandehi", "sunsari", "parsa"];

export function deliveryEstimate(district: string) {
  const d = district.trim().toLowerCase();
  if (!d) return null;
  if (EXPRESS_DISTRICTS.includes(d)) return { days: "1–2 days", express: true };
  return { days: "3–6 days", express: false };
}
