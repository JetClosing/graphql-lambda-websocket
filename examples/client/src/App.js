import React from 'react';
import { ApolloProvider } from 'react-apollo';

import Divider from '@material-ui/core/Divider';
import { createApolloClient } from './apolloClient';
import MutationPane from './MutationPane';
import SubscriptionPane from './SubscriptionPane';

const apolloClient = createApolloClient();

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  title: {
    marginTop: 32,
    marginBottom: 16,
  },
  divider: {
    alignSelf: 'stretch',
  },
};

function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <div style={styles.container}>
        <h1 style={styles.title}>graphql-lambda-websocket Example Client</h1>
        <Divider style={styles.divider}/>
        <MutationPane/>
        <Divider style={styles.divider}/>
        <SubscriptionPane/>
      </div>
    </ApolloProvider>
  );
}

export default App;
