import React from 'react';
import Card from '../components/card';
import { mensagemErro } from '../components/toastr';
import axios from 'axios';
import { BASE_URL } from '../config/axios';

// quem entrou (guardado pela tela de login)
function usuarioLogado() {
  try {
    return JSON.parse(localStorage.getItem('usuarioLogado'));
  } catch (error) {
    return null;
  }
}

function MeuPerfil() {
  const logado = usuarioLogado();
  const [usuario, setUsuario] = React.useState(null);

  React.useEffect(() => {
    if (!logado) return;
    axios
      .get(`${BASE_URL}/usuarios/${logado.id}`)
      .then((resposta) => setUsuario(resposta.data))
      .catch(() => mensagemErro('Não foi possível carregar o perfil'));
    // eslint-disable-next-line
  }, []);

  if (!logado) {
    return (
      <div className='container'>
        <Card title='Meu Perfil'>
          <p>Entre na sua conta para ver o seu perfil.</p>
          <a className='btn btn-primary' href='/login'>
            Entrar
          </a>
        </Card>
      </div>
    );
  }

  if (!usuario) return null;

  return (
    <div className='container'>
      <Card title='Meu Perfil'>
        <dl className='row mb-0'>
          <dt className='col-sm-3'>Nome</dt>
          <dd className='col-sm-9'>{usuario.nome}</dd>
          <dt className='col-sm-3'>E-mail</dt>
          <dd className='col-sm-9'>{usuario.email}</dd>
          <dt className='col-sm-3'>CPF</dt>
          <dd className='col-sm-9'>{usuario.cpf || '-'}</dd>
          <dt className='col-sm-3'>Perfil</dt>
          <dd className='col-sm-9'>
            <span className={`badge ${usuario.admin ? 'bg-danger' : 'bg-primary'}`}>
              {usuario.admin ? 'Administrador' : 'Usuário'}
            </span>
          </dd>
        </dl>
      </Card>
    </div>
  );
}

export default MeuPerfil;