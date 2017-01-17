var index=0;
var store={};
var querying=false;

var idImgToUrl = function(id_image){
  var url = 'http://localhost/shop/img/p';
  id_image = id_image.toString();
  for(var i=0;i<id_image.length;i++){
    url = url + '/' + id_image[i];
  }
  url = url + '/' + id_image + '.jpg';

  return url;
}

var ProductSingle = React.createClass({
  getInitialState: function() {
    var p = store['products'][this.props.route.id_product];

    return ({
      id: p.id ? p.id : 1,
      name: p.name ? p.name : 'NoNameProduct',
      images: p.images ? p.images : [{id_image:1}],
      price: p.price ? p.price : 0.00
    });
  },

  componentWillReceiveProps: function(nextProps) {
    this.setState({products:store['products'][this.nextProps.route.id_product]});
  },

  gotoPreviousPage: function(route,navigator){
    navigator.popPage();
  },

  renderToolbar: function() {
    return (
      <Ons.Toolbar>
        <div className="left">{this.props.route.hasBackButton ? <Ons.BackButton onClick={this.gotoPreviousPage.bind(this,this.props.route,this.props.navigator)}>Back</Ons.BackButton> : null}</div>
      </Ons.Toolbar>
    );
  },

  render: function() {
    return (
      <Ons.Page renderToolbar={this.renderToolbar}>
        <div className='left'>
          <img src={idImgToUrl(1)} style={{height:'80px'}}/>
        </div>
        <div className='center' style={{paddingLeft:'10px'}}>
          <div style={{display:'block',width:'100%',fontSize:'14px'}}>{this.state.product ? this.state.product['name']+'asd asd kla das d akd akd a da sd ad a sd -'+this.state.product['id'] : ''}</div>
          <div style={{display:'block',width:'100%',fontSize:'14px',color:'red'}}>RM {this.state.product ? this.state.product['price'].toFixed(2) : '100.00'}</div>
          <div style={{display:'block',width:'100%',fontSize:'14px'}}><span style={{fontSize:'12px',textDecoration:'line-through'}}>RM 80.00</span><span style={{fontSize:'12px',color:'red'}}> -- save 20%</span></div>
          <div style={{display:'block',width:'100%',fontSize:'14px',color:'#ffcc00'}}>
            <Ons.Icon icon='fa-star' style={{marginRight:'2px'}}/>
            <Ons.Icon icon='fa-star' style={{marginRight:'2px'}}/>
            <Ons.Icon icon='fa-star' style={{marginRight:'2px'}}/>
            <Ons.Icon icon='fa-star' style={{marginRight:'2px'}}/>
            <Ons.Icon icon='fa-star' style={{marginRight:'2px'}}/>
          </div>
        </div>
      </Ons.Page>
    );
  }
});

var MyProducts = React.createClass({
  listItemHeight: function(){
    return ons.platform.isAndroid() ? 128 : 125;
  },
  getInitialState: function() {
    return ({products:store['products']});
  },
  componentWillReceiveProps: function(nextProps) {
    this.setState({products:store['products']});
  },

  gotoPreviousPage: function(route,navigator){
    navigator.popPage();
  },

  gotoSingleProductPage: function(route,navigator,id_product){
    navigator.pushPage({
        url: 'product',
        title: 'Product Page',
        hasBackButton: true,
        id_product: id_product
    });
  },

  handleScroll: function(e){
    var currentItemOnTop = Math.floor(e.target.scrollTop/this.listItemHeight());
    if( (currentItemOnTop + 10) > store['products'].length){
      getProducts(store['products'].length);
    }
    //console.log(e.target.scrollTop+'-'+'TopItemNo ='+ currentItemOnTop);
  },

  renderToolbar: function() {
    return (
      <Ons.Toolbar>
        <div className="left">{this.props.route.hasBackButton ? <Ons.BackButton onClick={this.gotoPreviousPage.bind(this,this.props.route,this.props.navigator)}>Back</Ons.BackButton> : null}</div>
        <div className='center'>Products</div>
      </Ons.Toolbar>
    );
  },

  renderRow: function(index) {
    if(this.state.products[index] && this.state.products[index]['images'] && this.state.products[index]['images'][0] && this.state.products[index]['images'][0]['id']){
      var url = idImgToUrl(this.state.products[index]['images'][0]['id']);
    }
    return (
      <Ons.ListItem key={index} onClick={this.gotoSingleProductPage.bind(this,this.props.route,this.props.navigator,this.state.products[index] ? this.state.products[index]['id'] : '' )}>
        <div className='left'>
          <img src={url} style={{height:'80px'}}/>
        </div>
        <div className='center' style={{paddingLeft:'10px'}}>
          <div style={{display:'block',width:'100%',fontSize:'14px'}}>{this.state.products[index] ? this.state.products[index]['name']+'asd asd kla das d akd akd a da sd ad a sd -'+this.state.products[index]['id'] : ''}</div>
          <div style={{display:'block',width:'100%',fontSize:'14px',color:'red'}}>RM {this.state.products[index] ? this.state.products[index]['price'].toFixed(2) : '100.00'}</div>
          <div style={{display:'block',width:'100%',fontSize:'14px'}}><span style={{fontSize:'12px',textDecoration:'line-through'}}>RM 80.00</span><span style={{fontSize:'12px',color:'red'}}> -- save 20%</span></div>
          <div style={{display:'block',width:'100%',fontSize:'14px',color:'#ffcc00'}}>
            <Ons.Icon icon='fa-star' style={{marginRight:'2px'}}/> 
            <Ons.Icon icon='fa-star' style={{marginRight:'2px'}}/> 
            <Ons.Icon icon='fa-star' style={{marginRight:'2px'}}/> 
            <Ons.Icon icon='fa-star' style={{marginRight:'2px'}}/> 
            <Ons.Icon icon='fa-star' style={{marginRight:'2px'}}/>
          </div>
        </div>
      </Ons.ListItem>
    );
  },

  render: function() {
    return (
      <Ons.Page renderToolbar={this.renderToolbar} onScroll={this.handleScroll}>
        <Ons.LazyList
          length={28}
          renderRow={this.renderRow}
          calculateItemHeight={() => this.listItemHeight()}
          countItems={()=> store['products'].length}
        />
      </Ons.Page>
    );
  }
});

