import { getMeeting } from "~/actions";
import type { Route } from "./+types/meeting";
import Meeting from "~/meeting/meeting";
import { connectWebSocket } from "~/meeting/channel";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "UCA Meeting" },
  ];
}

export async function clientLoader({ params }: Route.LoaderArgs) {
  const meeting = await getMeeting(params.shortCode);
  // TODO: reconnect if the connection is closed
  const websocket = await connectWebSocket(params.shortCode);

  return {
    meetingData: meeting,
    websocket: websocket,
  };
}

export default function MeetingComp(params: Route.LoaderArgs) {
  return <Meeting {...params} />;
}
