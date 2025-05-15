import type { Route } from "./+types/meeting";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "UCA Meeting" },
  ];
}

export default function Meeting() {
  return <div>TODO</div>;
}
