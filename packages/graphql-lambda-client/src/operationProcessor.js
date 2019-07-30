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
import { type ExecutionResult, Observable } from 'apollo-link';
import { getOperationAST, parse, print } from 'graphql';
import type { w3cwebsocket } from 'websocket';
import { formatMessage } from './formatMessage'; // eslint-disable-line import/no-named-as-default
import { CLIENT_EVENT_TYPES } from './constants';

import type { OperationRequest, GQLOperationResult } from './types';

type GQLOperationRequest = {
  id: string;
  isSubscription: ?boolean;
  observer: Observable.SubscriptionObserver<mixed>;
  operation: OperationRequest;
  clearTimeout: () => void;
  startTimeout: () => void;
  type: 'GQL_OP';
};

type GQLUnsubscribeRequest = {
  /**
   * Same as ID of operation used to start the subscription
   */
  id: string;
  type: 'GQL_UNSUBSCRIBE';
};

type ExecutedOperation = GQLOperationRequest | GQLUnsubscribeRequest;

type Options = {
  /**
   * Number of ms to wait for operation result (in case of subscriptions this is ignored)
   * 0/Infinity is the same
   */
  operationTimeout?: number;
};

export class OperationProcessor {
  executedOperations: { [id: string]: GQLOperationRequest };
  nextOperationId: number;
  queuedOperations: ExecutedOperation[];
  operationTimeout: number;
  stopped: boolean;
  socket: ?w3cwebsocket;

  constructor({ operationTimeout = Infinity }: Options) {
    this.nextOperationId = 0;
    this.stopped = true;
    this.operationTimeout = operationTimeout;
    this.queuedOperations = [];
    this.executedOperations = {};
    this.socket = null;
  }

  // eslint-disable-next-line max-len
  execute = (operation: OperationRequest): Observable<ExecutionResult> => new Observable((observer) => {
    try {
      const query = (typeof operation.query !== 'string'
        ? operation.query
        : parse(operation.query));
      const operationDefinition = getOperationAST(
        query,
        operation.operationName || '',
      );
      const isSubscription = operationDefinition && operationDefinition.operation === 'subscription';
      let tmt = null;
      let closed = false;
      const id = this.generateNextOperationId();
      const op: GQLOperationRequest = {
        id,
        isSubscription,
        observer,
        operation,
        clearTimeout: () => {
          clearTimeout(tmt);
        },
        startTimeout: () => {
          if (
            this.operationTimeout !== Infinity
              && this.operationTimeout !== 0
          ) {
            tmt = setTimeout(() => {
              clearTimeout(tmt);
              delete this.executedOperations[id];

              observer.error(new Error('Timed out'));
            }, this.operationTimeout);
          }
        },
        type: CLIENT_EVENT_TYPES.GQL_OP,
      };

      this.executedOperations[op.id] = op;

      this.send(op);

      if (isSubscription) {
        return {
          get closed() {
            return closed;
          },
          unsubscribe: () => {
            closed = true;
            this.unsubscribeOperation(op.id);
          },
        };
      }
    } catch (e) {
      observer.error(e);
    }

    return undefined;
  });

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

  unsubscribeFromAllOperations = () => {
    Object.keys(this.executedOperations).forEach((id) => {
      this.unsubscribeOperation(id);
    });
  };

  generateNextOperationId = (): string => {
    this.nextOperationId += 1;
    return this.nextOperationId.toString();
  };

  unsubscribeOperation = (id: string) => {
    const executedOperation = this.executedOperations[id];

    if (executedOperation) {
      if (executedOperation.isSubscription) {
        // send STOP event
        this.send({
          id,
          type: CLIENT_EVENT_TYPES.GQL_UNSUBSCRIBE,
        });
      }

      delete this.executedOperations[id];
    } else {
      // this operation is only queued, so it hasn't been sent yet
      this.queuedOperations = this.queuedOperations.filter((op) => {
        if (op.id === id) {
          return false;
        }

        return true;
      });
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
    if (operation.type === CLIENT_EVENT_TYPES.GQL_OP) {
      operation.startTimeout();
    }

    if (this.socket) {
      const message = operation.type === CLIENT_EVENT_TYPES.GQL_OP
        ? {
          type: CLIENT_EVENT_TYPES.GQL_OP,
          id: operation.id,
          payload: {
            ...operation.operation,
            query: (typeof operation.operation.query !== 'string'
              ? print(operation.operation.query)
              : operation.operation.query),
          },
        }
        : {
          type: CLIENT_EVENT_TYPES.GQL_UNSUBSCRIBE,
          id: operation.id,
        };

      // eslint-disable-next-line flowtype/no-flow-fix-me-comments
      // $FlowFixMe
      this.socket.send(formatMessage(message));
    }
  };

  flushQueuedMessages = () => {
    this.queuedOperations.forEach(this.sendRaw);
    this.queuedOperations = [];
  };
}

export default OperationProcessor;
