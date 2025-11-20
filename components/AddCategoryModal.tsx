import React, { useState, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Category } from '../types';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryToEdit?: Category | null;
}

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ isOpen, onClose, categoryToEdit }) => {
  const [name, setName] = useState('');
  const { addCategory, updateCategory } = useAppContext();

  useEffect(() => {
    if (isOpen) {
      if (categoryToEdit) {
        setName(categoryToEdit.name);
      } else {
        setName('');
      }
    }
  }, [isOpen, categoryToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      if (categoryToEdit) {
        updateCategory(categoryToEdit.id, name.trim());
      } else {
        addCategory(name.trim());
      }
      setName('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {categoryToEdit ? 'Editar Categoria' : 'Adicionar Nova Categoria'}
        </h3>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="category-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome da Categoria</label>
            <input
              id="category-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-50 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              autoFocus
              placeholder="Ex: Mercado, Farmácia..."
            />
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              {categoryToEdit ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCategoryModal;