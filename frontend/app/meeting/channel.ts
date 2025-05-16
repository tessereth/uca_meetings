import type { Participation } from "~/actions";
// @ts-ignore
import RobustWebSocket from "robust-websocket";

export function connectWebSocket(shortCode: string): WebSocket {
  // TODO: config domain name
  const url = `ws://localhost:8000/api/meetings/${shortCode}/ws`
  const socket = new RobustWebSocket(url);
  console.log("Connecting to WebSocket", socket);

  socket.addEventListener('open', () => {
    console.log("WebSocket connection opened");
  });

  socket.addEventListener('error', (error: any) => {
    console.error("WebSocket error", error);
  });
  return socket;
}

export async function sendEvent(websocket: WebSocket, participation: Participation, card: string, raised: boolean) {
  const msg = { pid: participation.id, card: card, raised: raised };
  console.log("Sending message", msg);
  websocket.send(JSON.stringify(msg));
}