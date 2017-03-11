/**
 * In this file, we create a React component
 * which incorporates components provided by Material-UI.
 */
import React, {Component} from 'react'

import {deepOrange500} from 'material-ui/styles/colors';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

import AutoComplete from 'material-ui/AutoComplete';

const muiTheme = getMuiTheme({
  palette: {
    accent1Color: deepOrange500,
  },
});

var MainMDB = React.createClass({

getInitialState:function() {
  return({dataSource:[]});
},
handleUpdateInput:function(value) {
  this.setState({
    dataSource: [
      value,
      value + value,
      value + value + value,
    ],
  });
},
render:function() {
    return (
      <div>
        <div className="row">
            <div className="col-md-6">
                <div className="card">
                    <div className="view overlay hm-white-slight">
                        <img src="https://mdbootstrap.com/images/reg/reg%20(2).jpg" className="img-fluid" alt="" />
                        <a>
                            <div className="mask"></div>
                        </a>
                    </div>
                    <div className="card-block">
                        <h4 className="card-title">Card title</h4>
                        <p className="card-text">Some quick example text to build on the card title and make up the bulk of the cards content.</p>
                        <a className="btn btn-primary">Button</a>
                    </div>
                </div>
            </div>
        </div>

        <div className="row">
        <div className="col-md-6">
          <MuiThemeProvider muiTheme={muiTheme}>
            <div>
            <AutoComplete
              hintText="Type anything"
              dataSource={this.state.dataSource}
              onUpdateInput={this.handleUpdateInput}
            />
            <AutoComplete
              hintText="Type anything"
              dataSource={this.state.dataSource}
              onUpdateInput={this.handleUpdateInput}
              floatingLabelText="Full width"
            />
            </div>
          </MuiThemeProvider>
          <div className="md-form">
              <input type="text" id="form1" className="form-control" />
              <label className="">FB Name:</label>
          </div>
          <div className="md-form">
              <button className="btn btn-primary">Search</button>
          </div>
        </div>
        </div>
      </div>
    );
  }

});

export default MainMDB;
