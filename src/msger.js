//import {settings} from '../settings';
//import _ from 'lodash';
import React, {Component} from 'react';
import {render,findDOMNode} from 'react-dom';
import { createStore } from 'redux';
import { Grid, Row, Col, OverlayTrigger, Tooltip, Popover } from 'react-bootstrap';
import moment from 'moment';
import Immutable from 'seamless-immutable';
//FOR Chat
import ReactDatetime from 'react-datetime';
import ReactSelect from 'react-select';
import {randomString} from './Utils/Helper';

var console = {};
console.log = function(){};

const BASEDIR = (window.location.pathname.match(/^(\/)(\w)+/))[0];
const initial_state = Immutable({
  connection:'',
  freeze:false,
  reqs_loading:[],
  Pages:[
    { pid:1769068019987617,
      name:'SY Online Venture',
      Conversations:[],
      Uploads:[],
      SReplies:[]
    },
    { pid:1661200044095778,
      name:'SY代购',
      Conversations:[],
      Uploads:[],
      SReplies:[]
    }
  ],
  ConvManagers:[{
    pid     : 1769068019987617,
    Conversations:{data:[]},    
    filter:{
      inbox:'INBOX',
      label_ids    : [],
      id_employee_engage_by : null,
      name:'',
      message:'',
      message_t_mids:[],
    }
  },{
    pid     : 1769068019987617,
    Conversations:{data:[]},
    filter:{
      inbox:'INBOX',
      label_ids    : [],
      id_employee_engage_by : null,
      name:'',
      message:'',
      message_t_mids:[],
    },
    Uploads:[],
    SReplies:[]
  }],
});

