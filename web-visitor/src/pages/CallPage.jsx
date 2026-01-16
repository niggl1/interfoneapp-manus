import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Loader2 } from 'lucide-react';
import { visitorApi } from '../services/api';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';

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
      // Conectar socket
      const visitorId = `visitor-${Date.now()}`;
      const socket = connectSocket(visitorId);

      // Configurar listeners
      socket.on('call_accepted', handleCallAccepted);
      socket.on('call_rejected', handleCallRejected);
      socket.on('call_ended', handleCallEnded);

      // Iniciar chamada
      setCallStatus('calling');
      
      try {
        const response = await visitorApi.initiateCall(residentId, visitorName);
        setCallId(response.call?.id);
      } catch (err) {
        console.error('Erro ao iniciar chamada:', err);
        // Simular chamada para demonstração
        setCallId(`call-${Date.now()}`);
      }

      // Emitir evento de chamada via socket
      socket.emit('visitor_call', {
        residentId,
        visitorName,
        unitInfo
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
      setCallStatus('ended');
    }
  };

  const handleCallAccepted = (data) => {
    setCallStatus('connected');
    startDurationTimer();
    if (callTimeout.current) {
      clearTimeout(callTimeout.current);
    }
  };

  const handleCallRejected = (data) => {
    setCallStatus('rejected');
    setTimeout(() => navigate(-1), 3000);
  };

  const handleCallEnded = (data) => {
    setCallStatus('ended');
    setTimeout(() => navigate(-1), 2000);
  };

  const startDurationTimer = () => {
    durationInterval.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const handleEndCall = async () => {
    try {
      if (callId) {
        await visitorApi.endCall(callId);
      }
      
      const socket = getSocket();
      if (socket) {
        socket.emit('end_call', { callId });
      }
    } catch (error) {
      console.error('Erro ao encerrar chamada:', error);
    } finally {
      cleanup();
      navigate(-1);
    }
  };

  const cleanup = () => {
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
    }
    if (callTimeout.current) {
      clearTimeout(callTimeout.current);
    }
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
    <div className="min-h-screen bg-gradient-dark flex flex-col">
      {/* Remote Video Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
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
      </div>

      {/* Local Video Preview (placeholder) */}
      {callStatus === 'connected' && !isVideoOff && (
        <div className="absolute top-4 right-4 w-24 h-32 bg-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="w-full h-full bg-gradient-primary flex items-center justify-center">
            <span className="text-white text-xl font-bold">
              {visitorName?.charAt(0).toUpperCase() || 'V'}
            </span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="p-8 pb-12">
        {callStatus === 'connected' ? (
          <div className="space-y-6">
            {/* Media Controls */}
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                  isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'
                }`}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
              
              <button
                onClick={() => setIsVideoOff(!isVideoOff)}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                  isVideoOff ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'
                }`}
              >
                {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
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
        ) : callStatus === 'calling' ? (
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

      {/* Visitor Name Badge */}
      <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
        <p className="text-white text-sm">
          <span className="text-slate-400">Visitante:</span> {visitorName}
        </p>
      </div>
    </div>
  );
}
