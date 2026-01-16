import { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, User, Video, Mic, MicOff, VideoOff, X } from 'lucide-react';
import webrtcService from '../services/webrtc';
import callsService from '../services/callsService';

export default function IncomingCallModal({ 
  call, 
  socket, 
  onClose, 
  onAnswer, 
  onReject 
}) {
  const [callState, setCallState] = useState('ringing'); // ringing, connecting, connected, ended
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [error, setError] = useState(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const durationInterval = useRef(null);
  const ringtoneRef = useRef(null);

  useEffect(() => {
    // Tocar som de chamada
    playRingtone();

    // Configurar WebRTC
    if (socket) {
      webrtcService.init(socket);
      
      webrtcService.onRemoteStream = (stream) => {
        console.log('Stream remoto recebido');
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      };

      webrtcService.onConnectionStateChange = (state) => {
        console.log('Estado da conexão:', state);
        if (state === 'connected') {
          setCallState('connected');
          startDurationTimer();
        } else if (state === 'disconnected' || state === 'failed') {
          handleCallEnded();
        }
      };
    }

    // Listeners do socket
    if (socket) {
      socket.on('call_ended', handleCallEnded);
      socket.on('webrtc_offer', handleWebRTCOffer);
    }

    return () => {
      cleanup();
    };
  }, []);

  const playRingtone = () => {
    try {
      // Criar um som de toque simples usando Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      const playTone = () => {
        if (callState !== 'ringing') return;
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 440;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      };

      // Tocar a cada 2 segundos
      playTone();
      ringtoneRef.current = setInterval(playTone, 2000);
    } catch (error) {
      console.warn('Não foi possível tocar o toque:', error);
    }
  };

  const stopRingtone = () => {
    if (ringtoneRef.current) {
      clearInterval(ringtoneRef.current);
      ringtoneRef.current = null;
    }
  };

  const handleAnswer = async () => {
    try {
      stopRingtone();
      setCallState('connecting');

      // Obter mídia local
      try {
        const localStream = await webrtcService.getLocalStream(true, true);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }
      } catch (mediaError) {
        console.warn('Não foi possível acessar câmera/microfone:', mediaError);
        setError('Não foi possível acessar câmera ou microfone');
      }

      // Criar peer connection
      webrtcService.createPeerConnection();
      webrtcService.callId = call.callId;

      // Entrar na sala da chamada
      webrtcService.joinCall(call.callId);

      // Notificar via socket que atendeu
      socket.emit('answer_call', { callId: call.callId });

      // Chamar API REST também
      try {
        await callsService.answerCall(call.callId);
      } catch (err) {
        console.warn('Erro ao atender via API:', err);
      }

      if (onAnswer) onAnswer(call);
    } catch (error) {
      console.error('Erro ao atender chamada:', error);
      setError('Erro ao atender chamada');
    }
  };

  const handleReject = async () => {
    try {
      stopRingtone();
      
      // Notificar via socket
      socket.emit('reject_call', { callId: call.callId });

      // Chamar API REST
      try {
        await callsService.rejectCall(call.callId);
      } catch (err) {
        console.warn('Erro ao rejeitar via API:', err);
      }

      if (onReject) onReject(call);
      onClose();
    } catch (error) {
      console.error('Erro ao rejeitar chamada:', error);
      onClose();
    }
  };

  const handleEndCall = async () => {
    try {
      // Notificar via socket
      socket.emit('end_call', { callId: call.callId });

      // Chamar API REST
      try {
        await callsService.endCall(call.callId);
      } catch (err) {
        console.warn('Erro ao encerrar via API:', err);
      }
    } catch (error) {
      console.error('Erro ao encerrar chamada:', error);
    } finally {
      cleanup();
      onClose();
    }
  };

  const handleCallEnded = () => {
    setCallState('ended');
    setTimeout(() => {
      cleanup();
      onClose();
    }, 2000);
  };

  const handleWebRTCOffer = async (data) => {
    console.log('Oferta WebRTC recebida');
    // A oferta será processada pelo webrtcService
  };

  const handleToggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    webrtcService.toggleAudio(newMuted);
  };

  const handleToggleVideo = () => {
    const newVideoOff = !isVideoOff;
    setIsVideoOff(newVideoOff);
    webrtcService.toggleVideo(!newVideoOff);
  };

  const startDurationTimer = () => {
    if (durationInterval.current) return;
    
    durationInterval.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const cleanup = () => {
    stopRingtone();
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
      durationInterval.current = null;
    }
    webrtcService.cleanup();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCallerName = () => {
    if (call.caller?.name) return call.caller.name;
    if (call.callerName) return call.callerName;
    return 'Visitante';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-2xl w-full max-w-md mx-4 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 text-center">
          {callState === 'ringing' && (
            <p className="text-blue-400 text-sm mb-4 animate-pulse">Chamada recebida...</p>
          )}
          {callState === 'connecting' && (
            <p className="text-yellow-400 text-sm mb-4">Conectando...</p>
          )}
          {callState === 'connected' && (
            <p className="text-green-400 text-sm mb-4">{formatDuration(callDuration)}</p>
          )}
          {callState === 'ended' && (
            <p className="text-red-400 text-sm mb-4">Chamada encerrada</p>
          )}

          {/* Avatar */}
          <div className="relative mx-auto mb-4">
            {callState === 'ringing' && (
              <>
                <div className="absolute inset-0 w-24 h-24 mx-auto bg-blue-500/20 rounded-full animate-ping" />
                <div className="absolute inset-0 w-24 h-24 mx-auto bg-blue-500/20 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
              </>
            )}
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center relative z-10">
              {call.caller?.avatar ? (
                <img 
                  src={call.caller.avatar} 
                  alt={getCallerName()} 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white text-3xl font-bold">
                  {getCallerName().charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* Caller Info */}
          <h2 className="text-white text-xl font-bold">{getCallerName()}</h2>
          <p className="text-slate-400 text-sm">
            {call.callerType === 'visitor' ? 'Visitante' : 'Morador'}
          </p>
          {call.type && (
            <p className="text-slate-500 text-xs mt-1">
              Chamada de {call.type === 'VIDEO' ? 'vídeo' : 'áudio'}
            </p>
          )}
        </div>

        {/* Video Area (quando conectado) */}
        {(callState === 'connecting' || callState === 'connected') && (
          <div className="relative bg-black aspect-video">
            {/* Remote Video */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Local Video (PiP) */}
            <div className={`absolute bottom-4 right-4 w-24 h-32 bg-slate-800 rounded-lg overflow-hidden ${isVideoOff ? 'hidden' : ''}`}>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-red-400 text-sm text-center px-6">{error}</p>
        )}

        {/* Controls */}
        <div className="p-6">
          {callState === 'ringing' ? (
            <div className="flex justify-center gap-8">
              <button
                onClick={handleReject}
                className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
              >
                <PhoneOff className="w-7 h-7 text-white" />
              </button>
              <button
                onClick={handleAnswer}
                className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors animate-pulse"
              >
                <Phone className="w-7 h-7 text-white" />
              </button>
            </div>
          ) : callState === 'connected' ? (
            <div className="space-y-4">
              {/* Media Controls */}
              <div className="flex justify-center gap-4">
                <button
                  onClick={handleToggleMute}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'
                  }`}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                
                <button
                  onClick={handleToggleVideo}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    isVideoOff ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'
                  }`}
                >
                  {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
              </div>

              {/* End Call */}
              <div className="flex justify-center">
                <button
                  onClick={handleEndCall}
                  className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                >
                  <PhoneOff className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
          ) : callState === 'connecting' ? (
            <div className="flex justify-center">
              <button
                onClick={handleEndCall}
                className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
              >
                <PhoneOff className="w-6 h-6 text-white" />
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={onClose}
                className="py-2 px-6 bg-white/10 text-white rounded-lg font-medium"
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
