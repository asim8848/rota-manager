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

export const calculateEmployeeHours = (week, employees) => {
  const totals = employees.reduce((acc, employee) => {
    acc[employee] = 0
    return acc
  }, {})

  week.forEach((day) => {
    day.shifts.forEach((shift) => {
      shift.entries.forEach((entry) => {
        const staffList = entry.staff || []
        if (staffList.length === 0) return
        const hours = getEntryHours(entry, shift)
        const shareCount =
          entry.station === 'Till' && staffList.length > 1
            ? staffList.length
            : 1
        staffList.forEach((member) => {
          if (totals[member] == null) return
          totals[member] += hours / shareCount
        })
      })
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

const formatEntryLine = (entry) => {
  const staff = (entry.staff || []).join(' / ') || 'Unassigned'
  const time = entry.time ? ` ${formatTimeRange(entry.time)}` : ''
  const note = entry.note ? ` (${entry.note})` : ''
  return `${entry.station}: ${staff}${time}${note}`
}

export const formatDayMessage = (day) => {
  const lines = [day.name, '']
  day.shifts.forEach((shift, index) => {
    const hasDigits = /\d/.test(shift.label)
    const labelTime = shift.time && !hasDigits
      ? `${shift.label} ${formatTimeRange(shift.time)}`
      : shift.label
    lines.push(labelTime)
    if (shift.entries.length === 0) {
      lines.push('No assignments yet')
    } else {
      shift.entries.forEach((entry) => lines.push(formatEntryLine(entry)))
    }
    lines.push('')

    if (index === 0 && day.openingNote) {
      lines.push(...day.openingNote.split('\n'))
      lines.push('')
    }
    if (index === 1 && day.prepNote) {
      lines.push(...day.prepNote.split('\n'))
      lines.push('')
    }
    if (index === 2 && day.extraNote) {
      lines.push(...day.extraNote.split('\n'))
      lines.push('')
    }
  })

  if (day.closingNote) {
    lines.push(...day.closingNote.split('\n'))
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
