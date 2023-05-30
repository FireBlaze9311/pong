import Event from "./IEvent";

export default class EventHandler{
    private callBacks: Map<string, (event: Event) => void> = new Map()
    
    register(type: string, handler: (event: Event) => void){
        this.callBacks.set(type, handler)    
    }

    handle(ev: MessageEvent<any>){
        let event: Event = JSON.parse(ev.data) as Event
        let handler = this.callBacks.get(event.type)
        if (handler == undefined){
            console.warn(`Event "${event.type}" not registerd.`)
        }
        else{
            handler(event)
        }
    }
}