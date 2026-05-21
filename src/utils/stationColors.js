// Curated Culinary Color Palette for a High-End Burger & Grill Restaurant (Smoke & Pepper)
const stationColorMap = {
  Supervisor: '#5C2522',          // Deep Mahogany
  Coordination: '#6E8268',        // Warm Sage
  'Burger Station': '#C24D38',    // Terracotta Burnt Orange
  'Loaded Station': '#D4AF37',    // Melted Cheddar Gold
  'Hot Plate': '#E0533C',         // Sizzling Crimson
  Grill: '#3A3533',               // Seared Charcoal
  Washing: '#4A8E8B',             // Clean Deep Teal
  Till: '#A87B60',                // Copper Penny Bronze
  'Delivery Organising': '#E0A83C', // Honey Mustard Amber
  Fries: '#E6B84A',               // Crispy Potato Gold
  Breading: '#9E8B7A',            // Raw Almond Tan
  Cleaning: '#5B8C7A',            // Forest Pine Mint
  'Mopping & Brush': '#6B6661',   // Ash Smudge Grey
  Prep: '#B03A2E',                // Spicy Red Pepper
}

const fallbackColors = [
  '#5C2522', '#6E8268', '#C24D38', '#D4AF37', '#E0533C',
  '#3A3533', '#4A8E8B', '#A87B60', '#E0A83C', '#E6B84A',
  '#9E8B7A', '#5B8C7A', '#6B6661', '#B03A2E'
]

const iconMap = {
  Supervisor: '⭐',
  Coordination: '🧭',
  'Burger Station': '🍔',
  'Loaded Station': '🧀',
  'Hot Plate': '🔥',
  Grill: '🥩',
  Washing: '🧽',
  Till: '💳',
  'Delivery Organising': '🛵',
  Fries: '🍟',
  Breading: '🧂',
  Cleaning: '🧼',
  'Mopping & Brush': '🧹',
  Prep: '🥣',
}

export const getStationColor = (station) => {
  if (!station) return fallbackColors[0]
  return stationColorMap[station] || fallbackColors[Object.keys(stationColorMap).indexOf(station) % fallbackColors.length] || fallbackColors[0]
}

export const getStationIcon = (station) => {
  return iconMap[station] || '🍽️'
}
