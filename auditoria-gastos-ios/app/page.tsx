export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-6">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-emerald-400">Auditoría de Gastos</h1>
        
        <div className="bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700">
          <h2 className="text-lg font-semibold text-slate-200 mb-2">Resumen Semanal</h2>
          <p className="text-sm text-slate-400">Total gastado esta semana:</p>
          <p className="text-3xl font-bold text-white mt-2">$ 0.00</p>
        </div>

        {/* Placeholder for list of expenses */}
        <div className="mt-8">
          <h3 className="text-md font-semibold text-slate-300 mb-4">Últimos Movimientos</h3>
          <div className="space-y-3">
             <div className="bg-slate-800/50 p-4 rounded-lg flex justify-between items-center border border-slate-700/50">
                <div>
                  <p className="font-medium">Sin movimientos aún</p>
                  <p className="text-xs text-slate-500">Configura Supabase para empezar</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </main>
  )
}
