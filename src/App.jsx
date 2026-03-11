import React, { useState } from 'react';
import Login from './Login';
import AlocacaoTerritorioWrapper from './alocacaoTerritorio';
import ConfiguracaoMercado from './configuracaomercado';
import AdminConsole from './AdminConsole'; // <-- AQUI! Trazendo seu arquivo de volta

// === TELA DO MENU PRINCIPAL ===
const MenuPrincipal = ({ usuario, onNavigate, onLogout }) => {
  // Limpa o perfil para evitar bugs de espaço/maiúsculas
  const perfilSeguro = usuario?.PERFIL?.trim().toUpperCase();
  const isAdmin = perfilSeguro === 'ADMIN';

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 font-sans">
      <div className="max-w-5xl w-full">
        {/* Cabeçalho do Menu */}
        <div className="flex justify-between items-end mb-12 border-b border-slate-700 pb-6">
          <div>
            <span className="bg-teal-500 text-white px-4 py-1.5 rounded-md font-extrabold text-lg tracking-widest uppercase mb-3 inline-block">Bricker</span>
            <h1 className="text-4xl font-black text-white">Bem-vindo, {usuario?.NOME?.split(' ')[0] || 'Usuário'}!</h1>
            <p className="text-slate-400 mt-2 font-medium">Selecione o módulo que deseja acessar hoje.</p>
          </div>
          <button onClick={onLogout} className="text-slate-400 hover:text-white font-bold transition flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg hover:bg-red-900/50 hover:text-red-400">
            Sair do Sistema
          </button>
        </div>

        {/* Cartões dos Módulos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Cartão 1: Alocação */}
          <button onClick={() => onNavigate('alocacao')} className="group bg-slate-800 p-8 rounded-2xl border border-slate-700 hover:border-teal-500 hover:bg-slate-800/80 transition-all text-left shadow-xl hover:shadow-teal-900/20 transform hover:-translate-y-1 flex flex-col h-full">
            <div className="w-16 h-16 bg-teal-500/20 rounded-xl flex items-center justify-center mb-6 text-teal-400 group-hover:bg-teal-500 group-hover:text-white transition-colors shrink-0">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-teal-400 transition-colors">Alocação de Territórios</h2>
            <p className="text-slate-400 leading-relaxed font-medium">Gerencie a distribuição de Bricks e consulte o histórico de alocação da força de vendas.</p>
          </button>

          {/* Cartão 2: Mercado */}
          <button onClick={() => onNavigate('mercado')} className="group bg-slate-800 p-8 rounded-2xl border border-slate-700 hover:border-blue-500 hover:bg-slate-800/80 transition-all text-left shadow-xl hover:shadow-blue-900/20 transform hover:-translate-y-1 flex flex-col h-full">
            <div className="w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors shrink-0">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">Configuração de Mercado</h2>
            <p className="text-slate-400 leading-relaxed font-medium">Ajuste parâmetros mercadológicos e crie regras de negócio com aprovação hierárquica.</p>
          </button>

          {/* Cartão 3: Admin Console (SÓ APARECE SE FOR ADMIN) */}
          {isAdmin && (
            <button onClick={() => onNavigate('admin')} className="group bg-slate-800 p-8 rounded-2xl border border-slate-700 hover:border-purple-500 hover:bg-slate-800/80 transition-all text-left shadow-xl hover:shadow-purple-900/20 transform hover:-translate-y-1 flex flex-col h-full">
              <div className="w-16 h-16 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors shrink-0">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-purple-400 transition-colors">Painel Admin</h2>
              <p className="text-slate-400 leading-relaxed font-medium">Gestão de ciclos, datas de alocação e configurações globais do sistema Bricker.</p>
            </button>
          )}

        </div>
      </div>
    </div>
  );
};

// === ROTEADOR PRINCIPAL ===
export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [telaAtiva, setTelaAtiva] = useState('menu'); // Telas: 'menu', 'alocacao', 'mercado', 'admin'

  const handleLogin = (dadosUsuario) => {
    setUsuario(dadosUsuario);
    setTelaAtiva('menu');
  };

  const handleLogout = () => {
    setUsuario(null);
    setTelaAtiva('menu');
  };

  const handleVoltarMenu = () => {
    setTelaAtiva('menu');
  };

  if (!usuario) {
    return <Login onLogin={handleLogin} />;
  }

  if (telaAtiva === 'menu') {
    return <MenuPrincipal usuario={usuario} onNavigate={setTelaAtiva} onLogout={handleLogout} />;
  }

  if (telaAtiva === 'alocacao') {
    return <AlocacaoTerritorioWrapper usuario={usuario} onLogout={handleLogout} onVoltar={handleVoltarMenu} />;
  }

  if (telaAtiva === 'mercado') {
    return <ConfiguracaoMercado usuario={usuario} onLogout={handleLogout} onVoltar={handleVoltarMenu} />;
  }

  // <-- AQUI A ROTA PARA O ADMIN CONSOLE!
  if (telaAtiva === 'admin') {
    return <AdminConsole usuario={usuario} onLogout={handleLogout} onVoltar={handleVoltarMenu} />;
  }

  return null;
}