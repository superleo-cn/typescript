/*
 * Copyright 2021-2022 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
    OnExtensionSubscriber,
    OnNextSubscriber,
    OnTerminalSubscriber,
    Payload,
    RSocketConnector,
    RSocketServer,
} from "rsocket-core";
import { WebsocketClientTransport } from "rsocket-websocket-client";
import { exit } from "process";
import WebSocket from "ws";
import {encodeCompositeMetadata, encodeRoute, WellKnownMimeType} from "rsocket-composite-metadata";
import MESSAGE_RSOCKET_AUTHENTICATION = WellKnownMimeType.MESSAGE_RSOCKET_AUTHENTICATION;
import MESSAGE_RSOCKET_ROUTING = WellKnownMimeType.MESSAGE_RSOCKET_ROUTING;
import {MESSAGE_RSOCKET_COMPOSITE_METADATA} from "rsocket-composite-metadata/dist/WellKnownMimeType";

function makeConnector() {
    return new RSocketConnector({
        transport: new WebsocketClientTransport({
            url: "ws://localhost:9999/ws",
            wsCreator: (url) => new WebSocket(url) as any,
        }),
        setup: {
            keepAlive: 60000,
            lifetime: 180000,
            dataMimeType: 'application/json',  // 对于原始数据
            metadataMimeType: WellKnownMimeType.MESSAGE_RSOCKET_COMPOSITE_METADATA.string,
            payload: {
                data: Buffer.from('your-token-here'),
                metadata: makeMetadata(ROUTE, ROUTE),

            }
        }
    });

}

const symbolId = "1";
const ROUTE = "topic";

async function main() {
    const connector = makeConnector();
    const rsocket = await connector.connect();

    await new Promise((resolve, reject) => {
        let payloadsReceived = 0;
        const maxPayloads = 10;
        const requester = rsocket.requestStream(
            {
                data: Buffer.from("1"),
                // metadata: createRoute(ROUTE)
                metadata: makeMetadata(ROUTE, ROUTE)
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
                onExtension: () => {},
            }
        );
    });
}

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

function makeMetadata(bearerToken?: string, route?: string) {
    const map = new Map<WellKnownMimeType, Buffer>();

    // if (bearerToken) {
    //     map.set(
    //         MESSAGE_RSOCKET_AUTHENTICATION,
    //         encodeBearerAuthMetadata(Buffer.from(bearerToken))
    //     );
    // }

    if (route) {
        const encodedRoute = encodeRoute(route);
        map.set(MESSAGE_RSOCKET_ROUTING, encodedRoute);
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
