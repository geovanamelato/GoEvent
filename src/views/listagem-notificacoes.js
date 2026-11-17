import React from 'react';

import Card from '../components/card';

import { mensagemErro } from '../components/toastr';

import '../custom.css';

import axios from 'axios';
import { BASE_URL } from '../config/axios';

const baseURL = `${BASE_URL}/notificacoes`;

// nomes dos tipos de notificação (usados no filtro e na tabela)
const TIPOS = {
  inscricao: 'Inscrição',
  cancelamento: 'Cancelamento',
  alteracao: 'Alteração',
  exclusao: 'Exclusão',
};

// mostra a data como dd/mm/aaaa (aceita aaaa-mm-dd e dd-mm-aaaa; data inválida vira "-")
function formatarData(valor) {
  const texto = String(valor || '');
  let m = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  m = texto.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  return m && m[1] !== '00' && m[2] !== '00' ? `${m[1]}/${m[2]}/${m[3]}` : '-';
}

// aaaa-mm-dd para poder ordenar pela data (dd-mm-aaaa vira aaaa-mm-dd)
function dataParaOrdenar(valor) {
  const m = String(valor || '').match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : String(valor || '');
}

function ListagemNotificacoes() {
  const [dados, setDados] = React.useState(null);
  const [filtro, setFiltro] = React.useState('todos');

  React.useEffect(() => {
    axios
      .get(baseURL)
      .then((response) => {
        // as mais novas primeiro (os ids podem ser texto, então ordena pela data;
        // na mesma data, a que foi criada por último vem antes)
        const lista = response.data.map((n, posicao) => ({ ...n, posicao }));
        lista.sort(
          (a, b) =>
            dataParaOrdenar(b.data).localeCompare(dataParaOrdenar(a.data)) || b.posicao - a.posicao
        );
        setDados(lista);
      })
      .catch(() => {
        setDados([]);
        mensagemErro('Não foi possível carregar as notificações. O json-server está rodando?');
      });
    // eslint-disable-next-line
  }, []);

  if (!dados) return null;

  // filtro por tipo (ex.: só os cancelamentos)
  const filtradas = dados.filter((d) => filtro === 'todos' || d.tipo === filtro);

  return (
    <div className='container'>
      <Card title='Notificações'>
        <div className='row'>
          <div className='col-lg-12'>
            <div className='bs-component'>
              <div className='row mb-3'>
                <div className='col-md-8'>
                  <p className='mb-0'>
                    <strong>{filtradas.length}</strong>{' '}
                    {filtradas.length === 1 ? 'notificação' : 'notificações'}
                  </p>
                </div>
                <div className='col-md-4'>
                  <select
                    className='form-control'
                    aria-label='Filtrar notificações por tipo'
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                  >
                    <option value='todos'>Todos os tipos</option>
                    <option value='inscricao'>Inscrições</option>
                    <option value='cancelamento'>Cancelamentos</option>
                    <option value='alteracao'>Alterações</option>
                    <option value='exclusao'>Exclusões</option>
                  </select>
                </div>
              </div>

              <table className='table table-hover'>
                <thead>
                  <tr>
                    <th scope='col'>Mensagem</th>
                    <th scope='col'>Tipo</th>
                    <th scope='col'>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.length === 0 && (
                    <tr>
                      <td colSpan='3'>
                        {dados.length === 0
                          ? 'Você não tem notificações.'
                          : 'Nenhuma notificação desse tipo.'}
                      </td>
                    </tr>
                  )}
                  {filtradas.map((dado) => (
                    <tr key={dado.id}>
                      <td>{dado.mensagem}</td>
                      <td>{TIPOS[dado.tipo] || dado.tipo}</td>
                      <td>{formatarData(dado.data)}</td>
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

export default ListagemNotificacoes;