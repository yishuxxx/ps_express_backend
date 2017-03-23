import {settings} from '../settings';
import {client_http_settings} from '../http_settings';
import _ from 'lodash';
import React, {Component} from 'react';
import {render} from 'react-dom';
import injectTapEventPlugin from 'react-tap-event-plugin';

import { Grid, Row, Col, Button } from 'react-bootstrap';

import RaisedButton from 'material-ui/RaisedButton';
import Dialog from 'material-ui/Dialog';
import {deepOrange500} from 'material-ui/styles/colors';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import TextField from 'material-ui/TextField';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import AutoComplete from 'material-ui/AutoComplete';
import {Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn} from 'material-ui/Table';
import FontIcon from 'material-ui/FontIcon';
import {red500, yellow500, blue500, orange500} from 'material-ui/styles/colors';
import { createStore, combineReducers } from 'redux';

import { twoDToOneDArray, checkExists, serialize, syDateFormat } from './Utils/Helper';

// Needed for onTouchTap
// http://stackoverflow.com/a/34015469/988941
injectTapEventPlugin();

const styles = {
  container: {
    textAlign: 'center',
    paddingTop: 0,
  },
};

const style_hide = {
  display:'none'
}

const muiTheme = getMuiTheme({
  palette: {
    accent1Color: deepOrange500,
  },
});

const blackborder = {margin:"3px 0px 3px 0px",border:"1px solid black",padding:"5px 10px 5px 10px",borderRadius:"3px"};
const style_error_box = {border:"1px solid #ebcccc",color:"#a94442",backgroundColor:"#f2dede"}

const initial_state = {
  search_customer:{
    show:true,
    filter:{
        email:''
    },
    autocomplete:{
        emails:['',''],
        customers:[]
    }
  },
  new_customer:{
    show:false,
    fbuser_name:'',
    firstname:'',
    email:'',
    passwd:'',
    group:'CUSTOMER'
  },
  AddressNew:{
    firstname:'',
    phone:'',
    address1:'',
    postcode:'',
    id_state:313
  },
  order_detail_new:{
    product_quantity:1
  },
  OrderCartRuleNew:{},
  OrderCarrierCreate:{carrier_index:0},
  OrderPaymentCreate:{payment_method:'Bank Wire',sy_is_verified:false},
  product_references:(function(){
    var Products = window.store.Products;
    var onedarray = [];

    for(var i=0;i<Products.length;i++){
      onedarray.push(Products[i]['reference']);
    }
    return onedarray;
  }())
};

var calcPrice = function(){
  var state = rstore.getState();
  var product_index = state.Customer.Order.order_detail_new.product_index;
  var product_attribute_index = state.Customer.Order.order_detail_new.product_attribute_index;

  var tax_multiplier = (100+state.Tax.rate)/100;
  var price = product_index ? 
                (product_attribute_index ?
                  ((state.Products[product_index].price + state.Products[product_index].ProductAttributes[product_attribute_index].price) * tax_multiplier).toFixed(2)
                : (state.Products[product_index].price * tax_multiplier).toFixed(2))
              : null;

  var SpecPrices = state.Products[product_index].SpecificPrices;
  var id_default_group = state.Customer.id_default_group;

  if(product_index && state.Products[product_index].ProductAttributes.length === 0){
    if(SpecPrices && (SpecPrices.length > 0)){
      for(var i=0;i<SpecPrices.length;i++){
        if((SpecPrices[i].id_group == id_default_group) && (SpecPrices[i].id_product_attribute == 0)){
          price = price - SpecPrices[i].reduction;
        }
      }
    }
  }else if(product_index && (product_attribute_index === 0 || product_attribute_index)){
    if(SpecPrices && (SpecPrices.length > 0)){
      for(var i=0;i<SpecPrices.length;i++){
        if((SpecPrices[i].id_group == id_default_group) && (SpecPrices[i].id_product_attribute == state.Products[product_index].ProductAttributes[product_attribute_index].id_product_attribute)){
          price = price - SpecPrices[i].reduction;
        }
      }
    }
  }else{
    alert('please contact yishu')
  }

  return price;
}

var full_initial_state = window.store;
full_initial_state['new_customer'] = initial_state.new_customer;
full_initial_state['search_customer'] = initial_state.search_customer;

