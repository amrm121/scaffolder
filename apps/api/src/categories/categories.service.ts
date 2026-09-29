import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CategoryDto, CreateCategoryDto, UpdateCategoryDto } from './category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateCategoryDto): Promise<CategoryDto> {
    const created = await this.prisma.category.create({
      data: {
        name: dto.name.trim(),
        ownerId,
      },
    });

    return this.serializeCategory(created);
  }

  async findAll(ownerId: string): Promise<CategoryDto[]> {
    const items = await this.prisma.category.findMany({
      where: { ownerId, deletedAt: null },
      orderBy: { name: 'asc' },
    });

    return items.map((item) => this.serializeCategory(item));
  }

  async update(ownerId: string, id: string, dto: UpdateCategoryDto): Promise<CategoryDto> {
    await this.findOwnedCategory(ownerId, id);

    const updated = await this.prisma.category.update({
      where: { id },
      data: { name: dto.name.trim() },
    });

    return this.serializeCategory(updated);
  }

  async remove(ownerId: string, id: string): Promise<void> {
    await this.findOwnedCategory(ownerId, id);

    await this.prisma.task.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    });

    await this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async findOwnedCategory(ownerId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada.');
    }

    if (category.ownerId !== ownerId) {
      throw new ForbiddenException('Você não tem permissão para alterar esta categoria.');
    }

    return category;
  }

  private serializeCategory(category: any): CategoryDto {
    return {
      id: category.id,
      name: category.name,
      ownerId: category.ownerId,
      createdAt: new Date(category.createdAt).toISOString(),
      updatedAt: new Date(category.updatedAt).toISOString(),
    };
  }
}
