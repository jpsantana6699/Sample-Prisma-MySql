import { Request, Response } from 'express';
import prisma, { softDeleteManager } from '../prismaClient';
import FilterProcessor from '../utils/FilterProcessor';

class RoleController {
  async listarTodas(req: Request, res: Response) {
    try {
      // Usando o FilterProcessor para processar os parâmetros de consulta
      const queryOptions = FilterProcessor.fromQueryParams(req.query);
      const query = FilterProcessor.processQuery(queryOptions);
      
      // Inclusão de relacionamentos
      query.include = {
        permissions: {
          where: { deletedAt: null } as any,
          include: {
            permission: true
          }
        }
      };
      
      // @ts-ignore - Ignorando erros de tipagem
      const roles = await prisma.role.findMany(query);
      
      const rolesFormatadas = roles.map((role: any) => ({
        ...role,
        permissions: role.permissions.map((rp: any) => rp.permission)
      }));
      
      return res.json(rolesFormatadas);
    } catch (error) {
      console.error('Erro ao listar roles:', error);
      return res.status(500).json({ erro: 'Erro ao listar roles' });
    }
  }

  async obterPorId(req: Request, res: Response) {
    const { id } = req.params;
    
    try {
      // @ts-ignore - Ignorando erros de tipagem
      const role = await prisma.role.findFirst({
        where: { 
          id: Number(id),
          deletedAt: null
        } as any,
        include: {
          permissions: {
            where: { deletedAt: null } as any,
            include: {
              permission: true
            }
          },
          usuario: true
        }
      });
      
      if (!role) {
        return res.status(404).json({ erro: 'Role não encontrada' });
      }
      
      const roleFormatada = {
        ...role,
        permissions: role.permissions.map((rp: any) => rp.permission)
      };
      
      return res.json(roleFormatada);
    } catch (error) {
      console.error('Erro ao buscar role:', error);
      return res.status(500).json({ erro: 'Erro ao buscar role' });
    }
  }

  async criar(req: Request, res: Response) {
    const { nome, descricao, permissionIds } = req.body;
    
    try {
      // @ts-ignore - Ignorando erros de tipagem
      const novaRole = await prisma.role.create({
        data: {
          nome,
          descricao,
          deletedAt: null as any,
          ...(permissionIds && {
            permissions: {
              create: permissionIds.map((permissionId: number) => ({
                permission: { connect: { id: permissionId } },
                deletedAt: null as any
              }))
            }
          })
        },
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      });

      const roleFormatada = {
        ...novaRole,
        permissions: novaRole.permissions.map((rp: any) => rp.permission)
      };
      
      return res.status(201).json(roleFormatada);
    } catch (error) {
      console.error('Erro ao criar role:', error);
      return res.status(400).json({ erro: 'Não foi possível criar a role. Verifique se o nome já está em uso.' });
    }
  }

  async atualizar(req: Request, res: Response) {
    const { id } = req.params;
    const { nome, descricao, permissionIds } = req.body;
    
    try {
      // @ts-ignore - Ignorando erros de tipagem
      const roleExistente = await prisma.role.findFirst({
        where: { 
          id: Number(id),
          deletedAt: null
        } as any
      });

      if (!roleExistente) {
        return res.status(404).json({ erro: 'Role não encontrada ou já excluída' });
      }
      
      if (permissionIds) {
        // @ts-ignore - Ignorando erros de tipagem
        await prisma.rolePermission.updateMany({
          where: { 
            roleId: Number(id),
            deletedAt: null
          } as any,
          data: { deletedAt: new Date() } as any
        });
      }
      
      // @ts-ignore - Ignorando erros de tipagem
      const roleAtualizada = await prisma.role.update({
        where: { id: Number(id) },
        data: {
          ...(nome !== undefined && { nome }),
          ...(descricao !== undefined && { descricao }),
          ...(permissionIds && {
            permissions: {
              create: permissionIds.map((permissionId: number) => ({
                permission: { connect: { id: permissionId } },
                deletedAt: null as any
              }))
            }
          })
        },
        include: {
          permissions: {
            where: { deletedAt: null } as any,
            include: {
              permission: true
            }
          }
        }
      });
      
      const roleFormatada = {
        ...roleAtualizada,
        permissions: roleAtualizada.permissions.map((rp: any) => rp.permission)
      };
      
      return res.json(roleFormatada);
    } catch (error) {
      console.error('Erro ao atualizar role:', error);
      return res.status(400).json({ erro: 'Não foi possível atualizar a role' });
    }
  }

  async remover(req: Request, res: Response) {
    const { id } = req.params;
    
    try {
      // Aplicando soft delete
      // @ts-ignore - Ignorando erros de tipagem
      const resultado = await prisma.role.update({
        where: { id: Number(id) },
        data: { 
          deletedAt: new Date()
        } as any
      });
      
      if (!resultado) {
        return res.status(404).json({ erro: 'Role não encontrada ou já excluída' });
      }

      // Também marcar as relações como excluídas
      // @ts-ignore - Ignorando erros de tipagem
      await prisma.rolePermission.updateMany({
        where: { 
          roleId: Number(id),
          deletedAt: null
        } as any,
        data: { 
          deletedAt: new Date() 
        } as any
      });
      
      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao remover role:', error);
      return res.status(400).json({ erro: 'Não foi possível remover a role' });
    }
  }

