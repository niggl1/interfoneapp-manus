import { useState, useEffect } from 'react';
import { Ticket, Calendar, User, Clock, CheckCircle, XCircle, AlertCircle, Search, Filter, Building2 } from 'lucide-react';
import invitationsService from '../../services/invitationsService';
import { useAuth } from '../../context/AuthContext';

export default function InvitationsPage() {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filter, setFilter] = useState('all'); // all, active, used, expired, cancelled
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInvitations();
  }, [pagination.page, filter]);

  const fetchInvitations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await invitationsService.getAllInvitations(pagination.page, 20, filter !== 'all' ? filter : undefined);
      setInvitations(data.invitations || []);
      setPagination(prev => ({
        ...prev,
        totalPages: data.pagination?.totalPages || 1,
        total: data.pagination?.total || 0
      }));
    } catch (error) {
      console.error('Erro ao buscar convites:', error);
      if (error.response?.status === 400) {
        setError('Você precisa estar vinculado a um condomínio para ver os convites.');
      } else if (error.response?.status === 403) {
        setError('Você não tem permissão para visualizar os convites.');
      } else {
        setError('Erro ao carregar convites.');
      }
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvitation = async (id) => {
    if (!confirm('Tem certeza que deseja cancelar este convite?')) return;

    try {
      await invitationsService.cancelInvitation(id);
      fetchInvitations();
    } catch (error) {
      console.error('Erro ao cancelar convite:', error);
      alert(error.response?.data?.error || 'Erro ao cancelar convite');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      ACTIVE: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Ativo' },
      USED: { color: 'bg-blue-100 text-blue-700', icon: CheckCircle, label: 'Utilizado' },
      EXPIRED: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Expirado' },
      CANCELLED: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Cancelado' }
    };
    const badge = badges[status] || badges.ACTIVE;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3.5 h-3.5" />
        {badge.label}
      </span>
    );
  };

  const filteredInvitations = invitations.filter(inv => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      inv.visitorName?.toLowerCase().includes(search) ||
      inv.code?.toLowerCase().includes(search) ||
      inv.host?.name?.toLowerCase().includes(search)
    );
  });

  const stats = {
    total: pagination.total,
    active: invitations.filter(i => i.status === 'ACTIVE').length,
    used: invitations.filter(i => i.status === 'USED').length,
    expired: invitations.filter(i => i.status === 'EXPIRED').length
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Convites</h1>
          <p className="text-slate-500 mt-1">
            Gerencie os convites de visitantes do condomínio
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Ticket className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total</p>
              <p className="text-xl font-bold text-slate-800">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Ativos</p>
              <p className="text-xl font-bold text-green-600">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Utilizados</p>
              <p className="text-xl font-bold text-blue-600">{stats.used}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Expirados</p>
              <p className="text-xl font-bold text-yellow-600">{stats.expired}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por visitante, código ou morador..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              <option value="ACTIVE">Ativos</option>
              <option value="USED">Utilizados</option>
              <option value="EXPIRED">Expirados</option>
              <option value="CANCELLED">Cancelados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800">Atenção</h3>
              <p className="text-yellow-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Invitations List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slate-500">Carregando...</p>
          </div>
        ) : filteredInvitations.length === 0 && !error ? (
          <div className="p-8 text-center">
            <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Nenhum convite encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Código</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Visitante</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Morador</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Unidade</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Validade</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvitations.map((invitation) => (
                  <tr key={invitation.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <code className="px-2 py-1 bg-slate-100 rounded text-sm font-mono">
                        {invitation.code}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-800">{invitation.visitorName}</p>
                        {invitation.visitorPhone && (
                          <p className="text-sm text-slate-500">{invitation.visitorPhone}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-800">{invitation.host?.name || '-'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-slate-600">
                        <Building2 className="w-4 h-4" />
                        <span>
                          {invitation.host?.unit?.block?.name} - {invitation.host?.unit?.number}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <p className="text-slate-800">{formatDate(invitation.validFrom)}</p>
                        <p className="text-slate-500">até {formatDate(invitation.validUntil)}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(invitation.status)}
                      {invitation.usedCount > 0 && (
                        <p className="text-xs text-slate-500 mt-1">
                          Usado {invitation.usedCount}x de {invitation.maxUses}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {invitation.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleCancelInvitation(invitation.id)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1}
            className="px-3 py-1 rounded border border-slate-200 text-sm disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm text-slate-500">
            Página {pagination.page} de {pagination.totalPages}
          </span>
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page === pagination.totalPages}
            className="px-3 py-1 rounded border border-slate-200 text-sm disabled:opacity-50"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
