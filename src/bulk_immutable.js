import {settings} from '../settings';
import _ from 'lodash';
import React, {Component} from 'react';
import {render} from 'react-dom';
import { createStore } from 'redux';
import { Grid, Row, Col, OverlayTrigger, Tooltip } from 'react-bootstrap';
import moment from 'moment';
//import { syDateFormat } from './Utils/Helper';
//import {Map} from 'immutable';
import Immutable from 'seamless-immutable';
window.Immutable = Immutable;
//FOR Chat
import ReactDatetime from 'react-datetime';
import ReactSelect from 'react-select';
import {randomString} from './Utils/Helper';

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

const initial_state = Immutable({
  scopes:'read_page_mailboxes,manage_pages,publish_pages,pages_show_list',
  bulk_messages:[''],
  bulk_message_queue:[]
});

class AppData{
  constructor(initial_state,createStore) {
    this.store = createStore(this.reducer,initial_state);
    var that = this;

    var FBLogin = function(){
      FB.login(function(response){

        that.store.dispatch({
          type:'FB_LOGIN_RESPONSE_SUCCESS',
          response:response
        });

        FB.api('/me/accounts?access_token='+that.store.getState().authResponse.accessToken,function(response){
          that.store.dispatch({
            type:'GET/me/accounts/RESPONSE_SUCCESS',
            response:response
          });
          rerender();
        });

      },{scope:that.store.getState().scopes});
      window.setTimeout(FBLogin,1800*1000);
    }

    FBLogin();
  }

