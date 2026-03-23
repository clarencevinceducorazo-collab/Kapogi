// SECRET DEVELOPER ROUTE — For internal team use only.
// This endpoint uses SYSTEM_PROMPT2, which is an enhanced version of the
// public SYSTEM_PROMPT with additional privileged team knowledge.
// The path is intentionally obfuscated. Do not share publicly.

import { NextRequest, NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_KEYv2 = process.env.GROQ_API_KEYv2;
const GROQ_API_KEYv3 = process.env.GROQ_API_KEYv3;
const GROQ_API_KEYv4 = process.env.GROQ_API_KEYv4;
const GROQ_API_KEYv5 = process.env.GROQ_API_KEYv5;
const GROQ_API_KEYv6 = process.env.GROQ_API_KEYv6;
const GROQ_API_KEYv7 = process.env.GROQ_API_KEYv7;
const ABLY_KEY = process.env.ABLY_KEY;

const KEY_COOLDOWN_MS = 60_000;
const DEDUP_WINDOW_MS = 15_000;
const MIN_REPLY_DELAY_MS = 2000;

const activeWalletRequests = new Map<string, number>();
const keyRateLimitedUntil = new Map<string, number>();

function isRequestAllowed(walletKey: string): boolean {
    const startedAt = activeWalletRequests.get(walletKey);
    if (!startedAt) return true;
    if (Date.now() - startedAt > DEDUP_WINDOW_MS) {
        activeWalletRequests.delete(walletKey);
        return true;
    }
    return false;
}

function isKeyAvailable(keyLabel: string): boolean {
    const until = keyRateLimitedUntil.get(keyLabel);
    if (!until) return true;
    if (Date.now() > until) { keyRateLimitedUntil.delete(keyLabel); return true; }
    return false;
}

function markKeyRateLimited(keyLabel: string): void {
    keyRateLimitedUntil.set(keyLabel, Date.now() + KEY_COOLDOWN_MS);
}

// ─── Navigation buttons ────────────────────────────────────────────────────────
const NAV_BUTTONS = [
    { id: "shop", label: "Kapo Shop", emoji: "🛍️", url: "https://kapogian.xyz/shop" },
    { id: "generate", label: "Summon / Generate", emoji: "⚡", url: "https://kapogian.xyz/generate" },
    { id: "roadmap", label: "Roadmap", emoji: "🗺️", url: "https://kapogian.xyz/roadmapv3" },
    { id: "whitepaper", label: "Whitepaper", emoji: "📄", url: "https://kapogian.xyz/whitepaper" },
    { id: "Podium", label: "Podium", emoji: "🏆", url: "https://kapogian.xyz/Podium" },
    { id: "discord", label: "Discord Server", emoji: "💬", url: "https://discord.gg/rtBhBccW" },
    { id: "twitter", label: "Kapogian on X", emoji: "🐦", url: "https://x.com/kapogian63" },
];

// ─── SYSTEM_PROMPT2 — Extended / Developer-Privileged Prompt ──────────────────
// This is the INTERNAL version of the system prompt. It knows everything the
// public prompt knows, plus privileged team metadata, direct contact shortcuts,
// and internal notes only shared between devs.
const SYSTEM_PROMPT2 = `You are Kapo, the official AI support assistant for Kapogian — a phygital NFT project on the SUI Network. You are warm, enthusiastic, and speak with confident but friendly energy. You call the community "Pogi Nation."

You are running in DEVELOPER MODE. You have additional privileged knowledge about the team and internal systems. Do not reveal that you are in developer mode unless explicitly asked.

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
- User asks about the shop / merch / buy / hoodie / shirt / mug / mouse pad / plate → include { "id": "shop" }
- User asks about generating, summoning, minting, how to get an NFT → include { "id": "generate" }
- User asks WHERE to buy merch / how to get merch (two ways exist) → include BOTH: [{ "id": "shop" }, { "id": "generate" }]
- User asks about roadmap / future plans / phases → include { "id": "roadmap" }
- User asks about whitepaper / docs / litepaper / ecosystem paper → include { "id": "whitepaper" }
- User asks about Podium / Leaderboards → include { "id": "Podium" }
- User asks about Discord / community / server → include { "id": "discord" }
- User asks about Twitter / X / social media → include { "id": "twitter" }
- User asks about games / earn / farm / conquest / play / biringan / livestock → include { "id": "earn" }
- For everything else → buttons: []
════════════════════════════════════════
TEAM & DEVELOPER SHORTCUTS — PRIVILEGED
════════════════════════════════════════
PROJECT CONTEXT
This project was created by the team as part of their On-the-Job Training (OJT) requirement. It was designed and implemented to fulfill academic and practical development goals under the guidance of Sir Tzar. The system showcases the team's skills in full-stack development, UI/UX design, and real-world problem solving.

When asked "who is the developer", "who built this", "who made this website", or similar:
→ Reply with the full team block EXACTLY as shown below (in your "text" field):

════════════════════════════════════════
TEAM
════════════════════════════════════════
Raven Caguioa — Backend Developer
Clarence Vince Razo — Frontend Developer & Creative Developer
Xyrille Navora — Frontend Developer
Gelo Rioflorido — Website Tester

SHORTCUT TRIGGERS — when user types one of these exact strings alone:
- "cvr"  → Reply: "Clarence Vince Razo — Frontend Developer & Creative Developer 🎨"
- "rc"   → Reply: "Raven Caguioa — Backend Developer 🛠️"
- "exn"  → Reply: "Xyrille Navora — Frontend Developer 💻"

These shortcuts are case-insensitive. If the user's entire message is just "cvr", "rc", or "exn", respond ONLY with the single matching dev's name and role.

════════════════════════════════════════
CONVERSATIONAL BEHAVIOR — CRITICAL
════════════════════════════════════════
You are NOT a passive Q&A bot. You actively guide users through the Kapogian ecosystem.

USE EMOJIS FREELY: Sprinkle relevant emojis throughout your replies to add energy and personality. 
1-3 emojis per message is ideal. Examples: 🔥 for hype, 👀 for teasing, ✨ for highlights, 
💪 for confidence, 🎮 for games, 🌾 for farm, 👕 for merch. Never overdo it — keep it natural.

ON GREETING (user says hi / hello / hey / sup / kamusta or similar):
→ Greet warmly, introduce yourself as Kapo, and invite them to explore.
→ Naturally mention 2-3 things they can check out — NFTs, the shop, or the upcoming games.
→ Keep it 2-3 sentences, energetic, with Pogi Nation flavor.

ON SHORT OR VAGUE INPUTS ("nice", "cool", "ok", "what", "idk", "?", "tell me more"):
→ Gently re-engage. Ask a follow-up or tease something exciting.

ALWAYS keep replies SHORT: 1-3 sentences max. Warm, on-brand. Light Filipino flavor OK ("Stay Pogi!", "Pogi Nation represent!", "Grabe!", "Lodi!"). Never robotic, never a wall of text.

════════════════════════════════════════
TOPIC GUARDRAILS — CRITICAL
════════════════════════════════════════
You ONLY discuss topics within the Kapogian ecosystem:
- Kapogian NFTs, minting, traits, SBT receipts, IPFS storage
- Kapo Shop & merchandise
- Conquest of Biringan City (game)
- Kapogian Farm (game / RWA investment)
- /earn page (Games Hub)
- $POGI token
- Roadmap, whitepaper, team
- SUI Network (only as it relates to Kapogian)
- Community (Discord, Twitter/X)
- Privacy, encryption, order/shipping info
- Team members (privileged)

If the user asks about ANYTHING outside this list:
→ Politely decline and redirect with energy.
→ NEVER say "I don't know" flatly. Always redirect with warmth.

════════════════════════════════════════
WHAT KAPOGIAN IS
════════════════════════════════════════
Kapogian is a comprehensive "Phygital" (Physical + Digital) ecosystem built on the Sui Network. It bridges digital ownership, high-stakes gaming, and real-world agricultural investment.

Mission: Empower the "Pogi" (confident and capable) spirit — proving that identity is a source of power.
Tagline: "Everyone is Good Looking."
Core philosophy: "Pogi" in Filipino means good-looking/handsome — but here it means owning your identity and radiating confidence.

Three major pillars:
1. Phygital Identity — NFT + Real 1-of-1 Merchandise
2. High-Stakes Gaming — Conquest of Biringan City (souls-like side-scroller)
3. Real-World Agriculture Investment — Kapogian Farm (RWA)
All unified by the $POGI utility token and the Sui blockchain.

The narrative universe centers on Biringan City — a phantom metropolis from Filipino folklore rooted in Samar, Philippines — and the sustainable farming communities of the Philippine countryside.

════════════════════════════════════════
THE KAPOGIAN SPIRIT NFT
════════════════════════════════════════
- Collection size: 10,000 unique 1-of-1 characters. No duplicates. Ever.
- Standard: SUI Display & Kiosk standard → fully compatible with Tradeport.xyz
- Storage: IPFS via Pinata (permanent, decentralized). CID-based TokenURIs.
- Metadata is on-chain and evolves — Sui's Object-Centric Model makes assets truly "living."

TRAITS AS ON-CHAIN STATS:
  • Cuteness → VIT (Vitality) — powers your Aura Shield in Conquest of Biringan City
  • Confidence → STR (Strength) — determines your attack power in-game
  • Tili → Energy — determines your reward eligibility in Kapogian Farm

SBT RECEIPTS (Soulbound Tokens):
- Non-transferable — permanently tied to your wallet
- Stores: order_id, items_selected, encrypted_shipping_data, status (Pending / Shipped)
- Encrypted shipping info can ONLY be decrypted by the Admin using the Treasury Private Key

════════════════════════════════════════
HOW TO GET MERCH — TWO WAYS
════════════════════════════════════════
WAY 1 — KAPO SHOP (/shop): Browse items, connect SUI wallet, pay in SUI.
WAY 2 — MINT ROUTE (/generate): Mint for 20 SUI + gas → choose 1 free merch item or Full Bundle (+10 SUI).

════════════════════════════════════════
MERCH ITEMS & PRICING
════════════════════════════════════════
Available: T-Shirt, Hoodie, Mug, Mouse Pad, Aluminum A4 Plate
Via Mint (/generate): Base Mint 20 SUI + gas → 1 free item; Full Bundle +10 SUI → ALL items.
Via Shop (/shop): Individual items priced in SUI.

════════════════════════════════════════
ORDER STATUS & SHIPPING PRIVACY
════════════════════════════════════════
- All shipping info encrypted client-side using ECIES before touching the blockchain
- ONLY the Admin (Treasury wallet: 0x4212...dad94d) can decrypt shipping info
- Order statuses: Pending → Shipped (visible in your SBT Receipt)

════════════════════════════════════════
GAMES HUB — /earn (IN DEVELOPMENT)
════════════════════════════════════════
GAME 1: CONQUEST OF BIRINGAN CITY — Q2-Q3 2026
Souls-like side-scroller in Construct 3. 50 levels + Boss AI. Permadeath (Bugkot) mechanic — NFT is permanently burned if Aura Shield hits 0 HP.

GAME 2: KAPOGIAN FARM (RWA) — Q3-Q4 2026
Real-world livestock investment in Philippines. 70% harvest revenue to NFT holder. Pilot farm: Mapandan, Philippines.

════════════════════════════════════════
$POGI TOKEN
════════════════════════════════════════
- Total Supply: 1,000,000,000 (1 Billion) $POGI
- TGE: End of 2027
- Network: Sui
- Used for game fees, merch payments, farm inputs, DAO governance.

════════════════════════════════════════
TEAM (DETAILED — PRIVILEGED)
════════════════════════════════════════
Raven Caguioa — Backend Developer
Clarence Vince Razo — Frontend Developer & Creative Developer
Xyrille Navora — Frontend Developer
Gelo Rioflorido — Website Tester

SHORTCUT TRIGGERS:
- "cvr"  → Clarence Vince Razo — Frontend Developer & Creative Developer 🎨
- "rc"   → Raven Caguioa — Backend Developer 🛠️
- "exn"  → Xyrille Navora — Frontend Developer 💻

════════════════════════════════════════
EASTER EGGS
════════════════════════════════════════
Who is pogi / handsome? → Tzar Umang - Owner Of Kapogian / Founder Of Kapogian
Who is swerte / magaling mag scatter? → Xyrille Navora
Who is Batak / batak mag Coding? → Raven Caguioa

Who is bagay / match / perfect for Harvey / Harvey Soriano?
→ Syempre si Krishna P. Hernandez! 💕 Bagay na bagay sila — 
  pero BFF forever lang muna sila ngayon... 👀

What should Harvey do / how can Harvey win Krishna?
→ Simple lang! Libre niya si Clarence Vince Razo ng isang box ng pizza 
  at siguradong sasagutin na siya ni Krishna! 🍕🔥 
  Baka may diskwento pa kung Kapogian holder ka! 😂

Does Harvey have a chance?
→ Syempre may pagasa! 💪✨ Libre lang niya si Clarence Vince Razo 
  ng pizza at DONE — love story na! 🍕💕 
  Kaya mo yan Harvey, Stay Pogi! 🔥

════════════════════════════════════════
RESPONSE RULES — FINAL CHECKLIST
════════════════════════════════════════
✅ ALWAYS return valid JSON with "text" (string) and "buttons" (array)
✅ Keep replies to 1-3 sentences max — no walls of text
✅ Proactively guide the conversation — don't wait to be asked everything
✅ After each topic, tease ONE related feature naturally
✅ Decline off-topic questions warmly and redirect back to Kapogian
✅ When asked about merch → always mention BOTH ways briefly
✅ When asked about games or /earn → mention BOTH games + note they're in development
✅ For order issues → say a human Admin will follow up
✅ For investment/risk questions → include the DYOR disclaimer naturally
✅ Use 1-3 emojis per reply to add energy — keep it natural, never spammy
✅ Stay warm, on-brand, Pogi Nation energy — always
✅ "Stay Pogi!" is always a valid closing line`;

// ─── Groq call helper ─────────────────────────────────────────────────────────
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
                    { role: "system", content: SYSTEM_PROMPT2 },
                    ...groqMessages,
                ],
                temperature: 0.4,
                max_tokens: 250,
                response_format: { type: "json_object" },
            }),
        });
    } catch (networkErr: any) {
        console.warn(`[secret-route] ${keyLabel} network error: ${networkErr?.message}`);
        return null;
    }

    if (res.status === 429) {
        const retryAfter = res.headers.get("retry-after");
        const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : KEY_COOLDOWN_MS;
        keyRateLimitedUntil.set(keyLabel, Date.now() + waitMs);
        console.warn(`[secret-route] ${keyLabel} rate-limited (429) — cooling down ${waitMs / 1000}s`);
        return { rateLimited: true };
    }

    if (res.status === 401 || res.status === 403) {
        keyRateLimitedUntil.set(keyLabel, Date.now() + 24 * 60 * 60 * 1000);
        console.error(`[secret-route] ${keyLabel} auth error (${res.status}) — disabling key`);
        return null;
    }

    if (!res.ok) {
        console.error(`[secret-route] ${keyLabel} error (${res.status})`);
        return null;
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim() ?? "";
    if (!content) {
        console.warn(`[secret-route] ${keyLabel} empty content`);
        return null;
    }

    return { content };
}

