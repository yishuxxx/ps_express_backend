var MyTab = React.createClass({

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
      <Ons.Page>
        <section style={{margin: '16px'}}>
          <p>
            This is the <strong>{this.props.title}</strong> tab.
              <Ons.List
              dataSource={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]}
              renderRow={this.renderRow}
              renderHeader={() => <Ons.ListHeader>Cute cats</Ons.ListHeader>}
            />
          </p>
        </section>
      </Ons.Page>
    );
  }
});

var MyMainMenuAndTabs = React.createClass({
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

  clickrightmenu: function() {
    this.setState({index:3});
    console.log(this.state);
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
              dataSource={['Profile', 'Followers', 'Settings']} 
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
              dataSource={['right side 1', 'right side 2', 'right side 3']} 
              renderRow={(title) => (
                <Ons.ListItem key={title} onClick={this.clickrightmenu} tappable>{title}</Ons.ListItem>
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

ons.ready(function() {
  ReactDOM.render(<MyPage />, document.getElementById('app'));
});
