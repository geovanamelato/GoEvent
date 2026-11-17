import React from 'react';

import Card from '../components/card';

import { mensagemSucesso, mensagemErro } from '../components/toastr';

import '../custom.css';

import { useNavigate } from 'react-router-dom';

import axios from 'axios';
import { BASE_URL } from '../config/axios';

const baseURL = `${BASE_URL}/categorias`;

function ListagemCategorias() {
  const navigate = useNavigate();

  const cadastrar = () => {
    navigate(`/cadastro-categorias`);
  };

  const editar = (id) => {
    navigate(`/cadastro-categorias/${id}`);
  };

  const [dados, setDados] = React.useState(null);
  const [paraInativar, setParaInativar] = React.useState(null);
  const [paraExcluir, setParaExcluir] = React.useState(null);
  const [busca, setBusca] = React.useState('');
  const [filtroStatus, setFiltroStatus] = React.useState('todas');

  // confirma a inativação: a categoria continua nos eventos que já a usam,
  // mas não aparece mais para novos eventos. Os organizadores são avisados.
  async function confirmarInativacao() {
    const categoria = paraInativar;
    setParaInativar(null);
    try {
      await axios.patch(`${baseURL}/${categoria.id}`, { status: false });

      const resposta = await axios.get(`${BASE_URL}/eventos`);
      const doEvento = resposta.data.filter((e) => String(e.idCategoria) === String(categoria.id));
      const organizadores = [
        ...new Set(doEvento.filter((e) => e.status !== 'excluido').map((e) => e.idUsuario)),
      ];
      const hoje = new Date().toLocaleDateString('sv-SE'); // aaaa-mm-dd no horário do computador
      await Promise.all(
        organizadores.map((idUsuario) =>
          axios.post(`${BASE_URL}/notificacoes`, {
            mensagem: `A categoria "${categoria.nome.trim()}" foi inativada. Seus eventos já cadastrados continuam com ela, mas ela não poderá ser usada em novos eventos.`,
            tipo: 'alteracao',
            data: hoje,
            idUsuario,
            idEvento: null,
          })
        )
      );

      mensagemSucesso(`Categoria inativada com sucesso!`);
      setDados(dados.map((d) => (d.id === categoria.id ? { ...d, status: false } : d)));
    } catch (error) {
      mensagemErro(`Erro ao inativar a categoria`);
    }
  }

  async function reativar(categoria) {
    try {
      await axios.patch(`${baseURL}/${categoria.id}`, { status: true });
      mensagemSucesso(`Categoria reativada com sucesso!`);
      setDados(dados.map((d) => (d.id === categoria.id ? { ...d, status: true } : d)));
    } catch (error) {
      mensagemErro(`Erro ao reativar a categoria`);
    }
  }

  async function confirmarExclusao() {
    const categoria = paraExcluir;
    try {
      const resposta = await axios.get(`${BASE_URL}/eventos`);
      const doEvento = resposta.data.filter((e) => String(e.idCategoria) === String(categoria.id));
      await Promise.all(doEvento.map((evento) => axios.patch(`${BASE_URL}/eventos/${evento.id}`, {
        categoriaRemovida: categoria.nome.trim(), idCategoria: null,
      })));
      await axios.delete(`${baseURL}/${categoria.id}`);
      setDados(dados.filter((d) => d.id !== categoria.id));
      setParaExcluir(null);
      mensagemSucesso('Categoria excluída definitivamente. Os eventos existentes foram preservados.');
    } catch (error) {
      mensagemErro('Não foi possível excluir a categoria.');
    }
  }

  React.useEffect(() => {
    axios
      .get(baseURL)
      .then((response) => {
        setDados(response.data);
      })
      .catch(() => {
        setDados([]);
        mensagemErro('Não foi possível carregar as categorias. O json-server está rodando?');
      });
  }, []);

  if (!dados) return null;

  const ativas = dados.filter((d) => d.status).length;
  const inativas = dados.length - ativas;

  // pesquisa pelo nome (ativas e inativas) e filtro pelo status
  const filtradas = dados
    .filter((d) => (d.nome || '').toLowerCase().includes(busca.trim().toLowerCase()))
    .filter((d) =>
      filtroStatus === 'todas' ? true : filtroStatus === 'ativas' ? d.status : !d.status
    );

  return (
    <div className='container'>
      <Card title='Gerenciamento de Categorias'>
        <div className='row'>
          <div className='col-lg-12'>
            <div className='bs-component'>
              <div className='d-flex justify-content-end mb-3'>
                <button type='button' className='btn btn-success' onClick={() => cadastrar()}>
                  Criar Categoria
                </button>
              </div>

              <div className='bg-dark bg-opacity-25 rounded text-center p-3 mb-4'>
                <h4>Total de Categorias Cadastradas</h4>
                <h4 className='mb-0'>{dados.length}</h4>
                <small>
                  {ativas} ativas e {inativas} inativas
                </small>
              </div>

              <h5>Categorias</h5>

              <div className='row mb-3'>
                <div className='col-md-8'>
                  <input
                    type='text'
                    className='form-control'
                    placeholder='Pesquisar categoria pelo nome...'
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                  />
                </div>
                <div className='col-md-4'>
                  <select
                    className='form-control'
                    value={filtroStatus}
                    onChange={(e) => setFiltroStatus(e.target.value)}
                  >
                    <option value='todas'>Ativas e inativas</option>
                    <option value='ativas'>Somente ativas</option>
                    <option value='inativas'>Somente inativas</option>
                  </select>
                </div>
              </div>

              <ul className='list-group'>
                {filtradas.length === 0 && (
                  <li className='list-group-item'>Nenhuma categoria encontrada</li>
                )}
                {filtradas.map((dado) => (
                  <li
                    key={dado.id}
                    className='list-group-item d-flex justify-content-between align-items-center'
                  >
                    <span>{dado.nome.trim()}</span>
                    <span className='d-flex align-items-center gap-3'>
                      <span className='form-check form-switch mb-0'>
                        <input
                          className='form-check-input'
                          type='checkbox'
                          role='switch'
                          id={`status-${dado.id}`}
                          checked={Boolean(dado.status)}
                          onChange={() => (dado.status ? setParaInativar(dado) : reativar(dado))}
                        />
                        <label className='form-check-label' htmlFor={`status-${dado.id}`}>
                          {dado.status ? 'Ativa' : 'Inativa'}
                        </label>
                      </span>
                      <span>
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
                          onClick={() => setParaExcluir(dado)}
                        >
                          Excluir
                        </button>
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Card>

      {/* janela de confirmação (modal do Bootstrap) */}
      {paraInativar && (
        <div>
          <div className='modal d-block' tabIndex='-1'>
            <div className='modal-dialog modal-dialog-centered'>
              <div className='modal-content text-center'>
                <div className='modal-body p-4'>
                  <div
                    className='rounded-circle bg-danger text-white fw-bold d-flex align-items-center justify-content-center mx-auto mb-2'
                    style={{ width: '40px', height: '40px' }}
                  >
                    !
                  </div>
                  <h4>Inativar Categoria?</h4>
                  <p className='small'>Tem certeza ?</p>
                  <div className='bg-dark bg-opacity-25 rounded fw-semibold p-2'>
                    {paraInativar.nome.trim()}
                  </div>
                  <p className='text-danger small mt-3'>
                    <strong>Atenção!!!</strong>
                    <br />
                    Os eventos já cadastrados continuam com essa categoria
                  </p>
                  <button
                    type='button'
                    className='btn btn-secondary me-2'
                    onClick={() => setParaInativar(null)}
                  >
                    Cancelar
                  </button>
                  <button type='button' className='btn btn-danger' onClick={confirmarInativacao}>
                    Confirmar Inativação
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className='modal-backdrop show'></div>
        </div>
      )}
      {paraExcluir && (
        <div>
          <div className='modal d-block' tabIndex='-1' role='dialog' aria-modal='true'>
            <div className='modal-dialog modal-dialog-centered'><div className='modal-content'>
              <div className='modal-header'><h5 className='modal-title'>Excluir categoria definitivamente?</h5><button className='btn-close' aria-label='Fechar' onClick={() => setParaExcluir(null)} /></div>
              <div className='modal-body'><p>Excluir <strong>{paraExcluir.nome}</strong> da lista? Eventos já cadastrados serão preservados e mostrarão essa categoria como removida.</p></div>
              <div className='modal-footer'><button className='btn btn-secondary' onClick={() => setParaExcluir(null)}>Cancelar</button><button className='btn btn-danger' onClick={confirmarExclusao}>Excluir definitivamente</button></div>
            </div></div>
          </div><div className='modal-backdrop show'></div>
        </div>
      )}
    </div>
  );
}

export default ListagemCategorias;