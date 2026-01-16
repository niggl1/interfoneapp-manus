import { useState, useEffect } from 'react';
import Header from '../../components/layout/Header';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '../../components/ui/Table';
import { Plus, Pencil, Trash2, Home, Users, QrCode } from 'lucide-react';
import { getUnits, createUnit, updateUnit, deleteUnit, generateUnitQRCode, getBlocks, getCondominiums } from '../../services/unitsService';

export default function ApartmentsPage() {
  const [units, setUnits] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [condominiums, setCondominiums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [selectedCondominiumFilter, setSelectedCondominiumFilter] = useState('');
  const [selectedBlockFilter, setSelectedBlockFilter] = useState('');
  const [formData, setFormData] = useState({
    number: '',
    floor: '',
    blockId: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCondominiums();
  }, []);

  useEffect(() => {
    if (selectedCondominiumFilter) {
      fetchBlocks(selectedCondominiumFilter);
    } else {
      setBlocks([]);
      setSelectedBlockFilter('');
    }
  }, [selectedCondominiumFilter]);

  useEffect(() => {
    fetchUnits();
  }, [selectedBlockFilter, selectedCondominiumFilter]);

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

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const data = await getUnits(
        selectedBlockFilter || undefined,
        selectedCondominiumFilter || undefined
      );
      setUnits(data.units || []);
    } catch (error) {
      console.error('Erro ao buscar unidades:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (unit = null) => {
    if (unit) {
      setSelectedUnit(unit);
      setFormData({
        number: unit.number,
        floor: unit.floor?.toString() || '',
        blockId: unit.blockId
      });
    } else {
      setSelectedUnit(null);
      setFormData({
        number: '',
        floor: '',
        blockId: selectedBlockFilter || (blocks[0]?.id || '')
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUnit(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = {
        number: formData.number,
        floor: formData.floor ? parseInt(formData.floor) : null,
        blockId: formData.blockId
      };

      if (selectedUnit) {
        await updateUnit(selectedUnit.id, data);
      } else {
        await createUnit(data);
      }
      handleCloseModal();
      fetchUnits();
    } catch (error) {
      console.error('Erro ao salvar unidade:', error);
      alert(error.response?.data?.error || 'Erro ao salvar unidade');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUnit(selectedUnit.id);
      setIsDeleteModalOpen(false);
      setSelectedUnit(null);
      fetchUnits();
    } catch (error) {
      console.error('Erro ao excluir unidade:', error);
      alert(error.response?.data?.error || 'Erro ao excluir unidade');
    }
  };

  const handleGenerateQRCode = async (unit) => {
    try {
      const result = await generateUnitQRCode(unit.id);
      alert(`QR Code gerado: ${result.qrCode}`);
      fetchUnits();
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      alert(error.response?.data?.error || 'Erro ao gerar QR Code');
    }
  };

  return (
    <div>
      <Header title="Apartamentos" />

      <div className="p-6">
        {/* Filters and Actions */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <select
              value={selectedCondominiumFilter}
              onChange={(e) => {
                setSelectedCondominiumFilter(e.target.value);
                setSelectedBlockFilter('');
              }}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">Todos os Condomínios</option>
              {condominiums.map((cond) => (
                <option key={cond.id} value={cond.id}>
                  {cond.name}
                </option>
              ))}
            </select>

            <select
              value={selectedBlockFilter}
              onChange={(e) => setSelectedBlockFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              disabled={!selectedCondominiumFilter}
            >
              <option value="">Todos os Blocos</option>
              {blocks.map((block) => (
                <option key={block.id} value={block.id}>
                  {block.name}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={() => handleOpenModal()} disabled={blocks.length === 0}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Apartamento
          </Button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Bloco</TableHead>
                <TableHead>Andar</TableHead>
                <TableHead>Moradores</TableHead>
                <TableHead>QR Code</TableHead>
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
              ) : units.length === 0 ? (
                <TableEmpty 
                  message={blocks.length === 0 ? "Selecione um condomínio para ver os apartamentos" : "Nenhum apartamento cadastrado"} 
                  colSpan={6} 
                />
              ) : (
                units.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Home className="w-5 h-5 text-purple-600" />
                        </div>
                        <span className="font-medium">Apt. {unit.number}</span>
                      </div>
                    </TableCell>
                    <TableCell>{unit.block?.name || '-'}</TableCell>
                    <TableCell>{unit.floor ? `${unit.floor}º andar` : '-'}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-slate-100 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                        <Users className="w-3 h-3" />
                        {unit._count?.residents || 0} moradores
                      </span>
                    </TableCell>
                    <TableCell>
                      {unit.qrCode ? (
                        <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">
                          {unit.qrCode}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleGenerateQRCode(unit)}
                          className="p-2 text-slate-500 rounded-lg"
                          title="Gerar QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(unit)}
                          className="p-2 text-slate-500 rounded-lg"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUnit(unit);
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
        title={selectedUnit ? 'Editar Apartamento' : 'Novo Apartamento'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {!selectedUnit && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Bloco *
              </label>
              <select
                value={formData.blockId}
                onChange={(e) => setFormData({ ...formData, blockId: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              >
                <option value="">Selecione um bloco</option>
                {blocks.map((block) => (
                  <option key={block.id} value={block.id}>
                    {block.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Número do Apartamento *
              </label>
              <input
                type="text"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Ex: 101, 202"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Andar
              </label>
              <input
                type="number"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Ex: 1, 2, 3"
                min="0"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              {selectedUnit ? 'Salvar Alterações' : 'Criar Apartamento'}
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
          Tem certeza que deseja excluir o apartamento <strong>{selectedUnit?.number}</strong>?
          Os moradores vinculados serão desassociados.
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
