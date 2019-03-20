// @flow

import { PubSub } from 'aws-lambda-graphql';
import eventStore from './eventStore';

export { withFilter } from 'aws-lambda-graphql';

export const pubSub = new PubSub({ eventStore });
