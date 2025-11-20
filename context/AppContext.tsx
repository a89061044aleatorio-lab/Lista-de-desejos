import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, Category, Item, ShoppingList, Message, CategoryStats } from '../types';
import { supabase } from '../supabaseClient';

interface AppContextType {
  user: User | null;
  loading: boolean;
  login: (userData: {email: string, password: string}) => Promise<boolean>;
  logout: () => void;
  register: (userData: {email: string, password: string}) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  updatePassword: (password: string) => Promise<boolean>;
  categories: Category[];
  addCategory: (name: string) => void;
  deleteCategory: (categoryId: string) => void;
  archiveCategory: (categoryId: string) => void;
  updateCategory: (categoryId: string, name: string) => void;
  items: Item[];
  addItem: (name: string, price: number, categoryId: string, link?: string | null, observation?: string | null) => void;
  updateItem: (itemId: string, updates: Partial<Item>) => void;
  deleteItem: (itemId: string) => void;
  toggleItemCompleted: (itemId: string) => void;
  currentList: ShoppingList | null;
  messages: Message[];
  addMessage: (text: string) => void;
  categoryStats: Record<string, CategoryStats>;
  grandTotal: number;
  grandTotalPaid: number;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

// Função auxiliar para converter qualquer valor em número de forma segura
const safeParseFloat = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  
  if (typeof value === 'string') {
    // Troca vírgula por ponto (padrão BR -> US) e remove caracteres não numéricos exceto ponto e traço
    const cleanValue = value.replace(',', '.').trim();
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? 0 : parsed;
  }
  
