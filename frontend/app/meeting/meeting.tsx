import { Container, Grid } from "@mui/material"
import type { Route } from "../routes/+types/meeting"
import { useLoaderData } from "react-router"
import { useEffect, useState } from "react"
import { sendCardChangeEvent, MeetingSnapshot } from "./channel"
import useFlash from "~/components/flash"
import { CardState } from "~/components/cardState"
import Header from "./header"
import CardSelect from "./cardSelect"
import Summary from "./summary"
import QuestionList from "./questionList"
import ParticipantsList from "./participantsList"

export default function Meeting(params: Route.LoaderArgs) {
  const { meetingData, websocket } = useLoaderData()
  const [cardState, setCardState] = useState(CardState.None)

  const [FlashComponent, setFlash] = useFlash()

  // Websocket setup
  const [meetingSnapshot, setMeetingSnapshot] =
    useState<MeetingSnapshot | null>()

  const syncCardData = () => {
    console.log("Syncing card data")
    sendCardChangeEvent(websocket, meetingData.participation, cardState)
  }

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data)
      console.log("Received message", data)
      setMeetingSnapshot(new MeetingSnapshot(data))
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

  return (
    <main>
      <Container>
        <Header meetingData={meetingData} setFlash={setFlash} />
        <Grid container spacing={{ xs: 2, sm: 4 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <CardSelect
              cardState={cardState}
              setCardState={setCardState}
              websocket={websocket}
              meetingData={meetingData}
            />
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
