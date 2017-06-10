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
/******/ 	return __webpack_require__(__webpack_require__.s = 763);
/******/ })
/************************************************************************/
/******/ ({

/***/ 763:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var index = 0;
var store = {};
var querying = false;

var idImgToUrl = function idImgToUrl(id_image) {
  var url = 'http://localhost/shop/img/p';
  id_image = id_image.toString();
  for (var i = 0; i < id_image.length; i++) {
    url = url + '/' + id_image[i];
  }
  url = url + '/' + id_image + '.jpg';

  return url;
};

var ProductSingle = React.createClass({
  displayName: 'ProductSingle',

  getInitialState: function getInitialState() {
    var p = store['products'][this.props.route.id_product];

    return {
      id: p.id ? p.id : 1,
      name: p.name ? p.name : 'NoNameProduct',
      images: p.images ? p.images : [{ id: 1 }],
      price: p.price ? p.price : 0.00,
      proattgros: p.proattgros ? p.proattgros : []
    };
  },

  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    this.setState({ products: store['products'][this.nextProps.route.id_product] });
  },

  gotoPreviousPage: function gotoPreviousPage(route, navigator) {
    navigator.popPage();
  },

  setIndex: function setIndex(index) {
    this.setState({ index: index });
  },
  handleChange: function handleChange(e) {
    this.setState({ index: e.activeIndex });
  },

  renderToolbar: function renderToolbar() {
    return React.createElement(
      Ons.Toolbar,
      null,
      React.createElement(
        'div',
        { className: 'left' },
        this.props.route.hasBackButton ? React.createElement(
          Ons.BackButton,
          { onClick: this.gotoPreviousPage.bind(this, this.props.route, this.props.navigator) },
          'Back'
        ) : null
      ),
      React.createElement('div', { className: 'center' }),
      React.createElement(
        'div',
        { className: 'right' },
        React.createElement(
          Ons.ToolbarButton,
          null,
          React.createElement(Ons.Icon, { icon: 'fa-shopping-cart' })
        )
      )
    );
  },

  render: function render() {
    var _this = this;

    var s = this.state;
    console.log(s);
    return React.createElement(
      Ons.Page,
      { renderToolbar: this.renderToolbar, style: { fontSize: '16px' } },
      React.createElement(
        'div',
        { style: { height: '250px' } },
        React.createElement(
          Ons.Carousel,
          { onPostChange: this.handleChange, index: this.state.index, fullscreen: true, swipeable: true, autoScroll: true, overscrollable: true, style: { height: '250px' } },
          s.images.map(function (item, index) {
            return React.createElement(
              Ons.CarouselItem,
              { key: index, style: { textAlign: 'center' } },
              React.createElement('img', { src: idImgToUrl(item.id), style: { height: '250px' } })
            );
          })
        ),
        React.createElement(
          'div',
          { style: {
              textAlign: 'center',
              fontSize: '20px',
              position: 'absolute',
              top: '260px',
              left: '0px',
              right: '0px'
            } },
          s.images.map(function (item, index) {
            return React.createElement(
              'span',
              { key: index, style: { cursor: 'pointer' }, onClick: _this.setIndex.bind(_this, index) },
              _this.state.index === index ? '\u25CF' : '\u25CB'
            );
          })
        )
      ),
      React.createElement(
        'div',
        { style: { padding: '30px', marginTop: '20px' } },
        React.createElement(
          'div',
          null,
          s.name
        ),
        React.createElement(
          'div',
          { style: { fontSize: '14px', color: 'red' } },
          React.createElement(
            'span',
            null,
            'RM ',
            s.price.toFixed(2)
          ),
          React.createElement(
            'span',
            { style: { fontSize: '12px', textDecoration: 'line-through' } },
            'RM 80.00'
          ),
          React.createElement(
            'span',
            { style: { fontSize: '12px', color: 'red' } },
            ' -- save 20%'
          )
        ),
        React.createElement(
          'div',
          { style: { fontSize: '14px', color: '#ffcc00' } },
          React.createElement(Ons.Icon, { icon: 'fa-star', style: { marginRight: '2px' } }),
          React.createElement(Ons.Icon, { icon: 'fa-star', style: { marginRight: '2px' } }),
          React.createElement(Ons.Icon, { icon: 'fa-star', style: { marginRight: '2px' } }),
          React.createElement(Ons.Icon, { icon: 'fa-star', style: { marginRight: '2px' } }),
          React.createElement(Ons.Icon, { icon: 'fa-star', style: { marginRight: '2px' } })
        ),
        React.createElement(
          'section',
          null,
          s.proattgros.map(function (proattgro, index) {
            return React.createElement(
              'div',
              { style: { margin: '10px 0px' } },
              React.createElement(
                'label',
                null,
                proattgro.name
              ),
              React.createElement(
                'select',
                { key: index, dataProAttGroId: proattgro.id, style: { fontSize: '16px', padding: '3px', width: '100%' } },
                proattgro.atts.map(function (att, index) {
                  return React.createElement(
                    'option',
                    { key: index, value: att.id },
                    att.name
                  );
                })
              )
            );
          })
        ),
        React.createElement(
          'section',
          null,
          React.createElement(
            'header',
            null,
            'Product Details:'
          ),
          React.createElement(
            'ul',
            null,
            React.createElement(
              'li',
              { style: { marginBottom: '5px' } },
              "Product is not eligible for voucher"
            ),
            React.createElement(
              'li',
              { style: { marginBottom: '5px' } },
              "Full HD 1920 x 1080 Resolution"
            ),
            React.createElement(
              'li',
              { style: { marginBottom: '5px' } },
              "Display Screen Size 40"
            ),
            React.createElement(
              'li',
              { style: { marginBottom: '5px' } },
              "Some other fucking specifications"
            ),
            React.createElement(
              'li',
              { style: { marginBottom: '5px' } },
              "And also some other bullshit specification"
            ),
            React.createElement(
              'li',
              { style: { marginBottom: '5px' } },
              "And it talks about how good the product is"
            ),
            React.createElement(
              'li',
              { style: { marginBottom: '5px' } },
              "without adding any images"
            ),
            React.createElement(
              'li',
              { style: { marginBottom: '5px' } },
              "Because it might consume alot of previous bandwidth on a mobile connection, which the user super hates and will not open your app anymore if it happens"
            )
          )
        )
      ),
      React.createElement(
        Ons.Fab,
        { position: 'bottom right' },
        React.createElement(Ons.Icon, { icon: 'fa-cart-plus' })
      )
    );
  }
});

var MyProducts = React.createClass({
  displayName: 'MyProducts',

  listItemHeight: function listItemHeight() {
    return ons.platform.isAndroid() ? 128 : 125;
  },
  getInitialState: function getInitialState() {
    return { products: store['products'] };
  },
  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    this.setState({ products: store['products'] });
  },

  gotoPreviousPage: function gotoPreviousPage(route, navigator) {
    navigator.popPage();
  },

  gotoSingleProductPage: function gotoSingleProductPage(route, navigator, id_product) {
    navigator.pushPage({
      url: 'product',
      title: 'Product Page',
      hasBackButton: true,
      id_product: id_product
    });
  },

  handleScroll: function handleScroll(e) {
    var currentItemOnTop = Math.floor(e.target.scrollTop / this.listItemHeight());
    if (currentItemOnTop + 5 > store['products'].length) {
      getProducts(store['products'].length);
    }
    //console.log(e.target.scrollTop+'-'+'TopItemNo ='+ currentItemOnTop);
  },

  renderToolbar: function renderToolbar() {
    return React.createElement(
      Ons.Toolbar,
      null,
      React.createElement(
        'div',
        { className: 'left' },
        this.props.route.hasBackButton ? React.createElement(
          Ons.BackButton,
          { onClick: this.gotoPreviousPage.bind(this, this.props.route, this.props.navigator) },
          'Back'
        ) : null
      ),
      React.createElement(
        'div',
        { className: 'center' },
        'Products'
      ),
      React.createElement(
        'div',
        { className: 'right' },
        React.createElement(
          Ons.ToolbarButton,
          null,
          React.createElement(Ons.Icon, { icon: 'fa-shopping-cart' })
        )
      )
    );
  },

  renderRow: function renderRow(index) {
    if (this.state.products[index] && this.state.products[index]['images'] && this.state.products[index]['images'][0] && this.state.products[index]['images'][0]['id']) {
      var url = idImgToUrl(this.state.products[index]['images'][0]['id']);
    }
    return React.createElement(
      Ons.ListItem,
      { key: index, onClick: this.gotoSingleProductPage.bind(this, this.props.route, this.props.navigator, this.state.products[index] ? this.state.products[index]['id'] : '') },
      React.createElement(
        'div',
        { className: 'left' },
        React.createElement('img', { src: url, style: { height: '56px', width: '56px' } })
      ),
      React.createElement(
        'div',
        { className: 'center', style: { paddingLeft: '10px' } },
        React.createElement(
          'div',
          { style: { width: '100%', fontSize: '14px' } },
          this.state.products[index] ? this.state.products[index]['name'] + 'asd asd kla das d akd akd a da sd ad a sd -' + this.state.products[index]['id'] : ''
        ),
        React.createElement(
          'div',
          { style: { width: '100%', fontSize: '14px', color: 'red' } },
          'RM ',
          this.state.products[index] ? this.state.products[index]['price'].toFixed(2) : '100.00'
        ),
        React.createElement(
          'div',
          { style: { width: '100%', fontSize: '14px' } },
          React.createElement(
            'span',
            { style: { fontSize: '12px', textDecoration: 'line-through' } },
            'RM 80.00'
          ),
          React.createElement(
            'span',
            { style: { fontSize: '12px', color: 'red' } },
            ' -- save 20%'
          )
        ),
        React.createElement(
          'div',
          { style: { width: '100%', fontSize: '14px', color: '#ffcc00' } },
          React.createElement(Ons.Icon, { icon: 'fa-star', style: { marginRight: '2px' } }),
          React.createElement(Ons.Icon, { icon: 'fa-star', style: { marginRight: '2px' } }),
          React.createElement(Ons.Icon, { icon: 'fa-star', style: { marginRight: '2px' } }),
          React.createElement(Ons.Icon, { icon: 'fa-star', style: { marginRight: '2px' } }),
          React.createElement(Ons.Icon, { icon: 'fa-star', style: { marginRight: '2px' } })
        )
      )
    );
  },

  render: function render() {
    var _this2 = this;

    return React.createElement(
      Ons.Page,
      { renderToolbar: this.renderToolbar, onScroll: this.handleScroll },
      React.createElement(Ons.LazyList, {
        length: 28,
        renderRow: this.renderRow,
        calculateItemHeight: function calculateItemHeight() {
          return _this2.listItemHeight();
        },
        countItems: function countItems() {
          return store['products'].length;
        }
      })
    );
  }
});

