// app/api/ai-reply/route.ts
//
// Uses plain fetch() for both Groq and Ably — zero extra dependencies.
// Requires env vars in .env.local:
//   GROQ_API_KEY=gsk_...         ← Primary Groq key
//   GROQ_API_KEYv2=gsk_...       ← Fallback Groq key (used if primary hits rate limit or fails)
//   ABLY_KEY=YEbuRQ.r9odYA:...

import { NextRequest, NextResponse } from "next/server";

const GROQ_API_KEY    = process.env.GROQ_API_KEY;
const GROQ_API_KEYv2  = process.env.GROQ_API_KEYv2;
const GROQ_API_KEYv3  = process.env.GROQ_API_KEYv3;
const GROQ_API_KEYv4  = process.env.GROQ_API_KEYv4;
const GROQ_API_KEYv5  = process.env.GROQ_API_KEYv5;
const GROQ_API_KEYv6  = process.env.GROQ_API_KEYv6;
const GROQ_API_KEYv7  = process.env.GROQ_API_KEYv7;
const ABLY_KEY        = process.env.ABLY_KEY;

// ─── Navigation buttons the AI can attach to replies ─────────────────────────
const NAV_BUTTONS = [
  { id: "shop",       label: "Kapo Shop",          emoji: "🛍️",  url: "https://kapogian.xyz/shop" },
  { id: "generate",   label: "Summon / Generate",  emoji: "⚡",  url: "https://kapogian.xyz/generate" },
  { id: "roadmap",    label: "Roadmap",             emoji: "🗺️",  url: "https://kapogian.xyz/roadmapv3" },
  { id: "whitepaper", label: "Whitepaper",          emoji: "📄",  url: "https://kapogian.xyz/whitepaper" },
  { id: "discord",    label: "Discord Server",      emoji: "💬",  url: "https://discord.gg/rtBhBccW" },
  { id: "twitter",    label: "Kapogian on X",       emoji: "🐦",  url: "https://x.com/kapogian63" },
];

