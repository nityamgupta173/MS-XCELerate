/**
 * The fact-checked Q&A library. Edit here, then `npm run data:build`.
 * Answers are templates: every number is a {f:fact} or {c:context} slot, never typed in.
 * The first question in each language is the one shown on a chip.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const CHECKED = '2026-10-12';
interface Opt { models?: string[]; rivals?: string[]; route?: 'answer' | 'expert'; chip?: boolean }
const out: unknown[] = [];
function I(id: string, topic: string, o: Opt, en: string[], hi: string[], aEn: string, aHi: string) {
  out.push({ id, topic, ...o, route: o.route ?? 'answer', checked: CHECKED, q: { en, hi }, a: { en: aEn, hi: aHi } });
}

// ---- Same car: Grand Vitara and Hyryder ----
I('twin.same', 'twin', { models: ['gv'], rivals: ['hy'], chip: true },
  ['Is the Grand Vitara the same car as the Hyryder?', 'are grand vitara and hyryder the same', 'difference between grand vitara and hyryder', 'is hyryder just a rebadged grand vitara', 'same car as toyota hyryder'],
  ['क्या Grand Vitara और Hyryder एक ही गाड़ी हैं?', 'grand vitara aur hyryder same hai kya', 'Grand Vitara और Hyryder में क्या फ़र्क है', 'hyryder aur grand vitara me kya antar hai', 'क्या दोनों गाड़ियाँ एक जैसी हैं'],
  'Under the skin, yes. Both are built at {f:gv.built}, with the same {f:gv.alphaplus-sh.pt} and the same claimed {f:gv.alphaplus-sh.eff}. They differ in styling, trim names, price and the showroom you buy from.',
  'अंदर से, हाँ। दोनों {f:gv.built} में बनती हैं, दोनों में वही {f:gv.alphaplus-sh.pt} है और दावा की गई माइलेज भी वही {f:gv.alphaplus-sh.eff} है। फ़र्क डिज़ाइन, वेरिएंट के नाम, कीमत और शोरूम का है।');
I('warranty.toyota', 'twin', { models: ['gv'], rivals: ['hy'], chip: true },
  ['Is the Toyota warranty longer?', 'does hyryder have a longer warranty', 'toyota warranty vs maruti warranty', 'which has better warranty grand vitara or hyryder', 'warranty difference toyota maruti'],
  ['क्या Toyota की वारंटी ज़्यादा लंबी है?', 'toyota ki warranty zyada hai kya', 'Hyryder की वारंटी कितनी है', 'warranty me kya fark hai toyota maruti', 'किसकी वारंटी बेहतर है'],
  'No. The standard warranty on both is {f:msil.warranty}, and it has been identical since {f:warranty.parity.since}. Some AI assistants still quote an older gap, so it is worth checking the date on anything you read.',
  'नहीं। दोनों पर स्टैंडर्ड वारंटी {f:msil.warranty} है, और {f:warranty.parity.since} से एक जैसी है। कुछ AI असिस्टेंट अब भी पुराना फ़र्क बताते हैं, इसलिए जो भी पढ़ें उसकी तारीख देख लें।');
I('twin.resale', 'twin', { models: ['gv'], rivals: ['hy'] },
  ['Does the Hyryder hold its value better?', 'resale value grand vitara vs hyryder', 'which has better resale toyota or maruti', 'will toyota badge get better resale', 'used price hyryder vs grand vitara'],
  ['क्या Hyryder की रीसेल वैल्यू बेहतर है?', 'resale kiska accha hai hyryder ya grand vitara', 'Toyota बैज से रीसेल ज़्यादा मिलेगी क्या', 'purani gaadi ka daam kiska zyada', 'रीसेल में कौन आगे है'],
  'In our used-market sample of {f:resale.listings} NCR listings, the two sell at near parity: the Grand Vitara to Hyryder price ratio is {f:resale.ratio}. That is a small sample from one region, so treat it as a guide and not a promise.',
  'हमारे सैंपल में NCR की {f:resale.listings} पुरानी गाड़ियों की लिस्टिंग हैं, और दोनों लगभग बराबर दाम पर बिकती हैं: Grand Vitara और Hyryder का अनुपात {f:resale.ratio} है। सैंपल छोटा है और एक ही इलाके का है, इसलिए इसे अंदाज़ा मानें, वादा नहीं।');
I('twin.whybuy', 'twin', { models: ['gv'], rivals: ['hy'] },
  ['Why should I pick the Grand Vitara over the Hyryder?', 'grand vitara or hyryder which should i buy', 'which is better hyryder or grand vitara', 'why not just buy the toyota', 'should i buy the toyota instead'],
  ['Hyryder की जगह Grand Vitara क्यों लूँ?', 'grand vitara lu ya hyryder', 'कौन सी बेहतर है Hyryder या Grand Vitara', 'toyota hi kyu na le lu', 'दोनों में से कौन सी लेनी चाहिए'],
  'The cars are mechanically the same, so choose on what differs: the look you prefer, the price of the variant you want, and the showroom and service centre near you. Drive both if you can. If the Hyryder suits you better, that is a fair choice.',
  'दोनों गाड़ियाँ मशीनरी में एक जैसी हैं, तो फ़ैसला उन बातों पर करें जो अलग हैं: आपको कौन सा लुक पसंद है, आपके वेरिएंट की कीमत, और आपके पास का शोरूम और सर्विस सेंटर। हो सके तो दोनों चलाकर देखें। अगर Hyryder आपको ज़्यादा जँचे, तो वह भी ठीक फ़ैसला है।');

// ---- Fuel and mileage ----
I('fuel.monthly', 'fuel', { chip: true },
  ['What will fuel cost me each month?', 'monthly fuel cost', 'how much will i spend on petrol per month', 'fuel expense for my running', 'monthly running cost'],
  ['हर महीने ईंधन पर कितना खर्च होगा?', 'mahine ka petrol kharcha kitna', 'महीने का फ्यूल खर्च', 'meri running pe kitna kharcha aayega', 'हर महीने कितना पेट्रोल लगेगा'],
  'For the {c:pickName} at {c:km} km a month, about {c:monthly} at the claimed figure and today\'s Delhi fuel price. Real-world figures are usually lower than the claim, so expect to pay somewhat more. You can change the distance and fuel price on the Costs screen.',
  '{c:pickName} के लिए, महीने में {c:km} किमी पर, दावा की गई माइलेज और दिल्ली के आज के दाम से लगभग {c:monthly}। असल माइलेज अक्सर दावे से कम होती है, तो खर्च थोड़ा ज़्यादा मानकर चलें। "खर्च" स्क्रीन पर आप दूरी और दाम बदल सकते हैं।');
I('mileage.real', 'fuel', { models: ['gv'], chip: true },
  ['What mileage do owners actually get?', 'real world mileage', 'actual mileage of grand vitara hybrid', 'does it really give the claimed mileage', 'true mileage in city'],
  ['असल में मालिकों को कितनी माइलेज मिलती है?', 'real mileage kitna deti hai', 'Grand Vitara हाइब्रिड की असली माइलेज', 'kya sach me itna average deti hai', 'शहर में कितना एवरेज मिलता है'],
  'Less than the claim. For the Grand Vitara strong hybrid, owners in the reviews we coded commonly report {f:gv.sh.owner.low} to {f:gv.sh.owner.high}, against a claimed {f:gv.alphaplus-sh.eff}. For other models we do not have a checked owner figure yet.',
  'दावे से कम। Grand Vitara स्ट्रॉन्ग हाइब्रिड के लिए, जिन रिव्यू को हमने जाँचा उनमें मालिक आम तौर पर {f:gv.sh.owner.low} से {f:gv.sh.owner.high} बताते हैं, जबकि दावा {f:gv.alphaplus-sh.eff} का है। बाकी मॉडल के लिए हमारे पास अभी जाँचा हुआ आँकड़ा नहीं है।');
I('mileage.claimed', 'fuel', {},
  ['What is the claimed mileage?', 'arai mileage', 'company mileage figure', 'how many km per litre', 'average of this car'],
  ['कंपनी कितनी माइलेज का दावा करती है?', 'arai mileage kitna hai', 'कितना एवरेज देती है', 'ek litre me kitna chalti hai', 'माइलेज कितनी है'],
  'The claimed figure for the {c:pickName} is {c:pickEff}. That is a test-cycle number. Use it to compare cars, not to predict your own bills.',
  '{c:pickName} के लिए दावा {c:pickEff} का है। यह टेस्ट का आँकड़ा है। इसे गाड़ियों की तुलना के लिए इस्तेमाल करें, अपने असली खर्च का अंदाज़ा लगाने के लिए नहीं।');
I('fuel.per1000', 'fuel', {},
  ['What does it cost to run per thousand km?', 'running cost per km', 'cost per kilometre', 'fuel cost for 1000 km', 'per km kharcha'],
  ['हज़ार किमी चलाने का खर्च कितना है?', 'per km kitna kharcha', 'प्रति किलोमीटर खर्च', 'ek hazaar km ka kharcha', 'चलाने का खर्च कितना आता है'],
  'At today\'s Delhi fuel price and the claimed figure, the {c:pickName} costs about {c:per1000} in fuel for every {n:1000} km. Service and insurance are not in that number.',
  'दिल्ली के आज के दाम और दावा की गई माइलेज पर, {c:pickName} का ईंधन खर्च हर {n:1000} किमी पर लगभग {c:per1000} आता है। इसमें सर्विस और बीमा शामिल नहीं है।');
I('fuel.price.assumed', 'fuel', {},
  ['What fuel price are you using?', 'which petrol price did you assume', 'petrol rate used in calculation', 'cng price used', 'is the fuel price current'],
  ['आप ईंधन का कौन सा दाम मान रहे हैं?', 'petrol ka rate kya liya hai', 'CNG का कौन सा दाम लिया है', 'calculation me kaunsa rate hai', 'क्या दाम आज का है'],
  'Delhi prices: petrol at {f:fuel.petrol.delhi} and CNG at {f:fuel.cng.delhi}. Tap either number to see where it comes from and its date. You can type your own city\'s price on the Costs screen.',
  'दिल्ली के दाम: पेट्रोल {f:fuel.petrol.delhi} और CNG {f:fuel.cng.delhi}। किसी भी आँकड़े को छूकर देखें कि वह कहाँ से आया और किस तारीख का है। "खर्च" स्क्रीन पर आप अपने शहर का दाम डाल सकते हैं।');

// ---- Hybrid ----
I('hybrid.how', 'hybrid', { chip: true },
  ['How does the strong hybrid work?', 'what is a strong hybrid', 'how does hybrid work', 'strong hybrid vs mild hybrid', 'what does hybrid mean'],
  ['स्ट्रॉन्ग हाइब्रिड कैसे काम करता है?', 'strong hybrid kya hota hai', 'हाइब्रिड का मतलब क्या है', 'mild aur strong hybrid me fark', 'hybrid kaise chalta hai'],
  'A petrol engine and an electric motor share the work. The car can pull away and crawl in traffic on the motor alone, and it recharges its own battery while you drive and brake. That is where the claimed {f:gv.alphaplus-sh.eff} comes from.',
  'पेट्रोल इंजन और इलेक्ट्रिक मोटर मिलकर काम करते हैं। गाड़ी सिर्फ़ मोटर पर चल पड़ती है और ट्रैफ़िक में धीरे-धीरे चल सकती है, और चलते व ब्रेक लगाते समय अपनी बैटरी खुद चार्ज करती है। इसी से {f:gv.alphaplus-sh.eff} का दावा आता है।');
I('hybrid.plug', 'hybrid', {},
  ['Do I need to plug it in?', 'does the hybrid need charging', 'do i have to charge the hybrid', 'is there a charging cable', 'where do i charge the hybrid'],
  ['क्या इसे चार्जिंग पर लगाना पड़ता है?', 'hybrid ko charge karna padta hai kya', 'क्या हाइब्रिड को प्लग करना होता है', 'charging kaha karni hogi', 'क्या चार्जर चाहिए'],
  'No. A strong hybrid charges its own battery from the engine and from braking. You fill it with petrol like any other car and there is no cable.',
  'नहीं। स्ट्रॉन्ग हाइब्रिड अपनी बैटरी इंजन और ब्रेकिंग से खुद चार्ज करता है। इसमें बाकी गाड़ियों की तरह पेट्रोल भरवाइए, कोई केबल नहीं लगती।');
I('hybrid.battery', 'hybrid', { models: ['gv'] },
  ['What is the hybrid battery warranty?', 'battery warranty', 'how long does the hybrid battery last', 'battery replacement warranty', 'is the battery covered'],
  ['हाइब्रिड बैटरी की वारंटी कितनी है?', 'battery ki warranty kitni hai', 'बैटरी कितने साल चलेगी', 'battery kharab hui to', 'क्या बैटरी वारंटी में आती है'],
  'The Grand Vitara strong-hybrid battery is listed with a warranty of {f:gv.sh.battery.warranty}. What a replacement costs after that is not in our checked library, so I have not guessed.',
  'Grand Vitara स्ट्रॉन्ग हाइब्रिड की बैटरी पर {f:gv.sh.battery.warranty} की वारंटी दर्ज है। उसके बाद बदलने का खर्च हमारी जाँची हुई लाइब्रेरी में नहीं है, इसलिए मैंने अंदाज़ा नहीं लगाया।');
I('hybrid.range', 'hybrid', { models: ['gv', 'vic'] },
  ['How far can it go on one tank?', 'range on a full tank', 'how many km in one tank', 'tank range of hybrid', 'full tank distance'],
  ['एक टंकी में कितनी दूर जाएगी?', 'full tank me kitna chalegi', 'एक बार टंकी भरने पर रेंज', 'tank range kitni hai', 'फुल टैंक में कितने किमी'],
  'The claim is more than {f:hybrid.range} on a tank for the strong hybrid, from a {f:gv.tank} tank. On the road you will get less than the claim, as with any car.',
  'स्ट्रॉन्ग हाइब्रिड के लिए दावा एक टंकी में {f:hybrid.range} से ज़्यादा का है, और टंकी {f:gv.tank} की है। सड़क पर यह दावे से कम रहेगा, जैसा हर गाड़ी में होता है।');

// ---- Safety ----
I('crash.rating', 'safety', { chip: true },
  ['What is the crash-test rating?', 'safety rating', 'ncap rating', 'how many stars in crash test', 'is this car safe'],
  ['क्रैश टेस्ट रेटिंग क्या है?', 'safety rating kitni hai', 'NCAP में कितने स्टार मिले', 'kitne star hai crash test me', 'क्या यह गाड़ी सुरक्षित है'],
  'For the {c:pickName}: {c:pickCrash}. Where a car has not been tested we say so and do not borrow a rating from a sibling or an older model.',
  '{c:pickName} के लिए: {c:pickCrash}। जिस गाड़ी का टेस्ट नहीं हुआ, वहाँ हम यही बताते हैं, और किसी दूसरी या पुरानी गाड़ी की रेटिंग नहीं जोड़ते।');
I('adas', 'safety', {},
  ['Does it have ADAS?', 'driver assistance features', 'level 2 adas', 'adaptive cruise control', 'does it brake automatically'],
  ['क्या इसमें ADAS है?', 'adas hai kya isme', 'लेवल 2 ADAS मिलता है क्या', 'automatic braking hai kya', 'ड्राइवर असिस्ट फ़ीचर'],
  'On the {c:pickName}: {c:pickAdas}. In our range the Victoris and the e Vitara offer {f:vic.zxiplus-sh.adas} driver assistance, on selected variants for the Victoris.',
  '{c:pickName} में: {c:pickAdas}। हमारी रेंज में Victoris और e Vitara में {f:vic.zxiplus-sh.adas} ड्राइवर असिस्ट मिलता है, Victoris में चुनिंदा वेरिएंट पर।');
I('airbags', 'safety', {},
  ['How many airbags does it have?', 'number of airbags', 'airbags count', 'six airbags standard', 'are airbags standard'],
  ['इसमें कितने एयरबैग हैं?', 'airbag kitne hai', 'क्या एयरबैग स्टैंडर्ड हैं', 'kitne airbags milte hai', 'एयरबैग की संख्या'],
  'The {c:pickName} has {c:pickAirbags}. If you see a different count elsewhere, check which variant and which year it describes.',
  '{c:pickName} में {c:pickAirbags} हैं। अगर कहीं और अलग संख्या दिखे, तो देख लें कि वह किस वेरिएंट और किस साल की बात है।');
I('nexon.brezza.safety', 'safety', { models: ['brz'], rivals: ['nx'], chip: true },
  ['Is the Nexon safer than the Brezza?', 'nexon vs brezza safety', 'which is safer nexon or brezza', 'brezza safety rating vs nexon', 'tata is safer than maruti'],
  ['क्या Nexon, Brezza से ज़्यादा सुरक्षित है?', 'nexon ya brezza kaun safe hai', 'Brezza और Nexon की सेफ़्टी', 'tata zyada safe hai kya', 'सेफ़्टी में कौन आगे है'],
  'On the published tests they are level today. The Nexon has {f:nx.crash}; the Brezza now has {f:brz.crash}. Both have {f:nx.airbags} as standard. The Nexon earned its rating earlier, which is why it is better known for safety.',
  'छपे हुए टेस्ट में आज दोनों बराबर हैं। Nexon के पास {f:nx.crash} है; Brezza के पास अब {f:brz.crash} है। दोनों में {f:nx.airbags} स्टैंडर्ड हैं। Nexon को रेटिंग पहले मिली थी, इसीलिए सेफ़्टी के लिए उसका नाम ज़्यादा है।');
I('victoris.safety', 'safety', { models: ['vic'] },
  ['How safe is the Victoris?', 'victoris crash rating', 'victoris safety', 'victoris ncap stars', 'is victoris a five star car'],
  ['Victoris कितनी सुरक्षित है?', 'victoris ki safety rating', 'Victoris को कितने स्टार मिले', 'victoris safe hai kya', 'क्या Victoris फाइव स्टार है'],
  'The Victoris has {f:vic.crash}, with {f:vic.airbags} as standard. {f:vic.zxiplus-sh.adas} driver assistance is offered on selected variants.',
  'Victoris के पास {f:vic.crash} है, और {f:vic.airbags} स्टैंडर्ड हैं। {f:vic.zxiplus-sh.adas} ड्राइवर असिस्ट चुनिंदा वेरिएंट पर मिलता है।');

// ---- Practical ----
I('boot', 'practical', {},
  ['How big is the boot?', 'boot space', 'luggage space', 'how many bags fit', 'dickey space'],
  ['बूट कितना बड़ा है?', 'boot space kitna hai', 'डिक्की में कितनी जगह है', 'saman kitna aayega', 'लगेज स्पेस'],
  'The {c:pickName} is listed at {c:pickBoot}. On hybrid and CNG versions the battery or tank can take some of that, so open the boot on the car you plan to buy.',
  '{c:pickName} के लिए {c:pickBoot} दर्ज है। हाइब्रिड और CNG में बैटरी या टंकी कुछ जगह ले सकती है, इसलिए जो गाड़ी लेनी है उसका बूट खोलकर ज़रूर देखें।');
I('ground.clearance', 'practical', {},
  ['What is the ground clearance?', 'ground clearance', 'will it scrape on speed breakers', 'is it good for bad roads', 'how high is the car'],
  ['ग्राउंड क्लीयरेंस कितना है?', 'ground clearance kitna hai', 'खराब सड़क पर चलेगी क्या', 'speed breaker pe lagegi kya', 'गाड़ी कितनी ऊँची है'],
  'The {c:pickName} has a ground clearance of {c:pickGc}. That figure is measured without passengers or luggage.',
  '{c:pickName} का ग्राउंड क्लीयरेंस {c:pickGc} है। यह आँकड़ा खाली गाड़ी का होता है, बिना सवारी और सामान के।');
I('awd', 'practical', { chip: true },
  ['Can I get all-wheel drive?', 'is awd available', 'allgrip variants', 'four wheel drive option', 'which variant has awd'],
  ['क्या ऑल-व्हील ड्राइव मिलता है?', 'awd milta hai kya', 'ALLGRIP किस वेरिएंट में है', '4x4 option hai kya', 'फोर व्हील ड्राइव'],
  'Yes. The Grand Vitara offers it on the {f:gv.alpha-awd.pt} at {f:gv.alpha-awd.price}, and the Victoris on the {f:vic.zxiplus-awd.pt} at {f:vic.zxiplus-awd.price}. The Jimny has four-wheel drive on every variant. All-wheel drive is not offered with the strong hybrid.',
  'हाँ। Grand Vitara में यह {f:gv.alpha-awd.pt} पर {f:gv.alpha-awd.price} में मिलता है, और Victoris में {f:vic.zxiplus-awd.pt} पर {f:vic.zxiplus-awd.price} में। Jimny के हर वेरिएंट में फोर-व्हील ड्राइव है। स्ट्रॉन्ग हाइब्रिड के साथ ऑल-व्हील ड्राइव नहीं मिलता।');
I('cng.option', 'practical', { chip: true },
  ['Is there a CNG option?', 'cng variant available', 'which suv comes in cng', 'cng mileage', 'factory fitted cng'],
  ['क्या CNG का विकल्प है?', 'cng me milti hai kya', 'कौन सी SUV CNG में आती है', 'cng ka average kitna', 'कंपनी फिटेड CNG'],
  'Yes, on four of our SUVs. Claimed figures: Fronx {f:frx.delta-cng.eff}, Victoris {f:vic.vxi-cng.eff}, Brezza {f:brz.lxi-cng.eff} and Grand Vitara {f:gv.delta-cng.eff}. CNG versions make less power than petrol and come with a manual gearbox.',
  'हाँ, हमारी चार SUV में। दावा की गई माइलेज: Fronx {f:frx.delta-cng.eff}, Victoris {f:vic.vxi-cng.eff}, Brezza {f:brz.lxi-cng.eff} और Grand Vitara {f:gv.delta-cng.eff}। CNG में पावर पेट्रोल से कम होती है और गियरबॉक्स मैनुअल मिलता है।');
I('cng.boot', 'practical', { models: ['vic', 'brz'] },
  ['Does the CNG tank eat the boot?', 'boot space in cng', 'where is the cng cylinder', 'underbody cng tank', 'cng cylinder in boot'],
  ['क्या CNG टंकी बूट की जगह घेर लेती है?', 'cng me boot space bachta hai kya', 'CNG सिलेंडर कहाँ लगा है', 'cylinder dickey me hai kya', 'CNG में डिक्की मिलती है क्या'],
  'On the Victoris and the new Brezza the tank sits under the floor, so the boot stays usable: {f:vic.vxi-cng.pt}. We do not yet have a checked boot figure in litres for those versions, so look at the car itself.',
  'Victoris और नई Brezza में टंकी फ़र्श के नीचे लगी है, इसलिए बूट काम का रहता है: {f:vic.vxi-cng.pt}। इन वेरिएंट का लीटर में जाँचा हुआ आँकड़ा अभी हमारे पास नहीं है, इसलिए गाड़ी खुद देख लें।');
I('seats.seven', 'practical', {},
  ['Do you have a seven-seater?', 'seven seater suv', 'car for a big family', 'three rows of seats', 'six seater option'],
  ['क्या सात सीट वाली गाड़ी है?', 'saat seater gaadi hai kya', 'बड़े परिवार के लिए गाड़ी', 'teen row wali gaadi', 'छह सीटर का विकल्प'],
  'None of our SUVs seats more than five. For more seats, look at our people-carriers: the Ertiga with {f:mpv.ertiga.seats} at Arena and the XL6 with {f:mpv.xl6.seats} at NEXA. Your product expert can show you both.',
  'हमारी किसी SUV में पाँच से ज़्यादा सीटें नहीं हैं। ज़्यादा सीटों के लिए हमारी बड़ी गाड़ियाँ देखें: Arena पर Ertiga, जिसमें {f:mpv.ertiga.seats} हैं, और NEXA पर XL6, जिसमें {f:mpv.xl6.seats} हैं। आपके प्रोडक्ट एक्सपर्ट दोनों दिखा सकते हैं।');
I('transmission.auto', 'practical', {},
  ['Is there an automatic?', 'automatic variant', 'which gearbox does it have', 'automatic price', 'manual or automatic'],
  ['क्या ऑटोमैटिक मिलती है?', 'automatic me aati hai kya', 'कौन सा गियरबॉक्स है', 'automatic ka daam', 'मैनुअल या ऑटोमैटिक'],
  'The {c:pickName} has this set-up: {c:pickPowertrain}. Every SUV in our range has at least one automatic. On the Compare screen you can switch variant to see its price.',
  '{c:pickName} में यह सेट-अप है: {c:pickPowertrain}। हमारी हर SUV में कम से कम एक ऑटोमैटिक वेरिएंट है। "तुलना" स्क्रीन पर वेरिएंट बदलकर उसकी कीमत देख सकते हैं।');
I('diesel', 'practical', {},
  ['Do you have a diesel?', 'diesel variant', 'is there a diesel engine', 'diesel suv from maruti', 'diesel option'],
  ['क्या डीज़ल मिलती है?', 'diesel me aati hai kya', 'डीज़ल इंजन का विकल्प', 'maruti ki diesel suv', 'डीज़ल वेरिएंट'],
  'No. Maruti Suzuki does not sell a diesel SUV. The Creta and the Seltos do, and if you drive long highway distances a diesel is worth comparing: the Creta diesel automatic claims {f:cr.king-d-at.eff}. Our answer for high running is the strong hybrid or CNG.',
  'नहीं। Maruti Suzuki डीज़ल SUV नहीं बेचती। Creta और Seltos में डीज़ल मिलता है, और अगर आप हाईवे पर लंबी दूरी चलाते हैं तो डीज़ल से तुलना करना ठीक रहेगा: Creta डीज़ल ऑटोमैटिक का दावा {f:cr.king-d-at.eff} है। ज़्यादा चलाने वालों के लिए हमारे पास स्ट्रॉन्ग हाइब्रिड या CNG है।');

// ---- Ownership and the programme ----
I('resale', 'ownership', {},
  ['What will it be worth when I sell?', 'resale value', 'how much will i get after three years', 'depreciation', 'does maruti hold value'],
  ['बेचते समय कितनी कीमत मिलेगी?', 'resale value kitni milegi', 'तीन साल बाद कितने में बिकेगी', 'gaadi ka daam kitna girega', 'रीसेल कैसी है'],
  'Our used-market model puts a Grand Vitara at about {f:resale.residual} of today\'s ex-showroom price after {f:prog.promise.years} or {f:prog.promise.km}. That is an estimate from a regional sample, not a guarantee. The proposed Promise is the guaranteed part: {f:prog.promise.pct}.',
  'हमारे पुरानी गाड़ियों के मॉडल के हिसाब से, {f:prog.promise.years} या {f:prog.promise.km} के बाद Grand Vitara की कीमत आज की एक्स-शोरूम कीमत का लगभग {f:resale.residual} रहती है। यह एक इलाके के सैंपल का अंदाज़ा है, गारंटी नहीं। गारंटी वाला हिस्सा प्रस्तावित Promise है: {f:prog.promise.pct}।');
I('promise.what', 'programme', { chip: true },
  ['What is the Higher Ground Promise?', 'what is the buyback promise', 'guaranteed buyback', 'assured buyback scheme', 'explain the promise'],
  ['Higher Ground Promise क्या है?', 'buyback promise kya hai', 'गारंटीड बायबैक क्या होता है', 'assured buyback scheme', 'Promise समझाइए'],
  'It is a proposal now in pilot design: a guaranteed buyback at {f:prog.promise.pct} of the net ex-showroom price, at {f:prog.promise.years} or {f:prog.promise.km}, backed by an insurer. It copies terms Maruti Suzuki already offers on the e Vitara.',
  'यह एक प्रस्ताव है, जिसका पायलट तैयार हो रहा है: {f:prog.promise.years} या {f:prog.promise.km} पर, नेट एक्स-शोरूम कीमत के {f:prog.promise.pct} पर गारंटीड बायबैक, जिसके पीछे बीमा कंपनी होगी। यह वही शर्तें हैं जो Maruti Suzuki पहले से e Vitara पर देती है।');
I('promise.catch', 'programme', {},
  ['What is the catch with the Promise?', 'conditions on buyback', 'buyback terms and conditions', 'hidden conditions', 'when does the promise not apply'],
  ['Promise में शर्तें क्या हैं?', 'buyback ki shartein kya hai', 'इसमें कोई पेच तो नहीं', 'promise kab lagu nahi hoga', 'बायबैक के नियम'],
  'Three things to know. It is a proposal, not yet on sale. The distance limit is {f:prog.promise.km}, and condition terms would apply as with any buyback. And on the e Vitara the matching scheme is paid for, so ask your product expert how the pilot is priced.',
  'तीन बातें जान लें। यह प्रस्ताव है, अभी बिक्री में नहीं है। दूरी की सीमा {f:prog.promise.km} है, और हर बायबैक की तरह गाड़ी की हालत की शर्तें लागू होंगी। और e Vitara पर ऐसी स्कीम के पैसे लगते हैं, तो अपने प्रोडक्ट एक्सपर्ट से पूछें कि पायलट में इसका दाम क्या है।');
I('promise.safetynet', 'programme', {},
  ['Is sixty percent a good number?', 'why only sixty percent buyback', 'is the buyback value low', 'will i get more than the guaranteed value', 'is buyback worth it'],
  ['क्या साठ प्रतिशत ठीक है?', 'buyback value kam nahi hai kya', 'सिर्फ़ साठ प्रतिशत ही क्यों', 'guarantee se zyada milega kya', 'बायबैक लेना ठीक है क्या'],
  'Think of it as a floor, not a forecast. Our used-market model expects about {f:resale.residual}, so in a normal market you would sell for more than the guaranteed {f:prog.promise.pct}. The Promise matters in the case where the market turns against you.',
  'इसे अंदाज़ा नहीं, न्यूनतम सीमा समझिए। हमारा मॉडल लगभग {f:resale.residual} की उम्मीद करता है, यानी आम बाज़ार में आपको गारंटी वाले {f:prog.promise.pct} से ज़्यादा मिलेगा। Promise तब काम आता है जब बाज़ार आपके खिलाफ़ चला जाए।');
I('pledge.what', 'programme', { chip: true },
  ['What is the Service Pledge?', 'service promise', 'what if the repair is not fixed', 'loaner car', 'courtesy car during repair'],
  ['Service Pledge क्या है?', 'service pledge kya hai', 'अगर रिपेयर ठीक न हो तो', 'loaner car milegi kya', 'सर्विस के दौरान दूसरी गाड़ी'],
  'A proposal in pilot design: your car is fixed the first time, or you get a loaner car within {f:prog.pledge.hours} when a repeat repair is needed. The outlet can decide goodwill on the spot without sending it up the line.',
  'यह प्रस्ताव है, जिसका पायलट तैयार हो रहा है: आपकी गाड़ी पहली बार में ठीक होगी, और अगर दोबारा रिपेयर की ज़रूरत पड़ी तो {f:prog.pledge.hours} के अंदर लोनर कार मिलेगी। गुडविल का फ़ैसला आउटलेट वहीं कर सकता है, ऊपर भेजे बिना।');
I('pledge.why', 'programme', {},
  ['Why should I trust Maruti service?', 'is maruti service good', 'service quality complaints', 'service experience', 'how will service get better'],
  ['Maruti की सर्विस पर भरोसा क्यों करूँ?', 'maruti service kaisi hai', 'सर्विस की शिकायतें', 'service acchi hogi kya', 'सर्विस कैसे सुधरेगी'],
  'Owners told us service is where loyalty breaks, so we will not claim it is perfect. The network is large, with more than {f:service.touchpoints} touchpoints. The Pledge is how we intend to fix the weak spot, and outlets would be scored on keeping it.',
  'मालिकों ने हमें बताया कि भरोसा सर्विस पर ही टूटता है, इसलिए हम इसे बेदाग नहीं कहेंगे। नेटवर्क बड़ा है, {f:service.touchpoints} से ज़्यादा टचपॉइंट। Pledge इसी कमज़ोरी को ठीक करने का तरीका है, और आउटलेट का स्कोर इसे निभाने पर तय होगा।');
I('weekend.what', 'programme', { chip: true },
  ['What is Weekend Ownership?', 'long test drive', 'can i take the car home', 'two day test drive', 'test drive for a weekend'],
  ['Weekend Ownership क्या है?', 'weekend ownership kya hai', 'क्या गाड़ी घर ले जा सकता हूँ', 'lambi test drive milegi kya', 'दो दिन की टेस्ट ड्राइव'],
  'A proposal in pilot design: you keep the car for {f:prog.weekend.hours} instead of a {f:prog.weekend.loop} loop, long enough for a highway run and your own parking. It is the fairest way to judge a hybrid.',
  'यह प्रस्ताव है, जिसका पायलट तैयार हो रहा है: {f:prog.weekend.loop} के चक्कर की जगह गाड़ी {f:prog.weekend.hours} आपके पास रहती है, ताकि आप हाईवे पर चला सकें और अपनी पार्किंग में लगाकर देख सकें। हाइब्रिड को परखने का यही सबसे सही तरीका है।');
I('weekend.cost', 'programme', { route: 'expert' },
  ['Does Weekend Ownership cost anything?', 'is the weekend drive free', 'deposit for weekend ownership', 'charges for long test drive', 'who pays for fuel on the weekend drive'],
  ['Weekend Ownership के पैसे लगते हैं क्या?', 'weekend drive free hai kya', 'इसके लिए डिपॉज़िट देना होगा क्या', 'test drive ka charge', 'पेट्रोल का खर्च कौन देगा'],
  'The pilot terms on deposit and fuel are not settled, so I do not have a checked answer. I have added this to the questions for your product expert.',
  'डिपॉज़िट और पेट्रोल की पायलट शर्तें अभी तय नहीं हैं, इसलिए मेरे पास जाँचा हुआ जवाब नहीं है। मैंने यह सवाल आपके प्रोडक्ट एक्सपर्ट के लिए जोड़ दिया है।');
I('service.network', 'ownership', {},
  ['How many service centres are there?', 'service network', 'is there a service centre near me', 'how big is the service network', 'service in small towns'],
  ['कितने सर्विस सेंटर हैं?', 'service center kitne hai', 'मेरे पास सर्विस सेंटर है क्या', 'chhote sheher me service', 'सर्विस नेटवर्क कितना बड़ा है'],
  'Maruti Suzuki has more than {f:service.touchpoints} service touchpoints. I cannot see your location from here, so your product expert will point you to the nearest one.',
  'Maruti Suzuki के {f:service.touchpoints} से ज़्यादा सर्विस टचपॉइंट हैं। यहाँ से मुझे आपकी जगह नहीं दिखती, तो आपके प्रोडक्ट एक्सपर्ट सबसे नज़दीकी सेंटर बता देंगे।');
I('warranty.standard', 'ownership', {},
  ['What is the standard warranty?', 'warranty period', 'how many years warranty', 'warranty coverage', 'what does the warranty cover'],
  ['स्टैंडर्ड वारंटी कितनी है?', 'warranty kitne saal ki hai', 'वारंटी में क्या आता है', 'kitne km ki warranty', 'वारंटी की अवधि'],
  'For the {c:pickName}: {c:pickWarranty}. Extended warranty exists, but its price is for your product expert to quote in writing.',
  '{c:pickName} के लिए: {c:pickWarranty}। एक्सटेंडेड वारंटी भी मिलती है, पर उसका दाम आपके प्रोडक्ट एक्सपर्ट लिखकर बताएँगे।');

// ---- Price ----
I('price.offers', 'price', { route: 'expert', chip: true },
  ['Why can\'t you tell me the on-road price or offers?', 'what is the on road price', 'any discount', 'what offers are running', 'best price you can give'],
  ['आप ऑन-रोड कीमत या ऑफ़र क्यों नहीं बता सकते?', 'on road price kitna hai', 'कितना डिस्काउंट मिलेगा', 'koi offer chal raha hai kya', 'सबसे कम दाम क्या है'],
  'Prices and offers are set by your dealer, not by Maruti Suzuki, so this screen shows ex-showroom prices only. Your product expert will give you a written quote. I have added your question to their list.',
  'कीमत और ऑफ़र आपका डीलर तय करता है, Maruti Suzuki नहीं, इसलिए यह स्क्रीन सिर्फ़ एक्स-शोरूम कीमत दिखाती है। आपके प्रोडक्ट एक्सपर्ट आपको लिखित कोटेशन देंगे। मैंने आपका सवाल उनकी सूची में जोड़ दिया है।');
I('price.exshowroom', 'price', {},
  ['What is the ex-showroom price?', 'price of this car', 'how much does it cost', 'starting price', 'what is the price'],
  ['एक्स-शोरूम कीमत क्या है?', 'gaadi ka daam kitna hai', 'यह कितने की है', 'starting price kya hai', 'कीमत बताइए'],
  'The {c:pickName} is {c:pickPrice}, ex-showroom in New Delhi. Registration, insurance and the dealer\'s own pricing come on top, and your product expert will put those in a written quote.',
  '{c:pickName} की नई दिल्ली में एक्स-शोरूम कीमत {c:pickPrice} है। रजिस्ट्रेशन, बीमा और डीलर की अपनी कीमत इसके ऊपर आती है, जो आपके प्रोडक्ट एक्सपर्ट लिखित कोटेशन में देंगे।');

// ---- Rivals ----
I('seltos.vs.gv', 'rival', { rivals: ['sel'], chip: true },
  ['How does it compare with the Seltos?', 'seltos vs grand vitara', 'is seltos better', 'kia seltos comparison', 'grand vitara or seltos'],
  ['Seltos से तुलना में कैसी है?', 'seltos ya grand vitara', 'क्या Seltos बेहतर है', 'kia seltos se comparison', 'Seltos और Grand Vitara में कौन'],
  'The Seltos is ahead where it has a published result we lack: {f:sel.crash}, and it offers a turbo petrol with {f:sel.gtxa-turbo.power} and a diesel. The Grand Vitara strong hybrid is ahead on claimed efficiency, {f:gv.alphaplus-sh.eff}. The Compare screen puts them side by side.',
  'Seltos वहाँ आगे है जहाँ उसके पास छपा हुआ नतीजा है और हमारे पास नहीं: {f:sel.crash}, और उसमें {f:sel.gtxa-turbo.power} वाला टर्बो पेट्रोल और डीज़ल भी मिलता है। Grand Vitara स्ट्रॉन्ग हाइब्रिड दावा की गई माइलेज में आगे है, {f:gv.alphaplus-sh.eff}। "तुलना" स्क्रीन पर दोनों साथ-साथ दिखती हैं।');
I('creta.vs.gv', 'rival', { rivals: ['cr'], chip: true },
  ['How does it compare with the Creta?', 'creta vs grand vitara', 'is creta better', 'hyundai creta comparison', 'grand vitara or creta'],
  ['Creta से तुलना में कैसी है?', 'creta ya grand vitara', 'क्या Creta बेहतर है', 'hyundai creta se comparison', 'Creta और Grand Vitara में कौन'],
  'The Creta offers more engines, including a turbo petrol with {f:cr.king-turbo.power} and a diesel, a bigger boot at {f:cr.boot}, and a warranty of {f:cr.warranty}. The Grand Vitara strong hybrid claims {f:gv.alphaplus-sh.eff} against {f:cr.king-ivt.eff} for the Creta petrol automatic.',
  'Creta में ज़्यादा इंजन मिलते हैं, जिनमें {f:cr.king-turbo.power} वाला टर्बो पेट्रोल और डीज़ल शामिल हैं, बूट बड़ा है, {f:cr.boot}, और वारंटी {f:cr.warranty} है। Grand Vitara स्ट्रॉन्ग हाइब्रिड का दावा {f:gv.alphaplus-sh.eff} है, जबकि Creta पेट्रोल ऑटोमैटिक का {f:cr.king-ivt.eff}।');
I('victoris.vs.gv', 'range', { models: ['gv', 'vic'], chip: true },
  ['Victoris or Grand Vitara: what is the difference?', 'victoris vs grand vitara', 'which is better victoris or grand vitara', 'difference between victoris and grand vitara', 'should i buy victoris instead'],
  ['Victoris और Grand Vitara में क्या फ़र्क है?', 'victoris ya grand vitara', 'कौन सी बेहतर है Victoris या Grand Vitara', 'dono me kya antar hai', 'Victoris ले लूँ क्या'],
  'They share engines. The Victoris has {f:vic.crash} and offers {f:vic.zxiplus-sh.adas} driver assistance; the Grand Vitara has {f:gv.crash}. The Victoris is sold at Arena and the Grand Vitara at NEXA. You can book a drive in either from this screen, and this showroom is credited either way.',
  'दोनों में इंजन एक जैसे हैं। Victoris के पास {f:vic.crash} है और {f:vic.zxiplus-sh.adas} ड्राइवर असिस्ट मिलता है; Grand Vitara के लिए {f:gv.crash}। Victoris Arena पर बिकती है और Grand Vitara NEXA पर। इसी स्क्रीन से दोनों की ड्राइव बुक हो सकती है, और दोनों सूरतों में क्रेडिट इसी शोरूम को मिलता है।');
I('channel.which', 'range', {},
  ['Which showroom sells which SUV?', 'nexa or arena', 'where can i buy victoris', 'which cars are at nexa', 'difference between nexa and arena'],
  ['कौन सी SUV किस शोरूम में मिलती है?', 'nexa aur arena me kya fark hai', 'Victoris कहाँ मिलेगी', 'nexa me kaunsi gaadi milti hai', 'कौन सी गाड़ी कहाँ बिकती है'],
  'NEXA sells the Grand Vitara, e Vitara, Fronx and Jimny. Arena sells the Victoris and Brezza. This screen compares all of them, wherever you are standing.',
  'NEXA पर Grand Vitara, e Vitara, Fronx और Jimny मिलती हैं। Arena पर Victoris और Brezza। आप जहाँ भी खड़े हों, यह स्क्रीन इन सबकी तुलना दिखाती है।');
I('dualcredit', 'range', {},
  ['Why are you suggesting a car this showroom does not sell?', 'why recommend arena car at nexa', 'why are you sending me to another showroom', 'what is dual credit', 'does this showroom lose the sale'],
  ['आप ऐसी गाड़ी क्यों सुझा रहे हैं जो यह शोरूम नहीं बेचता?', 'dusre showroom ki gaadi kyu bata rahe ho', 'ड्यूल क्रेडिट क्या है', 'nexa me arena ki gaadi kyu', 'क्या इस शोरूम का नुकसान नहीं होगा'],
  'Because it fits what you told us. Under the proposed dual credit, this showroom is credited when it refers you to a model sold in the other channel, so nobody here loses by giving you the right answer.',
  'क्योंकि आपने जो बताया, उसके हिसाब से वही ठीक बैठती है। प्रस्तावित ड्यूल क्रेडिट में, जब यह शोरूम आपको दूसरे चैनल की गाड़ी के लिए भेजता है, तब भी इसे क्रेडिट मिलता है। इसलिए आपको सही जवाब देने से यहाँ किसी का नुकसान नहीं होता।');

// ---- EV ----
I('ev.range', 'ev', { models: ['ev'] },
  ['What is the e Vitara range?', 'e vitara range', 'how far does the electric go', 'ev range on full charge', 'electric car range'],
  ['e Vitara की रेंज कितनी है?', 'e vitara kitna chalti hai', 'इलेक्ट्रिक गाड़ी की रेंज', 'full charge me kitna chalegi', 'EV की रेंज'],
  'Claimed range is {f:ev.delta.range} with the smaller battery and {f:ev.zeta.range} with the larger one. Those are test figures. Real range falls with speed, load and air-conditioning.',
  'दावा की गई रेंज छोटी बैटरी पर {f:ev.delta.range} और बड़ी बैटरी पर {f:ev.zeta.range} है। ये टेस्ट के आँकड़े हैं। असल रेंज रफ़्तार, वज़न और एसी के साथ घटती है।');
I('ev.charging', 'ev', { models: ['ev'], route: 'expert' },
  ['How long does the e Vitara take to charge?', 'charging time', 'fast charging speed', 'home charger for e vitara', 'how do i charge the electric car'],
  ['e Vitara चार्ज होने में कितना समय लेती है?', 'charging me kitna time lagta hai', 'फास्ट चार्जिंग कितनी तेज़ है', 'ghar pe charger lagega kya', 'इलेक्ट्रिक गाड़ी कैसे चार्ज करें'],
  'The sources we checked disagree on charging speed, so I do not have a checked answer. I have added this to the questions for your product expert.',
  'हमने जो स्रोत देखे, उनमें चार्जिंग की रफ़्तार अलग-अलग लिखी है, इसलिए मेरे पास जाँचा हुआ जवाब नहीं है। मैंने यह सवाल आपके प्रोडक्ट एक्सपर्ट के लिए जोड़ दिया है।');
I('ev.buyback', 'ev', { models: ['ev'] },
  ['Is there a buyback on the e Vitara?', 'e vitara assured buyback', 'ev resale guarantee', 'buyback for electric car', 'what if ev resale is low'],
  ['क्या e Vitara पर बायबैक है?', 'e vitara ka buyback', 'EV की रीसेल की गारंटी', 'electric gaadi ka buyback', 'EV की रीसेल कम हुई तो'],
  'Yes, and it already exists. Maruti Suzuki offers an assured buyback on the e Vitara of {f:ev.buyback.pct3} at {f:prog.promise.years} or {f:prog.promise.km}, and {f:ev.buyback.pct4} at {f:ev.buyback.years4} or {f:ev.buyback.km4}. It is a paid scheme through an insurer.',
  'हाँ, और यह पहले से मौजूद है। Maruti Suzuki, e Vitara पर एश्योर्ड बायबैक देती है: {f:prog.promise.years} या {f:prog.promise.km} पर {f:ev.buyback.pct3}, और {f:ev.buyback.years4} या {f:ev.buyback.km4} पर {f:ev.buyback.pct4}। यह बीमा कंपनी के ज़रिए पैसे देकर मिलने वाली स्कीम है।');

// ---- Other models ----
I('jimny.4wd', 'range', { models: ['jim'] },
  ['Is the Jimny a proper off-roader?', 'jimny four wheel drive', 'jimny for off road', 'jimny mileage', 'can jimny go off road'],
  ['क्या Jimny सच में ऑफ-रोडर है?', 'jimny off road ke liye kaisi hai', 'Jimny में फोर व्हील ड्राइव है क्या', 'jimny ka average', 'Jimny कच्चे रास्ते पर चलेगी क्या'],
  'It has four-wheel drive on every variant, {f:jim.zeta.pt}, with a ground clearance of {f:jim.gc}. The trade-offs are {f:jim.zeta.eff} claimed, four seats and a small boot.',
  'इसके हर वेरिएंट में फोर-व्हील ड्राइव है, {f:jim.zeta.pt}, और ग्राउंड क्लीयरेंस {f:jim.gc} है। बदले में दावा की गई माइलेज {f:jim.zeta.eff} है, सीटें चार हैं और बूट छोटा है।');
I('fronx.cng', 'range', { models: ['frx'], chip: true },
  ['What does the Fronx CNG cost to run?', 'fronx cng mileage', 'fronx cng running cost', 'fronx cng price', 'is fronx cng worth it'],
  ['Fronx CNG चलाने में कितना खर्च आता है?', 'fronx cng ka average', 'Fronx CNG की कीमत', 'fronx cng lena sahi hai kya', 'Fronx CNG का खर्च'],
  'The Fronx Delta CNG is {f:frx.delta-cng.price} ex-showroom and claims {f:frx.delta-cng.eff}. It makes {f:frx.delta-cng.power}, less than the petrol, and is manual only. The Costs screen shows what that means each month.',
  'Fronx Delta CNG की एक्स-शोरूम कीमत {f:frx.delta-cng.price} है और दावा {f:frx.delta-cng.eff} का है। इसकी पावर {f:frx.delta-cng.power} है, जो पेट्रोल से कम है, और गियरबॉक्स सिर्फ़ मैनुअल है। "खर्च" स्क्रीन पर महीने का हिसाब दिखेगा।');
I('brezza.new', 'range', { models: ['brz'] },
  ['What is new on the Brezza?', 'new brezza engine', 'brezza turbo', 'brezza facelift changes', 'brezza latest model'],
  ['Brezza में नया क्या है?', 'nayi brezza me kya badla', 'Brezza टर्बो इंजन', 'brezza ka naya model', 'Brezza फेसलिफ्ट'],
  'The current Brezza adds a turbo petrol, {f:brz.lxi-turbo.pt}, with {f:brz.lxi-turbo.power}, and it now holds {f:brz.crash}. Prices start at {f:brz.lxi-turbo.price} ex-showroom.',
  'मौजूदा Brezza में टर्बो पेट्रोल जुड़ा है, {f:brz.lxi-turbo.pt}, जिसकी पावर {f:brz.lxi-turbo.power} है, और अब इसके पास {f:brz.crash} है। एक्स-शोरूम कीमत {f:brz.lxi-turbo.price} से शुरू होती है।');

// ---- Data and the kiosk itself ----
I('data.what', 'privacy', { chip: true },
  ['What happens to my data?', 'do you store my information', 'is my data saved', 'privacy', 'who can see what i did here'],
  ['मेरे डेटा का क्या होता है?', 'mera data save hota hai kya', 'क्या मेरी जानकारी रखी जाती है', 'privacy ka kya', 'यहाँ जो किया वह कौन देखेगा'],
  'Nothing is stored unless you choose to send it to your phone or book a drive. The QR code carries your comparison and no personal details. If you do share a number, it is kept for {f:prog.retention.days} and you can delete it at any time from the page on your phone.',
  'जब तक आप खुद इसे अपने फ़ोन पर न भेजें या ड्राइव बुक न करें, कुछ भी सेव नहीं होता। QR कोड में सिर्फ़ आपकी तुलना होती है, कोई निजी जानकारी नहीं। अगर आप नंबर देते हैं, तो वह {f:prog.retention.days} तक रखा जाता है और आप फ़ोन वाले पेज से उसे कभी भी मिटा सकते हैं।');
I('data.delete', 'privacy', {},
  ['How do I delete my data?', 'delete my number', 'remove my information', 'withdraw consent', 'stop messages'],
  ['मैं अपना डेटा कैसे मिटाऊँ?', 'mera number delete karo', 'अपनी जानकारी हटानी है', 'consent wapas lena hai', 'मैसेज बंद करने हैं'],
  'On the page that opens on your phone, tap Delete my data now. You can also reply STOP to any message. This screen clears itself when you finish or walk away.',
  'आपके फ़ोन पर जो पेज खुलता है, उस पर "मेरा डेटा अभी मिटाएँ" दबाएँ। आप किसी भी मैसेज का जवाब STOP लिखकर भी दे सकते हैं। आपके जाने या काम पूरा करने पर यह स्क्रीन अपने आप साफ़ हो जाती है।');
I('data.phone', 'privacy', {},
  ['Who sees my phone number?', 'will salesmen call me', 'is my number shared', 'does the dealer get my number', 'will i get spam calls'],
  ['मेरा फ़ोन नंबर कौन देखता है?', 'salesman call karega kya', 'क्या मेरा नंबर शेयर होगा', 'dealer ko number milega kya', 'कॉल तो नहीं आएँगे'],
  'The product expert sees your comparison and questions but not your number, until you book a drive. Sharing a number is optional, and the QR code needs none.',
  'प्रोडक्ट एक्सपर्ट को आपकी तुलना और सवाल दिखते हैं, पर नंबर नहीं, जब तक आप ड्राइव बुक न करें। नंबर देना आपकी मर्ज़ी है, और QR कोड के लिए नंबर की ज़रूरत ही नहीं।');
I('kiosk.who', 'meta', {},
  ['Who is answering these questions?', 'is this a chatbot', 'are you a robot', 'is this ai', 'who wrote these answers'],
  ['इन सवालों के जवाब कौन दे रहा है?', 'ye chatbot hai kya', 'क्या यह रोबोट है', 'ye jawab kisne likhe', 'क्या यह AI है'],
  'Answers come from a fact-checked library. If a question is not in it, the screen says so and passes it to a product expert. It does not make up an answer.',
  'जवाब एक जाँची हुई लाइब्रेरी से आते हैं। अगर कोई सवाल उसमें नहीं है, तो स्क्रीन यही बताती है और उसे प्रोडक्ट एक्सपर्ट को भेज देती है। यह अपनी तरफ़ से जवाब नहीं बनाती।');
I('sources', 'meta', {},
  ['Where do these numbers come from?', 'what is your source', 'how do i know this is true', 'are these figures correct', 'show me the sources'],
  ['ये आँकड़े कहाँ से आए हैं?', 'source kya hai', 'कैसे मानूँ कि यह सही है', 'ye numbers sahi hai kya', 'स्रोत दिखाइए'],
  'Tap any number on this screen to see its source and the date we checked it. The Sources button lists every fact on the page. Where we could not confirm a figure, you will see a Verify tag and no number.',
  'इस स्क्रीन पर किसी भी आँकड़े को छूकर उसका स्रोत और जाँच की तारीख देखें। "स्रोत" बटन पेज के सारे तथ्य दिखाता है। जिस आँकड़े की पुष्टि नहीं हो सकी, वहाँ संख्या की जगह "जाँचना है" का टैग दिखेगा।');
I('drive.book', 'programme', {},
  ['How do I book a test drive?', 'book test drive', 'i want to drive the car', 'schedule a drive', 'can i drive it today'],
  ['टेस्ट ड्राइव कैसे बुक करूँ?', 'test drive book karni hai', 'गाड़ी चलाकर देखनी है', 'drive kab mil sakti hai', 'क्या आज चला सकता हूँ'],
  'Tap Take it with you, then Book Weekend Ownership, and pick a slot. For a short drive today, tap Talk to a product expert now.',
  '"साथ ले जाएँ" दबाएँ, फिर "Weekend Ownership बुक करें", और समय चुनें। आज ही छोटी ड्राइव के लिए "अभी प्रोडक्ट एक्सपर्ट से बात करें" दबाएँ।');
I('delivery', 'ownership', { route: 'expert' },
  ['How long is the waiting period?', 'delivery time', 'when will i get the car', 'waiting period for hybrid', 'is the car in stock'],
  ['वेटिंग पीरियड कितना है?', 'delivery kab milegi', 'गाड़ी कब तक मिलेगी', 'stock me hai kya', 'हाइब्रिड की वेटिंग'],
  'Waiting times change by outlet and colour, so I do not have a checked answer. I have added this to the questions for your product expert.',
  'वेटिंग हर आउटलेट और रंग के हिसाब से बदलती है, इसलिए मेरे पास जाँचा हुआ जवाब नहीं है। मैंने यह सवाल आपके प्रोडक्ट एक्सपर्ट के लिए जोड़ दिया है।');

// ---- Guardrails ----
I('guard.unlaunched', 'guard', {},
  ['Is a three-row Grand Vitara coming?', 'upcoming model launch', 'new launch coming next year', 'next gen model when', 'seven seater grand vitara launch'],
  ['क्या तीन रो वाली Grand Vitara आ रही है?', 'naya model kab aayega', 'आने वाली गाड़ियाँ कौन सी हैं', 'agle saal kya launch hoga', 'नई लॉन्च कब है'],
  'I can only talk about cars on sale today. I do not have checked information on anything that has not been launched.',
  'मैं सिर्फ़ उन गाड़ियों के बारे में बता सकता हूँ जो आज बिक रही हैं। जो गाड़ी लॉन्च नहीं हुई, उसकी जाँची हुई जानकारी मेरे पास नहीं है।');
I('guard.finance', 'guard', { route: 'expert' },
  ['What will my EMI be?', 'car loan interest rate', 'how much down payment', 'loan options', 'emi for this car'],
  ['मेरी EMI कितनी बनेगी?', 'loan ka interest kitna hai', 'डाउन पेमेंट कितना देना होगा', 'emi kitni aayegi', 'लोन के विकल्प'],
  'I do not give loan or finance advice, because it depends on your own circumstances and the lender. I have added this to the questions for your product expert.',
  'मैं लोन या फ़ाइनेंस की सलाह नहीं देता, क्योंकि यह आपकी अपनी स्थिति और बैंक पर निर्भर करता है। मैंने यह सवाल आपके प्रोडक्ट एक्सपर्ट के लिए जोड़ दिया है।');
I('guard.rivalfaults', 'guard', {},
  ['What problems does the Creta have?', 'seltos reliability issues', 'is hyryder unreliable', 'nexon problems', 'complaints about toyota'],
  ['Creta में क्या दिक्कतें हैं?', 'seltos me kya problem hai', 'क्या Nexon में खराबी आती है', 'toyota ki shikayatein', 'Hyryder भरोसेमंद है क्या'],
  'I do not pass on complaints or rumours about other makers\' cars. I can show you the published figures side by side on the Compare screen, including where the other car is ahead.',
  'मैं दूसरी कंपनियों की गाड़ियों की शिकायतें या अफ़वाहें आगे नहीं बढ़ाता। "तुलना" स्क्रीन पर मैं छपे हुए आँकड़े साथ-साथ दिखा सकता हूँ, वहाँ भी जहाँ दूसरी गाड़ी आगे है।');

const here = dirname(fileURLToPath(import.meta.url));
writeFileSync(join(here, '..', 'src', 'data', 'qa.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`qa intents: ${out.length}`);
