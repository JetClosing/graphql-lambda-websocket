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

import { Observable } from 'apollo-link';
import { getOperationAST, parse, print } from 'graphql';
import { ulid } from 'ulid';
import formatMessage from './formatMessage';

import type { OperationRequest, GQLOperation, GQLOperationResult } from './types';
import type { w3cwebsocket } from 'websocket';

type ExecutedOperation = {
  id: string;
  isSubscription: boolean;
  observer: ZenObservable.SubscriptionObserver<any>;
  operation: OperationRequest;
  clearTimeout: () => void;
  startTimeout: () => void;
};

type Options = {
  /**
   * Number of ms to wait for operation result (in case of subscriptions this is ignored)
   * 0/Infinity is the same
   */
  operationTimeout?: number;
};

export class OperationProcessor {
  executedOperations: { [id: string]: ExecutedOperation };
  queuedOperations: ExecutedOperation[];
  operationTimeout: number;
  stopped: boolean;
  socket: ?w3cwebsocket;

  constructor({ operationTimeout = Infinity }: Options = {}) {
    this.stopped = true;
    this.operationTimeout = operationTimeout;
    this.queuedOperations = [];
    this.executedOperations = {};
    this.socket = null;
  }

  execute = (operation: OperationRequest) => {
    return new Observable(observer => {
      try {
        const query = (typeof operation.query !== 'string'
          ? operation.query
          : parse(operation.query));
        const isSubscription = getOperationAST(
            query,
            operation.operationName || '',
          ).operation === 'subscription';
        let tmt = null;
        const id = ulid();
        const op: ExecutedOperation = {
          id,
          isSubscription,
          observer,
          operation,
          clearTimeout: () => {
            clearTimeout(tmt);
          },
          startTimeout: () => {
            if (
              this.operationTimeout !== Infinity &&
              this.operationTimeout !== 0
            ) {
              tmt = setTimeout(() => {
                clearTimeout(tmt);
                delete this.executedOperations[id];

                observer.error(new Error('Timed out'));
              }, this.operationTimeout);
            }
          },
        };

        this.executedOperations[op.id] = op;

        this.send(op);
      } catch (e) {
        observer.error(e);
      }
    });
  };

  processOperationResult = (event: GQLOperationResult) => {
    // if operation is a subscription, just stream a value
    // otherwise stream value and close observable (and remove it from operations)
    const operation = this.executedOperations[event.id];

    if (operation) {
      operation.clearTimeout();

      operation.observer.next(event.payload);

      if (!operation.isSubscription) {
        delete this.executedOperations[event.id];
        operation.observer.complete();
      }
    }
  };

  start = (socket: w3cwebsocket) => {
    this.socket = socket;
    this.stopped = false;

    // send all pending operations
    this.flushQueuedMessages();
  };

  stop = () => {
    this.stopped = true;
    this.socket = null;
  };

  send = (operation: ExecutedOperation) => {
    // if is stopped, queue
    if (this.stopped) {
      this.queuedOperations.push(operation);
    } else {
      this.sendRaw(operation);
    }
  };

  sendRaw = (operation: ExecutedOperation) => {
    const query = (typeof operation.operation.query !== 'string'
      ? print(operation.operation.query)
      : operation.operation.query);
    const message: GQLOperation = {
      id: operation.id,
      payload: {
        ...operation.operation,
        query,
      },
      type: 'GQL_OP',
    };

    this.socket.send(formatMessage(message));
    operation.startTimeout();
  };

  flushQueuedMessages = () => {
    this.queuedOperations.forEach(this.sendRaw);
    this.queuedOperations = [];
  };
}

export default OperationProcessor;