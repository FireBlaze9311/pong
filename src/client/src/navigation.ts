import { Page } from "./types"

export default function load(page: Page){
    console.log(document.body)
    document.body.innerHTML = page.render()
    page.onLoaded()
}