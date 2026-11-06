import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js";
env.allowLocalModels = false;

// ── Label banks ────────────────────────────────────────────────
const CLOTHING = ["t-shirt", "shirt", "blouse", "crop top", "tank top", "hoodie", "sweater", "cardigan", "jacket", "blazer", "coat", "dress", "skirt", "trousers", "jeans", "shorts", "leggings", "jumpsuit", "suit", "activewear"];
const COLORS = ["black", "white", "grey", "beige", "brown", "navy blue", "blue", "light blue", "green", "olive", "khaki", "red", "burgundy", "pink", "purple", "orange", "yellow", "cream", "multicolor", "patterned"];
const STYLES = ["casual", "formal", "streetwear", "business casual", "athleisure", "bohemian", "minimalist", "preppy", "grunge", "vintage", "Y2K", "dark academia", "quiet luxury", "cottagecore", "smart casual", "sporty", "edgy", "classic", "romantic", "eclectic"];

// ── Score engine ───────────────────────────────────────────────
function scoreOutfit(clothingConf, colorConf, styleConf) {
    const c = clothingConf * 10;
    const col = colorConf * 10;
    const s = styleConf * 10;
    const raw = (c * 0.35 + col * 0.25 + s * 0.40);
    return Math.min(10, Math.max(5, Math.round(raw * 0.55 + 4.5)));
}

function scoreClass(score) {
    return score >= 8 ? "score-high" : score >= 6 ? "score-mid" : "score-low";
}

// Multiple feedback options per score range for variety
const FEEDBACK_OPTIONS = {
    9: [
        (s) => `🔥 Exceptional ${s} look. Barely anything to change.`,
        (s) => `🔥 Outstanding! This outfit nails the ${s} aesthetic perfectly.`,
        (s) => `✨ Chef's kiss! The ${s} vibes are immaculate here.`,
        (s) => `💯 This is a masterclass in ${s} styling. Incredible composition.`,
        (s) => `🌟 Phenomenal fit! You've captured ${s} at its finest.`,
    ],
    8: [
        (s) => `✨ Strong fit. The ${s} aesthetic comes through clearly.`,
        (s) => `💫 Great outfit! The ${s} elements are well-balanced.`,
        (s) => `👏 Nicely done! This look channels ${s} with confidence.`,
        (s) => `🎯 On point! You're rocking the ${s} style beautifully.`,
        (s) => `🔥 Solid ${s} energy! Love how the pieces work together.`,
    ],
    7: [
        (s) => `👍 Solid outfit. Lean more into the ${s} details to elevate it.`,
        (s) => `🙂 Good start! Push the ${s} vibe a bit further for more impact.`,
        (s) => `✨ There's real potential here. Amplify those ${s} touches.`,
        (s) => `🎯 Getting there! Add a statement piece to embrace ${s} fully.`,
        (s) => `💫 Nice foundation. One bold ${s} element would tie this together.`,
    ],
    6: [
        (s) => `🙂 Decent look. The ${s} vibe is present but could be stronger.`,
        (s) => `🤔 This has hints of ${s}. Try committing more boldly to the theme.`,
        (s) => `💭 Interesting mix! A clearer ${s} centerpiece would help.`,
        (s) => `✨ There's something here. Refine the ${s} elements for better flow.`,
        (s) => `👀 I see where you're going. Lean harder into the ${s} essentials.`,
    ],
    5: [
        () => `🤔 The pieces don't fully click yet. Try anchoring around one clear aesthetic.`,
        () => `💭 Interesting combination! Pick one style direction and build around it.`,
        () => `🎨 There's potential here. Find one statement piece to center the look.`,
        () => `✨ Mix it up! Choose a core aesthetic and let every piece support it.`,
        () => `🌱 Good foundation. Add one bold style-defining element to tie it all together.`,
    ]
};

function scoreFeedback(score, style) {
    const options = FEEDBACK_OPTIONS[score >= 9 ? 9 : score >= 8 ? 8 : score >= 7 ? 7 : score >= 6 ? 6 : 5];
    const pick = options[Math.floor(Math.random() * options.length)];
    return pick(style);
}

