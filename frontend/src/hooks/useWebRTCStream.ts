// frontend/src/hooks/useWebRTCStream.ts
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useWebRTCStream = (streamId: string | undefined, streamerId: number | undefined) => {
  const { user } = useAuth();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveViewers, setLiveViewers] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const ws = useRef<WebSocket | null>(null);
  const peerConnections = useRef<Map<number, RTCPeerConnection>>(new Map());
  
  // Keep a ref of localStream so the websocket callbacks always have the newest stream 
  // without needing to be re-created on stream change.
  const localStreamRef = useRef<MediaStream | null>(null);

  const isStreamer = Boolean(user?.id) && Boolean(streamerId) && user?.id === streamerId;

  useEffect(() => {
    localStreamRef.current = localStream;
    
    // Auto-attach new stream tracks to any existing peer connections
    if (localStream && isStreamer) {
      peerConnections.current.forEach(async (pc, peerId) => {
        // Find existing senders and either replace track or add new one
        const senders = pc.getSenders();
        let needsNegotiation = false;
        localStream.getTracks().forEach((track) => {
          const existingSender = senders.find(s => s.track?.kind === track.kind);
          if (existingSender) {
            existingSender.replaceTrack(track);
          } else {
            pc.addTrack(track, localStream);
            needsNegotiation = true;
          }
        });

        if (needsNegotiation) {
            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                ws.current?.send(JSON.stringify({
                    type: 'webrtc_offer',
                    payload: { targetUserId: peerId, offer }
                }));
            } catch (err) {
                console.error("Streamer renegotiation error:", err);
            }
        }
      });
    }
  }, [localStream, isStreamer]);

  // Cleanup function
  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    peerConnections.current.forEach(pc => pc.close());
    peerConnections.current.clear();
    if (ws.current) {
        ws.current.close();
        ws.current = null;
    }
  };

  useEffect(() => {
    if (!streamId || !user || !streamerId) return;

    // Connect WebSocket for signaling
    const token = localStorage.getItem('access_token');
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:5001';
    
    if (!ws.current) {
      ws.current = new WebSocket(wsUrl);
    }

    const currentWs = ws.current;

    currentWs.onopen = () => {
      currentWs.send(JSON.stringify({
        type: 'join_stream',
        payload: { streamId, token }
      }));
      
      if (!isStreamer) {
        // If Viewer, broadcast join so streamer creates Offer
        setTimeout(() => {
            currentWs.send(JSON.stringify({
                type: 'webrtc_viewer_join',
                payload: { targetUserId: streamerId }
            }));
        }, 1000); // Tiny delay to ensure join is registered
      }
    };

    currentWs.onmessage = async (event) => {
        try {
            const data = JSON.parse(event.data);
            const { type, payload } = data;

            // STREAMER logic: A new viewer joined -> Create PeerConnection & Offer
            if (isStreamer && type === 'webrtc_viewer_join') {
                const viewerId = payload.senderId;
                const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
                peerConnections.current.set(viewerId, pc);

                if (localStreamRef.current) {
                    localStreamRef.current.getTracks().forEach(track => {
                        pc.addTrack(track, localStreamRef.current!);
                    });
                }

                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        currentWs.send(JSON.stringify({
                            type: 'webrtc_ice_candidate',
                            payload: { targetUserId: viewerId, candidate: event.candidate }
                        }));
                    }
                };

                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                currentWs.send(JSON.stringify({
                    type: 'webrtc_offer',
                    payload: { targetUserId: viewerId, offer }
                }));
            }

            // VIEWER logic: Receive offer -> Set Remote, Create Answer
            if (!isStreamer && type === 'webrtc_offer') {
                const streamerPeerId = payload.senderId;
                let pc = peerConnections.current.get(streamerPeerId);
                
                if (!pc) {
                    pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
                    peerConnections.current.set(streamerPeerId, pc);

                    pc.ontrack = (event) => {
                        if (event.streams && event.streams[0]) {
                            setRemoteStream(event.streams[0]);
                            if (videoRef.current) {
                                videoRef.current.srcObject = event.streams[0];
                            }
                        }
                    };

                    pc.onicecandidate = (event) => {
                        if (event.candidate) {
                            currentWs.send(JSON.stringify({
                                type: 'webrtc_ice_candidate',
                                payload: { targetUserId: streamerPeerId, candidate: event.candidate }
                            }));
                        }
                    };
                }

                await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                currentWs.send(JSON.stringify({
                    type: 'webrtc_answer',
                    payload: { targetUserId: streamerPeerId, answer }
                }));
            }

            // STREAMER logic: Receive answer
            if (isStreamer && type === 'webrtc_answer') {
                const pc = peerConnections.current.get(payload.senderId);
                if (pc) {
                    await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
                }
            }

            // BOTH: Receive ICE candidate
            if (type === 'webrtc_ice_candidate') {
                const pc = peerConnections.current.get(payload.senderId);
                if (pc && payload.candidate) {
                    await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
                }
            }

            // VIEWER/STREAMER: Real-time active connection tracking
            if (type === 'viewer_count_update') {
                setLiveViewers(payload.liveViewers);
            }

        } catch (err) {
            console.error('WebSocket message parsing/handling error:', err);
        }
    };

    return () => {
        // DO NOT close websocket here, to avoid kicking people off on component re-renders
        // We will only cleanup when component unmounts
    };
  }, [streamId, user?.id, streamerId, isStreamer]);

  // Actual cleanup on full unmount
  useEffect(() => {
    return () => cleanup();
  }, []);

  const startCamera = async () => {
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(media);
      setIsCameraOn(true);
      if (videoRef.current) {
        videoRef.current.srcObject = media;
      }
    } catch (err) {
      console.error(err);
      setError('Could not access camera/microphone.');
    }
  };

  const stopCamera = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      setLocalStream(null);
      setIsCameraOn(false);
    }
  };

  return { videoRef, startCamera, stopCamera, isCameraOn, isStreamer, error, localStream, remoteStream, liveViewers };
};
