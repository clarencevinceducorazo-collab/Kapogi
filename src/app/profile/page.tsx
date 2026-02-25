"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/kapogian/page-header";
import { PageFooter } from "@/components/kapogian/page-footer";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { getOwnedCharacters, suiClient } from "@/lib/sui";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { getIPFSGatewayUrl } from "@/lib/pinata";
import Image from "next/image";
import { MODULES, ORDER_STATUS } from "@/lib/constants";
import {
  LoaderCircle,
  ShieldAlert,
  Package,
  Truck,
  CheckCircle,
  Wallet,
  ExternalLink,
  Calendar,
  Hash,
  ShoppingBag,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Clock,
  X,
  Star,
  Zap,
  BarChart2,
} from "lucide-react";
import { CustomConnectButton } from "@/components/kapogian/CustomConnectButton";

/* ─────────────────────────────────────────
   Design tokens  (single source of truth)
───────────────────────────────────────── */
const C = {
  black: "#0A0A0A",
  white: "#FFFFFF",
  yellow: "#FFD600",
  pink: "#FF4D8D",
  blue: "#3B82F6",
  green: "#10B981",
  orange: "#F97316",
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray400: "#9CA3AF",
  gray600: "#4B5563",
};

/* Small reusable primitives */
/**
 * Small badge primitive used throughout the page for status and labels.
 * - `color` controls background
 * - `textColor` controls foreground
 */
const Badge = ({
  children,
  color = C.yellow,
  textColor = C.black,
}: {
  children: React.ReactNode;
  color?: string;
  textColor?: string;
}) => (
  <span
    style={{
      background: color,
      color: textColor,
      border: `2px solid ${C.black}`,
      borderRadius: 8,
      padding: "2px 10px",
      fontWeight: 700,
      fontSize: 11,
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
    }}
  >
    {children}
  </span>
);

/**
 * Card primitive that applies consistent border, shadow and padding.
 * Use to wrap sections and provide visual grouping.
 */
const Card = ({
  children,
  style,
  className,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) => (
  <div
    className={className}
    style={{
      background: C.white,
      border: `2px solid ${C.black}`,
      borderRadius: 16,
      boxShadow: `4px 4px 0 ${C.black}`,
      padding: 20,
      ...style,
    }}
  >
    {children}
  </div>
);

/**
 * SectionLabel presents a small uppercase label with an optional icon.
 * Used to label grouped UI blocks like "Skills", "Traits" etc.
 */
const SectionLabel = ({
  icon,
  children,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: C.gray600,
      marginBottom: 12,
    }}
  >
    {icon && <span style={{ color: C.black }}>{icon}</span>}
    {children}
  </div>
);

/**
 * SkillBar renders a labeled progress bar for simple numeric attributes.
 * - `value` is clamped 0..100 and shown as a percent
 * - `accent` controls the filled color
 */
const SkillBar = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) => {
  const pct = Math.max(0, Math.min(100, Number(value ?? 0)));
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          marginBottom: 5,
        }}
      >
        <span>{label}</span>
        <span style={{ color: accent }}>{pct}%</span>
      </div>
      <div
        style={{
          height: 10,
          background: C.gray100,
          border: `2px solid ${C.black}`,
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: accent,
            borderRadius: 999,
            transition: "width 0.5s ease",
          }}
        />
      </div>
    </div>
  );
};

/**
 * StatBox shows a compact stat with icon, label and large value.
 * Used in the Player Stats row at the bottom of the page.
 */
const StatBox = ({
  icon,
  label,
  value,
  accent = C.black,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  accent?: string;
}) => (
  <Card style={{ padding: 16, textAlign: "center" }}>
    <div style={{ color: accent, marginBottom: 4 }}>{icon}</div>
    <div
      style={{
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: C.gray400,
        marginBottom: 2,
      }}
    >
      {label}
    </div>
    <div style={{ fontSize: 22, fontWeight: 900, color: C.black }}>{value}</div>
  </Card>
);

/* ─────────────────────────────────────────
   Main Page
───────────────────────────────────────── */
/**
 * Profile Page
 * - Loads owned characters and a "podium" summary for the connected account
 * - Renders tabs: Stats, Collections, Orders
 * - Uses local primitives (Card, Badge, SkillBar) for layout
 */