var getProducts = function(offset=0){
  //console.log('products?offset='+offset);
  if(querying == false){
    querying = true;
    fetch('products?offset='+offset,{
      method: "GET",
    }).then( 
      function(response) { 

        if (response.status !== 200) {  
          console.log('Looks like there was a problem. Status Code: ' +  
            response.status);
          return;
        }

        // Examine the text in the response  
        response.json().then(function(data) {
          if(data.success){
            if(store['products']){
              store['products'] = store['products'].concat(data.products);
            }else{
              store['products'] = data.products;
            }
          }
          ReactDOM.render(<MyNavigator />, document.getElementById('app'));
          console.log(store['products']);  
        });  
        querying = false;
      }  
    )
    .catch(function(err) {  
      console.log('Fetch Error :-S', err);  
    });
  }
};

var EmptyPage = React.createClass({
  gotoPreviousPage: function(route,navigator){
    navigator.popPage();
  },
  renderToolbar: function(){
    return(
      <Ons.Toolbar>
        <div className="left">{this.props.route.hasBackButton ? <Ons.BackButton onClick={this.gotoPreviousPage.bind(this,this.props.route,this.props.navigator)}>Back</Ons.BackButton> : null}</div>
        <div className="center">{this.props.route.title}</div>
      </Ons.Toolbar>
    );
  },
  render: function(){
    return(
      <Ons.Page renderToolbar={this.renderToolbar}></Ons.Page>
    );
  }
});

var LoginPage = React.createClass({
  getInitialState: function() {
    return {
      username: '',
      password: '',
      vegetables: [
        'Tomato',
        'Cucumber',
        'Onion',
        'Eggplant',
        'Cabbage'
      ],
      selectedVegetable: 'Onion'
    };
  },

  gotoPreviousPage: function(navigator){
    navigator.popPage();
  },

  renderToolbar: function() {
    return (
      <Ons.Toolbar>
        <div className='left'>{this.props.route.hasBackButton ? <Ons.BackButton onClick={this.gotoPreviousPage.bind(this,this.props.navigator)}>Back</Ons.BackButton> : null}</div>
        <div className='center'>Form input</div>
      </Ons.Toolbar>
    );
  },

  handleClick: function() {
    if (this.state.username === 'bob' && this.state.password === 'secret') {
      ons.notification.alert('You are now signed in!');
    }
    else {
      ons.notification.alert('Username or password incorrect!');
    }
  },

  handleUsernameChange(e) {
    this.setState({username: e.target.value});
  },

  handlePasswordChange(e) {
    this.setState({password: e.target.value});
  },

  handleVegetableChange(vegetable) {
    this.setState({selectedVegetable: vegetable});
  },

  render: function() {
    return (
      <Ons.Page renderToolbar={this.renderToolbar}>
        <div></div>
        <section style={{textAlign: 'center'}}>
          <p>
            <Ons.Input
              value={this.state.username}
              onChange={this.handleUsernameChange}
              modifier='underbar'
              float
              placeholder='Username' />
          </p>
          <p>
            <Ons.Input
              value={this.state.password}
              onChange={this.handlePasswordChange}
              modifier='underbar'
              type='password'
              float
              placeholder='Password' />
          </p>
          <p>
            <Ons.Button onClick={this.handleClick}>Sign in</Ons.Button>
          </p>
        </section>

      </Ons.Page>
    );
  }
});

