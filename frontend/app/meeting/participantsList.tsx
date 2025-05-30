import {
  Box,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material"
import PersonRemoveIcon from "@mui/icons-material/PersonRemove"
import ClearIcon from "@mui/icons-material/Clear"
import AddModeratorIcon from "@mui/icons-material/AddModerator"
import { CardIcon } from "~/components/cards"
import type { MeetingParticipant } from "./channel"
import { CardState } from "~/components/cardState"
import type { Participation } from "~/actions"

type ParticipantsListProps = {
  participants: MeetingParticipant[]
  currentParticipation: Participation
}

export default function ParticipantsList({
  participants,
  currentParticipation,
}: ParticipantsListProps) {
  const actions = (participant: MeetingParticipant) => {
    if (
      currentParticipation.role !== "host" ||
      currentParticipation.id == participant.id
    ) {
      return null
    }
    let actions = []
    if (participant.cardState !== CardState.None) {
      actions.push(
        <Tooltip title="Lower card" key="lower">
          <IconButton edge="end">
            <ClearIcon />
          </IconButton>
        </Tooltip>,
      )
    }
    if (participant.role !== "host") {
      actions.push(
        <Tooltip title="Make host" key="host">
          <IconButton edge="end">
            <AddModeratorIcon />
          </IconButton>
        </Tooltip>,
      )
    }
    actions.push(
      <Tooltip title="Remove from meeting" key="remove">
        <IconButton edge="end">
          <PersonRemoveIcon />
        </IconButton>
      </Tooltip>,
    )
    return (
      <Stack direction="row" spacing="3">
        {actions}
      </Stack>
    )
  }
  return (
    <Box sx={{ m: 2 }}>
      <Typography variant="body1">All members:</Typography>
      <List>
        {participants.map((participant) => (
          <ListItem key={participant.id} secondaryAction={actions(participant)}>
            <ListItemIcon>
              <CardIcon state={participant.cardState} />
            </ListItemIcon>
            <ListItemText>
              <Typography variant="body1" component="span">
                {participant.name}
                {participant.role === "host" && (
                  <Chip label="host" size="small" sx={{ ml: 1 }} />
                )}
              </Typography>
            </ListItemText>
          </ListItem>
        ))}
      </List>
    </Box>
  )
}
