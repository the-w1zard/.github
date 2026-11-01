import { endOfWeek, isSameDay, isWithinInterval, startOfWeek } from "date-fns"
import { useEffect, useState } from "#sauron"

// @dev app/components/midgardr/hooks/use-current-time-indicator.tsx:use-current-time-indicator

const StartHour = 0
const EndHour = 24

type UseCurrentTimeIndicatorProps = {
  currentDate: Date
  view: "day" | "week"
  startHour?: number
  endHour?: number
}

export function useCurrentTimeIndicator({
  currentDate,
  view,
  startHour = StartHour,
  endHour = EndHour,
}: UseCurrentTimeIndicatorProps) {
  const [currentTimePosition, setCurrentTimePosition] = useState<number>(0)
  const [currentTimeVisible, setCurrentTimeVisible] = useState<boolean>(false)

  useEffect(() => {
    const calculateTimePosition = () => {
      const now = new Date()
      const hours = now.getHours()
      const minutes = now.getMinutes()
      const totalMinutes = (hours - startHour) * 60 + minutes
      const dayStartMinutes = 0
      const dayEndMinutes = (endHour - startHour) * 60

      const position =
        ((totalMinutes - dayStartMinutes) / (dayEndMinutes - dayStartMinutes)) *
        100

      let isCurrentTimeVisible = false

      if (view === "day") {
        isCurrentTimeVisible = isSameDay(now, currentDate)
      } else if (view === "week") {
        const startOfWeekDate = startOfWeek(currentDate, { weekStartsOn: 0 })
        const endOfWeekDate = endOfWeek(currentDate, { weekStartsOn: 0 })
        isCurrentTimeVisible = isWithinInterval(now, {
          end: endOfWeekDate,
          start: startOfWeekDate,
        })
      }

      setCurrentTimePosition(position)
      setCurrentTimeVisible(isCurrentTimeVisible)
    }

    calculateTimePosition()

    const interval = setInterval(calculateTimePosition, 60000)

    return () => clearInterval(interval)
  }, [currentDate, view, startHour, endHour])

  return { currentTimePosition, currentTimeVisible }
}

 