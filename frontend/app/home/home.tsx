import {
  Box,
  Button,
  Container,
  Divider,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material"
import { Form, useLoaderData } from "react-router"
import type { Route } from "../routes/+types/home"

export default function Home(params: Route.LoaderArgs) {
  const loaderData = useLoaderData()

  const renderCreate = !loaderData.shortCode

  return (
    <main>
      <Container>
        <Box sx={{ m: 2 }}>
          <Typography variant="h3" component="h2" sx={{ my: 2 }}>
            Join a meeting
          </Typography>
          <Form method="post">
            <input name="formType" hidden defaultValue="join" />
            <Stack direction="column" spacing={2}>
              <TextField
                name="shortCode"
                label="Meeting ID"
                variant="outlined"
                defaultValue={loaderData.shortCode}
              />
              <TextField
                name="userName"
                label="User Name"
                variant="outlined"
                defaultValue={loaderData.name}
              />
              <Button type="submit" variant="contained">
                Join
              </Button>
            </Stack>
          </Form>
        </Box>
        {renderCreate && (
          <>
            <Divider sx={{ py: 2 }} />
            <Box sx={{ m: 2 }}>
              <Typography variant="h3" component="h2" sx={{ my: 2 }}>
                Create a meeting
              </Typography>
              <Form method="post">
                <input name="formType" hidden defaultValue="create" />
                <Stack direction="column" spacing={2}>
                  <TextField
                    name="meetingName"
                    label="Meeting Name"
                    variant="outlined"
                  />
                  <TextField
                    name="userName"
                    label="User Name"
                    variant="outlined"
                    defaultValue={loaderData.name}
                  />
                  <FormControlLabel
                    control={<Switch name="anonymous" />}
                    label="Anonymous"
                  />
                  <Button type="submit" variant="contained">
                    Create
                  </Button>
                </Stack>
              </Form>
            </Box>
          </>
        )}
      </Container>
    </main>
  )
}
