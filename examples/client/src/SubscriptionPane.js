import React, { PureComponent } from 'react';
import { Subscription } from 'react-apollo';
import gql from 'graphql-tag';
import TextField from '@material-ui/core/TextField';

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';

const SUBSCRIBE_USER_CREATED = gql`
  subscription UserCreated {
    userCreated {
      userId
      email
      firstName
      lastName
    }
  }
`;

const SUBSCRIBE_USER_UPDATED = gql`
  subscription UserUpdated($userId: ID!) {
    userUpdated(userId: $userId) {
      userId
      email
      firstName
      lastName
    }
  }
`;

const styles = {
  container: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    marginTop: 16,
    marginBottom: 10,
  },
  tableHeader: {
    marginTop: 16,
    marginBottom: 10,
  },
  textField: {
    width: 250,
    marginLeft: 4,
    marginRight: 4,
  },
};

class SubscriptionPane extends PureComponent {
  state = {
    userId: '1234',
    events: [],
  };

  handleSubscription = (data) => {
    // eslint-disable-next-line no-console
    console.log('Received subscription data', data);
    const { subscriptionData } = data;
    const { data: queryResult } = subscriptionData;

    let eventType;
    let eventData;
    if (queryResult.userCreated) {
      eventType = 'Created';
      eventData = queryResult.userCreated;
    } else {
      eventType = 'Updated';
      eventData = queryResult.userUpdated;
    }

    const event = {
      time: Date.now(),
      type: eventType,
      data: eventData,
    };

    this.setState((state) => ({
      events: state.events.concat(event),
    }));
  }

  handleChange = (name) => (event) => {
    this.setState({ [name]: event.target.value });
  };

  renderUserUpdatedInput = () => (
    <TextField
      style={styles.textField}
      label={'userId for update subscriptions'}
      disabled
      value={this.state.userId}
      onChange={this.handleChange('userId')} />
  )

  renderEvent = (event) => {
    const { time, type, data } = event;
    return (
      <TableRow key={time}>
        <TableCell component="th" scope="row">
          {new Date(time).toUTCString()}
        </TableCell>
        <TableCell>{type}</TableCell>
        <TableCell>{JSON.stringify(data)}</TableCell>
      </TableRow>
    );
  }

  renderEventsTable = () => (
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Time</TableCell>
            <TableCell>Event Type</TableCell>
            <TableCell>Data</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {this.state.events.map(this.renderEvent)}
        </TableBody>
      </Table>
  )

  render() {
    return (
      <div style={styles.container}>
        <Subscription
          subscription={SUBSCRIBE_USER_CREATED}
          onSubscriptionData={this.handleSubscription} />

        <Subscription
          subscription={SUBSCRIBE_USER_UPDATED}
          variables={{ userId: '1234' }}
          onSubscriptionData={this.handleSubscription} />

        <h2 style={styles.header}>User Subscription Pane</h2>

        {this.renderUserUpdatedInput()}

        <h4 style={styles.tableHeader}>Subscription Events</h4>
        {this.renderEventsTable()}
      </div>
    );
  }
}

export default SubscriptionPane;
