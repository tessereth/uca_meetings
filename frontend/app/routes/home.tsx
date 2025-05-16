import type { Route } from "./+types/home";
import Home from "../home/home";
import { APIErrorResponse, createMeeting, CreateMeeting, getName, joinMeeting } from "~/actions";
import { redirect } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "UCA Meetings" },
  ];
}

export async function clientLoader({ params }: Route.LoaderArgs) {
  const name = await getName();
  return { name: name };
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const formType = formData.get("formType");
  if (formType === "join") {
    const data = await joinMeeting(formData.get("shortCode") as string, formData.get("userName") as string);
    if (data instanceof APIErrorResponse) {
      console.error("Error joining meeting:", data.message);
    } else {
      return redirect(`/${data.meeting.short_code}`);
    }
  } else if (formType === "create") {
    const meetingData = new CreateMeeting(formData.get("meetingName") as string, formData.get("userName") as string, formData.get("anonymous") === "on");
    const response = await createMeeting(meetingData);
    if (response instanceof APIErrorResponse) {
      console.error("Error creating meeting:", response.message);
    } else {
      return redirect(`/${response.meeting.short_code}`);
    }
  }
}

export default function HomeComp(params: Route.LoaderArgs) {
  return <Home {...params} />;
}
