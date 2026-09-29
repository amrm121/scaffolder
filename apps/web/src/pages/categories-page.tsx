import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit2, Tags, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { ActionFeedback, EmptyState, ErrorState, LoadingState } from '../components/ui/state-feedback';
import {
  categoriesControllerCreate,
  categoriesControllerFindAll,
  categoriesControllerRemove,
  categoriesControllerUpdate,
} from '../lib/api-client';
import type { CategoryDto } from '../lib/api-client/models';

const categoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'O nome deve ter no mínimo 2 caracteres.')
    .max(50, 'O nome deve ter no máximo 50 caracteres.'),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

function getErrorMessage(err: unknown, fallback: string) {
  return (
    (err as { detail?: string })?.detail ||
    (err as { message?: string })?.message ||
    fallback
  );
}

export function CategoriesPage() {
  const queryClient = useQueryClient();
  const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data: categories = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await categoriesControllerFindAll();
      return res.data as CategoryDto[];
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { name: '' },
  });

  const refreshLists = () => {
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    reset({ name: '' });
  };

  const saveMutation = useMutation({
    mutationFn: async (data: CategoryFormValues) => {
      if (editingCategory) {
        await categoriesControllerUpdate(editingCategory.id, data);
      } else {
        await categoriesControllerCreate(data);
      }
    },
    onSuccess: () => {
      setFeedback({
        type: 'success',
        message: editingCategory ? 'Categoria atualizada com sucesso!' : 'Categoria criada com sucesso!',
      });
      cancelEdit();
      refreshLists();
    },
    onError: (err: unknown) => {
      setFeedback({ type: 'error', message: getErrorMessage(err, 'Não foi possível salvar a categoria.') });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await categoriesControllerRemove(id);
    },
    onSuccess: () => {
      setFeedback({ type: 'success', message: 'Categoria removida com sucesso.' });
      cancelEdit();
      refreshLists();
    },
    onError: (err: unknown) => {
      setFeedback({ type: 'error', message: getErrorMessage(err, 'Falha ao excluir a categoria.') });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Tags className="h-6 w-6 text-blue-600" />
          Categorias de Tarefas
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Crie categorias para organizar suas tarefas.
        </p>
      </div>

      {feedback && (
        <ActionFeedback
          type={feedback.type}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      )}

      <Card>
        <CardContent className="p-4">
          <form
            onSubmit={handleSubmit((data) => {
              setFeedback(null);
              saveMutation.mutate(data);
            })}
            className="flex flex-col sm:flex-row sm:items-start gap-3"
          >
            <Input
              label={editingCategory ? 'Renomear categoria' : 'Nova categoria'}
              placeholder="Ex.: Estudos"
              {...register('name')}
              error={errors.name?.message}
            />
            <div className="flex gap-2 sm:pt-7">
              {editingCategory && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancelar
                </Button>
              )}
              <Button type="submit" isLoading={saveMutation.isPending}>
                {editingCategory ? 'Salvar' : 'Adicionar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <LoadingState message="Carregando categorias..." />
      ) : isError ? (
        <ErrorState
          title="Erro ao buscar categorias"
          message="Não foi possível carregar as categorias no momento."
          onRetry={() => refetch()}
        />
      ) : categories.length === 0 ? (
        <EmptyState
          title="Nenhuma categoria cadastrada"
          description="Use o formulário acima para criar a primeira."
        />
      ) : (
        <Card>
          <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {category.name}
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    title="Editar Categoria"
                    onClick={() => {
                      setEditingCategory(category);
                      reset({ name: category.name });
                    }}
                  >
                    <Edit2 className="h-3.5 w-3.5 text-slate-500" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                    title="Excluir Categoria"
                    isLoading={deleteMutation.isPending && deleteMutation.variables === category.id}
                    onClick={() => {
                      if (confirm(`Deseja remover a categoria "${category.name}"? As tarefas dela ficarão sem categoria.`)) {
                        deleteMutation.mutate(category.id);
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
