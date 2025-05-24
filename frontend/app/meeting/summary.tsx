import { Chip, Paper, Stack, Typography } from "@mui/material"
import { CardState } from "components/cards"
import type { MeetingSnapshot } from "./channel"

export default function Summary({
  meetingSnapshot,
}: {
  meetingSnapshot: MeetingSnapshot
}) {
  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Typography variant="body1">Summary</Typography>
      <Stack sx={{ mt: 1 }} spacing={2} direction={{ xs: "column", sm: "row" }}>
        <Chip
          label={`Warm: ${meetingSnapshot.stateCount(CardState.Warm)}`}
          variant="outlined"
        />
        <Chip
          label={`Cool: ${meetingSnapshot.stateCount(CardState.Cool)}`}
          variant="outlined"
        />
        <Chip
          label={`Question: ${meetingSnapshot.questions.length}`}
          variant="outlined"
        />
        {meetingSnapshot.stateCount(CardState.MoveOn) > 0 && (
          <Chip
            label={`Move on: ${meetingSnapshot.stateCount(CardState.MoveOn)}`}
            variant="outlined"
          />
        )}
      </Stack>
    </Paper>
  )
}
