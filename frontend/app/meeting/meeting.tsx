import { BottomNavigation, BottomNavigationAction, Box, Card, Checkbox, Container, FormControlLabel, Paper, Typography } from '@mui/material';
import type { Route } from '../routes/+types/meeting';
import { useLoaderData } from 'react-router';
import { useEffect, useState } from 'react';
import { orange, blue, yellow } from '@mui/material/colors';

function CardIcon({ color, checked, disabled }: { color: any, checked: boolean, disabled?: boolean }) {
  return <Checkbox size="large" checked={checked} disabled={disabled} sx={{
      color: color[800],
      '&.Mui-checked': {
        color: color[600],
      },
    }} />
}

export default function Meeting(params: Route.LoaderArgs) {
  const { meetingData, websocket } = useLoaderData();
  const [warm, setWarm] = useState(false);
  const [cool, setCool] = useState(false);
  const [question, setQuestion] = useState(false);

  const [meetingSnapshot, setMeetingSnapshot] = useState<{ participants: any[] } | null>();
  useEffect(() => {
    const handleEvent = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      console.log("Received message", data);
      setMeetingSnapshot(data);
    };

    console.log("Setting up WebSocket event listener");
    websocket.addEventListener('message', handleEvent);

    return () => {
      websocket.removeEventListener('message', handleEvent);
    };
  }, [websocket]);

  return (
    <main>
      <Container>
        <Box sx={{ my: 2 }}>
          <Typography variant="h3" component="h1" >
            {meetingData.meeting.name}
          </Typography>
          <Typography variant="subtitle1">
            {meetingData.meeting.short_code}
            {" — "}
            {meetingData.participation.name}
          </Typography>
        </Box>
        {meetingSnapshot && meetingSnapshot.participants && (
          <Box sx={{ my: 2 }}>
            {meetingSnapshot.participants.map((participant: any) => (
              <div>
                <CardIcon color={orange} checked={participant.cards.warm} disabled />
                <CardIcon color={blue} checked={participant.cards.cool} disabled />
                <CardIcon color={yellow} checked={participant.cards.question} disabled />
                <Typography variant="body1" component="span">
                  {participant.name}
                </Typography>
              </div>
            ))}
         </Box>
        )}
      </Container>
      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
        <BottomNavigation
          showLabels
          onChange={(event, newValue) => {
            let raised;
            if (newValue === 'warm') {
              raised = !warm;
              setWarm(raised);
            }
            if (newValue === 'cool') {
              raised = !cool;
              setCool(raised);
            }
            if (newValue === 'question') {
              raised = !question;
              setQuestion(raised);
            }
            const msg = { pid: meetingData.participation.id, card: newValue, raised: raised };
            console.log("Sending message", msg);
            websocket.send(JSON.stringify(msg));
          }}
          sx={{ height: 80 }}
        >
          <BottomNavigationAction label="Warm" value="warm" icon={<CardIcon color={orange} checked={warm} />} sx={{ backgroundColor: orange[100] }} />
          <BottomNavigationAction label="Cool" value="cool" icon={<CardIcon color={blue} checked={cool} />} sx={{ backgroundColor: blue[100] }} />
          <BottomNavigationAction label="Question" value="question" icon={<CardIcon color={yellow} checked={question} />} sx={{ backgroundColor: yellow[100] }} />
        </BottomNavigation>
      </Paper>
    </main>
  );
};
