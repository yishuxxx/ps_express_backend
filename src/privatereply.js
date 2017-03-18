import {settings} from '../settings';
import React, {Component} from 'react';
import {render} from 'react-dom';
import { createStore } from 'redux';
import { Grid, Row, Col, Button, FormControl } from 'react-bootstrap';
import moment from 'moment';
import { syDateFormat } from './Utils/Helper';

const greyborder = {margin:"3px 0px 3px 0px",border:"1px solid #bbb",padding:"5px 10px 5px 10px",borderRadius:"3px"};
const blueborder = {margin:"3px 0px 3px 50px",border:"1px solid darkturquoise",padding:"5px 10px 5px 10px",borderRadius:"3px"};
const greenborderbottom = {
    borderWidth: '1px',
    borderColor: 'darkturquoise',
    borderStyle: 'solid none none none',
};
const bluefont = {color:'blue',fontWeight:'bold',cursor:'pointer'};
const boldfont = {fontWeight:'bold'};
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
  console.log(action.type);
  switch(action.type){
    case 'PAGES_CREATE':
      state.Pages = action.response;
      break;
    case 'PAGE_POSTS_CREATE':
      state.Pages.data[action.page_index].Posts = action.response;
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
        var url = '/'+post_id+'/comments?limit=100&access_token='+page_access_token+'&order=reverse_chronological&fields=id,message,from,created_time,can_reply_privately,private_reply_conversation,can_like,comment_count,attachment,is_hidden,is_private';
        if(Comments && Comments.paging.next && type == 'POST_COMMENTS_LOAD_MORE'){
          url = Comments.paging.next;
        }

        FB.api(url,function(response){
          if(response.data && response.data.length>0){
            rstore.dispatch({
              type:type+'_RESPONSE_SUCCESS',
              page_index: page_index,
              post_index: post_index,
              response:response
            });
          }else{
            alert('Cannot get the COMMENTS of this POST...')
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
    case 'PRIVATE_REPLY_MASS_REPLACE':
      if( state.Pages.data[action.page_index].Posts.data[action.post_index].Comments && 
          state.Pages.data[action.page_index].Posts.data[action.post_index].Comments.data.length>0){
        var Comments = state.Pages.data[action.page_index].Posts.data[action.post_index].Comments.data;
        Comments.map((Comment,index)=>{
          Comment.can_reply_privately ? Comment.private_reply = action.private_reply : null;
        });
      }
      break;
    case 'COMMENT_REPLY_MASS_REPLACE':
      if( state.Pages.data[action.page_index].Posts.data[action.post_index].Comments && 
          state.Pages.data[action.page_index].Posts.data[action.post_index].Comments.data.length>0){
        var Comments = state.Pages.data[action.page_index].Posts.data[action.post_index].Comments.data;
        Comments.map((Comment,index)=>{
          Comment.can_reply_privately ? Comment.comment_reply = action.comment_reply : null;
        });
      }
      break;
    case 'PRIVATE_REPLY_CHANGE':
      state.Pages.data[action.page_index].Posts.data[action.post_index].Comments.data[action.comment_index].private_reply = action.private_reply;
      break;
    case 'COMMENT_REPLY_CHANGE':
      state.Pages.data[action.page_index].Posts.data[action.post_index].Comments.data[action.comment_index].comment_reply = action.comment_reply;
      break;
    case 'PRIVATE_REPLY_SUBMIT_RESPONSE_SUCCESS':
      state.Pages.data[action.page_index].Posts.data[action.post_index].Comments.data[action.comment_index].can_reply_privately = false;
      break;
    case 'COMMENT_REPLY_SUBMIT_RESPONSE_SUCCESS':
      state.Pages.data[action.page_index].Posts.data[action.post_index].Comments.data[action.comment_index].comment_count += 1;
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
      Array(state.auto_refresh_repeat).fill().map((x,i)=>{
        state.auto_refresh_queue = state.auto_refresh_queue.concat(state.auto_refresh_list);
      })
    case 'AUTO_REFRESH_REPEAT_CHANGE':
      state.auto_refresh_repeat = action.auto_refresh_repeat;
      break;
    case 'AUTO_REFRESH_INTERVAL_CHANGE':
      state.auto_refresh_interval = action.auto_refresh_interval;
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
    scope:'read_page_mailboxes,manage_pages,publish_pages',//pages_messaging,pages_messaging_subscriptions
  },
  page_access_token:"EAAXQvp1ley8BAAm9ZAplvIEFZCYj6Ghu8xme7G7sFRd7Gh6EPmYUYCOeekxzJD2fAIC5ziKWz0A0PQI1L35SspWUMZAhFZA9oa4TypnCDW2LZBSwZBdZB8SuI81YwDdOw4UIsB11jkqyqWgxNHQXaHOBP5Q0xjkuG9ZAwWyfyoLdqZCZBNpZAAz6VtiUMpUOSu2oaAZD",
  page_access_token_messenger:"EAAVYvwYDnMcBAKde6kLAxgrzJAEA6FExnfdO8kX2NV5XGqlnv9A80bprje8X7rpyneQ2DrmfvEM5LqHpUd0ebDGZBOLMMebK7eZCpMCqmuhBOpe5dDGb54zYPLbvb63A2hHs9AvZBzRBfQqZBh7FJoAGLTspUKt94ihC6zt2ZBgZDZD"
};

sy.getPageAccessToken = function(){
  FB.api('/me/accounts',function(response){
    sy.pageAuthResponse = response;
    rstore.dispatch({
      type:'PAGES_CREATE',
      response:response
    })
  });
}

sy.login = function(){
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
      sy.getPageAccessToken();

    } else if (response.status === 'not_authorized') {
        FB.login(function(response){
          if (response.status === 'connected') {
            sy.is_login_fb = true;
            var uid = response.authResponse.userID;
            var accessToken = response.authResponse.accessToken;
            sy.uid = uid;
            sy.userAccessToken = accessToken;
            sy.getPageAccessToken();
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
            sy.getPageAccessToken();
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

sy.getPagePosts = function(callback,page_id){
  FB.api('/1661200044095778/posts',function(response){
    console.log(response);
  });
}

sy.getPostComments = function(){
  FB.api('/1661200044095778_1713720265510422/comments?access_token='+sy.pageAuthResponse.data[0].access_token+'&order=reverse_chronological&fields=id,message,created_time,can_reply_privately,private_reply_conversations{message}',function(response){
    console.log(response);
  })
}

sy.getComment = function(){
  FB.api('/1713720265510422_1859310267618087?access_token='+sy.pageAuthResponse.data[0].access_token+'&fields=can_reply_privately',function(response){
    console.log(response);
  })
}

sy.replyComment = function(){
  FB.api(
    '/1713720265510422_1859310267618087/private_replies?access_token='+sy.pageAuthResponse.data[0].access_token+'&message=hello',
    'POST',
    function(response){
      console.log(response);
  });

  FB.api(
    '/1713720265510422_1859310267618087/comments?access_token='+sy.pageAuthResponse.data[0].access_token+'&message=你好',
    'POST',
    function(response){
      console.log(response);
  });
}

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
    message:"asd",
    image_url: "https://unity3d.com/profiles/unity3d/themes/unity/images/company/brand/logos/primary/unity-logo.png" 
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

  /*
  FB.api(
    '/t_mid.1442286828612:0a18275c12a2dfe520/messages?access_token='+sy.pageAuthResponse.data[0].access_token+'&fields=message,created_time,from,to',
    'POST',
    messageData,
    function(response){
      console.log(response);
    });
  */
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

sy.parseAutoRefreshList = function(str){
  var state = rstore.getState();
  var page_posts = str.split("\n");
  var list = [];
  var row;

  try{
    if(state.Pages && state.Pages.data.length){
      page_posts.map((page_post,index)=>{
        row = page_post.split('-');
        list[index] = [];
        list[index][0] = row[0]-1;
        list[index][1] = row[1]-1;
        state.Pages.data[list[index][0]].Posts.data[list[index][1]];
      })
      return list;
    }
  }catch(err){
    alert('something is wrong with the list');
    throw err;
  }

}

sy.queueAutoRefresh = function(){
  var state = rstore.getState();
  if(state.auto_refresh_queue && state.auto_refresh_queue.length >= 1){
    rstore.dispatch({
      type:'POST_COMMENTS_REFRESH',
      page_index:state.auto_refresh_queue[0][0],
      post_index:state.auto_refresh_queue[0][1]
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
  }
  
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
              <PageManager key={index} index={index} Page={Page}/>
            )))
          : null}
        </Col>
        </Row>
      </section>
    );
  }
}


class AutoRefreshSetup extends Component{
  constructor(props,context) {
    super(props,context);
  }

  handleAutoRefreshStringChange = (event) => {
    rstore.dispatch({
      type:'AUTO_REFRESH_STRING_CHANGE',
      auto_refresh_string:event.target.value
    })
  }
  handleAutoRefreshRepeatChange = (event) => {
    rstore.dispatch({
      type:'AUTO_REFRESH_REPEAT_CHANGE',
      auto_refresh_repeat:event.target.value
    })
  }
  handleAutoRefreshIntervalChange = (event) => {
    rstore.dispatch({
      type:'AUTO_REFRESH_INTERVAL_CHANGE',
      auto_refresh_interval:event.target.value
    })
  }

  handleAutoRefreshToggle = (event) => {
    var state = rstore.getState();
    state.auto_refresh_list = sy.parseAutoRefreshList(state.auto_refresh_string);
    rstore.dispatch({
      type:'AUTO_REFRESH_TOGGLE'
    })

    if(state.auto_refresh_is_on && state.auto_refresh_list.length >= 1){
      rstore.dispatch({
        type:'AUTO_REFRESH_QUEUE_INIT'
      })
      sy.queueAutoRefresh();
    }
  }

  handleFBLogin = (event) => {
    sy.login();
  }

  handleFBLogout = (event) => {
    FB.logout();
  }

  render(){
    return(
      <section style={{position:'fixed',top:'0px'}}>
        {
          sy.is_login_fb 
          ? <button onClick={this.handleFBLogout} className="btn btn-primary">{'Logout Facebook'}</button>
          : <button onClick={this.handleFBLogin} className="btn btn-primary">{'Login Facebook'}</button>
        }
        <div><textarea className="form-control" value={this.props.auto_refresh_string} onChange={this.handleAutoRefreshStringChange}/></div>
        <div><span>Interval(sec):</span><input className="form-control" value={this.props.auto_refresh_interval} onChange={this.handleAutoRefreshIntervalChange}/></div>
        <div><span>Repeat(N)</span><input className="form-control" value={this.props.auto_refresh_repeat} onChange={this.handleAutoRefreshRepeatChange}/></div>
        <Button onClick={this.handleAutoRefreshToggle} bsStyle="primary">{this.props.auto_refresh_is_on ? 'STOP' : 'START'}</Button>
        

        {this.props.auto_refresh_list ?
        <div>
          {this.props.auto_refresh_list.map((row,index)=>{
            var Post = this.props.Pages.data[row[0]].Posts.data[row[1]];
            return (
              <div>
                <a  href={'#'+(row[0]+1)+'-'+(row[1]+1)} 
                    style={{fontSize:'24px'}}>
                    {
                      '#'   +(row[0]+1)+'-'+(row[1]+1)+

                      '] '  +(Post.comment_last_refresh_time ? 
                              moment.utc(Post.comment_last_refresh_time).utcOffset(8).format('HH:mm:ss') : "") +

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

    FB.api('/'+page_id+'/posts?limit=100',function(response){
      if(response.data && response.data.length>0){
        rstore.dispatch({
          type:'PAGE_POSTS_CREATE',
          page_index: page_index,
          response:response
        });
      }else{
        alert('Cannot get all the POSTS of this PAGE...')
      }
    });
  }

  render(){
    return(
      <section id="page_manager" style={greyborder}>
        <span style={boldfont}>{'#'+(this.props.index+1)+'] '}</span>
        <span name="name">{this.props.Page.name}</span>
        <br/>
        <button className="btn btn-default btn-small" data-index={this.props.index} data-id={this.props.Page.id} onClick={this.handleClick}>GET POSTS</button>
        { (this.props.Page.Posts && this.props.Page.Posts.data)
          ? (this.props.Page.Posts.data.map((Post,index)=>(
              <PostManager key={index} index={index} page_index={this.props.index} Post={Post}/>
            )))
          : null }
      </section>
    );
  }
}

class PostManager extends Component{
  constructor(props,context) {
    super(props,context);
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
      post_index:post_index
    });

  }

  handlePrivateReplyBulkChange = (event) => {
    var post_index = event.target.attributes.getNamedItem('data-index').value;
    var page_index = event.target.attributes.getNamedItem('data-page-index').value;

    rstore.dispatch({
      type:'PRIVATE_REPLY_MASS_REPLACE',
      page_index: page_index,
      post_index: post_index,
      private_reply:event.target.value
    });
  }

  handleCommentReplyBulkChange = (event) => {
    var post_index = event.target.attributes.getNamedItem('data-index').value;
    var page_index = event.target.attributes.getNamedItem('data-page-index').value;

    rstore.dispatch({
      type:'COMMENT_REPLY_MASS_REPLACE',
      page_index: page_index,
      post_index: post_index,
      comment_reply:event.target.value
    });
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

        <div>
          {this.props.Post.message ? <div name="message">{this.props.Post.message.substring(0,20)}</div> : null}
          {this.props.Post.story ? <div name="story">{this.props.Post.story.substring(0,20)}</div> : null}
        </div>

        <Row>
          <Col md={3}>
            <button className="btn btn-default btn-sm" data-index={this.props.index} data-page-index={this.props.page_index} data-id={this.props.Post.id} onClick={this.handleClick} data-refresh="LOAD_MORE">LOAD MORE</button>
            <button className="btn btn-info btn-sm" data-index={this.props.index} data-page-index={this.props.page_index} data-id={this.props.Post.id} onClick={this.handleClick} data-refresh="REFRESH">REFRESH</button>
          </Col>

          <Col md={3}>
            { (this.props.Post.Comments && this.props.Post.Comments.data)
            ? <span style={boldfont}>{'Comments('+this.props.Post.Comments.data.length+' in '+latest_comment_time.diff(oldest_comment_time,'hours')+'hours)'}</span>
            : null }
          </Col>

          <Col md={2}></Col>
          <Col md={2}>
            <textarea 
              className="form-control"
              data-page-index={this.props.page_index}
              data-index={this.props.index}
              defaultValue=""
              onChange={this.handlePrivateReplyBulkChange} 
            />
          </Col>
          <Col md={2}>
            <textarea 
              className="form-control"
              data-page-index={this.props.page_index}
              data-index={this.props.index}
              defaultValue=""
              onChange={this.handleCommentReplyBulkChange} 
            />
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            { (this.props.Post.Comments && this.props.Post.Comments.data)
            ? (this.props.Post.Comments.data.map((Comment,index)=>(
                <CommentManager key={index} index={index} post_index={this.props.index} page_index={this.props.page_index} Comment={Comment}/>
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
  }


  handlePrivateReplyClick = (event) => {

    var state = rstore.getState();
    var page_index = event.target.attributes.getNamedItem('data-page-index').value;
    var post_index = event.target.attributes.getNamedItem('data-post-index').value;
    var index = event.target.attributes.getNamedItem('data-index').value;
    var post_id = state.Pages.data[page_index].Posts.data[post_index].id;
    var comment_id = state.Pages.data[page_index].Posts.data[post_index].Comments.data[index].id;
    
    var page_access_token = state.Pages.data[page_index].access_token;
    var private_reply = state.Pages.data[page_index].Posts.data[post_index].Comments.data[index].private_reply;
    var comment_reply = state.Pages.data[page_index].Posts.data[post_index].Comments.data[index].comment_reply;
    
    if(private_reply.length >= 2){
      FB.api(
        '/'+comment_id+'/private_replies?access_token='+page_access_token+'&message='+private_reply,
        'POST',
        function(response){
          if(response.id){
            rstore.dispatch({
              type:'PRIVATE_REPLY_SUBMIT_RESPONSE_SUCCESS',
              page_index:page_index,
              post_index:post_index,
              comment_index:index
            });
          }else{
            alert('Failed to send private reply...');
          }
      });

      FB.api(
        '/'+comment_id+'/comments?access_token='+page_access_token+'&message='+comment_reply,
        'POST',
        function(response){
          if(response.id){
            rstore.dispatch({
              type:'COMMENT_REPLY_SUBMIT_RESPONSE_SUCCESS',
              page_index:page_index,
              post_index:post_index,
              comment_index:index
            });
          }else{
            alert('Failed to send private reply...');
          }

      });
    }else{
      alert('Please input a longer message before sending pm');
    }
  }


  handleCommentReplyClick = (event) => {

    var state = rstore.getState();
    var page_index = event.target.attributes.getNamedItem('data-page-index').value;
    var post_index = event.target.attributes.getNamedItem('data-post-index').value;
    var index = event.target.attributes.getNamedItem('data-index').value;
    var post_id = state.Pages.data[page_index].Posts.data[post_index].id;
    var comment_id = state.Pages.data[page_index].Posts.data[post_index].Comments.data[index].id;
    
    var page_access_token = state.Pages.data[page_index].access_token;
    var private_reply = state.Pages.data[page_index].Posts.data[post_index].Comments.data[index].private_reply;
    var comment_reply = state.Pages.data[page_index].Posts.data[post_index].Comments.data[index].comment_reply;
    
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
              comment_index:index
            });
          }else{
            alert('Failed to send private reply...');
          }
      });
    }else{
      alert('Please input a longer message before sending comment');
    }

  }

  handlePrivateReplyChange = (event) => {
    var index = event.target.attributes.getNamedItem('data-index').value;
    var post_index = event.target.attributes.getNamedItem('data-post-index').value;
    var page_index = event.target.attributes.getNamedItem('data-page-index').value;

    rstore.dispatch({
      type:'PRIVATE_REPLY_CHANGE',
      page_index: page_index,
      post_index: post_index,
      comment_index: index,
      private_reply:event.target.value
    });
  }

  handleCommentReplyChange = (event) => {
    var index = event.target.attributes.getNamedItem('data-index').value;
    var post_index = event.target.attributes.getNamedItem('data-post-index').value;
    var page_index = event.target.attributes.getNamedItem('data-page-index').value;

    rstore.dispatch({
      type:'COMMENT_REPLY_CHANGE',
      page_index: page_index,
      post_index: post_index,
      comment_index: index,
      comment_reply:event.target.value
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

          <Col md={4}>
            <span name="message">{this.props.Comment.message+' '}</span>
          </Col>

          <Col md={2}>
            {this.props.Comment.can_reply_privately ? 
              <textarea
                data-page-index={this.props.page_index} 
                data-post-index={this.props.post_index}
                data-index={this.props.index}
                data-id={this.props.Comment.id}
                name="private_reply" 
                value={this.props.Comment.private_reply} 
                onChange={this.handlePrivateReplyChange}
                style={{width:'120px'}}
              /> : null}  

            {this.props.Comment.can_reply_privately ? 
              <span 
                data-page-index={this.props.page_index} 
                data-post-index={this.props.post_index}
                data-index={this.props.index}
                data-id={this.props.Comment.id} 
                onClick={this.handlePrivateReplyClick}
                style={bluefont}
              >PM</span> : null}

            {this.props.Comment.private_reply_conversation ? 
              <a href={facebook_base_url+this.props.Comment.private_reply_conversation.link} target="_blank">Messenger</a> : null}
          
            {(!this.props.Comment.can_reply_privately && !this.props.Comment.private_reply_conversation) ?
              <span>X</span> : null}

          </Col>

          <Col md={2}>
            {this.props.Comment.can_reply_privately || (this.props.Comment.comment_count ==0) ? 
              <textarea
                data-page-index={this.props.page_index} 
                data-post-index={this.props.post_index}
                data-index={this.props.index}
                data-id={this.props.Comment.id}
                name="comment_reply" 
                value={this.props.Comment.comment_reply} 
                onChange={this.handleCommentReplyChange}
                style={{width:'120px'}}
              ></textarea> : null}  

            {this.props.Comment.can_reply_privately || (this.props.Comment.comment_count ==0) ? 
              <span 
                data-page-index={this.props.page_index} 
                data-post-index={this.props.post_index}
                data-index={this.props.index}
                data-id={this.props.Comment.id} 
                onClick={this.handleCommentReplyClick}
                style={bluefont}
              >RE</span> : null}

            {(this.props.Comment.comment_count > 0) ? 
              <span>{this.props.Comment.comment_count}</span> : null}


          </Col>
        </Row>
      </section>
    );
  }
}

var rerender = function(){
  render(<AutoReplyApp state={rstore.getState()} />, document.getElementById('app'));
}
// Render the main app react component into the app div.
// For more details see: https://facebook.github.io/react/docs/top-level-api.html#react.render
rstore.subscribe(rerender);
rerender();