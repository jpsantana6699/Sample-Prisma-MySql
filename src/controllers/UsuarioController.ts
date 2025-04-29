import { Request, Response } from 'express';
import prisma, { softDeleteManager } from '../prismaClient';
import { Prisma } from '@prisma/client';
import FilterProcessor from '../utils/FilterProcessor';

class UsuarioController {
  async listarTodos(req: Request, res: Response) {
    try {
      // Usando o FilterProcessor para processar os parâmetros de consulta
      const queryOptions = FilterProcessor.fromQueryParams(req.query);
      const query = FilterProcessor.processQuery(queryOptions);

      // Inclusão de relacionamentos
      query.include = {
        role: true
      };

      // @ts-ignore - Ignorando erros de tipagem
      const usuarios = await prisma.usuario.findMany(query);
      return res.json(usuarios);
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      return res.status(500).json({ erro: 'Erro ao listar usuários' });
    }
  }

  async obterPorId(req: Request, res: Response) {
    const { id } = req.params;
    
    try {
      // @ts-ignore - Ignorando erros de tipagem
      const usuario = await prisma.usuario.findFirst({
        where: { 
          id: Number(id),
          ...softDeleteManager.excludeDeleted()
        },
        include: {
          role: true
        }
      });
      
      if (!usuario) {
        return res.status(404).json({ erro: 'Usuário não encontrado' });
      }
      
      return res.json(usuario);
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return res.status(500).json({ erro: 'Erro ao buscar usuário' });
    }
  }

  async criar(req: Request, res: Response) {
    const { nome, email, ativo, roleId } = req.body;
    
    try {
      // @ts-ignore - Ignorando erros de tipagem
      const novoUsuario = await prisma.usuario.create({
        data: {
          nome,
          email,
          ativo: ativo !== undefined ? ativo : true,
          roleId: roleId ? Number(roleId) : undefined,
          deletedAt: null
        },
        include: {
          role: true
        }
      });
      
      return res.status(201).json(novoUsuario);
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      return res.status(400).json({ erro: 'Não foi possível criar o usuário. Verifique se o email já está em uso.' });
    }
  }

  async atualizar(req: Request, res: Response) {
    const { id } = req.params;
    const { nome, email, ativo, roleId } = req.body;
    
    try {
      // @ts-ignore - Ignorando erros de tipagem
      const usuarioExistente = await prisma.usuario.findFirst({
        where: { 
          id: Number(id),
          ...softDeleteManager.excludeDeleted()
        }
      });

      if (!usuarioExistente) {
        return res.status(404).json({ erro: 'Usuário não encontrado ou já excluído' });
      }

      // @ts-ignore - Ignorando erros de tipagem
      const usuarioAtualizado = await prisma.usuario.update({
        where: { id: Number(id) },
        data: {
          ...(nome !== undefined && { nome }),
          ...(email !== undefined && { email }),
          ...(ativo !== undefined && { ativo }),
          ...(roleId !== undefined && { roleId: roleId ? Number(roleId) : null })
        },
        include: {
          role: true
        }
      });
      
      return res.json(usuarioAtualizado);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return res.status(400).json({ erro: 'Não foi possível atualizar o usuário' });
    }
  }

  async remover(req: Request, res: Response) {
    const { id } = req.params;
    
    try {
      // Aplicando soft delete
      // @ts-ignore - Ignorando erros de tipagem
      const resultado = await prisma.usuario.softDelete({ id: Number(id) });
      
      if (!resultado) {
        return res.status(404).json({ erro: 'Usuário não encontrado ou já excluído' });
      }
      
      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao remover usuário:', error);
      return res.status(400).json({ erro: 'Não foi possível remover o usuário' });
    }
  }

  async listarExcluidos(req: Request, res: Response) {
    try {
      // @ts-ignore - Ignorando erros de tipagem
      const usuariosExcluidos = await prisma.usuario.findMany({
        where: softDeleteManager.onlyDeleted(),
        include: {
          role: true
        }
      });
      
      return res.json(usuariosExcluidos);
    } catch (error) {
      console.error('Erro ao listar usuários excluídos:', error);
      return res.status(500).json({ erro: 'Erro ao listar usuários excluídos' });
    }
  }

  async restaurar(req: Request, res: Response) {
    const { id } = req.params;
    
    try {
      // @ts-ignore - Ignorando erros de tipagem
      const usuarioRestaurado = await prisma.usuario.restore({ id: Number(id) });
      
      if (!usuarioRestaurado) {
        return res.status(404).json({ erro: 'Usuário não encontrado ou não está excluído' });
      }
      
      // Buscar dados completos após restauração
      // @ts-ignore - Ignorando erros de tipagem
      const usuarioCompleto = await prisma.usuario.findUnique({
        where: { id: Number(id) },
        include: {
          role: true
        }
      });
      
      return res.json(usuarioCompleto);
    } catch (error) {
      console.error('Erro ao restaurar usuário:', error);
      return res.status(400).json({ erro: 'Não foi possível restaurar o usuário' });
    }
  }

  async excluirPermanentemente(req: Request, res: Response) {
    const { id } = req.params;
    
    try {
      // @ts-ignore - Ignorando erros de tipagem
      await prisma.usuario.delete({
        where: { id: Number(id) }
      });
      
      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir permanentemente usuário:', error);
      return res.status(400).json({ erro: 'Não foi possível excluir permanentemente o usuário' });
    }
  }
}

export default new UsuarioController();