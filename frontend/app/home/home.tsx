import { useState } from "react";
import { Box, Button, Container, Divider, FormControlLabel, Stack, Switch, TextField, Typography } from "@mui/material";
import { createMeeting, CreateMeeting, APIErrorResponse } from "~/actions";

export function Home() {
  const [meetingId, setMeetingId] = useState("");
  const [meetingName, setMeetingName] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  const onJoin = () => {
    console.log("Joining meeting with ID:", meetingId);
  }
  const onCreate = async () => {
    const meetingData = new CreateMeeting(meetingName, anonymous);
    console.log("Creating meeting:", meetingData);

    const response = await createMeeting(meetingData)
    if (response instanceof APIErrorResponse) {
      console.error("Error creating meeting:", response.message);
      // TODO: Show error message to user
    }
    else {
      console.log("Meeting created successfully:", response);
      // TODO: Redirect to the meeting page
    }
  }

  return (
    <main>
      <Container>
        <Box sx={{ m: 2 }}>
          <Typography variant="h3" component="h2" sx={{ my: 2 }}>
            Join a meeting
          </Typography>
          <Stack direction="column" spacing={2}>
            <TextField
              label="Meeting ID"
              variant="outlined"
              value={meetingId}
              onChange={(e) => setMeetingId(e.target.value)}
            />
            <Button variant="contained" onClick={onJoin}>Join</Button>
          </Stack>
        </Box>
        <Divider sx={{ py : 2 }} />
        <Box sx={{ m: 2 }}>
          <Typography  variant="h3" component="h2" sx={{ my: 2 }}>
            Create a meeting
          </Typography>
          <Stack direction="column" spacing={2}>
            <TextField
              label="Meeting Name"
              variant="outlined"
              value={meetingName}
              onChange={(e) => setMeetingName(e.target.value)}
            />
            <FormControlLabel control={
              <Switch value={anonymous} onChange={(e) => setAnonymous(!e.target.disabled)} />
              } label="Anonymous" />
            <Button variant="contained" onClick={onCreate}>Create</Button>
          </Stack>
        </Box>
      </Container>
    </main>
  );
}

