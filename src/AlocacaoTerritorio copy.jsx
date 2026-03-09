import { supabase } from './supabaseClient';
import React, { useState, useEffect, useMemo } from 'react';

// BrickTable: Componente isolado para performance e foco estável
const BrickTable = ({ title, data, selectedRows, onRowSelect, onSelectAll, isAllSelected, headerBg, count, showSearch, termoBusca, setTermoBusca, colunaBusca, setColunaBusca }) => (
  <div className="bg-gray-100 p-4 md:p-6 rounded-lg shadow-inner flex-1 flex flex-col h-[38rem] border border-gray-300">
    <div className={`${headerBg} p-4 rounded-md mb-4 border border-gray-300 shadow-sm`}>
      <h3 className="font-semibold text-lg text-slate-800">{title} <span className="font-normal text-slate-500">({count})</span></h3>
    </div>
    
    {showSearch && (
      <div className="mb-4 flex gap-2">
        <input 
          type="text" 
          placeholder="Buscar brick..." 
          className="flex-grow p-3 bg-white border border-gray-300 rounded text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent placeholder-gray-400 shadow-sm"
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)}
        />
        <select 
          className="p-3 bg-white border border-gray-300 rounded text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent shadow-sm"
          value={colunaBusca}
          onChange={(e) => setColunaBusca(e.target.value)}
        >
          <option value="TODAS">Todas</option>
          <option value="ID_BRICK">COD</option>
          <option value="DS_REGION">NOME</option>
          <option value="DS_CITY">CIDADE</option>
          <option value="DS_UF">UF</option>
        </select>
      </div>
    )}

    <div className="overflow-auto flex-1 custom-scrollbar bg-white rounded-md border border-gray-300 shadow-sm">
      <table className="w-full text-sm text-left table-auto border-separate border-spacing-0">
        <thead className="sticky top-0 z-10 bg-[#1E293B] text-white">
          <tr>
            <th className="p-3 w-10 text-center border-b border-slate-700"><input type="checkbox" checked={isAllSelected} onChange={onSelectAll} disabled={data.length === 0} /></th>
            <th className="p-3">COD</th>
            <th className="p-3">NOME</th>
            <th className="p-3">CIDADE</th>
            <th className="p-3">UF</th>
          </tr>
        </thead>
        <tbody>
          {data.map(b => (
            <tr key={b.ID_BRICK} onClick={() => onRowSelect(b.ID_BRICK)} className={`cursor-pointer hover:bg-slate-50 border-b ${selectedRows.includes(b.ID_BRICK) ? 'bg-teal-50' : ''}`}>
              <td className="p-3 text-center"><input type="checkbox" checked={selectedRows.includes(b.ID_BRICK)} readOnly /></td>
              <td className="p-3 font-medium">{b.ID_BRICK}</td>
              <td className="p-3">{b.DS_REGION}</td>
              <td className="p-3">{b.DS_CITY}</td>
              <td className="p-3">{b.DS_UF}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default function AlocacaoTerritorio({ territorioInicial, emailUsuario }) {
  console.log("O que o filho recebeu:", emailUsuario);
  const [territorio, setTerritorio] = useState(territorioInicial || '');
  const [disponiveis, setDisponiveis] = useState([]);
  const [alocados, setAlocados] = useState([]);
  const [marcadosDisponiveis, setMarcadosDisponiveis] = useState([]);
  const [marcadosAlocados, setMarcadosAlocados] = useState([]);
  const [termoBusca, setTermoBusca] = useState('');
  const [colunaBusca, setColunaBusca] = useState('TODAS');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchBricks = async () => {
      const { data } = await supabase.from('CAD_BRICKS').select('*');
      if (data) setDisponiveis(data.map(i => ({...i, ID_BRICK: parseInt(i.ID_BRICK, 10)})));
    };
    fetchBricks();
  }, []);

  const bricksFiltrados = useMemo(() => disponiveis.filter(b => {
    if (!termoBusca) return true;
    const t = termoBusca.toLowerCase();
    if (colunaBusca === 'TODAS') return String(b.ID_BRICK).includes(t) || String(b.DS_REGION).toLowerCase().includes(t) || String(b.DS_CITY).toLowerCase().includes(t) || String(b.DS_UF).toLowerCase().includes(t);
    return String(b[colunaBusca] || '').toLowerCase().includes(t);
  }), [disponiveis, termoBusca, colunaBusca]);

  const toggleMarcado = (cod, lista, setLista) => {
    if (lista.includes(cod)) setLista(lista.filter(i => i !== cod));
    else setLista([...lista, cod]);
  };

  const salvarAlocacao = async () => {
 console.log("Tentando salvar alocação. Valor de emailUsuario:", emailUsuario);
    
    const payload = alocados.map(b => ({
      brick_id: b.ID_BRICK,
      territorio_id: territorio,
      performed_by: emailUsuario,
      created_at: new Date().toISOString()
    }));

    const { error } = await supabase.from('brick_terr_allocation').upsert(payload);
    if (error) alert("Erro ao salvar: " + error.message);
    else alert("Alocação salva com sucesso!");
  };

  return (
    <div className="min-h-screen bg-slate-800 p-8 font-sans">
      <header className="bg-gray-200 rounded-b-md p-6 shadow-md mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <span className="bg-teal-600 text-white px-5 py-2 rounded-md font-extrabold text-xl">Bricker</span>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-widest">Workspace Corporativo</h1>
        </div>
        <div className="text-slate-500 text-sm">Usuário: <strong>{emailUsuario}</strong></div>
      </header>

      <main className="bg-gray-200 p-8 rounded-2xl shadow-2xl">
        <div className="flex justify-between border-b border-gray-300 pb-6 mb-6 items-center">
            <div className="flex items-center gap-6">
                <h1 className="text-3xl font-bold text-slate-800">Alocação de Território</h1>
                <div className="bg-white px-6 py-2 rounded-xl border border-gray-300 flex items-center gap-4">
                    <div><span className="text-[10px] font-bold text-slate-500 uppercase block">Território Atual:</span><span className="font-black text-lg block">{territorio || 'Nenhum'}</span></div>
                    <button className="bg-slate-700 text-white px-4 py-2 rounded-lg" onClick={() => setIsModalOpen(true)}>Trocar</button>
                </div>
            </div>
            <button onClick={salvarAlocacao} className="bg-teal-600 text-white px-8 py-3 rounded-md font-bold shadow hover:bg-teal-700">Salvar Alocação</button>
        </div>

        <div className="flex gap-4">
          <BrickTable title="Disponíveis" data={bricksFiltrados} selectedRows={marcadosDisponiveis} onRowSelect={(c) => toggleMarcado(c, marcadosDisponiveis, setMarcadosDisponiveis)} onSelectAll={() => setMarcadosDisponiveis(marcadosDisponiveis.length ? [] : bricksFiltrados.map(b => b.ID_BRICK))} isAllSelected={bricksFiltrados.length > 0 && marcadosDisponiveis.length === bricksFiltrados.length} headerBg="bg-white" count={disponiveis.length} showSearch={true} termoBusca={termoBusca} setTermoBusca={setTermoBusca} colunaBusca={colunaBusca} setColunaBusca={setColunaBusca} />
          
          <div className="flex flex-col justify-center gap-2">
            <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={() => { setAlocados([...alocados, ...disponiveis.filter(b => marcadosDisponiveis.includes(b.ID_BRICK))]); setDisponiveis(disponiveis.filter(b => !marcadosDisponiveis.includes(b.ID_BRICK))); setMarcadosDisponiveis([]); }}>Adicionar →</button> 
            <button className="bg-red-600 text-white px-4 py-2 rounded" onClick={() => { setDisponiveis([...disponiveis, ...alocados.filter(b => marcadosAlocados.includes(b.ID_BRICK))]); setAlocados(alocados.filter(b => !marcadosAlocados.includes(b.ID_BRICK))); setMarcadosAlocados([]); }}>← Remover</button>
          </div>

          <BrickTable title="Alocados" data={alocados} selectedRows={marcadosAlocados} onRowSelect={(c) => toggleMarcado(c, marcadosAlocados, setMarcadosAlocados)} onSelectAll={() => setMarcadosAlocados(marcadosAlocados.length ? [] : alocados.map(b => b.ID_BRICK))} isAllSelected={alocados.length > 0 && marcadosAlocados.length === alocados.length} headerBg="bg-blue-100" count={alocados.length} showSearch={false} />
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-sm shadow-2xl">
            <h2 className="text-lg font-bold mb-4">Selecione o Território</h2>
            {['101021', '101022', 'T-101023', '101024'].map(t => (
              <button key={t} onClick={() => { setTerritorio(t); setIsModalOpen(false); }} className="w-full p-4 mb-2 bg-gray-50 border rounded-lg text-left font-bold hover:bg-teal-50">{t}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}