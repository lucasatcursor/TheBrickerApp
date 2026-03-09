import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function AdminConsole({ usuario, onLogout }) {
  const [editingId, setEditingId] = useState(null);
  const [versionName, setVersionName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  const [versoes, setVersoes] = useState([]);
  const [carregando, setCarregando] = useState(false);

  const carregarVersoes = async () => {
    const { data } = await supabase
      .from('ALLOCATION_VERSIONS')
      .select('*')
      .order('id', { ascending: false });
    if (data) setVersoes(data);
  };

  useEffect(() => { carregarVersoes(); }, []);

  const carregarParaEdicao = (v) => {
    setEditingId(v.id);
    setVersionName(v.ALLOCATION_VERSION_NAME);
    setStartDate(v.START_DATE);
    setEndDate(v.END_DATE);
    setEditStartDate(v.EDIT_START_DATE || '');
    setEditEndDate(v.EDIT_END_DATE || '');
    setIsActive(v.IS_ACTIVE);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicao = () => {
    setEditingId(null);
    setVersionName('');
    setStartDate('');
    setEndDate('');
    setEditStartDate('');
    setEditEndDate('');
    setIsActive(true);
  };

  const salvarVersao = async (e) => {
    e.preventDefault();
    
    if (endDate < startDate) return alert("A Data Fim do Período não pode ser menor que a Data de Início.");
    if (editEndDate < editStartDate) return alert("A Data Fim da Edição não pode ser menor que a Data Início da Edição.");

    const temSobreposicao = versoes.some(v => {
      if (v.id === editingId) return false; 
      const overlapPeriodo = (startDate <= v.END_DATE) && (endDate >= v.START_DATE);
      const overlapEdicao = (editStartDate <= v.EDIT_END_DATE) && (editEndDate >= v.EDIT_START_DATE);
      return overlapPeriodo || overlapEdicao;
    });

    if (temSobreposicao) {
      return alert("Erro: As datas informadas se sobrepõem a uma versão já existente. Por favor, ajuste os períodos para não haver conflito.");
    }

    setCarregando(true);

    if (isActive) {
      await supabase.from('ALLOCATION_VERSIONS').update({ "IS_ACTIVE": false }).neq('id', editingId || 0);
    }

    const payload = {
      "ALLOCATION_VERSION_NAME": versionName,
      "START_DATE": startDate,
      "END_DATE": endDate,
      "EDIT_START_DATE": editStartDate,
      "EDIT_END_DATE": editEndDate,
      "IS_ACTIVE": isActive
    };

    let error;
    if (editingId) {
      const res = await supabase.from('ALLOCATION_VERSIONS').update(payload).eq('id', editingId);
      error = res.error;
    } else {
      const res = await supabase.from('ALLOCATION_VERSIONS').insert([payload]);
      error = res.error;
    }

    setCarregando(false);

    if (error) {
      alert("Erro ao salvar versão: " + error.message);
    } else {
      alert(editingId ? "Versão atualizada com sucesso!" : "Nova versão criada com sucesso!");
      cancelarEdicao();
      carregarVersoes();
    }
  };

  const deletarVersao = async (id, nome) => {
    const confirmacao = window.confirm(`ATENÇÃO! Tem certeza que deseja excluir a versão "${nome}"? Esta ação não pode ser desfeita.`);
    
    if (!confirmacao) return;

    setCarregando(true);

    const { error } = await supabase
      .from('ALLOCATION_VERSIONS')
      .delete()
      .eq('id', id);

    setCarregando(false);

    if (error) {
      console.error("Erro ao excluir versão:", error);
      alert("Erro ao excluir: " + error.message);
    } else {
      alert("Versão excluída com sucesso!");
      if (editingId === id) cancelarEdicao(); 
      carregarVersoes();
    }
  };

  return (
    <div className="min-h-screen bg-slate-800 p-8 font-sans">
      <header className="bg-gray-200 rounded-b-md p-6 shadow-md mb-6 flex items-start justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-4 mb-3">
              <span className="bg-indigo-700 text-white px-5 py-2 rounded-md font-extrabold text-xl">Admin</span>
              <h1 className="text-2xl font-black text-slate-800 uppercase tracking-widest">Console de Gestão</h1>
          </div>
          <div className="text-xs text-slate-600 font-bold bg-white px-3 py-1.5 rounded-md inline-block border border-gray-300 shadow-sm">
            LOGADO COMO: <span className="text-indigo-700">{usuario.NOME}</span> | {usuario.EMAIL}
          </div>
        </div>

        <button onClick={onLogout} className="bg-gray-300 hover:bg-gray-400 text-slate-700 px-4 py-2 rounded-md font-bold transition">Sair</button>
      </header>

      <main className="max-w-5xl mx-auto space-y-8">
        <div className="bg-gray-200 p-8 rounded-2xl shadow-2xl">
          <div className="flex justify-between items-center border-b border-gray-300 pb-4 mb-6">
            <h2 className="text-2xl font-bold text-slate-800">
              {editingId ? 'Editar Ciclo de Alocação' : 'Criar Novo Ciclo de Alocação'}
            </h2>
            {editingId && <button onClick={cancelarEdicao} className="text-sm bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded">Cancelar Edição</button>}
          </div>
          
          <form onSubmit={salvarVersao} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Nome da Versão (ALLOCATION_VERSION_NAME)</label>
                  <input type="text" required value={versionName} onChange={e => setVersionName(e.target.value)} placeholder="Ex: CICLO_Q1_2026" className="w-full p-3 rounded bg-white border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="flex items-center gap-2 mt-6 bg-white p-3 rounded border border-gray-300">
                  <input type="checkbox" id="ativo" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-5 h-5 accent-indigo-600 cursor-pointer" />
                  <label htmlFor="ativo" className="font-bold text-slate-700 cursor-pointer">Marcar como Ativo</label>
                </div>
              </div>

              <div className="bg-indigo-50 p-4 rounded border border-indigo-100">
                <h3 className="font-bold text-indigo-800 mb-3 border-b border-indigo-200 pb-2">Período da Versão (Vigência)</h3>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-600 mb-1">Início</label>
                    <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 rounded border border-gray-300 outline-none" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-600 mb-1">Fim</label>
                    <input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 rounded border border-gray-300 outline-none" />
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 p-4 rounded border border-amber-100">
                <h3 className="font-bold text-amber-800 mb-3 border-b border-amber-200 pb-2">Período de Edição (GDs)</h3>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-600 mb-1">Início da Edição</label>
                    <input type="date" required value={editStartDate} onChange={e => setEditStartDate(e.target.value)} className="w-full p-2 rounded border border-gray-300 outline-none" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-600 mb-1">Fim da Edição</label>
                    <input type="date" required value={editEndDate} onChange={e => setEditEndDate(e.target.value)} className="w-full p-2 rounded border border-gray-300 outline-none" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={carregando} className="bg-indigo-700 text-white px-10 py-3 rounded-md font-bold hover:bg-indigo-800 disabled:bg-gray-400 transition-colors">
                {carregando ? 'Salvando...' : (editingId ? 'Atualizar Versão' : 'Criar Versão')}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-2xl border border-gray-300">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Histórico de Versões</h2>
          <div className="overflow-auto border border-gray-200 rounded-md">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-[#1E293B] text-white">
                <tr>
                  <th className="p-3">STATUS</th>
                  <th className="p-3">NOME DA VERSÃO</th>
                  <th className="p-3 text-center bg-indigo-900/50">VIGÊNCIA</th>
                  <th className="p-3 text-center bg-amber-900/50">PERÍODO EDIÇÃO (GD)</th>
                  <th className="p-3 text-center">AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {versoes.map(v => (
                  <tr key={v.id} className={`border-b ${v.IS_ACTIVE ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
                    <td className="p-3 font-bold">
                      {v.IS_ACTIVE ? <span className="text-green-600 flex items-center gap-1">● ATIVO</span> : <span className="text-slate-400">Inativo</span>}
                    </td>
                    <td className="p-3 font-bold text-slate-700">{v.ALLOCATION_VERSION_NAME}</td>
                    <td className="p-3 text-center">{v.START_DATE?.split('-').reverse().join('/')} até {v.END_DATE?.split('-').reverse().join('/')}</td>
                    <td className="p-3 text-center">{v.EDIT_START_DATE?.split('-').reverse().join('/')} até {v.EDIT_END_DATE?.split('-').reverse().join('/')}</td>
                    <td className="p-3">
                      {/* CORREÇÃO AQUI: A div garante que os botões não quebrem a tabela */}
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => carregarParaEdicao(v)} className="text-indigo-600 hover:text-indigo-900 font-bold px-3 py-1 rounded border border-indigo-200 hover:bg-indigo-100 transition">
                          Editar
                        </button>
                        <button onClick={() => deletarVersao(v.id, v.ALLOCATION_VERSION_NAME)} className="text-red-600 hover:text-red-900 font-bold px-3 py-1 rounded border border-red-200 hover:bg-red-100 transition">
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}