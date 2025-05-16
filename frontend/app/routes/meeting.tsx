import { getMeeting } from "~/actions";
import type { Route } from "./+types/meeting";
import Meeting from "~/meeting/meeting";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "UCA Meeting" },
  ];
}

async function connectWebSocket(url: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    console.log("Connecting to WebSocket", socket);

    socket.addEventListener('open', () => {
      console.log("WebSocket connection opened");
      resolve(socket);
    });

    socket.addEventListener('error', (error) => {
      console.error("WebSocket error", error);
      reject(error);
    });
  });
}

export async function clientLoader({ params }: Route.LoaderArgs) {
  const meeting = await getMeeting(params.shortCode);
  // TODO: reconnect if the connection is closed
  const websocket = await connectWebSocket(
    // TODO: config
    `ws://localhost:8000/api/meetings/${params.shortCode}/ws`
  );
  return {
    meetingData: meeting,
    websocket: websocket,
  };
}

export default function MeetingComp(params: Route.LoaderArgs) {
  return <Meeting {...params} />;
}
