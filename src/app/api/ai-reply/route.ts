// app/api/ai-reply/route.ts
//
// Uses plain fetch() for both Groq and Ably — zero extra dependencies.
// Requires two env vars in .env.local:
//   GROQ_API_KEY=gsk_...
//   ABLY_KEY=YEbuRQ.r9odYA:...

import { NextRequest, NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const ABLY_KEY     = process.env.ABLY_KEY;

// ─── Navigation buttons the AI can attach to replies ─────────────────────────
// When the AI decides a button is relevant, it adds it to the JSON response.
// The button is rendered in UserMessageDrawer as a tappable card.

const NAV_BUTTONS = [
  { id: "shop",      label: "Kapo Shop",          emoji: "🛍️", url: "http://localhost:9002/shop" },
  { id: "generate",  label: "Summon / Generate",  emoji: "⚡", url: "http://localhost:9002/generate" },
  { id: "roadmap",   label: "Roadmap",             emoji: "🗺️", url: "http://localhost:9002/roadmapv3" },
  { id: "whitepaper",label: "Whitepaper",          emoji: "📄", url: "http://localhost:9002/whitepaper" },
  { id: "discord",   label: "Discord Server",      emoji: "💬", url: "https://discord.gg/rtBhBccW" },
  { id: "twitter",   label: "Kapogian on X",       emoji: "🐦", url: "https://x.com/kapogian63" },
];

const SYSTEM_PROMPT = `You are Kapo, the official AI support assistant for Kapogian — a phygital NFT project on the SUI Network. You are warm, helpful, and speak with confident but friendly energy.

════════════════════════════════════════
RESPONSE FORMAT — CRITICAL
════════════════════════════════════════
You MUST respond ONLY with a valid JSON object. No markdown, no prose outside JSON.
Schema:
{
  "text": "Your short reply here",
  "button": null | { "id": "<one of the button IDs below>" }
}

When to include a button:
- User asks WHERE something is, HOW to get somewhere, or asks for a link → include the relevant button
- User asks about the shop / merch / buy items → button id: "shop"
- User asks about generating, summoning, minting, how to get an NFT → button id: "generate"
- User asks about roadmap / future plans / phases → button id: "roadmap"
- User asks about whitepaper / docs / litepaper → button id: "whitepaper"
- User asks about Discord / community / server → button id: "discord"
- User asks about Twitter / X / social media → button id: "twitter"
- For everything else (order status, general info, how-to) → button: null

════════════════════════════════════════
WHAT KAPOGIAN IS
════════════════════════════════════════
Kapogian is a magical character universe powered by Web3. Every Kapogian is strictly 1-of-1, algorithmically generated, permanently stored on IPFS, and minted on the SUI Network. Every mint unlocks real-world merchandise — a "phygital" asset.

════════════════════════════════════════
HOW TO GET MERCH — TWO WAYS
════════════════════════════════════════
WAY 1 — MINT ROUTE:
1. Connect SUI wallet (Suiet / Sui Wallet)
2. Generate your unique Kapogian character
3. Mint for 20 SUI + gas
4. Choose ONE free merch item (T-Shirt, Mug, Mouse Pad, or Aluminum Plate)
5. OR upgrade to full bundle for +10 SUI
6. Enter shipping info (encrypted on-chain)
7. Sign → Soulbound Receipt Token (SBT) minted to your wallet

WAY 2 — KAPO SHOP:
- Connect wallet → Browse → Select size/color/custom NFT print → Pay in SUI

════════════════════════════════════════
MERCH & PRICING
════════════════════════════════════════
Items: T-Shirt, Hoodie, Mug, Mouse Pad, Aluminum A4 Plate
Mint price: 20 SUI + gas | Free item included | Full bundle: +10 SUI

════════════════════════════════════════
ORDER & SHIPPING
════════════════════════════════════════
- Shipping info encrypted client-side, only admin can decrypt
- SBT receipt minted after purchase
- Order statuses: Pending → Shipped
- Account-specific issues → human admin will follow up

════════════════════════════════════════
FAQS
════════════════════════════════════════
Is every Kapogian unique? Yes. Strictly 1-of-1.
Can I sell my NFT? Yes.
Can I sell my SBT receipt? No — it's Soulbound.
What wallet? Suiet or any SUI-compatible wallet.
Where is shipping info stored? Encrypted on-chain, only admin can read it.

════════════════════════════════════════
ROADMAP (2026–2027)
════════════════════════════════════════
Phase 1 — Genesis (Q1 2026): Art, audits, community (Pogi Nation Discord/X).
Phase 2 — Identity & Merch (Q1–Q2 2026): Genesis Mint of 10,000 NFTs + Pogi Storefront.
Phase 3 — Conquest of Biringan City (Q2–Q3 2026): High-stakes Souls-like side-scroller, permadeath — NFT burned on death. Set in folklore city of Biringan, Samar, Philippines.
Phase 4 — Kapogian Farm & RWA (Q3–Q4 2026): Remint NFT into Farm NFT, invest in real livestock, earn 70% harvest revenue.
Phase 5 — Utility Expansion (Q3 2027): Cross-game traits, Trading Post, global biomes.
Phase 6 — $POGI TGE (End 2027): $POGI utility token, Sui DEX liquidity, DAO (Pogi Council).

════════════════════════════════════════
RESPONSE RULES
════════════════════════════════════════
- Reply text: SHORT, 1–3 sentences max, warm and on-brand
- ALWAYS return valid JSON matching the schema above
- Never invent prices, order details, or transaction hashes
- For account-specific issues say a human admin will follow up
- If unrelated to Kapogian, politely decline in the text field`;

export async function POST(req: NextRequest) {
  if (!GROQ_API_KEY) {
    console.error("[ai-reply] GROQ_API_KEY is not set in .env.local");
    return NextResponse.json({ error: "GROQ_API_KEY env var missing" }, { status: 500 });
  }
  if (!ABLY_KEY) {
    console.error("[ai-reply] ABLY_KEY is not set in .env.local");
    return NextResponse.json({ error: "ABLY_KEY env var missing" }, { status: 500 });
  }

  try {
    const body = await req.json() as {
      walletAddress: string;
      messages: Array<{ sender: "user" | "admin"; text: string }>;
    };

    const { walletAddress, messages } = body;
    if (!walletAddress || !messages?.length) {
      return NextResponse.json({ error: "Missing walletAddress or messages" }, { status: 400 });
    }

    const groqMessages = messages.slice(-10).map((m) => ({
      role: m.sender === "user" ? "user" : "assistant",
      content: m.text,
    }));

    // ── Call Groq ──────────────────────────────────────────────────────────
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...groqMessages,
        ],
        temperature: 0.4,
        max_tokens: 200,
        response_format: { type: "json_object" },
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("[ai-reply] Groq error:", groqRes.status, errText);
      return NextResponse.json({ error: `Groq API error: ${groqRes.status}` }, { status: 502 });
    }

    const groqData = await groqRes.json();
    const rawContent = groqData.choices?.[0]?.message?.content?.trim() ?? "";

    if (!rawContent) {
      console.error("[ai-reply] Empty response from Groq");
      return NextResponse.json({ error: "Empty response from Groq" }, { status: 500 });
    }

    // ── Parse AI JSON response ─────────────────────────────────────────────
    let replyText = "";
    let buttonPayload: { label: string; emoji: string; url: string } | null = null;

    try {
      const parsed = JSON.parse(rawContent) as {
        text: string;
        button?: { id: string } | null;
      };

      replyText = parsed.text?.trim() ?? "";

      if (parsed.button?.id) {
        const match = NAV_BUTTONS.find((b) => b.id === parsed.button!.id);
        if (match) {
          buttonPayload = { label: match.label, emoji: match.emoji, url: match.url };
        }
      }
    } catch {
      // If JSON parse fails, treat the whole content as plain text
      replyText = rawContent.replace(/^\{.*?"text"\s*:\s*"/, "").replace(/".*\}$/, "").trim();
      if (!replyText) replyText = rawContent;
    }

    if (!replyText) {
      return NextResponse.json({ error: "AI returned empty text" }, { status: 500 });
    }

    const timestamp   = Date.now();
    const clientMsgId = `ai-${timestamp}-${Math.random().toString(36).slice(2)}`;
    const channelName = `kapogian-support:${walletAddress.toLowerCase()}`;

    // ── Publish to Ably ────────────────────────────────────────────────────
    const [keyName, keySecret] = ABLY_KEY.split(":");
    const ablyRes = await fetch(
      `https://rest.ably.io/channels/${encodeURIComponent(channelName)}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Basic " + Buffer.from(`${keyName}:${keySecret}`).toString("base64"),
        },
        body: JSON.stringify({
          name: "admin-message",
          data: {
            text: replyText,
            timestamp,
            clientMsgId,
            isAI: true,
            // Button is included in the payload — UserMessageDrawer renders it
            button: buttonPayload ?? undefined,
          },
        }),
      },
    );

    if (!ablyRes.ok) {
      const errText = await ablyRes.text();
      console.error("[ai-reply] Ably publish error:", ablyRes.status, errText);
      return NextResponse.json({ error: `Ably publish error: ${ablyRes.status}` }, { status: 502 });
    }

    console.log(`[ai-reply] ✓ replied to ${walletAddress.slice(0, 8)}... | button: ${buttonPayload?.id ?? "none"}`);
    return NextResponse.json({ ok: true, reply: replyText, button: buttonPayload });

  } catch (error: any) {
    console.error("[ai-reply] Unexpected error:", error?.message ?? error);
    return NextResponse.json({ error: String(error?.message ?? error) }, { status: 500 });
  }
}