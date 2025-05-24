import { Chip, Paper, Stack, Typography } from "@mui/material"
import { CardState } from "components/cards"
import type { MeetingSnapshot } from "./channel"

export default function Summary({
  meetingSnapshot,
}: {
  meetingSnapshot: MeetingSnapshot
}) {
  const stateCount = (state: CardState) => {
    if (meetingSnapshot) {
      return meetingSnapshot.participants.filter((p) => p.card_state == state)
        .length
    } else {
      return 0
    }
  }

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Typography variant="body1">Summary</Typography>
      <Stack sx={{ mt: 1 }} spacing={2} direction={{ xs: "column", sm: "row" }}>
        <Chip
          label={`Warm: ${stateCount(CardState.Warm)}`}
          variant="outlined"
        />
        <Chip
          label={`Cool: ${stateCount(CardState.Cool)}`}
          variant="outlined"
        />
        <Chip
          label={`Question: ${meetingSnapshot.questions.length}`}
          variant="outlined"
        />
        {stateCount(CardState.MoveOn) > 0 && (
          <Chip
            label={`Move on: ${stateCount(CardState.MoveOn)}`}
            variant="outlined"
          />
        )}
      </Stack>
    </Paper>
  )
}
