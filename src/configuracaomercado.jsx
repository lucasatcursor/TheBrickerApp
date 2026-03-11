import { supabase } from './supabaseClient';
import React, { useState, useEffect, useMemo, useRef } from 'react';

// ============================================================================
// 1. COMPONENTES AUXILIARES
// ============================================================================
const LoadingModal = ({ mensagem }) => (
  <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-[99999] transition-all">
    <svg className="animate-spin h-16 w-16 text-blue-500 mb-6" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <h2 className="text-2xl font-bold text-white tracking-widest uppercase">{mensagem}</h2>
  </div>
);

const AlertModal = ({ aviso, onClose }) => {
  if (!aviso) return null;
  const isError = aviso.tipo === 'error';
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[999999] p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 mx-auto shadow-inner ${isError ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
          {isError ? '❌' : '✅'}
        </div>
        <h3 className={`text-2xl font-black mb-2 ${isError ? 'text-red-700' : 'text-blue-700'}`}>{isError ? 'Atenção' : 'Sucesso!'}</h3>
        <p className="text-slate-600 font-medium mb-8 leading-relaxed">{aviso.texto}</p>
        <button onClick={onClose} className={`w-full py-3 rounded-lg font-bold text-white shadow-md ${isError ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>Entendido</button>
      </div>
    </div>
  );
};

const CaixaPesquisa = ({ onSearch }) => {
  const [termo, setTermo] = useState('');
  const [coluna, setColuna] = useState('TODAS');

  useEffect(() => { onSearch(termo, coluna); }, [termo, coluna, onSearch]);

  return (
    <div className="flex gap-2 w-full">
      <input 
        type="text" placeholder="Buscar..." value={termo} onChange={(e) => setTermo(e.target.value)}
        className="flex-grow min-w-0 p-2 bg-white border border-gray-300 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500" 
      />
      <select 
        value={coluna} onChange={(e) => setColuna(e.target.value)}
        className="shrink-0 w-28 p-2 bg-white border border-gray-300 rounded text-xs text-slate-700 outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="TODAS">Tudo</option>
        <option value="SKU_ID">Cód SKU</option>
        <option value="SKU_DESCRICAO">Descrição</option>
        <option value="PRODUTO">Produto</option>
        <option value="MOLECULA">Molécula</option>
        <option value="DESC_CT1">CT1</option>
      </select>
    </div>
  );
};

// ============================================================================
// 2. CONFIGURAÇÃO DAS COLUNAS DINÂMICAS
// ============================================================================
const OPCOES_COLUNAS = [
  { id: 'COD_PRODUTO', label: 'Cód SKU' },
  { id: 'NOME_PRODUTO', label: 'Descrição' },
  { id: 'PRODUTO', label: 'Produto' },
  { id: 'MOLECULA', label: 'Molécula' },
  { id: 'DESC_CT1', label: 'Nível CT1' },
  { id: 'DESC_CT2', label: 'Nível CT2' },
  { id: 'DESC_CT3', label: 'Nível CT3' },
  { id: 'DESC_CT4', label: 'Nível CT4' },
  { id: 'FLAG_R_G_M_S', label: 'Categoria' }
];

// ============================================================================
// 3. O COMPONENTE PRINCIPAL DE MERCADOS
// ============================================================================
export default function ConfiguracaoMercado({ usuario, onLogout, onVoltar }) {
 // 1. Limpa espaços e força maiúsculo para garantir a leitura correta
const perfilSeguro = usuario?.PERFIL?.trim().toUpperCase();

// 2. Faz a verificação usando a variável tratada
const isAprovador = perfilSeguro === 'MKT_APROVADOR' || perfilSeguro === 'ADMIN';
const isAdmin = perfilSeguro === 'ADMIN';

  const [activeTab, setActiveTab] = useState('gestao');
  const [carregando, setCarregando] = useState(false);
  const [mensagemLoading, setMensagemLoading] = useState('');
  const [avisoModal, setAvisoModal] = useState(null);

  const [mercados, setMercados] = useState([]);
  const [produtosBase, setProdutosBase] = useState([]);
  
  const [mercadoSelecionado, setMercadoSelecionado] = useState(null);
  const [produtosDireita, setProdutosDireita] = useState([]); 
  const [selecionadosEsq, setSelecionadosEsq] = useState([]); 
  const [selecionadosDir, setSelecionadosDir] = useState([]); 
  
  const [buscaEsq, setBuscaEsq] = useState({ termo: '', coluna: 'TODAS' });
  const [buscaDir, setBuscaDir] = useState({ termo: '', coluna: 'TODAS' });

  const [colunasVisEsq, setColunasVisEsq] = useState(['COD_PRODUTO', 'NOME_PRODUTO', 'MOLECULA']);
  const [menuColEsq, setMenuColEsq] = useState(false);
  const [colunasVisDir, setColunasVisDir] = useState(['COD_PRODUTO', 'NOME_PRODUTO', 'MOLECULA']);
  const [menuColDir, setMenuColDir] = useState(false);

  const [mapaConflitos, setMapaConflitos] = useState({});
  const [alertaConflito, setAlertaConflito] = useState(null);

  const [visualizarMercado, setVisualizarMercado] = useState(null);
  const [produtosVisualizacao, setProdutosVisualizacao] = useState([]);

  const [modalNovoMercado, setModalNovoMercado] = useState(false);
  const [novoNomeMercado, setNovoNomeMercado] = useState('');
  const [modalReprovar, setModalReprovar] = useState(null); 
  const [motivoReprovacao, setMotivoReprovacao] = useState('');
  
  // ESTADO PARA O MODAL DE EXCLUSÃO
  const [modalExcluir, setModalExcluir] = useState(null);

  const ordenarPorNome = (lista) => {
    return [...lista].sort((a, b) => (a.NOME_PRODUTO || a.SKU_DESCRICAO || '').localeCompare(b.NOME_PRODUTO || b.SKU_DESCRICAO || ''));
  };

  const carregarDadosIniciais = async () => {
    setCarregando(true); setMensagemLoading('Carregando dados...');
    try {
      const { data: mercadosData } = await supabase.from('CAD_MERCADOS').select('*').order('UPDATED_AT', { ascending: false });
      if (mercadosData) setMercados(mercadosData);

      const { data: prodData } = await supabase.from('CAD_SKUS').select('*');
      if (prodData && prodData.length > 0) {
        const produtosMapeados = prodData.map(p => ({ ...p, COD_PRODUTO: p.SKU_ID, NOME_PRODUTO: p.SKU_DESCRICAO }));
        setProdutosBase(ordenarPorNome(produtosMapeados));
      } else { setProdutosBase([]); }
    } catch (error) { console.error(error); } finally { setCarregando(false); }
  };

  useEffect(() => { carregarDadosIniciais(); }, []);

  const handleCriarMercado = async (e) => {
    e.preventDefault();
    const nomeFormatado = novoNomeMercado.trim().toUpperCase();
    if (!nomeFormatado) return;

    const nomeJaExiste = mercados.some(m => m.NOME_MERCADO === nomeFormatado);
    if (nomeJaExiste) {
      setAvisoModal({ tipo: 'error', texto: `Já existe um mercado cadastrado com o nome "${nomeFormatado}". Escolha outro nome para evitar duplicidade.` });
      return;
    }
    
    setCarregando(true); setMensagemLoading('Criando mercado...');
    const payload = { NOME_MERCADO: nomeFormatado, STATUS: 'RASCUNHO', CREATED_BY: usuario.EMAIL, UPDATED_BY: usuario.EMAIL };
    const { data, error } = await supabase.from('CAD_MERCADOS').insert([payload]).select();
    setCarregando(false);
    
    if (error) { 
      setAvisoModal({ tipo: 'error', texto: `Erro ao criar: ${error.message}` });
    } else if (data && data.length > 0) {
      const novaListaMercados = [data[0], ...mercados];
      setMercados(novaListaMercados); setModalNovoMercado(false); setNovoNomeMercado('');
      abrirEditor(data[0], novaListaMercados); 
      setAvisoModal({ tipo: 'success', texto: 'Mercado criado com sucesso!' });
    }
  };

  const abrirEditor = async (mercado, listaMercados = mercados) => {
    setCarregando(true); setMensagemLoading('Mapeando produtos...');
    setMercadoSelecionado(mercado);
    setSelecionadosEsq([]); setSelecionadosDir([]);
    setBuscaEsq({ termo: '', coluna: 'TODAS' }); setBuscaDir({ termo: '', coluna: 'TODAS' });
    
    const { data: salvos } = await supabase.from('MERCADO_PRODUTOS').select('*').eq('ID_MERCADO', mercado.ID_MERCADO);
    if (salvos && salvos.length > 0) {
      const produtosRicos = salvos.map(salvo => {
        const infoBase = produtosBase.find(b => b.COD_PRODUTO === salvo.COD_PRODUTO) || {};
        return { ...salvo, ...infoBase };
      });
      setProdutosDireita(ordenarPorNome(produtosRicos));
    } else { setProdutosDireita([]); }

    const { data: outrosProdutos } = await supabase.from('MERCADO_PRODUTOS').select('COD_PRODUTO, ID_MERCADO').neq('ID_MERCADO', mercado.ID_MERCADO);
    const mapa = {};
    if (outrosProdutos) {
      outrosProdutos.forEach(item => {
        if (!mapa[item.COD_PRODUTO]) mapa[item.COD_PRODUTO] = new Set();
        const nomeMercado = listaMercados.find(m => m.ID_MERCADO === item.ID_MERCADO)?.NOME_MERCADO || `Outro Mercado`;
        mapa[item.COD_PRODUTO].add(nomeMercado);
      });
    }
    Object.keys(mapa).forEach(k => mapa[k] = Array.from(mapa[k]));
    setMapaConflitos(mapa);
    setCarregando(false);
  };

  const fecharEditor = () => { setMercadoSelecionado(null); setProdutosDireita([]); setMapaConflitos({}); };

  const abrirVisualizacao = async (mercado) => {
    setCarregando(true); setMensagemLoading('Buscando produtos...');
    setVisualizarMercado(mercado);
    const { data } = await supabase.from('MERCADO_PRODUTOS').select('*').eq('ID_MERCADO', mercado.ID_MERCADO);
    if (data) setProdutosVisualizacao(ordenarPorNome(data)); else setProdutosVisualizacao([]);
    setCarregando(false);
  };

  // --- NOVA FUNÇÃO DE EXCLUSÃO ---
  const confirmarExclusao = async () => {
    if (!modalExcluir) return;
    setCarregando(true); setMensagemLoading('Excluindo mercado...');
    try {
      // 1. Limpa os vínculos na tabela filha por segurança
      await supabase.from('MERCADO_PRODUTOS').delete().eq('ID_MERCADO', modalExcluir.ID_MERCADO);
      
      // 2. Deleta o cabeçalho do mercado
      const { error } = await supabase.from('CAD_MERCADOS').delete().eq('ID_MERCADO', modalExcluir.ID_MERCADO);
      if (error) throw error;
      
      // 3. Atualiza a tela
      setMercados(prev => prev.filter(m => m.ID_MERCADO !== modalExcluir.ID_MERCADO));
      setModalExcluir(null);
      setAvisoModal({ tipo: 'success', texto: 'Mercado apagado definitivamente do banco de dados.' });
    } catch (err) {
      setAvisoModal({ tipo: 'error', texto: `Erro ao excluir: ${err.message}` });
    } finally {
      setCarregando(false);
    }
  };

  const produtosEsquerda = useMemo(() => {
    const codigosDireita = new Set(produtosDireita.map(p => p.COD_PRODUTO));
    return produtosBase.filter(p => !codigosDireita.has(p.COD_PRODUTO));
  }, [produtosBase, produtosDireita]);

  const filtradosEsq = useMemo(() => {
    if (!buscaEsq.termo) return produtosEsquerda;
    const t = buscaEsq.termo.toLowerCase();
    return produtosEsquerda.filter(p => {
      if (buscaEsq.coluna === 'TODAS') return (p.SKU_ID?.toLowerCase().includes(t) || p.SKU_DESCRICAO?.toLowerCase().includes(t) || p.PRODUTO?.toLowerCase().includes(t) || p.MOLECULA?.toLowerCase().includes(t) || p.DESC_CT1?.toLowerCase().includes(t));
      return String(p[buscaEsq.coluna] || '').toLowerCase().includes(t);
    });
  }, [produtosEsquerda, buscaEsq]);

  const filtradosDir = useMemo(() => {
    if (!buscaDir.termo) return produtosDireita;
    const t = buscaDir.termo.toLowerCase();
    return produtosDireita.filter(p => {
      if (buscaDir.coluna === 'TODAS') return (p.SKU_ID?.toLowerCase().includes(t) || p.SKU_DESCRICAO?.toLowerCase().includes(t) || p.PRODUTO?.toLowerCase().includes(t) || p.MOLECULA?.toLowerCase().includes(t) || p.DESC_CT1?.toLowerCase().includes(t));
      return String(p[buscaDir.coluna] || '').toLowerCase().includes(t);
    });
  }, [produtosDireita, buscaDir]);

  const toggleSelect = (codigo, lado) => {
    if (lado === 'esq') setSelecionadosEsq(prev => prev.includes(codigo) ? prev.filter(c => c !== codigo) : [...prev, codigo]);
    else setSelecionadosDir(prev => prev.includes(codigo) ? prev.filter(c => c !== codigo) : [...prev, codigo]);
  };

  const moverParaDireita = () => {
    const itensParaMover = produtosEsquerda.filter(p => selecionadosEsq.includes(p.COD_PRODUTO));
    const itensComConflito = itensParaMover.filter(p => mapaConflitos[p.COD_PRODUTO]);
    if (itensComConflito.length > 0) setAlertaConflito({ todosItens: itensParaMover, detalhes: itensComConflito.map(p => ({ ...p, mercados: mapaConflitos[p.COD_PRODUTO] })) });
    else confirmarMovimentoDireita(itensParaMover);
  };

  const confirmarMovimentoDireita = (itens) => {
    setProdutosDireita(prev => ordenarPorNome([...prev, ...itens]));
    setSelecionadosEsq([]); setAlertaConflito(null);
  };

  const moverParaEsquerda = () => {
    setProdutosDireita(produtosDireita.filter(p => !selecionadosDir.includes(p.COD_PRODUTO)));
    setSelecionadosDir([]);
  };

  const guardarMercado = async (enviarAprovacao = false) => {
    setCarregando(true); setMensagemLoading('Salvando configurações...');
    const novoStatus = enviarAprovacao ? 'AGUARDANDO_APROVACAO' : 'RASCUNHO';
    try {
      await supabase.from('MERCADO_PRODUTOS').delete().eq('ID_MERCADO', mercadoSelecionado.ID_MERCADO);
      if (produtosDireita.length > 0) {
        const payloadProdutos = produtosDireita.map(p => ({ ID_MERCADO: mercadoSelecionado.ID_MERCADO, COD_PRODUTO: p.COD_PRODUTO, NOME_PRODUTO: p.NOME_PRODUTO, ADICIONADO_POR: usuario.EMAIL }));
        await supabase.from('MERCADO_PRODUTOS').insert(payloadProdutos);
      }
      await supabase.from('CAD_MERCADOS').update({ STATUS: novoStatus, UPDATED_BY: usuario.EMAIL, UPDATED_AT: new Date().toISOString() }).eq('ID_MERCADO', mercadoSelecionado.ID_MERCADO);
      await carregarDadosIniciais(); fecharEditor(); setAvisoModal({ tipo: 'success', texto: enviarAprovacao ? 'Mercado enviado para aprovação!' : 'Rascunho salvo com sucesso!' });
    } catch (err) { setAvisoModal({ tipo: 'error', texto: 'Erro ao salvar dados no servidor.' }); } finally { setCarregando(false); }
  };

  const processarAprovacao = async (idMercado, statusFinal, motivo = null) => {
    setCarregando(true); setMensagemLoading('Processando decisão...');
    const payload = { STATUS: statusFinal, APPROVED_BY: usuario.EMAIL, APPROVED_AT: new Date().toISOString(), MOTIVO_REPROVACAO: motivo };
    const { error } = await supabase.from('CAD_MERCADOS').update(payload).eq('ID_MERCADO', idMercado);
    setCarregando(false);
    if (error) setAvisoModal({ tipo: 'error', texto: `Erro: ${error.message}` });
    else { setModalReprovar(null); setMotivoReprovacao(''); await carregarDadosIniciais(); setAvisoModal({ tipo: 'success', texto: statusFinal === 'APROVADO' ? 'Mercado aprovado!' : 'Mercado reprovado.' }); }
  };

  // ============================================================================
  // RENDERIZAÇÃO
  // ============================================================================
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {carregando && <LoadingModal mensagem={mensagemLoading} />}
      <AlertModal aviso={avisoModal} onClose={() => setAvisoModal(null)} />

      <header className="bg-white p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between border-b border-gray-200">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <span className="bg-blue-600 text-white px-4 py-1 rounded-md font-extrabold text-lg">Bricker</span>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-widest">Configuração de Mercado</h1>
          </div>
          <p className="text-xs text-slate-500 font-bold">USUÁRIO: <span className="text-blue-700">{usuario?.NOME}</span> | PERFIL: <span className="text-blue-700">{usuario?.PERFIL}</span></p>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <button onClick={onVoltar} className="bg-slate-700 hover:bg-slate-900 text-white px-5 py-2.5 rounded-lg font-bold transition shadow-sm">← Menu</button>
        </div>
      </header>

      <div className="max-w-[95%] mx-auto p-6 mt-4">
        {mercadoSelecionado ? (
          
          /* === TELA DO EDITOR === */
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col h-[85vh]">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <div>
                <button onClick={fecharEditor} className="text-sm font-bold text-slate-500 hover:text-blue-600 mb-1">← Voltar à Lista</button>
                <h2 className="text-2xl font-black text-slate-800">Editando Mercado: <span className="text-blue-700">{mercadoSelecionado.NOME_MERCADO}</span></h2>
              </div>
              <div className="flex gap-3">
                <button onClick={() => guardarMercado(false)} className="bg-gray-200 hover:bg-gray-300 text-slate-700 font-bold px-6 py-2 rounded-lg transition">Salvar Rascunho</button>
                <button onClick={() => guardarMercado(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-lg shadow-md transition">Submeter p/ Aprovação</button>
              </div>
            </div>

            <div className="flex-1 flex p-6 gap-6 overflow-hidden">
              <div className="flex-1 flex flex-col border border-gray-300 rounded-xl overflow-hidden bg-white w-1/2">
                <div className="bg-slate-100 p-3 font-bold text-slate-700 flex justify-between items-center">
                  <span>Disponíveis</span><span className="bg-white px-2 py-0.5 rounded text-sm text-slate-500 border border-gray-200">{filtradosEsq.length}</span>
                </div>
                
                <div className="flex gap-2 p-2 bg-slate-100 border-b border-gray-300 items-center justify-between">
                  <CaixaPesquisa onSearch={(termo, coluna) => setBuscaEsq({ termo, coluna })} />
                  <div className="relative">
                    <button onClick={() => setMenuColEsq(!menuColEsq)} className="bg-white border border-gray-300 px-3 py-2 rounded text-xs font-bold text-slate-600 hover:bg-gray-50 shadow-sm whitespace-nowrap">⚙️ Colunas</button>
                    {menuColEsq && (
                      <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded shadow-2xl z-50 p-2">
                        <h4 className="text-[10px] font-black uppercase text-gray-400 mb-2 border-b pb-1">Mostrar/Ocultar</h4>
                        {OPCOES_COLUNAS.map(c => (
                          <label key={c.id} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 text-xs font-medium cursor-pointer rounded">
                            <input type="checkbox" className="accent-blue-600" checked={colunasVisEsq.includes(c.id)} onChange={() => setColunasVisEsq(prev => prev.includes(c.id) ? prev.filter(x => x !== c.id) : [...prev, c.id])} />
                            {c.label}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex-1 overflow-auto bg-white relative custom-scrollbar">
                  <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                    <thead className="sticky top-0 bg-slate-200 z-10 shadow-sm">
                      <tr>
                        <th className="p-3 w-10 text-center border-b border-gray-300">
                          <input type="checkbox" className="accent-blue-600 w-4 h-4 cursor-pointer"
                            checked={filtradosEsq.length > 0 && selecionadosEsq.length === filtradosEsq.length}
                            onChange={(e) => setSelecionadosEsq(e.target.checked ? filtradosEsq.map(p => p.COD_PRODUTO) : [])}
                          />
                        </th>
                        {OPCOES_COLUNAS.filter(c => colunasVisEsq.includes(c.id)).map(col => (
                          <th key={col.id} className="p-3 font-bold text-slate-700 border-b border-gray-300">{col.label}</th>
                        ))}
                        <th className="p-3 border-b border-gray-300 w-20"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtradosEsq.map(p => (
                        <tr key={p.COD_PRODUTO} onClick={() => toggleSelect(p.COD_PRODUTO, 'esq')} className={`cursor-pointer hover:bg-blue-50/50 border-b border-gray-100 ${selecionadosEsq.includes(p.COD_PRODUTO) ? 'bg-blue-50' : ''}`}>
                          <td className="p-3 text-center"><input type="checkbox" checked={selecionadosEsq.includes(p.COD_PRODUTO)} readOnly className="accent-blue-600 w-4 h-4 pointer-events-none" /></td>
                          {OPCOES_COLUNAS.filter(c => colunasVisEsq.includes(c.id)).map(col => (
                            <td key={col.id} className="p-3 text-slate-700 text-xs max-w-[200px] truncate" title={p[col.id]}>{p[col.id] || '-'}</td>
                          ))}
                          <td className="p-3 text-right">{mapaConflitos[p.COD_PRODUTO] && <span className="text-[10px] bg-yellow-100 text-yellow-700 font-bold px-2 py-1 rounded border border-yellow-200" title={`Em: ${mapaConflitos[p.COD_PRODUTO].join(', ')}`}>Em Uso</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-col justify-center gap-4">
                <button onClick={moverParaDireita} disabled={selecionadosEsq.length === 0} className="w-12 h-12 bg-blue-100 hover:bg-blue-600 text-blue-700 hover:text-white rounded-full flex items-center justify-center font-black transition disabled:opacity-30">❯</button>
                <button onClick={moverParaEsquerda} disabled={selecionadosDir.length === 0} className="w-12 h-12 bg-red-100 hover:bg-red-600 text-red-700 hover:text-white rounded-full flex items-center justify-center font-black transition disabled:opacity-30">❮</button>
              </div>

              <div className="flex-1 flex flex-col border border-blue-300 rounded-xl overflow-hidden bg-white shadow-[0_0_15px_rgba(59,130,246,0.1)] w-1/2">
                <div className="bg-blue-50 p-3 font-bold text-blue-800 flex justify-between items-center">
                  <span>No Mercado</span><span className="bg-white px-2 py-0.5 rounded text-sm text-blue-500 border border-blue-200">{filtradosDir.length}</span>
                </div>
                
                <div className="flex gap-2 p-2 bg-blue-50 border-b border-blue-200 items-center justify-between">
                  <CaixaPesquisa onSearch={(termo, coluna) => setBuscaDir({ termo, coluna })} />
                  <div className="relative">
                    <button onClick={() => setMenuColDir(!menuColDir)} className="bg-white border border-blue-300 px-3 py-2 rounded text-xs font-bold text-blue-700 hover:bg-blue-100 shadow-sm whitespace-nowrap">⚙️ Colunas</button>
                    {menuColDir && (
                      <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded shadow-2xl z-50 p-2">
                        <h4 className="text-[10px] font-black uppercase text-gray-400 mb-2 border-b pb-1">Mostrar/Ocultar</h4>
                        {OPCOES_COLUNAS.map(c => (
                          <label key={c.id} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 text-xs font-medium cursor-pointer rounded">
                            <input type="checkbox" className="accent-blue-600" checked={colunasVisDir.includes(c.id)} onChange={() => setColunasVisDir(prev => prev.includes(c.id) ? prev.filter(x => x !== c.id) : [...prev, c.id])} />
                            {c.label}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-auto bg-white relative custom-scrollbar">
                  <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                    <thead className="sticky top-0 bg-blue-100 z-10 shadow-sm">
                      <tr>
                        <th className="p-3 w-10 text-center border-b border-blue-200">
                          <input type="checkbox" className="accent-red-600 w-4 h-4 cursor-pointer"
                            checked={filtradosDir.length > 0 && selecionadosDir.length === filtradosDir.length}
                            onChange={(e) => setSelecionadosDir(e.target.checked ? filtradosDir.map(p => p.COD_PRODUTO) : [])}
                          />
                        </th>
                        {OPCOES_COLUNAS.filter(c => colunasVisDir.includes(c.id)).map(col => (
                          <th key={col.id} className="p-3 font-bold text-blue-900 border-b border-blue-200">{col.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtradosDir.length === 0 && <tr><td colSpan="10" className="p-6 text-center text-slate-400 text-sm italic">Nenhum produto selecionado.</td></tr>}
                      {filtradosDir.map(p => (
                        <tr key={p.COD_PRODUTO} onClick={() => toggleSelect(p.COD_PRODUTO, 'dir')} className={`cursor-pointer hover:bg-red-50/50 border-b border-gray-100 ${selecionadosDir.includes(p.COD_PRODUTO) ? 'bg-red-50' : ''}`}>
                          <td className="p-3 text-center"><input type="checkbox" checked={selecionadosDir.includes(p.COD_PRODUTO)} readOnly className="accent-red-600 w-4 h-4 pointer-events-none" /></td>
                          {OPCOES_COLUNAS.filter(c => colunasVisDir.includes(c.id)).map(col => (
                            <td key={col.id} className="p-3 text-slate-700 text-xs max-w-[200px] truncate" title={p[col.id]}>{p[col.id] || '-'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        ) : (
          
          /* === ABAS DE GESTÃO (LISTAS GERAIS) === */
          <>
            <div className="flex gap-4 border-b border-gray-300 mb-6 overflow-x-auto">
              <button onClick={() => setActiveTab('gestao')} className={`px-6 py-3 font-bold transition-colors border-b-4 whitespace-nowrap ${activeTab === 'gestao' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                Meus Projetos
              </button>
              {isAprovador && (
                <button onClick={() => setActiveTab('aprovacao')} className={`px-6 py-3 font-bold transition-colors border-b-4 flex items-center gap-2 whitespace-nowrap ${activeTab === 'aprovacao' ? 'border-yellow-500 text-yellow-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                  Central de Aprovação
                  {mercados.filter(m => m.STATUS === 'AGUARDANDO_APROVACAO').length > 0 && (
                    <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{mercados.filter(m => m.STATUS === 'AGUARDANDO_APROVACAO').length}</span>
                  )}
                </button>
              )}
              <button onClick={() => setActiveTab('ativos')} className={`px-6 py-3 font-bold transition-colors border-b-4 whitespace-nowrap ${activeTab === 'ativos' ? 'border-green-600 text-green-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                Mercados Ativos (Oficiais)
              </button>
            </div>

            {/* ABA: GESTÃO */}
            {activeTab === 'gestao' && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 min-h-[50vh]">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-slate-700">Meus Projetos</h2>
                  <button onClick={() => setModalNovoMercado(true)} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-md transition flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
                    Criar Novo Mercado
                  </button>
                </div>
                
                <div className="flex flex-col gap-3">
                  {mercados.filter(m => ['RASCUNHO', 'REPROVADO', 'AGUARDANDO_APROVACAO'].includes(m.STATUS)).length === 0 && (
                    <p className="text-slate-500 text-center py-10">Não existem mercados em andamento.</p>
                  )}
                  
                  {mercados.filter(m => ['RASCUNHO', 'REPROVADO', 'AGUARDANDO_APROVACAO'].includes(m.STATUS)).map(m => (
                    <div key={m.ID_MERCADO} className="border border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-md transition bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
                      
                      <div className="flex-1 w-full">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-black text-lg text-slate-800 truncate" title={m.NOME_MERCADO}>{m.NOME_MERCADO}</h3>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap
                            ${m.STATUS === 'REPROVADO' ? 'bg-red-100 text-red-700' : 
                              m.STATUS === 'AGUARDANDO_APROVACAO' ? 'bg-yellow-100 text-yellow-700' : 
                              'bg-gray-200 text-gray-700'}`}>
                            {m.STATUS.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">Última edição em {new Date(m.UPDATED_AT).toLocaleDateString('pt-BR')} às {new Date(m.UPDATED_AT).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>

                      <div className="flex gap-2 w-full md:w-auto mt-3 md:mt-0">
                        <button onClick={() => abrirVisualizacao(m)} className="flex-1 md:flex-none bg-blue-50 border border-blue-200 text-blue-700 font-bold py-2 px-4 rounded hover:bg-blue-100 transition flex items-center justify-center gap-2">
                          👁️ Ver Detalhes
                        </button>
                        
                        {m.STATUS === 'AGUARDANDO_APROVACAO' ? (
                          <button disabled className="flex-1 md:flex-none bg-gray-100 border border-gray-200 text-gray-400 font-bold py-2 px-4 rounded cursor-not-allowed flex items-center justify-center gap-2">
                            🔒 Em Análise
                          </button>
                        ) : (
                          <>
                            <button onClick={() => abrirEditor(m)} className="flex-1 md:flex-none bg-white border border-blue-300 text-blue-600 font-bold py-2 px-4 rounded hover:bg-blue-50 transition flex items-center justify-center gap-2">
                              ✏️ Editar
                            </button>
                            {/* BOTÃO DE EXCLUIR RASCUNHO/REPROVADO */}
                            <button onClick={() => setModalExcluir(m)} className="flex-1 md:flex-none bg-red-50 border border-red-200 text-red-600 font-bold py-2 px-4 rounded hover:bg-red-100 transition flex items-center justify-center gap-2" title="Excluir Mercado">
                              🗑️
                            </button>
                          </>
                        )}
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ABA: APROVAÇÃO */}
            {activeTab === 'aprovacao' && isAprovador && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 min-h-[50vh]">
                <h2 className="text-xl font-bold text-slate-700 mb-6">Mercados Aguardando Validação</h2>
                <div className="space-y-4">
                  {mercados.filter(m => m.STATUS === 'AGUARDANDO_APROVACAO').length === 0 && <p className="text-slate-500 text-center py-10">Nenhuma pendência de aprovação.</p>}
                  
                  {mercados.filter(m => m.STATUS === 'AGUARDANDO_APROVACAO').map(m => (
                    <div key={m.ID_MERCADO} className="border-l-4 border-yellow-500 bg-yellow-50/30 p-5 rounded-r-xl shadow-sm flex items-center justify-between">
                      <div>
                        <h3 className="font-black text-xl text-slate-800">{m.NOME_MERCADO}</h3>
                        <p className="text-sm text-slate-600">Submetido por: <span className="font-bold">{m.UPDATED_BY}</span></p>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => abrirVisualizacao(m)} className="bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300 font-bold px-4 py-2 rounded shadow-sm transition flex items-center gap-2">
                          👁️ Analisar Mercado
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ABA: ATIVOS */}
            {activeTab === 'ativos' && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 min-h-[50vh]">
                <h2 className="text-xl font-bold text-slate-700 mb-6">Mercados Oficiais</h2>
                <div className="flex flex-col gap-3">
                  {mercados.filter(m => m.STATUS === 'APROVADO').length === 0 && <p className="text-slate-500 text-center py-10">Nenhum mercado ativo ainda.</p>}
                  
                  {mercados.filter(m => m.STATUS === 'APROVADO').map(m => (
                    <div key={m.ID_MERCADO} className="border border-green-200 bg-green-50/30 rounded-xl p-4 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                      <div className="flex-1 w-full">
                        <h3 className="font-black text-lg text-slate-800">{m.NOME_MERCADO}</h3>
                        <p className="text-xs text-slate-500 mt-1">Aprovado por <span className="font-bold">{m.APPROVED_BY}</span> em {new Date(m.APPROVED_AT).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div className="flex gap-2 w-full md:w-auto mt-3 md:mt-0">
                        <button onClick={() => abrirVisualizacao(m)} className="flex-1 md:flex-none w-full md:w-auto bg-white border border-slate-300 text-slate-700 font-bold py-2 px-6 rounded hover:bg-slate-100 transition">
                          👁️ Ver Produtos
                        </button>
                        {/* BOTÃO DE EXCLUIR OFICIAL (APENAS ADMIN) */}
                        {isAdmin && (
                          <button onClick={() => setModalExcluir(m)} className="bg-red-50 border border-red-200 text-red-600 font-bold py-2 px-4 rounded hover:bg-red-100 transition flex items-center justify-center gap-2" title="Excluir Mercado Oficial">
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* === MODAIS GLOBAIS === */}
      {/* MODAL DE EXCLUSÃO */}
      {modalExcluir && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl border-t-8 border-red-600">
            <h2 className="text-2xl font-black text-slate-800 mb-2">Excluir Mercado</h2>
            <p className="text-sm text-slate-600 mb-6">
              Tem certeza que deseja excluir permanentemente o mercado <span className="font-bold">"{modalExcluir.NOME_MERCADO}"</span>? Esta ação não poderá ser desfeita.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setModalExcluir(null)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-slate-700 font-bold py-3 rounded-lg transition">Cancelar</button>
              <button onClick={confirmarExclusao} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg shadow-md transition">Sim, Excluir</button>
            </div>
          </div>
        </div>
      )}

      {alertaConflito && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[99999] p-4 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl w-full max-w-2xl shadow-2xl border-t-8 border-yellow-500 flex flex-col max-h-[90vh]">
            <h2 className="text-2xl font-black text-slate-800 mb-2">Atenção: Colisão de Mercado</h2>
            <p className="text-sm text-slate-600 mb-6">Você está tentando incluir produtos que já pertencem a outros mercados cadastrados. Deseja incluí-los mesmo assim?</p>
            <div className="flex-1 overflow-y-auto bg-slate-50 border border-gray-200 rounded-lg p-4 mb-6">
              <ul className="space-y-3">
                {alertaConflito.detalhes.map(c => (
                  <li key={c.COD_PRODUTO} className="text-sm text-slate-800 bg-white p-3 rounded shadow-sm border border-gray-200">
                    <span className="font-bold text-red-600">💊 {c.NOME_PRODUTO}</span>
                    <div className="mt-1 text-xs">Em: <span className="font-bold bg-yellow-100 px-1 py-0.5 rounded">{c.mercados.join(', ')}</span></div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-end gap-3 mt-auto">
              <button onClick={() => setAlertaConflito(null)} className="bg-gray-200 hover:bg-gray-300 text-slate-700 font-bold py-3 px-6 rounded-lg">Cancelar</button>
              <button onClick={() => confirmarMovimentoDireita(alertaConflito.todosItens)} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg">Sim, Incluir</button>
            </div>
          </div>
        </div>
      )}

      {visualizarMercado && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
              <div>
                <h2 className="text-2xl font-black text-slate-800">Mercado: <span className="text-blue-700">{visualizarMercado.NOME_MERCADO}</span></h2>
              </div>
              <button onClick={() => setVisualizarMercado(null)} className="text-slate-400 hover:text-red-500 font-bold text-3xl leading-none">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto mb-6 bg-slate-50 border border-gray-200 rounded-xl">
              <ul className="divide-y divide-gray-200">
                {produtosVisualizacao.map(p => (
                  <li key={p.COD_PRODUTO} className="py-3 px-4 flex items-center gap-3">
                    <span className="text-blue-500 text-lg">💊</span>
                    <span className="text-slate-800 text-sm">
                      <span className="font-bold">{p.NOME_PRODUTO}</span>
                      <span className="text-slate-400 ml-2">({p.COD_PRODUTO})</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-200">
              <button onClick={() => setVisualizarMercado(null)} className="bg-gray-200 hover:bg-gray-300 font-bold py-2 px-6 rounded-lg">Fechar</button>
              {visualizarMercado.STATUS === 'AGUARDANDO_APROVACAO' && isAprovador && (
                <div className="flex gap-3">
                  <button onClick={() => { setVisualizarMercado(null); setModalReprovar(visualizarMercado.ID_MERCADO); }} className="bg-red-100 text-red-700 font-bold py-2 px-6 rounded-lg">👎 Reprovar</button>
                  <button onClick={() => { setVisualizarMercado(null); processarAprovacao(visualizarMercado.ID_MERCADO, 'APROVADO'); }} className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg">👍 Aprovar</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {modalNovoMercado && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-black mb-6">Novo Mercado</h2>
            <form onSubmit={handleCriarMercado}>
              <input type="text" autoFocus required value={novoNomeMercado} onChange={(e) => setNovoNomeMercado(e.target.value)} placeholder="NOME DO MERCADO" className="w-full p-4 border rounded-lg mb-6 uppercase" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setModalNovoMercado(false)} className="flex-1 bg-gray-200 font-bold py-3 rounded-lg">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-lg">Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalReprovar && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl border-t-8 border-red-500">
            <h2 className="text-2xl font-black mb-2">Reprovar</h2>
            <textarea rows="4" autoFocus required value={motivoReprovacao} onChange={(e) => setMotivoReprovacao(e.target.value)} placeholder="Motivo..." className="w-full p-3 border rounded-lg mb-6 resize-none" />
            <div className="flex gap-3">
              <button onClick={() => setModalReprovar(null)} className="flex-1 bg-gray-200 font-bold py-3 rounded-lg">Cancelar</button>
              <button onClick={() => processarAprovacao(modalReprovar, 'REPROVADO', motivoReprovacao)} disabled={!motivoReprovacao.trim()} className="flex-1 bg-red-600 text-white font-bold py-3 rounded-lg">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}