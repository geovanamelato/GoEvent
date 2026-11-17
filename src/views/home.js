import React from 'react';
import { Link } from 'react-router-dom';

import '../custom.css';

// Página inicial: apresenta o sistema e oferece as opções "Criar conta" e "Entrar"
function Home() {
  return (
    <div className='container'>
      <section className='goevent-hero mb-4'>
        <h1 className='fw-bold display-4'>GoEvent</h1>
        <p className='lead mb-4'>Encontre, crie e gerencie eventos em um só lugar.</p>
        <div className='d-flex justify-content-center flex-wrap gap-2'>
          <Link to='/cadastro' className='btn btn-go-claro btn-lg'>
            Criar conta
          </Link>
          <Link to='/login' className='btn btn-go-contorno btn-lg'>
            Entrar
          </Link>
        </div>
      </section>

      <section className='row text-center'>
        <div className='col-md-4 mb-3'>
          <h5>Descubra</h5>
          <p className='text-muted mb-0'>Pesquise por nome ou categoria e veja os detalhes de cada evento.</p>
        </div>
        <div className='col-md-4 mb-3'>
          <h5>Inscreva-se</h5>
          <p className='text-muted mb-0'>Garanta a sua vaga enquanto as inscrições estiverem abertas.</p>
        </div>
        <div className='col-md-4 mb-3'>
          <h5>Organize</h5>
          <p className='text-muted mb-0'>Cadastre seus eventos, acompanhe os inscritos e receba notificações.</p>
        </div>
      </section>

      <div className='text-center mt-3'>
        <Link to='/listagem-eventos'>Ver os eventos disponíveis</Link>
      </div>
    </div>
  );
}

export default Home;