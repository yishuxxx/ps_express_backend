var index=0;
var MyPage = React.createClass({
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

  renderCheckboxRow(row) {
    return (
      <Ons.ListItem key={row} tappable>
        <label className='left'>
          <Ons.Input
            inputId={`checkbox-${row}`}
            type='checkbox'
          />
        </label>
        <label htmlFor={`checkbox-${row}`} className='center'>
          {row}
        </label>
      </Ons.ListItem>
    )
  },

  renderRadioRow(row) {
    return (
      <Ons.ListItem key={row} tappable>
        <label className='left'>
          <Ons.Input
            inputId={`radio-${row}`}
            checked={row === this.state.selectedVegetable}
            onChange={this.handleVegetableChange.bind(this, row)}
            type='radio'
          />
        </label>
        <label htmlFor={`radio-${row}`} className='center'>
          {row}
        </label>
      </Ons.ListItem>
    )
  },

  render: function() {
    return (
      <Ons.Page renderToolbar={this.renderToolbar}>
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

        <Ons.List
          dataSource={this.state.vegetables}
          renderHeader={() => <Ons.ListHeader>Radio buttons</Ons.ListHeader>}
          renderRow={this.renderRadioRow}
        />

        <Ons.List
          dataSource={this.state.vegetables}
          renderHeader={() => <Ons.ListHeader>Checkboxes</Ons.ListHeader>}
          renderRow={this.renderCheckboxRow}
        />
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
  hide:function(){
    this.setState({isOpen:false})
  },
  show:function(){
    this.setState({isOpen:true})
  },
  rightMenuHandler: function(route,navigator,title){
    if(title == 'Login'){
      this.gotoLoginPage(route,navigator);
    }
  },

  renderToolbar: function(){
    return (
      <Ons.Toolbar>
        <Ons.ToolbarButton>
          
        </Ons.ToolbarButton>
        <div className='center'>Homepage</div>
      </Ons.Toolbar>
    );
  },
  render: function(){
    return(
      <Ons.Page>
      <Ons.Splitter>
      <Ons.SplitterSide
        style={{
            boxShadow: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)'
        }}
        side='right'
        width={200}
        collapse={true}
        isSwipeable={true}
        isOpen={this.state.isOpen}
        onClose={this.hide}
        onOpen={this.show}
      >
        <Ons.Page>
          <Ons.List
              dataSource={['Login','Orders','Settings']}
              renderRow={(title)=>
                (<Ons.ListItem key={title} onClick={this.rightMenuHandler.bind(this,this.props.route,this.props.navigator,title)} tappable>{title}</Ons.ListItem>
              )}
            />
        </Ons.Page>
      </Ons.SplitterSide>
      <Ons.SplitterContent>
        <Ons.Page renderToolbar={this.renderToolbar}>
          <Ons.Button onClick={this.gotoLoginPage.bind(this,this.props.route,this.props.navigator)}>login</Ons.Button>
        </Ons.Page>
      </Ons.SplitterContent>
      </Ons.Splitter>
      </Ons.Page>
    )
  }
});

var MyNavigator = React.createClass({
  renderPage: function(route, navigator) {
    if(route.url == 'home'){
      return <HomePage key={route.title+index} route={route} navigator={navigator}/>;
    }else if(route.url == 'login'){
      return <MyPage key={route.title+index} route={route} navigator={navigator}/>;
    }

  },

  render: function() {
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