var reducer = function(state={},action){

  switch(action.type){

    case 'CUSTOMER_NEW_EDIT':
      state.new_customer[action.name] = action.value;
      return state;
    case 'CUSTOMER_NEW_RESPONSE':
      state.Customer = action.Customer;
      state.new_customer = initial_state.new_customer;
      state.search_customer = initial_state.search_customer;
      state.product_references = initial_state.product_references;
      return state;
    case 'CUSTOMER_NEW_RESPONSE_ERROR':
      state.new_customer.errors = action.errors;
      return state;


    case 'CUSTOMER_SEARCH_EDIT_RESPONSE':
      if(Array.isArray(action.customers)){
        state.search_customer.autocomplete.customers = action.customers;
        var emails = [];
        for(var i=0;i<action.customers.length;i++){
          emails.push(action.customers[i].email);
        }
        state.search_customer.autocomplete.emails = emails;
      }
      return state;
    case 'CUSTOMER_SEARCH_SUBMIT_RESPONSE':
      state.Customer = action.Customer;
      state.new_customer = initial_state.new_customer;
      state.search_customer = initial_state.search_customer;
      state.product_references = initial_state.product_references;
      return state;

    case 'CUSTOMER_SEARCH_SHOW':
      state.search_customer.show = action.show;
      return state;

    case 'CUSTOMER_EDIT':
      state[action.name] = action.value;
      return state;

    case 'ORDER_NEW_SUBMIT_RESPONSE':
      state.Customer.Order = action.Order;
      state.Customer.Order.order_detail_new = initial_state.order_detail_new;
      state.Customer.Order.AddressNew = initial_state.AddressNew;
      state.Customer.Order.OrderCartRuleNew = initial_state.OrderCartRuleNew;
      state.Customer.Order.OrderCarrierCreate = initial_state.OrderCarrierCreate;
      if(checkExists('Customer.Order.Address.State.id_state',state)){
        state.Customer.Order.OrderCarrierCreate.id_carrier = state.Customer.Order.Address.State.Zone.Carriers[0].id_carrier;
      }
      state.Customer.Order.OrderPaymentCreate = initial_state.OrderPaymentCreate;
      return state;
    case 'ORDER_RESPONSE':
      state.Customer.Order = action.Order;
      state.Customer.Order.order_detail_new = initial_state.order_detail_new;
      state.Customer.Order.AddressNew = initial_state.AddressNew;
      state.Customer.Order.OrderCartRuleNew = initial_state.OrderCartRuleNew;
      state.Customer.Order.OrderCarrierCreate = initial_state.OrderCarrierCreate;
      if(checkExists('Customer.Order.Address.State.id_state',state)){
        state.Customer.Order.OrderCarrierCreate.id_carrier = state.Customer.Order.Address.State.Zone.Carriers[0].id_carrier;
      }
      state.Customer.Order.OrderPaymentCreate = initial_state.OrderPaymentCreate;
      return state;

    case 'ORDER_EDIT':
      state.Customer.Order[action.name] = action.value;
      return state;

    case 'ORDER_DETAIL_NEW_CHANGE':
      state.Customer.Order.order_detail_new[action.name] = action.value;
      return state;
    case 'ORDER_DETAIL_NEW_SELECT_PRODUCT':
      state.Customer.Order.order_detail_new.id_product = state.Products[action.product_index].id_product;
      state.Customer.Order.order_detail_new.product_index = action.product_index;
      state.Customer.Order.order_detail_new.product_reference = action.product_reference;
      if(state.Products[action.product_index].ProductAttributes.length!=0){
        state.Customer.Order.order_detail_new.id_product_attribute = state.Products[action.product_index].ProductAttributes[0].id_product_attribute;
        state.Customer.Order.order_detail_new.product_attribute_reference = state.Products[action.product_index].ProductAttributes[0].reference;
        state.Customer.Order.order_detail_new.product_attribute_index = 0;
      }
      else{
        state.Customer.Order.order_detail_new.id_product_attribute = null;
        state.Customer.Order.order_detail_new.product_attribute_reference = null;
        state.Customer.Order.order_detail_new.product_attribute_index = null;
      }
      state.Customer.Order.order_detail_new.unit_price_tax_incl = calcPrice();
      return state;
    case 'ORDER_DETAIL_NEW_SELECT_PRODUCT_ATTRIBUTE':
      state.Customer.Order.order_detail_new.id_product_attribute = state.Products[state.Customer.Order.order_detail_new.product_index].ProductAttributes[action.product_attribute_index].id_product_attribute;
      state.Customer.Order.order_detail_new.product_attribute_reference = state.Products[state.Customer.Order.order_detail_new.product_index].ProductAttributes[action.product_attribute_index].reference;
      state.Customer.Order.order_detail_new.product_attribute_index = action.product_attribute_index;
      state.Customer.Order.order_detail_new.unit_price_tax_incl = calcPrice();
      return state;

    case 'ADDRESS_UPDATE_CHANGE':
      state.Customer.Order.Address[action.name] = action.value;
      return state;
    case 'ADDRESS_UPDATE_SUBMIT_RESPONSE':
      state.Customer.Order.Address = action.Address;
      return state;
    case 'ADDRESS_CREATE_CHANGE':
      state.Customer.Order.AddressNew[action.name] = action.value;
      return state;
    case 'ADDRESS_CREATE_SUBMIT_RESPONSE':
      state.Customer.Order.Address = action.Address;
      state.Customer.Order.AddressNew = null;
      return state;

    case 'ORDER_CART_RULE_CREATE_CHANGE':
      state.Customer.Order.OrderCartRuleNew[action.name] = action.value;
      return state;
    case 'ORDER_CART_RULE_CREATE_SUBMIT_RESPONSE':
      state.Customer.Order.OrderCartRules = action.OrderCartRules; 
      return state;

    case 'ORDER_CART_RULE_DELETE_SUBMIT_RESPONSE':
      state.Customer.Order.OrderCartRules = action.OrderCartRules; 
      return state;

    case 'ORDER_CARRIER_CREATE_CHANGE':
      state.Customer.Order.OrderCarrierCreate.carrier_index = action.carrier_index
      state.Customer.Order.OrderCarrierCreate.id_carrier = action.id_carrier;
      return state;
    case 'ORDER_CARRIER_CREATE_SUBMIT_RESPONSE':
      state.Customer.Order.OrderCarrier = action.OrderCarrier;
      return state;
    case 'ORDER_CARRIER_UPDATE_CHANGE':
      state.Customer.Order.OrderCarrier[action.name] = action.value;
      return state
    case 'ORDER_CARRIER_UPDATE_SUBMIT_RESPONSE':
      state.Customer.Order.OrderCarrier = action.OrderCarrier;
      return state;

    case 'ORDER_PAYMENT_CREATE_CHANGE':
      state.Customer.Order.OrderPaymentCreate[action.name] = action.value;
      return state;
    case 'ORDER_PAYMENT_CREATE_SUBMIT_RESPONSE':
      state.Customer.Order.OrderPayments = action.OrderPayments;
      return state;

    default:
      return state;
  }

}

window.rstore = createStore(reducer,full_initial_state);
window.checkExists = checkExists;

