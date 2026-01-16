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
import { useAuth } from '../../context/AuthContext';

export default function CallsScreen({ navigation }) {
  const { user } = useAuth();
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCalls();
  }, []);

  const fetchCalls = async () => {
    try {
      const response = await api.get('/communication/calls');
      setCalls(response.data.calls || []);
    } catch (error) {
      console.error('Erro ao buscar chamadas:', error);
      // Dados mockados para demonstração
      setCalls([
        {
          id: '1',
          caller: { id: 'user1', name: 'José Silva', role: 'JANITOR' },
          receiver: { id: user.id, name: user.name },
          type: 'VIDEO',
          status: 'MISSED',
          startedAt: new Date().toISOString(),
          duration: 0
        },
        {
          id: '2',
          caller: { id: user.id, name: user.name },
          receiver: { id: 'user2', name: 'Maria Santos', role: 'RESIDENT', unit: { number: '101', block: { name: 'Bloco A' } } },
          type: 'VIDEO',
          status: 'COMPLETED',
          startedAt: new Date(Date.now() - 7200000).toISOString(),
          duration: 180
        },
        {
          id: '3',
          caller: { id: 'user3', name: 'Visitante', role: 'VISITOR' },
          receiver: { id: user.id, name: user.name },
          type: 'VIDEO',
          status: 'COMPLETED',
          startedAt: new Date(Date.now() - 86400000).toISOString(),
          duration: 45
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCalls();
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

  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCallInfo = (call) => {
    const isOutgoing = call.caller.id === user.id;
    const contact = isOutgoing ? call.receiver : call.caller;
    
    let statusIcon, statusColor;
    if (call.status === 'MISSED') {
      statusIcon = 'arrow-down';
      statusColor = '#ef4444';
    } else if (isOutgoing) {
      statusIcon = 'arrow-up';
      statusColor = '#10b981';
    } else {
      statusIcon = 'arrow-down';
      statusColor = '#10b981';
    }

    return { contact, isOutgoing, statusIcon, statusColor };
  };

  const handleCall = (contact) => {
    navigation.navigate('VideoCall', { contact, type: 'outgoing' });
  };

  const renderCall = ({ item }) => {
    const { contact, isOutgoing, statusIcon, statusColor } = getCallInfo(item);

    return (
      <TouchableOpacity
        style={styles.callCard}
        onPress={() => handleCall(contact)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={contact.role === 'JANITOR' ? ['#f59e0b', '#d97706'] : 
                  contact.role === 'VISITOR' ? ['#8b5cf6', '#7c3aed'] : 
                  ['#3b82f6', '#2563eb']}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>
            {contact.name?.charAt(0).toUpperCase()}
          </Text>
        </LinearGradient>

        <View style={styles.callInfo}>
          <Text style={styles.contactName}>{contact.name}</Text>
          <View style={styles.callDetails}>
            <Ionicons name={statusIcon} size={14} color={statusColor} />
            <Text style={[styles.callStatus, { color: statusColor }]}>
              {item.status === 'MISSED' ? 'Perdida' : 
               isOutgoing ? 'Realizada' : 'Recebida'}
            </Text>
            {item.duration > 0 && (
              <Text style={styles.callDuration}> • {formatDuration(item.duration)}</Text>
            )}
          </View>
        </View>

        <View style={styles.callMeta}>
          <Text style={styles.callTime}>{formatTime(item.startedAt)}</Text>
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => handleCall(contact)}
          >
            <Ionicons name="videocam" size={20} color="#10b981" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chamadas</Text>
      </View>

      {/* Calls List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          data={calls}
          renderItem={renderCall}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="videocam-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>Nenhuma chamada</Text>
              <Text style={styles.emptySubtext}>
                Suas chamadas aparecerão aqui
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
  listContainer: {
    padding: 16
  },
  callCard: {
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
  callInfo: {
    flex: 1,
    marginLeft: 12
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b'
  },
  callDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  callStatus: {
    fontSize: 13,
    marginLeft: 4
  },
  callDuration: {
    fontSize: 13,
    color: '#64748b'
  },
  callMeta: {
    alignItems: 'flex-end'
  },
  callTime: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 8
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
