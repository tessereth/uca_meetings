import { BottomNavigation, BottomNavigationAction, Box, Checkbox, Container, FormControlLabel, Paper, Typography } from '@mui/material';
import type { Route } from '../routes/+types/meeting';
import { useLoaderData } from 'react-router';
import { useState } from 'react';
import { orange, blue, yellow } from '@mui/material/colors';

function CardIcon({ color, checked }: { color: any, checked: boolean }) {
  return <Checkbox size="large" checked={checked} sx={{
      color: color[800],
      '&.Mui-checked': {
        color: color[600],
      },
    }} />
}

export default function Meeting(params: Route.LoaderArgs) {
  const data = useLoaderData();
  const [warm, setWarm] = useState(false);
  const [cool, setCool] = useState(false);
  const [question, setQuestion] = useState(false);
  return (
    <main>
      <Container>
        <Box sx={{ my: 2 }}>
          <Typography variant="h3" component="h1" >
            {data.meeting.name}
          </Typography>
          <Typography variant="subtitle1">
            {data.meeting.short_code}
            {" — "}
            {data.participation.name}
          </Typography>
        </Box>
      </Container>
      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
        <BottomNavigation
          showLabels
          onChange={(event, newValue) => {
            if (newValue === 'warm') {
              setWarm(!warm);
            }
            if (newValue === 'cool') {
              setCool(!cool);
            }
            if (newValue === 'question') {
              setQuestion(!question);
            }
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
