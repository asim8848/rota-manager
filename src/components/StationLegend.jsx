import { getStationColor, getStationIcon } from '../utils/stationColors'

const StationLegend = ({ stations }) => {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {stations.map((station) => (
        <span
          key={station}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-panel px-3.5 py-1.5 text-[11px] font-black text-text shadow-sm hover:border-accent/30 hover:shadow transition-all duration-300 select-none shrink-0"
        >
          {/* Accent colored dot indicating station role */}
          <span
            className="h-2.5 w-2.5 rounded-full border border-black/5 dark:border-white/10 shrink-0 ring-2 ring-offset-1 ring-offset-panel transition-transform group-hover:scale-110"
            style={{ 
              backgroundColor: getStationColor(station),
              '--tw-ring-color': getStationColor(station)
            }}
          />
          <span>{getStationIcon(station)}</span>
          <span className="tracking-tight text-text-muted">{station}</span>
        </span>
      ))}
    </div>
  )
}

export default StationLegend
