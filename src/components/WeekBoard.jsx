import { useState } from 'react'
import { getStationColor, getStationIcon } from '../utils/stationColors'
import { parseRangeToHours } from '../utils/rotaUtils'
import {
  NotesIcon,
  SunIcon,
  ClockIcon,
  AwardIcon,
  MoonIcon,
  ClipboardIcon,
  UserIcon,
  InfoIcon,
  CalendarIcon,
  TrashIcon,
  PlusIcon,
} from './Icons'

const WeekBoard = ({
  week,
  employees,
  stations,
  onUpdateDayNotes,
  onCopyDay,
  onAddCellAssignment,
  onUpdateCellAssignment,
  onRemoveCellAssignment,
}) => {
  // Modal editor cell state: { employee: 'Name', dayId: 'monday' }
  const [editingCell, setEditingCell] = useState(null)
  
  // Tabbed operations notes state
  const [showNotes, setShowNotes] = useState(false)
  const [activeNotesTab, setActiveNotesTab] = useState(week[0]?.id || 'monday')

  // Form states for creating a new shift inside the modal
  const [newStation, setNewStation] = useState(stations[0] || 'Prep')
  const [newTime, setNewTime] = useState('12pm-6pm')
  const [newNote, setNewNote] = useState('')

  // Retrieve active day details
  const activeNotesDay = week.find((day) => day.id === activeNotesTab)

  // Standard hour prefill presets for fast scheduling
  const timePresets = [
    { label: 'Full Shift', value: '9am-9pm' },
    { label: 'Day', value: '12pm-6pm' },
    { label: 'Evening', value: '6pm-12am' },
    { label: 'Cleaning', value: '12am-1:30am' },
    { label: 'Prep', value: '9am-12pm' },
  ]

  // Calculate total hours scheduled for a specific employee
  const calculateEmployeeHours = (employeeName) => {
    let total = 0
    week.forEach((day) => {
      day.shifts.forEach((shift) => {
        shift.entries.forEach((entry) => {
          if (entry.staff.includes(employeeName)) {
            const hours = parseRangeToHours(entry.time || shift.time || '')
            const shareCount =
              entry.station === 'Till' && entry.staff.length > 1
                ? entry.staff.length
                : 1
            total += hours / shareCount
          }
        })
      })
    })
    return total
  }

  // Get all assignments for an employee on a specific day
  const getCellAssignments = (day, employeeName) => {
    const assignments = []
    day.shifts.forEach((shift) => {
      shift.entries.forEach((entry) => {
        if (entry.staff.includes(employeeName)) {
          assignments.push({
            shiftId: shift.id,
            entryId: entry.id,
            station: entry.station,
            time: entry.time || shift.time || '',
            note: entry.note || '',
            shiftLabel: shift.label,
          })
        }
      })
    })
    return assignments
  }

  // Handle cell assignment save/add
  const handleAddAssignment = (dayId, employeeName) => {
    onAddCellAssignment(dayId, employeeName, newStation, newTime, newNote)
    // Reset inputs
    setNewNote('')
  }

  // Count active operation notes across all days
  const totalNotesCount = week.reduce((acc, day) => {
    return acc + [day.openingNote, day.prepNote, day.extraNote, day.closingNote].filter(Boolean).length
  }, 0)

  return (
    <div className="flex flex-col gap-6">
      
      {/* Daily Operations Notes Panel */}
      <div className="panel border-border/80 shadow-md">
        <button
          type="button"
          onClick={() => setShowNotes(!showNotes)}
          className="w-full flex items-center justify-between px-6 py-4 bg-panel-soft/45 hover:bg-panel-soft/75 text-left select-none transition-all duration-300"
        >
          <div className="flex items-center gap-2.5">
            <NotesIcon className="w-5 h-5 text-accent shrink-0" />
            <span className="text-sm font-extrabold text-text tracking-tight font-title sm:text-base">
              Daily Operations Notes Drawer
            </span>
            {totalNotesCount > 0 ? (
              <span className="text-[10px] bg-[var(--accent)] text-white font-black px-2.5 py-0.5 rounded-full shadow-sm whitespace-nowrap inline-flex items-center shrink-0">
                {totalNotesCount} active notes
              </span>
            ) : null}
          </div>
          <span className="text-xs text-accent font-extrabold bg-panel border border-border px-3 py-1 rounded-md shadow-sm transition-all duration-200">
            {showNotes ? '▲ Hide Drawer' : '▼ Expand Drawer'}
          </span>
        </button>

        {showNotes ? (
          <div className="p-5 flex flex-col gap-5 bg-panel/40 border-t border-border/60 animate-slide-down">
            {/* Notes Tabs */}
            <div className="flex flex-wrap gap-1.5 border-b border-border/50 pb-3">
              {week.map((day) => {
                const dayNotesCount = [day.openingNote, day.prepNote, day.extraNote, day.closingNote].filter(Boolean).length
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => setActiveNotesTab(day.id)}
                    className={`px-3.5 py-2 text-xs font-black rounded-lg border transition-all duration-300 cursor-pointer ${
                      activeNotesTab === day.id
                        ? 'btn-primary border-transparent text-white'
                        : 'border-border/65 text-text-muted hover:border-accent/40 hover:text-accent bg-panel shadow-sm'
                    }`}
                  >
                    {day.name}
                    {dayNotesCount > 0 ? (
                      <span className={`ml-2 text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                        activeNotesTab === day.id ? 'bg-white text-primary' : 'bg-accent text-white'
                      }`}>
                        {dayNotesCount}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>

            {/* Active Tab Note Inputs */}
            {activeNotesDay ? (
              <div className="grid gap-5 sm:grid-cols-2 text-xs">
                <div className="flex flex-col gap-2">
                  <label className="font-extrabold text-text-muted uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <SunIcon className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span>Opening Note</span>
                  </label>
                  <textarea
                    value={activeNotesDay.openingNote}
                    onChange={(event) =>
                      onUpdateDayNotes(activeNotesDay.id, { openingNote: event.target.value })
                    }
                    placeholder="e.g. 12pm opening please arrive at 11:50am. Ensure your stations are ready."
                    rows={2.5}
                    className="input min-h-[70px] resize-none"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-extrabold text-text-muted uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <ClockIcon className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span>Prep Note</span>
                  </label>
                  <textarea
                    value={activeNotesDay.prepNote}
                    onChange={(event) =>
                      onUpdateDayNotes(activeNotesDay.id, { prepNote: event.target.value })
                    }
                    placeholder="e.g. Prep team please ensure burger station top up is in fridge."
                    rows={2.5}
                    className="input min-h-[70px] resize-none"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-extrabold text-text-muted uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <AwardIcon className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span>Extra Notes</span>
                  </label>
                  <textarea
                    value={activeNotesDay.extraNote}
                    onChange={(event) =>
                      onUpdateDayNotes(activeNotesDay.id, { extraNote: event.target.value })
                    }
                    placeholder="e.g. After 6pm if station needs anything please tell Wajahat."
                    rows={2.5}
                    className="input min-h-[70px] resize-none"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-extrabold text-text-muted uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <MoonIcon className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span>Closing Note</span>
                  </label>
                  <textarea
                    value={activeNotesDay.closingNote}
                    onChange={(event) =>
                      onUpdateDayNotes(activeNotesDay.id, { closingNote: event.target.value })
                    }
                    placeholder="e.g. Sheram if staff are free after 11 get them to clean and help cleaning team till 12."
                    rows={2.5}
                    className="input min-h-[70px] resize-none"
                  />
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Horizontally Scrollable Matrix Calendar Grid */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-panel shadow-md">
        <table className="w-full min-w-[1170px] sm:min-w-[1290px] border-collapse text-left text-xs">
          <thead>
            <tr className="bg-[#28211E] dark:bg-[#1C1715] text-white border-b border-border/80 select-none">
              <th className="px-2.5 sm:px-5 py-4 font-black text-white font-title text-xs sm:text-sm tracking-tight border-r border-border/60 sticky left-0 bg-[#28211E] dark:bg-[#1C1715] backdrop-blur z-10 w-[120px] min-w-[120px] max-w-[120px] sm:w-[170px] sm:min-w-[170px] sm:max-w-[170px] shadow-[4px_0_12px_-4px_rgba(0,0,0,0.08)]">
                Team Member
              </th>
              {week.map((day) => (
                <th key={day.id} className="px-2.5 sm:px-5 py-4 border-r border-border/40 text-center relative group/dayheader text-white w-[150px] min-w-[150px] sm:w-[160px] sm:min-w-[160px]">
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-black text-white font-title text-base tracking-tight">{day.name}</span>
                    <button
                      type="button"
                      onClick={() => onCopyDay(day)}
                      className="inline-flex items-center gap-1 mt-1 text-[9.5px] bg-white/10 hover:bg-accent border border-white/20 hover:border-transparent text-white font-black px-2.5 py-0.5 rounded shadow-sm transition-all duration-200 cursor-pointer"
                      title={`Copy ${day.name} schedule message`}
                    >
                      <ClipboardIcon className="w-2.5 h-2.5" />
                      <span>Copy Day</span>
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {employees.map((member) => {
              const weeklyHours = calculateEmployeeHours(member)
              
              return (
                <tr
                  key={member}
                  className="hover:bg-panel-soft/10 transition-all duration-150 group/row"
                >
                  {/* Sticky left Employee Column */}
                  <td className="px-2.5 sm:px-5 py-4 border-r border-border/60 sticky left-0 bg-panel shadow-[5px_0_12px_-6px_rgba(0,0,0,0.04)] z-10 w-[120px] min-w-[120px] max-w-[120px] sm:w-[170px] sm:min-w-[170px] sm:max-w-[170px]">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="font-extrabold text-text text-xs sm:text-sm truncate max-w-[55px] sm:max-w-[100px] tracking-tight flex items-center gap-1" title={member}>
                        <UserIcon className="w-3 h-3 text-text-muted/70 shrink-0" />
                        <span>{member}</span>
                      </span>
                      <span className="tag text-[9px] sm:text-[9.5px] font-black px-1.5 sm:px-2 py-0.5 bg-accent-soft text-accent border border-accent/15 rounded-md shrink-0 shadow-sm">
                        {weeklyHours.toFixed(1)}h
                      </span>
                    </div>
                  </td>

                  {/* Day cells (Mon - Sun) */}
                  {week.map((day) => {
                    const cellAssignments = getCellAssignments(day, member)
                    
                    return (
                      <td
                        key={`${member}-${day.id}`}
                        onClick={() => setEditingCell({ employee: member, dayId: day.id })}
                        className="px-2.5 sm:px-4 py-4 border-r border-border/30 hover:bg-[rgba(var(--accent-rgb),0.02)] transition-all duration-300 cursor-pointer relative group/cell w-[150px] min-w-[150px] sm:w-[160px] sm:min-w-[160px]"
                        style={{ verticalAlign: 'top', minHeight: '110px' }}
                      >
                        <div className="flex flex-col gap-2 min-h-[75px] justify-between h-full">
                          
                          {cellAssignments.length > 0 ? (
                            <div className="flex flex-col gap-2">
                              {cellAssignments.map((assignment) => (
                                <div
                                  key={assignment.entryId}
                                  className="order-ticket relative rounded-xl border border-border/80 bg-panel-soft/20 p-2.5 text-[10.5px] hover:border-accent/40 shadow-sm transition-all duration-200"
                                  style={{
                                    borderLeft: `4px solid ${getStationColor(assignment.station)}`,
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingCell({ employee: member, dayId: day.id })
                                  }}
                                >
                                  <div className="flex items-center gap-1.5 font-extrabold text-text mb-0.5 truncate">
                                    <span className="text-xs">{getStationIcon(assignment.station)}</span>
                                    <span className="truncate">{assignment.station}</span>
                                  </div>
                                  <div className="font-extrabold text-text-muted text-[10px] flex items-center gap-1">
                                    <ClockIcon className="w-3 h-3 text-text-muted shrink-0" />
                                    <span>{assignment.time}</span>
                                  </div>
                                  {assignment.note ? (
                                    <div className="text-[9.5px] italic text-accent font-bold truncate mt-1 flex items-center gap-0.5">
                                      <InfoIcon className="w-2.5 h-2.5 text-accent shrink-0" />
                                      <span>{assignment.note}</span>
                                    </div>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          ) : (
                            /* Spacious Blank Cell State */
                            <div className="flex-grow flex items-center justify-center py-4">
                              <span className="text-[10px] font-bold text-muted/40 uppercase tracking-widest group-hover/cell:hidden">Off</span>
                            </div>
                          )}

                          {/* Interactive Trigger Button */}
                          <div className="h-7 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-all duration-300">
                            <span className="text-[10.5px] font-black text-accent bg-accent-soft hover:bg-accent hover:text-white px-2.5 py-1 rounded-md border border-accent/25 shadow-sm transition-all duration-150 transform hover:scale-105 flex items-center gap-1">
                              <PlusIcon className="w-3 h-3 shrink-0" />
                              <span>{cellAssignments.length === 0 ? 'Schedule' : 'Split Role'}</span>
                            </span>
                          </div>

                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Matrix Info/Guidelines */}
      <div className="text-xs text-text-muted flex items-center gap-1.5 mt-1 px-1.5 font-medium">
        <InfoIcon className="w-3.5 h-3.5 text-accent shrink-0" />
        <span>Click any cell to manage assignments, create split shifts, specify timings, and attach shift notes.</span>
      </div>

      {/* Glassmorphic Schedule Modal Overlay */}
      {editingCell ? (() => {
        const day = week.find((d) => d.id === editingCell.dayId)
        const assignments = day ? getCellAssignments(day, editingCell.employee) : []
        
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/45 dark:bg-black/70 backdrop-blur-[6px] transition-all">
            <div className="panel bg-panel border-accent/20 max-w-md sm:max-w-lg w-full p-4 sm:p-6 shadow-2xl relative flex flex-col gap-3.5 sm:gap-5 max-h-[85vh] overflow-y-auto z-50 animate-scale-up">
              
              {/* Header */}
              <div className="flex items-start justify-between border-b border-border/60 pb-3 sm:pb-3.5">
                <div>
                  <h3 className="text-lg sm:text-xl font-black tracking-tight text-text font-title flex items-center gap-2">
                    <CalendarIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-accent shrink-0" />
                    <span>Manage Schedule</span>
                  </h3>
                  <p className="text-[11px] sm:text-xs text-text-muted font-bold mt-1 sm:mt-1.5 flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="bg-accent-soft text-accent px-1.5 sm:px-2 py-0.5 rounded font-black flex items-center gap-1">
                      <UserIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-accent shrink-0" />
                      <span>{editingCell.employee}</span>
                    </span>
                    <span className="text-border">|</span>
                    <span className="bg-panel-soft text-text px-1.5 sm:px-2 py-0.5 rounded font-black flex items-center gap-1">
                      <CalendarIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-text-muted shrink-0" />
                      <span>{day?.name}</span>
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingCell(null)}
                  className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-text-muted hover:text-text hover:bg-panel-soft/80 border border-border/60 transition-all text-xs font-black cursor-pointer shadow-sm"
                >
                  ✕ Close
                </button>
              </div>

              {/* List of Active Roles for this day */}
              <div className="flex flex-col gap-2.5 sm:gap-3">
                <h4 className="text-[9.5px] sm:text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border/40 pb-1.5 sm:pb-2">
                  Active Scheduled Roles ({assignments.length})
                </h4>

                {assignments.length === 0 ? (
                  <p className="text-xs text-text-muted/80 italic text-center py-5 sm:py-6 bg-panel-soft/30 rounded-xl border border-dashed border-border">
                    Not scheduled to work on this day. Use the form below to assign shifts.
                  </p>
                ) : null}

                <div className="flex flex-col gap-2.5 sm:gap-3">
                  {assignments.map((assignment, index) => (
                    <div
                      key={assignment.entryId}
                      className="p-3 sm:p-4 rounded-xl border border-border bg-panel-soft/40 flex flex-col gap-2.5 sm:gap-3 shadow-sm relative transition-all hover:bg-panel"
                      style={{
                        borderLeft: `4px solid ${getStationColor(assignment.station)}`,
                      }}
                    >
                      <div className="flex items-center justify-between border-b border-border-soft pb-1.5 sm:pb-2">
                        <span className="text-xs font-black text-text flex items-center gap-1.5">
                          <span className="text-xs">{getStationIcon(assignment.station)}</span>
                          Role #{index + 1} ({assignment.station})
                        </span>
                        
                        <button
                          type="button"
                          onClick={() => {
                            onRemoveCellAssignment(day.id, assignment.shiftId, assignment.entryId, editingCell.employee)
                          }}
                          className="text-[10px] sm:text-[10.5px] text-primary hover:bg-primary/5 hover:border-primary/20 border border-transparent px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg font-black transition-all cursor-pointer shadow-sm flex items-center gap-1"
                        >
                          <TrashIcon className="w-3 h-3 text-primary shrink-0" />
                          <span>Remove Role</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="flex flex-col gap-1">
                          <span className="text-text-muted font-extrabold uppercase tracking-wider text-[9px] sm:text-[10px]">Station</span>
                          <select
                            value={assignment.station}
                            onChange={(e) => {
                              onUpdateCellAssignment(
                                day.id,
                                assignment.shiftId,
                                assignment.entryId,
                                editingCell.employee,
                                { station: e.target.value }
                              )
                            }}
                            className="input py-1 px-1.5 text-xs bg-panel shadow-sm cursor-pointer border font-bold"
                          >
                            {stations.map((station) => (
                              <option key={station} value={station}>
                                {getStationIcon(station)} {station}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-col gap-1">
                          <span className="text-text-muted font-extrabold uppercase tracking-wider text-[9px] sm:text-[10px]">Hours</span>
                          <input
                            value={assignment.time}
                            onChange={(e) => {
                              onUpdateCellAssignment(
                                day.id,
                                assignment.shiftId,
                                assignment.entryId,
                                editingCell.employee,
                                { time: e.target.value }
                              )
                            }}
                            className="input py-1 px-1.5 text-xs bg-panel shadow-sm font-black border"
                          />
                        </div>

                        <div className="flex flex-col gap-1 sm:col-span-2">
                          <span className="text-text-muted font-extrabold uppercase tracking-wider text-[9px] sm:text-[10px]">Note</span>
                          <input
                            value={assignment.note}
                            onChange={(e) => {
                              onUpdateCellAssignment(
                                day.id,
                                assignment.shiftId,
                                assignment.entryId,
                                editingCell.employee,
                                { note: e.target.value }
                              )
                            }}
                            className="input py-1 px-1.5 text-xs bg-panel shadow-sm border font-medium"
                            placeholder="Optional role note (e.g. registers, kitchen cleaning)..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form to Schedule a new/split shift role */}
              <div className="border-t border-border/60 pt-3 sm:pt-4 flex flex-col gap-3 sm:gap-4">
                <h4 className="text-[9.5px] sm:text-[10px] font-black text-text-muted uppercase tracking-widest">
                  + Add New Assignment / Split Shift
                </h4>

                <div className="grid grid-cols-2 gap-2.5 sm:gap-3 text-xs">
                  <div className="flex flex-col gap-1">
                    <span className="text-text-muted font-extrabold uppercase tracking-wider text-[9px] sm:text-[10px]">Station Role</span>
                    <select
                      value={newStation}
                      onChange={(e) => setNewStation(e.target.value)}
                      className="input py-1.5 px-2 text-xs bg-panel cursor-pointer shadow-sm border font-bold"
                    >
                      {stations.map((station) => (
                        <option key={station} value={station}>
                          {getStationIcon(station)} {station}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-text-muted font-extrabold uppercase tracking-wider text-[9px] sm:text-[10px]">Shift Hours / Timing</span>
                    <input
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="input py-1.5 px-2 text-xs bg-panel shadow-sm border font-black"
                      placeholder="e.g. 12pm-6pm, 9am-9pm"
                    />
                  </div>

                  <div className="flex flex-col gap-1 col-span-2">
                    <span className="text-text-muted font-extrabold uppercase tracking-wider text-[9px] sm:text-[10px]">Timing Presets</span>
                    {/* Time presets quick action pills in a horizontally scrollable container */}
                    <div className="flex flex-nowrap overflow-x-auto gap-1.5 pb-1 mt-0.5 scrollbar-none">
                      {timePresets.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setNewTime(preset.value)}
                          className="px-2 sm:px-2.5 py-1 bg-panel-soft hover:bg-accent-soft text-[9.5px] font-black border border-border hover:border-accent/40 rounded-lg text-text hover:text-accent shadow-sm transition-all cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap"
                        >
                          <ClockIcon className="w-2.5 h-2.5 shrink-0" />
                          <span>{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 col-span-2">
                    <span className="text-text-muted font-extrabold uppercase tracking-wider text-[9px] sm:text-[10px]">Optional Note</span>
                    <input
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="input py-1.5 px-2 text-xs bg-panel shadow-sm border font-medium"
                      placeholder="e.g. keyholder, registers, top up..."
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleAddAssignment(day.id, editingCell.employee)}
                  className="btn btn-primary text-xs w-full py-2.5 flex items-center justify-center gap-2 mt-1 sm:mt-1.5 shadow-md"
                >
                  <PlusIcon className="w-4 h-4 text-white shrink-0" />
                  <span>Add Assignment to Schedule</span>
                </button>
              </div>

              {/* Footer Actions */}
              <div className="border-t border-border/50 pt-3 sm:pt-3.5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setEditingCell(null)}
                  className="btn text-xs px-4 sm:px-5 py-1.5 sm:py-2 font-black cursor-pointer"
                >
                  Done & Close
                </button>
              </div>

            </div>
          </div>
        )
      })() : null}

    </div>
  )
}

export default WeekBoard
