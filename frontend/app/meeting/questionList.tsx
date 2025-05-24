import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material"
import { CardIcon } from "~/components/cards"
import type { MeetingSnapshot } from "./channel"

type QuestionListProps = {
  meetingSnapshot: MeetingSnapshot
}

export default function QuestionList({ meetingSnapshot }: QuestionListProps) {
  const rowFor = (questioner: string) => {
    const participant = meetingSnapshot.getParticipant(questioner)
    if (!participant) {
      return null
    }
    return (
      <ListItem key={questioner}>
        <ListItemIcon>
          <CardIcon state={participant.cardState} />
        </ListItemIcon>
        <ListItemText>
          <Typography variant="body1" component="span">
            {participant.name}
          </Typography>
        </ListItemText>
      </ListItem>
    )
  }

  return (
    <Box sx={{ m: 2 }}>
      <Typography variant="body1">Speaker queue:</Typography>
      <List>{meetingSnapshot.questions.map(rowFor)}</List>
    </Box>
  )
}
