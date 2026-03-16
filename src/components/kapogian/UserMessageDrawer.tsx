"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import * as Ably from "ably";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  ShieldCheck,
  ChevronDown,
  Phone,
  PhoneOff,
  PhoneCall,
} from "lucide-react";

import { useWebRTCCall } from "./useWebRTCCall";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QuickButton {
  id: string;
  label: string;
  type: "link" | "Kapogian Support";
  value: string;
  emoji?: string;
}

export interface SupportMessage {
  id: string;
  clientMsgId?: string;
  text: string;
  sender: "user" | "admin";
  timestamp: number;
  isAI?: boolean;
  button?: { label: string; emoji: string; url: string } | null;
}

type UserCallState =
  | { status: "idle" }
  | { status: "ringing" }
  | { status: "active"; startedAt: number };

const ABLY_KEY = "YEbuRQ.r9odYA:eJmjank2w4vunEmM6HKLsKY557aJyRLPd8urztGykVs";
const RING_TIMEOUT_MS = 30_000; // dismiss ringing if no cancel arrives after 30 s

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mergeMessage(
  prev: SupportMessage[],
  incoming: SupportMessage,
): SupportMessage[] {
  if (incoming.id && prev.some((m) => m.id === incoming.id)) return prev;
  if (incoming.clientMsgId) {
    const idx = prev.findIndex(
      (m) => m.id.startsWith("optimistic-") && m.clientMsgId === incoming.clientMsgId,
    );
    if (idx !== -1) {
      const next = [...prev];
      next[idx] = incoming;
      return next;
    }
  }
  return [...prev, incoming];
}

// ─── Call Timer ───────────────────────────────────────────────────────────────

function CallTimer({ startedAt }: { startedAt: number }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 500);
    return () => clearInterval(id);
  }, [startedAt]);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  return <span className="font-mono tabular-nums">{mm}:{ss}</span>;
}

// ─── Incoming Call Modal ──────────────────────────────────────────────────────

