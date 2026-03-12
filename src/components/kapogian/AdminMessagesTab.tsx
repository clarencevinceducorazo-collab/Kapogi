"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import * as Ably from "ably";
import {
  MessageCircle,
  Send,
  Loader2,
  User,
  ShieldCheck,
  Inbox,
  Circle,
  X,
  Phone,
  PhoneOff,
  PhoneCall,
  PhoneMissed,
  Clock,
} from "lucide-react";

import { useWebRTCCall } from "./usewebRTCCall";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SupportMessage {
  id: string;
  clientMsgId?: string;
  text: string;
  sender: "user" | "admin";
  timestamp: number;
}

interface Conversation {
  walletAddress: string;
  messages: SupportMessage[];
  unread: number;
  lastActivity: number;
}

type CallState =
  | { status: "idle" }
  | { status: "calling"; walletAddress: string; startedAt: number }
  | { status: "active"; walletAddress: string; startedAt: number }
  | { status: "rejected"; walletAddress: string }
  | { status: "missed"; walletAddress: string };

const ABLY_KEY = "YEbuRQ.r9odYA:eJmjank2w4vunEmM6HKLsKY557aJyRLPd8urztGykVs";
const CALL_TIMEOUT_MS = 30_000; // 30 s before auto-missed

const shortAddr = (addr: string) =>
  addr.length > 10 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mergeMessage(
  prev: SupportMessage[],
  incoming: SupportMessage,
): SupportMessage[] {
  if (incoming.id && prev.some((m) => m.id === incoming.id)) return prev;
  if (incoming.sender === "admin" && incoming.clientMsgId) {
    const idx = prev.findIndex(
      (m) =>
        m.id.startsWith("optimistic-") &&
        m.clientMsgId === incoming.clientMsgId,
    );
    if (idx !== -1) {
      const next = [...prev];
      next[idx] = incoming;
      return next;
    }
  }
  return [...prev, incoming];
}

interface UserSubState {
  channel: Ably.RealtimeChannel;
  historyLoaded: boolean;
  liveBuffer: SupportMessage[];
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
  return <span className="font-mono">{mm}:{ss}</span>;
}

// ─── Active Call Banner (inside chat window header area) ──────────────────────

