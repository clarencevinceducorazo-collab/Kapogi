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
  type: "link" | "ai";
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
  buttons?: Array<{ label: string; emoji: string; url: string; id?: string }> | null;
  /** @deprecated use buttons array */
  button?: { label: string; emoji: string; url: string } | null;
}

type UserCallState =
  | { status: "idle" }
  | { status: "ringing" }
  | { status: "active"; startedAt: number };

const ABLY_KEY = "YEbuRQ.r9odYA:eJmjank2w4vunEmM6HKLsKY557aJyRLPd8urztGykVs";
const RING_TIMEOUT_MS = 30_000;

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
  const [ring, setRing] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setRing((v) => !v), 600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative bg-white border-4 border-black rounded-[2.5rem] p-8 max-w-xs w-full shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-300 text-center">
        <div className="flex justify-center mb-6 relative">
          <span className="absolute w-24 h-24 rounded-full bg-green-200 animate-ping opacity-40" />
          <span className="absolute w-20 h-20 rounded-full bg-green-300 animate-ping opacity-30 [animation-delay:150ms]" />
          <div className={`relative w-16 h-16 rounded-full border-4 border-black flex items-center justify-center transition-transform duration-300 ${ring ? "bg-green-400 scale-110" : "bg-green-500 scale-100"}`}>
            <PhoneCall size={28} className="text-black" />
          </div>
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Incoming Call</p>
        <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-1">Kapogian Support</h2>
        <p className="text-sm font-semibold text-slate-500 mb-8">An admin wants to speak with you</p>
        <div className="flex gap-4 justify-center">
          <button onClick={onReject} className="w-16 h-16 rounded-full bg-red-500 border-4 border-black flex flex-col items-center justify-center gap-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-red-400 active:translate-y-0.5 active:shadow-none transition-all" aria-label="Reject call">
            <PhoneOff size={22} className="text-white" />
            <span className="text-[8px] font-black text-white uppercase">Decline</span>
          </button>
          <button onClick={onAccept} className="w-16 h-16 rounded-full bg-green-500 border-4 border-black flex flex-col items-center justify-center gap-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-green-400 active:translate-y-0.5 active:shadow-none transition-all" aria-label="Accept call">
            <Phone size={22} className="text-white" />
            <span className="text-[8px] font-black text-white uppercase">Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Active Call Overlay ──────────────────────────────────────────────────────

function ActiveCallOverlay({ startedAt, onEndCall }: { startedAt: number; onEndCall: () => void }) {
  return (
    <div className="absolute inset-0 z-10 bg-black/95 flex flex-col items-center justify-center gap-5 rounded-b-[2rem]">
      <div className="flex items-end gap-1.5 h-10">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="w-1.5 rounded-full bg-green-400 animate-bounce" style={{ height: `${16 + (i % 3) * 12}px`, animationDelay: `${i * 100}ms`, animationDuration: "0.8s" }} />
        ))}
      </div>
      <div className="text-center">
        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Call Active</p>
        <p className="text-3xl font-black text-green-400"><CallTimer startedAt={startedAt} /></p>
        <p className="text-xs font-semibold text-white/40 mt-1">Kapogian Support</p>
      </div>
      <button onClick={onEndCall} className="w-16 h-16 rounded-full bg-red-500 border-4 border-black flex flex-col items-center justify-center gap-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-red-400 active:translate-y-0.5 active:shadow-none transition-all mt-2" aria-label="End call">
        <PhoneOff size={22} className="text-white" />
        <span className="text-[8px] font-black text-white uppercase">End</span>
      </button>
    </div>
  );
}

// ─── AI trigger helper (fire-and-forget, fully outside component render) ──────