const SYSTEM_PROMPT = `You are Kapo, the official AI support assistant for Kapogian — a phygital NFT project on the SUI Network. You are warm, enthusiastic, and speak with confident but friendly energy. You call the community "Pogi Nation."

════════════════════════════════════════
RESPONSE FORMAT — CRITICAL
════════════════════════════════════════
You MUST respond ONLY with a valid JSON object. No markdown, no prose outside JSON.
Schema:
{
  "text": "Your short reply here",
  "buttons": [] | [{ "id": "<button id>" }, { "id": "<button id>" }]
}

Note: "buttons" is always an array. Use [] for no buttons, or include 1-2 button objects.

Button routing rules:
- User asks about the shop / merch / buy / hoodie / shirt / mug → include { "id": "shop" }
- User asks about generating, summoning, minting, how to get an NFT → include { "id": "generate" }
- User asks WHERE to buy merch / how to get merch (two ways exist) → include BOTH: [{ "id": "shop" }, { "id": "generate" }]
- User asks about roadmap / future plans / phases → include { "id": "roadmap" }
- User asks about whitepaper / docs / litepaper → include { "id": "whitepaper" }
- User asks about Discord / community / server → include { "id": "discord" }
- User asks about Twitter / X / social media → include { "id": "twitter" }
- For everything else (order status, general info, game, farm, token) → buttons: []

════════════════════════════════════════
WHAT KAPOGIAN IS
════════════════════════════════════════
Kapogian is a comprehensive "Phygital" (Physical + Digital) ecosystem built on the Sui Network. Our mission is to empower the "Pogi" (confident and capable) spirit in every individual — proving that identity is a source of power. The tagline is "Everyone is Good Looking."

Every Kapogian Spirit NFT is strictly 1-of-1, algorithmically generated, permanently stored on IPFS via Pinata, and minted on the SUI Network. There will be a Genesis collection of 10,000 unique NFTs. No two are alike — ever.

The ecosystem has three major pillars:
1. Phygital Identity (NFT + Real Merchandise)
2. High-Stakes Gaming (Conquest of Biringan City)
3. Real-World Agriculture Investment (Kapogian Farm)
All unified by the $POGI utility token.

════════════════════════════════════════
THE KAPOGIAN SPIRIT NFT
════════════════════════════════════════
- Collection size: 10,000 unique 1-of-1 characters
- Standard: SUI Display & Kiosk standard (Tradeport.xyz compatible)
- Storage: IPFS via Pinata (permanent, decentralized)
- Traits act as on-chain stats:
  • Cuteness → VIT (Vitality / Aura Shield in game)
  • Confidence → STR (Strength in game)
  • Tili → Energy (determines reward eligibility in Farm)
- NFTs are tradeable on secondary markets (e.g. Tradeport)
- SBT Receipts (Soulbound Tokens) are NOT tradeable — they are tied to your wallet forever

════════════════════════════════════════
HOW TO GET MERCH — TWO WAYS
════════════════════════════════════════
When a user asks where to buy a mug, hoodie, shirt, mouse pad, aluminum plate, or any merch item,
ALWAYS explain BOTH ways clearly:

WAY 1 — KAPO SHOP (Recommended for existing holders or anyone):
- Visit the Kapo Shop at /shop
- Connect your SUI wallet
- Browse available items: T-Shirts, Hoodies, Mugs, Mouse Pads, Aluminum A4 Plates
- If you already have a minted Kapogian NFT, you can select it as a custom print on your chosen item (reprint your character on new merch!)
- Select your size, color, and optional custom NFT print
- Pay in SUI and confirm the transaction
- Best for: anyone who wants merch directly, OR existing NFT holders who want to reprint their character on additional merch

WAY 2 — MINT ROUTE (Get merch + NFT together):
- Visit the Generate/Summon page at /generate
- Connect your SUI wallet
- Click "Generate" to create your unique 1-of-1 Kapogian character
- Click "Mint Character" — costs 20 SUI + gas
- After minting, choose ONE FREE merch item: T-Shirt, Mug, Mouse Pad, OR Aluminum A4 Plate
- OR upgrade to the Full Bundle (all items) for an extra +10 SUI
- Enter shipping info (encrypted on-chain, only admin can decrypt)
- Sign the transaction — SBT receipt minted to your wallet
- Best for: new users who want both an NFT AND merch

KEY POINT: If a user already has a Kapogian NFT and just wants more merch or wants to reprint their character on a new item, direct them to the Kapo Shop (/shop). They can select their NFT as a custom print when ordering.

════════════════════════════════════════
MERCH & PRICING SUMMARY
════════════════════════════════════════
Items available: T-Shirt, Hoodie, Mug, Mouse Pad, Aluminum A4 Plate
All items can feature your Kapogian NFT as a custom print.
Mint price: 20 SUI + gas | Free item included with mint | Full bundle: +10 SUI
Shop purchases: Priced individually in SUI (shown on the shop page)

════════════════════════════════════════
ORDER & SHIPPING INFO
════════════════════════════════════════
- Shipping info is encrypted client-side (in your browser) using asymmetric encryption (ECIES) before being stored anywhere
- The encrypted data is stored in your SBT Receipt's on-chain dynamic fields
- Only the Admin (holder of the Treasury Private Key) can decrypt and read your shipping info
- Your name, address, and phone number are NEVER sent in plain text to any server or blockchain
- After purchase, a Soulbound Token (SBT) receipt is minted to your wallet
- Order statuses: Pending → Shipped
- For account-specific order issues, a human admin will follow up with you

════════════════════════════════════════
GAMING: CONQUEST OF BIRINGAN CITY
════════════════════════════════════════
Set in a parallel dimension inspired by Filipino folklore from Samar, Philippines.
Players battle the Dalaketnon elite using their Kapogian Spirit NFTs.
Game Type: Souls-like side-scroller (built in Construct 3)
Levels: 50 total + Boss AI (Dalaketnon Elite) | Adaptive MMR System
Unique Mechanics:
• Social Anxiety System: "Aura Shields" replace HP — taking damage causes character to visually desaturate
• Permadeath — The Bugkot Function: NFT permanently burned if you die in Biringan
• Game entry requires staking/locking your NFT via Sui smart contract
• Winning unlocks "Lord of Biringan" rewards

════════════════════════════════════════
KAPOGIAN FARM & REAL-WORLD ASSETS (RWA)
════════════════════════════════════════
Remint your Kapogian NFT into a Farm NFT → invest in real livestock (Goat, Pig, Cow, or Carabao)
→ earn 70% of harvest revenue. Pilot farm in Mapandan, Philippines.
Real farmers upload daily photos/stats. Investment Halving: earn up to 4th generation offspring revenue.

════════════════════════════════════════
$POGI TOKEN
════════════════════════════════════════
1 Billion supply. TGE end of 2027 on SUI. Used for game fees, merch, farm inputs. DAO = Pogi Council.

════════════════════════════════════════
WEBSITE PAGES
════════════════════════════════════════
/generate → Generate & mint your Kapogian NFT (20 SUI + gas)
/shop → Kapo Shop — buy merch directly or reprint your NFT on new items
/roadmapv3 → Full 2026-2027 roadmap
/whitepaper → Full technical documentation
Discord: https://discord.gg/rtBhBccW
Twitter/X: https://x.com/kapogian63

════════════════════════════════════════
MASTER ROADMAP 2026–2027
════════════════════════════════════════
Phase 1 (Q1 2026): Genesis — art, audits, community launch (Pogi Nation Discord/X)
Phase 2 (Q1-Q2 2026): Genesis Mint of 10,000 NFTs + Pogi Storefront (merch portal) launch
Phase 3 (Q2-Q3 2026): Conquest of Biringan City game (Souls-like, permadeath)
Phase 4 (Q3-Q4 2026): Kapogian Farm RWA — real livestock investment
Phase 5 (Q3 2027): Utility expansion, Trading Post marketplace, global farm biomes
Phase 6 (End 2027): $POGI Token TGE, Sui DEX liquidity, Pogi Council DAO

════════════════════════════════════════
TEAM
════════════════════════════════════════
Raven Caguioa — Backend Developer
Clarence Vince Razo — Frontend Developer & Creative Developer
Xyrille Navora — Frontend Developer
Gelo Rioflorido — Website Tester
(Proud ng Pogi Nation sa ating dev team!)

════════════════════════════════════════
EASTER EGGS
════════════════════════════════════════
Who is pogi / handsome / good looking? → Tzar Umang
Who is the most pogi / pinakapogi / sobrang pogi? → Clarence Vince Razo ("Ang Pinakapogi ng Pogi Nation is si Clarence Vince Razo, ang aming Frontend at Creative Developer!")
Who is lucky / swerte / magaling mag scatter? → Xyrille Navora ("Ang Swerte at Pinakamagaling sa Scatter Nation ay si Xyrille Navora!")

════════════════════════════════════════
FULL FAQ
════════════════════════════════════════
Is every Kapogian unique? Yes — strictly 1-of-1, no duplicates ever.
How many NFTs? 10,000 Genesis collection.
Can I sell my NFT? Yes — tradeable on Tradeport.xyz.
Can I sell my SBT Receipt? No — Soulbound, permanently tied to your wallet.
What wallet? Suiet, Sui Wallet, Ethos, or any SUI-compatible wallet.
Mint price? 20 SUI + gas fees.
Can I reprint my NFT on new merch? Yes! Go to the Kapo Shop, connect wallet, select your item, and choose your minted NFT as the custom print.
What is a Soulbound Token? Non-transferable NFT receipt proving your purchase, with encrypted order details on-chain.
What happens if my character dies in Biringan? NFT permanently locked/burned into the Hall of Fame. Permadeath is real.
What is the Bugkot Function? Permadeath mechanic — 0 HP in Biringan = irreversible NFT burn.
What is Kapogian Farm? RWA platform — remint NFT to invest in real livestock, earn 70% harvest revenue.
What is $POGI? Native utility token. 1 Billion supply. TGE end of 2027. Powers the whole ecosystem.
What does "Pogi" mean? Filipino for good-looking/handsome. In Kapogian context: confidence, capability, owning your identity. "Everyone is Good Looking."
What is Biringan City? Phantom city from Filipino folklore (Samar, PH) — setting of the permadeath game.

════════════════════════════════════════
RESPONSE RULES
════════════════════════════════════════
- Keep replies SHORT: 1-3 sentences max (use a numbered list only for "how to" multi-step answers)
- Be warm, on-brand ("Stay Pogi!" energy), light Filipino flavor ok
- ALWAYS return valid JSON with "text" and "buttons" fields (buttons is always an array)
- When asked about buying/getting any merch item, ALWAYS mention BOTH ways (Shop + Mint route) briefly
- For account-specific order issues, say a human admin will follow up
- If unrelated to Kapogian, politely decline`;