class Main extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      open: false,
    };
  }

  handleRequestClose = () => {
    this.setState({
      open: false,
    });
  }

  handleTouchTap = () => {
    this.setState({
      open: true,
    });
  }

  handleChangeCustomerSearch = (value) => {

    fetch(settings.base_dir+"/search/customer?email="+value,
      client_http_settings.GET_JSON,
    ).then(function(res) {
      if (res.ok) {
        res.json().then(function(data) {
          if(data.success){
            rstore.dispatch({
              type:'CUSTOMER_SEARCH_EDIT_RESPONSE',
              customers:data.data,
            });
          }
        });

      } else if (res.status == 401) {
        alert("Oops! You are not authorized.");
      }
    }, function(e) {
      alert(e);
    });

  };

  handleSubmitCustomerSearch = (value) => {
    var customers = this.props.search_customer.autocomplete.customers;
    var x = 0;
    while(customers[x].email != value){
      x++;
    }

    fetch(settings.base_dir+"/customer/get/"+customers[x].id_customer,
      client_http_settings.GET_JSON,
    ).then(function(res) {
      if (res.ok) {
        res.json().then(function(data) {
          if(data.success){
            rstore.dispatch({
              type:'CUSTOMER_SEARCH_SUBMIT_RESPONSE',
              Customer:data.Customer
            });
          }
        });

      } else if (res.status == 401) {
        alert("Oops! You are not authorized.");
      }
    }, function(e) {
      alert(e);
    });
  };

  handleShow = (event) => {
    if(event.target.name === 'show'){
      rstore.dispatch({
        type:'CUSTOMER_SEARCH_SHOW',
        show:true
      });
    }else if(event.target.name === 'hide'){
      rstore.dispatch({
        type:'CUSTOMER_SEARCH_SHOW',
        show:false
      });
    }
  };

  render() {
    this.props = this.props.data;

    return (  
      <MuiThemeProvider muiTheme={muiTheme}>
        <div style={styles.container}>
          <Row>

            <Col md={3}>
              
              <section id="customer_container" style={blackborder}>

                <section id="search_customer" style={blackborder}>
                  <h4>
                    Search Customer 
                    {this.props.search_customer.show ? <a name="hide"style={{cursor:"pointer"}} onClick={this.handleShow} >( Hide )</a> : <a name="show" style={{cursor:"pointer"}} onClick={this.handleShow}>( Show )</a>}
                  </h4>
                  <article style={this.props.search_customer.show ? null : style_hide}>
                    <AutoComplete
                      floatingLabelText="Email"
                      floatingLabelFixed={true}
                      dataSource={this.props.search_customer.autocomplete.emails}
                      onUpdateInput={this.handleChangeCustomerSearch}
                      onNewRequest={this.handleSubmitCustomerSearch}
                    />
                  </article>
                </section> {/* Search Customer */}

              {checkExists('new_customer',this.props) ? <CustomerNew data={this.props.new_customer} /> : null}

              </section> {/* Customer Container */}

 			        {checkExists('Customer',this.props) ? <CustomerEdit data={this.props.Customer} /> : null}
              
            </Col>

            <Col md={6}>

              {checkExists('Customer', this.props) ? <OrderList data={this.props.Customer.Orders} /> : null}

              <Row>
                <Col md={6}>
                  {checkExists('Customer.Order',this.props) ? <OrderEdit data={this.props.Customer.Order} OrderStates={this.props.OrderStates} SYPages={this.props.SYPages}/> : null}
                </Col>
                
                <Col md={6}>
                  {checkExists('Customer.Order.Address.id_address',this.props) ? <AddressEdit crud="UPDATE" Address={this.props.Customer.Order.Address} States={this.props.Country.States}/> : null}
                  {(!checkExists('Customer.Order.Address.id_address',this.props) && checkExists('Customer.Order',this.props)) ? <AddressEdit crud="CREATE" Address={this.props.Customer.Order.AddressNew} States={this.props.Country.States}/> : null}

                </Col>
              </Row>

              {checkExists('Customer.Order', this.props) ? 
                <OrderDetailsEdit OrderDetails={checkExists('Customer.Order.OrderDetails', this.props) ? this.props.Customer.Order.OrderDetails : [] } 
                                  order_detail_new={this.props.Customer.Order.order_detail_new}
                                  Tax={this.props.Tax}
                                  Products={this.props.Products}
                                  product_references={this.props.product_references}
                                  id_default_group={this.props.Customer.id_default_group}
                                  Order={this.props.Customer.Order}
                                  CartRules={this.props.CartRules}
                /> : null}
                

                <Row>
                  <Col md={6}>
                    { (checkExists('Customer.Order.Address.State.id_state',this.props) && !checkExists('Customer.Order.OrderCarrier.id_carrier',this.props)) ? <OrderCarrierCreate OrderCarrierCreate={this.props.Customer.Order.OrderCarrierCreate} Carriers={this.props.Customer.Order.Address.State.Zone.Carriers} /> : null}
                    {checkExists('Customer.Order.OrderCarrier.id_carrier',this.props) ? <OrderCarrierUpdate OrderCarrier={this.props.Customer.Order.OrderCarrier} Carriers={this.props.Customer.Order.Address.State.Zone.Carriers} /> : null}
                  </Col>
                  <Col md={6}>
                    {checkExists('Customer.Order',this.props) ? <OrderPaymentCreate OrderPaymentCreate={this.props.Customer.Order.OrderPaymentCreate} /> : null}
                    {checkExists('Customer.Order.OrderPayments',this.props) ? <OrderPayments OrderPayments={this.props.Customer.Order.OrderPayments} /> : null}
                  </Col>
                </Row>


            </Col>

            <Col md={3}>
              <h4>Messages</h4>
              <section id="messages"></section>
            </Col>

          </Row>

        </div>
      </MuiThemeProvider>
    );
  }
}


class CustomerNew extends Component{
  constructor(props,context){
    super(props,context)
  }


  handleChangeNewCustomer = (event) => {
    //window.store.new_customer[event.target.name] = event.target.value;
    //this.setState({new_customer:window.store.new_customer});
    rstore.dispatch({
      type:'CUSTOMER_NEW_EDIT',
      name:event.target.name,
      value:event.target.value
    });

  }

  handleSubmitNewCustomer = (e) => {
    fetch(settings.base_dir+"/customer/create?"+serialize(rstore.getState().new_customer),
      client_http_settings.POST_JSON
    ).then(function(res) {
      if (res.ok) {
        res.json().then(function(response) {
          if(response.success){
            //window.store.customer = data.data[0];
            //this2.setState({customer:window.store.customer});
            rstore.dispatch({
              type:'CUSTOMER_NEW_RESPONSE',
              Customer:response.Customer
            });
          }else if(!response.success){
            rstore.dispatch({
              type:'CUSTOMER_NEW_RESPONSE_ERROR',
              errors:response.errors
            });
          }
        });

      } else if (res.status == 401) {
        alert("Oops! You are not authorized.");
      }
    }, function(e) {
      alert(e);
    });
  }

