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
  window.rstore = appdata.store;
  };

(function(d, s, id){
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) {return;}
  js = d.createElement(s); js.id = id;
  js.src = "//connect.facebook.net/en_US/sdk.js";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

var initial_state = {
  scopes:'read_page_mailboxes,manage_pages,publish_pages,pages_show_list',//pages_messaging,pages_messaging_subscriptions
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
    },{scope:this.store.getState().scopes});
  }

  reducer(state={},action=null){
      switch(action.type){
        case 'SET_CURRENT_PAGE':
          var pi = state.Pages.data.findIndex(x => x.id === action.pid);  
          state.PageC = state.Pages.data[pi];
          state.pid_current = state.PageC.id;
          break;
        case 'FB_LOGIN_RESPONSE_SUCCESS':
          state.authResponse = action.response.authResponse;
          break;
        case 'GET/me/accounts/RESPONSE_SUCCESS':
          state.Pages = action.response;
          state.Pages.is = [];
          action.response.data.map((item,i)=>{state.Pages.is[item.id] = i;});
          break;
        case 'GET/<PAGE_ID>/conversations':
          var pi = state.Pages.data.findIndex(x => x.id === state.pid_current);
          var obj = appdata.GET_CONVERSATIONS(state.Pages.data[pi]);
          FB.api(obj.url,function(response){
            obj.callback(response);
          });
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
        case 'GET/<CONVERSATION_ID>/messages':
          var pi = state.Pages.data.findIndex(x => x.id === state.pid_current);
          var Page = state.Pages.data[pi];
          var conv_i = Page.Conversations.data.findIndex(x => x.id === action.t_mid);
          var Conversation_P = Page.Conversations.data[conv_i];
          var Conversation = state.Conversations.data[conv_i];
          var url = '/'+action.t_mid+'/messages?access_token='+Page.access_token+'&fields=message,id,created_time,from&limit=100';
          FB.api(url,function(response){
            Conversation.messages = response;
            Conversation_P.messages = response;
            state.t_mid_current = Conversation.id;
            state.ConversationC = Conversation;
            rerender();
          });
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


class PageSelection extends Component{

  handlePageChange = (event) => {
    rstore.dispatch({
      type:'SET_CURRENT_PAGE',
      pid:event.target[event.target.selectedIndex].value
    });
    rstore.dispatch({
      type:'GET/<PAGE_ID>/conversations'
    });
  }

  render(){
    return(
        <section className="PageSelection">
          <Row>
            <Col md={4}>{"Select Page : "}</Col>
            <Col md={8}>
              <select className="form-control" onChange={this.handlePageChange}>
                  <option value={""}>{""}</option>
                {this.props.Pages.data.map((Page,i)=>(
                  <option key={Page.id} value={Page.id}>{Page.name}</option>
                ))}
              </select>
            </Col>
          </Row>
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

  handleHighlight = (event) => {
    event.stopPropagation();
    if(event.shiftKey){
      rstore.dispatch({
        type:'CONVERSATION_HIGHLIGHT_SHIFT_CLICK',
        Conversation:this.props.Conversation
      });
      rerender();
    }else{
      rstore.dispatch({
        type:'CONVERSATION_HIGHLIGHT_CLICK',
        Conversation:this.props.Conversation
      });
      rerender();
    }
  }

  handleShowMoreMessages = (event) => {
    event.stopPropagation();
    this.setState({show_more_messages:true});
  }

  handleGetMessages = (event) => {
    rstore.dispatch({
      type:'GET/<CONVERSATION_ID>/messages',
      t_mid:this.props.Conversation.id
    });
  }

  render(){
    var messages = this.props.Conversation.messages.data.slice(0,4);

    return(
      <section 
        className={ "ConversationCard"
                    +(this.props.Conversation.unread_count ? ' unread' : '')
                    +(this.props.Conversation.queued_message ? ' alert-warning' : '')
                    +(this.props.Conversation.sent_message ? ' alert-success' : '')
                    +(this.props.ConversationC && this.props.Conversation.id === this.props.ConversationC.id ? ' active' : '')                    
                  }
        onClick={this.handleGetMessages}
      >
        <Row>
          <Col md={1}><button className={"btn"+(this.props.Conversation.highlight ? ' btn-primary' : ' btn-default')} onClick={this.handleHighlight}>{this.props.i+1}</button></Col>
          <Col md={7}>
            <div>
              <span className="sender_name">
                {this.props.Conversation.senders.data[0].name}
              </span>
              <span className="updated_time">{moment().diff(moment.utc(this.props.Conversation.updated_time),'days') <= 7 ? moment.utc(this.props.Conversation.updated_time).utcOffset(8).fromNow() : moment.utc(this.props.Conversation.updated_time).utcOffset(8).format('YYYY-MM-DD')}</span>
            </div>

            <span className="message" onClick={this.handleShowMoreMessages}>
              {
                this.state.show_more_messages 
                ? (messages.map((message,i)=>(
                    <div key={message.id}>{message.message}</div>
                  )))
                : <div className="snippet">{this.props.Conversation.snippet ? this.props.Conversation.snippet : '[ IMAGE | STICKER ? ]'}</div>
              }
            </span>
          </Col>
          <Col className="queued_message" md={2}>{this.props.Conversation.queued_message}</Col>
          <Col className="sent_message" md={2}>{this.props.Conversation.sent_message}</Col>
        </Row>
        
      </section>
    );
  }
}

class ConversationListBox extends Component{
  constructor(props,context) {
    super(props,context);
    this.state = {load_more:5,paging_current:0,loading:false};
  }

  shouldComponentUpdate(nextProps, nextState) {
    return true;
  }

  handleLoadMoreChange = (event) => {
    this.setState({load_more:event.target.value});
  }

  handleGetMoreConversations = (event) => {

    this.setState({loading:true});
    var load_more_queue = this.state.load_more;
    var obj = appdata.GETMORE_CONVERSATIONS(this.props.Page);
    var url = obj.url;
    var that = this;

    var getmore = function(url){
      FB.api(url,function(response){
        obj.callback(response);
        if(response.data && load_more_queue > 0 && response.paging && response.paging.next){
          load_more_queue = load_more_queue - 1;
          if(load_more_queue){
            getmore(response.paging.next);
          }else if(load_more_queue == 0){
            that.setState({loading:false});
          }
        }
      });
    }
    getmore(url);

  }

  onKeyPress = (event) => {
    var list = ['1','2','3','4','5','6','7','8','9'];
    if(list.findIndex(event.key)) { 
      rstore.dispatch({
        type:'ADD_BULK_MESSAGE_QUEUE',
        i:parseInt(event.key,10)-1
      });
      rerender();
    } 
  }

  handleFirst = (event) => {
    this.setState({paging_current:0});
  }

  handleLast = (event) => {
    var total_items = this.props.Conversations.data.length;
    var total_pages = Math.ceil(total_items/100);
      this.setState({paging_current:total_pages-1});
  }

  handlePrevious = (event) => {
    if(this.state.paging_current !== 0){
      this.setState({paging_current:this.state.paging_current-1});
    }
  }

  handleNext = (event) => {
    var total_items = this.props.Conversations.data.length;
    var total_pages = Math.ceil(total_items/100);
    if(this.state.paging_current !== total_pages-1){
      this.setState({paging_current:this.state.paging_current+1});
    }
  }

  handlePagingChange = (event) => {
    this.setState({paging_current:parseInt(event.target.attributes.getNamedItem('data-paging').value,10)});
  }

  render(){
    var paging_per_page = 10;
    var paging_current = this.state.paging_current;
    var total_items = this.props.Conversations.data.length;
    var x10_offset = Math.floor(paging_current/paging_per_page) * paging_per_page;
    var list = Array.apply(null, {length: paging_per_page}).map(Number.call, Number).map((x,i)=>(x = x + x10_offset));
    var total_pages = Math.ceil(total_items/100);

    if(this.props.Conversations && this.props.Conversations.data.length >= 1){
      var PagingBtns = list.map((i,i2)=>{
        if(i<total_pages){
          return <button 
                  key={'paging_'+(i)} 
                  className={"btn btn-sm"+(this.state.paging_current === i ? " btn-primary" : " btn-default")} 
                  onClick={this.handlePagingChange} 
                  data-paging={i} >
                  {i+1}
                </button>;
        }else{
          return null;
        }
      });
    }

    return(
      <section className="ConversationListBox">
        <Row className="header">
          <Col md={1}>No.</Col>
          <Col md={4}>Name/Msg</Col>
          <Col md={3}>Time</Col>
          <Col md={2}>Queued Msg</Col>
          <Col md={2}>Sent Msg</Col>
        </Row>

        <div className="ConversationList" tabIndex="1" onKeyPress={this.onKeyPress}>

          {(this.props.Conversations && this.props.Conversations.data.length >= 1)
            ? this.props.Conversations.data.map((Conversation,index)=>{
                if(Math.floor(index/100) === this.state.paging_current){
                  return <ConversationCard key={Conversation.id} Conversation={Conversation} ConversationC={this.props.ConversationC} i={index}/>
                }else{
                  return null;
                }
              })
            : null
          }
        </div>

        {(this.props.Conversations && this.props.Conversations.data.length >= 1)
          ?  <div className="btn-toolbar" role="toolbar">
              <div className="btn-group" role="group">
                <button className="btn btn-sm btn-default" onClick={this.handleFirst}>{"<<"}</button>
                <button className="btn btn-sm btn-default" onClick={this.handlePrevious}>Prev</button>
              </div>
              <div className="btn-group" role="group">
                {PagingBtns}
              </div>
              <div className="btn-group" role="group">
                <button className="btn btn-sm btn-default" onClick={this.handleNext}>Next</button>
                <button className="btn btn-sm btn-default" onClick={this.handleLast}>{">>"}</button>
              </div>
            </div>
          : null
        }

        <Row>
          <Col md={1}>
            <input className="load_more_repeat form-control" onChange={this.handleLoadMoreChange} value={this.state.load_more} />
          </Col>

          <Col md={2}>
            <button className="btn btn-primary" disabled={this.state.loading} onClick={this.handleGetMoreConversations}>LOAD MORE</button>
          </Col>
        </Row>

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


class MessageManager extends Component{
  constructor(props,context) {
    super(props,context);
    this.state = {message_create:''};
  }

  handleConversationMessageChange = (event) => {
    this.setState({message_create:event.target.value});
  }

  handleConversationMessageSubmit = (event) => {
    /*
    this.setState({message_create:''});
    rstore.dispatch({
      type:'MESSAGE_SEND',
      page_index:event.target.attributes.getNamedItem('data-page-index').value,
      post_index:event.target.attributes.getNamedItem('data-post-index').value,
      comment_index:event.target.attributes.getNamedItem('data-comment-index').value,
      message:this.state.message_create
    });
    rerender();
    */
  }

  render(){
    console.log(this.props.Messages);
    return(
      <section className="MessageManager">
        <section className="messages_list">
          {this.props.Messages.map((x,index)=>{
            var Message = this.props.Messages[this.props.Messages.length - 1 - index];
            var message_from = (Message.from.id === this.props.page_id) ? " self" : " other";
            return (
              <div key={Message.id} className={"message_wrapper"+message_from} >
                <span className={"message"+message_from}>
                  {Message.message.split('\n').map((item, key) => (
                    <span key={key}>{item}<br/></span>
                  ))}
                </span>
              </div>
            );
          })}
        </section>
        <Row>
          <Col md={9}>
            <textarea
              className="form-control"
              name="message_create" 
              value={this.state.message_create}
              onChange={this.handleConversationMessageChange}
              style={{height:'35px'}}
            />
          </Col>
          <Col md={3}>
            <span 
              className="btn btn-sm btn-primary btn-block"
              onClick={this.handleConversationMessageSubmit}
            >SEND</span>
          </Col>
        </Row>
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
    rstore.dispatch({
      type:'CHANGE_BULK_MESSAGE',
      i:this.props.i,
      bulk_message:event.target.value
    });
  }

  handleAddBulkMessageQueue = (event) => {
    rstore.dispatch({
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
        <button className="btn btn-info btn-block" onClick={this.handleAddBulkMessageQueue}>QUEUE</button>
      </section>
    );
  }
}


class BulkMessageSender extends Component{
  handleSendBulkMessage = (event) => {
    rstore.dispatch({
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
            {
              this.props.state.Conversations && this.props.state.Conversations.data.length >= 1 && this.props.state.pid_current
              ? <section className="BulkMessageTool">
                  {Array(7).fill().map((x,i)=>(
                    <BulkMessageQueue i={i} />
                  ))}
                  <div>After highlight press shortcut key 1,2,3 or 4 ... to queue messages</div>
                  <BulkMessageSender />
                </section>
              : null
            }
          </Col>

          <Col md={6}>
            <PageSelection Pages={this.props.state.Pages} />
            {
              this.props.state.Conversations && this.props.state.Conversations.data.length >= 1 && this.props.state.pid_current
              ? <ConversationListBox 
                  Page={this.props.state.Pages.data[this.props.state.Pages.data.findIndex(x => x.id === this.props.state.pid_current)]} 
                  Conversations={this.props.state.Conversations} 
                  ConversationC={this.props.state.ConversationC}
                />
              : null
            }
          </Col>
          <Col md={3}>
            {
              this.props.state.ConversationC && this.props.state.PageC
              ? <MessageManager Messages={this.props.state.ConversationC.messages.data} page_id={this.props.state.PageC.id} />
              : null
            }
          </Col>

        </Row>

      </section>
    );
  }
}

var rerender = function(){
  render(<MessengerApp state={window.rstore.getState()} />, document.getElementById('app'));
}
window.rerender  = rerender;