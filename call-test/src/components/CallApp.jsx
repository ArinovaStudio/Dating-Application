import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const SERVER_URL = "http://localhost:3000";

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ],
};

const styles = {
  container: { fontFamily: "'Segoe UI', Roboto, sans-serif", backgroundColor: '#121212', color: '#e0e0e0', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#1e1e1e', padding: '2rem', borderRadius: '12px', boxShadow: '0 8px 16px rgba(0,0,0,0.5)', width: '100%', maxWidth: '400px', textAlign: 'center' },
  input: { width: '100%', padding: '12px', marginBottom: '1rem', borderRadius: '6px', border: '1px solid #333', backgroundColor: '#2c2c2c', color: '#fff', fontSize: '1rem', boxSizing: 'border-box' },
  button: { width: '100%', padding: '12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' },
  primaryBtn: { backgroundColor: '#3b82f6', color: '#fff' },
  successBtn: { backgroundColor: '#10b981', color: '#fff' },
  dangerBtn: { backgroundColor: '#ef4444', color: '#fff' },
  statusBadge: { display: 'inline-block', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', marginBottom: '1rem', backgroundColor: '#333' },
  logBox: { marginTop: '1rem', backgroundColor: '#000', padding: '10px', borderRadius: '6px', height: '150px', overflowY: 'auto', fontSize: '0.8rem', textAlign: 'left', fontFamily: 'monospace', color: '#00ff00' },
  avatar: { width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#333', margin: '0 auto 1rem auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }
};

const CallApp = () => {
  const [step, setStep] = useState('login');
  const [userId, setUserId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [socket, setSocket] = useState(null);
  const [callStatus, setCallStatus] = useState('idle'); 
  const [incomingCall, setIncomingCall] = useState(null);
  const [currentCallId, setCurrentCallId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [timer, setTimer] = useState(0);

  const targetIdRef = useRef('');
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const timerRef = useRef(null);

  const addLog = (msg) => setLogs(prev => [`> ${msg}`, ...prev]);

  useEffect(() => {
    targetIdRef.current = targetId;
  }, [targetId]);

  const connectSocket = () => {
    if (!userId.trim()) return alert("Enter User ID");
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      addLog('Connected to server.');
      newSocket.emit('register_user', userId); 
      setStep('dashboard');
    });

    newSocket.on('incoming_call', (data) => {
      addLog(`Incoming call: ${data.callId}`);
      setIncomingCall(data);
      setCurrentCallId(data.callId);
      setCallStatus('ringing');
    });

    newSocket.on('call_accepted', async ({ callId }) => {
      addLog('Call Accepted.');
      setCallStatus('connected');
      setCurrentCallId(callId);
      startTimer();
      await startWebRTC(newSocket, targetIdRef.current, true); 
    });

    newSocket.on('call_rejected', (data) => {
      addLog(`Rejected: ${data.message}`);
      resetCallState();
    });

    newSocket.on('call_ended', (data) => {
      addLog(`Ended: ${data.message || 'Remote hung up'}`);
      resetCallState();
    });

    newSocket.on('call_missed', () => {
      addLog('Missed Call');
      resetCallState();
    });

    newSocket.on('call_error', (data) => {
      addLog(`Error: ${data.message}`);
      resetCallState();
    });

    newSocket.on('webrtc_offer', async (data) => await handleOffer(newSocket, data));
    newSocket.on('webrtc_answer', async (data) => await handleAnswer(data));
    newSocket.on('webrtc_ice_candidate', async (data) => await handleIceCandidate(data));
  };

  const setupPeerConnection = async (sock, remoteId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = pc;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.onicecandidate = (e) => {
        if (e.candidate) sock.emit('webrtc_ice_candidate', { targetUserId: remoteId, candidate: e.candidate });
      };

      pc.ontrack = (e) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = e.streams[0];
          remoteAudioRef.current.play().catch(err => console.error(err));
        }
      };
      return pc;
    } catch (err) {
      addLog(`Mic Error: ${err.message}`);
      return null;
    }
  };

  const startWebRTC = async (sock, remoteId, isInitiator) => {
    const pc = await setupPeerConnection(sock, remoteId);
    if (!pc) return;
    if (isInitiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sock.emit('webrtc_offer', { targetUserId: remoteId, offer });
    }
  };

  const handleOffer = async (sock, data) => {
    setCallStatus('connected'); 
    setTargetId(data.senderId); 
    targetIdRef.current = data.senderId;
    startTimer();
    const pc = await setupPeerConnection(sock, data.senderId);
    if (!pc) return;
    await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    sock.emit('webrtc_answer', { targetUserId: data.senderId, answer });
  };

  const handleAnswer = async (data) => {
    if (peerConnectionRef.current) await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
  };

  const handleIceCandidate = async (data) => {
    if (peerConnectionRef.current && data.candidate) await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
  };

  const resetCallState = () => {
    if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
    if (peerConnectionRef.current) peerConnectionRef.current.close();
    localStreamRef.current = null;
    peerConnectionRef.current = null;
    setCallStatus('idle');
    setIncomingCall(null);
    setCurrentCallId(null);
    stopTimer();
  };

  const startTimer = () => {
    setTimer(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setTimer(p => p + 1), 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimer(0);
  };

  const handleStartCall = () => {
    if (!targetId) return alert("Enter Target ID");
    setCallStatus('dialing');
    socket.emit('start_call', { targetUserId: targetId, type: 'AUDIO' });
  };

  const handleAccept = () => {
    const callerId = incomingCall.callerId;
    setCallStatus('connected');
    setTargetId(callerId);
    targetIdRef.current = callerId;
    startTimer();
    socket.emit('accept_call', { callId: currentCallId, callerId });
  };

  const handleReject = () => {
    socket.emit('reject_call', { callId: currentCallId, callerId: incomingCall.callerId });
    resetCallState();
  };

  const handleEndCall = () => {
    const target = incomingCall ? incomingCall.callerId : targetIdRef.current;
    socket.emit('end_call', { callId: currentCallId, targetUserId: target });
    resetCallState();
  };

  return (
    <div style={styles.container}>
      <audio ref={remoteAudioRef} autoPlay playsInline />
      {step === 'login' ? (
        <div style={styles.card}>
          <input style={styles.input} placeholder="My ID" value={userId} onChange={e => setUserId(e.target.value)} />
          <button style={{ ...styles.button, ...styles.primaryBtn }} onClick={connectSocket}>Login</button>
        </div>
      ) : (
        <div style={styles.card}>
          <div style={styles.statusBadge}>Online: {userId}</div>
          {callStatus === 'idle' && (
            <><input style={styles.input} placeholder="Target ID" value={targetId} onChange={e => setTargetId(e.target.value)} />
            <button style={{ ...styles.button, ...styles.successBtn }} onClick={handleStartCall}>Call</button></>
          )}
          {callStatus === 'dialing' && (
            <div style={{ padding: '20px 0' }}><h3>Calling {targetId}...</h3><button style={{ ...styles.button, ...styles.dangerBtn }} onClick={handleEndCall}>Cancel</button></div>
          )}
          {callStatus === 'ringing' && (
            <div style={{ padding: '20px 0' }}><h3>Incoming Call</h3><div style={{ display: 'flex', gap: '10px' }}>
              <button style={{ ...styles.button, ...styles.successBtn }} onClick={handleAccept}>Accept</button>
              <button style={{ ...styles.button, ...styles.dangerBtn }} onClick={handleReject}>Reject</button>
            </div></div>
          )}
          {callStatus === 'connected' && (
            <div style={{ padding: '20px 0' }}><h3>Connected</h3><h1>{Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}</h1><button style={{ ...styles.button, ...styles.dangerBtn }} onClick={handleEndCall}>End Call</button></div>
          )}
          <div style={styles.logBox}>{logs.map((l, i) => <div key={i}>{l}</div>)}</div>
        </div>
      )}
    </div>
  );
};

export default CallApp;