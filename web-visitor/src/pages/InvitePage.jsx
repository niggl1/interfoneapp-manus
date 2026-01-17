import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaUser, FaBuilding, FaPhone, FaVideo, FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';
import api from '../services/api';

function InvitePage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [using, setUsing] = useState(false);
  const [visitorName, setVisitorName] = useState('');

  useEffect(() => {
    loadInvitation();
  }, [code]);

  const loadInvitation = async () => {
    try {
      const response = await api.get(`/invitations/code/${code}`);
      setInvitation(response.data.invitation);
      setVisitorName(response.data.invitation.visitorName || '');
    } catch (err) {
      console.error('Erro ao carregar convite:', err);
      if (err.response?.status === 404) {
        setError('Convite não encontrado');
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Erro ao carregar convite');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUseInvitation = async () => {
    if (!visitorName.trim()) {
      alert('Por favor, informe seu nome');
      return;
    }

    setUsing(true);
    try {
      const response = await api.post(`/invitations/code/${code}/use`, {
        visitorName: visitorName.trim(),
      });

      // Navegar para a tela de chamada
      if (response.data.invitation?.host?.id) {
        navigate(`/call/${response.data.invitation.host.id}`, {
          state: {
            visitorName: visitorName.trim(),
            invitationCode: code,
            hostName: response.data.invitation.host.name,
            unitInfo: response.data.invitation.host.unit,
          },
        });
      }
    } catch (err) {
      console.error('Erro ao usar convite:', err);
      alert(err.response?.data?.error || 'Erro ao usar convite');
    } finally {
      setUsing(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'ACTIVE':
        return { text: 'Ativo', color: '#22C55E', icon: FaCheckCircle };
      case 'USED':
        return { text: 'Utilizado', color: '#3B82F6', icon: FaCheckCircle };
      case 'EXPIRED':
        return { text: 'Expirado', color: '#F59E0B', icon: FaClock };
      case 'CANCELLED':
        return { text: 'Cancelado', color: '#EF4444', icon: FaTimesCircle };
      default:
        return { text: status, color: '#6B7280', icon: FaClock };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Carregando convite...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaTimesCircle className="text-red-500 text-3xl" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Convite Inválido</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  const statusInfo = getStatusInfo(invitation.status);
  const StatusIcon = statusInfo.icon;
  const isActive = invitation.status === 'ACTIVE';
  const unit = invitation.host?.unit;
  const condominium = unit?.block?.condominium;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaUser className="text-blue-600 text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Convite de Acesso</h1>
          <div 
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full mt-2"
            style={{ backgroundColor: statusInfo.color + '20', color: statusInfo.color }}
          >
            <StatusIcon className="text-sm" />
            <span className="text-sm font-medium">{statusInfo.text}</span>
          </div>
        </div>

        {/* Invitation Info */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <FaBuilding className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Condomínio</p>
                <p className="font-medium text-gray-800">{condominium?.name || 'Não informado'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <FaUser className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Anfitrião</p>
                <p className="font-medium text-gray-800">
                  {invitation.host?.name || 'Não informado'}
                  {unit && ` - ${unit.block?.name || ''} ${unit.number}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <FaClock className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Válido até</p>
                <p className="font-medium text-gray-800">{formatDate(invitation.validUntil)}</p>
              </div>
            </div>

            {invitation.notes && (
              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-500">Observações</p>
                <p className="text-gray-700">{invitation.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Section */}
        {isActive ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seu nome
              </label>
              <input
                type="text"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                placeholder="Digite seu nome completo"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <button
              onClick={handleUseInvitation}
              disabled={using || !visitorName.trim()}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {using ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Conectando...</span>
                </>
              ) : (
                <>
                  <FaVideo />
                  <span>Fazer Chamada de Vídeo</span>
                </>
              )}
            </button>

            <p className="text-center text-sm text-gray-500">
              Ao clicar, você iniciará uma chamada de vídeo com o morador
            </p>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-4">
              {invitation.status === 'EXPIRED' && 'Este convite expirou.'}
              {invitation.status === 'USED' && 'Este convite já foi utilizado.'}
              {invitation.status === 'CANCELLED' && 'Este convite foi cancelado.'}
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition"
            >
              Voltar ao Início
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default InvitePage;