var getProducts = function getProducts() {
  var offset = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

  //console.log('products?offset='+offset);
  if (querying == false) {
    querying = true;
    fetch('products?offset=' + offset, {
      method: "GET"
    }).then(function (response) {

      if (response.status !== 200) {
        console.log('Looks like there was a problem. Status Code: ' + response.status);
        return;
      }

      // Examine the text in the response  
      response.json().then(function (data) {
        if (data.success) {
          if (store['products']) {
            store['products'] = store['products'].concat(data.products);
          } else {
            store['products'] = data.products;
          }
        }
        ReactDOM.render(React.createElement(MyNavigator, null), document.getElementById('app'));
        console.log(store['products']);
      });
      querying = false;
    }).catch(function (err) {
      console.log('Fetch Error :-S', err);
    });
  }
};

var EmptyPage = React.createClass({
  displayName: 'EmptyPage',

  gotoPreviousPage: function gotoPreviousPage(route, navigator) {
    navigator.popPage();
  },
  renderToolbar: function renderToolbar() {
    return React.createElement(
      Ons.Toolbar,
      null,
      React.createElement(
        'div',
        { className: 'left' },
        this.props.route.hasBackButton ? React.createElement(
          Ons.BackButton,
          { onClick: this.gotoPreviousPage.bind(this, this.props.route, this.props.navigator) },
          'Back'
        ) : null
      ),
      React.createElement(
        'div',
        { className: 'center' },
        this.props.route.title
      )
    );
  },
  render: function render() {
    return React.createElement(Ons.Page, { renderToolbar: this.renderToolbar });
  }
});

