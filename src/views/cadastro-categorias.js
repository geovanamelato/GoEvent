import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import Card from '../components/card';
import FormGroup from '../components/form-group';

import { mensagemSucesso, mensagemErro, mensagemAlert } from '../components/toastr';

import '../custom.css';

import axios from 'axios';
import { BASE_URL } from '../config/axios';

function CadastroCategorias() {
  const { idParam } = useParams();

  const navigate = useNavigate();

  const baseURL = `${BASE_URL}/categorias`;

  const [nome, setNome] = useState('');
  const [nomeOriginal, setNomeOriginal] = useState(''); // nome como estava ao abrir a tela
  const [categorias, setCategorias] = useState([]);

  const editando = idParam != null;

  // regras de cadastro e de edição (as mesmas que aparecem na tela)
  function validar() {
    const nomeLimpo = nome.trim();
    if (!nomeLimpo) {
      return 'O nome da categoria não pode ficar em branco';
    }
    if (nomeLimpo.length < 3) {
      return 'O nome deve ter no mínimo 3 caracteres';
    }
    const repetida = categorias.some(
      (c) =>
        String(c.id) !== String(idParam) &&
        c.nome.trim().toLowerCase() === nomeLimpo.toLowerCase()
    );
    if (repetida) {
      return 'Já existe uma categoria com esse nome';
    }
    return null;
  }

  // cancelar: continua na mesma tela e desfaz o que foi digitado (volta ao nome de antes)
  function cancelar() {
    setNome(nomeOriginal);
    mensagemAlert('Alterações descartadas');
  }

  async function salvar() {
    const erro = validar();
    if (erro) {
      mensagemErro(erro);
      return;
    }

    if (!editando) {
      await axios
        .post(baseURL, { nome: nome.trim(), status: true })
        .then(function () {
          mensagemSucesso(`Categoria ${nome.trim()} cadastrada com sucesso!`);
          navigate('/listagem-categorias');
        })
        .catch(function () {
          mensagemErro('Erro ao cadastrar a categoria');
        });
    } else {
    
      
      await axios
        .patch(`${baseURL}/${idParam}`, { nome: nome.trim() })
        .then(function () {
          mensagemSucesso(`Categoria ${nome.trim()} alterada com sucesso!`);
          navigate('/listagem-categorias');
        })
        .catch(function () {
          mensagemErro('Erro ao alterar a categoria');
        });
    }
  }

  async function buscar() {
    await axios.get(baseURL).then((response) => {
      setCategorias(response.data);
    });
    if (editando) {
      await axios.get(`${baseURL}/${idParam}`).then((response) => {
        setNome(response.data.nome.trim());
        setNomeOriginal(response.data.nome.trim());
      });
    }
  }

  useEffect(() => {
    buscar(); 
  }, [idParam]);

  return (
    <div className='container'>
      <Card title={editando ? 'Editar Categoria' : 'Cadastrar nova Categoria'}>
        <div className='row'>
          <div className='col-lg-12'>
            <div className='bs-component'>
              <FormGroup label='Nome da Categoria' htmlFor='inputNome'>
                <input
                  type='text'
                  id='inputNome'
                  value={nome}
                  className='form-control'
                  name='nome'
                  placeholder={editando ? 'Altere o nome da categoria' : 'Digite o nome da categoria'}
                  onChange={(e) => setNome(e.target.value)}
                />
              </FormGroup>

              <div className='d-flex justify-content-end gap-2 mt-3 mb-4'>
                <button onClick={cancelar} type='button' className='btn btn-secondary'>
                  Cancelar
                </button>
                <button onClick={salvar} type='button' className='btn btn-success'>
                  {editando ? 'Confirmar' : 'Cadastrar'}
                </button>
              </div>

              <div className='bg-dark bg-opacity-25 rounded p-3'>
                <strong>{editando ? 'Regras de Edição' : 'Regras de Cadastro'}</strong>
                <ul className='mb-0 mt-2'>
                  <li>Não pode deixar em branco</li>
                  <li>O nome deve ter no mínimo 3 caracteres</li>
                  <li>Não pode existir outra categoria com o mesmo nome</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default CadastroCategorias;