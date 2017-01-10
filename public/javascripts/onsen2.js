var index = 0;

function gotoHomePage(navigator) {
  console.log('gotoHomePage');
  navigator.pushPage({
    url: 'home',
    title: `Home Page ${index}`,
    hasBackButton: true
  });
}

function gotoLoginPage(navigator) {
  console.log('gotoLoginPage');
  navigator.pushPage({
    url: 'login',
    title: `Login Page ${index}`,
    hasBackButton: true
  });
}

function gotoPreviousPage(navigator) {
  /*
  ons.notification.confirm('Do you really want to go back?')
    .then((response) => {
      if (response === 1) {
        navigator.popPage();
      }
    });
  */
  navigator.popPage();
}

var MyHomePage = React.createClass({

  renderToolbar: function() {
    const backButton = this.props.route.hasBackButton
      ? <Ons.BackButton onClick={gotoPreviousPage.bind(this,this.props.navigator)}>Back</Ons.BackButton>
      : null;

    return (
      <Ons.Toolbar>
        <div className='left'>{backButton}</div>
        <div className='center'>{this.props.route.title}</div>
      </Ons.Toolbar>
    );
  },

  render: function(){
    return(
      <Ons.Page key={this.props.route.title+index} renderToolbar={this.renderToolbar}>
        <section style={{margin: '16px', textAlign: 'center'}}>
          <Ons.Button onClick={gotoLoginPage.bind(this,this.props.navigator)}>
            Home Page
          </Ons.Button>
        </section>
      </Ons.Page>
    );
  }

});

var MyLoginPage = React.createClass({
  getInitialState: function() {
    return ({
      username:'',
      password:'',
    });
  },

  renderToolbar: function(route,navigator) {
    const backButton = route.hasBackButton
      ? <Ons.BackButton onClick={gotoPreviousPage.bind(this,navigator)}>Back</Ons.BackButton>
      : null;

    return (
      <Ons.Toolbar>
        <div className='left'>{backButton}</div>
        <div className='center'>{route.title}</div>
      </Ons.Toolbar>
    );
  },

  handleUsernameChange: function(e) {
    this.setState({username: e.target.value});
  },

  handlePasswordChange: function(e) {
    this.setState({password: e.target.value});
  },

  render: function(){
    return(
      <Ons.Page key={this.props.route.title+index} renderToolbar={this.renderToolbar.bind(this, this.props.route, this.props.navigator)}>
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
            <Ons.Button onClick={gotoHomePage.bind(this,this.props.navigator)}>Sign in</Ons.Button>
          </p>
        </section>
      </Ons.Page>
    );
  }
});

var MyNavigator = React.createClass({
  renderPage: function(route, navigator) {
    if(route.url == 'home'){
      return <MyHomePage key={route.title+index} route={route} navigator={navigator}/>;
    }else if(route.url == 'login'){
      return <MyLoginPage key={route.title+index} route={route} navigator={navigator}/>;
    }

  },

  render: function() {
    index++;
    return (
      <Ons.Navigator
        renderPage={this.renderPage}
        initialRoute={{
          url: 'home',
          title: 'The Home page',
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
});