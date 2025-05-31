import { Container, Grid } from "@mui/material"
import type { Route } from "../routes/+types/meeting"
import { useLoaderData } from "react-router"
import { useEffect, useState } from "react"
import {
  sendCardChangeEvent,
  MeetingSnapshot,
  connectWebSocket,
  MeetingParticipant,
} from "./channel"
import useFlash from "~/components/flash"
import { CardState } from "~/components/cardState"
import Header from "./header"
import CardSelect from "./cardSelect"
import Summary from "./summary"
import QuestionList from "./questionList"
import ParticipantsList from "./participantsList"
import {
  APIErrorResponse,
  changeRole,
  leaveMeeting,
  MeetingResponse,
  Role,
} from "~/actions"

export default function Meeting(params: Route.LoaderArgs) {
  const { meetingData } = useLoaderData() as { meetingData: MeetingResponse }
  const { shortCode } = meetingData.meeting
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

  const setFlashFromResponse = (
    response: any,
    successMessage: string,
    failureMessage: string,
  ) => {
    if (response instanceof APIErrorResponse) {
      setFlash({
        message: `${failureMessage}: ${response.message}`,
        severity: "error",
        id: Date.now(),
      })
    } else {
      setFlash({
        message: successMessage,
        severity: "success",
        id: Date.now(),
      })
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
                onLowerCard={(participant: MeetingParticipant) => {
                  if (websocket) {
                    sendCardChangeEvent(websocket, participant, CardState.None)
                  }
                }}
                onMakeHost={async (participant: MeetingParticipant) => {
                  const response = await changeRole(
                    shortCode,
                    participant.id,
                    Role.Host,
                  )
                  setFlashFromResponse(
                    response,
                    `${participant.name} is now a host`,
                    `Failed to make ${participant.name} a host`,
                  )
                }}
                onKick={async (participant: MeetingParticipant) => {
                  const response = await leaveMeeting(shortCode, participant.id)
                  setFlashFromResponse(
                    response,
                    `${participant.name} has been removed`,
                    `Failed to remove ${participant.name}`,
                  )
                }}
                onAddParticipant={
                  new URLSearchParams(window.location.search).has("debug")
                    ? () => {
                        /* TODO */
                      }
                    : undefined
                }
              />
            </Grid>
          )}
        </Grid>
      </Container>
      <FlashComponent />
    </main>
  )
}
