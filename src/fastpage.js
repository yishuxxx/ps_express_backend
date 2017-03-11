import {settings} from '../settings';
import _ from 'lodash';
import React, {Component} from 'react';
import {render} from 'react-dom';
import { createStore, combineReducers } from 'redux';
import { Grid, Row, Col, Button } from 'react-bootstrap';

import injectTapEventPlugin from 'react-tap-event-plugin';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import {deepOrange500} from 'material-ui/styles/colors';
import TextField from 'material-ui/TextField';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import AutoComplete from 'material-ui/AutoComplete';

import qs from 'qs';
import { twoDToOneDArray, checkExists, serialize, serialize2Level, serializeObject, syDateFormat } from './Utils/Helper';

// Needed for onTouchTap
// http://stackoverflow.com/a/34015469/988941
injectTapEventPlugin();

const muiTheme = getMuiTheme({
  palette: {
    accent1Color: deepOrange500,
  },
});

const blackborder = {margin:"3px 0px 3px 0px",border:"1px solid black",padding:"5px 10px 5px 10px",borderRadius:"3px"};
const style_error_box = {border:"1px solid #ebcccc",color:"#a94442",backgroundColor:"#f2dede"}

const initial_state = {
  Customer:{
    email:'',
    sy_fbuser_name:'',
    Order:{
      id_sypage:1,
      current_state:"10",
      total_products_wt:0.00,
      total_shipping_tax_incl:0.00,
      total_discounts_tax_incl:0.00,
      total_paid_tax_incl:0.00,
      total_paid_real:0.00,
      Address:{
        firstname:'',
        phone:'',
        address1:'',
        postcode:'',
        id_state:313
      },
      OrderDetails:[],
      OrderDetailCreate:{
        product_index:0,
        product_attribute_index:0,
        product_quantity:1,
        product_price:0.00
      },
      OrderCartRules:[],
      OrderCartRuleCreate:{
        cart_rule_index:0
      },
      OrderPayments:[{
        payment_method:'Bank Wire',
        sy_is_verified:false,
        amount:0.00
      }],
      OrderCarrier:{
        shipping_cost_tax_incl:6.00
      }
    }
  },
  product_references:(function(){
    var Products = window.store.Products;
    var onedarray = [];

    Products.map((Product,index)=>{
      onedarray.push(Product['reference']);
    })

    return onedarray;
  }())
};

var calcPrice = function(){
  var state = rstore.getState();
  var product_index = state.Customer.Order.OrderDetailCreate.product_index;
  var product_attribute_index = state.Customer.Order.OrderDetailCreate.product_attribute_index;

  var tax_multiplier = (100+state.Tax.rate)/100;
  var price = product_index ? 
                (product_attribute_index ?
                  ((state.Products[product_index].price + state.Products[product_index].ProductAttributes[product_attribute_index].price) * tax_multiplier)
                : (state.Products[product_index].price * tax_multiplier))
              : null;

  var SpecPrices = state.Products[product_index].SpecificPrices;
  var id_default_group = state.Customer.id_default_group;

  if(product_index && state.Products[product_index].ProductAttributes.length === 0){
    if(SpecPrices && (SpecPrices.length > 0)){
      SpecPrices.map((SpecPrice,index)=>{
        if((SpecPrice.id_group == id_default_group) && (SpecPrice.id_product_attribute == 0)){
          price = price - SpecPrice.reduction;
        }
      })
    }
  }else if(product_index && (product_attribute_index == 0 || product_attribute_index)){
    if(SpecPrices && (SpecPrices.length > 0)){
      SpecPrices.map((SpecPrice,index)=>{
        if((SpecPrice.id_group == id_default_group) && (SpecPrice.id_product_attribute == state.Products[product_index].ProductAttributes[product_attribute_index].id_product_attribute)){
          price = price - SpecPrice.reduction;
        }
      })
    }
  }else{
    alert('please contact yishu');
  }

  return price;
}

