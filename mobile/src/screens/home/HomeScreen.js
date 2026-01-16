import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    unreadMessages: 0,
    missedCalls: 0,
    announcements: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Aqui você pode buscar estatísticas do backend
      // Por enquanto, usamos dados mockados
      setStats({
        unreadMessages: 3,
        missedCalls: 1,
        announcements: 2
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const getRoleLabel = (role) => {
    const labels = {
      RESIDENT: 'Morador',
      JANITOR: 'Zelador',
      MANAGER: 'Síndico',
      ADMIN: 'Administrador'
    };
    return labels[role] || role;
  };

  const quickActions = [
    {
      id: 'messages',
      title: 'Mensagens',
      icon: 'chatbubbles',
      color: ['#3b82f6', '#2563eb'],
      badge: stats.unreadMessages,
      onPress: () => navigation.navigate('Messages')
    },
    {
      id: 'calls',
      title: 'Chamadas',
      icon: 'videocam',
      color: ['#10b981', '#059669'],
      badge: stats.missedCalls,
      onPress: () => navigation.navigate('Calls')
    },
    {
      id: 'contacts',
      title: 'Contatos',
      icon: 'people',
      color: ['#8b5cf6', '#7c3aed'],
      onPress: () => navigation.navigate('Contacts')
    },
    {
      id: 'announcements',
      title: 'Comunicados',
      icon: 'megaphone',
      color: ['#f59e0b', '#d97706'],
      badge: stats.announcements,
      onPress: () => navigation.navigate('Announcements')
    }
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1e293b', '#0f172a']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={['#3b82f6', '#2563eb']}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
            </View>
            <View style={styles.userTextContainer}>
              <Text style={styles.greeting}>Olá,</Text>
              <Text style={styles.userName}>{user?.name?.split(' ')[0]}</Text>
              <Text style={styles.userRole}>{getRoleLabel(user?.role)}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={logout}
          >
            <Ionicons name="log-out-outline" size={24} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Unit Info */}
        {user?.unit && (
          <View style={styles.unitCard}>
            <Ionicons name="home" size={20} color="#3b82f6" />
            <Text style={styles.unitText}>
              {user.unit.block?.name} - Apt. {user.unit.number}
            </Text>
          </View>
        )}
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Acesso Rápido</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.quickActionCard}
              onPress={action.onPress}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={action.color}
                style={styles.quickActionIcon}
              >
                <Ionicons name={action.icon} size={28} color="#fff" />
                {action.badge > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{action.badge}</Text>
                  </View>
                )}
              </LinearGradient>
              <Text style={styles.quickActionTitle}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Activity */}
        <Text style={styles.sectionTitle}>Atividade Recente</Text>
        <View style={styles.activityCard}>
          <View style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="chatbubble" size={16} color="#3b82f6" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>Nova mensagem do zelador</Text>
              <Text style={styles.activityTime}>Há 5 minutos</Text>
            </View>
          </View>

          <View style={styles.activityDivider} />

          <View style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="call" size={16} color="#10b981" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>Chamada perdida - Portaria</Text>
              <Text style={styles.activityTime}>Há 30 minutos</Text>
            </View>
          </View>

          <View style={styles.activityDivider} />

          <View style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="megaphone" size={16} color="#f59e0b" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>Novo comunicado da administração</Text>
              <Text style={styles.activityTime}>Há 2 horas</Text>
            </View>
          </View>
        </View>

        {/* Emergency Contact */}
        <TouchableOpacity style={styles.emergencyCard} activeOpacity={0.8}>
          <LinearGradient
            colors={['#ef4444', '#dc2626']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.emergencyGradient}
          >
            <Ionicons name="alert-circle" size={24} color="#fff" />
            <View style={styles.emergencyTextContainer}>
              <Text style={styles.emergencyTitle}>Emergência</Text>
              <Text style={styles.emergencySubtitle}>Ligar para portaria</Text>
            </View>
            <Ionicons name="call" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatarContainer: {
    marginRight: 12
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold'
  },
  userTextContainer: {
    justifyContent: 'center'
  },
  greeting: {
    color: '#94a3b8',
    fontSize: 14
  },
  userName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold'
  },
  userRole: {
    color: '#3b82f6',
    fontSize: 12,
    marginTop: 2
  },
  logoutButton: {
    padding: 8
  },
  unitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
    marginTop: 16
  },
  unitText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 8
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold'
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b'
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  activityContent: {
    flex: 1
  },
  activityText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500'
  },
  activityTime: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2
  },
  activityDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12
  },
  emergencyCard: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  emergencyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16
  },
  emergencyTextContainer: {
    flex: 1,
    marginLeft: 12
  },
  emergencyTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  emergencySubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12
  },
  bottomSpacer: {
    height: 100
  }
});
