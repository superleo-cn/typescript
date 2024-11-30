import { RSocketClient, JsonSerializer, IdentitySerializer } from 'rsocket-core';
import { encodeAndAddCustomMetadata, encodeCustomMetadataHeader, encodeWellKnownMetadataHeader, encodeCompositeMetadata } from 'rsocket-composite-metadata';
import {
    decodeCompositeMetadata,
    decodeRoutes,
    encodeRoutes,
    WellKnownMimeType,
} from "rsocket-composite-metadata";
import RSocketWebSocketClient from 'rsocket-websocket-client';
import { encode, decode } from '@msgpack/msgpack';

// const ENDPOINT = 'wss://api-dev.actqa.com/ws';
const ENDPOINT =  "ws://127.0.0.1:9999/ws";
const SETUP = "setup";
import MESSAGE_RSOCKET_ROUTING = WellKnownMimeType.MESSAGE_RSOCKET_ROUTING;
async function authSuccess() {
    // token信息
    const token = 'Bearer NK2fefNWi7Aj4FjY_sUQyGWkjvhtNgtsrk00PQgOFk4zFoK_yu1vPurI86ur18zQtdwTVQB73iE9OIZXp_xkzawbjIJQI85aWl0rMyLsHgQ=';
    // 要访问��memeId
    const symbolId = "1";

    console.log('Connecting to', ENDPOINT);
    const bb = bearerToken(token);
    const client = new RSocketClient({
        serializers: {
            data: JsonSerializer,
            metadata: IdentitySerializer
        },
        setup: {
            // 设置鉴权信息
            dataMimeType: 'application/json',
            // metadataMimeType: 'message/x.rsocket.routing.v0',
            payload: {
                data: token,
                // metadata: encodeAndAddWellKnownMetadata(
                //     Buffer.alloc(0),
                //     MESSAGE_RSOCKET_ROUTING,
                //     bb,
                // ),
            },

            // payload: {
            //     // data:  bearerToken(token),
            //     metadata: encodeAndAddCustomMetadata(
            //         encodeAndAddWellKnownMetadata(
            //             Buffer.alloc(0),
            //             MESSAGE_RSOCKET_ROUTING,
            //             Buffer.from(String.fromCharCode(SETUP.length) + SETUP)
            //         ),
            //         'message/x.rsocket.authentication.v0',
            //         bearerToken(token)
            //     )
            // }

        },
        transport: new RSocketWebSocketClient({ url: ENDPOINT }),

    });


    client.connect().subscribe({
        onComplete: socket => {
            // 订阅memePrice的实时价格
            socket.requestStream({
                data: Buffer.from(symbolId),
                metadata: encode({
                    route: 'topic/meme/price'
                })
            }).subscribe({
                onNext: payload => {
                    console.log('data is:', JSON.stringify(payload.data, null, 2));
                },
                onError: error => {
                    console.error('error is:', error);
                },
                onComplete: () => {
                    console.log('Stream completed');
                }
            });
        },
        onError: error => {
            console.error('Connection error:', error);
        },
        onSubscribe: cancel => {
            /* call cancel() to abort */
        }
    });

    // Keep the process running
    setTimeout(() => {}, 20000);
}

function bearerToken(token: string): Buffer {
    const buffer = Buffer.alloc(1 + token.length);
    buffer.writeUInt8(0 | 0x80, 0);
    buffer.write(token, 1, 'utf-8');
    return buffer;
}

// see #encodeMetadataHeader(ByteBufAllocator, byte, int)
export function encodeAndAddWellKnownMetadata(
    compositeMetadata: Buffer,
    knownMimeType: WellKnownMimeType | number,
    metadata: Buffer
): Buffer {
    let mimeTypeId: number;

    if (Number.isInteger(knownMimeType)) {
        mimeTypeId = knownMimeType as number;
    } else {
        mimeTypeId = (knownMimeType as WellKnownMimeType).identifier;
    }

    return Buffer.concat([
        compositeMetadata,
        encodeWellKnownMetadataHeader(mimeTypeId, metadata.byteLength),
        metadata,
    ]);
}

authSuccess();
