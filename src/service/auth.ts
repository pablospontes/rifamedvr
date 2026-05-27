import { createServerFn } from '@tanstack/react-start'
import { db } from '../db' // Importe a sua instância conectada do Drizzle
import { usuarios } from '../schema'
import { eq, and } from 'drizzle-orm'

// Função auxiliar para simular sessão via cookies ou validação simples no servidor
// Para fins de produção, considere injetar um JWT ou cookie de sessão aqui.

export const loginAction = createServerFn({ method: 'POST' })
  .validator((data: { username: string; passwordHash: string }) => data)
  .handler(async ({ data }) => {
    // 1. Verificação Hardcoded para o seu Admin Inicial de controle total
    if (data.username === 'pablospontes' && data.passwordHash === 'Pablo1993*') {
      return { success: true, user: { username: 'pablospontes', role: 'admin', status: 'aprovado' } }
    }

    // 2. Busca no banco por usuários comuns ou admins cadastrados
    const userRecords = await db.select().from(usuarios).where(eq(usuarios.username, data.username))
    const user = userRecords[0]

    if (!user) {
      throw new Error('Usuário não encontrado.')
    }

    // Verificação simples de senha (recomenda-se bcrypt em produção estável)
    if (user.passwordHash !== data.passwordHash) {
      throw new Error('Senha incorreta.')
    }

    // Bloqueia o login se o Admin ainda não tiver aprovado
    if (user.status === 'pendente') {
      throw new Error('Seu cadastro ainda está pendente de aprovação pelo Administrador.')
    }

    return {
      success: true,
      user: { username: user.username, role: user.role, status: user.status }
    }
  })

export const registerAction = createServerFn({ method: 'POST' })
  .validator((data: { username: string; passwordHash: string }) => data)
  .handler(async ({ data }) => {
    // Cadastro padrão entra sempre como 'comum' e 'pendente'
    try {
      await db.insert(usuarios).values({
        id: crypto.randomUUID(),
        username: data.username,
        passwordHash: data.passwordHash,
        role: 'comum',
        status: 'pendente' 
      })
      return { success: true, message: 'Cadastro realizado! Aguarde a aprovação do Admin.' }
    } catch (error) {
      throw new Error('Nome de usuário já existe.')
    }
  })

// Função para o Admin aprovar usuários novos
export const approveUserAction = createServerFn({ method: 'POST' })
  .validator((data: { adminUsername: string; targetUserId: string }) => data)
  .handler(async ({ data }) => {
    // Garante que só o admin pode disparar essa função
    if (data.adminUsername !== 'pablospontes') {
      throw new Error('Operação não autorizada.')
    }

    await db.update(usuarios)
      .set({ status: 'aprovado' })
      .where(eq(usuarios.id, data.targetUserId))

    return { success: true }
  })