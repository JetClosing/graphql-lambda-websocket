import React, { PureComponent } from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';

const MUTATE_QUERY = gql`
  mutation PutUser($userId: ID!, $email: String, $firstName: String, $lastName: String) {
    putUser(userId: $userId, email: $email, firstName: $firstName, lastName: $lastName) {
      userId
      email
      firstName
      lastName
    }
  }
`;

const styles = {
  container: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    marginTop: 16,
    marginBottom: 10,
  },
  textField: {
    width: 250,
    marginLeft: 4,
    marginRight: 4,
  },
  button: {
    marginTop: 16,
  },
};

class MutationPane extends PureComponent {
  state = {
    userId: '1234',
    email: 'joe@example.com',
    firstName: 'Joe',
    lastName: 'Schmoe',
  };

  handleChange = (name) => (event) => {
    this.setState({ [name]: event.target.value });
  };

  handleMutate = (mutate) => () => {
    // eslint-disable-next-line no-console
    console.log('Submitting mutation', this.state);
    mutate({ variables: this.state });
  }

  renderTextField = (label, key) => (
    <TextField
      key={key}
      style={styles.textField}
      label={label}
      value={this.state[key]}
      onChange={this.handleChange(key)} />
  )

  render() {
    return (
      <Mutation mutation={MUTATE_QUERY}>
        {(submitMutation) => (
          <div style={styles.container}>
            <h2 style={styles.header}>User Mutation Pane</h2>
            <form noValidate autoComplete="off" onSubmit={this.handleMutate(submitMutation)}>
              {this.renderTextField('User ID', 'userId')}
              {this.renderTextField('Email', 'email')}
              {this.renderTextField('First Name', 'firstName')}
              {this.renderTextField('Last Name', 'lastName')}
            </form>
            <Button
              variant="contained"
              style={styles.button}
              onClick={this.handleMutate(submitMutation)}>
              Put User
            </Button>
          </div>
        )}
      </Mutation>
    );
  }
}

export default MutationPane;
