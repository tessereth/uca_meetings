import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material"
import { CardIcon } from "components/cards"
import type { MeetingParticipant } from "./channel"

type QuestionListProps = {
  questioners: string[]
  getParticipant: (id: string) => MeetingParticipant | null | undefined
}

export default function QuestionList({
  questioners,
  getParticipant,
}: QuestionListProps) {
  const rowFor = (questioner: string) => {
    const participant = getParticipant(questioner)
    if (!participant) {
      return null
    }
    return (
      <ListItem key={questioner}>
        <ListItemIcon>
          <CardIcon state={participant.card_state} />
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
      <List>{questioners.map(rowFor)}</List>
    </Box>
  )
}
