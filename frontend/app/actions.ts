function urlFor(path: string): string {
  return `/api/${path}`
}

export class CreateMeeting {
  meeting_name: string
  user_name: string
  anonymous: boolean

  constructor(meeting_name: string, user_name: string, anonymous: boolean) {
    this.meeting_name = meeting_name
    this.user_name = user_name
    this.anonymous = anonymous
  }
}

export class Meeting {
  name: string
  anonymous: boolean
  shortCode: string

  constructor(name: string, anonymous: boolean, shortCode: string) {
    this.name = name
    this.anonymous = anonymous
    this.shortCode = shortCode
  }
}

export enum Role {
  Host = "host",
  Member = "member",
}

export class Participation {
  id: string
  name: string
  role: Role

  constructor(id: string, name: string, role: string) {
    this.id = id
    this.name = name
    this.role = role as Role
  }
}

export class MeetingResponse {
  meeting: Meeting
  participation: Participation

  constructor(response: any) {
    const m = response.meeting
    this.meeting = new Meeting(m.name, m.anonymous, m.short_code)
    const p = response.participation
    this.participation = new Participation(p.id, p.name, p.role)
  }
}

export class APIErrorResponse {
  message: string
  status_code: number | undefined

  constructor(message: string, status_code?: number) {
    this.message = message
    this.status_code = status_code
  }
}

const getToken = async (): Promise<string> => {
  let token = localStorage.getItem("user-token")
  if (token) {
    return token
  }
  const response = await fetch(urlFor("me"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error("Failed to fetch auth token")
  }
  const data = await response.json()
  token = data.id
  if (!token) {
    throw new Error("Invalid server response: " + JSON.stringify(data))
  }
  localStorage.setItem("user-token", token)
  return token
}

const deleteToken = (): void => {
  localStorage.removeItem("user-token")
}

const defaultHeaders = async () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${await getToken()}`,
})

const handleResponse = async (
  response: Response,
  successType?: any,
): Promise<any> => {
  if (!response.ok) {
    if (response.status === 401) {
      deleteToken()
    }
    return new APIErrorResponse(response.statusText, response.status)
  }

  const data = await response.json()
  if (successType) {
    return new successType(data)
  } else {
    return data
  }
}

export const getName = async (): Promise<string | null> => {
  try {
    const response = await fetch(urlFor("me"), {
      method: "GET",
      headers: await defaultHeaders(),
    })
    const data = await handleResponse(response)
    return data.last_used_name || null
  } catch (error: any) {
    console.warn("Error fetching user data:", error)
    return null
  }
}

export const createMeeting = async (
  meetingData: CreateMeeting,
): Promise<MeetingResponse | APIErrorResponse> => {
  try {
    const response = await fetch(urlFor("meetings"), {
      method: "POST",
      headers: await defaultHeaders(),
      body: JSON.stringify(meetingData),
    })

    return await handleResponse(response, MeetingResponse)
  } catch (error: any) {
    console.error("Error creating meeting:", error)
    return new APIErrorResponse(error.message)
  }
}

export const getMeeting = async (
  shortCode: string,
): Promise<MeetingResponse | APIErrorResponse> => {
  console.log("Fetching meeting with short code:", shortCode)
  try {
    const response = await fetch(urlFor(`meetings/${shortCode}`), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await getToken()}`,
      },
    })

    return await handleResponse(response, MeetingResponse)
  } catch (error: any) {
    console.error("Error fetching meeting:", error)
    return new APIErrorResponse(error.message)
  }
}

export const joinMeeting = async (
  shortCode: string,
  userName: string,
): Promise<MeetingResponse | APIErrorResponse> => {
  try {
    const response = await fetch(urlFor(`meetings/${shortCode}/participants`), {
      method: "POST",
      headers: await defaultHeaders(),
      body: JSON.stringify({ user_name: userName }),
    })

    return await handleResponse(response, MeetingResponse)
  } catch (error: any) {
    console.error("Error joining meeting:", error)
    return new APIErrorResponse(error.message)
  }
}

export const leaveMeeting = async (
  shortCode: string,
  participationId: string,
): Promise<MeetingResponse | APIErrorResponse> => {
  try {
    const response = await fetch(
      urlFor(`meetings/${shortCode}/participants/${participationId}`),
      {
        method: "DELETE",
        headers: await defaultHeaders(),
      },
    )

    return await handleResponse(response)
  } catch (error: any) {
    console.error("Error leaving meeting:", error)
    return new APIErrorResponse(error.message)
  }
}

export const changeRole = async (
  shortCode: string,
  participationId: string,
  role: Role,
): Promise<MeetingResponse | APIErrorResponse> => {
  try {
    const response = await fetch(
      urlFor(`meetings/${shortCode}/participants/${participationId}`),
      {
        method: "PATCH",
        headers: await defaultHeaders(),
        body: JSON.stringify({ role: role }),
      },
    )

    return await handleResponse(response)
  } catch (error: any) {
    console.error("Error updating participant:", error)
    return new APIErrorResponse(error.message)
  }
}

export const createSimulatedParticipant = async (
  shortCode: string,
): Promise<any> => {
  try {
    const response = await fetch(
      urlFor(`meetings/${shortCode}/simulated_participants`),
      {
        method: "POST",
        headers: await defaultHeaders(),
      },
    )

    return await handleResponse(response)
  } catch (error: any) {
    console.error("Error creating simulated participant:", error)
    return new APIErrorResponse(error.message)
  }
}
