import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import AdminConsole from './AdminConsole';
import AlocacaoTerritorio from './AlocacaoTerritorio';

// --- COMPONENTE VISUAL DE CARREGAMENTO ---
const LoadingModal = ({ mensagem }) => (
  <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-[99999] transition-all">
    <svg className="animate-spin h-16 w-16 text-teal-500 mb-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <h2 className="text-2xl font-bold text-white tracking-widest uppercase">{mensagem}</h2>
    <p className="text-teal-200 mt-2 font-medium">Por favor, aguarde um instante.</p>
  </div>
);

export default function App() {
  const [email, setEmail] = useState('');
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [carregando, setCarregando] = useState(false);

  const realizarLogin = async (e) => {
    e.preventDefault();
    if (!email) return;

    setCarregando(true);

    const { data, error } = await supabase
      .from('CAD_COLABS')
      .select('NOME, EMAIL, COD_TERRITORIO, PERFIL') 
      .ilike('EMAIL', email) 
      .limit(1) 
      .maybeSingle(); 

    setCarregando(false);

    if (error) {
      console.error("Erro EXATO retornado pelo Supabase:", error);
      alert('Erro ao buscar usuário: ' + error.message);
    } else if (!data) {
      alert('Usuário não encontrado! Verifique o email digitado.');
    } else {
      setUsuarioLogado(data);
    }
  };

  const fazerLogout = () => {
    setUsuarioLogado(null);
    setEmail('');
  };

  if (usuarioLogado) {
    if (usuarioLogado.PERFIL === 'ADMIN') {
      return <AdminConsole usuario={usuarioLogado} onLogout={fazerLogout} />;
    } else {
      return <AlocacaoTerritorio usuario={usuarioLogado} onLogout={fazerLogout} />;
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative">
      {/* Modal de Loading do Login */}
      {carregando && <LoadingModal mensagem="Autenticando Usuário..." />}

      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <span className="bg-teal-600 text-white px-5 py-2 rounded-md font-extrabold text-2xl tracking-wider">Bricker</span>
          <h1 className="text-xl font-bold text-slate-800 mt-4">Acesso ao Sistema</h1>
          <p className="text-slate-500 text-sm mt-1">Insira seu email corporativo para continuar</p>
        </div>

        <form onSubmit={realizarLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value.trim())} 
              placeholder="seu.email@empresa.com" 
              className="w-full p-4 rounded-lg bg-slate-50 border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition" 
            />
          </div>

          <button 
            type="submit" 
            disabled={carregando} 
            className="w-full bg-teal-600 text-white p-4 rounded-lg font-bold text-lg hover:bg-teal-700 disabled:bg-gray-400 transition-colors shadow-lg"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}