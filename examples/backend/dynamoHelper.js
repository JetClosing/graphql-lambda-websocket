// eslint-disable-next-line
const { DynamoDB } = require('aws-sdk');

const docClient = new DynamoDB.DocumentClient();

const { USER_TABLE_NAME } = process.env;

const getUser = (userId) => docClient.get({
  TableName: USER_TABLE_NAME,
  Key: { userId },
}).promise();

const putUser = (user) => docClient.put({
  TableName: USER_TABLE_NAME,
  Item: user,
}).promise();

module.exports = {
  getUser,
  putUser,
};
