/**
 * Demo inference engine.
 * Used only when the local SkillBox backend is not reachable (Demo Mode).
 * It pattern-matches well-known intents and streams realistic sample answers.
 * The UI always labels these as demo responses — they are never presented
 * as real local inference.
 */
import type { Lang } from "./i18n";

export interface SourceChip {
  name: string;
  kind: string;
}
export interface DemoReply {
  text: string;
  sources?: SourceChip[];
}

/* ------------------------------ response bank ------------------------------ */

const COTTON_EN = `## Yellowing cotton leaves — here is what to check first

Yellowing (chlorosis) in cotton usually traces back to one of five causes. Work through them in this order:

1. **Nitrogen deficiency** — older, lower leaves turn uniformly pale yellow first. Cotton is a heavy feeder during square formation.
2. **Waterlogging or poor drainage** — yellowing with drooping after heavy rain; roots suffocate and stop taking up nutrients.
3. **Sucking pest damage** — aphids, whiteflies or jassids on the undersides of leaves; look for curling edges and sticky honeydew.
4. **Magnesium or iron deficiency** — yellowing *between* the veins while veins stay green (interveinal chlorosis), common on alkaline soils.
5. **Root or stem damage** — boring grubs or rough hoeing near the plant base.

### A 10-minute field check

| What you see | Most likely cause | First step |
| --- | --- | --- |
| Yellow starts on older lower leaves | Nitrogen shortage | Top-dress urea after irrigation |
| Patches yellow after rain, water stands | Waterlogging | Open drainage channels |
| Leaf undersides have insects / sticky coating | Sucking pests | Neem-based spray, evening application |
| Veins green, tissue yellow | Micronutrient gap | Foliar MgSO₄ / ferrous sulphate |
| Sudden wilting of single plants | Root/stem borer | Uproot and destroy affected plants |

**How to narrow it down:** tell me what you see on the older leaves, whether veins stay green, and whether insects are present — I can help you pick one cause.`;

const COTTON_MR = `## कापसाची पाने पिवळी पडणे — प्रथम हे तपासा

कापसाची पाने पिवळी पडण्यामागे सहसा पाच कारणे असतात. हा क्रमाने तपासा:

1. **नत्राची कमतरता** — खालची, जुनी पाने प्रथम एकसारखी फिकट पिवळी दिसतात. सुगी निर्मितीच्या काळात कापसाला नत्राची जास्त गरज असते.
2. **पाण्याचा निचरा न होणे** — मुसळधार पावसानंतर पाने वाकून पिवळी पडतात; मुळांना श्वास मिळत नाही.
3. **रस शोषणारी कीड** — पानांच्या खालच्या बाजूस मावा, पांढरी माशी किंवा तुरतुडे; पाने वेवगळी वाकतात, चिकट पदार्थ दिसतो.
4. **मॅग्नेशियम किंवा लोखंडाची कमतरता** — शिरा हिरव्याच राहून शिरांमधला भाग पिवळा होतो (आल न पाण्यावर जास्त दिसते).
5. **मुळांना किंवा खोडाला इजा** — खोडकिडा किंवा मळणीच्या जवळ अचूक कोलपणे.

### शेतातील १० मिनिटांची तपासणी

| काय दिसते | संभाव्य कारण | पहिली पावले |
| --- | --- | --- |
| जुनी खालची पाने एकसारखी पिवळी | नत्राची कमतरता | सिंचनानंतर युरिया टपावा |
| पावसानंतर ओठात पाणी साचते, पाने पिवळी | पाण्याचा बुडमार | निचरा कालवा उघडा |
| पानाखाली कीड / चिकट पदार्थ | रस शोषणारी कीड | संध्याकाळी निंबोळी आधारित फवारणी |
| शिरा हिरव्या, भाग पिवळा | सूक्ष्म घटक कमी | MgSO₄ / फेरस सल्फेट फवारणी |

**पुढे काय:** खालच्या पानांवर काय दिसते, शिरा हिरव्या आहेत की नाही, आणि कीड आहे की नाही हे सांगा — मी एका कारणावर पोहोचण्यास मदत करू शकतो.`;

