import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import Card from '../components/card';
import FormGroup from '../components/form-group';

import { mensagemSucesso, mensagemErro, mensagemAlert } from '../components/toastr';

import '../custom.css';

import axios from 'axios';
import { BASE_URL } from '../config/axios';

const ESTADOS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

// o campo de data só aceita aaaa-mm-dd: converte dd-mm-aaaa (dados antigos)
// e datas que não existem (00-00-0000) ficam vazias
function dataValida(valor) {
  const m = String(valor || '').match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (!m) return valor || '';
  return m[1] === '00' || m[2] === '00' ? '' : `${m[3]}-${m[2]}-${m[1]}`;
}

// estados antigos foram guardados por extenso ("Minas Gerais"); o campo agora é uma lista de siglas
const NOMES_ESTADOS = { 'minas gerais': 'MG', 'são paulo': 'SP', 'rio de janeiro': 'RJ' };
function siglaEstado(valor) {
  const texto = String(valor || '').trim();
  return ESTADOS.includes(texto.toUpperCase()) ? texto.toUpperCase() : NOMES_ESTADOS[texto.toLowerCase()] || '';
}

const VAZIO = {
  nome: '', idCategoria: '', descricao: '', capacidade: '', tipoEvento: 'gratuito',
  preco: '', data: '', horario: '', inicioInscricao: '', fimInscricao: '', logradouro: '',
  complemento: '', bairro: '', cidade: '', estado: '', cep: '', pais: 'Brasil',
};

