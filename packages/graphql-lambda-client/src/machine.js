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

// $FlowIgnoreLine - Yarn workspaces not supported https://github.com/flow-typed/flow-typed/issues/1391
import { Machine } from 'xstate';
import * as services from './services';

import type { ClientContext, ClientEvents, ClientStateSchema } from './types';

export const clientMachine = Machine<ClientContext, ClientStateSchema, ClientEvents>({
  initial: 'idle',
  states: {
    idle: {
      on: {
        CONNECT: {
          target: 'connecting',
        },
      },
    },
    connecting: {
      invoke: {
        id: 'connect',
        src: services.connect,
        onDone: {
          target: 'connected',
          actions: services.onConnectSuccess(),
        },
        onError: [
          {
            target: 'connecting',
            cond: (context) => (context.reconnect
              && context.backoff.attempts <= context.reconnectAttempts),
          },
          { target: 'error' },
        ],
      },
    },
    connected: {
      invoke: {
        id: 'processOperations',
        src: services.processOperations,
      },
      on: {
        // connections has been closed :(
        DISCONNECTED: [
          { target: 'reconnecting', cond: (ctx) => ctx.reconnect },
          { target: 'error' },
        ],
        DISCONNECT: {
          target: 'disconnecting',
        },
      },
    },
    disconnecting: {
      invoke: {
        id: 'disconnect',
        src: services.disconnect,
        onDone: {
          target: 'idle',
          actions: [services.onDisconnectSuccess()],
        },
        onError: {
          target: 'error',
        },
      },
    },
    reconnecting: {
      invoke: {
        id: 'reconnect',
        src: services.reconnect,
        onDone: {
          target: 'reconnected',
          actions: [services.onReconnectSuccess()],
        },
        onError: {
          target: 'error',
        },
      },
    },
    reconnected: {
      on: {
        // connections has been closed :(
        DISCONNECTED: [
          { target: 'reconnecting', cond: (ctx) => ctx.reconnect },
          { target: 'error' },
        ],
        DISCONNECT: {
          target: 'disconnecting',
        },
      },
    },
    // on error remove all pending operations and close are open operations
    error: {},
  },
});

export default clientMachine;
