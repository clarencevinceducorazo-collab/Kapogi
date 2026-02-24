"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/kapogian/page-header";
import { PageFooter } from "@/components/kapogian/page-footer";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { getOwnedCharacters, suiClient } from "@/lib/sui";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { getIPFSGatewayUrl } from "@/lib/pinata";

export default function Page() {
  const account = useCurrentAccount();
  const [characters, setCharacters] = useState<any[]>([]);
  const [index, setIndex] = useState(0);
  const [podiumEntry, setPodiumEntry] = useState<any | null>(null);

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
    <div className="min-h-screen bg-gray-100 font-body flex flex-col">
      <div className="p-4 sm:p-8 flex-1">
        <PageHeader />

        <div className="max-w-7xl mx-auto mt-20 mb-20">
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
              <div className="bg-white rounded-2xl border-2 border-black p-4 flex flex-col h-full bento-shadow">
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
            <main className="lg:col-span-8">
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
                                if (k) out[String(k).toLowerCase()] = v ?? "";
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
                              return allEntries.slice(0, 6).map(([k, v]) => (
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
