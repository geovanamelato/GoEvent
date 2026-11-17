import React from 'react';
import { Route, Routes, BrowserRouter } from 'react-router-dom';


import Home from './views/home';
import Login from './views/login';
import CadastroUsuario from './views/cadastro-usuario';

import ListagemEventos from './views/listagem-eventos';
import ListagemMeusEventos from './views/listagem-meus-eventos';
import CadastroEventos from './views/cadastro-eventos';
import ListagemInscricoes from './views/listagem-inscricoes';
import ListagemNotificacoes from './views/listagem-notificacoes';
import ListagemCategorias from './views/listagem-categorias';
import CadastroCategorias from './views/cadastro-categorias';
import ListagemUsuarios from './views/listagem-usuarios';
import PainelAdministrativo from './views/painel-administrativo';
import MeuPerfil from './views/meu-perfil';


function Rotas(props) {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/listagem-eventos' element={<ListagemEventos />} />
        <Route path='/listagem-meus-eventos' element={<ListagemMeusEventos />} />
        <Route path='/cadastro-eventos' element={<CadastroEventos />} />
        <Route path='/cadastro-eventos/:idParam' element={<CadastroEventos />} />
        <Route path='/listagem-inscricoes' element={<ListagemInscricoes />} />
        <Route path='/listagem-notificacoes' element={<ListagemNotificacoes />} />
        <Route path='/listagem-categorias' element={<ListagemCategorias />} />
        <Route path='/cadastro-categorias' element={<CadastroCategorias />} />
        <Route path='/cadastro-categorias/:idParam' element={<CadastroCategorias />} />
        <Route path='/listagem-usuarios' element={<ListagemUsuarios />} />
       

        <Route path='/painel-administrativo' element={<PainelAdministrativo />} />
        <Route path='/meu-perfil' element={<MeuPerfil />} />
        <Route path='/login' element={<Login />} />
        <Route path='/cadastro' element={<CadastroUsuario />} />
      </Routes>
    </BrowserRouter>
  );
}

export default Rotas;