export interface Page{
    render(): string,
    onLoaded(): void
}

export interface IEvent{
    type: string,
    data?: any,
    message?: string,
}