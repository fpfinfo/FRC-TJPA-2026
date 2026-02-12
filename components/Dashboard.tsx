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
  ResponsiveContainer
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
      <div className="bg-slate-900 p-4 border border-amber-500/30 shadow-2xl text-xs z-50">
        <p className="font-black text-white mb-2 uppercase tracking-widest">{label}</p>
        <div className="space-y-1">
          <p className="text-amber-500 font-bold flex justify-between gap-4">
            Bruto: <span>{formatCurrency(payload[0].value as number)}</span>
          </p>
          <p className="text-slate-400 flex justify-between gap-4">
            IRRF: <span>{formatCurrency(payload[1].value as number)}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC<DashboardProps> = ({ payments, notaries = [] }) => {
  const [timeRange, setTimeRange] = useState('6months');
  // Define 'map' as the default active tab per latest UX requirements
  const [activeTab, setActiveTab] = useState<'analytics' | 'map'>('map');
  const [isLoading, setIsLoading] = useState(false);

  // Verifica se é um usuário comum (não admin) sem cartórios vinculados
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
    if (total === 0) return { PAGO: 0, PENDENTE: 0, 'EM ANDAMENTO': 0 };

    const counts = payments.reduce((acc, curr) => {
      const status = curr.status || 'EM ANDAMENTO';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      PAGO: Math.round(((counts['PAGO'] || 0) / total) * 100),
      PENDENTE: Math.round(((counts['PENDENTE'] || 0) / total) * 100),
      'EM ANDAMENTO': Math.round(((counts['EM ANDAMENTO'] || 0) / total) * 100)
    };
  }, [payments]);

  return (
    <div className="space-y-8 reveal-stagger">
      
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
              icon={<DollarSign className="text-slate-900" size={20} />}
              iconBg="bg-amber-500"
              trend={stats.totalCount > 0 ? "+12% vs mês anterior" : "Sem dados"}
              trendColor="text-amber-600"
            />
            <StatCard 
              title="IRRF Retido" 
              value={formatCurrency(stats.totalIRRF)} 
              icon={<Landmark className="text-white" size={20} />}
              iconBg="bg-slate-700"
              subtext="Retenção na fonte"
            />
            <StatCard 
              title="Valor Líquido" 
              value={formatCurrency(stats.totalNet)} 
              icon={<TrendingUp className="text-slate-900" size={20} />}
              iconBg="bg-amber-400"
              subtext="Disponível para saque"
            />
            <StatCard 
              title="Total de Registros" 
              value={stats.totalCount.toString()} 
              icon={<FileCheck className="text-white" size={20} />}
              iconBg="bg-slate-900"
              subtext="Atos processados em 2026"
            />
          </>
        )}
      </div>

      {/* Tabs Navigation - ORDER: Map then Analytics */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('map')}
            className={`
              whitespace-nowrap pb-4 px-1 border-b-4 font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all
              ${activeTab === 'map'
                ? 'border-amber-500 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200'}
            `}
          >
            <MapIcon size={16} />
            Monitoramento Global
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`
              whitespace-nowrap pb-4 px-1 border-b-4 font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all
              ${activeTab === 'analytics'
                ? 'border-amber-500 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200'}
            `}
          >
            <BarChart3 size={16} />
            Análise de Repasses
          </button>
        </nav>
      </div>

      {/* Tab Content: Map (Default) */}
      {activeTab === 'map' && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="bg-white border-l-4 border-amber-500 shadow-sm flex flex-col h-[650px] overflow-hidden">
              <div className="px-6 py-5 flex justify-between items-center border-b border-slate-100 bg-slate-50/50">
                  <div>
                    <h3 className="font-black text-slate-900 flex items-center gap-2 uppercase tracking-tighter text-lg">
                        <MapIcon size={20} className="text-amber-500" />
                        Distribuição Geográfica
                    </h3>
                    <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest mt-0.5 ml-7">Sincronização em Tempo Real | SISUP 2026</p>
                  </div>
              </div>
              <div className="flex-1 w-full relative rounded-b-lg overflow-hidden">
                  {isLoading ? <Skeleton className="w-full h-full" /> : <GeoMap notaries={notaries} />}
              </div>
          </div>
        </div>
      )}

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
                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(251, 191, 36, 0.05)'}} />
                        <Bar dataKey="gross" name="Bruto" fill="#fbbf24" radius={0} maxBarSize={40} />
                        <Bar dataKey="irrf" name="IRRF" fill="#0f172a" radius={0} maxBarSize={40} />
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
              <StatusWidget label="Atos Processados" color="amber" percentage={statusDistribution.PAGO} />
              <StatusWidget label="Pendentes (N.E/O.B)" color="slate" percentage={statusDistribution.PENDENTE} />
              <StatusWidget label="Em Transmissão" color="amber-light" percentage={statusDistribution['EM ANDAMENTO']} />
          </div>
        </div>
      )}

    </div>
  );
};

// Componente Auxiliar para Cards
const StatCard = ({ title, value, icon, iconBg, trend, trendColor, subtext }: any) => (
  <div className="bg-white p-6 border-b-2 border-slate-100 hover:border-amber-500 transition-all duration-300 shadow-sm relative overflow-hidden group">
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
        <h4 className="text-3xl font-black text-slate-900 mt-1 tracking-tighter uppercase">{value}</h4>
      </div>
      <div className={`p-3 border-l-4 border-amber-500 ${iconBg} bg-opacity-10 group-hover:bg-opacity-100 transition-all duration-300`}>
        {icon}
      </div>
    </div>
    {(trend || subtext) && (
      <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between">
        {trend && <span className={`text-[10px] font-black uppercase tracking-tighter ${trendColor}`}>{trend}</span>}
        {subtext && <span className="text-[10px] text-slate-400 font-bold uppercase">{subtext}</span>}
      </div>
    )}
  </div>
);

// Componente Auxiliar para Widget de Status
const StatusWidget = ({ label, color, percentage }: { label: string, color: string, percentage: number }) => {
    const colorClasses: Record<string, string> = {
        amber: 'bg-white border-l-4 border-amber-500 text-slate-900',
        slate: 'bg-white border-l-4 border-slate-900 text-slate-900',
        'amber-light': 'bg-white border-l-4 border-amber-200 text-slate-600'
    };
    const barColors: Record<string, string> = {
        amber: 'bg-amber-500',
        slate: 'bg-slate-900',
        'amber-light': 'bg-amber-200'
    };

    return (
        <div className={`p-5 shadow-sm border border-slate-100 ${colorClasses[color]} flex items-center justify-between transition-all hover:bg-slate-50 cursor-pointer`}>
            <div className="flex flex-col gap-2 w-full mr-6">
                <span className="font-black text-[10px] uppercase tracking-widest">{label}</span>
                <div className="w-full h-1 bg-slate-100 overflow-hidden">
                    <div className={`h-full ${barColors[color]}`} style={{ width: `${percentage}%` }}></div>
                </div>
            </div>
            <span className="text-2xl font-black italic tracking-tighter">{percentage}%</span>
        </div>
    );
};

export default Dashboard;