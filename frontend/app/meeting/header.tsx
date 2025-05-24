import { Box, Button, Typography } from "@mui/material"
import ContentCopyIcon from "@mui/icons-material/ContentCopy"
import type { setFlashFunc } from "~/components/flash"
import type { MeetingResponse } from "~/actions"

const copyToClipboard = async (text: string, setFlash: any) => {
  try {
    await navigator.clipboard.writeText(text)
    setFlash({
      message: "Link copied to clipboard",
      severity: "success",
      id: Date.now(),
    })
  } catch (err) {
    console.error("Failed to copy link: ", err)
    setFlash({
      message: "Failed to copy link",
      severity: "error",
      id: Date.now(),
    })
  }
}

type HeaderProps = {
  meetingData: MeetingResponse
  setFlash: setFlashFunc
}

export default function Header({ meetingData, setFlash }: HeaderProps) {
  return (
    <Box sx={{ m: 2 }}>
      <Typography variant="h3" component="h1">
        {meetingData.meeting.name}
      </Typography>
      <Typography variant="subtitle1">
        {meetingData.participation.name}
        {" — "}
        {meetingData.meeting.short_code}
        <Button
          sx={{ mx: 1 }}
          onClick={() => copyToClipboard(window.location.toString(), setFlash)}
        >
          <ContentCopyIcon fontSize="small" sx={{ mx: 1 }} />
          Copy link
        </Button>
      </Typography>
    </Box>
  )
}
