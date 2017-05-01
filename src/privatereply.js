import {settings} from '../settings';
import React, {Component} from 'react';
import {render} from 'react-dom';
import { createStore } from 'redux';
import { Grid, Row, Col, Button, FormControl } from 'react-bootstrap';
import moment from 'moment';
import { syDateFormat } from './Utils/Helper';

const greyborder = {backgroundColor:'#fff',margin:"3px 0px 3px 0px",border:"1px solid #bbb",padding:"5px 10px 5px 10px",borderRadius:"3px"};
const blueborder = {backgroundColor:'aliceblue',margin:"3px 0px 3px 50px",border:"1px solid darkturquoise",padding:"5px 10px 5px 10px",borderRadius:"3px"};
const greenborderbottom = {
    borderWidth: '1px',
    borderColor: 'darkturquoise',
    borderStyle: 'solid none none none',
    backgroundColor: '#fefefe'
};
const bluefont = {color:'blue',fontWeight:'bold',cursor:'pointer'};
const boldfont = {fontWeight:'bold'};

const message_from_self = {textAlign:'right'};
const message_from_other = {textAlign:'left'};

const facebook_base_url = settings.fb.base_url;

window.fbAsyncInit = function() {
  FB.init({
    appId      : settings.fb.app_id,
    xfbml      : false,
    version    : 'v2.8'
  });
  FB.AppEvents.logPageView();
  sy.checkLoginStatus();
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
    case 'PAGES_CREATE':
      FB.api('/me/accounts?access_token='+sy.userAccessToken,function(response){
        sy.pageAuthResponse = response;
        rstore.dispatch({
          type:'PAGES_CREATE_RESPONSE_SUCCESS',
          response:response
        });
        rerender();
      });
      break;

    case 'PAGES_CREATE_RESPONSE_SUCCESS':
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
          sy.login();
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

            if(action.hide_comments){
              sy.hideComments(state,page_index,post_index);
            }

          }else if(response.error && response.error.code === 190 && response.error.error_subcode === 463){
            sy.login();
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
            if(response.id){
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
              sy.login();
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
              sy.login();
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
            sy.login();
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
            sy.login();
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
            sy.login();
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
  login_count:0,
  error_log:[],
};

sy.login = function(){
  sy.login_count = sy.login_count + 1;
  FB.getLoginStatus(function(response){
    if (response.status === 'connected') {
      sy.is_login_fb = true;
      // the user is logged in and has authenticated your
      // app, and response.authResponse supplies
      // the user's ID, a valid access token, a signed
      // request, and the time the access token 
      // and signed request each expire
      var uid = response.authResponse.userID;
      var accessToken = response.authResponse.accessToken;
      sy.uid = uid;
      sy.userAccessToken = accessToken;
      rstore.dispatch({
        type:'PAGES_CREATE'
      });
    } else if (response.status === 'not_authorized') {
        FB.login(function(response){
          if (response.status === 'connected') {
            sy.is_login_fb = true;
            var uid = response.authResponse.userID;
            var accessToken = response.authResponse.accessToken;
            sy.uid = uid;
            sy.userAccessToken = accessToken;
            rstore.dispatch({
              type:'PAGES_CREATE'
            });
          }
        },sy.scopesNeeded);
    } else {
        FB.login(function(response){
          if (response.status === 'connected') {
            sy.is_login_fb = true;
            var uid = response.authResponse.userID;
            var accessToken = response.authResponse.accessToken;
            sy.uid = uid;
            sy.userAccessToken = accessToken;
            rstore.dispatch({
              type:'PAGES_CREATE'
            });
          }
        },sy.scopesNeeded);
    }
  });
}

sy.checkLoginStatus = function(){
  FB.getLoginStatus(function(response){
    if (response.status === 'connected') {
      sy.is_login_fb = true;
    } else if (response.status === 'not_authorized') {
      sy.is_login_fb = false;
    } else {
      sy.is_login_fb = false;
    }
  });
}

sy.message = function(){
  FB.api(
    '/t_mid.1442286828612:0a18275c12a2dfe520/messages?access_token='+rstore.getState().Pages.data[0].access_token+'&fields=message,created_time,from,to,attachments',
    function(response){
      console.log(response);
  });
}

/*
sy.message = function(){
  FB.api(
    '/t_mid.1442286828612:0a18275c12a2dfe520/messages?access_token='+sy.pageAuthResponse.data[0].access_token+'&fields=message,created_time,from,to',
    function(response){
      console.log(response);

      //t_mid.1442286828612:0a18275c12a2dfe520/messages?fields=message,created_time,from,to
  });
}

sy.sendMessagePageAPI = function(){
  var messageData = {

      body:"asd",
      attachment: "https://unity3d.com/profiles/unity3d/themes/unity/images/company/brand/logos/primary/unity-logo.png"
    //source: "https://facebookbrand.com/wp-content/themes/fb-branding/prj-fb-branding/assets/images/fb-art.png" 

  };

  FB.api(
    '/t_mid.1442286828612:0a18275c12a2dfe520/messages?access_token='+rstore.getState().Pages.data[0].access_token,
    'POST',
    messageData,
    function(response){
      console.log(response);
  });
}

sy.sendMessage = function(){

  var messageData = {
    recipient: {
      id: "1557195390962350"//yishu-599188074-10153270822113075//shiyuh-10155357680739396
    },
    message: {
      attachment: {
        type: "image",
        payload: {
          url: "https://facebookbrand.com/wp-content/themes/fb-branding/prj-fb-branding/assets/images/fb-art.png"
        }
      }
    }
  };

  sy.callSendAPI(messageData);
}

sy.callSendAPI = function (messageData) {
  fetch('https://graph.facebook.com/v2.6/me/messages?access_token='+sy.page_access_token_messenger,{
    method: 'POST',
    headers:{'Content-Type': 'application/json'},
    body: JSON.stringify(messageData)
  }).then(function (res) {
    res.json();
  }).then(function(response){
    console.log(response);
  });
}
*/
sy.parseAutoRefreshList = function(str){
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

sy.getPageIndex = function(page_id){
  var Pages = rstore.getState().Pages.data;
  return Pages.findIndex((x)=>(x.id === page_id));
}

sy.getPostIndex = function(page_id,post_id){
  var Pages = rstore.getState().Pages.data;
  var page_index = Pages.findIndex((x)=>(x.id === page_id));
  var Posts = Pages[page_index].Posts.data;
  var post_index = Posts.findIndex((x)=>(x.id === post_id));
  return post_index;
}

sy.queueAutoRefresh = function(){
  var state = rstore.getState();
  if(state.auto_refresh_queue && state.auto_refresh_queue.length >= 1){
    var page_index = state.auto_refresh_queue[0][0];
    var post_index = state.auto_refresh_queue[0][1];
    var hide_comments = (state.auto_refresh_queue[0][2] === '0') ? false : true;

    rstore.dispatch({
      type:'POST_COMMENTS_REFRESH',
      page_index:page_index,
      post_index:post_index,
      hide_comments:hide_comments
    });

    rstore.dispatch({
      type:'AUTO_REFRESH_QUEUE_SHIFT'
    });

    if(state.auto_refresh_queue.length >= 1 && state.auto_refresh_is_on){
      window.setTimeout(sy.queueAutoRefresh,state.auto_refresh_interval*1000);
    }else if(state.auto_refresh_queue.length == 0 && state.auto_refresh_queue_is_on){
      rstore.dispatch({
        type:'AUTO_REFRESH_TOGGLE'
      });
    }
    rerender();
  }
  
}

sy.hideComments = function(state,page_index,post_index){
  var Comments = state.Pages.data[page_index].Posts.data[post_index].Comments.data;
  var page_access_token = state.Pages.data[page_index].access_token;

  Comments.map((Comment,i)=>{
    if(Comment.is_hidden === false && Comment.can_hide === true && i>=5){
      FB.api(
        '/'+Comment.id+'?access_token='+page_access_token+'&is_hidden='+true,
        'POST',
        function(response){
          if(response.success){
            rstore.dispatch({
              type:'COMMENT_TOGGLE_RESPONSE_SUCCESS',
              page_index:page_index,
              post_index:post_index,
              comment_index:i,
              is_hidden:true
            });
            rerender();
          }else if(response.error && response.error.code === 190 && response.error.error_subcode === 463){
            sy.login();
          }else if(response.error){
            alert(response.error.message);
            sy.error_log.push(response);
          }else{
            sy.error_log.push(response);
          }
      });
    }
  });
}

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
        <Col md={10}>
        { (this.props.state.Pages && this.props.state.Pages.data)
          ? (this.props.state.Pages.data.map((Page,index)=>(
              <PageManager key={Page.id} index={index} Page={Page}/>
            )))
          : null}

          <CommentHistory 
            CommentCounts={this.props.state.CommentCounts}
            auto_refresh_list={this.props.state.auto_refresh_list}
            Pages={this.props.state.Pages}
          />
        </Col>
        </Row>
      </section>
    );
  }
}

