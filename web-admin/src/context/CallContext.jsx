import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';
import IncomingCallModal from '../components/IncomingCallModal';

const CallContext = createContext(null);

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall deve ser usado dentro de um CallProvider');
  }
  return context;
};

export const CallProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [callHistory, setCallHistory] = useState([]);

  // Conectar ao socket quando o usuário estiver autenticado
  useEffect(() => {
    if (user && token) {
      const socketInstance = connectSocket(token);
      setSocket(socketInstance);

      socketInstance.on('connect', () => {
        console.log('📞 Socket de chamadas conectado');
        setIsConnected(true);
      });

      socketInstance.on('disconnect', () => {
        console.log('📞 Socket de chamadas desconectado');
        setIsConnected(false);
      });

      // Listener para chamadas recebidas
      socketInstance.on('incoming_call', (data) => {
        console.log('📞 Chamada recebida:', data);
        setIncomingCall(data);
        
        // Notificação do navegador
        if (Notification.permission === 'granted') {
          new Notification('Chamada recebida', {
            body: `${data.caller?.name || data.callerName || 'Visitante'} está ligando`,
            icon: '/favicon.ico',
            tag: 'incoming-call',
            requireInteraction: true
          });
        }
      });

      // Listener para chamada encerrada
      socketInstance.on('call_ended', (data) => {
        console.log('📞 Chamada encerrada:', data);
        if (incomingCall?.callId === data.callId) {
          setIncomingCall(null);
        }
      });

      // Listener para chamada rejeitada
      socketInstance.on('call_rejected', (data) => {
        console.log('📞 Chamada rejeitada:', data);
        if (incomingCall?.callId === data.callId) {
          setIncomingCall(null);
        }
      });

      return () => {
        disconnectSocket();
        setSocket(null);
        setIsConnected(false);
      };
    }
  }, [user, token]);

  // Solicitar permissão de notificação
  useEffect(() => {
    if (user && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [user]);

  const handleAnswerCall = useCallback((call) => {
    console.log('Chamada atendida:', call);
    // O modal de chamada vai gerenciar o estado
  }, []);

  const handleRejectCall = useCallback((call) => {
    console.log('Chamada rejeitada:', call);
    setIncomingCall(null);
  }, []);

  const handleCloseCall = useCallback(() => {
    setIncomingCall(null);
  }, []);

  const value = {
    socket,
    isConnected,
    incomingCall,
    callHistory,
    setCallHistory
  };

  return (
    <CallContext.Provider value={value}>
      {children}
      
      {/* Modal de chamada recebida */}
      {incomingCall && socket && (
        <IncomingCallModal
          call={incomingCall}
          socket={socket}
          onClose={handleCloseCall}
          onAnswer={handleAnswerCall}
          onReject={handleRejectCall}
        />
      )}
    </CallContext.Provider>
  );
};

export default CallContext;
