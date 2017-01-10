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

  gotoPreviousPage: function(route,navigator){
    navigator.popPage();
  },

  renderToolbar: function() {
    return (
      <Ons.Toolbar>
        <div className='left'>{true ? <Ons.BackButton onClick={this.gotoPreviousPage.bind(this,this.props.route,this.props.navigator)}>Back</Ons.BackButton> : null}</div>
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
      isOpen: true
    });
  },
  hide:function(){
    this.setState({isOpen:false})
  },
  show:function(){
    this.setState({isOpen:true})
  },
  gotoLoginPage: function(route,navigator){
    console.log('push the login page')
    navigator.pushPage({
        url: 'login',
        title: 'Login Page',
        hasBackButton: true
    });
  },
  renderToolbar: function(){
    return (
      <Ons.Toolbar>
        <div className='center'>Homepage</div>
      </Ons.Toolbar>
    );
  },
  render: function(){
    return(
      <div>
        <Ons.Page renderToolbar={this.renderToolbar}>
          <Ons.Button onClick={this.gotoLoginPage.bind(this,this.props.route,this.props.navigator)}>login</Ons.Button>
        </Ons.Page>
      </div>
    )
  }
});

var MyNavigator = React.createClass({
  renderPage: function(route, navigator) {
    if(route.url == 'home'){
      return <HomePage key={route.title+index} route={route} navigator={navigator}/>;
    }else{
      return <MyPage key={route.title+index} route={route} navigator={navigator}/>;
    }

  },

  render: function() {
    console.log(index);
    return (
      <Ons.Navigator
        renderPage={this.renderPage}
        initialRoute={{
          url: 'home',
          title: 'The Home page',
          hasBackButton: false
        }}
        onPostPush={function(){index++;console.log(index);}}
        onPostPop={function(){index--;console.log(index);}}
      />
    );
  }
});

ons.ready(function() {
  ReactDOM.render(<MyNavigator />, document.getElementById('app'));
});