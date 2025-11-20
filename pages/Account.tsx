import React, { useState } from 'react';
import Header from '../components/Header';
import SideMenu from '../components/SideMenu';
import { useAppContext } from '../hooks/useAppContext';


const Account: React.FC = () => {
    const [isMenuOpen, setMenuOpen] = useState(false);
    const { user } = useAppContext();

    return (
        <div className="flex flex-col h-screen">
            <Header onMenuClick={() => setMenuOpen(true)} />
            <SideMenu isOpen={isMenuOpen} onClose={() => setMenuOpen(false)} />
            <main className="flex-1 p-6 bg-slate-100 dark:bg-slate-900">
                <div className="max-w-7xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Minha Conta</h1>
                    {user && (
                        <div>
                            <p className="text-gray-700 dark:text-gray-300">
                                <span className="font-semibold text-gray-800 dark:text-gray-200">E-mail:</span> {user.email}
                            </p>
                            <p className="text-gray-700 dark:text-gray-300 mt-2">
                                <span className="font-semibold text-gray-800 dark:text-gray-200">ID de Usuário:</span> {user.id}
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Account;