function CadastroEventos() {
  const { idParam } = useParams();
  const navigate = useNavigate();

  const baseURL = `${BASE_URL}/eventos`;
  const editando = idParam != null;

  const [form, setForm] = useState(VAZIO);
  const [semComplemento, setSemComplemento] = useState(false);
  const [original, setOriginal] = useState({ form: VAZIO, semComplemento: false }); // como estava ao abrir a tela
  const [tentou, setTentou] = useState(false); // já clicou em Salvar (para marcar os campos vazios)
  const [categorias, setCategorias] = useState([]);

  const mudar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  // campos que precisam estar preenchidos (o preço só se o evento for pago)
  function faltando(campo) {
    if (campo === 'preco') return form.tipoEvento === 'pago' && !form.preco;
    if (campo === 'complemento') return !semComplemento && !form.complemento.trim();
    return !String(form[campo]).trim();
  }

  // classe do campo: fica vermelho se tentou salvar e ele está vazio
  const classe = (campo) => `form-control form-control-sm${tentou && faltando(campo) ? ' is-invalid' : ''}`;

  // cancelar: continua na mesma tela e desfaz o que foi digitado
  // (na edição volta aos dados do evento; no cadastro limpa os campos)
  function cancelar() {
    setForm(original.form);
    setSemComplemento(original.semComplemento);
    setTentou(false);
    mensagemAlert('Alterações descartadas');
  }

  async function salvar() {
    setTentou(true);
    if (Object.keys(VAZIO).some(faltando)) {
      mensagemErro('Preencha todos os campos');
      return;
    }
    if (Number(form.capacidade) <= 0) {
      mensagemErro('A capacidade máxima deve ser maior que zero');
      return;
    }
    if (form.tipoEvento === 'pago' && Number(form.preco) <= 0) {
      mensagemErro('Informe o valor da inscrição');
      return;
    }
    if (form.fimInscricao < form.inicioInscricao) {
      mensagemErro('O fim das inscrições não pode ser antes do início');
      return;
    }

    const dados = {
      ...form,
      nome: form.nome.trim(),
      capacidade: Number(form.capacidade),
      preco: form.tipoEvento === 'pago' ? Number(form.preco) : 0,
      complemento: semComplemento ? '' : form.complemento.trim(),
    };

    if (!editando) {
      // provisório, até existir o login: o evento fica com o usuário 1
      await axios
        .post(baseURL, { ...dados, status: 'aberto', idUsuario: '1' })
        .then(function () {
          mensagemSucesso(`Evento ${dados.nome} cadastrado com sucesso!`);
          navigate('/listagem-meus-eventos');
        })
        .catch(function () {
          mensagemErro('Erro ao cadastrar o evento');
        });
    } else {
      // PATCH só muda o que está na tela (status e dono do evento ficam como estavam)
      await axios
        .patch(`${baseURL}/${idParam}`, dados)
        .then(function () {
          mensagemSucesso(`Evento ${dados.nome} alterado com sucesso!`);
          navigate('/listagem-meus-eventos');
        })
        .catch(function () {
          mensagemErro('Erro ao alterar o evento');
        });
    }
  }

  async function buscar() {
    await axios.get(`${BASE_URL}/categorias`).then((response) => {
      setCategorias(response.data);
    });
    if (editando) {
      await axios.get(`${baseURL}/${idParam}`).then((response) => {
        const e = response.data;
        const carregado = {
          nome: e.nome || '',
          idCategoria: e.idCategoria == null ? '' : String(e.idCategoria),
          descricao: e.descricao || '',
          capacidade: e.capacidade == null ? '' : String(e.capacidade),
          tipoEvento: e.tipoEvento || 'gratuito',
          preco: e.preco ? String(e.preco) : '',
          data: dataValida(e.data),
          horario: e.horario || '',
          inicioInscricao: dataValida(e.inicioInscricao),
          fimInscricao: dataValida(e.fimInscricao),
          logradouro: e.logradouro || '',
          complemento: e.complemento || '',
          bairro: e.bairro || '',
          cidade: (e.cidade || '').trim(),
          estado: siglaEstado(e.estado),
          cep: e.cep || '',
          pais: e.pais || 'Brasil',
        };
        const sem = !(e.complemento || '').trim();
        setForm(carregado);
        setSemComplemento(sem);
        setOriginal({ form: carregado, semComplemento: sem });
      });
    }
  }

  useEffect(() => {
    buscar(); // eslint-disable-next-line
  }, [idParam]);

  // só categorias ativas; na edição mantém a que o evento já tinha (mesmo inativa)
  const categoriasDisponiveis = categorias.filter(
    (c) => c.status || String(c.id) === form.idCategoria
  );

  return (
    <div className='container'>
      <Card title={editando ? 'Edição de Evento' : 'Cadastro de Evento'}>
        <div className='bs-component'>
          <div className='row g-2'>
            <div className='col-md-4'>
              <FormGroup label='Nome: *' htmlFor='inputNome'>
                <input id='inputNome' type='text' className={classe('nome')} value={form.nome} onChange={mudar('nome')} />
              </FormGroup>
            </div>
            <div className='col-md-4'>
              <FormGroup label='Categoria: *' htmlFor='inputCategoria'>
                <select id='inputCategoria' className={classe('idCategoria')} value={form.idCategoria} onChange={mudar('idCategoria')}>
                  <option value=''>Selecione...</option>
                  {categoriasDisponiveis.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome.trim()}</option>
                  ))}
                </select>
              </FormGroup>
            </div>
            <div className='col-md-4'>
              <FormGroup label='Capacidade máxima: *' htmlFor='inputCapacidade'>
                <input id='inputCapacidade' type='number' min='1' className={classe('capacidade')} value={form.capacidade} onChange={mudar('capacidade')} />
              </FormGroup>
            </div>

            <div className='col-md-4'>
              <FormGroup label='Data: *' htmlFor='inputData'>
                <input id='inputData' type='date' className={classe('data')} value={form.data} onChange={mudar('data')} />
              </FormGroup>
            </div>
            <div className='col-md-4'>
              <FormGroup label='Horário: *' htmlFor='inputHorario'>
                <input id='inputHorario' type='time' className={classe('horario')} value={form.horario} onChange={mudar('horario')} />
              </FormGroup>
            </div>
            <div className='col-md-4'>
              <FormGroup label='Início das inscrições: *' htmlFor='inputInicio'>
                <input id='inputInicio' type='date' className={classe('inicioInscricao')} value={form.inicioInscricao} onChange={mudar('inicioInscricao')} />
              </FormGroup>
            </div>
            <div className='col-md-4'>
              <FormGroup label='Fim das inscrições: *' htmlFor='inputFim'>
                <input id='inputFim' type='date' className={classe('fimInscricao')} value={form.fimInscricao} onChange={mudar('fimInscricao')} />
              </FormGroup>
            </div>
            <div className='col-md-2'>
              <FormGroup label='Tipo: *' htmlFor='inputTipo'>
                <select
                  id='inputTipo'
                  className='form-control form-control-sm'
                  value={form.tipoEvento}
                  onChange={(e) => setForm({ ...form, tipoEvento: e.target.value, preco: '' })}
                >
                  <option value='gratuito'>Gratuito</option>
                  <option value='pago'>Pago</option>
                </select>
              </FormGroup>
            </div>
            <div className='col-md-2'>
              <FormGroup label='Valor (R$):' htmlFor='inputPreco'>
                <input
                  id='inputPreco'
                  type='number'
                  min='0'
                  step='0.01'
                  className={classe('preco')}
                  disabled={form.tipoEvento !== 'pago'}
                  value={form.preco}
                  onChange={mudar('preco')}
                />
              </FormGroup>
            </div>

            <div className='col-md-4'>
              <FormGroup label='Logradouro: *' htmlFor='inputLogradouro'>
                <input id='inputLogradouro' type='text' className={classe('logradouro')} value={form.logradouro} onChange={mudar('logradouro')} />
              </FormGroup>
            </div>
            <div className='col-md-4'>
              <FormGroup label='Complemento: *' htmlFor='inputComplemento'>
                <input
                  id='inputComplemento'
                  type='text'
                  className={classe('complemento')}
                  disabled={semComplemento}
                  value={semComplemento ? '' : form.complemento}
                  onChange={mudar('complemento')}
                />
              </FormGroup>
              <label className='small'>
                <input type='checkbox' checked={semComplemento} onChange={(e) => setSemComplemento(e.target.checked)} /> Sem complemento
              </label>
            </div>
            <div className='col-md-4'>
              <FormGroup label='Bairro: *' htmlFor='inputBairro'>
                <input id='inputBairro' type='text' className={classe('bairro')} value={form.bairro} onChange={mudar('bairro')} />
              </FormGroup>
            </div>

            <div className='col-md-4'>
              <FormGroup label='Cidade: *' htmlFor='inputCidade'>
                <input id='inputCidade' type='text' className={classe('cidade')} value={form.cidade} onChange={mudar('cidade')} />
              </FormGroup>
            </div>
            <div className='col-md-2'>
              <FormGroup label='Estado: *' htmlFor='inputEstado'>
                <select id='inputEstado' className={classe('estado')} value={form.estado} onChange={mudar('estado')}>
                  <option value=''>UF</option>
                  {ESTADOS.map((uf) => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </FormGroup>
            </div>
            <div className='col-md-3'>
              <FormGroup label='CEP: *' htmlFor='inputCep'>
                <input id='inputCep' type='text' className={classe('cep')} value={form.cep} onChange={mudar('cep')} />
              </FormGroup>
            </div>
            <div className='col-md-3'>
              <FormGroup label='País: *' htmlFor='inputPais'>
                <input id='inputPais' type='text' className={classe('pais')} value={form.pais} onChange={mudar('pais')} />
              </FormGroup>
            </div>

            <div className='col-12'>
              <FormGroup label='Descrição: *' htmlFor='inputDescricao'>
                <textarea id='inputDescricao' rows='2' className={classe('descricao')} value={form.descricao} onChange={mudar('descricao')} />
              </FormGroup>
            </div>
          </div>

          <div className='d-flex justify-content-end gap-2 mt-3'>
            <button onClick={cancelar} type='button' className='btn btn-secondary'>
              Cancelar
            </button>
            <button onClick={salvar} type='button' className='btn btn-success'>
              Salvar
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default CadastroEventos;