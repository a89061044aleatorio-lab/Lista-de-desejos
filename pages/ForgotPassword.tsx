import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../hooks/useAppContext';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { resetPassword } = useAppContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      const success = await resetPassword(email);
      if (success) {
        setMessage('Verifique seu e-mail para redefinir sua senha.');
      } else {
        setError('Erro ao enviar e-mail de recuperação. Verifique se o e-mail está correto.');
      }
    } catch (err) {
      setError('Ocorreu um erro inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">Recuperar Senha</h2>
        <p className="text-sm text-center text-gray-600 dark:text-gray-400">
          Digite seu e-mail para receber um link de redefinição.
        </p>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          {message && <div className="p-3 bg-green-100 text-green-700 rounded text-sm text-center">{message}</div>}
          {error && <div className="p-3 bg-red-100 text-red-700 rounded text-sm text-center">{error}</div>}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">E-mail</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-50 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Link'}
            </button>
          </div>
        </form>
        
        <div className="text-center">
          <Link to="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            Voltar para o Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;