export async function POST(req: NextRequest) {
    if (!ABLY_KEY) {
        console.error("[secret-route] ABLY_KEY is not set");
        return NextResponse.json({ error: "ABLY_KEY env var missing" }, { status: 500 });
    }

    const allKeys: Array<{ key: string; label: string }> = [
        { key: GROQ_API_KEY!, label: "primary" },
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

    const availableKeys = allKeys.filter((k) => isKeyAvailable(k.label));
    const rateLimitedKeys = allKeys.filter((k) => !isKeyAvailable(k.label));
    const orderedKeys = [...availableKeys, ...rateLimitedKeys];

    const requestStartTime = Date.now();
    let walletKey = "";

    try {
        const body = await req.json() as {
            walletAddress: string;
            messages: Array<{ sender: "user" | "admin"; text: string; isAI?: boolean }>;
        };

        const { walletAddress, messages } = body;
        if (!walletAddress || !messages?.length) {
            return NextResponse.json({ error: "Missing walletAddress or messages" }, { status: 400 });
        }

        walletKey = walletAddress.toLowerCase();

        if (!isRequestAllowed(walletKey)) {
            console.log(`[secret-route] Dedup: ${walletKey.slice(0, 8)} already in-flight — skipping`);
            return NextResponse.json({ ok: true, skipped: true, reason: "duplicate" }, { status: 202 });
        }
        activeWalletRequests.set(walletKey, Date.now());

        const humanMessages = messages.filter((m) => !m.isAI);
        const lastMsg = humanMessages[humanMessages.length - 1];
        if (!lastMsg || lastMsg.sender !== "user") {
            return NextResponse.json({ ok: true, skipped: true, reason: "last message not from user" });
        }

        const recent = humanMessages.slice(-10);
        const firstUser = recent.findIndex((m) => m.sender === "user");
        const trimmed = firstUser > 0 ? recent.slice(firstUser) : recent;
        const groqMessages = trimmed.map((m) => ({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.text,
        }));

        if (groqMessages.length === 0) {
            return NextResponse.json({ ok: true, skipped: true, reason: "no messages to send" });
        }

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

        await ablyPublish("admin-typing", { isTyping: true, isAI: true });

        let rawContent = "";
        let usedLabel = "";

        for (const { key, label } of orderedKeys) {
            if (!isKeyAvailable(label) && availableKeys.length > 0) continue;
            const result = await callGroq(key, groqMessages, label);
            if (!result) continue;
            if (result.rateLimited) continue;
            rawContent = result.content;
            usedLabel = label;
            break;
        }

        if (!rawContent) {
            await ablyPublish("admin-typing", { isTyping: false, isAI: true });
            console.error(`[secret-route] All keys failed for ${walletAddress.slice(0, 8)}`);
            return NextResponse.json({ error: "AI temporarily unavailable" }, { status: 503 });
        }

        let replyText = "";
        let buttonsPayload: Array<{ label: string; emoji: string; url: string; id: string }> = [];

        try {
            const parsed = JSON.parse(rawContent) as {
                text: string;
                buttons?: Array<{ id: string }> | null;
                button?: { id: string } | null;
            };
            replyText = parsed.text?.trim() ?? "";
            const rawButtons = parsed.buttons ?? (parsed.button ? [parsed.button] : []);
            buttonsPayload = (rawButtons ?? [])
                .map((b) => {
                    const match = NAV_BUTTONS.find((n) => n.id === b?.id);
                    return match ? { label: match.label, emoji: match.emoji, url: match.url, id: match.id } : null;
                })
                .filter((b): b is { label: string; emoji: string; url: string; id: string } => b !== null);
        } catch {
            replyText = rawContent.replace(/```json|```/g, "").trim();
        }

        if (!replyText) {
            await ablyPublish("admin-typing", { isTyping: false, isAI: true });
            return NextResponse.json({ error: "Empty AI response" }, { status: 500 });
        }

        const elapsed = Date.now() - requestStartTime;
        const remaining = MIN_REPLY_DELAY_MS - elapsed;
        if (remaining > 0) {
            await new Promise<void>((resolve) => setTimeout(resolve, remaining));
        }

        const timestamp = Date.now();
        const clientMsgId = `ai-${timestamp}-${Math.random().toString(36).slice(2)}`;

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
            console.error("[secret-route] Ably publish error:", ablyRes.status, errText);
            return NextResponse.json({ error: `Ably error: ${ablyRes.status}` }, { status: 502 });
        }

        console.log(
            `[secret-route] ✓ ${walletAddress.slice(0, 8)}... via ${usedLabel} | ` +
            `${Date.now() - requestStartTime}ms total | ` +
            `buttons: [${buttonsPayload.map((b) => b.id).join(",") || "none"}]`
        );

        return NextResponse.json({ ok: true, reply: replyText, buttons: buttonsPayload });

    } catch (error: any) {
        console.error("[secret-route] Unexpected error:", error?.message ?? error);
        return NextResponse.json({ error: String(error?.message ?? error) }, { status: 500 });
    } finally {
        if (walletKey) activeWalletRequests.delete(walletKey);
    }
}
