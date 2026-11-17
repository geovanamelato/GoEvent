import React from 'react';
import { Link } from 'react-router-dom';

import Card from '../components/card';
import FormGroup from '../components/form-group';

import { mensagemErro } from '../components/toastr';

import '../custom.css';

import axios from 'axios';
import { BASE_URL } from '../config/axios';

function Login() {
  const [email, setEmail] = React.useState('');
  const [senha, setSenha] = React.useState('');

  async function entrar() {
    if (!email.trim() || !senha) {
      mensagemErro('Informe o e-mail e a senha');
      return;
    }

    try {
      const resposta = await axios.get(`${BASE_URL}/usuarios`);
      const usuario = resposta.data.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.senha === senha
      );
      if (!usuario) {
        mensagemErro('E-mail ou senha incorretos');
        return;
      }

      // guarda quem entrou (sem a senha) para as outras telas saberem quem é o usuário
      const admin = usuario.admin === true || usuario.admin === 'true';
      localStorage.setItem(
        'usuarioLogado',
        JSON.stringify({ id: usuario.id, nome: usuario.nome, email: usuario.email, admin })
      );
      // recarrega a página para o menu já aparecer com o usuário que entrou:
      // administrador vai para o painel, usuário comum vai para os eventos
      window.location.assign(admin ? '/painel-administrativo' : '/listagem-eventos');
    } catch (error) {
      mensagemErro('Não foi possível entrar. O json-server está rodando?');
    }
  }

  // cancelar: continua na mesma tela e limpa o que foi digitado
  function cancelar() {
    setEmail('');
    setSenha('');
  }

  return (
    <div className='container'>
      <div className='row justify-content-center'>
        <div className='col-lg-5 col-md-8'>
          <Card title='Entrar'>
            <div className='bs-component'>
              <FormGroup label='E-mail: *' htmlFor='inputEmail'>
                <input
                  type='email'
                  id='inputEmail'
                  value={email}
                  className='form-control'
                  name='email'
                  onChange={(e) => setEmail(e.target.value)}
                />
              </FormGroup>
              <FormGroup label='Senha: *' htmlFor='inputSenha'>
                <input
                  type='password'
                  id='inputSenha'
                  value={senha}
                  className='form-control'
                  name='senha'
                  onChange={(e) => setSenha(e.target.value)}
                />
              </FormGroup>

              <div className='d-flex gap-2 mt-3'>
                <button onClick={entrar} type='button' className='btn btn-success'>
                  Entrar
                </button>
                <button onClick={cancelar} type='button' className='btn btn-secondary'>
                  Cancelar
                </button>
              </div>

              <p className='small mt-3 mb-0'>
                Ainda não tem conta? <Link to='/cadastro'>Criar conta</Link>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Login;