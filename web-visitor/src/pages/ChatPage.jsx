import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Send, Loader2, User, MessageCircle } from 'lucide-react';
import { visitorApi } from '../services/api';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'https://interfoneapp-api.onrender.com';

export default function ChatPage() {
  const { chatRoomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // Dados passados pela navegação
  const { resident, visitorName, chatRoom: initialChatRoom } = location.state || {};

  useEffect(() => {
    if (!chatRoomId || !visitorName) {
      navigate('/');
      return;
    }
    
    loadMessages();
    setupSocket();
    
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [chatRoomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const setupSocket = () => {
    const newSocket = io(API_URL, {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Socket conectado');
      newSocket.emit('join_chat', { chatRoomId });
    });

    newSocket.on('new_message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket desconectado');
    });

    setSocket(newSocket);
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/v1/chat/visitor/${chatRoomId}/messages`);
      const data = await response.json();
      
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
      setError('Erro ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Adicionar mensagem otimisticamente
    const tempMessage = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      senderName: visitorName,
      createdAt: new Date().toISOString(),
      isTemp: true,
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const response = await fetch(`${API_URL}/api/v1/chat/visitor/${chatRoomId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: messageContent,
          senderName: visitorName,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar mensagem');
      }

      const data = await response.json();
      
      // Substituir mensagem temporária pela real
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempMessage.id ? data.message : msg
        )
      );
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      // Remover mensagem temporária em caso de erro
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      setError('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const isMyMessage = (message) => {
    // Mensagens do visitante não têm senderId (apenas senderName)
    return !message.senderId && message.senderName === visitorName;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Carregando chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-primary p-4 flex items-center gap-4 safe-area-top">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-semibold">
              {resident?.name || 'Morador'}
            </h1>
            <p className="text-blue-100 text-sm">
              {resident?.unit?.block?.name} - Apt. {resident?.unit?.number}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-slate-600 font-medium">Nenhuma mensagem ainda</p>
            <p className="text-slate-400 text-sm mt-1">
              Envie uma mensagem para iniciar a conversa
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${isMyMessage(message) ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  isMyMessage(message)
                    ? 'bg-gradient-primary text-white rounded-br-md'
                    : 'bg-white text-slate-800 rounded-bl-md shadow-sm'
                } ${message.isTemp ? 'opacity-70' : ''}`}
              >
                {!isMyMessage(message) && (
                  <p className="text-xs font-medium text-blue-600 mb-1">
                    {message.sender?.name || message.senderName || 'Morador'}
                  </p>
                )}
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  isMyMessage(message) ? 'text-blue-100' : 'text-slate-400'
                }`}>
                  {formatTime(message.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error message */}
      {error && (
        <div className="px-4 py-2 bg-red-100 text-red-600 text-sm text-center">
          {error}
          <button 
            onClick={() => setError(null)}
            className="ml-2 underline"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-slate-200 p-4 safe-area-bottom">
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            className="flex-1 bg-slate-100 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={sending}
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              newMessage.trim() && !sending
                ? 'bg-gradient-primary text-white'
                : 'bg-slate-200 text-slate-400'
            }`}
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