const COTTON_HI = `## कपास के पीले पत्ते — पहले क्या जाँचें

पत्तों का पीलापन (क्लोरोसिस) आम तौर पर पाँच कारणों में से एक से जुड़ा होता है। इस क्रम में जाँचें:

1. **नाइट्रोजन की कमी** — पर नीचे के पुराने पत्ते पहले एकसमान पीले दिखते हैं। कलियों के समय कपास को नाइट्रोजन की सबसे ज़्यादा ज़रूरत होती है।
2. **जलभराव / खराब निकास** — भारी बारिश के बाद पत्ते झूलकर पीले पड़ते हैं; जड़ों में साँस लेने की तंगी होती है।
3. **रस चूसने वाले कीट** — पत्तों के नीचे माहू, सफ़ेद मक्खी या जैसिड; पत्ते मुड़ते हैं और चिपचिपा पदार्थ दिखता है।
4. **मैग्नीशियम / लोहे की कमी** — शिराएं हरी रहती हैं लेकिन बीच का भाग पीला हो जाता है, खासकर क्षारीय मिट्टी में।
5. **जड़ या तने को नुकसान** — तने में घुसने वाले कीड़े या कुदाल से छताई।

### खेत में 10 मिनट की जाँच

| क्या दिखे | संभावित कारण | पहला कदम |
| --- | --- | --- |
| पुराने नीचे के पत्ते समान पीले | नाइट्रोजन की कमी | सिंचाई के बाद यूरिया डालें |
| बारिश के बाद पानी जमा, पत्ते पीले | जलभराव | नालियाँ खोलें |
| पत्तों के नीचे कीड़े / चिपचिपाहट | रस चूसने वाले कीट | शाम को नीम-आधारित छिड़काव |

**आगे क्या:** बताइए — नीचे के पत्ते कैसे दिखते हैं, शिराएं हरी हैं या नहीं, और कीड़े दिख रहे हैं या नहीं। मैं एक कारण तय करने में मदद करूँगा।`;

const LORA_EN = `## LoRA — in plain words

**LoRA (Low-Rank Adaptation)** is a way of teaching a large AI model a new skill *without retraining the whole model*.

### The idea

- A base model (like the one in SkillBox) has billions of parameters — its full "brain".
- Full fine-tuning would need enormous compute and would risk forgetting what it already knows.
- LoRA freezes the base model and trains only a **small adapter** — a tiny set of extra weights that nudges the model toward the new behaviour.

Think of it this way: the **base model is the DVD player**, a **Skill is the DVD**, and the **adapter is how the player learns to play that specific disc well**.

### Why it matters for local AI

| Property | Full fine-tuning | LoRA adapter |
| --- | --- | --- |
| Compute needed | Very high (GPU clusters) | Modest — possible on one machine |
| Result size | A whole new model (GBs) | A small file (MBs) |
| Risk to base model | Can damage existing ability | Base stays untouched |
| Sharing | Heavy | A portable package |

- **Small** — adapters are megabytes, so a Skill can be downloaded, stored and shared easily.
- **Composable** — many adapters can sit on top of one base model, which is exactly how SkillBox works.
- **Reversible** — remove the adapter and you are back to the base model.

**Want to go deeper?** Ask me about QLoRA, rank, or how adapters combine with a knowledge base.`;

const LORA_MR = `## LoRA — सोप्या भाषेत

**LoRA (Low-Rank Adaptation)** ही एक पद्धत आहे ज्यामध्ये मोठ्या AI मॉडेलला नवीन कौशल्य **संपूर्ण मॉडेल पुन्हा प्रशिक्षित न करता** शिकवले जाते.

### मूलभूत कल्पना

- बेस मॉडेलमध्ये अब्जावधी parameters असतात — हे त्याचे संपूर्ण "स्मरण".
- संपूर्ण fine-tuning साठी प्रचंड संगणकीय क्षमता लागते आणि जुने ज्ञान विसरण्याचा धोका असतो.
- LoRA मध्ये बेस मॉडेल **जसाच्या तसा ठेवला** जातो आणि फक्त एक छोटा **adapter** प्रशिक्षित केला जातो.

SkillBox च्या भाषेत: **बेस मॉडेल हा DVD प्लेयर**, **Skill हा DVD**, आणि **adapter हे त्या डिस्कसाठीचे विशेष अ‍ॅडजस्टमेंट**.

### याचा फायदा

- Adapter **छोटा** असतो (मेगाबाइटमध्ये) — म्हणून Skill डाउनलोड, साठवणे आणि शेअर करणे सोपे.
- एका बेस मॉडेलवर **अनेक adapters** बसू शकतात — SkillBox नेमके असेच काम करते.
- Adapter काढला की बेस मॉडेल पुन्हा पूर्ववत.

पुढे जाणून घ्यायचे असल्यास QLoRA किंवा rank विषयी विचारा.`;

