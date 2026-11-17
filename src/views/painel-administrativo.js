import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/card';
import axios from 'axios';
import { BASE_URL } from '../config/axios';
import { mensagemErro } from '../components/toastr';

// aceita aaaa-mm-dd e dd-mm-aaaa e devolve aaaa-mm-dd ('' se a data não existir)
function paraISO(valor) {
  const texto = String(valor || '');
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto;
  const m = texto.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  return m && m[1] !== '00' && m[2] !== '00' ? `${m[3]}-${m[2]}-${m[1]}` : '';
}

// mostra a data como dd/mm/aaaa (data inválida vira "-")
function formatarData(valor) {
  const iso = paraISO(valor);
  return iso ? iso.split('-').reverse().join('/') : '-';
}

// situação do evento: excluído, fechado (período de inscrição acabou) ou aberto
function situacao(evento, hoje) {
  if (evento.status === 'excluido') return 'excluido';
  const fim = paraISO(evento.fimInscricao);
  return evento.status === 'fechado' || (fim && fim < hoje) ? 'fechado' : 'aberto';
}

const ROTULO = { aberto: 'Aberto', fechado: 'Fechado', excluido: 'Excluído' };
const COR = { aberto: 'bg-success', fechado: 'bg-secondary', excluido: 'bg-danger' };

function PainelAdministrativo() {
  const [resumo, setResumo] = React.useState(null);

  React.useEffect(() => {
    Promise.all(['eventos', 'categorias', 'usuarios', 'inscricoes'].map((item) => axios.get(`${BASE_URL}/${item}`)))
      .then(([eventos, categorias, usuarios, inscricoes]) =>
        setResumo({
          eventos: eventos.data,
          categorias: categorias.data,
          usuarios: usuarios.data,
          inscricoes: inscricoes.data,
        })
      )
      .catch(() => {
        setResumo({ eventos: [], categorias: [], usuarios: [], inscricoes: [] });
        mensagemErro('Não foi possível carregar os indicadores do painel.');
      });
  }, []);

  if (!resumo) {
    return (
      <div className='container'>
        <Card title='Painel Administrativo'>
          <p>Carregando painel…</p>
        </Card>
      </div>
    );
  }

  const hoje = new Date().toLocaleDateString('sv-SE'); // aaaa-mm-dd no horário do computador
  const abertos = resumo.eventos.filter((e) => situacao(e, hoje) === 'aberto').length;
  const fechados = resumo.eventos.filter((e) => situacao(e, hoje) === 'fechado').length;
  const excluidos = resumo.eventos.filter((e) => situacao(e, hoje) === 'excluido').length;
  const canceladas = resumo.inscricoes.filter((i) => i.status === 'cancelada').length;
  const ativas = resumo.inscricoes.length - canceladas;

  const numeros = [
    ['Usuários cadastrados', resumo.usuarios.length],
    ['Eventos cadastrados', resumo.eventos.length],
    ['Eventos abertos', abertos],
    ['Eventos fechados', fechados],
    ['Eventos excluídos', excluidos],
    ['Categorias', resumo.categorias.length],
    ['Inscrições ativas', ativas],
    ['Inscrições canceladas', canceladas],
  ];

  // eventos que ainda não foram excluídos, do mais próximo para o mais distante
  const proximosEventos = resumo.eventos
    .filter((e) => e.status !== 'excluido')
    .sort((a, b) => paraISO(a.data).localeCompare(paraISO(b.data)))
    .slice(0, 5);

  return (
    <div className='container admin-dashboard'>
      <Card title='Painel Administrativo'>
        <div className='d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2'>
          <div>
            <p className='text-muted mb-1'>Visão geral da plataforma</p>
            <h4 className='mb-0'>Bem-vindo ao GoEvent</h4>
          </div>
          <Link className='btn btn-success' to='/cadastro-eventos'>
            + Novo evento
          </Link>
        </div>

        <div className='row g-3 mb-4'>
          {numeros.map(([titulo, valor]) => (
            <div className='col-6 col-xl-3' key={titulo}>
              <div className='admin-stat card h-100'>
                <div className='card-body'>
                  <div className='text-muted'>{titulo}</div>
                  <strong>{valor}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className='d-flex flex-wrap justify-content-between align-items-center mb-2'>
          <h5 className='mb-0'>Próximos eventos</h5>
          <Link to='/listagem-eventos'>Ver todos</Link>
        </div>
        <div className='table-responsive'>
          <table className='table table-hover align-middle'>
            <thead>
              <tr>
                <th>Evento</th>
                <th>Data</th>
                <th>Local</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {proximosEventos.length === 0 ? (
                <tr>
                  <td colSpan='5'>Nenhum evento ativo cadastrado.</td>
                </tr>
              ) : (
                proximosEventos.map((evento) => (
                  <tr key={evento.id}>
                    <td className='fw-semibold'>{evento.nome}</td>
                    <td>{formatarData(evento.data)}</td>
                    <td>{[evento.cidade, evento.estado].filter(Boolean).join(' / ') || '—'}</td>
                    <td>
                      <span className={`badge ${COR[situacao(evento, hoje)]}`}>{ROTULO[situacao(evento, hoje)]}</span>
                    </td>
                    <td>
                      <Link to={`/cadastro-eventos/${evento.id}`}>Editar</Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className='d-flex flex-wrap gap-2 mt-3'>
          <Link className='btn btn-outline-primary btn-sm' to='/listagem-usuarios'>
            Gerenciar usuários
          </Link>
          <Link className='btn btn-outline-primary btn-sm' to='/listagem-categorias'>
            Gerenciar categorias
          </Link>
          <Link className='btn btn-outline-primary btn-sm' to='/listagem-inscricoes'>
            Acompanhar inscrições
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default PainelAdministrativo;