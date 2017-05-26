import {settings} from '../settings';
import React, {Component} from 'react';
import {render} from 'react-dom';
import { createStore } from 'redux';
import { Grid, Row, Col, Button, FormControl } from 'react-bootstrap';
import moment from 'moment';
import { syDateFormat } from './Utils/Helper';
import qs from 'qs';
import Promise from 'bluebird';
import Immutable from 'seamless-immutable';
window.Immutable = Immutable;
import {randomString} from './Utils/Helper';

const greyborder = {backgroundColor:'#fff',margin:"3px 0px 3px 0px",border:"1px solid #bbb",padding:"5px 10px 5px 10px",borderRadius:"3px"};
const blueborder = {backgroundColor:'aliceblue',margin:"3px 0px 3px 50px",border:"1px solid darkturquoise",padding:"5px 10px 5px 10px",borderRadius:"3px"};
const greenborderbottom = {
    borderWidth: '1px',
    borderColor: 'darkturquoise',
    borderStyle: 'solid none none none',
    backgroundColor: '#fefefe'
};
const boldfont = {fontWeight:'bold'};

const message_from_self = {textAlign:'right'};
const message_from_other = {textAlign:'left'};

const FACEBOOK_URL = settings.fb.base_url;
const GRAPH_API_URL = settings.fb.graph_api_url;

window.fbAsyncInit = function() {
  FB.init({
    appId      : settings.fb.app_id,
    xfbml      : false,
    version    : 'v2.8'
  });
  FB.AppEvents.logPageView();
  };