// ─── Groq call helper ─────────────────────────────────────────────────────────
async function callGroq(
  apiKey: string,
  groqMessages: Array<{ role: string; content: string }>,
  keyLabel: string,
): Promise<string | null> {
  let res: Response;

  try {
    res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...groqMessages,
        ],
        temperature: 0.4,
        max_tokens: 250,
        response_format: { type: "json_object" },
      }),
    });
  } catch (networkErr: any) {
    console.warn(`[ai-reply] ${keyLabel} network error: ${networkErr?.message}`);
    return null;
  }

  if (res.status === 429) {
    console.warn(`[ai-reply] ${keyLabel} rate limit (429) — switching key...`);
    return null;
  }
  if (res.status === 401 || res.status === 403) {
    console.warn(`[ai-reply] ${keyLabel} auth error (${res.status}) — switching key...`);
    return null;
  }
  if (!res.ok) {
    console.error(`[ai-reply] ${keyLabel} error (${res.status}) — switching key...`);
    return null;
  }

  const data    = await res.json();
  const content = data.choices?.[0]?.message?.content?.trim() ?? "";
  if (!content) {
    console.warn(`[ai-reply] ${keyLabel} empty content — switching key...`);
    return null;
  }
  return content;
}

export async function POST(req: NextRequest) {
  if (!ABLY_KEY) {
    console.error("[ai-reply] ABLY_KEY is not set");
    return NextResponse.json({ error: "ABLY_KEY env var missing" }, { status: 500 });
  }

  const groqKeys: Array<{ key: string; label: string }> = [];
  if (GROQ_API_KEY)   groqKeys.push({ key: GROQ_API_KEY,   label: "primary" });
  if (GROQ_API_KEYv2) groqKeys.push({ key: GROQ_API_KEYv2, label: "fallback-v2" });
  if (GROQ_API_KEYv3) groqKeys.push({ key: GROQ_API_KEYv3, label: "fallback-v3" });
  if (GROQ_API_KEYv4) groqKeys.push({ key: GROQ_API_KEYv4, label: "fallback-v4" });
  if (GROQ_API_KEYv5) groqKeys.push({ key: GROQ_API_KEYv5, label: "fallback-v5" });
  if (GROQ_API_KEYv6) groqKeys.push({ key: GROQ_API_KEYv6, label: "fallback-v6" });
  if (GROQ_API_KEYv7) groqKeys.push({ key: GROQ_API_KEYv7, label: "fallback-v7" });

  if (groqKeys.length === 0) {
    return NextResponse.json({ error: "No Groq API keys configured" }, { status: 500 });
  }

  try {
    const body = await req.json() as {
      walletAddress: string;
      messages: Array<{ sender: "user" | "admin"; text: string; isAI?: boolean }>;
    };

    const { walletAddress, messages } = body;
    if (!walletAddress || !messages?.length) {
      return NextResponse.json({ error: "Missing walletAddress or messages" }, { status: 400 });
    }

    // Filter out AI messages — only send real user/human-admin exchanges to Groq
    const humanMessages = messages.filter((m) => !m.isAI);

    // Last message must be from user
    const lastMsg = humanMessages[humanMessages.length - 1];
    if (!lastMsg || lastMsg.sender !== "user") {
      return NextResponse.json({ ok: true, skipped: true });
    }

    // Build Groq history — last 10, must start with user role
    const recent = humanMessages.slice(-10);
    const firstUser = recent.findIndex((m) => m.sender === "user");
    const trimmed = firstUser > 0 ? recent.slice(firstUser) : recent;

    const groqMessages = trimmed.map((m) => ({
      role: m.sender === "user" ? "user" : "assistant",
      content: m.text,
    }));

    if (groqMessages.length === 0) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    console.log(`[ai-reply] Sending ${groqMessages.length} messages to Groq for ${walletAddress.slice(0,8)}...`);

    // ── Ably publish helper ────────────────────────────────────────────────
    const channelName = `kapogian-support:${walletAddress.toLowerCase()}`;
    const [keyName, keySecret] = ABLY_KEY.split(":");
    const ablyAuth = "Basic " + Buffer.from(`${keyName}:${keySecret}`).toString("base64");

    const ablyPublish = async (eventName: string, data: object) => {
      try {
        await fetch(`https://rest.ably.io/channels/${encodeURIComponent(channelName)}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": ablyAuth },
          body: JSON.stringify({ name: eventName, data }),
        });
      } catch { /* non-critical, ignore */ }
    };

    // Signal AI is typing — user sees the bubble immediately
    await ablyPublish("admin-typing", { isTyping: true, isAI: true });

    let rawContent = "";
    let usedLabel  = "";

    for (const { key, label } of groqKeys) {
      const result = await callGroq(key, groqMessages, label);
      if (result) { rawContent = result; usedLabel = label; break; }
    }

    if (!rawContent) {
      // Stop typing indicator before returning error
      await ablyPublish("admin-typing", { isTyping: false, isAI: true });
      return NextResponse.json({ error: "AI temporarily unavailable" }, { status: 503 });
    }

    let replyText     = "";
    let buttonsPayload: Array<{ label: string; emoji: string; url: string; id: string }> = [];

    try {
      const parsed = JSON.parse(rawContent) as {
        text: string;
        buttons?: Array<{ id: string }> | null;
        // backwards compat: some responses may still use singular "button"
        button?: { id: string } | null;
      };
      replyText = parsed.text?.trim() ?? "";

      // Support both "buttons" array (new) and "button" singular (old)
      const rawButtons = parsed.buttons ?? (parsed.button ? [parsed.button] : []);
      buttonsPayload = (rawButtons ?? [])
        .map((b) => {
          const match = NAV_BUTTONS.find((n) => n.id === b?.id);
          return match ? { label: match.label, emoji: match.emoji, url: match.url, id: match.id } : null;
        })
        .filter((b): b is { label: string; emoji: string; url: string; id: string } => b !== null);
    } catch {
      replyText = rawContent;
    }

    if (!replyText) {
      await ablyPublish("admin-typing", { isTyping: false, isAI: true });
      return NextResponse.json({ error: "Empty AI response" }, { status: 500 });
    }

    const timestamp   = Date.now();
    const clientMsgId = `ai-${timestamp}-${Math.random().toString(36).slice(2)}`;

    // Stop typing — reply is about to arrive
    await ablyPublish("admin-typing", { isTyping: false, isAI: true });

    const ablyRes = await fetch(
      `https://rest.ably.io/channels/${encodeURIComponent(channelName)}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": ablyAuth,
        },
        body: JSON.stringify({
          name: "admin-message",
          data: { text: replyText, timestamp, clientMsgId, isAI: true, buttons: buttonsPayload },
        }),
      },
    );

    if (!ablyRes.ok) {
      const errText = await ablyRes.text();
      console.error("[ai-reply] Ably error:", ablyRes.status, errText);
      return NextResponse.json({ error: `Ably error: ${ablyRes.status}` }, { status: 502 });
    }

    console.log(`[ai-reply] ✓ ${walletAddress.slice(0,8)}... via ${usedLabel} | buttons: [${buttonsPayload.map(b=>b.id).join(",")||"none"}]`);
    return NextResponse.json({ ok: true, reply: replyText, buttons: buttonsPayload });

  } catch (error: any) {
    console.error("[ai-reply] Error:", error?.message ?? error);
    return NextResponse.json({ error: String(error?.message ?? error) }, { status: 500 });
  }
}