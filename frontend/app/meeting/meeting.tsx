import { Container } from '@mui/material';
import type { Route } from '../routes/+types/meeting';
import { useLoaderData } from 'react-router';

export default function Meeting(params: Route.LoaderArgs) {
  const data = useLoaderData();
  return (
    <main>
      <Container>
        <h1>Meeting</h1>
        <div>{JSON.stringify(data)}</div>
      </Container>
    </main>
  );
};
