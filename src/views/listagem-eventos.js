import React from 'react';
import Card from '../components/card';
import { mensagemSucesso, mensagemErro, mensagemAlert } from '../components/toastr';
import axios from 'axios';
import { BASE_URL } from '../config/axios';


function paraISO(valor) {
  const texto = String(valor || '');
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto;
  const m = texto.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  return m && m[1] !== '00' && m[2] !== '00' ? `${m[3]}-${m[2]}-${m[1]}` : '';
}


function formatarData(valor) {
  const iso = paraISO(valor);
  return iso ? iso.split('-').reverse().join('/') : '-';
}


function usuarioLogado() {
  try {
    return JSON.parse(localStorage.getItem('usuarioLogado'));
  } catch (error) {
    return null;
  }
}


function situacao(evento, hoje) {
  if (evento.status === 'excluido') return 'excluido';
  const inicio = paraISO(evento.inicioInscricao);
  const fim = paraISO(evento.fimInscricao);
  if (evento.status === 'fechado' || (inicio && hoje < inicio) || (fim && hoje > fim)) return 'fechado';
  return 'aberto';
}

const ROTULO = { aberto: 'Aberto', fechado: 'Fechado', excluido: 'Excluído' };
const COR = { aberto: 'bg-success', fechado: 'bg-secondary', excluido: 'bg-danger' };

