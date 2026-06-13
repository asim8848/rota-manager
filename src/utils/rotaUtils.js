export const STORAGE_KEY = 'rota-manager-data'
export const THEME_KEY = 'rota-manager-theme'

export const createId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const parseTime = (value) => {
  if (!value) return null
  const match = value.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i)
  if (!match) return null
  let hours = Number(match[1]) % 12
  const minutes = Number(match[2] || 0)
  const period = match[3].toLowerCase()
  if (period === 'pm') {
    hours += 12
  }
  return hours * 60 + minutes
}

export const parseRangeToHours = (range) => {
  if (!range || !range.includes('-')) return 0
  const [startRaw, endRaw] = range.split('-').map((part) => part.trim())
  const startMinutes = parseTime(startRaw)
  const endMinutes = parseTime(endRaw)
  if (startMinutes == null || endMinutes == null) return 0
  let diff = endMinutes - startMinutes
  if (diff <= 0) {
    diff += 24 * 60
  }
  return diff / 60
}

const formatTimeShort = (time) => time.replace(/\s*(am|pm)/gi, '')

export const formatTimeRange = (range) => {
  if (!range || !range.includes('-')) return range || ''
  const [startRaw, endRaw] = range.split('-').map((part) => part.trim())
  const formatted = `${formatTimeShort(startRaw)}-${formatTimeShort(endRaw)}`
  return formatted.replace(/\s+/g, '')
}

export const getEntryHours = (entry, shift) => {
  const range = entry.time || shift.time || ''
  return parseRangeToHours(range)
}

export const getMergedIntervalsHours = (ranges) => {
  const intervals = []
  ranges.forEach((range) => {
    if (!range || !range.includes('-')) return
    const [startRaw, endRaw] = range.split('-').map((part) => part.trim())
    let start = parseTime(startRaw)
    let end = parseTime(endRaw)
    if (start == null || end == null) return
    if (end <= start) {
      end += 24 * 60
    }
    intervals.push([start, end])
  })

  if (intervals.length === 0) return 0

  // Sort intervals by start time
  intervals.sort((a, b) => a[0] - b[0])

  // Merge overlapping intervals
  const merged = [intervals[0]]
  for (let i = 1; i < intervals.length; i++) {
    const prev = merged[merged.length - 1]
    const curr = intervals[i]
    if (curr[0] <= prev[1]) {
      prev[1] = Math.max(prev[1], curr[1])
    } else {
      merged.push(curr)
    }
  }

  // Calculate total duration in hours
  const totalMinutes = merged.reduce((sum, interval) => sum + (interval[1] - interval[0]), 0)
  return totalMinutes / 60
}

export const calculateEmployeeHours = (week, employees) => {
  const totals = employees.reduce((acc, employee) => {
    acc[employee] = 0
    return acc
  }, {})

  week.forEach((day) => {
    // Group time ranges by employee for this day
    const employeeDayRanges = employees.reduce((acc, employee) => {
      acc[employee] = []
      return acc
    }, {})

    day.shifts.forEach((shift) => {
      shift.entries.forEach((entry) => {
        const staffList = entry.staff || []
        if (staffList.length === 0) return
        const range = entry.time || shift.time || ''
        staffList.forEach((member) => {
          if (employeeDayRanges[member] != null) {
            employeeDayRanges[member].push(range)
          }
        })
      })
    })

    // Merge intervals for each employee for this day and add to totals
    employees.forEach((employee) => {
      const ranges = employeeDayRanges[employee]
      const dayHours = getMergedIntervalsHours(ranges)
      totals[employee] += dayHours
    })
  })

  return totals
}

export const getTotalHours = (hoursByEmployee) => {
  return Object.values(hoursByEmployee).reduce((sum, hours) => sum + hours, 0)
}

export const getMostWorkingEmployee = (hoursByEmployee) => {
  const entries = Object.entries(hoursByEmployee)
  if (!entries.length) return { label: 'None', hours: 0 }
  const [name, hours] = entries.reduce((max, current) =>
    current[1] > max[1] ? current : max,
  )
  return { label: name, hours }
}

export const getLowestWorkingEmployees = (hoursByEmployee) => {
  const entries = Object.entries(hoursByEmployee)
  if (!entries.length) return []
  const minHours = Math.min(...entries.map((entry) => entry[1]))
  return entries
    .filter((entry) => entry[1] === minHours)
    .map((entry) => ({ name: entry[0], hours: entry[1] }))
}

const formatWhatsAppTime = (time) => {
  if (!time) return ''
  if (time.toLowerCase().includes('to')) return time
  return time
    .replace(/\s*(am|pm)/gi, '')
    .replace('-', ' to ')
}

const formatWhatsAppNotes = (noteText) => {
  if (!noteText) return []
  return noteText.split('\n').map((line) => {
    const trimmed = line.trim()
    if (!trimmed) return ''
    
    let cleaned = trimmed
      .replace(/^\*+/, '')
      .replace(/\*+$/, '')
      .trim()
    
    if (cleaned.toLowerCase() === 'notes') {
      return '*Notes*'
    }
    
    cleaned = cleaned.replace(/^(\d+\.\s*)\*/, '$1')
    return `_${cleaned}_`
  })
}

