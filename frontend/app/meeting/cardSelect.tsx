import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material"
import { CardIcon, cardStateLabel } from "~/components/cards"
import { CardState } from "~/components/cardState"
import CheckIcon from "@mui/icons-material/Check"

interface CardSelectProps {
  cardState: CardState
  onSelect: (state: CardState) => void
}

export default function CardSelect({ cardState, onSelect }: CardSelectProps) {
  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Box>
        <Typography variant="body1">
          <b>Select your cards</b>
        </Typography>
        <List>
          {Object.values(CardState).map((state) => (
            <ListItemButton
              key={state}
              selected={state == cardState}
              onClick={() => onSelect(state)}
            >
              <ListItemIcon sx={{ minWidth: "32px" }}>
                {state == cardState && <CheckIcon />}
              </ListItemIcon>
              <ListItemIcon>
                <CardIcon state={state} />
              </ListItemIcon>
              <ListItemText>{cardStateLabel(state)}</ListItemText>
            </ListItemButton>
          ))}
        </List>
      </Box>
    </Paper>
  )
}