function ListagemEventos() {
  const usuario = usuarioLogado();
  const hoje = new Date().toLocaleDateString('sv-SE'); // aaaa-mm-dd no horário do computador

  const [eventos, setEventos] = React.useState(null);
  const [categorias, setCategorias] = React.useState([]);
  const [inscricoes, setInscricoes] = React.useState([]);
  const [busca, setBusca] = React.useState('');
  const [idCategoria, setIdCategoria] = React.useState('');
  const [statusFiltro, setStatusFiltro] = React.useState('ativos');
  const [detalhe, setDetalhe] = React.useState(null);
  const [inscrevendo, setInscrevendo] = React.useState(false);

  React.useEffect(() => {
    Promise.all([
      axios.get(`${BASE_URL}/eventos`),
      axios.get(`${BASE_URL}/categorias`),
      axios.get(`${BASE_URL}/inscricoes`),
    ])
      .then(([e, c, i]) => {
        setEventos(e.data);
        setCategorias(c.data);
        setInscricoes(i.data);
      })
      .catch(() => {
        setEventos([]);
        mensagemErro('Não foi possível carregar os eventos');
      });
  }, []);

  if (!eventos) {
    return (
      <div className='container'>
        <Card title='Eventos'>
          <p>Carregando eventos…</p>
        </Card>
      </div>
    );
  }

  const nomeCategoria = (id, evento) => {
    const categoria = categorias.find((c) => String(c.id) === String(id));
    return categoria ? categoria.nome.trim() : evento.categoriaRemovida || 'Categoria removida';
  };

  
  const ativasDo = (evento, lista = inscricoes) =>
    lista.filter((i) => String(i.idEvento) === String(evento.id) && i.status !== 'cancelada');
  const vagasDo = (evento, lista = inscricoes) => Math.max(0, Number(evento.capacidade || 0) - ativasDo(evento, lista).length);
  const jaInscrito = (evento, lista = inscricoes) =>
    Boolean(usuario) && ativasDo(evento, lista).some((i) => String(i.idUsuario) === String(usuario.id));


  function motivoSemInscricao(evento) {
    if (!usuario) return 'Entre na sua conta para se inscrever.';
    if (String(evento.idUsuario) === String(usuario.id)) return 'Você é o organizador deste evento';
    if (situacao(evento, hoje) === 'excluido') return 'Este evento foi excluído';
    if (situacao(evento, hoje) === 'fechado') return 'As inscrições não estão abertas para este evento';
    if (vagasDo(evento) <= 0) return 'Evento lotado: não há mais vagas';
    return '';
  }

  async function inscrever(evento) {
    setInscrevendo(true);
    try {
      
      const atuais = (await axios.get(`${BASE_URL}/inscricoes`)).data;
      setInscricoes(atuais);
      if (jaInscrito(evento, atuais)) {
        mensagemAlert('Você já está inscrito neste evento');
        return;
      }
      if (vagasDo(evento, atuais) <= 0) {
        mensagemErro('O evento acabou de lotar');
        return;
      }

      await axios.post(`${BASE_URL}/inscricoes`, {
        dataInscricao: hoje,
        status: 'ativa',
        idUsuario: String(usuario.id),
        idEvento: String(evento.id),
      });
      mensagemSucesso('Inscrição realizada com sucesso!');

      try {
        await axios.post(`${BASE_URL}/notificacoes`, {
          mensagem: `Sua inscrição no evento "${evento.nome}" foi confirmada.`,
          tipo: 'inscricao',
          data: hoje,
          idUsuario: String(usuario.id),
          idEvento: String(evento.id),
        });
      } catch (erro) {
        mensagemAlert('Inscrição feita, mas não foi possível gerar a notificação');
      }
      setInscricoes((await axios.get(`${BASE_URL}/inscricoes`)).data);
    } catch (erro) {
      mensagemErro('Erro ao realizar a inscrição');
    } finally {
      setInscrevendo(false);
    }
  }

  const filtrados = eventos
    .filter((e) => e.nome.toLowerCase().includes(busca.trim().toLowerCase()))
    .filter((e) => !idCategoria || String(e.idCategoria) === idCategoria)
    .filter((e) =>
      statusFiltro === 'todos' ? true : statusFiltro === 'ativos' ? e.status !== 'excluido' : e.status === 'excluido'
    );

  return (
    <div className='container'>
      <Card title='Eventos'>
        <div className='row g-2 mb-4'>
          <div className='col-md-6'>
            <input
              aria-label='Pesquisar evento'
              className='form-control'
              placeholder='Pesquisar evento pelo nome…'
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <div className='col-md-3'>
            <select
              aria-label='Filtrar por categoria'
              className='form-control'
              value={idCategoria}
              onChange={(e) => setIdCategoria(e.target.value)}
            >
              <option value=''>Todas as categorias</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
          <div className='col-md-3'>
            <select
              aria-label='Filtrar por situação'
              className='form-control'
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value)}
            >
              <option value='ativos'>Ativos</option>
              <option value='cancelados'>Excluídos / cancelados</option>
              <option value='todos'>Todos</option>
            </select>
          </div>
        </div>

        <div className='row g-3 event-grid'>
          {filtrados.length === 0 && (
            <div className='col-12'>
              <p className='text-muted'>Nenhum evento encontrado.</p>
            </div>
          )}
          {filtrados.map((evento) => (
            <div className='col-sm-6 col-xl-4' key={evento.id}>
              <article className='card event-card h-100'>
                {evento.imagem && evento.imagem.trim() ? (
                  <img
                    className='event-card-image'
                    src={evento.imagem}
                    alt={`Imagem de ${evento.nome}`}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className='event-card-art' aria-hidden='true'>
                    <span>GOEVENT</span>
                    <strong>{nomeCategoria(evento.idCategoria, evento)}</strong>
                  </div>
                )}
                <div className='card-body d-flex flex-column'>
                  <div className='d-flex justify-content-between align-items-start gap-2'>
                    <span className='badge bg-primary'>{nomeCategoria(evento.idCategoria, evento)}</span>
                    <span className={`badge ${COR[situacao(evento, hoje)]}`}>{ROTULO[situacao(evento, hoje)]}</span>
                  </div>
                  <h5 className='mt-3'>{evento.nome}</h5>
                  <p className='text-muted mb-2'>
                    {formatarData(evento.data)} · {evento.horario || 'Horário a definir'}
                  </p>
                  <p className='text-muted small'>{[evento.cidade, evento.estado].filter(Boolean).join(' / ')}</p>
                  <button
                    className='btn btn-outline-primary btn-sm mt-auto align-self-start'
                    type='button'
                    onClick={() => setDetalhe(evento)}
                  >
                    Ver detalhes
                  </button>
                </div>
              </article>
            </div>
          ))}
        </div>
      </Card>

      
      {detalhe && (
        <div className='event-modal-backdrop' role='presentation' onClick={() => setDetalhe(null)}>
          <div
            className='modal-dialog modal-dialog-centered'
            role='dialog'
            aria-modal='true'
            aria-label={`Detalhes de ${detalhe.nome}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className='modal-content'>
              <div className='modal-header'>
                <h5 className='modal-title'>{detalhe.nome}</h5>
                <button className='btn-close' aria-label='Fechar' onClick={() => setDetalhe(null)} />
              </div>
              <div className='modal-body'>
                <p className='d-flex gap-2'>
                  <span className='badge bg-primary'>{nomeCategoria(detalhe.idCategoria, detalhe)}</span>
                  <span className={`badge ${COR[situacao(detalhe, hoje)]}`}>{ROTULO[situacao(detalhe, hoje)]}</span>
                </p>
                <p>{detalhe.descricao && detalhe.descricao.trim() ? detalhe.descricao : 'Sem descrição informada.'}</p>
                <dl className='row mb-0'>
                  <dt className='col-5'>Data e horário</dt>
                  <dd className='col-7'>
                    {formatarData(detalhe.data)} às {detalhe.horario || '—'}
                  </dd>
                  <dt className='col-5'>Local</dt>
                  <dd className='col-7'>
                    {[detalhe.logradouro, detalhe.complemento, detalhe.bairro, detalhe.cidade, detalhe.estado]
                      .filter((t) => t && String(t).trim())
                      .join(', ') || '—'}
                  </dd>
                  <dt className='col-5'>Inscrições</dt>
                  <dd className='col-7'>
                    de {formatarData(detalhe.inicioInscricao)} até {formatarData(detalhe.fimInscricao)}
                  </dd>
                  <dt className='col-5'>Valor</dt>
                  <dd className='col-7'>
                    {detalhe.tipoEvento === 'pago' ? `R$ ${Number(detalhe.preco || 0).toFixed(2).replace('.', ',')}` : 'Gratuito'}
                  </dd>
                  <dt className='col-5'>Vagas</dt>
                  <dd className='col-7'>
                    {vagasDo(detalhe) > 0 ? `${vagasDo(detalhe)} disponíveis` : 'Lotado'} (de {detalhe.capacidade ?? '—'})
                  </dd>
                </dl>
              </div>
              <div className='modal-footer'>
                {jaInscrito(detalhe) ? (
                  <span className='badge bg-success fs-6'>Você está inscrito neste evento</span>
                ) : motivoSemInscricao(detalhe) ? (
                  <span className='text-muted small'>{motivoSemInscricao(detalhe)}</span>
                ) : (
                  <button
                    type='button'
                    className='btn btn-success'
                    disabled={inscrevendo}
                    onClick={() => inscrever(detalhe)}
                  >
                    {inscrevendo ? 'Inscrevendo…' : 'Inscrever-se'}
                  </button>
                )}
                <button className='btn btn-secondary' type='button' onClick={() => setDetalhe(null)}>
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ListagemEventos;