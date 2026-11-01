import { CONJURE_LIB_INIT } from "../../../the-cloud/the-cloud/solutions/libraries_init"
import { CSEAdapter, CSEMessage } from "../types";

const mqtt = CONJURE_LIB_INIT('mqtt')
const aedes = CONJURE_LIB_INIT('aedes')
const net = CONJURE_LIB_INIT('net')


// ─── MQTT ─────────────────────────────────────────────────────────────────
export function mqttAdapter(brokerUrl: string, topic: string = 'staff'): CSEAdapter {
    let messageHandler: ((msg: CSEMessage) => void) | null = null
    let connectHandler: (() => void) | null = null
    let disconnectHandler: (() => void) | null = null
    const messageQueue: CSEMessage[] = []

    const client = mqtt.connect(brokerUrl)

    client.on('connect', () => {
        client.subscribe(topic)
        while (messageQueue.length > 0) client.publish(topic, JSON.stringify(messageQueue.shift()!))
        connectHandler?.()
    })
    client.on('message', (_topic: string, raw: Buffer) => {
        try { messageHandler?.(JSON.parse(raw.toString()) as CSEMessage) } catch { }
    })
    client.on('close', () => disconnectHandler?.())

    return {
        send(msg) {
            if (client.connected) { client.publish(topic, JSON.stringify(msg)) }
            else { messageQueue.push(msg) }
        },
        onMessage(handler) { messageHandler = handler; return () => { messageHandler = null } },
        onConnect(handler) { connectHandler = handler },
        onDisconnect(handler) { disconnectHandler = handler }
    }
}

export function startMQTTBroker(port: number = 1883): () => void {
    const server = net.createServer(aedes.handle)
    server.listen(port)
    return () => { aedes.close(); server.close() }
}
