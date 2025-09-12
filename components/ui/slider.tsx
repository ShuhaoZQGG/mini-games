import * as React from "react"

interface SliderProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number[]
  onValueChange?: (value: number[]) => void
  max?: number
  min?: number
  step?: number
  disabled?: boolean
}

export function Slider({
  value,
  onValueChange,
  max = 100,
  min = 0,
  step = 1,
  disabled = false,
  className = "",
  ...props
}: SliderProps) {
  const percentage = ((value[0] - min) / (max - min)) * 100

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value)
    onValueChange?.([newValue])
  }

  return (
    <div className={`relative ${className}`} {...props}>
      <div className="relative h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className="absolute h-full rounded-full bg-blue-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value[0]}
        onChange={handleChange}
        disabled={disabled}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />
    </div>
  )
}