import { Container, Grid } from "@mui/material"
import type { Route } from "../routes/+types/meeting"
import { useLoaderData } from "react-router"
import { useEffect, useState } from "react"
import {
  sendCardChangeEvent,
  MeetingSnapshot,
  connectWebSocket,
} from "./channel"
import useFlash from "~/components/flash"
import { CardState } from "~/components/cardState"
import Header from "./header"
import CardSelect from "./cardSelect"
import Summary from "./summary"
import QuestionList from "./questionList"
import ParticipantsList from "./participantsList"

export default function Meeting(params: Route.LoaderArgs) {
  const { meetingData } = useLoaderData()
  const [cardState, setCardState] = useState(CardState.None)
  const [websocket, setWebsocket] = useState<WebSocket>()
  const [meetingSnapshot, setMeetingSnapshot] =
    useState<MeetingSnapshot | null>()

  const [FlashComponent, setFlash] = useFlash()

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data)
      console.log("Received message", data)
      setMeetingSnapshot(new MeetingSnapshot(data))
    }

    console.log("Setting up WebSocket", params)
    const newWebsocket = connectWebSocket(params.params.shortCode)
    setWebsocket(newWebsocket)

    const syncCardData = () => {
      console.log("Syncing card data")
      sendCardChangeEvent(newWebsocket, meetingData.participation, cardState)
    }
    newWebsocket.addEventListener("open", syncCardData)
    newWebsocket.addEventListener("message", onMessage)

    if (newWebsocket.readyState === WebSocket.OPEN) {
      // If the WebSocket is already open, trigger onOpen manually
      syncCardData()
    }

    return () => {
      console.log("Closing websocket")
      setWebsocket(undefined)
      newWebsocket.close()
    }
  }, [])

  const onCardSelect = (state: CardState) => {
    setCardState(state)
    if (websocket) {
      sendCardChangeEvent(websocket, meetingData.participation, state)
    }
  }

  return (
    <main>
      <Container>
        <Header meetingData={meetingData} setFlash={setFlash} />
        <Grid container spacing={{ xs: 2, sm: 4 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <CardSelect cardState={cardState} onSelect={onCardSelect} />
          </Grid>
          {meetingSnapshot && meetingSnapshot.participants && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Summary meetingSnapshot={meetingSnapshot} />
              {meetingSnapshot.questions.length > 0 && (
                <QuestionList meetingSnapshot={meetingSnapshot} />
              )}
              <ParticipantsList
                participants={meetingSnapshot.participants}
                currentParticipation={meetingData.participation}
              />
            </Grid>
          )}
        </Grid>
      </Container>
      <FlashComponent />
    </main>
  )
}