class CommentHistory extends Component{

  constructor(props,context) {
    super(props,context);
    this.state = {post_id:''};
  }

  handleGetCommentCount = (event) => {
    var post_id = this.state.post_id;
    var page_id = post_id.split('_')[0];
    fetch(settings.base_dir+'/msg/countcomments?post_id='+post_id+'&page_id='+page_id,{
      method: "GET",
      headers: {"Content-Type": "application/x-www-form-urlencoded"}
    }).then(function (res) {
      return res.json();
    }).then(function(response){
      rstore.dispatch({
        type:'GET_COMMENT_COUNTS_RESPONSE_SUCCESS',
        CommentCounts:response
      });
      rerender();
    });
  }

  handlePostIdChange = (event) => {
    this.setState({post_id:event.target.value});
  }

  render(){
    return(
      <section id="comment_counter">
        <Row>
          <Col md={4}>
            <input className="form-control" type="text" name="post_id" onChange={this.handlePostIdChange}/>
          
            {this.props.auto_refresh_list ?
            <div>
              {this.props.auto_refresh_list.map((row,index)=>{
                var Post = this.props.Pages.data[row[0]].Posts.data[row[1]];
                return (
                  <div key={'post_id_'+index}>
                    <a style={{fontSize:'10px'}}>
                        {'#'  +(row[0]+1)+'-'+(row[1]+1)+
                         '] ' +Post.id}
                    </a>
                  </div>
                );
              })}
            </div>
            : null}

          </Col>
          <Col md={2}>
            <button className="btn btn-primary" onClick={this.handleGetCommentCount}>REFRESH COUNT</button>
          </Col>    
          <Col md={4}>
            <table className="table">
            <tbody>
              {this.props.CommentCounts
              ? (this.props.CommentCounts.map((CommentCount,index)=>(
                  <tr key={'comment_count_'+index}>
                    <td>{CommentCount.created_date.split('T')[0]}</td>
                    <td>{CommentCount.count}</td>
                  </tr>
                )))
              : null}
            </tbody>
            </table>
          </Col>   
        </Row>
      </section>
    );
  }
}


