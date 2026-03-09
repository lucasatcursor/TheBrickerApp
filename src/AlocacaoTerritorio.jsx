import { supabase } from './supabaseClient';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';

// ============================================================================
// 1. ESCUDO DE ERROS (ERROR BOUNDARY)
// ============================================================================
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, errorMessage: '' }; }
  static getDerivedStateFromError(error) { return { hasError: true, errorMessage: error.toString() + '\n' + (error.stack || '') }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-8">
          <div className="bg-white border-l-8 border-red-600 p-8 rounded-lg shadow-2xl max-w-4xl w-full">
            <h1 className="text-3xl font-black text-red-700 mb-4">🚨 Ocorreu um Erro Crítico no React</h1>
            <p className="text-slate-700 mb-4 font-medium">Por favor, copie o erro abaixo e cole no chat:</p>
            <pre className="bg-slate-900 text-green-400 p-4 rounded-md overflow-x-auto text-sm font-mono whitespace-pre-wrap">{this.state.errorMessage}</pre>
            <button onClick={() => window.location.reload()} className="mt-6 bg-red-600 text-white font-bold py-2 px-6 rounded hover:bg-red-700 transition">Recarregar Página</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================================
// 2. MODAIS E COMPONENTES AUXILIARES
// ============================================================================
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

const AlertModal = ({ aviso, onClose }) => {
  if (!aviso) return null;
  const isError = aviso.tipo === 'error';
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[999999] p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center transform scale-100 flex flex-col items-center">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-inner ${isError ? 'bg-red-100 text-red-600' : 'bg-teal-100 text-teal-600'}`}>
          {isError ? <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg> : <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
        </div>
        <h3 className={`text-2xl font-black mb-2 ${isError ? 'text-red-700' : 'text-teal-700'}`}>{isError ? 'Atenção' : 'Sucesso!'}</h3>
        <p className="text-slate-600 font-medium mb-8 leading-relaxed">{aviso.texto}</p>
        <button onClick={onClose} className={`w-full py-3 rounded-lg font-bold text-white transition-colors shadow-md ${isError ? 'bg-red-600 hover:bg-red-700' : 'bg-teal-600 hover:bg-teal-700'}`}>Entendido</button>
      </div>
    </div>
  );
};

const CaixaPesquisa = ({ onSearch, disabled, resetTrigger }) => {
  const inputRef = useRef(null);
  const selectRef = useRef(null);
  useEffect(() => { if (inputRef.current) inputRef.current.value = ''; if (selectRef.current) selectRef.current.value = 'TODAS'; }, [resetTrigger]);
  return (
    <div className="mb-4 flex gap-2">
      <input type="text" ref={inputRef} placeholder="Digite e aperte Enter..." className="flex-grow p-3 bg-white border border-gray-300 rounded text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500" onKeyDown={(e) => e.key === 'Enter' && onSearch(inputRef.current?.value || '', selectRef.current?.value || 'TODAS')} disabled={disabled} />
      <select ref={selectRef} className="p-3 bg-white border border-gray-300 rounded text-sm text-slate-700 outline-none focus:ring-2 focus:ring-teal-500" disabled={disabled}>
        <option value="TODAS">Todas</option><option value="ID_BRICK">COD</option><option value="DS_REGION">NOME</option><option value="DS_CITY">CIDADE</option><option value="DS_UF">UF</option>
      </select>
    </div>
  );
};

const HeaderCell = ({ label, columnKey, sortConfig, requestSort, openFilter, setOpenFilter, onApplyFilter, filterValue }) => {
  const inputRef = useRef(null); 
  const isFiltered = !!filterValue;

  return (
    <th className="p-3 align-top bg-[#1E293B] border-r border-slate-600 last:border-0 min-w-[120px]">
      <div className="flex items-center justify-between cursor-pointer group" onClick={() => requestSort(columnKey)}>
        <span className={`transition-colors ${isFiltered ? 'text-teal-300 font-bold' : 'hover:text-teal-300'}`}>
          {label} {sortConfig.key === columnKey ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
        </span>
        <div className="relative">
          <button onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === columnKey ? null : columnKey); }} 
            className={`p-1 transition-colors ${isFiltered ? 'text-teal-400 opacity-100' : 'opacity-50 group-hover:opacity-100 hover:text-teal-300'}`} title="Filtrar coluna">🔍</button>
          {isFiltered && <span className="absolute top-1 right-0.5 w-2 h-2 bg-red-500 rounded-full border border-[#1E293B]"></span>}
        </div>
      </div>
      {openFilter === columnKey && (
        <div className="mt-2 relative flex items-center">
          <input type="text" ref={inputRef} defaultValue={filterValue || ''} autoFocus 
            className={`w-full text-black p-1 pr-6 text-xs border rounded font-normal focus:outline-none focus:ring-1 focus:ring-teal-500 ${isFiltered ? 'bg-teal-50 border-teal-400' : 'bg-white border-gray-300'}`} 
            placeholder="Digite e Enter..." 
            onKeyDown={(e) => e.key === 'Enter' && onApplyFilter(columnKey, inputRef.current?.value || '')} 
            onClick={(e) => e.stopPropagation()} 
          />
          {isFiltered && (
            <button onClick={(e) => { e.stopPropagation(); onApplyFilter(columnKey, ''); if(inputRef.current) inputRef.current.value = ''; }} 
              className="absolute right-1 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-700 font-bold p-1">✕</button>
          )}
        </div>
      )}
    </th>
  );
};

