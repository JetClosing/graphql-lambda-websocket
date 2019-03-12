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

import type Backoff from 'backo2';
import type { w3cwebsocket } from 'websocket';
import type OperationProcessor from './operationProcessor';
import type { DocumentNode, ExecutionResult } from 'graphql';

export interface ClientContext {
  backoff: Backoff;
  /**
   * Function to parse messages from server (this will be assigned to socket)
   */
  handleMessage: (event: { data: string }) => any;
  operationProcessor: OperationProcessor;
  reconnect: boolean;
  reconnectAttempts: number;
  /**
   * Current connected socket (this will be assigned by connect service)
   */
  socket?: w3cwebsocket | null;
  /**
   * Socket endpoint
   */
  uri: string;
  /**
   * Web socket implementation to use
   */
  webSockImpl: typeof w3cwebsocket;
}

export interface ClientStateSchema {
  states: {
    idle: {};
    connecting: {};
    disconnecting: {};
    connected: {};
    reconnecting: {};
    reconnected: {};
    error: {};
  };
}

export type ClientEvents =
  | { type: 'CONNECT' }
  | { type: 'DISCONNECT' }
  | { type: 'DISCONNECTED' };

export type GQLOperation = {
  id: string,
  payload: {
    extensions?: { [string]: any };
    operationName?: string;
    query: string | DocumentNode;
    variables?: { [string]: any };
    [string]: any;
  },
  type: string,
}

type GQLServerEvents = {
  id: string,
  type: string,
};

export type GQLConnectedEvent = GQLServerEvents & {
  payload: {
    [string]: any,
  },
}

export type GQLErrorEvent = GQLServerEvents & {
  payload: {
    message: string;
  }
}

export type GQLOperationResult = GQLServerEvents & {
  payload: ExecutionResult,
}

export type GQLSubscribed = GQLServerEvents & {
  payload: {
    [string]: any,
  },
}

export type GQLServerAllEvents =
  | GQLConnectedEvent
  | GQLErrorEvent
  | GQLOperationResult
  | GQLSubscribed;