function IncomingCallModal({
  onAccept,
  onReject,
}: {
  onAccept: () => void;
  onReject: () => void;
}) {
  // Animate the phone icon
  const [ring, setRing] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setRing((v) => !v), 600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative bg-white border-4 border-black rounded-[2.5rem] p-8 max-w-xs w-full shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-300 text-center">
        {/* Decorative pulse rings */}
        <div className="flex justify-center mb-6 relative">
          <span className="absolute w-24 h-24 rounded-full bg-green-200 animate-ping opacity-40" />
          <span className="absolute w-20 h-20 rounded-full bg-green-300 animate-ping opacity-30 [animation-delay:150ms]" />
          <div
            className={`relative w-16 h-16 rounded-full border-4 border-black flex items-center justify-center transition-transform duration-300 ${
              ring ? "bg-green-400 scale-110" : "bg-green-500 scale-100"
            }`}
          >
            <PhoneCall size={28} className="text-black" />
          </div>
        </div>

        {/* Text */}
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
          Incoming Call
        </p>
        <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-1">
          Kapogian Support
        </h2>
        <p className="text-sm font-semibold text-slate-500 mb-8">
          An admin wants to speak with you
        </p>

        {/* Buttons */}
        <div className="flex gap-4 justify-center">
          {/* Reject */}
          <button
            onClick={onReject}
            className="w-16 h-16 rounded-full bg-red-500 border-4 border-black flex flex-col items-center justify-center gap-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-red-400 active:translate-y-0.5 active:shadow-none transition-all"
            aria-label="Reject call"
          >
            <PhoneOff size={22} className="text-white" />
            <span className="text-[8px] font-black text-white uppercase">Decline</span>
          </button>

          {/* Accept */}
          <button
            onClick={onAccept}
            className="w-16 h-16 rounded-full bg-green-500 border-4 border-black flex flex-col items-center justify-center gap-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-green-400 active:translate-y-0.5 active:shadow-none transition-all"
            aria-label="Accept call"
          >
            <Phone size={22} className="text-white" />
            <span className="text-[8px] font-black text-white uppercase">Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Active Call Overlay (inside drawer) ─────────────────────────────────────

function ActiveCallOverlay({
  startedAt,
  onEndCall,
}: {
  startedAt: number;
  onEndCall: () => void;
}) {
  return (
    <div className="absolute inset-0 z-10 bg-black/95 flex flex-col items-center justify-center gap-5 rounded-b-[2rem]">
      {/* Animated waveform dots */}
      <div className="flex items-end gap-1.5 h-10">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="w-1.5 rounded-full bg-green-400 animate-bounce"
            style={{
              height: `${16 + (i % 3) * 12}px`,
              animationDelay: `${i * 100}ms`,
              animationDuration: "0.8s",
            }}
          />
        ))}
      </div>

      <div className="text-center">
        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">
          Call Active
        </p>
        <p className="text-3xl font-black text-green-400">
          <CallTimer startedAt={startedAt} />
        </p>
        <p className="text-xs font-semibold text-white/40 mt-1">
          Kapogian Support
        </p>
      </div>

      <button
        onClick={onEndCall}
        className="w-16 h-16 rounded-full bg-red-500 border-4 border-black flex flex-col items-center justify-center gap-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-red-400 active:translate-y-0.5 active:shadow-none transition-all mt-2"
        aria-label="End call"
      >
        <PhoneOff size={22} className="text-white" />
        <span className="text-[8px] font-black text-white uppercase">End</span>
      </button>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UserMessageDrawer({ walletAddress }: { walletAddress: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sending, setSending] = useState(false);
  const [callState, setCallState] = useState<UserCallState>({ status: "idle" });

  const [quickButtons, setQuickButtons] = useState<QuickButton[]>([]);
  const [adminTyping, setAdminTyping]   = useState<{ isTyping: boolean; isAI: boolean }>({ isTyping: false, isAI: false });

  const ablyRef = useRef<Ably.Realtime | null>(null);
  const channelRef = useRef<Ably.RealtimeChannel | null>(null);
  const historyLoadedRef = useRef(false);
  const liveBufferRef = useRef<SupportMessage[]>([]);
  const ringTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const webrtc = useWebRTCCall();

  const bottomRef     = useRef<HTMLDivElement>(null);
  const inputRef      = useRef<HTMLInputElement>(null);
  const userTypingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const channelName = walletAddress
    ? `kapogian-support:${walletAddress.toLowerCase()}`
    : null;

  // ── Boot Ably ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!channelName) return;

    let destroyed = false;
    historyLoadedRef.current = false;
    liveBufferRef.current = [];

    const ably = new Ably.Realtime({ key: ABLY_KEY });
    ablyRef.current = ably;

    ably.connection.on("connected", () => { if (!destroyed) setConnected(true); });
    ably.connection.on("disconnected", () => { if (!destroyed) setConnected(false); });
    ably.connection.on("failed", () => { if (!destroyed) setConnected(false); });

    const channel = ably.channels.get(channelName);
    channelRef.current = channel;

    // Announce presence to admin
    const inboxChannel = ably.channels.get("kapogian-support-inbox");
    inboxChannel.publish("user-connected", { walletAddress });

    // ── Chat subscriptions ───────────────────────────────────────────────────
    channel.subscribe("admin-message", (msg) => {
      if (destroyed) return;
      const incoming: SupportMessage = {
        id: msg.id ?? `live-admin-${Date.now()}`,
        text: msg.data.text,
        sender: "admin",
        timestamp: msg.data.timestamp ?? Date.now(),
        isAI: msg.data.isAI ?? false,
        button: msg.data.button ?? null,
      };
      if (!historyLoadedRef.current) { liveBufferRef.current.push(incoming); return; }
      setMessages((prev) => mergeMessage(prev, incoming));
      setUnreadCount((c) => c + 1);
    });

    channel.subscribe("user-message", (msg) => {
      if (destroyed) return;
      const incoming: SupportMessage = {
        id: msg.id ?? `live-user-${Date.now()}`,
        clientMsgId: msg.data.clientMsgId,
        text: msg.data.text,
        sender: "user",
        timestamp: msg.data.timestamp ?? Date.now(),
      };
      if (!historyLoadedRef.current) { liveBufferRef.current.push(incoming); return; }
      setMessages((prev) => mergeMessage(prev, incoming));
    });

    // ── Call subscriptions ───────────────────────────────────────────────────

    channel.subscribe("call-request", (msg) => {
      if (destroyed) return;
      // Only show the ringing modal if we're not already in a call
      setCallState((prev) => {
        if (prev.status !== "idle") return prev;
        return { status: "ringing" };
      });

      // Pre-warm the answerer PC so it's ready when user accepts
      webrtc.startAsAnswerer(channel).catch(() => {});

      // Auto-dismiss ringing after timeout (in case admin cancels without us knowing)
      if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = setTimeout(() => {
        if (!destroyed) {
          setCallState((prev) => (prev.status === "ringing" ? { status: "idle" } : prev));
        }
      }, RING_TIMEOUT_MS);
    });

    channel.subscribe("call-ended", () => {
      if (destroyed) return;
      if (ringTimeoutRef.current) { clearTimeout(ringTimeoutRef.current); ringTimeoutRef.current = null; }
      webrtc.hangup();
      setCallState({ status: "idle" });
    });

    // ── WebRTC signaling (user is answerer) ──────────────────────────────────
    channel.subscribe("webrtc-offer", (msg) => {
      if (destroyed) return;
      webrtc.handleOffer(channel, msg.data.sdp).catch(() => {});
    });

    channel.subscribe("webrtc-ice", (msg) => {
      if (destroyed) return;
      webrtc.handleIceCandidate(msg.data.candidate).catch(() => {});
    });

    // ── Quick buttons — listen on inbox channel ─────────────────────────────
    const inboxForButtons = ably.channels.get("kapogian-support-inbox");
    inboxForButtons.subscribe("quick-buttons-update", (msg) => {
      if (destroyed) return;
      const buttons = msg.data?.buttons;
      if (Array.isArray(buttons)) setQuickButtons(buttons);
    });

    // Also listen on the per-user channel in case admin publishes there
    channel.subscribe("quick-buttons-update", (msg) => {
      if (destroyed) return;
      const buttons = msg.data?.buttons;
      if (Array.isArray(buttons)) setQuickButtons(buttons);
    });

    // Admin or AI typing indicator
    channel.subscribe("admin-typing", (msg) => {
      if (destroyed) return;
      const isTyping: boolean = msg.data?.isTyping ?? false;
      const isAI: boolean     = msg.data?.isAI ?? false;
      setAdminTyping({ isTyping, isAI });
      if (isTyping) {
        setTimeout(() => {
          if (!destroyed) setAdminTyping((prev) => prev.isTyping ? { isTyping: false, isAI: false } : prev);
        }, 4000);
      }
    });

    // ── Load history ─────────────────────────────────────────────────────────
    const CLOSED_CODES = new Set([80017, 80000, 90001]);

    const loadHistory = async () => {
      try {
        await new Promise<void>((resolve, reject) => {
          if (destroyed) return resolve();
          if (ably.connection.state === "connected") return resolve();
          if (ably.connection.state === "closed" || ably.connection.state === "failed")
            return reject(Object.assign(new Error("closed"), { code: 80017 }));
          ably.connection.once("connected", () => resolve());
          ably.connection.once("failed", () => reject(Object.assign(new Error("failed"), { code: 80000 })));
          ably.connection.once("closed", () => reject(Object.assign(new Error("closed"), { code: 80017 })));
        });
        if (destroyed) return;

        await channel.attach();
        if (destroyed) return;

        const page = await channel.history({ limit: 100, direction: "forwards" });
        if (destroyed) return;

        const historical: SupportMessage[] = page.items
          .filter((m) => m.name === "user-message" || m.name === "admin-message")
          .map((m) => ({
            id: m.id ?? `hist-${Date.now()}-${Math.random()}`,
            clientMsgId: m.data.clientMsgId,
            text: m.data.text,
            sender: (m.name === "admin-message" ? "admin" : "user") as "admin" | "user",
            timestamp: m.data.timestamp ?? (m as any).timestamp ?? Date.now(),
            isAI: m.data.isAI ?? false,
            button: m.data.button ?? null,
          }))
          .sort((a, b) => a.timestamp - b.timestamp);

        setMessages(() => {
          let merged = historical;
          for (const live of liveBufferRef.current) merged = mergeMessage(merged, live);
          liveBufferRef.current = [];
          historyLoadedRef.current = true;
          return merged;
        });
      } catch (e: any) {
        const code = e?.code ?? e?.statusCode;
        if (!CLOSED_CODES.has(code) && !destroyed) console.warn("History load failed:", e);
        if (!destroyed) {
          historyLoadedRef.current = true;
          setMessages(() => {
            const flushed = liveBufferRef.current;
            liveBufferRef.current = [];
            return flushed;
          });
        }
      }
    };

    loadHistory();

    return () => {
      destroyed = true;
      if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
      if (userTypingRef.current) clearTimeout(userTypingRef.current);
      channel.unsubscribe();
      ably.close();
      webrtc.hangup();
    };
  }, [channelName]);

  // ── Scroll to bottom ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // ── Clear unread on open ─────────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setUnreadCount(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // ── Accept call ──────────────────────────────────────────────────────────────
  const handleAcceptCall = useCallback(async () => {
    if (ringTimeoutRef.current) { clearTimeout(ringTimeoutRef.current); ringTimeoutRef.current = null; }
    const startedAt = Date.now();
    setCallState({ status: "active", startedAt });
    // Open the drawer so user can see the active call overlay
    setOpen(true);
    try {
      await channelRef.current?.publish("call-accepted", { timestamp: startedAt });
    } catch { }
    // Note: webrtc.startAsAnswerer() was already called on call-request.
    // The offer from admin will arrive via webrtc-offer subscription above.
  }, []);

  // ── Reject call ──────────────────────────────────────────────────────────────
  const handleRejectCall = useCallback(async () => {
    if (ringTimeoutRef.current) { clearTimeout(ringTimeoutRef.current); ringTimeoutRef.current = null; }
    webrtc.hangup();
    setCallState({ status: "idle" });
    try {
      await channelRef.current?.publish("call-rejected", { timestamp: Date.now() });
    } catch { }
  }, [webrtc]);

  // ── End call (user-initiated) ────────────────────────────────────────────────
  const handleEndCall = useCallback(async () => {
    webrtc.hangup();
    setCallState({ status: "idle" });
    try {
      await channelRef.current?.publish("call-ended", { from: "user", timestamp: Date.now() });
    } catch { }
  }, [webrtc]);

  // ── Send message ─────────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || !channelRef.current || sending) return;

    setSending(true);
    const clientMsgId = `cmid-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const timestamp = Date.now();
    const optimistic: SupportMessage = { id: `optimistic-${clientMsgId}`, clientMsgId, text, sender: "user", timestamp };

    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    if (userTypingRef.current) { clearTimeout(userTypingRef.current); userTypingRef.current = null; }
    channelRef.current?.publish("typing", { isTyping: false }).catch(() => {});

    try {
      if (ablyRef.current) {
        ablyRef.current.channels.get("kapogian-support-inbox").publish("user-connected", { walletAddress });
      }
      await channelRef.current.publish("user-message", { text, timestamp, clientMsgId, walletAddress });
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setInput(text);
    } finally {
      setSending(false);
    }
  }, [input, sending, walletAddress]);

  // ── Quick button tap handler ─────────────────────────────────────────────
  const handleQuickButton = useCallback(async (btn: QuickButton) => {
    if (btn.type === "link") {
      // Open link in new tab
      window.open(btn.value.startsWith("http") ? btn.value : btn.value, "_blank", "noopener");
      // Also send a message so admin knows what user clicked
      const text = `${btn.emoji ? btn.emoji + " " : ""}${btn.label}`;
      const fakeInput = text;
      if (!channelRef.current || sending) return;
      setSending(true);
      const clientMsgId = `cmid-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const timestamp = Date.now();
      const optimistic: SupportMessage = { id: `optimistic-${clientMsgId}`, clientMsgId, text: fakeInput, sender: "user", timestamp };
      setMessages((prev) => [...prev, optimistic]);
      try {
        if (ablyRef.current) ablyRef.current.channels.get("kapogian-support-inbox").publish("user-connected", { walletAddress });
        await channelRef.current.publish("user-message", { text: fakeInput, timestamp, clientMsgId, walletAddress });
      } catch {
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      } finally { setSending(false); }
    } else {
      // AI query — just send as a regular user message, AI will reply
      const text = btn.value;
      if (!channelRef.current || sending) return;
      setSending(true);
      const clientMsgId = `cmid-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const timestamp = Date.now();
      const optimistic: SupportMessage = { id: `optimistic-${clientMsgId}`, clientMsgId, text, sender: "user", timestamp };
      setMessages((prev) => [...prev, optimistic]);
      setOpen(true);
      try {
        if (ablyRef.current) ablyRef.current.channels.get("kapogian-support-inbox").publish("user-connected", { walletAddress });
        await channelRef.current.publish("user-message", { text, timestamp, clientMsgId, walletAddress });
      } catch {
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      } finally { setSending(false); }
    }
  }, [sending, walletAddress]);

  const handleInputChange = useCallback((val: string) => {
    setInput(val);
    const ch = channelRef.current;
    if (!ch) return;
    ch.publish("typing", { isTyping: true }).catch(() => {});
    if (userTypingRef.current) clearTimeout(userTypingRef.current);
    userTypingRef.current = setTimeout(() => {
      ch.publish("typing", { isTyping: false }).catch(() => {});
    }, 3000);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (!walletAddress) return null;

  return (
    <>
      {/* ── Incoming Call Modal (rendered above everything) ── */}
      {callState.status === "ringing" && (
        <IncomingCallModal
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
        />
      )}

      {/* ── FAB Button ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-[90] w-14 h-14 bg-black text-white rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.25)] flex items-center justify-center hover:scale-105 transition-transform"
        aria-label="Open support chat"
      >
        {/* Show pulsing green phone if call is active */}
        {callState.status === "active" ? (
          <Phone size={22} className="text-green-400 animate-pulse" />
        ) : open ? (
          <X size={22} />
        ) : (
          <MessageCircle size={22} />
        )}
        {!open && unreadCount > 0 && callState.status === "idle" && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 border-2 border-white rounded-full text-[10px] font-black flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── Drawer ── */}
      {open && (
        <div className="fixed bottom-24 right-6 z-[90] w-[360px] max-w-[calc(100vw-3rem)] flex flex-col bg-white border-4 border-black rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          {/* Header */}
          <div className="bg-black text-white px-5 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 bg-white/10 rounded-full border-2 border-white/20 flex items-center justify-center">
                  <ShieldCheck size={16} className="text-white" />
                </div>
                <span
                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-black ${
                    connected ? "bg-green-400" : "bg-slate-500"
                  }`}
                />
              </div>
              <div>
                <p className="font-black text-sm uppercase tracking-tight leading-none">
                  Kapogian Support
                </p>
                <p className="text-[10px] font-bold text-white/40 mt-0.5">
                  {callState.status === "active"
                    ? "📞 Call in progress"
                    : connected
                    ? "Connected · replies in real-time"
                    : "Connecting..."}
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            >
              <ChevronDown size={16} />
            </button>
          </div>

          {/* Message area (relative so the active-call overlay can be absolute) */}
          <div className="relative flex-1 overflow-y-auto p-4 space-y-3 min-h-[280px] max-h-[380px] bg-[#fdfcfa]">
            {/* ── Active call overlay ── */}
            {callState.status === "active" && (
              <ActiveCallOverlay
                startedAt={callState.startedAt}
                onEndCall={handleEndCall}
              />
            )}

            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-10 gap-3 text-center">
                <div className="w-14 h-14 bg-slate-100 rounded-full border-2 border-slate-200 flex items-center justify-center">
                  <MessageCircle size={24} className="text-slate-300" />
                </div>
                <div>
                  <p className="font-black text-slate-500 text-sm uppercase tracking-tight">Send us a message</p>
                  <p className="text-xs text-slate-400 font-semibold mt-1">We'll respond as soon as possible</p>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[80%] flex flex-col gap-1.5">
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-sm font-semibold leading-snug ${
                        msg.sender === "user"
                          ? "bg-black text-white rounded-br-sm"
                          : msg.isAI
                          ? "bg-purple-600 text-white rounded-bl-sm"
                          : "bg-white border-2 border-slate-200 text-slate-800 rounded-bl-sm"
                      }`}
                    >
                      {msg.sender === "admin" && msg.isAI && (
                        <p className="text-[9px] font-black text-purple-300 uppercase tracking-widest mb-1">✦ Kapogian Support</p>
                      )}
                      {msg.sender === "admin" && !msg.isAI && (
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Kapogian Admin</p>
                      )}
                      <p>{msg.text}</p>
                      <p className={`text-[9px] mt-1 font-mono ${msg.sender === "user" ? "text-white/40 text-right" : msg.isAI ? "text-purple-300/60" : "text-slate-400"}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>

                    {/* ── Navigation Button (attached to AI message) ── */}
                    {msg.button && (
                      <a
                        href={msg.button.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 bg-white border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 rounded-2xl px-4 py-3 transition-all group shadow-sm"
                      >
                        <span className="text-xl leading-none">{msg.button.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-slate-800 group-hover:text-purple-700 transition-colors">
                            {msg.button.label}
                          </p>
                          <p className="text-[9px] font-mono text-slate-400 truncate mt-0.5">
                            {msg.button.url}
                          </p>
                        </div>
                        <span className="text-slate-300 group-hover:text-purple-400 transition-colors text-lg">↗</span>
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
            {/* Admin / AI typing indicator bubble */}
            {adminTyping.isTyping && (
              <div className="flex justify-start">
                <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl rounded-bl-sm ${
                  adminTyping.isAI ? "bg-purple-100 border-2 border-purple-200" : "bg-white border-2 border-slate-200 shadow-sm"
                }`}>
                  {adminTyping.isAI
                    ? <span className="text-[9px] font-black text-purple-500 uppercase tracking-widest mr-1">✦ Kapogian Support</span>
                    : <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-1">Admin</span>
                  }
                  {[0,1,2].map((i) => (
                    <span key={i}
                      className={`w-2 h-2 rounded-full animate-bounce ${adminTyping.isAI ? "bg-purple-400" : "bg-slate-300"}`}
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* ── Quick Buttons Strip ── */}
          {quickButtons.length > 0 && (
            <div className="px-3 pt-2.5 pb-1 border-t-2 border-slate-100 bg-white flex-shrink-0">
              <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1.5 ml-1">Quick Actions</p>
              <div className="flex gap-1.5 flex-wrap">
                {quickButtons.map((btn) => (
                  <button
                    key={btn.id}
                    onClick={() => handleQuickButton(btn)}
                    disabled={sending || !connected}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-[10px] font-black transition-all disabled:opacity-40 ${
                      btn.type === "link"
                        ? "bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100 hover:border-sky-400"
                        : "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 hover:border-purple-400"
                    }`}
                  >
                    {btn.emoji && <span className="text-sm leading-none">{btn.emoji}</span>}
                    {btn.label}
                    {btn.type === "link" && <span className="text-[8px] opacity-50">↗</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2 p-3 border-t-2 border-slate-100 bg-white flex-shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your concern..."
              maxLength={500}
              className="flex-1 h-10 rounded-2xl border-2 border-slate-200 px-4 text-sm font-semibold outline-none focus:border-black transition-colors bg-slate-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending || !connected}
              className="w-10 h-10 rounded-2xl bg-black text-white border-2 border-black flex items-center justify-center disabled:opacity-40 hover:bg-slate-800 transition-colors flex-shrink-0"
              aria-label="Send message"
            >
              {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>
        </div>
      )}
    </>
  );
}