var updateOrderDependencies = function(state){
  var r = {
    Order:state.Customer.Order,
    Tax:state.Tax
  };
  var tax_multiplier = 1;
  var total_products = 0;
  var total_discounts = 0;
  var free_shipping = 0;
  var total_shipping = 0;
  var total_weight = 0;
  var id_zone;
  var id_carrier;
  var total_paid = 0;

  /*** CALCULATE TAX MULTIPLIER ***/
  tax_multiplier = ((100.00+r.Tax.rate)/100);

  /*** CALCULATE TOTAL_PRODUCTS ***/
  if(r.Order && r.Order.OrderDetails){
    r.Order.OrderDetails.map((OrderDetail,index)=>{
      total_products = total_products + OrderDetail.product_price;
    })
  }

  /*** CALCULATE TOTAL_DISCOUNT ***/
  if(r.Order && r.Order.OrderCartRules){
    r.Order.OrderCartRules.map((OrderCartRule,index)=>{
      if(OrderCartRule.value_tax_excl){
        total_discounts = total_discounts + OrderCartRule.value_tax_excl;
      }else if(OrderCartRule.free_shipping){
        free_shipping = 1;
      }
    })
  }

  /*** CALCULATE TOTAL_PAID ***/
  if(r.Order.OrderPayments){
    r.Order.OrderPayments.map((OrderPayment,index) =>{
      total_paid = total_paid + OrderPayment.amount;
    })
  }
    


  /*** CALCULATE TOTAL_SHIPPING ***/
  /*
  if(r.Order.Address && r.Order.Address.State && r.Order.OrderDetails){
  if(!free_shipping){
    r.Order.OrderDetails.map((OrderDetail,index)=>{
      total_weight = total_weight + OrderDetail.product_weight;
    })
    r.Order.OrderCarrier ? id_carrier = r.Order.OrderCarrier.id_carrier : null;
    r.Order.Address.State ? id_zone = r.Order.Address.State.Zone.id_zone : null;
    if(id_carrier && id_zone){
      return Delivery.scope('admin').findOne({
        where:{id_zone:id_zone,id_carrier:id_carrier},
        include:[{
          model:RangeWeight.scope('admin'),
          where:{
            delimiter1:{$lte: total_weight},
            delimiter2:{$gt:total_weight}
          }
        }]
      });
    }
  }
  }

  r.Delivery = Instance;
  total_shipping = r.Delivery.price;
  */

  if(r.Order && r.Order.OrderCarrier && r.Order.OrderCarrier.shipping_cost_tax_incl){
    total_shipping = r.Order.OrderCarrier.shipping_cost_tax_incl;
  }

  r.Order.total_products            = total_products/tax_multiplier;
  r.Order.total_products_wt         = total_products;

  r.Order.total_discounts           = total_discounts;
  r.Order.total_discounts_tax_excl  = total_discounts;
  r.Order.total_discounts_tax_incl  = total_discounts * tax_multiplier;

  r.Order.total_shipping            = total_shipping/tax_multiplier;
  r.Order.total_shipping_tax_excl   = total_shipping/tax_multiplier;
  r.Order.total_shipping_tax_incl   = total_shipping;

  r.Order.total_paid                = r.Order.total_products + r.Order.total_shipping - r.Order.total_discounts;
  r.Order.total_paid_tax_excl       = r.Order.total_products + r.Order.total_shipping_tax_excl - r.Order.total_discounts_tax_excl;
  r.Order.total_paid_tax_incl       = r.Order.total_products_wt + r.Order.total_shipping_tax_incl - r.Order.total_discounts_tax_incl;

  r.Order.total_paid_real           = total_paid;

  console.log(r.Order);

  state.Customer.Order = r.Order;
  return state;

}

var full_initial_state = _.merge(window.store,initial_state);

