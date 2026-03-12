"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import * as Ably from "ably";
import {
  MessageCircle, X, Send, Loader2, ShieldCheck,
  ChevronDown, Phone, PhoneOff, PhoneCall,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SupportMessage {
  id: string;
  clientMsgId?: string;
  text: string;
  sender: "user" | "admin";
  timestamp: number;
}

type UserCallState =
  | { status: "idle" }
  | { status: "ringing" }
  | { status: "active"; startedAt: number };

// ─── Constants ────────────────────────────────────────────────────────────────

const ABLY_KEY = "YEbuRQ.r9odYA:eJmjank2w4vunEmM6HKLsKY557aJyRLPd8urztGykVs";
const RING_TIMEOUT_MS = 30_000;
const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "turn:openrelay.metered.ca:80",                username: "openrelayproject", credential: "openrelayproject" },
  { urls: "turn:openrelay.metered.ca:443",               username: "openrelayproject", credential: "openrelayproject" },
  { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mergeMessage(prev: SupportMessage[], incoming: SupportMessage): SupportMessage[] {
  if (incoming.id && prev.some((m) => m.id === incoming.id)) return prev;
  if (incoming.clientMsgId) {
    const idx = prev.findIndex((m) => m.id.startsWith("optimistic-") && m.clientMsgId === incoming.clientMsgId);
    if (idx !== -1) { const next = [...prev]; next[idx] = incoming; return next; }
  }
  return [...prev, incoming];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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

function IncomingCallModal({ onAccept, onReject }: { onAccept: () => void; onReject: () => void }) {
  const [ring, setRing] = useState(true);
  useEffect(() => { const id = setInterval(() => setRing((v) => !v), 600); return () => clearInterval(id); }, []);
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white border-4 border-black rounded-[2.5rem] p-8 max-w-xs w-full shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center">
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
          <button onClick={onReject} className="w-16 h-16 rounded-full bg-red-500 border-4 border-black flex flex-col items-center justify-center gap-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-red-400 transition-all">
            <PhoneOff size={22} className="text-white" />
            <span className="text-[8px] font-black text-white uppercase">Decline</span>
          </button>
          <button onClick={onAccept} className="w-16 h-16 rounded-full bg-green-500 border-4 border-black flex flex-col items-center justify-center gap-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-green-400 transition-all">
            <Phone size={22} className="text-white" />
            <span className="text-[8px] font-black text-white uppercase">Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ActiveCallOverlay({ startedAt, onEndCall }: { startedAt: number; onEndCall: () => void }) {
  return (
    <div className="absolute inset-0 z-10 bg-black/95 flex flex-col items-center justify-center gap-5 rounded-b-[2rem]">
      <div className="flex items-end gap-1.5 h-10">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="w-1.5 rounded-full bg-green-400 animate-bounce"
            style={{ height: `${16 + (i % 3) * 12}px`, animationDelay: `${i * 100}ms`, animationDuration: "0.8s" }} />
        ))}
      </div>
      <div className="text-center">
        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Call Active</p>
        <p className="text-3xl font-black text-green-400"><CallTimer startedAt={startedAt} /></p>
        <p className="text-xs font-semibold text-white/40 mt-1">Kapogian Support</p>
      </div>
      <button onClick={onEndCall} className="w-16 h-16 rounded-full bg-red-500 border-4 border-black flex flex-col items-center justify-center gap-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-red-400 transition-all mt-2">
        <PhoneOff size={22} className="text-white" />
        <span className="text-[8px] font-black text-white uppercase">End</span>
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function UserMessageDrawer({ walletAddress }: { walletAddress: string }) {
  const [open, setOpen]           = useState(false);
  const [messages, setMessages]   = useState<SupportMessage[]>([]);
  const [input, setInput]         = useState("");
  const [connected, setConnected] = useState(false);
  const [unreadCount, setUnread]  = useState(0);
  const [sending, setSending]     = useState(false);
  const [callState, setCallState] = useState<UserCallState>({ status: "idle" });

  // Ably refs
  const ablyRef          = useRef<Ably.Realtime | null>(null);
  const channelRef       = useRef<Ably.RealtimeChannel | null>(null);
  const historyLoadedRef = useRef(false);
  const liveBufferRef    = useRef<SupportMessage[]>([]);
  const ringTimeoutRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef        = useRef<HTMLDivElement>(null);
  const inputRef         = useRef<HTMLInputElement>(null);

  // WebRTC refs — all inlined
  const pcRef          = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudio    = useRef<HTMLAudioElement | null>(null);
  const iceBufRef      = useRef<RTCIceCandidateInit[]>([]);
  const pendingOffer   = useRef<RTCSessionDescriptionInit | null>(null);

  // One-time boot guard (survives Strict Mode double-invoke)
  const bootedRef = useRef(false);

  // ── WebRTC teardown ──────────────────────────────────────────────────────
  const hangup = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    if (remoteAudio.current) { remoteAudio.current.srcObject = null; remoteAudio.current = null; }
    iceBufRef.current = [];
    pendingOffer.current = null;
    console.log("[RTC-user] hangup");
  }, []);

  // ── Build answerer PC and process offer ──────────────────────────────────
  // This is called ONLY from the Accept button handler (after mic is granted)
  const processOffer = useCallback(async (
    ch: Ably.RealtimeChannel,
    offer: RTCSessionDescriptionInit,
    mic: MediaStream,
  ) => {
    console.log("[RTC-user] processOffer start");

    // Clean up any prior PC (but keep mic stream)
    pcRef.current?.close();
    pcRef.current = null;
    iceBufRef.current = [];

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    // Add local mic tracks
    mic.getTracks().forEach((t) => {
      console.log("[RTC-user] adding track:", t.kind);
      pc.addTrack(t, mic);
    });

    // Remote audio output
    pc.ontrack = (evt) => {
      console.log("[RTC-user] ontrack:", evt.track.kind);
      const stream = evt.streams[0] ?? new MediaStream([evt.track]);
      if (!remoteAudio.current) {
        const a = new Audio();
        a.autoplay = true;
        a.setAttribute("playsinline", "true");
        remoteAudio.current = a;
      }
      remoteAudio.current.srcObject = stream;
      remoteAudio.current.play()
        .then(() => console.log("[RTC-user] remote audio ✓"))
        .catch(() => {
          const retry = () => { remoteAudio.current?.play().catch(() => {}); document.removeEventListener("click", retry); };
          document.addEventListener("click", retry, { once: true });
        });
    };

    // Send ICE candidates to admin
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) ch.publish("webrtc-ice", { candidate: candidate.toJSON() }).catch(console.error);
    };

    pc.oniceconnectionstatechange = () => {
      console.log("[RTC-user] ICE:", pc.iceConnectionState);
      if (pc.iceConnectionState === "failed") pc.restartIce();
    };
    pc.onconnectionstatechange = () => console.log("[RTC-user] conn:", pc.connectionState);

    // Set remote description (the offer from admin)
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    console.log("[RTC-user] remote desc set");

    // Flush any ICE that arrived before the offer was processed
    for (const c of iceBufRef.current) {
      await pc.addIceCandidate(new RTCIceCandidate(c)).catch(console.error);
    }
    iceBufRef.current = [];

    // Create and send answer
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    console.log("[RTC-user] publishing webrtc-answer");
    await ch.publish("webrtc-answer", { sdp: pc.localDescription });
    console.log("[RTC-user] processOffer done");
  }, []);

  // ── Boot Ably (once) ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!walletAddress) return;
    if (bootedRef.current) return;
    bootedRef.current = true;

    const channelName = `kapogian-support:${walletAddress.toLowerCase()}`;
    const ably = new Ably.Realtime({ key: ABLY_KEY });
    ablyRef.current = ably;

    ably.connection.on("connected",    () => setConnected(true));
    ably.connection.on("disconnected", () => setConnected(false));
    ably.connection.on("failed",       () => setConnected(false));

    const ch = ably.channels.get(channelName);
    channelRef.current = ch;

    ably.channels.get("kapogian-support-inbox").publish("user-connected", { walletAddress });

    // ── Chat ─────────────────────────────────────────────────────────────
    ch.subscribe("admin-message", (msg) => {
      const m: SupportMessage = {
        id: msg.id ?? `live-admin-${Date.now()}`,
        text: msg.data.text, sender: "admin",
        timestamp: msg.data.timestamp ?? Date.now(),
      };
      if (!historyLoadedRef.current) { liveBufferRef.current.push(m); return; }
      setMessages((prev) => mergeMessage(prev, m));
      setUnread((c) => c + 1);
    });

    ch.subscribe("user-message", (msg) => {
      const m: SupportMessage = {
        id: msg.id ?? `live-user-${Date.now()}`,
        clientMsgId: msg.data.clientMsgId,
        text: msg.data.text, sender: "user",
        timestamp: msg.data.timestamp ?? Date.now(),
      };
      if (!historyLoadedRef.current) { liveBufferRef.current.push(m); return; }
      setMessages((prev) => mergeMessage(prev, m));
    });

    // ── Call signaling ────────────────────────────────────────────────────
    ch.subscribe("call-request", () => {
      console.log("[RTC-user] call-request");
      setCallState((prev) => prev.status !== "idle" ? prev : { status: "ringing" });
      if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = setTimeout(() => {
        setCallState((prev) => prev.status === "ringing" ? { status: "idle" } : prev);
        localStreamRef.current?.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
        pendingOffer.current = null;
      }, RING_TIMEOUT_MS);
    });

    ch.subscribe("call-ended", () => {
      console.log("[RTC-user] call-ended");
      if (ringTimeoutRef.current) { clearTimeout(ringTimeoutRef.current); ringTimeoutRef.current = null; }
      hangup();
      setCallState({ status: "idle" });
    });

    // Offer may arrive before OR after user taps Accept
    ch.subscribe("webrtc-offer", (msg) => {
      console.log("[RTC-user] webrtc-offer received");
      const offer = msg.data.sdp as RTCSessionDescriptionInit;
      const mic = localStreamRef.current;
      if (mic && mic.getTracks().every((t) => t.readyState === "live")) {
        // User already accepted — process now
        processOffer(ch, offer, mic).catch(console.error);
      } else {
        // Stash — will be processed when user taps Accept
        console.log("[RTC-user] stashing offer (waiting for Accept)");
        pendingOffer.current = offer;
      }
    });

    ch.subscribe("webrtc-ice", (msg) => {
      const candidate = msg.data.candidate as RTCIceCandidateInit;
      const pc = pcRef.current;
      if (!pc || !pc.remoteDescription) {
        iceBufRef.current.push(candidate);
        return;
      }
      pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
    });

    // ── History ───────────────────────────────────────────────────────────
    (async () => {
      try {
        await new Promise<void>((resolve, reject) => {
          if (ably.connection.state === "connected") return resolve();
          if (ably.connection.state === "closed" || ably.connection.state === "failed") return reject(new Error("closed"));
          ably.connection.once("connected", resolve);
          ably.connection.once("failed",    () => reject(new Error("failed")));
          ably.connection.once("closed",    () => reject(new Error("closed")));
        });
        await ch.attach();
        const page = await ch.history({ limit: 100, direction: "forwards" });
        const historical: SupportMessage[] = page.items
          .filter((m) => m.name === "user-message" || m.name === "admin-message")
          .map((m) => ({
            id: m.id ?? `hist-${Math.random()}`,
            clientMsgId: m.data.clientMsgId,
            text: m.data.text,
            sender: (m.name === "admin-message" ? "admin" : "user") as "admin" | "user",
            timestamp: m.data.timestamp ?? (m as any).timestamp ?? Date.now(),
          }))
          .sort((a, b) => a.timestamp - b.timestamp);
        setMessages(() => {
          let merged = historical;
          for (const live of liveBufferRef.current) merged = mergeMessage(merged, live);
          liveBufferRef.current = [];
          historyLoadedRef.current = true;
          return merged;
        });
      } catch {
        historyLoadedRef.current = true;
        setMessages(() => { const f = liveBufferRef.current; liveBufferRef.current = []; return f; });
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress]);

  // ── Accept call (button click → mic granted here) ─────────────────────────
  const handleAcceptCall = useCallback(async () => {
    if (ringTimeoutRef.current) { clearTimeout(ringTimeoutRef.current); ringTimeoutRef.current = null; }

    // getUserMedia MUST come from a user gesture — this is that gesture
    let mic: MediaStream;
    try {
      mic = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      console.log("[RTC-user] mic granted ✓");
    } catch {
      alert("Microphone access is required.\nPlease allow mic access in your browser settings.");
      return;
    }

    localStreamRef.current = mic;
    const startedAt = Date.now();
    setCallState({ status: "active", startedAt });
    setOpen(true);

    // Publish accepted first so admin sends the offer
    try {
      await channelRef.current?.publish("call-accepted", { timestamp: startedAt });
      console.log("[RTC-user] published call-accepted");
    } catch (e) { console.error("[RTC-user] publish call-accepted failed:", e); }

    // If offer already arrived before accept, process it now
    const ch = channelRef.current;
    if (pendingOffer.current && ch) {
      console.log("[RTC-user] processing pre-arrived offer");
      await processOffer(ch, pendingOffer.current, mic).catch(console.error);
      pendingOffer.current = null;
    }
  }, [processOffer]);

  const handleRejectCall = useCallback(async () => {
    if (ringTimeoutRef.current) { clearTimeout(ringTimeoutRef.current); ringTimeoutRef.current = null; }
    hangup();
    setCallState({ status: "idle" });
    try { await channelRef.current?.publish("call-rejected", { timestamp: Date.now() }); } catch {}
  }, [hangup]);

  const handleEndCall = useCallback(async () => {
    hangup();
    setCallState({ status: "idle" });
    try { await channelRef.current?.publish("call-ended", { from: "user", timestamp: Date.now() }); } catch {}
  }, [hangup]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || !channelRef.current || sending) return;
    setSending(true);
    const clientMsgId = `cmid-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const timestamp = Date.now();
    const optimistic: SupportMessage = { id: `optimistic-${clientMsgId}`, clientMsgId, text, sender: "user", timestamp };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    try {
      ablyRef.current?.channels.get("kapogian-support-inbox").publish("user-connected", { walletAddress });
      await channelRef.current.publish("user-message", { text, timestamp, clientMsgId, walletAddress });
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setInput(text);
    } finally { setSending(false); }
  }, [input, sending, walletAddress]);

  useEffect(() => { if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, open]);
  useEffect(() => { if (open) { setUnread(0); setTimeout(() => inputRef.current?.focus(), 100); } }, [open]);

  if (!walletAddress) return null;

  return (
    <>
      {callState.status === "ringing" && (
        <IncomingCallModal onAccept={handleAcceptCall} onReject={handleRejectCall} />
      )}

      {/* FAB */}
      <button onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-[90] w-14 h-14 bg-black text-white rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.25)] flex items-center justify-center hover:scale-105 transition-transform">
        {callState.status === "active" ? <Phone size={22} className="text-green-400 animate-pulse" /> : open ? <X size={22} /> : <MessageCircle size={22} />}
        {!open && unreadCount > 0 && callState.status === "idle" && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 border-2 border-white rounded-full text-[10px] font-black flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Drawer */}
      {open && (
        <div className="fixed bottom-24 right-6 z-[90] w-[360px] max-w-[calc(100vw-3rem)] flex flex-col bg-white border-4 border-black rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
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
                    ? <span className="text-green-400">📞 <CallTimer startedAt={callState.startedAt} /></span>
                    : connected ? "Connected · replies in real-time" : "Connecting..."}
                </p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors">
              <ChevronDown size={16} />
            </button>
          </div>

          <div className="relative flex-1 overflow-y-auto p-4 space-y-3 min-h-[280px] max-h-[380px] bg-[#fdfcfa]">
            {callState.status === "active" && (
              <ActiveCallOverlay startedAt={callState.startedAt} onEndCall={handleEndCall} />
            )}
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-10 gap-3 text-center">
                <div className="w-14 h-14 bg-slate-100 rounded-full border-2 border-slate-200 flex items-center justify-center">
                  <MessageCircle size={24} className="text-slate-300" />
                </div>
                <p className="font-black text-slate-500 text-sm uppercase tracking-tight">Send us a message</p>
                <p className="text-xs text-slate-400 font-semibold">We'll respond as soon as possible</p>
              </div>
            ) : messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm font-semibold leading-snug ${msg.sender === "user" ? "bg-black text-white rounded-br-sm" : "bg-white border-2 border-slate-200 text-slate-800 rounded-bl-sm"}`}>
                  {msg.sender === "admin" && <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Kapogian Admin</p>}
                  <p>{msg.text}</p>
                  <p className={`text-[9px] mt-1 font-mono ${msg.sender === "user" ? "text-white/40 text-right" : "text-slate-400"}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="flex gap-2 p-3 border-t-2 border-slate-100 bg-white flex-shrink-0">
            <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Type your concern..." maxLength={500}
              className="flex-1 h-10 rounded-2xl border-2 border-slate-200 px-4 text-sm font-semibold outline-none focus:border-black transition-colors bg-slate-50" />
            <button onClick={handleSend} disabled={!input.trim() || sending || !connected}
              className="w-10 h-10 rounded-2xl bg-black text-white border-2 border-black flex items-center justify-center disabled:opacity-40 hover:bg-slate-800 transition-colors flex-shrink-0">
              {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>
        </div>
      )}
    </>
  );
}