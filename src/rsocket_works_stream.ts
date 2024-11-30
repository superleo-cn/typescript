import {RSocketConnector,} from "rsocket-core";
import {WebsocketClientTransport} from "rsocket-websocket-client";
import {exit} from "process";
import WebSocket from "ws";
import {encodeCompositeMetadata, encodeRoute, WellKnownMimeType} from "rsocket-composite-metadata";


// 必须使用 ^1.0.0-alpha.3 版本
const url = "wss://api-dev.actqa.com/ws";
// const url = "ws://localhost:9999/ws";
const token = 'Bearer NK2fefNWi7Aj4FjY_sUQyGWkjvhtNgtsrk00PQgOFk4zFoK_yu1vPurI86ur18zQtdwTVQB73iE9OIZXp_xkzawbjIJQI85aWl0rMyLsHgQ=';
const symbolId = "1";
// const route = "topic";
const route = "topic/meme/price"

function makeConnector() {
    return new RSocketConnector({
        transport: new WebsocketClientTransport({
            url: url,
            wsCreator: (url) => new WebSocket(url) as any,
        }),
        setup: {
            keepAlive: 60000,
            lifetime: 180000,
            dataMimeType: 'application/json',  // 对于原始数据
            metadataMimeType: WellKnownMimeType.MESSAGE_RSOCKET_COMPOSITE_METADATA.string,
            payload: {
                // 传token信息
                data: Buffer.from(token),
            }
        }
    });
}


async function main() {
    const connector = makeConnector();
    const rsocket = await connector.connect();

    await new Promise((resolve, reject) => {
        let payloadsReceived = 0;
        const maxPayloads = 10;
        const requester = rsocket.requestStream(
            {
                // 传symboId
                data: Buffer.from(symbolId),
                // 传route
                metadata: makeMetadata(route),
            },
            1,
            {
                onError: (e) => reject(e),
                onNext: (payload, isComplete) => {
                    console.log(`Received payload: ${payload.data.toString()}`);
                    requester.request(1);
                },
                onComplete: () => {
                    resolve(null);
                },
                onExtension: () => {
                },
            }
        );
    });
}


function makeMetadata(route?: string) {
    const map = new Map<WellKnownMimeType, Buffer>();

    if (route) {
        const encodedRoute = encodeRoute(route);
        map.set(WellKnownMimeType.MESSAGE_RSOCKET_ROUTING, encodedRoute);
    }

    return encodeCompositeMetadata(map);
}

main()
    .then(() => exit())
    .catch((error: Error) => {
        console.error(error);
        exit(1);
    })
    .finally(() => {
    });
