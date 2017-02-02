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

    return (
      <table>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index}>
            <td>{row.reference}</td>
            <td>{row.date_add}</td>
            <td>{"PAGE"}</td>
            <td>{row.product.reference}</td>
            <td>{row.product.id}</td>
            <td>{row.product.quantity}</td>
            <td>{row.product.unit_price_tax_incl}</td>
            <td>{row.total_shipping_tax_incl}</td>
            <td>{row.total_discounts_tax_incl}</td>
            <td>{row.total_paid-(row.total_products_wt+row.total_shipping_tax_incl-row.total_discounts_tax_incl)}</td>
            <td>{row.total_paid}</td>
            <td>{""}</td>
            <td>{"PaymentNotes"}</td>
            <td>{"Bank"}</td>
            <td>{row.payment_method}</td>
            <td>{"PaymentStatus"}</td>
            <td>{"PrintInvoice"}</td>
            <td>{"Tag"}</td>
            <td>{"Resend"}</td>
            <td>{"Note"}</td>
            <td>{row.carrier.tracking_number}</td>
            <td>{row.status_name}</td>
            <td>{"ShipOutDate"}</td>
            <td>{"FbName"}</td>
            <td>{row.delivery.firstname+" "+row.delivery.lastname}</td>
            <td>{row.delivery.address1}</td>
            <td>{row.delivery.address2}</td>
            <td>{""}</td>
            <td>{""}</td>
            <td>{row.delivery.postcode}</td>
            <td>{row.delivery.city}</td>
            <td>{row.delivery.phone}</td>
            <td>{row.customer.email}</td>
          </tr>
        ))}
      </tbody>
      </table>
    );
  }
});


  ReactDOM.render(<MyPage data={window.data}/>, document.getElementById('app'));
