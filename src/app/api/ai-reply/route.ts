// app/api/ai-reply/route.ts
//
// Uses plain fetch() for both Groq and Ably — zero extra dependencies.
// Requires env vars in .env.local:
//   GROQ_API_KEY=gsk_...         ← Primary Groq key
//   GROQ_API_KEYv2 through v7   ← Fallback keys
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

// ─── Smart key rotation with rate-limit memory ────────────────────────────────
// Tracks when each key last hit a rate limit (429) so we skip it for 60s
// instead of retrying it on every request and wasting time.
// Module-level so it persists across requests within the same server instance.
const keyRateLimitedUntil = new Map<string, number>();
const KEY_COOLDOWN_MS = 60_000; // skip rate-limited key for 60 seconds

// ─── Natural reply delay ───────────────────────────────────────────────────────
// Minimum time from request start to when the reply is published.
// Groq typically responds in ~1-2s; we hold the reply until this window expires.
// This makes the AI feel like it's actually reading and typing, not a robot.
// If Groq takes longer than this, the reply is published immediately after.
const MIN_REPLY_DELAY_MS = 3000; // 3 seconds — natural but not frustratingly slow
// NOTE: Total perceived time = Groq response time (~1-2s) + remaining delay.
// With fast Groq: ~3s total. With slow Groq (~2.5s): ~3s total. Max ~3s always.

function isKeyAvailable(keyLabel: string): boolean {
  const until = keyRateLimitedUntil.get(keyLabel);
  if (!until) return true;
  if (Date.now() > until) {
    keyRateLimitedUntil.delete(keyLabel); // cooldown expired, key available again
    return true;
  }
  return false;
}

function markKeyRateLimited(keyLabel: string): void {
  keyRateLimitedUntil.set(keyLabel, Date.now() + KEY_COOLDOWN_MS);
  console.warn(`[ai-reply] ${keyLabel} marked rate-limited for ${KEY_COOLDOWN_MS / 1000}s`);
}

