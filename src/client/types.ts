export interface Page {
    render(): string,
    onLoaded(): void
}

export interface IEvent {
    type: string,
    data?: any,
    message?: string,
}

export interface GameConfigurationData {
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