var LoginPage = React.createClass({
  displayName: 'LoginPage',

  getInitialState: function getInitialState() {
    return {
      username: '',
      password: '',
      vegetables: ['Tomato', 'Cucumber', 'Onion', 'Eggplant', 'Cabbage'],
      selectedVegetable: 'Onion'
    };
  },

  gotoPreviousPage: function gotoPreviousPage(navigator) {
    navigator.popPage();
  },

  renderToolbar: function renderToolbar() {
    return React.createElement(
      Ons.Toolbar,
      null,
      React.createElement(
        'div',
        { className: 'left' },
        this.props.route.hasBackButton ? React.createElement(
          Ons.BackButton,
          { onClick: this.gotoPreviousPage.bind(this, this.props.navigator) },
          'Back'
        ) : null
      ),
      React.createElement(
        'div',
        { className: 'center' },
        'Form input'
      )
    );
  },

  handleClick: function handleClick() {
    if (this.state.username === 'bob' && this.state.password === 'secret') {
      ons.notification.alert('You are now signed in!');
    } else {
      ons.notification.alert('Username or password incorrect!');
    }
  },

  handleUsernameChange: function handleUsernameChange(e) {
    this.setState({ username: e.target.value });
  },
  handlePasswordChange: function handlePasswordChange(e) {
    this.setState({ password: e.target.value });
  },
  handleVegetableChange: function handleVegetableChange(vegetable) {
    this.setState({ selectedVegetable: vegetable });
  },


  render: function render() {
    return React.createElement(
      Ons.Page,
      { renderToolbar: this.renderToolbar },
      React.createElement('div', null),
      React.createElement(
        'section',
        { style: { textAlign: 'center' } },
        React.createElement(
          'p',
          null,
          React.createElement(Ons.Input, {
            value: this.state.username,
            onChange: this.handleUsernameChange,
            modifier: 'underbar',
            float: true,
            placeholder: 'Username' })
        ),
        React.createElement(
          'p',
          null,
          React.createElement(Ons.Input, {
            value: this.state.password,
            onChange: this.handlePasswordChange,
            modifier: 'underbar',
            type: 'password',
            float: true,
            placeholder: 'Password' })
        ),
        React.createElement(
          'p',
          null,
          React.createElement(
            Ons.Button,
            { onClick: this.handleClick },
            'Sign in'
          )
        )
      )
    );
  }
});

