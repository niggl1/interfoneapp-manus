import { useEffect, useState } from 'react';
import Header from '../components/layout/Header';
import { Building, Users, Home, Phone } from 'lucide-react';
import api from '../services/api';

function StatCard({ title, value, icon: Icon, color }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600'
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-800">{value}</p>
        </div>
        <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[color]} rounded-xl flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    condominiums: 0,
    blocks: 0,
    units: 0,
    users: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Buscar dados para estatísticas
        const [condominiumsRes, usersRes] = await Promise.all([
          api.get('/units/condominiums').catch(() => ({ data: { condominiums: [] } })),
          api.get('/users').catch(() => ({ data: { users: [], pagination: { total: 0 } } }))
        ]);

        const condominiums = condominiumsRes.data.condominiums || [];
        const totalBlocks = condominiums.reduce((acc, c) => acc + (c._count?.blocks || 0), 0);
        const totalUsers = usersRes.data.pagination?.total || usersRes.data.users?.length || 0;

        setStats({
          condominiums: condominiums.length,
          blocks: totalBlocks,
          units: 0, // Será calculado quando tivermos os blocos
          users: totalUsers
        });
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <Header title="Dashboard" />
      
      <div className="p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Condomínios" 
            value={loading ? '...' : stats.condominiums} 
            icon={Building} 
            color="blue" 
          />
          <StatCard 
            title="Blocos" 
            value={loading ? '...' : stats.blocks} 
            icon={Building} 
            color="green" 
          />
          <StatCard 
            title="Apartamentos" 
            value={loading ? '...' : stats.units} 
            icon={Home} 
            color="purple" 
          />
          <StatCard 
            title="Usuários" 
            value={loading ? '...' : stats.users} 
            icon={Users} 
            color="orange" 
          />
        </div>

        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-2">Bem-vindo ao InterfoneApp Admin</h2>
          <p className="text-blue-100 mb-4">
            Gerencie seu condomínio de forma simples e eficiente. Use o menu lateral para navegar entre as opções.
          </p>
          <div className="flex gap-4">
            <div className="bg-white/20 rounded-lg px-4 py-2">
              <p className="text-sm text-blue-100">Fase 1</p>
              <p className="font-semibold">Comunicação</p>
            </div>
            <div className="bg-white/10 rounded-lg px-4 py-2 opacity-50">
              <p className="text-sm text-blue-100">Fase 2</p>
              <p className="font-semibold">IoT (Em breve)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
