import { isFulfilled, type Middleware } from "@reduxjs/toolkit"
import toast from "react-hot-toast"

interface BaseQueryMeta {
  show_success?: boolean
  message?: string
}

interface SuccessPayload {
  message?: string
}

const successLogger: Middleware = () => next => action => {
  if (isFulfilled(action)) {
    const meta = action.meta as { baseQueryMeta?: BaseQueryMeta } | undefined
    const payload = action.payload as SuccessPayload | undefined

    const showSuccess = meta?.baseQueryMeta?.show_success ?? true
    const message =
      meta?.baseQueryMeta?.message || payload?.message

    if (showSuccess && message) {
      toast.success(message)
    }
  }

  return next(action)
}

export default successLogger
