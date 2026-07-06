import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import { Role, type Participation } from "~/actions"
import { CardIcon } from "~/components/cards"
import { CardState } from "~/components/cardState"
import type { MeetingParticipant, MeetingSnapshot } from "./channel"
import { useState } from "react"

type SummaryProps = {
  meetingSnapshot: MeetingSnapshot
  currentParticipation: Participation
  onLowerCards: (participants: MeetingParticipant[]) => Promise<void> | void
  onMakeHosts: (participants: MeetingParticipant[]) => Promise<void> | void
  onKickParticipants: (
    participants: MeetingParticipant[],
  ) => Promise<void> | void
  onAddSimulatedParticipant: () => Promise<void> | void
}

type ActionType = "lower" | "makeHost" | "kick"

type DialogState = {
  action: ActionType | null
  participantOptions: MeetingParticipant[]
  selectedIds: string[]
}

function participantName(participant: MeetingParticipant) {
  return participant.name
}

export default function Summary({
  meetingSnapshot,
  currentParticipation,
  onLowerCards,
  onMakeHosts,
  onKickParticipants,
  onAddSimulatedParticipant,
}: SummaryProps) {
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({})
  const [dialogState, setDialogState] = useState<DialogState>({
    action: null,
    participantOptions: [],
    selectedIds: [],
  })
  const [dialogOpen, setDialogOpen] = useState(false)

  const isHost = currentParticipation.role === Role.Host
  const participants = [...meetingSnapshot.participants].sort((a, b) =>
    participantName(a).localeCompare(participantName(b)),
  )
  const queueParticipants = meetingSnapshot.questions
    .map((questionId) => meetingSnapshot.getParticipant(questionId))
    .filter((participant): participant is MeetingParticipant => !!participant)

  const warmParticipants = participants.filter(
    (participant) => participant.cardState === CardState.Warm,
  )
  const coolParticipants = participants.filter(
    (participant) => participant.cardState === CardState.Cool,
  )
  const moveOnParticipants = participants.filter(
    (participant) => participant.cardState === CardState.MoveOn,
  )
  const noCardParticipants = participants.filter(
    (participant) => participant.cardState === CardState.None,
  )

  const selectableParticipants = participants.filter(
    (participant) => participant.id !== currentParticipation.id,
  )
  const lowerableParticipants = selectableParticipants.filter(
    (participant) => participant.cardState !== CardState.None,
  )
  const currentHosts = participants.filter(
    (participant) => participant.role === Role.Host,
  )
  const eligibleHostPromotions = selectableParticipants.filter(
    (participant) => participant.role !== Role.Host,
  )

  const toggleSection = (section: string, isExpanded: boolean) => {
    setExpandedSections((current) => ({ ...current, [section]: isExpanded }))
  }

  const openDialog = (action: ActionType) => {
    const nextOptions =
      action === "lower"
        ? lowerableParticipants
        : action === "makeHost"
          ? eligibleHostPromotions
          : selectableParticipants
    setDialogState({
      action,
      participantOptions: nextOptions,
      selectedIds:
        action === "lower"
          ? lowerableParticipants.map((participant) => participant.id)
          : [],
    })
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
  }

  const toggleSelection = (participantId: string) => {
    setDialogState((current) => ({
      ...current,
      selectedIds: current.selectedIds.includes(participantId)
        ? current.selectedIds.filter((id) => id !== participantId)
        : [...current.selectedIds, participantId],
    }))
  }

  const handleConfirmAction = async () => {
    if (!dialogState.action) {
      return
    }

    const selectedParticipants = dialogState.participantOptions.filter(
      (participant) => dialogState.selectedIds.includes(participant.id),
    )

    if (selectedParticipants.length === 0) {
      closeDialog()
      return
    }

    if (dialogState.action === "lower") {
      await onLowerCards(selectedParticipants)
    } else if (dialogState.action === "makeHost") {
      await onMakeHosts(selectedParticipants)
    } else {
      await onKickParticipants(selectedParticipants)
    }

    closeDialog()
  }

  const sectionHeader = (title: string, count: number) => (
    <Stack direction="row" spacing={1} alignItems="center">
      <Typography variant="subtitle1">{title}</Typography>
      <Typography variant="body2" color="text.secondary">
        ({count})
      </Typography>
    </Stack>
  )

  const renderExpandableSection = (
    title: string,
    participantList: MeetingParticipant[],
    sectionKey: string,
  ) => {
    if (participantList.length === 0) {
      return null
    }

    const isExpanded = Boolean(expandedSections[sectionKey])

    return (
      <Accordion
        key={sectionKey}
        expanded={isExpanded}
        onChange={(_, expanded) => toggleSection(sectionKey, expanded)}
        disableGutters
        sx={{ mt: 1 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          {sectionHeader(title, participantList.length)}
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          <List dense disablePadding>
            {(isExpanded ? participantList : participantList.slice(0, 20)).map(
              (participant) => (
                <ListItemButton key={participant.id} component="li">
                  <ListItemText primary={participant.name} />
                </ListItemButton>
              ),
            )}
            {!isExpanded && participantList.length > 20 && (
              <ListItemButton component="li" disabled>
                <ListItemText
                  primary={`+${participantList.length - 20} more`}
                />
              </ListItemButton>
            )}
          </List>
        </AccordionDetails>
      </Accordion>
    )
  }

  const queuePosition = queueParticipants.findIndex(
    (participant) => participant.id === currentParticipation.id,
  )

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="h6">Summary</Typography>
        <Typography variant="body2" color="text.secondary">
          ({participants.length})
        </Typography>
      </Stack>
      {queueParticipants.length > 0 && (
        <Accordion
          disableGutters
          sx={{ mt: 2 }}
          expanded={expandedSections.speakerQueue ?? true}
          onChange={(_, expanded) => toggleSection("speakerQueue", expanded)}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            {sectionHeader("Speaker queue", queueParticipants.length)}
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <List dense disablePadding>
              {queueParticipants.slice(0, 5).map((participant) => (
                <ListItemButton key={participant.id} component="li">
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CardIcon state={participant.cardState} />
                  </ListItemIcon>
                  <ListItemText primary={participant.name} />
                </ListItemButton>
              ))}
              {queueParticipants.length > 5 && (
                <ListItemButton component="li" disabled>
                  <ListItemText
                    primary={`+${queueParticipants.length - 5} more`}
                  />
                </ListItemButton>
              )}
            </List>
            {queuePosition >= 5 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Your position: {queuePosition + 1}
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>
      )}

      {warmParticipants.length > 0 &&
        renderExpandableSection("Warm", warmParticipants, "warm")}
      {coolParticipants.length > 0 &&
        renderExpandableSection("Cool", coolParticipants, "cool")}
      {moveOnParticipants.length > 0 &&
        renderExpandableSection("Move on", moveOnParticipants, "moveOn")}
      {noCardParticipants.length > 0 &&
        renderExpandableSection("No card raised", noCardParticipants, "noCard")}

      {isHost && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1">Host actions</Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{ mt: 1 }}
          >
            <Button variant="outlined" onClick={() => openDialog("lower")}>
              Lower cards
            </Button>
            <Button variant="outlined" onClick={() => openDialog("makeHost")}>
              Make host
            </Button>
            <Button variant="outlined" onClick={() => openDialog("kick")}>
              Remove
            </Button>
            <Button variant="outlined" onClick={onAddSimulatedParticipant}>
              Add simulated participant
            </Button>
          </Stack>
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>
          {dialogState.action === "lower"
            ? "Lower cards"
            : dialogState.action === "makeHost"
              ? "Make host"
              : "Remove participants"}
        </DialogTitle>
        <DialogContent>
          {dialogState.action === "makeHost" && currentHosts.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Current hosts
              </Typography>
              <List dense>
                {currentHosts.map((participant) => (
                  <ListItemButton key={participant.id} disabled>
                    <ListItemText primary={participant.name} />
                  </ListItemButton>
                ))}
              </List>
            </Box>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Select participants to update.
          </Typography>
          {dialogState.action === "lower" && (
            <Button
              variant="text"
              size="small"
              onClick={() => {
                const allIds = dialogState.participantOptions.map(
                  (participant) => participant.id,
                )
                const allSelected = allIds.every((id) =>
                  dialogState.selectedIds.includes(id),
                )
                setDialogState((current) => ({
                  ...current,
                  selectedIds: allSelected ? [] : allIds,
                }))
              }}
              sx={{ mb: 1 }}
            >
              {dialogState.participantOptions.every((participant) =>
                dialogState.selectedIds.includes(participant.id),
              )
                ? "Clear all"
                : "Select all"}
            </Button>
          )}
          <List dense>
            {dialogState.participantOptions.map((participant) => (
              <ListItemButton
                key={participant.id}
                onClick={() => toggleSelection(participant.id)}
              >
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={dialogState.selectedIds.includes(participant.id)}
                    tabIndex={-1}
                    disableRipple
                  />
                </ListItemIcon>
                <ListItemText primary={participant.name} />
              </ListItemButton>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button
            onClick={handleConfirmAction}
            variant="contained"
            disabled={dialogState.selectedIds.length === 0}
          >
            {dialogState.action === "lower"
              ? "Lower cards"
              : dialogState.action === "makeHost"
                ? "Make host"
                : "Remove"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}
