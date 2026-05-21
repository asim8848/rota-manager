import { ChartIcon, AwardIcon, ScaleIcon } from './Icons'

const DashboardCards = ({ totalHours, mostWorking, lowestWorking, hoursByEmployee }) => {
  const underScheduledCount = Object.values(hoursByEmployee || {}).filter(h => h < 15).length
  const totalEmployeesCount = Object.keys(hoursByEmployee || {}).length || 1
  const pctUnder = (underScheduledCount / totalEmployeesCount) * 100

  const laborTarget = 150
  const laborPct = Math.min((totalHours / laborTarget) * 100, 100)

  const capacityTarget = 40
  const capacityPct = Math.min((mostWorking.hours / capacityTarget) * 100, 100)

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {/* Total Scheduled Hours Card */}
      <div className="panel animate-fade-in-up stat-card group relative overflow-hidden">
        {/* Soft custom brand ambient glows */}
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-[rgba(var(--accent-rgb),0.1)] blur-2xl group-hover:bg-[rgba(var(--accent-rgb),0.15)] transition-all duration-700"></div>
        <div className="absolute left-1/3 bottom-0 -ml-6 -mb-6 h-16 w-16 rounded-full bg-white/10 dark:bg-white/5 blur-xl pointer-events-none"></div>
        
        <div className="flex justify-between items-start relative z-10">
          <div>
            <p className="stat-title">Total Active Hours</p>
            <div className="text-4xl font-black text-text tracking-tight font-title mt-1.5 select-none">
              {totalHours.toFixed(1)}<span className="text-sm font-black text-text-muted ml-1.5 uppercase tracking-wide">hrs</span>
            </div>
          </div>
          <span className="p-3.5 rounded-2xl bg-accent-soft text-accent border border-accent/15 flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-sm select-none">
            <ChartIcon className="w-5 h-5" />
          </span>
        </div>

        {/* Live progress bar */}
        <div className="mt-4 flex flex-col gap-1.5 relative z-10">
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-text-muted">
            <span>Labor Budget Target</span>
            <span>{totalHours.toFixed(1)} / {laborTarget}h</span>
          </div>
          <div className="h-1.5 w-full bg-panel-soft rounded-full overflow-hidden border border-border-soft">
            <div 
              className="h-full bg-accent rounded-full transition-all duration-500" 
              style={{ width: `${laborPct}%` }}
            ></div>
          </div>
        </div>

        <p className="text-xs text-text-muted mt-5 flex items-center gap-2 relative z-10 font-bold select-none">
          <span className="h-2 w-2 rounded-full bg-accent animate-pulse"></span>
          Weekly active scheduled labor hours
        </p>
      </div>

      {/* Most Scheduled Employee Card */}
      <div className="panel animate-fade-in-up stat-card group relative overflow-hidden" style={{ animationDelay: '0.1s' }}>
        {/* Soft custom brand ambient glows */}
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-[rgba(var(--primary-rgb),0.1)] blur-2xl group-hover:bg-[rgba(var(--primary-rgb),0.15)] transition-all duration-700"></div>
        <div className="absolute left-1/4 bottom-0 -ml-6 -mb-6 h-16 w-16 rounded-full bg-white/10 dark:bg-white/5 blur-xl pointer-events-none"></div>
        
        <div className="flex justify-between items-start relative z-10">
          <div>
            <p className="stat-title">Top Coverage</p>
            <div className="text-2xl font-black text-text tracking-tight mt-1.5 line-clamp-1 font-title select-none">
              {mostWorking.label || 'None'}
            </div>
          </div>
          <span className="p-3.5 rounded-2xl bg-primary-soft text-primary border border-primary/15 flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-sm select-none">
            <AwardIcon className="w-5 h-5" />
          </span>
        </div>

        {/* Live capacity meter */}
        <div className="mt-4 flex flex-col gap-1.5 relative z-10">
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-text-muted">
            <span>Weekly Capacity Load</span>
            <span>{mostWorking.hours.toFixed(1)} / {capacityTarget}h</span>
          </div>
          <div className="h-1.5 w-full bg-panel-soft rounded-full overflow-hidden border border-border-soft">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500" 
              style={{ width: `${capacityPct}%` }}
            ></div>
          </div>
        </div>

        <p className="text-xs text-text-muted mt-5 relative z-10 font-bold select-none">
          Assigned <strong className="text-text font-black">{mostWorking.hours.toFixed(1)}h</strong> of shifts this week
        </p>
      </div>

      {/* Lowest Scheduled Employee Card */}
      <div className="panel animate-fade-in-up stat-card group relative overflow-hidden" style={{ animationDelay: '0.2s' }}>
        {/* Soft custom brand ambient glows */}
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-[rgba(30,126,86,0.1)] blur-2xl group-hover:bg-[rgba(30,126,86,0.15)] transition-all duration-700"></div>
        <div className="absolute left-1/5 bottom-0 -ml-6 -mb-6 h-16 w-16 rounded-full bg-white/10 dark:bg-white/5 blur-xl pointer-events-none"></div>
        
        <div className="flex justify-between items-start relative z-10">
          <div>
            <p className="stat-title">Lowest Scheduled</p>
            <div className="text-2xl font-black text-text tracking-tight mt-1.5 line-clamp-1 font-title select-none" title={lowestWorking.length ? lowestWorking.map((entry) => `${entry.name} (${entry.hours.toFixed(1)}h)`).join(', ') : 'None'}>
              {lowestWorking.length
                ? lowestWorking.map((entry) => entry.name).join(', ')
                : 'None'}
            </div>
          </div>
          <span className="p-3.5 rounded-2xl bg-[rgba(30,126,86,0.06)] text-[#1E7E56] dark:text-[#34d399] border border-[rgba(30,126,86,0.15)] flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-sm select-none">
            <ScaleIcon className="w-5 h-5" />
          </span>
        </div>

        {/* Live Warning under-scheduled meter */}
        <div className="mt-4 flex flex-col gap-1.5 relative z-10">
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-text-muted">
            <span>Under-scheduled Alert (&lt;15h)</span>
            <span>{underScheduledCount} / {totalEmployeesCount} staff</span>
          </div>
          <div className="h-1.5 w-full bg-panel-soft rounded-full overflow-hidden border border-border-soft">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${underScheduledCount > 0 ? 'bg-primary' : 'bg-[#1E7E56]'}`}
              style={{ width: `${pctUnder}%` }}
            ></div>
          </div>
        </div>

        <p className="text-xs text-text-muted mt-5 relative z-10 font-bold select-none">
          Keeping roster hours balanced and fair
        </p>
      </div>
    </div>
  )
}

export default DashboardCards
