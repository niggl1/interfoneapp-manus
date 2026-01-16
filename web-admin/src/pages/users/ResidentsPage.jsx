import { useState, useEffect } from 'react';
import Header from '../../components/layout/Header';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '../../components/ui/Table';
import { Plus, Pencil, Trash2, Phone, Home } from 'lucide-react';
import { getResidents, createUser, updateUser, deleteUser } from '../../services/usersService';
import { getCondominiums, getUnits, getBlocks } from '../../services/unitsService';

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

export default function ResidentsPage() {
  const [residents, setResidents] = useState([]);
  const [condominiums, setCondominiums] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedResident, setSelectedResident] = useState(null);
  const [selectedCondominiumFilter, setSelectedCondominiumFilter] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    condominiumId: '',
    unitId: ''
  });
  const [selectedBlockId, setSelectedBlockId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCondominiums();
  }, []);

  useEffect(() => {
    fetchResidents();
  }, [selectedCondominiumFilter]);

  useEffect(() => {
    if (formData.condominiumId) {
      fetchBlocks(formData.condominiumId);
    } else {
      setBlocks([]);
      setUnits([]);
    }
  }, [formData.condominiumId]);

  const fetchCondominiums = async () => {
    try {
      const data = await getCondominiums();
      setCondominiums(data.condominiums || []);
    } catch (error) {
      console.error('Erro ao buscar condomínios:', error);
    }
  };

  const fetchBlocks = async (condominiumId) => {
    try {
      const data = await getBlocks(condominiumId);
      setBlocks(data.blocks || []);
    } catch (error) {
      console.error('Erro ao buscar blocos:', error);
    }
  };

  const fetchUnits = async (blockId) => {
    try {
      const data = await getUnits(blockId);
      setUnits(data.units || []);
    } catch (error) {
      console.error('Erro ao buscar unidades:', error);
    }
  };

  const fetchResidents = async () => {
    setLoading(true);
    try {
      const data = await getResidents(selectedCondominiumFilter || undefined);
      setResidents(data.residents || []);
    } catch (error) {
      console.error('Erro ao buscar moradores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (resident = null) => {
    if (resident) {
      setSelectedResident(resident);
      setFormData({
        name: resident.name,
        email: resident.email,
        password: '',
        phone: resident.phone || '',
        condominiumId: resident.condominiumId || '',
        unitId: resident.unitId || ''
      });
      if (resident.condominiumId) {
        fetchBlocks(resident.condominiumId);
      }
      if (resident.unit?.blockId) {
        setSelectedBlockId(resident.unit.blockId);
        fetchUnits(resident.unit.blockId);
      }
    } else {
      setSelectedResident(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        condominiumId: selectedCondominiumFilter || (condominiums[0]?.id || ''),
        unitId: ''
      });
      setSelectedBlockId('');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedResident(null);
    setSelectedBlockId('');
    setBlocks([]);
    setUnits([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = {
        ...formData,
        role: 'RESIDENT'
      };
      
      if (!data.phone) delete data.phone;
      if (!data.unitId) delete data.unitId;
      if (!data.password && selectedResident) delete data.password;

      if (selectedResident) {
        await updateUser(selectedResident.id, data);
      } else {
        await createUser(data);
      }
      handleCloseModal();
      fetchResidents();
    } catch (error) {
      console.error('Erro ao salvar morador:', error);
      alert(error.response?.data?.error || 'Erro ao salvar morador');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUser(selectedResident.id);
      setIsDeleteModalOpen(false);
      setSelectedResident(null);
      fetchResidents();
    } catch (error) {
      console.error('Erro ao excluir morador:', error);
      alert(error.response?.data?.error || 'Erro ao excluir morador');
    }
  };

  const handleBlockChange = (blockId) => {
    setSelectedBlockId(blockId);
    setFormData({ ...formData, unitId: '' });
    if (blockId) {
      fetchUnits(blockId);
    } else {
      setUnits([]);
    }
  };

  return (
    <div>
      <Header title="Moradores" />

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
            Novo Morador
          </Button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Morador</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Unidade</TableHead>
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
              ) : residents.length === 0 ? (
                <TableEmpty message="Nenhum morador encontrado" colSpan={5} />
              ) : (
                residents.map((resident) => (
                  <TableRow key={resident.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">
                            {resident.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{resident.name}</p>
                          <p className="text-xs text-slate-500">{resident.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {resident.phone ? (
                        <div className="flex items-center gap-1 text-slate-600">
                          <Phone className="w-3 h-3" />
                          <span className="text-sm">{resident.phone}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {resident.unit ? (
                        <div className="flex items-center gap-1 text-slate-600">
                          <Home className="w-3 h-3" />
                          <span className="text-sm">
                            {resident.unit.block?.name} - Apt. {resident.unit.number}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Não vinculado</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[resident.status]}`}>
                        {statusLabels[resident.status]}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(resident)}
                          className="p-2 text-slate-500 rounded-lg"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedResident(resident);
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
        title={selectedResident ? 'Editar Morador' : 'Novo Morador'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Ex: Maria Santos"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Ex: maria@email.com"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Senha {selectedResident ? '(deixe em branco para manter)' : '*'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="••••••••"
                required={!selectedResident}
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
              Condomínio *
            </label>
            <select
              value={formData.condominiumId}
              onChange={(e) => {
                setFormData({ ...formData, condominiumId: e.target.value, unitId: '' });
                setSelectedBlockId('');
              }}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Bloco
              </label>
              <select
                value={selectedBlockId}
                onChange={(e) => handleBlockChange(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                disabled={!formData.condominiumId}
              >
                <option value="">Selecione um bloco</option>
                {blocks.map((block) => (
                  <option key={block.id} value={block.id}>
                    {block.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Apartamento
              </label>
              <select
                value={formData.unitId}
                onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                disabled={units.length === 0}
              >
                <option value="">Selecione um apartamento</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    Apt. {unit.number}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              {selectedResident ? 'Salvar Alterações' : 'Criar Morador'}
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
          Tem certeza que deseja excluir o morador <strong>{selectedResident?.name}</strong>?
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
