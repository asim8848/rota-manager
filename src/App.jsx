import { useEffect, useMemo, useState } from 'react'
import { defaultRota } from './data/rotaData'
import {
  THEME_KEY,
  calculateEmployeeHours,
  createId,
  formatDayMessage,
  formatWeekMessage,
  getLowestWorkingEmployees,
  getMostWorkingEmployee,
  getTotalHours,
  getWeekIdentifier,
  getWeekDateRange,
  getOffsetWeekId,
} from './utils/rotaUtils'
import Header from './components/Header'
import DashboardCards from './components/DashboardCards'
import EmployeeManager from './components/EmployeeManager'
import StationLegend from './components/StationLegend'
import WeekBoard from './components/WeekBoard'
import DeveloperFooter from './components/DeveloperFooter'
import { ExportIcon, ClipboardIcon } from './components/Icons'
import { auth, db } from './firebase'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth'
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot
} from 'firebase/firestore'

const ResetIcon = ({ className = 'w-4 h-4' }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
    />
  </svg>
)

const loadStoredTheme = () => {
  if (typeof window === 'undefined') return 'light'
  return localStorage.getItem(THEME_KEY) || 'light'
}

function App() {
  // Auth state
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // Rota state
  const [selectedWeekId, setSelectedWeekId] = useState(() => getWeekIdentifier())
  const [rota, setRota] = useState(null)
  const [rotaLoading, setRotaLoading] = useState(true)
  const [suggestions, setSuggestions] = useState({ openingNote: [], prepNote: [], extraNote: [], closingNote: [] })
  
  // Theme & Status
  const [theme, setTheme] = useState(loadStoredTheme)
  const [status, setStatus] = useState('')

  // Monitor auth state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setAuthLoading(false)
    })
    return unsub
  }, [])

  // Auto-provision default manager account was removed for security.
  // Account should be provisioned via Firebase console to prevent credential leaks.

  // Sync rota in real-time from Firestore based on selected week
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!user) {
      setRota((prev) => (prev !== null ? null : prev))
      setRotaLoading((prev) => (prev ? false : prev))
      return
    }
  /* eslint-enable react-hooks/set-state-in-effect */

    setRotaLoading(true)
    const docRef = doc(db, 'rotas', `week_${selectedWeekId}`)
    
    const unsub = onSnapshot(docRef, async (docSnap) => {
      if (docSnap.exists()) {
        setRota(docSnap.data())
      } else {
        // Initialize blank week based on default structure
        const newRota = {
          weekId: selectedWeekId,
          employees: defaultRota.employees,
          stations: defaultRota.stations,
          week: defaultRota.week.map(day => ({
            ...day,
            shifts: day.shifts.map(shift => ({
              ...shift,
              entries: [] // Start blank
            }))
          })),
          updatedAt: new Date().toISOString(),
          updatedBy: user.uid
        }
        try {
          await setDoc(docRef, newRota)
        } catch (err) {
          console.error("Error creating week:", err)
        }
      }
      setRotaLoading(false)
    }, (err) => {
      console.error("Firestore onSnapshot error:", err)
      setRotaLoading(false)
    })

    return unsub
  }, [user, selectedWeekId])

  // Sync note suggestions
  useEffect(() => {
    if (!user) return
    const docRef = doc(db, 'suggestions', 'notes')
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setSuggestions(docSnap.data())
      }
    })
    return unsub
  }, [user])

  // Toggle theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  // Calculated variables
  const hoursByEmployee = useMemo(() => {
    if (!rota) return {}
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

  // Auth actions
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword)
    } catch (err) {
      console.error(err)
      if (err.code === 'auth/operation-not-allowed') {
        setLoginError('Email/Password sign-in is disabled. Please enable it in the Firebase Console under Authentication > Sign-in method.')
      } else if (
        err.code === 'auth/user-not-found' || 
        err.code === 'auth/wrong-password' || 
        err.code === 'auth/invalid-credential'
      ) {
        setLoginError('Invalid email or password.')
      } else {
        setLoginError(`Authentication failed: ${err.message || 'Please try again.'}`)
      }
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (err) {
      console.error("Logout failed:", err)
    }
  }

  // Firestore update helper
  const saveRota = async (nextRota) => {
    const previousRota = rota
    setRota(nextRota) // Optimistic state update
    try {
      const docRef = doc(db, 'rotas', `week_${selectedWeekId}`)
      await setDoc(docRef, {
        ...nextRota,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.uid || ''
      })
    } catch (err) {
      console.error("Sync error:", err)
      setRota(previousRota) // Rollback to previous state
      setStatus('Sync error. Reverted to last saved state.')
      setTimeout(() => setStatus(''), 4000)
    }
  }


  // Suggestion saving helper
  const saveSuggestions = async (updates) => {
    try {
      const notesDocRef = doc(db, 'suggestions', 'notes')
      const notesSnap = await getDoc(notesDocRef)
      let existing = {
        openingNote: [],
        prepNote: [],
        extraNote: [],
        closingNote: []
      }
      if (notesSnap.exists()) {
        existing = { ...existing, ...notesSnap.data() }
      }
      
      let changed = false
      const cleanAndAdd = (arr, val) => {
        if (!val || !val.trim()) return arr
        const trimmed = val.trim()
        if (!arr.includes(trimmed)) {
          changed = true
          return [...arr, trimmed]
        }
        return arr
      }
      
      const nextSuggestions = {
        openingNote: cleanAndAdd(existing.openingNote || [], updates.openingNote),
        prepNote: cleanAndAdd(existing.prepNote || [], updates.prepNote),
        extraNote: cleanAndAdd(existing.extraNote || [], updates.extraNote),
        closingNote: cleanAndAdd(existing.closingNote || [], updates.closingNote)
      }
      
      if (changed) {
        await setDoc(notesDocRef, nextSuggestions)
      }
    } catch (err) {
      console.error("Failed to save suggestions:", err)
    }
  }

  const handleResetToDefault = () => {
    if (
      window.confirm(
        'Are you sure you want to reset the current rota to the default template? This will overwrite your current schedule.'
      )
    ) {
      saveRota({
        ...rota,
        week: defaultRota.week
      })
      setStatus('Reset to default template!')
      setTimeout(() => setStatus(''), 3000)
    }
  }

  const updateDay = (dayId, updater) => {
    if (!rota) return
    const next = {
      ...rota,
      week: rota.week.map((day) => (day.id === dayId ? updater(day) : day)),
    }
    saveRota(next)
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
    if (!name.trim() || !rota) return
    const next = {
      ...rota,
      employees: [...rota.employees, name.trim()],
    }
    saveRota(next)
  }

  const handleUpdateEmployee = (index, name) => {
    if (!rota) return
    const next = {
      ...rota,
      employees: rota.employees.map((employee, idx) =>
        idx === index ? name : employee,
      ),
    }
    saveRota(next)
  }

  const handleRemoveEmployee = (name) => {
    if (!rota) return
    const next = {
      ...rota,
      employees: rota.employees.filter((employee) => employee !== name),
      week: rota.week.map((day) => ({
        ...day,
        shifts: day.shifts.map((shift) => ({
          ...shift,
          entries: shift.entries.map((entry) => ({
            ...entry,
            staff: entry.staff.filter((member) => member !== name),
          })),
        })),
      })),
    }
    saveRota(next)
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
    if (!rota) return
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
    if (!rota) return
    const next = {
      ...rota,
      week: rota.week.map((day) => (day.id === dayId ? { ...day, ...updates } : day)),
    }
    saveRota(next)
    saveSuggestions(updates)
  }

  const handleAddCellAssignment = (dayId, employeeName, station, time, note) => {
    if (!rota) return
    const nextWeek = rota.week.map((day) => {
      if (day.id !== dayId) return day
      
      let shifts = [...day.shifts]
      if (shifts.length === 0) {
        shifts.push({
          id: createId(),
          label: 'Shift',
          time: time || '12pm-6pm',
          entries: []
        })
      }
      
      shifts[0] = {
        ...shifts[0],
        entries: [
          ...shifts[0].entries,
          {
            id: createId(),
            station: station || rota.stations[0],
            staff: [employeeName],
            time: time || shifts[0].time || '12pm-6pm',
            note: note || ''
          }
        ]
      }
      
      return { ...day, shifts }
    })
    saveRota({ ...rota, week: nextWeek })
  }

  const handleUpdateCellAssignment = (dayId, shiftId, entryId, employeeName, updates) => {
    if (!rota) return
    const nextWeek = rota.week.map((day) => {
      if (day.id !== dayId) return day
      
      const nextShifts = day.shifts.map((shift) => {
        if (shift.id !== shiftId) return shift
        
        let nextEntries = []
        shift.entries.forEach((entry) => {
          if (entry.id !== entryId) {
            nextEntries.push(entry)
            return
          }
          
          if (entry.staff.length === 1 && entry.staff.includes(employeeName)) {
            nextEntries.push({
              ...entry,
              station: updates.station !== undefined ? updates.station : entry.station,
              time: updates.time !== undefined ? updates.time : entry.time,
              note: updates.note !== undefined ? updates.note : entry.note
            })
          } else {
            nextEntries.push({
              ...entry,
              staff: entry.staff.filter((m) => m !== employeeName)
            })
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
    saveRota({ ...rota, week: nextWeek })
  }

  const handleRemoveCellAssignment = (dayId, shiftId, entryId, employeeName) => {
    if (!rota) return
    const nextWeek = rota.week.map((day) => {
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
          .filter((entry) => entry.staff.length > 0)
          
        return { ...shift, entries: nextEntries }
      })
      
      nextShifts = nextShifts.filter((shift) => shift.entries.length > 0 || shift.label !== 'Shift')
      
      return { ...day, shifts: nextShifts }
    })
    saveRota({ ...rota, week: nextWeek })
  }

  const handleDuplicateEmployeeShifts = (employeeName, sourceDayId, targetDayId) => {
    if (!rota) return
    const sourceDay = rota.week.find((d) => d.id === sourceDayId)
    const targetDay = rota.week.find((d) => d.id === targetDayId)
    if (!sourceDay || !targetDay) return

    const sourceAssignments = []
    sourceDay.shifts.forEach((shift) => {
      shift.entries.forEach((entry) => {
        if (entry.staff.includes(employeeName)) {
          sourceAssignments.push({
            shiftLabel: shift.label,
            shiftTime: shift.time,
            station: entry.station,
            time: entry.time,
            note: entry.note
          })
        }
      })
    })

    let nextShifts = targetDay.shifts.map((shift) => {
      const nextEntries = shift.entries
        .map((entry) => ({
          ...entry,
          staff: entry.staff.filter((name) => name !== employeeName)
        }))
        .filter((entry) => entry.staff.length > 0)
      return { ...shift, entries: nextEntries }
    })

    sourceAssignments.forEach((assignment) => {
      let targetShift = nextShifts.find((s) => s.label === assignment.shiftLabel)
      
      if (!targetShift) {
        targetShift = {
          id: createId(),
          label: assignment.shiftLabel,
          time: assignment.shiftTime,
          entries: []
        }
        nextShifts.push(targetShift)
      }

      targetShift.entries.push({
        id: createId(),
        station: assignment.station,
        staff: [employeeName],
        time: assignment.time,
        note: assignment.note
      })
    })

    nextShifts = nextShifts.filter((shift) => 
      shift.entries.length > 0 || ['Prep', '12pm', '6pm', '12am-1:30am Cleaning'].includes(shift.label)
    )

    const nextWeek = rota.week.map((day) => {
      if (day.id !== targetDayId) return day
      return { ...day, shifts: nextShifts }
    })

    saveRota({ ...rota, week: nextWeek })

    const sourceLabel = sourceDayId.charAt(0).toUpperCase() + sourceDayId.slice(1)
    const targetLabel = targetDayId.charAt(0).toUpperCase() + targetDayId.slice(1)
    setStatus(`Copied ${employeeName}'s shifts from ${sourceLabel} to ${targetLabel}`)
    setTimeout(() => setStatus(''), 2000)
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

  // Handle loaders
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base text-text">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent"></div>
          <span className="text-xs font-black tracking-widest uppercase text-text-muted">Loading Workspace...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-base px-4 py-12 gap-6">
        <div className="panel max-w-md w-full p-8 flex flex-col gap-6 shadow-2xl border border-border/80 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-accent"></div>
          
          <div className="flex flex-col items-center text-center gap-2">
            <span className="tag text-[9px] py-0.5 px-2 bg-accent-soft text-accent border border-accent/15 rounded-md font-black shadow-sm tracking-widest uppercase">
              Operations Control
            </span>
            <h1 className="text-2xl font-black text-text font-title tracking-tight mt-1">
              Smoke & Pepper
            </h1>
            <p className="text-xs text-text-muted font-medium">
              Dashboard Login for Rota & Staff Scheduling
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted">Email Address</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="manager@rotamanager.com"
                className="input text-sm"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted">Password</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="input text-sm"
              />
            </div>

            {loginError && (
              <div className="text-xs text-red-500 font-bold bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="btn btn-primary w-full py-3 mt-2 font-black text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loginLoading ? 'Authenticating...' : 'Access Dashboard'}
            </button>
          </form>

          <div className="border-t border-border/50 pt-4 text-center">
            <span className="text-[10px] text-text-muted font-medium leading-normal block">
              Manage week schedules and daily operations notes securely.
            </span>
          </div>
        </div>
        <div className="w-full max-w-md">
          <DeveloperFooter />
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell flex flex-col gap-6">
      <Header
        theme={theme}
        onToggleTheme={() =>
          setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
        }
        status={status}
        onLogout={handleLogout}
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
                {rota && <StationLegend stations={rota.stations} />}
              </div>
            </div>

            {/* Week navigation control */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-panel-soft/60 p-3 rounded-xl border border-border/40 select-none">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedWeekId(prev => getOffsetWeekId(prev, -1))}
                  className="btn btn-soft p-2 rounded-lg flex items-center justify-center cursor-pointer hover:text-accent border border-border/30 hover:border-accent/30 bg-panel shadow-sm transition-all"
                  title="Previous Week"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <div className="text-center sm:text-left min-w-[160px]">
                  <span className="text-xs font-black text-accent tracking-widest uppercase block text-[9px]">Active Period</span>
                  <span className="text-sm font-extrabold text-text font-title tracking-tight block mt-0.5">
                    {getWeekDateRange(selectedWeekId)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedWeekId(prev => getOffsetWeekId(prev, 1))}
                  className="btn btn-soft p-2 rounded-lg flex items-center justify-center cursor-pointer hover:text-accent border border-border/30 hover:border-accent/30 bg-panel shadow-sm transition-all"
                  title="Next Week"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>

              {selectedWeekId !== getWeekIdentifier() && (
                <button
                  type="button"
                  onClick={() => setSelectedWeekId(getWeekIdentifier())}
                  className="btn btn-soft text-[10px] font-black tracking-widest uppercase px-3 py-1.5 border-accent/20 hover:border-accent/40 text-accent cursor-pointer bg-panel shadow-sm hover:bg-accent-soft/30 transition-all"
                >
                  Jump to Current Week
                </button>
              )}
            </div>
            
            {rotaLoading || !rota ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 bg-panel-soft/30 rounded-2xl border border-dashed border-border/50">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent"></div>
                <span className="text-xs font-black tracking-widest uppercase text-text-muted">Loading Weekly Schedule...</span>
              </div>
            ) : (
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
                onDuplicateEmployeeShifts={handleDuplicateEmployeeShifts}
                suggestions={suggestions}
              />
            )}
          </div>

          {/* Sidebar Operations Panel */}
          <div className="flex flex-col gap-6">
            {/* Staff roster section */}
            {rota && (
              <EmployeeManager
                employees={rota.employees}
                hoursByEmployee={hoursByEmployee}
                onAddEmployee={handleAddEmployee}
                onUpdateEmployee={handleUpdateEmployee}
                onRemoveEmployee={handleRemoveEmployee}
              />
            )}

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
                    rota && handleCopy(formatWeekMessage(rota.week), 'Week copied')
                  }
                  disabled={!rota}
                >
                  <span className="flex items-center gap-2">
                    <ClipboardIcon className="w-4 h-4 text-text-muted" />
                    <span>Copy WhatsApp Message</span>
                  </span>
                  <span className="tag text-[9px] py-0.5 px-1.5 bg-accent-soft text-accent border border-accent/15 rounded font-black tracking-wider">All week</span>
                </button>

                <button
                  type="button"
                  className="soft-panel flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-text transition hover:border-accent hover:bg-panel shadow-sm cursor-pointer border-red-500/20 hover:border-red-500/40"
                  onClick={handleResetToDefault}
                  disabled={!rota}
                >
                  <span className="flex items-center gap-2">
                    <ResetIcon className="w-4 h-4 text-red-500/80" />
                    <span className="text-red-500/95 font-bold">Reset to Default Rota</span>
                  </span>
                  <span className="tag text-[9px] py-0.5 px-1.5 bg-red-500/10 text-red-500 border border-red-500/15 rounded font-black tracking-wider">Templated</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <DeveloperFooter />
    </div>
  )
}

export default App