var reducer = function(state=Immutable([]),action=null){

  switch(action.type){
    case 'CONNECTION':
      state = Immutable.setIn(state,['connection_status'], action.connection_status);
      break;

    case 'TOGGLE_FREEZE':
      state = Immutable.setIn(state,['freeze'], !state.freeze);
      break;

    case 'ADD_REQUEST_LOADING':
      var reqs_loading = Immutable.asMutable(state.reqs_loading);
      reqs_loading.push(action.req);
      state = Immutable.setIn(state,['reqs_loading'], reqs_loading);
      break;

    case 'REMOVE_REQUEST_LOADING':
      var reqs_loading = Immutable.asMutable(state.reqs_loading);
      var index = reqs_loading.indexOf(action.req);
      if(index !== -1){
        reqs_loading.splice(index,1);
        state = Immutable.setIn(state,['reqs_loading'], reqs_loading);
      }
      break;

    case 'GET_ME':
      state = Immutable.setIn(state, ["me"], action.me);
      break;

    case 'GET_EMPLOYEES':
      var employee_firstnames = {};
      action.Employees.map((Employee)=>{
          employee_firstnames[''+Employee.id_employee] = Employee.firstname;
      });
      state = Immutable.setIn(state, ["employee_firstnames"], employee_firstnames);
      state = Immutable.setIn(state, ["Employees"], action.Employees);
      break;

    case 'GET_TAGS':
      state = Immutable.setIn(state, ['Tags'], action.Tags);
      break;

    case 'GET_LABELS':
      var pid = action.pid;
      var page_i = state.Pages.findIndex((x,i)=>(parseInt(x.pid,10) === parseInt(pid,10)));
      var Page = state.Pages[page_i];
      var cman_is = 
      state.ConvManagers.reduce(function(a, x, i) {
          if (parseInt(x.pid,10) === parseInt(pid,10))
              a.push(i);
          return a;
      }, []);

      state = Immutable.setIn(state, ["Pages", page_i, "FBLabels"], action.FBLabels);
      break;

    case 'GET_READINGS':
      state = Immutable.setIn(state, ['readings'], action.readings);
      break;

    case 'ADD_READING':

      function deleteReadings(readings,id_employee,socket_id,t_mid){
        if(typeof t_mid === 'undefined' && typeof socket_id === 'undefined'){
          readings = readings.filter((reading,i)=>{
            if(reading.id_employee === id_employee){
              return false;
            }
            return true;
          });
        }else if(typeof t_mid === 'undefined'){
          readings = readings.filter((reading,i)=>{
            if(reading.socket_id === socket_id){
              return false;
            }
            return true;
          });
        }else{
          readings = readings.filter((reading,i)=>{
            if(reading.id_employee === id_employee && reading.socket_id === socket_id && reading.t_mid === t_mid){
              return false;
            }
            return true;
          });
        }
        return readings;
      }

      var readings = Immutable.asMutable(state.readings);
      readings = deleteReadings(readings,action.reading.id_employee);
      readings.push(action.reading);
      state = Immutable.setIn(state, ['readings'], readings);
      break;

    case 'DELETE_READINGS':
      /*
      var readings = Immutable.asMutable(state.readings);
      readings = deleteReadings(readings,action.id_employee,action.socket_id,action.t_mid);
      state = Immutable.setIn(state, ['readings'], readings);
      */
      break;
  
    case 'GET_CONVERSATIONS':
      var pid = action.pid;
      var page_i = state.Pages.findIndex((x,i)=>(parseInt(x.pid,10) === parseInt(pid,10)));
      var Page = state.Pages[page_i];
      var cman_is = 
      state.ConvManagers.reduce(function(a, x, i) {
          if (parseInt(x.pid,10) === parseInt(pid,10))
              a.push(i);
          return a;
      }, []);

      var Conversations = ( Page.Conversations && Page.Conversations.length>=1 ? Immutable.asMutable(Page.Conversations) : [] );
      var ConversationsLoaded = action.Conversations;

      Conversations = mergeConversations(Conversations,ConversationsLoaded,true,false);
      Conversations.sort(dateCompare);

      // SPECIAL TREATMENT FOR MESSAGE FILTER
      console.log('$$$ SPECIAL TREATMENT FOR MESSAGE FILTER');
      console.log(action.filter.message);
      if(action.filter.message){
        console.log(ConversationsLoaded.length);
        var t_mids_loaded = ConversationsLoaded.map((x)=>(x.t_mid)); 
      }

      state = Immutable.setIn(state, ["Pages",page_i,"Conversations"], Conversations);
      cman_is.map((cman_i,i)=>{
        // SPECIAL TREATMENT FOR MESSAGE FILTER
        state = Immutable.setIn(state, ["ConvManagers", cman_i, "filter",'message_t_mids'], t_mids_loaded);

        var ConversationsFiltered = filterConversations(Conversations,state.ConvManagers[cman_i].filter);
        state = Immutable.setIn(state, ["ConvManagers", cman_i, "Conversations"], {data:ConversationsFiltered});
      });

      break;

    case 'REFRESH_CONVERSATIONS':
      var pid = action.pid;
      var page_i = state.Pages.findIndex((x,i)=>(parseInt(x.pid,10) === parseInt(pid,10)));
      var Page = state.Pages[page_i];
      var cman_is = 
      state.ConvManagers.reduce(function(a, x, i) {
          if (parseInt(x.pid,10) === parseInt(pid,10))
              a.push(i);
          return a;
      }, []);

      var Conversations = Page.Conversations;
      var ConversationsLoaded = action.Conversations;

      Conversations = mergeConversations(Conversations,ConversationsLoaded,true,true);
      Conversations.sort(dateCompare);
      state = Immutable.setIn(state, ["Pages",page_i,"Conversations"], Conversations);

      cman_is.map((cman_i,i)=>{
        var ConversationsFiltered = filterConversations(Conversations,state.ConvManagers[cman_i].filter);        
        state = Immutable.setIn(state, ["ConvManagers", cman_i, "Conversations"], {data:ConversationsFiltered});
      });
      break;

    case 'NEW_MESSAGE':
      var pid = action.pid;
      var t_mid = action.t_mid;
      var page_i = state.Pages.findIndex((x,i)=>(parseInt(x.pid,10) === parseInt(pid,10)));
      var Page = state.Pages[page_i];
      var cman_is = 
      state.ConvManagers.reduce(function(a, x, i) {
          if (parseInt(x.pid,10) === parseInt(pid,10))
              a.push(i);
          return a;
      }, []);
      var is_tmp = typeof action.is_tmp !== 'undefined' ? action.is_tmp : false;

      var Conversations = Page.Conversations;
      //var ConvManagers = state.ConvManagers;

      var conv_i = Conversations.findIndex((x,i)=>(x.t_mid === t_mid));

      //OLD MESSAGES
      if(conv_i === -1 || !Conversations[conv_i].messages){
        var Messages = [];
      }else{
        var Messages = Immutable.asMutable(Conversations[conv_i].messages.data);
      }

      //REMOVE TMP MESSAGE
      if(is_tmp === false){
        var index_tmp_msg = Messages.findIndex((x,i)=>(typeof x.m_mid === 'undefined'));
        Messages.splice(index_tmp_msg,1);
      }

      //MERGE OLD AND NEW MESSAGE
      if(action.Message){
          Messages = mergeMessages(Messages,[action.Message],true,is_tmp);
      }
      if(action.Messages){
          Messages = mergeMessages(Messages,action.Messages,false,is_tmp);
      }

      Messages.sort(dateCompareMessage);

      //REPLACE MESSAGES IN CONVERSATION, CHOOSE OLD/NEW CONVERSATION DEPENDING ON CRITERIA
      if(action.Conversation){
        var ConversationChanged = action.Conversation;
        ConversationChanged.messages = {data:Messages};
      }else{
        var ConversationChanged = Conversations[conv_i];
        ConversationChanged = Immutable.setIn(ConversationChanged,['messages','data'],Messages);
      }

      Conversations = mergeConversations(Conversations,[ConversationChanged],true,false);
      Conversations.sort(dateCompare);

      state = Immutable.setIn(state, ["Pages",page_i,"Conversations"], Conversations);
      if(!state.freeze){
        cman_is.map((cman_i,i)=>{
          var ConversationsFiltered = filterConversations(Conversations,state.ConvManagers[cman_i].filter);        
          state = Immutable.setIn(state, ["ConvManagers", cman_i, "Conversations"], {data:ConversationsFiltered});
        });
      }
      break;

    case 'FILTER_PAGE':
      var pid = action.pid;
      var cman_i = action.cman_i;
      var page_i = state.Pages.findIndex((x,i)=>(parseInt(x.pid,10) === parseInt(pid,10)));
      var Page = state.Pages[page_i];
      var Conversations = Page.Conversations;

      state = Immutable.setIn(state, ["ConvManagers", cman_i, "pid"], pid);
      state = Immutable.setIn(state, ["ConvManagers", cman_i, "Conversations"], {data:Conversations});
      break;

    case 'CHANGE_FILTER':
      var pid = action.pid;
      var cman_i = action.cman_i;
      var page_i = state.Pages.findIndex((x,i)=>(parseInt(x.pid,10) === parseInt(pid,10)));
      var Page = state.Pages[page_i];
      var Conversations = Page.Conversations;

      switch(action.filter_name){
        case 'inbox':
          state = Immutable.setIn(state, ["ConvManagers", cman_i, "filter", "inbox"], action.filter_value);
          break;
        case 'label_ids':
          state = Immutable.setIn(state, ["ConvManagers", cman_i, "filter", "label_ids"], action.filter_value);
          break;
        case 'id_employee_engage_by':
          state = Immutable.setIn(state, ["ConvManagers", cman_i, "filter", "id_employee_engage_by"], action.filter_value);
          break;
        case 'name':
          state = Immutable.setIn(state, ["ConvManagers", cman_i, "filter", "name"], action.filter_value);
          break;
        case 'message':
          state = Immutable.setIn(state, ["ConvManagers", cman_i, "filter", "message"], action.filter_value);
          state = Immutable.setIn(state, ["ConvManagers", cman_i, "filter", "message_t_mids"], []);
          break;
        default:
          break;
      }
      var ConversationsFiltered = filterConversations(Conversations,state.ConvManagers[cman_i].filter);        
      state = Immutable.setIn(state, ["ConvManagers", cman_i, "Conversations"], {data:ConversationsFiltered});
      break;

    case 'ADD_FILES':
      var pid = action.pid;
      var page_i = state.Pages.findIndex((x)=>(x.pid === pid));
      console.log('$$$ ADD_FILES');
      console.log(action);
      console.log(page_i);
      var UploadsLoaded = action.Uploads;
      var Uploads = Immutable.asMutable(state.Pages[page_i].Uploads);

      Uploads = mergeUploads(Uploads,UploadsLoaded);
      state = Immutable.setIn(state, ['Pages',page_i,'Uploads'], Uploads);
      break;

    case 'DELETE_FILES':
      var pid = action.pid;
      var page_i = state.Pages.findIndex((x)=>(x.pid === pid));
      var attachment_ids = action.attachment_ids;
      var Uploads = Immutable.asMutable(state.Pages[page_i].Uploads);

      Uploads = Uploads.filter((Upload,i)=>{
        return attachment_ids.indexOf(Upload.attachment_id) === -1;
      });
      state = Immutable.setIn(state, ['Pages',page_i,'Uploads'], Uploads);
      break;

    case 'GET_SREPLIES':
      var pid = action.pid;
      var page_i = state.Pages.findIndex((x)=>(x.pid === pid));
      state = Immutable.setIn(state, ['Pages',page_i,'SReplies'], action.SReplies);
      break;

    case 'ADD_SREPLY':
      var pid = action.pid;
      var page_i = state.Pages.findIndex((x)=>(x.pid === pid));
      var SReplyLoaded = action.SReply;
      var SReplies = Immutable.asMutable(state.Pages[page_i].SReplies);

      SReplies.push(SReplyLoaded);
      state = Immutable.setIn(state, ['Pages',page_i,'SReplies'], SReplies);
      break;

    case 'DELETE_SREPLIES':
      var pid = action.pid;
      var page_i = state.Pages.findIndex((x)=>(x.pid === pid));
      var sreply_ids = action.sreply_ids;
      var SReplies = Immutable.asMutable(state.Pages[page_i].SReplies);
      SReplies = SReplies.filter((SReply,i)=>{
        return sreply_ids.indexOf(SReply.sreply_id) === -1;
      });
      state = Immutable.setIn(state, ['Pages',page_i,'SReplies'], SReplies);
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
    //this.state = {has_message:false};
    this.state = {auto_scroll_locked:false,Stickers:this.filterUploads(props.Uploads,'STICKER')};
    this.emojis = [
      '😄','😅','😇','😊','😱','😝','😣','😭','👌','👍','🙏'
    ];
  }

  componentWillReceiveProps(nextProps) {
    this.setState({Stickers:this.filterUploads(nextProps.Uploads,'STICKER')});
  }

  componentDidMount() {
      //const messageList = findDOMNode(this.messageList)
      //messageList.addEventListener('scroll', this._handleScroll);
      $('[data-toggle="popover"]').popover();
  }

  componentWillUnmount() {
      //const messageList = findDOMNode(this.messageList)
      //messageList.removeEventListener('scroll', this._handleScroll);
  }

  componentDidUpdate() {
    if(!this.state.auto_scroll_locked){
      this.scrollToBottom();
    }
  }
  /*
  handleConversationMessageChange = (event) => {
    this.setState({message_create:event.target.value});
  }
  */
  handleConversationMessageSubmit = (event) => {
    var t_mid = this.props.t_mid;
    var pid = this.props.pid;
    var cman_i = this.props.cman_i;
    var message = this.message_create.value;

    sendMessage(pid,cman_i,t_mid,message);
    //this.setState({message_create:''});
    this.message_create.value = '';
  }
  /*
  handleChangeMessage = (event) =>{
    if(event.target.value !== ''){
      this.setState({has_message:true});
    }else{
      this.setState({has_message:false});
    }
  }
  */
  handleKeyPress = (event) =>{
    console.log(event.key);
    if(event.key === 'Enter' && !event.shiftKey){
      var t_mid = this.props.t_mid;
      var pid = this.props.pid;
      var cman_i = this.props.cman_i;
      var message = this.message_create.value;

      sendMessage(pid,cman_i,t_mid,message);
      this.message_create.value = '';
      event.preventDefault();
    }
  }

  handleSendReadReceipt = (event) =>{
    var pid = this.props.pid;
    var t_mid = this.props.t_mid;
    sendReadReceipt(pid,t_mid);
  }

  handleEngageConversation = (event) =>{
    var pid = this.props.pid;
    var t_mid = this.props.t_mid;
    engageConversation(pid,t_mid);
  }

  handleGetMessages = (event) => {
    var Messages = this.props.messages ? this.props.messages.data : null;
    var pid = this.props.pid;
    var t_mid = this.props.t_mid;
    var before = Messages ? Messages[Messages.length-1].created_time : this.props.ConversationC.updated_time;
    var max_rows = 100;

    getMessages(pid,t_mid,true);
  }

  handleGetMessagesForceRefresh = (event) => {
    var Messages = this.props.messages ? this.props.messages.data : null;
    var pid = this.props.pid;
    var t_mid = this.props.t_mid;
    var before = Messages ? Messages[Messages.length-1].created_time : this.props.ConversationC.updated_time;
    var max_rows = 100;

    getMessages(pid,t_mid,false);
  }

  handleUpdateConversationLabels = (all_selected_options) => {
    var pid = this.props.pid;
    var t_mid = this.props.t_mid;
    updateConversationLabels(pid,t_mid,all_selected_options);
  }

  handleScrollLock = (event) =>{
    this.setState({auto_scroll_locked:!this.state.auto_scroll_locked});
  }

  scrollToBottom() {
    const scrollHeight = this.messageList.scrollHeight;
    const height = this.messageList.clientHeight;
    const maxScrollTop = scrollHeight - height;
    this.messageList.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;
  }

  handleSelectEmoji = (event) => {
    this.message_create.value = this.message_create.value + event.target.innerHTML;
  }

  handleSendSticker = (event) =>{
      var pid = this.props.pid;
      var t_mid = this.props.t_mid;
      var cman_i = this.props.cman_i;
      var attachment_id = event.target.attributes.getNamedItem('data-attachment-id').value;

      sendMessage(pid,cman_i,t_mid,null,[attachment_id]);
  }

  filterUploads(Uploads,tag_name){
    return Uploads.filter((x)=>{
      if(x.FBXTags && x.FBXTags.length >=1){
        return x.FBXTags[0].name === tag_name
      }
      return false;
    });
  }

  render(){
    var Messages = this.props.messages ? this.props.messages.data : [];
    var pid = this.props.pid;
    //var message_create = this.state.message_create;
    var message_count = this.props.message_count;
    var FBLabels = this.props.FBLabels;
    var EmojiSelector = 
    <Popover id="popover-trigger-click-root-close">
      {this.emojis.map((emoji,i)=>(
        <span key={'emoji'+i} className="emoji_icon" onClick={this.handleSelectEmoji.bind(this)}>{emoji}</span>
      ))}
    </Popover>;
    var StickerSelector = 
    <Popover id="popover-trigger-click-root-close">
      {this.state.Stickers.map((Sticker,i)=>(
        <img key={'sticker'+i} className="sticker_icon" src={BASEDIR+'/msg/media/'+Sticker.filename} data-attachment-id={Sticker.attachment_id} onClick={this.handleSendSticker}/>
      ))}
    </Popover>;

    return(
      <section className="MessageManager">
        <section className="ConversationOptions">
          <div className="MessageLoaderButtons">
            <div className="btn-group" role="group">
              <button className="btn btn-sm btn-info" onClick={this.handleGetMessages}>{(Messages.length+'/'+message_count)}</button>
              <button className="btn btn-sm btn-default" onClick={this.handleGetMessagesForceRefresh}><span className="glyphicon glyphicon-refresh"></span></button>
              <button className={"btn btn-sm"+(this.state.auto_scroll_locked ? ' btn-warning' : ' btn-default')} onClick={this.handleScrollLock}><span className="glyphicon glyphicon-lock"></span></button>
            </div>
            <span className="CustomerName pull-right">{this.props.ConversationC.name}</span>
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
            var message_from = (Message.from.id == pid) ? " self" : " other";
            var message_left_right = (Message.from.id == pid) ? "top" : "left";

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
                  if(attachment.mime_type === 'audio/mpeg' || attachment.mime_type === 'audio/aac'){
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
              <div key={Message.id ? Message.id : 'tmp_message'} className={"message_wrapper"+message_from} >
                <OverlayTrigger 
                  placement={message_left_right} 
                  overlay={
                    <Tooltip id="tooltip">
                      {/*moment().diff(moment.utc(Message.created_time),'hours') <= 24
                         ? moment.utc(Message.created_time).utcOffset(8).format('HH:mm') 
                         : moment.utc(Message.created_time).utcOffset(8).format('YYYY-MM-DD HH:mm')
                      */}
                      { moment.utc(Message.created_time).utcOffset(8).format('YYYY-MM-DD HH:mm:ss')
                        + (Message.Employee ? ' '+Message.Employee.firstname : '')
                      }
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
          <button className="btn btn-sm btn-default" onClick={this.handleSendReadReceipt}><span className="glyphicon glyphicon-sunglasses"></span></button>
          <button className="btn btn-sm btn-default" onClick={this.handleEngageConversation}>{"Engage"}</button>
          <SReplyManager 
            pid={this.props.pid}
            t_mid={this.props.t_mid}
            cman_i={this.props.cman_i}
            Uploads={this.props.Uploads}
            SReplies={this.props.SReplies}
            psid={this.props.ConversationC ? this.props.ConversationC.psid : undefined}
          />
          <UploadManager 
            pid={this.props.pid}
            t_mid={this.props.t_mid}
            cman_i={this.props.cman_i} 
            Uploads={this.props.Uploads}
            psid={this.props.ConversationC ? this.props.ConversationC.psid : undefined}
            Tags={this.props.Tags}
          />
          <OverlayTrigger trigger="click" rootClose placement="top" overlay={EmojiSelector}>
            <button className="btn btn-sm btn-default">😛</button>
          </OverlayTrigger>
          <OverlayTrigger trigger="click" rootClose placement="top" overlay={StickerSelector}>
            <button className="btn btn-sm btn-default" disabled={this.props.ConversationC && this.props.ConversationC.psid ? false : true}>Stick</button>
          </OverlayTrigger>
          <button className={"pull-right btn btn-sm"+(this.state.auto_scroll_locked ? ' btn-warning' : ' btn-default')} onClick={this.handleScrollLock}><span className="glyphicon glyphicon-lock"></span></button>          
        </section>

        <div className="form-group">
          <div className="input-group">
            <textarea
              className="form-control"
              name="message_create"
              ref={(message_create) => {this.message_create = message_create}}
              rows="8"
              onKeyPress={this.handleKeyPress}
            />
            <div className={"input-group-addon send-message active"} onClick={this.handleConversationMessageSubmit}>
              SEND
            </div>
          </div>
        </div>

      </section>
    );
  }

}

class ConvLoadFilter extends Component{

  constructor(props,context) {
    super(props,context);
  }

  handleSelectPage = (option) =>{
    rstore.dispatch({
      type:'FILTER_PAGE',
      cman_i:this.props.cman_i,
      pid: (option ? option.value : null)
    });
    rerender();
  }

  handleSelectInbox = (option) =>{
    rstore.dispatch({
      type:'CHANGE_FILTER',
      pid: this.props.pid,
      cman_i:this.props.cman_i,
      filter_name: 'inbox',
      filter_value: (option ? option.value : 'INBOX')
    });
    rerender();
  }

  handleSelectFBLabels = (all_selected_options) =>{
    var label_ids = all_selected_options.map((x,i)=>(x.value));
    
    rstore.dispatch({
      type:'CHANGE_FILTER',
      pid: this.props.pid,
      cman_i:this.props.cman_i,
      filter_name: 'label_ids',
      filter_value: (label_ids ? label_ids : null)
    });
    rerender();
  }

  handleSelectEngageBy = (option) =>{    
    rstore.dispatch({
      type:'CHANGE_FILTER',
      pid: this.props.pid,      
      cman_i:this.props.cman_i,
      filter_name: 'id_employee_engage_by',
      filter_value: (option ? option.value : null)
    });
    rerender();
  }

  handleChangeName = (event) =>{
    rstore.dispatch({
      type:'CHANGE_FILTER',
      pid: this.props.pid,
      cman_i:this.props.cman_i,
      filter_name: 'name',
      filter_value: (event.target.value ? event.target.value : "")
    });
    rerender();
  }

  handleChangeMessage = (event) =>{
    rstore.dispatch({
      type:'CHANGE_FILTER',
      pid: this.props.pid,
      cman_i:this.props.cman_i,
      filter_name: 'message',
      filter_value: (event.target.value ? event.target.value : "")
    });
    rerender();
  }

  /*
  handleSelectProductsAsked = (all_selected_options) =>{
    this.setState({products_asked:all_selected_options});
  }
  */
  handleGetConversations = (event) => {
    var cman_i = this.props.cman_i;
    getConversations(cman_i);
  }

  handleGetMoreConversations = (event) => {
    var cman_i = this.props.cman_i;
    var more = parseInt(this.TextInputMore.value,10);
    if(more && more <= 10){
      getConversations(cman_i,more);
    }else{
      alert('Please input a valid number from 1 to 10');
    }
  }

  handleRefreshConversations = (event) => {
    refreshConversations(this.props.cman_i);
  }

  handleSyncLabels = (event) => {
    var yes = confirm('Do you really want to synchronize all labels?');
    if(yes){
      syncLabels(this.props.pid);
    }
  }

  handleSyncConversations = (event) => {
    var yes = confirm('Do you really want to synchronize Conversations of last 7 days?');
    if(yes){
      syncConversations(this.props.pid);
    }
  }

  render() {
    var Employees = this.props.Employees;
    var Pages = this.props.Pages;
    var cman_i = this.props.cman_i;
    var pid = this.props.pid;
    var inbox = this.props.filter.inbox;
    var FBLabels = this.props.FBLabels;
    var label_ids = this.props.filter.label_ids;
    var id_employee_engage_by = this.props.filter.id_employee_engage_by;
    var Page = this.props.Pages.find((x,i)=>(parseInt(x.pid,10) === parseInt(pid,10)));
    var name = this.props.filter.name;
    var message = this.props.filter.message;

    return(
      <section className="ConvLoadFilter">

        <div className="input-group">
          <span className="input-group-addon input-group-sm">Page :</span>
          <ReactSelect 
            value={pid}
            options={
              Pages.map((Page,i)=>(
                { value: Page.pid, label: Page.name }
              ))
            }
            onChange={this.handleSelectPage}
            multi={false}
          />
        </div>

        <div className="input-group">
          <span className="input-group-addon input-group-sm">Inbox :</span>
          <ReactSelect 
            value={inbox}
            options={[{value:'INBOX',label:'Inbox'},{value:'UNREAD',label:'Unread'}]}
            onChange={this.handleSelectInbox}
            multi={false}
          />
        </div>

        <div className="input-group">
          <span className="input-group-addon input-group-sm">Labels :</span>
          <ReactSelect 
            value={label_ids}
            options={
              (Page && Page.FBLabels)
              ? Page.FBLabels.map((FBLabel,i)=>(
                { value: FBLabel.label_id, label: FBLabel.name }
              ))
              : []
            }
            onChange={this.handleSelectFBLabels}
            multi={true}
          />
        </div>

        <div className="input-group">
          <span className="input-group-addon input-group-sm">Replied :</span>
          <ReactSelect 
            value={id_employee_engage_by}
            options={
              (Employees)
              ? Employees.map((Employee,i)=>(
                  { value: Employee.id_employee, label: Employee.firstname }
                ))
              : []
            }
            onChange={this.handleSelectEngageBy}
            multi={false}
          />
        </div>

        <div className="input-group">
          <span className="input-group-addon input-group-sm">Name :</span>
          <input className="form-control" value={name} onChange={this.handleChangeName} />
        </div>

        <div className="input-group">
          <span className="input-group-addon input-group-sm">Message :</span>
          <input className="form-control" value={message} onChange={this.handleChangeMessage} />
        </div>


        {/*
        <div className="input-group">
          <span className="input-group-addon input-group-sm">Until :</span>
          <ReactDatetime />
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
        */}
        
        <div className="input-group">
          <span className="input-group-btn">
            <button className="btn btn-sm btn-primary" type="button" onClick={this.handleGetConversations}>Load</button>
            <button className="btn btn-sm btn-default" type="button" onClick={this.handleGetMoreConversations}>More</button>
          </span>
          <input type="text" className="form-control input-sm" style={{width:'50px'}} defaultValue={1} ref={(input)=>{this.TextInputMore = input}} />
          <span className="input-group-btn">
            <button className="btn btn-sm btn-default" onClick={this.handleRefreshConversations}>R</button>
            <button className="btn btn-sm btn-default" type="button" onClick={this.handleSyncLabels}>L</button>
            <button className="btn btn-sm btn-default" type="button" onClick={this.handleSyncConversations}>C</button>
          </span>
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

class Modal extends Component{
  constructor(props) {
    super(props);
  }

  render(){
    var title = this.props.title;
    var children = this.props.children;
    var modal_id = this.props.modal_id;
    var footer = this.props.footer;

    return(
      <div className="modal fade" id={modal_id} tabIndex="-1" role="dialog" aria-labelledby="myModalLabel">
        <div className="modal-dialog modal-lg" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
              <h4 className="modal-title" id="myModalLabel">{title}</h4>
            </div>
            <div className="modal-body">
              {children}
            </div>
            <div className="modal-footer">
              {footer}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

class UploadManager extends Component{
  constructor(props) {
    super(props);
    this.state = {highlights:[],search_text:'',Uploads:props.Uploads,selected_tag_ids:[]};
  }

  componentWillReceiveProps(nextProps) {
    this.setState({Uploads:this.filterUploads(nextProps.Uploads,this.state.search_text)});
  }

  handleSearch = (event) =>{
    var search_text = event.target.value;
    this.setState({search_text:search_text,Uploads:this.filterUploads(this.props.Uploads,search_text)});
  }

  filterUploads = (Uploads,search_text) => {
    search_text = search_text.toLowerCase();
    if(search_text && search_text !== ''){
      Uploads = Uploads.filter((Upload)=>{
        if(Upload.name.toLowerCase().indexOf(search_text) !== -1){
          return true;
        }
        return false;
      });
    }
    return Uploads;
  }

  handleAddFiles = (event) =>{
    var pid = this.props.pid;
    var cman_i = this.props.cman_i;
    var files = event.target.files;
    //var image_upload_preview = this.image_upload_preview;
    var file_buffers = [];
    var file_infos = [];
    var name = this.upload_name_create.value;
    var tag_ids = this.state.selected_tag_ids;
    this.upload_name_create.value = '';
    this.setState({selected_tag_ids:[]});

    if(files && files.length >=1){

      for(var i=0;i<files.length;i++){
        file_infos.push({
          filename_ori:files[i].name,
          name:name,
          tag_ids:tag_ids,
          type:files[i].type,
          size:files[i].size,
          lastModified:files[i].lastModified
        });

        var type = file_infos[i].type;
        var file = files[i];

        var accepted_types = ['image/png','image/gif','image/jpeg'];
        if(accepted_types.findIndex((x)=>(x === type)) !== -1){
          var reader = new FileReader();
          //var reader2 = new FileReader();
          
          //reader2.onload = function (e) {
          //  image_upload_preview.src = e.target.result;
          //}
          reader.onload = function (e){
            file_buffers.push(e.target.result);
            if(files.length === file_buffers.length){
              addFiles(pid,file_infos,file_buffers);
            }
          }
          //reader2.readAsDataURL(file);
          reader.readAsArrayBuffer(file);
        } //END IF
      } //END LOOP
    }
  }


  handleHighlight = (event) =>{
    var highlights = this.state.highlights;
    console.log('$$$ HIGHLIGHT');
    console.log(highlights);
    var attachment_id_selected = event.target.attributes.getNamedItem('data-attachment-id').value;
    var index = highlights.indexOf(attachment_id_selected);
    if(index === -1){
      highlights.push(attachment_id_selected);
    }else{
      highlights.splice(index, 1);
    }
    this.setState({highlights:highlights});
    console.log(attachment_id_selected);
    console.log(highlights);
  }

  handleSend = (event) =>{
    console.log('HANDLE SEND');
    var pid = this.props.pid;
    var t_mid = this.props.t_mid;
    var cman_i = this.props.cman_i;
    var attachment_ids = this.state.highlights;

    //var Uploads = this.props.Uploads;
    //var UploadsSelected = Uploads.filter((Upload,i)=>(upload_ids.indexOf(Upload.upload_id) !== -1));
    //var filenames = UploadsSelected.map((UploadSelected,i)=>(UploadSelected.filename));
    sendMessage(pid,cman_i,t_mid,null,attachment_ids);
    this.setState({highlights:[],search_text:''});    
  }

  handleDelete = (event) =>{
    console.log('HANDLE DELETE');
    var pid = this.props.pid;
    var attachment_ids = this.state.highlights;
    deleteFiles(pid,attachment_ids);
  }

  handleUpdateTags = (all_selected_options) =>{
    console.log(all_selected_options);
    var selected_tag_ids = all_selected_options.map((option)=>(option.value));
    console.log(selected_tag_ids);
    this.setState({selected_tag_ids:selected_tag_ids});
  }

  render(){
    var cman_i = this.props.cman_i;
    var Uploads = this.state.Uploads;
    var psid = this.props.psid;
    var footer = 
      <div>
        <button className="btn btn-primary" onClick={this.handleSend} data-dismiss="modal">SEND</button>
        <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
      </div>;

    return(
      <span className="UploadManager">
        <button className="btn btn-default btn-sm" data-toggle="modal" data-target={'#cman_modal'+cman_i} disabled={psid ? false : true}><span className="glyphicon glyphicon-picture" aria-hidden="true"></span></button>
        <Modal
          title={'Images'}
          modal_id={'cman_modal'+cman_i}
          footer={footer}
          >

          <div className="form-group">
            <label>Search</label>
            <input type="text" className="form-control" onChange={this.handleSearch} value={this.state.search_text} />
          </div>

          <section className="FileSelector">
            {Uploads.map((Upload,i)=>(
              <OverlayTrigger 
                key={'overlay_upload_id_'+Upload.upload_id}
                placement={'top'} 
                overlay={
                  <Tooltip id="tooltip">{Upload.name}</Tooltip>
                }
              >
                <div key={'upload_id_'+Upload.upload_id} className={"thumbnail_box"+(this.state.highlights.indexOf(Upload.attachment_id) !== -1 ? ' active' : '') }>
                  <img className="upload_image_thumbnail" src={BASEDIR+'/msg/media/'+Upload.filename} data-attachment-id={Upload.attachment_id} onClick={this.handleHighlight}/>
                </div>
              </OverlayTrigger>
            ))}
          </section>

          <button className="btn btn-warning" onClick={this.handleDelete}>DELETE</button>

          <Row>
          <Col md={6}>
            <section className="FileUploader">
              <h4>{'Upload a new attachment'}</h4>
              <div className="form-group">
                <input type="text" className="form-control" placeholder="name" ref={(node)=>{this.upload_name_create = node}}/>
              </div>

              <ReactSelect 
                value={this.state.selected_tag_ids.join(',')}
                options={this.props.Tags ? this.props.Tags.map((Tag,i)=>({value:Tag.tag_id+'',label:Tag.name})) : []}
                onChange={this.handleUpdateTags}
                multi={true}
              />
              <input className="form-control" type="file" onChange={this.handleAddFiles} />
            </section>
          </Col>
          </Row>




          
        </Modal>
      </span>
    );
  }

}

class TextExpand extends Component{
  constructor(props) {
    super(props);
    this.state = {expand:false};
  }

  handleExpand = (event) =>{
    this.setState({expand:true});
  }

  render(){
    return(
      <span>
        {this.state.expand 
          ? this.props.children 
          : (this.props.children.substring(0,this.props.cutoff)+'...')
        }
        {this.state.expand 
          ? null
          : <button className="btn btn-xs btn-default" onClick={this.handleExpand}>more...</button>
        }
      </span>
    );
  }

}

class SReplyManager extends Component{
  constructor(props) {
    super(props);
    this.state = {
      image_selected:'',
      sreply_id_selected:null,
      search_text:'',
      SReplies:this.filterSReply(props.SReplies,''),
      select_to_send:true
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({SReplies:this.filterSReply(nextProps.SReplies,this.state.search_text)});
  }

  handleSelectImage = (event) =>{
    console.log('$$$ '+event.target.attributes.getNamedItem('data-attachment-id').value);
    this.setState({image_selected:event.target.attributes.getNamedItem('data-attachment-id').value});
  }

  handleClearImageSelection = (event) =>{
    this.setState({image_selected:''});
  }

  handleAdd = (event) =>{
    var pid = this.props.pid;
    var title = this.sreply_title_create.value;
    var message = this.sreply_message_create.value;
    if(message !== '' && title !== ''){
      var attachment_id = this.state.image_selected;

      addSReply(pid,title,message,attachment_id);
      this.sreply_title_create.value = '';
      this.sreply_message_create.value = '';
      this.setState({image_selected:''});
    }
  }

  handleSelect = (event) =>{
    var sreply_id_selected = parseInt(event.currentTarget.attributes.getNamedItem('data-sreply-id').value,10);
    if(this.state.select_to_send){
      this.handleSend(null,sreply_id_selected);
    }else{
      this.setState({sreply_id_selected:sreply_id_selected});
    }
  }

  handleToggleSelectToSend = (event) =>{
    this.setState({select_to_send:!this.state.select_to_send});
  }

  handleSend = (event,sreply_id_selected) =>{
    var pid = this.props.pid;
    var t_mid = this.props.t_mid;
    var cman_i = this.props.cman_i;
    var sreply_id = typeof sreply_id_selected !== 'undefined' ? sreply_id_selected : this.state.sreply_id_selected;
    var SReply = this.props.SReplies.find((x)=>(x.sreply_id === sreply_id));
    var attachment_id = SReply.attachment_id;
    var message = SReply.message;
    //var Uploads = this.props.Uploads;
    //var UploadsSelected = Uploads.filter((Upload,i)=>(upload_ids.indexOf(Upload.upload_id) !== -1));
    //var filenames = UploadsSelected.map((UploadSelected,i)=>(UploadSelected.filename));
    if(typeof attachment_id !== 'undefined'){
      sendMessage(pid,cman_i,t_mid,null,[attachment_id]);
    }
    sendMessage(pid,cman_i,t_mid,message);
    this.setState({search_text:''});
  }

  handleDelete = (event) =>{
    var pid = this.props.pid;
    var sreply_ids = [this.state.sreply_id_selected];
    console.log(sreply_ids);
    if(sreply_ids && sreply_ids.length>=1){
      deleteSReplies(pid,sreply_ids);
    }
  }

  handleSearch = (event) =>{
    var search_text = event.target.value;
    this.setState({search_text:search_text,SReplies:this.filterSReply(this.props.SReplies,search_text)});
  }

  filterSReply = (SReplies,search_text) => {
    search_text = search_text.toLowerCase();
    if(search_text && search_text !== ''){
      SReplies = SReplies.filter((SReply)=>{
        if(SReply.title.toLowerCase().indexOf(search_text) !== -1){
          return true;
        }
        if(SReply.message.toLowerCase().indexOf(search_text) !== -1){
          return true;
        }
        return false;
      });
    }
    return SReplies;
  }

  render(){
    var cman_i = this.props.cman_i;
    var Uploads = this.props.Uploads;
    var SReplies = this.state.SReplies;
    var psid = this.props.psid;
    var footer = 
      <div>
        <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
      </div>;
    
    return(
      <span className="SReplyManager">
        <button className="btn btn-default btn-sm" data-toggle="modal" data-target={'#sreply_cman_modal'+cman_i} ><span className="glyphicon glyphicon-flash" aria-hidden="true"></span> SavedReply</button>
        <Modal
          title={'Saved Replies'}
          modal_id={'sreply_cman_modal'+cman_i}
          footer={footer}
          >

          <div className="form-group">
            <label>Search</label>
            <input type="text" className="form-control" onChange={this.handleSearch} value={this.state.search_text}/>
          </div>

          <section className="SReplySelector">
            {SReplies.map((SReply,i)=>(
              <div 
                key={'cman_'+cman_i+'_sreply_id_'+SReply.sreply_id} 
                className={"sreply_image_thumbnail_box"+(this.state.sreply_id_selected === SReply.sreply_id ? ' alert-info' : '')}
                onClick={this.handleSelect}
                data-sreply-id={SReply.sreply_id}
                data-dismiss={this.state.select_to_send ? 'modal' : false}
              >
                <div className="title">{SReply.title}</div>
                {SReply.upload_filename ? <img className="sreply_image_thumbnail" src={BASEDIR+'/msg/media/'+SReply.upload_filename}/> : null}
                <div className="text"><TextExpand cutoff={50}>{SReply.message}</TextExpand></div>
              </div>
            ))}
            <div className="clear"></div>
          </section>
          <button className="btn btn-warning" onClick={this.handleDelete}>DELETE</button>
          <button className="btn btn-primary pull-right" onClick={this.handleSend} data-dismiss="modal">SEND</button>
          <button className={'btn btn-default'+(this.state.select_to_send ? ' active' : '')} onClick={this.handleToggleSelectToSend}>SELECT TO SEND</button>
          <hr />

          <Row>
          <Col md={6}>

            <h4>{'Add a new Saved Reply'}</h4>
            <div className="form-group">
              <input type="text" className="form-control" placeholder="Title" ref={(node)=>{this.sreply_title_create = node}}/>
            </div>

            <div className="form-group">
              <textarea className="form-control" placeholder="message" ref={(node)=>{this.sreply_message_create = node}}/>
            </div>

          </Col>
          </Row>

          <Row>
          <Col md={12}>
            { this.state.image_selected !== ''
              ?
              <div>
                <button className="btn btn-default btn-sm" onClick={this.handleClearImageSelection}>Choose Photo</button>
                <img className="selected_image_thumbnail" src={BASEDIR+'/msg/media/'+Uploads.find((Upload)=>(Upload.attachment_id === this.state.image_selected)).filename}/>
              </div>
              :
              <section className="FileSelector">
                {Uploads.map((Upload,i)=>(
                  <div key={'sreply_upload_id_'+Upload.upload_id} className={"thumbnail_box"+(this.state.image_selected === Upload.attachment_id ? ' active' : '') }>
                    <img className="upload_image_thumbnail" src={BASEDIR+'/msg/media/'+Upload.filename} data-attachment-id={Upload.attachment_id} onClick={this.handleSelectImage}/>
                  </div>
                ))}
              </section>
            }

            <button className="btn btn-primary" onClick={this.handleAdd}>ADD</button>

          </Col>
          </Row>

        </Modal>
      </span>
    );
  }
}

class ConversationCard extends Component{
  constructor(props,context) {
    super(props,context);
    this.state = {highlight:false,show_more_messages:false}; 
  }
  /*
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
  */
  handleDisplayMessages = (event) => {
    var pid = this.props.pid;
    var t_mid = this.props.Conversation.t_mid;

    event.stopPropagation();
    this.props.setConversationSelected(t_mid);
    getMessages(pid,t_mid,true);
    addReading(t_mid);
  }

  render(){
    if(this.props.Conversation.messages && this.props.Conversation.messages.data.length >=1){
      var messages = this.props.Conversation.messages.data.slice(0,4);
      /*
      var MessageFromCustomerLast = messages.find((x)=>{
        if(x.from.id !== this.props.pid){
          return true;
        }
      });
      if(MessageFromCustomerLast){
        var last_message_from_customer_timediff = moment().diff(moment(MessageFromCustomerLast.created_time),'seconds');
      }
      */
    }
    if(this.props.readings && this.props.readings.length>=1){
      var readings_c = this.props.readings.filter((reading)=>(reading.t_mid === this.props.Conversation.t_mid));
    }else{
      var readings_c = [];
    }

    return(
      <section 
        className={ "ConversationCard"
                    +(this.props.Conversation.customer_replied === 1 && this.props.Conversation.unread_count > 0/*(this.props.Conversation.unread_count > 0 && !this.props.Conversation.messages) || (this.props.Conversation.unread_count > 0 && this.props.Conversation.messages && this.props.Conversation.messages.data.length>=1 && (this.props.Conversation.messages.data[0].uid_from !== this.props.pid))*/ ? ' unread' : '')
                    +(this.props.Conversation.queued_message ? ' alert-warning' : '')
                    +(this.props.Conversation.sent_message ? ' alert-success' : '')
                    +(this.props.ConversationC && this.props.Conversation.t_mid === this.props.ConversationC.t_mid ? ' active' : '')
                  }
        onClick={this.handleDisplayMessages}
      >
        <Row>
          <Col md={2}><button className={"btn"+(this.props.Conversation.highlight ? ' btn-primary' : ' btn-default')} disabled={true} onClick={this.handleHighlight}>{this.props.i+1}</button></Col>
          <Col md={10}>
            <div>
              <span className="conversation_header">
                <span></span>
                <span className="sender_name">
                  {/*this.props.Conversation.psid && last_message_from_customer_timediff < 30 
                    ? '🈶 ' 
                    : (this.props.Conversation.psid && last_message_from_customer_timediff >= 30 
                        ? '🕛 '
                        : null
                      )
                  */}
                  {this.props.Conversation.psid ? '💧 ' : null}
                  {this.props.Conversation.name ? this.props.Conversation.name : this.props.Conversation.participants.data[0].name}
                </span>
              </span>
              <span className="updated_time">
                {moment().diff(moment.utc(this.props.Conversation.updated_time),'hours') <= 2 
                  ? moment.utc(this.props.Conversation.updated_time).utcOffset(8).fromNow() 
                  : moment.utc(this.props.Conversation.updated_time).utcOffset(8).format('YYYY-MM-DD HH:mm:ss')
                }
                {/*moment.utc(this.props.Conversation.updated_time).utcOffset(8).format('YYYY-MM-DD HH:mm:ss')*/}
              </span>
            </div>

            <div>
              { readings_c.length>=1
                ? readings_c.map((reading)=>(
                    <span key={'reading_'+reading.id_employee+reading.socket_id+reading.t_mid} className="label label-warning reading_box">{getEmployeeFirstname(reading.id_employee)}</span>
                  ))
                : null
              }
              
              {    (this.props.Conversation.engage_by)
                && (moment().diff(moment(this.props.Conversation.engage_time),'seconds') <= 3600)
                && (this.props.Conversation.engage_release !== 1)
                ? <span className="label label-success engage_box">{getEmployeeFirstname(this.props.Conversation.engage_by)}</span>
                : null
              }

              
              {this.props.Conversation.replied_last_by
                ? <span className={'label last_replied_box'+(this.props.me.id_employee === this.props.Conversation.replied_last_by ? ' label-primary' : ' label-info')} >{getEmployeeFirstname(this.props.Conversation.replied_last_by)}</span>
                : null
              }
            </div>

            <div className="label_box">
            {this.props.Conversation.FBLabels && this.props.Conversation.FBLabels.length>=1
              ? this.props.Conversation.FBLabels.map((FBlabel,i)=>(
                <span key={this.props.Conversation.id+'L'+i} className="label label-default">{FBlabel.name}</span>
              ))
              : null
            }
            </div>

            <span className="message">
                <div className="snippet">{this.props.Conversation.snippet ? this.props.Conversation.snippet : '[ IMAGE | STICKER ? ]'}</div>
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
              <ConvLoadFilter Employees={this.props.Employees} Pages={this.props.Pages} filter={this.props.ConvManager.filter} cman_i={this.props.cman_i} pid={this.props.ConvManager.pid} />
            </Accordion>

            <div className="ConversationList">

              {(Conversations && Conversations.data.length >= 1)
                ? Conversations.data.map((Conversation,index)=>{
                    if(Math.floor(index/this.state.items_per_page) === this.state.paging_current){
                      return <ConversationCard 
                                key={Conversation.id}
                                Conversation={Conversation}
                                ConversationC={ConversationC}
                                pid={this.props.ConvManager.pid}
                                i={index}
                                setConversationSelected={this.setConversationSelected}
                                readings={this.props.readings}
                                me={this.props.me}
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
                  pid={this.props.ConvManager.pid}
                  cman_i={this.props.cman_i}
                  t_mid={this.state.t_mid_selected}
                  message_count={ConversationC.message_count}
                  FBLabels={this.props.Pages[this.props.Pages.findIndex((x)=>(x.pid===this.props.ConvManager.pid))].FBLabels}
                  ConversationC={ConversationC}
                  Uploads={this.props.Pages[this.props.Pages.findIndex((x)=>(x.pid===this.props.ConvManager.pid))].Uploads}
                  SReplies={this.props.Pages[this.props.Pages.findIndex((x)=>(x.pid===this.props.ConvManager.pid))].SReplies}
                  Tags={this.props.Tags}
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

  handleDeleteEngages = (event) =>{
    deleteEngages();
  }

  handleToggleFreeze = (event) =>{
    rstore.dispatch({type:'TOGGLE_FREEZE'});
  }

  render(){
    return(
      <section className="MessengerApp">

        <div 
          className={
            this.props.state.connection_status === 'DISCONNECTED' 
              ? 'alert alert-warning' 
              : (this.props.state.connection_status === 'RECONNECT_ERROR' ? 'alert alert-warning' : '')}
        >
          {this.props.state.connection_status === 'DISCONNECTED' 
            ? 'OFFLINE' 
            : (this.props.state.connection_status === 'RECONNECT_ERROR' ? 'RECONNECTING FAILED' : '')}
        </div>

        <section className="TopBar">
          {this.props.state.me 
            ? <span>{'You are login as : '+this.props.state.me.firstname}</span>
            : null
          }
        
          <a href={BASEDIR+'/logout?redirect='+BASEDIR+'/msg/msger'}> (Logout) </a>

          <span className="btn btn-xs btn-default" onClick={this.handleDeleteEngages}>Clear My Engages</span>
          <span className={"btn btn-xs btn-default"+(this.props.state.freeze ? ' active' : '')} onClick={this.handleToggleFreeze}>{this.props.state.freeze ? 'Frozen' : 'Freeze'}</span>

          <span>{this.props.state.reqs_loading && this.props.state.reqs_loading.length>=1 ? this.props.state.reqs_loading.length+' Reqs Loading...' : ''}</span>
        </section>

        <Row>
          <Col md={6}>
            {
              this.props.state.ConvManagers && this.props.state.ConvManagers[0]
              ? <ConversationManager
                  Employees={this.props.state.Employees}
                  Pages={this.props.state.Pages}
                  ConvManager={this.props.state.ConvManagers[0]}
                  cman_i={0}
                  Uploads={this.props.state.Uploads}
                  SReplies={this.props.state.SReplies}
                  readings={this.props.state.readings}
                  Tags={this.props.state.Tags}
                  me={this.props.state.me}
                />
              : null
            }
          </Col>
          <Col md={6}>
            {
              this.props.state.ConvManagers && this.props.state.ConvManagers[1]
              ? <ConversationManager
                  Employees={this.props.state.Employees}
                  Pages={this.props.state.Pages}
                  ConvManager={this.props.state.ConvManagers[1]}
                  cman_i={1}
                  Uploads={this.props.state.Uploads}
                  SReplies={this.props.state.SReplies}
                  readings={this.props.state.readings}
                  Tags={this.props.Tags}
                  me={this.props.state.me}
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

var socket = io({transports: ['polling'], upgrade: false, path: BASEDIR+'/socket.io'});
var connected = true;
socket.binaryType = 'arraybuffer'; 

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

socket.on('GET_ME', function (data) {
  console.log('ON GET_ME');
  console.log(data);
  rstore.dispatch({
    type:'GET_ME',
    me:data,
  });
  rerender();
});

socket.on('GET_EMPLOYEES', function (data) {
  console.log('ON GET_EMPLOYEES');
  console.log(data);
  rstore.dispatch({
    type:'GET_EMPLOYEES',
    Employees:data.Employees,
  });
  rerender();
});

socket.on('GET_TAGS', function (data) {
  console.log('ON GET_TAGS');
  console.log(data);
  rstore.dispatch({
    type:'GET_TAGS',
    Tags:data.FBXTags,
  });
  rerender();
});

socket.on('GET_LABELS', function (data) {
  console.log('ON GET_LABELS');
  console.log(data);
  rstore.dispatch({
    type:'GET_LABELS',
    pid:data.pid,
    FBLabels:data.data,
  });
  rerender();
});

socket.on('GET_READINGS', function (data) {
  console.log('ON GET_READINGS');
  console.log(data);
  rstore.dispatch({
    type:'GET_READINGS',
    readings:data
  });
  rerender();
});

socket.on('ADD_READING', function (data) {
  console.log('ON ADD_READING');
  console.log(data);
  rstore.dispatch({
    type:'ADD_READING',
    reading:data
  });
  rerender();
});
/*
socket.on('DELETE_READINGS', function (data) {
  console.log('ON DELETE_READINGS');
  console.log(data);
  rstore.dispatch({
    type:'DELETE_READINGS',
    id_employee:data.id_employee,
    socket_id:data.socket_id,
    t_mid:data.t_mid
  });
  rerender();
});
*/
socket.on('GET_CONVERSATIONS', function (data) {
  console.log('ON GET_CONVERSATIONS');
  console.log(data);
  if(!data.error){
    rstore.dispatch({
      type:'GET_CONVERSATIONS',
      pid:data.pid,
      Conversations:data.Conversations,
      filter:data.filter
    });
  }else{
    alert(data.message);
  }
  rstore.dispatch({type:'REMOVE_REQUEST_LOADING',req:'GET_CONVERSATIONS'});
  rerender();
});

socket.on('GET_MESSAGES', function (data) {
  console.log('ON');
  console.log(data);
  rstore.dispatch({
    type:'NEW_MESSAGE',
    pid:data.pid,
    t_mid:data.Messages[0].t_mid,
    Conversation:data.Conversation ? data.Conversation : undefined, 
    Messages:data.Messages
  });
  rerender();
});

socket.on('REFRESH_CONVERSATIONS', function (data) {
  console.log('ON');
  console.log(data);
  rstore.dispatch({
    type:'REFRESH_CONVERSATIONS',
    pid:data.pid,
    Conversations:data.Conversations
  });
  rerender();
});

socket.on('SYNC_LABELS', function (data) {
  console.log('ON SYNC_LABELS');
  console.log(data);
  rstore.dispatch({type:'REMOVE_REQUEST_LOADING',req:'SYNC_LABELS'});
  rerender();
});

socket.on('SYNC_CONVERSATIONS', function (data) {
  console.log('ON SYNC_CONVERSATIONS');
  console.log(data);
  rstore.dispatch({type:'REMOVE_REQUEST_LOADING',req:'SYNC_CONVERSATIONS'});
  rerender();
});

socket.on('NEW_MESSAGE', function (data) {
  if(true){//parseInt(data.pid,10) !== 1769068019987617
    console.log('ON NEW_MESSAGE');
    console.log(socket);
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
  }
});

socket.on('GET_SREPLIES', function (data) {
  console.log('ON GET_SREPLIES');
  console.log(data);
  rstore.dispatch({
    type:'GET_SREPLIES',
    pid:data.pid,
    SReplies:data.FBSReplies
  });
  rerender();
});

socket.on('ADD_FILES', function (data) {
  console.log('ON ADD_FILES');
  console.log(data);
  rstore.dispatch({
    type:'ADD_FILES',
    pid:data.pid,
    Uploads:data.FBUploads
  });
  rerender();
});

socket.on('DELETE_FILES', function (data) {
  console.log('ON DELETE_FILES');
  console.log(data);
  rstore.dispatch({
    type:'DELETE_FILES',
    pid:data.pid,
    attachment_ids:data.attachment_ids
  });
  rerender();
});

socket.on('ADD_SREPLY', function (data) {
  console.log('ON ADD_SREPLY');
  console.log(data);
  rstore.dispatch({
    type:'ADD_SREPLY',
    pid:data.pid,
    SReply:data.FBSReply
  });
  rerender();
});

socket.on('DELETE_SREPLIES', function (data) {
  console.log('ON DELETE_SREPLIES');
  console.log(data);
  rstore.dispatch({
    type:'DELETE_SREPLIES',
    pid:data.pid,
    sreply_ids:data.sreply_ids
  });
  rerender();
});

socket.on('DELETE_ENGAGES',function (data) {
  console.log('ON DELETE_ENGAGES');
  console.log(data);
  if(data.Conversations && data.Conversations.length>=1){
    var pids = rstore.getState().ConvManagers.map((x)=>(x.pid));
    pids.map((pid)=>{
      rstore.dispatch({
        type:'REFRESH_CONVERSATIONS',
        pid:pid,
        Conversations:data.Conversations
      });
    });
    rerender();
  }
});

socket.on('NO_DATA',function (data) {
  console.log('ON NO_DATA');
  console.log(data);
  alert(data.error+': '+data.message);
});

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
  console.log('ON');
  console.log(data);
  alert(data.message);
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

function addReading(t_mid){
  var id_employee = rstore.getState().me.id_employee;
  var readings = rstore.getState().readings;
  var reading_new = {id_employee:id_employee,socket_id:socket.id,t_mid:t_mid};
  /*
  var index = readings.findIndex((reading)=>{
    if( reading.id_employee === reading_new.id_employee && 
        reading.socket_id   === reading_new.socket_id   && 
        reading.t_mid       === reading_new.t_mid       )
    {
      return true;
    }
    return false;
  });
  console.log('$$$ addReading');
  console.log('index='+index);
  
  if(index === -1){
    socket.emit('ADD_READING',reading_new);
    rstore.dispatch({
      type:'ADD_READING',
      reading:reading_new
    });
    rerender();
  }
  */
  socket.emit('ADD_READING',reading_new);
  rstore.dispatch({
    type:'ADD_READING',
    reading:reading_new
  });
  rerender();

}
/*
function deleteReadings(t_mid){
  var id_employee = rstore.getState().me.id_employee;
  var reading = {id_employee:id_employee,t_mid:t_mid};
  rstore.dispatch({
    type:'DELETE_READINGS',
    id_employee:id_employee,
    socket_id:socket.id,
    t_mid:t_mid
  });
  rerender();
  socket.emit('DELETE_READINGS',reading);
}
*/
function addSReply(pid,title,message,attachment_id){
  var data = {
    pid:pid,
    title:title,
    message:message !== '' ? message : '',
    attachment_id:typeof attachment_id !== 'undefined' && attachment_id !== '' ? attachment_id : undefined
  }
  socket.emit('ADD_SREPLY',data);
  console.log('EMIT ADD_SREPLY');
  console.log(data);
}

function deleteSReplies(pid,sreply_ids){
  var data = {pid:pid,sreply_ids:sreply_ids};
  socket.emit('DELETE_SREPLIES',data);
  console.log('EMIT DELETE_SREPLIES');
  console.log(data);
}

function cleanInput(input) {
  return input;
}

// Sends a chat message
function sendMessage(pid,cman_i,t_mid,message,attachment_ids) {  
  var state = rstore.getState();  

  if(attachment_ids && attachment_ids.length >=1){
    var page_i = state.Pages.findIndex((x)=>(x.pid === pid));
    var Uploads = state.Pages[page_i].Uploads;

    Uploads = Uploads.filter((Upload,i)=>{
      if(attachment_ids.indexOf(Upload.attachment_id) !== -1){
        return true;
      }
      return false;
    });
    var filenames = Uploads.map((Upload)=>(Upload.filename));
    var url = window.location.protocol+'//'+window.location.hostname+BASEDIR+'/msg/media/'+filenames[0];

    var attachments = {
      data:[{
        id:null,
        attachment_id:null,
        created_at:null,
        updated_at:null,
        m_mid:null,
        mime_type:null,
        name:null,
        image_data:{
          url:url,
          preview_url:url
        },
        video_data:null,
        file_url:null,
        type:null,
        payload:null,
        size:null,
        sticker_id:null
      }]
    };
  }

  rstore.dispatch({
    type:'NEW_MESSAGE',
    pid:pid,
    t_mid:t_mid,
    Messages:[{
      from:{id:pid},
      to:{id:'uid'},
      created_time:moment().format('YYYY-MM-DD HH:mm:ss'),
      message: (message ? message : ''),
      attachments:(attachments ? attachments : undefined)
    }],
    is_tmp:true
  });
  rerender();

  if(connected){
    if (message || (attachment_ids && attachment_ids.length >= 1) ) {
      var data = {
        type:(attachment_ids && attachment_ids.length >= 1) ? 'image' : 'text',
        pid:pid,
        t_mid:t_mid,
        message:(message ? message : undefined),
        attachment_ids:(attachment_ids ? attachment_ids : undefined)
      };
      socket.emit('NEW_MESSAGE', data);

      console.log(data);
    }
  }

}

function sendReadReceipt(pid,t_mid){
  if (connected) {
    socket.emit('NEW_MESSAGE', { 
      type: 'read receipt',
      pid:pid,
      t_mid:t_mid
    });
  }
}

function engageConversation(pid,t_mid){
  if (connected) {
    var data = { 
      pid:pid,
      t_mid:t_mid
    };
    socket.emit('ENGAGE_CONVERSATION', data);
    console.log('EMIT ENGAGE_CONVERSATION')
    console.log(data);
  }
}

function deleteEngage(pid,t_mid,id_employee){
  if(connected){
    var data = {
      pid:pid,
      t_mid:t_mid,
      id_employee:id_employee
    }
    socket.emit('DELETE_ENGAGE',data);
    console.log('EMIT DELETE_ENGAGE')
    console.log(data);
  }
}

function deleteEngages(){
  if(connected){
    var id_employee = rstore.getState().me.id_employee;
    var data = {
      id_employee:id_employee
    }
    socket.emit('DELETE_ENGAGES',data);
    console.log('EMIT DELETE_ENGAGES')
    console.log(data);
  }
}

function getConversations(cman_i, more) {
  var state = rstore.getState();
  var pid = state.ConvManagers[cman_i].pid;
  var page_i = state.Pages.findIndex((x,i)=>(parseInt(x.pid,10) === parseInt(pid,10)));
  //var Page = state.Pages[page_i];
  var Conversations = state.ConvManagers[cman_i].Conversations.data;
  var filter = state.ConvManagers[cman_i].filter;

  if (connected) {
    var data = {pid:pid};

    if(typeof more === 'number'){
      data.before = Conversations[Conversations.length-1].updated_time;
      data.limit = 100 * more;
    }
    if(filter.inbox && filter.inbox !== 'INBOX'){
      data.inbox = filter.inbox;
    }
    if(filter.id_employee_engage_by){
      data.engage_by = filter.id_employee_engage_by;
    }
    if(filter.label_ids && filter.label_ids.length >=1){
      data.label_ids = filter.label_ids;
    }
    if(filter.name && filter.name != ""){
      data.name = filter.name;
    }
    if(filter.message && filter.message != ""){
      data.message = filter.message;
    }

    rstore.dispatch({type:'ADD_REQUEST_LOADING',req:'GET_CONVERSATIONS'});
    rerender();
    socket.emit('GET_CONVERSATIONS', data);
    console.log('EMIT')
    console.log(data);
  }
}

function getMessages(pid,t_mid,latest_only) {
  var latest_only = typeof latest_only !== 'undefined' ? latest_only : true;

  if (connected) {
    var data = {
      pid:pid,
      t_mid:t_mid,
      latest_only:latest_only
    };
    socket.emit('GET_MESSAGES',data);
    console.log('EMIT');
    console.log(data);
  }
}

function addFiles(pid,file_infos,file_buffers){
  //window.files = files;
  //window.file_buffers = file_buffers;
  socket.emit('ADD_FILES',{pid:pid,file_infos:file_infos,file_buffers:file_buffers});
}

function deleteFiles(pid,attachment_ids){
  socket.emit('DELETE_FILES',{pid:pid,attachment_ids:attachment_ids});
}

function refreshConversations(cman_i){
  var state = rstore.getState();
  var pid = state.ConvManagers[cman_i].pid;

  if(connected){
    var data = {pid:pid};
    socket.emit('REFRESH_CONVERSATIONS',data);
    console.log('EMIT REFRESH_CONVERSATIONS');
    console.log(data);
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

function syncLabels(pid){
  if (connected) {
    var data = { 
      pid:pid
    };
    rstore.dispatch({type:'ADD_REQUEST_LOADING',req:'SYNC_LABELS'});
    rerender();
    socket.emit('SYNC_LABELS', data);
    console.log('EMIT SYNC_LABELS');
    console.log(data);
  }
}

function syncConversations(pid,last_message_date=undefined){
  if (connected) {
    var data = { 
      pid:pid,
      last_message_date: ((typeof last_message_date !== 'undefined') ? last_message_date : moment().subtract(7,'d').format('YYYY-MM-DD'))
    };
    rstore.dispatch({type:'ADD_REQUEST_LOADING',req:'SYNC_CONVERSATIONS'});
    rerender();
    socket.emit('SYNC_CONVERSATIONS', data);
    console.log('EMIT SYNC_CONVERSATIONS');
    console.log(data);
  }
}

function mergeUploads(UploadsOld,UploadsLoaded){
  if(UploadsOld && UploadsOld instanceof Array){
    var Uploads = UploadsOld.slice(0,UploadsOld.length);
  }else{
    var Uploads = [];
  }

  UploadsLoaded.map((UploadLoaded,i)=>{
    var index = Uploads.findIndex((x,i)=>(x.upload_id === UploadLoaded.upload_id));
    if(index === -1){
      Uploads.push(UploadLoaded);
      console.log('Uploads pushed, length='+Uploads.length);
    }
  });
  return Uploads;
}

function mergeMessages(MessagesOld,MessagesLoaded,is_new=true){
  var Messages = MessagesOld.slice(0,MessagesOld.length);

  MessagesLoaded.map((Message,i)=>{
    var index = Messages.findIndex((x,i)=>(x.m_mid === Message.m_mid));
    if(index === -1){
      if(is_new === false){
        Messages.push(Message);
        //console.log('message pushed, length='+Messages.length);
      }else{
        Messages.unshift(Message);
        //console.log('message unshifted, length='+Messages.length);
      }
    }else{
      Messages[index] = Message;
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
        //console.log('conversation pushed, length='+Conversations.length);
        Conversations.push(Conversation);
      }else{
        //console.log('conversation unshifted, length='+Conversations.length);
        Conversations.unshift(Conversation);
      }
    }else{
      //console.log('conversation replaced, length='+Conversations.length);
      if(exclude_messages === false){
        Conversations[index] = Conversation;
      }else if(exclude_messages === true){
        var messages = Conversations[index].messages;
        Conversations[index] = Conversation;
        Conversations[index].messages = messages;
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

function filterConversations(Conversations,filter){
  if(filter.inbox && filter.inbox === 'UNREAD'){
    Conversations = Conversations.filter((Conversation,i)=>{
      //if( (Conversation.unread_count > 0 && !Conversation.messages) || (Conversation.unread_count > 0 && Conversation.messages && Conversation.messages.data.length>=1 && (Conversation.messages.data[0].uid_from !== Conversation.pid)) ){
      if(Conversation.customer_replied === 1 && Conversation.unread_count > 0){
        return true;
      }
      return false;
    });
  }

  if(filter.label_ids && filter.label_ids.length >=1){
    console.log(filter.label_ids);
    Conversations = Conversations.filter((Conversation,i)=>{
      if(Conversation.FBLabels && Conversation.FBLabels.length>=1){
        var full_match = true;
        filter.label_ids.map((label_id,j)=>{
          var index = Conversation.FBLabels.findIndex((FBLabel,k)=>(parseInt(FBLabel.label_id,10) === parseInt(label_id,10)));
          if(index === -1){
            full_match = false;
          }
        });
        return full_match;
      }else{
        return false;
      }
    });
  }
  /*
  if(filter.id_employee_engage_by){
    console.log(filter.id_employee_engage_by);
    Conversations = Conversations.filter((Conversation,i)=>{
      if(Conversation.engage_by && Conversation.engage_time){
        if(Conversation.engage_by === filter.id_employee_engage_by){
          return true;
        }
      }
      return false;
    });
  }
  */
  console.log(filter);
  if(filter.id_employee_engage_by){
    console.log(filter.id_employee_engage_by);
    Conversations = Conversations.filter((Conversation,i)=>{
      if( Conversation.engage_by 
          && (Conversation.engage_by === filter.id_employee_engage_by) 
          && ( moment().diff(moment(Conversation.engage_time),'seconds') <= 3600 ) 
          && (Conversation.engage_release !== 1) )
      {
        return true;
      }
      if(Conversation.replied_last_by && (Conversation.replied_last_by === filter.id_employee_engage_by) ){
        return true;
      }
      return false;
    });
  }

  if(filter.name && filter.name !== ""){
    Conversations = Conversations.filter((Conversation,i)=>{
      if(Conversation.name && (Conversation.name.toLowerCase().indexOf( filter.name.toLowerCase()) ) !== -1 ){
        return true;
      }
      return false;
    });
  }

  if(filter.message && filter.message !== "" && filter.message_t_mids && filter.message_t_mids.length>=1){
    Conversations = Conversations.filter((Conversation,i)=>{
      if(filter.message_t_mids.indexOf(Conversation.t_mid) !== -1){
        return true;
      }
      return false;
    });
  }

  return Conversations;
}

function getEmployeeFirstname(id_employee){
  return rstore.getState().employee_firstnames[''+id_employee];
}


window.rerender  = rerender;
window.moment = moment;
window.rstore = rstore;
window.Immutable = Immutable;
(()=>{
  socket.emit('GET_EMPLOYEES',{});
  socket.emit('GET_READINGS',{});
  socket.emit('GET_TAGS',{});

  var pids = rstore.getState().Pages.map((Page)=>(Page.pid));
  pids.map((pid,i)=>{
    getConversations(i);
    socket.emit('GET_LABELS', {pid:pid});
    socket.emit('GET_UPLOADS',{pid:pid});
    socket.emit('GET_SREPLIES',{pid:pid});
  });
})()
