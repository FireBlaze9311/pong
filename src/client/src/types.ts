export interface Page {
    render(): string,
    onLoaded(): void,
    destroy(): void
}