import { HStack, Button, Container, Heading, Box, Field, Stack, Input } from "@chakra-ui/react";
import { useState } from "react";

function onJoin(meetingId: string) {
  console.log("Joining meeting with ID:", meetingId);
}

export function Home() {
  const [meetingId, setMeetingId] = useState("");
  return (
    <main>
      <Container>
        <Heading as="h1">UCA Meetings</Heading>
        <Stack>
          <Box>
            <Heading as="h2">
              Join a meeting
            </Heading>
            <Field.Root>
              <Field.Label>
                Meeting ID
              </Field.Label>
              <Input value={meetingId} onChange={(e) => setMeetingId(e.target.value)} />
            </Field.Root>
            <Button onClick={() => onJoin(meetingId)}>Join</Button>
          </Box>
        </Stack>
      </Container>
    </main>
  );
}

