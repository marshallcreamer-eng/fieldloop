export const TASK_TYPES = [
  { value: 1, label: 'Framing' },
  { value: 2, label: 'Demo / Teardown' },
  { value: 3, label: 'Drilling / Fastening' },
  { value: 4, label: 'Cutting / Sawing' },
  { value: 5, label: 'Trimming / Edging' },
  { value: 6, label: 'Landscaping' },
  { value: 7, label: 'Finishing Work' },
  { value: 8, label: 'Other' },
]

export const CONDITIONS = [
  { key: 'cond_dusty',  label: 'Dusty' },
  { key: 'cond_hot',   label: 'Hot  90°F+' },
  { key: 'cond_cold',  label: 'Cold  <40°F' },
  { key: 'cond_wet',   label: 'Wet / Humid' },
  { key: 'cond_indoor',label: 'Indoors' },
  { key: 'cond_tight', label: 'Tight Space' },
]

export function taskLabel(score: number): string {
  return TASK_TYPES.find(t => t.value === score)?.label ?? 'Unknown'
}
