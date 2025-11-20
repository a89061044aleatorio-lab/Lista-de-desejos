import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../hooks/useAppContext';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAppContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/login');
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      ></div>
      <div className={`fixed top-0 left-0 h-full bg-white dark:bg-gray-800 w-64 shadow-lg z-30 transform transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Menu</h2>
          {user && <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 truncate">{user.email}</p>}
          <nav>
            <ul>
              <li><Link to="/" onClick={onClose} className="block py-2 px-4 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">Lista Atual</Link></li>
              <li><Link to="/old-lists" onClick={onClose} className="block py-2 px-4 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">Listas Antigas</Link></li>
              <li><Link to="/account" onClick={onClose} className="block py-2 px-4 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">Minha Conta</Link></li>
            </ul>
          </nav>
          <div className="absolute bottom-0 left-0 w-full p-4 border-t border-gray-200 dark:border-gray-700">
            <button onClick={handleLogout} className="w-full text-left py-2 px-4 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
              Sair
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SideMenu;