export default function Page() {
  const account = useCurrentAccount();
  const [characters, setCharacters] = useState<any[]>([]);
  const [index, setIndex] = useState(0);
  const [podiumEntry, setPodiumEntry] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<
    "Collections" | "Orders" | "Stats"
  >("Stats");

  /* -----------------------------
   * Load characters
   * - Queries on-chain owned character objects for the connected account
   * - Normalizes display/content fields into a `characters` array
   */
  useEffect(() => {
    if (!account?.address) return;
    let mounted = true;
    const load = async () => {
      try {
        const ownedObjects = await getOwnedCharacters(account.address);
        const parsed = (ownedObjects || [])
          .map((obj: any) => {
            const displayData = obj.data?.display?.data || {};
            const contentData = obj.data?.content?.fields || {};
            let attributes: any = {};
            try {
              if (contentData.attributes)
                attributes = JSON.parse(contentData.attributes);
            } catch (e) {}

            // Helper: extractTraits
            // Normalizes a variety of trait shapes (array of {trait_type,value},
            // or object maps) into a flat lowercase-key object.
            const extractTraits = (src: any) => {
              const out: Record<string, any> = {};
              if (!src) return out;
              if (Array.isArray(src)) {
                src.forEach((it: any) => {
                  const k =
                    it.trait_type ??
                    it.traitType ??
                    it.trait ??
                    it.name ??
                    it.label;
                  const v =
                    it.value ??
                    it.trait_value ??
                    it.trait ??
                    it.val ??
                    undefined;
                  if (k) out[String(k).toLowerCase()] = v ?? "";
                });
                return out;
              }
              if (typeof src === "object") {
                Object.keys(src).forEach((k) => {
                  out[k.toLowerCase()] = src[k];
                });
                return out;
              }
              return out;
            };

            const traitsFromAttrs = extractTraits(
              attributes.traits ?? attributes.properties ?? null,
            );
            const normalized = {
              cuteness:
                attributes.cuteness ??
                attributes.Cuteness ??
                attributes.cute ??
                0,
              confidence: attributes.confidence ?? attributes.Confidence ?? 0,
              tiliFactor:
                attributes.tiliFactor ??
                attributes.tili_factor ??
                attributes.tili ??
                0,
              mmr: Number(
                contentData.mmr ??
                  contentData.mmr_score ??
                  attributes.mmr ??
                  attributes.global_mmr ??
                  attributes.rating ??
                  0,
              ),
              territory: attributes.territory ?? attributes.regions ?? null,
              traits: Object.keys(traitsFromAttrs).length
                ? traitsFromAttrs
                : extractTraits(attributes ?? {}),
              ...attributes,
            };

            const resolvedMmr = normalized.mmr ?? 0;
            return {
              objectId: obj.data?.objectId || "",
              name: displayData.name || "Unnamed",
              imageUrl: getIPFSGatewayUrl(displayData.image_url || ""),
              attributes: normalized,
              mmr: resolvedMmr,
            };
          })
          .filter((c: any) => c.objectId);

        if (mounted) {
          // Ensure collection displays highest MMR first
          parsed.sort((a: any, b: any) => {
            const am = Number(a.mmr ?? a.attributes?.mmr ?? 0);
            const bm = Number(b.mmr ?? b.attributes?.mmr ?? 0);
            return bm - am;
          });
          setCharacters(parsed);
          setIndex(0);
        }
      } catch (err) {
        console.error("Failed to load characters:", err);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [account?.address]);

  /* -----------------------------
   * Load podium
   * - Scans mint events to find NFTs owned by this account
   * - Fetches those objects in chunks and selects the highest MMR entry
   */
  useEffect(() => {
    if (!account?.address) return;
    let mounted = true;
    const loadPodiumForAccount = async () => {
      try {
        const allMintEvents = await suiClient.queryEvents({
          query: {
            MoveEventType: `${CONTRACT_ADDRESSES.PACKAGE_ID}::character_nft::CharacterMinted`,
          },
        });
        const nftOwnerMap = new Map<string, string>();
        allMintEvents.data.forEach((event: any) => {
          const nftId = event.parsedJson?.nft_id;
          const owner = event.parsedJson?.owner;
          if (nftId && owner) nftOwnerMap.set(nftId, owner);
        });
        const myNftIds = Array.from(nftOwnerMap.keys()).filter(
          (id) => nftOwnerMap.get(id) === account.address,
        );
        if (myNftIds.length === 0) {
          if (mounted) setPodiumEntry(null);
          return;
        }
        const characterObjects: any[] = [];
        for (let i = 0; i < myNftIds.length; i += 50) {
          const chunk = myNftIds.slice(i, i + 50);
          const objs = await suiClient.multiGetObjects({
            ids: chunk,
            options: { showContent: true, showDisplay: true },
          });
          characterObjects.push(...objs);
        }
        let bestMmr = -1;
        let bestAttributes: any = {};
        let bestImage = "";
        const allNfts: any[] = [];
        characterObjects.forEach((obj: any) => {
          if (!obj?.data) return;
          const mmr = Number(obj.data.content?.fields?.mmr) || 0;
          let attributes = {};
          try {
            attributes = JSON.parse(
              obj.data.content?.fields?.attributes || "{}",
            );
          } catch (e) {}
          const name = obj.data.content?.fields?.name || "";
          const imageUrl = getIPFSGatewayUrl(
            (obj.data.display?.data as any)?.image_url || "",
          );
          allNfts.push({
            objectId: obj.data.objectId,
            name,
            imageUrl,
            mmr,
            attributes,
          });
          if (mmr > bestMmr) {
            bestMmr = mmr;
            bestAttributes = attributes;
            bestImage = imageUrl;
          }
        });
        const entry = {
          walletAddress: account.address,
          totalNftSummon: allNfts.length,
          mmrScore: bestMmr === -1 ? null : bestMmr,
          avatarImage: bestImage,
          nftName: allNfts[0]?.name || "",
          lineage: bestAttributes?.lineage || "Unknown",
          attributes: bestAttributes || {},
          allNfts,
        };
        if (mounted) setPodiumEntry(entry);
      } catch (err) {
        console.error("Failed to load podium data for account:", err);
      }
    };
    loadPodiumForAccount();
    return () => {
      mounted = false;
    };
  }, [account?.address]);

  /* derived stats */
  const summonsCount = characters.length || 0;
  const bestMmrNum = characters.reduce((max, c) => {
    const val = Number(c?.mmr ?? c?.attributes?.mmr ?? 0);
    return isNaN(val) ? max : Math.max(max, val);
  }, 0);
  const avgMmrNum = summonsCount
    ? Math.round(
        characters.reduce(
          (sum, c) => sum + (Number(c?.mmr ?? c?.attributes?.mmr ?? 0) || 0),
          0,
        ) / Math.max(1, summonsCount),
      )
    : 0;

  const lineageMap: Record<string, number> = {};
  characters.forEach((c) => {
    const lin =
      c?.attributes?.lineage ||
      c?.attributes?.Lineage ||
      c?.attributes?.lineage_name ||
      "Unknown";
    lineageMap[lin] = (lineageMap[lin] || 0) + 1;
  });
  const topLineages = Object.entries(lineageMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name]) => name);

  // Carousel helpers: previous / next character index
  const prev = () =>
    setIndex((i) =>
      characters.length ? (i - 1 + characters.length) % characters.length : 0,
    );
  const next = () =>
    setIndex((i) => (characters.length ? (i + 1) % characters.length : 0));

  // Derived attributes for the currently selected character (or podium fallback)
  const attrs = characters[index]?.attributes ?? podiumEntry?.attributes ?? {};
  const mmr =
    characters[index]?.mmr ??
    characters[index]?.attributes?.mmr ??
    podiumEntry?.mmrScore ??
    "200,000";

  const tabs = ["Stats", "Collections", "Orders"] as const;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.gray50,
        fontFamily: "inherit",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ padding: "1rem 1.5rem", flex: 1 }}>
        <PageHeader />

        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            marginTop: 120,
            marginBottom: 80,
          }}
        >
          {/* ── Page Title ── */}
          <h1
            className="font-headline text-6xl md:text-8xl font-bold text-black uppercase mb-10"
            style={{
              textShadow:
                "-2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff, 2px 2px 0 #fff, 6px 6px 0px #000",
            }}
          >
            My Collection
          </h1>

          {/* ── Main Grid ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "360px 1fr",
              gap: 20,
              alignItems: "start",
            }}
          >
            {/* ── Left: Avatar Card ── */}
            <Card
              style={{
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                minHeight: 590,
              }}
            >
              {/* Avatar image */}
              <div
                style={{
                  width: "100%",
                  aspectRatio: "1",
                  minHeight: 360,
                  background: C.gray100,
                  border: `2px solid ${C.black}`,
                  borderRadius: 12,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={
                    characters.length > 0
                      ? characters[index].imageUrl
                      : "https://i.imgur.com/8b20GzT.png"
                  }
                  alt={characters.length > 0 ? characters[index].name : "Makoa"}
                  style={{ width: "80%", height: "80%", objectFit: "contain" }}
                />
              </div>

              {/* Name + handle */}
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: "-0.01em",
                    color: C.black,
                  }}
                >
                  {characters.length > 0 ? characters[index].name : "MAKOA"}
                </div>
                <div style={{ marginTop: 4 }}>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: 11,
                      background: C.black,
                      color: C.white,
                      padding: "2px 8px",
                      borderRadius: 4,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {account?.address
                      ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}`
                      : "@selab.sui"}
                  </span>
                </div>
              </div>

              {/* Prev / Next nav */}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={prev}
                  aria-label="previous character"
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    border: `2px solid ${C.black}`,
                    borderRadius: 10,
                    background: C.white,
                    fontWeight: 800,
                    fontSize: 16,
                    cursor: "pointer",
                    boxShadow: `2px 2px 0 ${C.black}`,
                    transition: "all 0.1s",
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translate(2px,2px)";
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.boxShadow = `2px 2px 0 ${C.black}`;
                    e.currentTarget.style.transform = "none";
                  }}
                >
                  <ChevronLeft size={18} style={{ margin: "0 auto" }} />
                </button>
                <button
                  onClick={next}
                  aria-label="next character"
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    border: `2px solid ${C.black}`,
                    borderRadius: 10,
                    background: C.yellow,
                    fontWeight: 800,
                    fontSize: 16,
                    cursor: "pointer",
                    boxShadow: `2px 2px 0 ${C.black}`,
                    transition: "all 0.1s",
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translate(2px,2px)";
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.boxShadow = `2px 2px 0 ${C.black}`;
                    e.currentTarget.style.transform = "none";
                  }}
                >
                  <ChevronRight size={18} style={{ margin: "0 auto" }} />
                </button>
              </div>

              {/* Char counter */}
              {characters.length > 0 && (
                <div
                  style={{
                    textAlign: "center",
                    fontSize: 11,
                    color: C.gray400,
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                  }}
                >
                  {index + 1} / {characters.length}
                </div>
              )}
            </Card>

            {/* ── Right: Tabs + Content ── */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                minWidth: 0,
              }}
            >
              {/* Tab Bar */}
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  background: C.white,
                  border: `2px solid ${C.black}`,
                  borderRadius: 12,
                  padding: 4,
                  width: "fit-content",
                }}
              >
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: "7px 18px",
                      border:
                        activeTab === tab
                          ? `2px solid ${C.black}`
                          : "2px solid transparent",
                      borderRadius: 8,
                      background: activeTab === tab ? C.black : "transparent",
                      color: activeTab === tab ? C.white : C.gray600,
                      fontWeight: 800,
                      fontSize: 12,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* ── Stats Tab ── */}
              {activeTab === "Stats" && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
                >
                  {/* MMR Hero */}
                  <Card
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      padding: "16px 20px",
                    }}
                  >
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 12,
                        background: C.black,
                        border: `2px solid ${C.black}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <BarChart2 size={24} color={C.yellow} />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: C.gray400,
                          marginBottom: 2,
                        }}
                      >
                        Global MMR Rating
                      </div>
                      <div
                        style={{
                          fontSize: 32,
                          fontWeight: 900,
                          color: C.black,
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {typeof mmr === "number" ? mmr.toLocaleString() : mmr}
                      </div>
                    </div>
                  </Card>

                  {/* Skills */}
                  <Card>
                    <SectionLabel icon={<Zap size={12} />}>Skills</SectionLabel>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      <SkillBar
                        label="Cuteness"
                        value={Number(attrs.cuteness ?? 0)}
                        accent={C.pink}
                      />
                      <SkillBar
                        label="Confidence"
                        value={Number(attrs.confidence ?? 0)}
                        accent={C.blue}
                      />
                      <SkillBar
                        label="Telli Factor"
                        value={Number(attrs.tiliFactor ?? 0)}
                        accent={C.yellow}
                      />
                    </div>
                  </Card>

                  {/* Territory + Traits side by side */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 16,
                    }}
                  >
                    {/* Territory */}
                    <Card>
                      <SectionLabel icon={<MapPin size={12} />}>
                        Territory
                      </SectionLabel>
                      {(() => {
                        const current = characters[index] ?? podiumEntry ?? {};
                        const rawTerr =
                          current?.attributes?.territory ??
                          current?.attributes?.country_affinity ??
                          current?.attributes?.countryAffinity ??
                          current?.attributes ??
                          {};
                        // normalizeMap: converts various territory shapes into a
                        // consistent map keyed by lowercase names.
                        const normalizeMap = (src: any) => {
                          const out: Record<string, any> = {};
                          if (!src) return out;
                          if (Array.isArray(src)) {
                            src.forEach((it: any) => {
                              const k =
                                (it.trait_type ??
                                  it.traitType ??
                                  it.name ??
                                  it.label ??
                                  it.key ??
                                  "") + "";
                              const v = it.value ?? it.val ?? it.count ?? 0;
                              if (k) out[String(k).toLowerCase()] = v;
                            });
                            return out;
                          }
                          if (typeof src === "object") {
                            Object.keys(src).forEach((k) => {
                              out[k.toLowerCase()] = src[k];
                            });
                            return out;
                          }
                          return out;
                        };
                        const terr = normalizeMap(rawTerr);
                        const items = [
                          {
                            name: "Luzon",
                            value:
                              terr.luzon ??
                              terr.luzon_score ??
                              terr["luzon%"] ??
                              0,
                          },
                          {
                            name: "Visayas",
                            value: terr.visayas ?? terr.visayas_score ?? 0,
                          },
                          {
                            name: "Mindanao",
                            value: terr.mindanao ?? terr.mindanao_score ?? 0,
                          },
                        ];
                        return (
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-around",
                              alignItems: "flex-end",
                              height: 100,
                              gap: 8,
                            }}
                          >
                            {items.map((t) => {
                              const val = Math.max(
                                0,
                                Math.min(100, Number(t.value || 0)),
                              );
                              return (
                                <div
                                  key={t.name}
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    flex: 1,
                                    gap: 4,
                                  }}
                                >
                                  <span
                                    style={{
                                      fontWeight: 800,
                                      fontSize: 12,
                                      color: C.green,
                                    }}
                                  >
                                    {val}
                                  </span>
                                  <div
                                    style={{
                                      width: "100%",
                                      maxWidth: 36,
                                      height: 60,
                                      display: "flex",
                                      flexDirection: "column",
                                      justifyContent: "flex-end",
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: "100%",
                                        height: `${val}%`,
                                        minHeight: 4,
                                        background: C.green,
                                        borderRadius: "4px 4px 0 0",
                                        border: `2px solid ${C.black}`,
                                        transition: "height 0.4s ease",
                                      }}
                                    />
                                  </div>
                                  <span
                                    style={{
                                      fontSize: 9,
                                      fontWeight: 700,
                                      textTransform: "uppercase",
                                      letterSpacing: "0.06em",
                                      color: C.gray400,
                                    }}
                                  >
                                    {t.name}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </Card>

                    {/* Traits */}
                    <Card>
                      <SectionLabel icon={<Hash size={12} />}>
                        Traits
                      </SectionLabel>
                      {(() => {
                        const current = characters[index] ?? podiumEntry ?? {};
                        const rawTraits =
                          current?.attributes?.traits ??
                          current?.attributes?.visual_traits ??
                          current?.attributes?.properties ??
                          current?.attributes ??
                          {};
                        // normalizeTraits: same idea as normalizeMap but for trait
                        // arrays / objects. Results use lowercase keys.
                        const normalizeTraits = (src: any) => {
                          const out: Record<string, any> = {};
                          if (!src) return out;
                          if (Array.isArray(src)) {
                            src.forEach((it: any) => {
                              const k =
                                (it.trait_type ??
                                  it.traitType ??
                                  it.trait ??
                                  it.name ??
                                  it.label ??
                                  "") + "";
                              const v =
                                it.value ??
                                it.trait_value ??
                                it.val ??
                                undefined;
                              if (k) out[String(k).toLowerCase()] = v ?? "";
                            });
                            return out;
                          }
                          if (typeof src === "object") {
                            Object.keys(src).forEach((k) => {
                              out[k.toLowerCase()] = src[k];
                            });
                            return out;
                          }
                          return out;
                        };
                        const t = normalizeTraits(rawTraits);
                        // pick: helper to look through alternative keys and return
                        // the first non-empty value (useful for inconsistent metadata)
                        const pick = (keys: string[]) => {
                          for (const k of keys) {
                            const v = t[k.toLowerCase()];
                            if (v != null && v !== "") return v;
                          }
                          return null;
                        };
                        const preferred: [string, any][] = [
                          [
                            "STYLE",
                            pick([
                              "style",
                              "type",
                              "visualstyle",
                              "visual_style",
                            ]),
                          ],
                          ["HAIR", pick(["hair", "hairstyle", "hair_style"])],
                          ["FACE", pick(["face", "facial", "expression"])],
                          ["EYEWEAR", pick(["eyewear", "glasses", "eyes"])],
                          [
                            "HELD",
                            pick([
                              "held",
                              "held_item",
                              "holding",
                              "held_item_name",
                              "weapon",
                            ]),
                          ],
                          ["WEAR", pick(["wear", "equipment", "weapon"])],
                          ["HEAD", pick(["head", "headpiece", "hat"])],
                        ];
                        let entries = preferred.filter(
                          ([, v]) => v != null && v !== "",
                        );
                        const other = Object.entries(t)
                          .filter(([, v]) => v != null && v !== "")
                          .filter(
                            ([k]) =>
                              !entries.some(
                                ([ek]) => ek.toLowerCase() === k.toLowerCase(),
                              ),
                          )
                          .slice(0, Math.max(0, 6 - entries.length))
                          .map(([k, v]) => [k.toUpperCase(), v]);
                        if (other.length)
                          entries = entries.concat(other as any[]);
                        if (entries.length === 0) {
                          const allEntries = Object.entries(t).filter(
                            ([, v]) => v != null && v !== "",
                          );
                          if (allEntries.length > 0)
                            entries = allEntries
                              .slice(0, 6)
                              .map(([k, v]) => [k.toUpperCase(), v]);
                          else
                            entries = [
                              ["STYLE", "Nature"],
                              ["FACE", "Stubbi"],
                              ["WEAR", "Sniper Rifle"],
                              ["HEAD", "Fluff"],
                              ["EYEWEAR", "Yea"],
                            ];
                        }
                        return (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 6,
                            }}
                          >
                            {entries.slice(0, 5).map(([k, v]) => (
                              <div
                                key={String(k)}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  padding: "5px 8px",
                                  background: C.gray50,
                                  border: `1.5px solid ${C.gray200}`,
                                  borderRadius: 6,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 9,
                                    fontWeight: 800,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.08em",
                                    color: C.gray400,
                                  }}
                                >
                                  {k}
                                </span>
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: C.black,
                                  }}
                                >
                                  {String(v)}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </Card>
                  </div>
                </div>
              )}

              {/* ── Collections Tab ── */}
              {activeTab === "Collections" && (
                <Card>
                  <SectionLabel>Collections ({characters.length})</SectionLabel>
                  {characters.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "40px 0",
                        color: C.gray400,
                      }}
                    >
                      <ShoppingBag size={32} style={{ margin: "0 auto 8px" }} />
                      <p style={{ fontWeight: 700, fontSize: 13 }}>
                        No characters owned yet.
                      </p>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(140px, 1fr))",
                        gap: 12,
                        maxHeight: 500,
                        overflowY: "auto",
                      }}
                    >
                      {characters.map((c, i) => (
                        <div
                          key={c.objectId || i}
                          onClick={() => setIndex(i)}
                          style={{
                            border: `2px solid ${i === index ? C.yellow : C.black}`,
                            borderRadius: 12,
                            overflow: "hidden",
                            cursor: "pointer",
                            background: C.white,
                            boxShadow: `3px 3px 0 ${i === index ? C.yellow : C.black}`,
                            transition: "all 0.15s",
                          }}
                        >
                          <div
                            style={{
                              background: C.gray100,
                              aspectRatio: "1",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <img
                              src={c.imageUrl}
                              alt={c.name}
                              style={{
                                width: "80%",
                                height: "80%",
                                objectFit: "contain",
                              }}
                            />
                          </div>
                          <div style={{ padding: "6px 8px" }}>
                            <div
                              style={{
                                fontWeight: 800,
                                fontSize: 11,
                                textTransform: "uppercase",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {c.name}
                            </div>
                            <div
                              style={{
                                fontSize: 10,
                                color: C.gray400,
                                fontWeight: 600,
                              }}
                            >
                              MMR {c.mmr ?? 0}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}

              {/* ── Orders Tab ── */}
              {activeTab === "Orders" && <OrdersPanel account={account} />}
            </div>
          </div>

          {/* ── Bottom Player Stats Row ── */}
          <div style={{ marginTop: 24 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: C.gray600,
                marginBottom: 12,
              }}
            >
              Player Stats
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 12,
              }}
            >
              <StatBox
                icon={<BarChart2 size={20} />}
                label="Best MMR"
                value={bestMmrNum.toLocaleString()}
                accent={C.blue}
              />
              <StatBox
                icon={<BarChart2 size={20} />}
                label="Avg MMR"
                value={avgMmrNum.toLocaleString()}
                accent={C.pink}
              />
              <StatBox
                icon={<Zap size={20} />}
                label="Summons"
                value={summonsCount}
                accent={C.green}
              />
              <Card style={{ padding: 16 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: C.gray400,
                    marginBottom: 8,
                  }}
                >
                  Lineage
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {topLineages.length === 0 ? (
                    <Badge color={C.gray200} textColor={C.gray600}>
                      Unknown
                    </Badge>
                  ) : (
                    topLineages.map((l) => (
                      <Badge key={l} color={C.blue} textColor={C.white}>
                        {l}
                      </Badge>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <PageFooter />
    </div>
  );
}

/* ─────────────────────────────────────────
  Orders Panel
  - Responsible for loading, normalizing and displaying purchase receipts
  - Includes helpers: loadOrders, getStatusInfo, getTrackingUrl
───────────────────────────────────────── */
interface Order {
  objectId: string;
  nftId: string;
  itemsSelected: string;
  paymentAmount: number;
  status: number;
  createdAt: number;
  trackingNumber: string;
  carrier: string;
  estimatedDelivery: number;
  character?: { name: string; imageUrl: string };
}

interface StatusInfo {
  text: string;
  icon: React.ReactNode;
  bg: string;
  textColor: string;
}

function OrdersPanel({ account }: { account: any }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (account?.address) loadOrders();
    else setLoading(false);
  }, [account?.address]);

  const loadOrders = async () => {
    if (!account?.address) return;
    setLoading(true);
    setError("");
    try {
      let allReceiptIds: string[] = [];
      let allBuyerAddresses: string[] = [];
      let hasNextPage = true;
      let cursor: string | null = null;
      while (hasNextPage) {
        const page: any = await suiClient.queryEvents({
          query: {
            MoveEventType: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.ORDER_RECEIPT}::ReceiptCreated`,
          },
          cursor,
          order: "ascending",
        });
        page.data.forEach((event: any) => {
          allReceiptIds.push(event.parsedJson?.receipt_id);
          allBuyerAddresses.push(event.parsedJson?.buyer);
        });
        if (page.hasNextPage && page.nextCursor) cursor = page.nextCursor;
        else hasNextPage = false;
      }
      const userReceiptIds = allReceiptIds.filter(
        (_, idx) => allBuyerAddresses[idx] === account.address,
      );
      if (userReceiptIds.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }
      const receipts: any[] = [];
      for (let i = 0; i < userReceiptIds.length; i += 50) {
        const chunk = userReceiptIds.slice(i, i + 50);
        const chunkReceipts = await suiClient.multiGetObjects({
          ids: chunk,
          options: { showContent: true },
        });
        receipts.push(...chunkReceipts);
      }
      const validReceipts = receipts.filter((r) => r.data);
      const parsedReceipts: Omit<Order, "character">[] = validReceipts
        .map((obj: any) => ({
          objectId: obj.data.objectId,
          nftId: obj.data.content.fields.nft_id,
          itemsSelected: obj.data.content.fields.items_selected,
          status: Number(obj.data.content.fields.status),
          paymentAmount: Number(obj.data.content.fields.payment_amount),
          createdAt: Number(obj.data.content.fields.created_at),
          trackingNumber: obj.data.content.fields.tracking_number || "",
          carrier: obj.data.content.fields.carrier || "",
          estimatedDelivery: Number(
            obj.data.content.fields.estimated_delivery || 0,
          ),
        }))
        .sort((a, b) => b.createdAt - a.createdAt);
      const nftIds = parsedReceipts.map((r) => r.nftId);
      const nftObjects = await suiClient.multiGetObjects({
        ids: nftIds,
        options: { showDisplay: true },
      });
      const nftsMap = new Map(
        nftObjects
          .filter((obj) => obj.data)
          .map((obj) => [
            obj.data?.objectId,
            {
              imageUrl: getIPFSGatewayUrl(
                (obj.data?.display?.data as any)?.image_url,
              ),
              name: (obj.data?.display?.data as any)?.name,
            },
          ]),
      );
      setOrders(
        parsedReceipts.map((receipt) => ({
          ...receipt,
          character: nftsMap.get(receipt.nftId),
        })) as Order[],
      );
    } catch (err) {
      console.error("Failed to load orders:", err);
      setError("Failed to load orders. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: number): StatusInfo => {
    switch (status) {
      case ORDER_STATUS.SHIPPED:
        return {
          text: "In Transit",
          icon: <Truck size={12} />,
          bg: C.blue,
          textColor: C.white,
        };
      case ORDER_STATUS.DELIVERED:
        return {
          text: "Delivered",
          icon: <CheckCircle size={12} />,
          bg: C.green,
          textColor: C.white,
        };
      default:
        return {
          text: "Processing",
          icon: <Package size={12} />,
          bg: C.yellow,
          textColor: C.black,
        };
    }
  };

  const getTrackingUrl = (carrier: string, trackingNumber: string) => {
    const c = (carrier || "").toUpperCase();
    if (c.includes("UPS"))
      return `https://www.ups.com/track?tracknum=${trackingNumber}`;
    if (c.includes("FEDEX"))
      return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
    if (c.includes("LBC"))
      return `https://www.lbcexpress.com/track/?tracking_no=${trackingNumber}`;
    if (
      c.includes("J&T") ||
      c.includes("JNT") ||
      c.includes("SPX") ||
      c.includes("SHOPEE") ||
      c.includes("NINJA")
    )
      return `https://t.17track.net/en#nums=${trackingNumber}`;
    return "";
  };

  if (!account)
    return (
      <Card style={{ textAlign: "center", padding: 48 }}>
        <div
          style={{
            width: 56,
            height: 56,
            background: C.gray100,
            border: `2px solid ${C.black}`,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <Wallet size={24} />
        </div>
        <h3
          style={{
            fontWeight: 900,
            fontSize: 18,
            textTransform: "uppercase",
            margin: "0 0 8px",
          }}
        >
          Connect Wallet
        </h3>
        <p
          style={{
            color: C.gray400,
            fontWeight: 600,
            fontSize: 13,
            margin: "0 0 20px",
          }}
        >
          Connect your wallet to view orders.
        </p>
        <CustomConnectButton />
      </Card>
    );

  if (loading)
    return (
      <Card
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 160,
        }}
      >
        <LoaderCircle
          size={28}
          style={{ animation: "spin 1s linear infinite", color: C.black }}
        />
      </Card>
    );

  if (error)
    return (
      <Card style={{ textAlign: "center", padding: 40 }}>
        <ShieldAlert size={32} color="red" style={{ margin: "0 auto 8px" }} />
        <p style={{ fontWeight: 700 }}>{error}</p>
      </Card>
    );

  if (orders.length === 0)
    return (
      <Card style={{ textAlign: "center", padding: 48 }}>
        <ShoppingBag
          size={32}
          style={{ margin: "0 auto 12px", color: C.gray400 }}
        />
        <h3
          style={{
            fontWeight: 900,
            fontSize: 16,
            textTransform: "uppercase",
            margin: "0 0 4px",
          }}
        >
          No Orders Yet
        </h3>
        <p style={{ color: C.gray400, fontSize: 13 }}>
          You haven't claimed any physical items.
        </p>
      </Card>
    );

  return (
    <>
      <Card>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <SectionLabel icon={<Package size={12} />}>
            Orders ({orders.length})
          </SectionLabel>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            maxHeight: 440,
            overflowY: "auto",
          }}
        >
          {orders.map((order) => {
            const si = getStatusInfo(order.status);
            return (
              <div
                key={order.objectId}
                onClick={() => setSelectedOrder(order)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 12,
                  border: `2px solid ${C.gray200}`,
                  borderRadius: 12,
                  cursor: "pointer",
                  background: C.white,
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = C.black)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = C.gray200)
                }
              >
                {/* Thumbnail */}
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 10,
                    border: `2px solid ${C.black}`,
                    overflow: "hidden",
                    background: C.gray100,
                    flexShrink: 0,
                    position: "relative",
                  }}
                >
                  {order.character?.imageUrl && (
                    <Image
                      src={order.character.imageUrl}
                      alt="nft"
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 13,
                      textTransform: "uppercase",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {order.character?.name || "Unknown"}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      marginTop: 3,
                      fontSize: 11,
                      color: C.gray400,
                      fontWeight: 600,
                    }}
                  >
                    <span
                      style={{ display: "flex", alignItems: "center", gap: 3 }}
                    >
                      <Calendar size={10} />
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                    <span
                      style={{ display: "flex", alignItems: "center", gap: 3 }}
                    >
                      <Hash size={10} />
                      {(order.paymentAmount / 1_000_000_000).toFixed(2)} SUI
                    </span>
                  </div>
                </div>

                {/* Status pill */}
                <Badge color={si.bg} textColor={si.textColor}>
                  {si.icon} {si.text}
                </Badge>
              </div>
            );
          })}
        </div>
      </Card>

      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          statusInfo={getStatusInfo(selectedOrder.status)}
          trackingUrl={getTrackingUrl(
            selectedOrder.carrier,
            selectedOrder.trackingNumber,
          )}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </>
  );
}

function OrderModal({
  order,
  statusInfo,
  trackingUrl,
  onClose,
}: {
  order: Order;
  statusInfo: StatusInfo;
  trackingUrl: string;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 520,
          background: C.white,
          border: `2px solid ${C.black}`,
          borderRadius: 16,
          boxShadow: `6px 6px 0 ${C.black}`,
          padding: 24,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 20,
          }}
        >
          <div>
            <h2
              style={{
                fontWeight: 900,
                fontSize: 20,
                margin: 0,
                textTransform: "uppercase",
              }}
            >
              Order Receipt
            </h2>
            <p
              style={{
                fontFamily: "monospace",
                fontSize: 10,
                color: C.gray400,
                margin: "4px 0 0",
              }}
            >
              {order.objectId.slice(0, 20)}...
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: C.black,
              color: C.white,
              border: "none",
              borderRadius: 8,
              width: 32,
              height: 32,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Character + status */}
        <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 12,
              border: `2px solid ${C.black}`,
              overflow: "hidden",
              background: C.gray100,
              flexShrink: 0,
              position: "relative",
            }}
          >
            {order.character?.imageUrl && (
              <Image
                src={order.character.imageUrl}
                alt="nft"
                fill
                style={{ objectFit: "cover" }}
              />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <Badge color={statusInfo.bg} textColor={statusInfo.textColor}>
              {statusInfo.icon} {statusInfo.text}
            </Badge>
            <div
              style={{
                fontWeight: 900,
                fontSize: 18,
                textTransform: "uppercase",
                margin: "6px 0 8px",
              }}
            >
              {order.character?.name}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {order.itemsSelected.split(",").map((it, i) => (
                <Badge key={i} color={C.yellow}>
                  {it.trim()}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 16,
          }}
        >
          {[
            {
              label: "Payment",
              value: `${(order.paymentAmount / 1_000_000_000).toFixed(2)} SUI`,
            },
            {
              label: "Order Date",
              value: new Date(order.createdAt).toLocaleDateString(),
            },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                background: C.gray50,
                border: `1.5px solid ${C.gray200}`,
                borderRadius: 10,
                padding: "10px 14px",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: C.gray400,
                  marginBottom: 2,
                }}
              >
                {label}
              </div>
              <div style={{ fontWeight: 800, fontSize: 14 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Tracking */}
        <div
          style={{
            background: C.gray50,
            border: `1.5px dashed ${C.gray200}`,
            borderRadius: 10,
            padding: "14px 16px",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontWeight: 800,
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 10,
            }}
          >
            Live Tracking
          </div>
          {order.status >= ORDER_STATUS.SHIPPED ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                ["Carrier", order.carrier],
                ["Tracking #", order.trackingNumber],
              ].map(([l, v]) => (
                <div
                  key={l}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: C.gray400, fontWeight: 600 }}>{l}</span>
                  <span
                    style={{
                      fontWeight: 700,
                      fontFamily: l === "Tracking #" ? "monospace" : "inherit",
                    }}
                  >
                    {v}
                  </span>
                </div>
              ))}
              {trackingUrl && (
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(order.trackingNumber);
                    window.open(trackingUrl, "_blank");
                  }}
                  style={{
                    marginTop: 8,
                    width: "100%",
                    padding: "8px 0",
                    background: C.blue,
                    color: C.white,
                    border: `2px solid ${C.black}`,
                    borderRadius: 8,
                    fontWeight: 800,
                    fontSize: 12,
                    textTransform: "uppercase",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  Track Package <ExternalLink size={12} />
                </button>
              )}
            </div>
          ) : (
            <p
              style={{
                fontSize: 12,
                color: C.gray400,
                fontStyle: "italic",
                margin: 0,
              }}
            >
              Crafting your gear… Tracking info will appear once shipped.
            </p>
          )}
        </div>

        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "10px 0",
            background: C.black,
            color: C.white,
            border: "none",
            borderRadius: 10,
            fontWeight: 800,
            fontSize: 13,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            cursor: "pointer",
          }}
        >
          Close Receipt
        </button>
      </div>
    </div>
  );
}
