import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import axios from 'axios';
import CadastroEventos from './views/cadastro-eventos';
import { dataValida, formatarData } from './config/datas';
import { validarNomeCategoria } from './config/validacoes';

jest.mock('axios');

describe('datas usadas no cadastro e edição de eventos', () => {
  test('aceita data ISO e data legada no campo de edição', () => {
    expect(dataValida('2026-11-05')).toBe('2026-11-05');
    expect(dataValida('05-11-2026')).toBe('2026-11-05');
  });

  test('não exibe datas vazias ou inválidas como uma data real', () => {
    expect(dataValida('00-00-0000')).toBe('');
    expect(formatarData('')).toBe('-');
  });

  test('normaliza espaços no nome e rejeita nomes repetidos sem diferenciar maiúsculas', () => {
    const categorias = [{ id: '1', nome: 'Música' }];
    expect(validarNomeCategoria('  Feira de Música  ', categorias, null)).toBeNull();
    expect(validarNomeCategoria(' música ', categorias, null)).toMatch(/Já existe/);
    expect(validarNomeCategoria('Música', categorias, '1')).toBeNull();
    expect(validarNomeCategoria('  ', categorias, null)).toMatch(/não pode ficar em branco/);
  });
});

test('cancelar a edição volta à lista sem gravar as alterações digitadas', async () => {
  axios.get.mockImplementation((url) => url.endsWith('/categorias')
    ? Promise.resolve({ data: [{ id: '1', nome: 'Música', status: true }] })
    : Promise.resolve({ data: { id: '42', nome: 'Evento original', descricao: '', imagem: '', idCategoria: '1', capacidade: 30, tipoEvento: 'gratuito', preco: 0, data: '2026-12-15', horario: '19:00', inicioInscricao: '2026-11-01', fimInscricao: '2026-12-14', logradouro: 'Rua A', complemento: '', bairro: 'Centro', cidade: 'Juiz de Fora', estado: 'MG', cep: '36000-000', pais: 'Brasil', status: 'aberto', idUsuario: '1' } }));
  render(<MemoryRouter initialEntries={['/cadastro-eventos/42']}><Routes>
    <Route path='/cadastro-eventos/:idParam' element={<CadastroEventos />} />
    <Route path='/listagem-meus-eventos' element={<div>Lista de eventos</div>} />
  </Routes></MemoryRouter>);
  const campoNome = await screen.findByLabelText('Nome: *');
  fireEvent.change(campoNome, { target: { value: 'Alteração não salva' } });
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(await screen.findByText('Lista de eventos')).toBeInTheDocument();
  expect(axios.put).not.toHaveBeenCalled();
  expect(axios.post).not.toHaveBeenCalled();
});
