function urlFor(path: string): string {
  return `http://localhost:8000/api/${path}`;
}

export class CreateMeeting {
  name: string;
  anonymous: boolean;

  constructor(name: string, anonymous: boolean) {
    this.name = name;
    this.anonymous = anonymous;
  }
}

export class Meeting {
  name: string;
  anonymous: boolean;
  shortCode: string;

  constructor(name: string, anonymous: boolean, shortCode: string) {
    this.name = name;
    this.anonymous = anonymous;
    this.shortCode = shortCode;
  }
}

export class APIErrorResponse {
  message: string;

  constructor(message: string) {
    this.message = message;
  }
}

export const createMeeting = async (meetingData: CreateMeeting): Promise<Meeting | APIErrorResponse> => {
  console.log(JSON.stringify(meetingData))
  try {
    const response = await fetch(urlFor('meetings'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