// ============================================================================
// 3. TABELA DE BRICKS (COM SCROLL INFINITO)
// ============================================================================
const BrickRow = React.memo(({ b, isSelected, onRowSelect, disabled }) => {
  return (
    <tr onClick={() => !disabled && onRowSelect(b.ID_BRICK)} className={`cursor-pointer border-b transition-colors ${isSelected ? 'bg-teal-50 hover:bg-teal-100' : 'hover:bg-slate-50'}`}>
      <td className="p-3 text-center"><input type="checkbox" checked={isSelected} readOnly disabled={disabled} className="cursor-pointer accent-teal-600 w-4 h-4" /></td>
      <td className="p-3">{b.ID_BRICK}</td>
      <td className="p-3 font-medium text-slate-700">{b.DS_REGION}</td>
      <td className="p-3">{b.DS_CITY}</td>
      <td className="p-3">{b.DS_UF}</td>
    </tr>
  );
});

const BrickTable = React.memo(({ title, data = [], selectedRows = [], onRowSelect, onSelectAll, isAllSelected, headerBg, count, showSearch, disabled, onSearch, resetTrigger }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [visibleCount, setVisibleCount] = useState(100);

  useEffect(() => { setVisibleCount(100); }, [data]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    if (!data) return [];
    let sortableItems = [...data];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key] || '';
        const valB = b[sortConfig.key] || '';
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  const visibleData = sortedData.slice(0, visibleCount);
  const selectedSet = useMemo(() => new Set(selectedRows), [selectedRows]);

  const handleScroll = (e) => {
    if (e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 100 && visibleCount < sortedData.length) {
      setVisibleCount(prev => prev + 100);
    }
  };

  const getSortIndicator = (columnKey) => sortConfig.key === columnKey ? (sortConfig.direction === 'asc' ? ' ↑' : ' ↓') : '';

  return (
    <div className="bg-gray-100 p-4 md:p-6 rounded-lg shadow-inner flex-1 flex flex-col h-[38rem] border border-gray-300">
      <div className={`${headerBg} p-4 rounded-md mb-4 border border-gray-300 shadow-sm flex justify-between items-center`}>
        <h3 className="font-semibold text-lg text-slate-800">{title} <span className="font-normal text-slate-500">({count || 0})</span></h3>
        {selectedRows?.length > 0 && <span className="text-xs font-bold bg-teal-100 text-teal-800 px-2 py-1 rounded shadow-sm">{selectedRows.length} selecionados</span>}
      </div>
      
      {showSearch && <CaixaPesquisa onSearch={onSearch} disabled={disabled} resetTrigger={resetTrigger} />}

      <div className="overflow-auto flex-1 custom-scrollbar bg-white rounded-md border border-gray-300 shadow-sm relative" onScroll={handleScroll}>
        <table className="w-full text-sm text-left table-auto relative">
          <thead className="sticky top-0 z-10 bg-[#1E293B] text-white select-none shadow-md">
            <tr>
              <th className="p-3 w-10 text-center"><input type="checkbox" checked={isAllSelected} onChange={onSelectAll} disabled={disabled || data.length === 0} className="accent-teal-500 w-4 h-4 cursor-pointer" /></th>
              <th className="p-3 cursor-pointer hover:text-teal-300 whitespace-nowrap" onClick={() => requestSort('ID_BRICK')}>COD{getSortIndicator('ID_BRICK')}</th>
              <th className="p-3 cursor-pointer hover:text-teal-300 whitespace-nowrap" onClick={() => requestSort('DS_REGION')}>NOME{getSortIndicator('DS_REGION')}</th>
              <th className="p-3 cursor-pointer hover:text-teal-300 whitespace-nowrap" onClick={() => requestSort('DS_CITY')}>CIDADE{getSortIndicator('DS_CITY')}</th>
              <th className="p-3 cursor-pointer hover:text-teal-300 whitespace-nowrap" onClick={() => requestSort('DS_UF')}>UF{getSortIndicator('DS_UF')}</th>
            </tr>
          </thead>
          <tbody>
            {visibleData?.map(b => (
              <BrickRow key={b.ID_BRICK} b={b} isSelected={selectedSet.has(b.ID_BRICK)} onRowSelect={onRowSelect} disabled={disabled} />
            ))}
          </tbody>
        </table>
        {visibleCount < sortedData.length && <div className="p-3 text-center text-xs text-slate-500 font-bold bg-gray-50 border-t border-gray-200">Desça para carregar mais... ({visibleCount} de {sortedData.length})</div>}
      </div>
    </div>
  );
});

