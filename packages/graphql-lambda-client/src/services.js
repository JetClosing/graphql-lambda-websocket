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

import { actions } from 'xstate';

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

      const onOpen = () => {
        // reset backoff
        backoff.reset();

        socket.onopen = null;
        socket.onerror = null;
        resolve(socket);
      };

      const onError = (err: Error) => {
        socket.onopen = null;
        socket.onerror = null;
        reject(err);
      };

      socket.onerror = onError;
      socket.onopen = onOpen;
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

export function disconnect({ socket }: ClientContext): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      if (socket == null) {
        resolve();
        return;
      }

      /* eslint-disable no-param-reassign */
      const onClose = () => {
        socket.onerror = null;
        socket.onclose = null;
        resolve();
      };

      const onError = (err: Error) => {
        socket.onerror = null;
        socket.onclose = null;
        reject(err);
      };

      socket.onclose = onClose;
      socket.onerror = onError;
      /* eslint-enable no-param-reassign */

      // disconnect socket
      socket.close();
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

    /* eslint-disable no-param-reassign */
    function onClose() {
      socket.onclose = null;
      operationProcessor.stop();
      callback('DISCONNECTED'); // this will trigger reconnect or error
    }

    // register to connection close
    socket.onclose = onClose;

    return () => {
      operationProcessor.stop();
      socket.onclose = null;
    };
    /* eslint-enable no-param-reassign */
  };
}
