import { getMeeting } from "~/actions";
import type { Route } from "./+types/meeting";
import Meeting from "~/meeting/meeting";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "UCA Meeting" },
  ];
}

export async function clientLoader({ params }: Route.LoaderArgs) {
  return await getMeeting(params.shortCode);
}

export default function MeetingComp(params: Route.LoaderArgs) {
  return <Meeting {...params} />;
}
