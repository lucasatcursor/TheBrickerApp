import React, { useState } from 'react';
import { supabase } from './supabaseClient'; // Importando a conexão com o banco!

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleEntrar = async (e) => {
    e.preventDefault(); 
    setErro('');
    
    if (!email) {
      setErro('Por favor, informe o seu e-mail.');
      return;
    }

    setLoading(true);

    try {
      // O sistema agora busca as informações direto no banco de dados!
      // *Nota: Se a sua tabela de usuários tiver outro nome (ex: USUARIOS), troque 'CAD_COLABS' abaixo.
      const { data, error } = await supabase
        .from('CAD_COLABS')
        .select('*')
        .ilike('EMAIL', email) // ilike ignora maiúsculas/minúsculas no email
        .single();

      if (error || !data) {
        setErro('E-mail não encontrado no sistema. Verifique e tente novamente.');
      } else {
        // Envia o pacote completo (com Nome, Perfil, COD_TERRITORIO, etc) para o App.jsx
        onLogin(data);
      }
    } catch (err) {
      setErro('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 font-sans">
      <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200">
        
        <div className="text-center mb-8">
          <span className="bg-teal-600 text-white px-4 py-1.5 rounded-md font-extrabold text-sm tracking-widest uppercase inline-block mb-4">
            Bricker
          </span>
          <h2 className="text-3xl font-black text-slate-800">
            Acesso Restrito
          </h2>
          <p className="text-slate-500 mt-2 font-medium">Faça login com seu e-mail corporativo.</p>
        </div>
        
        <form onSubmit={handleEntrar} className="space-y-6">
          
          {erro && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm font-bold border border-red-200 text-center">
              {erro}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              E-mail do Usuário
            </label>
            <input
              type="email"
              className="w-full border border-gray-300 rounded-lg p-3 text-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none transition-shadow bg-gray-50"
              placeholder="seu.nome@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>
          
          {/* A CAIXINHA DE TERRITÓRIO FOI REMOVIDA DAQUI! */}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 text-white font-black py-3 px-4 rounded-lg hover:bg-teal-700 transition duration-200 shadow-md disabled:bg-slate-400 flex justify-center items-center"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Entrar no Sistema'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}