class CommentHistoryV2 extends Component{
  constructor(props,context) {
    super(props,context);
  }

  handleGetCommentCount = (event) => {
    var page_index = this.props.page_index;
    var post_index = this.props.post_index;
    var Posts = rstore.getState().Pages.data[page_index].Posts.data;
    var post_id = Posts[post_index].id;
    var page_id = post_id.split('_')[0];
    
    fetch(settings.base_dir+'/msg/countcomments?post_id='+post_id+'&page_id='+page_id,{
      method: "GET",
      headers: {"Content-Type": "application/x-www-form-urlencoded"}
    }).then(function (res) {
      return res.json();
    }).then(function(response){
      rstore.dispatch({
        type:'GET_COMMENT_COUNTS_V2_RESPONSE_SUCCESS',
        page_index:page_index,
        post_index:post_index,
        CommentCounts:response
      });
      rerender();
    });
  }

  render(){

    if(this.props.CommentCounts){
      var CommentCountsLast7Days;
      var display_days = 7;
      var size = this.props.CommentCounts.length;
      if(size < display_days){
        CommentCountsLast7Days = this.props.CommentCounts;
      }else{
        CommentCountsLast7Days = this.props.CommentCounts.slice(size-display_days,size);
      }
    }

    return(
      <section id="CommentHistory">
        <Row>
          <Col md={2}>
            <button className="btn btn-primary" onClick={this.handleGetCommentCount}>COUNT</button>
          </Col>
          <Col md={4}>
            <table className="table">
            <tbody>
              {CommentCountsLast7Days
              ? (CommentCountsLast7Days.map((CommentCount,index)=>(
                  <tr key={this.props.post_index+'_comment_count_'+index}>
                    <td>{CommentCount.created_date.split('T')[0]}</td>
                    <td>{CommentCount.count}</td>
                  </tr>
                )))
              : null}
            </tbody>
            </table>
          </Col>   
        </Row>
      </section>
    );
  }
}

class AutoRefreshSetup extends Component{
  constructor(props,context) {
    super(props,context);
    this.state = {auto_refresh_string:props.auto_refresh_string};
  }

  componentWillReceiveProps(nextProps) {
    this.setState({auto_refresh_string:nextProps.auto_refresh_string})
  }

  handleAutoRefreshStringChange = (event) => {
    this.setState({auto_refresh_string:event.target.value});
    rstore.dispatch({
      type:'AUTO_REFRESH_STRING_CHANGE',
      auto_refresh_string:event.target.value
    });
  }

