import React, {Component} from 'react';
import {render} from 'react-dom';
import { createStore } from 'redux';
import { Grid, Row, Col, Button, FormControl } from 'react-bootstrap';

var initial_state = {
  username:'testuser',
  password:'blablablabla'
};

var updateStateDependencies = function(state){
  return state;
}

var reducer = function(state={},action=null){
  console.log(action.type);
  switch(action.type){
    case 'USER_CHANGE':
      state[action.name] = action.value;
      break;
    default:
      break;
  }
  state = updateStateDependencies(state);
  return state;
}

window.rstore = createStore(reducer,initial_state);

class LoginForm extends Component{
  constructor(props,context) {
    super(props,context);
    this.state = props;
    console.log('inside constructor');
    console.log(props);
  }

  componentWillUpdate(nextProps, nextState){
    // perform any preparations for an upcoming update
    console.log('inside componentWillUpdate');
    console.log(nextProps);
    console.log(nextState);
  }

  componentWillReceiveProps(nextProps){
    console.log('inside componentWillReceiveProps');
    console.log(nextProps);
  }

  handleClick = (event) => {

  }

  handleChange = (event) => {
    var changedState = {};
    changedState[event.target.name] = event.target.value;
    //this.setState(obj);
    rstore.dispatch({
      type:'USER_CHANGE',
      name:event.target.name,
      value:event.target.value
    })
    this.setState(changedState);
  }

  render(){
    return(
      <section>
        <form action="<%= base_dir %>/login" method="post">
            <div>
                <label>{'Username:'}</label>
                <input type="text" name="username" onChange={this.handleChange} value={this.state.username}/>
            </div>
            <div>
                <label>{'Password:'}</label>
                <input type="password" name="password" onChange={this.handleChange} value={this.state.password}/>
            </div>
            <div>
                <button type="submit" onClick={this.handleClick}>Log In</button>
            </div>
        </form>
      </section>
    );
  }
}

var rerender = function(){
  render(<LoginForm username={rstore.getState().username} password={rstore.getState().password} />, document.getElementById('app'));
}
window.rerender = rerender;
// Render the main app react component into the app div.
// For more details see: https://facebook.github.io/react/docs/top-level-api.html#react.render
rstore.subscribe(rerender);
rerender();