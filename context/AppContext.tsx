import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, Category, Item, ShoppingList, Message } from '../types';
import { supabase } from '../supabaseClient';

interface AppContextType {
  user: User | null;
  loading: boolean;
  login: (userData: any) => Promise<boolean>;
  logout: () => void;
  register: (userData: any) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  updatePassword: (password: string) => Promise<boolean>;
  categories: Category[];
  addCategory: (name: string) => void;
  deleteCategory: (categoryId: string) => void;
  archiveCategory: (categoryId: string) => void;
  updateCategory: (categoryId: string, name: string) => void;
  items: Item[];
  addItem: (name: string, price: number, categoryId: string, link?: string, observation?: string) => void;
  updateItem: (itemId: string, updates: Partial<Item>) => void;
  deleteItem: (itemId: string) => void;
  toggleItemCompleted: (itemId: string) => void;
  currentList: ShoppingList | null;
  messages: Message[];
  addMessage: (text: string) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentList, setCurrentList] = useState<ShoppingList | null>(null);

  // Verificar sessão ativa ao iniciar
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email! });
        }
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);
      } finally {
        setLoading(false);
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email! });
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

  // Carregar dados quando o usuário logar
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        // 1. Buscar ou Criar Lista
        let listId = null;
        const { data: lists, error: listError } = await supabase
          .from('shopping_lists')
          .select('*')
          .eq('userId', user.id)
          .order('createdAt', { ascending: false })
          .limit(1);

        if (lists && lists.length > 0) {
          setCurrentList(lists[0]);
          listId = lists[0].id;
        } else {
          // Criar primeira lista
          const newList = {
            name: 'Minha Lista de Compras',
            userId: user.id,
            createdAt: new Date().toISOString()
          };
          const { data: createdList } = await supabase
            .from('shopping_lists')
            .insert([newList])
            .select()
            .single();
          
          if (createdList) {
            setCurrentList(createdList);
            listId = createdList.id;
          }
        }

        // 2. Buscar Categorias
        const { data: cats } = await supabase
          .from('categories')
          .select('*')
          .eq('userId', user.id);
        if (cats) setCategories(cats);

        // 3. Buscar Itens e Mensagens se tiver lista
        if (listId) {
          const { data: listItems } = await supabase
            .from('items')
            .select('*')
            .eq('listId', listId);
          if (listItems) setItems(listItems);

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

  const login = async (userData: any) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password: userData.password,
    });
    if (error) {
      console.error(error);
      return false;
    }
    return true;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const register = async (userData: any) => {
    const { error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
    });
    if (error) {
      console.error(error);
      return false;
    }
    return true;
  };

  const resetPassword = async (email: string) => {
    const redirectTo = window.location.origin + '/#/update-password';
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo,
    });
    if (error) {
      console.error('Erro ao resetar senha:', error);
      return false;
    }
    return true;
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password: password });
    if (error) {
      console.error('Erro ao atualizar senha:', error);
      return false;
    }
    return true;
  };
  
  const addCategory = async (name: string) => {
    if (!user) return;
    const newCategory = {
      name,
      userId: user.id
    };
    const { data, error } = await supabase.from('categories').insert([newCategory]).select().single();
    if (data && !error) {
      setCategories(prev => [...prev, data]);
    }
  };

  const updateCategory = async (categoryId: string, name: string) => {
    // Atualiza estado local
    setCategories(prev => prev.map(c => c.id === categoryId ? { ...c, name } : c));

    // Atualiza no banco
    const { error } = await supabase
      .from('categories')
      .update({ name })
      .eq('id', categoryId);

    if (error) {
      console.error("Erro ao atualizar categoria:", error);
      alert("Erro ao salvar o nome da categoria no banco.");
    }
  };

  // Mantido para compatibilidade, mas Dashboard usa deleteCategory
  const archiveCategory = async (categoryId: string) => {
      if (!user) return;
      // Lógica simplificada, pois o foco agora é exclusão total
      deleteCategory(categoryId);
  };

  const deleteCategory = async (categoryId: string) => {
      if (!user) return;
      
      try {
          // 1. Tentar apagar itens da categoria (Globalmente, independente da lista)
          // Isso garante que itens de listas antigas também sejam removidos
          const { error: itemsError } = await supabase
              .from('items')
              .delete()
              .eq('categoryId', categoryId);
          
          if (itemsError) {
              console.error("Erro ao limpar itens da categoria:", itemsError);
              alert("Erro ao tentar apagar os itens desta categoria: " + itemsError.message);
              return; // Interrompe para evitar erro de chave estrangeira na categoria
          }

          // 2. Apagar a categoria
          const { error: catError } = await supabase
              .from('categories')
              .delete()
              .eq('id', categoryId);

          if (catError) {
              console.error("Erro ao excluir categoria:", catError);
              // Verifica se é erro de Foreign Key (código 23503 no Postgres)
              if (catError.code === '23503') {
                   alert("O banco de dados impediu a exclusão pois ainda existem itens vinculados. Isso geralmente se resolve rodando o Script SQL de 'Cascade' no painel do Supabase.");
              } else {
                   alert("Erro ao excluir categoria: " + catError.message);
              }
              return;
          }

          // 3. Atualizar a interface com Sucesso
          setCategories(prev => prev.filter(c => c.id !== categoryId));
          setItems(prev => prev.filter(i => i.categoryId !== categoryId));

      } catch (error: any) {
          console.error("Erro inesperado ao excluir categoria:", error);
          alert("Ocorreu um erro inesperado: " + (error.message || error));
      }
  };
  
  const addItem = async (name: string, price: number, categoryId: string, link?: string, observation?: string) => {
      if(!user || !currentList) return;
      const newItem = {
          name,
          price,
          categoryId,
          userId: user.id,
          listId: currentList.id,
          completed: false,
          link: link || null,
          observation: observation || null
      };
      const { data, error } = await supabase.from('items').insert([newItem]).select().single();
      if (data && !error) {
        setItems(prev => [...prev, data]);
      } else if (error) {
          console.error("Erro ao adicionar item:", error);
      }
  };

  const updateItem = async (itemId: string, updates: Partial<Item>) => {
      setItems(prev => prev.map(item => item.id === itemId ? { ...item, ...updates } : item));
      
      const { error } = await supabase.from('items').update(updates).eq('id', itemId);
      if (error) {
          console.error("Erro ao atualizar item:", error);
      }
  };

  const deleteItem = async (itemId: string) => {
      const { error } = await supabase.from('items').delete().eq('id', itemId);
      if (!error) {
        setItems(prev => prev.filter(i => i.id !== itemId));
      } else {
          console.error("Erro ao deletar item:", error);
      }
  };

  const toggleItemCompleted = async (itemId: string) => {
      const itemToUpdate = items.find(i => i.id === itemId);
      if (itemToUpdate) {
          const updatedStatus = !itemToUpdate.completed;
          setItems(prev => prev.map(item => item.id === itemId ? { ...item, completed: updatedStatus } : item));
          
          await supabase.from('items').update({ completed: updatedStatus }).eq('id', itemId);
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
      const { data, error } = await supabase.from('messages').insert([newMessage]).select().single();
      if (data && !error) {
        setMessages(prev => [...prev, data]);
      }
  }

  return (
    <AppContext.Provider value={{ 
        user, loading, login, logout, register, resetPassword, updatePassword,
        categories, addCategory, deleteCategory, archiveCategory, updateCategory,
        items, addItem, updateItem, deleteItem, toggleItemCompleted, 
        currentList, messages, addMessage 
    }}>
      {children}
    </AppContext.Provider>
  );
};