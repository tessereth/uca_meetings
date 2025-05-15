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

export class JoinMeeting {
  user_name: string;

  constructor(user_name: string) {
    this.user_name = user_name;
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

const getToken = async (): Promise<string> => {
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

const deleteToken = (): void => {
  localStorage.removeItem('user-token');
}

export const getName = async (): Promise<string | null> => {
  try {
    const response = await fetch(urlFor('me'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getToken()}`,
      },
    });

    if (!response.ok) {
      console.warn('Error fetching user data:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data.last_used_name || null;
  } catch (error: any) {
    console.warn('Error fetching user data:', error);
    return null;
  }
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
      if (response.status === 401) {
        deleteToken();
      }
      return new APIErrorResponse(response.statusText);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error creating meeting:', error);
    return new APIErrorResponse(error.message);
  }
};

export const joinMeeting = async (shortCode: string, userName: string): Promise<Meeting | APIErrorResponse> => {
  console.log("Joining meeting with short code:", shortCode);
  try {
    const response = await fetch(urlFor(`meetings/${shortCode}/participants`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getToken()}`,
      },
      body: JSON.stringify({user_name: userName}),
    });

    if (!response.ok) {
      if (response.status === 401) {
        deleteToken();
      }
      return new APIErrorResponse(response.statusText);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error creating meeting:', error);
    return new APIErrorResponse(error.message);
  }
};
