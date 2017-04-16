module.exports = function Msg(express,request,rq,crypto,settings,Sequelize,sequelize,io) {

	var router = express.Router();
	this.router = router;

	// middleware that is specific to this router
	/*
	router.use('/',function (req, res, next) {
	  console.log('Time: ', Date.now())
	  next()
	});
	*/

	const APP_ID = "610612705804936";
	const APP_SECRET = "cf682be6c2942e8af05c7a5ea13ce065";
	// Arbitrary value used to validate a webhook
	const VALIDATION_TOKEN = "TheOneAndOnlyToken";
	// Generate a page access token for your page from the App Dashboard
	const PAGE_ACCESS_TOKEN = "EAAIrWVlswogBAG38edlWENOvy3sVtYJZC7qIMGdCMPP0FdWZBMIyvVzaZByLxtB44PNZC3CPlWSULQEo7oL481jB0ZBF0oYXmOruQQAgyIzDp6Unrl9aHjaSWnumKTyBh7XvHQQeu0mqd7Bv2FLkKGpBiZCYeCtHHH8STvYISMsgZDZD";

	// URL where the app is running (include protocol). Used to point to scripts and 
	// assets located at this address. 
	const SERVER_URL = "https://www.sy.com.my/api/msg/";

	if (!(APP_SECRET && VALIDATION_TOKEN && PAGE_ACCESS_TOKEN && SERVER_URL)) {
	  console.error("Missing config values");
	  process.exit(1);
	}

	//var {FBUserFunc} = require('.src/models/FBUser');
	//var FBUser = FBUserFunc(Sequelize,sequelize);
	var {FBMessageFunc} = require('../src/models/FBMessage');
	var FBMessage = FBMessageFunc(Sequelize,sequelize);
	var {FBCommentFunc} = require('../src/models/FBComment');
	var FBComment = FBCommentFunc(Sequelize,sequelize);
	var {FBConversationFunc} = require('../src/models/FBConversation');
	var FBConversation = FBConversationFunc(Sequelize,sequelize);
	var {FBPageFunc} = require('../src/models/FBPage');
	var FBPage = FBPageFunc(Sequelize,sequelize);

	var PAGE_ACCESS_TOKEN_;
	var initialize = function(){
		return FBPage.findAll()
		.then(function(FBPages){
			var list = {};
			if(FBPages && FBPages.length >= 1){
				FBPages.map(function(FBPage,i){
					list[FBPage.pid] = FBPage.access_token_long;
				});
			}
			PAGE_ACCESS_TOKEN_ = list;
		});
	}
	initialize();

	var numUsers = 0;
	io.on('connection', function (socket) {
	  console.log('connected to socket client');
	  var addedUser = false;

	  // when the client emits 'new message', this listens and executes
	  socket.on('new message', function (data) {
	    // we tell the client to execute 'new message'
	    console.log('new message');
	    console.log(data);
	    
	    var psid;
	    FBConversation.findOne({
	    	where:{t_mid:data.t_mid}
	    }).then(function(Instance){
	    	var FBConversation = Instance;
	    	if(FBConversation){
	    		psid = FBConversation.psid ? FBConversation.psid : null;
	    		if(psid){
	    			return psid;
	    		}
	    	}
	    }).then(function(psid){
		    socket.broadcast.emit('new message', {
		      username: socket.username,
		      message: data.text
		    });
			sendTextMessage(psid, data.text);
	    });
		

	  });

	  // when the client emits 'add user', this listens and executes
	  socket.on('add user', function (username) {
	    if (addedUser) return;

	    // we store the username in the socket session for this client
	    socket.username = username;
	    ++numUsers;
	    addedUser = true;
	    socket.emit('login', {
	      numUsers: numUsers
	    });
	    // echo globally (all clients) that a person has connected
	    socket.broadcast.emit('user joined', {
	      username: socket.username,
	      numUsers: numUsers
	    });
	  });

	  // when the client emits 'typing', we broadcast it to others
	  socket.on('typing', function () {
	    socket.broadcast.emit('typing', {
	      username: socket.username
	    });
	  });

	  // when the client emits 'stop typing', we broadcast it to others
	  socket.on('stop typing', function () {
	    socket.broadcast.emit('stop typing', {
	      username: socket.username
	    });
	  });

	  // when the user disconnects.. perform this
	  socket.on('disconnect', function () {
	    if (addedUser) {
	      --numUsers;

	      // echo globally that this client has left
	      socket.broadcast.emit('user left', {
	        username: socket.username,
	        numUsers: numUsers
	      });
	    }
	  });

	  socket.on('messenger', function(){

	  	if (messageText) {

		    // If we receive a text message, check to see if it matches any special
		    // keywords and send back the corresponding example. Otherwise, just echo
		    // the text we received.
		    switch (messageText) {
		      case 'image':
		        sendImageMessage(senderID);
		        break;

		      case 'gif':
		        sendGifMessage(senderID);
		        break;

		      case 'audio':
		        sendAudioMessage(senderID);
		        break;

		      case 'video':
		        sendVideoMessage(senderID);
		        break;

		      case 'file':
		        sendFileMessage(senderID);
		        break;

		      case 'button':
		        sendButtonMessage(senderID);
		        break;

		      case 'generic':
		        sendGenericMessage(senderID);
		        break;

		      case 'receipt':
		        sendReceiptMessage(senderID);
		        break;

		      case 'quick reply':
		        sendQuickReply(senderID);
		        break;        

		      case 'read receipt':
		        sendReadReceipt(senderID);
		        break;        

		      case 'typing on':
		        sendTypingOn(senderID);
		        break;        

		      case 'typing off':
		        sendTypingOff(senderID);
		        break;        

		      case 'account linking':
		        sendAccountLinking(senderID);
		        break;

		      default:
		        sendTextMessage(senderID, messageText);
		   	}
	   	}
	  })
	});

	router.get('/bulk2',function(req,res){
		res.render('bulk_immutable');
	})

	router.get('/getlongtoken',function(req, res){
	  res.render('getlongtoken');
	});

	router.post('/getlongtoken',function(req, res){
		var q = req.body;
		var Pages = q.data;
		var FBPages = [];
		var promises = [];
		console.log(Pages);
		Pages.map(function(Page,i){
			promises.push(
				FBPage.findOrCreate({
					where:{ pid:Page.id },
					defaults:{
						pid:Page.id,
						name:Page.name,
						access_token:Page.access_token
					}
				})
			);
		});

		Sequelize.Promise.all(promises)
		.then(function(Instances){
			FBPages = Instances;
			for(var i=0;i<FBPages.length;i++){
				FBPages[i] = FBPages[i][0];
				console.log('FOUND/CREATED PAGE ID = '+FBPages[i].pid);
			}

			var promises = [];
			FBPages.map((FBPage,i)=>{
				promises.push(
					rq({
						uri: 'https://graph.facebook.com/v2.8/oauth/access_token',
						qs: { 
							grant_type:'fb_exchange_token',
							client_id:settings.fb.app_id,
							client_secret:settings.fb.app_secret,
							fb_exchange_token:FBPage.access_token
						},
						method: 'GET',
						json: {}
					})
				);
			})

			return Sequelize.Promise.all(promises);

		}).then(function(Bodys){
			res.send({Bodys});
			var promises = [];

			FBPages.map((FBPage,i)=>{
				FBPage.access_token_long = Bodys[i].access_token;
				FBPage.expires_in = Bodys[i].expires_in;
				promises.push(FBPage.save())
			});
			return Sequelize.Promise.all(promises);
			
		}).then(function(Instances){
			if(Instances){
				Instances.map((Instance,i)=>{
					console.log('SAVED LONG LIVE TOKEN #'+i+' --- '+Instance.access_token_long);
				})
			}
		}).catch(function(err){
			console.log(err);
		})
	});

	router.get('/reconcile',function(req,res){
	  var Conversation;
	  fbLoadAll(req,res,Conversation,null);
	});

	function fbLoadAll(req,res,Conversation={},nextPageURL=null){
	  var uri = 'https://graph.facebook.com/v2.8/'+req.query.t_mid+'/messages';
	  var qs = { 
	    access_token:PAGE_ACCESS_TOKEN_['1661200044095778'],
	    fields:'id,created_time,from,to,message,attachments',
	    limit:25
	  };

	  request({
	    uri: (nextPageURL ? nextPageURL : uri),
	    qs: (nextPageURL ? null : qs),
	    method: 'GET'
	  }, function (error, response, body) {
	    //error ? console.log(error) : console.log(body);
	    body = JSON.parse(body);
	    if(body){
	      if(body.data && !Conversation.data){
	        Conversation = body;
	      }
	      if(Conversation.data && Conversation.data.length >= 1 && body.paging && body.paging.next){
	        Conversation.data = Conversation.data.concat(body.data);
	        Conversation.paging = body.paging;
	      }
	      if(body.paging && (body.paging.next != undefined) ){
	        console.log('############################## RECURSIVE');
	        fbLoadAll(req,res,Conversation,body.paging.next);
	      }else{
	        res.send(Conversation);
	        console.log('############################## ENDED');
	        var mids = [];
	        Conversation.data.map(function(Message,index){
	          mids.push(Message.id.substring(2,Message.id.length));
	        });
	        FBMessage.findAll({
	          where:{mid:mids}
	        }).then(function(FBMessages){
	          if(FBMessages && FBMessages.length >= 1){ //IF any message is sent or delivered before through messenger platform
	            var psid_recipient  = FBMessages[0].psid_recipient;
	            var psid_sender = FBMessages[0].psid_sender;
	          }else{ // trigger a webhook call for messenger platform...

	          }
	        }).catch(function(err){
	          console.log(err);
	        });
	      }
	    }else{
	      console.log(error);
	    }

	  });
	}

  function nextFBRequest(resolve,reject,queryParams,r,breakCondition) {

		function getNextFBRequest(queryParams,r={data:[]},breakCondition) {

			if(r.data.length === 0){
				uri = queryParams.uri;
				qs = queryParams.qs;
			}else{
				if(r.paging.next){
					uri = r.paging.next;
					qs = null;
				}else if(r.paging.cursors){
					uri = queryParams.uri;
					qs = queryParams.qs;
					qs.after = r.paging.cursors.after;
				}else{
					throw new Error('Paging of Facebook Response is not recognized');
				}
				
			}

		  return rq({
		    uri: uri,
		    qs: qs,
		    method: 'GET'
		  }).then(function (res) {

		    response = JSON.parse(res);

	      if(response.data && response.data.length>=1){

	        r.data = r.data.concat(response.data);
	        r.paging = response.paging;
	        r.continue = true;
	        r = breakCondition(r,response);

	      }else if(response.data && response.data.length === 0){

	        r.data = r.data;
	        r.paging = response.paging;
	        r.continue = false;

	      }else if(response.error){

	      	throw new Error(response.error.message);

	    	}else{

	      	throw new Error("Unexpected Facebook response");

	      }
	      return r;

		  }).catch(function(err){
		    throw err;
		  });
		}

    getNextFBRequest(queryParams,r,breakCondition)
    .then(function(r) {
        if (!r.continue) { 
            resolve(r);
        } else {
    				console.log('r.data.length ============ '+r.data.length);
    				console.log(r.paging);
            nextFBRequest(resolve,reject,queryParams,r,breakCondition);
        }
    }, reject);
  }

	router.get('/countcomments',function(req,res){

		var pid = req.query.page_id;
		var post_id = req.query.post_id;
		var PAGE_ACCESS_TOKEN = PAGE_ACCESS_TOKEN_[pid];

	  var uri = 'https://graph.facebook.com/v2.8/'+post_id+'/comments';
	  var qs = {
	    access_token:PAGE_ACCESS_TOKEN,
	    fields:'id,created_time,from,message,can_reply_privately,can_comment,can_hide,can_remove,comment_count',
	    limit:100,
	    order:'reverse_chronological'
	  };

	  new Sequelize.Promise(function(resolve, reject) {

	      // start first iteration of the loop
	      nextFBRequest(resolve,reject,{uri:uri,qs:qs},{data:[]},function(r,response){
	      	
	      	var list = response.data;
	      	list.map((item,i)=>{
	      		item.id === '' ? r.continue = false : null;
	      	});

	      	return r;
	      });

		}).then(function(r) {
	      // process results here
	      var promises = [];
	      r.data.map((Comment2,index)=>{
	        var Comment = r.data[r.data.length-1-index];
	        promises.push(
	          FBComment.findOrCreate({
	            where:{comment_id:Comment.id},            
	            defaults:{
	              created_time:Comment.created_time,
	              comment_id:Comment.id,
	              post_id:post_id,
	              uid:Comment.from.id,
	              tid:null,
	              message:Comment.message,
	              can_reply_privately:Comment.can_reply_privately,
	              can_comment:Comment.can_comment,
	              can_hide:Comment.can_hide,
	              can_remove:Comment.can_remove,
	              comment_count:Comment.comment_count
	            }
	          })
	        );
	      });
	      return Sequelize.Promise.all(promises);
	  }).then(function(Instances){

	      console.log('END OF INSERTING');
	      return sequelize.query(
	        ` SELECT DATE(DATE_ADD(created_time,INTERVAL 8 HOUR)) as created_date, COUNT(id) as count 
	          FROM fb_comment
	          WHERE post_id=:post_id 
	          GROUP BY created_date`,
	      {replacements:{post_id:post_id},type:sequelize.QueryTypes.SELECT});
	  }).then(function(rows){

	      res.send(rows);
	  }).catch(function(err) {

	      console.log(err);
	  });

	});


  function nextFBRequest(resolve,reject,queryParams,r,breakCondition) {

		function getNextFBRequest(queryParams,r={data:[]},breakCondition) {

			if(r.data.length === 0){
				uri = queryParams.uri;
				qs = queryParams.qs;
			}else{
				if(r.paging.next){
					uri = r.paging.next;
					qs = null;
				}else if(r.paging.cursors){
					uri = queryParams.uri;
					qs = queryParams.qs;
					qs.after = r.paging.cursors.after;
				}else{
					throw new Error('Paging of Facebook Response is not recognized');
				}
				
			}

		  return rq({
		    uri: uri,
		    qs: qs,
		    method: 'GET'
		  }).then(function (res) {

		    response = JSON.parse(res);

	      if(response.data && response.data.length>=1){

	        r.data = r.data.concat(response.data);
	        r.paging = response.paging;
	        r.continue = true;
	        r = breakCondition(r,response);

	      }else if(response.data && response.data.length === 0){

	        r.data = r.data;
	        r.paging = response.paging;
	        r.continue = false;

	      }else if(response.error){

	      	throw new Error(response.error.message);

	    	}else{

	      	throw new Error("Unexpected Facebook response");

	      }
	      return r;

		  }).catch(function(err){
		    throw err;
		  });
		}

    getNextFBRequest(queryParams,r,breakCondition)
    .then(function(r) {
        if (!r.continue) { 
            resolve(r);
        } else {
    				console.log('r.data.length ============ '+r.data.length);
    				console.log(r.paging);
            nextFBRequest(resolve,reject,queryParams,r,breakCondition);
        }
    }, reject);
  }


	router.get('/getconv',function(req,res){

		var pid = req.query.pid;
		var PAGE_ACCESS_TOKEN = PAGE_ACCESS_TOKEN_[pid];

	  new Sequelize.Promise(function(resolve, reject) {

			  var uri = 'https://graph.facebook.com/v2.8/'+pid+'/conversations';
			  var qs = { 
			    access_token:PAGE_ACCESS_TOKEN,
			    fields:'senders',
			    limit:100
			  };

	      // start first iteration of the loop
	      nextFBRequest(resolve,reject,{uri:uri,qs:qs},{data:[]},function(r,response){
	      	
	      	var list = response.data;
	      	list.map((item,i)=>{
	      		item.id === '' ? r.continue = false : null;
	      	});

	      	return r;
	      });
  	}).then(function(r){
  		res.send({success:true,r:r});
  	})

	});


	router.get('/getmessages',function(req,res){

		if(!req.query.pid || !req.query.t_mid){
			res.send({success:false,message:'Missing Query Parameters'});
			return null;
		}

		var pid = req.query.pid;
		var t_mid = req.query.t_mid;
		var PAGE_ACCESS_TOKEN = PAGE_ACCESS_TOKEN_[pid];

	  var uri = 'https://graph.facebook.com/v2.8/'+t_mid+'/messages';
	  var qs = { 
	    access_token:PAGE_ACCESS_TOKEN,
	    fields:'message',
	    limit:100
	  };

	  new Sequelize.Promise(function(resolve, reject) {

	      // start first iteration of the loop
	      nextFBRequest(resolve,reject,{uri:uri,qs:qs},{data:[]},function(r,response){
	      	
	      	var list = response.data;
	      	list.map((item,i)=>{
	      		item.id === '' ? r.continue = false : null;
	      	});

	      	return r;
	      });
  	}).then(function(r){
  		res.send({success:true,r:r});
  	})

	});


	router.get('/getcomments',function(req,res){

		if(!req.query.pid || !req.query.post_id){
			res.send({success:false,message:'Missing Query Parameters'});
			return null;
		}

		var pid = req.query.pid;
		var post_id = req.query.post_id;
		var PAGE_ACCESS_TOKEN = PAGE_ACCESS_TOKEN_[pid];

	  var uri = 'https://graph.facebook.com/v2.8/'+post_id+'/comments';
	  var qs = { 
	    access_token:PAGE_ACCESS_TOKEN,
	    fields:'id',
	    limit:100
	  };

	  new Sequelize.Promise(function(resolve, reject) {

	      // start first iteration of the loop
	      nextFBRequest(resolve,reject,{uri:uri,qs:qs},{data:[]},function(r,response){
	      	
	      	var list = response.data;
	      	list.map((item,i)=>{
	      		item.id === '' ? r.continue = false : null;
	      	});

	      	return r;
	      });
  	}).then(function(r){
  		res.send({success:true,r:r});
  	})

	});


	router.get('/getposts',function(req,res){

		if(!req.query.pid || !req.query.pid){
			res.send({success:false,message:'Missing Query Parameters'});
			return null;
		}

		var pid = req.query.pid;
		//var post_id = req.query.post_id;
		var PAGE_ACCESS_TOKEN = PAGE_ACCESS_TOKEN_[pid];

	  var uri = 'https://graph.facebook.com/v2.8/'+pid+'/posts';
	  var qs = { 
	    access_token:PAGE_ACCESS_TOKEN,
	    fields:'',
	    limit:100
	  };

	  new Sequelize.Promise(function(resolve, reject) {

	      // start first iteration of the loop
	      nextFBRequest(resolve,reject,{uri:uri,qs:qs},{data:[]},function(r,response){
	      	
	      	var list = response.data;
	      	list.map((item,i)=>{
	      		item.id === '' ? r.continue = false : null;
	      	});

	      	return r;
	      });
  	}).then(function(r){
  		res.send({success:true,r:r});
  	})

	});


// MESSENGER SAMPLE FUNCTIONS

	router.get('/webhook', function(req, res) {
	  if (req.query['hub.mode'] === 'subscribe' &&
	      req.query['hub.verify_token'] === VALIDATION_TOKEN) {
	    console.log("Validating webhook");
	    res.status(200).send(req.query['hub.challenge']);
	  } else {
	    console.error("Failed validation. Make sure the validation tokens match.");
	    res.sendStatus(403);          
	  }  
	});

	router.post('/webhook', function (req, res) {
	  var data = req.body;
	  console.log(data);

	  // Make sure this is a page subscription
	  if (data.object == 'page') {
	    // Iterate over each entry
	    // There may be multiple if batched
	    data.entry.forEach(function(pageEntry) {
	      var pageID = pageEntry.id;
	      var timeOfEvent = pageEntry.time;

	      // Iterate over each messaging event
	      if(pageEntry.messaging){

	        pageEntry.messaging.forEach(function(messagingEvent) {
	          if (messagingEvent.optin) {
	            receivedAuthentication(messagingEvent);
	          } else if (messagingEvent.message) {
	            receivedMessage(messagingEvent);
	          } else if (messagingEvent.delivery) {
	            receivedDeliveryConfirmation(messagingEvent);
	          } else if (messagingEvent.postback) {
	            receivedPostback(messagingEvent);
	          } else if (messagingEvent.read) {
	            receivedMessageRead(messagingEvent);
	          } else if (messagingEvent.account_linking) {
	            receivedAccountLink(messagingEvent);
	          } else {
	            console.log("Webhook received unknown messagingEvent: ", messagingEvent);
	          }
	        });
	      }else{

	        console.log('\x1b[36m%s\x1b[0m','this is not a messaging update');
	        console.log('\x1b[36m%s\x1b[0m',pageEntry);
	      }
	    });

	    // Assume all went well.
	    //
	    // You must send back a 200, within 20 seconds, to let us know you've 
	    // successfully received the callback. Otherwise, the request will time out.
	    res.sendStatus(200);
	  }
	});

	/*
	 * This path is used for account linking. The account linking call-to-action
	 * (sendAccountLinking) is pointed to this URL. 
	 * 
	 */
	router.get('/authorize', function(req, res) {
	  var accountLinkingToken = req.query.account_linking_token;
	  var redirectURI = req.query.redirect_uri;

	  // Authorization Code should be generated per user by the developer. This will 
	  // be passed to the Account Linking callback.
	  var authCode = "1234567890";

	  // Redirect users to this URI on successful login
	  var redirectURISuccess = redirectURI + "&authorization_code=" + authCode;

	  res.render('authorize', {
	    accountLinkingToken: accountLinkingToken,
	    redirectURI: redirectURI,
	    redirectURISuccess: redirectURISuccess
	  });
	});


	/*
	 * Verify that the callback came from Facebook. Using the App Secret from 
	 * the App Dashboard, we can verify the signature that is sent with each 
	 * callback in the x-hub-signature field, located in the header.
	 *
	 * https://developers.facebook.com/docs/graph-api/webhooks#setup
	 *
	 */
	function verifyRequestSignature(req, res, buf) {
	  var signature = req.headers["x-hub-signature"];

	  if (!signature) {
	    // For testing, let's log an error. In production, you should throw an 
	    // error.
	    console.error("Couldn't validate the signature.");
	  } else {
	    var elements = signature.split('=');
	    var method = elements[0];
	    var signatureHash = elements[1];

	    var expectedHash = crypto.createHmac('sha1', APP_SECRET)
	                        .update(buf)
	                        .digest('hex');

	    if (signatureHash != expectedHash) {
	      throw new Error("Couldn't validate the request signature.");
	    }
	  }
	}

	/*
	 * Authorization Event
	 *
	 * The value for 'optin.ref' is defined in the entry point. For the "Send to 
	 * Messenger" plugin, it is the 'data-ref' field. Read more at 
	 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
	 *
	 */
	function receivedAuthentication(event) {
	  var senderID = event.sender.id;
	  var recipientID = event.recipient.id;
	  var timeOfAuth = event.timestamp;

	  // The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
	  // The developer can set this to an arbitrary value to associate the 
	  // authentication callback with the 'Send to Messenger' click event. This is
	  // a way to do account linking when the user clicks the 'Send to Messenger' 
	  // plugin.
	  var passThroughParam = event.optin.ref;

	  console.log("Received authentication for user %d and page %d with pass " +
	    "through param '%s' at %d", senderID, recipientID, passThroughParam, 
	    timeOfAuth);

	  // When an authentication is received, we'll send a message back to the sender
	  // to let them know it was successful.
	  sendTextMessage(senderID, "Authentication successful");
	}

	// INSERT into fb_message and then do the default messenger sample action - echo
	function receivedMessage(event) {
	  var senderID = event.sender.id;
	  var recipientID = event.recipient.id;
	  var timeOfMessage = event.timestamp;
	  var message = event.message;

	  console.log("Received message for user %s and page %s at %s with message:", 
	    senderID, recipientID, timeOfMessage);
	  console.log(JSON.stringify(message));

	  var isEcho = message.is_echo;
	  var messageId = message.mid;
	  var appId = message.app_id;
	  var metadata = message.metadata;

	  // You may get a text or attachment but not both
	  var messageText = message.text;
	  var messageAttachments = message.attachments;
	  var quickReply = message.quick_reply;

	    FBMessage.create({
	      mid     : message.mid,
	      seq     : message.seq,
	      text    : message.text,
	      pid     : '',
	      psid_recipient  : event.recipient.id,
	      psid_sender     : event.sender.id,
	      timestamp       : event.timestamp
	    }).then(function(Instance){

	    }).catch(function(err){
	      console.log(err);
	    });

	  if (isEcho) {
	    // Just logging message echoes to console
	    console.log("Received echo for message %s and app %d with metadata %s", 
	      messageId, appId, metadata);
	    return;
	  } else if (quickReply) {
	    var quickReplyPayload = quickReply.payload;
	    console.log("Quick reply for message %s with payload %s",
	      messageId, quickReplyPayload);

	    sendTextMessage(senderID, "Quick reply tapped");
	    return;
	  }

	  if (messageText) {

	    // If we receive a text message, check to see if it matches any special
	    // keywords and send back the corresponding example. Otherwise, just echo
	    // the text we received.
	    switch (messageText) {
	      case 'image':
	        sendImageMessage(senderID);
	        break;

	      case 'gif':
	        sendGifMessage(senderID);
	        break;

	      case 'audio':
	        sendAudioMessage(senderID);
	        break;

	      case 'video':
	        sendVideoMessage(senderID);
	        break;

	      case 'file':
	        sendFileMessage(senderID);
	        break;

	      case 'button':
	        sendButtonMessage(senderID);
	        break;

	      case 'generic':
	        sendGenericMessage(senderID);
	        break;

	      case 'receipt':
	        sendReceiptMessage(senderID);
	        break;

	      case 'quick reply':
	        sendQuickReply(senderID);
	        break;        

	      case 'read receipt':
	        sendReadReceipt(senderID);
	        break;        

	      case 'typing on':
	        sendTypingOn(senderID);
	        break;        

	      case 'typing off':
	        sendTypingOff(senderID);
	        break;        

	      case 'account linking':
	        sendAccountLinking(senderID);
	        break;

	      default:
	        sendTextMessage(senderID, messageText);
	    }
	  } else if (messageAttachments) {
	    sendTextMessage(senderID, "Message with attachment received");
	  }
	}

	/*
	 * Delivery Confirmation Event
	 *
	 * This event is sent to confirm the delivery of a message. Read more about 
	 * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
	 *
	 */
	function receivedDeliveryConfirmation(event) {
	  var senderID = event.sender.id;
	  var recipientID = event.recipient.id;
	  var delivery = event.delivery;
	  var messageIDs = delivery.mids;
	  var watermark = delivery.watermark;
	  var sequenceNumber = delivery.seq;

	  if (messageIDs) {
	    messageIDs.forEach(function(messageID) {
	      console.log("Received delivery confirmation for message ID: %s", 
	        messageID);
	      console.log('recipient'+recipientID);
	      console.log('sender'+senderID);
	      console.log(event);

	      var r = {};
	      FBMessage.findOne({
	        where:{mid : messageID}
	      }).then(function(Instance){
	        r.FBMessage = Instance;
	        if(r.FBMessage){
	          r.FBMessage.delivered_timestamp = event.timestamp;
	          return r.FBMessage.save();
	        }else{
	          //This is the delivery confirmation of the first message in the conversation
	          return FBMessage.create({
	            mid     : messageID,
	            seq     : null,
	            text    : 'FIRST_PM',
	            pid     : event.sender.id,
	            psid_recipient  : event.recipient.id,
	            psid_sender     : event.sender.id,
	            timestamp       : event.timestamp,
	            delivered_timestamp : event.timestamp
	          });
	        }
	      }).then(function(Instance){
	        r.FBMessage = Instance;
	        if(r.FBMessage){

	        }
	      }).catch(function(err){
	        console.log(err);
	      });
	    });
	  }

	  console.log("All message before %d were delivered.", watermark);
	}


	/*
	 * Postback Event
	 *
	 * This event is called when a postback is tapped on a Structured Message. 
	 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
	 * 
	 */
	function receivedPostback(event) {
	  var senderID = event.sender.id;
	  var recipientID = event.recipient.id;
	  var timeOfPostback = event.timestamp;

	  // The 'payload' param is a developer-defined field which is set in a postback 
	  // button for Structured Messages. 
	  var payload = event.postback.payload;

	  console.log("Received postback for user %d and page %d with payload '%s' " + 
	    "at %d", senderID, recipientID, payload, timeOfPostback);

	  // When a postback is called, we'll send a message back to the sender to 
	  // let them know it was successful
	  sendTextMessage(senderID, "Postback called");
	}

	/*
	 * Message Read Event
	 *
	 * This event is called when a previously-sent message has been read.
	 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
	 * 
	 */
	function receivedMessageRead(event) {
	  var senderID = event.sender.id;
	  var recipientID = event.recipient.id;

	  // All messages before watermark (a timestamp) or sequence have been seen.
	  var watermark = event.read.watermark;
	  var sequenceNumber = event.read.seq;

	  console.log(event);
	  console.log("Received message read event for watermark %d and sequence " +
	    "number %d", watermark, sequenceNumber);

	  var r = {};
	  FBMessage.findAll({
	    where:{
	      timestamp : {$lte : event.read.watermark},
	      psid_sender : event.sender.id,
	      psid_recipient : event.recipient.id
	    }
	  }).then(function(Instances){
	    r.FBMessages = Instances;
	    if(r.FBMessages){
	      var queryList = [];
	      r.FBMessages.map(function(FBMessage,index){
	        FBMessage.read_timestamp = event.timestamp;
	        queryList.push(FBMessage.save()); 
	      });
	      return Sequelize.Promise.all(queryList);
	    }
	  }).catch(function(err){
	    console.log(err);
	  });

	}

	/*
	 * Account Link Event
	 *
	 * This event is called when the Link Account or UnLink Account action has been
	 * tapped.
	 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
	 * 
	 */
	function receivedAccountLink(event) {
	  var senderID = event.sender.id;
	  var recipientID = event.recipient.id;

	  var status = event.account_linking.status;
	  var authCode = event.account_linking.authorization_code;

	  console.log("Received account link event with for user %d with status %s " +
	    "and auth code %s ", senderID, status, authCode);
	}

	/*
	 * Send an image using the Send API.
	 *
	 */
	function sendImageMessage(recipientId) {
	  var messageData = {
	    recipient: {
	      id: recipientId
	    },
	    message: {
	      attachment: {
	        type: "image",
	        payload: {
	          url: SERVER_URL + "/assets/rift.png"
	        }
	      }
	    }
	  };

	  callSendAPI(messageData);
	}

	/*
	 * Send a Gif using the Send API.
	 *
	 */
	function sendGifMessage(recipientId) {
	  var messageData = {
	    recipient: {
	      id: recipientId
	    },
	    message: {
	      attachment: {
	        type: "image",
	        payload: {
	          url: SERVER_URL + "/assets/instagram_logo.gif"
	        }
	      }
	    }
	  };

	  callSendAPI(messageData);
	}

	/*
	 * Send audio using the Send API.
	 *
	 */
	function sendAudioMessage(recipientId) {
	  var messageData = {
	    recipient: {
	      id: recipientId
	    },
	    message: {
	      attachment: {
	        type: "audio",
	        payload: {
	          url: SERVER_URL + "/assets/sample.mp3"
	        }
	      }
	    }
	  };

	  callSendAPI(messageData);
	}

	/*
	 * Send a video using the Send API.
	 *
	 */
	function sendVideoMessage(recipientId) {
	  var messageData = {
	    recipient: {
	      id: recipientId
	    },
	    message: {
	      attachment: {
	        type: "video",
	        payload: {
	          url: SERVER_URL + "/assets/allofus480.mov"
	        }
	      }
	    }
	  };

	  callSendAPI(messageData);
	}

	/*
	 * Send a file using the Send API.
	 *
	 */
	function sendFileMessage(recipientId) {
	  var messageData = {
	    recipient: {
	      id: recipientId
	    },
	    message: {
	      attachment: {
	        type: "file",
	        payload: {
	          url: SERVER_URL + "/assets/test.txt"
	        }
	      }
	    }
	  };

	  callSendAPI(messageData);
	}

	/*
	 * Send a text message using the Send API.
	 *
	 */
	function sendTextMessage(recipientId, messageText) {
	  var messageData = {
	    recipient: {
	      id: recipientId
	    },
	    message: {
	      text: messageText,
	      metadata: "DEVELOPER_DEFINED_METADATA"
	    }
	  };

	  callSendAPI(messageData);
	}

	/*
	 * Send a button message using the Send API.
	 *
	 */
	function sendButtonMessage(recipientId) {
	  var messageData = {
	    recipient: {
	      id: recipientId
	    },
	    message: {
	      attachment: {
	        type: "template",
	        payload: {
	          template_type: "button",
	          text: "This is test text",
	          buttons:[{
	            type: "web_url",
	            url: "https://www.oculus.com/en-us/rift/",
	            title: "Open Web URL"
	          }, {
	            type: "postback",
	            title: "Trigger Postback",
	            payload: "DEVELOPER_DEFINED_PAYLOAD"
	          }, {
	            type: "phone_number",
	            title: "Call Phone Number",
	            payload: "+16505551234"
	          }]
	        }
	      }
	    }
	  };  

	  callSendAPI(messageData);
	}

	/*
	 * Send a Structured Message (Generic Message type) using the Send API.
	 *
	 */
	function sendGenericMessage(recipientId) {
	  var messageData = {
	    recipient: {
	      id: recipientId
	    },
	    message: {
	      attachment: {
	        type: "template",
	        payload: {
	          template_type: "generic",
	          elements: [{
	            title: "rift",
	            subtitle: "Next-generation virtual reality",
	            item_url: "https://www.oculus.com/en-us/rift/",               
	            image_url: SERVER_URL + "/assets/rift.png",
	            buttons: [{
	              type: "web_url",
	              url: "https://www.oculus.com/en-us/rift/",
	              title: "Open Web URL"
	            }, {
	              type: "postback",
	              title: "Call Postback",
	              payload: "Payload for first bubble",
	            }],
	          }, {
	            title: "touch",
	            subtitle: "Your Hands, Now in VR",
	            item_url: "https://www.oculus.com/en-us/touch/",               
	            image_url: SERVER_URL + "/assets/touch.png",
	            buttons: [{
	              type: "web_url",
	              url: "https://www.oculus.com/en-us/touch/",
	              title: "Open Web URL"
	            }, {
	              type: "postback",
	              title: "Call Postback",
	              payload: "Payload for second bubble",
	            }]
	          }]
	        }
	      }
	    }
	  };  

	  callSendAPI(messageData);
	}

	/*
	 * Send a receipt message using the Send API.
	 *
	 */
	function sendReceiptMessage(recipientId) {
	  // Generate a random receipt ID as the API requires a unique ID
	  var receiptId = "order" + Math.floor(Math.random()*1000);

	  var messageData = {
	    recipient: {
	      id: recipientId
	    },
	    message:{
	      attachment: {
	        type: "template",
	        payload: {
	          template_type: "receipt",
	          recipient_name: "Peter Chang",
	          order_number: receiptId,
	          currency: "USD",
	          payment_method: "Visa 1234",        
	          timestamp: "1428444852", 
	          elements: [{
	            title: "Oculus Rift",
	            subtitle: "Includes: headset, sensor, remote",
	            quantity: 1,
	            price: 599.00,
	            currency: "USD",
	            image_url: SERVER_URL + "/assets/riftsq.png"
	          }, {
	            title: "Samsung Gear VR",
	            subtitle: "Frost White",
	            quantity: 1,
	            price: 99.99,
	            currency: "USD",
	            image_url: SERVER_URL + "/assets/gearvrsq.png"
	          }],
	          address: {
	            street_1: "1 Hacker Way",
	            street_2: "",
	            city: "Menlo Park",
	            postal_code: "94025",
	            state: "CA",
	            country: "US"
	          },
	          summary: {
	            subtotal: 698.99,
	            shipping_cost: 20.00,
	            total_tax: 57.67,
	            total_cost: 626.66
	          },
	          adjustments: [{
	            name: "New Customer Discount",
	            amount: -50
	          }, {
	            name: "$100 Off Coupon",
	            amount: -100
	          }]
	        }
	      }
	    }
	  };

	  callSendAPI(messageData);
	}

	/*
	 * Send a message with Quick Reply buttons.
	 *
	 */
	function sendQuickReply(recipientId) {
	  var messageData = {
	    recipient: {
	      id: recipientId
	    },
	    message: {
	      text: "What's your favorite movie genre?",
	      quick_replies: [
	        {
	          "content_type":"text",
	          "title":"Action",
	          "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_ACTION"
	        },
	        {
	          "content_type":"text",
	          "title":"Comedy",
	          "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_COMEDY"
	        },
	        {
	          "content_type":"text",
	          "title":"Drama",
	          "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_DRAMA"
	        }
	      ]
	    }
	  };

	  callSendAPI(messageData);
	}

	/*
	 * Send a read receipt to indicate the message has been read
	 *
	 */
	function sendReadReceipt(recipientId) {
	  console.log("Sending a read receipt to mark message as seen");

	  var messageData = {
	    recipient: {
	      id: recipientId
	    },
	    sender_action: "mark_seen"
	  };

	  callSendAPI(messageData);
	}

	/*
	 * Turn typing indicator on
	 *
	 */
	function sendTypingOn(recipientId) {
	  console.log("Turning typing indicator on");

	  var messageData = {
	    recipient: {
	      id: recipientId
	    },
	    sender_action: "typing_on"
	  };

	  callSendAPI(messageData);
	}

	/*
	 * Turn typing indicator off
	 *
	 */
	function sendTypingOff(recipientId) {
	  console.log("Turning typing indicator off");

	  var messageData = {
	    recipient: {
	      id: recipientId
	    },
	    sender_action: "typing_off"
	  };

	  callSendAPI(messageData);
	}

	/*
	 * Send a message with the account linking call-to-action
	 *
	 */
	function sendAccountLinking(recipientId) {
	  var messageData = {
	    recipient: {
	      id: recipientId
	    },
	    message: {
	      attachment: {
	        type: "template",
	        payload: {
	          template_type: "button",
	          text: "Welcome. Link your account.",
	          buttons:[{
	            type: "account_link",
	            url: SERVER_URL + "/authorize"
	          }]
	        }
	      }
	    }
	  };  

	  callSendAPI(messageData);
	}

	/*
	 * Call the Send API. The message data goes in the body. If successful, we'll 
	 * get the message id in a response 
	 *
	 */
	function callSendAPI(messageData) {
	  request({
	    uri: 'https://graph.facebook.com/v2.6/me/messages',
	    qs: { access_token: PAGE_ACCESS_TOKEN },
	    method: 'POST',
	    json: messageData
	  }, function (error, response, body) {
	    console.log(error);
	    console.log(body);
	    if (!error && response.statusCode == 200) {
	      var recipientId = body.recipient_id;
	      var messageId = body.message_id;

	        FBMessage.create({
	          mid     : messageId,
	          seq     : null,
	          text    : messageData.message.text,
	          pid     : settings.fb.page_id,
	          psid_recipient  : recipientId,
	          psid_sender     : settings.fb.page_id,
	          timestamp       : Math.round(+new Date())
	        }).then(function(Instance){
	          if(Instance){
	            console.log(Instance.text);
	          }
	        }).catch(function(err){
	          console.log(err);
	        });

	      if (messageId) {
	        console.log("Successfully sent message with id %s to recipient %s", 
	          messageId, recipientId);
	      } else {
	      console.log("Successfully called Send API for recipient %s", 
	        recipientId);
	      }
	    } else {
	      console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
	    }
	  });  
	}

// TEST AND EXAMPLES

	/*
	function getNextItem(id) {
	  return FBComment.findOne({
	    where : {id:id}
	  }).then(function(Instance) {
	    console.log(Instance.id);
	    return(Instance.id);
	  });
	}

	router.get('/promiseeach',function(req,res){

	  new Sequelize.Promise(function(resolve, reject) {
	      var results = [];
	      function next(id) {
	          getNextItem(id).then(function(val) {
	              results.push(val);
	              if (val > 100) { resolve(results); } else {
	                  next(id+1);
	              }
	          }, reject);
	      }
	      // start first iteration of the loop
	      next(1);
	  }).then(function(results) {
	      // process results here
	      res.send(results);
	  }, function(err) {
	      // error here
	  })

	});


	router.get('/findorcreate',function(req,res){
	  var comment_id = req.query.comment_id;
	  var promises = [];

	  FBComment.findOne({comment_id:comment_id})
	  .then(function(Instance){
	    var Comment = Instance;
	    promises.push(
	      FBComment.findOrCreate({
	        where : {
	          comment_id:comment_id
	        },
	        defaults:{
	          created_time:Comment.created_time,
	          comment_id:Comment.comment_id,
	          post_id:Comment.post_id,
	          uid:Comment.uid,
	          tid:Comment.tid,
	          message:Comment.message,
	          can_reply_privately:Comment.can_reply_privately,
	          can_comment:Comment.can_comment,
	          can_hide:Comment.can_hide,
	          can_remove:Comment.can_remove,
	          comment_count:Comment.comment_count
	        }
	      })
	    );
	    return promises;
	  }).spread(function(Instance,Created){
	    res.send({
	      length_existing:Existing.length,
	      length_created:Created.length
	    });
	  });

	})

	router.get('/conversations',function(req, res){
	  request({
	    uri: 'https://graph.facebook.com/v2.8/1661200044095778/conversations',
	    qs: { 
	      access_token:PAGE_ACCESS_TOKEN_LONG_DAIGOU,
	      fields:'messages'
	    },
	    method: 'GET',
	    json: {}
	  }, function (error, response, body) {
	    error ? console.log(error) : res.send(body);
	  });
	});


	router.get('/sendbypageapi',function(req,res){
	  request({
	    uri: 'https://graph.facebook.com/v2.8/'+req.query.tid+'/messages',
	    qs: { 
	      access_token:PAGE_ACCESS_TOKEN_LONG_DAIGOU,
	      message:req.query.message
	    },
	    method: 'POST'
	  }, function (error, response, body) {
	    error ? console.log(error) : res.send(body);
	  });
	});

	router.get('/promise',function(req,res){
		var promise = new Sequelize.Promise(function(resolve,reject){
			if(req.query.var === 'a'){
				resolve('a');
			}else if(req.query.var === 'b'){
				reject('b');
			}
		});

		promise
		.then(function(value){
			console.log(value);
			return new Sequelize.Promise(function(resolve,reject){
				resolve('a');
			});
		},function(value){
			console.log(value);
			return new Sequelize.Promise(function(resolve,reject){
				reject('b');
			});
		})

		.then(function(value){
			console.log('c');
		},function(value){
			console.log('d');
		})

		res.send({success:true});
	})

	*/


};