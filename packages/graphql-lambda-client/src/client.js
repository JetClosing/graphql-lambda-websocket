// @flow
/**
 * MIT License
 * 
 * Copyright (c) 2019 JetClosing
 * Copyright (c) 2019 Michal Kvasničák
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import Backoff from 'backo2';
import { EventEmitter } from 'eventemitter3';
import { interpret, Interpreter } from 'xstate/lib/interpreter';
import { w3cwebsocket } from 'websocket';
import { SERVER_EVENT_TYPES } from './constants';
import { clientMachine } from './machine';
import OperationProcessor from './operationProcessor';

import type EventEmitterType, { ListenerFn } from 'eventemitter3';
import type { ClientContext, ClientEvents, ClientStateSchema } from './types';
import type { OperationRequest, GQLServerAllEvents, GQLServerEvents } from './types';


const globalOrWindow =
  typeof global !== 'undefined'
    ? global
    : typeof window !== 'undefined'
    ? window
    : {};
const NativeWebSocket = globalOrWindow.WebSocket || globalOrWindow.MozWebSocket;

type Options = {
  options?: {
    lazy?: boolean;
    /**
     * Number of ms to wait for operation result (in case of subscriptions this is ignored)
     * 0/Infinity is the same
     */
    operationTimeout?: number;
    reconnect?: boolean;
    /**
     * How many times we should try to reconnect?
     * If Infinity is given, then it is inifinite
     */
    reconnectAttempts?: number;
  };
  /**
   * Web socket endpoint
   */
  uri: string;
  webSockImpl?: w3cwebsocket;
};

export class GraphQlLambdaClient {
  machine: Interpreter<ClientContext, ClientStateSchema, ClientEvents>;
  lazy: boolean;
  ee: EventEmitterType;
  operationProcessor: OperationProcessor;

  constructor({
    uri,
    options: {
      lazy = false,
      operationTimeout = Infinity,
      reconnect = false,
      reconnectAttempts = Infinity,
    } = {},
    webSockImpl = NativeWebSocket,
  }: Options) {
    const backoff = new Backoff({ jitter: 0.5 });

    if (webSockImpl == null) {
      throw new Error(
        'Not native WebSocket implementation detected, please provide an implementation',
      );
    }

    this.lazy = lazy;
    this.ee = new EventEmitter();
    this.operationProcessor = new OperationProcessor({ operationTimeout });
    this.machine = interpret(
      clientMachine.withContext({
        backoff,
        reconnect,
        reconnectAttempts,
        uri,
        handleMessage: this.handleMessage,
        operationProcessor: this.operationProcessor,
        webSockImpl: webSockImpl,
      }),
    ).start();

    this.machine.onTransition(state => {
      this.ee.emit(state.value, state.event.data);
    });

    if (!this.lazy) {
      this.machine.send('CONNECT');
    }
  }

  disconnect = () => {
    this.machine.send('DISCONNECT');
  };

  request = (operation: OperationRequest) => {
    if (this.lazy) {
      this.machine.send('CONNECT'); // if client is already connected, this won't do anything
    }

    return this.operationProcessor.execute(operation);
  }

  get status(): string {
    return this.machine.state.value;
  }

  on = (event: string, listener: ListenerFn): Function => {
    this.ee.on(event, listener);

    return () => this.ee.off(event, listener);
  };

  onConnecting = (listener: ListenerFn): Function => {
    return this.on('connecting', listener);
  }

  onConnected = (listener: ListenerFn): Function => {
    return this.on('connected', listener);
  }

  onDisconnected = (listener: ListenerFn): Function => {
    return this.on('disconnected', listener);
  }

  onError = (listener: ListenerFn): Function => {
    return this.on('error', listener);
  }

  onMessage = (listener: ListenerFn): Function => {
    return this.on('message', listener);
  }

  onReconnecting = (listener: ListenerFn): Function => {
    return this.on('reconnecting', listener);
  }

  onReconnected = (listener: ListenerFn): Function => {
    return this.on('reconnected', listener);
  }

  handleMessage = (event: { data: string }) => {
    try {
      const message: GQLServerAllEvents = JSON.parse(event.data);

      switch (message.type) {
        case SERVER_EVENT_TYPES.GQL_OP_RESULT: {
          this.operationProcessor.processOperationResult(message);
          break;
        }
        case SERVER_EVENT_TYPES.GQL_CONNECTED: {
          // connected
        }
        case SERVER_EVENT_TYPES.GQL_ERROR: {
          // error
        }
        case SERVER_EVENT_TYPES.GQL_SUBSCRIBED: {
          // subcribed
          break;
        }
        default: {
          throw new Error('Unknown message');
        }
      }

      this.ee.emit('message', message);
    } catch (e) {
      this.ee.emit('error', e);
      throw e;
    }
  };
}

export default GraphQlLambdaClient;