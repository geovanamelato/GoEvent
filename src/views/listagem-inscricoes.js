import React from 'react';

import Card from '../components/card';

import { mensagemSucesso, mensagemErro } from '../components/toastr';

import '../custom.css';

import axios from 'axios';
import { BASE_URL } from '../config/axios';

const baseURL = `${BASE_URL}/inscricoes`;

// mostra a data como dd/mm/aaaa (aceita aaaa-mm-dd e dd-mm-aaaa; data inválida vira "-")
function formatarData(valor) {
  const texto = String(valor || '');
  let m = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  m = texto.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  return m && m[1] !== '00' && m[2] !== '00' ? `${m[1]}/${m[2]}/${m[3]}` : '-';
}

function ListagemInscricoes() {
  const [dados, setDados] = React.useState(null);
  const [eventos, setEventos] = React.useState([]);
  const [filtro, setFiltro] = React.useState('todas');

  // o id pode estar como número em um lugar e texto em outro, por isso compara como texto
  function nomeEvento(id) {
    const evento = eventos.find((e) => String(e.id) === String(id));
    return evento ? evento.nome : 'Evento removido';
  }

  // confirma, cancela a inscrição e gera a notificação
  async function cancelar(inscricao) {
    const nome = nomeEvento(inscricao.idEvento);
    if (!window.confirm(`Deseja realmente cancelar sua inscrição no evento "${nome}"?`)) return;

    const hoje = new Date().toLocaleDateString('sv-SE'); // aaaa-mm-dd no horário do computador
    try {
      await axios.patch(`${baseURL}/${inscricao.id}`, { status: 'cancelada', dataCancelamento: hoje });
      await axios.post(`${BASE_URL}/notificacoes`, {
        mensagem: `Sua inscrição no evento "${nome}" foi cancelada.`,
        tipo: 'cancelamento',
        data: hoje,
        idUsuario: inscricao.idUsuario,
        idEvento: inscricao.idEvento,
      });
      mensagemSucesso(`Inscrição cancelada com sucesso!`);
      setDados(
        dados.map((d) =>
          d.id === inscricao.id ? { ...d, status: 'cancelada', dataCancelamento: hoje } : d
        )
      );
    } catch (error) {
      mensagemErro(`Erro ao cancelar a inscrição`);
    }
  }

  React.useEffect(() => {
    Promise.all([axios.get(baseURL), axios.get(`${BASE_URL}/eventos`)])
      .then(([i, e]) => {
        setDados(i.data);
        setEventos(e.data);
      })
      .catch(() => {
        setDados([]);
        mensagemErro('Não foi possível carregar as inscrições. O json-server está rodando?');
      });
    // eslint-disable-next-line
  }, []);

  if (!dados) return null;

  const canceladas = dados.filter((d) => d.status === 'cancelada').length;
  const ativas = dados.length - canceladas;

  // filtro: todas, só as ativas ou só as canceladas
  const filtradas = dados.filter((d) =>
    filtro === 'todas' ? true : filtro === 'ativas' ? d.status !== 'cancelada' : d.status === 'cancelada'
  );

  return (
    <div className='container'>
      <Card title='Minhas Inscrições'>
        <div className='row'>
          <div className='col-lg-12'>
            <div className='bs-component'>
              <div className='row mb-3'>
                <div className='col-md-8'>
                  <p className='mb-0'>
                    <strong>{ativas}</strong> ativas e <strong>{canceladas}</strong> canceladas
                  </p>
                </div>
                <div className='col-md-4'>
                  <select
                    className='form-control'
                    aria-label='Filtrar inscrições'
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                  >
                    <option value='todas'>Todas as inscrições</option>
                    <option value='ativas'>Somente ativas</option>
                    <option value='canceladas'>Somente canceladas</option>
                  </select>
                </div>
              </div>

              <table className='table table-hover'>
                <thead>
                  <tr>
                    <th scope='col'>Evento</th>
                    <th scope='col'>Data da inscrição</th>
                    <th scope='col'>Status da inscrição</th>
                    <th scope='col'>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.length === 0 && (
                    <tr>
                      <td colSpan='4'>
                        {dados.length === 0 ? 'Você não tem inscrições.' : 'Nenhuma inscrição para esse filtro.'}
                      </td>
                    </tr>
                  )}
                  {filtradas.map((dado) => (
                    <tr key={dado.id}>
                      <td>{nomeEvento(dado.idEvento)}</td>
                      <td>{formatarData(dado.dataInscricao)}</td>
                      <td>
                        <span className={dado.status === 'cancelada' ? 'badge bg-secondary' : 'badge bg-success'}>
                          {dado.status === 'cancelada' ? 'Cancelada' : 'Ativa'}
                        </span>
                        {dado.status === 'cancelada' && dado.dataCancelamento && (
                          <small className='text-muted ms-2'>em {formatarData(dado.dataCancelamento)}</small>
                        )}
                      </td>
                      <td>
                        {dado.status !== 'cancelada' && (
                          <button
                            type='button'
                            className='btn btn-outline-danger btn-sm'
                            onClick={() => cancelar(dado)}
                          >
                            Cancelar inscrição
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default ListagemInscricoes;