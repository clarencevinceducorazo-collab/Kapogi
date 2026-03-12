"use client";

import { useRef, useCallback } from "react";
import type * as Ably from "ably";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  {
    urls: "turn:openrelay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443?transport=tcp",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

const log = (...args: unknown[]) => console.log("[WebRTC]", ...args);
const err = (...args: unknown[]) => console.error("[WebRTC]", ...args);

export interface WebRTCCallHook {
  startAsOfferer: (channel: Ably.RealtimeChannel) => Promise<void>;
  startAsAnswerer: (channel: Ably.RealtimeChannel) => Promise<void>;
  handleOffer: (channel: Ably.RealtimeChannel, offer: RTCSessionDescriptionInit) => Promise<void>;
  handleAnswer: (answer: RTCSessionDescriptionInit) => Promise<void>;
  handleIceCandidate: (candidate: RTCIceCandidateInit) => Promise<void>;
  hangup: () => void;
}

export function useWebRTCCall(): WebRTCCallHook {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const iceCandidateBufferRef = useRef<RTCIceCandidateInit[]>([]);
  const channelRef = useRef<Ably.RealtimeChannel | null>(null);

  const cleanup = useCallback(() => {
    log("cleanup called");
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current = null;
    }
    iceCandidateBufferRef.current = [];
    channelRef.current = null;
  }, []);

  const getMic = useCallback(async (): Promise<MediaStream> => {
    log("requesting microphone...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      log("microphone granted, tracks:", stream.getTracks().map((t) => t.label));
      return stream;
    } catch (e) {
      err("microphone denied or unavailable:", e);
      throw e;
    }
  }, []);

  const wireRemoteAudio = useCallback((pc: RTCPeerConnection) => {
    pc.ontrack = (event) => {
      log("received remote track:", event.track.kind, "streams:", event.streams.length);
      const remoteStream = event.streams[0] ?? new MediaStream([event.track]);

      if (!remoteAudioRef.current) {
        const audio = new Audio();
        audio.autoplay = true;
        audio.setAttribute("playsinline", "true");
        remoteAudioRef.current = audio;
      }
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play()
        .then(() => log("remote audio playing ✓"))
        .catch((e) => {
          err("audio.play() failed (autoplay policy?):", e);
          // Retry on next user tap
          const retry = () => {
            remoteAudioRef.current?.play().catch(() => {});
            document.removeEventListener("click", retry);
          };
          document.addEventListener("click", retry, { once: true });
        });
    };
  }, []);

  const wireDiagnostics = useCallback((pc: RTCPeerConnection, role: string) => {
    pc.onicegatheringstatechange = () =>
      log(`[${role}] ICE gathering:`, pc.iceGatheringState);
    pc.oniceconnectionstatechange = () => {
      log(`[${role}] ICE connection:`, pc.iceConnectionState);
      if (pc.iceConnectionState === "failed") {
        log(`[${role}] ICE failed — restarting`);
        pc.restartIce();
      }
    };
    pc.onconnectionstatechange = () =>
      log(`[${role}] connection state:`, pc.connectionState);
    pc.onsignalingstatechange = () =>
      log(`[${role}] signaling state:`, pc.signalingState);
  }, []);

  // ── OFFERER (admin) ────────────────────────────────────────────────────────
  const startAsOfferer = useCallback(
    async (channel: Ably.RealtimeChannel) => {
      log("startAsOfferer: creating PC");
      cleanup();
      channelRef.current = channel;

      const stream = await getMic();
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcRef.current = pc;

      stream.getTracks().forEach((t) => {
        log("offerer adding track:", t.kind);
        pc.addTrack(t, stream);
      });

      pc.onicecandidate = ({ candidate }) => {
        if (candidate) channel.publish("webrtc-ice", { candidate: candidate.toJSON() }).catch(err);
        else log("offerer ICE gathering complete");
      };

      wireRemoteAudio(pc);
      wireDiagnostics(pc, "offerer");

      const offer = await pc.createOffer({ offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);
      log("offerer: publishing webrtc-offer");
      await channel.publish("webrtc-offer", { sdp: pc.localDescription });
    },
    [cleanup, getMic, wireRemoteAudio, wireDiagnostics],
  );

  // ── ANSWERER (user) — pre-warm mic on call-request ─────────────────────────
  // Only grabs mic permission. The actual PC is built in handleOffer
  // so we have the offer SDP available when we create the answer.
  const startAsAnswerer = useCallback(
    async (_channel: Ably.RealtimeChannel) => {
      log("startAsAnswerer: pre-warming mic");
      // Don't re-request if already have a live stream
      if (localStreamRef.current?.getTracks().every((t) => t.readyState === "live")) {
        log("mic already live, skipping");
        return;
      }
      try {
        const stream = await getMic();
        localStreamRef.current = stream;
      } catch (e) {
        err("startAsAnswerer mic failed:", e);
      }
    },
    [getMic],
  );

  // ── Handle offer (answerer side) ───────────────────────────────────────────
  const handleOffer = useCallback(
    async (channel: Ably.RealtimeChannel, offer: RTCSessionDescriptionInit) => {
      log("handleOffer: building answerer PC");
      channelRef.current = channel;

      // Close old PC but keep the pre-warmed stream
      if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }

      // Use pre-warmed stream or get a fresh one
      let stream = localStreamRef.current;
      if (!stream || stream.getTracks().some((t) => t.readyState !== "live")) {
        log("handleOffer: no live stream, requesting mic");
        stream = await getMic();
        localStreamRef.current = stream;
      }

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcRef.current = pc;

      stream.getTracks().forEach((t) => {
        log("answerer adding track:", t.kind);
        pc.addTrack(t, stream!);
      });

      pc.onicecandidate = ({ candidate }) => {
        if (candidate) channel.publish("webrtc-ice", { candidate: candidate.toJSON() }).catch(err);
        else log("answerer ICE gathering complete");
      };

      wireRemoteAudio(pc);
      wireDiagnostics(pc, "answerer");

      // Set remote (offer) first
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      log("answerer: remote description set");

      // Flush any ICE candidates that arrived before the offer
      for (const c of iceCandidateBufferRef.current) {
        log("flushing early ICE candidate");
        await pc.addIceCandidate(new RTCIceCandidate(c)).catch(err);
      }
      iceCandidateBufferRef.current = [];

      // Create and send answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      log("answerer: publishing webrtc-answer");
      await channel.publish("webrtc-answer", { sdp: pc.localDescription });
    },
    [getMic, wireRemoteAudio, wireDiagnostics],
  );

  // ── Handle answer (offerer side) ───────────────────────────────────────────
  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    const pc = pcRef.current;
    if (!pc) { err("handleAnswer: no PC found"); return; }
    if (pc.signalingState !== "have-local-offer") {
      err("handleAnswer: wrong signaling state:", pc.signalingState);
      return;
    }
    log("handleAnswer: setting remote description");
    await pc.setRemoteDescription(new RTCSessionDescription(answer));

    for (const c of iceCandidateBufferRef.current) {
      await pc.addIceCandidate(new RTCIceCandidate(c)).catch(err);
    }
    iceCandidateBufferRef.current = [];
    log("handleAnswer: done");
  }, []);

  // ── Handle ICE candidate ───────────────────────────────────────────────────
  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    const pc = pcRef.current;
    if (!pc || !pc.remoteDescription) {
      log("handleIceCandidate: buffering (not ready yet)");
      iceCandidateBufferRef.current.push(candidate);
      return;
    }
    await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(err);
  }, []);

  return {
    startAsOfferer,
    startAsAnswerer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    hangup: cleanup,
  };
}