  async adicionarPermissao(req: Request, res: Response) {
    const { id } = req.params;
    const { permissionId } = req.body;
    
    try {
      // @ts-ignore - Ignorando erros de tipagem
      const [roleExistente, permissionExistente] = await Promise.all([
        prisma.role.findFirst({
          where: { 
            id: Number(id),
            deletedAt: null
          } as any
        }),
        prisma.permission.findFirst({
          where: { 
            id: Number(permissionId),
            deletedAt: null
          } as any
        })
      ]);

      if (!roleExistente) {
        return res.status(404).json({ erro: 'Role não encontrada ou já excluída' });
      }

      if (!permissionExistente) {
        return res.status(404).json({ erro: 'Permissão não encontrada ou já excluída' });
      }

      // @ts-ignore - Ignorando erros de tipagem
      const rolePermissionExistente = await prisma.rolePermission.findFirst({
        where: { 
          roleId: Number(id),
          permissionId: Number(permissionId)
        } as any
      });

      if (rolePermissionExistente) {
        // @ts-ignore - Corrigindo a tipagem
        if (rolePermissionExistente.deletedAt) {
          // @ts-ignore - Ignorando erros de tipagem
          const relacaoRestaurada = await prisma.rolePermission.update({
            where: { id: rolePermissionExistente.id },
            data: { deletedAt: null } as any,
            include: {
              role: true,
              permission: true
            }
          });
          
          return res.status(200).json(relacaoRestaurada);
        } else {
          return res.status(400).json({ erro: 'Esta permissão já está associada à role' });
        }
      }
      
      // @ts-ignore - Ignorando erros de tipagem
      const rolePermission = await prisma.rolePermission.create({
        data: {
          roleId: Number(id),
          permissionId: Number(permissionId),
          deletedAt: null as any
        },
        include: {
          role: true,
          permission: true
        }
      });
      
      return res.status(201).json(rolePermission);
    } catch (error) {
      console.error('Erro ao adicionar permissão à role:', error);
      return res.status(400).json({ erro: 'Não foi possível adicionar a permissão à role' });
    }
  }

  async removerPermissao(req: Request, res: Response) {
    const { roleId, permissionId } = req.params;
    
    try {
      // @ts-ignore - Ignorando erros de tipagem
      const resultado = await prisma.rolePermission.updateMany({
        where: {
          roleId: Number(roleId),
          permissionId: Number(permissionId),
          deletedAt: null
        } as any,
        data: {
          deletedAt: new Date()
        } as any
      });
      
      if (resultado.count === 0) {
        return res.status(404).json({ erro: 'Relação entre role e permissão não encontrada ou já excluída' });
      }
      
      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao remover permissão da role:', error);
      return res.status(400).json({ erro: 'Não foi possível remover a permissão da role' });
    }
  }

  async listarExcluidas(req: Request, res: Response) {
    try {
      // @ts-ignore - Ignorando erros de tipagem
      const roles = await prisma.role.findMany({
        where: { 
          deletedAt: { not: null } 
        } as any,
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      });
      
      const rolesFormatadas = roles.map((role: any) => ({
        ...role,
        permissions: role.permissions.map((rp: any) => rp.permission)
      }));
      
      return res.json(rolesFormatadas);
    } catch (error) {
      console.error('Erro ao listar roles excluídas:', error);
      return res.status(500).json({ erro: 'Erro ao listar roles excluídas' });
    }
  }

  async restaurar(req: Request, res: Response) {
    const { id } = req.params;
    
    try {
      // @ts-ignore - Ignorando erros de tipagem
      const roleRestaurada = await prisma.role.update({
        where: { id: Number(id) },
        data: {
          deletedAt: null
        } as any
      });
      
      if (!roleRestaurada) {
        return res.status(404).json({ erro: 'Role não encontrada' });
      }
      
      // Também restaurar as relações
      // @ts-ignore - Ignorando erros de tipagem
      await prisma.rolePermission.updateMany({
        where: { 
          roleId: Number(id),
          deletedAt: { not: null }
        } as any,
        data: { 
          deletedAt: null 
        } as any
      });
      
      // Buscar dados completos após restauração
      // @ts-ignore - Ignorando erros de tipagem
      const roleCompleta = await prisma.role.findUnique({
        where: { id: Number(id) },
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      });
      
      const roleFormatada = {
        ...roleCompleta,
        permissions: roleCompleta?.permissions.map((rp: any) => rp.permission) || []
      };
      
      return res.json(roleFormatada);
    } catch (error) {
      console.error('Erro ao restaurar role:', error);
      return res.status(400).json({ erro: 'Não foi possível restaurar a role' });
    }
  }

  async excluirPermanentemente(req: Request, res: Response) {
    const { id } = req.params;
    
    try {
      // @ts-ignore - Ignorando erros de tipagem
      await prisma.role.delete({
        where: { id: Number(id) }
      });
      
      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir permanentemente role:', error);
      return res.status(400).json({ erro: 'Não foi possível excluir permanentemente a role' });
    }
  }
}

export default new RoleController();