var reducer = function(state={},action=null){

  switch(action.type){
    case 'CUSTOMER_CHANGE':
      state.Customer[action.name] = action.value;
      break;
    case 'ADDRESS_CHANGE':
      state.Customer.Order.Address[action.name] = action.value;
      break;
    case 'ORDER_CHANGE':
      state.Customer.Order[action.name] = action.value;
      break;
    case 'ORDER_DETAIL_CREATE_PRODUCT_SELECT':
      state.Customer.Order.OrderDetailCreate.id_product = state.Products[action.product_index].id_product;
      state.Customer.Order.OrderDetailCreate.product_index = action.product_index;
      if(state.Products[action.product_index].ProductAttributes.length!==0){
        state.Customer.Order.OrderDetailCreate.id_product_attribute = state.Products[action.product_index].ProductAttributes[0].id_product_attribute;
        state.Customer.Order.OrderDetailCreate.product_attribute_index = 0;
      }else{
        state.Customer.Order.OrderDetailCreate.id_product_attribute = null;
        state.Customer.Order.OrderDetailCreate.product_attribute_index = null;
      }
      state.Customer.Order.OrderDetailCreate.product_price = calcPrice();
      break;
    case 'ORDER_DETAIL_CREATE_PRODUCT_ATTRIBUTE_SELECT':
      state.Customer.Order.OrderDetailCreate.id_product_attribute = state.Products[state.Customer.Order.OrderDetailCreate.product_index].ProductAttributes[action.product_attribute_index].id_product_attribute;
      state.Customer.Order.OrderDetailCreate.product_attribute_index = action.product_attribute_index;
      state.Customer.Order.OrderDetailCreate.product_price = calcPrice();
      break;
    case 'ORDER_DETAIL_CREATE_SUBMIT':
      var OrderDetailCreate = state.Customer.Order.OrderDetailCreate;
      var product_index = OrderDetailCreate.product_index;
      var product_attribute_index = OrderDetailCreate.product_attribute_index;
      var Product = state.Products[product_index];
      var ProductAttribute = OrderDetailCreate.id_product_attribute ? state.Products[product_index].ProductAttributes[product_attribute_index] : null;

      const OrderDetail = {
          product_index           : product_index,
          product_attribute_index : product_attribute_index,
          //Product                 : Product,
          product_id              : Product.id_product,
          //ProductAttribute        : OrderDetailCreate.id_product_attribute ? ProductAttribute : null,
          product_attribute_id    : OrderDetailCreate.id_product_attribute ? ProductAttribute.id_product_attribute : null,
          product_reference       : OrderDetailCreate.id_product_attribute ? ProductAttribute.reference : Product.reference,
          product_quantity        : OrderDetailCreate.product_quantity,
          product_price           : OrderDetailCreate.product_price,
          total_price_tax_incl    : OrderDetailCreate.product_price * OrderDetailCreate.product_quantity
      };
      state.Customer.Order.OrderDetails.push(OrderDetail);
      break;
    case 'ORDER_DETAIL_CREATE_CHANGE':
      console.log('changed i think');
      console.log(action);
      state.Customer.Order.OrderDetailCreate[action.name] = action.value;
      break;
    case 'ORDER_DETAIL_DELETE':
      state.Customer.Order.OrderDetails.splice(action.order_detail_index, 1);
      break;
    case 'ORDER_CART_RULE_CREATE_CHANGE':
      state.Customer.Order.OrderCartRuleCreate['cart_rule_index'] = action.cart_rule_index;
      break;
    case 'ORDER_CART_RULE_CREATE_SUBMIT':
      var tax_multiplier = (100+state.Tax.rate)/100;
      var cart_rule_index = state.Customer.Order.OrderCartRuleCreate.cart_rule_index;
      var OrderCartRuleCreate = state.Customer.Order.OrderCartRuleCreate;
      var CartRule = state.CartRules[cart_rule_index];
      var OrderCartRule = {
        cart_rule_index   : OrderCartRuleCreate.cart_rule_index,
        id_cart_rule      : CartRule.id_cart_rule,
        free_shipping     : CartRule.free_shipping,
        name              : CartRule.description,
        value_tax_excl    : CartRule.reduction_tax ? CartRule.reduction_amount / tax_multiplier : CartRule.reduction_amount,
        value             : CartRule.reduction_tax ? CartRule.reduction_amount : CartRule.reduction_amount * tax_multiplier,
      //  CartRule          : CartRule
      }
      state.Customer.Order.OrderCartRules.push(OrderCartRule);
      break;
    case 'ORDER_CART_RULE_DELETE':
      state.Customer.Order.OrderCartRules.splice(action.order_cart_rule_index, 1);
      break;
    case 'ORDER_CARRIER_CHANGE':
      console.log('action.shipping_cost_tax_incl='+action.shipping_cost_tax_incl);
      state.Customer.Order.OrderCarrier.shipping_cost_tax_incl = action.shipping_cost_tax_incl;
      break;
    case 'ORDER_PAYMENT_CHANGE':
      state.Customer.Order.OrderPayments[0].amount = action.amount;
      break;
    case 'ORDER_SUBMIT_RESPONSE':
      break;
    case 'RESPONSE_ERROR':
      state.errors = action.errors;
      return state;

    default:
      break;
  }

  state = updateOrderDependencies(state);

  return state;

}