// ============================================================================
// 4. TABELA DE HISTÓRICO COM EXPORTAÇÃO EXCEL
// ============================================================================
const HistoricoTable = React.memo(({ historico }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [tableFilters, setTableFilters] = useState({}); 
  const [openFilter, setOpenFilter] = useState(null);
  const [visibleCount, setVisibleCount] = useState(100);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const applyTableFilter = (key, value) => setTableFilters(prev => ({ ...prev, [key]: value }));

  const historicoProcessado = useMemo(() => {
    let processado = [...historico];
    Object.keys(tableFilters).forEach(key => {
      const filterValue = tableFilters[key]?.toLowerCase() || '';
      if (filterValue) processado = processado.filter(row => String(row[key] || '').toLowerCase().includes(filterValue));
    });
    if (sortConfig.key) {
      processado.sort((a, b) => {
        const valA = a[sortConfig.key] || '';
        const valB = b[sortConfig.key] || '';
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return processado;
  }, [historico, sortConfig, tableFilters]);

  const visibleData = historicoProcessado.slice(0, visibleCount);

  const handleScroll = (e) => {
    if (e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 100 && visibleCount < historicoProcessado.length) {
      setVisibleCount(prev => prev + 100);
    }
  };

  const exportarParaExcel = () => {
    if (historicoProcessado.length === 0) return alert('Não há dados para exportar.');
    const cabecalhos = ['LINHA', 'GD', 'COD_BRICK', 'NOME', 'CIDADE', 'UF', 'TERRITORIO', 'VERSAO', 'CHAVE_UNICA'];
    const linhas = historicoProcessado.map(r => {
      return [
        `"${r.LINHA || ''}"`,
        `"${r.GD || ''}"`,
        r.ID_BRICK,
        `"${(r.DS_REGION || '').replace(/"/g, '""')}"`,
        `"${(r.DS_CITY || '').replace(/"/g, '""')}"`,
        `"${r.DS_UF || ''}"`,
        `"${r.TERRITORY || ''}"`,
        `"${r.ALLOCATION_VERSION_NAME || ''}"`,
        `"${r.unique_key_new || ''}"` 
      ].join(';'); 
    });

    const csvString = cabecalhos.join(';') + '\n' + linhas.join('\n');
    const blob = new Blob(["\uFEFF" + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Historico_Alocacoes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mt-10 bg-white p-8 rounded-2xl shadow-2xl border border-gray-300">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-4">
          Registro de Alocações (Conferência - Versão Vigente)
          <span className="text-sm font-normal text-slate-500 bg-gray-100 px-3 py-1 rounded border border-gray-200">{historicoProcessado.length} Registros</span>
        </h2>
        <button onClick={exportarParaExcel} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded shadow transition-colors flex items-center gap-2 text-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          Exportar Excel
        </button>
      </div>

      <div className="overflow-auto max-h-80 custom-scrollbar border border-gray-200 rounded-md" onScroll={handleScroll}>
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-[#1E293B] text-white sticky top-0 z-10 shadow">
            <tr>
              <HeaderCell label="LINHA" columnKey="LINHA" filterValue={tableFilters['LINHA']} sortConfig={sortConfig} requestSort={requestSort} openFilter={openFilter} setOpenFilter={setOpenFilter} onApplyFilter={applyTableFilter} />
              <HeaderCell label="GD" columnKey="GD" filterValue={tableFilters['GD']} sortConfig={sortConfig} requestSort={requestSort} openFilter={openFilter} setOpenFilter={setOpenFilter} onApplyFilter={applyTableFilter} />
              <HeaderCell label="BRICK_ID" columnKey="ID_BRICK" filterValue={tableFilters['ID_BRICK']} sortConfig={sortConfig} requestSort={requestSort} openFilter={openFilter} setOpenFilter={setOpenFilter} onApplyFilter={applyTableFilter} />
              <HeaderCell label="NOME" columnKey="DS_REGION" filterValue={tableFilters['DS_REGION']} sortConfig={sortConfig} requestSort={requestSort} openFilter={openFilter} setOpenFilter={setOpenFilter} onApplyFilter={applyTableFilter} />
              <HeaderCell label="CIDADE" columnKey="DS_CITY" filterValue={tableFilters['DS_CITY']} sortConfig={sortConfig} requestSort={requestSort} openFilter={openFilter} setOpenFilter={setOpenFilter} onApplyFilter={applyTableFilter} />
              <HeaderCell label="UF" columnKey="DS_UF" filterValue={tableFilters['DS_UF']} sortConfig={sortConfig} requestSort={requestSort} openFilter={openFilter} setOpenFilter={setOpenFilter} onApplyFilter={applyTableFilter} />
              <HeaderCell label="TERRITÓRIO" columnKey="TERRITORY" filterValue={tableFilters['TERRITORY']} sortConfig={sortConfig} requestSort={requestSort} openFilter={openFilter} setOpenFilter={setOpenFilter} onApplyFilter={applyTableFilter} />
              <HeaderCell label="VERSÃO" columnKey="ALLOCATION_VERSION_NAME" filterValue={tableFilters['ALLOCATION_VERSION_NAME']} sortConfig={sortConfig} requestSort={requestSort} openFilter={openFilter} setOpenFilter={setOpenFilter} onApplyFilter={applyTableFilter} />
            </tr>
          </thead>
          <tbody>
            {visibleData.length > 0 ? visibleData.map((row, i) => (
                <tr key={row.unique_key_new || row.id || i} className="border-b hover:bg-gray-100 transition-colors">
                  <td className="p-3 font-medium text-slate-700 bg-gray-50">{row.LINHA}</td>
                  <td className="p-3 font-medium text-slate-700 bg-gray-50">{row.GD}</td>
                  <td className="p-3 font-medium text-slate-700">{row.ID_BRICK}</td>
                  <td className="p-3">{row.DS_REGION}</td>
                  <td className="p-3">{row.DS_CITY}</td>
                  <td className="p-3">{row.DS_UF}</td>
                  <td className="p-3 font-bold text-teal-700">{row.TERRITORY}</td>
                  <td className="p-3 text-xs text-slate-500">{row.ALLOCATION_VERSION_NAME}</td>
                </tr>
              )) : <tr><td colSpan="8" className="p-6 text-center text-gray-500">Nenhum registro encontrado.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
});

// ============================================================================
// 5. COMPONENTE DE BOTÃO DO TERRITÓRIO
// ============================================================================
const BotaoTrocarTerritorio = ({ territorioAtual, territoriosPermitidos = [], onTrocar }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <div className="flex items-center gap-6">
        <h1 className="text-3xl font-bold text-slate-800">Alocação: {territorioAtual || 'Nenhum'}</h1>
        <button className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition shadow" onClick={() => setIsOpen(true)}>Trocar Território</button>
      </div>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-sm shadow-2xl max-h-[80vh] flex flex-col">
            <h2 className="text-lg font-bold mb-4">Selecione o Território</h2>
            <div className="overflow-y-auto custom-scrollbar flex-1">
              {territoriosPermitidos?.length > 0 ? (
                territoriosPermitidos.map(t => <button key={t} onClick={() => { onTrocar(String(t)); setIsOpen(false); }} className="w-full p-4 mb-2 bg-gray-50 border border-gray-200 rounded-lg text-left font-bold text-slate-700 hover:bg-teal-50 hover:border-teal-300 transition">{t}</button>)
              ) : <p className="text-gray-500 text-center py-6 text-sm">Nenhum território vinculado.</p>}
            </div>
            <button onClick={() => setIsOpen(false)} className="mt-4 w-full text-center text-slate-500 underline font-bold hover:text-slate-800">Cancelar</button>
          </div>
        </div>
      )}
    </>
  );
};

// ============================================================================
// 6. LÓGICA PRINCIPAL
// ============================================================================
function AlocacaoPrincipal({ usuario, onLogout }) {
  const [territorio, setTerritorio] = useState(usuario?.COD_TERRITORIO ? String(usuario.COD_TERRITORIO) : '');
  const [territoriosPermitidos, setTerritoriosPermitidos] = useState([]);
  const [linhasPorTerritorio, setLinhasPorTerritorio] = useState({});
  
  const [masterBricks, setMasterBricks] = useState([]); 
  const [disponiveis, setDisponiveis] = useState([]);
  const [alocados, setAlocados] = useState([]);
  const [alocadosIniciais, setAlocadosIniciais] = useState([]); 
  const [historico, setHistorico] = useState([]);
  
  const [marcadosDisponiveis, setMarcadosDisponiveis] = useState([]);
  const [marcadosAlocados, setMarcadosAlocados] = useState([]);
  
  const [termoFiltradoEsq, setTermoFiltradoEsq] = useState('');
  const [colunaBuscaEsq, setColunaBuscaEsq] = useState('TODAS');
  const [termoFiltradoDir, setTermoFiltradoDir] = useState('');
  const [colunaBuscaDir, setColunaBuscaDir] = useState('TODAS');
  
  const [carregando, setCarregando] = useState(false);
  const [mensagemLoading, setMensagemLoading] = useState('Processando...');
  const [avisoModal, setAvisoModal] = useState(null); 
  const [versaoAtiva, setVersaoAtiva] = useState(null);
  const [podeEditar, setPodeEditar] = useState(false);

  const carregarTerritoriosGD = async () => {
    if (!usuario?.COD_TERRITORIO) return;
    const { data, error } = await supabase.from('CAD_ESTRUTURA_FV').select('CODIGO_TERRITORIO, LINHA').eq('CODIGO_GD', usuario.COD_TERRITORIO);
    if (!error && data && data.length > 0) {
      const lista = data.map(item => String(item.CODIGO_TERRITORIO)).filter(Boolean);
      const mapLinhas = {};
      data.forEach(item => { if (item.CODIGO_TERRITORIO) mapLinhas[item.CODIGO_TERRITORIO] = item.LINHA || ''; });
      setLinhasPorTerritorio(mapLinhas);
      setTerritoriosPermitidos(lista);
      setTerritorio(prev => (!lista.includes(prev) && lista[0]) ? lista[0] : prev);
    } else {
      setTerritoriosPermitidos([]); setTerritorio(''); setLinhasPorTerritorio({});
    }
  };

  const carregarDados = async () => {
    if (!territorio) return;
    setMensagemLoading('Carregando Território...'); setCarregando(true);
    
    const { data: versaoData } = await supabase.from('ALLOCATION_VERSIONS').select('*').eq('"IS_ACTIVE"', true).limit(1);
    let dentroDoPrazo = false; let versaoInfo = null;

    if (versaoData && versaoData.length > 0) {
      versaoInfo = versaoData[0]; setVersaoAtiva(versaoInfo);
      const tzOffset = (new Date()).getTimezoneOffset() * 60000;
      const hoje = (new Date(Date.now() - tzOffset)).toISOString().split('T')[0];
      const inicio = versaoInfo.EDIT_START_DATE || '2000-01-01';
      const fim = versaoInfo.EDIT_END_DATE || '2099-01-01';
      dentroDoPrazo = hoje >= inicio && hoje <= fim;
      setPodeEditar(dentroDoPrazo && usuario?.PERFIL !== 'REP');
    } else {
      setVersaoAtiva(null); setPodeEditar(false);
    }

    if (dentroDoPrazo && usuario?.PERFIL !== 'REP') {
      let bricksBase = masterBricks;
      if (bricksBase.length === 0) {
        const { data: todosBricks } = await supabase.from('CAD_BRICKS').select('*');
        if (todosBricks) { bricksBase = todosBricks.map(i => ({...i, ID_BRICK: parseInt(i.ID_BRICK, 10)})); setMasterBricks(bricksBase); }
      }
      const { data: todasAlocacoes } = await supabase.from('BRICK_TERR_ALLOCATION').select('"ID_BRICK", "TERRITORY"').eq('"ALLOCATION_VERSION_NAME"', versaoInfo?.ALLOCATION_VERSION_NAME || '');
      const idsNesteTerritorio = new Set((todasAlocacoes || []).filter(a => String(a.TERRITORY) === String(territorio)).map(a => parseInt(a.ID_BRICK, 10)));
      const idsOutrosTerritorios = new Set((todasAlocacoes || []).filter(a => String(a.TERRITORY) !== String(territorio)).map(a => parseInt(a.ID_BRICK, 10)));
      
      const arrayAlocados = bricksBase.filter(b => idsNesteTerritorio.has(b.ID_BRICK));
      const arrayDisponiveis = bricksBase.filter(b => !idsNesteTerritorio.has(b.ID_BRICK) && !idsOutrosTerritorios.has(b.ID_BRICK));
      setDisponiveis(arrayDisponiveis); setAlocados(arrayAlocados); setAlocadosIniciais(arrayAlocados); 
    } else {
      setDisponiveis([]); setAlocados([]); setAlocadosIniciais([]);
    }

    let queryHistorico = supabase.from('BRICK_TERR_ALLOCATION').select('unique_key_new, "ID_BRICK", "DS_REGION", "DS_CITY", "DS_UF", "DS_BR_REGION", "TERRITORY", "ALLOCATION_VERSION_NAME", "GD", "LINHA"');
    if (versaoInfo?.ALLOCATION_VERSION_NAME) {
      queryHistorico = queryHistorico.eq('"ALLOCATION_VERSION_NAME"', versaoInfo.ALLOCATION_VERSION_NAME);
    }
    
    const { data: historicoCompleto } = await queryHistorico;
    setHistorico(historicoCompleto || []); setCarregando(false);
  };

  useEffect(() => { carregarTerritoriosGD(); }, [usuario?.COD_TERRITORIO]);
  useEffect(() => { setTermoFiltradoEsq(''); setColunaBuscaEsq('TODAS'); setTermoFiltradoDir(''); setColunaBuscaDir('TODAS'); setMarcadosDisponiveis([]); setMarcadosAlocados([]); carregarDados(); }, [territorio]);

  const toggleSelectDisponiveis = useCallback((id) => setMarcadosDisponiveis(prev => { const s = new Set(prev); if(s.has(id)) s.delete(id); else s.add(id); return Array.from(s); }), []);
  const toggleSelectAlocados = useCallback((id) => setMarcadosAlocados(prev => { const s = new Set(prev); if(s.has(id)) s.delete(id); else s.add(id); return Array.from(s); }), []);
  
  const handleSelectAllDisp = useCallback(() => setMarcadosDisponiveis(prev => prev.length === bricksFiltradosEsq.length ? [] : bricksFiltradosEsq.map(b => b.ID_BRICK)), [disponiveis, termoFiltradoEsq, colunaBuscaEsq]);
  const handleSelectAllAloc = useCallback(() => setMarcadosAlocados(prev => prev.length === bricksFiltradosDir.length ? [] : bricksFiltradosDir.map(b => b.ID_BRICK)), [alocados, termoFiltradoDir, colunaBuscaDir]);
  
  const handleSearchEsq = useCallback((term, col) => { setTermoFiltradoEsq(term || ''); setColunaBuscaEsq(col || 'TODAS'); }, []);
  const handleSearchDir = useCallback((term, col) => { setTermoFiltradoDir(term || ''); setColunaBuscaDir(col || 'TODAS'); }, []);

  const bricksFiltradosEsq = useMemo(() => disponiveis.filter(b => {
    if (!termoFiltradoEsq) return true; const t = termoFiltradoEsq.toLowerCase();
    if (colunaBuscaEsq === 'TODAS') return String(b.ID_BRICK || '').includes(t) || String(b.DS_REGION || '').toLowerCase().includes(t) || String(b.DS_CITY || '').toLowerCase().includes(t) || String(b.DS_UF || '').toLowerCase().includes(t);
    return String(b[colunaBuscaEsq] || '').toLowerCase().includes(t);
  }), [disponiveis, termoFiltradoEsq, colunaBuscaEsq]);

  const bricksFiltradosDir = useMemo(() => alocados.filter(b => {
    if (!termoFiltradoDir) return true; const t = termoFiltradoDir.toLowerCase();
    if (colunaBuscaDir === 'TODAS') return String(b.ID_BRICK || '').includes(t) || String(b.DS_REGION || '').toLowerCase().includes(t) || String(b.DS_CITY || '').toLowerCase().includes(t) || String(b.DS_UF || '').toLowerCase().includes(t);
    return String(b[colunaBuscaDir] || '').toLowerCase().includes(t);
  }), [alocados, termoFiltradoDir, colunaBuscaDir]);

  const salvarAlocacao = async () => {
    if (!podeEditar) return setAvisoModal({ tipo: 'error', texto: 'Ação bloqueada. Sem permissão ou fora do prazo de edição.' });
    setMensagemLoading('Salvando Alocações...'); setCarregando(true);

    const idsAtuais = new Set(alocados.map(b => b.ID_BRICK));
    const removidos = alocadosIniciais.filter(b => !idsAtuais.has(b.ID_BRICK));

    if (removidos.length > 0) {
      const idsRemover = removidos.map(b => b.ID_BRICK);
      const { error: deleteError } = await supabase.from('BRICK_TERR_ALLOCATION').delete().eq('"TERRITORY"', territorio).eq('"ALLOCATION_VERSION_NAME"', versaoAtiva.ALLOCATION_VERSION_NAME).in('"ID_BRICK"', idsRemover);
      if (deleteError) { setCarregando(false); return setAvisoModal({ tipo: 'error', texto: `Erro ao remover antigos: ${deleteError.message}` }); }
    }

    const idsIniciais = new Set(alocadosIniciais.map(b => b.ID_BRICK));
    const adicionados = alocados.filter(b => !idsIniciais.has(b.ID_BRICK));

    if (adicionados.length > 0) {
      const linhaDoTerritorio = linhasPorTerritorio[territorio] || '';
      const versaoNome = versaoAtiva.ALLOCATION_VERSION_NAME;

      // ATENÇÃO: NÃO ESTAMOS MAIS ENVIANDO A COLUNA 'unique_key_new'
      const payload = adicionados.map(b => {
        return { 
          "ID_BRICK": parseInt(b.ID_BRICK, 10), 
          "DS_REGION": b.DS_REGION, 
          "DS_UF": b.DS_UF, 
          "DS_CITY": b.DS_CITY, 
          "DS_BR_REGION": b.DS_BR_REGION, 
          "TERRITORY": String(territorio), 
          "CREATED_BY": usuario.EMAIL, 
          "ALLOCATION_VERSION_NAME": versaoNome,
          "GD": String(usuario.COD_TERRITORIO),
          "LINHA": linhaDoTerritorio
        };
      });

      const { error: insertError } = await supabase.from('BRICK_TERR_ALLOCATION').insert(payload);
      if (insertError) { setCarregando(false); return setAvisoModal({ tipo: 'error', texto: `Erro ao salvar novos: ${insertError.message}` }); }
    }

    await carregarDados(); 
    setAvisoModal({ tipo: 'success', texto: 'Sua alocação de territórios foi salva e registrada no banco de dados com sucesso!' });
  };

  const isLocked = carregando || !podeEditar;
  const formatarDataSegura = (dataString) => (!dataString || typeof dataString !== 'string') ? '--/--/----' : dataString.split('-').reverse().join('/');

  return (
    <div className="min-h-screen bg-slate-800 p-8 font-sans relative">
      {carregando && <LoadingModal mensagem={mensagemLoading} />}
      <AlertModal aviso={avisoModal} onClose={() => setAvisoModal(null)} />

      <header className="bg-gray-200 rounded-b-md p-6 shadow-md mb-6 flex items-start justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-4 mb-3">
              <span className="bg-teal-600 text-white px-5 py-2 rounded-md font-extrabold text-xl">Bricker</span>
              <h1 className="text-2xl font-black text-slate-800 uppercase tracking-widest">Workspace</h1>
          </div>
          <div className="text-xs text-slate-600 font-bold bg-white px-3 py-1.5 rounded-md inline-block border border-gray-300 shadow-sm">
            LOGADO COMO: <span className="text-teal-700">{usuario?.NOME}</span> | {usuario?.EMAIL} | TERRITÓRIO: <span className="text-teal-700">{usuario?.COD_TERRITORIO}</span> | PERFIL: <span className="text-teal-700">{usuario?.PERFIL}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
            <div className={`px-4 py-2 rounded-md shadow-inner border ${podeEditar ? 'bg-slate-700 border-slate-600' : 'bg-red-50 border-red-300'}`}>
                <span className={`text-[10px] block uppercase tracking-wider font-bold ${podeEditar ? 'text-teal-300' : 'text-red-700'}`}>Versão Ativa {podeEditar ? '(Aberto)' : '(Bloqueado)'}</span>
                <span className={`font-bold text-sm ${podeEditar ? 'text-white' : 'text-red-800'}`}>{versaoAtiva?.ALLOCATION_VERSION_NAME || 'Nenhuma configurada'}</span>
            </div>
            <button onClick={onLogout} className="bg-gray-300 hover:bg-gray-400 text-slate-700 px-4 py-2 rounded-md font-bold transition">Sair</button>
        </div>
      </header>

      <main className="bg-gray-200 p-8 rounded-2xl shadow-2xl">
        {!podeEditar && (
          <div className="bg-red-100 border-l-8 border-red-600 text-red-800 p-6 mb-8 rounded shadow-sm text-center">
            <h2 className="text-2xl font-black uppercase tracking-wider">{usuario?.PERFIL === 'REP' ? 'ACESSO DE LEITURA. PERFIL SEM PERMISSÃO DE EDIÇÃO.' : 'FORA DO PERÍODO DE AJUSTES, DADOS APENAS INFORMATIVOS'}</h2>
            {versaoAtiva && usuario?.PERFIL !== 'REP' && <p className="mt-2 text-sm font-bold text-red-700">A edição esteve/estará liberada somente entre {formatarDataSegura(versaoAtiva?.EDIT_START_DATE)} e {formatarDataSegura(versaoAtiva?.EDIT_END_DATE)}.</p>}
          </div>
        )}

        {podeEditar && (
          <>
            <div className="flex justify-between border-b border-gray-300 pb-6 mb-6 items-center">
                <BotaoTrocarTerritorio territorioAtual={territorio} territoriosPermitidos={territoriosPermitidos} onTrocar={(novo) => setTerritorio(novo)} />
                <button onClick={salvarAlocacao} disabled={carregando} className="px-8 py-3 rounded-md font-bold text-white transition bg-teal-600 hover:bg-teal-700 shadow">Salvar Alocação</button>
            </div>

            <div className="flex gap-4">
              <BrickTable title="Disponíveis" data={bricksFiltradosEsq} selectedRows={marcadosDisponiveis} onRowSelect={toggleSelectDisponiveis} onSelectAll={handleSelectAllDisp} isAllSelected={bricksFiltradosEsq.length > 0 && marcadosDisponiveis.length === bricksFiltradosEsq.length} disabled={isLocked} count={disponiveis.length} showSearch={true} onSearch={handleSearchEsq} resetTrigger={territorio} headerBg="bg-white" />
              
              <div className="flex flex-col justify-center gap-2">
                <button className="bg-green-600 hover:bg-green-700 font-bold text-white px-4 py-2 rounded shadow transition-colors disabled:bg-gray-400" disabled={isLocked || marcadosDisponiveis.length === 0} onClick={() => { setAlocados([...alocados, ...disponiveis.filter(b => marcadosDisponiveis.includes(b.ID_BRICK))]); setDisponiveis(disponiveis.filter(b => !marcadosDisponiveis.includes(b.ID_BRICK))); setMarcadosDisponiveis([]); }}>Adicionar →</button>
                <button className="bg-red-600 hover:bg-red-700 font-bold text-white px-4 py-2 rounded shadow transition-colors disabled:bg-gray-400" disabled={isLocked || marcadosAlocados.length === 0} onClick={() => { setDisponiveis([...disponiveis, ...alocados.filter(b => marcadosAlocados.includes(b.ID_BRICK))]); setAlocados(alocados.filter(b => !marcadosAlocados.includes(b.ID_BRICK))); setMarcadosAlocados([]); }}>← Remover</button>
              </div>
              
              <BrickTable title="Alocados" data={bricksFiltradosDir} selectedRows={marcadosAlocados} onRowSelect={toggleSelectAlocados} onSelectAll={handleSelectAllAloc} isAllSelected={bricksFiltradosDir.length > 0 && marcadosAlocados.length === bricksFiltradosDir.length} disabled={isLocked} count={alocados.length} showSearch={true} onSearch={handleSearchDir} resetTrigger={territorio} headerBg="bg-teal-50" />
            </div>
          </>
        )}
      </main>

      <HistoricoTable historico={historico} />
      
    </div>
  );
}

export default function AlocacaoTerritorioWrapper(props) { return <ErrorBoundary><AlocacaoPrincipal {...props} /></ErrorBoundary>; }