// Random helper
function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleArray(arr) {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// ── Skin tone colour recommendations ───────────────────────────
const SKIN_COLOR_REC = {
    fair: {
        best: ["navy blue", "burgundy", "forest green", "camel", "soft pink", "coral", "lavender", "dusty rose"],
        avoid: ["neon yellow", "bright orange", "pale pastels", "washed-out beiges"],
        metals: ["silver", "white gold", "platinum"],
        tip: "Cool and jewel tones complement your complexion. Avoid washed-out colours that blend with your skin."
    },
    light: {
        best: ["navy", "cobalt blue", "emerald green", "blush pink", "coral", "peach", "warm brown"],
        avoid: ["neon orange", "electric yellow", "harsh white"],
        metals: ["rose gold", "yellow gold", "silver"],
        tip: "You can wear both warm and cool tones. Jewel colours and soft pastels work beautifully."
    },
    medium: {
        best: ["olive green", "mustard yellow", "terracotta", "teal", "off-white", "coral", "amber", "rust"],
        avoid: ["pale pastels", "washed-out greys", "harsh brights"],
        metals: ["gold", "bronze", "copper"],
        tip: "Warm earthy tones and rich colours enhance your natural warmth."
    },
    olive: {
        best: ["burgundy", "emerald green", "gold", "cream", "coral", "warm brown", "terracotta"],
        avoid: ["cool pastels", "icy greys", "faded purples"],
        metals: ["gold", "bronze", "rose gold"],
        tip: "Green-undertone colours harmonise with your skin. Warm metallics add radiance."
    },
    tan: {
        best: ["white", "bright coral", "turquoise", "gold", "hot pink", "emerald", "cobalt blue", "orange"],
        avoid: ["muddy browns", "dull greys", "pale nudes"],
        metals: ["gold", "rose gold", "bronze"],
        tip: "Vibrant colours pop against your skin. Crisp whites and brights look stunning."
    },
    deep: {
        best: ["bright yellow", "fuchsia", "royal blue", "emerald green", "white", "coral", "purple", "gold"],
        avoid: ["washed-out pastels", "muddy browns", "dull greys"],
        metals: ["gold", "copper", "bronze"],
        tip: "Bold, saturated colours shine on you. High contrast looks are incredibly striking."
    }
};

// ── Gender-specific occasion suggestions ───────────────────────
const OCC = {
    party: {
        feminine: {
            outfits: ["Sequined mini dress + strappy heels + clutch", "Satin slip dress + leather jacket + ankle boots", "Bodycon dress + statement earrings + block heels", "Midi cocktail dress + metallic heels + drop earrings"],
            acc: ["Bold earrings", "Rhinestone bag", "Statement necklace", "Sparkly clutch"],
            shoes: ["Block heels", "Platform sandals", "Strappy stilettos", "Ankle boots"]
        },
        masculine: {
            outfits: ["Fitted blazer + dark jeans + crisp white shirt + Chelsea boots", "Button-down shirt + tailored trousers + loafers", "Leather jacket + fitted tee + black jeans + boots", "Silk shirt + tailored pants + dress sneakers"],
            acc: ["Statement watch", "Leather belt", "Minimalist bracelet", "Pocket square"],
            shoes: ["Chelsea boots", "Loafers", "Dress sneakers", "Oxford brogues"]
        },
        unisex: {
            outfits: ["Sequined jacket + black jeans + ankle boots", "Statement blazer + fitted trousers + clean sneakers", "Velvet blazer + turtleneck + tailored pants"],
            acc: ["Bold earrings", "Statement watch", "Minimalist chain"],
            shoes: ["Chelsea boots", "Platform sneakers", "Loafers"]
        }
    },
    college: {
        feminine: {
            outfits: ["Oversized hoodie + straight-leg jeans + white sneakers", "Graphic tee + plaid skirt + chunky trainers", "Knit sweater + mom jeans + loafers", "Cropped cardigan + high-waisted jeans + canvas sneakers"],
            acc: ["Canvas backpack", "Scrunchie", "Mini shoulder bag", "Layered necklaces"],
            shoes: ["Air Force 1s", "Chunky sneakers", "Canvas sneakers", "Loafers"]
        },
        masculine: {
            outfits: ["Oversized hoodie + joggers + retro trainers", "Graphic tee + cargo pants + high-tops", "Flannel shirt + jeans + boots", "Varsity jacket + fitted tee + straight jeans"],
            acc: ["Canvas backpack", "Dad cap", "Crossbody bag", "Watch"],
            shoes: ["Chunky sneakers", "High-tops", "Retro trainers", "Boots"]
        },
        unisex: {
            outfits: ["Oversized hoodie + straight-leg jeans + white sneakers", "Graphic tee + cargos + chunky trainers", "Knit sweater + mom jeans + loafers"],
            acc: ["Canvas backpack", "Minimalist watch"],
            shoes: ["Air Force 1s", "Chunky sneakers", "Canvas sneakers"]
        }
    },
    formal: {
        feminine: {
            outfits: ["Tailored midi dress + structured blazer + pointed heels", "Silk blouse + wide-leg trousers + statement heels", "Wrap dress + pearl jewellery + kitten heels", "Peplum top + pencil skirt + nude heels"],
            acc: ["Pearl earrings", "Structured bag", "Delicate bracelet", "Silk scarf"],
            shoes: ["Pointed-toe heels", "Kitten heels", "Block heels", "Loafers"]
        },
        masculine: {
            outfits: ["Tailored two-piece suit in charcoal + Oxford shoes", "Navy suit + crisp white shirt + burgundy tie", "Three-piece suit + pocket watch + polished shoes", "Black suit + slim tie + dress boots"],
            acc: ["Leather belt", "Minimalist watch", "Tie clip", "Pocket square"],
            shoes: ["Oxford brogues", "Derby shoes", "Dress boots", "Loafers"]
        },
        unisex: {
            outfits: ["Tailored blazer + matching trousers + crisp shirt + loafers", "Structured suit set + clean sneakers", "Classic trench + button-down + tailored pants"],
            acc: ["Minimalist watch", "Leather belt", "Structured bag"],
            shoes: ["Oxford brogues", "Loafers", "Derby shoes"]
        }
    },
    date: {
        feminine: {
            outfits: ["Silk slip dress + linen blazer + mules", "Midi skirt + tucked blouse + heeled boots", "Fitted jeans + off-shoulder top + strappy sandals", "Wrap dress + delicate jewellery + block heels"],
            acc: ["Delicate gold jewellery", "Leather mini bag", "Statement earrings", "Floral perfume"],
            shoes: ["Strappy heels", "Chelsea boots", "Mules", "Block heels"]
        },
        masculine: {
            outfits: ["Dark-wash slim jeans + fitted turtleneck + loafers", "Oxford shirt + chinos + desert boots", "Henley + leather jacket + dark jeans + boots", "Polo shirt + tailored trousers + clean sneakers"],
            acc: ["Leather bracelet", "Minimalist watch", "Nice belt", "Subtle cologne"],
            shoes: ["Chelsea boots", "Loafers", "Desert boots", "Clean sneakers"]
        },
        unisex: {
            outfits: ["Silk shirt + tailored trousers + loafers", "Fitted jeans + nice top + ankle boots", "Knit sweater + dark jeans + clean sneakers"],
            acc: ["Delicate gold jewellery", "Leather mini bag"],
            shoes: ["Chelsea boots", "Loafers", "Ankle boots"]
        }
    },
    beach: {
        feminine: {
            outfits: ["Flowy maxi dress + flat sandals", "High-waisted bikini + sheer cover-up + espadrilles", "Linen shorts + crop top + flip flops", "Sundress + straw hat + slides"],
            acc: ["Straw hat", "Wicker tote", "Sunglasses", "Shell jewellery"],
            shoes: ["Espadrilles", "Flat slides", "Flip flops", "Sandals"]
        },
        masculine: {
            outfits: ["Swim trunks + linen shirt + flip flops", "Tank top + board shorts + sandals", "Graphic tee + swim shorts + slides", "Lightweight button-down + swim shorts"],
            acc: ["Sunglasses", "Canvas tote", "Watch", "Cap"],
            shoes: ["Flip flops", "Slides", "Espadrilles", "Sandals"]
        },
        unisex: {
            outfits: ["Linen wide-leg trousers + crop top + sandals", "Swimsuit + sheer cover-up + espadrilles", "Flowy shorts + loose tee + flip flops"],
            acc: ["Straw hat", "Wicker tote", "Sunglasses"],
            shoes: ["Espadrilles", "Flat slides", "Flip flops"]
        }
    },
    gym: {
        feminine: {
            outfits: ["Seamless sports bra + high-waist leggings + zip-up hoodie", "Oversized tee + biker shorts + trainers", "Cropped tank + leggings + lightweight jacket", "Matching co-ord set + running shoes"],
            acc: ["Sporty cap", "Gym duffel", "Resistance band", "Headphones"],
            shoes: ["Running trainers", "Cross-trainers", "Training shoes", "High-impact sneakers"]
        },
        masculine: {
            outfits: ["Fitted tank + workout shorts + trainers", "Performance tee + joggers + cross-trainers", "Compression top + shorts + running shoes", "Muscle tee + track pants + gym shoes"],
            acc: ["Gym bag", "Workout gloves", "Headphones", "Cap"],
            shoes: ["Running trainers", "Cross-trainers", "Lifting shoes", "Training shoes"]
        },
        unisex: {
            outfits: ["Seamless set (sports bra + leggings) + zip-up hoodie", "Oversized tee + biker shorts + trainers", "Track pants + fitted tank + bomber jacket"],
            acc: ["Sporty cap", "Gym duffel"],
            shoes: ["Running trainers", "Cross-trainers"]
        }
    },
    office: {
        feminine: {
            outfits: ["Tailored trousers + silk blouse + longline blazer + heels", "Pencil skirt + fitted knit + heeled mule", "Midi dress + blazer + loafers", "Wide-leg pants + tucked blouse + block heels"],
            acc: ["Structured tote", "Minimalist earrings", "Thin belt", "Watch"],
            shoes: ["Loafers", "Low block heels", "Pointed flats", "Ankle boots"]
        },
        masculine: {
            outfits: ["Chinos + oxford shirt + loafers", "Tailored trousers + polo shirt + brogues", "Dress pants + button-down + leather belt", "Smart casual suit + open-collar shirt"],
            acc: ["Leather briefcase", "Watch", "Belt", "Tie (optional)"],
            shoes: ["Loafers", "Derby shoes", "Oxford brogues", "Dress boots"]
        },
        unisex: {
            outfits: ["Tailored trousers + silk blouse + longline blazer", "Knit polo + chino trousers + loafers", "Oxford shirt + straight-leg pants + brogues"],
            acc: ["Structured tote", "Minimalist earrings"],
            shoes: ["Loafers", "Low block heels", "Oxford brogues"]
        }
    },
    wedding: {
        feminine: {
            outfits: ["Floral midi dress + heeled sandals + clutch", "Satin maxi dress + strappy heel + statement earrings", "Lace dress + block heels + pearl jewellery", "Tea-length dress + fascinator + courts"],
            acc: ["Pearl jewellery", "Satin clutch", "Fascinator", "Statement earrings"],
            shoes: ["Kitten heels", "Strappy block heels", "Court shoes", "Sandals"]
        },
        masculine: {
            outfits: ["Light grey suit + crisp shirt + tie + brogues", "Navy suit + pocket square + Oxford shoes", "Tan suit + burgundy tie + brown brogues", "Morning suit + waistcoat + dress shoes"],
            acc: ["Pocket square", "Tie", "Watch", "Cufflinks"],
            shoes: ["Oxford brogues", "Derby shoes", "Loafers", "Dress boots"]
        },
        unisex: {
            outfits: ["Pastel suit set + silk camisole/crisp shirt + loafers", "Tailored jumpsuit + statement jewellery + heels", "Structured blazer + matching trousers + dress shirt"],
            acc: ["Satin clutch", "Minimalist jewellery"],
            shoes: ["Loafers", "Block heels", "Oxford brogues"]
        }
    },
    brunch: {
        feminine: {
            outfits: ["Flowy floral sundress + white sneakers", "Midi skirt + tucked tee + espadrilles", "High-waisted jeans + off-shoulder top + mules", "Wrap dress + block heels + crossbody bag"],
            acc: ["Sunglasses", "Straw mini bag", "Delicate jewellery", "Hair ribbon"],
            shoes: ["Flat sandals", "White trainers", "Mules", "Espadrilles"]
        },
        masculine: {
            outfits: ["Polo shirt + chinos + clean sneakers", "Linen shirt + tailored shorts + loafers", "Lightweight jumper + jeans + desert boots", "Oxford shirt + chinos + boat shoes"],
            acc: ["Sunglasses", "Watch", "Canvas bag", "Cap"],
            shoes: ["White sneakers", "Loafers", "Boat shoes", "Desert boots"]
        },
        unisex: {
            outfits: ["Linen co-ord + raffia sandals", "Mom jeans + striped top + espadrilles", "Linen shirt + tailored shorts + loafers"],
            acc: ["Sunglasses", "Straw mini bag"],
            shoes: ["Flat sandals", "White trainers", "Loafers"]
        }
    },
    travel: {
        feminine: {
            outfits: ["Linen joggers + oversized tee + slip-on sneakers", "Midi dress + denim jacket + white trainers", "Comfort wide-leg trousers + fitted long-sleeve + ankle boots", "Athleisure set + bomber jacket"],
            acc: ["Crossbody bag", "Packable tote", "Neck pillow", "Sunglasses"],
            shoes: ["Slip-on trainers", "Ankle boots", "Comfortable sneakers", "Slides"]
        },
        masculine: {
            outfits: ["Joggers + crewneck + trainers", "Chinos + polo shirt + loafers", "Jeans + henley + boots", "Performance pants + tee + sneakers"],
            acc: ["Backpack", "Travel wallet", "Sunglasses", "Cap"],
            shoes: ["Slip-on trainers", "Comfortable sneakers", "Loafers", "Boots"]
        },
        unisex: {
            outfits: ["Linen joggers + oversized tee + slip-on sneakers", "Midi dress/casual shirt + denim jacket + white trainers", "Wide-leg trousers + fitted top + comfortable shoes"],
            acc: ["Crossbody bag", "Packable tote"],
            shoes: ["Slip-on trainers", "Flat sandals", "Comfortable sneakers"]
        }
    }
};

// ── Weather suggestions ────────────────────────────────────────
function getWeatherSuggestion(temp, weather, dest) {
    let base = "";
    if (temp <= 5) base = "Heavy coat or puffer jacket · Thermal underlayer · Chunky knit sweater · Warm trousers";
    else if (temp <= 12) base = "Mid-weight coat · Long-sleeve top · Jeans or thick trousers · Ankle boots";
    else if (temp <= 18) base = "Light jacket or cardigan · Jeans · Casual top · Sneakers or loafers";
    else if (temp <= 25) base = "T-shirt or blouse · Light trousers or midi skirt · Sneakers or sandals";
    else if (temp <= 32) base = "Linen or cotton top · Shorts or light dress · Breathable sandals";
    else base = "Minimal layers · Linen or cotton only · Open-toe sandals · Light colour palette";

    const cond = {
        rainy: "Add: waterproof jacket · Ankle boots or wellies · Avoid suede · Carry compact umbrella",
        windy: "Add: fitted layers that won't catch wind · Avoid loose maxi skirts · Consider a belted coat",
        snowy: "Add: waterproof snow boots · Thermal base layer · Scarf + gloves + beanie",
        humid: "Stick to: breathable fabrics (linen, cotton, bamboo) · Avoid silk · Loose silhouettes only",
        cloudy: "Layer up slightly — temperature can drop. Light jacket over your base look.",
        sunny: "Sun protection: light layers, hat, sunglasses. UV-protective fabrics if outdoors long.",
    }[weather] || "";

    const go = {
        outdoors: "Outdoor tip: prioritise comfort and weather-protection over pure style.",
        indoors: "Indoor tip: lighter layers since you'll be in a controlled environment.",
        both: "In/out tip: layer strategically — something you can easily remove when inside.",
    }[dest] || "";

    return `${base}\n\n${cond}\n\n${go}`.trim();
}

// ── Trend look-books ───────────────────────────────────────────
const TRENDS = {
    genz: {
        name: "Gen Z", icon: "✌️",
        desc: "Gen Z fashion is all about self-expression — mixing eras, breaking rules, and leaning into nostalgia.",
        looks: [
            "Low-rise baggy jeans + Y2K graphic baby tee + chunky platform shoes",
            "Micro mini skirt + oversized band tee + tall socks + Mary Janes",
            "Colourful cargos + cropped zip-up hoodie + Samba trainers",
        ],
        acc: ["Tiny tinted sunglasses", "Charm-heavy layered necklaces", "Mini shoulder bag"],
        shoes: ["Platform Mary Janes", "Chunky Samba trainers", "Butterfly-print flats"],
        palette: ["Electric blue", "Hot pink", "Lime green", "Lavender", "Off-white"],
    },
    streetwear: {
        name: "Streetwear", icon: "🧢",
        desc: "Streetwear blends comfort with culture — rooted in skate, hip-hop, and basketball influences.",
        looks: [
            "Oversized graphic hoodie + wide-leg cargos + Jordan 1s",
            "Puffer jacket + biker shorts + high-tops + crossbody",
            "Varsity jacket + straight-leg jeans + vintage tee + Dunks",
        ],
        acc: ["Bucket hat", "Dad cap", "Chunky silver chain"],
        shoes: ["Air Force 1s", "Yeezy Slides", "New Balance 550s"],
        palette: ["Black", "Off-white", "Army green", "Rust orange", "Cobalt"],
    },
    minimalist: {
        name: "Minimalist", icon: "⬜",
        desc: "Less is more. Clean lines, tonal dressing, and elevated basics that do the talking.",
        looks: [
            "White linen wide-leg trousers + fitted ribbed tank + white leather sneakers",
            "Camel wool coat + black turtleneck + tailored trousers + loafers",
            "Monochrome grey set (oversized blazer + straight trousers) + clean trainers",
        ],
        acc: ["Thin gold chain", "Clean leather belt", "Simple hoop earrings"],
        shoes: ["White leather sneakers", "Pointed ballet flats", "Minimalist loafers"],
        palette: ["White", "Ecru", "Camel", "Slate grey", "Black"],
    },
    cottagecore: {
        name: "Cottagecore", icon: "🌸",
        desc: "Romanticised rural life — floral prints, soft textures, and a dreamy, pastoral mood.",
        looks: [
            "Floral prairie dress + white puffed-sleeve blouse layered underneath + ankle boots",
            "Linen midi skirt + embroidered blouse + straw hat + flat sandals",
            "Ditsy-print dress + knit cardigan + Mary Jane flats",
        ],
        acc: ["Floral headband", "Wicker basket bag", "Delicate lace hair ribbon"],
        shoes: ["Tan ankle boots", "Mary Jane flats", "Leather gladiator sandals"],
        palette: ["Dusty rose", "Sage green", "Cream", "Lavender", "Warm brown"],
    },
    darkacademia: {
        name: "Dark Academia", icon: "📚",
        desc: "Inspired by old libraries, autumn ivy leagues, and the pursuit of knowledge.",
        looks: [
            "Plaid blazer + turtleneck + pleated trousers + Oxford brogues",
            "Oversized tweed coat + midi skirt + knit tights + loafers",
            "Button-down shirt + cable-knit sweater + tailored shorts + knee-high socks",
        ],
        acc: ["Round wire-frame glasses", "Leather satchel", "Tartan scarf"],
        shoes: ["Oxford brogues", "Heeled loafers", "Leather Chelsea boots"],
        palette: ["Dark brown", "Forest green", "Burgundy", "Cream", "Camel"],
    },
    quietluxury: {
        name: "Quiet Luxury", icon: "🤍",
        desc: "No logos. No noise. Premium fabrics, perfect fit, and understated confidence.",
        looks: [
            "Cashmere crew-neck + tailored wide-leg trousers + leather loafers",
            "Silk slip dress + longline camel coat + barely-there heels",
            "Merino wool turtleneck + straight trousers + leather belt + clean white sneakers",
        ],
        acc: ["Gold chain bracelet", "Structured leather tote", "Simple pearl studs"],
        shoes: ["Leather ballet flats", "Pointed kitten heels", "Suede loafers"],
        palette: ["Ecru", "Camel", "Soft grey", "Navy", "Warm white"],
    },
};

// ── History (localStorage) ─────────────────────────────────────
function getHistory() {
    try { return JSON.parse(localStorage.getItem("wardrobe_history") || "[]"); } catch { return []; }
}
function saveHistory(arr) {
    localStorage.setItem("wardrobe_history", JSON.stringify(arr.slice(0, 20)));
}
function addHistoryEntry(entry) {
    const h = getHistory();
    h.unshift(entry);
    saveHistory(h);
    renderHistory();
}

function renderHistory() {
    const list = document.getElementById("history-list");
    const empty = document.getElementById("history-empty");
    const h = getHistory();
    list.innerHTML = "";
    if (!h.length) { empty.style.display = "block"; return; }
    empty.style.display = "none";
    h.forEach(e => {
        const card = document.createElement("div");
        card.className = "history-card";
        const sc = parseInt(e.score);
        const scoreColor = sc >= 8 ? "score-text-high" : sc >= 6 ? "score-text-mid" : "score-text-low";
        card.innerHTML = `
      ${e.thumb ? `<img src="${e.thumb}" class="history-thumb" alt="Outfit" />` : `<div class="history-thumb-placeholder">👗</div>`}
      <div class="history-info">
        <p class="history-date">${e.date}</p>
        <p class="history-style">${e.style}</p>
        <p class="history-score">Score: <span class="${scoreColor}">${e.score}/10</span></p>
        <div class="tag-row">${(e.tags || []).map(t => `<span class="tag">${t}</span>`).join("")}</div>
      </div>
    `;
        list.appendChild(card);
    });
}

document.getElementById("clear-history").addEventListener("click", () => {
    localStorage.removeItem("wardrobe_history");
    renderHistory();
});

renderHistory();

// ── Model loader ───────────────────────────────────────────────
let clipPipeline = null, modelReady = false;
const loaderBar = document.getElementById("loader-bar");
const loaderFill = document.getElementById("loader-fill");
const loaderText = document.getElementById("loader-text");

async function loadModel() {
    try {
        loaderText.textContent = "Downloading CLIP model (cached after first load)…";
        loaderFill.style.width = "10%";
        clipPipeline = await pipeline("zero-shot-image-classification", "Xenova/clip-vit-base-patch32", {
            progress_callback: (p) => {
                if (p.status === "downloading" && p.total) {
                    const pct = Math.round((p.loaded / p.total) * 80) + 10;
                    loaderFill.style.width = `${pct}%`;
                    loaderText.textContent = `Downloading model… ${pct}%`;
                }
            },
        });
        loaderFill.style.width = "100%";
        loaderText.textContent = "Model ready ✓";
        setTimeout(() => loaderBar.classList.add("done"), 600);
        modelReady = true;
    } catch (e) { loaderText.textContent = `Model load failed: ${e.message}`; }
}
loadModel();

// ── CLIP helpers ───────────────────────────────────────────────
async function classify(imgSrc, labels) {
    if (!clipPipeline) throw new Error("Model not loaded yet.");
    const res = await clipPipeline(imgSrc, labels);
    return res.sort((a, b) => b.score - a.score);
}

function topN(arr, n) { return arr.slice(0, n); }

function fileToObjectURL(file) { return URL.createObjectURL(file); }

// ── Photo analysis ─────────────────────────────────────────────
async function analyseImage(file, thinkingEl) {
    if (!modelReady) throw new Error("AI model is still loading. Please wait.");
    const src = fileToObjectURL(file);

    thinkingEl.textContent = "🔍 Detecting style…";
    const styleRes = await classify(src, STYLES);

    thinkingEl.textContent = "🎨 Detecting colours…";
    const colorRes = await classify(src, COLORS);

    thinkingEl.textContent = "👗 Detecting clothing…";
    const clothRes = await classify(src, CLOTHING);

    const styles = topN(styleRes, 2);
    const colors = topN(colorRes, 3);
    const clothing = topN(clothRes, 3);

    const score = scoreOutfit(clothRes[0].score, colorRes[0].score, styleRes[0].score);

    return { src, styles, colors, clothing, score };
}

// Opening remarks for variety
const OPENING_REMARKS = [
    (s, c, co) => `Love the ${co} ${s} energy!`,
    (s, c, co) => `Great use of ${c} tones in this ${s} look.`,
    (s, c, co) => `The ${co} piece anchors this ${s} outfit perfectly.`,
    (s, c, co) => `${s.charAt(0).toUpperCase() + s.slice(1)} vibes with ${c} undertones — nice!`,
    (s, c, co) => `This ${s} look works well with your ${co}.`,
    (s, c, co) => `Enjoying the ${c} palette in this ${s} arrangement.`,
    (s, c, co) => `The ${co} is a solid choice for this ${s} aesthetic.`,
    (s, c, co) => `You're working that ${s} style with ${c} highlights.`,
];

// Additional tips for variety
const STYLE_TIPS = [
    "Layer strategically to add depth.",
    "Consider proportions for visual balance.",
    "Texture contrast adds visual interest.",
    "One statement piece can elevate the whole look.",
    "Fit is everything — tailoring makes a difference.",
    "Confidence is the best accessory.",
    "Mix high and low pieces for authenticity.",
    "Keep a neutral palette versatile.",
    "Pop of color can transform basics.",
    "Accessories define the mood.",
];

function buildPhotoHTML({ src, styles, colors, clothing, score }) {
    const sc = scoreClass(score);
    const feedback = scoreFeedback(score, styles[0].label);
    const sugg = getSuggestion(styles[0].label);
    const pairs = getColorPairs(colors.map(c => c.label));

    // Dynamic opening remark
    const opening = randomFrom(OPENING_REMARKS)(
        styles[0].label,
        colors[0]?.label || "neutral",
        clothing[0]?.label || "piece"
    );

    // Random style tip
    const tip = randomFrom(STYLE_TIPS);

    return `
    <img src="${src}" alt="Your outfit" />
    <span class="score-badge ${sc}">Rating: ${score}/10</span>
    <p>${opening} ${feedback}</p>
    <p style="margin-top: 6px; font-style: italic; color: #666;">💡 ${tip}</p>
    <div class="section-label">✨ Style vibe</div>
    <div class="tag-row">
      ${styles.map(s => `<span class="tag style">${s.label}</span>`).join("")}
    </div>
    <div class="section-label">Detected colors</div>
    <div class="tag-row">
      ${colors.map(c => `<span class="tag">${c.label}</span>`).join("")}
    </div>
    <div class="section-label">Key pieces</div>
    <div class="tag-row">
      ${clothing.map(c => `<span class="tag">${c.label}</span>`).join("")}
    </div>
    <div class="section-label">💡 Outfit combinations</div>
    <div class="suggestion-block">
      ${sugg.combos.map((c, i) => `${i + 1}. ${c}`).join("\n")}
    </div>
    <div class="section-label">💎 Accessories</div>
    <div class="suggestion-block">
      ${sugg.accessories.map((a, i) => `${i + 1}. ${a}`).join("\n")}
    </div>
    <div class="section-label">👟 Footwear</div>
    <div class="suggestion-block">
      ${sugg.footwear.map((f, i) => `${i + 1}. ${f}`).join("\n")}
    </div>
    ${pairs.length ? `
    <div class="section-label">🌈 Colour pairings</div>
    <div class="tag-row">
      ${pairs.map(p => `<span class="tag">${p}</span>`).join("")}
    </div>
    ` : ""}
  `;
}

// ── Style/colour suggestions (rules-based) ─────────────────────
// Expanded suggestions with more options for variety
const SUGGESTIONS = {
    "casual": {
        combos: [
            "White tee + straight-leg jeans + white sneakers",
            "Oversized hoodie + joggers + chunky trainers",
            "Denim jacket + basic tee + Mom jeans",
            "Striped long-sleeve + jeans + Converse",
            "Relaxed button-down + rolled chinos + loafers",
            "Knit sweater + skinny jeans + ankle boots",
        ],
        accessories: ["Baseball cap", "Canvas tote", "Leather backpack", "Minimalist watch", "Simple pendant necklace", "Canvas belt"],
        footwear: ["White low-top sneakers", "Slip-on loafers", "Converse", "Vans", "New Balance 574s", "Birkenstocks"]
    },
    "streetwear": {
        combos: [
            "Graphic tee + wide-leg cargos + Jordan 1s",
            "Bomber jacket + biker shorts + high-tops",
            "Oversized hoodie + distressed jeans + Yeezys",
            "Puffer vest + long tee + joggers",
            "Windbreaker + crop top + baggy jeans",
            "Vintage band tee + carpenter pants + Dunks",
        ],
        accessories: ["Bucket hat", "Crossbody bag", "Dad cap", "Chain necklace", "Fanny pack", "Snapback"],
        footwear: ["Air Force 1s", "Chunky platform sneakers", "Jordan 1s", "Yeezy 350s", "Dunk Lows", "Nike Dunks"]
    },
    "formal": {
        combos: [
            "Tailored blazer + slim trousers + silk blouse",
            "Midi wrap dress + structured bag",
            "Three-piece suit + silk tie + oxford shoes",
            "Sheath dress + pearl earrings + pointed heels",
            "Fitted blazer + pencil skirt + heeled mules",
            "Tuxedo jacket + slim black trousers + velvet loafers",
        ],
        accessories: ["Pearl earrings", "Leather belt", "Statement watch", "Silk pocket square", "Structured handbag", "Diamond studs"],
        footwear: ["Block-heel pumps", "Pointed-toe loafers", "Oxford shoes", "Kitten heels", "Derby shoes", "Heeled sandals"]
    },
    "business casual": {
        combos: [
            "Knit polo + chino trousers + loafers",
            "Satin blouse + wide-leg trousers + blazer",
            "Button-down + dark jeans + Chelsea boots",
            "Sheath dress + cardigan + closed-toe heels",
            "Midi skirt + tucked blouse + block heels",
            "Turtleneck + tailored pants + pointed flats",
        ],
        accessories: ["Minimalist watch", "Leather tote", "Simple studs", "Leather portfolio", "Thin bracelet", "Silk scarf"],
        footwear: ["White leather sneakers", "Mule heels", "Loafers", "Ankle boots", "Block heels", "Pointed flats"]
    },
    "dark academia": {
        combos: [
            "Plaid blazer + turtleneck + pleated trousers",
            "Oversized trench coat + midi skirt + loafers",
            "Cable-knit vest + white shirt + trousers",
            "Tweed jacket + collared shirt + plaid pants",
            "Long wool coat + sweater + A-line skirt",
            "Waistcoat + billowy shirt + tailored shorts",
        ],
        accessories: ["Round glasses", "Leather satchel", "Tartan scarf", "Vintage watch", "Leather gloves", "Antique brooch"],
        footwear: ["Oxford brogues", "Knee-high boots", "Loafers", "Mary Janes", "Chelsea boots", "Heeled oxfords"]
    },
    "quiet luxury": {
        combos: [
            "Cashmere crew-neck + tailored wide-leg trousers",
            "Silk slip dress + longline coat",
            "Merino turtleneck + wool trousers + leather belt",
            "Linen blazer + silk camisole + wide-leg pants",
            "Monochrome knit set + wool coat",
            "Satin shirt + tailored shorts + bare heels",
        ],
        accessories: ["Gold chain bracelet", "Structured leather bag", "Simple pearl studs", "Silk hair tie", "Leather belt", "Cashmere scarf"],
        footwear: ["Pointed kitten heels", "Leather ballet flats", "Suede loafers", "Minimal heels", "Leather slides", "Satin heels"]
    },
    "Y2K": {
        combos: [
            "Low-rise flare jeans + crop tube top + tinted sunnies",
            "Mini skirt + logo tee + platform boots",
            "Velour tracksuit + chunky sneakers",
            "Butterfly clips + baby tee + cargo pants",
            "Denim mini dress + belt + knee-high boots",
            "Rhinestone tank + low-rise jeans + pointed heels",
        ],
        accessories: ["Butterfly clips", "Tiny tinted glasses", "Rhine-stone choker", "Bedazzled bag", "Frosted lip gloss", "Claw clips"],
        footwear: ["Platform chunky boots", "Strappy heeled sandals", "Buffalo platforms", "Pointed toe boots", "Clear heels", "Kitten heels"]
    },
    "bohemian": {
        combos: [
            "Flowy maxi skirt + off-shoulder blouse + layered necklaces",
            "Wide-leg linen trousers + crochet top",
            "Peasant dress + woven belt + cowboy boots",
            "Kimono jacket + tank + flared jeans",
            "Embroidered tunic + denim shorts + sandals",
            "Fringed vest + maxi dress + ankle boots",
        ],
        accessories: ["Coin pendant necklace", "Woven straw hat", "Stacked bangles", "Leather crossbody", "Feather earrings", "Turquoise rings"],
        footwear: ["Gladiator sandals", "Suede ankle boots", "Espadrille wedges", "Birkenstocks", "Cowboy boots", "Leather sandals"]
    },
    "minimalist": {
        combos: [
            "White Oxford shirt + straight trousers + monochrome shoes",
            "Fitted black turtleneck + tailored trousers",
            "Cream knit + wide-leg pants + white sneakers",
            "Grey wool coat + black jeans + Chelsea boots",
            "Silk cami + high-waisted trousers + pointed flats",
            "Monochrome tee + structured pants + clean trainers",
        ],
        accessories: ["Simple gold hoop earrings", "Clean leather belt", "Thin gold chain", "Minimalist watch", "Leather tote", "Cuff bracelet"],
        footwear: ["White leather sneakers", "Black pointed flats", "Chelsea boots", "Loafers", "Ballerina flats", "Minimal sandals"]
    },
    "athleisure": {
        combos: [
            "Sports bra + high-waist leggings + oversized zip-up",
            "Seamless set + longline puffer vest",
            "Cropped hoodie + biker shorts + chunky trainers",
            "Oversized tee + joggers + dad sneakers",
            "Track jacket + leggings + platform trainers",
            "Zip-up jacket + sports bra + sweatpants",
        ],
        accessories: ["Sporty cap", "Gym duffel bag", "Wireless headphones", "Crossbody belt bag", "Sport watch", "Hair scrunchies"],
        footwear: ["Running sneakers", "Chunky dad trainers", "Hokas", "Nike Air Max", "On Clouds", "New Balance 990s"]
    },
    "cottagecore": {
        combos: [
            "Floral prairie dress + knit cardigan",
            "Puffed-sleeve blouse + A-line midi skirt",
            "Ruffle dress + lace-up boots",
            "Smocked dress + straw hat + basket bag",
            "Bishop-sleeve top + gingham skirt",
            "Vintage-style sundress + cowboy boots",
        ],
        accessories: ["Floral headband", "Wicker basket bag", "Vintage brooch", "Lace gloves", "Pearl barrette", "Ribbon choker"],
        footwear: ["Mary Jane flats", "Tan ankle boots", "Strappy sandals", "Cowboy boots", "Oxford flats", "Ballet flats"]
    },
    "vintage": {
        combos: [
            "High-waist mom jeans + tucked graphic tee + blazer",
            "Pleated midi skirt + ribbed turtleneck",
            "Polka-dot dress + red lipstick + T-strap heels",
            "Wiggle dress + pearl necklace + courts",
            "Capri pants + tucked knit + scarf",
            "Peter Pan collar dress + cardigan",
        ],
        accessories: ["Rectangular vintage sunglasses", "Silk scarf", "Cat-eye glasses", "Pearl necklace", "Vintage handbag", "Brooch"],
        footwear: ["Platform Mary Janes", "Chunky loafers", "T-strap heels", "Saddle shoes", "Brogues", "Kitten heels"]
    },
    "grunge": {
        combos: [
            "Band tee + ripped jeans + flannel shirt tied at waist",
            "Slip dress over band tee + combat boots",
            "Oversized flannel + ripped skinny jeans + Docs",
            "Distressed jeans + dirty Converse + leather jacket",
            "Babydoll dress + combat boots + choker",
            "Long-sleeve thermal + destroyed jeans + boots",
        ],
        accessories: ["Studded belt", "Layered silver chains", "Choker necklace", "Thick black eyeliner", "Leather cuff", "Chain wallet"],
        footwear: ["Black combat boots", "Chunky platform boots", "Doc Martens", "Converse", "Vans", "Demonia platforms"]
    },
    "preppy": {
        combos: [
            "Polo shirt + chino shorts + boat shoes",
            "Cable-knit sweater + pleated skirt + loafers",
            "Oxford shirt + chino pants + ribbon belt",
            "Tennis skirt + cable-knit vest + knee socks",
            "Blazer + crisp white shirt + tailored shorts",
            "Shift dress + cardigan + pearl earrings",
        ],
        accessories: ["Pearl headband", "Canvas tote", "Ribbon belt", "Pearl necklace", "Headscarf", "Tennis bracelet"],
        footwear: ["Sperry boat shoes", "White tennis sneakers", "Loafers", "Ballet flats", "Keds", "Jack Rogers sandals"]
    },
    "edgy": {
        combos: [
            "Leather jacket + ripped skinny jeans + graphic tee",
            "Corset top + wide-leg trousers + moto boots",
            "Mesh top + latex pants + platform boots",
            "Studded jacket + black jeans + chain details",
            "Cutout bodysuit + leather pants + boots",
            "Industrial harness + fitted black ensemble",
        ],
        accessories: ["Chunky silver rings", "Studded bag", "Spike choker", "Harness", "Chain belt", "Leather gloves"],
        footwear: ["Black moto ankle boots", "Patent leather platform shoes", "Demonia boots", "Chunky Dr. Martens", "Platform creepers", "Combat boots"]
    },
    "romantic": {
        combos: [
            "Floral midi dress + lace cardigan",
            "Ruffle-trim blouse + satin midi skirt",
            "Tulle skirt + fitted top + pearl earrings",
            "Wrap dress with bishop sleeves + delicate heels",
            "Lace dress + soft curls + dainty jewellery",
            "Peasant top + flowing skirt + flower crown",
        ],
        accessories: ["Delicate pearl earrings", "Mini chain bag", "Floral hair clip", "Locket necklace", "Lace gloves", "Satin ribbon"],
        footwear: ["Strappy heeled sandals", "Ballet flats", "Pink pumps", "Block heels", "Lace-up flats", "Rose-gold sandals"]
    },
};
const FALLBACK = {
    combos: ["Tonal monochrome look", "Layered look with longline blazer", "Structured basics with a statement piece"],
    accessories: ["Minimalist jewellery", "Structured bag", "Classic watch"],
    footwear: ["White leather sneakers", "Clean loafers", "Ankle boots"]
};

function getSuggestion(style) {
    const key = Object.keys(SUGGESTIONS).find(k => style && style.toLowerCase().includes(k));
    const base = SUGGESTIONS[key] || FALLBACK;
    // Return randomized subset for variety
    return {
        combos: shuffleArray(base.combos).slice(0, 3),
        accessories: shuffleArray(base.accessories).slice(0, 2),
        footwear: shuffleArray(base.footwear).slice(0, 2)
    };
}

const COLOR_PAIRS = { black: ["white", "camel", "burgundy", "cobalt blue", "blush pink"], white: ["navy", "black", "sage green", "dusty rose", "camel"], grey: ["pink", "yellow", "cobalt", "white", "burgundy"], navy: ["white", "camel", "blush", "light grey", "cream"], beige: ["white", "brown", "olive", "burgundy", "dusty rose"], brown: ["cream", "rust orange", "forest green", "tan", "white"], red: ["navy", "white", "black", "camel", "light grey"], pink: ["grey", "white", "navy", "mint green", "black"], green: ["cream", "camel", "brown", "white", "burgundy"], blue: ["white", "grey", "camel", "beige", "navy"], purple: ["grey", "white", "dusty pink", "camel", "black"], yellow: ["grey", "white", "navy", "black", "light blue"], orange: ["navy", "white", "brown", "cream", "black"], burgundy: ["camel", "cream", "grey", "pink", "navy"], cream: ["brown", "navy", "sage green", "black", "beige"] };
function getColorPairs(detectedColors) {
    const pairs = new Set();
    detectedColors.forEach(c => {
        const key = Object.keys(COLOR_PAIRS).find(k => c.toLowerCase().includes(k));
        if (key) COLOR_PAIRS[key].forEach(p => pairs.add(p));
    });
    return [...pairs].slice(0, 5);
}

// ── Chat bubble helpers ────────────────────────────────────────
function appendBubble(container, role, content, isHTML = false) {
    const wrap = document.createElement("div");
    wrap.className = `bubble-wrap ${role}`;
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    if (isHTML) bubble.innerHTML = content;
    else bubble.textContent = content;
    wrap.appendChild(bubble);
    container.appendChild(wrap);
    container.scrollTop = container.scrollHeight;
}
function appendThinking(container, msg = "Thinking…") {
    const el = document.createElement("div");
    el.className = "thinking"; el.textContent = msg;
    container.appendChild(el); container.scrollTop = container.scrollHeight;
    return el;
}

// ── Tab switching ──────────────────────────────────────────────
document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach(s => s.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");
    });
});

