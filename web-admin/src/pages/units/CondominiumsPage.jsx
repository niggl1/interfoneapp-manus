import { useState, useEffect } from 'react';
import Header from '../../components/layout/Header';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '../../components/ui/Table';
import { Plus, Pencil, Trash2, Building, QrCode, Eye } from 'lucide-react';
import { getCondominiums, createCondominium, updateCondominium, deleteCondominium, generateCondominiumQRCode } from '../../services/unitsService';

export default function CondominiumsPage() {
  const [condominiums, setCondominiums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCondominium, setSelectedCondominium] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCondominiums();
  }, []);

  const fetchCondominiums = async () => {
    try {
      const data = await getCondominiums();
      setCondominiums(data.condominiums || []);
    } catch (error) {
      console.error('Erro ao buscar condomínios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (condominium = null) => {
    if (condominium) {
      setSelectedCondominium(condominium);
      setFormData({
        name: condominium.name,
        address: condominium.address,
        city: condominium.city,
        state: condominium.state,
        zipCode: condominium.zipCode,
        phone: condominium.phone || '',
        email: condominium.email || ''
      });
    } else {
      setSelectedCondominium(null);
      setFormData({
        name: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        phone: '',
        email: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCondominium(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (selectedCondominium) {
        await updateCondominium(selectedCondominium.id, formData);
      } else {
        await createCondominium(formData);
      }
      handleCloseModal();
      fetchCondominiums();
    } catch (error) {
      console.error('Erro ao salvar condomínio:', error);
      alert(error.response?.data?.error || 'Erro ao salvar condomínio');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCondominium(selectedCondominium.id);
      setIsDeleteModalOpen(false);
      setSelectedCondominium(null);
      fetchCondominiums();
    } catch (error) {
      console.error('Erro ao excluir condomínio:', error);
      alert(error.response?.data?.error || 'Erro ao excluir condomínio');
    }
  };

  const handleGenerateQRCode = async (condominium) => {
    try {
      const result = await generateCondominiumQRCode(condominium.id);
      alert(`QR Code gerado: ${result.qrCode}`);
      fetchCondominiums();
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      alert(error.response?.data?.error || 'Erro ao gerar QR Code');
    }
  };

  return (
    <div>
      <Header title="Condomínios" />

      <div className="p-6">
        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-slate-600">
            Gerencie os condomínios cadastrados no sistema
          </p>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Condomínio
          </Button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead>Cidade/UF</TableHead>
                <TableHead>Blocos</TableHead>
                <TableHead>Usuários</TableHead>
                <TableHead>QR Code</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : condominiums.length === 0 ? (
                <TableEmpty message="Nenhum condomínio cadastrado" colSpan={7} />
              ) : (
                condominiums.map((condominium) => (
                  <TableRow key={condominium.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Building className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="font-medium">{condominium.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{condominium.address}</TableCell>
                    <TableCell>{condominium.city}/{condominium.state}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-slate-100 rounded-full text-xs font-medium">
                        {condominium._count?.blocks || 0} blocos
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-slate-100 rounded-full text-xs font-medium">
                        {condominium._count?.users || 0} usuários
                      </span>
                    </TableCell>
                    <TableCell>
                      {condominium.qrCode ? (
                        <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">
                          {condominium.qrCode}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleGenerateQRCode(condominium)}
                          className="p-2 text-slate-500 rounded-lg"
                          title="Gerar QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(condominium)}
                          className="p-2 text-slate-500 rounded-lg"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCondominium(condominium);
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
        title={selectedCondominium ? 'Editar Condomínio' : 'Novo Condomínio'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nome do Condomínio *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Ex: Condomínio Residencial Manus"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Endereço *
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Ex: Rua das Flores, 123"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Cidade *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Ex: São Paulo"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Estado *
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Ex: SP"
                maxLength={2}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                CEP *
              </label>
              <input
                type="text"
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Ex: 01234-567"
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
                placeholder="Ex: (11) 1234-5678"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Ex: contato@condominio.com.br"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              {selectedCondominium ? 'Salvar Alterações' : 'Criar Condomínio'}
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
          Tem certeza que deseja excluir o condomínio <strong>{selectedCondominium?.name}</strong>?
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