(function(d, s, id){
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) {return;}
  js = d.createElement(s); js.id = id;
  js.src = "//connect.facebook.net/en_US/sdk.js";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

var initial_state = Immutable({Pages:[]});

var reducer = function(state,action=null){

  switch(action.type){
    case 'PAGES_CREATE_RS':
      console.log(action);
      var Pages = state.Pages;
      var PagesLoaded = action.pages ? action.pages.data : undefined;
      if(Pages && Pages.length >= 1){
        PagesLoaded.map((PageLoaded,i)=>{
          state = Immutable.setIn(state,['Pages',i,'access_token'],PageLoaded.access_token);
        });
      }else{
        state = Immutable.setIn(state,['Pages'],PagesLoaded);
      }
      break;

    case 'GET_FB_PAGE_POSTS':
      console.log(action);
      action.Posts.map((Post,i)=>{
        if(typeof action.Posts[i].stats === 'undefined'){
          action.Posts[i].stats = {
            ADD_REFRESH:0,
            ADD_PM:0,
            ADD_COMMENT:0,
            ADD_LABEL:0,
            ADD_HIDDEN:0,
            ADD_SHOWN:0
          };
        }
      })
      state = Immutable.setIn(state,['Posts'],action.Posts);
      break;

    case 'GET_FB_POSTS_COMMENTS':
      console.log(action);
      var commentss = action.comments;
      commentss.map((comments,i)=>{
        if(typeof state.Posts[i].first_comments === 'undefined'){ // FIRST LOAD
          state = Immutable.setIn(state,['Posts',i,'first_comments'],comments);
          state = Immutable.setIn(state,['Posts',i,'comments'],comments);
        }else{
          state = Immutable.setIn(state,['Posts',i,'comments'],comments);
        }
      });
      break;

    case 'RECORD_STATISTICS':
      console.log(action);
      var post_id = action.post_id;
      var post_i = state.Posts.findIndex((Post)=>(Post.id === post_id));
      var Post = state.Posts[post_i];
      //console.log(Post);
      var count = Post.stats[action.stat_type] + 1;
      //console.log(action.stat_type);
      //console.log(count);
      //console.log(post_i);
      
      //state = Immutable.setIn(state,['Posts',post_i,'stats','ADD_REFRESH'],100);
      state = Immutable.setIn(state,['Posts',post_i,'stats',action.stat_type],count);
      //console.log('$$$ IT DOES NOT FINISH SET STATE');
      /*
      switch(action.stat_type){
        case 'ADD_REFRESH':
          state = Immutable.setIn(state,['Posts',post_i,'stats','ADD_REFRESH'],count);
          break;
        case 'ADD_PM':
          state = Immutable.setIn(state,['Posts',post_i,'stats','ADD_PM'],count);
          break;
        case 'ADD_COMMENT':
          state = Immutable.setIn(state,['Posts',post_i,'stats','ADD_COMMENT'],count);
          break;
        case 'ADD_LABEL':
          state = Immutable.setIn(state,['Posts',post_i,'stats','ADD_LABEL'],count);
          break;
        case 'ADD_HIDDEN':
          state = Immutable.setIn(state,['Posts',post_i,'stats','ADD_HIDDEN'],count);
          break;
        case 'ADD_SHOWN':
          state = Immutable.setIn(state,['Posts',post_i,'stats','ADD_SHOWN'],count);
          break;
        default:
          break;
      }
      */
      break;
      
    case 'PAGE_LABELS_CREATE_RESPONSE_SUCCESS':
      state.Pages.data[action.page_index].Labels = action.response;
      break;

    case 'LABEL_SELECT':
      if(action.chosen_label_index !== -1){
        state.Pages.data[action.page_index].chosen_label_index = action.chosen_label_index;
      }else{
        state.Pages.data[action.page_index].chosen_label_index = null;
      }
      break;  

    case 'POST_COMMENTS_LOAD_MORE_RESPONSE_SUCCESS':
    case 'POST_COMMENTS_REFRESH_RESPONSE_SUCCESS':

      if( state.Pages.data[action.page_index].Posts.data[action.post_index].Comments && 
          state.Pages.data[action.page_index].Posts.data[action.post_index].Comments.data.length>0 &&
          action.type == 'POST_COMMENTS_LOAD_MORE_RESPONSE_SUCCESS')
      {
        state.Pages.data[action.page_index].Posts.data[action.post_index].Comments.data = state.Pages.data[action.page_index].Posts.data[action.post_index].Comments.data.concat(action.response.data);
        state.Pages.data[action.page_index].Posts.data[action.post_index].Comments.paging = action.response.paging;
      }else{
        state.Pages.data[action.page_index].Posts.data[action.post_index].Comments = action.response;
      }

      var Post = state.Pages.data[action.page_index].Posts.data[action.post_index];
      var Comments = state.Pages.data[action.page_index].Posts.data[action.post_index].Comments.data;
      Post.comment_count_not_yet_pm = 0;
      Post.comment_last_refresh_time = moment();
      Comments.map((Comment,index)=>{
        Comment.can_reply_privately ? Post.comment_count_not_yet_pm += 1 : null;
      });
      break;

    case 'PRIVATE_REPLY_BULK_REPLACE':
      if( state.Pages.data[action.page_index].Posts.data[action.post_index].Comments && 
          state.Pages.data[action.page_index].Posts.data[action.post_index].Comments.data.length>0){
        var Comments = state.Pages.data[action.page_index].Posts.data[action.post_index].Comments.data;
        Comments.map((Comment,index)=>{
          Comment.private_reply = action.private_reply;
        });
      }
      break;

    case 'COMMENT_REPLY_BULK_REPLACE':
      if( state.Pages.data[action.page_index].Posts.data[action.post_index].Comments && 
          state.Pages.data[action.page_index].Posts.data[action.post_index].Comments.data.length>0){
        var Comments = state.Pages.data[action.page_index].Posts.data[action.post_index].Comments.data;
        Comments.map((Comment,index)=>{
          Comment.comment_reply = action.comment_reply;
        });
      }
      break;

    case 'PRIVATE_REPLY_CHANGE':
      state.Pages.data[action.page_index].Posts.data[action.post_index].Comments.data[action.comment_index].private_reply = action.private_reply;
      break;

    case 'COMMENT_REPLY_CHANGE':
      state.Pages.data[action.page_index].Posts.data[action.post_index].Comments.data[action.comment_index].comment_reply = action.comment_reply;
      break;

    case 'PRIVATE_REPLY_SUBMIT':
      var pa_i = action.page_index;
      var po_i = action.post_index;
      var c_i = action.comment_index;
      var page_id = state.Pages.data[pa_i].id;
      var post_id = state.Pages.data[pa_i].Posts.data[po_i].id;
      var comment_id = state.Pages.data[pa_i].Posts.data[po_i].Comments.data[c_i].id;
      
      var page_access_token = state.Pages.data[pa_i].access_token;
      var private_reply = action.private_reply;

      if(private_reply.length >= 2){
        FB.api(
          '/'+comment_id+'/private_replies?access_token='+page_access_token+'&message='+private_reply,
          'POST',
          function(response){
            console.log(response);
            if(response.id){
              var m_mid = response.id;

              function json(response) {//json
                return response.json()  
              }

              function getTMIDByCommentId(PAGE_ACCESS_TOKEN,comment_id){
                return fetch('https://graph.facebook.com/v2.8/'+comment_id+'?access_token='+PAGE_ACCESS_TOKEN+'&fields=private_reply_conversation',{
                  method:'GET',
                  headers:{"Content-Type": "application/x-www-form-urlencoded"}
                }).then(status)
                .then(json);
              }//testtest

              function sendPrivateReplyDetailToServer(pid,t_mid,m_mid,comment_id){
                return fetch(settings.base_dir+'/msg/pm?pid='+pid+'&t_mid='+t_mid+'&m_mid='+m_mid+'&comment_id='+comment_id,{
                  method:'POST',
                  headers:{"Content-Type": "application/x-www-form-urlencoded"}
                }).then(status)
                .then(json);
              }

              getTMIDByCommentId(page_access_token,comment_id)
              .then(function(response){
                if(response.private_reply_conversation){
                  var t_mid = response.private_reply_conversation.id;
                  return sendPrivateReplyDetailToServer(page_id,t_mid,m_mid,comment_id);
                }else{
                  alert('ERROR in getTMIDByCommentId');
                }
              }).then(function(response){
                console.log(response);
              });

              rstore.dispatch({
                type:'PRIVATE_REPLY_SUBMIT_RESPONSE_SUCCESS',
                page_index:pa_i,
                post_index:po_i,
                comment_index:c_i,
                page_id:page_id,
                private_reply:private_reply
              });
              rerender();
            }else if(response.error && response.error.code === 190 && response.error.error_subcode === 463){
              gsetUserLoginAndPage();
            }else if(response.error){
              alert(response.error.message);
              sy.error_log.push(response);
            }else{
              sy.error_log.push(response);
            }
        });
      }else{
        alert('Please input a longer message before sending...');
      }
      break;

    case 'PRIVATE_REPLY_SUBMIT_RESPONSE_SUCCESS':
      state.Pages.data[action.page_index].Posts.data[action.post_index].Comments.data[action.comment_index].can_reply_privately = false;
      state.Pages.data[action.page_index].Posts.data[action.post_index].Comments.data[action.comment_index].Conversation = {data:[{message:action.private_reply,from:{id:action.page_id}}]};
      break;

    case 'COMMENT_REPLY_SUBMIT_RESPONSE_SUCCESS':
      state.Pages.data[action.page_index].Posts.data[action.post_index].Comments.data[action.comment_index].comment_count += 1;
      break;

    case 'COMMENT_TOGGLE_RESPONSE_SUCCESS':
      state.Pages.data[action.page_index].Posts.data[action.post_index].Comments.data[action.comment_index].is_hidden = action.is_hidden;
      break;

    case 'COMMENT_GET_COMMENT_REPLY':
      var pa_i = action.page_index;
      var po_i = action.post_index;
      var c_i = action.comment_index;
      var comment_id = state.Pages.data[pa_i].Posts.data[po_i].Comments.data[c_i].id;
      var page_access_token = state.Pages.data[pa_i].access_token;
      FB.api(
        '/'+comment_id+'/comments?access_token='+page_access_token+'&fields=message',
        'GET',
        function(response){
          if(response.data && response.data.length >= 0){
            rstore.dispatch({
              type:'COMMENT_GET_COMMENT_REPLY_RESPONSE_SUCCESS',
              page_index:pa_i,
              post_index:po_i,
              comment_index:c_i,
              response:response
            });
            rerender();
          }else if(response.error && response.error.code === 190 && response.error.error_subcode === 463){
            gsetUserLoginAndPage();
          }else if(response.error){
            alert(response.error.message);
            sy.error_log.push(response);
          }else{
            sy.error_log.push(response);
          }
      });
      break;

    case 'COMMENT_GET_COMMENT_REPLY_RESPONSE_SUCCESS':
      state.Pages.data[action.page_index].Posts.data[action.post_index].Comments.data[action.comment_index].Comments = action.response;
      break;

    case 'GET_CONVERSATION_MESSAGES':
      var pa_i = action.page_index;
      var po_i = action.post_index;
      var c_i = action.comment_index;
      var conversation_id = state.Pages.data[pa_i].Posts.data[po_i].Comments.data[c_i].private_reply_conversation.id;
      var page_access_token = state.Pages.data[pa_i].access_token;
      FB.api(
        '/'+conversation_id+'/messages?access_token='+page_access_token+'&fields=message,to,from,created_time',
        'GET',
        function(response){
          if(response.data && response.data.length >= 0){
            rstore.dispatch({
              type:'GET_CONVERSATION_MESSAGES_RESPONSE_SUCCESS',
              page_index:pa_i,
              post_index:po_i,
              comment_index:c_i,
              response:response
            });
            rerender();
          }else if(response.error && response.error.code === 190 && response.error.error_subcode === 463){
            gsetUserLoginAndPage();
          }else if(response.error){
            alert(response.error.message);
            sy.error_log.push(response);
          }else{
            sy.error_log.push(response);
          }
      });
      break;

    case 'GET_CONVERSATION_MESSAGES_RESPONSE_SUCCESS':
      state.Pages.data[action.page_index].Posts.data[action.post_index].Comments.data[action.comment_index].Conversation = action.response;
      break;

    case 'MESSAGE_SEND':
      var pa_i = action.page_index;
      var po_i = action.post_index;
      var c_i = action.comment_index;
      var conversation_id = state.Pages.data[pa_i].Posts.data[po_i].Comments.data[c_i].private_reply_conversation.id;
      var page_access_token = state.Pages.data[pa_i].access_token;
      FB.api(
        '/'+conversation_id+'/messages?access_token='+page_access_token+'&message='+action.message+'&fields=created_time,from,message',
        'POST',
        function(response){
          if(response.id){
            rstore.dispatch({
              type:'GET_CONVERSATION_MESSAGES',
              page_index:pa_i,
              post_index:po_i,
              comment_index:c_i,
              conversation_id:conversation_id
            });
            rerender();
          }else if(response.error && response.error.code === 190 && response.error.error_subcode === 463){
            gsetUserLoginAndPage();
          }else if(response.error){
            alert(response.error.message);
            sy.error_log.push(response);
          }else{
            sy.error_log.push(response);
          }
      });
      break;

    case 'MESSAGE_SEND_RESPONSE_SUCCESS':
      break;

    case 'AUTO_REFRESH_STRING_CHANGE':
      state.auto_refresh_string = action.auto_refresh_string;
      break;

    case 'AUTO_REFRESH_QUEUE_SHIFT':
      state.auto_refresh_queue.shift();
      break;

    case 'AUTO_REFRESH_TOGGLE':
      state.auto_refresh_is_on = !state.auto_refresh_is_on;
      break;

    case 'AUTO_REFRESH_QUEUE_INIT':
      state.auto_refresh_queue = [];
      var repeat = state.auto_refresh_repeat;
      Array(repeat).fill().map((x,i)=>{
        state.auto_refresh_queue = state.auto_refresh_queue.concat(state.auto_refresh_list);
      })
      break;

    case 'AUTO_REFRESH_REPEAT_CHANGE':
      state.auto_refresh_repeat = action.auto_refresh_repeat;
      break;

    case 'AUTO_REFRESH_INTERVAL_CHANGE':
      state.auto_refresh_interval = action.auto_refresh_interval;
      break;

    case 'GET_COMMENT_COUNTS_RESPONSE_SUCCESS':
      state.CommentCounts = action.CommentCounts;
      break;

    case 'GET_COMMENT_COUNTS_V2_RESPONSE_SUCCESS':
      var page_index = action.page_index;
      var post_index = action.post_index;
      var Post = state.Pages.data[page_index].Posts.data[post_index];
      var post_id = Post.id;
      var page_id = Post.id.split('_')[0];
      Post.CommentCounts = action.CommentCounts;
      break;

    default:
      break;
  }

  return state;
}

window.rstore = createStore(reducer,initial_state);

var sy = {
  scopesNeeded:{
    scope:'read_page_mailboxes,manage_pages,publish_pages,pages_show_list',//pages_messaging,pages_messaging_subscriptions
  },
  error_log:[],
};

window.sy = sy;

class AutoPMApp extends Component{
  constructor(props,context) {
    super(props,context);
  }

  render(){
    return(
      <section>
        <Row>
        <Col md={2}>
          <AutoPMSetup />
        </Col>
        <Col md={8}>
          <AutoPMStats Posts={this.props.state.Posts}/>
        </Col>
        </Row>
      </section>
    );
  }
}

class AutoPMSetup extends Component{
  constructor(props,context) {
    super(props,context);
    this.state = {config:props.config,started:false,last_refresh_time:undefined};
    this.started = false;
    this.autobot_started = false;
  }

  handleConfigChange = (event) => {
    this.setState({config:event.target.value});
  }

  handleStart = (event) => {
    this.setState({started:!this.state.started});
    this.started = !this.started;
    if(this.started === true && this.autobot_started === false){
      this.state.parsed_config = this.parseConfig(this.state.config);
    }
  }

  parseConfig = (input) =>{
    var that = this;
    console.log(input);
    var config = configFillDefaults(JSON.parse(input));
    var post_configs = postConfigFillDefaults(config.post_configs,config.default_config);
    var post_ids = post_configs.map((post_config)=>(post_config.post_id));
    var pid;
    var page_i;
    var PAGE_ACCESS_TOKEN;

    console.log('post_configs');
    console.log(post_configs);

    function loopGetCommentsDoJob(PAGE_ACCESS_TOKEN,timings,post_configs){
      return getCommentsAndDoJob(PAGE_ACCESS_TOKEN,timings,post_configs)
      .then(function(comments){
        that.setState({last_refresh_time:moment().format('YYYY-MM-DD HH:mm:ss')});
        rstore.dispatch({
          type:'GET_FB_POSTS_COMMENTS',
          comments: comments
        });
        rerender();
      }).then(function(success){
        return setDelay(config.timings.scanning_interval);
      }).then(function(success){
        if(that.started){
          return loopGetCommentsDoJob(PAGE_ACCESS_TOKEN,timings,post_configs);
        }else if(that.started === false){
          that.autobot_started = false;
          return true;
        }
      });
    }

    that.autobot_started = true;
    gsetUserLoginAndPage()
    .then(function(success){
      pid = post_configs[0].post_id.split('_')[0];
      page_i = rstore.getState().Pages.findIndex((Page)=>(Page.id === pid));
      PAGE_ACCESS_TOKEN = rstore.getState().Pages[page_i].access_token;

      return getFBPosts(PAGE_ACCESS_TOKEN,post_ids)
    }).then(function(responses){
      console.log('getFBPosts');
      console.log(responses);
      rstore.dispatch({
        type:'GET_FB_PAGE_POSTS',
        Posts: responses
      });
      rerender();
      return loopGetCommentsDoJob(PAGE_ACCESS_TOKEN,config.timings,post_configs);
    }).then(function(success){
      console.log('STOPPED AUTO REPLYING');
    })
  }

  handleFBLogin = (event) => {
    gsetUserLoginAndPage();
    rerender();
  }

  handleFBLogout = (event) => {
    FB.logout();
    rerender();
  }

  render(){
    return(
      <section style={{position:'fixed',top:'0px',backgroundColor:'#fff',margin:"3px 0px 3px 0px",border:"1px solid #bbb",padding:"5px 10px 5px 10px",borderRadius:"3px",overflowY:'auto',zIndex:'1'}}>
        {
          sy.is_login_fb 
          ? <button onClick={this.handleFBLogout} className="btn btn-primary">{'Logout Facebook'}</button>
          : <button onClick={this.handleFBLogin} className="btn btn-primary">{'Login Facebook'}</button>
        }
        <div><span>CONFIG:</span><textarea className="form-control" value={this.state.config ? this.state.config : ''} onChange={this.handleConfigChange}/></div>
        <button className="btn btn-primary" onClick={this.handleStart}>{this.state.started ? 'STOP' : 'START'}</button>
        <h4>{this.state.last_refresh_time ? 'REFRESH AT:'+moment(this.state.last_refresh_time).format('HH:mm:ss') : null}</h4>
      </section>
    );
  }
}

class AutoPMStats extends Component{
  constructor(props) {
    super(props);
  }

  render(){
    return(
      <section>
        {this.props.Posts && this.props.Posts.length
          ? this.props.Posts.map((Post,i)=>{
              var StatsDisplay = 
                <span>
                  <span>{( i+1+') '+Post.message.substring(0,20) )}</span>
                  {Post.stats.ADD_PM > 0 ? <span className="label label-success">{'pm:'+Post.stats.ADD_PM}</span> : null}
                  {Post.stats.ADD_COMMENT > 0 ? <span className="label label-info">{'comment:'+Post.stats.ADD_COMMENT}</span> : null}
                  {Post.stats.ADD_LABEL > 0 ? <span className="label label-danger">{'label:'+Post.stats.ADD_LABEL}</span> : null}
                  {Post.stats.ADD_HIDDEN > 0 ? <span className="label label-default">{'hidden:'+Post.stats.ADD_HIDDEN}</span> : null}
                  {Post.stats.ADD_SHOWN > 0 ? <span className="label label-default">{'shown:'+Post.stats.ADD_SHOWN}</span> : null}
                </span>;
              return <Accordion 
                key={'Accordion_'+Post.id}
                title={ Post.message 
                          ? StatsDisplay
                          : null
                      }
                collapsed={false}
              >
                <PostCard Post={Post}/>
              </Accordion>
            })
          : null
        }
      </section>
    );
  }
}

class PostCard extends Component{
  constructor(props) {
    super(props);
  }

  render(){
    return(
      <section className="PostCard">
        <a href={FACEBOOK_URL+this.props.Post.id.split('_')[0]+'/posts/'+this.props.Post.id.split('_')[1]} target="_blank">POST</a>
        <span className="post_created_time">{' '+moment.utc(this.props.Post.created_time).utcOffset(8).format('YYYY-MM-DD HH:mm')}</span>
        <div className="post_id">{this.props.Post.id}</div>
        {this.props.Post.message ? <div name="message">{this.props.Post.message.substring(0,20)}</div> : null}
        {this.props.Post.story ? <div name="story">{this.props.Post.story.substring(0,20)}</div> : null}
        <table className="table">
          <thead>
            <tr>
              <th style={{width:'80px'}}>#</th>
              <th style={{width:'200px'}}>Time</th>
              <th style={{width:'200px'}}>Name</th>
              <th style={{width:'100px'}}>Hidden</th>
              <th>Message</th>
              <th style={{width:'80px'}}>Replies</th>
              <th style={{width:'120px'}}>Conversation</th>
            </tr>
          </thead>
          <tbody>
          {this.props.Post.comments && this.props.Post.comments.data.length>=1 
            ? this.props.Post.comments.data.map((Comment,i)=>(
                <CommentRow key={'CommentRow_'+Comment.id} Comment={Comment} ci={i}/>
              ))
            : null
          }
          </tbody>
        </table>
      </section>
    );
  }
}

class CommentRow extends Component{
  constructor(props) {
    super(props);
  }

  render(){
    return(
      <tr className="CommentRow">
        <td>{this.props.ci+1+') '}</td>
        <td>{moment(this.props.Comment.created_time).utcOffset(8).format('YYYY-MM-DD HH:mm:ss')}</td>
        <td>{this.props.Comment.from.name}</td>
        <td>{<span className={'label label-default'+(this.props.Comment.is_hidden ? '' : ' label-border-white')}>{this.props.Comment.is_hidden ? 'hidden' : 'shown'}</span>}</td>
        <td>{this.props.Comment.message}</td>
        <td>{this.props.Comment.comment_count}</td>
        <td>
            {this.props.Comment.private_reply_conversation 
              ? <a href={'https://www.facebook.com'+this.props.Comment.private_reply_conversation.link}>Conversation</a> 
              : <span className={'label label-default'+(this.props.Comment.can_reply_privately ? ' label-border-white' : '')}>{this.props.Comment.can_reply_privately ? 'NOT PM-ed' : 'X'}</span>
            }
        </td>
      </tr>
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
            <a  role="button" 
                data-toggle="collapse" 
                data-parent="#accordion" 
                href={"#"+this.state.unique_key} 
                aria-controls={this.state.unique_key}
                aria-expanded={this.props.collapsed ? false : true} 
            >
              {this.props.title}
            </a>
          </h4>
        </div>
        <div  id={this.state.unique_key} 
              className={"panel-collapse collapse"+(this.props.collapsed ? ' in' : '')} 
              role="tabpanel" 
              aria-labelledby="headingOne"
        >
          <div className="panel-body">
            {this.props.children}
          </div>
        </div>
      </div>
    );
  }
}

class PostsCommentsHistory extends Component{
  constructor(props) {
    super(props);
  }

  render(){
    return(
      
    );
  }
}


var rerender = function(){
  render(<AutoPMApp state={rstore.getState()} />, document.getElementById('app'));
}

window.rerender = rerender;
rerender();

/* Facebook Related Functions */

function getFBLogin (scopes) {
  return new Promise(function(resolve,reject){
    FB.login(function(response){
      resolve(response);
    },scopes);
  });
}

function getFBUserLogin(){ /* FB.getLoginStatus, getFBLogin, sy.scopesNeeded */
  var scopes = sy.scopesNeeded;
  return new Promise(function(resolve,reject){
    FB.getLoginStatus(function(response){
      resolve(response);
    },true);
  }).then(function(response){
    if (response.status === 'connected') {
      return response;
    } else if (response.status === 'not_authorized') {
      return getFBLogin(scopes);
    } else {
      return getFBLogin(scopes);
    }
  }).then(function(response){
    return response;
  });
}

function setFBUserLogin (response) { /* sy, getFBPages, setFBPages*/
  sy.is_login_fb = true;
  var uid = response.authResponse.userID;
  var accessToken = response.authResponse.accessToken;
  sy.uid = uid;
  sy.userAccessToken = accessToken;
  return true;
}

function getFBPages(){ /* sy.userAccessToken */
  var USER_ACCESS_TOKEN = sy.userAccessToken;
  return fetch(GRAPH_API_URL+'/me/accounts?access_token='+USER_ACCESS_TOKEN,{
    method: 'GET',
    headers:{"Content-Type": "application/x-www-form-urlencoded"}
  }).then((res)=>(res.json()))
  .then(function(response){
    if(response.error){
      if(response.error.code === 190 && response.error.error_subcode === 463){
        throw new Error('ErrorFacebookTokenExpired');
      }else{
        throw new Error(JSON.stringify(response));
      } 
    }
    return response;
  });
}

function setFBPages(response){/* rstore, rerender */
  rstore.dispatch({
    type:'PAGES_CREATE_RS',
    pages:response
  });
  rerender();
  return true;
}

function gsetUserLoginAndPage(){
  return getFBUserLogin()
  .then(setFBUserLogin)
  .then(getFBPages)
  .then(setFBPages);
}

function getFBPagePosts(PAGE_ACCESS_TOKEN){
  var uri = GRAPH_API_URL+'/me/posts';
  var qparams = {
    limit:100
  }
  return fbRequestIterator(PAGE_ACCESS_TOKEN,uri,qparams,{max_rows:undefined})
  .then(function(response){
    return response;
  });
}

function getFBPosts(PAGE_ACCESS_TOKEN,post_ids){
  var batch = [];
  var qparams = {
    fields:'id,created_time,message,story'
  }
  post_ids.map((post_id,i)=>{
    var uri = post_id;
    batch[i] = {method:'GET',relative_url:uri+'?'+qs.stringify(qparams)};
  });

  return fbAPIRequestBatcher(PAGE_ACCESS_TOKEN,batch)
  .then(function(responses){
    return responses;
  });
}

function getFBPostsComments(PAGE_ACCESS_TOKEN,post_ids){
  var batch = [];

  var qparams = {
    limit:25,
    order:'reverse_chronological',
    fields:'id,message,from,created_time,can_reply_privately,private_reply_conversation,can_like,can_hide,comment_count,attachment,is_hidden,is_private'
  }

  post_ids.map((post_id,i)=>{
    var uri = post_id+'/comments';
    batch[i] = {method:'GET',relative_url:uri+'?'+qs.stringify(qparams)};
  });

  return fbAPIRequestBatcher(PAGE_ACCESS_TOKEN,batch)
  .then(function(responses){
    return responses;
  });
}

function getFBPageLabels(PAGE_ACCESS_TOKEN){
  var uri = GRAPH_API_URL+'/me/labels';
  var qparams = {
    limit:100
  }
  return fbRequestIterator(PAGE_ACCESS_TOKEN,uri,qparams,{max_rows:undefined})
  .then(function(response){
    return response;
  });
}

function postCommentVisibilities(PAGE_ACCESS_TOKEN,comment_ids,do_hides){
  //'/'+Comment.id+'?access_token='+page_access_token+'&is_hidden='+hide,
  var batch = [];
  comment_ids.map((comment_id,i)=>{
    var relative_url = comment_id+'?'+qs.stringify({is_hidden:do_hides[i]});
    batch.push({method:'POST',relative_url:relative_url});
    return comment_ids;
  });

  return fbAPIRequestBatcher(PAGE_ACCESS_TOKEN,batch)
  .then(function(responses){
    return responses;
  });
}

function postPrivateReplies(PAGE_ACCESS_TOKEN,comment_ids,messages,interval){
  //'/'+comment_id+'/private_replies?access_token='+page_access_token+'&message='+private_reply,
  var batch = [];
  comment_ids.map((comment_id,i)=>{
    var uri = comment_id+'/private_replies';
    batch[i] = {method:'POST',relative_url:uri+'?'+qs.stringify({message:messages[i]})};
  });

  return fbAPIRequestSerialBatcher(PAGE_ACCESS_TOKEN,batch)
  .then(function(responses){
    return responses;
  });
}

function postCommentComments(PAGE_ACCESS_TOKEN,comment_ids,messages,interval){
  //'/'+comment_id+'/comments?access_token='+page_access_token+'&message='+comment_reply,
  var batch = [];
  comment_ids.map((comment_id,i)=>{
    var uri = comment_id+'/comments';
    batch[i] = {method:'POST',relative_url:uri+'?'+qs.stringify({message:messages[i]})};
  });

  return fbAPIRequestSerialBatcher(PAGE_ACCESS_TOKEN,batch)
  .then(function(responses){
    return responses;
  });
}

function postFBLabels(PAGE_ACCESS_TOKEN,label_ids,user_ids){
  //'/'+label_id+'/users?access_token='+page_access_token+'&user_ids=['+uid+']',
  var batch = [];
  label_ids.map((label_id,i)=>{
    var uri = label_id+'/users';
    batch[i] = {method:'POST',relative_url:uri+'?'+qs.stringify({user_ids:'['+user_ids[i]+']'})};
  });

  return fbAPIRequestBatcher(PAGE_ACCESS_TOKEN,batch)
  .then(function(responses){
    return responses;
  });
}


/*
function getFBCommentsComments(PAGE_ACCESS_TOKEN){
  '/'+comment_id+'/comments?access_token='+page_access_token+'&fields=message',
}

function getFBConversationMessages(PAGE_ACCESS_TOKEN){
  '/'+conversation_id+'/messages?access_token='+page_access_token+'&fields=message,to,from,created_time',
}
*/

function fbRequestIterator(PAGE_ACCESS_TOKEN,uri,qparams,options={}){
  var limit = typeof qparams.limit === 'undefined' ? 25 
              : typeof qparams.limit === 'number' ? qparams.limit 
                : console.log('ERROR: wrong input parameters');
  var max_rows = typeof options.max_rows === 'undefined' ? limit-1 : options.max_rows;
  var matchFunc = typeof options.matchFunc === 'undefined' ? (x,i)=>(false) : options.matchFunc;
  qparams.access_token = PAGE_ACCESS_TOKEN;

  var data = [];
  return reqWhile().then(function(r){
    return data;
  }).catch(function(err){
    throw err;
  });

  function reqWhile (){
    return fetch(uri+(qparams ? '?'+qs.stringify(qparams) : ''),{
      method: 'GET',
      headers:{"Content-Type": "application/x-www-form-urlencoded"}
    }).then(function(res){
      return res.json();
    }).then(function(response){
      if(response.error){
        if(response.error.code === 190 /*&& response.error.error_subcode === 463*/){
          throw new Error('ErrorFacebookTokenExpired');
        }else{
          throw new Error(JSON.stringify(response));
        } 
      }

      if(response && response.data){
        data = data.concat(response.data);
        var stop = false;
        data.map((x,i)=>{
          matchFunc(x,i) ? stop = true : null;
        });

        if(response.paging && response.paging.next && data.length < max_rows && stop === false){
          uri = response.paging.next;
          qparams = undefined;
          return reqWhile();
        }
      }
    });
  }
}

function fbAPIRequestBatcher(PAGE_ACCESS_TOKEN,requests){
  var batches = [];
  while(requests.length > 0){
    batches.push(JSON.stringify(requests.splice(0,50)));
  }
  
  var uri = 'https://graph.facebook.com/v2.8/';

  return Promise.mapSeries(batches,(batch,i)=>{
    var qparams = {
      access_token: PAGE_ACCESS_TOKEN,
      batch: batch,
      include_headers:false
    };    
    return fetch(uri+(qparams ? '?'+qs.stringify(qparams) : ''),{
      method: 'POST',
      headers:{'Content-Type': 'application/x-www-form-urlencoded'}
    }).then(function(res){
      return res.json();
    }).then(function(batched_response){
      if(  batched_response && batched_response.error ){
        if( batched_response.error.code === 190 /*&& batched_response.error.error_subcode === 463*/ ){
          throw new Error('ErrorFacebookTokenExpired');
        }else{
          throw new Error(JSON.stringify(batched_response));
        }
      }else{
        return batched_response;
      }
    });
  }).then(function(batched_responses){

    var responses = [];
    var parsed_responses = [];
    if(batched_responses && batched_responses.length >= 1){
      batched_responses.map((batched_response,i)=>{
        responses = responses.concat(batched_response);
      });
    }

    responses.map((response,i)=>{
      if(response.code === 200 && response.body){
        parsed_responses[i] = JSON.parse(response.body);
      }else if(response.code && response.code !== 200 && response.body){
        parsed_responses[i] = JSON.parse(response.body);
        console.log(parsed_responses[i]);
      }else{
        throw new Error(JSON.stringify(response));
      }
    })

    return parsed_responses;
  });
}

function fbAPIRequestSerialBatcher(PAGE_ACCESS_TOKEN,requests,interval){
  
  interval = typeof interval === 'number' ? interval : 3000;
  var uri = 'https://graph.facebook.com/v2.8/';
  var r = [];
  var i = 0;

  function fetchFBGRaphAPI(){
    var request = requests[i];
    return fetch(uri+request.relative_url+'&access_token='+PAGE_ACCESS_TOKEN,{
      method: request.method,
      headers:{'Content-Type': 'application/x-www-form-urlencoded'}
    }).then(function(res){
      return res.json();
    }).then(function(response){
      r.push(response);
      console.log('waiting '+interval+'ms');
      return setDelay(interval);
    }).then(function(success){
      if(i < requests.length-1){
        i = i + 1;
        console.log('fetchFBGRaphAPI');
        return fetchFBGRaphAPI();
      }else{
        return true;
      }
    })
  }

  return fetchFBGRaphAPI()
  .then(function(success){
    return r;
  });
}

function setDelay(delay_ms){
  return new Promise(function(resolve,reject){
    window.setTimeout(function(){
      resolve(true);
    },delay_ms);
  });
}

function countComment(data){
  if(data && data.length>=1 && data[0].created_time){
    var counter = [];
    data.map((x)=>{
      var date = moment(x.created_time).utcOffset(8).format('YYYY-MM-DD');
      if(typeof counter[date] === 'undefined'){
        counter[date] = 1;
      }else{
        counter[date] = counter[date] + 1;
      }
    });
    var counter2 = [];
    for(var key in counter){
       if (counter.hasOwnProperty(key)) {
          counter2.push({date:key,count:counter[key]});
       }
    }
    return counter2;
  }else{
    throw new Error('WRONG INPUT PARAMETERS');
  }
}

function dateCompare(a, b){
  var c = new Date(a.date);
  var d = new Date(b.date);

  if (c > d) {
    return -1;
  }
  if (c < d) {
    return 1;
  }
  // a must be equal to b
  return 0;
}

function parseARString (str) {
  var state = rstore.getState();
  var page_posts = str.split("\n");
  var list = [];
  var index_list = [];
  var row;

  try{
    if(state.Pages && state.Pages.data.length){
      page_posts.map((page_post,index)=>{
        row = page_post.split('_');
        list[index] = [];
        list[index][0] = row[0];
        list[index][1] = row[1];
        list[index][2] = row[2];

        var page_index = sy.getPageIndex(row[0]);
        var post_index = sy.getPostIndex(row[0],row[0]+'_'+row[1]);

        index_list[index] = [];
        index_list[index][0] = page_index;
        index_list[index][1] = post_index;
        index_list[index][2] = row[2];

        state.Pages.data[page_index].Posts.data[post_index];
      })
      return index_list;
    }
  }catch(err){
    alert('something is wrong with the list');
    throw err;
  }
}

function getCommentsAndDoJob(PAGE_ACCESS_TOKEN,timings,post_configs){
  var post_ids = post_configs.map((post_config)=>(post_config.post_id));
  var message_interval = timings.message_interval;

  var do_hides = [];
  var do_hide_ids = [];
  var pm_messages = [];
  var pm_message_ids = [];
  var comment_messages = [];
  var comment_message_ids = [];
  var label_ids = [];
  var label_id_ids = [];
  
  var r = {};

  return getFBPostsComments(PAGE_ACCESS_TOKEN,post_ids)
  .then(function(responses){
    console.log('getFBPostsComments');
    console.log(responses);
    r.comments = responses;

    responses.map((comment,j)=>{
      if(comment.error && comment.error.code === 190 /*&& comment.error.error_subcode === 463*/){
        throw new Error('ErrorFacebookTokenExpired');
      }
      var post_config = post_configs[j];

      comment.data.map((Comment,i)=>{
        if(typeof post_config.unhide === 'number'){
          if(Comment.can_hide && Comment.is_hidden && i < post_config.unhide){
            do_hides.push(false);
            do_hide_ids.push(Comment.id);
            recordStatistics(post_config.post_id,'ADD_SHOWN');
          }else if(Comment.can_hide && !Comment.is_hidden && i >= post_config.unhide){
            do_hides.push(true);
            do_hide_ids.push(Comment.id);
            recordStatistics(post_config.post_id,'ADD_HIDDEN');
          }else{
            // SKIP
          }
        }
        
        if(post_config.do_pm === true){
          if(Comment.can_reply_privately && shouldPM(Comment.message)){
            pm_messages.push(post_config.pm_message);
            pm_message_ids.push(Comment.id);
            comment_messages.push(post_config.comment_message);
            comment_message_ids.push(Comment.id);
            recordStatistics(post_config.post_id,'ADD_PM');
            console.log('$$$ WHY IT DOES NOT EVEN REACH HERE'); 
            recordStatistics(post_config.post_id,'ADD_COMMENT');
            if(typeof post_config.label_id === 'number' && post_config.label_id){
              label_ids.push(post_config.label_id);
              label_id_ids.push(Comment.from.id);
              recordStatistics(post_config.post_id,'ADD_LABEL');
            }
          }else if(!Comment.can_reply_privately && Comment.comment_count === 0 && shouldPM(Comment.message)){
            comment_messages.push(post_config.unable_pm_comment_message);
            comment_message_ids.push(Comment.id);
            recordStatistics(post_config.post_id,'ADD_COMMENT');
          }

        }
      });
      //return getFBPageLabels(PAGE_ACCESS_TOKEN);
    });
    console.log('$$$ IF IT SKIPPED THIS THEN THERE IS A FUCKING BIG PROBLEM');    

    return postCommentVisibilities(PAGE_ACCESS_TOKEN,do_hide_ids,do_hides);
  }).then(function(response){
    console.log('postCommentVisibilities');    
    console.log(response);
    if(pm_messages && pm_messages.length>=1){
      return postPrivateReplies(PAGE_ACCESS_TOKEN,pm_message_ids,pm_messages,message_interval);
    }else{
      return true;
    }
  }).then(function(response){
    console.log('postPrivateReplies');
    console.log(response);
    if(comment_messages && comment_messages.length>=1){
      return postCommentComments(PAGE_ACCESS_TOKEN,comment_message_ids,comment_messages,message_interval);
    }else{
      return true;
    }
  }).then(function(response){
    console.log('postCommentComments');
    console.log(response);
    if(label_ids && label_ids.length>=1){
      return postFBLabels(PAGE_ACCESS_TOKEN,label_ids,label_id_ids);
    }else{
      return true;
    }
  }).then(function(response){
    console.log('postFBLabels');
    console.log(response);
    return r.comments; //FINAL RETURN VALUE
  }).catch(function(err){
    if(err instanceof Error && err.message === 'ErrorFacebookTokenExpired'){
      return gsetUserLoginAndPage()
      .then(function(success){
        return getCommentsAndDoJob(PAGE_ACCESS_TOKEN,timings,post_configs);
      });
    }
  });
}

function shouldPM(message){
  if(message.toLowerCase().indexOf('pm') !== -1){
    return true;
  }else{
    return true;
  }
}

function configFillDefaults(config){
  if(typeof config.timings === 'undefined'){
    config.timings = {};
  }
  if(typeof config.timings.scanning_interval === 'undefined'){
    config.timings.scanning_interval = 5000;
  }
  if(typeof config.timings.message_interval === 'undefined'){
    config.timings.message_interval = 3000;
  }
  return config;
}

function postConfigFillDefaults(post_configs,default_config){
  post_configs.map((post_config,i)=>{
    if(typeof post_config.do_pm === 'undefined'){
      post_config.do_pm = default_config.do_pm;
    }
    if(typeof post_config.unhide === 'undefined'){
      post_config.unhide = default_config.unhide;
    }
    if(typeof post_config.comment_message === 'undefined'){
      post_config.comment_message = default_config.comment_message;
    }
    if(typeof post_config.pm_message === 'undefined'){
      post_config.pm_message = default_config.pm_message;
    }
    if(typeof post_config.unable_pm_comment_message === 'undefined'){
      post_config.unable_pm_comment_message = default_config.unable_pm_comment_message;
    }
    if(typeof post_config.label_id === 'undefined'){
      post_config.label_id = default_config.label_id;
    }
  });
  return post_configs;
} 

function recordStatistics(post_id,stat_type){
  if(typeof window.autopm_stats === 'undefined'){
    window.autopm_stats = [];
  }
  window.autopm_stats.push(post_id+' - '+stat_type);

  rstore.dispatch({
    type:'RECORD_STATISTICS',
    post_id:post_id,
    stat_type:stat_type
  });
  //console.log('$$$ OK IT DOES NOT EVEN FINISH THE DISPATCH');
  //rerender();
  //console.log('$$$ OK IT DOES NOT EVEN FINISH THE RENDER');
}