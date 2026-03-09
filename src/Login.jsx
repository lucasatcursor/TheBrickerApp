import React, { useState } from 'react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [territorio, setTerritorio] = useState('');

  const handleEntrar = (e) => {
    e.preventDefault(); // Evita que a página recarregue
    
    // Validação simples
    if (!email || !territorio) {
      alert('Por favor, preencha o e-mail e o código do território.');
      return;
    }

    // Chama a função que veio do App.jsx passando os dados
    onLogin(email, territorio);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-200">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Acesso ao Sistema
        </h2>
        
        <form onSubmit={handleEntrar} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-mail do Usuário
            </label>
            <input
              type="email"
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código do Território
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Ex: T-405"
              value={territorio}
              onChange={(e) => setTerritorio(e.target.value)}
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition duration-200"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}