const formatEntryLine = (entry, shiftLabel = '') => {
  const staff = (entry.staff || []).join(' / ') || 'Unassigned'
  const isPrepOrCleaning = shiftLabel.toLowerCase().includes('prep') || shiftLabel.toLowerCase().includes('cleaning')
  
  if (isPrepOrCleaning) {
    const time = entry.time ? ` - ${formatWhatsAppTime(entry.time)}` : ''
    const note = entry.note ? ` (${entry.note})` : ''
    return `${staff}${time}${note}`
  } else {
    const time = entry.time ? ` _(${formatWhatsAppTime(entry.time)})_` : ''
    const note = entry.note ? ` _(${entry.note})_` : ''
    return `*${entry.station}*: ${staff}${time}${note}`
  }
}

export const formatDayMessage = (day) => {
  const lines = [`*${day.name.toUpperCase()} ROSTER*`, '']
  day.shifts.forEach((shift, index) => {
    const hasDigits = /\d/.test(shift.label)
    const labelTime = shift.time && !hasDigits
      ? `${shift.label}: ${formatTimeRange(shift.time)}`
      : shift.label
    
    lines.push(`*${labelTime}*`)
    if (shift.entries.length === 0) {
      lines.push('No assignments yet')
    } else {
      shift.entries.forEach((entry) => lines.push(formatEntryLine(entry, shift.label)))
    }
    lines.push('')

    if (index === 0 && day.openingNote) {
      const dayShift = day.shifts[1]
      const openingTime = dayShift ? dayShift.label.replace(/\s*Shift/i, '') : '12pm'
      lines.push(`*${openingTime} Opening*`)
      lines.push(...formatWhatsAppNotes(day.openingNote))
      lines.push('')
    }
    if (index === 1 && day.prepNote) {
      lines.push(...formatWhatsAppNotes(day.prepNote))
      lines.push('')
    }
    if (index === 2 && day.extraNote) {
      lines.push(...formatWhatsAppNotes(day.extraNote))
      lines.push('')
    }
  })

  if (day.closingNote) {
    lines.push(...formatWhatsAppNotes(day.closingNote))
  }

  return lines.join('\n').trim()
}

export const formatWeekMessage = (week) => {
  return week.map(formatDayMessage).join('\n\n')
}

export const downloadTextFile = (content, filename) => {
  const blob = new Blob([content], { type: 'text/plain' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

export const getWeekIdentifier = (date = new Date()) => {
  const target = new Date(date.valueOf())
  const dayNr = (date.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNr + 3)
  const firstThursday = target.valueOf()
  target.setMonth(0, 1)
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7))
  }
  const weekNum = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000)
  return `${target.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

export const getWeekDateRange = (weekId) => {
  if (!weekId || !weekId.includes('-W')) return ''
  const [yearStr, weekStr] = weekId.split('-W')
  const year = parseInt(yearStr, 10)
  const weekNum = parseInt(weekStr, 10)
  
  const jan4 = new Date(year, 0, 4)
  const dayOfJan4 = (jan4.getDay() + 6) % 7
  const mondayOfW1 = new Date(jan4.getTime() - dayOfJan4 * 24 * 60 * 60 * 1000)
  
  const targetMonday = new Date(mondayOfW1.getTime() + (weekNum - 1) * 7 * 24 * 60 * 60 * 1000)
  const targetSunday = new Date(targetMonday.getTime() + 6 * 24 * 60 * 60 * 1000)
  
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  
  return `${formatDate(targetMonday)} - ${formatDate(targetSunday)}, ${year}`
}

export const getOffsetWeekId = (weekId, offset) => {
  if (!weekId || !weekId.includes('-W')) return weekId
  const [yearStr, weekStr] = weekId.split('-W')
  const year = parseInt(yearStr, 10)
  const weekNum = parseInt(weekStr, 10)
  
  const jan4 = new Date(year, 0, 4)
  const dayOfJan4 = (jan4.getDay() + 6) % 7
  const mondayOfW1 = new Date(jan4.getTime() - dayOfJan4 * 24 * 60 * 60 * 1000)
  
  const targetMonday = new Date(mondayOfW1.getTime() + (weekNum - 1) * 7 * 24 * 60 * 60 * 1000)
  const offsetMonday = new Date(targetMonday.getTime() + offset * 7 * 24 * 60 * 60 * 1000)
  
  return getWeekIdentifier(offsetMonday)
}

export const convert12hTo24h = (time12) => {
  if (!time12) return '12:00'
  const match = time12.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i)
  if (!match) return '12:00'
  let hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2] || '0', 10)
  const period = match[3].toLowerCase()
  if (period === 'pm' && hours < 12) hours += 12
  if (period === 'am' && hours === 12) hours = 0
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export const convert24hTo12h = (time24) => {
  if (!time24) return ''
  const [hoursStr, minutesStr] = time24.split(':')
  let hours = parseInt(hoursStr, 10)
  const minutes = parseInt(minutesStr, 10)
  const period = hours >= 12 ? 'pm' : 'am'
  hours = hours % 12
  if (hours === 0) hours = 12
  const minPart = minutes === 0 ? '' : `:${String(minutes).padStart(2, '0')}`
  return `${hours}${minPart}${period}`
}


