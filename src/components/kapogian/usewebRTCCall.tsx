"use client";

import { useRef, useCallback } from "react";
import type * as Ably from "ably";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "turn:openrelay.metered.ca:80",                username: "openrelayproject", credential: "openrelayproject" },
  { urls: "turn:openrelay.metered.ca:443",               username: "openrelayproject", credential: "openrelayproject" },
  { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" },
];

const log = (...a: unknown[]) => console.log("[WebRTC]", ...a);
const err = (...a: unknown[]) => console.error("[WebRTC]", ...a);

export interface WebRTCCallHook {
  /** Admin: pre-warm mic during button click, then send offer after call-accepted */
  startAsOfferer:     (channel: Ably.RealtimeChannel) => Promise<void>;
  /** User: pre-warm mic on call-request (background, best-effort) */
  startAsAnswerer:    (channel: Ably.RealtimeChannel) => Promise<void>;
  /** User: build PC and send answer when offer arrives */
  handleOffer:        (channel: Ably.RealtimeChannel, offer: RTCSessionDescriptionInit) => Promise<void>;
  /** Admin: set remote description when answer arrives */
  handleAnswer:       (answer: RTCSessionDescriptionInit) => Promise<void>;
  /** Both: add ICE candidate (buffered if remote not set yet) */
  handleIceCandidate: (candidate: RTCIceCandidateInit) => Promise<void>;
  /** Inject a stream from outside (e.g. from Accept button click) */
  setLocalStream:     (stream: MediaStream) => void;
  /** Tear down everything */
  hangup:             () => void;
}

