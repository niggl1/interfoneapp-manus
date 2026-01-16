import { useState, useEffect } from 'react';
import Header from '../../components/layout/Header';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '../../components/ui/Table';
import { Plus, Pencil, Trash2, Phone, Wrench } from 'lucide-react';
import { getJanitors, createUser, updateUser, deleteUser } from '../../services/usersService';
import { getCondominiums } from '../../services/unitsService';

const statusLabels = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  PENDING: 'Pendente'
};

const statusColors = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  INACTIVE: 'bg-slate-100 text-slate-700',
  PENDING: 'bg-amber-100 text-amber-700'
};

export default function JanitorsPage() {
  const [janitors, setJanitors] = useState([]);
  const [condominiums, setCondominiums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedJanitor, setSelectedJanitor] = useState(null);
  const [selectedCondominiumFilter, setSelectedCondominiumFilter] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    condominiumId: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCondominiums();
  }, []);

  useEffect(() => {
    fetchJanitors();
  }, [selectedCondominiumFilter]);

  const fetchCondominiums = async () => {
    try {
      const data = await getCondominiums();
      setCondominiums(data.condominiums || []);
    } catch (error) {
      console.error('Erro ao buscar condomínios:', error);
    }
  };

  const fetchJanitors = async () => {
    setLoading(true);
    try {
      const data = await getJanitors(selectedCondominiumFilter || undefined);
      setJanitors(data.janitors || []);
    } catch (error) {
      console.error('Erro ao buscar zeladores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (janitor = null) => {
    if (janitor) {
      setSelectedJanitor(janitor);
      setFormData({
        name: janitor.name,
        email: janitor.email,
        password: '',
        phone: janitor.phone || '',
        condominiumId: janitor.condominiumId || ''
      });
    } else {
      setSelectedJanitor(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        condominiumId: selectedCondominiumFilter || (condominiums[0]?.id || '')
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedJanitor(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = {
        ...formData,
        role: 'JANITOR'
      };
      
      if (!data.phone) delete data.phone;
      if (!data.password && selectedJanitor) delete data.password;

      if (selectedJanitor) {
        await updateUser(selectedJanitor.id, data);
      } else {
        await createUser(data);
      }
      handleCloseModal();
      fetchJanitors();
    } catch (error) {
      console.error('Erro ao salvar zelador:', error);
      alert(error.response?.data?.error || 'Erro ao salvar zelador');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUser(selectedJanitor.id);
      setIsDeleteModalOpen(false);
      setSelectedJanitor(null);
      fetchJanitors();
    } catch (error) {
      console.error('Erro ao excluir zelador:', error);
      alert(error.response?.data?.error || 'Erro ao excluir zelador');
    }
  };

  return (
    <div>
      <Header title="Zeladores" />

      <div className="p-6">
        {/* Filters and Actions */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <select
              value={selectedCondominiumFilter}
              onChange={(e) => setSelectedCondominiumFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">Todos os Condomínios</option>
              {condominiums.map((cond) => (
                <option key={cond.id} value={cond.id}>
                  {cond.name}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Zelador
          </Button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zelador</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Condomínio</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : janitors.length === 0 ? (
                <TableEmpty message="Nenhum zelador encontrado" colSpan={5} />
              ) : (
                janitors.map((janitor) => (
                  <TableRow key={janitor.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                          <Wrench className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{janitor.name}</p>
                          <p className="text-xs text-slate-500">{janitor.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {janitor.phone ? (
                        <div className="flex items-center gap-1 text-slate-600">
                          <Phone className="w-3 h-3" />
                          <span className="text-sm">{janitor.phone}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {janitor.condominium?.name || (
                        <span className="text-slate-400">Não vinculado</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[janitor.status]}`}>
                        {statusLabels[janitor.status]}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(janitor)}
                          className="p-2 text-slate-500 rounded-lg"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedJanitor(janitor);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-2 text-red-500 rounded-lg"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal de Criação/Edição */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedJanitor ? 'Editar Zelador' : 'Novo Zelador'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nome Completo *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Ex: José da Silva"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Ex: jose@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Telefone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Ex: (11) 99999-9999"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Senha {selectedJanitor ? '(deixe em branco para manter)' : '*'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="••••••••"
              required={!selectedJanitor}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Condomínio *
            </label>
            <select
              value={formData.condominiumId}
              onChange={(e) => setFormData({ ...formData, condominiumId: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            >
              <option value="">Selecione um condomínio</option>
              {condominiums.map((cond) => (
                <option key={cond.id} value={cond.id}>
                  {cond.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              {selectedJanitor ? 'Salvar Alterações' : 'Criar Zelador'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Exclusão"
        size="sm"
      >
        <p className="text-slate-600 mb-6">
          Tem certeza que deseja excluir o zelador <strong>{selectedJanitor?.name}</strong>?
          Esta ação não pode ser desfeita.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Excluir
          </Button>
        </div>
      </Modal>
    </div>
  );
}