  render(){
    this.props = this.props.data;

    return(
      <section id="new_customer" style={blackborder}>
        
        <h4>New Customer</h4>

        <TextField
          name="fbuser_name"
          value={this.props.fbuser_name}
          onChange={this.handleChangeNewCustomer}
          floatingLabelText="Facebook Name"
          floatingLabelFixed={true}
        />
        <br/>

        <TextField
          name="firstname"
          value={this.props.firstname}
          onChange={this.handleChangeNewCustomer}
          floatingLabelText="Name"
          floatingLabelFixed={true}
        />
        <br/>

        <TextField
          name="email"
          value={this.props.email}
          onChange={this.handleChangeNewCustomer}
          floatingLabelText="Email"
          floatingLabelFixed={true}
        />
        <br/>

        <select 
          name="group" 
          value={this.props.group} 
          onChange={this.handleChangeNewCustomer}
          style={{width:"80%",height:"35px",margin:"0px 20px"}}
        >
          <option value="CUSTOMER">CUSTOMER</option>
          <option value="AGENT">AGENT</option>
        </select>
        <br/>

        <TextField
          name="passwd"
          value={this.props.passwd}
          onChange={this.handleChangeNewCustomer}
          floatingLabelText="Password(New)"
          floatingLabelFixed={true}
        />
        <br/>

        <div id="new_customer_errors" style={this.props.errors ? style_error_box : null}>
          {this.props.errors ? this.props.errors.map((error,index) => (
            <div className="error_message">{error.message}</div>
          )) : null}
        </div>

        <RaisedButton label="Cancel" secondary={true} onClick={this.handleSubmitNewCustomer}/>
        <RaisedButton label="Add" primary={true} onClick={this.handleSubmitNewCustomer}/>
      </section>

    );
  }
}


class CustomerEdit extends Component{

  constructor (props,context){
    super(props,context);
  }

  render(){
    this.props = this.props.data;
    return(
      <section id="customer" style={blackborder}>

        <h4>Customer</h4>

        <TextField 
          name="fbuser_name" 
          value={this.props.fbuser_name}
          floatingLabelText="Facebook Name"
          floatingLabelFixed={true}
        /><br/>

        <TextField 
          name="customer_firstname" 
          value={this.props.firstname}
          floatingLabelText="Customer Name"
          floatingLabelFixed={true}
        /><br/>

        <TextField 
          name="customer_email" 
          value={this.props.email}
          floatingLabelText="Email"
          floatingLabelFixed={true}
        /><br/>

        <TextField 
          name="customer_group" 
          value={this.props.id_default_group}
          floatingLabelText="Group"
          floatingLabelFixed={true}
        /><br/>

        <TextField 
          name="customer_passwd" 
          value={this.props.passwd}
          floatingLabelText="Password(Current)"
          floatingLabelFixed={true}
        /><br/>

        <TextField 
          name="customer_passwd_new" 
          value={this.props.passwd_new}
          floatingLabelText="Password(New)"
          floatingLabelFixed={true}
        />
         {/* customer */}
      </section>
    );
  }
}

class AddressEdit extends Component{

  constructor (props,context){
    super(props,context);
  }

  handleChange = (crud,event) => {
    rstore.dispatch({
      type:(crud === 'UPDATE' ? 'ADDRESS_UPDATE_CHANGE' : 'ADDRESS_CREATE_CHANGE'),
      name:event.target.name,
      value:event.target.value
    });
  }

  handleClick = (crud,event) => {
    const state = rstore.getState();
    var obj = crud === 'UPDATE' ? state.Customer.Order.Address : state.Customer.Order.AddressNew;
    obj['id_customer'] = state.Customer.id_customer;
    obj['id_order'] = state.Customer.Order.id_order;

    var base_url = crud === 'UPDATE' ? '/address/update' : '/address/create';

    fetch(settings.base_dir+base_url+"?"+serialize(obj),
      client_http_settings.POST_JSON
    ).then(function(res){
      return res.json();
    }).then(function(response){
      if(response.success){
        rstore.dispatch({
          type:(crud === 'UPDATE' ? 'ADDRESS_UPDATE_SUBMIT_RESPONSE' : 'ADDRESS_CREATE_SUBMIT_RESPONSE'),
          Address:response.Address
        });
      }else{
        alert('contact yishu')
      }
    })
  }

  render(){   
    return(
      <section id="address" style={blackborder}>
        <h4>{this.props.crud === 'UPDATE' ? 'Address' : 'Address New'}</h4>

        <Row>
        <Col md={12}>
        <TextField
          name="firstname"
          value={this.props.Address.firstname}
          onChange={this.handleChange.bind(null,this.props.crud)}
          floatingLabelText="Receiver Name"
          floatingLabelFixed={true}
        />
        </Col>
        </Row>

        <Row>
        <Col md={12}>
        <TextField
          name="phone"
          value={this.props.Address.phone}
          onChange={this.handleChange.bind(null,this.props.crud)}
          floatingLabelText="Receiver Phone"
          floatingLabelFixed={true}
        />
        </Col>
        </Row>

        <Row>
        <Col md={12}>
        <TextField
          name="address1"
          value={this.props.Address.address1}
          onChange={this.handleChange.bind(null,this.props.crud)}
          floatingLabelText="Address"
          floatingLabelFixed={true}
          multiLine={true}
          rows={1}
          rowsMax={4}
          style={{textAlign:'left'}}
        />
        </Col>
        </Row>

        <Row>
        <Col md={12}>
        <TextField
          name="postcode"
          value={this.props.Address.postcode}
          onChange={this.handleChange.bind(null,this.props.crud)}
          floatingLabelText="Postcode"
          floatingLabelFixed={true}
        />
        </Col>
        </Row>

        <Row>
        <Col md={12}>
          <select name="id_state" value={this.props.Address.id_state} onChange={this.handleChange.bind(null,this.props.crud)} style={{width:"80%",height:"35px",margin:"0px 20px"}}>
            {this.props.States.map((State,index)=>(
              <option name="id_state" key={index} value={State.id_state}>{State.name}</option>
            ))}
          </select>
        </Col>
        </Row>

        <Row>
          <Col md={12}>
            <button id="address" onClick={this.handleClick.bind(null,this.props.crud)}>SAVE</button>
          </Col>
        </Row>

        {/* Address */}
      </section>
    );
  }
}

