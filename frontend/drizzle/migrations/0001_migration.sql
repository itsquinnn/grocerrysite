
insert into public.categories(slug,name,description,image_url,sort) values
('fashion','Fashion','Considered wardrobe essentials','/assets/products/wool-overcoat.jpg',1),
('electronics','Electronics','Tech that earns its place','/assets/products/wireless-headphones.jpg',2),
('home','Home & Living','Pieces for a calmer home','/assets/products/ceramic-vase.jpg',3),
('beauty','Beauty','Clean rituals, Himalayan botanicals','/assets/products/face-serum.jpg',4),
('sports','Sports & Outdoors','Built for the trail','/assets/products/trekking-backpack.jpg',5),
('accessories','Accessories','The finishing details','/assets/products/sunglasses.jpg',6);

insert into public.brands(slug,name) values ('dovan-studio','DOVAN Studio'),('himal','Himal Works'),('sona','Sona Audio'),('kaath','Kaath & Co'),('bhumi','Bhumi Naturals'),('trailhead','Trailhead');

insert into public.products(slug,name,sku,description,category_id,subcategory,brand_id,price,compare_at_price,stock,images,sizes,colors,specs,is_featured,sold_count,created_at)
select v.slug,v.name,v.sku,v.descr,(select id from public.categories where slug=v.cat),v.sub,(select id from public.brands where slug=v.brand),v.price,v.cmp,v.stock,array[v.img],v.sizes,v.colors,v.specs::jsonb,v.feat,v.sold,now()-(v.age||' days')::interval
from (values
('linen-button-down-shirt','Linen Button-Down Shirt','DV-FA-001','Breathable European linen, garment-washed for a soft hand. Relaxed fit that works from Thamel cafés to weekend weddings.','fashion','Shirts','dovan-studio',3490,4290,42,'/assets/products/linen-shirt.jpg',array['S','M','L','XL'],array['Ivory','Sand'],'{"Material":"100% linen","Fit":"Relaxed","Care":"Machine wash cold"}',true,180,3),
('camel-wool-overcoat','Camel Wool Overcoat','DV-FA-002','Double-faced wool blend coat with a clean notch lapel. Made for Kathmandu winters.','fashion','Outerwear','dovan-studio',14900,18500,12,'/assets/products/wool-overcoat.jpg',array['S','M','L'],array['Camel'],'{"Material":"70% wool, 30% polyamide","Lining":"Viscose","Care":"Dry clean"}',true,64,20),
('pure-pashmina-shawl','Pure Pashmina Shawl','DV-FA-003','Hand-woven in the Kathmandu valley from fine Himalayan cashmere. Feather-light and remarkably warm.','fashion','Shawls','himal',8900,null,25,'/assets/products/pashmina-shawl.jpg',array[]::text[],array['Maroon','Charcoal','Oat'],'{"Material":"100% pashmina","Size":"70 x 200 cm","Origin":"Nepal"}',true,210,45),
('aura-wireless-headphones','Aura Wireless Headphones','DV-EL-001','Active noise cancelling, 40-hour battery and plush memory-foam cushions.','electronics','Audio','sona',18500,22000,30,'/assets/products/wireless-headphones.jpg',array[]::text[],array['Black'],'{"Battery":"40 hours","Connectivity":"Bluetooth 5.3","Weight":"250 g","Warranty":"1 year"}',true,320,10),
('pulse-smartwatch','Pulse Smartwatch','DV-EL-002','Heart-rate, SpO2, sleep tracking and 7-day battery in a slim aluminium case.','electronics','Wearables','sona',12900,14900,0,'/assets/products/smartwatch.jpg',array[]::text[],array['Sand','Black'],'{"Display":"1.8 in AMOLED","Battery":"7 days","Water resistance":"5 ATM","Warranty":"1 year"}',false,150,7),
('pebble-bluetooth-speaker','Pebble Bluetooth Speaker','DV-EL-003','Pocketable 360° sound, IP67 waterproof, 12-hour playtime.','electronics','Audio','sona',5490,6990,60,'/assets/products/bluetooth-speaker.jpg',array[]::text[],array['Charcoal'],'{"Battery":"12 hours","Rating":"IP67","Output":"10 W"}',false,95,2),
('terracotta-vase','Terracotta Vase','DV-HO-001','Wheel-thrown by potters in Bhaktapur. Each piece varies slightly in tone.','home','Decor','kaath',2450,null,18,'/assets/products/ceramic-vase.jpg',array[]::text[],array['Terracotta'],'{"Height":"28 cm","Material":"Fired clay","Origin":"Bhaktapur"}',true,77,30),
('brass-table-lamp','Brass Table Lamp','DV-HO-002','Brushed brass base with a natural linen shade. Warm, glare-free light.','home','Lighting','kaath',7900,9500,9,'/assets/products/brass-lamp.jpg',array[]::text[],array['Brass'],'{"Height":"52 cm","Bulb":"E27, up to 40 W","Cable":"1.8 m"}',false,40,12),
('striped-cotton-throw','Striped Cotton Throw','DV-HO-003','Hand-loomed cotton throw with tasselled edges.','home','Textiles','kaath',3290,3990,35,'/assets/products/cotton-throw.jpg',array[]::text[],array['Rust','Oat'],'{"Size":"130 x 170 cm","Material":"100% cotton"}',false,58,5),
('himalayan-face-serum','Himalayan Face Serum','DV-BE-001','Seabuckthorn and rosehip oils for a bright, nourished complexion.','beauty','Skincare','bhumi',1890,2200,80,'/assets/products/face-serum.jpg',array[]::text[],array[]::text[],'{"Volume":"30 ml","Skin type":"All","Key ingredients":"Seabuckthorn, rosehip"}',true,260,15),
('herbal-soap-trio','Herbal Soap Trio','DV-BE-002','Cold-process soaps with lavender, nettle and turmeric.','beauty','Bath','bhumi',990,null,120,'/assets/products/herbal-soap-set.jpg',array[]::text[],array[]::text[],'{"Weight":"3 x 100 g","Vegan":"Yes"}',false,190,25),
('amber-eau-de-parfum','Amber Eau de Parfum','DV-BE-003','Warm amber, cardamom and sandalwood. Long-lasting.','beauty','Fragrance','bhumi',4590,5490,22,'/assets/products/perfume.jpg',array[]::text[],array[]::text[],'{"Volume":"50 ml","Notes":"Amber, cardamom, sandalwood"}',false,85,1),
('sage-yoga-mat','Sage Yoga Mat','DV-SP-001','6 mm natural rubber mat with grippy texture and carry strap.','sports','Yoga','trailhead',3990,null,40,'/assets/products/yoga-mat.jpg',array[]::text[],array['Sage'],'{"Thickness":"6 mm","Size":"183 x 61 cm","Material":"Natural rubber"}',false,110,18),
('annapurna-trekking-pack','Annapurna 45L Trekking Pack','DV-SP-002','Ventilated back panel, rain cover and hip-belt pockets. Tested on the Annapurna circuit.','sports','Trekking','trailhead',9800,11500,15,'/assets/products/trekking-backpack.jpg',array[]::text[],array['Olive'],'{"Capacity":"45 L","Weight":"1.4 kg","Rain cover":"Included"}',true,140,8),
('stride-running-shoes','Stride Running Shoes','DV-SP-003','Responsive foam midsole and breathable mesh upper for daily miles.','sports','Footwear','trailhead',6490,7990,28,'/assets/products/running-shoes.jpg',array['39','40','41','42','43','44'],array['White/Grey'],'{"Drop":"8 mm","Weight":"260 g","Upper":"Engineered mesh"}',false,175,4),
('classic-leather-wallet','Classic Leather Wallet','DV-AC-001','Full-grain leather bifold with six card slots. Ages beautifully.','accessories','Wallets','dovan-studio',2290,2790,50,'/assets/products/leather-wallet.jpg',array[]::text[],array['Brown'],'{"Material":"Full-grain leather","Card slots":"6"}',false,130,22),
('tortoise-sunglasses','Tortoise Sunglasses','DV-AC-002','Acetate frames with polarised UV400 lenses.','accessories','Eyewear','dovan-studio',3490,null,33,'/assets/products/sunglasses.jpg',array[]::text[],array['Tortoise'],'{"Lens":"Polarised UV400","Frame":"Acetate"}',true,98,6),
('market-canvas-tote','Market Canvas Tote','DV-AC-003','Heavy cotton canvas with vegetable-tanned leather handles.','accessories','Bags','dovan-studio',1990,2490,70,'/assets/products/canvas-tote.jpg',array[]::text[],array['Natural'],'{"Size":"40 x 38 x 12 cm","Material":"12 oz canvas"}',false,160,9)
) as v(slug,name,sku,descr,cat,sub,brand,price,cmp,stock,img,sizes,colors,specs,feat,sold,age);

