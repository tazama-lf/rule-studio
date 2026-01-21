import { useCallback, useState } from "react"

type UseToggleReturn = [boolean, () => void]

const useToggle = (initial: boolean = false): UseToggleReturn => {
  const [open, setOpen] = useState<boolean>(initial)

  const toggle = useCallback(() => {
    setOpen(prev => !prev)
  }, [])

  return [open, toggle]
}

export default useToggle
