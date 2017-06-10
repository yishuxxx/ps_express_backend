/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.l = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };

/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};

/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};

/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 759);
/******/ })
/************************************************************************/
/******/ ({

/***/ 0:
/***/ (function(module, exports) {

// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };


/***/ }),

/***/ 165:
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {

var settings = {
	//base_dir:'/api'+((parseInt((process.env.PORT ? process.env.PORT : 3000),10)-3000) ? (parseInt((process.env.PORT ? process.env.PORT : 3000),10)-3000) : ''),		// /api
	base_dir: process.env.BASE_DIR ? process.env.BASE_DIR : '/api',
	db_host: 'localhost', //localhost
	db_name: 'sycommy_shop', //sycommy_shop
	db_user: 'sycommy_shop', //root/sycommy_shop
	db_passwd: 'Malaysiaboleh2014', //1234/Malaysiaboleh2014
	_COOKIE_KEY_: '0tN7OBGqvkmSUpHbMu7ZjszyBqeN6HO2PDKIXeENIdyHkzoFAZXbFbAh',
	fb: {
		app_id: '610601409139399', //610612705804936/610601409139399
		app_secret: 'b2dc0e4b7dd44436614eb4d72381e150', //cf682be6c2942e8af05c7a5ea13ce065/b2dc0e4b7dd44436614eb4d72381e150
		base_url: 'https://www.facebook.com/',
		graph_api_url: 'https://graph.facebook.com/v2.8'
	}
};

module.exports.settings = settings;
/*
var settings = {
	base_dir:'',		// /api
	db_host:'localhost',	//localhost
	db_name:'sycommy_shop', //sycommy_shop
	db_user:'root',	//sycommy_shop
	db_passwd:'1234',//Malaysiaboleh2014
	_COOKIE_KEY_:'0tN7OBGqvkmSUpHbMu7ZjszyBqeN6HO2PDKIXeENIdyHkzoFAZXbFbAh',
	fb:{
		app_id:'610612705804936', //610601409139399
		app_secret:'cf682be6c2942e8af05c7a5ea13ce065', //b2dc0e4b7dd44436614eb4d72381e150
		base_url:'https://www.facebook.com/',
		graph_api_url:'https://graph.facebook.com/v2.8'
	}
}

var settings = {
	base_dir:'/api'+((parseInt((process.env.PORT ? process.env.PORT : 3000),10)-3000) ? (parseInt((process.env.PORT ? process.env.PORT : 3000),10)-3000) : ''),		// /api
	db_host:'localhost',	//localhost
	db_name:'sycommy_shop', //sycommy_shop
	db_user:'sycommy_shop',	//root/sycommy_shop
	db_passwd:'Malaysiaboleh2014',//1234/Malaysiaboleh2014
	_COOKIE_KEY_:'0tN7OBGqvkmSUpHbMu7ZjszyBqeN6HO2PDKIXeENIdyHkzoFAZXbFbAh',
	fb:{
		app_id:'610601409139399', //610612705804936/610601409139399
		app_secret:'b2dc0e4b7dd44436614eb4d72381e150', //cf682be6c2942e8af05c7a5ea13ce065/b2dc0e4b7dd44436614eb4d72381e150
		base_url:'https://www.facebook.com/',
		graph_api_url:'https://graph.facebook.com/v2.8'
	}
}
*/
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(0)))

/***/ }),

/***/ 759:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _settings = __webpack_require__(165);

//import _ from 'lodash';
//import React, {Component} from 'react';
//import {render} from 'react-dom';
//import { createStore } from 'redux';
//import { Grid, Row, Col, OverlayTrigger, Tooltip } from 'react-bootstrap';
//import moment from 'moment';
//import { syDateFormat } from './Utils/Helper';
//import {Map} from 'immutable';
//import Immutable from 'seamless-immutable';

window.fbAsyncInit = function () {
  FB.init({
    appId: _settings.settings.fb.app_id,
    xfbml: false,
    version: 'v2.8'
  });
  FB.AppEvents.logPageView();
  sy.login();
};

(function (d, s, id) {
  var js,
      fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) {
    return;
  }
  js = d.createElement(s);js.id = id;
  js.src = "//connect.facebook.net/en_US/sdk.js";
  fjs.parentNode.insertBefore(js, fjs);
})(document, 'script', 'facebook-jssdk');

var store = {
  scopes: 'read_page_mailboxes,manage_pages,publish_pages,pages_show_list'
};
var sy = {};
window.store = store;
window.sy = sy;

sy.login = function () {
  setTimeout(function () {
    sy.login();
  }, 1800 * 1000);
  FB.getLoginStatus(function (response) {
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
      FB.login(function (response) {
        if (response.status === 'connected') {
          store.is_login_fb = true;
          var uid = response.authResponse.userID;
          var accessToken = response.authResponse.accessToken;
          store.uid = uid;
          store.userAccessToken = accessToken;
          sy.getPages();
        }
      }, { scopes: store.scopes });
    } else {
      FB.login(function (response) {
        if (response.status === 'connected') {
          store.is_login_fb = true;
          var uid = response.authResponse.userID;
          var accessToken = response.authResponse.accessToken;
          store.uid = uid;
          store.userAccessToken = accessToken;
          sy.getPages();
        }
      }, { scopes: store.scopes });
    }
  });
};

sy.getPages = function () {

  var url = '/me/accounts?access_token=' + store.userAccessToken;
  var callback = function callback(response) {
    if (response.data && response.data.length >= 1) {
      store.Pages = response;
      sy.getLongLivePageToken(store.Pages);
    } else {
      console.log(response);
    }
    return response;
  };

  FB.api(url, function (response) {
    callback(response);
  });
};

sy.getLongLivePageToken = function (Pages) {

  fetch(_settings.settings.base_dir + '/msg/getlongtoken', {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(Pages)
  }).then(function (res) {
    return res.json();
  }).then(function (response) {
    console.log(response);
  });
};

/***/ })

/******/ });
//# sourceMappingURL=bundle_getlongtoken.js.map