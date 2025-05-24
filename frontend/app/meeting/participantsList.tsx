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

type ParticipantsListProps = {
  participants: MeetingParticipant[]
}

export default function ParticipantsList({
  participants,
}: ParticipantsListProps) {
  return (
    <Box sx={{ m: 2 }}>
      <Typography variant="body1">All members:</Typography>
      <List>
        {participants.map((participant) => (
          <ListItem key={participant.id}>
            <ListItemIcon>
              <CardIcon state={participant.card_state} />
            </ListItemIcon>
            <ListItemText>
              <Typography variant="body1" component="span">
                {participant.name}
              </Typography>
            </ListItemText>
          </ListItem>
        ))}
      </List>
    </Box>
  )
}
