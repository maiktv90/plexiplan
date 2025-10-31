interface IUser {
  username: string;
  email: string;
}

interface CsrfTokenResponse {
  csrf: string;
}

export type { IUser, CsrfTokenResponse };
