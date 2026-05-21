import { useState } from 'react'
import { UserIcon, PlusIcon, TrashIcon } from './Icons'

const EmployeeManager = ({
  employees,
  hoursByEmployee,
  onAddEmployee,
  onUpdateEmployee,
  onRemoveEmployee,
}) => {
  const [newName, setNewName] = useState('')

  const handleAdd = (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    onAddEmployee(newName)
    setNewName('')
  }

  return (
    <div className="panel p-6 flex flex-col gap-5">
      <div>
        <h3 className="text-lg font-black tracking-tight text-text font-title">Staff Roster</h3>
        <p className="text-xs text-text-muted mt-0.5">Manage culinary team members and track weekly scheduled hours.</p>
      </div>

      {/* Add Employee Form */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder="Add staff member name..."
          className="input flex-grow border font-bold"
        />
        <button
          type="submit"
          className="btn btn-primary text-xs px-4 py-2.5 flex items-center gap-1.5 shadow-md hover:shadow-lg cursor-pointer shrink-0 font-black"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </form>

      {/* Employee List */}
      <div className="flex flex-col gap-2.5 max-h-[350px] overflow-y-auto pr-1">
        {employees.length === 0 ? (
          <div className="text-center py-8 px-4 text-xs text-text-muted border border-dashed border-border/80 rounded-xl bg-panel-soft/20 flex flex-col items-center justify-center gap-1.5">
            <UserIcon className="w-6 h-6 text-text-muted/65" />
            <span>No staff members added yet. Add a name above to begin scheduling.</span>
          </div>
        ) : null}

        {employees.map((employee, index) => {
          const hours = hoursByEmployee[employee] || 0
          const pct = Math.min((hours / 40) * 100, 100)
          
          let barColor = 'bg-[#D44B27]' // Orange under-scheduled <15h
          if (hours >= 15 && hours <= 35) {
            barColor = 'bg-[#1E7E56]' // Sage balanced
          } else if (hours > 35) {
            barColor = 'bg-primary' // Red high workload
          }

          return (
            <div
              key={employee}
              className="flex flex-col gap-2 rounded-xl border border-border bg-panel-soft/30 px-3.5 py-3 hover:border-accent/35 hover:bg-panel transition-all duration-300 group/emp"
            >
              <div className="flex items-center justify-between gap-3">
                {/* Inline Name Input Edit State */}
                <div className="flex items-center gap-2.5 flex-grow min-w-0">
                  <span className="text-sm bg-panel border border-border shadow-sm w-7 h-7 rounded-full flex items-center justify-center select-none group-hover/emp:border-accent/30 transition-colors text-text-muted shrink-0">
                    <UserIcon className="w-3.5 h-3.5" />
                  </span>
                  <input
                    value={employee}
                    onChange={(event) =>
                      onUpdateEmployee(index, event.target.value)
                    }
                    className="w-full bg-transparent text-sm font-extrabold text-text border-b border-transparent hover:border-border/40 focus:border-accent focus:ring-0 outline-none pb-0.5 transition-all duration-150 truncate"
                    title="Double click to edit staff name"
                    placeholder="Staff name"
                  />
                </div>

                {/* Total Hours Badge and Clean Delete Icon */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="tag text-[9.5px] py-0.5 px-2 bg-accent-soft text-accent border border-accent/15 rounded-md font-black shadow-sm select-none">
                    {hours.toFixed(1)}h
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveEmployee(employee)}
                    className="p-1.5 rounded-lg text-text-muted/60 hover:text-primary hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all duration-200 cursor-pointer shadow-sm shrink-0"
                    title={`Remove ${employee} from roster`}
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Dynamic workload progress bar */}
              <div className="flex items-center gap-2 pl-9.5 pr-2">
                <div className="h-1 flex-grow bg-panel-soft rounded-full overflow-hidden border border-border-soft">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>
                <span className="text-[10px] font-bold text-text-muted select-none w-10 text-right shrink-0">
                  {pct.toFixed(0)}%
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Roster Total Summary Footer */}
      {employees.length > 0 ? (
        <div className="border-t border-border/50 pt-4 flex justify-between items-center text-xs text-text-muted font-bold mt-1">
          <span>Active Kitchen Staff</span>
          <span className="text-text font-black bg-panel-soft/80 px-2.5 py-1 rounded-lg border border-border select-none">{employees.length} people</span>
        </div>
      ) : null}
    </div>
  )
}

export default EmployeeManager