  handleAutoRefreshRepeatChange = (event) => {
    rstore.dispatch({
      type:'AUTO_REFRESH_REPEAT_CHANGE',
      auto_refresh_repeat:parseInt(event.target.value,10)
    });
    rerender();
  }

  handleAutoRefreshIntervalChange = (event) => {
    rstore.dispatch({
      type:'AUTO_REFRESH_INTERVAL_CHANGE',
      auto_refresh_interval:parseInt(event.target.value,10)
    });
    rerender();
  }

  handleAutoRefreshToggle = (event) => {
    var state = rstore.getState();
    state.auto_refresh_list = sy.parseAutoRefreshList(state.auto_refresh_string);
    rstore.dispatch({
      type:'AUTO_REFRESH_TOGGLE'
    });

    if(state.auto_refresh_is_on && state.auto_refresh_list.length >= 1){
      rstore.dispatch({
        type:'AUTO_REFRESH_QUEUE_INIT'
      });
      sy.queueAutoRefresh();
    }
    rerender();
  }

  handleFBLogin = (event) => {
    sy.login();
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
        <div><span>List of posts to auto refresh:</span><textarea className="form-control" value={this.state.auto_refresh_string ? this.state.auto_refresh_string : ''} onChange={this.handleAutoRefreshStringChange} placeholder={'eg: \n1-1\n1-2\n1-3'}/></div>
        <div>
          <span>Interval(sec):</span>
          <input 
            className="form-control" 
            value={this.props.auto_refresh_interval ? this.props.auto_refresh_interval : ''} 
            onChange={this.handleAutoRefreshIntervalChange}
          />
        </div>
        <div>
          <span>Repeat(N)</span>
          <input 
            className="form-control" 
            value={this.props.auto_refresh_repeat ? this.props.auto_refresh_repeat : ''} 
            onChange={this.handleAutoRefreshRepeatChange}
          />
        </div>
        <Button onClick={this.handleAutoRefreshToggle} bsStyle="primary">{this.props.auto_refresh_is_on ? 'STOP' : 'START'}</Button>

        {this.props.auto_refresh_list ?
        <div>
          {this.props.auto_refresh_list.map((row,index)=>{
            var Post = this.props.Pages.data[row[0]].Posts.data[row[1]];
            return (
              <div key={'refresh_'+index}>
                <a  href={'#'+(row[0]+1)+'-'+(row[1]+1)} 
                    style={{fontSize:'12px'}}>
                    {
                      '#'   +(row[0]+1)+'-'+(row[1]+1)+

                      '] '  +(Post.comment_last_refresh_time ? 
                              moment.utc(Post.comment_last_refresh_time).utcOffset(8).format('HH:mm:ss') : "") +

                      ' - '  +(Post.message ? Post.message.substring(0,10) : null) +

                      ' - '  +(Post.comment_count_not_yet_pm ? 
                              Post.comment_count_not_yet_pm : "0")
                    }
                </a>
              </div>
            );
          })}
        </div>
        : null}

      </section>
    );
  }
}


class PageManager extends Component{

  constructor(props,context) {
    super(props,context);
  }

  handleClick = (event) => {
    var page_id = event.target.attributes.getNamedItem('data-id').value;
    var page_index = event.target.attributes.getNamedItem('data-index').value;

    rstore.dispatch({
      type:'PAGE_LABELS_CREATE',
      page_index: page_index
    });

    FB.api('/'+page_id+'/posts?limit=100&fields=is_hidden,message,story,id,created_time',function(response){
      if(response.data && response.data.length>0){
        rstore.dispatch({
          type:'PAGE_POSTS_CREATE_RESPONSE_SUCCESS',
          page_index: page_index,
          response:response
        });
        rerender();
      }else if(response.error && response.error.code === 190 && response.error.error_subcode === 463){
        sy.login();
      }else if(response.error){
        alert(response.error.message);
        sy.error_log.push(response);
      }else{
        sy.error_log.push(response);
      }
    });
  }

  handleLabelSelect = (event) => {
    var chosen_label_index = parseInt(event.target[event.target.selectedIndex].getAttribute('data-label-index'),10);
    var page_index = this.props.index;

    rstore.dispatch({
      type:'LABEL_SELECT',
      page_index: page_index,
      chosen_label_index:chosen_label_index
    });
    rerender();
  }

