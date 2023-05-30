import { IEvent } from "./types"

export default class EventHandler{
    private callBacks: Map<string, (event: IEvent) => void> = new Map()
    
    register(type: string, handler: (event: IEvent) => void){
        this.callBacks.set(type, handler)    
    }

    handle(ev: MessageEvent<any>){
        let event: IEvent = JSON.parse(ev.data) as IEvent
        let handler = this.callBacks.get(event.type)
        if (handler == undefined){
            console.warn(`Event "${event.type}" not registerd.`)
        }
        else{
            handler(event)
        }
    }
}