import React from 'react';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center">
        <button onClick={onMenuClick} className="text-gray-600 dark:text-gray-300 mr-4 focus:outline-none" aria-label="Abrir menu">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </button>
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">Lista de Compras Inteligente</h1>
      </div>
    </header>
  );
};

export default Header;