window.rstore = createStore(reducer,full_initial_state);
window.checkExists = checkExists;

class Main extends Component {
  constructor(props, context) {
    super(props, context);
  }

  render() {
    this.props = this.props.data;
    return (  
      <MuiThemeProvider muiTheme={muiTheme}>
        <div>
          <Row>
            <Col md={3}>
              <CustomerInfo Customer={this.props.Customer} Address={this.props.Customer.Order.Address} States={this.props.Country.States}/>
              <OrderEdit SYPages={this.props.SYPages} OrderStates={this.props.OrderStates} Order={this.props.Customer.Order} />
            </Col>

            <Col md={6}>
              {checkExists('Customer.Order', this.props) ? 
                <OrderDetailsEdit OrderDetails={checkExists('Customer.Order.OrderDetails', this.props) ? this.props.Customer.Order.OrderDetails : [] } 
                                  OrderDetailCreate={this.props.Customer.Order.OrderDetailCreate}
                                  Tax={this.props.Tax}
                                  Products={this.props.Products}
                                  product_references={this.props.product_references}
                                  id_default_group={3}
                                  Order={this.props.Customer.Order}
                                  CartRules={this.props.CartRules}
                /> : null}

                <OrderReview errors={this.props.errors}/>

            </Col>
          </Row>
        </div>
      </MuiThemeProvider>
    );
  }
}

class CustomerInfo extends Component{

  constructor (props,context){
    super(props,context);
  }

  handleCustomerChange = (event) => {
    rstore.dispatch({
      type:'CUSTOMER_CHANGE',
      name:event.target.name,
      value:event.target.value
    });
  }

