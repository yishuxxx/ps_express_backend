//import {settings} from '../settings';
//import _ from 'lodash';
import React, {Component} from 'react';
import {render} from 'react-dom';
import { createStore } from 'redux';
import { Grid, Row, Col, OverlayTrigger, Tooltip } from 'react-bootstrap';
import moment from 'moment';
import Immutable from 'seamless-immutable';
//FOR Chat
import ReactDatetime from 'react-datetime';
import ReactSelect from 'react-select';
import {randomString} from './Utils/Helper';

const initial_state = Immutable({
  connection:'',
  Pages:[
    {pid:1769068019987617},
    {pid:1661200044095778}
  ]
  Conversations:[],
  ConvManagers:[{
    Conversations:{data:[]},
    filter:{
      pid     : 1769068019987617,//1769068019987617
      before  : moment().format('YYYY-MM-DD HH:mm:ss'),
      limit   : 100,
      replied_by    : [],
      last_reply_by : '',
      id_products_asked   : [],      
      id_products_bought  : [],
      tags    : [],
      enquiry_times  : null
    }
  },{
    Conversations:{data:[]},
    filter:{
      pid     : 1661200044095778,
      before  : moment().format('YYYY-MM-DD HH:mm:ss'),
      limit   : 100,
      replied_by    : [],
      last_reply_by : '',
      id_products_asked   : [],      
      id_products_bought  : [],
      tags    : [],
      enquiry_times  : null
    }
  }],
});

