import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Card from '../components/card';
import FormGroup from '../components/form-group';

import { mensagemSucesso, mensagemErro, mensagemAlert } from '../components/toastr';

import '../custom.css';

import axios from 'axios';
import { BASE_URL } from '../config/axios';

// coloca a máscara 000.000.000-00 enquanto digita
function mascaraCpf(valor) {
  const d = String(valor).replace(/\D/g, '').slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

// Cadastro feito pela própria pessoa (tela "Criar conta"): sempre como usuário comum
function CadastroUsuario() {
  const navigate = useNavigate();

  const [nome, setNome] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [cpf, setCpf] = React.useState('');
  const [senha, setSenha] = React.useState('');
  const [confirmacao, setConfirmacao] = React.useState('');

  // cancelar: continua na mesma tela e limpa o que foi digitado
  function cancelar() {
    setNome('');
    setEmail('');
    setCpf('');
    setSenha('');
    setConfirmacao('');
    mensagemAlert('Alterações descartadas');
  }

  async function cadastrar() {
    const nomeLimpo = nome.trim();
    const emailLimpo = email.trim().toLowerCase();
    const cpfNumeros = cpf.replace(/\D/g, '');

    // formatos
    if (!nomeLimpo || !emailLimpo || !cpfNumeros || !senha || !confirmacao) {
      mensagemErro('Preencha todos os campos');
      return;
    }
    if (nomeLimpo.length < 3 || /\d/.test(nomeLimpo)) {
      mensagemErro('O nome deve ter no mínimo 3 letras e não pode ter números');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)) {
      mensagemErro('E-mail em formato inválido (exemplo: nome@email.com)');
      return;
    }
    if (cpfNumeros.length !== 11) {
      mensagemErro('O CPF deve ter 11 números');
      return;
    }
    if (senha.length < 4) {
      mensagemErro('A senha deve ter pelo menos 4 caracteres');
      return;
    }
    if (senha !== confirmacao) {
      mensagemErro('A confirmação da senha não confere com a senha');
      return;
    }

    try {
      // e-mail e CPF não podem estar cadastrados
      const resposta = await axios.get(`${BASE_URL}/usuarios`);
      if (resposta.data.some((u) => u.email.toLowerCase() === emailLimpo)) {
        mensagemErro('Já existe um usuário com esse e-mail');
        return;
      }
      if (resposta.data.some((u) => String(u.cpf).replace(/\D/g, '') === cpfNumeros)) {
        mensagemErro('Já existe um usuário com esse CPF');
        return;
      }

      await axios.post(`${BASE_URL}/usuarios`, {
        nome: nomeLimpo,
        email: emailLimpo,
        cpf: cpfNumeros,
        senha,
        admin: false,
      });
      mensagemSucesso('Conta criada com sucesso! Agora é só entrar.');
      navigate('/login');
    } catch (error) {
      mensagemErro('Erro ao criar a conta. O json-server está rodando?');
    }
  }

  return (
    <div className='container'>
      <div className='row justify-content-center'>
        <div className='col-lg-7'>
          <Card title='Criar conta'>
            <div className='bs-component'>
              <div className='row g-2'>
                <div className='col-12'>
                  <FormGroup label='Nome: *' htmlFor='inputNome'>
                    <input
                      type='text'
                      id='inputNome'
                      value={nome}
                      className='form-control'
                      name='nome'
                      onChange={(e) => setNome(e.target.value)}
                    />
                  </FormGroup>
                </div>
                <div className='col-md-7'>
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
                </div>
                <div className='col-md-5'>
                  <FormGroup label='CPF: *' htmlFor='inputCpf'>
                    <input
                      type='text'
                      inputMode='numeric'
                      id='inputCpf'
                      value={cpf}
                      placeholder='000.000.000-00'
                      className='form-control'
                      name='cpf'
                      onChange={(e) => setCpf(mascaraCpf(e.target.value))}
                    />
                  </FormGroup>
                </div>
                <div className='col-md-6'>
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
                </div>
                <div className='col-md-6'>
                  <FormGroup label='Confirmação de senha: *' htmlFor='inputConfirmacao'>
                    <input
                      type='password'
                      id='inputConfirmacao'
                      value={confirmacao}
                      className='form-control'
                      name='confirmacao'
                      onChange={(e) => setConfirmacao(e.target.value)}
                    />
                  </FormGroup>
                </div>
              </div>

              <div className='d-flex gap-2 mt-3'>
                <button onClick={cadastrar} type='button' className='btn btn-success'>
                  Cadastrar
                </button>
                <button onClick={cancelar} type='button' className='btn btn-secondary'>
                  Cancelar
                </button>
              </div>

              <p className='small mt-3 mb-0'>
                Já tem conta? <Link to='/login'>Entrar</Link>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default CadastroUsuario;