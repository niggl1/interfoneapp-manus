import { useState, useEffect } from 'react';
import Header from '../../components/layout/Header';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '../../components/ui/Table';
import { Plus, Pencil, Trash2, User, Mail, Phone, Shield } from 'lucide-react';
import { getUsers, createUser, updateUser, deleteUser } from '../../services/usersService';
import { getCondominiums, getUnits, getBlocks } from '../../services/unitsService';

const roleLabels = {
  ADMIN: 'Administrador',
  MANAGER: 'Síndico',
  JANITOR: 'Zelador',
  RESIDENT: 'Morador'
};

const roleColors = {
  ADMIN: 'bg-red-100 text-red-700',
  MANAGER: 'bg-purple-100 text-purple-700',
  JANITOR: 'bg-orange-100 text-orange-700',
  RESIDENT: 'bg-blue-100 text-blue-700'
};

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

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [condominiums, setCondominiums] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [filters, setFilters] = useState({
    role: '',
    condominiumId: ''
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'RESIDENT',
    condominiumId: '',
    unitId: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCondominiums();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, filters]);

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

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      const data = await getUsers(params);
      setUsers(data.users || []);
      if (data.pagination) {
        setPagination(prev => ({ ...prev, total: data.pagination.total }));
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        phone: user.phone || '',
        role: user.role,
        condominiumId: user.condominiumId || '',
        unitId: user.unitId || ''
      });
      if (user.condominiumId) {
        fetchBlocks(user.condominiumId);
      }
      if (user.unit?.blockId) {
        fetchUnits(user.unit.blockId);
      }
    } else {
      setSelectedUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'RESIDENT',
        condominiumId: condominiums[0]?.id || '',
        unitId: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setBlocks([]);
    setUnits([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = { ...formData };
      
      // Remover campos vazios
      if (!data.phone) delete data.phone;
      if (!data.unitId) delete data.unitId;
      if (!data.password && selectedUser) delete data.password;

      if (selectedUser) {
        await updateUser(selectedUser.id, data);
      } else {
        await createUser(data);
      }
      handleCloseModal();
      fetchUsers();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      alert(error.response?.data?.error || 'Erro ao salvar usuário');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUser(selectedUser.id);
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      alert(error.response?.data?.error || 'Erro ao excluir usuário');
    }
  };

  const handleBlockChange = (blockId) => {
    setFormData({ ...formData, unitId: '' });
    if (blockId) {
      fetchUnits(blockId);
    } else {
      setUnits([]);
    }
  };

  return (
    <div>
      <Header title="Usuários" />

      <div className="p-6">
        {/* Filters and Actions */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">Todos os Perfis</option>
              <option value="ADMIN">Administrador</option>
              <option value="MANAGER">Síndico</option>
              <option value="JANITOR">Zelador</option>
              <option value="RESIDENT">Morador</option>
            </select>

            <select
              value={filters.condominiumId}
              onChange={(e) => setFilters({ ...filters, condominiumId: e.target.value })}
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
            Novo Usuário
          </Button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableEmpty message="Nenhum usuário encontrado" colSpan={6} />
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">
                            {user.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.phone ? (
                        <div className="flex items-center gap-1 text-slate-600">
                          <Phone className="w-3 h-3" />
                          <span className="text-sm">{user.phone}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                        {roleLabels[user.role]}
                      </span>
                    </TableCell>
                    <TableCell>
                      {user.unit ? (
                        <span className="text-sm">
                          {user.unit.block?.name} - Apt. {user.unit.number}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[user.status]}`}>
                        {statusLabels[user.status]}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(user)}
                          className="p-2 text-slate-500 rounded-lg"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
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

        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <div className="flex justify-center mt-6">
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Anterior
              </Button>
              <span className="px-4 text-sm text-slate-600">
                Página {pagination.page} de {Math.ceil(pagination.total / pagination.limit)}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Criação/Edição */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedUser ? 'Editar Usuário' : 'Novo Usuário'}
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
                placeholder="Ex: João da Silva"
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
                placeholder="Ex: joao@email.com"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Senha {selectedUser ? '(deixe em branco para manter)' : '*'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="••••••••"
                required={!selectedUser}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Perfil *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              >
                <option value="RESIDENT">Morador</option>
                <option value="JANITOR">Zelador</option>
                <option value="MANAGER">Síndico</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Condomínio *
              </label>
              <select
                value={formData.condominiumId}
                onChange={(e) => setFormData({ ...formData, condominiumId: e.target.value, unitId: '' })}
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
          </div>

          {formData.role === 'RESIDENT' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Bloco
                </label>
                <select
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
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              {selectedUser ? 'Salvar Alterações' : 'Criar Usuário'}
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
          Tem certeza que deseja excluir o usuário <strong>{selectedUser?.name}</strong>?
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
