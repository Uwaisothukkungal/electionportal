'use client';

export function PerformanceAnalytics({ 
  polled, 
  total, 
  label = "Our Party Polled"
}: { 
  polled: number; 
  total: number; 
  label?: string;
}) {
  const percentage = total > 0 ? (polled / total) * 100 : 0;
  const isHigh = percentage > 50;
  
  return (
    <div className="p-8 rounded-[2.5rem] bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-500 overflow-hidden relative group">
      {/* Decorative Background Blob */}
      <div className={`absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl opacity-10 transition-all duration-700 group-hover:scale-150 ${isHigh ? 'bg-emerald-500' : 'bg-blue-500'}`} />
      
      <div className="relative z-10 space-y-6">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{label}</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-gray-900 tracking-tighter">{polled.toLocaleString()}</span>
              <span className="text-sm font-bold text-gray-300 uppercase italic">/ {total.toLocaleString()}</span>
            </div>
          </div>
          <div className={`text-3xl font-black tracking-tighter ${isHigh ? 'text-emerald-600' : 'text-blue-600'}`}>
            {percentage.toFixed(1)}%
          </div>
        </div>

        <div className="space-y-3">
          <div className="h-4 w-full bg-gray-50 rounded-full overflow-hidden p-0.5 border border-gray-100 shadow-inner">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ease-out shadow-lg ${isHigh ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-blue-500 shadow-blue-500/20'}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex justify-between text-[8px] font-black text-gray-300 uppercase tracking-[0.2em] px-1">
             <span>Performance Level</span>
             <span>{isHigh ? 'Dominating' : 'Developing'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
