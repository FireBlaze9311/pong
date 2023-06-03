import { Page } from "./types"

let current: Page | null = null

export default function load(page: Page){
    current?.destroy()
    document.body.innerHTML = page.render()
    page.onLoaded()
    current = page
}