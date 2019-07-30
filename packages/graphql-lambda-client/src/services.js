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
import { actions } from 'xstate';

// $FlowIgnoreLine - Yarn workspaces not supported https://github.com/flow-typed/flow-typed/issues/1391
import type { Sender } from 'xstate';
import type { w3cwebsocket } from 'websocket';
import type { ClientContext, ClientEvents } from './types';

const { assign } = actions;

export function connect({
  backoff,
  handleMessage,
  uri,
  webSockImpl: WebSockImpl,
}: ClientContext): Promise<w3cwebsocket> {
  return new Promise((resolve, reject) => {
    try {
      const socket = new WebSockImpl(uri);

      socket.onerror = (err: Error) => {
        socket.onopen = undefined;
        socket.onerror = undefined;
        reject(err);
      };

      socket.onopen = () => {
        // reset backoff
        backoff.reset();

        socket.onopen = undefined;
        socket.onerror = undefined;
        resolve(socket);
      };

      socket.onmessage = handleMessage;
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * After connection is successful assign returned socket to context
 */
export function onConnectSuccess() {
  return assign((ctx, event) => ({ ...ctx, socket: event.data }));
}

export async function reconnect(context: ClientContext): Promise<w3cwebsocket> {
  // wait for backoff
  const duration = context.backoff.duration();

  await new Promise((r) => setTimeout(r, duration));

  return connect(context);
}

export const onReconnectSuccess = onConnectSuccess;

export function disconnect({
  operationProcessor,
  socket,
}: ClientContext): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      operationProcessor.unsubscribeFromAllOperations();

      if (socket == null) {
        resolve();
      } else {
        /* eslint-disable no-param-reassign */
        socket.onclose = () => {
          socket.onerror = undefined;
          socket.onclose = undefined;
          resolve();
        };
        socket.onerror = (err) => {
          socket.onerror = undefined;
          socket.onclose = undefined;
          reject(err);
        };
        /* eslint-enable no-param-reassign */

        // disconnect socket
        socket.close();
      }
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Removes socket on successful disconnect
 */
export function onDisconnectSuccess() {
  return assign<ClientContext>((ctx) => ({ ...ctx, socket: null }));
}

/**
 * Processes operations (basically this runs only if client is connected)
 */
export function processOperations({
  operationProcessor,
  socket,
}: ClientContext) {
  return (callback: Sender<ClientEvents>) => {
    if (socket == null) {
      return undefined;
    }

    // start operation processor
    operationProcessor.start(socket);
    // register to connection close
    // eslint-disable-next-line no-param-reassign
    socket.onclose = () => {
      // eslint-disable-next-line no-param-reassign
      socket.onclose = undefined;
      operationProcessor.stop();
      callback('DISCONNECTED'); // this will trigger reconnect or error
    };

    return () => {
      operationProcessor.stop();
      // eslint-disable-next-line no-param-reassign
      socket.onclose = undefined;
    };
  };
}