var HomePage = React.createClass({
  getInitialState: function() {
    return({
      isOpen: false
    });
  },
  gotoLoginPage: function(route,navigator){
    navigator.pushPage({
        url: 'login',
        title: 'Login Page',
        hasBackButton: true
    });
  },
  gotoPage: function(route,navigator){
    navigator.pushPage({
      url: 'empty',
      title: 'Empty Page',
      hasBackButton: true
    });
  },
  hide:function(){
    this.setState({isOpen:false});
  },
  show:function(){
    this.setState({isOpen:true});
  },
  hideLeftMenu:function(){
    this.setState({isOpenLeftMenu:false});
  },
  showLeftMenu:function(){
    this.setState({isOpenLeftMenu:true});
  },
  rightMenuHandler: function(route,navigator,title){
    if(title == 'login'){
      this.gotoLoginPage(route,navigator);
    }else if(title == 'messenger'){
      navigator.pushPage({
        url: 'products',
        title: 'Products Page',
        hasBackButton: true
      });
    }else{
      this.gotoPage(route,navigator);
    }
  },

  renderToolbar: function(){
    return (
      <Ons.Toolbar>
        <div className='left'>
          <Ons.ToolbarButton onClick={this.showLeftMenu}>
            <Ons.Icon icon='fa-bars' /> 
          </Ons.ToolbarButton>
        </div>
        <div className='center' style={{textAlign: 'center'}}>Homepage</div>
        <div className='right'>
          <Ons.ToolbarButton onClick={this.show}>
            <Ons.Icon icon='fa-user' /> 
          </Ons.ToolbarButton>
        </div>
      </Ons.Toolbar>
    );
  },
  renderRightMenuList: function(title){
    var list = {
      login:['fa-user','Login'],
      messenger:['fa-facebook-official','Messenger'],
      orders:['fa-archive','Orders'],
      settings:['fa-cog','Settings'],
      policies:['fa-book','Policies'],
      contactus:['fa-phone','Contact Us']
    };
    return (
      <Ons.ListItem key={title} onClick={this.rightMenuHandler.bind(this,this.props.route,this.props.navigator,title)} tappable>
        <div className='left'><Ons.Icon icon={list[title][0]} /></div>
        <div className='center'>{list[title][1]}</div>
      </Ons.ListItem>
    );
  },
  render: function(){
    return(
      <Ons.Page>
      <Ons.Splitter>
      <Ons.SplitterSide
        width={200}
        collapse={true}
        isSwipeable={true}
        isOpen={this.state.isOpenLeftMenu}
        onOpen={this.showLeftMenu}
        onClose={this.hideLeftMenu}
      >
        <Ons.Page>
          <Ons.List
            dataSource={['Electronics','Beauty','Fashion',,'Home','Kids']}
            renderRow={(title)=>(<Ons.ListItem onClick={this.rightMenuHandler.bind(this,this.props.route,this.props.navigator,title)} tappable>{title}</Ons.ListItem>)}
          />
        </Ons.Page>
      </Ons.SplitterSide>
      <Ons.SplitterSide
        style={{
            boxShadow: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)'
        }}
        side='right'
        width={180}
        collapse={true}
        isSwipeable={true}
        isOpen={this.state.isOpen}
        onClose={this.hide}
        onOpen={this.show}
      >
        <Ons.Page>
          <Ons.List
              dataSource={['login','messenger','orders','settings','policies','contactus']}
              renderRow={this.renderRightMenuList}
            />
        </Ons.Page>
      </Ons.SplitterSide>
      <Ons.SplitterContent>
        <Ons.Page renderToolbar={this.renderToolbar}>
          This is the Home Page
        </Ons.Page>
      </Ons.SplitterContent>
      </Ons.Splitter>
      </Ons.Page>
    )
  }
});

var MyNavigator = React.createClass({
  renderPage: function(route, navigator) {
    //console.log(route);
    if(route.url == 'home'){
      return <HomePage key={route.title+index} route={route} navigator={navigator}/>;
    }else if(route.url == 'login'){
      return <LoginPage key={route.title+index} route={route} navigator={navigator}/>;
    }else if(route.url == 'products'){
      return <MyProducts key={route.title+index} route={route} navigator={navigator}/>;
    }else if(route.url == 'product'){
      return <ProductSingle key={route.title+index} route={route} navigator={navigator}/>;
    }else{
      return <EmptyPage key={route.title+index} route={route} navigator={navigator}/>;
    }

  },

  render: function() {
    return (
      <Ons.Navigator
        renderPage={this.renderPage}
        initialRoute={{
          url: 'home',
          title: 'SY Online',
          hasBackButton: false
        }}
        onPostPush={function(){index++;}}
        onPostPop={function(){index--;}}
      />
    );
  }
});

ons.ready(function() {
  ReactDOM.render(<MyNavigator />, document.getElementById('app'));
  getProducts(0);
});