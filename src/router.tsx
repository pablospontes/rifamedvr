import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

// Definimos o tipo do contexto para o roteador saber o que esperar
export interface AuthSession {
  username: string;
  role: 'admin' | 'comum';
  status: 'pendente' | 'aprovado';
}

export const getRouter = (auth?: AuthSession | null) => {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    // Injeta o estado de autenticação em todas as rotas do app
    context: {
      auth: auth ?? null,
    },
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}