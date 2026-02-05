import React, { useMemo, useState } from 'react';
import { Payment, Notary } from '../types';
import { formatCurrency } from '../utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  TooltipProps 
} from 'recharts';
import { TrendingUp, Landmark, FileCheck, DollarSign, Map as MapIcon, Calendar, BarChart3, AlertTriangle } from 'lucide-react';
import GeoMap from './GeoMap';
import { Skeleton } from './ui/Skeleton';

interface DashboardProps {
  payments: Payment[];
  notaries?: Notary[];
}

// Using any for Tooltip props to avoid TS issues with Recharts types
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg text-sm z-50">
        <p className="font-semibold text-slate-800 mb-1">{label}</p>
        <p className="text-blue-600">
          Repassado: {formatCurrency(payload[0].value as number)}
        </p>
        <p className="text-red-500">
          IRRF: {formatCurrency(payload[1].value as number)}
        </p>
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC<DashboardProps> = ({ payments, notaries = [] }) => {
  const [timeRange, setTimeRange] = useState('6months');
  const [activeTab, setActiveTab] = useState<'analytics' | 'map'>('analytics');
  const [isLoading, setIsLoading] = useState(false);

  // Verifica se é um usuário comum (não admin) sem cartórios vinculados
  // Assumimos que se a lista de notaries está vazia e não está carregando, há um problema de vínculo.
  const showAccessWarning = notaries.length === 0 && !isLoading;

  // Cálculo de Estatísticas Gerais
  const stats = useMemo(() => {
    const totalGross = payments.reduce((acc, curr) => acc + curr.grossValue, 0);
    const totalIRRF = payments.reduce((acc, curr) => acc + curr.irrfValue, 0);
    const totalNet = payments.reduce((acc, curr) => acc + curr.netValue, 0);
    const totalCount = payments.length;

    return { totalGross, totalIRRF, totalNet, totalCount };
  }, [payments]);

  // Cálculo dos Dados do Gráfico
  const chartData = useMemo(() => {
    type GroupedData = { name: string; gross: number; irrf: number; year: number; month: number };
    const grouped = payments.reduce((acc, curr) => {
      const key = `${curr.yearReference}-${curr.monthReference}`;
      if (!acc[key]) {
        acc[key] = { 
          name: `${curr.monthReference}/${curr.yearReference}`, 
          gross: 0, 
          irrf: 0,
          year: curr.yearReference,
          month: parseInt(curr.monthReference)
        };
      }
      acc[key].gross += curr.grossValue;
      acc[key].irrf += curr.irrfValue;
      return acc;
    }, {} as Record<string, GroupedData>);

    let sorted = Object.values(grouped).sort((a: GroupedData, b: GroupedData) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    if (timeRange === '6months') {
      sorted = sorted.slice(-6);
    } else if (timeRange === '2025') {
       sorted = sorted.filter((item: GroupedData) => item.year === 2025);
    }

    return sorted;
  }, [payments, timeRange]);

  const statusDistribution = useMemo(() => {
    const total = payments.length;
    if (total === 0) return { PAGO: 0, PENDENTE: 0, PROCESSANDO: 0 };

    const counts = payments.reduce((acc, curr) => {
      const status = curr.status || 'PENDENTE';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      PAGO: Math.round(((counts['PAGO'] || 0) / total) * 100),
      PENDENTE: Math.round(((counts['PENDENTE'] || 0) / total) * 100),
      PROCESSANDO: Math.round(((counts['PROCESSANDO'] || 0) / total) * 100)
    };
  }, [payments]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      
      {/* Alerta de Vínculo Ausente */}
      {showAccessWarning && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3 animate-in slide-in-from-top-2">
          <AlertTriangle className="text-orange-500 mt-0.5" size={24} />
          <div>
            <h3 className="text-orange-800 font-bold">Atenção: Nenhum cartório vinculado</h3>
            <p className="text-orange-700 text-sm mt-1">
              Seu usuário não possui permissão de visualização para nenhum cartório. 
              Por favor, entre em contato com o administrador do sistema para que ele realize o vínculo em 
              <strong> Configurações &gt; Gestão de Perfis</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Top Stats Cards (Always Visible) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
        ) : (
          <>
            <StatCard 
              title="Total Repassado" 
              value={formatCurrency(stats.totalGross)} 
              icon={<DollarSign className="text-white" size={20} />}
              iconBg="bg-blue-600"
              trend={stats.totalCount > 0 ? "+12% vs mês anterior" : "Sem dados"}
              trendColor="text-green-600"
            />
            <StatCard 
              title="IRRF Retido" 
              value={formatCurrency(stats.totalIRRF)} 
              icon={<Landmark className="text-white" size={20} />}
              iconBg="bg-red-500"
              subtext="Retenção na fonte"
            />
            <StatCard 
              title="Valor Líquido" 
              value={formatCurrency(stats.totalNet)} 
              icon={<TrendingUp className="text-white" size={20} />}
              iconBg="bg-green-600"
              subtext="Disponível para saque"
            />
            <StatCard 
              title="Total de Registros" 
              value={stats.totalCount.toString()} 
              icon={<FileCheck className="text-white" size={20} />}
              iconBg="bg-slate-600"
              subtext="Pagamentos processados"
            />
          </>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`
              whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors
              ${activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
            `}
          >
            <BarChart3 size={18} />
            Análise Financeira
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`
              whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors
              ${activeTab === 'map'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
            `}
          >
            <MapIcon size={18} />
            Visão Geográfica
          </button>
        </nav>
      </div>

      {/* Tab Content: Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-h-[400px]">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Evolução Mensal</h3>
                    <p className="text-xs text-slate-500">Comparativo Bruto vs IRRF</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
                      <Calendar size={14} className="ml-2 text-slate-400" />
                    <select 
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="bg-transparent text-sm font-medium text-slate-700 outline-none px-2 py-1 cursor-pointer"
                    >
                    <option value="6months">Últimos 6 meses</option>
                    <option value="2025">Ano 2025</option>
                    <option value="all">Todo o Histórico</option>
                    </select>
                </div>
            </div>
            
            <div className="h-[350px] w-full">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barGap={4} margin={{top: 10, right: 10, left: 0, bottom: 0}}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#64748b', fontSize: 12}} 
                        dy={10}
                        />
                        <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#64748b', fontSize: 12}}
                        tickFormatter={(value) => `R$ ${value >= 1000 ? `${value/1000}k` : value}`}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                        <Bar dataKey="gross" name="Bruto" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={60} />
                        <Bar dataKey="irrf" name="IRRF" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={60} />
                    </BarChart>
                    </ResponsiveContainer>
                ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <TrendingUp size={48} className="mb-2 opacity-20" />
                    <p>Sem dados para exibir.</p>
                </div>
                )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatusWidget label="Pagos" color="green" percentage={statusDistribution.PAGO} />
              <StatusWidget label="Pendentes" color="yellow" percentage={statusDistribution.PENDENTE} />
              <StatusWidget label="Em Processamento" color="blue" percentage={statusDistribution.PROCESSANDO} />
          </div>
        </div>
      )}

      {/* Tab Content: Map */}
      {activeTab === 'map' && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex flex-col h-[600px]">
              <div className="px-5 py-4 flex justify-between items-center border-b border-slate-100 mb-1">
                  <div>
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <MapIcon size={18} className="text-blue-600" />
                        Situação Geográfica dos Cartórios
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 ml-7">Visualização espacial de status e distribuição.</p>
                  </div>
              </div>
              <div className="flex-1 w-full relative rounded-b-lg overflow-hidden">
                  {isLoading ? <Skeleton className="w-full h-full" /> : <GeoMap notaries={notaries} />}
              </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Componente Auxiliar para Cards
const StatCard = ({ title, value, icon, iconBg, trend, trendColor, subtext }: any) => (
  <div className="bg-white p-5 rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col justify-between h-full transition hover:translate-y-[-2px] hover:shadow-md">
    <div className="flex justify-between items-start mb-3">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h4 className="text-2xl font-bold text-slate-800 mt-1 tracking-tight">{value}</h4>
      </div>
      <div className={`p-3 rounded-lg shadow-sm ${iconBg}`}>{icon}</div>
    </div>
    {(trend || subtext) && (
      <div className="mt-auto pt-2 border-t border-slate-50">
        {trend && <span className={`text-xs font-bold ${trendColor}`}>{trend}</span>}
        {subtext && <span className="text-xs text-slate-400">{subtext}</span>}
      </div>
    )}
  </div>
);

// Componente Auxiliar para Widget de Status
const StatusWidget = ({ label, color, percentage }: { label: string, color: string, percentage: number }) => {
    const colorClasses: Record<string, string> = {
        green: 'bg-green-50 text-green-700 border-green-100',
        yellow: 'bg-yellow-50 text-yellow-700 border-yellow-100',
        blue: 'bg-blue-50 text-blue-700 border-blue-100'
    };
    const barColors: Record<string, string> = {
        green: 'bg-green-500',
        yellow: 'bg-yellow-500',
        blue: 'bg-blue-500'
    };

    return (
        <div className={`p-4 rounded-xl border ${colorClasses[color]} flex items-center justify-between shadow-sm`}>
            <div className="flex flex-col gap-1 w-full mr-4">
                <span className="font-semibold text-sm">{label}</span>
                <div className="w-full h-1.5 bg-white/50 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${barColors[color]}`} style={{ width: `${percentage}%` }}></div>
                </div>
            </div>
            <span className="text-2xl font-bold">{percentage}%</span>
        </div>
    );
};

export default Dashboard;