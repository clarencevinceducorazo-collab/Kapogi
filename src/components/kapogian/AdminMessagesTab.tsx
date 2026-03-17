"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import * as Ably from "ably";
import {
  MessageCircle, Send, Loader2, User, ShieldCheck,
  Inbox, Circle, Phone, PhoneOff, PhoneCall, PhoneMissed,
  Bot, BotOff, Sparkles, Link2, Cpu, Plus, Trash2, LayoutGrid, ChevronDown, ChevronUp,
  Bell, Image as ImageIcon, Send as SendIcon, X as XIcon,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SupportMessage {
  id: string;
  text: string;
  sender: "user" | "admin";
  timestamp: number;
  isAI?: boolean;
}

interface Conversation {
  walletAddress: string;
  messages: SupportMessage[];
  unread: number;
  lastActivity: number;
}

type AdminCallState =
  | { status: "idle" }
  | { status: "calling";  walletAddress: string }
  | { status: "active";   walletAddress: string; startedAt: number };

// ─── Quick Button types ──────────────────────────────────────────────────────

export interface QuickButton {
  id: string;
  label: string;
  /** "link" opens a URL in new tab and sends a message; "ai" sends a query to AI */
  type: "link" | "ai";
  value: string;   // URL for link, question text for ai
  emoji?: string;
}

const PRESET_BUTTONS: Omit<QuickButton, "id">[] = [
  { label: "Generate & Mint",   type: "link", value: "/generate",       emoji: "⚡" },
  { label: "Kapo Shop",         type: "link", value: "/shop",           emoji: "🛍️" },
  { label: "Discord Server",    type: "link", value: "https://discord.gg/kapogian", emoji: "💬" },
  { label: "View Roadmap",      type: "link", value: "/roadmap",        emoji: "🗺️" },
  { label: "How many mints?",   type: "ai",   value: "How many total Kapogian NFTs have been minted so far?", emoji: "🔢" },
  { label: "My Orders",         type: "ai",   value: "Can you help me check the status of my order?",        emoji: "📦" },
  { label: "Shop Items",        type: "ai",   value: "What items are currently available in the Kapo Shop?", emoji: "🧾" },
];

const QB_STORAGE_KEY    = "kapogian_quick_buttons";
const KNOWN_WALLETS_KEY = "kapogian_known_wallets";

function loadKnownWallets(): string[] {
  try { return JSON.parse(localStorage.getItem(KNOWN_WALLETS_KEY) ?? "[]"); } catch { return []; }
}
function saveKnownWallet(addr: string): void {
  try {
    const list = loadKnownWallets();
    if (!list.includes(addr)) {
      list.push(addr);
      localStorage.setItem(KNOWN_WALLETS_KEY, JSON.stringify(list));
    }
  } catch {}
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ABLY_KEY = "YEbuRQ.r9odYA:eJmjank2w4vunEmM6HKLsKY557aJyRLPd8urztGykVs";
const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "turn:openrelay.metered.ca:80",                username: "openrelayproject", credential: "openrelayproject" },
  { urls: "turn:openrelay.metered.ca:443",               username: "openrelayproject", credential: "openrelayproject" },
  { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" },
];

const shortAddr = (a: string) => a.length > 10 ? `${a.slice(0, 6)}...${a.slice(-4)}` : a;

// ─── CallTimer ────────────────────────────────────────────────────────────────

function CallTimer({ startedAt }: { startedAt: number }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 500);
    return () => clearInterval(id);
  }, [startedAt]);
  return (
    <span className="font-mono tabular-nums">
      {String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AdminMessagesTab() {
  const [conversations, setConversations] = useState<Map<string, Conversation>>(new Map());
  const [activeWallet, setActiveWallet]   = useState<string | null>(null);
  const [replyInput, setReplyInput]       = useState("");
  const [connected, setConnected]         = useState(false);
  const [sending, setSending]             = useState(false);
  const [callState, setCallState]         = useState<AdminCallState>({ status: "idle" });
  const [typingUsers, setTypingUsers]     = useState<Set<string>>(new Set());

  // ── Quick Buttons state ──────────────────────────────────────────────────
  const [quickButtons, setQuickButtons] = useState<QuickButton[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem(QB_STORAGE_KEY) ?? "[]"); } catch { return []; }
  });
  const [showQBPanel, setShowQBPanel] = useState(false);
  const [newBtnLabel, setNewBtnLabel] = useState("");
  const [newBtnType, setNewBtnType]   = useState<"link" | "ai">("link");
  const [newBtnValue, setNewBtnValue] = useState("");
  const [newBtnEmoji, setNewBtnEmoji] = useState("");
  const quickButtonsRef = useRef<QuickButton[]>([]);

  // ── AI Mode ───────────────────────────────────────────────────────────────
  const [aiMode, setAiMode]         = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("kapogian_ai_mode") === "true";
  });
  const [aiThinking, setAiThinking] = useState<string | null>(null);

  // ── Broadcast Notification state ──────────────────────────────────────────
  const [showBroadcastPanel, setShowBroadcastPanel] = useState(false);
  const [broadcastTitle, setBroadcastTitle]         = useState("");
  const [broadcastDesc, setBroadcastDesc]           = useState("");
  const [broadcastImage, setBroadcastImage]         = useState<string | null>(null); // base64 data URL
  const [broadcastImageName, setBroadcastImageName] = useState<string>("");
  const [isBroadcasting, setIsBroadcasting]         = useState(false);
  const [broadcastTarget, setBroadcastTarget]       = useState<string>("all"); // "all" or wallet address
  const [broadcastButton, setBroadcastButton]       = useState<QuickButton | null>(null); // optional CTA button
  // Init directly from localStorage to avoid first-render gap where state is
  // true but ref is still false (useEffect that syncs them hasn't run yet).
  const aiModeRef = useRef<boolean>(
    typeof window !== "undefined" ? localStorage.getItem("kapogian_ai_mode") === "true" : false
  );
  useEffect(() => {
    aiModeRef.current = aiMode;
    localStorage.setItem("kapogian_ai_mode", String(aiMode));
  }, [aiMode]);

  // Sync quickButtons: persist + broadcast to all user channels
  useEffect(() => {
    quickButtonsRef.current = quickButtons;
    localStorage.setItem(QB_STORAGE_KEY, JSON.stringify(quickButtons));
    // Broadcast to all currently-subscribed user channels via Ably
    const ably = ablyRef.current;
    if (!ably) return;
    const payload = { buttons: quickButtons };
    // Broadcast on inbox channel so UserDrawer can pick it up globally
    ably.channels.get("kapogian-support-inbox").publish("quick-buttons-update", payload).catch(() => {});
    // Also push to each open per-user channel so they get it even if drawer is open
    channelsRef.current.forEach((ch) => {
      ch.publish("quick-buttons-update", payload).catch(() => {});
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickButtons]);

  // Keep refs in sync with state
  useEffect(() => { conversationsRef.current = conversations; }, [conversations]);
  useEffect(() => { activeWalletRef.current = activeWallet; }, [activeWallet]);

  // Ably refs
  const ablyRef          = useRef<Ably.Realtime | null>(null);
  const channelsRef      = useRef<Map<string, Ably.RealtimeChannel>>(new Map());
  const bottomRef        = useRef<HTMLDivElement>(null);
  const inputRef         = useRef<HTMLInputElement>(null);
  // Mirrors of state — always current inside Ably callbacks (no stale closures)
  const conversationsRef = useRef<Map<string, Conversation>>(new Map());
  const activeWalletRef  = useRef<string | null>(null);
  // Dedup: which wallets have an AI call already in-flight
  const aiInFlightRef    = useRef<Set<string>>(new Set());
  // Cooldown: timestamp of last AI trigger per wallet — prevents rapid re-triggering
  // No client-side cooldown — server enforces natural 5s reply delay.

  // WebRTC refs
  const pcRef          = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudio    = useRef<HTMLAudioElement | null>(null);
  const iceBufRef      = useRef<RTCIceCandidateInit[]>([]);
  const bootedRef          = useRef(false);
  const adminTypingRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── WebRTC teardown ────────────────────────────────────────────────────
  const hangup = useCallback(() => {
    pcRef.current?.close(); pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop()); localStreamRef.current = null;
    if (remoteAudio.current) { remoteAudio.current.srcObject = null; remoteAudio.current = null; }
    iceBufRef.current = [];
  }, []);

  // ── Build offerer PC ──────────────────────────────────────────────────
  const startCall = useCallback(async (ch: Ably.RealtimeChannel, mic: MediaStream) => {
    pcRef.current?.close(); pcRef.current = null; iceBufRef.current = [];
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;
    mic.getTracks().forEach((t) => pc.addTrack(t, mic));
    pc.ontrack = (evt) => {
      const stream = evt.streams[0] ?? new MediaStream([evt.track]);
      if (!remoteAudio.current) { const a = new Audio(); a.autoplay = true; a.setAttribute("playsinline","true"); remoteAudio.current = a; }
      remoteAudio.current.srcObject = stream;
      remoteAudio.current.play().catch(() => {
        const retry = () => { remoteAudio.current?.play().catch(()=>{}); document.removeEventListener("click", retry); };
        document.addEventListener("click", retry, { once: true });
      });
    };
    pc.onicecandidate = ({ candidate }) => { if (candidate) ch.publish("webrtc-ice", { candidate: candidate.toJSON() }).catch(()=>{}); };
    pc.oniceconnectionstatechange = () => { if (pc.iceConnectionState === "failed") pc.restartIce(); };
    const offer = await pc.createOffer({ offerToReceiveAudio: true });
    await pc.setLocalDescription(offer);
    await ch.publish("webrtc-offer", { sdp: pc.localDescription });
    for (const c of iceBufRef.current) { if (pc.remoteDescription) await pc.addIceCandidate(new RTCIceCandidate(c)).catch(()=>{}); }
  }, []);

  // ── Quick Button helpers ──────────────────────────────────────────────────
  const addQuickButton = useCallback(() => {
    if (!newBtnLabel.trim() || !newBtnValue.trim()) return;
    const btn: QuickButton = {
      id: `qb-${Date.now()}`,
      label: newBtnLabel.trim(),
      type: newBtnType,
      value: newBtnValue.trim(),
      emoji: newBtnEmoji.trim() || undefined,
    };
    setQuickButtons((prev) => [...prev, btn]);
    setNewBtnLabel(""); setNewBtnValue(""); setNewBtnEmoji("");
  }, [newBtnLabel, newBtnType, newBtnValue, newBtnEmoji]);

  const removeQuickButton = useCallback((id: string) => {
    setQuickButtons((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const addPreset = useCallback((preset: Omit<QuickButton, "id">) => {
    setQuickButtons((prev) => {
      if (prev.some((b) => b.label === preset.label)) return prev;
      return [...prev, { ...preset, id: `qb-${Date.now()}-${Math.random().toString(36).slice(2)}` }];
    });
  }, []);

  // ── Broadcast Notification ────────────────────────────────────────────────
  const sendBroadcast = useCallback(async () => {
    if (!broadcastTitle.trim() && !broadcastDesc.trim()) return;
    const ably = ablyRef.current;
    if (!ably) return;
    setIsBroadcasting(true);
    try {
      const payload = {
        title:     broadcastTitle.trim() || "Kapogian",
        desc:      broadcastDesc.trim(),
        image:     broadcastImage ?? null,
        timestamp: Date.now(),
        // "all" means every user, otherwise a specific wallet address
        target:    broadcastTarget,
        button:    broadcastButton
          ? { label: broadcastButton.label, type: broadcastButton.type, value: broadcastButton.value, emoji: broadcastButton.emoji }
          : null,
      };

      // Always publish to inbox — GlobalNotification subscribes here and
      // filters by payload.target ("all" = everyone, wallet = specific user).
      await ably.channels.get("kapogian-support-inbox").publish("broadcast-notification", payload);

      setBroadcastTitle("");
      setBroadcastDesc("");
      setBroadcastImage(null);
      setBroadcastImageName("");
      setBroadcastTarget("all");
      setBroadcastButton(null);
      setShowBroadcastPanel(false);
    } catch (e) {
      console.error("[Broadcast] failed:", e);
    } finally {
      setIsBroadcasting(false);
    }
  }, [broadcastTitle, broadcastDesc, broadcastImage, broadcastTarget, broadcastButton]);

  const handleBroadcastImage = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setBroadcastImage(e.target?.result as string);
      setBroadcastImageName(file.name);
    };
    reader.readAsDataURL(file);
  }, []);

  // ── AI auto-reply ─────────────────────────────────────────────────────────
  const triggerAIReply = useCallback(async (walletAddress: string) => {
    // Guard 1: AI mode off
    if (!aiModeRef.current) return;
    // Guard 2: already in-flight for this wallet
    if (aiInFlightRef.current.has(walletAddress)) return;
    // Guard 3 removed — server enforces 5s natural delay, no client cooldown needed.

    // Read the latest messages directly from the ref (always current)
    const conv = conversationsRef.current.get(walletAddress);
    if (!conv || conv.messages.length === 0) return;

    // Guard 4: last message must be from user AND must be recent (< 30s old)
    // This prevents the AI from replying to OLD messages when admin reconnects
    // or when history loads and the last historical message was from user.
    const lastMsg = conv.messages[conv.messages.length - 1];
    if (!lastMsg || lastMsg.sender !== "user") return;
    const msgAge = Date.now() - lastMsg.timestamp;
    if (msgAge > 30_000) return; // older than 30 seconds — not a live message

    // Guard 5: Don't fire if either of the last 2 messages before this one was
    // from admin (human or AI). This prevents rapid double-fire scenarios while
    // still allowing normal User→AI→User→AI conversations.
    const msgs = conv.messages;
    if (msgs.length >= 2) {
      const prev1 = msgs[msgs.length - 2]; // message before the current user msg
      if (prev1?.sender === "admin") return;
    }
    if (msgs.length >= 3) {
      const prev2 = msgs[msgs.length - 3]; // two messages back
      if (prev2?.sender === "admin" && msgs[msgs.length - 2]?.sender === "user") {
        // Pattern: admin → user → user (two user messages in a row after admin)
        // Allow this — user sent a follow-up, AI should respond
      }
    }

    aiInFlightRef.current.add(walletAddress);
    setAiThinking(walletAddress);
    try {
      const res = await fetch("/api/ai-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          // Pass isAI flag so the route can filter out AI replies from history
          messages: conv.messages.map((m) => ({ sender: m.sender, text: m.text, isAI: m.isAI ?? false })),
        }),
      });
      if (!res.ok) console.warn("[AI Reply] non-OK response:", res.status);
      // Reply is published by the API route via Ably REST and arrives
      // through the admin-message subscription below — no extra work needed here.
    } catch (e) {
      console.warn("[AI Reply] fetch failed:", e);
    } finally {
      aiInFlightRef.current.delete(walletAddress);
      setAiThinking(null);
    }
  }, []);

  // ── Subscribe to a user channel ───────────────────────────────────────
  const subscribeToUser = useCallback((walletAddress: string, ablyInst: Ably.Realtime) => {
    if (channelsRef.current.has(walletAddress)) return;
    const channelName = `kapogian-support:${walletAddress.toLowerCase()}`;
    const ch = ablyInst.channels.get(channelName);
    channelsRef.current.set(walletAddress, ch);

    // History
    (async () => {
      try {
        await ch.attach();
        const page = await ch.history({ limit: 100, direction: "forwards" });
        const historical: SupportMessage[] = page.items
          .filter((m) => m.name === "user-message" || m.name === "admin-message")
          .map((m) => ({
            id: m.id ?? `hist-${Math.random()}`,
            text: m.data.text,
            sender: (m.name === "admin-message" ? "admin" : "user") as "admin" | "user",
            timestamp: m.data.timestamp ?? (m as any).timestamp ?? Date.now(),
            isAI: m.data.isAI ?? false,
          }))
          .sort((a, b) => a.timestamp - b.timestamp);
        if (historical.length > 0) {
          setConversations((prev) => {
            const next = new Map(prev);
            const conv = next.get(walletAddress) ?? { walletAddress, messages: [], unread: 0, lastActivity: Date.now() };
            const ids = new Set(conv.messages.map((m) => m.id));
            const merged = [...conv.messages, ...historical.filter((m) => !ids.has(m.id))].sort((a, b) => a.timestamp - b.timestamp);
            next.set(walletAddress, { ...conv, messages: merged, lastActivity: merged.at(-1)?.timestamp ?? conv.lastActivity });
            return next;
          });
        }
      } catch (e) { if ((e as any)?.code !== 80017) console.warn("history failed:", e); }
    })();

    // Live user messages
    ch.subscribe("user-message", (msg) => {
      const newMsg: SupportMessage = {
        id: msg.id ?? `${Date.now()}`,
        text: msg.data.text, sender: "user",
        timestamp: msg.data.timestamp ?? Date.now(),
      };

      // Deduplicate
      const existing = conversationsRef.current.get(walletAddress);
      if (existing?.messages.some((m) => m.id === newMsg.id)) return;

      // Update state — pure, no side-effects inside the updater
      setConversations((prev) => {
        const next = new Map(prev);
        const conv = next.get(walletAddress) ?? { walletAddress, messages: [], unread: 0, lastActivity: Date.now() };
        if (conv.messages.some((m) => m.id === newMsg.id)) return prev;
        const isActive = activeWalletRef.current === walletAddress;
        const updatedConv = { ...conv, messages: [...conv.messages, newMsg], unread: isActive ? 0 : conv.unread + 1, lastActivity: Date.now() };
        next.set(walletAddress, updatedConv);
        return next;
      });

      // Trigger AI after state settles.
      // 250ms gives React time to commit state AND run the useEffect
      // that syncs conversationsRef — so triggerAIReply sees fresh messages.
      if (aiModeRef.current) {
        setTimeout(() => triggerAIReply(walletAddress), 250);
      }
    });

    // Live admin messages (incl. AI replies published by the API route)
    ch.subscribe("admin-message", (msg) => {
      const newMsg: SupportMessage = {
        id: msg.id ?? `admin-${Date.now()}`,
        text: msg.data.text, sender: "admin",
        timestamp: msg.data.timestamp ?? Date.now(),
        isAI: msg.data.isAI ?? false,
      };
      setConversations((prev) => {
        const next = new Map(prev);
        const conv = next.get(walletAddress) ?? { walletAddress, messages: [], unread: 0, lastActivity: Date.now() };
        if (conv.messages.some((m) => m.id === newMsg.id)) return prev;
        if (msg.data.clientMsgId && conv.messages.some((m) => (m as any).clientMsgId === msg.data.clientMsgId)) return prev;
        next.set(walletAddress, { ...conv, messages: [...conv.messages, newMsg], lastActivity: newMsg.timestamp });
        return next;
      });
    });

    // Call signaling
    let offerSent = false;
    ch.subscribe("call-accepted", () => {
      if (offerSent) return;
      setCallState((prev) => {
        if (prev.status !== "calling" || prev.walletAddress !== walletAddress) return prev;
        offerSent = true;
        const mic = localStreamRef.current;
        if (!mic) return prev;
        startCall(ch, mic).catch(console.error);
        return { status: "active", walletAddress, startedAt: Date.now() };
      });
    });
    ch.subscribe("call-rejected", () => {
      setCallState((prev) => { if (prev.status === "calling" && prev.walletAddress === walletAddress) { hangup(); return { status: "idle" }; } return prev; });
    });
    ch.subscribe("call-ended", () => {
      setCallState((prev) => { if (prev.status !== "idle" && prev.walletAddress === walletAddress) { hangup(); return { status: "idle" }; } return prev; });
    });
    ch.subscribe("webrtc-answer", (msg) => {
      const pc = pcRef.current;
      if (!pc || pc.signalingState !== "have-local-offer") return;
      pc.setRemoteDescription(new RTCSessionDescription(msg.data.sdp as RTCSessionDescriptionInit))
        .then(async () => { for (const c of iceBufRef.current) await pc.addIceCandidate(new RTCIceCandidate(c)).catch(()=>{}); iceBufRef.current = []; })
        .catch(console.error);
    });
    ch.subscribe("webrtc-ice", (msg) => {
      const pc = pcRef.current;
      if (!pc || !pc.remoteDescription) { iceBufRef.current.push(msg.data.candidate); return; }
      pc.addIceCandidate(new RTCIceCandidate(msg.data.candidate)).catch(()=>{});
    });

    // Typing indicator from user
    ch.subscribe("typing", (msg) => {
      const isTyping: boolean = msg.data?.isTyping ?? false;
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (isTyping) next.add(walletAddress);
        else next.delete(walletAddress);
        return next;
      });
    });

    // Persist this wallet so it appears in inbox after page refresh
    if (typeof window !== "undefined") saveKnownWallet(walletAddress);

    setConversations((prev) => {
      if (prev.has(walletAddress)) return prev;
      const next = new Map(prev);
      next.set(walletAddress, { walletAddress, messages: [], unread: 0, lastActivity: Date.now() });
      return next;
    });
  }, [hangup, startCall, triggerAIReply]);

  // ── Boot Ably ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    const ably = new Ably.Realtime({ key: ABLY_KEY });
    ablyRef.current = ably;
    ably.connection.on("connected",    () => setConnected(true));
    ably.connection.on("disconnected", () => setConnected(false));
    ably.connection.on("failed",       () => setConnected(false));
    // Restore previously seen wallets from localStorage — show them in inbox on load
    if (typeof window !== "undefined") {
      loadKnownWallets().forEach((addr) => subscribeToUser(addr, ably));
    }

    ably.channels.get("kapogian-support-inbox").subscribe("user-connected", (msg) => {
      const { walletAddress } = msg.data as { walletAddress: string };
      if (walletAddress) {
        saveKnownWallet(walletAddress);  // persist for future sessions
        subscribeToUser(walletAddress, ably);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Call handlers ─────────────────────────────────────────────────────────
  const handleInitiateCall = useCallback(async () => {
    if (!activeWallet || callState.status !== "idle") return;
    const ch = channelsRef.current.get(activeWallet);
    if (!ch) return;
    let mic: MediaStream;
    try { mic = await navigator.mediaDevices.getUserMedia({ audio: true, video: false }); }
    catch { alert("Microphone access is required.\nPlease allow mic access in your browser settings."); return; }
    localStreamRef.current = mic;
    setCallState({ status: "calling", walletAddress: activeWallet });
    try { await ch.publish("call-request", { timestamp: Date.now() }); }
    catch { hangup(); setCallState({ status: "idle" }); }
  }, [activeWallet, callState.status, hangup]);

  const handleEndCall = useCallback(async () => {
    if (callState.status === "idle") return;
    const wallet = callState.walletAddress;
    hangup(); setCallState({ status: "idle" });
    const ch = channelsRef.current.get(wallet);
    if (ch) await ch.publish("call-ended", { from: "admin", timestamp: Date.now() }).catch(()=>{});
  }, [callState, hangup]);

  // ── Publish admin typing indicator ───────────────────────────────────────
  const publishAdminTyping = useCallback((isTyping: boolean) => {
    if (!activeWallet) return;
    const ch = channelsRef.current.get(activeWallet);
    if (!ch) return;
    ch.publish("admin-typing", { isTyping, isAI: false }).catch(() => {});
  }, [activeWallet]);

  const handleReplyInputChange = useCallback((val: string) => {
    setReplyInput(val);
    if (!activeWallet) return;
    const ch = channelsRef.current.get(activeWallet);
    if (!ch) return;
    // Send typing=true immediately
    ch.publish("admin-typing", { isTyping: true, isAI: false }).catch(() => {});
    // Auto-clear after 3s of no keystrokes
    if (adminTypingRef.current) clearTimeout(adminTypingRef.current);
    adminTypingRef.current = setTimeout(() => {
      ch.publish("admin-typing", { isTyping: false, isAI: false }).catch(() => {});
    }, 3000);
  }, [activeWallet]);

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSendReply = useCallback(async () => {
    const text = replyInput.trim();
    if (!text || !activeWallet || sending) return;
    const ch = channelsRef.current.get(activeWallet);
    if (!ch) return;
    setSending(true);
    const msgId = `admin-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const timestamp = Date.now();
    const optimistic: SupportMessage = { id: msgId, text, sender: "admin", timestamp };
    setConversations((prev) => {
      const next = new Map(prev); const conv = next.get(activeWallet);
      if (conv) next.set(activeWallet, { ...conv, messages: [...conv.messages, optimistic], lastActivity: Date.now() });
      return next;
    });
    setReplyInput("");
    // Clear typing indicator immediately on send
    if (adminTypingRef.current) { clearTimeout(adminTypingRef.current); adminTypingRef.current = null; }
    ch.publish("admin-typing", { isTyping: false, isAI: false }).catch(() => {});
    try { await ch.publish("admin-message", { text, timestamp }); }
    catch {
      setConversations((prev) => {
        const next = new Map(prev); const conv = next.get(activeWallet);
        if (conv) next.set(activeWallet, { ...conv, messages: conv.messages.filter((m) => m.id !== msgId) });
        return next;
      });
      setReplyInput(text);
    } finally { setSending(false); }
  }, [replyInput, activeWallet, sending]);

  const selectConversation = (wallet: string) => {
    setActiveWallet(wallet);
    setConversations((prev) => {
      const next = new Map(prev); const conv = next.get(wallet);
      if (conv) next.set(wallet, { ...conv, unread: 0 }); return next;
    });
    setTimeout(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); inputRef.current?.focus(); }, 50);
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [conversations, activeWallet]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const totalUnread  = Array.from(conversations.values()).reduce((s, c) => s + c.unread, 0);
  const sortedConvs  = Array.from(conversations.values()).sort((a, b) => b.lastActivity - a.lastActivity);
  const activeConv   = activeWallet ? conversations.get(activeWallet) : null;
  const isCallActive = callState.status === "active"  && callState.walletAddress === activeWallet;
  const isCalling    = callState.status === "calling" && callState.walletAddress === activeWallet;

  // All buttons combined for the broadcast button picker
  const allButtons: QuickButton[] = [
    ...PRESET_BUTTONS.map((p, i) => ({ ...p, id: `preset-${i}` })),
    ...quickButtons,
  ];

  return (
    <div className="flex gap-6 h-[calc(100vh-220px)] min-h-[500px]">

      {/* ── Left: Inbox ─────────────────────────────────────────────────── */}
      <div className="w-[300px] flex-shrink-0 flex flex-col gap-3">
        <div className="bg-white border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden h-full flex flex-col">

          {/* ── Header: two rows for clean layout at 300px ── */}
          <div className="bg-black text-white px-4 pt-3 pb-2 flex-shrink-0">
            {/* Row 1: title + unread badge + connection dot */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Inbox size={15} />
                <span className="font-black text-sm uppercase tracking-tight">Inbox</span>
                {totalUnread > 0 && (
                  <span className="w-5 h-5 bg-red-500 text-[9px] font-black rounded-full flex items-center justify-center">
                    {totalUnread > 9 ? "9+" : totalUnread}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-400" : "bg-slate-500"}`} />
                <span className={`text-[9px] font-black uppercase ${connected ? "text-green-400" : "text-slate-500"}`}>
                  {connected ? "Live" : "Off"}
                </span>
              </div>
            </div>
            {/* Row 2: three equal action buttons — always fully visible */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => { setShowBroadcastPanel((v) => !v); setShowQBPanel(false); }}
                title="Send broadcast notification"
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg border-2 transition-all text-[9px] font-black uppercase ${
                  showBroadcastPanel
                    ? "bg-orange-500 border-orange-400 text-white"
                    : "bg-white/10 border-white/20 text-white/70 hover:bg-white/20 hover:border-white/40"
                }`}
              >
                <Bell size={11} /> Notify
              </button>
              <button
                onClick={() => { setShowQBPanel((v) => !v); setShowBroadcastPanel(false); }}
                title="Manage quick reply buttons"
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg border-2 transition-all text-[9px] font-black uppercase ${
                  showQBPanel
                    ? "bg-cyan-500 border-cyan-400 text-white"
                    : "bg-white/10 border-white/20 text-white/70 hover:bg-white/20 hover:border-white/40"
                }`}
              >
                <LayoutGrid size={11} /> Buttons
              </button>
              <button
                onClick={() => setAiMode((v) => !v)}
                title={aiMode ? "AI auto-reply ON" : "AI auto-reply OFF"}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg border-2 transition-all text-[9px] font-black uppercase ${
                  aiMode
                    ? "bg-purple-500 border-purple-400 text-white shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                    : "bg-white/10 border-white/20 text-white/70 hover:bg-white/20 hover:border-white/40"
                }`}
              >
                {aiMode ? <Bot size={11} /> : <BotOff size={11} />}
                {aiMode ? "AI On" : "AI Off"}
              </button>
            </div>
          </div>

          {/* Connected wallet count strip */}
          {sortedConvs.length > 0 && (
            <div className="bg-slate-50 border-b-2 border-slate-100 px-4 py-1.5 flex items-center justify-between flex-shrink-0">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                {sortedConvs.length} wallet{sortedConvs.length !== 1 ? "s" : ""} connected
              </p>
              <button
                onClick={() => {
                  if (!confirm("Clear all saved wallets from inbox? This cannot be undone.")) return;
                  localStorage.removeItem(KNOWN_WALLETS_KEY);
                  setConversations(new Map());
                  setActiveWallet(null);
                }}
                className="text-[9px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest transition-colors"
              >
                Clear All
              </button>
            </div>
          )}

          {/* ── Broadcast Notification Panel ── */}
          {showBroadcastPanel && (
            <div className="border-b-2 border-slate-100 bg-orange-50 flex-shrink-0 max-h-[480px] overflow-y-auto">
              <div className="p-3 space-y-2.5">
                <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest px-1 flex items-center gap-1.5">
                  <Bell size={10} /> Send Notification
                </p>

                {/* Target selector */}
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Send To</p>
                  <select
                    value={broadcastTarget}
                    onChange={e => setBroadcastTarget(e.target.value)}
                    className="w-full h-8 border-2 border-orange-200 bg-white rounded-lg px-2.5 text-[10px] font-black outline-none focus:border-orange-400 text-slate-700"
                  >
                    <option value="all">🌐 All Users (Everyone)</option>
                    {Array.from(conversationsRef.current.keys()).map(addr => (
                      <option key={addr} value={addr}>
                        👤 {addr.slice(0, 8)}...{addr.slice(-4)}
                      </option>
                    ))}
                  </select>
                  {broadcastTarget !== "all" && (
                    <p className="text-[8px] font-mono text-orange-400 mt-0.5 ml-1 truncate">{broadcastTarget}</p>
                  )}
                </div>

                {/* Title */}
                <input
                  value={broadcastTitle}
                  onChange={e => setBroadcastTitle(e.target.value)}
                  placeholder="Notification title..."
                  maxLength={80}
                  className="w-full h-8 border-2 border-orange-200 bg-white rounded-lg px-2.5 text-xs font-black outline-none focus:border-orange-400 placeholder:text-slate-300"
                />

                {/* Description */}
                <textarea
                  value={broadcastDesc}
                  onChange={e => setBroadcastDesc(e.target.value)}
                  placeholder="Message / description..."
                  maxLength={300}
                  rows={2}
                  className="w-full border-2 border-orange-200 bg-white rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-orange-400 resize-none placeholder:text-slate-300"
                />

                {/* ── Attach Button (optional CTA) ── */}
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                    Attach Button <span className="normal-case font-semibold text-slate-300">(optional)</span>
                  </p>
                  {broadcastButton ? (
                    <div className="flex items-center gap-2 bg-white border-2 border-orange-300 rounded-lg px-2.5 py-1.5">
                      <span className="text-sm">{broadcastButton.emoji || (broadcastButton.type === "link" ? "🔗" : "🤖")}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-slate-800 truncate">{broadcastButton.label}</p>
                        <p className="text-[9px] font-mono text-slate-400 truncate">{broadcastButton.value}</p>
                      </div>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border flex-shrink-0 ${broadcastButton.type === "link" ? "bg-blue-50 text-blue-500 border-blue-200" : "bg-purple-50 text-purple-500 border-purple-200"}`}>
                        {broadcastButton.type}
                      </span>
                      <button onClick={() => setBroadcastButton(null)}
                        className="w-5 h-5 flex items-center justify-center rounded-full bg-red-100 text-red-400 hover:bg-red-500 hover:text-white transition-all flex-shrink-0">
                        <XIcon size={10} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {allButtons.map((btn) => (
                        <button key={btn.id} onClick={() => setBroadcastButton(btn)}
                          className="flex items-center gap-1 px-2 py-1 rounded-full border-2 border-orange-100 bg-white text-[9px] font-black text-slate-600 hover:border-orange-400 hover:bg-orange-50 transition-all">
                          {btn.emoji} {btn.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Image upload */}
                {broadcastImage ? (
                  <div className="relative flex items-center gap-2 bg-white border-2 border-orange-200 rounded-lg px-2.5 py-1.5">
                    <img src={broadcastImage} alt="preview" className="w-8 h-8 rounded object-cover border border-slate-100 flex-shrink-0" />
                    <span className="text-[9px] font-mono text-slate-400 truncate flex-1">{broadcastImageName}</span>
                    <button onClick={() => { setBroadcastImage(null); setBroadcastImageName(""); }} className="w-5 h-5 flex items-center justify-center rounded-full bg-red-100 text-red-400 hover:bg-red-500 hover:text-white transition-all flex-shrink-0">
                      <XIcon size={10} />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 w-full h-8 border-2 border-dashed border-orange-200 rounded-lg px-2.5 cursor-pointer hover:border-orange-400 hover:bg-white transition-all">
                    <ImageIcon size={11} className="text-orange-300" />
                    <span className="text-[9px] font-black text-orange-300 uppercase tracking-widest">Attach Image (optional)</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleBroadcastImage(f); }} />
                  </label>
                )}

                {/* Send button */}
                <button
                  onClick={sendBroadcast}
                  disabled={(!broadcastTitle.trim() && !broadcastDesc.trim()) || isBroadcasting}
                  className="w-full h-8 bg-orange-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-40 hover:bg-orange-400 transition-colors shadow-[0_2px_0_0_#c2410c]"
                >
                  {isBroadcasting ? (
                    <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Sending...</>
                  ) : broadcastTarget === "all" ? (
                    <><SendIcon size={11} /> Send to All Users</>
                  ) : (
                    <><SendIcon size={11} /> Send to User</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* AI mode info strip */}
          {aiMode && (
            <div className="bg-purple-50 border-b-2 border-purple-100 px-3 py-2 flex items-center gap-2 flex-shrink-0">
              <Sparkles size={11} className="text-purple-500 flex-shrink-0" />
              <p className="text-[10px] font-semibold text-purple-600 leading-tight">
                Kapogian Support v1 auto-replies when you're away
              </p>
            </div>
          )}

          {/* ── Quick Buttons Panel ── */}
          {showQBPanel && (
            <div className="border-b-2 border-slate-100 bg-slate-50 flex-shrink-0 max-h-[420px] overflow-y-auto">
              <div className="p-3 space-y-3">
                {/* Presets */}
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Presets</p>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_BUTTONS.map((preset) => {
                      const already = quickButtons.some((b) => b.label === preset.label);
                      return (
                        <button key={preset.label} onClick={() => addPreset(preset)} disabled={already}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-full border-2 text-[9px] font-black transition-all ${
                            already ? "bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed"
                                     : "bg-white border-slate-200 text-slate-600 hover:border-black hover:bg-black hover:text-white"
                          }`}>
                          {preset.emoji} {preset.label}
                          {!already && <Plus size={9} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Active buttons list */}
                {quickButtons.length > 0 && (
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Active Buttons ({quickButtons.length})</p>
                    <div className="space-y-1.5">
                      {quickButtons.map((btn) => (
                        <div key={btn.id} className="flex items-center gap-2 bg-white border-2 border-slate-100 rounded-xl px-3 py-2">
                          <span className="text-sm">{btn.emoji || (btn.type === "link" ? "🔗" : "🤖")}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-slate-800 truncate">{btn.label}</p>
                            <p className="text-[9px] text-slate-400 truncate font-mono">{btn.value}</p>
                          </div>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border ${
                            btn.type === "link" ? "bg-blue-50 text-blue-500 border-blue-200" : "bg-purple-50 text-purple-500 border-purple-200"
                          }`}>{btn.type}</span>
                          <button onClick={() => removeQuickButton(btn.id)}
                            className="w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors flex-shrink-0">
                            <Trash2 size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add new button form */}
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-3 space-y-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Add Custom Button</p>
                  <div className="flex gap-2">
                    <input value={newBtnEmoji} onChange={(e) => setNewBtnEmoji(e.target.value)}
                      placeholder="😊" maxLength={4}
                      className="w-10 h-8 text-center border-2 border-slate-200 rounded-lg text-sm outline-none focus:border-black" />
                    <input value={newBtnLabel} onChange={(e) => setNewBtnLabel(e.target.value)}
                      placeholder="Button label..." maxLength={40}
                      className="flex-1 h-8 border-2 border-slate-200 rounded-lg px-2 text-xs font-semibold outline-none focus:border-black" />
                  </div>
                  <div className="flex gap-2">
                    <select value={newBtnType} onChange={(e) => setNewBtnType(e.target.value as "link" | "ai")}
                      className="h-8 border-2 border-slate-200 rounded-lg px-2 text-xs font-black outline-none focus:border-black bg-white">
                      <option value="link">🔗 Link</option>
                      <option value="ai">🤖 AI Query</option>
                    </select>
                    <input value={newBtnValue} onChange={(e) => setNewBtnValue(e.target.value)}
                      placeholder={newBtnType === "link" ? "https://... or /page" : "Question for AI..."}
                      className="flex-1 h-8 border-2 border-slate-200 rounded-lg px-2 text-xs font-semibold outline-none focus:border-black" />
                  </div>
                  <button onClick={addQuickButton} disabled={!newBtnLabel.trim() || !newBtnValue.trim()}
                    className="w-full h-8 bg-black text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-40 hover:bg-slate-800 transition-colors">
                    <Plus size={12} /> Add Button
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-y-auto flex-1">
            {sortedConvs.length === 0 ? (
              <div className="p-8 flex flex-col items-center gap-3 text-center h-full justify-center">
                <MessageCircle size={20} className="text-slate-300" />
                <p className="font-black text-slate-300 text-xs uppercase">No messages yet</p>
                <p className="text-[10px] text-slate-300 leading-tight">Users appear automatically when they message</p>
              </div>
            ) : sortedConvs.map((conv) => {
              const isAiWorking = aiThinking === conv.walletAddress;
              return (
                <button key={conv.walletAddress} onClick={() => selectConversation(conv.walletAddress)}
                  className={`w-full flex items-center gap-3 px-4 py-3 border-b border-slate-100 text-left hover:bg-slate-50 transition-colors ${activeWallet === conv.walletAddress ? "bg-black text-white hover:bg-black" : ""}`}>
                  <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center flex-shrink-0 relative ${activeWallet === conv.walletAddress ? "border-white/30 bg-white/10" : "border-slate-200 bg-slate-100"}`}>
                    <User size={14} className={activeWallet === conv.walletAddress ? "text-white" : "text-slate-400"} />
                    {isAiWorking && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-purple-500 rounded-full border-2 border-white flex items-center justify-center">
                        <Sparkles size={7} className="text-white animate-pulse" />
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-black text-xs truncate uppercase ${activeWallet === conv.walletAddress ? "text-white" : "text-slate-800"}`}>{shortAddr(conv.walletAddress)}</p>
                    {isAiWorking ? (
                      <p className="text-[10px] font-semibold text-purple-400 mt-0.5 flex items-center gap-1">
                        {[0,1,2].map((i) => <span key={i} className="inline-block w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
                        AI typing
                      </p>
                    ) : typingUsers.has(conv.walletAddress) ? (
                      <p className="text-[10px] font-semibold text-emerald-400 mt-0.5 flex items-center gap-1">
                        {[0,1,2].map((i) => <span key={i} className="inline-block w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
                        typing...
                      </p>
                    ) : conv.messages.length > 0 ? (
                      <p className={`text-[10px] font-semibold truncate mt-0.5 ${activeWallet === conv.walletAddress ? "text-white/50" : "text-slate-400"}`}>
                        {conv.messages.at(-1)!.text}
                      </p>
                    ) : null}
                  </div>
                  {conv.unread > 0 && (
                    <span className="w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center flex-shrink-0">{conv.unread > 9 ? "9+" : conv.unread}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Right: Chat ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-white border-4 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        {!activeConv ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
            <div className="w-20 h-20 bg-slate-100 rounded-full border-2 border-slate-200 flex items-center justify-center">
              <MessageCircle size={32} className="text-slate-300" />
            </div>
            <p className="font-black text-slate-400 uppercase text-base tracking-tight">Select a conversation</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-black text-white px-5 py-4 flex items-center gap-3 flex-shrink-0">
              <div className="w-10 h-10 bg-white/10 rounded-full border-2 border-white/20 flex items-center justify-center"><User size={16} /></div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm uppercase tracking-tight">{shortAddr(activeConv.walletAddress)}</p>
                <p className="text-[10px] font-mono text-white/40 mt-0.5 truncate">{activeConv.walletAddress}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                  <ShieldCheck size={11} className="text-green-400" />
                  <span className="text-[9px] font-black uppercase text-white/60">Admin</span>
                </div>
                {callState.status === "idle" ? (
                  <button onClick={handleInitiateCall} disabled={!connected}
                    className="w-9 h-9 rounded-full bg-green-500 border-2 border-green-400 flex items-center justify-center hover:bg-green-400 disabled:opacity-40 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)]">
                    <Phone size={15} className="text-white" />
                  </button>
                ) : (
                  <button onClick={handleEndCall}
                    className="w-9 h-9 rounded-full bg-red-500 border-2 border-red-400 flex items-center justify-center hover:bg-red-400 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)] animate-pulse">
                    {isCalling ? <PhoneMissed size={15} className="text-white" /> : <PhoneOff size={15} className="text-white" />}
                  </button>
                )}
              </div>
            </div>

            {/* Call banners */}
            {isCallActive && (
              <div className="bg-green-500 border-b-2 border-green-600 px-5 py-2 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="flex items-end gap-0.5 h-4">
                    {[0,1,2,3,4].map((i) => <span key={i} className="w-1 rounded-full bg-white animate-bounce" style={{ height: `${8+(i%3)*5}px`, animationDelay: `${i*80}ms`, animationDuration: "0.7s" }} />)}
                  </div>
                  <span className="text-white font-black text-xs uppercase">Call active · <CallTimer startedAt={(callState as any).startedAt} /></span>
                </div>
                <button onClick={handleEndCall} className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full"><PhoneOff size={11} /> End</button>
              </div>
            )}
            {isCalling && (
              <div className="bg-yellow-400 border-b-2 border-yellow-500 px-5 py-2 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2"><PhoneCall size={14} className="text-black animate-pulse" /><span className="text-black font-black text-xs uppercase">Calling user...</span></div>
                <button onClick={handleEndCall} className="flex items-center gap-1.5 bg-black/10 hover:bg-black/20 text-black text-[10px] font-black uppercase px-3 py-1 rounded-full"><PhoneMissed size={11} /> Cancel</button>
              </div>
            )}

            {/* AI thinking banner */}
            {aiThinking === activeWallet && (
              <div className="bg-purple-50 border-b-2 border-purple-200 px-5 py-2.5 flex items-center gap-2.5 flex-shrink-0">
                <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={12} className="text-white animate-pulse" />
                </div>
                <span className="text-purple-700 font-black text-[10px] uppercase">AI is composing a reply</span>
                <div className="flex items-center gap-0.5 ml-1">
                  {[0,1,2].map((i) => <span key={i} className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: `${i*150}ms` }} />)}
                </div>
              </div>
            )}

            {/* User typing banner */}
            {activeWallet && typingUsers.has(activeWallet) && (
              <div className="bg-emerald-50 border-b-2 border-emerald-100 px-5 py-2 flex items-center gap-2.5 flex-shrink-0">
                <div className="flex items-center gap-0.5">
                  {[0,1,2].map((i) => (
                    <span key={i} className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: `${i*150}ms` }} />
                  ))}
                </div>
                <span className="text-emerald-700 font-black text-[10px] uppercase tracking-wider">User is typing...</span>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-[#fdfcfa]">
              {activeConv.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-center">
                  <Circle size={32} className="text-slate-200" />
                  <p className="font-black text-slate-300 text-sm uppercase">No messages yet.</p>
                </div>
              ) : activeConv.messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === "admin" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm font-semibold leading-snug ${
                    msg.sender === "admin"
                      ? msg.isAI ? "bg-purple-600 text-white rounded-br-sm" : "bg-black text-white rounded-br-sm"
                      : "bg-white border-2 border-slate-200 text-slate-800 rounded-bl-sm shadow-sm"
                  }`}>
                    {msg.sender === "user"                && <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">User</p>}
                    {msg.sender === "admin" && msg.isAI  && <p className="text-[9px] font-black text-purple-200 uppercase tracking-widest mb-1 flex items-center gap-1"><Sparkles size={8} /> AI Assistant</p>}
                    {msg.sender === "admin" && !msg.isAI && <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">You (Admin)</p>}
                    <p>{msg.text}</p>
                    <p className={`text-[9px] mt-1 font-mono ${msg.sender === "admin" ? "text-white/40 text-right" : "text-slate-400"}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Reply input */}
            <div className="flex gap-3 p-4 border-t-2 border-slate-100 bg-white flex-shrink-0">
              <input ref={inputRef} value={replyInput} onChange={(e) => handleReplyInputChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                placeholder="Reply to user..." maxLength={1000}
                className="flex-1 h-11 rounded-2xl border-2 border-slate-200 px-4 text-sm font-semibold outline-none focus:border-black transition-colors bg-slate-50" />
              <button onClick={handleSendReply} disabled={!replyInput.trim() || sending || !connected}
                className="w-11 h-11 rounded-2xl bg-black text-white border-2 border-black flex items-center justify-center disabled:opacity-40 hover:bg-slate-800 transition-colors flex-shrink-0">
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Unread count hook ────────────────────────────────────────────────────────

export function useAdminUnreadCount(): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const ably = new Ably.Realtime({ key: ABLY_KEY });
    const subscribed = new Set<string>();
    const inbox = ably.channels.get("kapogian-support-inbox");
    inbox.subscribe("user-connected", (msg) => {
      const { walletAddress } = msg.data as { walletAddress: string };
      if (!walletAddress || subscribed.has(walletAddress)) return;
      subscribed.add(walletAddress);
      ably.channels.get(`kapogian-support:${walletAddress.toLowerCase()}`)
        .subscribe("user-message", () => setCount((c) => c + 1));
    });
    return () => { inbox.unsubscribe(); ably.close(); };
  }, []);
  return count;
}