  render(){
    return(
      <section id="page_manager" style={greyborder}>
        <span style={boldfont}>{'#'+(this.props.index+1)+'] '}</span>
        <span name="name">{this.props.Page.name}</span>
        <br/>
        <button className="btn btn-default btn-small" data-index={this.props.index} data-id={this.props.Page.id} onClick={this.handleClick}>GET POSTS</button>
        

        { (this.props.Page.Labels && this.props.Page.Labels.data.length >= 1)
        ? <Row>
            <Col md={1}></Col>
            <Col md={5}>
              <div className="form-group">
                <label className="col-sm-4 control-label">Label after PM:</label>
                <div className="col-sm-8">
                  <select className="form-control" onChange={this.handleLabelSelect}>
                      <option key={'label_empty'} value={''} data-label-index={'-1'}>{''}</option>
                    {this.props.Page.Labels.data.map((Label,index)=>(
                      <option key={Label.id} value={Label.id} data-label-index={index}>{Label.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </Col>
            <Col md={3}>
              <span>Label Chosen : {(this.props.Page.chosen_label_index || this.props.Page.chosen_label_index == 0) ? this.props.Page.Labels.data[this.props.Page.chosen_label_index].name : ''}</span>
            </Col>
          </Row>
          : null
        }

        { (this.props.Page.Posts && this.props.Page.Posts.data)
          ? (this.props.Page.Posts.data.map((Post,index)=>(
              <PostManager 
                key={Post.id} 
                page_index={this.props.index}
                page_id={this.props.Page.id}
                index={index}
                Post={Post}
              />
            )))
          : null 
        }
      </section>
    );
  }
}

class PostManager extends Component{
  constructor(props,context) {
    super(props,context);
    this.state = {
        private_reply_bulk:"",
        comment_reply_bulk:""
    };
  }

  handleClick = (event) => {
    var post_index = event.target.attributes.getNamedItem('data-index').value;
    var page_index = event.target.attributes.getNamedItem('data-page-index').value;
    var do_refresh = event.target.attributes.getNamedItem('data-refresh').value;
    var type = 'POST_COMMENTS_LOAD_MORE';
    if(do_refresh == 'REFRESH'){
       type = 'POST_COMMENTS_REFRESH';
    }

    rstore.dispatch({
      type:type,
      page_index:page_index,
      post_index:post_index,
      hide_comments:false
    });
    rerender();

  }

  handlePrivateReplyBulkChange = (event) => {
    this.setState({private_reply_bulk:event.target.value});
  }

  handlePrivateReplyBulkClick = (event) => {
    rstore.dispatch({
      type:'PRIVATE_REPLY_BULK_REPLACE',
      page_index: this.props.page_index,
      post_index: this.props.index,
      private_reply:this.state.private_reply_bulk
    });
    rerender();
  }

  handleCommentReplyBulkChange = (event) => {
    this.setState({comment_reply_bulk:event.target.value});
  }

  handleCommentReplyBulkClick = (event) => {
    rstore.dispatch({
      type:'COMMENT_REPLY_BULK_REPLACE',
      page_index: this.props.page_index,
      post_index: this.props.index,
      comment_reply:this.state.comment_reply_bulk
    });
    rerender();
  }

  render(){

    if(this.props.Post.Comments && this.props.Post.Comments.data.length > 0){
      var latest_comment_time = moment(this.props.Post.Comments.data[0].created_time);
      var oldest_comment_time = moment(this.props.Post.Comments.data[this.props.Post.Comments.data.length-1].created_time);
    }

    return(
      <section id="post_manager" style={blueborder}>

        <div style={{fontSize:"16px",fontWeight:"bold"}}>
          <span id={(this.props.page_index+1)+'-'+(this.props.index+1)}>{'#'+(this.props.page_index+1)+'-'+(this.props.index+1)+'] '}</span>
          <a href={facebook_base_url+this.props.Post.id.split('_')[0]+'/posts/'+this.props.Post.id.split('_')[1]} target="_blank">POST</a>
          <span name="created_time">{' '+moment.utc(this.props.Post.created_time).utcOffset(8).format('YYYY-MM-DD HH:mm')}</span>
        </div>

        <div>{this.props.Post.id}</div>

        <div>
          {this.props.Post.message ? <div name="message">{this.props.Post.message.substring(0,20)}</div> : null}
          {this.props.Post.story ? <div name="story">{this.props.Post.story.substring(0,20)}</div> : null}
        </div>

        <Row>
          <Col md={6}>
            <button className="btn btn-default btn-sm" data-index={this.props.index} data-page-index={this.props.page_index} data-id={this.props.Post.id} onClick={this.handleClick} data-refresh="LOAD_MORE">LOAD MORE</button>
            <button className="btn btn-info btn-sm" data-index={this.props.index} data-page-index={this.props.page_index} data-id={this.props.Post.id} onClick={this.handleClick} data-refresh="REFRESH">REFRESH</button>
            <CommentHistoryV2 
              page_index={this.props.page_index}
              post_index={this.props.index}
              CommentCounts={this.props.Post.CommentCounts}
            />
          </Col>

          <Col md={2}>
            <textarea 
              className="form-control"
              value={this.state.comment_reply_bulk ? this.state.comment_reply_bulk : ''}
              onChange={this.handleCommentReplyBulkChange}
              placeholder="type comment reply here to bulk fill" 
            />
            <button
              className="btn btn-info btn-sm"
              onClick={this.handleCommentReplyBulkClick}
            >Bulk Fill
            </button>          
          </Col>

          <Col md={4}>
            <textarea 
              className="form-control"
              value={this.state.private_reply_bulk ? this.state.private_reply_bulk : ''}
              onChange={this.handlePrivateReplyBulkChange} 
              placeholder="type private reply here to bulk fill" 
            />
            <button
              className="btn btn-info btn-sm"
              onClick={this.handlePrivateReplyBulkClick}
            >Bulk Fill
            </button>
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            { (this.props.Post.Comments && this.props.Post.Comments.data)
            ? (this.props.Post.Comments.data.map((Comment,index)=>(
                <CommentManager 
                  key={Comment.id}
                  index={index}
                  page_index={this.props.page_index}
                  post_index={this.props.index}
                  page_id={this.props.page_id}
                  Comment={Comment}
                />
              )))
            : null }
          </Col>
        </Row>
      </section>
    );
  }
}


class CommentManager extends Component{
  constructor(props,context) {
    super(props,context);
    this.state = {
        private_reply:props.Comment.private_reply,
        comment_reply:props.Comment.comment_reply
    };
  }

  componentWillReceiveProps(nextProps){
    this.setState({
      private_reply:nextProps.Comment.private_reply,
      comment_reply:nextProps.Comment.comment_reply
    });
  }

  handlePrivateReplyChange = (event) => {
    this.setState({private_reply:event.target.value});
    rstore.dispatch({
      type:'PRIVATE_REPLY_CHANGE',
      page_index:this.props.page_index,
      post_index:this.props.post_index,
      comment_index:this.props.index,
      private_reply:event.target.value
    });
  }

  handlePrivateReplyClick = (event) => {

    var pa_i = event.target.attributes.getNamedItem('data-page-index').value;
    var po_i = event.target.attributes.getNamedItem('data-post-index').value;
    var c_i = event.target.attributes.getNamedItem('data-index').value;

    rstore.dispatch({
      type:'PRIVATE_REPLY_SUBMIT',
      page_index:pa_i,
      post_index:po_i,
      comment_index:c_i,
      private_reply:this.state.private_reply
    });
    rstore.dispatch({
      type:'LABEL_APPLY',
      page_index: this.props.page_index,
      post_index: this.props.post_index,
      comment_index: this.props.index
    });
    rerender();
  }

  handleCommentReplyChange = (event) => {
    this.setState({comment_reply:event.target.value});
    rstore.dispatch({
      type:'COMMENT_REPLY_CHANGE',
      page_index:this.props.page_index,
      post_index:this.props.post_index,
      comment_index:this.props.index,
      comment_reply:event.target.value
    });

  }

  handleCommentReplyClick = (event) => {

    var state = rstore.getState();
    var page_index = event.target.attributes.getNamedItem('data-page-index').value;
    var post_index = event.target.attributes.getNamedItem('data-post-index').value;
    var index = event.target.attributes.getNamedItem('data-index').value;
    var post_id = state.Pages.data[page_index].Posts.data[post_index].id;
    var comment_id = state.Pages.data[page_index].Posts.data[post_index].Comments.data[index].id;
    
    var page_access_token = state.Pages.data[page_index].access_token;
    var comment_reply = this.state.comment_reply;
    
    if(comment_reply.length >= 2){

      FB.api(
        '/'+comment_id+'/comments?access_token='+page_access_token+'&message='+comment_reply,
        'POST',
        function(response){
          if(response.id){
            rstore.dispatch({
              type:'COMMENT_REPLY_SUBMIT_RESPONSE_SUCCESS',
              page_index:page_index,
              post_index:post_index,
              comment_index:index,
              comment_reply:comment_reply
            });
            rerender();
          }else if(response.error && response.error.code === 190 && response.error.error_subcode === 463){
            sy.login();
          }else if(response.error){
            alert(response.error.message);
            sy.error_log.push(response);
          }else{
            sy.error_log.push(response);
          }
      });
    }else{
      alert('Please input a longer message before sending comment');
    }

  }

  handleCommentGetNestedCommentReply = (event) => {
    var index = event.target.attributes.getNamedItem('data-index').value;
    var post_index = event.target.attributes.getNamedItem('data-post-index').value;
    var page_index = event.target.attributes.getNamedItem('data-page-index').value;

    rstore.dispatch({
      type:'COMMENT_GET_COMMENT_REPLY',
      page_index: page_index,
      post_index: post_index,
      comment_index: index
    });
    rerender();
  }

  handleGetConversationMessages = (event) => {
    var index = event.target.attributes.getNamedItem('data-index').value;
    var post_index = event.target.attributes.getNamedItem('data-post-index').value;
    var page_index = event.target.attributes.getNamedItem('data-page-index').value;

    rstore.dispatch({
      type:'GET_CONVERSATION_MESSAGES',
      page_index: page_index,
      post_index: post_index,
      comment_index: index
    });
    rerender();
  }

  handleLabelApply = (event) => {
    rstore.dispatch({
      type:'LABEL_APPLY',
      page_index: this.props.page_index,
      post_index: this.props.post_index,
      comment_index: this.props.index
    });
  }

  handleToggleMessage = (event) =>{
    var state = rstore.getState();
    var page_index = this.props.page_index;
    var post_index = this.props.post_index;
    var index = this.props.index;
    var comment_id = this.props.Comment.id;
    var page_access_token = state.Pages.data[page_index].access_token;
    var is_hidden = this.props.Comment.is_hidden;

    FB.api(
      '/'+comment_id+'?access_token='+page_access_token+'&is_hidden='+!is_hidden,
      'POST',
      function(response){
        if(response.success){
          rstore.dispatch({
            type:'COMMENT_TOGGLE_RESPONSE_SUCCESS',
            page_index:page_index,
            post_index:post_index,
            comment_index:index,
            is_hidden:!is_hidden
          });
          rerender();
        }else if(response.error && response.error.code === 190 && response.error.error_subcode === 463){
          sy.login();
        }else if(response.error){
          alert(response.error.message);
          sy.error_log.push(response);
        }else{
          sy.error_log.push(response);
        }
    });
  }

  render(){
    return(
      <section id="comment_manager" style={greenborderbottom}>
        <Row>
          <Col md={4}>
            <span style={boldfont}>{'#'+(this.props.page_index+1)+'-'+(this.props.post_index+1)+'-'+(this.props.index+1)+'] '}</span>
            <span name="created_time">{moment(this.props.Comment.created_time).utcOffset(8).format('YYYY-MM-DD HH:mm')+' '}</span>
            <span name="from">{this.props.Comment.from.name+' '}</span>
          </Col>

          <Col md={2}>
            <button 
              className={"label"+(this.props.Comment.is_hidden ? ' label-default' : ' label-info')} 
              name="hide_message"
              onClick={this.handleToggleMessage}
            >
              {this.props.Comment.is_hidden ? 'HIDDEN' : 'OK'}
            </button>
            <span name="message">{this.props.Comment.message+' '}</span>
          </Col>


          <Col md={2}>
            {this.props.Comment.can_reply_privately || (this.props.Comment.comment_count ==0) ? 
              <textarea
                className="form-control"
                data-page-index={this.props.page_index} 
                data-post-index={this.props.post_index}
                data-index={this.props.index}
                data-id={this.props.Comment.id}
                name="comment_reply"
                value={this.state.comment_reply ? this.state.comment_reply : ''}
                onChange={this.handleCommentReplyChange}
              ></textarea> : null}

            {this.props.Comment.can_reply_privately || (this.props.Comment.comment_count ==0) ? 
              <button 
                className="btn btn-sm btn-primary"
                data-page-index={this.props.page_index} 
                data-post-index={this.props.post_index}
                data-index={this.props.index}
                data-id={this.props.Comment.id} 
                onClick={this.handleCommentReplyClick}
              >REPLY</button> : null}

            { (this.props.Comment.comment_count > 0)
              ? <div>

                  {!this.props.Comment.Comments 
                    ? <span>
                        <span className="badge">{this.props.Comment.comment_count}</span>
                        <button 
                          className="btn btn-default btn-sm"
                          data-page-index={this.props.page_index} 
                          data-post-index={this.props.post_index}
                          data-index={this.props.index}
                          data-id={this.props.Comment.id} 
                          onClick={this.handleCommentReplyClick}
                          onClick={this.handleCommentGetNestedCommentReply}
                        > Show Comment</button>
                      </span>
                    : null
                  }

                  {this.props.Comment.Comments && this.props.Comment.Comments.data.length >= 1
                    ? <div>{this.props.Comment.Comments.data[0].message}</div>
                    : null
                  }
                </div>
              : null
            }

          </Col>

          <Col md={4}>
            {this.props.Comment.can_reply_privately ? 
              <textarea
                className="form-control"
                data-page-index={this.props.page_index} 
                data-post-index={this.props.post_index}
                data-index={this.props.index}
                data-id={this.props.Comment.id}
                name="private_reply" 
                value={this.state.private_reply ? this.state.private_reply : ''} 
                onChange={this.handlePrivateReplyChange}
              /> : null}  

            {this.props.Comment.can_reply_privately ? 
              <span 
                className="btn btn-sm btn-primary"
                data-page-index={this.props.page_index} 
                data-post-index={this.props.post_index}
                data-index={this.props.index}
                data-id={this.props.Comment.id} 
                onClick={this.handlePrivateReplyClick}
              >SEND PM</span> : null}

            {this.props.Comment.private_reply_conversation ? 
              <a href={facebook_base_url+this.props.Comment.private_reply_conversation.link} target="_blank">OpenPage </a> : null}
          
            {(!this.props.Comment.can_reply_privately && !this.props.Comment.private_reply_conversation) ?
              <span>X</span> : null}

            {this.props.Comment.private_reply_conversation
              ? <button
                  className="btn btn-default btn-sm"
                  data-page-index={this.props.page_index} 
                  data-post-index={this.props.post_index}
                  data-index={this.props.index} 
                  onClick={this.handleGetConversationMessages}>Refresh Conversation
                </button> 
              : null
            }

            {this.props.Comment.private_reply_conversation
              ? <button
                  className="btn btn-default btn-sm"
                  onClick={this.handleLabelApply}
                >Add Label
                </button> 
              : null
            }

            {this.props.Comment.Conversation 

              ? <MessageManager 
                page_index={this.props.page_index}
                post_index={this.props.post_index}
                comment_index={this.props.index}
                page_id={this.props.page_id}
                Conversation={this.props.Comment.Conversation}
                key={'Conversation'+this.props.Comment.id}
              />
              : null
            }

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

  handleConversationMessageChange = (event) => {
    this.setState({message_create:event.target.value});
  }

  handleConversationMessageSubmit = (event) => {

    this.setState({message_create:''});
    rstore.dispatch({
      type:'MESSAGE_SEND',
      page_index:event.target.attributes.getNamedItem('data-page-index').value,
      post_index:event.target.attributes.getNamedItem('data-post-index').value,
      comment_index:event.target.attributes.getNamedItem('data-comment-index').value,
      message:this.state.message_create
    });
    rerender();
  }

  render(){
    return(
      <section id="message_manager">
        <section style={{backgroundColor:'#f7f7f7',border:'1px solid #ccc',padding:'5px',borderRadius:'3px',maxHeight:'400px',overflowX:'hidden',overFlowY:'auto'}}>
          {this.props.Conversation.data.map((Element,index)=>{
            var Message = this.props.Conversation.data[this.props.Conversation.data.length - 1 - index];
            return (
              <div key={Message.id} style={(Message.from.id === this.props.page_id) ? message_from_self : message_from_other}>
                <span style={{display:'inline-block',maxWidth:'90%',backgroundColor:'#fff',margin:"3px 0px 3px 0px",border:"1px solid #bbb",padding:"5px 10px 5px 10px",borderRadius:"3px",textAlign:'left'}}>{Message.message.split('\n').map((item, key) => (<span key={key}>{item}<br/></span>))}</span>
              </div>
            );
          })}
        </section>
        <Row>
          <Col md={9}>
            <textarea
              className="form-control"
              data-page-index={this.props.page_index} 
              data-post-index={this.props.post_index}
              data-comment-index={this.props.comment_index}
              name="message_create" 
              value={this.state.message_create}
              onChange={this.handleConversationMessageChange}
              style={{height:'35px'}}
            />
          </Col>
          <Col md={3}>
            <span 
              className="btn btn-sm btn-primary btn-block"
              data-page-index={this.props.page_index} 
              data-post-index={this.props.post_index}
              data-comment-index={this.props.comment_index}
              onClick={this.handleConversationMessageSubmit}
            >SEND</span>
          </Col>
        </Row>
      </section>
    );
  }

}

var rerender = function(){
  render(<AutoReplyApp state={rstore.getState()} />, document.getElementById('app'));
}
window.rerender = rerender;

rerender();