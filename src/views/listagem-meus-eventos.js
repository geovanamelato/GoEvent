import React from 'react';

import Card from '../components/card';

import { mensagemSucesso, mensagemErro, mensagemAlert } from '../components/toastr';

import '../custom.css';

import { useNavigate } from 'react-router-dom';

import axios from 'axios';
import { BASE_URL } from '../config/axios';

const baseURL = `${BASE_URL}/eventos`;

// mostra a data como dd/mm/aaaa (aceita aaaa-mm-dd e dd-mm-aaaa; data inválida vira "-")
function formatarData(valor) {
  const texto = String(valor || '');
  let m = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  m = texto.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  return m && m[1] !== '00' && m[2] !== '00' ? `${m[1]}/${m[2]}/${m[3]}` : '-';
}

function ListagemMeusEventos() {
  const navigate = useNavigate();

  const cadastrar = () => {
    navigate(`/cadastro-eventos`);
  };

  const editar = (id) => {
    navigate(`/cadastro-eventos/${id}`);
  };

  const [dados, setDados] = React.useState(null);
  const [categorias, setCategorias] = React.useState([]);
  const [filtro, setFiltro] = React.useState('ativos');

  // confirma, muda o status para "excluido" e avisa os inscritos
  async function excluir(evento) {
    if (!window.confirm(`Deseja realmente excluir o evento "${evento.nome}"?`)) return;

    try {
      await axios.patch(`${baseURL}/${evento.id}`, { status: 'excluido' });
    } catch (error) {
      mensagemErro(`Erro ao excluir o evento`);
      return;
    }
    // continua na lista (aparece em "Excluídos"), só muda o status
    setDados(dados.map((d) => (d.id === evento.id ? { ...d, status: 'excluido' } : d)));
    mensagemSucesso(`Evento excluído com sucesso!`);

    // avisa os inscritos (se der erro aqui, o evento continua excluído)
    try {
      const resposta = await axios.get(`${BASE_URL}/inscricoes`);
      const ativos = resposta.data.filter(
        (i) => String(i.idEvento) === String(evento.id) && i.status !== 'cancelada'
      );
      const hoje = new Date().toLocaleDateString('sv-SE'); // aaaa-mm-dd no horário do computador
      await Promise.all(
        ativos.map((i) =>
          axios.post(`${BASE_URL}/notificacoes`, {
            mensagem: `O evento "${evento.nome}" foi excluído pelo organizador.`,
            tipo: 'exclusao',
            data: hoje,
            idUsuario: i.idUsuario,
            idEvento: evento.id,
          })
        )
      );
    } catch (error) {
      mensagemAlert('O evento foi excluído, mas não foi possível enviar as notificações.');
    }
  }

  React.useEffect(() => {
    Promise.all([axios.get(baseURL), axios.get(`${BASE_URL}/categorias`)])
      .then(([e, c]) => {
        setDados(e.data);
        setCategorias(c.data);
      })
      .catch(() => {
        setDados([]);
        mensagemErro('Não foi possível carregar os eventos. O json-server está rodando?');
      });
  }, []);

  if (!dados) return null;

  // categoria excluída: mostra o nome que ficou guardado no evento
  const nomeCategoria = (evento) => {
    const categoria = categorias.find((c) => String(c.id) === String(evento.idCategoria));
    return categoria ? categoria.nome.trim() : evento.categoriaRemovida || 'Categoria removida';
  };

  const filtrados = dados.filter((d) =>
    filtro === 'todos' ? true : filtro === 'ativos' ? d.status !== 'excluido' : d.status === 'excluido'
  );

  return (
    <div className='container'>
      <Card title='Meus Eventos'>
        <div className='row'>
          <div className='col-lg-12'>
            <div className='bs-component'>
              <div className='row mb-3'>
                <div className='col-md-8'>
                  <button type='button' className='btn btn-warning' onClick={() => cadastrar()}>
                    Novo Evento
                  </button>
                </div>
                <div className='col-md-4'>
                  <select
                    className='form-control'
                    aria-label='Filtrar eventos'
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                  >
                    <option value='ativos'>Eventos ativos</option>
                    <option value='excluidos'>Somente excluídos</option>
                    <option value='todos'>Todos</option>
                  </select>
                </div>
              </div>

              <table className='table table-hover'>
                <thead>
                  <tr>
                    <th scope='col'>Nome</th>
                    <th scope='col'>Categoria</th>
                    <th scope='col'>Data</th>
                    <th scope='col'>Status</th>
                    <th scope='col'>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.length === 0 && (
                    <tr>
                      <td colSpan='5'>
                        {dados.length === 0
                          ? 'Você não tem eventos cadastrados.'
                          : 'Nenhum evento para esse filtro.'}
                      </td>
                    </tr>
                  )}
                  {filtrados.map((dado) => (
                    <tr key={dado.id}>
                      <td>{dado.nome}</td>
                      <td>{nomeCategoria(dado)}</td>
                      <td>{formatarData(dado.data)}</td>
                      <td>
                        <span className={dado.status === 'excluido' ? 'badge bg-secondary' : 'badge bg-success'}>
                          {dado.status === 'excluido' ? 'Excluído' : dado.status || 'aberto'}
                        </span>
                      </td>
                      <td>
                        {dado.status !== 'excluido' && (
                          <>
                            <button
                              type='button'
                              className='btn btn-secondary btn-sm me-2'
                              onClick={() => editar(dado.id)}
                            >
                              Editar
                            </button>
                            <button
                              type='button'
                              className='btn btn-danger btn-sm'
                              onClick={() => excluir(dado)}
                            >
                              Excluir
                            </button>
                          </>
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

export default ListagemMeusEventos;