// ── Photo tab ──────────────────────────────────────────────────
const photoMessages = document.getElementById("photo-messages");
appendBubble(photoMessages, "assistant", "Upload or capture a photo of your outfit. I'll rate it, detect the style, and suggest matching combinations — all on your device.");

async function handleImageFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    const thinking = appendThinking(photoMessages, "Starting analysis…");
    try {
        const result = await analyseImage(file, thinking);
        thinking.remove();
        appendBubble(photoMessages, "assistant", buildPhotoHTML(result), true);

        // save to history
        const reader = new FileReader();
        reader.onload = e => {
            addHistoryEntry({
                date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
                style: result.styles.map(s => s.label).join(", "),
                score: result.score,
                thumb: e.target.result,
                tags: result.styles.map(s => s.label),
            });
        };
        reader.readAsDataURL(file);
    } catch (e) {
        thinking.remove();
        appendBubble(photoMessages, "assistant", `⚠️ ${e.message}`);
    }
}

const fileUpload = document.getElementById("file-upload");
const cameraUpload = document.getElementById("camera-upload");
document.getElementById("btn-upload").addEventListener("click", () => fileUpload.click());
fileUpload.addEventListener("change", e => { handleImageFile(e.target.files[0]); e.target.value = ""; });
document.getElementById("btn-camera").addEventListener("click", () => cameraUpload.click());
cameraUpload.addEventListener("change", e => { handleImageFile(e.target.files[0]); e.target.value = ""; });

