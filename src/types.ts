import { ChildProcess } from "child_process"

export interface ServerToClientEvents {
  users: (users: User[]) => void
  userConnected: (user: User) => void
  userDisconnected: (user: User) => void
  invitation: (srcUser: User) => void
  error: (message: string) => void
  invitationAccepted: (srcUser: User) => void
  gameInit: (init: GameInitialization) => void
  score: (scoreP1: number, scoreP2: number) => void
  ballPos: (ballPos: Vector) => void
  leftBlockPos: (posY: number) => void
  rightBlockPos: (posY: number) => void
}

export interface ClientToServerEvents {
  inviteUser: (userID: string) => void
  acceptInvitation: (userID: string) => void
  rejectInvitation: (userID: string) => void
  keyDown: (key: Key) => void
  keyUp: (key: Key) => void
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  nickname: string
  invitations: string[]
  gameLoopProcess: ChildProcess
}

export interface AuthData {
  nickname: string
}

export interface User {
  id: string
  nickname: string
}


export interface Vector {
    x: number
    y: number
}

export interface GameInitialization {
  width: number,
  height: number,
  ball: {
    size: number,
    pos: number[]
  },
  leftBlock: {
    height: number,
    width: number,
    margin: number,
    posY: number
  },
  rightBlock: {
    height: number,
    width: number,
    margin: number,
    posY: number
  }
}

export interface IKey{
  arrowUp: boolean, 
  arrowDown: boolean
}

export enum Key{
  ArrowUp, ArrowDown
}