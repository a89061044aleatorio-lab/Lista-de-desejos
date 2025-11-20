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

// --- FUNÇÃO BLINDADA PARA CONVERSÃO DE PREÇO (PADRÃO BRASIL) ---
const safeParseFloat = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  
  if (typeof value === 'string') {
    let clean = value.trim();
    
    // Se estiver vazio
    if (clean === '') return 0;

    // 1. Remove símbolos de moeda e espaços extras
    clean = clean.replace('R$', '').replace(/\s/g, '');

    // 2. Detecção de formato Brasileiro (1.200,50 ou 10,50)
    // Se tiver vírgula, assumimos que é o separador decimal
    if (clean.includes(',')) {
      // Remove TODOS os pontos (separadores de milhar: 1.200 -> 1200)
      clean = clean.replace(/\./g, '');
      // Troca a vírgula por ponto (decimal: 1200,50 -> 1200.50)
      clean = clean.replace(',', '.');
    } 
    // Se NÃO tiver vírgula, mas tiver múltiplos pontos (ex: 1.200.00)
    else if ((clean.match(/\./g) || []).length > 1) {
       clean = clean.replace(/\./g, '');
    }
    // Se tiver APENAS UM ponto e parecer milhar (ex: 1.200), remove o ponto
    // (Assume-se que ninguém vai digitar 1 real e 200 milésimos de centavo em lista de compras)
    else if (clean.includes('.') && clean.split('.')[1].length === 3) {
       // CUIDADO: Isso assume que 1.200 é mil e duzentos, não 1 ponto 2
       // Para segurança em lista de compras, geralmente assumimos ponto como decimal se não houver vírgula,
       // mas para evitar erro de "mil", vamos manter o padrão JS se for um ponto só.
    }

    const parsed = parseFloat(clean);
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

  // --- LÓGICA DE CÁLCULO (USANDO O PARSER BLINDADO) ---
  const calculateLocalStats = (currentItems: Item[]) => {
    const stats: Record<string, CategoryStats> = {};
    let total = 0;
    let totalPaid = 0;
    
    currentItems.forEach(item => {
      // Converte o preço usando a função robusta
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
                  // Força conversão assim que chega do banco
                  price: safeParseFloat(i.price), 
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
      deleteCategory(categoryId); 
  };

  const deleteCategory = async (categoryId: string) => {
      if (!user) return;
      
      // Otimista: Remove da tela imediatamente
      const previousCategories = [...categories];
      const previousItems = [...items];
      
      setCategories(prev => prev.filter(c => c.id !== categoryId));
      setItems(prev => prev.filter(i => i.categoryId !== categoryId));

      try {
          const { error: catError } = await supabase
              .from('categories')
              .delete()
              .eq('id', categoryId);

          if (catError) {
              console.warn("Cascade falhou. Tentando exclusão manual...");
              await supabase.from('items').delete().eq('categoryId', categoryId);
              const { error: retryError } = await supabase.from('categories').delete().eq('id', categoryId);
              if (retryError) throw retryError;
          }
      } catch (error: any) {
          console.error("Erro fatal ao excluir categoria:", error);
          alert("Não foi possível excluir a categoria.");
          setCategories(previousCategories);
          setItems(previousItems);
      }
  };
  
  const addItem = async (name: string, price: number, categoryId: string, link?: string | null, observation?: string | null) => {
      if(!user || !currentList) return;
      
      // GARANTIA DE NÚMERO PURO ANTES DE SALVAR
      const numericPrice = safeParseFloat(price); 
      
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
      
      const tempId = `temp-${Date.now()}`;
      const optimisticItem: Item = { ...newItem, id: tempId };
      setItems(prev => [...prev, optimisticItem]);
      
      const { data, error } = await supabase.from('items').insert([newItem]).select().single();
      
      if (data && !error) {
        setItems(prev => prev.map(i => i.id === tempId ? { ...data, price: safeParseFloat(data.price) } : i));
      } else {
          setItems(prev => prev.filter(i => i.id !== tempId));
      }
  };

  const updateItem = async (itemId: string, updates: Partial<Item>) => {
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