import React from 'react';
import Card from '../components/card';
import { mensagemSucesso, mensagemErro } from '../components/toastr';
import axios from 'axios';
import { BASE_URL } from '../config/axios';

const FORM_VAZIO = { nome: '', email: '', cpf: '', senha: '', admin: false };

// coloca a máscara 000.000.000-00 enquanto digita
function mascaraCpf(valor) {
  const d = String(valor).replace(/\D/g, '').slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

function ListagemUsuarios() {
  const [usuarios, setUsuarios] = React.useState(null);
  const [eventos, setEventos] = React.useState([]);
  const [inscricoes, setInscricoes] = React.useState([]);
  const [form, setForm] = React.useState(FORM_VAZIO);
  const [salvando, setSalvando] = React.useState(false);
  const [busca, setBusca] = React.useState('');
  const [paraExcluir, setParaExcluir] = React.useState(null);

  const carregar = React.useCallback(
    () =>
      Promise.all([
        axios.get(`${BASE_URL}/usuarios`),
        axios.get(`${BASE_URL}/eventos`),
        axios.get(`${BASE_URL}/inscricoes`),
      ])
        .then(([u, e, i]) => {
          setUsuarios(u.data);
          setEventos(e.data);
          setInscricoes(i.data);
        })
        .catch(() => {
          setUsuarios([]);
          mensagemErro('Não foi possível carregar os usuários. O json-server está rodando?');
        }),
    []
  );

  React.useEffect(() => {
    carregar();
  }, [carregar]);

  if (!usuarios) {
    return (
      <div className='container'>
        <Card title='Usuários'>
          <p>Carregando usuários…</p>
        </Card>
      </div>
    );
  }

  // ids podem ser número ou texto, por isso a comparação é feita como texto
  const eventosDe = (u) => eventos.filter((e) => String(e.idUsuario) === String(u.id) && e.status !== 'excluido');
  const inscricoesDe = (u) => inscricoes.filter((i) => String(i.idUsuario) === String(u.id));

  async function cadastrar(e) {
    e.preventDefault();
    const nome = form.nome.trim();
    const email = form.email.trim().toLowerCase();
    const cpf = form.cpf.replace(/\D/g, '');

    if (!nome || !email || !cpf || !form.senha) {
      mensagemErro('Preencha nome, e-mail, CPF e senha.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      mensagemErro('E-mail em formato inválido (exemplo: nome@email.com).');
      return;
    }
    if (cpf.length !== 11) {
      mensagemErro('O CPF deve ter 11 números.');
      return;
    }
    if (form.senha.length < 4) {
      mensagemErro('A senha deve ter pelo menos 4 caracteres.');
      return;
    }
    if (usuarios.some((u) => u.email.toLowerCase() === email || String(u.cpf).replace(/\D/g, '') === cpf)) {
      mensagemErro('Já existe um usuário com esse e-mail ou CPF.');
      return;
    }

    setSalvando(true);
    try {
      await axios.post(`${BASE_URL}/usuarios`, { nome, email, cpf, senha: form.senha, admin: form.admin });
      setForm(FORM_VAZIO);
      await carregar();
      mensagemSucesso('Usuário cadastrado com sucesso!');
    } catch {
      mensagemErro('Erro ao cadastrar usuário.');
    } finally {
      setSalvando(false);
    }
  }

  // exclui o usuário: os eventos dele ficam sem organizador, as inscrições e notificações dele são apagadas
  async function confirmarExclusao() {
    const usuario = paraExcluir;
    setParaExcluir(null);
    try {
      await axios.delete(`${BASE_URL}/usuarios/${usuario.id}`);
      const dele = (item) => String(item.idUsuario) === String(usuario.id);
      await Promise.all(
        eventos.filter(dele).map((e) => axios.patch(`${BASE_URL}/eventos/${e.id}`, { idUsuario: null }))
      );
      await Promise.all(inscricoes.filter(dele).map((i) => axios.delete(`${BASE_URL}/inscricoes/${i.id}`)));
      const notificacoes = (await axios.get(`${BASE_URL}/notificacoes`)).data.filter(dele);
      await Promise.all(notificacoes.map((n) => axios.delete(`${BASE_URL}/notificacoes/${n.id}`)));
      mensagemSucesso('Usuário excluído. Os eventos dele foram mantidos sem organizador.');
    } catch {
      mensagemErro('Não foi possível excluir o usuário.');
    }
    await carregar();
  }

  const atualizar = (campo) => (e) =>
    setForm({
      ...form,
      [campo]:
        e.target.type === 'checkbox' ? e.target.checked : campo === 'cpf' ? mascaraCpf(e.target.value) : e.target.value,
    });

  const filtrados = usuarios.filter(
    (u) =>
      u.nome.toLowerCase().includes(busca.trim().toLowerCase()) ||
      u.email.toLowerCase().includes(busca.trim().toLowerCase())
  );

  return (
    <div className='container'>
      <Card title='Gerenciamento de Usuários'>
        <form className='admin-user-form mb-4' onSubmit={cadastrar}>
          <h5>Cadastrar usuário</h5>
          <div className='row g-3'>
            <div className='col-md-6'>
              <label className='form-label' htmlFor='usuarioNome'>Nome completo *</label>
              <input id='usuarioNome' className='form-control' value={form.nome} onChange={atualizar('nome')} />
            </div>
            <div className='col-md-6'>
              <label className='form-label' htmlFor='usuarioEmail'>E-mail *</label>
              <input id='usuarioEmail' className='form-control' type='email' value={form.email} onChange={atualizar('email')} />
            </div>
            <div className='col-md-4'>
              <label className='form-label' htmlFor='usuarioCpf'>CPF *</label>
              <input
                id='usuarioCpf'
                className='form-control'
                inputMode='numeric'
                placeholder='000.000.000-00'
                value={form.cpf}
                onChange={atualizar('cpf')}
              />
            </div>
            <div className='col-md-4'>
              <label className='form-label' htmlFor='usuarioSenha'>Senha *</label>
              <input id='usuarioSenha' className='form-control' type='password' value={form.senha} onChange={atualizar('senha')} />
            </div>
            <div className='col-md-4 d-flex align-items-end justify-content-between'>
              <label className='form-check mb-2'>
                <input className='form-check-input' type='checkbox' checked={form.admin} onChange={atualizar('admin')} />
                <span className='form-check-label'>Administrador</span>
              </label>
              <button className='btn btn-success' disabled={salvando}>
                {salvando ? 'Salvando…' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </form>

        <div className='row g-2 mb-2 align-items-center'>
          <div className='col-md-6'>
            <h5 className='mb-0'>Usuários cadastrados</h5>
          </div>
          <div className='col-md-4'>
            <input
              className='form-control form-control-sm'
              aria-label='Pesquisar usuário'
              placeholder='Pesquisar por nome ou e-mail…'
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <div className='col-md-2 text-md-end text-muted'>{usuarios.length} no total</div>
        </div>

        <div className='table-responsive'>
          <table className='table table-hover align-middle'>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>CPF</th>
                <th>Perfil</th>
                <th>Eventos</th>
                <th>Inscrições</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan='7'>Nenhum usuário encontrado.</td>
                </tr>
              ) : (
                filtrados.map((u) => (
                  <tr key={u.id}>
                    <td>{u.nome}</td>
                    <td>{u.email}</td>
                    <td>{mascaraCpf(u.cpf)}</td>
                    <td>{u.admin ? 'Administrador' : 'Usuário'}</td>
                    <td>{eventosDe(u).length}</td>
                    <td>{inscricoesDe(u).length}</td>
                    <td>
                      <button type='button' className='btn btn-danger btn-sm' onClick={() => setParaExcluir(u)}>
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* janela de confirmação (modal do Bootstrap) */}
      {paraExcluir && (
        <div>
          <div className='modal d-block' tabIndex='-1' role='dialog' aria-modal='true'>
            <div className='modal-dialog modal-dialog-centered'>
              <div className='modal-content text-center'>
                <div className='modal-body p-4'>
                  <h4>Excluir usuário?</h4>
                  <p className='small'>Tem certeza?</p>
                  <div className='bg-dark bg-opacity-25 rounded fw-semibold p-2'>
                    {paraExcluir.nome} ({paraExcluir.email})
                  </div>
                  <p className='text-danger small mt-3'>
                    <strong>Atenção!</strong>
                    <br />
                    As {inscricoesDe(paraExcluir).length} inscrições dele serão apagadas e os{' '}
                    {eventosDe(paraExcluir).length} eventos dele ficarão sem organizador. Não dá para desfazer.
                  </p>
                  <button type='button' className='btn btn-secondary me-2' onClick={() => setParaExcluir(null)}>
                    Cancelar
                  </button>
                  <button type='button' className='btn btn-danger' onClick={confirmarExclusao}>
                    Confirmar exclusão
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className='modal-backdrop show'></div>
        </div>
      )}
    </div>
  );
}

export default ListagemUsuarios;