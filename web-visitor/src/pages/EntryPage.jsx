import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, Search, Phone, User, Home, Loader2, AlertCircle, MessageCircle } from 'lucide-react';
import { visitorApi } from '../services/api';

export default function EntryPage() {
  const { qrCode } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataType, setDataType] = useState(null); // 'unit' or 'condominium'
  const [unitInfo, setUnitInfo] = useState(null);
  const [condominiumInfo, setCondominiumInfo] = useState(null);
  const [residents, setResidents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState('list'); // 'list' or 'search'
  const [visitorName, setVisitorName] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [selectedResident, setSelectedResident] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [actionType, setActionType] = useState(null); // 'call' or 'chat'
  const [creatingChat, setCreatingChat] = useState(false);

  useEffect(() => {
    if (qrCode) {
      fetchQRCodeInfo();
    }
  }, [qrCode]);

  const fetchQRCodeInfo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await visitorApi.getUnitByQRCode(qrCode);
      
      if (data.type === 'unit') {
        setDataType('unit');
        setUnitInfo(data.data);
        setResidents(data.data.residents || []);
      } else if (data.type === 'condominium') {
        setDataType('condominium');
        setCondominiumInfo(data.data);
      }
    } catch (err) {
      console.error('Erro ao buscar informações:', err);
      setError('QR Code não encontrado ou inválido');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBlock = (block) => {
    setSelectedBlock(block);
  };

  const handleSelectUnit = async (unit) => {
    setSelectedUnit(unit);
    setResidents(unit.residents || []);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      // Buscar em todas as unidades do condomínio
      // Por enquanto, filtrar localmente
      if (condominiumInfo) {
        const allResidents = [];
        condominiumInfo.blocks?.forEach(block => {
          block.units?.forEach(unit => {
            unit.residents?.forEach(resident => {
              if (resident.name.toLowerCase().includes(searchQuery.toLowerCase())) {
                allResidents.push({
                  ...resident,
                  unit: {
                    ...unit,
                    block: { name: block.name }
                  }
                });
              }
            });
          });
        });
        setResidents(allResidents);
      }
    } catch (err) {
      console.error('Erro na busca:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResident = (resident, action = 'call') => {
    setSelectedResident(resident);
    setActionType(action);
    setShowNameModal(true);
  };

  const handleCall = () => {
    if (!visitorName.trim()) return;
    
    navigate(`/call/${selectedResident.id}`, {
      state: {
        resident: selectedResident,
        visitorName: visitorName.trim(),
        unitInfo: selectedUnit || unitInfo
      }
    });
  };

  const handleChat = async () => {
    if (!visitorName.trim()) return;
    
    setCreatingChat(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://interfoneapp-api.onrender.com';
      const response = await fetch(`${API_URL}/api/v1/chat/visitor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          visitorName: visitorName.trim(),
          residentId: selectedResident.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar chat');
      }

      const data = await response.json();
      
      navigate(`/chat/${data.chatRoom.id}`, {
        state: {
          resident: selectedResident,
          visitorName: visitorName.trim(),
          chatRoom: data.chatRoom,
        }
      });
    } catch (err) {
      console.error('Erro ao criar chat:', err);
      alert('Erro ao iniciar chat. Tente novamente.');
    } finally {
      setCreatingChat(false);
    }
  };

  const handleAction = () => {
    if (actionType === 'chat') {
      handleChat();
    } else {
      handleCall();
    }
  };

  const handleBack = () => {
    if (selectedUnit) {
      setSelectedUnit(null);
      setResidents([]);
    } else if (selectedBlock) {
      setSelectedBlock(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">QR Code Inválido</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="py-3 px-6 bg-gradient-primary text-white rounded-xl font-medium"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  // Renderizar seleção de bloco (quando QR é do condomínio)
  if (dataType === 'condominium' && !selectedBlock) {
    return (
      <div className="min-h-screen bg-gradient-dark">
        {/* Header */}
        <div className="bg-gradient-primary p-6 pb-20 rounded-b-3xl">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-white text-xl font-bold text-center">
            {condominiumInfo?.name || 'Condomínio'}
          </h1>
          <p className="text-blue-100 text-center mt-1">
            Selecione o bloco
          </p>
        </div>

        {/* Content */}
        <div className="px-4 -mt-12">
          <div className="bg-white rounded-2xl shadow-xl p-6 animate-fade-in">
            <h2 className="text-sm font-medium text-slate-500 mb-3">Blocos disponíveis</h2>
            
            <div className="space-y-3">
              {condominiumInfo?.blocks?.map((block) => (
                <button
                  key={block.id}
                  onClick={() => handleSelectBlock(block)}
                  className="w-full flex items-center gap-4 p-4 bg-slate-50 rounded-xl transition-colors active:bg-slate-100"
                >
                  <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-slate-800">{block.name}</p>
                    <p className="text-sm text-slate-500">
                      {block.units?.length || 0} unidades
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar seleção de unidade (quando bloco foi selecionado)
  if (dataType === 'condominium' && selectedBlock && !selectedUnit) {
    return (
      <div className="min-h-screen bg-gradient-dark">
        {/* Header */}
        <div className="bg-gradient-primary p-6 pb-20 rounded-b-3xl">
          <button
            onClick={handleBack}
            className="text-white/80 text-sm mb-4"
          >
            ← Voltar
          </button>
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-white text-xl font-bold text-center">
            {selectedBlock.name}
          </h1>
          <p className="text-blue-100 text-center mt-1">
            Selecione o apartamento
          </p>
        </div>

        {/* Content */}
        <div className="px-4 -mt-12">
          <div className="bg-white rounded-2xl shadow-xl p-6 animate-fade-in">
            <h2 className="text-sm font-medium text-slate-500 mb-3">Apartamentos</h2>
            
            <div className="grid grid-cols-3 gap-3">
              {selectedBlock.units?.map((unit) => (
                <button
                  key={unit.id}
                  onClick={() => handleSelectUnit(unit)}
                  className="p-4 bg-slate-50 rounded-xl transition-colors active:bg-slate-100 text-center"
                >
                  <p className="font-bold text-slate-800 text-lg">{unit.number}</p>
                  <p className="text-xs text-slate-500">
                    {unit.residents?.length || 0} morador(es)
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar lista de moradores (quando unidade foi selecionada ou QR é da unidade)
  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Header */}
      <div className="bg-gradient-primary p-6 pb-20 rounded-b-3xl">
        {(selectedUnit || selectedBlock) && (
          <button
            onClick={handleBack}
            className="text-white/80 text-sm mb-4"
          >
            ← Voltar
          </button>
        )}
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
        </div>
        <h1 className="text-white text-xl font-bold text-center">
          {condominiumInfo?.name || unitInfo?.block?.condominium?.name || 'Condomínio'}
        </h1>
        <p className="text-blue-100 text-center mt-1">
          {selectedBlock?.name || unitInfo?.block?.name} - Apt. {selectedUnit?.number || unitInfo?.number}
        </p>
      </div>

      {/* Content */}
      <div className="px-4 -mt-12">
        <div className="bg-white rounded-2xl shadow-xl p-6 animate-fade-in">
          {/* Toggle */}
          <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
            <button
              onClick={() => setSearchMode('list')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                searchMode === 'list'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              Moradores
            </button>
            <button
              onClick={() => setSearchMode('search')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                searchMode === 'search'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              Buscar
            </button>
          </div>

          {/* Search Mode */}
          {searchMode === 'search' && (
            <div className="mb-6">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Nome do morador"
                    className="w-full pl-10 pr-4 py-3 bg-slate-100 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="bg-gradient-primary text-white px-4 rounded-xl"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Residents List */}
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-slate-500 mb-3">
              {searchMode === 'list' ? 'Moradores desta unidade' : 'Resultados'}
            </h2>
            
            {residents.length === 0 ? (
              <div className="text-center py-8">
                <User className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500">Nenhum morador encontrado</p>
              </div>
            ) : (
              residents.map((resident) => (
                <div
                  key={resident.id}
                  className="w-full flex items-center gap-4 p-4 bg-slate-50 rounded-xl"
                >
                  <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-lg">
                      {resident.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-slate-800">{resident.name}</p>
                    {resident.unit && (
                      <p className="text-sm text-slate-500">
                        {resident.unit.block?.name} - Apt. {resident.unit.number}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSelectResident(resident, 'chat')}
                      className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center transition-colors active:bg-blue-200"
                      title="Enviar mensagem"
                    >
                      <MessageCircle className="w-5 h-5 text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleSelectResident(resident, 'call')}
                      className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center transition-colors active:bg-green-200"
                      title="Ligar"
                    >
                      <Phone className="w-5 h-5 text-green-600" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Call Janitor */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <button
              onClick={() => handleSelectResident({ id: 'janitor', name: 'Zelador', role: 'JANITOR' })}
              className="w-full flex items-center gap-4 p-4 bg-orange-50 rounded-xl transition-colors active:bg-orange-100"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-slate-800">Ligar para Zelador</p>
                <p className="text-sm text-slate-500">Portaria / Emergência</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Phone className="w-5 h-5 text-orange-600" />
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-sm mt-6 pb-6">
          App Interfone © {new Date().getFullYear()}
        </p>
      </div>

      {/* Name Modal */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-fade-in">
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              Identificação
            </h2>
            <p className="text-slate-600 mb-6">
              Por favor, informe seu nome para que o morador saiba quem {actionType === 'chat' ? 'está enviando mensagem' : 'está ligando'}.
            </p>
            
            <input
              type="text"
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              placeholder="Seu nome"
              autoFocus
              className="w-full px-4 py-3 bg-slate-100 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowNameModal(false);
                  setSelectedResident(null);
                  setVisitorName('');
                  setActionType(null);
                }}
                className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 rounded-xl font-medium"
                disabled={creatingChat}
              >
                Cancelar
              </button>
              <button
                onClick={handleAction}
                disabled={!visitorName.trim() || creatingChat}
                className={`flex-1 py-3 px-4 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2 ${
                  actionType === 'chat' ? 'bg-blue-600' : 'bg-gradient-primary'
                }`}
              >
                {creatingChat ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Iniciando...
                  </>
                ) : actionType === 'chat' ? (
                  <>
                    <MessageCircle className="w-5 h-5" />
                    Enviar Mensagem
                  </>
                ) : (
                  <>
                    <Phone className="w-5 h-5" />
                    Ligar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
