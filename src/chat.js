import {settings} from '../settings';
import React, {Component} from 'react';
import {render} from 'react-dom';
import { createStore } from 'redux';
import { Grid, Row, Col } from 'react-bootstrap';
import moment from 'moment';
//import { syDateFormat } from './Utils/Helper';

window.fbAsyncInit = function() {
  FB.init({
    appId      : settings.fb.app_id,
    xfbml      : false,
    version    : 'v2.8'
  });
  FB.AppEvents.logPageView();
  window.appdata = new AppData(initial_state,createStore);
  };

(function(d, s, id){
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) {return;}
  js = d.createElement(s); js.id = id;
  js.src = "//connect.facebook.net/en_US/sdk.js";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

var initial_state = {
  PAGE_ID:'1661200044095778',
  PAGE_ACCESS_TOKEN:'',
  scopes:'read_mailbox,read_page_mailboxes,manage_pages,publish_pages,pages_show_list'//pages_messaging,pages_messaging_subscriptions
};

class AppData{
  constructor(initial_state,createStore) {
    this.store = createStore(this.reducer,initial_state);
    var that = this;
    FB.login(function(response){

      that.FB_LOGIN().callback(response);

      FB.api(that.GET_PAGES().url,function(response){
        that.GET_PAGES().callback(response);
        rerender();
      });
    },this.store.getState().scopes);
  }

  reducer(state={},action=null){
      switch(action.type){
        case 'FB_LOGIN_RESPONSE_SUCCESS':
          state.authResponse = action.response.authResponse;
          break;
        case 'GET/me/accounts/RESPONSE_SUCCESS':
          state.Pages = action.response;
          break;
        case 'GET/<PAGE_ID>/conversations/RESPONSE_SUCCESS':
          var page_index = state.Pages.data.findIndex(x => x.id === action.PAGE_ID);
          console.log(page_index);
          state.Pages.data[page_index].Conversations = action.response;
          state.Conversations = action.response;
          break;
        default:
          break;
      }

      return state;
  }

  FB_LOGIN(){
    var that = this;
    return ({
      url:'',
      callback:function(response){
        that.store.dispatch({
          type:'FB_LOGIN_RESPONSE_SUCCESS',
          response:response
        });
      }
    });
  }

  GET_PAGES(){
    var that = this;
    return ({
      url : '/me/accounts?access_token='+that.store.getState().authResponse.accessToken,
      callback : function(response){
        if(response.data && response.data.length>=1){
          that.store.dispatch({
            type:'GET/me/accounts/RESPONSE_SUCCESS',
            response:response
          });
        }else{
          console.log(response);
        }
        return response;
      }
    });
  }

  GET_CONVERSATIONS(Page){
    var that = this;
    return({
      url : '/'+Page.id+'/conversations?access_token='+Page.access_token+'&fields=messages{from,id,message,created_time,attachments{id,image_data,mime_type,file_url}},message_count,senders,link,snippet,tags,updated_time,unread_count',
      callback : function(response){
        that.store.dispatch({
          type:'GET/<PAGE_ID>/conversations/RESPONSE_SUCCESS',
          PAGE_ID:Page.id,
          response:response
        });
        rerender();
      }
    });
  }

  initStore(){
    var that = this;
    FB.login(function(response){

      that.FB_LOGIN().callback(response);

      FB.api(that.GET_PAGES().url,function(response){
        that.GET_PAGES().callback(response);
        
      });
    });
  }
}



class PageButton extends Component{

  handleGetConversations = (event) => {
    var obj = this.props.appdata.GET_CONVERSATIONS(this.props.Page);
    FB.api(obj.url,function(response){
      obj.callback(response);
    });
  }

  render(){
    return(
        <section className="PageButton">
          <button className="btn btn-primary" onClick={this.handleGetConversations}>{this.props.Page.name}</button>
        </section>
    );
  }
}

class ConversationCard extends Component{
  render(){
    return(
      <section className={"ConversationCard"+(this.props.Conversation.unread_count ? ' unread' : '')}>
        <Row>
          <Col md={8}>
            <div className="sender_name">{this.props.Conversation.senders.data[0].name}</div>
            <p className="message">{this.props.Conversation.snippet}</p>
          </Col>
          <Col className="updated_time" md={4}>{moment().diff(moment.utc(this.props.Conversation.updated_time),'days') <= 7 ? moment.utc(this.props.Conversation.updated_time).utcOffset(8).fromNow() : moment.utc(this.props.Conversation.updated_time).utcOffset(8).format('YYYY-MM-DD')}</Col>
        </Row>
        
      </section>
    );
  }
}

class ConversationList extends Component{
  render(){
    return(
      <section className="ConversationList">
        {(this.props.Conversations && this.props.Conversations.data.length >= 1)
          ? this.props.Conversations.data.map((Conversation,index)=>(
              <ConversationCard key={Conversation.id} appdata={this.props.appdata} Conversation={Conversation}/>
            ))
          : null
        }
      </section>
    );
  }
}

class ConversationFilter extends Component{
  render(){
    return(
      <section className="ConversationFilter">
        <input className="form-control"/>
        <input className="form-control"/>
        <input className="form-control"/>
        <input className="form-control"/>
        <button></button>
      </section>
    );
  }
}

class ConversationListContainer extends Component{
  render(){
    return(
      <section className="ConversationListContainer">
        <ConversationFilter />      
        <ConversationList Conversations={this.props.Conversations}/>
      </section>
    );
  }
}

class MessengerApp extends Component{
  render(){
    return(
      <section className="MessengerApp">
        {(this.props.data.Pages && this.props.data.Pages.data.length >= 1)
          ? this.props.data.Pages.data.map((Page,index)=>(
              <PageButton key={Page.id} appdata={this.props.appdata} Page={Page}/>
            ))
          : null
        }

        <ConversationListContainer Conversations={this.props.data.Conversations} />

      </section>
    );
  }
}

var rerender = function(){
  render(<MessengerApp data={window.appdata.store.getState()} appdata={window.appdata} />, document.getElementById('app'));
}