const LORA_HI = `## LoRA — आसान भाषा में

**LoRA (Low-Rank Adaptation)** एक तरीका है जिससे बड़े AI मॉडल को नया कौशल **पूरा मॉडल दोबारा प्रशिक्षित किए बिना** सिखाया जाता है।

### मूल विचार

- बेस मॉडल में अरबों parameters होते हैं — यानी उसका पूरा "दिमाग"।
- फुल फाइन-ट्यूनिंग में भारी कंप्यूट लगता है और पुरानी समझ खतरे में आती है।
- LoRA बेस मॉडल को **ज्यों-का-त्यों** रखता है और सिर्फ़ एक छोटा **adapter** प्रशिक्षित करता है।

SkillBox की भाषा में: **बेस मॉडल DVD प्लेयर** है, **Skill DVD**, और **adapter उस डिस्क के लिए खास सेटिंग**।

### इसका फ़ायदा

- Adapter **छोटा** होता है (मेगाबाइट्स) — Skill आसानी से डाउनलोड और शेयर हो सकती है।
- एक बेस मॉडल पर **कई adapters** एक साथ रह सकते हैं — SkillBox ठीक ऐसे ही काम करता है।
- Adapter हटाते ही बेस मॉडल पहले जैसा।

आगे जानना हो तो QLoRA या rank के बारे में पूछिए।`;

const RECURSION_EN = `## Recursion, simply

**Recursion is when a function solves a problem by calling itself with a smaller version of the same problem**, until it reaches a case so small it can answer directly.

Two parts, always:

1. **Base case** — the "stop" answer. Without it, the function calls itself forever.
2. **Recursive step** — a smaller input, one step closer to the base case.

\`\`\`python
def factorial(n):
    if n <= 1:        # base case
        return 1
    return n * factorial(n - 1)   # recursive step
\`\`\`

How \`factorial(4)\` unfolds:

- \`4 * factorial(3)\`
- \`4 * 3 * factorial(2)\`
- \`4 * 3 * 2 * factorial(1)\` → \`4 * 3 * 2 * 1\` = **24**

**A good mental picture:** walking down stairs and asking "how many steps remain?" — each answer leans on the next, until the last step answers "one".

Where recursion shines: trees, folders, searching nested structures. Want a practice problem next?`;

const RECURSION_MR = `## रिकर्सन — सोप्या भाषेत

**रिकर्सन म्हणजे फंक्शन स्वतःलाच थोडे लहान रूपात पुन्हा पुन्हा कॉल करणे**, जोपर्यंत उत्तर थेट मिळत नाही (base case).

\`\`\`python
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)
\`\`\`

दोन गोष्टी नेहमी आवश्यक: **base case** (थांबण्याची अट) आणि **recursive step** (लहान इनपुट). base case नसेल तर फंक्शन अनंत वेळा कॉल होते.

\`factorial(4)\` = 4 × 3 × 2 × 1 = **24**.

सरड सारखे समजा — प्रत्येक पायरी पुढच्याला विचारते "आणखी किती राहिल्या?", शेवटची पायरी उत्तर देते "एक".

पुढे सराव प्रश्न हवा असल्यास सांगा!`;

