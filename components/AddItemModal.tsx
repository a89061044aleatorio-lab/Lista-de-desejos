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
            setName(itemToEdit.name);
            // Ao editar, converte ponto pra vírgula para ficar bonito no input
            setPrice(itemToEdit.price.toString().replace('.', ',')); 
            setCategoryId(itemToEdit.categoryId);
            setLink(itemToEdit.link || '');
            setObservation(itemToEdit.observation || '');
        } else {
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

  // Função auxiliar local para limpar o input
  const cleanInputPrice = (val: string): number => {
      if (!val) return 0;
      let clean = val.replace('R$', '').trim();
      
      // Lógica BR: Se tiver vírgula, remove pontos antes.
      if (clean.includes(',')) {
          clean = clean.replace(/\./g, ''); // Remove ponto de milhar (1.200 -> 1200)
          clean = clean.replace(',', '.');  // Troca vírgula decimal (1200,50 -> 1200.50)
      }
      
      const num = parseFloat(clean);
      return isNaN(num) ? 0 : num;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && price && categoryId) {
      
      // Converte usando a lógica robusta
      const numericPrice = cleanInputPrice(price);
      
      if (isNaN(numericPrice)) {
        alert("Por favor, digite um preço válido.");
        return;
      }
      
      const finalLink = link.trim() || null;
      const finalObservation = observation.trim() || null;
      
      if (itemToEdit) {
          updateItem(itemToEdit.id, {
              name: name.trim(),
              price: numericPrice,
              categoryId,
              link: finalLink,
              observation: finalObservation
          });
      } else {
          addItem(name.trim(), numericPrice, categoryId, finalLink, finalObservation);
      }
      
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {itemToEdit ? 'Editar Item' : 'Adicionar Novo Item'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Item</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ex: Leite, Arroz"
              className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-50 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-indigo-500"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Preço</label>
            <input
              type="text" 
              inputMode="decimal"
              placeholder="0,00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-50 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoria</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-50 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-indigo-500"
            >
              <option value="" disabled>Selecione...</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Link (Opcional)</label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-50 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-indigo-500"
            />
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Obs (Opcional)</label>
            <textarea
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Marca, quantidade, etc."
              rows={2}
              className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-50 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700">
              {itemToEdit ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItemModal;