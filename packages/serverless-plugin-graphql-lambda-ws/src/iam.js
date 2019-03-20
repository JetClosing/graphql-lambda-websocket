// @flow

export const createPolicy = (actions: string | string[], ...resources: mixed[]) => {
  const arrayActions = Array.isArray(actions) ? actions : [actions];
  return {
    Effect: 'Allow',
    Action: arrayActions,
    Resource: resources,
  };
};

export const createWebSocketPolicy = (stage: string) => {
  // https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-control-access-iam.html
  const actions = 'execute-api:ManageConnections';
  const resources = {
    'Fn::Join': [
      ':',
      [
        'arn:aws:execute-api',
        { Ref: 'AWS::Region' },
        { Ref: 'AWS::AccountId' },
        `*/${stage}/*/@connections/*`,
      ],
    ],
  };
  return createPolicy(actions, resources);
};
