import { useState, useEffect } from 'react';
import { 
  Car, 
  MapPin, 
  Clock, 
  User, 
  Check, 
  X, 
  Navigation,
  Phone,
  Building2,
  RefreshCw
} from 'lucide-react';
import accessService from '../../services/accessService';
import { useCall } from '../../context/CallContext';
import { useAuth } from '../../context/AuthContext';

export default function ArrivalNoticesPage() {
  const { user } = useAuth();
  const { socket } = useCall();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const canManage = ['ADMIN', 'MANAGER', 'JANITOR'].includes(user?.role);

  useEffect(() => {
    fetchNotices();

    // Listener para atualizações em tempo real
    if (socket) {
      socket.on('arrival_notice', handleArrivalUpdate);
      
      return () => {
        socket.off('arrival_notice', handleArrivalUpdate);
      };
    }
  }, [socket]);

  const handleArrivalUpdate = (data) => {
    console.log('Atualização de chegada:', data);
    
    if (data.type === 'new' || data.type === 'location_update') {
      setNotices(prev => {
        const exists = prev.find(n => n.id === data.notice.id);
        if (exists) {
          return prev.map(n => n.id === data.notice.id ? data.notice : n);
        }
        return [data.notice, ...prev];
      });
    } else if (data.type === 'cancelled' || data.type === 'arrived') {
      setNotices(prev => prev.filter(n => n.id !== data.noticeId && n.id !== data.notice?.id));
    }
  };

  const fetchNotices = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await accessService.getActiveArrivalNotices();
      setNotices(data.notices || []);
    } catch (error) {
      console.error('Erro ao buscar avisos:', error);
      if (error.response?.status === 403) {
        setError('Você não tem permissão para ver os avisos de chegada.');
      } else if (error.response?.status === 400) {
        setError('Você precisa estar vinculado a um condomínio.');
      } else {
        setError('Erro ao carregar avisos de chegada.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id) => {
    try {
      await accessService.confirmArrivalNotice(id);
      // A atualização virá via socket
    } catch (error) {
      console.error('Erro ao confirmar:', error);
      alert('Erro ao confirmar aviso');
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      PENDING: { label: 'Aguardando', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
      CONFIRMED: { label: 'Confirmado', color: 'bg-blue-100 text-blue-700', icon: Check },
      ARRIVING_500M: { label: 'A 500m', color: 'bg-orange-100 text-orange-700', icon: Navigation },
      ARRIVING_200M: { label: 'A 200m', color: 'bg-orange-100 text-orange-700', icon: Navigation },
      ARRIVING_50M: { label: 'Chegando!', color: 'bg-green-100 text-green-700', icon: MapPin }
    };
    return statusMap[status] || { label: status, color: 'bg-slate-100 text-slate-700', icon: Clock };
  };

  const getTransportIcon = (type) => {
    switch (type) {
      case 'OWN_VEHICLE':
        return <Car className="w-5 h-5" />;
      case 'UBER_TAXI':
        return <Car className="w-5 h-5" />;
      case 'ON_FOOT':
        return <User className="w-5 h-5" />;
      default:
        return <Navigation className="w-5 h-5" />;
    }
  };

  const getTransportLabel = (type) => {
    const labels = {
      OWN_VEHICLE: 'Veículo próprio',
      UBER_TAXI: 'Uber/Táxi',
      ON_FOOT: 'A pé',
      OTHER: 'Outro'
    };
    return labels[type] || type;
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  if (!canManage) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <p className="text-yellow-700">
            Apenas porteiros, zeladores e administradores podem ver os avisos de chegada.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Avisos de Chegada</h1>
          <p className="text-slate-500 mt-1">
            Moradores a caminho do condomínio
          </p>
        </div>
        
        <button
          onClick={fetchNotices}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Notices List */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-500">Carregando...</p>
        </div>
      ) : notices.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <Car className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Nenhum morador a caminho no momento</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {notices.map((notice) => {
            const statusInfo = getStatusInfo(notice.status);
            const StatusIcon = statusInfo.icon;
            
            return (
              <div
                key={notice.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
              >
                {/* Status Bar */}
                <div className={`px-4 py-2 flex items-center justify-between ${statusInfo.color}`}>
                  <div className="flex items-center gap-2">
                    <StatusIcon className="w-4 h-4" />
                    <span className="font-medium text-sm">{statusInfo.label}</span>
                  </div>
                  <span className="text-xs opacity-75">{formatTime(notice.createdAt)}</span>
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* User Info */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      {notice.user?.avatar ? (
                        <img 
                          src={notice.user.avatar} 
                          alt={notice.user.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-bold text-lg">
                          {notice.user?.name?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{notice.user?.name}</p>
                      {notice.user?.unit && (
                        <p className="text-sm text-slate-500">
                          {notice.user.unit.block?.name} - Apt. {notice.user.unit.number}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Transport Info */}
                  <div className="bg-slate-50 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-slate-600 mb-2">
                      {getTransportIcon(notice.transportType)}
                      <span className="text-sm font-medium">{getTransportLabel(notice.transportType)}</span>
                    </div>
                    
                    {notice.transportType === 'OWN_VEHICLE' && notice.vehicle && (
                      <div className="text-sm text-slate-500">
                        <p><strong>Placa:</strong> {notice.vehicle.plate}</p>
                        <p><strong>Veículo:</strong> {notice.vehicle.model} {notice.vehicle.color && `(${notice.vehicle.color})`}</p>
                      </div>
                    )}
                    
                    {notice.transportType === 'UBER_TAXI' && (
                      <div className="text-sm text-slate-500">
                        {notice.rideVehiclePlate && <p><strong>Placa:</strong> {notice.rideVehiclePlate}</p>}
                        {notice.rideVehicleModel && <p><strong>Veículo:</strong> {notice.rideVehicleModel}</p>}
                        {notice.rideDriverName && <p><strong>Motorista:</strong> {notice.rideDriverName}</p>}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {notice.status === 'PENDING' && (
                    <button
                      onClick={() => handleConfirm(notice.id)}
                      className="w-full py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Confirmar Recebimento
                    </button>
                  )}

                  {notice.user?.phone && (
                    <a
                      href={`tel:${notice.user.phone}`}
                      className="mt-2 w-full py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                    >
                      <Phone className="w-4 h-4" />
                      Ligar
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
