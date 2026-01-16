import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { getSocket } from '../../services/socket';

export default function ChatScreen({ route, navigation }) {
  const { contact, conversationId } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    setupSocketListeners();
    markAsRead();

    return () => {
      removeSocketListeners();
    };
  }, []);

  const setupSocketListeners = () => {
    const socket = getSocket();
    if (socket) {
      socket.on('new_message', handleNewMessage);
      socket.on('typing', handleTyping);
    }
  };

  const removeSocketListeners = () => {
    const socket = getSocket();
    if (socket) {
      socket.off('new_message', handleNewMessage);
      socket.off('typing', handleTyping);
    }
  };

  const handleNewMessage = (message) => {
    if (message.senderId === contact.id || message.receiverId === contact.id) {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    }
  };

  const handleTyping = (data) => {
    // Implementar indicador de digitação
  };

  const fetchMessages = async () => {
    try {
      const response = await api.get(`/communication/messages/${contact.id}`);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      // Dados mockados para demonstração
      setMessages([
        {
          id: '1',
          content: 'Olá! Como posso ajudar?',
          senderId: contact.id,
          createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: '2',
          content: 'Bom dia! Gostaria de saber sobre a encomenda.',
          senderId: user.id,
          createdAt: new Date(Date.now() - 3500000).toISOString()
        },
        {
          id: '3',
          content: 'Claro! A encomenda chegou na portaria.',
          senderId: contact.id,
          createdAt: new Date(Date.now() - 3400000).toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await api.post(`/communication/messages/${contact.id}/read`);
    } catch (error) {
      console.error('Erro ao marcar como lido:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const messageText = inputText.trim();
    setInputText('');
    setSending(true);

    // Adicionar mensagem otimisticamente
    const tempMessage = {
      id: `temp-${Date.now()}`,
      content: messageText,
      senderId: user.id,
      createdAt: new Date().toISOString(),
      pending: true
    };
    setMessages(prev => [...prev, tempMessage]);
    scrollToBottom();

    try {
      const response = await api.post('/communication/messages', {
        receiverId: contact.id,
        content: messageText
      });

      // Atualizar mensagem com dados do servidor
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempMessage.id ? response.data.message : msg
        )
      );

      // Emitir via socket
      const socket = getSocket();
      if (socket) {
        socket.emit('send_message', response.data.message);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      // Remover mensagem temporária em caso de erro
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
    }
  };

  const renderMessage = ({ item, index }) => {
    const isMyMessage = item.senderId === user.id;
    const showDate = index === 0 || 
      formatDate(item.createdAt) !== formatDate(messages[index - 1]?.createdAt);

    return (
      <View>
        {showDate && (
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
          </View>
        )}
        <View style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
        ]}>
          {isMyMessage ? (
            <LinearGradient
              colors={['#3b82f6', '#2563eb']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.messageBubble, styles.myMessage]}
            >
              <Text style={styles.myMessageText}>{item.content}</Text>
              <View style={styles.messageFooter}>
                <Text style={styles.myMessageTime}>{formatTime(item.createdAt)}</Text>
                {item.pending ? (
                  <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.7)" />
                ) : (
                  <Ionicons name="checkmark-done" size={12} color="rgba(255,255,255,0.7)" />
                )}
              </View>
            </LinearGradient>
          ) : (
            <View style={[styles.messageBubble, styles.otherMessage]}>
              <Text style={styles.otherMessageText}>{item.content}</Text>
              <Text style={styles.otherMessageTime}>{formatTime(item.createdAt)}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const handleCall = () => {
    navigation.navigate('VideoCall', { contact, type: 'outgoing' });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <LinearGradient
            colors={contact.role === 'JANITOR' ? ['#f59e0b', '#d97706'] : ['#3b82f6', '#2563eb']}
            style={styles.headerAvatar}
          >
            <Text style={styles.headerAvatarText}>
              {contact.name?.charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerName}>{contact.name}</Text>
            <Text style={styles.headerSubtitle}>
              {contact.role === 'JANITOR' ? 'Zelador' : 
                contact.unit ? `${contact.unit.block?.name} - Apt. ${contact.unit.number}` : 'Morador'}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.callButton} onPress={handleCall}>
          <Ionicons name="videocam" size={22} color="#10b981" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
        />
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Digite uma mensagem..."
            placeholderTextColor="#94a3b8"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />
        </View>
        <TouchableOpacity
          onPress={sendMessage}
          disabled={!inputText.trim() || sending}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={inputText.trim() ? ['#3b82f6', '#2563eb'] : ['#cbd5e1', '#94a3b8']}
            style={styles.sendButton}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  backButton: {
    padding: 4,
    marginRight: 8
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  headerTextContainer: {
    marginLeft: 12
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b'
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b'
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 8
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: 16
  },
  dateText: {
    fontSize: 12,
    color: '#94a3b8',
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10
  },
  messageContainer: {
    marginBottom: 8,
    maxWidth: '80%'
  },
  myMessageContainer: {
    alignSelf: 'flex-end'
  },
  otherMessageContainer: {
    alignSelf: 'flex-start'
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16
  },
  myMessage: {
    borderBottomRightRadius: 4
  },
  otherMessage: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4
  },
  myMessageText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 20
  },
  otherMessageText: {
    color: '#1e293b',
    fontSize: 15,
    lineHeight: 20
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4
  },
  myMessageTime: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)'
  },
  otherMessageTime: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'right'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100
  },
  input: {
    fontSize: 15,
    color: '#1e293b',
    maxHeight: 80
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center'
  }
});
