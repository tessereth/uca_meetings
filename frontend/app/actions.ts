function urlFor(path: string): string {
  return `http://localhost:8000/api/${path}`;
}

export class CreateMeeting {
  meeting_name: string;
  user_name: string;
  anonymous: boolean;

  constructor(meeting_name: string, user_name: string, anonymous: boolean) {
    this.meeting_name = meeting_name;
    this.user_name = user_name;
    this.anonymous = anonymous;
  }
}

export class Meeting {
  name: string;
  anonymous: boolean;
  short_code: string;

  constructor(name: string, anonymous: boolean, short_code: string) {
    this.name = name;
    this.anonymous = anonymous;
    this.short_code = short_code;
  }
}

export class APIErrorResponse {
  message: string;

  constructor(message: string) {
    this.message = message;
  }
}

export const getToken = async (): Promise<string> => {
  let token = localStorage.getItem('user-token');
  if (token) {
    return token;
  }
  const response = await fetch(urlFor('me'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch auth token');
  }
  const data = await response.json();
  token = data.id;
  if (!token) {
    throw new Error('Invalid server response: ' + JSON.stringify(data));
  }
  localStorage.setItem('user-token', token);
  return token;
}

export const createMeeting = async (meetingData: CreateMeeting): Promise<Meeting | APIErrorResponse> => {
  console.log(JSON.stringify(meetingData))
  try {
    const response = await fetch(urlFor('meetings'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getToken()}`,
      },
      body: JSON.stringify(meetingData),
    });

    if (!response.ok) {
      return new APIErrorResponse(response.statusText);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error creating meeting:', error);
    return new APIErrorResponse(error.message);
  }
};
