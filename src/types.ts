export interface ServerToClientEvents {
  noArg: () => void;
  basicEmit: (a: number, b: string, c: Buffer) => void;
  withAck: (d: string, callback: (e: number) => void) => void;
  users: (users: User[]) => void
  userConnected: (user: User) => void
  userDisconnected: (user: User) => void
}

export interface ClientToServerEvents {
  hello: () => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  nickname: string;
}

export interface AuthData{
  nickname: string
}

export interface User{
  id: string
  nickname: string
}