import {settings} from '../settings';
//import _ from 'lodash';
//import React, {Component} from 'react';
//import {render} from 'react-dom';
//import { createStore } from 'redux';
//import { Grid, Row, Col, OverlayTrigger, Tooltip } from 'react-bootstrap';
//import moment from 'moment';
//import { syDateFormat } from './Utils/Helper';
//import {Map} from 'immutable';
//import Immutable from 'seamless-immutable';

window.fbAsyncInit = function() {
  FB.init({
    appId      : settings.fb.app_id,
    xfbml      : false,
    version    : 'v2.8'
  });
  FB.AppEvents.logPageView();
  sy.login();
};

(function(d, s, id){
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) {return;}
  js = d.createElement(s); js.id = id;
  js.src = "//connect.facebook.net/en_US/sdk.js";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

var store = {
  scopes:'read_page_mailboxes,manage_pages,publish_pages,pages_show_list'
};
var sy = {};
window.store = store;
window.sy = sy;

sy.login = function(){
  setTimeout(function(){ sy.login(); }, 1800*1000);
  FB.getLoginStatus(function(response){
    if (response.status === 'connected') {
      store.is_login_fb = true;
      // the user is logged in and has authenticated your
      // app, and response.authResponse supplies
      // the user's ID, a valid access token, a signed
      // request, and the time the access token 
      // and signed request each expire
      var uid = response.authResponse.userID;
      var accessToken = response.authResponse.accessToken;
      store.uid = uid;
      store.userAccessToken = accessToken;
      sy.getPages();
    } else if (response.status === 'not_authorized') {
        FB.login(function(response){
          if (response.status === 'connected') {
            store.is_login_fb = true;
            var uid = response.authResponse.userID;
            var accessToken = response.authResponse.accessToken;
            store.uid = uid;
            store.userAccessToken = accessToken;
            sy.getPages();
          }
        },{scopes:store.scopes});
    } else {
        FB.login(function(response){
          if (response.status === 'connected') {
            store.is_login_fb = true;
            var uid = response.authResponse.userID;
            var accessToken = response.authResponse.accessToken;
            store.uid = uid;
            store.userAccessToken = accessToken;
            sy.getPages();
          }
        },{scopes:store.scopes});
    }
  });
}

sy.getPages = function(){

  var url = '/me/accounts?access_token='+store.userAccessToken;
  var callback = function(response){
    if(response.data && response.data.length>=1){
      store.Pages = response;
      sy.getLongLivePageToken(store.Pages);
    }else{
      console.log(response);
    }
    return response;
  }

  FB.api(url,function(response){
    callback(response);
  });

}

sy.getLongLivePageToken = function(Pages){

  fetch(settings.base_dir+'/msg/getlongtoken',{
    method: "POST",
    headers:{'Content-Type': 'application/json'},
    body: JSON.stringify(Pages)
  }).then(function (res) {
    return res.json();
  }).then(function(response){
    console.log(response);
  });

}