  handleAddressChange = (event) => {
    rstore.dispatch({
      type:'ADDRESS_CHANGE',
      name:event.target.name,
      value:event.target.value
    });
  }
/*
  handleClick = (crud,event) => {
    const state = rstore.getState();
    var obj = crud === 'UPDATE' ? state.Customer.Order.Address : state.Customer.Order.AddressNew;
    obj['id_customer'] = state.Customer.id_customer;
    obj['id_order'] = state.Customer.Order.id_order;

    var base_url = crud === 'UPDATE' ? '/address/update' : '/address/create';

    fetch(settings.base_dir+base_url+"?"+serialize(obj),{
      method: "GET",
      headers: {"Content-Type": "application/x-www-form-urlencoded"}
    }).then(function(res){
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
*/
  render(){   
    return(
      <section id="customer_info" style={blackborder}>

        <Row>
        <Col md={12}>
        <TextField
          name="email"
          value={this.props.Customer.email}
          onChange={this.handleCustomerChange}
          type="email"
          floatingLabelText="Email"
          floatingLabelFixed={true}
        />
        </Col>
        </Row>

        <Row>
        <Col md={12}>
        <TextField
          name="sy_fbuser_name"
          value={this.props.Customer.sy_fbuser_name}
          onChange={this.handleCustomerChange}
          type="text"
          floatingLabelText="Facebook Name"
          floatingLabelFixed={true}
        />
        </Col>
        </Row>

        <Row>
        <Col md={12}>
        <TextField
          name="firstname"
          value={this.props.Address.firstname}
          onChange={this.handleAddressChange}
          type="text"
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
          onChange={this.handleAddressChange}
          type="text"
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
          onChange={this.handleAddressChange}
          type="text"
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
          type="text"
          value={this.props.Address.postcode}
          onChange={this.handleAddressChange}
          floatingLabelText="Postcode"
          floatingLabelFixed={true}
        />
        </Col>
        </Row>

        <Row>
        <Col md={12}>
          <select name="id_state" value={this.props.Address.id_state} onChange={this.handleAddressChange} style={{width:"80%",height:"35px",margin:"0px 20px"}}>
            {this.props.States.map((State,index)=>(
              <option name="id_state" key={index} value={State.id_state}>{State.name}</option>
            ))}
          </select>
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


class OrderEdit extends Component {
  constructor (props,context){
    super(props,context);
  }

  handleChange = (name,event,index,value) => {
    rstore.dispatch({
      type:'ORDER_CHANGE',
      name:name, // MUST BIND PARAMETERS TO GET NAME
      value:value //event.target.value does not work, MUST USE THIS METHOD
    });
  }

  render(){
    return(
      <section id="order" style={blackborder}>

         <SelectField
          name="current_state"
          value={this.props.Order.current_state+""}
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
          value={this.props.Order.id_sypage+""}
          floatingLabelFixed={true}
          floatingLabelText={"Page"}
          onChange={this.handleChange.bind(null,"id_sypage")}
          style={{textAlign:"left"}}
        >
          {this.props.SYPages.map((SYPage,index) => (
            <MenuItem key={index} value={SYPage.id_sypage+""} primaryText={SYPage.name} />
          ))}
        </SelectField>

      </section>
    );
  }
}

class OrderDetailsEdit extends Component{
  constructor(props,context) {
    super(props,context);
  }

  handleProductReferenceAutoCompleteSearch = () => {

  }

  handleProductReferenceSelect = (chosenRequest,index) => {
    if(index !== -1){
      rstore.dispatch({
        type:'ORDER_DETAIL_CREATE_PRODUCT_SELECT',
        product_reference:chosenRequest,
        product_index:index
      });
    }else{
      alert('you must choose a product')
    }
  }

  handleProductAttributeSelect = (event) => {
    rstore.dispatch({
      type:"ORDER_DETAIL_CREATE_PRODUCT_ATTRIBUTE_SELECT",
      product_attribute_index:event.target.value,
    })
  }

  handleOrderDetailCreateSubmit = () => {
    rstore.dispatch({
      type:'ORDER_DETAIL_CREATE_SUBMIT',
    })
  }

  handleOrderDetailCreateChange = (event) => {
    var value = event.target.value;
    if(event.target.name == 'product_price' || event.target.name == 'product_quantity'){
      value = parseInt(event.target.value,10) ? parseInt(event.target.value,10) : 0;
    }
    rstore.dispatch({
      type:'ORDER_DETAIL_CREATE_CHANGE',
      name:event.target.name,
      value:value
    });
  }

  handleDelete = (event) => {
    rstore.dispatch({
      type:'ORDER_DETAIL_DELETE',
      order_detail_index:event.target.attributes.getNamedItem('data-index').value
    });
  }

  handleOrderCartRuleSelect = (event) => {
    rstore.dispatch({
      type:'ORDER_CART_RULE_CREATE_CHANGE',
      cart_rule_index:event.target[event.target.selectedIndex].getAttribute('data-index')
    })
  }

  handleOrderCartRuleSubmit = (event) => {
    rstore.dispatch({
      type:'ORDER_CART_RULE_CREATE_SUBMIT'
    })
  }

  handleOrderCartRuleDeleteSubmit = (event) => {
    rstore.dispatch({
      type:'ORDER_CART_RULE_DELETE',
      order_cart_rule_index:event.target.attributes.getNamedItem('data-index').value,
    })
  }

  handleOrderCarrierChange = (event) => {
    rstore.dispatch({
      type:'ORDER_CARRIER_CHANGE',
      shipping_cost_tax_incl:(parseInt(event.target.value,10) ? parseInt(event.target.value,10) : 0)
    })
  }

  handleOrderPaymentChange = (event) => {
    rstore.dispatch({
      type:'ORDER_PAYMENT_CHANGE',
      amount:(parseInt(event.target.value,10) ? parseInt(event.target.value,10) : 0)
    })
  }

  render(){
    var product_index = this.props.OrderDetailCreate.product_index;
    var product_attribute_index = this.props.OrderDetailCreate.product_attribute_index;
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
              <div style={{ fontSize:"16px",textAlign:"right"}}>{OrderDetail.product_price.toFixed(2)}</div>
            </td>

            <td style={{width:"70px"}}>
              <div style={{ fontSize:"16px",textAlign:"right"}}>{OrderDetail.total_price_tax_incl.toFixed(2)}</div>
            </td>
            <td style={{width:"50px"}}>
              <button name="delete" data-index={index} onClick={this.handleDelete}>-</button>
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
                onUpdateInput={this.handleProductReferenceAutoCompleteSearch}
                onNewRequest={this.handleProductReferenceSelect}
                fullWidth={true}
              />
            </td>

            <td>
              <TextField
                name="product_quantity"
                value={this.props.OrderDetailCreate.product_quantity}
                type="number"
                step="1"
                min="1"
                floatingLabelText="QTY"
                floatingLabelFixed={true}
                fullWidth={true}
                onChange={this.handleOrderDetailCreateChange}
              />
            </td>

            <td>
              <TextField
                name="product_price"
                value={Math.round(this.props.OrderDetailCreate.product_price * 100) / 100}
                floatingLabelText="Price"
                floatingLabelFixed={true}
                fullWidth={true}
                onChange={this.handleOrderDetailCreateChange}
              />
            </td>
            <td></td>
            <td><button onClick={this.handleOrderDetailCreateSubmit}>ADD</button></td>
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
                    data-index={index}
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
              <tr style={{textAlign:"right"}} key={index}>
                <td></td>
                <td></td>
                <td colSpan="3">{OrderCartRule.name + "(" + OrderCartRule.free_shipping + ")"}</td>
                <td>{(OrderCartRule.value*(-1)).toFixed(2)}</td>
                <td>
                  <button 
                    data-index={index}
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
            <td>
              <input 
                name="shipping_cost_tax_incl"
                value={this.props.Order.OrderCarrier.shipping_cost_tax_incl}
                onChange={this.handleOrderCarrierChange}
                type="text" 
                style={{width:"60px",textAlign:"right"}}
              />
              
            </td>
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
            <td>
              <input 
                name="amount"
                value={this.props.Order.OrderPayments[0].amount}
                onChange={this.handleOrderPaymentChange}
                type="text" 
                style={{width:"60px",textAlign:"right"}}
              />
            </td>
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

class OrderReview extends Component{
  constructor(props,context) {
    super(props,context);
  }

  handleOrderSubmit = (event) => {
    var state = rstore.getState();
    var Customer = state.Customer;
    var Order = state.Customer.Order;
    var Address = state.Customer.Order.Address;
    var obj = {
      sy_fbuser_name : Customer.sy_fbuser_name,
      email       : Customer.email,
      firstname   : Address.firstname,
      phone       : Address.phone,
      address1    : Address.address1,
      postcode    : Address.postcode,
      id_state    : Address.id_state,

      id_sypage   : Order.id_sypage,
      current_state : Order.current_state,
      shipping_cost_tax_incl : Order.OrderCarrier.shipping_cost_tax_incl,

      amount      : Order.OrderPayments[0].amount,
      OrderDetails: Order.OrderDetails,
      OrderCartRules:Order.OrderCartRules
    }

    fetch(settings.base_dir+'/order/createfast',{
      method: 'POST',
      headers:{'Content-Type': 'application/json'},
      body: JSON.stringify(obj)
    }).then(function(res){
      return res.json();
    }).then(function(response){
      if(response.success){
        rstore.dispatch({
          type:'RESPONSE_ERROR',
          errors:[]
        });
        console.log(response);
      }else if(!response.success){
        rstore.dispatch({
          type:'RESPONSE_ERROR',
          errors:response.errors
        });
      }
    })
  }

  render(){
    return(
      <section>
        <button onClick={this.handleOrderSubmit}>SAVE</button>
        <ErrorMessages errors={this.props.errors}/>
      </section>
    );
  }
}

class ErrorMessages extends Component{
  constructor(props,context) {
    super(props,context);
  }

  render(){
    return(
      <div id="errors" style={this.props.errors ? style_error_box : null}>
        {this.props.errors ? this.props.errors.map((error,index) => (
          <div key={index} className="error_message">{error.message}</div>
        )) : null}
      </div>
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

//type some comments here so that i can commit