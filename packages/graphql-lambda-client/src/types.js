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
// $FlowIgnoreLine - Yarn workspaces not supported https://github.com/flow-typed/flow-typed/issues/1391
import type { w3cwebsocket } from 'websocket';
import type { DocumentNode, ExecutionResult } from 'graphql';
// $FlowIgnoreLine - Yarn workspaces not supported https://github.com/flow-typed/flow-typed/issues/1391
import type { StateSchema } from 'xstate';
import type OperationProcessor from './operationProcessor'; // eslint-disable-line import/no-named-as-default

export interface ClientContext {
  backoff: Backoff;
  /**
   * Function to parse messages from server (this will be assigned to socket)
   */
  handleMessage: (event: { data: string }) => mixed;
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

export type OperationRequest = {
  extensions?: { [string]: mixed };
  operationName?: string;
  query: string | DocumentNode;
  variables?: { [string]: mixed };
  [string]: mixed;
};

export type ClientStateSchema = StateSchema & {
  states: {
    idle: ?mixed;
    connecting: ?mixed;
    disconnecting: ?mixed;
    connected: ?mixed;
    reconnecting: ?mixed;
    reconnected: ?mixed;
    error: ?mixed;
  };
};

export type ClientEvents =
  | { type: 'CONNECT' }
  | { type: 'DISCONNECT' }
  | { type: 'DISCONNECTED' };

export type GQLOperation = {
  id: string,
  payload: {
    extensions?: { [string]: mixed };
    operationName?: string;
    query: string | DocumentNode;
    variables?: { [string]: mixed };
    [string]: mixed;
  },
  type: string,
};

type GQLServerEvents = {
  id: string,
  type: string,
};

export type GQLConnectedEvent = GQLServerEvents & {
  payload: {
    [string]: mixed,
  },
};

export type GQLErrorEvent = GQLServerEvents & {
  payload: {
    message: string;
  }
};

export type GQLOperationResult = GQLServerEvents & {
  payload: ExecutionResult,
};

export type GQLSubscribed = GQLServerEvents & {
  payload: {
    [string]: mixed,
  },
};

export type GQLUnsubscribe = GQLServerEvents & {
};

export type GQLUnsubscribed = GQLServerEvents & {
};

export type GQLClientAllEvents = GQLOperation | GQLUnsubscribe;

export type GQLServerAllEvents =
  | GQLConnectedEvent
  | GQLErrorEvent
  | GQLOperationResult
  | GQLSubscribed
  | GQLUnsubscribed;
