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
  MapPin,
  Clock,
  X,
} from "lucide-react";
import { CustomConnectButton } from "@/components/kapogian/CustomConnectButton";

export default function Page() {
  const account = useCurrentAccount();
  const [characters, setCharacters] = useState<any[]>([]);
  const [index, setIndex] = useState(0);
  const [podiumEntry, setPodiumEntry] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<
    "Collections" | "Orders" | "Stats"
  >("Stats");

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

            // normalize attribute names and traits into a consistent shape
            // traits can come as an array of objects or as a properties map; convert to lowercased key map
            const extractTraits = (src: any) => {
              const out: Record<string, any> = {};
              if (!src) return out;
              // if it's an array of { trait_type, value } or similar
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

              // if it's an object mapping
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

  // Aggregate stats for the user's collection
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

  // compute top lineages
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

  const prev = () =>
    setIndex((i) =>
      characters.length ? (i - 1 + characters.length) % characters.length : 0,
    );
  const next = () =>
    setIndex((i) => (characters.length ? (i + 1) % characters.length : 0));

  const attrs = characters[index]?.attributes ?? podiumEntry?.attributes ?? {};
  const mmr =
    characters[index]?.mmr ??
    characters[index]?.attributes?.mmr ??
    podiumEntry?.mmrScore ??
    "200,000";

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

  return (
    <div className="min-h-screen bg-gray-100 font-body flex flex-col overflow-hidden">
      <div className="p-4 sm:p-8 flex-1">
        <PageHeader />

        <div className="max-w-7xl mx-auto mt-28 lg:mt-32 mb-20">
          <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <h1
              className="font-headline text-6xl md:text-8xl font-bold text-black uppercase"
              style={{
                textShadow:
                  "-2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff, 2px 2px 0 #fff, 6px 6px 0px #000",
              }}
            >
              My Profile
            </h1>
          </header>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left column: Tall card with avatar and name */}
            <aside className="lg:col-span-4">
              <div className="bg-white rounded-2xl border-2 border-black p-4 flex flex-col max-h-[640px] overflow-y-auto bento-shadow">
                <div className="flex justify-between items-start">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-yellow-400 text-black text-sm font-bold border-2 border-black">
                    <span>★</span>
                    <span className="font-headline">BALARTNONSLAYER</span>
                    <span>★</span>
                  </div>
                  <div className="w-8 h-8 bg-white rounded-md border-2 border-black flex items-center justify-center">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 5h14v14H5z"
                      />
                    </svg>
                  </div>
                </div>

                <div className="mt-4 flex-grow flex items-center justify-center">
                  <div className="w-full h-[350px] bg-white rounded-lg border-2 border-black flex items-center justify-center">
                    {characters.length > 0 ? (
                      <img
                        src={characters[index].imageUrl}
                        alt={characters[index].name}
                        className="w-48 h-48 object-cover"
                      />
                    ) : (
                      <img
                        src="https://i.imgur.com/8b20GzT.png"
                        alt="Makoa"
                        className="w-48 h-48 object-cover"
                      />
                    )}
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <h2 className="text-4xl font-headline text-black">
                    {characters.length > 0 ? characters[index].name : "MAKOA"}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1 font-bold">
                    <span className="font-mono bg-black text-white px-2 py-1 rounded">
                      @selab.sui
                    </span>
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <button
                    onClick={prev}
                    aria-label="previous character"
                    className="flex-1 py-2 rounded-lg border-2 border-black bg-white text-black font-bold text-2xl shadow-[2px_2px_0px_0px_#000] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                  >
                    &lt;
                  </button>
                  <button
                    onClick={next}
                    aria-label="next character"
                    className="flex-1 py-2 rounded-lg border-2 border-black bg-yellow-400 text-black font-bold text-2xl shadow-[2px_2px_0px_0px_#000] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                  >
                    &gt;
                  </button>
                </div>
              </div>
            </aside>

            {/* Right column: Stats and details */}
            <main className="lg:col-span-8 max-h-[580px] overflow-y-auto pr-2">
              <div className="sticky top-0 z-20  py-4 mb-4">
                <nav className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab("Collections")}
                    className={`px-4 py-2 rounded-full border-2 font-bold ${
                      activeTab === "Collections"
                        ? "bg-black text-white"
                        : "bg-white text-black"
                    }`}
                  >
                    Collections
                  </button>
                  <button
                    onClick={() => setActiveTab("Orders")}
                    className={`px-4 py-2 rounded-full border-2 font-bold ${
                      activeTab === "Orders"
                        ? "bg-black text-white"
                        : "bg-white text-black"
                    }`}
                  >
                    Orders
                  </button>
                  <button
                    onClick={() => setActiveTab("Stats")}
                    className={`px-4 py-2 rounded-full border-2 font-bold ${
                      activeTab === "Stats"
                        ? "bg-black text-white"
                        : "bg-white text-black"
                    }`}
                  >
                    Stats
                  </button>
                </nav>
              </div>
              <div>
                {activeTab === "Stats" ? (
                  <div className="space-y-6">
                    <div className="bg-white rounded-2xl border-2 border-black p-4 bento-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-lg border-2 border-black bg-blue-500 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-white" />
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 font-bold">
                              GLOBAL MMR RATING
                            </div>
                            <div className="text-4xl font-headline text-black">
                              {mmr ?? "200,000"}
                            </div>
                          </div>
                        </div>
                        <div />
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border-2 border-black p-6 bento-shadow">
                      <h3 className="text-lg font-headline text-black flex items-center gap-2">
                        <span className="text-pink-500">✚</span> SKILLS
                      </h3>
                      <div className="space-y-3 mt-4">
                        {[
                          {
                            label: "CUTENESS",
                            key: "cuteness",
                            color: "bg-pink-500",
                          },
                          {
                            label: "CONFIDENCE",
                            key: "confidence",
                            color: "bg-blue-500",
                          },
                          {
                            label: "TELLI FACTOR",
                            key: "tiliFactor",
                            color: "bg-yellow-400",
                          },
                        ].map((s) => {
                          const val = Math.max(
                            0,
                            Math.min(100, Number(attrs[s.key] ?? 0)),
                          );
                          return (
                            <div key={s.label}>
                              <div className="flex justify-between text-xs text-black font-bold mb-1">
                                <span>{s.label}</span>
                                <span>{val}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-4 border-2 border-black p-0.5">
                                <div
                                  className={`${s.color} h-full rounded-full border-2 border-black`}
                                  style={{ width: `${val}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border-2 border-black p-6 bento-shadow">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1">
                          <h4 className="text-lg font-headline text-black flex items-center gap-2 mb-4">
                            <span className="text-green-500">⌖</span> TERRITORY
                          </h4>
                          <div className="flex justify-around items-center gap-2 h-40">
                            {(() => {
                              // Prefer territory / country affinity from the selected character or podium entry
                              const current =
                                characters[index] ?? podiumEntry ?? {};
                              const rawTerr =
                                current?.attributes?.territory ??
                                current?.attributes?.country_affinity ??
                                current?.attributes?.countryAffinity ??
                                current?.attributes ??
                                {};

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
                                    const v =
                                      it.value ?? it.val ?? it.count ?? 0;
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
                                  value:
                                    terr.visayas ?? terr.visayas_score ?? 0,
                                },
                                {
                                  name: "Mindanao",
                                  value:
                                    terr.mindanao ?? terr.mindanao_score ?? 0,
                                },
                              ];
                              return items.map((t) => {
                                const val = Math.max(
                                  0,
                                  Math.min(100, Number(t.value || 0)),
                                );
                                const h = val + "%";
                                return (
                                  <div
                                    key={t.name}
                                    className="flex flex-col items-center text-center"
                                  >
                                    <div
                                      className="font-bold text-lg mb-1"
                                      style={{ color: "#00D58B" }}
                                    >
                                      {val}
                                    </div>
                                    <div className="w-16 h-24 flex flex-col justify-end">
                                      <div
                                        className="bg-[#00D58B] rounded-t-2xl w-full"
                                        style={{ height: h }}
                                      />
                                    </div>
                                    <div className="text-xs text-slate-500 font-bold mt-2 uppercase">
                                      {t.name}
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <h4 className="text-lg font-headline text-black flex items-center gap-2 mb-4">
                            <span className="text-orange-500">#</span> TRAITS
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            {(() => {
                              // Prefer the currently selected character's real visual traits (or podium entry)
                              const current =
                                characters[index] ?? podiumEntry ?? {};
                              const rawTraits =
                                current?.attributes?.traits ??
                                current?.attributes?.visual_traits ??
                                current?.attributes?.properties ??
                                current?.attributes ??
                                {};

                              const normalizeTraits = (src: any) => {
                                const out: Record<string, any> = {};
                                if (!src) return out;
                                // array of trait objects
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
                                    if (k)
                                      out[String(k).toLowerCase()] = v ?? "";
                                  });
                                  return out;
                                }

                                // object mapping
                                if (typeof src === "object") {
                                  Object.keys(src).forEach((k) => {
                                    out[k.toLowerCase()] = src[k];
                                  });
                                  return out;
                                }

                                return out;
                              };

                              const t = normalizeTraits(rawTraits);

                              const pick = (keys: string[]) => {
                                for (const k of keys) {
                                  const v = t[k.toLowerCase()];
                                  if (v != null && v !== "") return v;
                                }
                                return null;
                              };

                              const preferred = [
                                [
                                  "STYLE",
                                  pick([
                                    "style",
                                    "type",
                                    "visualstyle",
                                    "visual_style",
                                  ]),
                                ],
                                [
                                  "HAIR",
                                  pick(["hair", "hairstyle", "hair_style"]),
                                ],
                                [
                                  "FACE",
                                  pick(["face", "facial", "expression"]),
                                ],
                                [
                                  "EYEWEAR",
                                  pick(["eyewear", "glasses", "eyes"]),
                                ],
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

                              // Append other collection-specific trait keys that exist but weren't in preferred list
                              const other = Object.entries(t)
                                .filter(([, v]) => v != null && v !== "")
                                .filter(
                                  ([k]) =>
                                    !entries.some(
                                      ([ek]) =>
                                        ek.toLowerCase() === k.toLowerCase(),
                                    ),
                                )
                                .slice(0, Math.max(0, 6 - entries.length))
                                .map(([k, v]) => [k.toUpperCase(), v]);

                              if (other.length)
                                entries = entries.concat(other as any[]);

                              // If we couldn't find the common keys, but there are traits available,
                              // show the first few available trait entries from the normalized map.
                              if (entries.length === 0) {
                                const allEntries = Object.entries(t).filter(
                                  ([, v]) => v != null && v !== "",
                                );
                                if (allEntries.length > 0) {
                                  return allEntries
                                    .slice(0, 6)
                                    .map(([k, v]) => (
                                      <div
                                        key={String(k)}
                                        className="border-2 border-black rounded-lg p-2 font-bold text-sm bg-white"
                                      >
                                        {k.toUpperCase()}: {String(v)}
                                      </div>
                                    ));
                                }

                                // fall back to the previous static placeholders if nothing is available
                                return (
                                  <>
                                    <div className="border-2 border-black rounded-lg p-2 font-bold text-sm bg-white">
                                      STYLE: Nature
                                    </div>
                                    <div className="border-2 border-black rounded-lg p-2 font-bold text-sm bg-white">
                                      FACE: 28% Stubbi
                                    </div>
                                    <div className="border-2 border-black rounded-lg p-2 font-bold text-sm bg-white">
                                      WEAR: Sniper Rifle
                                    </div>
                                    <div className="border-2 border-black rounded-lg p-2 font-bold text-sm bg-white">
                                      HEAD: 34% Fluff
                                    </div>
                                    <div className="border-2 border-black rounded-lg p-2 font-bold text-sm bg-white">
                                      EYEWEAR: Yea
                                    </div>
                                  </>
                                );
                              }

                              return entries.map(([k, v]) => (
                                <div
                                  key={String(k)}
                                  className="border-2 border-black rounded-lg p-2 font-bold text-sm bg-white"
                                >
                                  {k}: {String(v)}
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : activeTab === "Collections" ? (
                  <div className="space-y-6">
                    <div className="bg-white rounded-2xl border-2 border-black p-6 bento-shadow">
                      <h3 className="text-lg font-headline text-black">
                        Collections
                      </h3>
                      <div className="mt-4 pr-2 space-y-4">
                        {characters.length === 0 ? (
                          <div className="text-sm text-gray-600">
                            You don't own any collections yet.
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-3 gap-4 mt-4">
                              {characters.slice(0, 8).map((c, i) => (
                                <div
                                  key={c.objectId || i}
                                  className="w-full h-72 border-2 border-black rounded-lg p-2 bg-white flex flex-col justify-between"
                                >
                                  <img
                                    src={c.imageUrl}
                                    alt={c.name}
                                    className="w-60 h-60 rounded flex-shrink-0 mx-auto"
                                  />
                                  <div className="">
                                    <div className="font-bold text-sm truncate">
                                      {c.name}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      MMR: {c.mmr ?? c.attributes?.mmr ?? 0}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <OrdersPanel account={account} />
                )}
              </div>
            </main>
          </div>

          <h3 className="text-lg font-headline text-black mt-6 -mb-5">
            Player Stats
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            <div className="bg-white rounded-2xl border-2 border-black p-4 text-center bento-shadow">
              <div className="text-blue-500 text-3xl">Ω</div>
              <div className="text-xs text-gray-600 font-bold mt-1">
                BEST MMR
              </div>
              <div className="text-2xl font-headline text-black">
                {bestMmrNum?.toLocaleString?.() ?? bestMmrNum}
              </div>
            </div>

            <div className="bg-white rounded-2xl border-2 border-black p-4 text-center bento-shadow">
              <div className="text-pink-500 text-3xl">♡</div>
              <div className="text-xs text-gray-600 font-bold mt-1">
                AVG MMR
              </div>
              <div className="text-2xl font-headline text-black">
                {avgMmrNum?.toLocaleString?.() ?? avgMmrNum}
              </div>
            </div>

            <div className="bg-white rounded-2xl border-2 border-black p-4 text-center bento-shadow">
              <div className="text-green-500 text-3xl">⚄</div>
              <div className="text-xs text-gray-600 font-bold mt-1">
                SUMMONS
              </div>
              <div className="text-2xl font-headline text-black">
                {summonsCount}
              </div>
            </div>

            <div className="bg-white rounded-2xl border-2 border-black p-4 bento-shadow">
              <div className="text-xs text-gray-600 font-bold mb-2">
                LINEAGE
              </div>
              <div className="flex flex-wrap gap-2">
                {topLineages.length === 0 ? (
                  <div className="bg-slate-200 text-slate-800 text-xs font-bold px-2 py-1 rounded-md border-2 border-black">
                    Unknown
                  </div>
                ) : (
                  topLineages.map((l) => (
                    <div
                      key={l}
                      className="bg-blue-200 text-blue-800 text-xs font-bold px-2 py-1 rounded-md border-2 border-black"
                    >
                      {l}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <PageFooter />
    </div>
  );
}

// --- OrdersPanel (embedded copy of MyOrders logic for the profile Orders tab) ----------------
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
  character?: {
    name: string;
    imageUrl: string;
  };
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          cursor: cursor,
          order: "ascending",
        });

        page.data.forEach((event: any) => {
          allReceiptIds.push(event.parsedJson?.receipt_id);
          allBuyerAddresses.push(event.parsedJson?.buyer);
        });

        if (page.hasNextPage && page.nextCursor) {
          cursor = page.nextCursor;
        } else {
          hasNextPage = false;
        }
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
      const chunkSize = 50;
      for (let i = 0; i < userReceiptIds.length; i += chunkSize) {
        const chunk = userReceiptIds.slice(i, i + chunkSize);
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

      const combinedOrders = parsedReceipts.map((receipt) => ({
        ...receipt,
        character: nftsMap.get(receipt.nftId),
      }));

      setOrders(combinedOrders as Order[]);
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
          icon: <Truck className="w-4 h-4" />,
          bg: "bg-blue-400",
          textColor: "text-white",
        };
      case ORDER_STATUS.DELIVERED:
        return {
          text: "Delivered",
          icon: <CheckCircle className="w-4 h-4" />,
          bg: "bg-green-500",
          textColor: "text-white",
        };
      default:
        return {
          text: "Processing",
          icon: <Package className="w-4 h-4" />,
          bg: "bg-yellow-400",
          textColor: "text-black",
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

  return (
    <div className="space-y-6">
      {!account ? (
        <div className="bg-white border-4 border-black rounded-[3rem] p-16 text-center shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
          <div className="w-24 h-24 bg-gray-100 rounded-full border-4 border-black flex items-center justify-center mx-auto mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Wallet size={48} />
          </div>
          <h3 className="text-4xl font-black uppercase mb-4 tracking-tighter italic">
            Sync Required
          </h3>
          <p className="font-bold text-gray-500 uppercase max-w-xs mx-auto mb-10 leading-snug">
            Connect your wallet to view orders.
          </p>
          <CustomConnectButton className="!bg-yellow-400 !hover:bg-yellow-300 !text-black !border-4 !border-black !font-black !px-8 !py-3 !rounded-2xl !text-base" />
        </div>
      ) : loading ? (
        <div className="h-48 flex items-center justify-center bg-white border-4 border-black rounded-2xl">
          <LoaderCircle size={32} className="animate-spin text-black" />
        </div>
      ) : error ? (
        <div className="bg-white border-4 border-black rounded-2xl p-6 text-center">
          <ShieldAlert size={36} className="text-red-600 mx-auto" />
          <p className="font-bold mt-4">{error}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border-4 border-black rounded-2xl p-6 text-center">
          <ShoppingBag size={36} className="mx-auto" />
          <h3 className="text-xl font-black uppercase mt-4">No Orders</h3>
          <p className="text-gray-500 mt-2">
            You haven't claimed any physical items yet.
          </p>
        </div>
      ) : (
        <div className="bg-white border-4 border-black rounded-2xl p-4 bento-shadow">
          <div className="bg-black text-white px-4 py-2 rounded-md flex items-center justify-between mb-4">
            <span className="font-black uppercase text-sm">
              Active Orders ({orders.length})
            </span>
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white" />
              <div className="w-3 h-3 rounded-full bg-yellow-500 border-2 border-white" />
              <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
            </div>
          </div>

          <div className="space-y-4 max-h-[360px] overflow-y-auto">
            {orders.map((order) => (
              <OrderCard
                key={order.objectId}
                order={order}
                statusInfo={getStatusInfo(order.status)}
                onClick={() => setSelectedOrder(order)}
              />
            ))}
          </div>
        </div>
      )}

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
    </div>
  );
}

function OrderCard({
  order,
  statusInfo,
  onClick,
}: {
  order: Order;
  statusInfo: StatusInfo;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-white border-4 border-black rounded-3xl p-4 flex items-center gap-4 cursor-pointer"
    >
      <div className="w-20 h-20 bg-gray-100 rounded-2xl border-4 border-black overflow-hidden relative">
        {order.character?.imageUrl && (
          <Image
            src={order.character.imageUrl}
            alt="nft"
            fill
            className="object-cover"
          />
        )}
        <div
          className={`absolute -bottom-2 -right-2 p-2 rounded-lg border-2 border-black ${statusInfo.bg}`}
        >
          {statusInfo.icon}
        </div>
      </div>

      <div className="flex-grow">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-black uppercase">
            {order.character?.name || "Unknown"}
          </h3>
          <span className="font-mono text-xs bg-black text-white px-2 py-1 rounded">
            ID: {order.objectId.slice(0, 8)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            {new Date(order.createdAt).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-1">
            <Hash size={12} />
            {(order.paymentAmount / 1_000_000_000).toFixed(2)} SUI
          </div>
        </div>
      </div>

      <div>
        <button
          className={`px-4 py-2 rounded-xl font-black uppercase ${statusInfo.bg} ${statusInfo.textColor}`}
        >
          <span className="text-xs">{statusInfo.text}</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white border-4 border-black rounded-2xl p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-black">Order Receipt</h2>
            <p className="font-mono text-xs mt-1">TX: {order.objectId}</p>
          </div>
          <button onClick={onClose} className="bg-black text-white p-2 rounded">
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-4 mb-4">
          <div className="w-28 h-28 bg-gray-100 rounded-2xl border-4 border-black overflow-hidden relative">
            {order.character?.imageUrl && (
              <Image
                src={order.character.imageUrl}
                alt="nft"
                fill
                className="object-cover"
              />
            )}
          </div>
          <div className="flex-grow">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${statusInfo.bg} ${statusInfo.textColor}`}
            >
              {statusInfo.icon}
              {statusInfo.text}
            </div>
            <h3 className="text-2xl font-black mt-2">
              {order.character?.name}
            </h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {order.itemsSelected.split(",").map((it, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-yellow-100 border-2 border-black rounded text-xs font-black uppercase"
                >
                  {it.trim()}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-gray-100 border-2 border-black p-3 rounded">
            Payment
            <div className="font-bold">
              {(order.paymentAmount / 1_000_000_000).toFixed(2)} SUI
            </div>
          </div>
          <div className="bg-gray-100 border-2 border-black p-3 rounded">
            Mint Date
            <div className="font-bold">
              {new Date(order.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border-2 border-dashed border-black p-4 rounded">
          <h4 className="font-black mb-2">Live Tracking</h4>
          {order.status >= ORDER_STATUS.SHIPPED ? (
            <div>
              <div className="flex justify-between">
                <div>Carrier</div>
                <div className="font-bold">{order.carrier}</div>
              </div>
              <div className="flex justify-between mt-2">
                <div>Number</div>
                <div className="font-mono break-all">
                  {order.trackingNumber}
                </div>
              </div>
              {trackingUrl && (
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(order.trackingNumber);
                    window.open(trackingUrl, "_blank");
                  }}
                  className="mt-3 w-full bg-blue-500 text-white py-2 rounded"
                >
                  External Tracking <ExternalLink size={14} />
                </button>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">
              Crafting your gear... Tracking ID will appear once shipped.
            </div>
          )}
        </div>

        <div className="mt-4">
          <button
            onClick={onClose}
            className="w-full py-2 bg-black text-white rounded"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
}

function LogisticsCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white border-2 border-black p-3 rounded flex items-center gap-3">
      <div className="p-2 bg-gray-100 rounded">{icon}</div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="font-bold text-sm">{value}</p>
      </div>
    </div>
  );
}
