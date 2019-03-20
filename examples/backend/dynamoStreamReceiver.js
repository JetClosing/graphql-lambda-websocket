// eslint-disable-next-line
const { DynamoDB } = require('aws-sdk');
const { pubSub } = require('graphql-lambda-ws');

const { USER_TABLE_NAME } = process.env;

// A map of DynamoDB table names to cache names
const CacheMap = {
  [USER_TABLE_NAME]: 'User',
};

const ActionMap = {
  MODIFY: 'Updated',
  INSERT: 'Created',
  REMOVE: 'Deleted',
};

// Get the table name from the record.
// Example eventSourceARN: "arn:aws:dynamodb:us-west-2:123456789012:table/GraphQlWsExampleUser/stream/2019-01-01T12:12:12.123"
const getTableName = ({ eventSourceARN }) => eventSourceARN.split(':')[5].split('/')[1];

const handler = async (event) => {
  const { Records } = event;
  const promises = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const record of Records) {
    const tableName = getTableName(record);
    const action = ActionMap[record.eventName];

    const cacheName = CacheMap[tableName];
    if (!cacheName) {
      // eslint-disable-next-line no-console
      console.error('Unknown cache name for table', tableName);
      throw new Error('Unknown cache name');
    }

    const deserializedRecord = DynamoDB.Converter.unmarshall(action !== ActionMap.REMOVE
      ? record.dynamodb.NewImage
      : record.dynamodb.OldImage);

    promises.push(pubSub.publish(`${cacheName}${action}`, deserializedRecord));
  }

  await Promise.all(promises);
};


module.exports = {
  handler,
};
