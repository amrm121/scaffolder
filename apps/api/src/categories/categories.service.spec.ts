import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service';
import { CategoriesService } from './categories.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: any;

  const mockCategory = {
    id: 'cat-uuid-1',
    name: 'Estudos',
    ownerId: 'user-uuid-1',
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    prisma = {
      category: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      task: {
        updateMany: vi.fn(),
      },
    };
    service = new CategoriesService(prisma as unknown as PrismaService);
  });

  it('creates category for the user', async () => {
    prisma.category.create.mockResolvedValue(mockCategory);

    const result = await service.create('user-uuid-1', { name: '  Estudos  ' });

    expect(result.name).toBe('Estudos');
    expect(prisma.category.create).toHaveBeenCalledWith({
      data: { name: 'Estudos', ownerId: 'user-uuid-1' },
    });
  });

  it('lists only categories of the user that were not deleted', async () => {
    prisma.category.findMany.mockResolvedValue([mockCategory]);

    const result = await service.findAll('user-uuid-1');

    expect(result).toHaveLength(1);
    expect(prisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ownerId: 'user-uuid-1', deletedAt: null },
      }),
    );
  });

  it('renames category of the owner', async () => {
    prisma.category.findFirst.mockResolvedValue(mockCategory);
    prisma.category.update.mockResolvedValue({ ...mockCategory, name: 'Trabalho' });

    const result = await service.update('user-uuid-1', mockCategory.id, { name: 'Trabalho' });

    expect(result.name).toBe('Trabalho');
  });

  it('throws NotFoundException when category does not exist', async () => {
    prisma.category.findFirst.mockResolvedValue(null);

    await expect(service.update('user-uuid-1', 'nao-existe', { name: 'X1' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('prevents another user from changing the category', async () => {
    prisma.category.findFirst.mockResolvedValue(mockCategory);

    await expect(service.remove('user-uuid-2', mockCategory.id)).rejects.toThrow(
      ForbiddenException,
    );
    expect(prisma.category.update).not.toHaveBeenCalled();
  });

  it('removes category and leaves its tasks without category', async () => {
    prisma.category.findFirst.mockResolvedValue(mockCategory);

    await service.remove('user-uuid-1', mockCategory.id);

    expect(prisma.task.updateMany).toHaveBeenCalledWith({
      where: { categoryId: mockCategory.id },
      data: { categoryId: null },
    });
    expect(prisma.category.update).toHaveBeenCalledWith({
      where: { id: mockCategory.id },
      data: { deletedAt: expect.any(Date) },
    });
  });
});