var reducer = function(state=Immutable([]),action=null){

  switch(action.type){
    case 'CONNECTION':
      state = Immutable.setIn(state,['connection_status'], action.connection_status);
      break;
    case 'GET_LABELS_RESPONSE_SUCCESS':
      state = Immutable.setIn(state, ["ConvManagers", parseInt(action.list_i,10), "FBLabels"], action.FBLabels);
      break;
    case 'GET_CONVERSATIONS_RESPONSE_SUCCESS':
      var Conversations = ( state.Conversations && state.Conversations.length>=1 ? Immutable.asMutable(state.Conversations) : [] );
      var Conversations2 = ( state.ConvManagers[parseInt(action.list_i,10)].Conversations && state.ConvManagers[parseInt(action.list_i,10)].Conversations.length>=1 ? Immutable.asMutable(state.ConvManagers[parseInt(action.list_i,10)].Conversations) : [] );
      var ConversationsLoaded = action.response.data;

      ConversationsLoaded.map((ConversationLoaded,i)=>{
        var index = Conversations.findIndex((x,i)=>(x.t_mid === ConversationLoaded.t_mid));
        var index2 = Conversations2.findIndex((x,i)=>(x.t_mid === ConversationLoaded.t_mid));
        if(index === -1){
          Conversations.push(ConversationLoaded);
        }else{
          Conversations[index] = ConversationLoaded;
        }

        if(index2 === -1){
          Conversations2.push(ConversationLoaded);
        }else{
          Conversations2[index] = ConversationLoaded;
        }
      });

      state = Immutable.setIn(state, ["Conversations"], Conversations);
      state = Immutable.setIn(state, ["ConvManagers", parseInt(action.list_i,10), "Conversations"], {
        data:Conversations2,
        paging:action.response.paging,
        list_i:action.response.list_i
      });
      break;
    case 'REFRESH_CONVERSATIONS':
      var Conversations = state.Conversations;
      var ConvManagers = state.ConvManagers;
      var ConversationsLoaded = action.Conversations;
      var pid = action.pid;

      Conversations = mergeConversations(Conversations,ConversationsLoaded,true,true);
      Conversations.sort(dateCompare);
      state = Immutable.setIn(state, ["Conversations"], Conversations);

      ConvManagers.map((ConvManager,i)=>{
        //console.log(parseInt(pid,10));
        //console.log(parseInt(ConvManager.filter.pid,10));
        //console.log((parseInt(pid,10) === parseInt(ConvManager.filter.pid,10)));
        if(ConvManager.Conversations && ConvManager.Conversations.data.length >= 0 && (parseInt(action.pid,10) === parseInt(ConvManager.filter.pid,10)) ){
          var Conversations2 = mergeConversations(ConvManager.Conversations.data,ConversationsLoaded,true,true);
          Conversations2.sort(dateCompare);
          state = Immutable.setIn(state, ['ConvManagers',i,'Conversations','data'], Conversations2);
        }
      });
      break;
    case 'NEW_MESSAGE':
      console.log(action);
      var Conversations = state.Conversations;
      var ConvManagers = state.ConvManagers;
      var t_mid = action.t_mid;
      var index = Conversations.findIndex((x,i)=>(x.t_mid === t_mid));

      //OLD MESSAGES
      if(index === -1 || !Conversations[index].messages){
        var Messages = [];
      }else{
        var Messages = Immutable.asMutable(Conversations[index].messages.data);
      }

      //MERGE OLD AND NEW MESSAGE
      if(action.Message){
          Messages = mergeMessages(Messages,[action.Message],true);
      }
      if(action.Messages){
          Messages = mergeMessages(Messages,action.Messages,false);
      }
      Messages.sort(dateCompareMessage);

      //REPLACE MESSAGES IN CONVERSATION, CHOOSE OLD/NEW CONVERSATION DEPENDING ON CRITERIA
      if(action.Conversation){
        var ConversationChanged = action.Conversation;
        ConversationChanged.messages = {data:Messages};
      }else{
        var ConversationChanged = Conversations[index];
        ConversationChanged = Immutable.setIn(ConversationChanged,['messages','data'],Messages);
      }

      //ConversationChanged.messages = {data:Messages};
      Conversations = mergeConversations(Conversations,[ConversationChanged],true,false);
      Conversations.sort(dateCompare);

      //var Conversation = Immutable.merge(Conversations[index],action.Conversation);
      state = Immutable.setIn(state, ["Conversations"], Conversations);

      ConvManagers.map((ConvManager,i)=>{
        //console.log(parseInt(action.pid,10));
        //console.log(parseInt(ConvManager.filter.pid,10));
        //console.log((parseInt(action.pid,10) === parseInt(ConvManager.filter.pid,10)));
        if(ConvManager.Conversations && ConvManager.Conversations.data.length >= 0 && (parseInt(action.pid,10) === parseInt(ConvManager.filter.pid,10)) ){
          var Conversations2 = mergeConversations(ConvManager.Conversations.data,[ConversationChanged],true,false);
          Conversations2.sort(dateCompare);
          //var index = ConvManager.Conversations.data.findIndex((x,i)=>(x.t_mid === t_mid));
          //state = Immutable.setIn(state, ['ConvManagers',i,'Conversations','data',index,'messages','data'], Messages);
          state = Immutable.setIn(state, ['ConvManagers',i,'Conversations','data'], Conversations2);
        }
      });
      
      break;
    default:
      break;
  }
  return state;
}
var rstore = createStore(reducer,initial_state);

class MessageManager extends Component{
  constructor(props,context) {
    super(props,context);
    //this.state = {message_create:''};
  }

