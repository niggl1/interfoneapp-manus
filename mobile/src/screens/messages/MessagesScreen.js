import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { getSocket } from '../../services/socket';

export default function MessagesScreen({ navigation }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchConversations();
    setupSocketListeners();

    return () => {
      removeSocketListeners();
    };
  }, []);

  const setupSocketListeners = () => {
    const socket = getSocket();
    if (socket) {
      socket.on('new_message', handleNewMessage);
    }
  };

  const removeSocketListeners = () => {
    const socket = getSocket();
    if (socket) {
      socket.off('new_message', handleNewMessage);
    }
  };

  const handleNewMessage = (message) => {
    // Atualizar lista de conversas quando receber nova mensagem
    fetchConversations();
  };

  const fetchConversations = async () => {
    try {
      const response = await api.get('/communication/conversations');
      setConversations(response.data.conversations || []);
    } catch (error) {
      console.error('Erro ao buscar conversas:', error);
      // Dados mockados para demonstração
      setConversations([
        {
          id: '1',
          participant: {
            id: 'user1',
            name: 'José Silva',
            role: 'JANITOR'
          },
          lastMessage: {
            content: 'Bom dia! A encomenda chegou na portaria.',
            createdAt: new Date().toISOString(),
            senderId: 'user1'
          },
          unreadCount: 2
        },
        {
          id: '2',
          participant: {
            id: 'user2',
            name: 'Maria Santos',
            role: 'RESIDENT',
            unit: { number: '101', block: { name: 'Bloco A' } }
          },
          lastMessage: {
            content: 'Obrigada pela ajuda!',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            senderId: 'user2'
          },
          unreadCount: 0
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Ontem';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('pt-BR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  const getParticipantSubtitle = (participant) => {
    if (participant.role === 'JANITOR') {
      return 'Zelador';
    }
    if (participant.unit) {
      return `${participant.unit.block?.name} - Apt. ${participant.unit.number}`;
    }
    return 'Morador';
  };

  const renderConversation = ({ item }) => (
    <TouchableOpacity
      style={styles.conversationCard}
      onPress={() => navigation.navigate('Chat', { contact: item.participant, conversationId: item.id })}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={item.participant.role === 'JANITOR' ? ['#f59e0b', '#d97706'] : ['#3b82f6', '#2563eb']}
        style={styles.avatar}
      >
        <Text style={styles.avatarText}>
          {item.participant.name?.charAt(0).toUpperCase()}
        </Text>
      </LinearGradient>

      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.participantName} numberOfLines={1}>
            {item.participant.name}
          </Text>
          <Text style={styles.messageTime}>
            {formatTime(item.lastMessage?.createdAt)}
          </Text>
        </View>
        <View style={styles.conversationFooter}>
          <Text style={styles.participantSubtitle}>
            {getParticipantSubtitle(item.participant)}
          </Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage?.content}
          </Text>
        </View>
      </View>

      {item.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{item.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mensagens</Text>
        <TouchableOpacity
          style={styles.newMessageButton}
          onPress={() => navigation.navigate('Contacts')}
        >
          <Ionicons name="create-outline" size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* Conversations List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>Nenhuma conversa</Text>
              <Text style={styles.emptySubtext}>
                Inicie uma conversa através dos contatos
              </Text>
            </View>
          }
        />
      )}
    </View>
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
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#fff'
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b'
  },
  newMessageButton: {
    padding: 4
  },
  listContainer: {
    padding: 16
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold'
  },
  conversationContent: {
    flex: 1,
    marginLeft: 12
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
    marginRight: 8
  },
  messageTime: {
    fontSize: 12,
    color: '#94a3b8'
  },
  conversationFooter: {
    flexDirection: 'column'
  },
  participantSubtitle: {
    fontSize: 12,
    color: '#3b82f6',
    marginBottom: 2
  },
  lastMessage: {
    fontSize: 14,
    color: '#64748b'
  },
  unreadBadge: {
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8
  },
  unreadText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 12
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4
  }
});