class SYCompactField extends Component {
  constructor(props,context){
    super(props,context);
  }

  render() {
    return (
      <Row>
        <Col md={4} style={{textAlign:"right"}}>
          <span style={{color:"#999",fontSize:"12px"}}>{this.props.label+" : "}</span>
        </Col>
        <Col md={8} style={{textAlign:"left"}}>
          <span style={{fontSize:"16px"}}>{this.props.value}</span>
        </Col>
      </Row>
    );
  }
}

class OrderList extends Component{
  constructor(props,context) {
    super(props,context);
  }

  handleOrderSelect = (event) => {    
    fetch(settings.base_dir+"/order/get/"+event.target.name,
      client_http_settings.GET_JSON
    ).then(function (res) {
      return res.json();
    }).then(function (response) {
      if(response.success){
        rstore.dispatch({
          type:'ORDER_RESPONSE',
          Order:response.Order
        });
      }else if(!response.success){
        alert('Ooops got some problem, summon Yishu~');
      }
    });
  }


  handleOrderCreate = (event) =>{
    const state = rstore.getState();
    var obj = {id_customer: state.Customer.id_customer};

    fetch(settings.base_dir+"/order/create?"+serialize(obj),
      client_http_settings.POST_JSON
    ).then(function (res) {
      return res.json();
    }).then(function (response) {
      if(response.success){
        rstore.dispatch({
          type:'ORDER_NEW_SUBMIT_RESPONSE',
          Order:response.Order
        });
      }else if(!response.success){
        alert('Ooops got some problem, summon Yishu~');
      }
    });
  }

  render(){
    this.props = this.props.data;
    return(
      <section id="order_list" style={blackborder}>
        <h4>Previous Orders</h4>
        <table style={{width:"100%",textAlign:"right"}}>

          <thead>
            <tr>
              <th style={{textAlign:"right"}}>Order Id</th>
              <th style={{textAlign:"right"}}>Date</th>
              <th style={{textAlign:"right"}}>Ref.</th>
              <th style={{textAlign:"right"}}>Total</th>
              <th style={{textAlign:"right"}}>Paid</th>
              <th style={{textAlign:"right"}}></th>
            </tr>
          </thead>

          <tbody>
            {this.props.map((Order, index) => (
              <tr key={index}>
                <td>{Order.id_order}</td>
                <td>{syDateFormat(Order.date_add)}</td>
                <td>{Order.reference}</td>
                <td>{Order.total_paid_tax_incl.toFixed(2)}</td>
                <td>{Order.total_paid_real.toFixed(2)}</td>
                <td>
                  <button onClick={this.handleOrderSelect} name={Order.id_order} >
                    SELECT
                  </button>
                </td>
              </tr>
            ))}

              <tr key={'add_order'}>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td>
                  <button onClick={this.handleOrderCreate} name="order_new">
                    NEW ORDER
                  </button>
                </td>
              </tr>

          </tbody>

        </table>
      </section>
    );
  }
}

class OrderEdit extends Component {
  constructor (props,context){
    super(props,context);
  }

  handleChange = (name,event,index,value) => {
    if(name === 'current_state' || name === 'id_sypage'){
    	rstore.dispatch({
    	  type:'ORDER_EDIT',
    	  name:name, // MUST BIND PARAMETERS TO GET NAME
    	  value:value //event.target.value does not work, MUST USE THIS METHOD
    	});
    }else{
      alert('the field "'+name+'" does not exist');
    }
  }

  handleClick = (event) =>{

    const state = rstore.getState();
    var obj = {
      id_order: state.Customer.Order.id_order,
      current_state: state.Customer.Order.current_state,
      id_sypage: state.Customer.Order.id_sypage
    };

    var str = serialize(obj);

   	fetch(settings.base_dir+"/order/update/"+state.Customer.Order.id_order+'?'+str,
      client_http_settings.POST_JSON
    ).then(function (response) {
  		return response.json();
  	}).then(function (response) {
      if(response.success){
  		  rstore.dispatch({
  		    type:'ORDER_RESPONSE',
  		    Order:response.Order
  		  });
      }else if(!response.success){
        alert('Ooops got some problem, summon Yishu~');
      }
  	});
  }

  render(){
    this.props = _.merge(this.props.data,{OrderStates:this.props.OrderStates,SYPages:this.props.SYPages});
    return(
      <section id="order" style={blackborder}>
        <h4>Order Info</h4>

        <SYCompactField label="id_order" value={this.props.id_order} />
        <SYCompactField label="reference" value={this.props.reference} />
        <SYCompactField label="date_add" value={syDateFormat(this.props.date_add)} />
        <SYCompactField label="date_upd" value={syDateFormat(this.props.date_upd)} />

         <SelectField
          name="current_state"
          value={this.props.current_state+""}
          floatingLabelFixed={true}
          floatingLabelText={"Order Status"}
          onChange={this.handleChange.bind(null,"current_state")}
          style={{textAlign:"left"}}
        >
          {this.props.OrderStates.map((OrderState,index) => (
            <MenuItem name="current_state" key={index} style={{color:OrderState.color}} value={OrderState.id_order_state+""} primaryText={OrderState.OrderStateLang.name} />
          ))}
        </SelectField><br/>

         <SelectField
          value={this.props.id_sypage+""}
          defaultValue={"SYOV"}
          floatingLabelFixed={true}
          floatingLabelText={"Page"}
          onChange={this.handleChange.bind(null,"id_sypage")}
          style={{textAlign:"left"}}
        >
          {this.props.SYPages.map((SYPage,index) => (
            <MenuItem key={index} value={SYPage.id_sypage+""} primaryText={SYPage.name} />
          ))}
        </SelectField><br/>

        <button onClick={this.handleClick}>Save</button>

      </section>
    );
  }
}

