import { useState, useEffect } from 'react';
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Clock, User, Video, Mic, Calendar, Download, FileText, FileSpreadsheet, Filter } from 'lucide-react';
import callsService from '../../services/callsService';
import { useCall } from '../../context/CallContext';
import { exportToCSV, exportToPDF, formatDate as formatDateUtil, formatCallStatus } from '../../utils/exportUtils';

export default function CallHistoryPage() {
  const { isConnected } = useCall();
  const [calls, setCalls] = useState([]);
  const [allCalls, setAllCalls] = useState([]); // Para exportação
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filter, setFilter] = useState('all'); // all, made, received, missed
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  useEffect(() => {
    fetchCalls();
  }, [filter, dateFilter, startDate, endDate, pagination.page]);

  const getDateRange = () => {
    const now = new Date();
    let start = null;
    let end = null;

    switch (dateFilter) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'week':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        end = now;
        break;
      case 'month':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        end = now;
        break;
      case 'custom':
        if (startDate) start = new Date(startDate);
        if (endDate) end = new Date(endDate + 'T23:59:59');
        break;
      default:
        break;
    }

    return { start, end };
  };

  const fetchCalls = async () => {
    setLoading(true);
    try {
      const type = filter === 'all' ? null : filter;
      const { start, end } = getDateRange();
      
      const data = await callsService.getCallHistory(pagination.page, 20, type, start, end);
      setCalls(data.calls || []);
      setPagination(prev => ({
        ...prev,
        totalPages: data.pagination?.totalPages || 1
      }));
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      setCalls([]);
    } finally {
      setLoading(false);
    }
  };

  // Buscar todos os dados para exportação
  const fetchAllForExport = async () => {
    setExporting(true);
    try {
      const type = filter === 'all' ? null : filter;
      const { start, end } = getDateRange();
      const data = await callsService.getCallHistory(1, 1000, type, start, end);
      return data.calls || [];
    } catch (error) {
      console.error('Erro ao buscar dados para exportação:', error);
      return calls;
    } finally {
      setExporting(false);
    }
  };

  const handleExportCSV = async () => {
    const dataToExport = await fetchAllForExport();
    
    const columns = [
      { key: 'callerName', label: 'Chamador' },
      { key: 'receiverName', label: 'Receptor' },
      { key: 'type', label: 'Tipo' },
      { key: 'statusFormatted', label: 'Status' },
      { key: 'duration', label: 'Duração (s)' },
      { key: 'startedAtFormatted', label: 'Data/Hora' }
    ];

    const formattedData = dataToExport.map(call => ({
      ...call,
      callerName: call.caller?.name || call.callerName || 'Visitante',
      receiverName: call.receiver?.name || '-',
      statusFormatted: formatCallStatus(call.status),
      startedAtFormatted: formatDateUtil(call.startedAt)
    }));

    exportToCSV(formattedData, columns, `chamadas_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportPDF = async () => {
    const dataToExport = await fetchAllForExport();
    
    const columns = [
      { key: 'callerName', label: 'Chamador' },
      { key: 'receiverName', label: 'Receptor' },
      { key: 'type', label: 'Tipo' },
      { key: 'statusFormatted', label: 'Status' },
      { key: 'durationFormatted', label: 'Duração' },
      { key: 'startedAtFormatted', label: 'Data/Hora' }
    ];

    const formattedData = dataToExport.map(call => ({
      ...call,
      callerName: call.caller?.name || call.callerName || 'Visitante',
      receiverName: call.receiver?.name || '-',
      statusFormatted: formatCallStatus(call.status),
      durationFormatted: call.duration ? `${Math.floor(call.duration / 60)}:${(call.duration % 60).toString().padStart(2, '0')}` : '-',
      startedAtFormatted: formatDateUtil(call.startedAt)
    }));

    exportToPDF(formattedData, columns, 'Relatório de Chamadas', `chamadas_${new Date().toISOString().split('T')[0]}`);
  };

  const handleDateFilterChange = (value) => {
    setDateFilter(value);
    if (value !== 'custom') {
      setStartDate('');
      setEndDate('');
      setShowDatePicker(false);
    } else {
      setShowDatePicker(true);
    }
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getCallIcon = (call) => {
    if (call.status === 'MISSED') {
      return <PhoneMissed className="w-5 h-5 text-red-500" />;
    }
    if (call.callerId === call.receiver?.id) {
      return <PhoneOutgoing className="w-5 h-5 text-blue-500" />;
    }
    return <PhoneIncoming className="w-5 h-5 text-green-500" />;
  };

  const getStatusBadge = (status) => {
    const styles = {
      ANSWERED: 'bg-green-100 text-green-700',
      MISSED: 'bg-red-100 text-red-700',
      REJECTED: 'bg-orange-100 text-orange-700',
      ENDED: 'bg-slate-100 text-slate-700',
      RINGING: 'bg-blue-100 text-blue-700'
    };

    const labels = {
      ANSWERED: 'Atendida',
      MISSED: 'Perdida',
      REJECTED: 'Rejeitada',
      ENDED: 'Encerrada',
      RINGING: 'Chamando'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-slate-100 text-slate-700'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    // Menos de 24 horas
    if (diff < 86400000) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    
    // Menos de 7 dias
    if (diff < 604800000) {
      return date.toLocaleDateString('pt-BR', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    }
    
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Histórico de Chamadas</h1>
          <p className="text-slate-500 mt-1">
            Visualize todas as chamadas recebidas e realizadas
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={exporting || loading}
              className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              title="Exportar para Excel (CSV)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Excel</span>
            </button>
            <button
              onClick={handleExportPDF}
              disabled={exporting || loading}
              className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              title="Exportar para PDF"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>

          {/* Connection Status */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isConnected ? 'bg-green-100' : 'bg-red-100'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className={`text-sm font-medium ${isConnected ? 'text-green-700' : 'text-red-700'}`}>
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Status Filter */}
        <div className="flex gap-2">
          {[
            { value: 'all', label: 'Todas' },
            { value: 'received', label: 'Recebidas' },
            { value: 'made', label: 'Realizadas' },
            { value: 'missed', label: 'Perdidas' }
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => {
                setFilter(value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === value
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={dateFilter}
            onChange={(e) => handleDateFilterChange(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todo período</option>
            <option value="today">Hoje</option>
            <option value="week">Última semana</option>
            <option value="month">Último mês</option>
            <option value="custom">Período personalizado</option>
          </select>
        </div>

        {/* Custom Date Range */}
        {showDatePicker && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Data inicial"
            />
            <span className="text-slate-400">até</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Data final"
            />
          </div>
        )}
      </div>

      {/* Active Filters Badge */}
      {(dateFilter !== 'all' || filter !== 'all') && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-slate-500">Filtros ativos:</span>
          {filter !== 'all' && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
              {filter === 'received' ? 'Recebidas' : filter === 'made' ? 'Realizadas' : 'Perdidas'}
            </span>
          )}
          {dateFilter !== 'all' && (
            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
              {dateFilter === 'today' ? 'Hoje' : 
               dateFilter === 'week' ? 'Última semana' : 
               dateFilter === 'month' ? 'Último mês' : 
               `${startDate || '...'} - ${endDate || '...'}`}
            </span>
          )}
          <button
            onClick={() => {
              setFilter('all');
              setDateFilter('all');
              setStartDate('');
              setEndDate('');
              setShowDatePicker(false);
            }}
            className="text-xs text-slate-500 hover:text-slate-700 underline"
          >
            Limpar filtros
          </button>
        </div>
      )}

      {/* Call List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slate-500">Carregando...</p>
          </div>
        ) : calls.length === 0 ? (
          <div className="p-8 text-center">
            <Phone className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Nenhuma chamada encontrada</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {calls.map((call) => (
              <div key={call.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                    {getCallIcon(call)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-800 truncate">
                        {call.caller?.name || call.callerName || 'Visitante'}
                      </p>
                      {call.callerType === 'visitor' && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                          Visitante
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        {call.type === 'VIDEO' ? (
                          <Video className="w-3 h-3" />
                        ) : (
                          <Mic className="w-3 h-3" />
                        )}
                        {call.type === 'VIDEO' ? 'Vídeo' : 'Áudio'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(call.duration)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(call.startedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    {getStatusBadge(call.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-center gap-2">
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
    </div>
  );
}
