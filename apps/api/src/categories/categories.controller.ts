import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../access/access.decorators';
import type { SafeUserProfile } from '../auth/auth.types';
import { ProblemDetailsDto } from '../common/dto/problem-details.dto';
import { CategoryDto, CreateCategoryDto, UpdateCategoryDto } from './category.dto';
import { CategoriesService } from './categories.service';

@ApiTags('categories')
@ApiBearerAuth()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova categoria' })
  @ApiResponse({ status: 201, description: 'Categoria criada com sucesso', type: CategoryDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos', type: ProblemDetailsDto })
  @ApiResponse({ status: 401, description: 'Não autenticado', type: ProblemDetailsDto })
  async create(
    @CurrentUser() user: SafeUserProfile,
    @Body() dto: CreateCategoryDto,
  ): Promise<CategoryDto> {
    return this.categoriesService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar categorias do usuário' })
  @ApiResponse({ status: 200, description: 'Lista de categorias', type: [CategoryDto] })
  @ApiResponse({ status: 401, description: 'Não autenticado', type: ProblemDetailsDto })
  async findAll(@CurrentUser() user: SafeUserProfile): Promise<CategoryDto[]> {
    return this.categoriesService.findAll(user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Renomear categoria' })
  @ApiResponse({ status: 200, description: 'Categoria atualizada com sucesso', type: CategoryDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos', type: ProblemDetailsDto })
  @ApiResponse({ status: 401, description: 'Não autenticado', type: ProblemDetailsDto })
  @ApiResponse({ status: 403, description: 'Acesso negado', type: ProblemDetailsDto })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada', type: ProblemDetailsDto })
  async update(
    @CurrentUser() user: SafeUserProfile,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<CategoryDto> {
    return this.categoriesService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir categoria (remoção lógica)' })
  @ApiResponse({ status: 204, description: 'Categoria excluída com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado', type: ProblemDetailsDto })
  @ApiResponse({ status: 403, description: 'Acesso negado', type: ProblemDetailsDto })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada', type: ProblemDetailsDto })
  async remove(
    @CurrentUser() user: SafeUserProfile,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.categoriesService.remove(user.id, id);
  }
}