class OrderDetailsEdit extends Component{
  constructor(props,context) {
    super(props,context);
  }

  handleUpdateInput = () => {
    return '';
  }

  handleNewRequest = (chosenRequest,index) => {
    if(index !== -1){
      rstore.dispatch({
        type:'ORDER_DETAIL_NEW_SELECT_PRODUCT',
        name:'reference',
        product_reference:chosenRequest,
        product_index:index
      });
    }else{
      alert('you must choose a product')
    }
  }

  handleChangeOrderDetailNew = (event) => {
    rstore.dispatch({
      type:'ORDER_DETAIL_NEW_CHANGE',
      name:event.target.name,
      value:event.target.value
    });
  }

  handleSubmitOrderDetailNew = () => {
    const state = rstore.getState();
    var obj = {
      id_product: state.Customer.Order.order_detail_new.id_product,
      product_quantity: state.Customer.Order.order_detail_new.product_quantity,
      unit_price_tax_incl: state.Customer.Order.order_detail_new.unit_price_tax_incl
    };

    checkExists('Customer',state) ? obj['id_customer'] = state.Customer.id_customer : null;
    state.Customer.Order.id_order ? (obj['id_order'] = state.Customer.Order.id_order) : null;
    state.Customer.Order.order_detail_new.id_product_attribute ? (obj['id_product_attribute'] = state.Customer.Order.order_detail_new.id_product_attribute) : null;

    var str = serialize(obj);

    fetch(settings.base_dir+"/orderdetail/create?"+str,
      client_http_settings.POST_JSON
    ).then(function(res){
      if(res.ok){
        res.json().then(function(response){
          if(response.success){
            rstore.dispatch({
              type:'ORDER_RESPONSE',
              Order:response.Order
            })
          }
        })
      }
    })

  }

  handleDelete = (id_order_detail,event) => {
    const state = rstore.getState();
    var obj = {
      id_order: state.Customer.Order.id_order,
      id_order_detail: id_order_detail
    };
    var str = serialize(obj);

    fetch(settings.base_dir+"/orderdetail/delete?"+str,
      client_http_settings.POST_JSON
    ).then(function(res){
      if(res.ok){
        res.json().then(function(response){
          if(response.success){
            rstore.dispatch({
              type:'ORDER_RESPONSE',
              Order:response.Order
            });
          }else{
            alert('Ooops got some problem, summon Yishu~');
          }
        })
      }
    })
  }

  handleProductAttributeSelect = (event) => {
    rstore.dispatch({
      type:"ORDER_DETAIL_NEW_SELECT_PRODUCT_ATTRIBUTE",
      product_attribute_index:event.target.value,
    })
  }

  handleOrderCartRuleSelect = (event) => {
    rstore.dispatch({
      type:'ORDER_CART_RULE_CREATE_CHANGE',
      name:event.target.name,
      value:event.target.value
    })
  }

  handleOrderCartRuleSubmit = (event) => {
    const state = rstore.getState();
    var obj = {
      id_cart_rule:state.Customer.Order.OrderCartRuleNew.id_cart_rule,
      id_order:state.Customer.Order.id_order
    }

    fetch(settings.base_dir+'/ordercartrule/create?'+serialize(obj),
      client_http_settings.POST_JSON
    ).then(function(res){
      return res.json();
    }).then(function(response){
      if(response.success){
        rstore.dispatch({
          type:'ORDER_CART_RULE_CREATE_SUBMIT_RESPONSE',
          OrderCartRules:response.OrderCartRules
        })
      }else{

      }
    })
  }

  handleOrderCartRuleDeleteSubmit = (event) => {
    const state = rstore.getState();

    var obj = {
      id_order_cart_rule:event.target.attributes.getNamedItem('data-id').value,
      id_order:state.Customer.Order.id_order
    }

    fetch(settings.base_dir+'/ordercartrule/delete?'+serialize(obj),
      client_http_settings.POST_JSON
    ).then(function(res){
      return res.json();
    }).then(function(response){
      if(response.success){
        rstore.dispatch({
          type:'ORDER_CART_RULE_DELETE_SUBMIT_RESPONSE',
          OrderCartRules:response.OrderCartRules
        })
      }else{

      }
    })
  }

