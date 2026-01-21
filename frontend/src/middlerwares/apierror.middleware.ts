import { isRejectedWithValue, type Middleware } from "@reduxjs/toolkit"
import toast from "react-hot-toast"
import { resetData } from "../utils/Common/storage"

interface ApiErrorPayload {
  status?: number
  data?: {
    message?: string
  }
}

const errorLogger: Middleware = () => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    const payload = action.payload as ApiErrorPayload | undefined
    const status = payload?.status

    const errorMessage =
      payload?.data?.message ||
      action.error?.message ||
      "Something went wrong"

    if (status === 401 && payload?.data?.message?.includes('Token')) {
      resetData()

      toast.error(errorMessage)

      setTimeout(() => {
        window.location.href = "/login"
      }, 2000)

      return
    }

    toast.error(errorMessage)
  }

  return next(action)
}

export default errorLogger
