import {
    RSocketClient,
    JsonSerializer,
    IdentitySerializer,
    RSocketResumableTransport,
    RSocketConnector,
    WebsocketClientTransport,
    toBuffer, createBuffer
} from "rsocket-core";
import RSocketWebSocketClient from "rsocket-websocket-client";
import { Flowable } from "rsocket-flowable";
import {encode} from "@msgpack/msgpack";
import {WellKnownMimeType, encodeCompositeMetadata, encodeRoute} from "rsocket-composite-metadata";
import {encodeAndAddWellKnownMetadata} from "./rsocket";


// token信息
const token = 'Bearer NK2fefNWi7Aj4FjY_sUQyGWkjvhtNgtsrk00PQgOFk4zFoK_yu1vPurI86ur18zQtdwTVQB73iE9OIZXp_xkzawbjIJQI85aWl0rMyLsHgQ=';
// 要访问��memeId
const symbolId = "1";
const ROUTE = "topic";

const connector = new RSocketConnector({
    transport: new WebsocketClientTransport({
        url: "ws://localhost:9999/ws",
        wsCreator: (url) => new WebSocket(url) as any,
    }),
});

const rsocket = await connector.connect();

// 配置 RSocket 客户端
// const client = new RSocketClient({
//     transport: new RSocketWebSocketClient({
//         url: "ws://localhost:9999/ws",
//     }),
//     serializers: {
//         data: JsonSerializer,
//         metadata: IdentitySerializer,
//     },
//     setup: {
//         dataMimeType: "application/json", // 指定数据 MIME 类型
//         metadataMimeType: "message/x.rsocket.routing.v0", // 指定元数据 MIME 类型
//         keepAlive: 60000,
//         lifetime: 180000,
//         // data: JSON.stringify({ key: token }), // 传递初始 Payload 数据
//     },
// });

// const metadataBuffer = encodeCompositeMetadata([
//     [TEXT_PLAIN, Buffer.from('Hello World')],
//     [MESSAGE_RSOCKET_ROUTING, () => encodeRoute(getTokenRoute)],
//     [MESSAGE_RSOCKET_AUTHENTICATION, () => encodeSimpleAuthMetadata(username, password)]
// ]);
// eslint-disable-next-line no-underscore-dangle
// metadataBuffer._isBuffer = true;

// 连接服务端并发送 RequestStream 请求
rsocket.connect().subscribe({
    onComplete: (socket) => {
        console.log("Connected to RSocket server");

        // 创建一个 RequestStream 请求
        socket.requestStream({
            data: Buffer.from(symbolId),
            // metadata: encodeAndAddWellKnownMetadata(
            //     Buffer.alloc(0),
            //     WellKnownMimeType.MESSAGE_RSOCKET_ROUTING,
            //     Buffer.from('topic', 'utf-8')
            // ),
            metadata: createRoute(ROUTE)
        }).subscribe({
            onNext: (payload) => {
                console.log('data is:', JSON.stringify(payload.data, null, 2));
            },
            onError: (error) => {
                console.error("Stream error:", error);
            },
            onComplete: () => {
                console.log("Stream completed");
            },
            onSubscribe: (subscription) => {
                subscription.request(100); // 请求最多 100 条响应
            },
        });
    },
    onError: (error) => {
        console.error("Connection error:", error);
    },
    onSubscribe: (cancel) => {
        console.log("Trying to connect...");
    },
});

function bearerToken(token: string): Buffer {
    const buffer = Buffer.alloc(1 + token.length);
    buffer.writeUInt8(0 | 0x80, 0);
    buffer.write(token, 1, 'utf-8');
    return buffer;
}

function createRoute(route?: string) {
    let compositeMetaData = undefined;
    if (route) {
        const encodedRoute = encodeRoute(route);

        const map = new Map<WellKnownMimeType, Buffer>();
        map.set(WellKnownMimeType.MESSAGE_RSOCKET_ROUTING, encodedRoute);
        compositeMetaData = encodeCompositeMetadata(map);
    }
    return compositeMetaData;
}