  render(){
    var product_index = this.props.order_detail_new.product_index;
    var product_attribute_index = this.props.order_detail_new.product_attribute_index;
    var tax_multiplier = (100+this.props.Tax.rate)/100;

    return(
      <section id="items" style={blackborder}>
        <h4>Items</h4>

        <table id="products" style={{fontSize:'16px'}}>
        <tbody>
        {this.props.OrderDetails.map((OrderDetail,index) => (
          <tr key={index}>
            <td style={{width:"40px"}}>{index+1}{") "}</td>

            <td>
              <div style={{ textAlign:"left", fontSize:"16px" }}>{"("+OrderDetail.product_id +") ("+ OrderDetail.product_attribute_id + ") " + OrderDetail.product_reference}</div>
            </td>
            
            <td style={{width:"50px"}}>
              {""}
            </td>

            <td style={{width:"50px"}}>
              <div style={{ fontSize:"16px",textAlign:"right"}}>{OrderDetail.product_quantity}</div>
            </td>

            <td style={{width:"70px"}}>
              <div style={{ fontSize:"16px",textAlign:"right"}}>{OrderDetail.unit_price_tax_incl.toFixed(2)}</div>
            </td>

            <td style={{width:"70px"}}>
              <div style={{ fontSize:"16px",textAlign:"right"}}>{OrderDetail.total_price_tax_incl.toFixed(2)}</div>
            </td>
            <td style={{width:"50px"}}>
              <button name="delete" onClick={this.handleDelete.bind(null,OrderDetail.id_order_detail)}>-</button>
            </td>
          </tr>
        ))}
          <tr key={"add_product"}>
            <td></td>
            <td colSpan="2">
              <AutoComplete
                name="reference"
                floatingLabelText="SKUID"
                floatingLabelFixed={true}
                dataSource={this.props.product_references}
                filter={AutoComplete.fuzzyFilter}
                maxSearchResults={20}
                onUpdateInput={this.handleUpdateInput}
                onNewRequest={this.handleNewRequest}
                fullWidth={true}
              />
            </td>

            <td>
              <TextField
                name="product_quantity"
                value={this.props.order_detail_new.product_quantity}
                floatingLabelText="QTY"
                floatingLabelFixed={true}
                fullWidth={true}
                onChange={this.handleChangeOrderDetailNew}
              />
            </td>

            <td>
              <TextField
                name="unit_price_tax_incl"
                value={this.props.order_detail_new.unit_price_tax_incl}
                floatingLabelText="Price"
                floatingLabelFixed={true}
                fullWidth={true}
                onChange={this.handleChangeOrderDetailNew}
              />
            </td>
            <td></td>
            <td><button onClick={this.handleSubmitOrderDetailNew}>ADD</button></td>
          </tr>

          <tr>
            <td></td>
            <td>
              {product_index && this.props.Products[product_index].ProductAttributes.length!==0 ?
              <select onChange={this.handleProductAttributeSelect} style={{width:"100%",height:"35px"}}>
                {this.props.Products[product_index].ProductAttributes.map((ProductAttribute,index) => (
                  <option
                    value={index}
                    key={index}
                  >
                  {ProductAttribute.reference}
                  </option>
                ))}
              </select> : null}
            </td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>

          <tr>
            <td></td>
            <td></td>
            <td colSpan="2">Discounts:</td>
            <td colSpan="2">
              <select name="id_cart_rule" onChange={this.handleOrderCartRuleSelect} style={{height:"35px"}}>
                  <option key="empty" name="id_cart_rule" value="">{""}</option>
                {this.props.CartRules.map((CartRule,index)=>(
                  <option 
                    key={index} 
                    name="id_cart_rule"
                    value={CartRule.id_cart_rule}
                  >
                    {CartRule.description}
                  </option>
                ))}
              </select>
            </td>
            <td><button onClick={this.handleOrderCartRuleSubmit}>ADD</button></td>
            <td></td>
          </tr>

          
          {(this.props.Order.OrderCartRules && this.props.Order.OrderCartRules.length >0) ? 
            (this.props.Order.OrderCartRules.map((OrderCartRule,index)=>(
              <tr style={{textAlign:"right"}}>
                <td></td>
                <td></td>
                <td colSpan="3">{OrderCartRule.name + "(" + OrderCartRule.free_shipping + ")"}</td>
                <td>{(OrderCartRule.value*(-1)).toFixed(2)}</td>
                <td>
                  <button 
                    name="id_order_cart_rule" 
                    data-id={OrderCartRule.id_order_cart_rule}
                    onClick={this.handleOrderCartRuleDeleteSubmit}
                  >-
                  </button>
                </td>
              </tr>
            )))
          : null}


          <tr style={{textAlign:"right",borderTop:"1px dashed black"}}>
            <td></td>
            <td></td>
            <td colSpan="3">Total Products:</td>
            <td>{this.props.Order.total_products_wt.toFixed(2)}</td>
            <td></td>
          </tr>

          <tr style={{textAlign:"right"}}>
            <td></td>
            <td></td>
            <td colSpan="3">
              <div>Total Discounts:</div>
            </td>
            <td>
              <div>{(this.props.Order.total_discounts_tax_incl*(-1)).toFixed(2)}</div>
            </td>
            <td></td>
          </tr>

          <tr style={{textAlign:"right"}}>
            <td></td>
            <td></td>
            <td colSpan="3">Total Shipping:</td>
            <td>{this.props.Order.total_shipping_tax_incl.toFixed(2)}</td>
            <td></td>
          </tr>

          <tr style={{textAlign:"right"}}>
            <td></td>
            <td></td>
            <td colSpan="3">Total:</td>
            <td>{this.props.Order.total_paid_tax_incl.toFixed(2)}</td>
            <td></td>
          </tr>

          <tr style={{textAlign:"right"}}>
            <td></td>
            <td></td>
            <td colSpan="3">Total Paid:</td>
            <td>{this.props.Order.total_paid_real.toFixed(2)}</td>
            <td></td>
          </tr>

          <tr style={{textAlign:"right"}}>
            <td></td>
            <td></td>
            <td colSpan="3">Remaining Balance:</td>
            <td>{(this.props.Order.total_paid_tax_incl - this.props.Order.total_paid_real).toFixed(2)}</td>
            <td></td>
          </tr>

        </tbody>
        </table>
      </section>
    );
  }
}

class OrderCarrierCreate extends Component{
  constructor(props,context) {
    super(props,context);
  }

  handleOrderCarrierCreateChange = (event) => {
    rstore.dispatch({
      type:'ORDER_CARRIER_CREATE_CHANGE',
      carrier_index:event.target[event.target.selectedIndex].getAttribute('data-id'),
      id_carrier:event.target.value
    })
  }

  handleOrderCarrierCreateSubmit = (event) => {
    const state = rstore.getState();
    var obj = state.Customer.Order.OrderCarrierCreate;
    obj.id_order = state.Customer.Order.id_order;

    fetch(settings.base_dir+'/ordercarrier/create?'+serialize(obj),
      client_http_settings.POST_JSON
    ).then(function(res){
      return res.json();
    }).then(function(response){
      if(response.success){
        rstore.dispatch({
          type:'ORDER_CARRIER_CREATE_SUBMIT_RESPONSE',
          OrderCarrier:response.OrderCarrier
        })
      }else{
        alert('please contact yishu')
      }
    })
  }
  
  render(){
    console.log(this.props);
    return(
      <section id="order_carrier_create" style={blackborder}>
        <h4>Carrier New</h4>
        <div>
          <select 
            name="id_carrier"
            value={this.props.Carriers[this.props.OrderCarrierCreate.carrier_index].id_carrier} 
            onChange={this.handleOrderCarrierCreateChange}
            style={{height:"35px"}}
          >
            {this.props.Carriers.map((Carrier,index) => (
              <option key={index} name="id_carrier" value={Carrier.id_carrier} data-id={index}>{Carrier.name}</option>
            ))}
          </select>
          <button onClick={this.handleOrderCarrierCreateSubmit}>SELECT</button>
        </div>
      </section>
    );
  }
}


