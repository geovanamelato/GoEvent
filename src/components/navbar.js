import React from 'react';
import 'bootswatch/dist/lux/bootstrap.css';

import NavbarItem from './navbarItem';

// quem entrou (guardado pela tela de login); null se ninguém entrou
function usuarioLogado() {
  try {
    return JSON.parse(localStorage.getItem('usuarioLogado'));
  } catch (error) {
    return null;
  }
}

function Navbar(props) {
  const usuario = usuarioLogado();

  function sair() {
    localStorage.removeItem('usuarioLogado');
    window.location.href = '/';
  }

  return (
    <div className='navbar navbar-expand fixed-top navbar-dark goevent-navbar'>
      <div className='container'>
        <a href='/' className='navbar-brand fw-bold fs-3'>
          GoEvent
        </a>
        <ul className='navbar-nav me-auto'>
          <NavbarItem render={!!usuario} href='/listagem-eventos' label='Eventos' />
          <NavbarItem render={!!usuario} href='/listagem-meus-eventos' label='Meus Eventos' />
          <NavbarItem render={!!usuario} href='/listagem-inscricoes' label='Inscrições' />
          <NavbarItem render={!!usuario} href='/listagem-notificacoes' label='Notificações' />
          {/* só o administrador vê estes */}
          <NavbarItem render={!!usuario && usuario.admin} href='/listagem-categorias' label='Categorias' />
          <NavbarItem render={!!usuario && usuario.admin} href='/listagem-usuarios' label='Usuários' />
          <NavbarItem render={!!usuario && usuario.admin} href='/painel-administrativo' label='Painel' />
        </ul>

        {usuario ? (
          <div className='d-flex align-items-center gap-2'>
            <a
              href='/meu-perfil'
              title='Meu perfil'
              className='rounded-circle bg-light text-dark d-flex align-items-center justify-content-center text-decoration-none fw-bold'
              style={{ width: '34px', height: '34px' }}
            >
              {usuario.nome.trim().charAt(0).toUpperCase()}
            </a>
            <button type='button' className='btn btn-go-contorno btn-sm' onClick={sair}>
              Sair
            </button>
          </div>
        ) : (
          <div className='d-flex align-items-center gap-2'>
            <a href='/login' className='btn btn-go-contorno btn-sm'>
              Entrar
            </a>
            <a href='/cadastro' className='btn btn-go-claro btn-sm'>
              Criar conta
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default Navbar;