function ActiveCallBanner({
  callState,
  onEndCall,
  onDismiss,
}: {
  callState: CallState;
  onEndCall: () => void;
  onDismiss: () => void;
}) {
  if (callState.status === "idle") return null;

  if (callState.status === "calling") {
    return (
      <div className="bg-yellow-400 border-b-4 border-black px-5 py-3 flex items-center gap-3 flex-shrink-0">
        <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0">
          <PhoneCall size={14} className="text-yellow-400 animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-xs uppercase tracking-tight text-black leading-none">
            Calling user...
          </p>
          <p className="text-[10px] font-bold text-black/60 mt-0.5">
            Waiting for them to pick up
          </p>
        </div>
        <button
          onClick={onEndCall}
          className="flex items-center gap-1.5 h-8 px-3 bg-red-500 text-white rounded-xl border-2 border-black font-black text-[10px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-red-600 transition-colors flex-shrink-0"
        >
          <PhoneOff size={12} /> Cancel
        </button>
      </div>
    );
  }

  if (callState.status === "active") {
    return (
      <div className="bg-green-400 border-b-4 border-black px-5 py-3 flex items-center gap-3 flex-shrink-0">
        <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0">
          <Phone size={14} className="text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-xs uppercase tracking-tight text-black leading-none flex items-center gap-1.5">
            Call Active · <CallTimer startedAt={callState.startedAt} />
          </p>
          <p className="text-[10px] font-bold text-black/60 mt-0.5">
            Live call with {shortAddr(callState.walletAddress)}
          </p>
        </div>
        <button
          onClick={onEndCall}
          className="flex items-center gap-1.5 h-8 px-3 bg-red-500 text-white rounded-xl border-2 border-black font-black text-[10px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-red-600 transition-colors flex-shrink-0"
        >
          <PhoneOff size={12} /> End Call
        </button>
      </div>
    );
  }

  if (callState.status === "rejected") {
    return (
      <div className="bg-red-100 border-b-4 border-red-300 px-5 py-3 flex items-center gap-3 flex-shrink-0">
        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
          <PhoneMissed size={14} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-xs uppercase tracking-tight text-red-700 leading-none">
            Call Rejected
          </p>
          <p className="text-[10px] font-bold text-red-500 mt-0.5">
            User declined the call
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="w-7 h-7 rounded-full bg-red-200 hover:bg-red-300 flex items-center justify-center text-red-600 transition-colors flex-shrink-0"
        >
          <X size={12} />
        </button>
      </div>
    );
  }

  if (callState.status === "missed") {
    return (
      <div className="bg-slate-100 border-b-4 border-slate-300 px-5 py-3 flex items-center gap-3 flex-shrink-0">
        <div className="w-8 h-8 bg-slate-400 rounded-full flex items-center justify-center flex-shrink-0">
          <PhoneMissed size={14} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-xs uppercase tracking-tight text-slate-600 leading-none">
            No Answer
          </p>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5">
            User didn't pick up
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-500 transition-colors flex-shrink-0"
        >
          <X size={12} />
        </button>
      </div>
    );
  }

  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminMessagesTab() {
  const [conversations, setConversations] = useState<Map<string, Conversation>>(new Map());
  const [activeWallet, setActiveWallet] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [sending, setSending] = useState(false);
  const [callState, setCallState] = useState<CallState>({ status: "idle" });

  const ablyRef = useRef<Ably.Realtime | null>(null);
  const subsRef = useRef<Map<string, UserSubState>>(new Map());
  const activeWalletRef = useRef<string | null>(null);
  const callTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const webrtc = useWebRTCCall();

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    activeWalletRef.current = activeWallet;
  }, [activeWallet]);

  // ── Boot Ably ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let destroyed = false;
    const CLOSED_CODES = new Set([80017, 80000, 90001]);

    const ably = new Ably.Realtime({ key: ABLY_KEY });
    ablyRef.current = ably;

    ably.connection.on("connected", () => { if (!destroyed) setConnected(true); });
    ably.connection.on("disconnected", () => { if (!destroyed) setConnected(false); });
    ably.connection.on("failed", () => { if (!destroyed) setConnected(false); });

    const LS_KEY = "kapogian_admin_known_wallets";
    const readStoredWallets = (): string[] => {
      try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"); } catch { return []; }
    };
    const saveWallet = (wallet: string) => {
      try {
        const existing = new Set(readStoredWallets());
        if (existing.has(wallet)) return;
        existing.add(wallet);
        localStorage.setItem(LS_KEY, JSON.stringify(Array.from(existing)));
      } catch { }
    };

    const storedWallets = readStoredWallets();
    for (const wallet of storedWallets) {
      if (!destroyed) subscribeToUser(wallet);
    }

    const inboxChannel = ably.channels.get("kapogian-support-inbox");

    inboxChannel.subscribe("user-connected", (msg) => {
      if (destroyed) return;
      const { walletAddress } = msg.data as { walletAddress: string };
      if (!walletAddress) return;
      saveWallet(walletAddress);
      subscribeToUser(walletAddress);
    });

    const loadInboxHistory = async () => {
      try {
        await new Promise<void>((resolve, reject) => {
          if (destroyed) return resolve();
          if (ably.connection.state === "connected") return resolve();
          ably.connection.once("connected", () => resolve());
          ably.connection.once("failed", () => reject(Object.assign(new Error("failed"), { code: 80000 })));
          ably.connection.once("closed", () => reject(Object.assign(new Error("closed"), { code: 80017 })));
        });
        if (destroyed) return;

        await inboxChannel.attach();
        if (destroyed) return;

        const page = await inboxChannel.history({ limit: 100, direction: "backwards" });
        if (destroyed) return;

        const seen = new Set<string>(readStoredWallets());
        for (const item of page.items) {
          if (item.name !== "user-connected") continue;
          const wallet = (item.data as { walletAddress?: string })?.walletAddress;
          if (!wallet) continue;
          saveWallet(wallet);
          if (!seen.has(wallet)) { seen.add(wallet); subscribeToUser(wallet); }
        }

        let nextPage = page.hasNext() ? await page.next() : null;
        while (nextPage && !destroyed) {
          for (const item of nextPage.items) {
            if (item.name !== "user-connected") continue;
            const wallet = (item.data as { walletAddress?: string })?.walletAddress;
            if (!wallet) continue;
            saveWallet(wallet);
            if (!seen.has(wallet)) { seen.add(wallet); subscribeToUser(wallet); }
          }
          nextPage = nextPage.hasNext() ? await nextPage.next() : null;
        }
      } catch (e: any) {
        const code = e?.code ?? e?.statusCode;
        if (CLOSED_CODES.has(code)) return;
        if (!destroyed) console.warn("Inbox history load failed:", e);
      }
    };

    loadInboxHistory();

    return () => {
      destroyed = true;
      subsRef.current.forEach((s) => s.channel.unsubscribe());
      subsRef.current.clear();
      inboxChannel.unsubscribe();
      ably.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Subscribe to a user channel + handle call events ──────────────────────
  const subscribeToUser = useCallback((walletAddress: string) => {
    const ably = ablyRef.current;
    if (!ably) return;
    if (subsRef.current.has(walletAddress)) return;

    const channelName = `kapogian-support:${walletAddress.toLowerCase()}`;
    const channel = ably.channels.get(channelName);

    const subState: UserSubState = { channel, historyLoaded: false, liveBuffer: [] };
    subsRef.current.set(walletAddress, subState);

    setConversations((prev) => {
      if (prev.has(walletAddress)) return prev;
      const next = new Map(prev);
      next.set(walletAddress, { walletAddress, messages: [], unread: 0, lastActivity: Date.now() });
      return next;
    });

    // ── Chat message subscriptions ────────────────────────────────────────────
    channel.subscribe("user-message", (msg) => {
      const incoming: SupportMessage = {
        id: msg.id ?? `live-user-${Date.now()}`,
        clientMsgId: msg.data.clientMsgId,
        text: msg.data.text,
        sender: "user",
        timestamp: msg.data.timestamp ?? Date.now(),
      };

      const sub = subsRef.current.get(walletAddress);
      if (!sub) return;

      if (!sub.historyLoaded) { sub.liveBuffer.push(incoming); return; }

      const isActive = activeWalletRef.current === walletAddress;
      setConversations((prev) => {
        const next = new Map(prev);
        const conv = next.get(walletAddress) ?? { walletAddress, messages: [], unread: 0, lastActivity: Date.now() };
        const merged = mergeMessage(conv.messages, incoming);
        if (merged === conv.messages) return prev;
        next.set(walletAddress, { ...conv, messages: merged, unread: isActive ? 0 : conv.unread + 1, lastActivity: incoming.timestamp });
        return next;
      });
    });

    // ── Call event subscriptions ──────────────────────────────────────────────
    channel.subscribe("call-accepted", async () => {
      if (callTimeoutRef.current) { clearTimeout(callTimeoutRef.current); callTimeoutRef.current = null; }
      setCallState((prev) =>
        prev.status === "calling" && prev.walletAddress === walletAddress
          ? { status: "active", walletAddress, startedAt: Date.now() }
          : prev,
      );
      // ── Start WebRTC as offerer ──
      try {
        await webrtc.startAsOfferer(channel);
      } catch (e) {
        console.warn("WebRTC offer failed:", e);
      }
    });

    channel.subscribe("call-rejected", () => {
      if (callTimeoutRef.current) { clearTimeout(callTimeoutRef.current); callTimeoutRef.current = null; }
      webrtc.hangup();
      setCallState((prev) =>
        (prev.status === "calling" || prev.status === "active") && prev.walletAddress === walletAddress
          ? { status: "rejected", walletAddress }
          : prev,
      );
    });

    channel.subscribe("call-ended", () => {
      if (callTimeoutRef.current) { clearTimeout(callTimeoutRef.current); callTimeoutRef.current = null; }
      webrtc.hangup();
      setCallState((prev) =>
        prev.status === "active" && prev.walletAddress === walletAddress
          ? { status: "idle" }
          : prev,
      );
    });

    // ── WebRTC signaling ─────────────────────────────────────────────────────
    channel.subscribe("webrtc-answer", (msg) => {
      webrtc.handleAnswer(msg.data.sdp).catch(() => {});
    });

    channel.subscribe("webrtc-ice", (msg) => {
      webrtc.handleIceCandidate(msg.data.candidate).catch(() => {});
    });

    // ── Load history ──────────────────────────────────────────────────────────
    const CLOSED_CODES = new Set([80017, 80000, 90001]);
    const loadHistory = async () => {
      try {
        await new Promise<void>((resolve, reject) => {
          if (ably.connection.state === "connected") return resolve();
          if (ably.connection.state === "closed" || ably.connection.state === "failed")
            return reject(Object.assign(new Error("closed"), { code: 80017 }));
          ably.connection.once("connected", () => resolve());
          ably.connection.once("failed", () => reject(Object.assign(new Error("failed"), { code: 80000 })));
          ably.connection.once("closed", () => reject(Object.assign(new Error("closed"), { code: 80017 })));
        });

        await channel.attach();
        if (ably.connection.state === "closed") return;

        const page = await channel.history({ limit: 100, direction: "forwards" });
        const historical: SupportMessage[] = page.items
          .filter((m) => m.name === "user-message" || m.name === "admin-message")
          .map((m) => ({
            id: m.id ?? `hist-${Date.now()}-${Math.random()}`,
            clientMsgId: m.data.clientMsgId,
            text: m.data.text,
            sender: (m.name === "admin-message" ? "admin" : "user") as "admin" | "user",
            timestamp: m.data.timestamp ?? (m as any).timestamp ?? Date.now(),
          }))
          .sort((a, b) => a.timestamp - b.timestamp);

        const sub = subsRef.current.get(walletAddress);
        if (!sub) return;

        setConversations((prev) => {
          const next = new Map(prev);
          const conv = next.get(walletAddress) ?? { walletAddress, messages: [], unread: 0, lastActivity: Date.now() };
          let merged = historical;
          for (const live of sub.liveBuffer) merged = mergeMessage(merged, live);
          sub.liveBuffer = [];
          sub.historyLoaded = true;
          const lastTs = merged[merged.length - 1]?.timestamp ?? conv.lastActivity;
          next.set(walletAddress, { ...conv, messages: merged, lastActivity: lastTs });
          return next;
        });
      } catch (e: any) {
        const code = e?.code ?? e?.statusCode;
        if (!CLOSED_CODES.has(code)) console.warn("History load failed:", e);
        const sub = subsRef.current.get(walletAddress);
        if (sub) {
          setConversations((prev) => {
            const next = new Map(prev);
            const conv = next.get(walletAddress);
            if (!conv) return prev;
            let merged = conv.messages;
            for (const live of sub.liveBuffer) merged = mergeMessage(merged, live);
            sub.liveBuffer = [];
            sub.historyLoaded = true;
            next.set(walletAddress, { ...conv, messages: merged });
            return next;
          });
        }
      }
    };

    loadHistory();
  }, []);

  // ── Initiate call ──────────────────────────────────────────────────────────
  const handleInitiateCall = useCallback(async () => {
    if (!activeWallet || callState.status !== "idle") return;
    const sub = subsRef.current.get(activeWallet);
    if (!sub) return;

    setCallState({ status: "calling", walletAddress: activeWallet, startedAt: Date.now() });

    try {
      await sub.channel.publish("call-request", {
        from: "admin",
        timestamp: Date.now(),
      });
    } catch {
      setCallState({ status: "idle" });
      return;
    }

    // Auto-miss after timeout
    callTimeoutRef.current = setTimeout(() => {
      setCallState((prev) =>
        prev.status === "calling" && prev.walletAddress === activeWallet
          ? { status: "missed", walletAddress: activeWallet }
          : prev,
      );
    }, CALL_TIMEOUT_MS);
  }, [activeWallet, callState.status]);

  // ── End / cancel call ──────────────────────────────────────────────────────
  const handleEndCall = useCallback(async () => {
    if (callState.status === "idle") return;
    if (callTimeoutRef.current) { clearTimeout(callTimeoutRef.current); callTimeoutRef.current = null; }

    const wallet = (callState as any).walletAddress as string;
    const sub = subsRef.current.get(wallet);
    if (sub) {
      try { await sub.channel.publish("call-ended", { from: "admin", timestamp: Date.now() }); } catch { }
    }
    webrtc.hangup();
    setCallState({ status: "idle" });
  }, [callState, webrtc]);

  // ── Dismiss rejected/missed banner ─────────────────────────────────────────
  const handleDismissCallBanner = useCallback(() => {
    setCallState({ status: "idle" });
  }, []);

  // ── Select conversation ────────────────────────────────────────────────────
  const selectConversation = (walletAddress: string) => {
    // End any ongoing call to a different user when switching
    if (
      callState.status !== "idle" &&
      (callState as any).walletAddress !== walletAddress
    ) {
      handleEndCall();
    }
    setActiveWallet(walletAddress);
    setConversations((prev) => {
      const next = new Map(prev);
      const conv = next.get(walletAddress);
      if (conv && conv.unread > 0) {
        next.set(walletAddress, { ...conv, unread: 0 });
        return next;
      }
      return prev;
    });
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }, 50);
  };

  // ── Send reply ─────────────────────────────────────────────────────────────
  const handleSendReply = useCallback(async () => {
    const text = replyInput.trim();
    if (!text || !activeWallet || sending) return;
    const sub = subsRef.current.get(activeWallet);
    if (!sub) return;

    setSending(true);
    const clientMsgId = `cmid-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const timestamp = Date.now();
    const optimistic: SupportMessage = { id: `optimistic-${clientMsgId}`, clientMsgId, text, sender: "admin", timestamp };

    setConversations((prev) => {
      const next = new Map(prev);
      const conv = next.get(activeWallet);
      if (!conv) return prev;
      next.set(activeWallet, { ...conv, messages: [...conv.messages, optimistic], lastActivity: timestamp });
      return next;
    });
    setReplyInput("");

    try {
      await sub.channel.publish("admin-message", { text, timestamp, clientMsgId });
    } catch {
      setConversations((prev) => {
        const next = new Map(prev);
        const conv = next.get(activeWallet);
        if (!conv) return prev;
        next.set(activeWallet, { ...conv, messages: conv.messages.filter((m) => m.id !== optimistic.id) });
        return next;
      });
      setReplyInput(text);
    } finally {
      setSending(false);
    }
  }, [replyInput, activeWallet, sending]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendReply(); }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, activeWallet]);

  // ── Remove conversation ────────────────────────────────────────────────────
  const removeConversation = (walletAddress: string) => {
    setConversations((prev) => { const next = new Map(prev); next.delete(walletAddress); return next; });
    if (activeWalletRef.current === walletAddress) setActiveWallet(null);
    const sub = subsRef.current.get(walletAddress);
    if (sub) { sub.channel.unsubscribe(); subsRef.current.delete(walletAddress); }
    try {
      const LS_KEY = "kapogian_admin_known_wallets";
      const existing: string[] = JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
      localStorage.setItem(LS_KEY, JSON.stringify(existing.filter((w) => w !== walletAddress)));
    } catch { }
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const totalUnread = Array.from(conversations.values()).reduce((s, c) => s + c.unread, 0);
  const sortedConvs = Array.from(conversations.values()).sort((a, b) => b.lastActivity - a.lastActivity);
  const activeConv = activeWallet ? conversations.get(activeWallet) : null;

  // Call button state for the active conversation
  const activeConvIsInCall =
    callState.status !== "idle" &&
    (callState as any).walletAddress === activeWallet;
  const canCall =
    !!activeWallet &&
    connected &&
    (callState.status === "idle" || activeConvIsInCall === false);

  return (
    <div className="flex gap-6 h-[calc(100vh-220px)] min-h-[500px]">
      {/* ── Left: Conversation List ─────────────────────────────────────────── */}
      <div className="w-[300px] flex-shrink-0 flex flex-col gap-3">
        <div className="bg-white border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden h-full flex flex-col">
          <div className="bg-black text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Inbox size={16} />
              <span className="font-black text-sm uppercase tracking-tight">Inbox</span>
              {totalUnread > 0 && (
                <span className="w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {totalUnread > 9 ? "9+" : totalUnread}
                </span>
              )}
            </div>
            <div
              className={`w-2 h-2 rounded-full ${connected ? "bg-green-400" : "bg-slate-500"}`}
              title={connected ? "Connected" : "Disconnected"}
            />
          </div>

          <div className="overflow-y-auto flex-1">
            {sortedConvs.length === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center gap-3 text-center h-full">
                <div className="w-12 h-12 bg-slate-100 rounded-full border-2 border-slate-200 flex items-center justify-center">
                  <MessageCircle size={20} className="text-slate-300" />
                </div>
                <div>
                  <p className="font-black text-slate-300 text-xs uppercase">No messages yet</p>
                  <p className="text-[10px] text-slate-300 mt-1 leading-tight">
                    Users appear here automatically when they send a message
                  </p>
                </div>
              </div>
            ) : (
              sortedConvs.map((conv) => {
                const isSelected = activeWallet === conv.walletAddress;
                const hasActiveCall =
                  callState.status !== "idle" &&
                  (callState as any).walletAddress === conv.walletAddress;
                return (
                  <div
                    key={conv.walletAddress}
                    className={`group relative flex items-center gap-3 px-4 py-3 border-b-2 border-slate-100 cursor-pointer transition-all ${
                      isSelected ? "bg-black text-white" : "hover:bg-yellow-400 hover:border-yellow-400"
                    }`}
                    onClick={() => selectConversation(conv.walletAddress)}
                  >
                    <div
                      className={`w-9 h-9 rounded-full border-2 flex items-center justify-center flex-shrink-0 relative ${
                        isSelected ? "border-white/30 bg-white/10" : "border-slate-200 bg-slate-100 group-hover:border-yellow-600 group-hover:bg-yellow-200"
                      }`}
                    >
                      <User size={14} className={isSelected ? "text-white" : "text-slate-400 group-hover:text-black"} />
                      {hasActiveCall && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-black animate-pulse" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-black text-xs truncate uppercase ${isSelected ? "text-white" : "text-slate-800 group-hover:text-black"}`}>
                        {shortAddr(conv.walletAddress)}
                      </p>
                      {conv.messages.length > 0 && (
                        <p className={`text-[10px] font-semibold truncate mt-0.5 ${isSelected ? "text-white/50" : "text-slate-400 group-hover:text-black/60"}`}>
                          {conv.messages[conv.messages.length - 1].text}
                        </p>
                      )}
                    </div>
                    {conv.unread > 0 ? (
                      <span className="w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center flex-shrink-0">
                        {conv.unread > 9 ? "9+" : conv.unread}
                      </span>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); removeConversation(conv.walletAddress); }}
                        title="Remove conversation"
                        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                          isSelected
                            ? "bg-white/20 hover:bg-white/40 text-white"
                            : "bg-black/20 hover:bg-red-500 hover:text-white text-black"
                        }`}
                      >
                        <X size={10} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Right: Chat Window ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-white border-4 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        {!activeConv ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
            <div className="w-20 h-20 bg-slate-100 rounded-full border-2 border-slate-200 flex items-center justify-center">
              <MessageCircle size={32} className="text-slate-300" />
            </div>
            <div>
              <p className="font-black text-slate-400 uppercase text-base tracking-tight">Waiting for messages</p>
              <p className="text-sm font-semibold text-slate-300 mt-1">Select a conversation from the inbox</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="bg-black text-white px-5 py-4 flex items-center gap-3 flex-shrink-0">
              <div className="w-10 h-10 bg-white/10 rounded-full border-2 border-white/20 flex items-center justify-center">
                <User size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm uppercase tracking-tight">{shortAddr(activeConv.walletAddress)}</p>
                <p className="text-[10px] font-mono text-white/40 mt-0.5 truncate">{activeConv.walletAddress}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                  <ShieldCheck size={11} className="text-green-400" />
                  <span className="text-[9px] font-black uppercase text-white/60">Admin</span>
                </div>
                {/* ── Call Button ── */}
                {callState.status === "idle" ? (
                  <button
                    onClick={handleInitiateCall}
                    disabled={!connected}
                    title="Call user"
                    className="flex items-center gap-1.5 h-8 px-3 bg-green-500 text-white rounded-xl border-2 border-green-300 font-black text-[10px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)] hover:bg-green-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Phone size={13} /> Call
                  </button>
                ) : activeConvIsInCall ? (
                  <button
                    onClick={handleEndCall}
                    title="End call"
                    className="flex items-center gap-1.5 h-8 px-3 bg-red-500 text-white rounded-xl border-2 border-red-300 font-black text-[10px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)] hover:bg-red-400 transition-colors"
                  >
                    <PhoneOff size={13} />
                    {callState.status === "calling" ? "Cancel" : "End"}
                  </button>
                ) : null}
              </div>
            </div>

            {/* Call status banner (below header) */}
            <ActiveCallBanner
              callState={activeConvIsInCall ? callState : { status: "idle" }}
              onEndCall={handleEndCall}
              onDismiss={handleDismissCallBanner}
            />

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-[#fdfcfa]">
              {activeConv.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-center">
                  <Circle size={32} className="text-slate-200" />
                  <p className="font-black text-slate-300 text-sm uppercase">No messages yet</p>
                </div>
              ) : (
                activeConv.messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === "admin" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm font-semibold leading-snug ${
                        msg.sender === "admin"
                          ? "bg-black text-white rounded-br-sm"
                          : "bg-white border-2 border-slate-200 text-slate-800 rounded-bl-sm shadow-sm"
                      }`}
                    >
                      {msg.sender === "user" && (
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">User</p>
                      )}
                      {msg.sender === "admin" && (
                        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">You (Admin)</p>
                      )}
                      <p>{msg.text}</p>
                      <p className={`text-[9px] mt-1 font-mono ${msg.sender === "admin" ? "text-white/40 text-right" : "text-slate-400"}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Reply Input */}
            <div className="flex gap-3 p-4 border-t-2 border-slate-100 bg-white flex-shrink-0">
              <input
                ref={inputRef}
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Reply to user..."
                maxLength={1000}
                className="flex-1 h-11 rounded-2xl border-2 border-slate-200 px-4 text-sm font-semibold outline-none focus:border-black transition-colors bg-slate-50"
              />
              <button
                onClick={handleSendReply}
                disabled={!replyInput.trim() || sending || !connected}
                className="w-11 h-11 rounded-2xl bg-black text-white border-2 border-black flex items-center justify-center disabled:opacity-40 hover:bg-slate-800 transition-colors flex-shrink-0 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)]"
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Unread count singleton hook ───────────────────────────────────────────────

let _unreadListeners: Array<(n: number) => void> = [];
let _unreadCount = 0;
let _ablyInstance: Ably.Realtime | null = null;
let _subscribedWallets = new Set<string>();

function _subscribeWalletForUnread(ably: Ably.Realtime, walletAddress: string) {
  if (_subscribedWallets.has(walletAddress)) return;
  _subscribedWallets.add(walletAddress);
  const ch = ably.channels.get(`kapogian-support:${walletAddress.toLowerCase()}`);
  ch.subscribe("user-message", () => {
    _unreadCount += 1;
    _unreadListeners.forEach((fn) => fn(_unreadCount));
  });
}

function _bootUnreadSingleton() {
  if (_ablyInstance) return;
  const ably = new Ably.Realtime({ key: ABLY_KEY });
  _ablyInstance = ably;

  const inbox = ably.channels.get("kapogian-support-inbox");
  inbox.subscribe("user-connected", (msg) => {
    const { walletAddress } = msg.data as { walletAddress: string };
    if (walletAddress) _subscribeWalletForUnread(ably, walletAddress);
  });

  const loadHistory = async () => {
    try {
      await inbox.attach();
      const page = await inbox.history({ limit: 100, direction: "backwards" });
      for (const item of page.items) {
        const wallet = (item.data as { walletAddress?: string })?.walletAddress;
        if (wallet) _subscribeWalletForUnread(ably, wallet);
      }
    } catch { }
  };
  loadHistory();
}

export function resetAdminUnread() {
  _unreadCount = 0;
  _unreadListeners.forEach((fn) => fn(0));
}

export function useAdminUnreadCount(): number {
  const [count, setCount] = useState(_unreadCount);
  useEffect(() => {
    _bootUnreadSingleton();
    _unreadListeners.push(setCount);
    return () => { _unreadListeners = _unreadListeners.filter((fn) => fn !== setCount); };
  }, []);
  return count;
}