import express from 'express';
import { PrismaClient } from '@prisma/client';
import UsuarioController from './controllers/UsuarioController';
import RoleController from './controllers/RoleController';
import PermissionController from './controllers/PermissionController';

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.get('/usuarios', UsuarioController.listarTodos);
app.get('/usuarios/excluidos', UsuarioController.listarExcluidos);
app.get('/usuarios/:id', UsuarioController.obterPorId);
app.post('/usuarios', UsuarioController.criar);
app.put('/usuarios/:id', UsuarioController.atualizar);
app.delete('/usuarios/:id', UsuarioController.remover);
app.post('/usuarios/:id/restaurar', UsuarioController.restaurar);
app.delete('/usuarios/:id/permanente', UsuarioController.excluirPermanentemente);

app.get('/roles', RoleController.listarTodas);
app.get('/roles/excluidas', RoleController.listarExcluidas);
app.get('/roles/:id', RoleController.obterPorId);
app.post('/roles', RoleController.criar);
app.put('/roles/:id', RoleController.atualizar);
app.delete('/roles/:id', RoleController.remover);
app.post('/roles/:id/restaurar', RoleController.restaurar);
app.delete('/roles/:id/permanente', RoleController.excluirPermanentemente);
app.post('/roles/:id/permissions', RoleController.adicionarPermissao);
app.delete('/roles/:roleId/permissions/:permissionId', RoleController.removerPermissao);

app.get('/permissions', PermissionController.listarTodas);
app.get('/permissions/excluidas', PermissionController.listarExcluidas);
app.get('/permissions/:id', PermissionController.obterPorId);
app.post('/permissions', PermissionController.criar);
app.put('/permissions/:id', PermissionController.atualizar);
app.delete('/permissions/:id', PermissionController.remover);
app.post('/permissions/:id/restaurar', PermissionController.restaurar);
app.delete('/permissions/:id/permanente', PermissionController.excluirPermanentemente);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});