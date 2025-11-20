import React, { useState, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Item } from '../types';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit?: Item | null;
}

const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose, itemToEdit }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [link, setLink] = useState('');
  const [observation, setObservation] = useState('');
  
  const { categories, addItem, updateItem } = useAppContext();

  useEffect(() => {
    if (isOpen) {
        if (itemToEdit) {
            // Modo Edição: Preencher campos
            setName(itemToEdit.name);
            setPrice(itemToEdit.price.toString());
            setCategoryId(itemToEdit.categoryId);
            setLink(itemToEdit.link || '');
            setObservation(itemToEdit.observation || '');
        } else {
            // Modo Criação: Limpar campos
            setName('');
            setPrice('');
            setLink('');
            setObservation('');
            if (categories.length > 0 && !categoryId) {
                setCategoryId(categories[0].id);
            }
        }
    }
  }, [isOpen, itemToEdit, categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && price && categoryId) {
      const numericPrice = parseFloat(price);
      
      if (itemToEdit) {
          updateItem(itemToEdit.id, {
              name: name.trim(),
              price: numericPrice,
              categoryId,
              link: link.trim() || undefined,
              observation: observation.trim() || undefined
          });
      } else {
          addItem(name.trim(), numericPrice, categoryId, link.trim(), observation.trim());
      }
      
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {itemToEdit ? 'Editar Item' : 'Adicionar Novo Item'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="item-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Item</label>
            <input
              id="item-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ex: Leite, Arroz..."
              className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-50 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="item-price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Preço (Estimado)</label>
            <input
              id="item-price"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-50 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="item-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoria</label>
            <select
              id="item-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-50 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="" disabled>Selecione uma categoria</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="item-link" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Link do Produto (Opcional)</label>
            <input
              id="item-link"
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-50 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
             <label htmlFor="item-obs" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Modelo / Observação (Opcional)</label>
            <textarea
              id="item-obs"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Ex: Marca X, 500g, Sem glúten..."
              rows={2}
              className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-50 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
              {itemToEdit ? 'Salvar Alterações' : 'Adicionar Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItemModal;