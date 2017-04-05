import {settings} from '../settings';
import _ from 'lodash';
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
  scopes:'read_mailbox,read_page_mailboxes,manage_pages,publish_pages,pages_show_list',//pages_messaging,pages_messaging_subscriptions
  bulk_messages:[''],
  bulk_message_queue:[]
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
        case 'SET_CURRENT_PAGE':
          state.pid_current = action.pid;
          break;
        case 'FB_LOGIN_RESPONSE_SUCCESS':
          state.authResponse = action.response.authResponse;
          break;
        case 'GET/me/accounts/RESPONSE_SUCCESS':
          state.Pages = action.response;
          state.Pages.is = [];
          action.response.data.map((item,i)=>{state.Pages.is[item.id] = i;});
          break;
        case 'GET/<PAGE_ID>/conversations/RESPONSE_SUCCESS':
        case 'GETMORE/<PAGE_ID>/conversations/RESPONSE_SUCCESS':
          var pi = state.Pages.data.findIndex(x => x.id === action.PAGE_ID);

          if(action.type === 'GETMORE/<PAGE_ID>/conversations/RESPONSE_SUCCESS'){
            state.Pages.data[pi].Conversations.data = state.Pages.data[pi].Conversations.data.concat(action.response.data);
          }else{
            state.Pages.data[pi].Conversations = action.response;
          }
          state.Pages.data[pi].Conversations.paging = action.response.paging;
          state.Conversations = state.Pages.data[pi].Conversations;
          state.bulk_message_queue = [];
          break;
        case 'CHANGE_BULK_MESSAGE':
          state.bulk_messages[action.i] = action.bulk_message;
          break;
        case 'CONVERSATION_HIGHLIGHT_CLICK':
        case 'CONVERSATION_HIGHLIGHT_SHIFT_CLICK':
          var ti = state.Conversations.data.findIndex(x => x.id === action.Conversation.id);

          if(action.type === 'CONVERSATION_HIGHLIGHT_SHIFT_CLICK'){
            var last_highlight_state = state.Conversations.data[state.last_highlight_i].highlight;
            var min_i = Math.min(ti,state.last_highlight_i);
            var max_i = Math.max(ti,state.last_highlight_i);
            var list = Array.apply(null, {length: (max_i - min_i +1)}).map(Number.call, Number);
            list.map((item,i)=>{
              list[i] = list[i] + min_i;
              state.Conversations.data[list[i]].highlight = last_highlight_state;
            });
          }else if(action.type === 'CONVERSATION_HIGHLIGHT_CLICK'){
            state.Conversations.data[ti].highlight = !state.Conversations.data[ti].highlight;
            state.last_highlight_i = ti;
          }
          break;
        case 'ADD_BULK_MESSAGE_QUEUE':
          var message = state.bulk_messages[action.i];
          console.log(action.i);
          console.log(message);
          state.Conversations.data.map((Conversation,i)=>{
            if(Conversation.highlight){
              state.bulk_message_queue.push({t_mid:Conversation.id,message:message});
              Conversation.highlight = false;
              Conversation.queued_message = message;
            }
          });
          break;
        case 'SEND_BULK_MESSAGE':
          var FBSendMessage = function(bulk_message_queue){
            var citem = bulk_message_queue.shift();
            var t_mid = citem.t_mid;
            var message = citem.message;
            var pi = state.Pages.data.findIndex(x => x.id === state.pid_current);
            var ti = state.Conversations.data.findIndex(x => x.id === t_mid);;
            var page_access_token = state.Pages.data[pi].access_token;
            FB.api(
              '/'+t_mid+'/messages?access_token='+page_access_token+'&message='+message+'&fields=created_time,from,message',
              'POST',
              function(response){
                console.log(response);
                if(response.id){
                  if(bulk_message_queue.length){
                    FBSendMessage(bulk_message_queue);
                  }else{
                    state.Conversations.data.map((Conversation,i)=>{
                      Conversation.queued_message = '';
                    });
                    rerender();
                  }
                  state.Conversations.data[ti].sent_message = message;
                  state.Conversations.data[ti].sent_m_mid = response.id;
                  rerender();
                }else{
                  alert('Failed to send message...');
                }
            });
          }
          FBSendMessage(state.bulk_message_queue);

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
      url : '/'+Page.id+'/conversations?access_token='+Page.access_token+'&fields=messages.limit(5){from,id,message,created_time,attachments{id,image_data,mime_type,file_url}},message_count,senders,link,snippet,tags,updated_time,unread_count&limit=100',
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

  GETMORE_CONVERSATIONS(Page){
    var that = this;
    return({
      url : Page.Conversations.paging.next,
      callback : function(response){
        that.store.dispatch({
          type:'GETMORE/<PAGE_ID>/conversations/RESPONSE_SUCCESS',
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
    this.props.appdata.store.dispatch({
      type:'SET_CURRENT_PAGE',
      pid:this.props.Page.id
    });

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
  constructor(props,context) {
    super(props,context);
    this.state = {highlight:false,show_more_messages:false}; 
  }

  componentWillReceiveProps(nextProps) {
    this.setState({highlight:nextProps.Conversation.highlight});
  }

  shouldComponentUpdate(nextProps, nextState) {
    if(this.props.Conversation.highlight == nextProps.highlight){
      return false;
    }else{
      return true;
    }
  }

  handleHighlight = (event) => {

    if(event.shiftKey){
      this.props.appdata.store.dispatch({
        type:'CONVERSATION_HIGHLIGHT_SHIFT_CLICK',
        Conversation:this.props.Conversation
      });
      rerender();
    }else{
      this.props.appdata.store.dispatch({
        type:'CONVERSATION_HIGHLIGHT_CLICK',
        Conversation:this.props.Conversation
      });
      this.setState({highlight:!this.state.highlight});
    }
  }

  handleShowMoreMessages = (event) => {
    this.setState({show_more_messages:true});
  }

  render(){
    return(
      <section 
        className={ "ConversationCard"
                    +(this.props.Conversation.unread_count ? ' unread' : '')
                    +(this.state.highlight ? ' alert-info' : '')
                    +(this.props.Conversation.queued_message ? ' alert-warning' : '')
                    +(this.props.Conversation.sent_message ? ' alert-success' : '')
                  }
      >
        <Row onClick={this.handleHighlight}>
          <Col md={5}>
            <div className="sender_name">{this.props.Conversation.senders.data[0].name}</div>
            <div className="message" onClick={this.handleShowMoreMessages}>{
                this.state.show_more_messages 
                ? (this.props.Conversation.messages.data.map((message,i)=>(
                    <div key={message.id}>{message.message}</div>
                  )))
                : this.props.Conversation.snippet}
            </div>
          </Col>
          <Col className="updated_time" md={3}>{moment().diff(moment.utc(this.props.Conversation.updated_time),'days') <= 7 ? moment.utc(this.props.Conversation.updated_time).utcOffset(8).fromNow() : moment.utc(this.props.Conversation.updated_time).utcOffset(8).format('YYYY-MM-DD')}</Col>
          <Col className="queued_message" md={2}>{this.props.Conversation.queued_message}</Col>
          <Col className="sent_message" md={2}>{this.props.Conversation.sent_message}</Col>
        </Row>
        
      </section>
    );
  }
}

class ConversationList extends Component{
  constructor(props,context) {
    super(props,context);
    this.state = {load_more:5};
  }

  handleLoadMoreChange = (event) => {
    this.setState({load_more:event.target.value});
  }

  handleGetMoreConversations = (event) => {

    var load_more = this.state.load_more;
    var obj = this.props.appdata.GETMORE_CONVERSATIONS(this.props.Page);
    var url = obj.url;

    var getmore = function(url){
      FB.api(url,function(response){
        obj.callback(response);
        if(response.data && load_more > 0 && response.paging && response.paging.next){
          url = response.paging.next;
          getmore(url);
          load_more = load_more - 1;
        }
      });
    }
    getmore(url);

  }

  onKeyPress = (event) => {
    console.log(event.key);
    if(event.key == '1' || event.key == '2' || event.key == '3' || event.key == '4') { 
      this.props.appdata.store.dispatch({
        type:'ADD_BULK_MESSAGE_QUEUE',
        i:parseInt(event.key,10)-1
      });
      rerender();
    } 
  }

  render(){
    return(
      <section className="ConversationList">
        <div tabIndex="1"onKeyPress={this.onKeyPress}>
        {(this.props.Conversations && this.props.Conversations.data.length >= 1)
          ? this.props.Conversations.data.map((Conversation,index)=>(
              <ConversationCard key={Conversation.id} appdata={this.props.appdata} Conversation={Conversation}/>
            ))
          : null
        }
        <input onChange={this.handleLoadMoreChange} value={this.state.load_more} />
        <button className="btn btn-primary" onClick={this.handleGetMoreConversations}>LOAD MORE</button>
        </div>
      </section>
    );
  }
}
/*
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
*/
class ConversationListContainer extends Component{
  render(){
    return(
      <section className="ConversationListContainer">   
        <ConversationList appdata={this.props.appdata} Page={this.props.Page} Conversations={this.props.Conversations}/>
      </section>
    );
  }
}

class BulkMessageQueue extends Component{
  constructor(props,context) {
    super(props,context);
    this.state = {bulk_message:''}
  }

  handleMessageChange = (event) => {
    this.setState({bulk_message:event.target.value});
    this.props.appdata.store.dispatch({
      type:'CHANGE_BULK_MESSAGE',
      i:this.props.i,
      bulk_message:event.target.value
    });
  }

  handleAddBulkMessageQueue = (event) => {
    this.props.appdata.store.dispatch({
      type:'ADD_BULK_MESSAGE_QUEUE',
      i:this.props.i,      
      message:this.state.bulk_message
    });
    rerender();
  }

  render(){
    return(
      <section className="BulkMessageQueue">
        <textarea className="form-control" value={this.state.bulk_message} onChange={this.handleMessageChange}/>
        <button className="btn btn-primary" onClick={this.handleAddBulkMessageQueue}>QUEUE</button>
      </section>
    );
  }
}


class BulkMessageSender extends Component{
  handleSendBulkMessage = (event) => {
    this.props.appdata.store.dispatch({
      type:'SEND_BULK_MESSAGE'
    });
  }

  render(){
    return(
      <section className="BulkMessageSender">
        <button className="btn btn-primary btn-lg" onClick={this.handleSendBulkMessage}>SEND</button>
      </section>
    );
  }
}

class MessengerApp extends Component{
  render(){
    return(
      <section className="MessengerApp">
        <Row>
          <Col md={3}>
            {(this.props.data.Pages && this.props.data.Pages.data.length >= 1)
              ? this.props.data.Pages.data.map((Page,index)=>(
                  <PageButton key={Page.id} appdata={this.props.appdata} Page={Page}/>
                ))
              : null
            }
          </Col>
          <Col md={6}>
            <ConversationListContainer appdata={this.props.appdata} Page={this.props.data.Pages.data[1]} Conversations={this.props.data.Conversations} />
          </Col>
          <Col md={3}>
            <BulkMessageQueue appdata={this.props.appdata} i={0}/>
            <BulkMessageQueue appdata={this.props.appdata} i={1}/>
            <BulkMessageQueue appdata={this.props.appdata} i={2}/>
            <BulkMessageQueue appdata={this.props.appdata} i={3}/>
            <BulkMessageSender appdata={this.props.appdata}/>
          </Col>
        </Row>




      </section>
    );
  }
}

var rerender = function(){
  render(<MessengerApp data={window.appdata.store.getState()} appdata={window.appdata} />, document.getElementById('app'));
}