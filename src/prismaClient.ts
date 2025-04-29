import { PrismaClient, Prisma } from '@prisma/client';
import SoftDeleteManager from './utils/SoftDeleteManager';

// Extensão dos modelos do Prisma para suportar soft delete
const prismaClientExtensions = {
  model: {
    $allModels: {
      async softDelete<T>(
        this: T,
        where: any
      ): Promise<any> {
        // @ts-ignore
        return this.update({
          where,
          data: {
            deletedAt: new Date(),
          },
        });
      },
      async restore<T>(
        this: T,
        where: any
      ): Promise<any> {
        // @ts-ignore
        return this.update({
          where,
          data: {
            deletedAt: null,
          },
        });
      },
      findMany<T>(
        this: T,
        args: any = {}
      ): Promise<any> {
        // Adiciona condição para não retornar itens excluídos
        args = args || {};
        args.where = {
          ...args.where,
          deletedAt: null,
        };
        // @ts-ignore
        return Prisma.getExtensionContext(this).findMany(args);
      },
      findFirst<T>(
        this: T,
        args: any = {}
      ): Promise<any> {
        // Adiciona condição para não retornar itens excluídos
        args = args || {};
        args.where = {
          ...args.where,
          deletedAt: null,
        };
        // @ts-ignore
        return Prisma.getExtensionContext(this).findFirst(args);
      },
      findUnique<T>(
        this: T,
        args: any = {}
      ): Promise<any> {
        // @ts-ignore
        return Prisma.getExtensionContext(this).findUnique(args);
      }
    },
  },
};

// Instância do Prisma com extensões
const prisma = new PrismaClient().$extends(prismaClientExtensions);

// Gerenciador de soft delete
export const softDeleteManager = new SoftDeleteManager(new PrismaClient());

// Define tipos para os modelos extendidos
export type ExtendedPrismaClient = typeof prisma;

export default prisma;