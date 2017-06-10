import {settings} from '../settings';
import React, {Component} from 'react';
import {render} from 'react-dom';
import { createStore } from 'redux';
import { Grid, Row, Col, FormControl } from 'react-bootstrap';
import moment from 'moment';
import qs from 'qs';
import Promise from 'bluebird';
import Immutable from 'seamless-immutable';
import {randomString} from './Utils/Helper';

const FACEBOOK_URL = settings.fb.base_url;
const GRAPH_API_URL = settings.fb.graph_api_url;
const BASE_DIR = (window.location.pathname.match(/^(\/)(\w)+/))[0];

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

var initial_state = Immutable({Pages:[],Products:[]});

var reducer = function(state,action=null){

  switch(action.type){
    case 'PAGES_CREATE_RS':
      var Pages = state.Pages;
      var PagesLoaded = action.pages ? action.pages.data : undefined;
      if(Pages && Pages.length >= 1){
        Pages.map((Page,i)=>{
          state = Immutable.setIn(state,['Pages',i,'access_token'],PagesLoaded[i].access_token);
        });
      }else{
        state = Immutable.setIn(state,['Pages'],PagesLoaded);
      }
      break;

    case 'GET_FB_PAGE_POSTS':
      var Posts = action.Posts;
      if(Posts && Posts.length>=1){
        Posts.map((Post,i)=>{
          if(typeof Posts[i].stats === 'undefined'){
            Posts[i].stats = {
              ADD_REFRESH:0,
              ADD_PM:0,
              ADD_COMMENT:0,
              ADD_LABEL:0,
              ADD_HIDDEN:0,
              ADD_SHOWN:0
            };
          }
        });
        state = Immutable.setIn(state,['Posts'],Posts);
      }else{
        window.error_log.push(new Error('GET_FB_PAGE_POSTS Posts.length<1'))
      }
      break;

    case 'GET_FB_POSTS_COMMENTS':
      var commentss = action.comments;
      if(commentss && commentss.length>=1){
        commentss.map((comments,i)=>{
          if(typeof state.Posts[i].first_comments === 'undefined'){ // FIRST LOAD
            state = Immutable.setIn(state,['Posts',i,'first_comments'],comments);
            state = Immutable.setIn(state,['Posts',i,'comments'],comments);
          }else{
            state = Immutable.setIn(state,['Posts',i,'comments'],comments);
          }
        });
      }else{
        window.error_log.push(new Error('GET_FB_POSTS_COMMENTS commentss.length<1'))
      }
      break;

    case 'RECORD_STATISTICS':
      var post_id = action.post_id;
      var post_i = state.Posts.findIndex((Post)=>(Post.id === post_id));
      var Post = state.Posts[post_i];
      var count = Post.stats[action.stat_type] + 1;
      state = Immutable.setIn(state,['Posts',post_i,'stats',action.stat_type],count);
      break;

    case 'GET_COMMENT_COUNTS':
      state = Immutable.setIn(state,['CommentCountss'],action.CommentCountss); 
      break;

    case 'GET_PRODUCTS':
      state = Immutable.setIn(state,['Products'],action.Products);
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
        <Col md={2}>
        { this.props.state.CommentCountss && this.props.state.CommentCountss.length>=1
          ? <PostsCommentsHistory CommentCountss={this.props.state.CommentCountss} />
          : null
        }
        </Col>
        </Row>
      </section>
    );
  }
}

