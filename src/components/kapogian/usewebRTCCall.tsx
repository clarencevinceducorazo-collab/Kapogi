"use client";

import { useRef, useCallback } from "react";
import type * as Ably from "ably";

// Google STUN + a free TURN fallback so NAT traversal works on most networks
const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  // Open Relay TURN — free, no sign-up required
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
];

export interface WebRTCCallHook {
  /** Call as the OFFERER (admin). Gets mic, creates offer, publishes it. */
  startAsOfferer: (channel: Ably.RealtimeChannel) => Promise<void>;
  /** Call as the ANSWERER (user). Gets mic, waits for offer, sends answer. */
  startAsAnswerer: (channel: Ably.RealtimeChannel) => Promise<void>;
  /** Handle an incoming webrtc-offer (answerer side) */
  handleOffer: (channel: Ably.RealtimeChannel, offer: RTCSessionDescriptionInit) => Promise<void>;
  /** Handle an incoming webrtc-answer (offerer side) */
  handleAnswer: (answer: RTCSessionDescriptionInit) => Promise<void>;
  /** Handle an incoming ICE candidate from the remote peer */
  handleIceCandidate: (candidate: RTCIceCandidateInit) => Promise<void>;
  /** Tear down the peer connection and release the mic */
  hangup: () => void;
}

export function useWebRTCCall(): WebRTCCallHook {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  // Buffer ICE candidates that arrive before remoteDescription is set
  const iceCandidateBufferRef = useRef<RTCIceCandidateInit[]>([]);

  const cleanup = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current = null;
    }
    iceCandidateBufferRef.current = [];
  }, []);

  /** Create RTCPeerConnection, attach local stream, wire up ICE and remote audio */
  const createPC = useCallback(
    async (channel: Ably.RealtimeChannel): Promise<RTCPeerConnection> => {
      // Clean up any previous connection first
      cleanup();

      // Request microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcRef.current = pc;

      // Add local audio tracks
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Send ICE candidates to remote peer via Ably
      pc.onicecandidate = ({ candidate }) => {
        if (candidate) {
          channel.publish("webrtc-ice", { candidate: candidate.toJSON() }).catch(() => {});
        }
      };

      // Play remote audio when tracks arrive
      pc.ontrack = (event) => {
        if (!remoteAudioRef.current) {
          const audio = new Audio();
          audio.autoplay = true;
          remoteAudioRef.current = audio;
        }
        remoteAudioRef.current.srcObject = event.streams[0];
        remoteAudioRef.current.play().catch(() => {});
      };

      return pc;
    },
    [cleanup],
  );

  /** OFFERER (admin): get mic → create offer → publish */
  const startAsOfferer = useCallback(
    async (channel: Ably.RealtimeChannel) => {
      const pc = await createPC(channel);
      const offer = await pc.createOffer({ offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);
      await channel.publish("webrtc-offer", { sdp: pc.localDescription });
    },
    [createPC],
  );

  /** ANSWERER (user): just set up the PC — offer will arrive via handleOffer */
  const startAsAnswerer = useCallback(
    async (channel: Ably.RealtimeChannel) => {
      await createPC(channel);
    },
    [createPC],
  );

  /** ANSWERER receives the offer → set remote desc → create answer → publish */
  const handleOffer = useCallback(
    async (channel: Ably.RealtimeChannel, offer: RTCSessionDescriptionInit) => {
      const pc = pcRef.current;
      if (!pc) return;

      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Flush buffered ICE candidates
      for (const c of iceCandidateBufferRef.current) {
        await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
      }
      iceCandidateBufferRef.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await channel.publish("webrtc-answer", { sdp: pc.localDescription });
    },
    [],
  );

  /** OFFERER receives the answer → set remote desc */
  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    const pc = pcRef.current;
    if (!pc) return;
    await pc.setRemoteDescription(new RTCSessionDescription(answer));

    // Flush buffered ICE candidates
    for (const c of iceCandidateBufferRef.current) {
      await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
    }
    iceCandidateBufferRef.current = [];
  }, []);

  /** Both sides call this when a webrtc-ice message arrives */
  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    const pc = pcRef.current;
    if (!pc) return;

    if (!pc.remoteDescription) {
      // Buffer until remoteDescription is set
      iceCandidateBufferRef.current.push(candidate);
      return;
    }
    await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
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