import { useState, useEffect } from 'react';
import Header from '../../components/layout/Header';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '../../components/ui/Table';
import { Plus, Pencil, Trash2, Building2, Home } from 'lucide-react';
import { getBlocks, createBlock, updateBlock, deleteBlock, getCondominiums } from '../../services/unitsService';

export default function BlocksPage() {
  const [blocks, setBlocks] = useState([]);
  const [condominiums, setCondominiums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [selectedCondominiumFilter, setSelectedCondominiumFilter] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    condominiumId: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCondominiums();
  }, []);

  useEffect(() => {
    fetchBlocks();
  }, [selectedCondominiumFilter]);

  const fetchCondominiums = async () => {
    try {
      const data = await getCondominiums();
      setCondominiums(data.condominiums || []);
    } catch (error) {
      console.error('Erro ao buscar condomínios:', error);
    }
  };

  const fetchBlocks = async () => {
    setLoading(true);
    try {
      const data = await getBlocks(selectedCondominiumFilter || undefined);
      setBlocks(data.blocks || []);
    } catch (error) {
      console.error('Erro ao buscar blocos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (block = null) => {
    if (block) {
      setSelectedBlock(block);
      setFormData({
        name: block.name,
        condominiumId: block.condominiumId
      });
    } else {
      setSelectedBlock(null);
      setFormData({
        name: '',
        condominiumId: selectedCondominiumFilter || (condominiums[0]?.id || '')
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBlock(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (selectedBlock) {
        await updateBlock(selectedBlock.id, { name: formData.name });
      } else {
        await createBlock(formData);
      }
      handleCloseModal();
      fetchBlocks();
    } catch (error) {
      console.error('Erro ao salvar bloco:', error);
      alert(error.response?.data?.error || 'Erro ao salvar bloco');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteBlock(selectedBlock.id);
      setIsDeleteModalOpen(false);
      setSelectedBlock(null);
      fetchBlocks();
    } catch (error) {
      console.error('Erro ao excluir bloco:', error);
      alert(error.response?.data?.error || 'Erro ao excluir bloco');
    }
  };

  return (
    <div>
      <Header title="Blocos" />

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
            Novo Bloco
          </Button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Condomínio</TableHead>
                <TableHead>Unidades</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : blocks.length === 0 ? (
                <TableEmpty message="Nenhum bloco cadastrado" colSpan={4} />
              ) : (
                blocks.map((block) => (
                  <TableRow key={block.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <span className="font-medium">{block.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {condominiums.find(c => c.id === block.condominiumId)?.name || '-'}
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-slate-100 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                        <Home className="w-3 h-3" />
                        {block._count?.units || 0} unidades
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(block)}
                          className="p-2 text-slate-500 rounded-lg"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBlock(block);
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
        title={selectedBlock ? 'Editar Bloco' : 'Novo Bloco'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {!selectedBlock && (
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
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nome do Bloco *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Ex: Bloco A, Torre 1"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              {selectedBlock ? 'Salvar Alterações' : 'Criar Bloco'}
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
          Tem certeza que deseja excluir o bloco <strong>{selectedBlock?.name}</strong>?
          Todas as unidades deste bloco também serão excluídas.
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
