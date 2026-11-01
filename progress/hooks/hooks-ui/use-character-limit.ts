import { type ChangeEvent, useState } from "#sauron"
import { Input, Textarea, Label } from "~/components/midgardr"

// @dev app/components/midgardr/hooks/use-character-limit.tsx:use-character-limit

type UseCharacterLimitProps = {
  maxLength: number
  initialValue?: string
}

export function useCharacterLimit({
  maxLength,
  initialValue = "",
}: UseCharacterLimitProps) {
  const [value, setValue] = useState(initialValue)
  const [characterCount, setCharacterCount] = useState(initialValue.length)

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const newValue = e.target.value
    if (newValue.length <= maxLength) {
      setValue(newValue)
      setCharacterCount(newValue.length)
    }
  }

  return {
    characterCount,
    handleChange,
    maxLength,
    value,
  }
}