export function useWebRTCCall(): WebRTCCallHook {
  const pcRef          = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const iceBufRef      = useRef<RTCIceCandidateInit[]>([]);

  // ── setLocalStream ───────────────────────────────────────────────────────
  // Called from UserMessageDrawer's Accept button click so the stream is set
  // in the hook's ref BEFORE the offer arrives via Ably.
  const setLocalStream = useCallback((stream: MediaStream) => {
    log("setLocalStream: storing stream from outside");
    localStreamRef.current = stream;
  }, []);

  // ── cleanup ───────────────────────────────────────────────────────────────
  const hangup = useCallback(() => {
    log("hangup / cleanup");
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    if (remoteAudioRef.current) { remoteAudioRef.current.srcObject = null; remoteAudioRef.current = null; }
    iceBufRef.current = [];
  }, []);

  // ── getMic ────────────────────────────────────────────────────────────────
  const getMic = useCallback(async (): Promise<MediaStream> => {
    log("getUserMedia...");
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      video: false,
    });
    log("mic granted:", stream.getTracks().map(t => t.label));
    return stream;
  }, []);

  // ── wireRemoteAudio ───────────────────────────────────────────────────────
  const wireRemoteAudio = useCallback((pc: RTCPeerConnection) => {
    pc.ontrack = (evt) => {
      log("remote track:", evt.track.kind);
      const stream = evt.streams[0] ?? new MediaStream([evt.track]);
      if (!remoteAudioRef.current) {
        const audio = new Audio();
        audio.autoplay = true;
        audio.setAttribute("playsinline", "true");
        remoteAudioRef.current = audio;
      }
      remoteAudioRef.current.srcObject = stream;
      remoteAudioRef.current.play()
        .then(() => log("remote audio playing ✓"))
        .catch(e => {
          err("audio.play() blocked:", e);
          const retry = () => { remoteAudioRef.current?.play().catch(() => {}); document.removeEventListener("click", retry); };
          document.addEventListener("click", retry, { once: true });
        });
    };
  }, []);

  // ── wireDiag ──────────────────────────────────────────────────────────────
  const wireDiag = useCallback((pc: RTCPeerConnection, role: string) => {
    pc.oniceconnectionstatechange = () => {
      log(`[${role}] ICE:`, pc.iceConnectionState);
      if (pc.iceConnectionState === "failed") { log("restartIce"); pc.restartIce(); }
    };
    pc.onconnectionstatechange   = () => log(`[${role}] conn:`, pc.connectionState);
    pc.onsignalingstatechange    = () => log(`[${role}] sig:`,  pc.signalingState);
    pc.onicegatheringstatechange = () => log(`[${role}] gather:`, pc.iceGatheringState);
  }, []);

  // ── OFFERER (admin side) ──────────────────────────────────────────────────
  // AdminMessagesTab uses its own inline startCall() so this hook method
  // is not called from admin — but it's here for completeness / future use.
  const startAsOfferer = useCallback(async (channel: Ably.RealtimeChannel) => {
    log("startAsOfferer");
    let stream = localStreamRef.current;
    if (!stream || stream.getTracks().some(t => t.readyState !== "live")) {
      stream = await getMic();
      localStreamRef.current = stream;
    }
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    iceBufRef.current = [];
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;
    stream.getTracks().forEach(t => pc.addTrack(t, stream!));
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) channel.publish("webrtc-ice", { candidate: candidate.toJSON() }).catch(err);
    };
    wireRemoteAudio(pc);
    wireDiag(pc, "offerer");
    const offer = await pc.createOffer({ offerToReceiveAudio: true });
    await pc.setLocalDescription(offer);
    log("publishing offer");
    await channel.publish("webrtc-offer", { sdp: pc.localDescription });
  }, [getMic, wireRemoteAudio, wireDiag]);

  // ── ANSWERER pre-warm (user side — called on call-request event) ──────────
  // Best-effort: grabs mic permission early so handleOffer has it ready.
  // Even if this fails, handleAcceptCall will try again via setLocalStream.
  const startAsAnswerer = useCallback(async (_ch: Ably.RealtimeChannel) => {
    log("startAsAnswerer: pre-warming mic");
    if (localStreamRef.current?.getTracks().every(t => t.readyState === "live")) {
      log("mic already live, skip");
      return;
    }
    try {
      localStreamRef.current = await getMic();
      log("mic pre-warmed ✓");
    } catch (e) {
      err("pre-warm failed (non-fatal):", e);
      // handleAcceptCall will call setLocalStream() from a user-gesture context
    }
  }, [getMic]);

  // ── handleOffer (user side — called when webrtc-offer arrives) ────────────
  const handleOffer = useCallback(async (
    channel: Ably.RealtimeChannel,
    offer: RTCSessionDescriptionInit,
  ) => {
    log("handleOffer");

    // Get the best available stream:
    // 1. localStreamRef (set by startAsAnswerer OR by setLocalStream from Accept button)
    // 2. Last resort: request fresh (may be denied if not in user gesture)
    let stream = localStreamRef.current;
    if (!stream || stream.getTracks().some(t => t.readyState !== "live")) {
      log("handleOffer: no pre-warmed stream — last-resort getUserMedia");
      try {
        stream = await getMic();
        localStreamRef.current = stream;
      } catch (e) {
        err("handleOffer: getMic failed — call will have no audio:", e);
        // Create a silent stream so the PC still connects (video-less call)
        const ctx = new AudioContext();
        const dest = ctx.createMediaStreamDestination();
        stream = dest.stream;
      }
    } else {
      log("handleOffer: reusing pre-warmed stream ✓");
    }

    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    iceBufRef.current = [];

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    stream.getTracks().forEach(t => { log("adding track:", t.kind); pc.addTrack(t, stream!); });
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) channel.publish("webrtc-ice", { candidate: candidate.toJSON() }).catch(err);
    };
    wireRemoteAudio(pc);
    wireDiag(pc, "answerer");

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    log("remote desc set");

    // Flush buffered ICE candidates
    for (const c of iceBufRef.current) {
      await pc.addIceCandidate(new RTCIceCandidate(c)).catch(err);
    }
    iceBufRef.current = [];

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    log("publishing answer");
    await channel.publish("webrtc-answer", { sdp: pc.localDescription });
    log("handleOffer complete ✓");
  }, [getMic, wireRemoteAudio, wireDiag]);

  // ── handleAnswer (admin side — called when webrtc-answer arrives) ─────────
  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    const pc = pcRef.current;
    if (!pc) { err("handleAnswer: no PC"); return; }
    if (pc.signalingState !== "have-local-offer") { err("handleAnswer: wrong state:", pc.signalingState); return; }
    log("handleAnswer: setting remote desc");
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
    for (const c of iceBufRef.current) await pc.addIceCandidate(new RTCIceCandidate(c)).catch(err);
    iceBufRef.current = [];
    log("handleAnswer complete ✓");
  }, []);

  // ── handleIceCandidate ────────────────────────────────────────────────────
  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    const pc = pcRef.current;
    if (!pc?.remoteDescription) {
      log("buffering ICE candidate");
      iceBufRef.current.push(candidate);
      return;
    }
    await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(err);
  }, []);

  return { startAsOfferer, startAsAnswerer, handleOffer, handleAnswer, handleIceCandidate, setLocalStream, hangup };
}