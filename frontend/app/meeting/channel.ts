import type { Participation } from "~/actions"
// @ts-ignore
import RobustWebSocket from "robust-websocket"
import type { CardState } from "components/cards"

export function connectWebSocket(shortCode: string): WebSocket {
  const url = `ws://${window.location.host}/api/meetings/${shortCode}/ws`
  const socket = new RobustWebSocket(url, null, {
    shouldReconnect: (_event: any, ws: RobustWebSocket) =>
      ws.reconnects <= 3 && 0,
  })
  console.log("Connecting to WebSocket", socket)

  socket.addEventListener("open", () => {
    console.log("WebSocket connection opened")
  })

  socket.addEventListener("error", (error: any) => {
    console.error("WebSocket error", error)
  })
  return socket
}

enum EventType {
  CardChange = "card_change",
  LowerAllCards = "lower_all_cards",
}

async function sendEvent(
  websocket: WebSocket,
  participation: Participation,
  event: EventType,
  params: any,
) {
  const msg = { pid: participation.id, event: event, ...params }
  console.log("Sending message", msg)
  websocket.send(JSON.stringify(msg))
}

export async function sendCardChangeEvent(
  websocket: WebSocket,
  participation: Participation,
  cardState: CardState,
) {
  sendEvent(websocket, participation, EventType.CardChange, {
    state: cardState,
  })
}

// The meeting snapshot data structure send on the websocket
export type MeetingSnapshot = {
  participants: Array<MeetingParticipant>
  questions: string[]
}

export type MeetingParticipant = {
  id: string
  name: string
  card_state: CardState
}
