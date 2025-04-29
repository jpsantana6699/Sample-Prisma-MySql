import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const permissoes = await Promise.all([
      prisma.permission.create({
        data: {
          nome: 'usuario_listar',
          descricao: 'Permissão para listar usuários',
        },
      }),
      prisma.permission.create({
        data: {
          nome: 'usuario_criar',
          descricao: 'Permissão para criar usuários',
        },
      }),
      prisma.permission.create({
        data: {
          nome: 'usuario_editar',
          descricao: 'Permissão para editar usuários',
        },
      }),
      prisma.permission.create({
        data: {
          nome: 'usuario_excluir',
          descricao: 'Permissão para excluir usuários',
        },
      }),
      prisma.permission.create({
        data: {
          nome: 'role_gerenciar',
          descricao: 'Permissão para gerenciar roles',
        },
      }),
      prisma.permission.create({
        data: {
          nome: 'permission_gerenciar',
          descricao: 'Permissão para gerenciar permissões',
        },
      }),
    ]);

    console.log('Permissões criadas com sucesso:');
    console.log(permissoes);

    const adminRole = await prisma.role.create({
      data: {
        nome: 'admin',
        descricao: 'Administrador do sistema',
        permissions: {
          create: permissoes.map((permission: any) => ({
            permission: { connect: { id: permission.id } }
          }))
        }
      },
    });

    const usuarioRole = await prisma.role.create({
      data: {
        nome: 'usuario',
        descricao: 'Usuário comum',
        permissions: {
          create: [
            { permission: { connect: { nome: 'usuario_listar' } } }
          ]
        }
      },
    });

    console.log('Roles criadas com sucesso:');
    console.log({ adminRole, usuarioRole });

    const usuarios = await Promise.all([
      prisma.usuario.create({
        data: {
          nome: 'Admin',
          email: 'admin@exemplo.com',
          roleId: adminRole.id
        },
        include: {
          role: true
        }
      }),
      prisma.usuario.create({
        data: {
          nome: 'João Silva',
          email: 'joao.silva@exemplo.com',
          roleId: usuarioRole.id
        },
        include: {
          role: true
        }
      }),
      prisma.usuario.create({
        data: {
          nome: 'Maria Oliveira',
          email: 'maria.oliveira@exemplo.com',
          roleId: usuarioRole.id
        },
        include: {
          role: true
        }
      }),
      prisma.usuario.create({
        data: {
          nome: 'Pedro Santos',
          email: 'pedro.santos@exemplo.com',
        },
      }),
    ]);

    console.log('Usuários criados com sucesso:');
    console.log(usuarios);
  } catch (error) {
    console.error('Erro ao criar dados iniciais:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();