const RECURSION_HI = `## रिकर्सन — सरल भाषा में

**रिकर्सन का मतलब है, फ़ंक्शन अपनी समस्या का छोटा रूप खुद को देकर सुलझाता है**, जब तक छोटी-से-छोटी समस्या का सीधा उत्तर न मिल जाए।

\`\`\`python
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)
\`\`\`

हर रिकर्सिव फ़ंक्शन में दो हिस्से होते हैं: **base case** (रुकने की शर्त) और **recursive step** (छोटा इनपुट)।

\`factorial(4)\` = 4 × 3 × 2 × 1 = **24**.

इसे ऐसे समझिए — सीढ़ियों पर एक-एक क़दम पूछता है "और कितने बचे?", आख़िरी क़दम जवाब देता है "एक"।

अभ्यास प्रश्न चाहिए तो बताइए!`;

const GROW_EN = `## What can you grow this month?

That depends on your region, soil and water — but here is a reliable way to think about it in February in most of central India:

**Rabi (winter) crops still going strong**
- Wheat, chickpea (chana) — approaching pod/grain fill
- Onion, garlic — keep soil moisture even
- Leafy vegetables — spinach, fenugreek, coriander tolerate the cool nights

**Summer crops to start planning now**
- Green gram (moong) and cluster bean — short duration, low water
- Cucumber, watermelon, muskmelon — need reliable irrigation
- Sunflower — where a market exists nearby

### Before you sow, check three things

| Check | Why it matters |
| --- | --- |
| Water availability | Summer crops need assured irrigation |
| Soil temperature | Warm to sow moong; cool still fine for greens |
| Market distance | Short-life vegetables need buyers within a day |

Tell me your **district**, your **soil type**, and whether you have **irrigation** — I will narrow it down to two or three confident options.`;

const GROW_MR = `## या महिन्यात काय घालता येईल?

जिल्हा, माती आणि पाण्यावर हे ठरते — पण फेब्रुवारीत मध्य भारतात हा विश्वासार्ह सूचितो:

**चालू रब्बी पिके**
- गहू, हरभरा — दाना भरण्याच्या स्थितीकडे
- कांदा, लसूण — माती समान ओली
- पालेभाज्या — पालक, मेथी, कोथिंबीर

**उन्हाळी पिकांसाठी आता नियोजन**
- मूग, गवार — लहान कालावधी, कमी पाण्यात
- काकडी, कलिंगड, खरबूज — निश्चित सिंचन आवश्यक
- सूर्यफूल — जवळ बाजारपेठ असल्यास

### पेरणि आधी तीन गोष्टी तपासा

| तपासा | का |
| --- | --- |
| पाणी उपलब्धता | उन्हाळी पिकांना निश्चित सिंचन लागते |
| मातीचे तापमान | मुगासाठी ऊबदार, भाज्यांसाठी थंड घाम |
| बाजार अंतर | लवकर खराब होणाऱ्या भाज्यांना जवळची बाजारपेठ |

तुमचा **जिल्हा**, **मातीचा प्रकार** आणि **सिंचन** सांगा — मी दोन-तीन निश्चित पर्याय काढून देतो.`;

const JAVA_ERR_EN = `## Reading a Java error, calmly

A Java exception looks scary, but it is a list with a tiny anatomy:

\`\`\`
Exception in thread "main" java.lang.NullPointerException
  at com.example.Shop.checkout(Shop.java:17)
  at com.example.Main.main(Main.java:8)
\`\`\`

- **Line 1** — *what* happened. \`NullPointerException\` means you tried to use something that is \`null\`.
- **Line 2** — *where* it happened: file, class, line number (\`Shop.java:17\`).
- **Next lines** — the call trail: who called the failing function.

### The three-step habit

1. Read the exception *type* first — it tells you the category (null, wrong type, missing file…).
2. Jump to the *top line that mentions your own code* — library lines below are usually innocent.
3. Add a print/log one line above the crash and check the values.

Paste your full error here and tell me what the code is supposed to do — I will help you trace it line by line.`;