class AutoPMSetup extends Component{
  constructor(props,context) {
    super(props,context);
    this.state = {config:props.config,started:false,last_refresh_time:undefined,counting_comments:false};
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
      this.startAutoPM(this.state.config);
    }
  }

  startAutoPM = (input) =>{
    var that = this;
    console.log(input);
    var config;
    var post_configs;
    try{
      config = configFillDefaults(JSON.parse(input));
      config = postConfigFillDefaults(config);
      post_configs = config.DEFAULT.post_configs;
    }catch(err){
      if(err instanceof Error){
        alert(err.message);
      }else{
        alert(err);
      }
    };

    var post_ids = post_configs.map((post_config)=>(post_config.post_id));
    var pid;
    var page_i;
    var PAGE_ACCESS_TOKEN;

    console.log('post_configs');
    console.log(post_configs);

    function loopGetCommentsDoJob(PAGE_ACCESS_TOKEN,config){
      var mode = checkSchedule(config.schedule,moment());
      console.log('MODE='+mode);
      var general = config[mode].general;
      var post_configs = config[mode].post_configs;

      return getCommentsAndDoJob(PAGE_ACCESS_TOKEN,general,post_configs)
      .then(function(comments){
        that.setState({last_refresh_time:moment().format('YYYY-MM-DD HH:mm:ss')});
        rstore.dispatch({
          type:'GET_FB_POSTS_COMMENTS',
          comments: comments
        });
        rerender();
      }).then(function(success){
        return setDelay(general.scanning_interval);
      }).then(function(success){
        if(that.started === false){
          console.log('HOW DID THAT FUCKER RETURNED EARLY');
          that.autobot_started = false;
          return true;
        }
        return loopGetCommentsDoJob(PAGE_ACCESS_TOKEN,config);
      }).catch(function(err){
        if(err instanceof Error && err.message === 'ErrorFacebookTokenExpired'){
          return gsetUserLoginAndPage()
          .then(function(success){
            PAGE_ACCESS_TOKEN = rstore.getState().Pages[page_i].access_token;
            return setDelay(3000)
            .then(function(success){
              return loopGetCommentsDoJob(PAGE_ACCESS_TOKEN,config)
            });
          });
        }else{
          window.error_log.push(err);
          return setDelay(3000)
          .then(function(success){
            return loopGetCommentsDoJob(PAGE_ACCESS_TOKEN,config)
          });
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

      return loopGetCommentsDoJob(PAGE_ACCESS_TOKEN,config);
    }).then(function(success){
      console.log('STOPPED AUTO REPLYING');
    })
  }

  handleGetCommentCount = (event) => {
    var that = this;
    var config = JSON.parse(this.state.config);

    var post_configs = config.DEFAULT.post_configs;
    var post_ids = post_configs.map((post_config)=>(post_config.post_id));
    var post_names = post_configs.map((post_config)=>(post_config.name));

    var pid = post_ids[0].split('_')[0];
    var page_i = rstore.getState().Pages.findIndex((Page)=>(Page.id === pid));
    var PAGE_ACCESS_TOKEN = rstore.getState().Pages[page_i].access_token;

    Promise.mapSeries(post_ids,function(post_id,i){
      that.setState({counting_comments:true});
      var limit = 100;
      var uri = 'https://graph.facebook.com/v2.8/'+post_id+'/comments';
      var qparams = {
        access_token: PAGE_ACCESS_TOKEN,
        limit: limit,
        order: 'reverse_chronological',
        fields: 'id,message,created_time,from'
      };

      var options = {max_rows:1000,matchFunc:(x,i)=>{
        return moment(x.created_time).diff(moment().subtract(7,'d'),'days') < 0;
      }};

      return fbRequestIterator(PAGE_ACCESS_TOKEN,uri,qparams,options)
      .then(function(data){
        var CommentCounts = countComment(data);
        CommentCounts.sort(dateCompare);
        CommentCounts.pop();
        return {post_id:post_id,post_name:post_names[i],CommentCounts:CommentCounts};
      });

    }).then(function(CommentCountss){
      that.setState({counting_comments:false});
      console.log(CommentCountss);
      rstore.dispatch({
        type:'GET_COMMENT_COUNTS',
        CommentCountss:CommentCountss
      });
      rerender();
    });
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
        <button className="btn btn-info" onClick={this.handleGetCommentCount} disabled={this.state.counting_comments}>{this.state.counting_comments ? 'COUNTING...' : 'COUNT COMMENTS'}</button>
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
    var last_7 = [];
    (()=>{
      for(var i=0;i<7;i++){
        last_7[i] = moment().subtract(i, 'day').format('YYYY-MM-DD');
      }
    })();

    return(
      <table className="table table-bordered PostCommentsHistory">
      <tbody>
        {this.props.CommentCountss.map((CommentCounts)=>(
          <tr key={'CommentCountss_'+CommentCounts.post_id}>
            <td key={'CommentCountss_td_'+CommentCounts.post_id}>{CommentCounts.post_name ? CommentCounts.post_name : CommentCounts.post_id}</td>
            {last_7.map((day)=>{
              var count = 0;
              CommentCounts.CommentCounts.map((CommentCount)=>{
                if(CommentCount.date.substring(0,10) === day){
                  count = CommentCount.count;
                }
              });
              return <td key={'CommentCountss_td_'+CommentCounts.post_id+'_'+day}>{count}</td>
            })}
          </tr>
        ))}
      </tbody>
      </table>
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

function getFBPostsComments(PAGE_ACCESS_TOKEN,post_ids,limit=25){
  var batch = [];

  var qparams = {
    limit:limit,
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

function getFBComments(PAGE_ACCESS_TOKEN,comment_ids){
  var batch = [];
  var qparams = {
    fields:'id,created_time,message,private_reply_conversation'
  }
  comment_ids.map((comment_id,i)=>{
    var uri = comment_id;
    batch[i] = {method:'GET',relative_url:uri+'?'+qs.stringify(qparams)};
  });

  return fbAPIRequestBatcher(PAGE_ACCESS_TOKEN,batch)
  .then(function(responses){
    return responses;
  });
}

/*
function getFBPostsAndAttachmentComments(PAGE_ACCESS_TOKEN,post_ids,limit=25){
  getFBPosts(PAGE_ACCESS_TOKEN,post_ids)
  .then(function(responses){
    if(responses && responses.length>=2){

    }else{
      window.error_log.push(new Error('getFBPosts, No Posts Found'))
      throw new Error('getFBPosts, No Posts Found');
    }
    return getFBPostsComments(PAGE_ACCESS_TOKEN,post_and_attachment_ids,limit);
  }).then(function(responses){
    return responses;
  });
}
*/
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
    }
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

function getCommentsAndDoJob(PAGE_ACCESS_TOKEN,general,post_configs){
  var post_ids = post_configs.map((post_config)=>(post_config.post_id));
  var message_interval = general.message_interval;
  var get_comment_limit = general.get_comment_limit;

  var do_hides = [];
  var do_hide_ids = [];

  var pm_messages = [];
  var pm_message_ids = [];
  var pm_id_products = [];
  var pm_post_ids = [];
  var pm_t_mids = [];

  var comment_messages = [];
  var comment_message_ids = [];
  var label_ids = [];
  var label_id_ids = [];
  
  
  var r = {};

  return getFBPostsComments(PAGE_ACCESS_TOKEN,post_ids,get_comment_limit)
  .then(function(responses){
    console.log('getFBPostsComments on '+moment().format('YYYY-MM-DD HH:mm:ss'));
    //console.log(responses);
    r.comments = responses;

    responses.map((comment,j)=>{
      if(comment.error && comment.error.code === 190 /*&& comment.error.error_subcode === 463*/){
        throw new Error('ErrorFacebookTokenExpired');
      }
      var post_config = post_configs[j];

      comment.data.map((Comment,i)=>{
        if(typeof post_config.unhide === 'number'){
          if(Comment.can_hide && Comment.is_hidden && i < post_config.unhide && post_config.do_show){
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
            if(general.do_product_tag){
              pm_id_products.push((post_config.id_product ? post_config.id_product : undefined));
              pm_post_ids.push(post_config.post_id);
            }

            comment_messages.push(post_config.comment_message);
            comment_message_ids.push(Comment.id);
            recordStatistics(post_config.post_id,'ADD_PM');
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
    });

    if(do_hides && do_hides.length>=1){
      return postCommentVisibilities(PAGE_ACCESS_TOKEN,do_hide_ids,do_hides);
    }else{
      return true;
    }
  }).then(function(response){
    if(response !== true){
      console.log('postCommentVisibilities');    
      console.log(response);
    }

    if(pm_messages && pm_messages.length>=1){
      return postPrivateReplies(PAGE_ACCESS_TOKEN,pm_message_ids,pm_messages,message_interval);
    }else{
      return true;
    }
  }).then(function(response){
    if(response !== true){
      console.log('postPrivateReplies');
      console.log(response);
    }

    if(comment_messages && comment_messages.length>=1){
      return postCommentComments(PAGE_ACCESS_TOKEN,comment_message_ids,comment_messages,message_interval);
    }else{
      return true;
    }
  }).then(function(response){
    if(response !== true){
      console.log('postCommentComments');
      console.log(response);
    }

    if(label_ids && label_ids.length>=1){
      return postFBLabels(PAGE_ACCESS_TOKEN,label_ids,label_id_ids);
    }else{
      return true;
    }
  }).then(function(response){
    if(response !== true){
      console.log('postFBLabels');
      console.log(response);
    }

    if(pm_id_products && pm_id_products.length>=1){
      return getFBComments(PAGE_ACCESS_TOKEN,pm_message_ids);
    }else{
      return true
    }
  }).then(function(response){
    if(response !== true){
      console.log('getFBComments');
      console.log(response);
    }

    if(pm_id_products && pm_id_products.length>=1 && response && response.length){
      var Comments = response;
      Comments.map((Comment)=>{
        pm_t_mids.push(Comment.private_reply_conversation.id);
      });
      console.log('$$$ pm_t_mids');
      console.log(pm_t_mids);
      return sendPMToServer(pm_post_ids,pm_message_ids,pm_id_products,pm_t_mids);
    }else{
      return true;
    }
  }).then(function(response){
    if(response !== true){
      console.log('sendPMToServer');
      console.log(response);
    }

    return r.comments;
  });
}

function sendPMToServer(post_ids,comment_ids,id_products,t_mids){
  if(  comment_ids.length === post_ids.length 
    && comment_ids.length === id_products.length
    && comment_ids.length === t_mids.length
  ){
    var pid = post_ids[0].split('_')[0];
    var payload = [];
    comment_ids.map((comment_id,i)=>{
      payload.push({
        comment_id:comment_id,
        post_id:post_ids[i],
        id_product:id_products[i],
        t_mid:t_mids[i]
      });
    });
    return fetch(BASE_DIR+'/msg/autopmpm?pid='+pid,{
      method:'POST',
      headers:{"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    }).then((res)=>(res.json()));
  }else{
    throw new Error('sendPMToServer arrays do not have same length ')
  }
}

function testSendPMToServer(){
  var pid = 1769068019987617;
  var payload = [
    {"comment_id":"1981784442049306_103882440211687","post_id":"1769068019987617_1981784442049306","t_mid":"t_mid.$cAAZI9X94O2timanPGFcaGSGTVOc-"},
    {"comment_id":"1976333992594351_1360589567343840","post_id":"1769068019987617_1976333992594351","t_mid":"t_mid.1467031764365:82dfc744321b86d547"},
    {"comment_id":"1958690941025323_431494393886746","post_id":"1769068019987617_1958690941025323","t_mid":"t_mid.$cAAYSARAN96timanrxFcaGSjYAiPa"},
    {"comment_id":"1958690941025323_133819833841689","post_id":"1769068019987617_1958690941025323","t_mid":"t_mid.$cAAYSAd8-rXdiman5llcaGSxQTKLW"},
    {"comment_id":"1958690941025323_133819667175039","post_id":"1769068019987617_1958690941025323","t_mid":"t_mid.$cAAYSBmbbvKdimaoIB1caGS_Qu4vx"},
    {"comment_id":"1908666439361107_1323006061154127","post_id":"1769068019987617_1908666439361107","t_mid":"t_mid.$cAAYSA00m63ZimaoYCVcaGTPJ7Chc"},
    {"comment_id":"1908666439361107_1703817546588785","post_id":"1769068019987617_1908666439361107","t_mid":"t_mid.$cAAYSBl6haTRimaom0VcaGTee8N4q"}
  ];

  return fetch(BASE_DIR+'/msg/autopmpm?pid='+pid,{
    method:'POST',
    headers:{"Content-Type": "application/json"},
    body: JSON.stringify(payload),
  }).then((res)=>(res.json()));
}
window.testSendPMToServer = testSendPMToServer;

function shouldPM(message){
  if(message.toLowerCase().indexOf('pm') !== -1){
    return true;
  }else{
    return true;
  }
}

function configFillDefaults(config){
  for(var name in config){
    if(name !== 'schedule'){
      if(typeof config[name].general === 'undefined'){
        config[name].general = {};
      }
      if(typeof config[name].general.scanning_interval === 'undefined'){
        config[name].general.scanning_interval = 5000;
      }
      if(typeof config[name].general.message_interval === 'undefined'){
        config[name].general.message_interval = 3000;
      }
      if(typeof config[name].general.get_comment_limit === 'undefined'){
        config[name].general.get_comment_limit = 25;
      }
      if(typeof config[name].general.do_product_tag === 'undefined'){
        config[name].general.do_product_tag = false;
      }
    }
  }

  return config;
}

function postConfigFillDefaults(config){

  for(var name in config){
    if(name !== 'schedule'){
      var post_config_default = config[name].post_config_default;

      config[name].post_configs.map((post_config,i)=>{
        if(typeof post_config.do_pm === 'undefined'){
          post_config.do_pm = post_config_default.do_pm;
        }
        if(typeof post_config.unhide === 'undefined'){
          post_config.unhide = post_config_default.unhide;
        }
        if(typeof post_config.comment_message === 'undefined'){
          post_config.comment_message = post_config_default.comment_message;
        }
        if(typeof post_config.pm_message === 'undefined'){
          post_config.pm_message = post_config_default.pm_message;
        }
        if(typeof post_config.unable_pm_comment_message === 'undefined'){
          post_config.unable_pm_comment_message = post_config_default.unable_pm_comment_message;
        }
        if(typeof post_config.label_id === 'undefined'){
          post_config.label_id = post_config_default.label_id;
        }
        if(typeof post_config.do_show === 'undefined'){
          post_config.do_show = post_config_default.do_show;
        }

        if(typeof post_config.reference === 'string'){
          var id_product = referenceToIdProduct(post_config.reference);
          if(id_product !== -1){
            post_config.id_product = id_product;
          }else{
            alert('Product Reference does not Exist.\n product_reference='+post_config.reference);
            //throw new Error('Product Reference does not Exist.\n product_reference='+post_config.reference);
          }
        }
      });
    }
  }

  return config;
} 

function recordStatistics(post_id,stat_type){
  rstore.dispatch({
    type:'RECORD_STATISTICS',
    post_id:post_id,
    stat_type:stat_type
  });
}

function checkSchedule(schedule,current_moment){
  var mode = 'DEFAULT';
  if(schedule && schedule.length>=1){
    schedule.map((shift)=>{
      if(shift.end_time <= shift.start_time){
        alert('END TIME <= START TIME');
      }else{
        var current_time = current_moment.format('HH:mm:ss');
        if(current_time >= shift.start_time && current_time <= shift.end_time){
          mode = shift.mode;
        }
      }
    });
  }
  return mode; 
}

function getProducts(){
  return fetch(BASE_DIR+'/msg/products',{
    method:'GET',
    headers:{"Content-Type":"application/x-www-form-urlencoded"},
  }).then((res)=>(res.json()))
  .then(function(response){
    if(response && response.length >= 1){
      return response;
    }else{
      throw new Error('Fetched Empty results');
    }
  });
}

function referenceToIdProduct(reference){
  var Products = rstore.getState().Products;
  var index = Products.findIndex((Product)=>(Product.reference === reference));
  if(index !== -1){
    return Products[index].id_product;
  }else{
    return -1;
  }
}

window.error_log = [];

getProducts()
.then(function(Products){
  rstore.dispatch({
    type:'GET_PRODUCTS',
    Products:Products
  });
});