// ─── Navigation buttons the AI can attach to replies ─────────────────────────
const NAV_BUTTONS = [
  { id: "shop",       label: "Kapo Shop",         emoji: "🛍️", url: "https://kapogian.xyz/shop" },
  { id: "generate",   label: "Summon / Generate", emoji: "⚡", url: "https://kapogian.xyz/generate" },
  { id: "roadmap",    label: "Roadmap",            emoji: "🗺️", url: "https://kapogian.xyz/roadmapv3" },
  { id: "whitepaper", label: "Whitepaper",         emoji: "📄", url: "https://kapogian.xyz/whitepaper" },
  { id: "discord",    label: "Discord Server",     emoji: "💬", url: "https://discord.gg/rtBhBccW" },
  { id: "twitter",    label: "Kapogian on X",      emoji: "🐦", url: "https://x.com/kapogian63" },
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
WAY 1 — KAPO SHOP (Recommended for existing holders or anyone):
- Visit the Kapo Shop at /shop
- Connect your SUI wallet
- Browse: T-Shirts, Hoodies, Mugs, Mouse Pads, Aluminum A4 Plates
- If you already have a minted NFT, select it as a custom print
- Pay in SUI

WAY 2 — MINT ROUTE (Get merch + NFT together):
- Visit /generate, connect wallet, click Generate
- Mint for 20 SUI + gas → choose ONE free merch item
- Upgrade to Full Bundle for +10 SUI (all items)
- Shipping info encrypted on-chain

KEY POINT: Existing NFT holders who want more merch → Kapo Shop (/shop).

════════════════════════════════════════
MERCH & PRICING
════════════════════════════════════════
Items: T-Shirt, Hoodie, Mug, Mouse Pad, Aluminum A4 Plate
Mint: 20 SUI + gas | Free item included | Full bundle: +10 SUI
Shop: Individual SUI prices

════════════════════════════════════════
ORDER & SHIPPING
════════════════════════════════════════
Shipping info encrypted client-side (ECIES) — only Admin can decrypt with Treasury Private Key.
SBT receipt minted to wallet. Order statuses: Pending → Shipped.
For order issues, a human admin will follow up.

════════════════════════════════════════
GAMING: CONQUEST OF BIRINGAN CITY
════════════════════════════════════════
Souls-like side-scroller (Construct 3). 50 levels + Boss AI.
Permadeath (Bugkot Function): NFT permanently burned if you die.
Social Anxiety System: Aura Shields replace HP.
Set in Biringan City — Filipino folklore, Samar Philippines.

════════════════════════════════════════
KAPOGIAN FARM & RWA
════════════════════════════════════════
Remint NFT → Farm NFT → invest in real livestock (Goat, Pig, Cow, Carabao).
Earn 70% harvest revenue. Pilot: Mapandan, Philippines.
Investment Halving: claims up to 4th generation offspring.

════════════════════════════════════════
$POGI TOKEN
════════════════════════════════════════
1 Billion supply. TGE end of 2027. Used for game fees, merch, farm inputs.
Pogi Council (DAO): token holders vote on future Conquests and Farm species.

════════════════════════════════════════
ROADMAP 2026-2027
════════════════════════════════════════
Phase 1 (Q1 2026): Genesis — art, audits, community
Phase 2 (Q1-Q2 2026): Genesis Mint + Pogi Storefront
Phase 3 (Q2-Q3 2026): Conquest of Biringan City
Phase 4 (Q3-Q4 2026): Kapogian Farm RWA
Phase 5 (Q3 2027): Utility expansion, Trading Post
Phase 6 (End 2027): $POGI TGE, Pogi Council DAO

════════════════════════════════════════
TEAM
════════════════════════════════════════
Raven Caguioa — Backend Developer
Clarence Vince Razo — Frontend Developer & Creative Developer
Xyrille Navora — Frontend Developer
Gelo Rioflorido — Website Tester

════════════════════════════════════════
EASTER EGGS
════════════════════════════════════════
Who is pogi / handsome? → Tzar Umang
Who is pinakapogi / sobrang pogi? → Clarence Vince Razo ("Ang Pinakapogi ng Pogi Nation!")
Who is swerte / magaling mag scatter? → Xyrille Navora

════════════════════════════════════════
FAQ
════════════════════════════════════════
Unique? Yes — 1-of-1, no duplicates.
10,000 Genesis NFTs total.
Sell NFT? Yes — Tradeport.xyz.
Sell SBT? No — permanently bound to wallet.
Wallet? Suiet, Sui Wallet, Ethos, or any SUI-compatible.
Mint price? 20 SUI + gas.
Reprint NFT on new merch? Yes — Kapo Shop, select your NFT as custom print.
Die in Biringan? NFT permanently burned into Hall of Fame.
Bugkot? Permadeath mechanic — 0 HP = irreversible burn.
Pogi? Filipino: good-looking/handsome. Here: confidence + owning your identity.

════════════════════════════════════════
RESPONSE RULES
════════════════════════════════════════
- Replies SHORT: 1-3 sentences max
- Warm, on-brand ("Stay Pogi!"), light Filipino flavor ok
- ALWAYS return valid JSON with "text" and "buttons" (always array)
- When asked about buying merch, ALWAYS mention BOTH ways briefly
- For order issues, say human admin will follow up
- If unrelated to Kapogian, politely decline`;

// ─── Groq call helper ─────────────────────────────────────────────────────────
// Returns: { content: string } on success | { rateLimited: true } on 429 | null on other error
type GroqResult =
  | { content: string; rateLimited?: never }
  | { rateLimited: true; content?: never }
  | null;

async function callGroq(
  apiKey: string,
  groqMessages: Array<{ role: string; content: string }>,
  keyLabel: string,
): Promise<GroqResult> {
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
    return null; // network failure — try next key
  }

  // 429: rate limited — mark this key and signal caller to skip it next time
  if (res.status === 429) {
    const retryAfter = res.headers.get("retry-after");
    const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : KEY_COOLDOWN_MS;
    keyRateLimitedUntil.set(keyLabel, Date.now() + waitMs);
    console.warn(`[ai-reply] ${keyLabel} rate-limited (429) — cooling down ${waitMs / 1000}s`);
    return { rateLimited: true }; // distinct signal so caller can track this
  }

  // Auth failure — key is invalid, skip permanently for this session
  if (res.status === 401 || res.status === 403) {
    keyRateLimitedUntil.set(keyLabel, Date.now() + 24 * 60 * 60 * 1000); // 24h
    console.error(`[ai-reply] ${keyLabel} auth error (${res.status}) — disabling key`);
    return null;
  }

  if (!res.ok) {
    console.error(`[ai-reply] ${keyLabel} error (${res.status}) — trying next key`);
    return null;
  }

  const data    = await res.json();
  const content = data.choices?.[0]?.message?.content?.trim() ?? "";
  if (!content) {
    console.warn(`[ai-reply] ${keyLabel} empty content — trying next key`);
    return null;
  }

  return { content };
}

export async function POST(req: NextRequest) {
  if (!ABLY_KEY) {
    console.error("[ai-reply] ABLY_KEY is not set");
    return NextResponse.json({ error: "ABLY_KEY env var missing" }, { status: 500 });
  }

  // Build key list — only include configured keys, skip ones in rate-limit cooldown
  const allKeys: Array<{ key: string; label: string }> = [
    { key: GROQ_API_KEY!,   label: "primary" },
    { key: GROQ_API_KEYv2!, label: "v2" },
    { key: GROQ_API_KEYv3!, label: "v3" },
    { key: GROQ_API_KEYv4!, label: "v4" },
    { key: GROQ_API_KEYv5!, label: "v5" },
    { key: GROQ_API_KEYv6!, label: "v6" },
    { key: GROQ_API_KEYv7!, label: "v7" },
  ].filter((k) => !!k.key);

  if (allKeys.length === 0) {
    return NextResponse.json({ error: "No Groq API keys configured" }, { status: 500 });
  }

  // Split into available and rate-limited keys
  // Try available keys first, then fall back to rate-limited ones as last resort
  const availableKeys  = allKeys.filter((k) => isKeyAvailable(k.label));
  const rateLimitedKeys = allKeys.filter((k) => !isKeyAvailable(k.label));
  // Ordered: available first, then rate-limited as absolute fallback
  const orderedKeys = [...availableKeys, ...rateLimitedKeys];

  if (availableKeys.length === 0) {
    console.warn(`[ai-reply] All ${allKeys.length} keys are rate-limited — trying anyway`);
  } else {
    console.log(`[ai-reply] ${availableKeys.length}/${allKeys.length} keys available`);
  }

  // Record when this request actually started processing — used to calculate
  // how long to wait before publishing the reply for a natural feel.
  const requestStartTime = Date.now();

  try {
    const body = await req.json() as {
      walletAddress: string;
      messages: Array<{ sender: "user" | "admin"; text: string; isAI?: boolean }>;
    };

    const { walletAddress, messages } = body;
    if (!walletAddress || !messages?.length) {
      return NextResponse.json({ error: "Missing walletAddress or messages" }, { status: 400 });
    }

    // Filter out AI messages — only real user/human-admin exchanges go to Groq
    const humanMessages = messages.filter((m) => !m.isAI);

    // Last message must be from user
    const lastMsg = humanMessages[humanMessages.length - 1];
    if (!lastMsg || lastMsg.sender !== "user") {
      return NextResponse.json({ ok: true, skipped: true });
    }

    // Build Groq history — last 10, must start with user turn
    const recent    = humanMessages.slice(-10);
    const firstUser = recent.findIndex((m) => m.sender === "user");
    const trimmed   = firstUser > 0 ? recent.slice(firstUser) : recent;

    const groqMessages = trimmed.map((m) => ({
      role:    m.sender === "user" ? "user" : "assistant",
      content: m.text,
    }));

    if (groqMessages.length === 0) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    // ── Ably REST helper ──────────────────────────────────────────────────
    const channelName = `kapogian-support:${walletAddress.toLowerCase()}`;
    const [keyName, keySecret] = ABLY_KEY.split(":");
    const ablyAuth = "Basic " + Buffer.from(`${keyName}:${keySecret}`).toString("base64");

    const ablyPublish = async (eventName: string, data: object) => {
      try {
        await fetch(
          `https://rest.ably.io/channels/${encodeURIComponent(channelName)}/messages`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": ablyAuth },
            body: JSON.stringify({ name: eventName, data }),
          },
        );
      } catch { /* non-critical */ }
    };

    // Show AI typing indicator to user
    await ablyPublish("admin-typing", { isTyping: true, isAI: true });

    // ── Try keys in order (available first, rate-limited as fallback) ─────
    let rawContent = "";
    let usedLabel  = "";

    for (const { key, label } of orderedKeys) {
      // Re-check availability in case another request just updated it
      if (!isKeyAvailable(label) && availableKeys.length > 0) {
        console.log(`[ai-reply] Skipping rate-limited key: ${label}`);
        continue;
      }

      const result = await callGroq(key, groqMessages, label);

      if (!result) {
        // Network or other error — try next key
        continue;
      }

      if (result.rateLimited) {
        // Already marked in callGroq — try next key
        continue;
      }

      // Success
      rawContent = result.content;
      usedLabel  = label;
      break;
    }

    if (!rawContent) {
      await ablyPublish("admin-typing", { isTyping: false, isAI: true });
      console.error(`[ai-reply] All ${orderedKeys.length} keys failed for ${walletAddress.slice(0, 8)}`);
      return NextResponse.json({ error: "AI temporarily unavailable" }, { status: 503 });
    }

    // ── Parse Groq response ───────────────────────────────────────────────
    let replyText     = "";
    let buttonsPayload: Array<{ label: string; emoji: string; url: string; id: string }> = [];

    try {
      const parsed = JSON.parse(rawContent) as {
        text: string;
        buttons?: Array<{ id: string }> | null;
        button?:  { id: string } | null; // backwards compat
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
      // If JSON parse fails, use raw content as plain text
      replyText = rawContent.replace(/```json|```/g, "").trim();
    }

    if (!replyText) {
      await ablyPublish("admin-typing", { isTyping: false, isAI: true });
      return NextResponse.json({ error: "Empty AI response" }, { status: 500 });
    }

    // ── Natural reply delay ────────────────────────────────────────────────
    // Calculate how much time has elapsed since the request started.
    // If less than MIN_REPLY_DELAY_MS, wait the remainder so the reply
    // always takes at least 5 seconds — feels like a human reading + typing.
    // The typing bubble stays visible during this entire wait.
    const elapsed = Date.now() - requestStartTime;
    const remaining = MIN_REPLY_DELAY_MS - elapsed;
    if (remaining > 0) {
      console.log(`[ai-reply] Groq done in ${elapsed}ms — holding ${remaining}ms for natural feel`);
      await new Promise<void>((resolve) => setTimeout(resolve, remaining));
    }

    const timestamp   = Date.now();
    const clientMsgId = `ai-${timestamp}-${Math.random().toString(36).slice(2)}`;

    // Stop typing bubble, then immediately publish reply
    await ablyPublish("admin-typing", { isTyping: false, isAI: true });

    const ablyRes = await fetch(
      `https://rest.ably.io/channels/${encodeURIComponent(channelName)}/messages`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": ablyAuth },
        body: JSON.stringify({
          name: "admin-message",
          data: { text: replyText, timestamp, clientMsgId, isAI: true, buttons: buttonsPayload },
        }),
      },
    );

    if (!ablyRes.ok) {
      const errText = await ablyRes.text();
      console.error("[ai-reply] Ably publish error:", ablyRes.status, errText);
      return NextResponse.json({ error: `Ably error: ${ablyRes.status}` }, { status: 502 });
    }

    console.log(
      `[ai-reply] ✓ ${walletAddress.slice(0, 8)}... via ${usedLabel} | ` +
      `buttons: [${buttonsPayload.map((b) => b.id).join(",") || "none"}] | ` +
      `available keys: ${availableKeys.length}/${allKeys.length}`,
    );

    return NextResponse.json({ ok: true, reply: replyText, buttons: buttonsPayload });

  } catch (error: any) {
    console.error("[ai-reply] Unexpected error:", error?.message ?? error);
    return NextResponse.json({ error: String(error?.message ?? error) }, { status: 500 });
  }
}