class OrderCarrierUpdate extends Component{
  constructor(props,context) {
    super(props,context);
  }

  handleOrderCarrierUpdateChange = (event) => {
    rstore.dispatch({
      type:'ORDER_CARRIER_UPDATE_CHANGE',
      name:event.target.name,
      value:event.target.value
    })
  }

  handleOrderCarrierUpdateSubmit = (event) => {
    const state = rstore.getState();
    var obj = state.Customer.Order.OrderCarrier;
    obj.id_order = state.Customer.Order.id_order;

    fetch(settings.base_dir+'/ordercarrier/update?'+serialize(obj),
      client_http_settings.POST_JSON
    ).then(function(res){
      return res.json();
    }).then(function(response){
      if(response.success){
        rstore.dispatch({
          type:'ORDER_CARRIER_UPDATE_SUBMIT_RESPONSE',
          OrderCarrier:response.OrderCarrier
        })
      }else{
        alert('please contact yishu')
      }
    })
  }
  
  render(){
    console.log(this.props);
    return(
      <section id="order_carrier" style={blackborder}>
        <h4>Carrier</h4>
        <div>
          <select 
            name="id_carrier"
            value={this.props.OrderCarrier.id_carrier} 
            onChange={this.handleOrderCarrierUpdateChange}
            style={{height:"35px"}}
          >
            {this.props.Carriers.map((Carrier,index) => (
              <option key={index} name="id_carrier" value={Carrier.id_carrier}>{Carrier.name}</option>
            ))}
          </select>
        </div>
        <div>
          <TextField
            name="tracking_number"
            value={this.props.OrderCarrier.tracking_number}
            onChange={this.handleOrderCarrierUpdateChange}
            floatingLabelText="Tracking No."
            floatingLabelFixed={true}
          />
        </div>
        <div>
          <button onClick={this.handleOrderCarrierUpdateSubmit}>SAVE</button>
        </div>
      </section>
    );
  }
}


class OrderPayments extends Component{
  constructor(props,context){
    super(props,context)
  }

  render(){
    return(
      <section id="payments" style={blackborder}>
        <h4>Payments</h4>
  
          {this.props.OrderPayments.map((OrderPayment,index)=>(
            <section key={index} style={blackborder}>

              <SYCompactField label="Date" value={syDateFormat(OrderPayment.date_add)} />
              <SYCompactField label="Method" value={OrderPayment.payment_method} />
              <SYCompactField label="Amount" value={"RM "+OrderPayment.amount.toFixed(2)} />

              <Row>
                <Col md={4} style={{textAlign:"right"}}>
                  <span style={{color:"#999",fontSize:"12px"}}>{"Verified"+" : "}</span>
                </Col>
                <Col md={8} style={{textAlign:"left"}}>
                  <select name="sy_is_verified" value={OrderPayment.sy_is_verified} style={{height:"35px"}}>
                    <option value="0">Not Verified</option>
                    <option value="1">Verified</option>
                  </select>
                </Col>
              </Row>



            </section>
          ))}      
        

      </section>
    );
  }
}


class OrderPaymentCreate extends Component{
  constructor(props,context){
    super(props,context)
  }

  handleOrderPaymentCreateChange = (event)=>{
    rstore.dispatch({
      type:'ORDER_PAYMENT_CREATE_CHANGE',
      name:event.target.name,
      value:event.target.value
    });
  }

  handleOrderPaymentCreateSubmit = (event)=>{

    const state = rstore.getState();
    var obj = state.Customer.Order.OrderPaymentCreate;
    obj.id_order = state.Customer.Order.id_order;

    fetch(settings.base_dir+'/orderpayment/create?'+serialize(obj),
      client_http_settings.POST_JSON
    ).then(function(res){
      return res.json();
    }).then(function(response){
      if(response.success){
        rstore.dispatch({
          type:'ORDER_PAYMENT_CREATE_SUBMIT_RESPONSE',
          OrderPayments:response.OrderPayments
        })
      }else{
        alert('please contact yishu')
      }
    })
  }

  render(){
    return(
      <section id="payment_create" style={blackborder}>
        <h4>New Payment</h4>

        <section>

          <Row>
            <Col md={4} style={{textAlign:"right"}}>
              <span style={{color:"#999",fontSize:"12px"}}>{"Method"+" : "}</span>
            </Col>
            <Col md={8} style={{textAlign:"left"}}>
              <select 
                name="payment_method" 
                value={this.props.OrderPaymentCreate.payment_method}
                onChange={this.handleOrderPaymentCreateChange}
                style={{height:"35px"}}
              >
                <option value="Bank Wire">Bank Wire</option>
              </select>
            </Col>
          </Row>

          <Row>
            <Col md={4} style={{textAlign:"right"}}>
              <span style={{color:"#999",fontSize:"12px"}}>{"Amount"+" : "}</span>
            </Col>
            <Col md={8} style={{textAlign:"left"}}>
              <input 
                type="text" 
                name="amount" 
                value={this.props.OrderPaymentCreate.amount} 
                onChange={this.handleOrderPaymentCreateChange}
                style={{fontSize:"16px"}}
              />
            </Col>
          </Row>

          <Row>
            <Col md={4} style={{textAlign:"right"}}>
              <span style={{color:"#999",fontSize:"12px"}}>{"Verified"+" : "}</span>
            </Col>
            <Col md={8} style={{textAlign:"left"}}>
              <select 
                name="sy_is_verified"
                onChange={this.handleOrderPaymentCreateChange}
                style={{height:"35px"}}
              >
                <option value="0">Not Verified</option>
                <option value="1">Verified</option>
              </select>
            </Col>
          </Row>

          <button onClick={this.handleOrderPaymentCreateSubmit}>Add</button>
        </section>
      </section>
    );
  }
}

var rerender = function(){
	render(<Main data={rstore.getState()} />, document.getElementById('app'));
}
// Render the main app react component into the app div.
// For more details see: https://facebook.github.io/react/docs/top-level-api.html#react.render
rstore.subscribe(rerender);
rerender();