var HomePage = React.createClass({
  displayName: 'HomePage',

  getInitialState: function getInitialState() {
    return {
      isOpen: false
    };
  },
  gotoLoginPage: function gotoLoginPage(route, navigator) {
    navigator.pushPage({
      url: 'login',
      title: 'Login Page',
      hasBackButton: true
    });
  },
  gotoPage: function gotoPage(route, navigator) {
    navigator.pushPage({
      url: 'empty',
      title: 'Empty Page',
      hasBackButton: true
    });
  },
  hide: function hide() {
    this.setState({ isOpen: false });
  },
  show: function show() {
    this.setState({ isOpen: true });
  },
  hideLeftMenu: function hideLeftMenu() {
    this.setState({ isOpenLeftMenu: false });
  },
  showLeftMenu: function showLeftMenu() {
    this.setState({ isOpenLeftMenu: true });
  },
  rightMenuHandler: function rightMenuHandler(route, navigator, title) {
    if (title == 'login') {
      this.gotoLoginPage(route, navigator);
    } else if (title == 'messenger') {
      navigator.pushPage({
        url: 'products',
        title: 'Products Page',
        hasBackButton: true
      });
    } else {
      this.gotoPage(route, navigator);
    }
  },

  renderToolbar: function renderToolbar() {
    return React.createElement(
      Ons.Toolbar,
      null,
      React.createElement(
        'div',
        { className: 'left' },
        React.createElement(
          Ons.ToolbarButton,
          { onClick: this.showLeftMenu },
          React.createElement(Ons.Icon, { icon: 'fa-bars' })
        )
      ),
      React.createElement(
        'div',
        { className: 'center', style: { textAlign: 'center' } },
        'Homepage'
      ),
      React.createElement(
        'div',
        { className: 'right' },
        React.createElement(
          Ons.ToolbarButton,
          { onClick: this.show },
          React.createElement(Ons.Icon, { icon: 'fa-user' })
        )
      )
    );
  },
  renderRightMenuList: function renderRightMenuList(title) {
    var list = {
      login: ['fa-user', 'Login'],
      messenger: ['fa-facebook-official', 'Messenger'],
      orders: ['fa-archive', 'Orders'],
      settings: ['fa-cog', 'Settings'],
      policies: ['fa-book', 'Policies'],
      contactus: ['fa-phone', 'Contact Us']
    };
    return React.createElement(
      Ons.ListItem,
      { key: title, onClick: this.rightMenuHandler.bind(this, this.props.route, this.props.navigator, title), tappable: true },
      React.createElement(
        'div',
        { className: 'left' },
        React.createElement(Ons.Icon, { icon: list[title][0] })
      ),
      React.createElement(
        'div',
        { className: 'center' },
        list[title][1]
      )
    );
  },
  render: function render() {
    var _this3 = this;

    return React.createElement(
      Ons.Page,
      null,
      React.createElement(
        Ons.Splitter,
        null,
        React.createElement(
          Ons.SplitterSide,
          {
            width: 200,
            collapse: true,
            isSwipeable: true,
            isOpen: this.state.isOpenLeftMenu,
            onOpen: this.showLeftMenu,
            onClose: this.hideLeftMenu
          },
          React.createElement(
            Ons.Page,
            null,
            React.createElement(Ons.List, {
              dataSource: ['Electronics', 'Beauty', 'Fashion',, 'Home', 'Kids'],
              renderRow: function renderRow(title) {
                return React.createElement(
                  Ons.ListItem,
                  { onClick: _this3.rightMenuHandler.bind(_this3, _this3.props.route, _this3.props.navigator, title), tappable: true },
                  title
                );
              }
            })
          )
        ),
        React.createElement(
          Ons.SplitterSide,
          {
            style: {
              boxShadow: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)'
            },
            side: 'right',
            width: 180,
            collapse: true,
            isSwipeable: true,
            isOpen: this.state.isOpen,
            onClose: this.hide,
            onOpen: this.show
          },
          React.createElement(
            Ons.Page,
            null,
            React.createElement(Ons.List, {
              dataSource: ['login', 'messenger', 'orders', 'settings', 'policies', 'contactus'],
              renderRow: this.renderRightMenuList
            })
          )
        ),
        React.createElement(
          Ons.SplitterContent,
          null,
          React.createElement(
            Ons.Page,
            { renderToolbar: this.renderToolbar },
            'This is the Home Page'
          )
        )
      )
    );
  }
});

