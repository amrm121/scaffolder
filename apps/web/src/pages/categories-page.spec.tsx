import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { categoriesControllerCreate } from '../lib/api-client';
import { CategoriesPage } from './categories-page';

vi.mock('../lib/api-client', () => ({
  categoriesControllerFindAll: vi.fn().mockResolvedValue({
    data: [
      { id: 'cat-1', name: 'Faculdade', ownerId: 'usr-1', createdAt: '', updatedAt: '' },
      { id: 'cat-2', name: 'Trabalho', ownerId: 'usr-1', createdAt: '', updatedAt: '' },
    ],
    status: 200,
    headers: new Headers(),
  }),
  categoriesControllerCreate: vi.fn().mockResolvedValue({ status: 201 }),
  categoriesControllerUpdate: vi.fn(),
  categoriesControllerRemove: vi.fn(),
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <CategoriesPage />
    </QueryClientProvider>,
  );
}

describe('CategoriesPage', () => {
  it('lists the categories of the user', async () => {
    renderPage();

    expect(screen.getByText('Categorias de Tarefas')).toBeInTheDocument();
    expect(await screen.findByText('Faculdade')).toBeInTheDocument();
    expect(screen.getByText('Trabalho')).toBeInTheDocument();
  });

  it('creates a new category', async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText('Nova categoria'), { target: { value: 'Casa' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));

    await waitFor(() => {
      expect(categoriesControllerCreate).toHaveBeenCalledWith({ name: 'Casa' });
    });
    expect(await screen.findByText('Categoria criada com sucesso!')).toBeInTheDocument();
  });

  it('shows validation error for short name', async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText('Nova categoria'), { target: { value: 'a' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));

    expect(await screen.findByText('O nome deve ter no mínimo 2 caracteres.')).toBeInTheDocument();
  });
});
