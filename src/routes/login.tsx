import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from './__root.tsx'
import { Lock, User } from 'lucide-react'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Limpa espaços invisíveis no início/fim e força o usuário para minúsculo
    const userLimpo = username.trim().toLowerCase()
    const senhaLimpa = password.trim()

    if (!userLimpo || !senhaLimpa) {
      setError("Preencha todos os campos.")
      return
    }

    if (isRegistering) {
      setSuccess("Cadastro solicitado! Aguarde a aprovação do Administrador.")
      setUsername('')
      setPassword('')
      setTimeout(() => setIsRegistering(false), 3000)
    } else {
      // Regra de Login do Admin (Agora blindada contra espaços acidentais)
      if (userLimpo === 'pablospontes' && senhaLimpa === 'Pablo1993*') {
        login({ username: 'pablospontes', role: 'admin', status: 'aprovado' })
        router.navigate({ to: '/' })
      } 
      // Mock de Login de Usuário Comum para testes
      else if (userLimpo === 'usuariomed123' && senhaLimpa === '123') {
         login({ username: 'usuariomed123', role: 'comum', status: 'aprovado' })
         router.navigate({ to: '/' })
      } 
      // Se não for nenhum dos dois, dá o erro
      else {
         setError("Credenciais inválidas ou usuário ainda pendente de aprovação.")
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isRegistering ? 'Criar Conta' : 'Acesso ao Sistema'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isRegistering ? 'Solicite acesso para gerenciar as vendas.' : 'Entre com suas credenciais de administrador ou vendedor.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200">{error}</div>}
          {success && <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-sm border border-emerald-200">{success}</div>}

          <div>
            <label className="text-sm font-bold text-gray-700 block mb-1">Usuário:</label>
            <div className="relative">
              <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: usuariomed123"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700 block mb-1">Senha:</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg mt-2 transition cursor-pointer"
          >
            {isRegistering ? 'Solicitar Cadastro' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering)
              setError('')
              setSuccess('')
            }}
            className="text-sm text-blue-600 hover:underline font-semibold cursor-pointer"
          >
            {isRegistering ? 'Já possui uma conta? Faça Login' : 'Não tem conta? Solicite um cadastro'}
          </button>
        </div>

      </div>
    </div>
  )
}