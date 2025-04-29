import { PrismaClient } from '@prisma/client';

class SoftDeleteManager {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Aplica soft delete em um registro específico
   */
  async softDelete(model: string, id: number): Promise<any> {
    // @ts-ignore - Para ignorar erros de tipo dinâmico
    return this.prisma[model].update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  /**
   * Restaura um registro que foi excluído por soft delete
   */
  async restore(model: string, id: number): Promise<any> {
    // @ts-ignore - Para ignorar erros de tipo dinâmico
    return this.prisma[model].update({
      where: { id },
      data: { deletedAt: null }
    });
  }

  /**
   * Aplica where para filtrar registros excluídos
   */
  excludeDeleted(): { deletedAt: null } {
    return { deletedAt: null };
  }

  /**
   * Aplica where para mostrar apenas registros excluídos
   */
  onlyDeleted(): { deletedAt: { not: null } } {
    return { deletedAt: { not: null } };
  }

  /**
   * Retorna uma condição where que pode ser combinada com outras
   */
  withDeletedCondition(includeDeleted: boolean): object {
    return includeDeleted ? {} : this.excludeDeleted();
  }
}

export default SoftDeleteManager;