  return 0;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentList, setCurrentList] = useState<ShoppingList | null>(null);
  
  // Estados derivados (Estatísticas)
  const [categoryStats, setCategoryStats] = useState<Record<string, CategoryStats>>({});
  const [grandTotal, setGrandTotal] = useState(0);
  const [grandTotalPaid, setGrandTotalPaid] = useState(0);

  // --- LÓGICA DE CÁLCULO (CORRIGIDA COM SAFEPARSEFLOAT) ---
  const calculateLocalStats = (currentItems: Item[]) => {
    const stats: Record<string, CategoryStats> = {};
    let total = 0;
    let totalPaid = 0;
    
    currentItems.forEach(item => {
      // Usa a função segura para garantir que é número
      const safePrice = safeParseFloat(item.price);
      
      // Totais Globais
      total += safePrice;
      if (item.completed) {
        totalPaid += safePrice;
      }

      // Totais por Categoria
      if (!stats[item.categoryId]) {
        stats[item.categoryId] = {
          categoryId: item.categoryId,
          total: 0,
          paid: 0,
          pending: 0
        };
      }
      
      stats[item.categoryId].total += safePrice;
      
      if (item.completed) {
        stats[item.categoryId].paid += safePrice;
      } else {
        stats[item.categoryId].pending += safePrice;
      }
    });
    
    return { stats, total, totalPaid };
  };

  // Atualiza totais sempre que os itens mudam
  useEffect(() => {
    const { stats, total, totalPaid } = calculateLocalStats(items);
    setCategoryStats(stats);
    setGrandTotal(total);
    setGrandTotalPaid(totalPaid);
  }, [items]);

  // --- AUTENTICAÇÃO E CARREGAMENTO ---
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && session.user.email) {
          setUser({ id: session.user.id, email: session.user.email });
        }
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);
      } finally {
        setLoading(false);
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && session.user.email) {
        setUser({ id: session.user.id, email: session.user.email });
        setLoading(false);
      } else {
        setUser(null);
        setCategories([]);
        setItems([]);
        setMessages([]);
        setCurrentList(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Carregar dados do Usuário
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        // 1. Listas
        let listId = null;
        const { data: lists } = await supabase
          .from('shopping_lists')
          .select('*')
          .eq('userId', user.id)
          .order('createdAt', { ascending: false })
          .limit(1);

        if (lists && lists.length > 0) {
          setCurrentList(lists[0]);
          listId = lists[0].id;
        } else {
          const { data: createdList } = await supabase
            .from('shopping_lists')
            .insert([{ name: 'Minha Lista de Compras', userId: user.id }])
            .select()
            .single();
          
          if (createdList) {
            setCurrentList(createdList);
            listId = createdList.id;
          }
        }

        // 2. Categorias
        const { data: cats } = await supabase
          .from('categories')
          .select('*')
          .eq('userId', user.id);
        if (cats) setCategories(cats);

        // 3. Itens (Com conversão segura de preço)
        if (listId) {
          const { data: listItems } = await supabase
            .from('items')
            .select('*')
            .eq('listId', listId);
          
          if (listItems) {
              const safeItems: Item[] = listItems.map(i => ({
                  ...i,
                  price: safeParseFloat(i.price), // Converte usando safeParseFloat
                  link: i.link || null,
                  observation: i.observation || null
              }));
              setItems(safeItems);
          }

          const { data: listMsgs } = await supabase
            .from('messages')
            .select('*')
            .eq('listId', listId)
            .order('timestamp', { ascending: true });
          if (listMsgs) setMessages(listMsgs);
        }

      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };

    loadData();
  }, [user]);

  // --- AÇÕES DE AUTENTICAÇÃO ---
  const login = async (userData: {email: string, password: string}) => {
    const { error } = await supabase.auth.signInWithPassword(userData);
    if (error) return false;
    return true;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const register = async (userData: {email: string, password: string}) => {
    const { error } = await supabase.auth.signUp(userData);
    if (error) return false;
    return true;
  };

  const resetPassword = async (email: string) => {
    const redirectTo = window.location.origin + '/#/update-password';
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    return !error;
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return !error;
  };
  
  // --- AÇÕES DE DADOS ---
  const addCategory = async (name: string) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('categories')
      .insert([{ name, userId: user.id }])
      .select()
      .single();
      
    if (data && !error) {
      setCategories(prev => [...prev, data]);
    }
  };

  const updateCategory = async (categoryId: string, name: string) => {
    setCategories(prev => prev.map(c => c.id === categoryId ? { ...c, name } : c));
    await supabase.from('categories').update({ name }).eq('id', categoryId);
  };

  const archiveCategory = (categoryId: string) => {
      deleteCategory(categoryId); // Mantendo comportamento simplificado solicitado
  };

  const deleteCategory = async (categoryId: string) => {
      if (!user) return;
      
      // Otimista: Remove da tela imediatamente
      const previousCategories = [...categories];
      const previousItems = [...items];
      
      setCategories(prev => prev.filter(c => c.id !== categoryId));
      setItems(prev => prev.filter(i => i.categoryId !== categoryId));

      try {
          // 1. Tenta deletar a categoria (Se Cascade estiver ativo no SQL, apaga tudo)
          const { error: catError } = await supabase
              .from('categories')
              .delete()
              .eq('id', categoryId);

          if (catError) {
              console.warn("Cascade falhou ou não configurado. Tentando exclusão manual de itens...");
              
              // Fallback: Apaga itens manualmente primeiro
              await supabase.from('items').delete().eq('categoryId', categoryId);
              const { error: retryError } = await supabase.from('categories').delete().eq('id', categoryId);
              
              if (retryError) throw retryError;
          }
      } catch (error: any) {
          console.error("Erro fatal ao excluir categoria:", error);
          alert("Não foi possível excluir a categoria. Tente novamente.");
          // Rollback em caso de erro
          setCategories(previousCategories);
          setItems(previousItems);
      }
  };
  
  const addItem = async (name: string, price: number, categoryId: string, link?: string | null, observation?: string | null) => {
      if(!user || !currentList) return;
      
      const numericPrice = safeParseFloat(price); // Garantia final usando safeParseFloat
      
      const newItem: Omit<Item, 'id'> = {
          name,
          price: numericPrice,
          categoryId,
          userId: user.id,
          listId: currentList.id,
          completed: false,
          link: link || null,
          observation: observation || null
      };
      
      // UI Otimista
      const tempId = `temp-${Date.now()}`;
      const optimisticItem: Item = { ...newItem, id: tempId };
      setItems(prev => [...prev, optimisticItem]);
      
      const { data, error } = await supabase.from('items').insert([newItem]).select().single();
      
      if (data && !error) {
        // Ao receber do banco, converte novamente para garantir
        setItems(prev => prev.map(i => i.id === tempId ? { ...data, price: safeParseFloat(data.price) } : i));
      } else {
          setItems(prev => prev.filter(i => i.id !== tempId)); // Remove se falhar
      }
  };

  const updateItem = async (itemId: string, updates: Partial<Item>) => {
      // Garante numérico se houver preço
      const cleanUpdates = { ...updates };
      if (cleanUpdates.price !== undefined) {
          cleanUpdates.price = safeParseFloat(cleanUpdates.price);
      }

      setItems(prev => prev.map(item => item.id === itemId ? { ...item, ...cleanUpdates } : item));
      await supabase.from('items').update(cleanUpdates).eq('id', itemId);
  };

  const deleteItem = async (itemId: string) => {
      setItems(prev => prev.filter(i => i.id !== itemId));
      await supabase.from('items').delete().eq('id', itemId);
  };

  const toggleItemCompleted = async (itemId: string) => {
      const item = items.find(i => i.id === itemId);
      if (item) {
          const newState = !item.completed;
          setItems(prev => prev.map(i => i.id === itemId ? { ...i, completed: newState } : i));
          await supabase.from('items').update({ completed: newState }).eq('id', itemId);
      }
  }

  const addMessage = async (text: string) => {
      if(!user || !currentList) return;
      const newMessage = {
          text,
          userId: user.id,
          listId: currentList.id,
          timestamp: new Date().toISOString(),
          userEmail: user.email,
      };
      
      // UI Otimista para Chat
      const tempId = `msg-${Date.now()}`;
      const optimisticMessage = { ...newMessage, id: tempId, userEmail: user.email! };
      setMessages(prev => [...prev, optimisticMessage]);

      const { data, error } = await supabase.from('messages').insert([newMessage]).select().single();
      if (data && !error) {
         setMessages(prev => prev.map(m => m.id === tempId ? data : m));
      }
  }

  return (
    <AppContext.Provider value={{ 
        user, loading, login, logout, register, resetPassword, updatePassword,
        categories, addCategory, deleteCategory, archiveCategory, updateCategory,
        items, addItem, updateItem, deleteItem, toggleItemCompleted, 
        currentList, messages, addMessage, categoryStats,
        grandTotal, grandTotalPaid
    }}>
      {children}
    </AppContext.Provider>
  );
};