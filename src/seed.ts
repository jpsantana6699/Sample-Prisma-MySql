import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const usuarios = await Promise.all([
      prisma.usuario.create({
        data: {
          nome: 'João Silva',
          email: 'joao.silva@exemplo.com',
        },
      }),
      prisma.usuario.create({
        data: {
          nome: 'Maria Oliveira',
          email: 'maria.oliveira@exemplo.com',
        },
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
    console.error('Erro ao criar usuários:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();