async function triggerAI(walletAddress: string, messages: SupportMessage[]) {
  try {
    await fetch("/api/ai-reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        walletAddress,
        messages: messages.map((m) => ({
          sender: m.sender,
          text:   m.text,
          isAI:   m.isAI ?? false,
        })),
      }),
    });
  } catch (e) {
    console.warn("[AI] trigger failed:", e);
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UserMessageDrawer({ walletAddress }: { walletAddress: string }) {
  const [open, setOpen]             = useState(false);
  const [messages, setMessages]     = useState<SupportMessage[]>([]);
  const [input, setInput]           = useState("");
  const [connected, setConnected]   = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sending, setSending]       = useState(false);
  const [callState, setCallState]   = useState<UserCallState>({ status: "idle" });
  const [quickButtons, setQuickButtons] = useState<QuickButton[]>([]);

  // ── AI enabled state ───────────────────────────────────────────────────────
  // FIX: Default to TRUE (respects AI_ALWAYS_ON env). Admin can still disable
  // by broadcasting ai-mode-update {enabled:false}. This fixes the core bug
  // where aiEnabled was always false until admin opened the tab.
  const [aiEnabled, setAiEnabled] = useState(true);
  // Ref mirror so closures always read current value without stale captures
  const aiEnabledRef = useRef(true);
  useEffect(() => { aiEnabledRef.current = aiEnabled; }, [aiEnabled]);

  // ── Typing indicators ──────────────────────────────────────────────────────
  const [adminTyping, setAdminTyping] = useState<{ isTyping: boolean; isAI: boolean }>({ isTyping: false, isAI: false });
  // Ref mirror so send handler reads current value without stale closure
  const adminTypingRef   = useRef({ isTyping: false, isAI: false });
  const userTypingRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Hard auto-clear: if stop signal is ever missed, unlock after this many ms
  const adminTypingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // FIX: Reduced from 12s to 8s. Server delay is 4s + Groq ~2s = 6s max.
  // 8s gives 2s buffer. 12s was too long and left users stuck.
  const MAX_AI_TYPING_MS = 8_000;

  // ── Ably / channel refs ────────────────────────────────────────────────────
  const ablyRef          = useRef<Ably.Realtime | null>(null);
  const channelRef       = useRef<Ably.RealtimeChannel | null>(null);
  const historyLoadedRef = useRef(false);
  const liveBufferRef    = useRef<SupportMessage[]>([]);
  const ringTimeoutRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  // FIX: messagesRef is now updated SYNCHRONOUSLY inside setMessages calls
  // (not via useEffect which fires after render, causing stale reads in handleSend)
  const messagesRef = useRef<SupportMessage[]>([]);

  // FIX: Track in-flight AI requests per session to prevent double-fire.
  // This is a ref (not state) so it never causes re-renders.
  const aiInFlightRef = useRef(false);
  // FIX: Track last message ID that triggered AI — prevents same message
  // triggering AI twice if component re-renders between publish and response.
  const lastAiTriggerMsgRef = useRef<string>("");

  const webrtc   = useWebRTCCall();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  const channelName = walletAddress
    ? `kapogian-support:${walletAddress.toLowerCase()}`
    : null;

  // ── Helper: clear AI typing lock completely ────────────────────────────────
  const clearAdminTypingLock = useCallback(() => {
    if (adminTypingClearRef.current) {
      clearTimeout(adminTypingClearRef.current);
      adminTypingClearRef.current = null;
    }
    adminTypingRef.current = { isTyping: false, isAI: false };
    setAdminTyping({ isTyping: false, isAI: false });
  }, []);

  // ── Helper: set AI typing lock with auto-clear safety ─────────────────────
  const setAdminTypingLock = useCallback((isTyping: boolean, isAI: boolean) => {
    adminTypingRef.current = { isTyping, isAI };
    setAdminTyping({ isTyping, isAI });

    if (isTyping && isAI) {
      if (adminTypingClearRef.current) clearTimeout(adminTypingClearRef.current);
      adminTypingClearRef.current = setTimeout(() => {
        console.warn("[Chat] AI typing lock auto-cleared after timeout");
        clearAdminTypingLock();
      }, MAX_AI_TYPING_MS);
    } else {
      if (adminTypingClearRef.current) {
        clearTimeout(adminTypingClearRef.current);
        adminTypingClearRef.current = null;
      }
    }
  }, [clearAdminTypingLock, MAX_AI_TYPING_MS]);

  // ── Boot Ably ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!channelName) return;

    let destroyed = false;
    historyLoadedRef.current = false;
    liveBufferRef.current = [];
    aiInFlightRef.current = false;
    lastAiTriggerMsgRef.current = "";

    const ably = new Ably.Realtime({
      key: ABLY_KEY,
      // FIX: Faster reconnect settings reduce the 15s timeout seen in console
      disconnectedRetryTimeout: 2000,
      suspendedRetryTimeout:    5000,
    });
    ablyRef.current = ably;

    ably.connection.on("connected",    () => { if (!destroyed) setConnected(true); });
    ably.connection.on("disconnected", () => { if (!destroyed) setConnected(false); });
    ably.connection.on("failed",       () => { if (!destroyed) setConnected(false); });

    const channel = ably.channels.get(channelName);
    channelRef.current = channel;

    const inboxChannel = ably.channels.get("kapogian-support-inbox");
    inboxChannel.publish("user-connected", { walletAddress }).catch(() => {});

    // ── admin-message ─────────────────────────────────────────────────────
    channel.subscribe("admin-message", (msg) => {
      if (destroyed) return;
      const incoming: SupportMessage = {
        id:        msg.id ?? `live-admin-${Date.now()}`,
        text:      msg.data.text,
        sender:    "admin",
        timestamp: msg.data.timestamp ?? Date.now(),
        isAI:      msg.data.isAI ?? false,
        buttons:   msg.data.buttons ?? (msg.data.button ? [msg.data.button] : null),
        button:    msg.data.button ?? null,
      };

      if (!historyLoadedRef.current) {
        liveBufferRef.current.push(incoming);
        // FIX: Clear AI typing lock even during history load — message arrived,
        // lock must be released so user can type when drawer opens.
        if (incoming.isAI) clearAdminTypingLock();
        return;
      }

      setMessages((prev) => {
        const next = mergeMessage(prev, incoming);
        messagesRef.current = next; // FIX: sync update
        return next;
      });
      setUnreadCount((c) => c + 1);

      // FIX: Always clear lock when ANY admin message arrives (AI or human)
      // This covers the case where admin manually replies while AI was "typing"
      if (incoming.isAI || adminTypingRef.current.isAI) {
        clearAdminTypingLock();
      }

      // FIX: Release AI in-flight lock when AI reply arrives
      if (incoming.isAI) {
        aiInFlightRef.current = false;
      }
    });

    // ── user-message echo ─────────────────────────────────────────────────
    channel.subscribe("user-message", (msg) => {
      if (destroyed) return;
      const incoming: SupportMessage = {
        id:          msg.id ?? `live-user-${Date.now()}`,
        clientMsgId: msg.data.clientMsgId,
        text:        msg.data.text,
        sender:      "user",
        timestamp:   msg.data.timestamp ?? Date.now(),
      };
      if (!historyLoadedRef.current) { liveBufferRef.current.push(incoming); return; }
      setMessages((prev) => {
        const next = mergeMessage(prev, incoming);
        messagesRef.current = next; // FIX: sync update
        return next;
      });
    });

    // ── Call signaling ────────────────────────────────────────────────────
    channel.subscribe("call-request", () => {
      if (destroyed) return;
      setCallState((prev) => prev.status !== "idle" ? prev : { status: "ringing" });
      webrtc.startAsAnswerer(channel).catch(() => {});
      if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = setTimeout(() => {
        if (!destroyed) setCallState((prev) => prev.status === "ringing" ? { status: "idle" } : prev);
      }, RING_TIMEOUT_MS);
    });

    channel.subscribe("call-ended", () => {
      if (destroyed) return;
      if (ringTimeoutRef.current) { clearTimeout(ringTimeoutRef.current); ringTimeoutRef.current = null; }
      webrtc.hangup();
      setCallState({ status: "idle" });
    });

    channel.subscribe("webrtc-offer", (msg) => {
      if (destroyed) return;
      webrtc.handleOffer(channel, msg.data.sdp).catch(() => {});
    });

    channel.subscribe("webrtc-ice", (msg) => {
      if (destroyed) return;
      webrtc.handleIceCandidate(msg.data.candidate).catch(() => {});
    });

    // ── Quick buttons ─────────────────────────────────────────────────────
    inboxChannel.subscribe("quick-buttons-update", (msg) => {
      if (destroyed) return;
      if (Array.isArray(msg.data?.buttons)) setQuickButtons(msg.data.buttons);
    });
    channel.subscribe("quick-buttons-update", (msg) => {
      if (destroyed) return;
      if (Array.isArray(msg.data?.buttons)) setQuickButtons(msg.data.buttons);
    });

    // ── AI mode update from admin ─────────────────────────────────────────
    // FIX: Listen for admin toggling AI mode. But we default to TRUE (always on),
    // so admin explicitly disabling it is the only way to turn it off.
    inboxChannel.subscribe("ai-mode-update", (msg) => {
      if (destroyed) return;
      const enabled = msg.data?.enabled ?? true;
      aiEnabledRef.current = enabled;
      setAiEnabled(enabled);
    });

    // ── Admin / AI typing indicator ───────────────────────────────────────
    channel.subscribe("admin-typing", (msg) => {
      if (destroyed) return;
      const isTyping: boolean = msg.data?.isTyping ?? false;
      const isAI: boolean     = msg.data?.isAI ?? false;
      setAdminTypingLock(isTyping, isAI);
    });

    // ── History load — NON-BLOCKING with short timeout ────────────────────
    // FIX: History load is now fully non-blocking. Input is usable immediately
    // after Ably connects. History loads in background with 4s timeout.
    const loadHistory = async () => {
      try {
        // FIX: Short connection timeout — don't wait forever
        await Promise.race([
          new Promise<void>((resolve, reject) => {
            if (ably.connection.state === "connected") return resolve();
            ably.connection.once("connected", () => resolve());
            ably.connection.once("failed",    () => reject(new Error("failed")));
            ably.connection.once("closed",    () => reject(new Error("closed")));
          }),
          new Promise<void>((_, reject) =>
            setTimeout(() => reject(new Error("connect timeout")), 5000)
          ),
        ]);

        if (destroyed) return;
        await channel.attach();
        if (destroyed) return;

        // FIX: Race history fetch against a 4s timeout (not Ably's 15s default)
        const page = await Promise.race([
          channel.history({ limit: 50, direction: "forwards" }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("history timeout")), 4000)
          ),
        ]);

        if (destroyed) return;

        const historical: SupportMessage[] = (page as any).items
          .filter((m: any) => m.name === "user-message" || m.name === "admin-message")
          .map((m: any) => ({
            id:          m.id ?? `hist-${Date.now()}-${Math.random()}`,
            clientMsgId: m.data.clientMsgId,
            text:        m.data.text,
            sender:      (m.name === "admin-message" ? "admin" : "user") as "admin" | "user",
            timestamp:   m.data.timestamp ?? m.timestamp ?? Date.now(),
            isAI:        m.data.isAI ?? false,
            buttons:     m.data.buttons ?? (m.data.button ? [m.data.button] : null),
            button:      m.data.button ?? null,
          }))
          .sort((a: SupportMessage, b: SupportMessage) => a.timestamp - b.timestamp);

        const bufferHasAI = liveBufferRef.current.some((m) => m.isAI);
        setMessages(() => {
          let merged = historical;
          for (const live of liveBufferRef.current) merged = mergeMessage(merged, live);
          messagesRef.current = merged; // FIX: sync update
          liveBufferRef.current    = [];
          historyLoadedRef.current = true;
          return merged;
        });
        if (bufferHasAI) clearAdminTypingLock();

      } catch (e: any) {
        if (destroyed) return;
        // FIX: On any error (timeout or otherwise), immediately unblock.
        // Don't log expected timeouts as errors.
        if (!e?.message?.includes("timeout") && !e?.message?.includes("closed")) {
          console.warn("[Chat] History load failed (non-critical):", e?.message);
        }
        const bufferHasAI = liveBufferRef.current.some((m) => m.isAI);
        setMessages(() => {
          const flushed = [...liveBufferRef.current];
          messagesRef.current   = flushed;
          liveBufferRef.current = [];
          historyLoadedRef.current = true;
          return flushed;
        });
        if (bufferHasAI) clearAdminTypingLock();
      }
    };

    loadHistory();

    return () => {
      destroyed = true;
      if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
      if (userTypingRef.current) clearTimeout(userTypingRef.current);
      if (adminTypingClearRef.current) clearTimeout(adminTypingClearRef.current);
      channel.unsubscribe();
      ably.close();
      webrtc.hangup();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (open) {
      setUnreadCount(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // ── Call handlers ─────────────────────────────────────────────────────────
  const handleAcceptCall = useCallback(async () => {
    if (ringTimeoutRef.current) { clearTimeout(ringTimeoutRef.current); ringTimeoutRef.current = null; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false,
      });
      webrtc.setLocalStream(stream);
    } catch (micErr) {
      console.warn("[Call] Mic access denied:", micErr);
    }
    const startedAt = Date.now();
    setCallState({ status: "active", startedAt });
    setOpen(true);
    try { await channelRef.current?.publish("call-accepted", { timestamp: startedAt }); } catch { }
  }, [webrtc]);

  const handleRejectCall = useCallback(async () => {
    if (ringTimeoutRef.current) { clearTimeout(ringTimeoutRef.current); ringTimeoutRef.current = null; }
    webrtc.hangup();
    setCallState({ status: "idle" });
    try { await channelRef.current?.publish("call-rejected", { timestamp: Date.now() }); } catch { }
  }, [webrtc]);

  const handleEndCall = useCallback(async () => {
    webrtc.hangup();
    setCallState({ status: "idle" });
    try { await channelRef.current?.publish("call-ended", { from: "user", timestamp: Date.now() }); } catch { }
  }, [webrtc]);

  // ── Core send + AI trigger ────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || !channelRef.current || sending) return;

    // FIX: Don't block on adminTyping.isAI here — that's a display concern.
    // The input field is disabled when isAI=true so this is double-protection,
    // but we read from ref (not state) to avoid stale closure issues.
    if (adminTypingRef.current.isAI) return;

    setSending(true);
    const clientMsgId = `cmid-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const timestamp   = Date.now();
    const optimistic: SupportMessage = {
      id: `optimistic-${clientMsgId}`,
      clientMsgId,
      text,
      sender: "user",
      timestamp,
    };

    // FIX: Update messagesRef SYNCHRONOUSLY here, before the async publish.
    // This ensures the AI trigger below has the complete context including
    // the new message, even before the Ably echo arrives.
    const contextWithNew = [...messagesRef.current, optimistic];
    messagesRef.current = contextWithNew;
    setMessages(contextWithNew);
    setInput("");

    if (userTypingRef.current) { clearTimeout(userTypingRef.current); userTypingRef.current = null; }
    channelRef.current?.publish("typing", { isTyping: false }).catch(() => {});

    try {
      await channelRef.current.publish("user-message", {
        text,
        timestamp,
        clientMsgId,
        walletAddress,
      });

      // ── AI trigger ────────────────────────────────────────────────────────
      // FIX: Read from ref (not state) to get current value in this closure.
      // FIX: aiInFlightRef prevents double-fire from rapid messages.
      // FIX: lastAiTriggerMsgRef prevents re-triggering the same message.
      // FIX: Default is always ON (AI_ALWAYS_ON) — only off if admin disabled it.
      if (aiEnabledRef.current && !aiInFlightRef.current && lastAiTriggerMsgRef.current !== clientMsgId) {
        aiInFlightRef.current        = true;
        lastAiTriggerMsgRef.current  = clientMsgId;

        // FIX: Use the synchronously-built context so AI always gets the
        // latest message, not a stale snapshot from the previous render cycle.
        const aiContext = [...contextWithNew];

        // Fire and forget — don't await, don't block the UI
        triggerAI(walletAddress, aiContext).finally(() => {
          // FIX: Release in-flight lock after 10s regardless of response,
          // so the next user message can trigger AI again.
          // The lock is also released when the AI reply arrives (admin-message handler).
          setTimeout(() => {
            aiInFlightRef.current = false;
          }, 10_000);
        });
      }
    } catch {
      // Rollback optimistic message on publish failure
      setMessages((prev) => {
        const next = prev.filter((m) => m.id !== optimistic.id);
        messagesRef.current = next;
        return next;
      });
      setInput(text);
      // FIX: Release in-flight lock on error so next send can trigger AI
      aiInFlightRef.current = false;
    } finally {
      setSending(false);
    }
  }, [input, sending, walletAddress]);

  // ── Quick button handler ───────────────────────────────────────────────────
  const handleQuickButton = useCallback(async (btn: QuickButton) => {
    if (sending || adminTypingRef.current.isAI) return;

    if (btn.type === "link") {
      window.open(btn.value.startsWith("http") ? btn.value : btn.value, "_blank", "noopener");
    }

    const text = btn.type === "link"
      ? `${btn.emoji ? btn.emoji + " " : ""}${btn.label}`
      : btn.value;

    if (!channelRef.current) return;
    setSending(true);
    const clientMsgId = `cmid-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const timestamp   = Date.now();
    const optimistic: SupportMessage = {
      id: `optimistic-${clientMsgId}`, clientMsgId, text, sender: "user", timestamp,
    };

    const contextWithNew = [...messagesRef.current, optimistic];
    messagesRef.current = contextWithNew;
    setMessages(contextWithNew);
    if (btn.type === "ai") setOpen(true);

    try {
      await channelRef.current.publish("user-message", { text, timestamp, clientMsgId, walletAddress });

      if (aiEnabledRef.current && !aiInFlightRef.current && lastAiTriggerMsgRef.current !== clientMsgId) {
        aiInFlightRef.current       = true;
        lastAiTriggerMsgRef.current = clientMsgId;
        triggerAI(walletAddress, [...contextWithNew]).finally(() => {
          setTimeout(() => { aiInFlightRef.current = false; }, 10_000);
        });
      }
    } catch {
      setMessages((prev) => {
        const next = prev.filter((m) => m.id !== optimistic.id);
        messagesRef.current = next;
        return next;
      });
      aiInFlightRef.current = false;
    } finally {
      setSending(false);
    }
  }, [sending, walletAddress]);

  // ── Typing indicator ──────────────────────────────────────────────────────
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
      {callState.status === "ringing" && (
        <IncomingCallModal onAccept={handleAcceptCall} onReject={handleRejectCall} />
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-[90] w-14 h-14 bg-black text-white rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.25)] flex items-center justify-center hover:scale-105 transition-transform"
        aria-label="Open support chat"
      >
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

      {open && (
        <div className="fixed bottom-24 right-6 z-[90] w-[360px] max-w-[calc(100vw-3rem)] flex flex-col bg-white border-4 border-black rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          {/* Header */}
          <div className="bg-black text-white px-5 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 bg-white/10 rounded-full border-2 border-white/20 flex items-center justify-center">
                  <ShieldCheck size={16} className="text-white" />
                </div>
                <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-black ${connected ? "bg-green-400" : "bg-slate-500"}`} />
              </div>
              <div>
                <p className="font-black text-sm uppercase tracking-tight leading-none">Kapogian Support</p>
                <p className="text-[10px] font-bold text-white/40 mt-0.5">
                  {callState.status === "active"
                    ? "📞 Call in progress"
                    : connected
                    ? "Connected · replies in real-time"
                    : "Connecting..."}
                </p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors">
              <ChevronDown size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="relative flex-1 overflow-y-auto p-4 space-y-3 min-h-[280px] max-h-[380px] bg-[#fdfcfa]">
            {callState.status === "active" && (
              <ActiveCallOverlay startedAt={callState.startedAt} onEndCall={handleEndCall} />
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
                    <div className={`px-3.5 py-2.5 rounded-2xl text-sm font-semibold leading-snug ${
                      msg.sender === "user"
                        ? "bg-black text-white rounded-br-sm"
                        : msg.isAI
                        ? "bg-purple-600 text-white rounded-bl-sm"
                        : "bg-white border-2 border-slate-200 text-slate-800 rounded-bl-sm"
                    }`}>
                      {msg.sender === "admin" && msg.isAI && (
                        <p className="text-[9px] font-black text-purple-300 uppercase tracking-widest mb-1">✦ AI Assistant</p>
                      )}
                      {msg.sender === "admin" && !msg.isAI && (
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Kapogian Admin</p>
                      )}
                      <p>{msg.text}</p>
                      <p className={`text-[9px] mt-1 font-mono ${
                        msg.sender === "user" ? "text-white/40 text-right"
                        : msg.isAI ? "text-purple-300/60"
                        : "text-slate-400"
                      }`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {/* Navigation buttons */}
                    {msg.buttons && msg.buttons.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {msg.buttons.map((btn, i) => (
                          <a
                            key={btn.id ?? i}
                            href={btn.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2.5 bg-white border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 rounded-2xl px-4 py-3 transition-all group shadow-sm"
                          >
                            <span className="text-xl leading-none">{btn.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black text-slate-800 group-hover:text-purple-700 transition-colors">{btn.label}</p>
                              <p className="text-[9px] font-mono text-slate-400 truncate mt-0.5">{btn.url}</p>
                            </div>
                            <span className="text-slate-300 group-hover:text-purple-400 transition-colors text-lg">↗</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Admin / AI typing bubble */}
            {adminTyping.isTyping && (
              <div className="flex justify-start">
                <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl rounded-bl-sm ${
                  adminTyping.isAI
                    ? "bg-purple-100 border-2 border-purple-200"
                    : "bg-white border-2 border-slate-200 shadow-sm"
                }`}>
                  <span className={`text-[9px] font-black uppercase tracking-widest mr-1 ${adminTyping.isAI ? "text-purple-500" : "text-slate-400"}`}>
                    {adminTyping.isAI ? "✦ Kapogian Support" : "Admin"}
                  </span>
                  {[0, 1, 2].map((i) => (
                    <span key={i} className={`w-2 h-2 rounded-full animate-bounce ${adminTyping.isAI ? "bg-purple-400" : "bg-slate-300"}`} style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick buttons */}
          {quickButtons.length > 0 && (
            <div className="px-3 pt-2.5 pb-1 border-t-2 border-slate-100 bg-white flex-shrink-0">
              <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1.5 ml-1">Quick Actions</p>
              <div className="flex gap-1.5 flex-wrap">
                {quickButtons.map((btn) => (
                  <button
                    key={btn.id}
                    onClick={() => handleQuickButton(btn)}
                    disabled={sending || !connected || adminTyping.isAI}
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
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={adminTyping.isAI ? "Kapo is typing a reply..." : "Type your concern..."}
                maxLength={500}
                disabled={adminTyping.isAI}
                className={`w-full h-10 rounded-2xl border-2 px-4 text-sm font-semibold outline-none transition-all bg-slate-50 ${
                  adminTyping.isAI
                    ? "border-purple-200 bg-purple-50 text-slate-400 cursor-not-allowed placeholder:text-purple-300"
                    : "border-slate-200 focus:border-black"
                }`}
              />
              {adminTyping.isAI && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-0.5">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </span>
              )}
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending || !connected || adminTyping.isAI}
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