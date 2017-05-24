import {settings} from '../settings';
import React, {Component} from 'react';
import {render} from 'react-dom';
import { createStore } from 'redux';
import { Grid, Row, Col, Button, FormControl } from 'react-bootstrap';
import moment from 'moment';
import { syDateFormat } from './Utils/Helper';
import qs from 'qs';
import Promise from 'bluebird';

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

var initial_state = {
  auto_refresh_string:"",
  auto_refresh_interval:5,
  auto_refresh_repeat:1000,
  auto_refresh_is_on:false
};

var updateStateDependencies = function(state){
  return state;
}

var reducer = function(state={},action=null){

  switch(action.type){
    case 'PAGES_CREATE_RS':
      if(state.Pages && state.Pages.data && state.Pages.data.length >= 1){
        action.response.data.map((Page,index)=>{
          state.Pages.data[index].access_token = Page.access_token;
        });
      }else{
        state.Pages = action.response;
      }
      break;

    case 'PAGE_POSTS_CREATE_RESPONSE_SUCCESS':
      state.Pages.data[action.page_index].Posts = action.response;
      break;

    case 'PAGE_LABELS_CREATE':
      var page_index = action.page_index;
      var page_access_token = state.Pages.data[page_index].access_token;
      FB.api('/me/labels?access_token='+page_access_token+'&limit=100',function(response){
        if(response.data && response.data.length>0){
          rstore.dispatch({
            type:'PAGE_LABELS_CREATE_RESPONSE_SUCCESS',
            page_index: page_index,
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

    case 'POST_COMMENTS_LOAD_MORE':
    case 'POST_COMMENTS_REFRESH':
      var page_index = action.page_index;
      var post_index = action.post_index;
      var post_id = state.Pages.data[page_index].Posts.data[post_index].id;
      var type = action.type;
      var Comments = state.Pages.data[page_index].Posts.data[post_index].Comments;
      var page_access_token = state.Pages.data[page_index].access_token;

      if((!Comments) || (Comments && Comments.paging.next) || type == 'POST_COMMENTS_REFRESH'){
        var url = settings.fb.graph_api_url+'/'+post_id+'/comments?limit=25&access_token='+page_access_token+'&order=reverse_chronological&fields=id,message,from,created_time,can_reply_privately,private_reply_conversation,can_like,can_hide,comment_count,attachment,is_hidden,is_private';
        if(Comments && Comments.paging.next && type == 'POST_COMMENTS_LOAD_MORE'){
          url = Comments.paging.next;
        }

        fetch(url,{
          method: 'GET',
          headers:{"Content-Type": "application/x-www-form-urlencoded"}
        }).then(function (res) {
          return res.json();    
        }).then(function(response){
          if(response.data && response.data.length>0){
            rstore.dispatch({
              type:type+'_RESPONSE_SUCCESS',
              page_index: page_index,
              post_index: post_index,
              response:response
            });
            rerender();

            if(action.hide_comments >= 0){
              sy.hideComments(state,page_index,post_index,action.hide_comments);
            }

          }else if(response.error && response.error.code === 190 && response.error.error_subcode === 463){
            gsetUserLoginAndPage();
          }else if(response.error){
            sy.error_log.push(response);
          }else{
            sy.error_log.push(response);
          }
        });

      }else{
        alert('No more COMMENTS to load...')
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

    case 'LABEL_APPLY':
      var page_index = action.page_index;
      var post_index = action.post_index;
      var comment_index = action.comment_index;

      var chosen_label_index = state.Pages.data[page_index].chosen_label_index;
      if(chosen_label_index || chosen_label_index === 0){
      var page_access_token = state.Pages.data[page_index].access_token;
      var uid = state.Pages.data[page_index].Posts.data[post_index].Comments.data[comment_index].from.id;
      var label_id = state.Pages.data[page_index].Labels.data[state.Pages.data[page_index].chosen_label_index].id; 
        FB.api(
          '/'+label_id+'/users?access_token='+page_access_token+'&user_ids=['+uid+']',
          'POST',
          function(response){
            if(response.success){
              rstore.dispatch({
                type:'LABEL_APPLY_RESPONSE_SUCCESS'
              });
            }else if(response.error && response.error.code === 190 && response.error.error_subcode === 463){
              gsetUserLoginAndPage();
            }else if(response.error){
              alert(response.error.message);
              sy.error_log.push(response);
            }else{
              sy.error_log.push(response);
            }
        });
      }
      break;

    case 'LABEL_APPLY_RESPONSE_SUCCESS':
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

  state = updateStateDependencies(state);
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

class AutoReplyApp extends Component{
  constructor(props,context) {
    super(props,context);
  }

  render(){
    return(
      <section>
        <Row>
        <Col md={2}>
          <AutoRefreshSetup 
            auto_refresh_string={this.props.state.auto_refresh_string}
            auto_refresh_is_on={this.props.state.auto_refresh_is_on}
            auto_refresh_interval={this.props.state.auto_refresh_interval}
            auto_refresh_repeat={this.props.state.auto_refresh_repeat}
            auto_refresh_list={this.props.state.auto_refresh_list}
            Pages={this.props.state.Pages}
          />
        </Col>
        </Row>
      </section>
    );
  }
}

class AutoRefreshSetup extends Component{
  constructor(props,context) {
    super(props,context);
    this.state = {config:props.config,started:false};
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
    var config = JSON.parse(input);
    if(config){
      var post_configs = configFillDefaults(config.post_configs,config.default_config);
      console.log('post_configs');
      console.log(post_configs);

      function loopGetCommentsDoJob(){
        return getCommentsAndDoJob(post_configs)
        .then(function(post_configs){
          return setDelay(5000);
        }).then(function(success){
          if(that.started){
            return loopGetCommentsDoJob();
          }else if(that.started === false){
            that.autobot_started = false;
            return true;
          }
        });
      }

      that.autobot_started = true;
      gsetUserLoginAndPage()
      .then(function(success){
        return loopGetCommentsDoJob();
      }).then(function(success){
        console.log('STOPPED AUTO REPLYING');
      })
    }
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

      </section>
    );
  }
}


var rerender = function(){
  render(<AutoReplyApp state={rstore.getState()} />, document.getElementById('app'));
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
    response:response
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

function postPrivateReplies(PAGE_ACCESS_TOKEN,comment_ids,messages){
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

function postCommentComments(PAGE_ACCESS_TOKEN,comment_ids,messages){
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

function fbAPIRequestSerialBatcher(PAGE_ACCESS_TOKEN,requests){
  
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
      console.log('waiting 3000ms');
      return setDelay(3000);
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

function getCommentsAndDoJob(post_configs){
  var post_ids = post_configs.map((post_config)=>(post_config.post_id));
  
  var do_hides = [];
  var do_hide_ids = [];
  var pm_messages = [];
  var pm_message_ids = [];
  var comment_messages = [];
  var comment_message_ids = [];
  var label_ids = [];
  var label_id_ids = [];
  
  var pid = pid = post_ids[0].split('_')[0];
  var page_i = rstore.getState().Pages.data.findIndex((Page)=>(Page.id === pid));
  var PAGE_ACCESS_TOKEN = rstore.getState().Pages.data[page_i].access_token;

  return getFBPostsComments(PAGE_ACCESS_TOKEN,post_ids)
  .then(function(responses){
    console.log('getFBPostsComments');
    console.log(responses);

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
          }else if(Comment.can_hide && !Comment.is_hidden && i >= post_config.unhide){
            do_hides.push(true);
            do_hide_ids.push(Comment.id);
          }else{
            // SKIP
          }
        }
        
        if(Comment.can_reply_privately && shouldPM(Comment.message)){
          pm_messages.push(post_config.pm_message);
          pm_message_ids.push(Comment.id);
          comment_messages.push(post_config.comment_message);
          comment_message_ids.push(Comment.id);
          label_ids.push(post_config.label_id);
          label_id_ids.push(Comment.id);
        }else if(!Comment.can_reply_privately && Comment.comment_count === 0 && shouldPM(Comment.message)){
          comment_messages.push(post_config.unable_pm_comment_message);
          comment_message_ids.push(Comment.id);
        }
      });
      //return getFBPageLabels(PAGE_ACCESS_TOKEN);
    });
    return postCommentVisibilities(PAGE_ACCESS_TOKEN,do_hide_ids,do_hides);
  }).then(function(response){
    console.log('postCommentVisibilities');    
    console.log(response);
    return postPrivateReplies(PAGE_ACCESS_TOKEN,pm_message_ids,pm_messages);
  }).then(function(response){
    console.log('postPrivateReplies');
    console.log(response);
    return postCommentComments(PAGE_ACCESS_TOKEN,comment_message_ids,comment_messages);
  }).then(function(response){
    console.log('postCommentComments');
    console.log(response);
    return response;
  }).catch(function(err){
    if(err instanceof Error && err.message === 'ErrorFacebookTokenExpired'){
      return gsetUserLoginAndPage()
      .then(function(success){
        return getCommentsAndDoJob(post_configs);
      });
    }
  });
}

function shouldPM(message){
  if(message.toLowerCase().indexOf('pm') !== -1){
    return true;
  }else{
    return false;
  }
}

function configFillDefaults(post_configs,default_config){
  post_configs.map((post_config,i)=>{
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