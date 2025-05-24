import {
  Box,
  Button,
  Chip,
  Container,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material"
import ContentCopyIcon from "@mui/icons-material/ContentCopy"
import type { Route } from "../routes/+types/meeting"
import { useLoaderData } from "react-router"
import { useEffect, useState } from "react"
import { sendCardChangeEvent } from "./channel"
import useFlash from "components/flash"
import { CardIcon, CardState, cardStateLabel } from "components/cards"

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

export default function Meeting(params: Route.LoaderArgs) {
  const { meetingData, websocket } = useLoaderData()
  const [cardState, setCardState] = useState(CardState.None)

  const [FlashComponent, setFlash] = useFlash()

  // Websocket setup
  const [meetingSnapshot, setMeetingSnapshot] = useState<{
    participants: any[]
    questions: any[]
  } | null>()

  const syncCardData = () => {
    console.log("Syncing card data")
    sendCardChangeEvent(websocket, meetingData.participation, cardState)
  }

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data)
      console.log("Received message", data)
      setMeetingSnapshot(data)
    }

    console.log("Setting up WebSocket event listener")
    websocket.addEventListener("open", syncCardData)
    websocket.addEventListener("message", onMessage)

    if (websocket.readyState === WebSocket.OPEN) {
      // If the WebSocket is already open, trigger onOpen manually
      syncCardData()
    }

    return () => {
      websocket.removeEventListener("open", syncCardData)
      websocket.removeEventListener("message", onMessage)
    }
  }, [])

  const stateCount = (state: CardState) => {
    if (meetingSnapshot) {
      return meetingSnapshot.participants.filter((p) => p.card_state == state)
        .length
    } else {
      return 0
    }
  }

  const getParticipant = (pid: string) => {
    if (meetingSnapshot) {
      return meetingSnapshot.participants.find((p) => p.id == pid)
    } else {
      return null
    }
  }

  return (
    <main>
      <Container>
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
              onClick={() =>
                copyToClipboard(window.location.toString(), setFlash)
              }
            >
              <ContentCopyIcon fontSize="small" sx={{ mx: 1 }} />
              Copy link
            </Button>
          </Typography>
        </Box>
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
                  onClick={() => {
                    setCardState(state)
                    sendCardChangeEvent(
                      websocket,
                      meetingData.participation,
                      state,
                    )
                  }}
                >
                  <ListItemIcon>
                    <CardIcon state={state} />
                  </ListItemIcon>
                  <ListItemText>{cardStateLabel(state)}</ListItemText>
                </ListItemButton>
              ))}
            </List>
          </Box>
        </Paper>
        {meetingSnapshot && meetingSnapshot.participants && (
          <>
            <Paper elevation={2} sx={{ p: 2, mt: 2 }}>
              <Typography variant="body1">Summary</Typography>
              <Stack
                sx={{ mt: 1 }}
                spacing={2}
                direction={{ xs: "column", sm: "row" }}
              >
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
            {meetingSnapshot.questions.length > 0 && (
              <Box sx={{ m: 2 }}>
                <Typography variant="body1">Speaker queue:</Typography>
                <List>
                  {meetingSnapshot.questions.map((questioner: string) => (
                    <ListItem>
                      <ListItemIcon>
                        <CardIcon
                          state={getParticipant(questioner).card_state}
                        />
                      </ListItemIcon>
                      <ListItemText>
                        <Typography variant="body1" component="span">
                          {getParticipant(questioner).name}
                        </Typography>
                      </ListItemText>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
            <Box sx={{ m: 2 }}>
              <Typography variant="body1">All members:</Typography>
              <List>
                {meetingSnapshot.participants.map((participant: any) => (
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
          </>
        )}
      </Container>
      <FlashComponent />
    </main>
  )
}
