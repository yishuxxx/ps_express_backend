/**
 * In this file, we create a React component
 * which incorporates components provided by Material-UI.
 */
import React, {Component} from 'react'
import RaisedButton from 'material-ui/RaisedButton';
import Dialog from 'material-ui/Dialog';
import {deepOrange500} from 'material-ui/styles/colors';
import FlatButton from 'material-ui/FlatButton';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import AppBar from 'material-ui/AppBar';
import IconButton from 'material-ui/IconButton';
import NavigationClose from 'material-ui/svg-icons/navigation/close';
import TextField from 'material-ui/TextField';

const styles = {
  container: {
    textAlign: 'center',
    paddingTop: 200,
  },
};

const muiTheme = getMuiTheme({
  palette: {
    accent1Color: deepOrange500,
  },
});

class Main extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      open: false,
    };
  }

  handleRequestClose = () => {
    this.setState({
      open: false,
    });
  }

  handleTouchTap = () => {
    this.setState({
      open: true,
    });
  }

  render() {
    const standardActions = (
      <FlatButton
        label="Ok"
        primary={true}
        onTouchTap={this.handleRequestClose}
      />
    );

    return (
      <MuiThemeProvider muiTheme={muiTheme}>
        <div style={styles.container}>
          <Dialog
            open={this.state.open}
            title="Super Secret Password"
            actions={standardActions}
            onRequestClose={this.handleRequestClose}
          >
            1-2-3-4-5
          </Dialog>
          <AppBar 
            title="TheTitle"
            onTitleTouchTap={this.handleTouchTap}
            iconElementLeft={<IconButton><NavigationClose /></IconButton>}
            />
          <RaisedButton
            label="Super Secret Password"
            secondary={true}
            onTouchTap={this.handleTouchTap}
          />
          <div style={{border:"1px solid red"}}>
          <RaisedButton
            label="This is a raised button"
            secondary={true}
            onTouchTap={this.handleTouchTap}
          />
          </div>
          <div>
            <div id="order">
              <div>
                <label>Email:</label><TextField hintText="yishufoo@gmail.com" /><RaisedButton label="Search"/>
              </div>
              <div>
                <label>FB Name:</label><TextField hintText="Foo Yishuu" />
              </div>
            </div>
          </div>
        </div>
      </MuiThemeProvider>
    );
  }
}

export default Main;
