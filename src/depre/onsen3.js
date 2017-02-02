var index = 0;

var LoginPage = React.createClass({
  getInitialState: function() {
    return {username:'jacksparrow',password:''};
  },

  handleUsernameChange(e) {
    this.setState({username: e.target.value});
  },

  handlePasswordChange(e) {
    this.setState({password: e.target.value});
  },

  render:function(){
    return(
        <Ons.Page key={this.props.route.title} renderToolbar={this.renderToolbar.bind(this, this.props.route, this.props.navigator)}>
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
              <Ons.Button>Sign in</Ons.Button>
            </p>
          </section>
        </Ons.Page>
    );
  }
});


var MyTab = React.createClass({

  render: function() {
    return (
      <Ons.Page>
        <section style={{margin: '16px'}}>
          <p>
            This is the <strong>{this.props.title}</strong> tab.
          </p>
        </section>
      </Ons.Page>
    );
  }
});

var MySplitter = React.createClass({
  getInitialState: function() {
    return {
      index: 0,
      isOpen: false,
      isOpenRightMenu: false,
    }
  },

  hide() {
    this.setState({isOpen: false});
  },

  show() {
    this.setState({isOpen: true});
  },

  hiderightmenu() {
    this.setState({isOpenRightMenu: false});
  },

  showrightmenu() {
    this.setState({isOpenRightMenu: true});
  },

  clickrightmenu: function(navigator,pagename) {
    if(pagename == 'login'){
      this.gotoLoginPage(navigator);
    }
  },

  gotoLoginPage: function(navigator) {
    navigator.pushPage({
      url: 'login',
      title: `The Login Page`,
      hasBackButton: true
    });

    index++;
  },

  handleClick: function() {
    ons.notification.alert('Hello world!');
  },

  renderToolbar: function() {
    return (
      <Ons.Toolbar>
        <div className='left'>
          <Ons.ToolbarButton onClick={this.show}>
            <Ons.Icon icon='ion-navicon, material:md-menu' />
          </Ons.ToolbarButton>
        </div>
        <div className='center'>Side menu</div>
        <div className='right'>
          <Ons.ToolbarButton onClick={this.show}>
            <Ons.Icon icon='cart-arrow-down' />
          </Ons.ToolbarButton>
          <Ons.ToolbarButton onClick={this.showrightmenu}>
            <Ons.Icon icon='user' />
          </Ons.ToolbarButton>
        </div>
      </Ons.Toolbar>
    );
  },

  renderTabs: function() {
    return [
      {
        content: <MyTab title='Home' />,
        tab: <Ons.Tab label='Home' icon='md-home' />
      },
      {
        content: <MyTab title='Popular' />,
        tab: <Ons.Tab label='Popular' icon='md-fire' />
      },
      {
        content: <MyTab title='New' />,
        tab: <Ons.Tab label='New' icon='ion-leaf' />
      },
      {
        content: <MyTab title='Promotion' />,
        tab: <Ons.Tab label='Promotion' icon='ion-waterdrop' />
      }
    ];
  },

  renderFixed: function() {
    return (
      <Ons.Fab
        style={{backgroundColor: ons.platform.isIOS() ? '#4282cc' : null}}
        onClick={this.handleClick}
        position='bottom right'>
        <Ons.Icon icon='md-face' />
      </Ons.Fab>
    );
  },

  renderRow: function(row, index) {
    const x = 40 + Math.round(5 * (Math.random() - 0.5)),
          y = 40 + Math.round(5 * (Math.random() - 0.5));

    const names = ['Max', 'Chloe', 'Bella', 'Oliver', 'Tiger', 'Lucy', 'Shadow', 'Angel'];
    const name = names[Math.floor(names.length * Math.random())];

    return (
      <Ons.ListItem key={index}>
        <div className='left'>
          <img src={`http://placekitten.com/g/${x}/${y}`} className='list__item__thumbnail' />
        </div>
        <div className='center'>
          {name}
        </div>
      </Ons.ListItem>
    );
  },

  render: function() {
    return (
      <Ons.Splitter>
        <Ons.SplitterSide
          style={{
              boxShadow: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)'
          }}
          side='left'
          width={200}
          collapse={true}
          isSwipeable={true}
          isOpen={this.state.isOpen}
          onClose={this.hide}
          onOpen={this.show}
        >
          <Ons.Page>
            <Ons.List
              dataSource={['All', 'Electronics', 'Health & Beauty','Home & Decor','Car Accessories']} 
              renderRow={(title) => (
                <Ons.ListItem key={title} onClick={this.hide} tappable>{title}</Ons.ListItem>
              )}
            />
          </Ons.Page>
        </Ons.SplitterSide>

        <Ons.SplitterSide
          style={{
              boxShadow: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)'
          }}
          side='right'
          width={200}
          collapse={true}
          isSwipeable={true}
          isOpen={this.state.isOpenRightMenu}
          onClose={this.hiderightmenu}
          onOpen={this.showrightmenu}
        >
          <Ons.Page>
            <Ons.List
              dataSource={['login', 'notification', 'wishlist','order','setting','policy','help']} 
              renderRow={(title) => (
                <Ons.ListItem key={title} onClick={this.clickrightmenu(this.props.navigator,title)} tappable>{title}</Ons.ListItem>
              )}
            />
          </Ons.Page>
        </Ons.SplitterSide>
        <Ons.SplitterContent>
          <Ons.Page renderToolbar={this.renderToolbar} renderFixed={this.renderFixed}>
            <Ons.Page>
              <div>the hidden page is shown here</div>
            </Ons.Page>
            <Ons.Tabbar
              index={this.state.index}
              onPreChange={(event) =>
                {
                  if (event.index != this.state.index) {
                    this.setState({index: event.index});
                  }
                }
              }
              renderTabs={this.renderTabs}
            />
          </Ons.Page>
        </Ons.SplitterContent>
      </Ons.Splitter>
    );
  }

});

var MyNavigator = React.createClass({
  getInitialState: function() {
    return ({
      username:'thejacksparrow',
      password:'',
    });
  },

  renderToolbar: function(route, navigator) {
    const backButton = route.hasBackButton
      ? <Ons.BackButton onClick={this.handleClick.bind(this, navigator)}>Back</Ons.BackButton>
      : null;

    return (
      <Ons.Toolbar>
        <div className='left'>{backButton}</div>
        <div className='center'>{route.title}</div>
      </Ons.Toolbar>
    );
  },

  handleClick: function(navigator) {
    ons.notification.confirm('Do you really want to go back?')
      .then((response) => {
        if (response === 1) {
          navigator.popPage();
        }
      });
  },

  renderPage: function(route, navigator) {
    if(route.url == 'home'){
      return (
        <Ons.Page key={route.title} renderToolbar={this.renderToolbar.bind(this, route, navigator)}>
          <section style={{margin: '16px', textAlign: 'center'}}>
            <Ons.Button onClick={this.gotoLoginPage.bind(this, navigator)}>
              Home Page
            </Ons.Button>
          </section>
        </Ons.Page>
      );
    }else if(route.url == 'login'){
      return (
        <LoginPage route={route} navigator={navigator} />
      );
    }else if(route.url == 'main'){
      return (<MySplitter key={route.title} navigator={navigator} route={route}/>);
    }


  },

  render: function() {
    return (
      <Ons.Navigator
        renderPage={this.renderPage}
        initialRoute={{
          url: 'main',
          title: 'The Home page',
          hasBackButton: false
        }}
      />
    );
  }
});

ons.ready(function() {
  ReactDOM.render(<MyNavigator />, document.getElementById('app'));
});