import { useEffect, useMemo, useState } from 'react'
import html2canvas from 'html2canvas'
import { defaultRota } from './data/rotaData'
import {
  STORAGE_KEY,
  THEME_KEY,
  calculateEmployeeHours,
  createId,
  downloadTextFile,
  formatDayMessage,
  formatWeekMessage,
  getLowestWorkingEmployees,
  getMostWorkingEmployee,
  getTotalHours,
} from './utils/rotaUtils'
import Header from './components/Header'
import DashboardCards from './components/DashboardCards'
import EmployeeManager from './components/EmployeeManager'
import StationLegend from './components/StationLegend'
import WeekBoard from './components/WeekBoard'
import { ScaleIcon, ExportIcon, ClipboardIcon } from './components/Icons'

const loadStoredRota = () => {
  if (typeof window === 'undefined') return defaultRota
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return defaultRota
  try {
    return JSON.parse(stored)
  } catch {
    return defaultRota
  }
}

const loadStoredTheme = () => {
  if (typeof window === 'undefined') return 'light'
  return localStorage.getItem(THEME_KEY) || 'light'
}

function App() {
  const [rota, setRota] = useState(loadStoredRota)
  const [theme, setTheme] = useState(loadStoredTheme)
  const [status, setStatus] = useState('')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rota))
  }, [rota])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  const hoursByEmployee = useMemo(() => {
    return calculateEmployeeHours(rota.week, rota.employees)
  }, [rota])

  const totalHours = useMemo(() => getTotalHours(hoursByEmployee), [hoursByEmployee])
  const mostWorking = useMemo(
    () => getMostWorkingEmployee(hoursByEmployee),
    [hoursByEmployee],
  )
  const lowestWorking = useMemo(
    () => getLowestWorkingEmployees(hoursByEmployee),
    [hoursByEmployee],
  )

  const updateDay = (dayId, updater) => {
    setRota((prev) => ({
      ...prev,
      week: prev.week.map((day) => (day.id === dayId ? updater(day) : day)),
    }))
  }

  const updateShift = (dayId, shiftId, updater) => {
    updateDay(dayId, (day) => ({
      ...day,
      shifts: day.shifts.map((shift) =>
        shift.id === shiftId ? updater(shift) : shift,
      ),
    }))
  }

  const updateEntry = (dayId, shiftId, entryId, updater) => {
    updateShift(dayId, shiftId, (shift) => ({
      ...shift,
      entries: shift.entries.map((entry) =>
        entry.id === entryId ? updater(entry) : entry,
      ),
    }))
  }

  const handleAddEmployee = (name) => {
    if (!name.trim()) return
    setRota((prev) => ({
      ...prev,
      employees: [...prev.employees, name.trim()],
    }))
  }

  const handleUpdateEmployee = (index, name) => {
    setRota((prev) => ({
      ...prev,
      employees: prev.employees.map((employee, idx) =>
        idx === index ? name : employee,
      ),
    }))
  }

  const handleRemoveEmployee = (name) => {
    setRota((prev) => ({
      ...prev,
      employees: prev.employees.filter((employee) => employee !== name),
      week: prev.week.map((day) => ({
        ...day,
        shifts: day.shifts.map((shift) => ({
          ...shift,
          entries: shift.entries.map((entry) => ({
            ...entry,
            staff: entry.staff.filter((member) => member !== name),
          })),
        })),
      })),
    }))
  }

  const handleAddShift = (dayId) => {
    updateDay(dayId, (day) => ({
      ...day,
      shifts: [
        ...day.shifts,
        {
          id: createId(),
          label: 'New Shift',
          time: '6pm-12am',
          entries: [],
        },
      ],
    }))
  }

  const handleRemoveShift = (dayId, shiftId) => {
    updateDay(dayId, (day) => ({
      ...day,
      shifts: day.shifts.filter((shift) => shift.id !== shiftId),
    }))
  }

  const handleAddEntry = (dayId, shiftId) => {
    updateShift(dayId, shiftId, (shift) => ({
      ...shift,
      entries: [
        ...shift.entries,
        {
          id: createId(),
          station: rota.stations[0] || 'Station',
          staff: [],
          time: shift.time,
          note: '',
        },
      ],
    }))
  }

  const handleUpdateEntry = (dayId, shiftId, entryId, updates) => {
    updateEntry(dayId, shiftId, entryId, (entry) => ({
      ...entry,
      ...updates,
    }))
  }

  const handleRemoveEntry = (dayId, shiftId, entryId) => {
    updateShift(dayId, shiftId, (shift) => ({
      ...shift,
      entries: shift.entries.filter((entry) => entry.id !== entryId),
    }))
  }

  const handleUpdateShift = (dayId, shiftId, updates) => {
    updateShift(dayId, shiftId, (shift) => ({
      ...shift,
      ...updates,
    }))
  }

  const handleUpdateDayNotes = (dayId, updates) => {
    updateDay(dayId, (day) => ({
      ...day,
      ...updates,
    }))
  }

  const handleAddCellAssignment = (dayId, employeeName, station, time, note) => {
    setRota((prev) => {
      const nextWeek = prev.week.map((day) => {
        if (day.id !== dayId) return day
        
        let shifts = [...day.shifts]
        // Create a default shift if none exists
        if (shifts.length === 0) {
          shifts.push({
            id: createId(),
            label: 'Shift',
            time: time || '12pm-6pm',
            entries: []
          })
        }
        
        // Add a new entry to the first shift
        shifts[0] = {
          ...shifts[0],
          entries: [
            ...shifts[0].entries,
            {
              id: createId(),
              station: station || prev.stations[0],
              staff: [employeeName],
              time: time || shifts[0].time || '12pm-6pm',
              note: note || ''
            }
          ]
        }
        
        return { ...day, shifts }
      })
      return { ...prev, week: nextWeek }
    })
  }

  const handleUpdateCellAssignment = (dayId, shiftId, entryId, employeeName, updates) => {
    setRota((prev) => {
      const nextWeek = prev.week.map((day) => {
        if (day.id !== dayId) return day
        
        const nextShifts = day.shifts.map((shift) => {
          if (shift.id !== shiftId) return shift
          
          let nextEntries = []
          shift.entries.forEach((entry) => {
            if (entry.id !== entryId) {
              nextEntries.push(entry)
              return
            }
            
            // If the employee is the only one assigned, update in place
            if (entry.staff.length === 1 && entry.staff.includes(employeeName)) {
              nextEntries.push({
                ...entry,
                station: updates.station !== undefined ? updates.station : entry.station,
                time: updates.time !== undefined ? updates.time : entry.time,
                note: updates.note !== undefined ? updates.note : entry.note
              })
            } else {
              // Split: remove employee from this entry
              nextEntries.push({
                ...entry,
                staff: entry.staff.filter((m) => m !== employeeName)
              })
              // Create a separate entry for this employee
              nextEntries.push({
                id: createId(),
                station: updates.station !== undefined ? updates.station : entry.station,
                staff: [employeeName],
                time: updates.time !== undefined ? updates.time : entry.time || shift.time || '',
                note: updates.note !== undefined ? updates.note : entry.note || ''
              })
            }
          })
          
          return { ...shift, entries: nextEntries }
        })
        
        return { ...day, shifts: nextShifts }
      })
      return { ...prev, week: nextWeek }
    })
  }

  const handleRemoveCellAssignment = (dayId, shiftId, entryId, employeeName) => {
    setRota((prev) => {
      const nextWeek = prev.week.map((day) => {
        if (day.id !== dayId) return day
        
        let nextShifts = day.shifts.map((shift) => {
          if (shift.id !== shiftId) return shift
          
          const nextEntries = shift.entries
            .map((entry) => {
              if (entry.id !== entryId) return entry
              return {
                ...entry,
                staff: entry.staff.filter((m) => m !== employeeName)
              }
            })
            .filter((entry) => entry.staff.length > 0) // Remove entry if no staff left
            
          return { ...shift, entries: nextEntries }
        })
        
        // Optionally clean up empty shifts
        nextShifts = nextShifts.filter((shift) => shift.entries.length > 0 || shift.label !== 'Shift')
        
        return { ...day, shifts: nextShifts }
      })
      return { ...prev, week: nextWeek }
    })
  }

  const handleCopy = async (text, message) => {
    try {
      await navigator.clipboard.writeText(text)
      setStatus(message)
      setTimeout(() => setStatus(''), 2000)
    } catch {
      setStatus('Copy failed')
      setTimeout(() => setStatus(''), 2000)
    }
  }

  const handleExportText = () => {
    const content = formatWeekMessage(rota.week)
    downloadTextFile(content, 'rota-manager-week.txt')
  }

  const handleExportImage = async () => {
    const target = document.getElementById('rota-board')
    if (!target) return
    const canvas = await html2canvas(target, {
      backgroundColor: null,
      scale: 2,
    })
    const link = document.createElement('a')
    link.download = 'rota-manager.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="app-shell flex flex-col gap-6">
      <Header
        theme={theme}
        onToggleTheme={() =>
          setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
        }
        onCopyWeek={() =>
          handleCopy(formatWeekMessage(rota.week), 'Week copied')
        }
        onExportText={handleExportText}
        onExportImage={handleExportImage}
        status={status}
      />

      <section className="mx-auto flex w-full max-w-none flex-col gap-6 relative">
        {/* Sleek Breadcrumb / Compact Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 select-none">
          <div>
            <span className="tag text-[9px] py-0.5 px-2 bg-accent-soft text-accent border border-accent/15 rounded-md font-black shadow-sm tracking-widest uppercase">
              Operations Control
            </span>
            <h1 className="text-3xl font-black text-text font-title tracking-tight mt-1.5">
              Smoke & Pepper Scheduling
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text-muted">Live Workspace Status:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-black bg-[#1E7E56]/10 text-[#1E7E56] border border-[#1E7E56]/20">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1E7E56] animate-pulse"></span>
              Synchronized
            </span>
          </div>
        </div>

        {/* Core Stats Overview */}
        <DashboardCards
          totalHours={totalHours}
          mostWorking={mostWorking}
          lowestWorking={lowestWorking}
          hoursByEmployee={hoursByEmployee}
        />

        {/* Timetable grid and managers layout */}
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] items-start">
          
          {/* Main Rota Timetable Board */}
          <div className="panel p-6 flex flex-col gap-5" id="rota-board">
            <div className="flex flex-col gap-4 border-b border-border/50 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-text font-title">Weekly Rota Board</h2>
                  <p className="text-xs text-muted font-medium mt-0.5">
                    Assign shift duties, manage stations, and toggle notes.
                  </p>
                </div>
                <StationLegend stations={rota.stations} />
              </div>
            </div>
            
            <WeekBoard
              week={rota.week}
              employees={rota.employees}
              stations={rota.stations}
              onAddShift={handleAddShift}
              onRemoveShift={handleRemoveShift}
              onAddEntry={handleAddEntry}
              onUpdateEntry={handleUpdateEntry}
              onRemoveEntry={handleRemoveEntry}
              onUpdateShift={handleUpdateShift}
              onUpdateDayNotes={handleUpdateDayNotes}
              onAddCellAssignment={handleAddCellAssignment}
              onUpdateCellAssignment={handleUpdateCellAssignment}
              onRemoveCellAssignment={handleRemoveCellAssignment}
              onCopyDay={(day) =>
                handleCopy(formatDayMessage(day), `${day.name} copied`)
              }
            />
          </div>

          {/* Sidebar Operations Panel */}
          <div className="flex flex-col gap-6">
            {/* Staff roster section */}
            <EmployeeManager
              employees={rota.employees}
              hoursByEmployee={hoursByEmployee}
              onAddEmployee={handleAddEmployee}
              onUpdateEmployee={handleUpdateEmployee}
              onRemoveEmployee={handleRemoveEmployee}
            />

            {/* Rules Watch Container */}
            <div className="panel p-6 flex flex-col gap-4">
              <div>
                <h3 className="text-lg font-bold tracking-tight text-text font-title flex items-center gap-1.5">
                  <ScaleIcon className="w-5 h-5 text-accent shrink-0" /> Rules Watch
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Visual guardrails ensuring balanced staff assignment.
                </p>
              </div>

              <div className="grid gap-3 text-xs">
                <div className="soft-panel flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 hover:border-accent/15 transition-all">
                  <span className="font-bold text-muted uppercase tracking-wider text-[10px]">Equal Hours Group</span>
                  <span className="font-extrabold text-text bg-panel-soft/80 px-2 py-1 rounded border border-border shadow-sm">
                    Imran / Jibran / Asim / Moiz
                  </span>
                </div>
                <div className="soft-panel flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 hover:border-accent/15 transition-all">
                  <span className="font-bold text-muted uppercase tracking-wider text-[10px]">Top Hours Target</span>
                  <span className="font-extrabold text-text bg-panel-soft/80 px-2 py-1 rounded border border-border shadow-sm">
                    Wajahat (60 - 70 hrs)
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="panel p-6 flex flex-col gap-4">
              <div>
                <h3 className="text-lg font-bold tracking-tight text-text font-title flex items-center gap-1.5">
                  <ExportIcon className="w-5 h-5 text-accent shrink-0" /> Quick Actions
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Export timetable details for instant team distribution.
                </p>
              </div>

              <div className="grid gap-2.5">
                <button
                  type="button"
                  className="soft-panel flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-text transition hover:border-accent hover:bg-panel shadow-sm cursor-pointer"
                  onClick={() =>
                    handleCopy(formatWeekMessage(rota.week), 'Week copied')
                  }
                >
                  <span className="flex items-center gap-2">
                    <ClipboardIcon className="w-4 h-4 text-text-muted" />
                    <span>Copy WhatsApp Message</span>
                  </span>
                  <span className="tag text-[9px] py-0.5 px-1.5 bg-accent-soft text-accent border border-accent/15 rounded font-black tracking-wider">All week</span>
                </button>
                <button
                  type="button"
                  className="soft-panel flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-text transition hover:border-accent hover:bg-panel shadow-sm cursor-pointer"
                  onClick={handleExportText}
                >
                  <span className="flex items-center gap-2">
                    <ExportIcon className="w-4 h-4 text-text-muted" />
                    <span>Export Rota as Text</span>
                  </span>
                  <span className="tag text-[9px] py-0.5 px-1.5 bg-accent-soft text-accent border border-accent/15 rounded font-black tracking-wider">.txt file</span>
                </button>
                <button
                  type="button"
                  className="soft-panel flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-text transition hover:border-accent hover:bg-panel shadow-sm cursor-pointer"
                  onClick={handleExportImage}
                >
                  <span className="flex items-center gap-2">
                    <ExportIcon className="w-4 h-4 text-text-muted rotate-180" />
                    <span>Export Rota as Image</span>
                  </span>
                  <span className="tag text-[9px] py-0.5 px-1.5 bg-accent-soft text-accent border border-accent/15 rounded font-black tracking-wider">PNG Image</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default App