const PAPER_EN = `## How I can help with a research paper

Share a paper title, an abstract you pasted, or a concept you are stuck on, and I can:

- **Summarize** the idea in a few plain sentences
- **Explain** the method — architecture, training, evaluation — step by step
- **Compare** it with earlier approaches and state the claimed trade-offs
- **Pull out limitations** the authors admit (and ones they don't)

A careful note: in this demo I answer from built-in sample knowledge, so I may not know the newest papers. With the local backend connected and your PDF added to a personal Skill, I can work directly from *your* document.

**Try:** paste an abstract and ask *"summarize like I'm a student,"* or ask *"what assumption is this paper making?"*`;

/* fallbacks per skill per lang */
const FALLBACK: Record<string, Partial<Record<Lang, string>>> = {
  agriculture: {
    en: `I can help with crops, soil, pests, irrigation and seasonal planning — completely offline.\n\nTo give you a precise answer, tell me:\n\n- **Which crop?** (cotton, soybean, wheat…)\n- **What stage?** (sowing, flowering, harvest…)\n- **What do you see?** (yellowing, wilting, insects…)\n\nFor example: *"What should I check if my cotton leaves are turning yellow?"*`,
    mr: `मी पिके, माती, कीड, सिंचन आणि हंगामी नियोजनाबद्दल मदत करू शकतो — पूर्णपणे ऑफलाइन.\n\nअचूक उत्तरासाठी सांगा:\n\n- **कोणते पीक?** (कापूस, सोयाबीन, गहू…)\n- **कोणत्या स्थितीत?** (पेरणी, फुलोरा, काढणी…)\n- **काय दिसत आहे?** (पिवळेपणा, वाळणे, कीड…)\n\nउदा: *"कापसाची पाने पिवळी पडत असतील तर प्रथम काय तपासावे?"*`,
    hi: `मैं फसल, मिट्टी, कीट, सिंचाई और मौसमी योजना में मदद कर सकता हूँ — पूरी तरह ऑफ़लाइन।\n\nसटीक जवाब के लिए बताइए:\n\n- **कौन सी फसल?** (कपास, सोयाबीन, गेहूँ…)\n- **कौन सी अवस्था?** (बुवाई, फूल, कटाई…)\n- **क्या दिख रहा है?** (पीलापन, मुरझाना, कीड़े…)\n\nजैसे: *"कपास के पत्ते पीले हों तो पहले क्या जाँचें?"*`,
  },
  "ai-research": {
    en: `I can explain ML and AI concepts in plain language and help you reason about research.\n\nTry asking:\n\n- *"What is LoRA?"*\n- *"Summarize this concept"*\n- *"How do transformers learn?"*`,
    mr: `मी ML आणि AI संकल्पना सोप्या भाषेत समजावून सांगू शकतो.\n\nप्रयत्न करा: *"LoRA म्हणजे काय?"*`,
    hi: `मैं ML और AI कॉन्सेप्ट्स आसान भाषा में समझा सकता हूँ।\n\nपूछें: *"LoRA क्या है?"*`,
  },
  programming: {
    en: `I can explain programming concepts, error messages and code — offline, so your code never leaves this device.\n\nTry:\n\n- *"Explain recursion simply"*\n- *"Explain this Java error"* (paste the error)\n- *"Teach me Python"*`,
    mr: `मी प्रोग्रॅमिंग संकल्पना, एरर मेसेज आणि कोड समजावून सांगू शकतो — ऑफलाइन.\n\nप्रयत्न करा: *"रिकर्षन सोप्या भाषेत सांगा"*`,
    hi: `मैं प्रोग्रामिंग कॉन्सेप्ट्स, एरर मैसेज और कोड समझा सकता हूँ — ऑफ़लाइन, तो आपका कोड इसी डिवाइस पर रहता है।\n\nपूछें: *"रिकर्सन सरलता से समझाएँ"*`,
  },
  general: {
    en: `I am your local SkillBox AI — I answer using the base model and any Skills you have installed.\n\nTo get a sharper answer, try:\n\n- Asking the **Agriculture** skill about crops\n- Asking the **AI Researcher** about ML concepts\n- Asking **Programming** to explain code`, 
    mr: `मी तुमचे लोकल SkillBox AI आहे — बेस मॉडेल आणि इन्स्टॉल केलेल्या स्किल्सद्वारे उत्तर देतो.\n\nअधिक चोख उत्तरासाठी योग्य स्किल निवडा — उदा. शेतीबद्दल **Agriculture**.`,
    hi: `मैं आपका लोकल SkillBox AI हूँ — बेस मॉडल और इंस्टॉल्ड स्किल्स से जवाब देता हूँ।\n\nबेहतर जवाब के लिए सही स्किल चुनिए — जैसे खेती के लिए **Agriculture**।`,
  },
};