  reducer(state=Immutable([]),action=null){
      switch(action.type){
        case 'BACK':
          state = window.statestack.splice(window.statestack.length-1,1)[0];
          break;
        case 'FB_LOGIN_RESPONSE_SUCCESS':
          state = Immutable.merge(state, {authResponse: action.response.authResponse});
          //state.authResponse = action.response.authResponse;
          break;
        case 'GET/me/accounts/RESPONSE_SUCCESS':
          if(state.Pages && (state.Pages.data.length === action.response.data.length)){
            action.response.data.map((Page,i)=>{
              action.response.data[i].Conversations = state.Pages.data[i].Conversations
            });
          }else if(state.Pages && (state.Pages.data.length !== action.response.data.length)){
            state = Immutable.merge(state, {Conversations: null});
          }
          state = Immutable.merge(state, {Pages: action.response});
          //state.Pages = action.response;
          break;
        case 'SET_CURRENT_PAGE':
          var pi = state.Pages.data.findIndex(x => x.id === action.pid);
          state = Immutable.merge(state, {PageC: state.Pages.data[pi]});
          state = Immutable.merge(state, {pid_current: state.PageC.id});
          //state.PageC = state.Pages.data[pi];
          //state.pid_current = state.PageC.id;
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
            state = Immutable.setIn(state, ["Pages", "data", pi, "Conversations",'data'], state.Pages.data[pi].Conversations.data.concat(action.response.data));
            state = Immutable.setIn(state, ["Pages", "data", pi, "Conversations",'paging'], action.response.paging);
            //state.Pages.data[pi].Conversations.data = state.Pages.data[pi].Conversations.data.concat(action.response.data);
            //state.Pages.data[pi].Conversations.paging = action.response.paging;
          }else{
            //state = Immutable.merge(state, {Pages: {data[pi]: {Conversations:action.response}} });
            state = Immutable.setIn(state, ["Pages", "data", pi, "Conversations"], action.response);
            //state.Pages.data[pi].Conversations = action.response;
          }
          state = Immutable.merge(state, {Conversations: state.Pages.data[pi].Conversations, bulk_message_queue:[]});
          //state.Conversations = state.Pages.data[pi].Conversations;
          //state.bulk_message_queue = [];
          break;
        case 'GET/<CONVERSATION_ID>/messages':
          var pi = state.Pages.data.findIndex(x => x.id === state.pid_current);
          const Page = state.Pages.data[pi];
          var conv_i = Page.Conversations.data.findIndex(x => x.id === action.t_mid);
          //var Conversation_P = Page.Conversations.data[conv_i];
          const Conversation = state.Conversations.data[conv_i];
          var url = '/'+action.t_mid+'/messages?access_token='+Page.access_token+'&fields=message,id,created_time,from&limit=100';
          FB.api(url,function(response){
            if(response.data){
              rstore.dispatch({
                type:'GET/<CONVERSATION_ID>/messages/RESPONSE_SUCCESS',
                pi:pi,
                conv_i:conv_i,
                response:response
              })
            }
            rerender();
          });
          break;
        case 'GET/<CONVERSATION_ID>/messages/RESPONSE_SUCCESS':
          var pi = action.pi;
          var conv_i = action.conv_i;
          state = Immutable.setIn(state, ["Pages", "data", pi, "Conversations", "data", conv_i,"messages"], action.response);
          state = Immutable.setIn(state, ["Conversations","data", conv_i,"messages"], state.Pages.data[pi].Conversations.data[conv_i].messages);
          state = Immutable.setIn(state, ["ConversationC"], state.Conversations.data[conv_i]);
          state = Immutable.setIn(state, ["t_mid_current"], state.Conversations.data[conv_i].id);                                      
          //state = Immutable.merge(state, {t_mid_current: state.Conversations.data[conv_i].id, ConversationC:state.Conversations.data[conv_i]});
          //Conversation.messages = response;
          //Conversation_P.messages = response;
          //state.t_mid_current = Conversation.id;
          //state.ConversationC = Conversation;
          break;
        case 'CHANGE_BULK_MESSAGE':
          state = Immutable.setIn(state,['bulk_messages',action.i],action.bulk_message);
          //state.bulk_messages[action.i] = action.bulk_message;
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
              state = Immutable.setIn(state,['Conversations','data',list[i],'highlight'],last_highlight_state)              
              //state.Conversations.data[list[i]].highlight = last_highlight_state;
            });
          }else if(action.type === 'CONVERSATION_HIGHLIGHT_CLICK'){
            state = Immutable.setIn(state,['Conversations','data',ti,'highlight'],!state.Conversations.data[ti].highlight)
            state = Immutable.set(state,'last_highlight_i',ti);
            //state.Conversations.data[ti].highlight = !state.Conversations.data[ti].highlight;
            //state.last_highlight_i = ti;
          }
          break;
        case 'ADD_BULK_MESSAGE_QUEUE':
          var message = state.bulk_messages[action.i];
          var bulk_message_queue_mutable = Immutable.asMutable(state.bulk_message_queue);

          state.Conversations.data.map((Conversation,i)=>{
            if(Conversation.highlight){

              bulk_message_queue_mutable = bulk_message_queue_mutable.filter(x=>x.t_mid!==Conversation.id);
              bulk_message_queue_mutable.push({t_mid:Conversation.id,message:message});

              state = Immutable.setIn(state,['Conversations','data',i,'highlight'],false);
              state = Immutable.setIn(state,['Conversations','data',i,'queued_message'],message);
              //state.bulk_message_queue.push({t_mid:Conversation.id,message:message});
              //Conversation.highlight = false;
              //Conversation.queued_message = message;
            }
          });
          state = Immutable.setIn(state,['bulk_message_queue'],bulk_message_queue_mutable);
          break;
        case 'REPLACE_BULK_MESSAGE_QUEUE':
          state = Immutable.setIn(state,['bulk_message_queue'],action.bulk_message_queue);
          break;
        case 'SEND_MESSAGE_RESPONSE_SUCCESS':
          state = Immutable.setIn(state,['Conversations','data',action.ti,'sent_message'],action.message);
          state = Immutable.setIn(state,['Conversations','data',action.ti,'sent_m_mid'],action.m_mid);
          state = Immutable.setIn(state,['Conversations','data',action.ti,'queued_message'],'');
          //state.Conversations.data[ti].sent_message = message;
          //state.Conversations.data[ti].sent_m_mid = response.id;
          break;
        default:
          break;
      }
      

      if(action.type !== 'BACK'){
        if(!window.statestack){
          window.statestack = [];
        }
        window.statestack.push(state);
      }

      window.state = state;
      return state;
  }

  SEND_BULK_MESSAGE(action={}){
    var state = rstore.getState();

    var FBSendMessage = function(bulk_message_queue){
      var citem = bulk_message_queue.slice(0,1)[0];
      var bulk_message_queue = bulk_message_queue.slice(1,bulk_message_queue.length)
      rstore.dispatch({
        type:'REPLACE_BULK_MESSAGE_QUEUE',
        bulk_message_queue:bulk_message_queue
      });

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
            rstore.dispatch({
              type:'SEND_MESSAGE_RESPONSE_SUCCESS',
              message:message,
              m_mid:response.id,
              ti:ti
            });
            rerender();

            if(bulk_message_queue.length){
              FBSendMessage(bulk_message_queue);
            }

          }else{
            alert('Failed to send message...');
          }
      });
    }
    FBSendMessage(state.bulk_message_queue);
  }

  SEND_MESSAGE_TO_SERVER(){
    fetch(settings.base_url+'',{
      method: 'POST',
      headers:{'Content-Type': 'application/json'},
      body: JSON.stringify(messageData)
    }).then(function (res) {
      res.json();
    }).then(function(response){
      console.log(response);
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
/*
  componentWillReceiveProps(nextProps) {
    this.setState({highlight:nextProps.Conversation.highlight});
  }


  shouldComponentUpdate(nextProps, nextState) {
    return this.props !== nextProps || this.state !== nextState;
  }
*/
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
    event.stopPropagation();
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
              <span className="conversation_header">
                <span className="sender_name">{this.props.Conversation.senders.data[0].name}</span>

                <span className="label_box">
                {/*this.props.Conversation.tags.data.length
                  ? this.props.Conversation.tags.data.map((label,i)=>(
                    <span key={this.props.Conversation.id+'L'+i} className="label label-default">{label.name}</span>
                  ))
                  : null
                */}
                </span>
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
    if(list.findIndex((x,i)=>(x===event.key))!== -1){
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

class MessageManager extends Component{
  constructor(props,context) {
    super(props,context);
    this.state = {message_create:''};
  }

  componentDidUpdate() {
    this.scrollToBottom();
  }

  handleConversationMessageChange = (event) => {
    this.setState({message_create:event.target.value});
  }

  handleConversationMessageSubmit = (event) => {
    
    sendMessage({t_mid:this.props.t_mid,text:this.state.message_create});
    this.setState({message_create:''});
    
    /*
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

  scrollToBottom() {
    const scrollHeight = this.messageList.scrollHeight;
    const height = this.messageList.clientHeight;
    const maxScrollTop = scrollHeight - height;
    this.messageList.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;
  }

  render(){

    return(
      <section className="MessageManager">
        <section className="messages_list" ref={(div) => {this.messageList = div;}}>
          {this.props.Messages.map((x,index)=>{
            var Message = this.props.Messages[this.props.Messages.length - 1 - index];
            var message_from = (Message.from.id === this.props.page_id) ? " self" : " other";
            var message_left_right = (Message.from.id === this.props.page_id) ? "top" : "left";

            return (
              <div key={Message.id} className={"message_wrapper"+message_from} >
                <OverlayTrigger placement={message_left_right} overlay={<Tooltip id="tooltip">{moment().diff(moment.utc(Message.created_time),'hours') <= 24 ? moment.utc(Message.created_time).utcOffset(8).format('HH:mm') : moment.utc(Message.created_time).utcOffset(8).format('YYYY-MM-DD HH:mm')}</Tooltip>}>
                <span className={"message"+message_from}>
                  {Message.message.split('\n').map((item, key) => (
                    <span key={key}>{item}<br/></span>
                  ))}
                </span>
                </OverlayTrigger>
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
    appdata.SEND_BULK_MESSAGE();
  }

  render(){
    return(
      <section className="BulkMessageSender">            
        <button className="btn btn-primary btn-lg" onClick={this.handleSendBulkMessage}>SEND <span className="badge">{this.props.bulk_message_queue_counter}</span></button>
      </section>
    );
  }
}

class ChatManager extends Component{
  constructor(props,context) {
    super(props,context);
    this.state = {message_create:''};
  }

  handleConversationMessageChange = (event) => {
    this.setState({message_create:event.target.value});
  }

  handleConversationMessageSubmit = (event) => {
    console.log(this.state.message_create);
    sendMessage(this.state.message_create);
  }

  render(){

    return(
      <section className="ChatManager">
        <section className="messages_list">
          {this.props.Messages
            ? this.props.Messages.map((x,index)=>{
                var Message = this.props.Messages[this.props.Messages.length - 1 - index];
                var message_from = (Message.from.id === this.props.page_id) ? " self" : " other";
                var message_left_right = (Message.from.id === this.props.page_id) ? "top" : "left";

                return (
                  <div key={Message.id} className={"message_wrapper"+message_from} >
                    <OverlayTrigger placement={message_left_right} overlay={<Tooltip id="tooltip">{moment().diff(moment.utc(Message.created_time),'hours') <= 24 ? moment.utc(Message.created_time).utcOffset(8).format('HH:mm') : moment.utc(Message.created_time).utcOffset(8).format('YYYY-MM-DD HH:mm')}</Tooltip>}>
                    <span className={"message"+message_from}>
                      {Message.message.split('\n').map((item, key) => (
                        <span key={key}>{item}<br/></span>
                      ))}
                    </span>
                    </OverlayTrigger>
                  </div>
                );
            })
            : null
          }
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

class ConvLoadFilter extends Component{

  constructor(props,context) {
    super(props,context);
    this.state = {
      replied_by:[],
      last_replied_by:'',
      products_asked:[]
    };
  }

  handleSelectRepliedBy = (all_selected_options) =>{
    this.setState({replied_by:all_selected_options});
  }
  
  handleSelectLastRepliedBy = (all_selected_options) =>{
    this.setState({last_replied_by:all_selected_options});
  }

  handleSelectProductsAsked = (all_selected_options) =>{
    this.setState({products_asked:all_selected_options});
  }

  render() {
    return(
      <section className="ConvLoadFilter">

        <div className="input-group">
          <span className="input-group-addon input-group-sm">Page :</span>
          <div className="btn-group">
            <button type="button" className="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
              Action <span className="caret"></span>
            </button>
            <ul className="dropdown-menu">
              <li><a data-pid="1769068019987617">SY Online Venture</a></li>
              <li><a data-pid="1825720017685240">SY Online Venture MY</a></li>
            </ul>
          </div>
        </div>

        <div className="input-group">
          <span className="input-group-addon input-group-sm">Until :</span>
          <ReactDatetime />
        </div>

        <div className="input-group">
          <span className="input-group-addon input-group-sm">Replied:</span>
          <ReactSelect 
            name="replied_by"
            value={this.state.replied_by.map((item,i)=>(item.value)).join(',')}
            options={[
              { value: '1231123123', label: 'Yishu Foo' },
              { value: '4564564564', label: 'Vermillion Ng' }
            ]}
            onChange={this.handleSelectRepliedBy} 
            multi={true}
          />
        </div>

        <div className="input-group">
          <span className="input-group-addon input-group-sm">Last :</span>
          <ReactSelect 
            name="last_replied_by"
            value={this.state.last_replied_by ? this.state.last_replied_by.value : ''}
            options={[
              { value: '1231123123', label: 'Yishu Foo' },
              { value: '4564564564', label: 'Vermillion Ng' }
            ]}
            onChange={this.handleSelectLastRepliedBy} 
            multi={false}
          />
        </div>

        <div className="input-group">
          <span className="input-group-addon input-group-sm">Asked :</span>
          <ReactSelect 
            name="products_asked"
            value={this.state.products_asked.map((item,i)=>(item.value)).join(',')}
            options={[
              { value: 'USB_2IN1', label: 'USB_2IN1' },
              { value: 'CAR_RECORDER_WD', label: 'CAR_RECORDER_WD' }
            ]}
            onChange={this.handleSelectProductsAsked} 
            multi={true}
          />
        </div>

      </section>
    );
  }
}

class Accordion extends Component{
  constructor(props,context) {
    super(props,context);
    this.state = {unique_key:randomString('16','#aA')};
  }
  render(){
    return(
      <div className="panel-group" id="accordion" role="tablist" aria-multiselectable="true">
        <div className="panel panel-default">
          <div className="panel-heading" role="tab" id="headingOne">
            <h4 className="panel-title">
              <a role="button" data-toggle="collapse" data-parent="#accordion" href={"#"+this.state.unique_key} aria-expanded="true" aria-controls={this.state.unique_key}>
                {this.props.title}
              </a>
            </h4>
          </div>
          <div id={this.state.unique_key} className="panel-collapse collapse in" role="tabpanel" aria-labelledby="headingOne">
            <div className="panel-body">
              {this.props.children}
            </div>
          </div>
        </div>
      </div>
    );
  }
}


class ConversationCard2 extends Component{
  constructor(props,context) {
    super(props,context);
    this.state = {highlight:false,show_more_messages:false}; 
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
    event.stopPropagation();
    rstore.dispatch({
      type:'GET/<CONVERSATION_ID>/messages',
      t_mid:this.props.Conversation.id
    });
  }

  render(){
    var messages = this.props.Conversation.messages.data.slice(0,4);
    return(
      <section 
        className={ "ConversationCard2"
                    +(this.props.Conversation.unread_count ? ' unread' : '')
                    +(this.props.Conversation.queued_message ? ' alert-warning' : '')
                    +(this.props.Conversation.sent_message ? ' alert-success' : '')
                    +(this.props.ConversationC && this.props.Conversation.id === this.props.ConversationC.id ? ' active' : '')
                  }
        onClick={this.handleGetMessages}
      >
        <Row>
          <Col md={2}><button className={"btn"+(this.props.Conversation.highlight ? ' btn-primary' : ' btn-default')} onClick={this.handleHighlight}>{this.props.i+1}</button></Col>
          <Col md={10}>
            <div>
              <span className="conversation_header">
                <span className="sender_name">{this.props.Conversation.senders.data[0].name}</span>

                <span className="label_box">
                {/*this.props.Conversation.tags.data.length
                  ? this.props.Conversation.tags.data.map((label,i)=>(
                    <span key={this.props.Conversation.id+'L'+i} className="label label-default">{label.name}</span>
                  ))
                  : null
                */}
                </span>
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
        </Row>
        
      </section>
    );
  }
}

class ConversationManager extends Component{
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
      <section className="ConversationManager">

        <Accordion title='Filter'>
          <ConvLoadFilter />
        </Accordion>

        <Row className="header">
          <Col md={1}>No.</Col>
          <Col md={4}>Name/Msg</Col>
          <Col md={3}>Time</Col>
        </Row>

        <div className="ConversationList" tabIndex="1" onKeyPress={this.onKeyPress}>

          {(this.props.Conversations && this.props.Conversations.data.length >= 1)
            ? this.props.Conversations.data.map((Conversation,index)=>{
                if(Math.floor(index/100) === this.state.paging_current){
                  return <ConversationCard2 key={Conversation.id} Conversation={Conversation} ConversationC={this.props.ConversationC} i={index}/>
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
                    <BulkMessageQueue key={'bmq_'+i} i={i} />
                  ))}
                  <div>After highlight press shortcut key 1,2,3 or 4 ... to queue messages</div>
                  <BulkMessageSender bulk_message_queue_counter={this.props.state.bulk_message_queue.length}/>
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
              ? <MessageManager Messages={this.props.state.ConversationC.messages.data} page_id={this.props.state.PageC.id} t_mid={this.props.state.ConversationC.id} />
              : null
            }
          </Col>

        </Row>

        <Row>

          <Col md={3}>
            {
              this.props.state.Conversations && this.props.state.Conversations.data.length >= 1 && this.props.state.pid_current
              ? <ConversationManager
                  Page={this.props.state.Pages.data[this.props.state.Pages.data.findIndex(x => x.id === this.props.state.pid_current)]} 
                  Conversations={this.props.state.Conversations} 
                  ConversationC={this.props.state.ConversationC}
                />
              : null
            }

          </Col>

          <Col md={3}>
            <ChatManager Messages={this.props.state.Messages ? this.props.state.Messages : null}/>
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

var socket = io();
var connected = true;

// Whenever the server emits 'login', log the login message
socket.on('login', function (data) {
  connected = true;
  // Display the welcome message
  var message = "Welcome to Socket.IO Chat – ";
  //log(message, {
  //  prepend: true
  //});
  //addParticipantsMessage(data);
  console.log(message);
});

socket.on('GET_CONVERSATIONS', function (data) {
  console.log('i got the conversation data');
  console.log(data);
});

// Whenever the server emits 'new message', update the chat body
socket.on('new message', function (data) {
  console.log('new message');
  console.log(data);
  //addChatMessage(data);
});

// Whenever the server emits 'user joined', log it in the chat body
socket.on('user joined', function (data) {
  console.log('user joined');
  //log(data.username + ' joined');
  //addParticipantsMessage(data);
});

// Whenever the server emits 'user left', log it in the chat body
socket.on('user left', function (data) {
  console.log('user left');
  //log(data.username + ' left');
  //addParticipantsMessage(data);
  //removeChatTyping(data);
});

// Whenever the server emits 'typing', show the typing message
socket.on('typing', function (data) {
  console.log('typing');
  //addChatTyping(data);
});

// Whenever the server emits 'stop typing', kill the typing message
socket.on('stop typing', function (data) {
  console.log('stop typing');
  //removeChatTyping(data);
});

socket.on('disconnect', function () {
  console.log('you have been disconnected');
  //log('you have been disconnected');
});

socket.on('reconnect', function () {
  console.log('you have been reconnected');
  //log('you have been reconnected');
  //if (username) {
  //  socket.emit('add user', username);
  //}
});

socket.on('reconnect_error', function () {
  console.log('attempt to reconnect has failed');
  //log('attempt to reconnect has failed');
});
  

function cleanInput(input) {
  return input;
}

// Sends a chat message
function sendMessage(message) {
  // Prevent markup from being injected into the message
  console.log('inside sendMessage');
  message.text = cleanInput(message.text);
  // if there is a non-empty message and a socket connection
  if (message.text && connected) {
    //$inputMessage.val('');
    /*
    rstore.dispatch({
      message_create:''
    });
    */

    addChatMessage(message);
    // tell server to execute 'new message' and send along one parameter
    socket.emit('new message', message);
  }
}

// Adds the visual chat message to the message list
function addChatMessage(data, options) {
  // Don't fade the message in if there is an 'X was typing'
  /*
  var $typingMessages = getTypingMessages(data);
  options = options || {};
  if ($typingMessages.length !== 0) {
    options.fade = false;
    $typingMessages.remove();
  }

  var $usernameDiv = $('<span class="username"/>')
    .text(data.username)
    .css('color', getUsernameColor(data.username));
  var $messageBodyDiv = $('<span class="messageBody">')
    .text(data.message);

  var typingClass = data.typing ? 'typing' : '';
  var $messageDiv = $('<li class="message"/>')
    .data('username', data.username)
    .addClass(typingClass)
    .append($usernameDiv, $messageBodyDiv);

  addMessageElement($messageDiv, options);*/
  console.log('addChatMessage')
}


function getConversations() {
  if (connected) {
    socket.emit('GET_CONVERSATIONS', {
      pid     : '1769068019987617',
      before  : '2017-04-19T00:00:00+08:00',
      limit   : 25,
      replied_by    : [],
      last_reply_by : '',
      id_products_asked   : [],      
      id_products_bought  : [],
      tags    : [],
      enquiry_times  : null
    });
  }
}
window.getConversations = getConversations;
window.moment = moment;