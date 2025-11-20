import React, { useState, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import Header from '../components/Header';
import SideMenu from '../components/SideMenu';
import AddCategoryModal from '../components/AddCategoryModal';
import AddItemModal from '../components/AddItemModal';
import ConfirmModal from '../components/ConfirmModal';
import Chat from '../components/Chat';
import { Item, Category } from '../types';

const Dashboard: React.FC = () => {
  const { 
      categories, items, toggleItemCompleted, deleteItem, deleteCategory, 
      categoryStats, grandTotal, grandTotalPaid 
  } = useAppContext();
  
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [isItemModalOpen, setItemModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<Item | null>(null);
  const [isChatOpen, setChatOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{id: string, name: string} | null>(null);

  const itemsByCategory = useMemo(() => {
    const grouped: { [key: string]: Item[] } = {};
    items.forEach(item => {
      if (!grouped[item.categoryId]) {
        grouped[item.categoryId] = [];
      }
      grouped[item.categoryId].push(item);
    });
    return grouped;
  }, [items]);

  const handleDeleteCategoryClick = (id: string, name: string) => {
      setCategoryToDelete({ id, name });
  }

  const confirmDeleteCategory = () => {
      if (categoryToDelete) {
          deleteCategory(categoryToDelete.id);
          setCategoryToDelete(null);
      }
  }
  
  const handleEditCategory = (category: Category) => {
      setCategoryToEdit(category);
      setCategoryModalOpen(true);
  }

  const handleCloseCategoryModal = () => {
      setCategoryModalOpen(false);
      setCategoryToEdit(null);
  }

  const handleEditItem = (item: Item) => {
      setItemToEdit(item);
      setItemModalOpen(true);
  }

  const handleCloseItemModal = () => {
      setItemModalOpen(false);
      setItemToEdit(null);
  }

  const visibleCategories = categories.filter(c => c.name !== 'Arquivados');

  return (
    <div className="flex flex-col h-screen">
      <Header onMenuClick={() => setMenuOpen(true)} />
      <SideMenu isOpen={isMenuOpen} onClose={() => setMenuOpen(false)} />
      
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-100 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto space-y-6">
            
            {/* 1. Painel de Resumo Geral (Total da Lista) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border-l-4 border-indigo-500">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Previsto</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">R$ {grandTotal.toFixed(2)}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border-l-4 border-green-500">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Já Pago</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">R$ {grandTotalPaid.toFixed(2)}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border-l-4 border-red-500">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Falta Pagar</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">R$ {(grandTotal - grandTotalPaid).toFixed(2)}</p>
                </div>
            </div>

            {/* 2. Controles Principais */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <button 
                        onClick={() => { setCategoryToEdit(null); setCategoryModalOpen(true); }} 
                        className="flex-1 sm:flex-none px-6 py-3 text-base font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none transition-transform transform hover:scale-105"
                    >
                        + Categoria
                    </button>
                    <button 
                        onClick={() => setItemModalOpen(true)} 
                        className="flex-1 sm:flex-none px-6 py-3 text-base font-semibold text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 focus:outline-none transition-transform transform hover:scale-105" 
                        disabled={categories.length === 0}
                    >
                        + Item
                    </button>
                </div>
            </div>

            {/* 3. Listagem de Categorias */}
            <div className="space-y-6">
                {visibleCategories.length === 0 && (
                    <div className="text-center py-10 px-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Sua lista de compras está vazia</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Comece adicionando uma categoria.</p>
                    </div>
                )}
                {visibleCategories.map(category => (
                    <div key={category.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-wrap gap-2">
                            <div className="flex items-center gap-3">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{category.name}</h3>
                                <div className="flex gap-1">
                                    <button 
                                        onClick={() => handleEditCategory(category)}
                                        className="text-gray-400 hover:text-indigo-500 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                        title="Editar"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteCategoryClick(category.id, category.name)}
                                        className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                        title="Excluir"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </div>
                             <div className="flex gap-4 text-sm font-semibold text-right">
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400 text-xs block">Pendente</span>
                                    <span className="font-bold text-red-600 dark:text-red-400">R$ {(categoryStats[category.id]?.pending || 0).toFixed(2)}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400 text-xs block">Pago</span>
                                    <span className="font-bold text-green-600 dark:text-green-400">R$ {(categoryStats[category.id]?.paid || 0).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {(itemsByCategory[category.id] || []).length > 0 ? (
                                (itemsByCategory[category.id] || []).map(item => (
                                <li key={item.id} className="p-4 flex justify-between items-center group hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                    <div className="flex items-center flex-1 min-w-0 pr-4">
                                        <input 
                                            type="checkbox"
                                            checked={item.completed}
                                            onChange={() => toggleItemCompleted(item.id)}
                                            className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer flex-shrink-0"
                                        />
                                        <div className="ml-3 flex flex-col overflow-hidden">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-gray-700 dark:text-gray-300 font-medium truncate ${item.completed ? 'line-through opacity-60' : ''}`}>
                                                    {item.name}
                                                </span>
                                                {item.link && (
                                                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-700" title="Link">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                    </a>
                                                )}
                                            </div>
                                            {item.observation && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.observation}</p>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <span className={`font-mono text-gray-900 dark:text-white ${item.completed ? 'line-through opacity-60' : ''}`}>R$ {item.price.toFixed(2)}</span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEditItem(item)} className="text-gray-300 hover:text-indigo-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                                            <button onClick={() => deleteItem(item.id)} className="text-gray-300 hover:text-red-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                        </div>
                                    </div>
                                </li>
                                ))
                            ) : (
                                <li className="p-4 text-sm text-gray-500 dark:text-gray-400">Vazio</li>
                            )}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
      </main>
      
      <AddCategoryModal isOpen={isCategoryModalOpen} onClose={handleCloseCategoryModal} categoryToEdit={categoryToEdit} />
      <AddItemModal isOpen={isItemModalOpen} onClose={handleCloseItemModal} itemToEdit={itemToEdit} />
      <ConfirmModal isOpen={!!categoryToDelete} onClose={() => setCategoryToDelete(null)} onConfirm={confirmDeleteCategory} title="Excluir Categoria" message={`Deseja excluir a categoria "${categoryToDelete?.name}" e todos os seus itens?`} />
      <Chat isOpen={isChatOpen} onClose={() => setChatOpen(false)} />
      <button onClick={() => setChatOpen(true)} className="fixed bottom-6 right-6 bg-purple-600 text-white p-4 rounded-full shadow-lg hover:bg-purple-700 z-20"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg></button>
    </div>
  );
};

export default Dashboard;