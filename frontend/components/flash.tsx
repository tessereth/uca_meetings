import React from "react"
import Snackbar, { type SnackbarCloseReason } from "@mui/material/Snackbar"
import Alert from "@mui/material/Alert"

interface FlashMessageProps {
  open: boolean
  message: string
  severity: "success" | "error" | "warning" | "info"
  onClose: (
    event?: React.SyntheticEvent | Event,
    reason?: SnackbarCloseReason,
  ) => void
}

const FlashMessage: React.FC<FlashMessageProps> = ({
  open,
  message,
  severity,
  onClose,
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      onClose={onClose}
    >
      <Alert severity={severity} sx={{ width: "100%" }} onClose={onClose}>
        {message}
      </Alert>
    </Snackbar>
  )
}

export type setFlashFunc = (args: {
  message: string
  severity: "success" | "error" | "warning" | "info"
  id: number
}) => void

const useFlash: () => [React.FC<{}>, setFlashFunc] = () => {
  const [flash, setFlash] = React.useState<{
    open: boolean
    message: string
    severity: "success" | "error" | "warning" | "info"
    seen: number[]
  }>({
    open: false,
    message: "",
    severity: "info",
    seen: [],
  })

  const onClose = (
    event?: React.SyntheticEvent | Event,
    reason?: SnackbarCloseReason,
  ) => {
    if (reason === "clickaway") {
      return
    }

    setFlash({ ...flash, open: false })
  }

  const showFlash = ({
    message,
    severity,
    id,
  }: {
    message: string
    severity: "success" | "error" | "warning" | "info"
    id: number
  }) => {
    if (flash.seen.includes(id)) {
      // Prevent showing the same message again
      return
    }
    setFlash({ open: true, message, severity, seen: [...flash.seen, id] })
  }

  const FlashComponent: React.FC<{}> = () => (
    <FlashMessage
      open={flash.open}
      message={flash.message}
      severity={flash.severity}
      onClose={onClose}
    />
  )

  return [FlashComponent, showFlash]
}

export default useFlash