var MyNavigator = React.createClass({
  displayName: 'MyNavigator',

  renderPage: function renderPage(route, navigator) {
    //console.log(route);
    if (route.url == 'home') {
      return React.createElement(HomePage, { key: route.title + index, route: route, navigator: navigator });
    } else if (route.url == 'login') {
      return React.createElement(LoginPage, { key: route.title + index, route: route, navigator: navigator });
    } else if (route.url == 'products') {
      return React.createElement(MyProducts, { key: route.title + index, route: route, navigator: navigator });
    } else if (route.url == 'product') {
      return React.createElement(ProductSingle, { key: route.title + index, route: route, navigator: navigator });
    } else {
      return React.createElement(EmptyPage, { key: route.title + index, route: route, navigator: navigator });
    }
  },

  render: function render() {
    return React.createElement(Ons.Navigator, {
      renderPage: this.renderPage,
      initialRoute: {
        url: 'home',
        title: 'SY Online',
        hasBackButton: false
      },
      onPostPush: function onPostPush() {
        index++;
      },
      onPostPop: function onPostPop() {
        index--;
      }
    });
  }
});

ons.ready(function () {
  ReactDOM.render(React.createElement(MyNavigator, null), document.getElementById('app'));
  getProducts(0);
});

/***/ })

/******/ });
//# sourceMappingURL=bundle_onsen.js.map