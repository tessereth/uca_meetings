import {
  AppBar,
  Avatar,
  Box,
  Container,
  Toolbar,
  Typography,
} from "@mui/material"
import { Link } from "react-router"

export default function PrimaryNav() {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Container>
          <Toolbar>
            <Avatar>
              <img
                src="/static/icon.png"
                alt="UCA Meetings"
                width="95%"
                height="95%"
              />
            </Avatar>
            <Typography
              variant="h5"
              noWrap
              component={Link}
              to="/"
              sx={{
                mx: 2,
                fontFamily: "monospace",
                fontWeight: 700,
                color: "inherit",
                textDecoration: "none",
              }}
            >
              UCA Meetings
            </Typography>
          </Toolbar>
        </Container>
      </AppBar>
    </Box>
  )
}
