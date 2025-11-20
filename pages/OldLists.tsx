import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import SideMenu from '../components/SideMenu';
import { useAppContext } from '../hooks/useAppContext';
import { supabase } from '../supabaseClient';
import { ShoppingList, Item } from '../types';

const OldLists: React.FC = () => {
    const [isMenuOpen, setMenuOpen] = useState(false);
    const { user, currentList } = useAppContext();
    const [lists, setLists] = useState<ShoppingList[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedListId, setSelectedListId] = useState<string | null>(null);
    const [selectedListItems, setSelectedListItems] = useState<Item[]>([]);
    const [loadingItems, setLoadingItems] = useState(false);

    useEffect(() => {
        const fetchLists = async () => {
            if (!user) return;
            try {
                const { data } = await supabase
                    .from('shopping_lists')
                    .select('*')
                    .eq('userId', user.id)
                    .neq('id', currentList?.id || '') // Exclui a lista atual
                    .order('createdAt', { ascending: false });
                
                if (data) setLists(data);
            } catch (error) {
                console.error("Erro ao buscar listas antigas:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLists();
    }, [user, currentList]);

    const handleSelectList = async (listId: string) => {
        if (selectedListId === listId) {
            setSelectedListId(null);
            return;
        }
        
        setSelectedListId(listId);
        setLoadingItems(true);
        try {
            const { data } = await supabase
                .from('items')
                .select('*')
                .eq('listId', listId);
            if (data) {
                 // Garantir que price seja número
                const sanitizedItems = data.map(item => ({
                    ...item,
                    price: Number(item.price)
                }));
                setSelectedListItems(sanitizedItems);
            }
        } catch (error) {
            console.error("Erro ao buscar itens da lista:", error);
        } finally {
            setLoadingItems(false);
        }
    };

    const calculateTotal = (items: Item[]) => items.reduce((acc, item) => acc + Number(item.price), 0);

    return (
        <div className="flex flex-col h-screen">
            <Header onMenuClick={() => setMenuOpen(true)} />
            <SideMenu isOpen={isMenuOpen} onClose={() => setMenuOpen(false)} />
            <main className="flex-1 p-6 bg-slate-100 dark:bg-slate-900 overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Listas Antigas e Backups</h1>
                    
                    {loading ? (
                        <div className="flex justify-center p-10">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
                        </div>
                    ) : lists.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
                            <p className="text-gray-500 dark:text-gray-400">Nenhuma lista antiga encontrada.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {lists.map(list => (
                                <div key={list.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                                    <button 
                                        onClick={() => handleSelectList(list.id)}
                                        className="w-full px-6 py-4 flex justify-between items-center text-left focus:outline-none hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                    >
                                        <div>
                                            <h3 className="font-semibold text-gray-800 dark:text-white">{list.name}</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {new Date(list.createdAt).toLocaleDateString()} às {new Date(list.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </p>
                                        </div>
                                        <svg 
                                            className={`w-5 h-5 text-gray-500 transform transition-transform ${selectedListId === list.id ? 'rotate-180' : ''}`} 
                                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    
                                    {selectedListId === list.id && (
                                        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-4">
                                            {loadingItems ? (
                                                <div className="text-center py-4 text-gray-500">Carregando itens...</div>
                                            ) : selectedListItems.length === 0 ? (
                                                <p className="text-sm text-gray-500 italic">Lista vazia.</p>
                                            ) : (
                                                <div>
                                                    <ul className="space-y-2 mb-4">
                                                        {selectedListItems.map(item => (
                                                            <li key={item.id} className="flex justify-between text-sm border-b border-gray-200 dark:border-gray-700 pb-2 last:border-0">
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`text-gray-700 dark:text-gray-300 ${item.completed ? 'line-through opacity-60' : ''}`}>
                                                                        {item.name}
                                                                    </span>
                                                                    {item.observation && <span className="text-xs text-gray-400">({item.observation})</span>}
                                                                </div>
                                                                <span className="font-mono text-gray-600 dark:text-gray-400">R$ {item.price.toFixed(2)}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                    <div className="flex justify-end pt-2 border-t border-gray-200 dark:border-gray-700">
                                                        <span className="font-bold text-gray-800 dark:text-white">Total: R$ {calculateTotal(selectedListItems).toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default OldLists;