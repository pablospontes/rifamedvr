import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { 
  Trophy, Trash2, Settings, FileDown, FileUp, Search, Check, X, 
  DollarSign, Users, Ticket, Percent, Calendar, Phone, Grid, List, 
  RefreshCw, AlertCircle, Lock, UserCheck, UserX
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { 
  getRaffleData, updateTicket, clearTicket, updateConfig, importTickets 
} from '../server/rifas'
import { useAuth } from './__root.tsx'

export const Route = createFileRoute('/')({
  loader: async () => {
    return await getRaffleData()
  },
  component: Home,
})

function Home() {
  const { rifas: initialRifas, config: initialConfig } = Route.useLoaderData()
  const router = useRouter()
  
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const isAprovado = user?.status === 'aprovado'

  // ---> Adicionado 'users' nas opções de abas
  const [activeTab, setActiveTab] = useState<'sell' | 'config' | 'excel' | 'clear' | 'users'>('sell')
  
  const [searchTerm, setSearchFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'sold' | 'available'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const [sellNumber, setSellNumber] = useState('')
  const [sellName, setSellName] = useState('')
  const [sellPhone, setSellPhone] = useState('')
  const [sellStudent, setSellStudent] = useState('')

  const [cfgTitle, setCfgTitle] = useState(initialConfig.titulo)
  const [cfgPremio1, setCfgPremio1] = useState(initialConfig.premio1)
  const [cfgPremio2, setCfgPremio2] = useState(initialConfig.premio2)
  const [cfgPremio3, setCfgPremio3] = useState(initialConfig.premio3)
  const [cfgDate, setCfgDate] = useState(initialConfig.dataSorteio)
  const [cfgPrice, setCfgPrice] = useState(initialConfig.valorRifa)
  const [cfgInfo, setCfgInfo] = useState(initialConfig.informacoes)

  const [clearNumber, setClearNumber] = useState('')

  useEffect(() => {
    setCfgTitle(initialConfig.titulo)
    setCfgPremio1(initialConfig.premio1)
    setCfgPremio2(initialConfig.premio2)
    setCfgPremio3(initialConfig.premio3)
    setCfgDate(initialConfig.dataSorteio)
    setCfgPrice(initialConfig.valorRifa)
    setCfgInfo(initialConfig.informacoes)
  }, [initialConfig])

  const totalTickets = initialRifas.length
  const soldTicketsList = initialRifas.filter(r => r.nome.trim() !== '')
  const totalSold = soldTicketsList.length
  const totalAvailable = totalTickets - totalSold
  const percentSold = ((totalSold / totalTickets) * 100).toFixed(1)
  const ticketPriceNum = parseFloat(initialConfig.valorRifa) || 0
  const totalRevenue = (totalSold * ticketPriceNum).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const targetGoal = (totalTickets * ticketPriceNum).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const studentSales: { [key: string]: number } = {}
  soldTicketsList.forEach(r => {
    if (r.aluno && r.aluno.trim() !== '') {
      const studentName = r.aluno.trim().toUpperCase()
      studentSales[studentName] = (studentSales[studentName] || 0) + 1
    }
  })
  const ranking = Object.keys(studentSales).map(name => ({ name, count: studentSales[name] })).sort((a, b) => b.count - a.count)

  const filteredRifas = initialRifas.filter(r => {
    const isSold = r.nome.trim() !== ''
    if (statusFilter === 'sold' && !isSold) return false
    if (statusFilter === 'available' && isSold) return false
    if (searchTerm.trim() !== '') {
      const query = searchTerm.toLowerCase()
      return (
        r.numero.toString().includes(query) ||
        r.nome.toLowerCase().includes(query) ||
        r.telefone.toLowerCase().includes(query) ||
        r.aluno.toLowerCase().includes(query)
      )
    }
    return true
  })

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleRegisterSale = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !isAprovado) {
      showMessage('error', 'Apenas usuários logados e com cadastro aprovado podem registrar vendas.')
      return
    }

    const num = parseInt(sellNumber)
    if (isNaN(num) || num < 1 || num > 400) {
      showMessage('error', 'Por favor, informe um número de rifa válido (1 a 400).')
      return
    }
    if (!sellName.trim()) {
      showMessage('error', 'O nome do comprador é obrigatório.')
      return
    }

    setIsSubmitting(true)
    try {
      const existing = initialRifas.find(r => r.numero === num)
      if (existing && existing.nome.trim() !== '') {
        const confirmOverwrite = window.confirm(`Atenção: A rifa Nº ${num} já está vendida para "${existing.nome}". Deseja sobrescrever os dados?`)
        if (!confirmOverwrite) {
          setIsSubmitting(false)
          return
        }
      }

      await updateTicket({
        data: { numero: num, nome: sellName.trim(), telefone: sellPhone.trim(), aluno: sellStudent.trim() }
      })

      setSellNumber('')
      setSellName('')
      setSellPhone('')
      setSellStudent('')
      showMessage('success', `Rifa Nº ${num} registrada com sucesso!`)
      await router.invalidate()
    } catch (error) {
      showMessage('error', 'Ocorreu um erro ao salvar os dados.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClearTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin) {
      showMessage('error', 'Apenas administradores podem limpar dados de rifas.')
      return
    }

    const num = parseInt(clearNumber)
    if (isNaN(num) || num < 1 || num > 400) {
      showMessage('error', 'Por favor, informe um número válido (1 a 400).')
      return
    }

    const existing = initialRifas.find(r => r.numero === num)
    if (!existing || existing.nome.trim() === '') {
      showMessage('error', `A rifa Nº ${num} já está vazia.`)
      return
    }

    const confirmClear = window.confirm(`Tem certeza que deseja apagar todos os dados da rifa Nº ${num}?`)
    if (!confirmClear) return

    setIsSubmitting(true)
    try {
      await clearTicket({ data: { numero: num } })
      setClearNumber('')
      showMessage('success', `Dados da Rifa Nº ${num} apagados com sucesso!`)
      await router.invalidate()
    } catch (error) {
      showMessage('error', 'Ocorreu um erro ao limpar os dados.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin) {
      showMessage('error', 'Apenas administradores podem alterar configurações.')
      return
    }
    if (!cfgTitle.trim()) {
      showMessage('error', 'O título da rifa não pode ficar vazio.')
      return
    }

    setIsSubmitting(true)
    try {
      await updateConfig({
        data: {
          titulo: cfgTitle.trim(),
          premio1: cfgPremio1.trim(),
          premio2: cfgPremio2.trim(),
          premio3: cfgPremio3.trim(),
          dataSorteio: cfgDate.trim(),
          valorRifa: cfgPrice.trim(),
          informacoes: cfgInfo.trim(),
        }
      })
      showMessage('success', 'Configurações atualizadas com sucesso!')
      await router.invalidate()
    } catch (error) {
      showMessage('error', 'Ocorreu um erro ao salvar as configurações.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) {
      showMessage('error', 'Apenas administradores podem importar planilhas.')
      return
    }
    const file = e.target.files?.[0]
    if (!file) return

    setIsSubmitting(true)
    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        
        const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][]
        const parsedTickets: Array<{ numero: number; nome: string; telefone: string; aluno: string }> = []

        let startRowIndex = 0
        let colNum = 1
        let colNome = 2
        let colTel = 6
        let colAluno = 9

        for (let i = 0; i < Math.min(30, rawRows.length); i++) {
          const row = rawRows[i]
          if (!row) continue
          const rowStr = row.map(v => String(v || '').toLowerCase())
          
          const indexNum = rowStr.findIndex(v => v.includes('rifa n') || v.includes('nº') || v.includes('numero') || v.includes('número'))
          const indexNome = rowStr.findIndex(v => v.includes('nome') || v.includes('comprador'))
          const indexTel = rowStr.findIndex(v => v.includes('telefone') || v.includes('celular') || v.includes('contato'))
          const indexAluno = rowStr.findIndex(v => v.includes('aluno') || v.includes('vendedor'))

          if (indexNum !== -1 && indexNome !== -1) {
            colNum = indexNum
            colNome = indexNome
            if (indexTel !== -1) colTel = indexTel
            if (indexAluno !== -1) colAluno = indexAluno
            startRowIndex = i + 1
            break
          }
        }

        if (startRowIndex === 0) {
          startRowIndex = 11
          colNum = 1
          colNome = 2
          colTel = 6
          colAluno = 9
        }

        for (let r = startRowIndex; r < rawRows.length; r++) {
          const row = rawRows[r]
          if (!row) continue
          const numVal = parseInt(row[colNum])
          if (!isNaN(numVal) && numVal >= 1 && numVal <= 400) {
            const nome = String(row[colNome] || '').trim()
            const telefone = row[colTel] ? String(row[colTel]).trim() : ''
            const aluno = row[colAluno] ? String(row[colAluno]).trim() : ''
            parsedTickets.push({ numero: numVal, nome, telefone, aluno })
          }
        }

        if (parsedTickets.length === 0) {
          showMessage('error', 'Nenhum dado válido foi encontrado.')
          setIsSubmitting(false)
          return
        }

        const confirmImport = window.confirm(`Encontradas ${parsedTickets.length} rifas no Excel. Deseja importá-las?`)
        if (!confirmImport) {
          setIsSubmitting(false)
          return
        }

        await importTickets({ data: { tickets: parsedTickets } })
        showMessage('success', `Importação concluída! ${parsedTickets.length} rifas atualizadas.`)
        await router.invalidate()
      } catch (err) {
        showMessage('error', 'Erro ao ler o arquivo Excel.')
      } finally {
        setIsSubmitting(false)
        if (e.target) e.target.value = '' 
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleExcelExport = () => {
    try {
      const wb = XLSX.utils.book_new()
      const data: any[][] = [
        [],
        [null, null, null, null, initialConfig.titulo.toUpperCase(), null, null, null, null],
        [],
        [],
        [null, null, null, null, `Prêmios:\n1º Sorteio - ${initialConfig.premio1 || 'A Definir'}\n2º Sorteio - ${initialConfig.premio2 || 'A Definir'}\n3º Sorteio - ${initialConfig.premio3 || 'A Definir'}`, null, null, null, `Sorteio: ${initialConfig.dataSorteio || 'A Definir'}\nValor da Rifa: R$ ${initialConfig.valorRifa}\n\nInformações:\n${initialConfig.informacoes || ''}`],
        [],
        [null, null, null, null, null, null, null, null, null, null, null, null, null, 'Limpar dados'],
        [null, null, null, null, null, null, null, null, null, null, null, null, null, 'RIFA Nº'],
        [],
        [],
        [null, 'RIFA Nº', 'Nome', null, null, null, 'Telefone', null, null, 'Aluno que vendeu', null, null, null, null]
      ]

      initialRifas.forEach(r => {
        data.push([null, r.numero, r.nome || null, null, null, null, r.telefone || null, null, null, r.aluno || null, null, null, null, null])
      })

      const ws = XLSX.utils.aoa_to_sheet(data)
      ws['!cols'] = [ { wch: 3 }, { wch: 10 }, { wch: 25 }, { wch: 3 }, { wch: 3 }, { wch: 3 }, { wch: 20 }, { wch: 3 }, { wch: 3 }, { wch: 25 }]

      XLSX.utils.book_append_sheet(wb, ws, "Planilha1")
      XLSX.writeFile(wb, `${initialConfig.titulo.replace(/\s+/g, '_')}.xlsx`)
      showMessage('success', 'Excel exportado com sucesso!')
    } catch (err) {
      showMessage('error', 'Erro ao exportar arquivo Excel.')
    }
  }

  const handleGridItemClick = (num: number) => {
    const existing = initialRifas.find(r => r.numero === num)
    setSellNumber(num.toString())
    if (existing) {
      setSellName(existing.nome)
      setSellPhone(existing.telefone)
      setSellStudent(existing.aluno)
    }
    setActiveTab('sell')
    const formEl = document.getElementById('control-panel-heading')
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-6 h-6 text-yellow-300" />
                <span className="text-xs font-semibold bg-blue-900/40 text-yellow-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Sistema Integrado
                </span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">{initialConfig.titulo}</h1>
              <p className="text-sm text-blue-100 mt-1 max-w-2xl">
                Controle digital de rifas com sincronização em tempo real.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  setIsSubmitting(true)
                  await router.invalidate()
                  setIsSubmitting(false)
                  showMessage('success', 'Dados atualizados!')
                }}
                className="bg-white/10 hover:bg-white/20 active:bg-white/30 text-white p-2.5 rounded-lg transition border border-white/10 cursor-pointer"
                disabled={isSubmitting}
              >
                <RefreshCw className={`w-5 h-5 ${isSubmitting ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleExcelExport}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-lg font-semibold flex items-center gap-2 shadow-sm transition cursor-pointer"
              >
                <FileDown className="w-5 h-5" />
                <span>Exportar Excel</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-xl text-blue-600"><Ticket className="w-6 h-6" /></div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Rifas Vendidas</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{totalSold} / {totalTickets}</p>
              <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: `${percentSold}%` }}></div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center gap-4">
            <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600"><Percent className="w-6 h-6" /></div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">% Vendida</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{percentSold}%</p>
              <p className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5 mt-1">
                <span>{totalAvailable} disponíveis</span>
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center gap-4">
            <div className="bg-amber-100 p-3 rounded-xl text-amber-600"><DollarSign className="w-6 h-6" /></div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Arrecadado</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{totalRevenue}</p>
              <p className="text-xs text-gray-500 mt-1">Meta total: {targetGoal}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center gap-4">
            <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600"><Calendar className="w-6 h-6" /></div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Data do Sorteio</p>
              <p className="text-lg font-bold text-gray-900 mt-0.5 truncate">{initialConfig.dataSorteio || 'A Definir'}</p>
              <p className="text-xs text-gray-500 truncate mt-1">Preço: R$ {initialConfig.valorRifa} / cada</p>
            </div>
          </div>
        </section>

        {message && (
          <div className={`p-4 rounded-xl mb-6 shadow-sm flex items-center gap-3 border ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}>
            {message.type === 'success' ? <Check className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
            <span className="font-semibold text-sm">{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-100 px-5 py-4" id="control-panel-heading">
                <h3 className="text-lg font-bold text-gray-900">Painel de Operações</h3>
                <p className="text-xs text-gray-500 mt-0.5">Gerencie os registros e as configurações da sua rifa.</p>
              </div>

              {/* TABS MENU */}
              <div className="flex flex-wrap border-b border-gray-100 bg-gray-50/50 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('sell')}
                  className={`flex-1 py-3 text-center border-b-2 transition ${activeTab === 'sell' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:bg-gray-100'}`}
                >
                  Reg./Vender
                </button>

                <button
                  onClick={() => isAdmin && setActiveTab('config')}
                  disabled={!isAdmin}
                  className={`flex-1 flex items-center justify-center gap-1 py-3 text-center border-b-2 transition ${!isAdmin ? 'opacity-40 cursor-not-allowed bg-gray-200' : activeTab === 'config' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:bg-gray-100'}`}
                >
                  {!isAdmin && <Lock className="w-3 h-3" />} Ajustes
                </button>

                {/* NOVO BOTÃO: USUÁRIOS */}
                <button
                  onClick={() => isAdmin && setActiveTab('users')}
                  disabled={!isAdmin}
                  className={`flex-1 flex items-center justify-center gap-1 py-3 text-center border-b-2 transition ${!isAdmin ? 'hidden' : activeTab === 'users' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:bg-gray-100'}`}
                >
                  <Users className="w-3 h-3" /> Usuários
                </button>

                <button
                  onClick={() => isAdmin && setActiveTab('clear')}
                  disabled={!isAdmin}
                  className={`flex-1 flex items-center justify-center gap-1 py-3 text-center border-b-2 transition ${!isAdmin ? 'opacity-40 cursor-not-allowed bg-gray-200' : activeTab === 'clear' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:bg-gray-100'}`}
                >
                  {!isAdmin && <Lock className="w-3 h-3" />} Limpar
                </button>
              </div>

              <div className="p-5">
                
                {/* 1. ABA REGISTRAR VENDA */}
                {activeTab === 'sell' && (
                  <form onSubmit={handleRegisterSale} className="flex flex-col gap-4">
                    <h4 className="text-sm font-bold text-gray-700 flex items-center gap-1">
                      <Ticket className="w-4 h-4 text-blue-600" /> Inserir Dados da Rifa
                    </h4>
                    {!isAprovado && (
                      <div className="bg-yellow-50 text-yellow-800 p-2 text-[10px] rounded border border-yellow-200">
                        Seu usuário precisa ser aprovado pelo Administrador para realizar vendas.
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-gray-600">Nº da Rifa (1 a 400):</label>
                      <input type="number" min="1" max="400" value={sellNumber} onChange={(e) => setSellNumber(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" disabled={isSubmitting || !isAprovado} required />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-gray-600">Nome do Comprador:</label>
                      <input type="text" value={sellName} onChange={(e) => setSellName(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" disabled={isSubmitting || !isAprovado} required />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-gray-600">Telefone:</label>
                      <input type="text" value={sellPhone} onChange={(e) => setSellPhone(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" disabled={isSubmitting || !isAprovado} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-gray-600">Aluno que vendeu:</label>
                      <input type="text" value={sellStudent} onChange={(e) => setSellStudent(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" disabled={isSubmitting || !isAprovado} />
                    </div>
                    <button type="submit" disabled={isSubmitting || !isAprovado} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-lg text-sm transition disabled:opacity-50 mt-1 cursor-pointer">
                      {isSubmitting ? 'Salvando...' : 'INSERIR DADOS'}
                    </button>
                  </form>
                )}

                {/* 2. ABA CONFIGURAÇÕES */}
                {activeTab === 'config' && isAdmin && (
                  <form onSubmit={handleSaveConfig} className="flex flex-col gap-4">
                    <h4 className="text-sm font-bold text-gray-700 flex items-center gap-1">
                      <Settings className="w-4 h-4 text-blue-600" /> Ajustes Gerais da Rifa
                    </h4>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-gray-600">Título do Controle:</label>
                      <input type="text" value={cfgTitle} onChange={(e) => setCfgTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" disabled={isSubmitting} required />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-gray-600">Valor da Rifa (R$):</label>
                      <input type="text" value={cfgPrice} onChange={(e) => setCfgPrice(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" disabled={isSubmitting} required />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-gray-600">Data do Sorteio:</label>
                      <input type="text" value={cfgDate} onChange={(e) => setCfgDate(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" disabled={isSubmitting} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-gray-600">1º Prêmio:</label>
                      <input type="text" value={cfgPremio1} onChange={(e) => setCfgPremio1(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" disabled={isSubmitting} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-gray-600">2º Prêmio:</label>
                      <input type="text" value={cfgPremio2} onChange={(e) => setCfgPremio2(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" disabled={isSubmitting} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-gray-600">3º Prêmio:</label>
                      <input type="text" value={cfgPremio3} onChange={(e) => setCfgPremio3(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" disabled={isSubmitting} />
                    </div>
                    <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-lg text-sm transition disabled:opacity-50 cursor-pointer">
                      SALVAR CONFIGURAÇÃO
                    </button>
                  </form>
                )}

                {/* 3. NOVA ABA: APROVAR USUÁRIOS */}
                {activeTab === 'users' && isAdmin && (
                  <div className="flex flex-col gap-4">
                    <h4 className="text-sm font-bold text-gray-700 flex items-center gap-1">
                      <Users className="w-4 h-4 text-blue-600" /> Aprovar Usuários
                    </h4>
                    <p className="text-xs text-gray-500">
                      Gerencie quem pode registrar vendas no sistema. Somente usuários "Aprovados" podem editar dados.
                    </p>

                    <div className="border border-gray-200 rounded-lg overflow-hidden mt-2">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                          <tr>
                            <th className="px-3 py-2">Usuário</th>
                            <th className="px-3 py-2 text-center">Status</th>
                            <th className="px-3 py-2 text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {/* Mock Visual 1: Usuário Pendente */}
                          <tr className="hover:bg-gray-50 transition">
                            <td className="px-3 py-3 font-semibold text-gray-800">usuariomed123</td>
                            <td className="px-3 py-3 text-center">
                              <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">Pendente</span>
                            </td>
                            <td className="px-3 py-3 text-right">
                              <button 
                                onClick={() => showMessage('success', 'Usuário usuariomed123 aprovado com sucesso!')}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded shadow-sm flex items-center gap-1 ml-auto cursor-pointer"
                              >
                                <UserCheck className="w-3 h-3" /> Aprovar
                              </button>
                            </td>
                          </tr>
                          {/* Mock Visual 2: Usuário já aprovado */}
                          <tr className="hover:bg-gray-50 transition">
                            <td className="px-3 py-3 font-semibold text-gray-800">pedro_vendas</td>
                            <td className="px-3 py-3 text-center">
                              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">Aprovado</span>
                            </td>
                            <td className="px-3 py-3 text-right">
                              <button 
                                onClick={() => showMessage('error', 'Acesso de pedro_vendas revogado.')}
                                className="text-rose-600 hover:text-rose-500 flex items-center gap-1 ml-auto cursor-pointer"
                              >
                                <UserX className="w-3 h-3" /> Revogar
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 4. ABA DE LIMPEZA */}
                {activeTab === 'clear' && isAdmin && (
                  <form onSubmit={handleClearTicket} className="flex flex-col gap-4">
                    <h4 className="text-sm font-bold text-gray-700 flex items-center gap-1">
                      <Trash2 className="w-4 h-4 text-rose-600" /> Limpar/Apagar Dados
                    </h4>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-gray-600">Nº da Rifa para Limpar (1 a 400):</label>
                      <input type="number" min="1" max="400" value={clearNumber} onChange={(e) => setClearNumber(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" disabled={isSubmitting} required />
                    </div>
                    <button type="submit" disabled={isSubmitting} className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 px-4 rounded-lg text-sm transition disabled:opacity-50 cursor-pointer">
                      LIMPAR DADOS DA RIFA
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Ranking de Vendas */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-100 px-5 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-1.5"><Trophy className="w-4.5 h-4.5 text-yellow-500" /> Ranking de Vendas</h3>
                </div>
                <span className="text-[10px] font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded-full uppercase">Meta: 5</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {ranking.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-400 font-medium">Nenhuma venda registrada com aluno ainda.</div>
                ) : (
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase border-b border-gray-100">
                        <th className="px-5 py-2.5">Aluno</th><th className="px-5 py-2.5 text-center">Rifas</th><th className="px-5 py-2.5 text-right">Meta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {ranking.map((item, index) => {
                        const hasReachedGoal = item.count >= 5
                        return (
                          <tr key={item.name} className={`transition hover:bg-gray-50/40 ${hasReachedGoal ? 'bg-green-50/20' : 'bg-gray-50/10'}`}>
                            <td className="px-5 py-3 font-semibold text-gray-800 flex items-center gap-2">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-500'}`}>{index + 1}</span>
                              <span className="truncate max-w-[150px]">{item.name}</span>
                            </td>
                            <td className="px-5 py-3 font-bold text-center text-gray-900">{item.count}</td>
                            <td className="px-5 py-3 text-right">
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${hasReachedGoal ? 'bg-green-100 text-green-800' : 'bg-rose-50 text-rose-600'}`}>{hasReachedGoal ? 'Atingida' : 'Pendente'}</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Coluna Direita (Tabela/Grid) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1 max-w-md relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" placeholder="Pesquisar..." value={searchTerm} onChange={(e) => setSearchFilter(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold bg-white">
                  <option value="all">Todas as Rifas</option><option value="sold">Vendidas</option><option value="available">Disponíveis</option>
                </select>
                <div className="bg-gray-100 p-1 rounded-lg flex items-center">
                  <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition cursor-pointer ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-400'}`}><Grid className="w-4.5 h-4.5" /></button>
                  <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md transition cursor-pointer ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-400'}`}><List className="w-4.5 h-4.5" /></button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
              {viewMode === 'grid' && (
                <div className="p-6">
                  <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
                    {filteredRifas.map(rifa => {
                      const isSold = rifa.nome.trim() !== ''
                      return (
                        <button
                          key={rifa.numero}
                          onClick={() => handleGridItemClick(rifa.numero)}
                          className={`aspect-square rounded-lg font-bold text-sm flex flex-col items-center justify-center border transition cursor-pointer ${isSold ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-500'}`}
                        >
                          <span>{rifa.numero}</span>
                          {isSold && <span className="text-[7px] font-medium opacity-90 truncate max-w-full px-1">{rifa.nome.split(' ')[0]}</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {viewMode === 'table' && (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-gray-50/50 text-xs font-bold text-gray-500 uppercase border-b border-gray-100">
                        <th className="px-6 py-4 text-center">Nº Rifa</th><th className="px-6 py-4">Comprador</th><th className="px-6 py-4">Telefone</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {filteredRifas.map(rifa => {
                        const isSold = rifa.nome.trim() !== ''
                        return (
                          <tr key={rifa.numero} className="hover:bg-gray-50/50">
                            <td className="px-6 py-4 font-bold text-center">{rifa.numero}</td>
                            <td className="px-6 py-4">{rifa.nome || <span className="text-gray-300 italic">Disponível</span>}</td>
                            <td className="px-6 py-4 text-gray-600">{rifa.telefone || '-'}</td>
                            <td className="px-6 py-4 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${isSold ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                                {isSold ? 'Vendida' : 'Livre'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => handleGridItemClick(rifa.numero)} className="text-blue-600 font-semibold text-xs py-1 px-2 cursor-pointer">Editar</button>
                                {isSold && isAdmin && (
                                  <button onClick={() => handleClearTicket({ preventDefault: () => {} } as any)} className="text-rose-600 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-100 py-8 mt-12 text-center text-xs text-gray-400">
        <p>© 2026 - {initialConfig.titulo}. Sistema de Gerenciamento Online Integrado.</p>
        <p className="mt-1">Desenvolvido com TanStack Start, React 19, e Netlify Postgres Database.</p>
      </footer>
    </div>
  )
}