  componentDidUpdate() {
    this.scrollToBottom();
  }
  /*
  handleConversationMessageChange = (event) => {
    this.setState({message_create:event.target.value});
  }
  */
  handleConversationMessageSubmit = (event) => {
    var t_mid = this.props.t_mid;
    var pid = this.props.page_id;
    var message = this.message_create.value;

    sendMessage(pid,t_mid,message);
    //this.setState({message_create:''});
    this.message_create.value = '';

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

  handleSendReadReceipt = (event) =>{
    var pid = this.props.page_id;
    var t_mid = this.props.t_mid;
    sendReadReceipt(pid,t_mid);
  }

  handleGetMessages = (event) => {
    var Messages = this.props.messages ? this.props.messages.data : null;
    var pid = this.props.page_id;
    var t_mid = this.props.t_mid;
    var before = Messages ? Messages[Messages.length-1].created_time : this.props.ConversationC.updated_time;
    var max_rows = 100;

    getMessages(pid,t_mid,true);
  }

  handleGetMessagesForceRefresh = (event) => {
    var Messages = this.props.messages ? this.props.messages.data : null;
    var pid = this.props.page_id;
    var t_mid = this.props.t_mid;
    var before = Messages ? Messages[Messages.length-1].created_time : this.props.ConversationC.updated_time;
    var max_rows = 100;

    getMessages(pid,t_mid,false);
  }

  handleUpdateConversationLabels = (all_selected_options) => {
    var pid = this.props.page_id;
    var t_mid = this.props.t_mid;
    updateConversationLabels(pid,t_mid,all_selected_options);
  }

  scrollToBottom() {
    const scrollHeight = this.messageList.scrollHeight;
    const height = this.messageList.clientHeight;
    const maxScrollTop = scrollHeight - height;
    this.messageList.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;
  }

  render(){
    var Messages = this.props.messages ? this.props.messages.data : [];
    var page_id = this.props.page_id;
    //var message_create = this.state.message_create;
    var message_count = this.props.message_count;
    var FBLabels = this.props.FBLabels;

    return(
      <section className="MessageManager">
        <section className="ConversationOptions">
          <div className="MessageLoaderButtons">
            <div className="btn-group" role="group">
              <button className="btn btn-sm btn-info" onClick={this.handleGetMessages}>{(message_count-Messages.length)}</button>
              <button className="btn btn-sm btn-default" onClick={this.handleGetMessagesForceRefresh}><span className="glyphicon glyphicon-refresh"></span></button>
            </div>
          </div>
          {this.props.ConversationC.FBLabels ?
            <div className="LabelSelector">
              <ReactSelect 
                value={this.props.ConversationC.FBLabels.map((FBLabel,i)=>(FBLabel.label_id)).join(',')}
                options={FBLabels.map((FBLabel,i)=>({value:FBLabel.label_id+'',label:FBLabel.name}))}
                onChange={this.handleUpdateConversationLabels}
                multi={true}
              />
            </div>
            : null
          }
        </section>
        <div style={{clear:'both'}}></div>
        <section className="messages_list" ref={(div) => {this.messageList = div;}}>
          {Messages.map((x,index)=>{
            var Message = Messages[Messages.length - 1 - index];
            var message_from = (Message.from.id == page_id) ? " self" : " other";
            var message_left_right = (Message.from.id == page_id) ? "top" : "left";

            var message_or_attachment = [];
            var attachments = Message.attachments;
            if(Message.message){
              message_or_attachment =   Message.message.split('\n').map((item, i) => (
                                          <span key={Message.id+'_NL_'+i}>{item}<br/></span>
                                        ));
            }

            if(attachments && attachments.data && attachments.data.length >= 1){

              attachments.data.map((attachment,i)=>{

                // PHOTO
                if(attachment.image_data){
                  if(typeof attachment.image_data === 'string'){
                    var image_data = JSON.parse(attachment.image_data);
                  }else{
                    var image_data = attachment.image_data;
                  }
                  message_or_attachment.push( <a key={attachment.id} className="image_url" href={image_data.url} target="_blank">
                                                <img className="preview_image" src={image_data.preview_url} />
                                              </a>);
                // VIDEO
                }else if(attachment.video_data){
                  if(typeof attachment.video_data === 'string'){
                    var video_data = JSON.parse(attachment.video_data);
                  }else{
                    var video_data = attachment.video_data;
                  }
                    message_or_attachment.push(
                      <video  controls 
                              key={attachment.id}
                              className="video_playback" 
                      >
                        <source src={video_data.url} type={attachment.mime_type} />
                      </video>);
                // FILE OR AUDIO
                }else if(attachment.file_url){
                  // AUDIO RECORDING
                  if(attachment.mime_type === 'audio/mpeg'){
                    message_or_attachment.push(
                      <audio  controls 
                              key={attachment.id}
                              className="audio_playback" 
                      >
                        <source src={attachment.file_url} type={attachment.mime_type} />
                      </audio>);
                  // FILE DOWNLOAD
                  }else{
                    message_or_attachment.push(<a key={attachment.id} className="file_url" href={attachment.file_url} target="_blank">{attachment.name}</a>);
                  }
                // STICKERS
                }else if(attachment.type === 'image'){
                  var payload = JSON.parse(attachment.payload);
                  message_or_attachment.push( <a key={attachment.id} className="image_url" href={payload.url} target="_blank">
                                                <img className="preview_image" src={payload.url} />
                                              </a>);  
                // UNKNOWN
                }else{
                  message_or_attachment.push(<span key={attachment.id}>{'[ATTACHMENT='+attachment.attachment_id+']'}</span>);
                }
              });

            }

            if(!(attachments && attachments.data && attachments.data.length >= 1) && !(Message.message) ){
              message_or_attachment = '[STICKER]';
            }

            return (
              <div key={Message.id} className={"message_wrapper"+message_from} >
                <OverlayTrigger 
                  placement={message_left_right} 
                  overlay={
                    <Tooltip id="tooltip">
                      {/*moment().diff(moment.utc(Message.created_time),'hours') <= 24
                         ? moment.utc(Message.created_time).utcOffset(8).format('HH:mm') 
                         : moment.utc(Message.created_time).utcOffset(8).format('YYYY-MM-DD HH:mm')
                      */}
                      {moment.utc(Message.created_time).utcOffset(8).format('YYYY-MM-DD HH:mm:ss')}
                    </Tooltip>
                  }
                >
                <span className={"message"+message_from}>
                  {message_or_attachment}
                </span>
                </OverlayTrigger>
              </div>
            );
          })}
        </section>
        <section>
          <button className="btn btn-sm btn-primary" onClick={this.handleSendReadReceipt}>{"read"}</button>
        </section>
        <Row>
          <Col md={9}>
            <textarea
              className="form-control"
              name="message_create" 
              ref={(message_create) => {this.message_create = message_create}} 
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
      products_asked:[
              { value: 'USB_2IN1', label: 'USB_2IN1' },
              { value: 'CAR_RECORDER_WD', label: 'CAR_RECORDER_WD' }
            ]
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

  handleGetConversations = (event) => {
    var list_i = this.props.list_i;
    getConversations(list_i);
  }

  handleGetMoreConversations = (event) => {
    var list_i = this.props.list_i;    
    getConversations(list_i,'MORE');
  }

  handleRefreshConversations = (event) => {
    refreshConversations(this.props.list_i);
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

        <button className="btn btn-primary" onClick={this.handleGetConversations}>Load</button>
        <button className="btn btn-default" onClick={this.handleGetMoreConversations}>More</button>
        <button className="btn btn-warning" onClick={this.handleRefreshConversations}>Refresh</button>

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
      <div className="panel panel-default" style={{marginBottom:'0px'}}>
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
    );
  }
}

class ConversationCard extends Component{
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

  handleDisplayMessages = (event) => {
    var pid = this.props.pid;
    var t_mid = this.props.Conversation.t_mid;

    event.stopPropagation();
    this.props.setConversationSelected(t_mid);
    getMessages(pid,t_mid,true);
  }

  render(){
    if(this.props.Conversation.messages && this.props.Conversation.messages.data.length >=1){
      var messages = this.props.Conversation.messages.data.slice(0,4);
    }
    
    return(
      <section 
        className={ "ConversationCard"
                    +(this.props.Conversation.unread_count ? ' unread' : '')
                    +(this.props.Conversation.queued_message ? ' alert-warning' : '')
                    +(this.props.Conversation.sent_message ? ' alert-success' : '')
                    +(this.props.ConversationC && this.props.Conversation.t_mid === this.props.ConversationC.t_mid ? ' active' : '')
                  }
        onClick={this.handleDisplayMessages}
      >
        <Row>
          <Col md={2}><button className={"btn"+(this.props.Conversation.highlight ? ' btn-primary' : ' btn-default')} onClick={this.handleHighlight}>{this.props.i+1}</button></Col>
          <Col md={10}>
            <div>
              <span className="conversation_header">
                <span className="sender_name">{this.props.Conversation.name ? this.props.Conversation.name : this.props.Conversation.senders.data[0].name}</span>
              </span>
              <span className="updated_time">
                {/*moment().diff(moment.utc(this.props.Conversation.updated_time),'days') <= 7 
                  ? moment.utc(this.props.Conversation.updated_time).utcOffset(8).fromNow() 
                  : moment.utc(this.props.Conversation.updated_time).utcOffset(8).format('YYYY-MM-DD')
                */}
                {moment.utc(this.props.Conversation.updated_time).utcOffset(8).format('YYYY-MM-DD HH:mm:ss')}
              </span>
            </div>

            <span className="label_box">
            {this.props.Conversation.FBLabels && this.props.Conversation.FBLabels.length>=1
              ? this.props.Conversation.FBLabels.map((FBlabel,i)=>(
                <span key={this.props.Conversation.id+'L'+i} className="label label-default">{FBlabel.name}</span>
              ))
              : null
            }
            </span>
            <span className="message" onClick={this.handleShowMoreMessages}>
              {
                this.state.show_more_messages 
                ? (messages.map((message,i)=>(
                    <div key={message.id}>{message.attachment_id ? '[ATTACHMENT]' : message.message}</div>
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

class Pager extends Component{
  constructor(props) {
    super(props);
    this.state = {paging_current:props.paging_current};
  }

  componentWillReceiveProps(nextProps) {
    this.setState({paging_current:nextProps.paging_current});
  }

  handlePagingFirst = (event) => {
    var paging_current = 0;
    this.setState({paging_current:paging_current});
    this.props.setPagingCurrent(paging_current);
  }

  handlePagingLast = (event) => {
    var Conversations = this.props.Conversations;

    var total_items = this.props.total_items;
    var total_pages = Math.ceil(total_items/this.props.items_per_page);
    var paging_current = total_pages - 1;
    this.setState({paging_current:paging_current});
    this.props.setPagingCurrent(paging_current);
  }

  handlePagingPrevious = (event) => {
    var paging_current = this.state.paging_current - 1;

    if(paging_current >= 0){
      this.setState({paging_current:paging_current});
      this.props.setPagingCurrent(paging_current);
    }
  }

  handlePagingNext = (event) => {
    var Conversations = this.props.Conversations;
    var paging_current = this.state.paging_current + 1;

    var total_items = this.props.total_items;
    var total_pages = Math.ceil(total_items/this.props.items_per_page);
    if(paging_current <= total_pages-1){
      this.setState({paging_current:paging_current});
      this.props.setPagingCurrent(paging_current);
    }
  }

  handlePagingChange = (event) => {
    var paging_current = parseInt(event.target.attributes.getNamedItem('data-paging').value,10);
    this.setState({paging_current:paging_current});
    this.props.setPagingCurrent(paging_current);
  }

  render(){
    var total_items = this.props.total_items;
    var paging_per_page = 10;
    var paging_current = this.state.paging_current;    
    var x10_offset = Math.floor(paging_current/paging_per_page) * paging_per_page;
    var list = Array.apply(null, {length: paging_per_page}).map(Number.call, Number).map((x,i)=>(x = x + x10_offset));
    var total_pages = Math.ceil(total_items/this.props.items_per_page);

    if(this.props.total_items >= 1){
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
      <section className="Pager">
        <div className="btn-toolbar" role="toolbar">
          <div className="btn-group" role="group">
            <button className="btn btn-sm btn-default" onClick={this.handlePagingFirst}>{"<<"}</button>
            <button className="btn btn-sm btn-default" onClick={this.handlePagingPrevious}>Prev</button>
          </div>

          <div className="btn-group" role="group" style={{float:'right'}}>
            <button className="btn btn-sm btn-default" onClick={this.handlePagingNext}>Next</button>
            <button className="btn btn-sm btn-default" onClick={this.handlePagingLast}>{">>"}</button>
          </div>
        </div>

        <div className="btn-toolbar" role="toolbar">
          <div className="btn-group" role="group">
            {PagingBtns}
          </div>
        </div>
      </section>
    );
  }
}

class ConversationManager extends Component{
  constructor(props) {
    super(props);
    this.state = {paging_current:0,loading:false,items_per_page:100,t_mid_selected:null};

    this.setPagingCurrent = this.setPagingCurrent.bind(this);
    this.setConversationSelected = this.setConversationSelected.bind(this);    
  }

  shouldComponentUpdate(nextProps, nextState) {
    return true;
  }

  setPagingCurrent = (paging_current) => {
    this.setState({paging_current:paging_current});
  }

  setConversationSelected = (t_mid) => {
    this.setState({t_mid_selected:t_mid});
  }

  render(){
    if(this.props.ConvManager.Conversations && this.props.ConvManager.Conversations.data.length >= 1){
      var Conversations = this.props.ConvManager.Conversations;

      if(this.state.t_mid_selected){
        var ConversationC_i = Conversations.data.findIndex((x,i)=>(x.t_mid === this.state.t_mid_selected));
        var ConversationC = Conversations.data[ConversationC_i];
      }      
    }

    return(
      <section className="ConversationManager">

        <Row>
          <Col md={6}>

            <Accordion title='Filter'>
              <ConvLoadFilter list_i={this.props.list_i} />
            </Accordion>

            <div className="ConversationList">

              {(Conversations && Conversations.data.length >= 1)
                ? Conversations.data.map((Conversation,index)=>{
                    if(Math.floor(index/this.state.items_per_page) === this.state.paging_current){
                      return <ConversationCard 
                                key={Conversation.id}
                                Conversation={Conversation}
                                ConversationC={ConversationC}
                                pid={this.props.ConvManager.filter.pid}
                                i={index}
                                setConversationSelected={this.setConversationSelected}
                              />
                    }else{
                      return null;
                    }
                  })
                : null
              }
            </div>

            {(Conversations && Conversations.data.length >= 1)
              ?  <Pager 
                    paging_current={this.state.paging_current}
                    setPagingCurrent={this.setPagingCurrent}
                    total_items={Conversations.data.length}
                    items_per_page={this.state.items_per_page}
                  />
              : null
            }

          </Col>

          <Col md={6}>
            {
              ConversationC
              ? <MessageManager 
                  messages={ConversationC.messages}
                  page_id={this.props.ConvManager.filter.pid}
                  t_mid={this.state.t_mid_selected}
                  message_count={ConversationC.message_count}
                  FBLabels={this.props.ConvManager.FBLabels}
                  ConversationC={ConversationC}
                />
              : null
            }
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

        <div 
          className={
            this.props.state.connection_status === 'DISCONNECTED' 
              ? 'alert alert-danger' 
              : (this.props.state.connection_status === 'RECONNECT_ERROR' ? 'alert alert-warning' : '')}
        >
          {this.props.state.connection_status === 'DISCONNECTED' 
            ? 'OFFLINE' 
            : (this.props.state.connection_status === 'RECONNECT_ERROR' ? 'RECONNECTING FAILED' : '')}
        </div>

        <Row>
          <Col md={6}>
            {
              this.props.state.ConvManagers && this.props.state.ConvManagers[0]
              ? <ConversationManager
                  ConvManager={this.props.state.ConvManagers[0]}
                  list_i={0}
                />
              : null
            }
          </Col>
          <Col md={6}>
            {
              this.props.state.ConvManagers && this.props.state.ConvManagers[1]
              ? <ConversationManager
                  ConvManager={this.props.state.ConvManagers[1]}
                  list_i={1}
                />
              : null
            }
          </Col>
        </Row>

      </section>
    );
  }
}


var rerender = function(){
  render(<MessengerApp state={rstore.getState()} />, document.getElementById('app'));
}

rerender();

//var socket = io('localhost:3000', {path: '/socket.io'});
//var socket = io();

var socket = io({transports: ['polling'], upgrade: false, path: '/api1/socket.io'});
var connected = true;

socket.on('log', function (data) {
  console.log('================= LOG ================')
  console.log(data);
});

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


socket.on('GET_LABELS', function (response) {
  console.log(response);
  rstore.dispatch({
    type:'GET_LABELS_RESPONSE_SUCCESS',
    FBLabels:response.data,
    pid:response.pid
  });
  rerender();
});

socket.on('GET_CONVERSATIONS', function (response) {
  console.log(response);
  rstore.dispatch({
    type:'GET_CONVERSATIONS_RESPONSE_SUCCESS',
    response:response,
    list_i:response.list_i
  });
  rerender();
});

socket.on('GET_MESSAGES', function (data) {
  console.log(data);
  rstore.dispatch({
    type:'NEW_MESSAGE',
    pid:data.pid,
    t_mid:data.Messages[0].t_mid,
    Messages:data.Messages
  });
  rerender();
});

socket.on('REFRESH_CONVERSATIONS', function (data) {
  console.log(data);
  rstore.dispatch({
    type:'REFRESH_CONVERSATIONS',
    pid:data.pid,
    Conversations:data.Conversations
  });
  rerender();
});

// Whenever the server emits 'new message', update the chat body
socket.on('new message', function (data) {
  if(data.Message && data.Message.message){
    console.log('message='+data.Message.message);
    console.log(data);
  }else if(data.Message && data.Message.attachments && data.Message.attachments.data.length>=1){
    console.log('attachments=');
    console.log(data.Message.attachments.data[0]);
    console.log(data);
  }else{
    console.log(data);
  }

  rstore.dispatch({
    type:'NEW_MESSAGE',
    pid:data.pid,
    t_mid:data.Conversation.t_mid,
    Conversation:data.Conversation,
    Message:data.Message ? data.Message : null,
    Messages:data.Messages ? data.Messages : null
  });
  rerender();
});
/*
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
*/
socket.on('disconnect', function () {
  console.log('you have been disconnected');
  //log('you have been disconnected');
  rstore.dispatch({
    type:'CONNECTION',
    connection_status:'DISCONNECTED'
  });
  rerender();
});

socket.on('reconnect', function () {
  console.log('you have been reconnected');
  //log('you have been reconnected');
  //if (username) {
  //  socket.emit('add user', username);
  //}
  rstore.dispatch({
    type:'CONNECTION',
    connection_status:'CONNECTED'
  });
  rerender();
});

socket.on('reconnect_error', function () {
  console.log('attempt to reconnect has failed');
  //log('attempt to reconnect has failed');
  rstore.dispatch({
    type:'CONNECTION',
    connection_status:'RECONNECT_ERROR'
  });
  rerender();
});

socket.on('ERROR', function (data) {
  console.log(data);
  alert(data.message);
});
  

function cleanInput(input) {
  return input;
}

// Sends a chat message
function sendMessage(pid,t_mid,message) {
  // Prevent markup from being injected into the message
  message = cleanInput(message);
  // if there is a non-empty message and a socket connection
  if (message && connected) {
    //addChatMessage(message);
    // tell server to execute 'new message' and send along one parameter
    socket.emit('new message', { 
      type: 'text',
      pid:pid,
      t_mid:t_mid,
      message:message
    });
  }
}

function sendReadReceipt(pid,t_mid){
  if (connected) {
    socket.emit('new message', { 
      type: 'read receipt',
      pid:pid,
      t_mid:t_mid
    });
  }
}

function getConversations(list_i, more) {
  if (connected) {
    if(more === 'MORE'){
      socket.emit('GET_CONVERSATIONS', {filter:rstore.getState().ConvManagers[list_i].Conversations.paging.next,list_i:list_i});
    }else{
      socket.emit('GET_CONVERSATIONS', {filter:rstore.getState().ConvManagers[list_i].filter,list_i:list_i});
    }
  }
}

function getMessages(pid,t_mid,latest_only) {
  var latest_only = typeof latest_only !== 'undefined' ? latest_only : true;

  if (connected) {
    socket.emit('GET_MESSAGES',{
      pid:pid,
      t_mid:t_mid,
      latest_only:latest_only
    });
  }
}

function refreshConversations(list_i){
  var pid = rstore.getState().ConvManagers[list_i].filter.pid;

  if(connected){
    socket.emit('REFRESH_CONVERSATIONS',{
      pid:pid
    });
  }
}

function updateConversationLabels(pid,t_mid,labels){
  if(connected){
    socket.emit('UPDATE_CONVERSATION_LABELS',{
      pid:pid,
      t_mid:t_mid,
      labels:labels
    })
  }
}

function mergeMessages(MessagesOld,MessagesLoaded,is_new=true){
  var Messages = MessagesOld.slice(0,MessagesOld.length);

  MessagesLoaded.map((Message,i)=>{
    var index = Messages.findIndex((x,i)=>(x.m_mid === Message.m_mid));
    if(index === -1){
      if(is_new === false){
        Messages.push(Message);
        console.log('message pushed, length='+Messages.length);
      }else{
        Messages.unshift(Message);
        console.log('message unshifted, length='+Messages.length);
      }
    }
  });
  return Messages;
}

function mergeConversations(ConversationsOld,ConversationsLoaded,is_new=true,exclude_messages=false){
  var Conversations = Immutable.asMutable(ConversationsOld);

  ConversationsLoaded.map((Conversation,i)=>{
    var index = Conversations.findIndex((x,i)=>(x.t_mid === Conversation.t_mid));
    if(index === -1){
      if(is_new === false){
        console.log('conversation pushed, length='+Conversations.length);
        Conversations.push(Conversation);
      }else{
        console.log('conversation unshifted, length='+Conversations.length);
        Conversations.unshift(Conversation);
      }
    }else{
      console.log('conversation replaced, length='+Conversations.length);
      if(exclude_messages === false){
        Conversations[index] = Conversation;
      }else if(exclude_messages === true){
        var Messages = Conversations[index].messages.data;
        Conversations[index] = Conversation;
        Conversations[index].messages.data = Messages;
      }
    }
  });
  return Conversations;
}

function dateCompare(a, b){
  var c = new Date(a.updated_time);
  var d = new Date(b.updated_time);

  if (c > d) {
    return -1;
  }
  if (c < d) {
    return 1;
  }
  // a must be equal to b
  return 0;
}

function dateCompareMessage(a, b){
  var c = new Date(a.created_time);
  var d = new Date(b.created_time);

  if (c > d) {
    return -1;
  }
  if (c < d) {
    return 1;
  }
  // a must be equal to b
  return 0;
}

window.rerender  = rerender;
window.moment = moment;
window.rstore = rstore;
window.Immutable = Immutable;
socket.emit('GET_LABELS', {pid:rstore.getState().Pages.data[0].pid});
socket.emit('GET_LABELS', {pid:rstore.getState().Pages.data[1].pid});