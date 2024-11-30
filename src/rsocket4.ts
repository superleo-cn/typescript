import { RSocketClient, JsonSerializer, JsonDeserializer } from 'rsocket-core';
import { RSocketWebSocketClient } from 'rsocket-websocket-client';

import * as WebSocket from 'ws'; // 如果你需要通过 WebSocket 客户端来连接
import { log } from 'console'; // 可以根据需要替换为你的日志库

// 模拟你的 Result 类
class Result {
    // 这里可以定义你的 Result 类字段
}
const ENDPOINT =  "ws://127.0.0.1:9999/ws";
async function authSuccess() {
    // token信息
    const token = 'Bearer NK2fefNWi7Aj4FjY_sUQyGWkjvhtNgtsrk00PQgOFk4zFoK_yu1vPurI86ur18zQtdwTVQB73iE9OIZXp_xkzawbjIJQI85aWl0rMyLsHgQ=';
    // 要访问的 memeId
    const symbolId = 1;

    // 设置 WebSocket 客户端连接

    const rsocketClient = new RSocketClient({
        transport: new RSocketWebSocketClient({ url: ENDPOINT }),
        serializers: {
            // 传递序列化和反序列化的方式
            data: JsonSerializer,
            metadata: JsonSerializer,
        },
        setup: {
            keepAlive: 60000,
            lifetime: 180000,
            dataMimeType: 'application/json',
            metadataMimeType: 'application/json',
            payload: {
                data: token,
            },
        },
    });

    try {
        // 连接到 RSocket 服务
        const socket = await rsocketClient.connect();

        // 订阅memePrice的实时价格
        socket.requestStream({
            metadata: JsonSerializer.serialize('topic/meme/price'),
            data: JsonSerializer.serialize(symbolId),
        })
            .doOnTerminate(() => {
                log('Stream terminated');
            })
            .subscribe({
                onNext: (response) => {
                    const result: Result = JsonDeserializer.deserialize(response.data);
                    log('Data received:', result);
                },
                onError: (error) => {
                    log('Error:', error);
                },
                onComplete: () => {
                    log('Stream completed');
                },
            });
    } catch (error) {
        log('Connection failed:', error);
    }

    // 模拟线程等待（你可以根据实际需求调整）
    setTimeout(() => {
        log('Timeout reached');
    }, 2000000);
}

// 调用 authSuccess 方法
authSuccess();
