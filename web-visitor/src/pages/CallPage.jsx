import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Loader2, RotateCcw } from 'lucide-react';
import { visitorApi } from '../services/api';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';
import webrtcService from '../services/webrtc';

export default function CallPage() {
  const { residentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const { resident, visitorName, unitInfo } = location.state || {};
  
  const [callStatus, setCallStatus] = useState('connecting'); // connecting, calling, connected, rejected, ended
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callId, setCallId] = useState(null);
  const [error, setError] = useState(null);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const durationInterval = useRef(null);
  const callTimeout = useRef(null);

  useEffect(() => {
    if (!resident || !visitorName) {
      navigate('/');
      return;
    }

    initializeCall();

    return () => {
      cleanup();
    };
  }, []);

  const initializeCall = async () => {
    try {
      // Obter mídia local primeiro
      setCallStatus('connecting');
      
      try {
        const localStream = await webrtcService.getLocalStream(true, true);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }
      } catch (mediaError) {
        console.warn('Não foi possível acessar câmera/microfone:', mediaError);
        setError('Não foi possível acessar câmera ou microfone');
      }

      // Conectar socket
      const visitorId = `visitor-${Date.now()}`;
      const socket = connectSocket(visitorId);

      // Inicializar WebRTC com o socket
      webrtcService.init(socket);

      // Configurar callback para stream remoto
      webrtcService.onRemoteStream = (stream) => {
        console.log('Stream remoto recebido');
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      };

      // Configurar callback para mudança de estado
      webrtcService.onConnectionStateChange = (state) => {
        console.log('Estado da conexão:', state);
        if (state === 'connected') {
          setCallStatus('connected');
          startDurationTimer();
        } else if (state === 'disconnected' || state === 'failed') {
          handleCallEnded();
        }
      };

      // Configurar listeners do socket
      socket.on('call_started', handleCallStarted);
      socket.on('call_answered', handleCallAnswered);
      socket.on('call_rejected', handleCallRejected);
      socket.on('call_ended', handleCallEnded);
      socket.on('incoming_call', handleIncomingCall);

      // Iniciar chamada via socket
      setCallStatus('calling');
      
      socket.emit('start_call', {
        receiverId: residentId,
        callerName: visitorName,
        type: 'VIDEO'
      });

      // Timeout de 45 segundos
      callTimeout.current = setTimeout(() => {
        if (callStatus === 'calling') {
          setCallStatus('rejected');
          setTimeout(() => navigate(-1), 3000);
        }
      }, 45000);

    } catch (error) {
      console.error('Erro ao inicializar chamada:', error);
      setError('Erro ao iniciar chamada');
      setCallStatus('ended');
    }
  };

  const handleCallStarted = async (data) => {
    console.log('Chamada iniciada:', data);
    setCallId(data.callId);
    
    // Criar peer connection e enviar oferta
    webrtcService.createPeerConnection();
  };

  const handleCallAnswered = async (data) => {
    console.log('Chamada atendida:', data);
    setCallStatus('connected');
    startDurationTimer();
    
    if (callTimeout.current) {
      clearTimeout(callTimeout.current);
    }

    // Criar e enviar oferta WebRTC
    try {
      await webrtcService.createOffer(data.callId || callId);
    } catch (error) {
      console.error('Erro ao criar oferta WebRTC:', error);
    }
  };

  const handleCallRejected = (data) => {
    console.log('Chamada rejeitada:', data);
    setCallStatus('rejected');
    setTimeout(() => navigate(-1), 3000);
  };

  const handleCallEnded = (data) => {
    console.log('Chamada encerrada:', data);
    setCallStatus('ended');
    setTimeout(() => navigate(-1), 2000);
  };

  const handleIncomingCall = (data) => {
    // Visitante não recebe chamadas, ignorar
    console.log('Chamada recebida (ignorada):', data);
  };

  const startDurationTimer = () => {
    if (durationInterval.current) return;
    
    durationInterval.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const handleEndCall = async () => {
    try {
      const socket = getSocket();
      if (socket && callId) {
        socket.emit('end_call', { callId });
      }
      
      // Também chamar API REST
      if (callId) {
        try {
          await visitorApi.endCall(callId);
        } catch (err) {
          console.warn('Erro ao encerrar chamada via API:', err);
        }
      }
    } catch (error) {
      console.error('Erro ao encerrar chamada:', error);
    } finally {
      cleanup();
      navigate(-1);
    }
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

  const handleSwitchCamera = async () => {
    try {
      const newStream = await webrtcService.switchCamera();
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = newStream;
      }
    } catch (error) {
      console.error('Erro ao trocar câmera:', error);
    }
  };

  const cleanup = () => {
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
      durationInterval.current = null;
    }
    if (callTimeout.current) {
      clearTimeout(callTimeout.current);
      callTimeout.current = null;
    }
    webrtcService.cleanup();
    disconnectSocket();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    switch (callStatus) {
      case 'connecting':
        return 'Conectando...';
      case 'calling':
        return 'Chamando...';
      case 'connected':
        return formatDuration(callDuration);
      case 'rejected':
        return 'Chamada não atendida';
      case 'ended':
        return 'Chamada encerrada';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (callStatus) {
      case 'connected':
        return 'text-green-400';
      case 'rejected':
        return 'text-red-400';
      default:
        return 'text-blue-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark flex flex-col relative overflow-hidden">
      {/* Remote Video (Full Screen) */}
      <div className="absolute inset-0">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={`w-full h-full object-cover ${callStatus !== 'connected' ? 'hidden' : ''}`}
        />
        
        {/* Overlay quando não conectado */}
        {callStatus !== 'connected' && (
          <div className="w-full h-full flex flex-col items-center justify-center p-8">
            {/* Avatar */}
            <div className="relative mb-8">
              {/* Pulse rings for calling state */}
              {callStatus === 'calling' && (
                <>
                  <div className="absolute inset-0 w-32 h-32 bg-blue-500/20 rounded-full animate-pulse-ring" />
                  <div className="absolute inset-0 w-32 h-32 bg-blue-500/20 rounded-full animate-pulse-ring" style={{ animationDelay: '0.5s' }} />
                </>
              )}
              
              <div className={`w-32 h-32 rounded-3xl flex items-center justify-center shadow-2xl ${
                resident?.role === 'JANITOR' 
                  ? 'bg-gradient-to-br from-orange-500 to-orange-600'
                  : 'bg-gradient-primary'
              }`}>
                <span className="text-white text-5xl font-bold">
                  {resident?.name?.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
            </div>

            {/* Contact Info */}
            <h1 className="text-white text-2xl font-bold mb-1">
              {resident?.name || 'Morador'}
            </h1>
            <p className="text-slate-400 mb-4">
              {resident?.role === 'JANITOR' ? 'Zelador' : 
                unitInfo ? `${unitInfo.block?.name} - Apt. ${unitInfo.number}` : 'Morador'}
            </p>
            
            {/* Status */}
            <div className="flex items-center gap-2">
              {(callStatus === 'connecting' || callStatus === 'calling') && (
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
              )}
              <p className={`text-lg font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </p>
            </div>

            {/* Error message */}
            {error && (
              <p className="text-red-400 text-sm mt-4">{error}</p>
            )}
          </div>
        )}
      </div>

      {/* Local Video Preview */}
      <div className={`absolute top-4 right-4 w-28 h-40 bg-slate-800 rounded-xl overflow-hidden shadow-lg ${
        isVideoOff ? 'hidden' : ''
      }`}>
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover mirror"
        />
        {isVideoOff && (
          <div className="w-full h-full bg-gradient-primary flex items-center justify-center">
            <span className="text-white text-xl font-bold">
              {visitorName?.charAt(0).toUpperCase() || 'V'}
            </span>
          </div>
        )}
      </div>

      {/* Visitor Name Badge */}
      <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 z-10">
        <p className="text-white text-sm">
          <span className="text-slate-400">Visitante:</span> {visitorName}
        </p>
      </div>

      {/* Call Duration (when connected) */}
      {callStatus === 'connected' && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-500/20 backdrop-blur-sm rounded-full px-4 py-2 z-10">
          <p className="text-green-400 font-medium">{formatDuration(callDuration)}</p>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 bg-gradient-to-t from-black/80 to-transparent">
        {callStatus === 'connected' ? (
          <div className="space-y-6">
            {/* Media Controls */}
            <div className="flex justify-center gap-4">
              <button
                onClick={handleToggleMute}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                  isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'
                }`}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
              
              <button
                onClick={handleToggleVideo}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                  isVideoOff ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'
                }`}
              >
                {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
              </button>

              <button
                onClick={handleSwitchCamera}
                className="w-14 h-14 rounded-full flex items-center justify-center bg-white/10 text-white transition-colors"
              >
                <RotateCcw className="w-6 h-6" />
              </button>
            </div>

            {/* End Call Button */}
            <div className="flex justify-center">
              <button
                onClick={handleEndCall}
                className="w-16 h-16 bg-gradient-danger rounded-full flex items-center justify-center shadow-lg"
              >
                <PhoneOff className="w-7 h-7 text-white" />
              </button>
            </div>
          </div>
        ) : callStatus === 'calling' || callStatus === 'connecting' ? (
          <div className="flex justify-center">
            <button
              onClick={handleEndCall}
              className="w-16 h-16 bg-gradient-danger rounded-full flex items-center justify-center shadow-lg"
            >
              <PhoneOff className="w-7 h-7 text-white" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={() => navigate(-1)}
              className="py-3 px-8 bg-white/10 text-white rounded-xl font-medium"
            >
              Voltar
            </button>
          </div>
        )}
      </div>

      {/* CSS for mirror effect */}
      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
        
        @keyframes pulse-ring {
          0% {
            transform: scale(1);
            opacity: 0.5;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        
        .animate-pulse-ring {
          animation: pulse-ring 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}
