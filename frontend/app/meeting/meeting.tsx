import {
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  Checkbox,
  Chip,
  Container,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  SvgIcon,
  Typography,
} from "@mui/material"
import ContentCopyIcon from "@mui/icons-material/ContentCopy"
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank"
import type { Route } from "../routes/+types/meeting"
import { useLoaderData } from "react-router"
import { useEffect, useState } from "react"
import { orange, blue, yellow, grey } from "@mui/material/colors"
import { sendEvent } from "./channel"
import useFlash from "components/flash"

function CardCheckbox({ color, checked }: { color: any; checked: boolean }) {
  return (
    <Checkbox
      size="large"
      checked={checked}
      sx={{
        color: color[800],
        "&.Mui-checked": {
          color: color[600],
        },
      }}
    />
  )
}

function CardIcon({ color, enabled }: { color: any; enabled: boolean }) {
  if (enabled) {
    return <CardFilled fontSize="large" sx={{ color: color[600] }} />
  }
  return <CheckBoxOutlineBlankIcon fontSize="large" sx={{ color: grey[300] }} />
}

function CardFilled(params: any) {
  return (
    <SvgIcon {...params}>
      <path d="M5 3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"></path>
    </SvgIcon>
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
    questions: any[]
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
          <>
            <Box sx={{ m: 2 }}>
              <Chip
                label={`Warm: ${meetingSnapshot.participants.filter((p) => p.cards.warm).length}`}
                variant="outlined"
              />
              <Chip
                label={`Cool: ${meetingSnapshot.participants.filter((p) => p.cards.cool).length}`}
                variant="outlined"
                sx={{ mx: 1 }}
              />
            </Box>
            {meetingSnapshot.questions.length > 0 && (
              <Box sx={{ m: 2 }}>
                <Typography variant="body1">
                  Questions:
                  <ol>
                    {meetingSnapshot.questions.map((question: string) => (
                      <li>
                        {
                          meetingSnapshot.participants.find(
                            (p) => p.id == question,
                          ).name
                        }
                      </li>
                    ))}
                  </ol>
                </Typography>
              </Box>
            )}
            <List sx={{ my: 2 }}>
              {meetingSnapshot.participants.map((participant: any) => (
                <ListItem key={participant.id}>
                  <ListItemIcon>
                    <CardIcon color={orange} enabled={participant.cards.warm} />
                  </ListItemIcon>
                  <ListItemIcon>
                    <CardIcon color={blue} enabled={participant.cards.cool} />
                  </ListItemIcon>
                  <ListItemIcon>
                    <CardIcon
                      color={yellow}
                      enabled={participant.cards.question}
                    />
                  </ListItemIcon>
                  <ListItemText>
                    <Typography variant="body1" component="span">
                      {participant.name}
                    </Typography>
                  </ListItemText>
                </ListItem>
              ))}
            </List>
          </>
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
            icon={<CardCheckbox color={orange} checked={warm} />}
            sx={{ backgroundColor: orange[100] }}
          />
          <BottomNavigationAction
            label="Cool"
            value="cool"
            icon={<CardCheckbox color={blue} checked={cool} />}
            sx={{ backgroundColor: blue[100] }}
          />
          <BottomNavigationAction
            label="Question"
            value="question"
            icon={<CardCheckbox color={yellow} checked={question} />}
            sx={{ backgroundColor: yellow[100] }}
          />
        </BottomNavigation>
      </Paper>
      <FlashComponent />
    </main>
  )
}
