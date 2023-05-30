import Page from "./page";

export default function load(page: Page){
    document.body.innerHTML = page.render()
    page.onLoaded()
}