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
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

export default function AnnouncementsScreen({ navigation }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await api.get('/communication/announcements');
      setAnnouncements(response.data.announcements || []);
    } catch (error) {
      console.error('Erro ao buscar comunicados:', error);
      // Dados mockados para demonstração
      setAnnouncements([
        {
          id: '1',
          title: 'Manutenção do Elevador',
          content: 'Informamos que o elevador do bloco A estará em manutenção no dia 20/01.',
          createdAt: new Date().toISOString(),
          author: { name: 'Administração' }
        },
        {
          id: '2',
          title: 'Reunião de Condomínio',
          content: 'Convocamos todos os moradores para a reunião ordinária no dia 25/01 às 19h.',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          author: { name: 'Síndico' }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnnouncements();
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const renderAnnouncement = ({ item }) => (
    <View style={styles.announcementCard}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name="megaphone" size={20} color="#f59e0b" />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.announcementTitle}>{item.title}</Text>
          <Text style={styles.announcementMeta}>
            {item.author?.name} • {formatDate(item.createdAt)}
          </Text>
        </View>
      </View>
      <Text style={styles.announcementContent} numberOfLines={3}>
        {item.content}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comunicados</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Announcements List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          data={announcements}
          renderItem={renderAnnouncement}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="megaphone-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>Nenhum comunicado</Text>
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
  backButton: {
    padding: 4
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b'
  },
  placeholder: {
    width: 32
  },
  listContainer: {
    padding: 20
  },
  announcementCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  headerInfo: {
    flex: 1
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b'
  },
  announcementMeta: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2
  },
  announcementContent: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20
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
    fontSize: 15,
    color: '#94a3b8',
    marginTop: 12
  }
});
