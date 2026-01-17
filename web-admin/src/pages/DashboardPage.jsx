import { useEffect, useState } from 'react';
import Header from '../components/layout/Header';
import { 
  Building, 
  Users, 
  Home, 
  Phone, 
  Ticket, 
  MessageSquare, 
  TrendingUp, 
  TrendingDown,
  PhoneIncoming,
  PhoneMissed,
  Clock,
  Calendar,
  ArrowRight
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

function StatCard({ title, value, icon: Icon, color, trend, trendValue, subtitle }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    cyan: 'from-cyan-500 to-cyan-600'
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-800">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[color]} rounded-xl flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

function RecentActivityCard({ activities }) {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'call': return <Phone className="w-4 h-4" />;
      case 'invitation': return <Ticket className="w-4 h-4" />;
      case 'message': return <MessageSquare className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'call': return 'bg-blue-100 text-blue-600';
      case 'invitation': return 'bg-green-100 text-green-600';
      case 'message': return 'bg-purple-100 text-purple-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Atividade Recente</h3>
      <div className="space-y-4">
        {activities.length === 0 ? (
          <p className="text-slate-500 text-center py-4">Nenhuma atividade recente</p>
        ) : (
          activities.map((activity, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800">{activity.title}</p>
                <p className="text-xs text-slate-500">{activity.time}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function QuickActionsCard() {
  const actions = [
    { title: 'Ver Chamadas', path: '/calls', icon: Phone, color: 'blue' },
    { title: 'Ver Convites', path: '/invitations', icon: Ticket, color: 'green' },
    { title: 'Ver Usuários', path: '/users', icon: Users, color: 'purple' },
    { title: 'Comunicados', path: '/announcements', icon: MessageSquare, color: 'orange' }
  ];

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
    green: 'bg-green-50 text-green-600 hover:bg-green-100',
    purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
    orange: 'bg-orange-50 text-orange-600 hover:bg-orange-100'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Ações Rápidas</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <Link
            key={index}
            to={action.path}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${colorClasses[action.color]}`}
          >
            <action.icon className="w-5 h-5" />
            <span className="text-sm font-medium">{action.title}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function CallsChartCard({ callStats }) {
  const total = callStats.answered + callStats.missed + callStats.rejected;
  const answeredPercent = total > 0 ? Math.round((callStats.answered / total) * 100) : 0;
  const missedPercent = total > 0 ? Math.round((callStats.missed / total) * 100) : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Chamadas (Últimos 7 dias)</h3>
        <Link to="/calls" className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1">
          Ver todas <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <PhoneIncoming className="w-4 h-4 text-green-500" />
            <span className="text-2xl font-bold text-slate-800">{callStats.answered}</span>
          </div>
          <p className="text-xs text-slate-500">Atendidas</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <PhoneMissed className="w-4 h-4 text-red-500" />
            <span className="text-2xl font-bold text-slate-800">{callStats.missed}</span>
          </div>
          <p className="text-xs text-slate-500">Perdidas</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Phone className="w-4 h-4 text-orange-500" />
            <span className="text-2xl font-bold text-slate-800">{callStats.rejected}</span>
          </div>
          <p className="text-xs text-slate-500">Rejeitadas</p>
        </div>
      </div>

      {/* Progress bars */}
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-600">Taxa de atendimento</span>
            <span className="font-medium text-green-600">{answeredPercent}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${answeredPercent}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-600">Taxa de perda</span>
            <span className="font-medium text-red-600">{missedPercent}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-red-500 rounded-full transition-all"
              style={{ width: `${missedPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    condominiums: 0,
    blocks: 0,
    units: 0,
    users: 0,
    calls: 0,
    invitations: 0,
    activeInvitations: 0
  });
  const [callStats, setCallStats] = useState({
    answered: 0,
    missed: 0,
    rejected: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Buscar dados para estatísticas
        const [condominiumsRes, usersRes, callsRes, invitationsRes] = await Promise.all([
          api.get('/units/condominiums').catch(() => ({ data: { condominiums: [] } })),
          api.get('/users').catch(() => ({ data: { users: [], pagination: { total: 0 } } })),
          api.get('/calls', { params: { limit: 100 } }).catch(() => ({ data: { calls: [] } })),
          api.get('/invitations/admin', { params: { limit: 100 } }).catch(() => ({ data: { invitations: [], pagination: { total: 0 } } }))
        ]);

        const condominiums = condominiumsRes.data.condominiums || [];
        const totalBlocks = condominiums.reduce((acc, c) => acc + (c._count?.blocks || 0), 0);
        const totalUsers = usersRes.data.pagination?.total || usersRes.data.users?.length || 0;
        const calls = callsRes.data.calls || [];
        const invitations = invitationsRes.data.invitations || [];
        const totalInvitations = invitationsRes.data.pagination?.total || invitations.length;

        // Calcular estatísticas de chamadas dos últimos 7 dias
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentCalls = calls.filter(c => new Date(c.createdAt) >= sevenDaysAgo);
        const answered = recentCalls.filter(c => c.status === 'ANSWERED').length;
        const missed = recentCalls.filter(c => c.status === 'MISSED').length;
        const rejected = recentCalls.filter(c => c.status === 'REJECTED').length;

        setCallStats({ answered, missed, rejected });

        // Convites ativos
        const activeInvitations = invitations.filter(i => i.status === 'ACTIVE').length;

        setStats({
          condominiums: condominiums.length,
          blocks: totalBlocks,
          units: 0,
          users: totalUsers,
          calls: calls.length,
          invitations: totalInvitations,
          activeInvitations
        });

        // Criar atividades recentes
        const activities = [];
        
        // Adicionar chamadas recentes
        calls.slice(0, 3).forEach(call => {
          activities.push({
            type: 'call',
            title: `Chamada ${call.status === 'ANSWERED' ? 'atendida' : call.status === 'MISSED' ? 'perdida' : 'rejeitada'}`,
            time: formatTimeAgo(call.createdAt)
          });
        });

        // Adicionar convites recentes
        invitations.slice(0, 2).forEach(inv => {
          activities.push({
            type: 'invitation',
            title: `Convite para ${inv.visitorName}`,
            time: formatTimeAgo(inv.createdAt)
          });
        });

        // Ordenar por data
        setRecentActivities(activities.slice(0, 5));

      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return `${diffDays}d atrás`;
  };

  return (
    <div>
      <Header title="Dashboard" />
      
      <div className="p-6">
        {/* Welcome Message */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">
            Olá, {user?.name?.split(' ')[0]}! 👋
          </h2>
          <p className="text-slate-500">
            Aqui está o resumo do seu condomínio hoje.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard 
            title="Total de Usuários" 
            value={loading ? '...' : stats.users} 
            icon={Users} 
            color="blue"
            subtitle="Moradores e funcionários"
          />
          <StatCard 
            title="Chamadas Hoje" 
            value={loading ? '...' : callStats.answered + callStats.missed + callStats.rejected} 
            icon={Phone} 
            color="green"
            subtitle="Últimos 7 dias"
          />
          <StatCard 
            title="Convites Ativos" 
            value={loading ? '...' : stats.activeInvitations} 
            icon={Ticket} 
            color="purple"
            subtitle={`${stats.invitations} total`}
          />
          <StatCard 
            title="Condomínios" 
            value={loading ? '...' : stats.condominiums} 
            icon={Building} 
            color="orange"
            subtitle={`${stats.blocks} blocos`}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Calls Chart - Takes 2 columns */}
          <div className="lg:col-span-2">
            <CallsChartCard callStats={callStats} />
          </div>
          
          {/* Quick Actions */}
          <div>
            <QuickActionsCard />
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <RecentActivityCard activities={recentActivities} />
          </div>

          {/* Info Card */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">App Interfone</h3>
            <p className="text-blue-100 text-sm mb-4">
              Sistema completo de comunicação para condomínios. Gerencie chamadas, convites e comunicados em um só lugar.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-blue-100 text-sm">
                <Calendar className="w-4 h-4" />
                <span>Versão 1.0</span>
              </div>
              <div className="flex items-center gap-2 text-blue-100 text-sm">
                <Clock className="w-4 h-4" />
                <span>Atualizado em Jan/2026</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
