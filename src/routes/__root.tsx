import { HeadContent, Scripts, createRootRoute, Outlet, Link } from '@tanstack/react-router'
import { createContext, useContext, useState, useEffect } from 'react'
import '../styles.css'

// === 1. CRIANDO O CONTEXTO DE AUTENTICAÇÃO ===
export type UserSession = {
  username: string;
  role: 'admin' | 'comum';
  status: 'pendente' | 'aprovado';
}

type AuthContextType = {
  user: UserSession | null;
  login: (user: UserSession) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth deve ser usado dentro de um AuthProvider")
  return context
}

// === 2. PROVEDOR QUE ENVOLVE A APLICAÇÃO ===
function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null)

  // Ao abrir o site, verifica se o usuário já tinha feito login antes
  useEffect(() => {
    const savedUser = localStorage.getItem('rifa_user_session')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const login = (userData: UserSession) => {
    setUser(userData)
    localStorage.setItem('rifa_user_session', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('rifa_user_session')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// === 3. CONFIGURAÇÃO DA ROTA RAIZ ===
export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Painel da Rifa - MEDVR' },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        <AuthProvider>
          <AuthHeader />
          <Outlet /> {/* Renderiza as páginas filhas (index, login, etc) */}
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  )
}

// === 4. BARRA DE TOPO (HEADER) PARA EXIBIR LOGIN ===
function AuthHeader() {
  const { user, logout } = useAuth()

  return (
    <div className="bg-gray-900 text-white text-xs px-4 py-2 flex justify-between items-center">
      <div>
        {user ? (
          <span className="flex items-center gap-2">
            Logado como: <strong>{user.username}</strong>
            <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase ${user.role === 'admin' ? 'bg-purple-600' : 'bg-blue-600'}`}>
              {user.role}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase ${user.status === 'aprovado' ? 'bg-emerald-600' : 'bg-amber-600'}`}>
              {user.status}
            </span>
          </span>
        ) : (
          <span>Você não está logado. Modo de visualização apenas.</span>
        )}
      </div>
      <div>
        {user ? (
          <button onClick={logout} className="hover:text-red-400 font-bold transition">Sair</button>
        ) : (
          <Link to="/login" className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded font-bold transition">
            Fazer Login
          </Link>
        )}
      </div>
    </div>
  )
}