import {
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  Checkbox,
  Container,
  Paper,
  Typography,
} from "@mui/material"
import ContentCopyIcon from "@mui/icons-material/ContentCopy"
import type { Route } from "../routes/+types/meeting"
import { useLoaderData } from "react-router"
import { useEffect, useState } from "react"
import { orange, blue, yellow } from "@mui/material/colors"
import { sendEvent } from "./channel"
import useFlash from "components/flash"

function CardIcon({
  color,
  checked,
  disabled,
}: {
  color: any
  checked: boolean
  disabled?: boolean
}) {
  return (
    <Checkbox
      size="large"
      checked={checked}
      disabled={disabled}
      sx={{
        color: color[800],
        "&.Mui-checked": {
          color: color[600],
        },
      }}
    />
  )
}

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
  const [warm, setWarm] = useState(false)
  const [cool, setCool] = useState(false)
  const [question, setQuestion] = useState(false)

  const [FlashComponent, setFlash] = useFlash()

  // Websocket setup
  const [meetingSnapshot, setMeetingSnapshot] = useState<{
    participants: any[]
  } | null>()

  const syncCardData = () => {
    console.log("Syncing card data")
    sendEvent(websocket, meetingData.participation, "warm", warm)
    sendEvent(websocket, meetingData.participation, "cool", cool)
    sendEvent(websocket, meetingData.participation, "question", question)
  }

  useEffect(() => {
    const onOpen = () => {
      // Ensure card data is synched on reconnect
      syncCardData()
    }
    const onMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data)
      console.log("Received message", data)
      setMeetingSnapshot(data)
    }

    console.log("Setting up WebSocket event listener")
    websocket.addEventListener("open", onOpen)
    websocket.addEventListener("message", onMessage)

    if (websocket.readyState === WebSocket.OPEN) {
      // If the WebSocket is already open, call onOpen immediately
      onOpen()
    }

    return () => {
      websocket.removeEventListener("open", onOpen)
      websocket.removeEventListener("message", onMessage)
    }
  }, [])

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
        {meetingSnapshot && meetingSnapshot.participants && (
          <Box sx={{ my: 2 }}>
            {meetingSnapshot.participants.map((participant: any) => (
              <div key={participant.id}>
                <CardIcon
                  color={orange}
                  checked={participant.cards.warm}
                  disabled
                />
                <CardIcon
                  color={blue}
                  checked={participant.cards.cool}
                  disabled
                />
                <CardIcon
                  color={yellow}
                  checked={participant.cards.question}
                  disabled
                />
                <Typography variant="body1" component="span" sx={{ pl: 1 }}>
                  {participant.name}
                </Typography>
              </div>
            ))}
          </Box>
        )}
      </Container>
      <Paper
        sx={{ position: "fixed", bottom: 0, left: 0, right: 0 }}
        elevation={3}
      >
        <BottomNavigation
          showLabels
          onChange={(event, newValue) => {
            let raised = false
            if (newValue === "warm") {
              raised = !warm
              setWarm(raised)
            }
            if (newValue === "cool") {
              raised = !cool
              setCool(raised)
            }
            if (newValue === "question") {
              raised = !question
              setQuestion(raised)
            }
            sendEvent(websocket, meetingData.participation, newValue, raised)
          }}
          sx={{ height: 80 }}
        >
          <BottomNavigationAction
            label="Warm"
            value="warm"
            icon={<CardIcon color={orange} checked={warm} />}
            sx={{ backgroundColor: orange[100] }}
          />
          <BottomNavigationAction
            label="Cool"
            value="cool"
            icon={<CardIcon color={blue} checked={cool} />}
            sx={{ backgroundColor: blue[100] }}
          />
          <BottomNavigationAction
            label="Question"
            value="question"
            icon={<CardIcon color={yellow} checked={question} />}
            sx={{ backgroundColor: yellow[100] }}
          />
        </BottomNavigation>
      </Paper>
      <FlashComponent />
    </main>
  )
}
