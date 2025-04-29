import { Request, Response } from 'express';
import prisma, { softDeleteManager } from '../prismaClient';
import FilterProcessor from '../utils/FilterProcessor';

class PermissionController {
  async listarTodas(req: Request, res: Response) {
    try {
      // Usando o FilterProcessor para processar os parâmetros de consulta
      const queryOptions = FilterProcessor.fromQueryParams(req.query);
      const query = FilterProcessor.processQuery(queryOptions);
      
      // Inclusão de relacionamentos
      query.include = {
        roles: {
          where: { deletedAt: null } as any,  // Forçando o tipo
          include: {
            role: true
          }
        }
      };
      
      // @ts-ignore - Ignorando erros de tipagem
      const permissions = await prisma.permission.findMany(query);
      
      const permissionsFormatadas = permissions.map((permission: any) => ({
        ...permission,
        roles: permission.roles.map((rp: any) => rp.role)
      }));
      
      return res.json(permissionsFormatadas);
    } catch (error) {
      console.error('Erro ao listar permissões:', error);
      return res.status(500).json({ erro: 'Erro ao listar permissões' });
    }
  }

  async obterPorId(req: Request, res: Response) {
    const { id } = req.params;
    
    try {
      // @ts-ignore - Ignorando erros de tipagem
      const permission = await prisma.permission.findFirst({
        where: { 
          id: Number(id),
          deletedAt: null
        } as any,
        include: {
          roles: {
            where: { deletedAt: null } as any,
            include: {
              role: true
            }
          }
        }
      });
      
      if (!permission) {
        return res.status(404).json({ erro: 'Permissão não encontrada' });
      }
      
      const permissionFormatada = {
        ...permission,
        roles: permission.roles.map((rp: any) => rp.role)
      };
      
      return res.json(permissionFormatada);
    } catch (error) {
      console.error('Erro ao buscar permissão:', error);
      return res.status(500).json({ erro: 'Erro ao buscar permissão' });
    }
  }

  async criar(req: Request, res: Response) {
    const { nome, descricao } = req.body;
    
    try {
      // @ts-ignore - Ignorando erros de tipagem
      const novaPermission = await prisma.permission.create({
        data: {
          nome,
          descricao
        }
      });
      
      return res.status(201).json(novaPermission);
    } catch (error) {
      console.error('Erro ao criar permissão:', error);
      return res.status(400).json({ erro: 'Não foi possível criar a permissão. Verifique se o nome já está em uso.' });
    }
  }

  async atualizar(req: Request, res: Response) {
    const { id } = req.params;
    const { nome, descricao } = req.body;
    
    try {
      // @ts-ignore - Ignorando erros de tipagem
      const permissionExistente = await prisma.permission.findFirst({
        where: { 
          id: Number(id),
          deletedAt: null
        } as any
      });

      if (!permissionExistente) {
        return res.status(404).json({ erro: 'Permissão não encontrada ou já excluída' });
      }

      // @ts-ignore - Ignorando erros de tipagem
      const permissionAtualizada = await prisma.permission.update({
        where: { id: Number(id) },
        data: {
          ...(nome !== undefined && { nome }),
          ...(descricao !== undefined && { descricao })
        }
      });
      
      return res.json(permissionAtualizada);
    } catch (error) {
      console.error('Erro ao atualizar permissão:', error);
      return res.status(400).json({ erro: 'Não foi possível atualizar a permissão' });
    }
  }

  async remover(req: Request, res: Response) {
    const { id } = req.params;
    
    try {
      // Aplicando soft delete
      // @ts-ignore - Ignorando erros de tipagem
      const resultado = await prisma.permission.update({
        where: { id: Number(id) },
        data: { 
          deletedAt: new Date()
        } as any
      });
      
      if (!resultado) {
        return res.status(404).json({ erro: 'Permissão não encontrada ou já excluída' });
      }
      
      // Também marcar as relações como excluídas
      // @ts-ignore - Ignorando erros de tipagem
      await prisma.rolePermission.updateMany({
        where: { 
          permissionId: Number(id),
          deletedAt: null
        } as any,
        data: { 
          deletedAt: new Date() 
        } as any
      });
      
      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao remover permissão:', error);
      return res.status(400).json({ erro: 'Não foi possível remover a permissão' });
    }
  }

  async listarExcluidas(req: Request, res: Response) {
    try {
      // @ts-ignore - Ignorando erros de tipagem
      const permissions = await prisma.permission.findMany({
        where: { 
          deletedAt: { not: null } 
        } as any,
        include: {
          roles: {
            include: {
              role: true
            }
          }
        }
      });
      
      const permissionsFormatadas = permissions.map((permission: any) => ({
        ...permission,
        roles: permission.roles.map((rp: any) => rp.role)
      }));
      
      return res.json(permissionsFormatadas);
    } catch (error) {
      console.error('Erro ao listar permissões excluídas:', error);
      return res.status(500).json({ erro: 'Erro ao listar permissões excluídas' });
    }
  }

  async restaurar(req: Request, res: Response) {
    const { id } = req.params;
    
    try {
      // @ts-ignore - Ignorando erros de tipagem
      const permissionRestaurada = await prisma.permission.update({
        where: { id: Number(id) },
        data: {
          deletedAt: null
        } as any
      });
      
      if (!permissionRestaurada) {
        return res.status(404).json({ erro: 'Permissão não encontrada' });
      }
      
      // Também restaurar as relações
      // @ts-ignore - Ignorando erros de tipagem
      await prisma.rolePermission.updateMany({
        where: { 
          permissionId: Number(id),
          deletedAt: { not: null }
        } as any,
        data: { 
          deletedAt: null 
        } as any
      });
      
      // Buscar dados completos após restauração
      // @ts-ignore - Ignorando erros de tipagem
      const permissionCompleta = await prisma.permission.findUnique({
        where: { id: Number(id) },
        include: {
          roles: {
            include: {
              role: true
            }
          }
        }
      });
      
      const permissionFormatada = {
        ...permissionCompleta,
        roles: permissionCompleta?.roles.map((rp: any) => rp.role) || []
      };
      
      return res.json(permissionFormatada);
    } catch (error) {
      console.error('Erro ao restaurar permissão:', error);
      return res.status(400).json({ erro: 'Não foi possível restaurar a permissão' });
    }
  }

  async excluirPermanentemente(req: Request, res: Response) {
    const { id } = req.params;
    
    try {
      // @ts-ignore - Ignorando erros de tipagem
      await prisma.permission.delete({
        where: { id: Number(id) }
      });
      
      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir permanentemente permissão:', error);
      return res.status(400).json({ erro: 'Não foi possível excluir permanentemente a permissão' });
    }
  }
}

export default new PermissionController();