-- Migration: 20260928_task_categories
-- Description: Cria a tabela de categorias e associa cada tarefa a uma categoria (opcional)

-- Consulta 001: Criação da tabela categories
CREATE TABLE "categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "ownerId" UUID NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- Consulta 002: Índices por dono e soft delete
CREATE INDEX "categories_ownerId_idx" ON "categories"("ownerId");
CREATE INDEX "categories_deletedAt_idx" ON "categories"("deletedAt");

-- Consulta 003: Foreign key relacionando a categoria ao perfil do usuário
ALTER TABLE "categories" ADD CONSTRAINT "categories_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Consulta 004: Nova coluna categoryId na tabela tasks
ALTER TABLE "tasks" ADD COLUMN "categoryId" UUID;
CREATE INDEX "tasks_categoryId_idx" ON "tasks"("categoryId");
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
