import express from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.get('/usuarios', async (req, res) => {
  const usuarios = await prisma.usuario.findMany();
  res.json(usuarios);
});

app.post('/usuarios', async (req, res) => {
  const { nome, email } = req.body;
  
  try {
    const novoUsuario = await prisma.usuario.create({
      data: {
        nome,
        email
      }
    });
    
    res.status(201).json(novoUsuario);
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(400).json({ erro: 'Não foi possível criar o usuário.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});