const dropzone = document.getElementById("dropzone");
dropzone.addEventListener("click", () => fileUpload.click());
dropzone.addEventListener("dragover", e => { e.preventDefault(); dropzone.classList.add("drag-over"); });
dropzone.addEventListener("dragleave", () => dropzone.classList.remove("drag-over"));
dropzone.addEventListener("drop", e => { e.preventDefault(); dropzone.classList.remove("drag-over"); handleImageFile(e.dataTransfer.files[0]); });

// ── Occasion tab ───────────────────────────────────────────────
let selectedOcc = null, selectedGender = "any", selectedSkin = "fair";

document.querySelectorAll(".occ-btn").forEach(btn => {
    if (!btn.dataset.occ) return;
    btn.addEventListener("click", () => {
        document.querySelectorAll(".occ-btn[data-occ]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active"); selectedOcc = btn.dataset.occ;
    });
});
document.querySelectorAll(".pill-btn[data-gender]").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".pill-btn[data-gender]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active"); selectedGender = btn.dataset.gender;
    });
});
document.querySelectorAll(".skin-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".skin-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active"); selectedSkin = btn.dataset.skin;
    });
});

document.getElementById("occ-submit").addEventListener("click", () => {
    const res = document.getElementById("occ-result");
    if (!selectedOcc) { res.textContent = "Please select an occasion first."; res.hidden = false; return; }

    const occData = OCC[selectedOcc];
    let data;

    // Select appropriate data based on gender preference
    if (selectedGender === "any" || selectedGender === "unisex") {
        data = occData.unisex || occData.feminine;
    } else if (selectedGender === "feminine") {
        data = occData.feminine;
    } else if (selectedGender === "masculine") {
        data = occData.masculine;
    } else {
        data = occData.unisex || occData.feminine;
    }

    // Get skin tone recommendations
    const skinRec = SKIN_COLOR_REC[selectedSkin] || SKIN_COLOR_REC.fair;

    const gNote = selectedGender !== "any" ? ` (${selectedGender} preference)` : "";
    res.textContent = `Occasion: ${selectedOcc.charAt(0).toUpperCase() + selectedOcc.slice(1)}${gNote}\n\n` +
        `👗 Outfit ideas:\n${data.outfits.map((o, i) => `${i + 1}. ${o}`).join("\n")}\n\n` +
        `💎 Accessories:\n${data.acc.map((a, i) => `${i + 1}. ${a}`).join("\n")}\n\n` +
        `👟 Footwear:\n${data.shoes.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\n` +
        `🎨 Best colors for your skin tone (${selectedSkin}):\n${skinRec.best.map((c, i) => `${i + 1}. ${c}`).join("\n")}\n\n` +
        `⚠️ Colors to avoid:\n${skinRec.avoid.map((c, i) => `${i + 1}. ${c}`).join("\n")}\n\n` +
        `✨ Metal tones: ${skinRec.metals.join(" · ")}\n\n` +
        `💡 Tip: ${skinRec.tip}`;
    res.hidden = false;
});

