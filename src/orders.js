import React, {Component} from 'react';
import {render} from 'react-dom';
import { createStore, combineReducers } from 'redux';
import { syDateFormat } from './Utils/Helper';

var MyPage = React.createClass({
  render: function() {
    var orders = this.props.data;
    var rows = [];
    var x = 0;

    for(var i=0;i<orders.length;i++){
      for(var j=0;j<orders[i].products.length;j++){
        x = (i*orders.length)+j;
        rows[x]=JSON.parse(JSON.stringify(orders[i]));
        if(j!=0){
          (function (obj) { // IIFE so you don't pollute your namespace
              // define things you can share to save memory
              //var map = Object.create(null);
              //map['true'] = true;
              //map['false'] = false;
              // the recursive iterator
              function walker(obj) {
                  var k,
                      has = Object.prototype.hasOwnProperty.bind(obj);
                  for (k in obj) if (has(k)) {
                      switch (typeof obj[k]) {
                          case 'object':
                              walker(obj[k]); break;
                          default:
                              obj[k]="---";
                      }
                  }
              }
              // set it running
              walker(obj);
          }(rows[x]));
        }
        rows[x]['product'] = JSON.parse(JSON.stringify(orders[i].products[j]));
      }
    }
    console.log(rows);

    var sypage_name = '---';
    var date_add = '---';
    var reference = '---';
    return (
      <table style={{width:'3500px'}}>
      <thead>
        <tr>
            <th>ref</th>
            <th>date</th>
            <th>page</th>
            <th>product</th>
            <th>{""}</th>
            <th>quantity</th>
            <th>unit_price</th>
            <th>shipping</th>
            <th>discount</th>
            <th>r.balance</th>
            <th>paid</th>
            <th>{""}</th>
            <th>{""}</th>{/* PaymentNotes */}
            <th>{""}</th>{/* Bank */}
            <th>payment_method</th>
            <th>{""}</th>{/* PaymentStatus */}
            <th>{""}</th>{/* PrintInvoice */}
            <th>{""}</th>{/* Tag */}
            <th>{""}</th>{/* Resend */}
            <th>{""}</th>{/* Note */}
            <th>tracking_number</th>
            <th>{""}</th>{/* status_name */}
            <th>{""}</th>{/* ShipOutDate */}
            <th>fb name</th>
            <th>receiver name</th>
            <th>address1</th>
            <th>address2</th>
            <th>address3</th>
            <th>address4</th>
            <th>postcode</th>
            <th>state</th>
            <th>phone</th>
            <th>email</th>
          </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => {
          if(row.date_add){
            if(row.date_add != '---'){
              sypage_name = row.sypage_name;
              date_add = row.date_add;
              reference = row.reference;
            }
          }

          return (
          <tr key={index}>
            <td>{reference}</td>
            <td style={{width:'150px'}}>{syDateFormat(date_add)}</td>
            <td>{sypage_name}</td>
            <td>{row.product.product_attribute_reference ? row.product.product_attribute_reference.toUpperCase() : (row.product.reference ? row.product.reference.toUpperCase() : '' )}</td>
            <td>{""}</td>
            <td>{row.product.quantity}</td>
            <td>{row.product.unit_price_tax_incl.toFixed(2)}</td>
            <td>{(typeof row.total_shipping_tax_incl == 'string') ? row.total_shipping_tax_incl : row.total_shipping_tax_incl.toFixed(2)}</td>
            <td>{(typeof row.total_discounts_tax_incl == 'string') ? row.total_discounts_tax_incl : row.total_discounts_tax_incl.toFixed(2)}</td>
            <td>{(row.total_paid_real-(row.total_products_wt+row.total_shipping_tax_incl-row.total_discounts_tax_incl)).toFixed(2)}</td>
            <td>{(typeof row.total_paid_real == 'string') ? row.total_paid_real : row.total_paid_real.toFixed(2)}</td>
            <td>{""}</td>
            <td>{""}</td>{/* PaymentNotes */}
            <td>{""}</td>{/* Bank */}
            <td>{row.payment_method}</td>
            <td>{""}</td>{/* PaymentStatus */}
            <td>{""}</td>{/* PrintInvoice */}
            <td>{""}</td>{/* Tag */}
            <td>{""}</td>{/* Resend */}
            <td>{""}</td>{/* Note */}
            <td>{row.carrier.tracking_number}</td>
            <td>{""}</td>{/* status_name */}
            <td>{""}</td>{/* ShipOutDate */}
            <td>{row.customer.sy_fbuser_name}</td>
            <td>{row.delivery.firstname+" "+row.delivery.lastname}</td>
            <td>{row.delivery.address1.split('\n')[0]}</td>
            <td>{row.delivery.address1.split('\n')[1]}</td>
            <td>{row.delivery.address1.split('\n')[2]}</td>
            <td>{row.delivery.address1.split('\n')[3]}</td>
            <td>{row.delivery.postcode}</td>
            <td>{row.delivery.state}</td>
            <td>{row.delivery.phone}</td>
            <td>{row.customer.email}</td>
          </tr>
          )
        })}
      </tbody>
      </table>
    );
  }
});
  console.log(window.data);
  render(<MyPage data={window.data}/>, document.getElementById('app'));