/* ------------------------------ intent matching ---------------------------- */

export function generateReply(input: string, skillId: string, uiLang: Lang): DemoReply {
  const q = input.toLowerCase();
  // Reply in the user's selected language (the voice of the product is the chosen language).
  const lang: Lang = uiLang;
  const agri = skillId === "agriculture" || /cotton|कापस|कापूस|crop|फसल|पीक|farm|शेती|खेती|soil|माती|मिट्टी/.test(q);

  if (/cotton|yellow|कापस|कापूस|पिवळ|पीले/.test(q) && (agri || true)) {
    if (lang === "mr") return { text: COTTON_MR, sources: agriSources("mr") };
    if (lang === "hi") return { text: COTTON_HI, sources: agriSources("hi") };
    return { text: COTTON_EN, sources: agriSources("en") };
  }
  if (/lora|qlora|adapter|एडॉप्टर/.test(q)) {
    if (lang === "mr") return { text: LORA_MR, sources: researchSources() };
    if (lang === "hi") return { text: LORA_HI, sources: researchSources() };
    return { text: LORA_EN, sources: researchSources() };
  }
  if (/recursion|रिकर्सन|रिकर्षन/.test(q)) {
    if (lang === "mr") return { text: RECURSION_MR };
    if (lang === "hi") return { text: RECURSION_HI };
    return { text: RECURSION_EN };
  }
  if (/grow this month|what.*grow|काय घालू|क्या उगा/.test(q)) {
    if (lang === "mr") return { text: GROW_MR, sources: agriSources("mr") };
    return { text: GROW_EN, sources: agriSources("en") };
  }
  if (/paper|abstract|research|पेपर/.test(q)) return { text: PAPER_EN, sources: researchSources() };
  if (/java|exception|error|nullpointer|एरर/.test(q)) return { text: JAVA_ERR_EN };
  if (/python/.test(q)) {
    return {
      text: RECURSION_EN.replace("Recursion, simply", "Python — where to start"),
    };
  }

  const fb = FALLBACK[skillId] ?? FALLBACK.general;
  return { text: fb[lang] ?? fb.en ?? FALLBACK.general.en! };
}

function agriSources(lang: Lang): SourceChip[] {
  const kind =
    lang === "mr" ? "संशोधन संस्था" : lang === "hi" ? "अनुसंधान संस्था" : "Research body";
  return [
    { name: "ICAR-CICR advisory", kind },
    { name: "FAO field guide", kind: "International" },
  ];
}
function researchSources(): SourceChip[] {
  return [
    { name: "arXiv: Hu et al., LoRA", kind: "Paper abstract" },
    { name: "Open ML textbook", kind: "Educational" },
  ];
}

/* ------------------------------ token streaming ---------------------------- */

/** Splits markdown into stream-safe chunks (words + punctuation). */
export function chunkText(text: string): string[] {
  const matches = text.match(/\S+\s*/g);
  return matches ?? [text];
}

export function streamReply(
  reply: DemoReply,
  onChunk: (text: string, done: boolean) => void,
  signal: { aborted: boolean },
): Promise<void> {
  return new Promise((resolve) => {
    const chunks = chunkText(reply.text);
    let i = 0;
    let acc = "";
    const tick = () => {
      if (signal.aborted) {
        onChunk(acc, true);
        resolve();
        return;
      }
      // stream 1–3 chunks per tick for natural cadence
      const burst = 1 + Math.floor(Math.random() * 2);
      for (let b = 0; b < burst && i < chunks.length; b++) acc += chunks[i++];
      const done = i >= chunks.length;
      onChunk(acc, done);
      if (done) resolve();
      else setTimeout(tick, 18 + Math.random() * 30);
    };
    setTimeout(tick, 30);
  });
}
