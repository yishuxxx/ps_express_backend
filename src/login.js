import {settings} from '../settings';
import React, {Component} from 'react';
import {render} from 'react-dom';
import { createStore } from 'redux';
import { Grid, Row, Col, Button, FormControl } from 'react-bootstrap';

var initial_state = {
  username:'',
  password:'',
  redirect:window.store.redirect
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
        <h2 style={{textAlign:'center'}}>SY Online Venture</h2>
        <h3 style={{textAlign:'center'}}>Log In</h3>
        <br/>
        <br/>
        <br/>
        <Row>
          <Col md={4}></Col>
          <Col md={4}>
            <form className="form-horizontal" action={settings.base_dir+'/login'+(initial_state.redirect ? '?redirect='+initial_state.redirect : "")} method="post">

              <div className="form-group">
                <label className="col-sm-2 control-label">Email</label>
                <div className="col-sm-10">
                  <input className="form-control" type="text" name="username" onChange={this.handleChange} value={this.state.username}/>
                </div>
              </div>

              <div className="form-group">
                <label className="col-sm-2 control-label">Password</label>
                <div className="col-sm-10">
                  <input className="form-control" type="password" name="password" onChange={this.handleChange} value={this.state.password}/>
                </div>
              </div>

              <div className="form-group">
                <div className="col-sm-offset-2 col-sm-10">
                  <button type="submit" className="btn btn-default">Log in</button>
                </div>
              </div>

            </form>
          </Col>
          <Col md={4}></Col>
        </Row>
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