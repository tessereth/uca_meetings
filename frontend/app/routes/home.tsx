import type { Route } from "./+types/home";
import { Home as HomeComponent } from "../home/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "UCA Meetings" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return <HomeComponent />;
}
