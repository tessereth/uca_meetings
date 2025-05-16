import { APIErrorResponse, getMeeting } from "~/actions";
import type { Route } from "./+types/meeting";
import Meeting from "~/meeting/meeting";
import { connectWebSocket } from "~/meeting/channel";
import { redirect } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "UCA Meeting" },
  ];
}

export async function clientLoader({ params }: Route.LoaderArgs) {
  const response = await getMeeting(params.shortCode);
  console.log("Meeting response", response);
  if (response instanceof APIErrorResponse) {
    if (response.status_code === 401 || response.status_code === 403) {
      return redirect(`/?meeting=${params.shortCode}`);
    }
  }
  // TODO: reconnect if the connection is closed
  const websocket = await connectWebSocket(params.shortCode);

  return {
    meetingData: response,
    websocket: websocket,
  };
}

export default function MeetingComp(params: Route.LoaderArgs) {
  return <Meeting {...params} />;
}