insert into public.reviews(product_id,author_name,rating,title,body)
select p.id, r.author, r.rating, r.title, r.body from public.products p
join (values
('linen-button-down-shirt','Aarav S.',5,'Perfect summer shirt','Fabric is soft and the fit is spot on. Delivered to Pokhara in 3 days.'),
('linen-button-down-shirt','Sita K.',4,'Lovely quality','Bought for my husband, he wears it every week.'),
('pure-pashmina-shawl','Priya M.',5,'Truly authentic','So light and warm. Gifted one to my mother.'),
('aura-wireless-headphones','Rohan T.',5,'Great ANC','Blocks out Kathmandu traffic completely.'),
('aura-wireless-headphones','Bikash G.',4,'Comfortable','Battery lasts forever, slightly tight at first.'),
('himalayan-face-serum','Anjali R.',5,'Glowing skin','Absorbs quickly, no greasy feel.'),
('annapurna-trekking-pack','Nima S.',5,'Trail-proven','Carried it to ABC, held up perfectly.'),
('terracotta-vase','Kriti B.',4,'Beautiful piece','Looks even better in person.')
) as r(slug,author,rating,title,body) on r.slug=p.slug;

insert into public.coupons(code,description,discount_type,value,min_order,max_discount) values
('WELCOME10','10% off your first order','percent',10,1000,1500),
('DASHAIN500','Rs. 500 off orders above Rs. 5,000','fixed',500,5000,null);