// ── Weather tab ────────────────────────────────────────────────
let selectedWeather = "sunny", selectedDest = "outdoors";

const tempSlider = document.getElementById("temp-slider");
const tempVal = document.getElementById("temp-val");
tempSlider.addEventListener("input", () => { tempVal.textContent = `${tempSlider.value}°C`; });

document.querySelectorAll(".occ-btn[data-weather]").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".occ-btn[data-weather]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active"); selectedWeather = btn.dataset.weather;
    });
});
document.querySelectorAll(".occ-btn[data-dest]").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".occ-btn[data-dest]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active"); selectedDest = btn.dataset.dest;
    });
});

document.getElementById("weather-submit").addEventListener("click", () => {
    const res = document.getElementById("weather-result");
    const temp = parseInt(tempSlider.value);
    res.textContent = `Weather: ${selectedWeather}, ${temp}°C, ${selectedDest}\n\n` + getWeatherSuggestion(temp, selectedWeather, selectedDest);
    res.hidden = false;
});

// ── Trends tab ─────────────────────────────────────────────────
document.querySelectorAll(".trend-card").forEach(card => {
    card.addEventListener("click", () => {
        document.querySelectorAll(".trend-card").forEach(c => c.classList.remove("active"));
        card.classList.add("active");
        const t = TRENDS[card.dataset.trend];
        const res = document.getElementById("trend-result");
        res.textContent =
            `${t.icon} ${t.name}\n${t.desc}\n\n` +
            `👗 Signature looks:\n${t.looks.map((l, i) => `${i + 1}. ${l}`).join("\n")}\n\n` +
            `💎 Key accessories:\n${t.acc.map((a, i) => `${i + 1}. ${a}`).join("\n")}\n\n` +
            `👟 Footwear:\n${t.shoes.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\n` +
            `🎨 Colour palette: ${t.palette.join(" · ")}`;
        res.hidden = false;
    });
});
