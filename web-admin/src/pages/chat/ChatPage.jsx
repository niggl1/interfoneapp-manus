import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function ChatPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const loadConversations = useCallback(async () => {
    try {
      const response = await api.get('/chat/conversations');
      setConversations(response.data.conversations || []);
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (chatRoomId) => {
    try {
      const response = await api.get(`/chat/${chatRoomId}/messages`);
      setMessages(response.data.messages || []);
      
      // Marcar como lido
      await api.post(`/chat/${chatRoomId}/read`);
      
      // Scroll para o final
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  }, []);

  useEffect(() => {
    loadConversations();
    
    // Polling para novas conversas
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, [loadConversations]);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id);
      
      // Polling para novas mensagens
      const interval = setInterval(() => loadMessages(selectedChat.id), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedChat, loadMessages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const response = await api.post(`/chat/${selectedChat.id}/messages`, {
        content: messageContent,
        type: 'text'
      });

      if (response.data.message) {
        setMessages(prev => [...prev, response.data.message]);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setNewMessage(messageContent);
      alert('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const getChatName = (chat) => {
    if (chat.name) return chat.name;
    
    if (chat.type === 'VISITOR' && chat.visitorName) {
      return `Visitante: ${chat.visitorName}`;
    }
    
    if (chat.type === 'DIRECT') {
      const otherMember = chat.members.find(m => m.user.id !== user?.id);
      return otherMember?.user.name || 'Chat';
    }
    
    if (chat.type === 'SUPPORT') {
      return 'Suporte';
    }
    
    return 'Conversa';
  };

  const getChatIcon = (chat) => {
    switch (chat.type) {
      case 'GROUP':
        return '👥';
      case 'SUPPORT':
        return '🏢';
      case 'VISITOR':
        return '👤';
      default:
        return '💬';
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    }
    
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
  };

  const getLastMessage = (chat) => {
    if (!chat.messages || chat.messages.length === 0) return 'Nenhuma mensagem';
    const msg = chat.messages[0];
    const content = msg.content.length > 30 ? msg.content.substring(0, 30) + '...' : msg.content;
    return content;
  };

  const openWhatsApp = (phone) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    window.open(`https://wa.me/${formattedPhone}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Lista de conversas */}
      <div className="w-80 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Mensagens</h2>
          <p className="text-sm text-gray-400 mt-1">
            {conversations.length} conversa{conversations.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              <p>Nenhuma conversa</p>
            </div>
          ) : (
            conversations.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`p-4 cursor-pointer hover:bg-gray-700 border-b border-gray-700 ${
                  selectedChat?.id === chat.id ? 'bg-gray-700' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-xl">
                    {getChatIcon(chat)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-white truncate">
                        {getChatName(chat)}
                      </span>
                      {chat.messages?.length > 0 && (
                        <span className="text-xs text-gray-400">
                          {formatTime(chat.messages[0].createdAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 truncate">
                      {getLastMessage(chat)}
                    </p>
                  </div>
                  {chat.unreadCount > 0 && (
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-xs text-white font-bold">
                        {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Área de chat */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Header do chat */}
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-xl">
                  {getChatIcon(selectedChat)}
                </div>
                <div>
                  <h3 className="font-medium text-white">{getChatName(selectedChat)}</h3>
                  <p className="text-sm text-gray-400">
                    {selectedChat.type === 'GROUP' 
                      ? `${selectedChat.members?.length || 0} membros`
                      : selectedChat.type === 'VISITOR'
                        ? selectedChat.visitorPhone || 'Visitante'
                        : 'Online'
                    }
                  </p>
                </div>
              </div>
              
              {/* Botão WhatsApp */}
              {selectedChat.type !== 'GROUP' && (
                <button
                  onClick={() => {
                    const phone = selectedChat.visitorPhone || 
                      selectedChat.members?.find(m => m.user.id !== user?.id)?.user.phone;
                    if (phone) openWhatsApp(phone);
                  }}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center gap-2"
                >
                  <span>WhatsApp</span>
                </button>
              )}
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, index) => {
                const isMe = msg.sender?.id === user?.id;
                const showDate = index === 0 || 
                  new Date(messages[index - 1].createdAt).toDateString() !== 
                  new Date(msg.createdAt).toDateString();
                
                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className="text-center my-4">
                        <span className="text-xs text-gray-400 bg-gray-700 px-3 py-1 rounded-full">
                          {formatDate(msg.createdAt)}
                        </span>
                      </div>
                    )}
                    
                    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          isMe 
                            ? 'bg-blue-500 text-white rounded-br-sm' 
                            : 'bg-gray-700 text-white rounded-bl-sm'
                        }`}
                      >
                        {!isMe && (
                          <p className="text-xs text-blue-300 mb-1">
                            {msg.sender?.name || msg.senderName || 'Visitante'}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-xs mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input de mensagem */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite uma mensagem..."
                  className="flex-1 bg-gray-700 text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-full transition-colors"
                >
                  {sending ? '...' : 'Enviar'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-xl">Selecione uma conversa</p>
              <p className="text-sm mt-2">Escolha uma conversa na lista ao lado</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
