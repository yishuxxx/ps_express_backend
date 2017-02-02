SELECT * FROM `ps_tax` as a
JOIN `ps_tax_lang` as b ON a.`id_tax`=b.`id_tax`
JOIN `ps_tax_rule` as c ON a.`id_tax`=c.`id_tax`
JOIN `ps_tax_rules_group` as d ON d.`id_tax_rules_group`=c.`id_tax_rules_group`
JOIN `ps_tax_rules_group_shop` as e ON d.`id_tax_rules_group`=e.`id_tax_rules_group`
WHERE b.`id_lang`=1 AND e.`id_shop`=1

`ps_tax` id_tax rate
`ps_tax_lang` id_tax id_lang name
`ps_tax_rule` id_tax_rule id_tax_rules_group id_tax id_country
`ps_tax_rules_group` id_tax_rules_group name
`ps_tax_rules_group_shop` id_tax_rules_group id_shop
__________________________________________________________________________

SELECT * FROM `ps_attribute` as a
	JOIN `ps_attribute_lang` as b ON a.`id_attribute`=b.`id_attribute` 
	WHERE b.`id_lang`=1

SELECT * FROM `ps_product` as a
JOIN `ps_product_lang` as b ON a.`id_product`=b.`id_product`
JOIN `ps_product_shop` as c ON a.`id_product`=c.`id_product`
JOIN `ps_product_attribute` as d ON a.`id_product`=d.`id_product`
WHERE b.`id_lang`=1 AND c.`id_shop`=1

SELECT d.`id_product_attribute`, DISTINCT a.`id_product` FROM `ps_product` as a
JOIN `ps_product_lang` as b ON a.`id_product`=b.`id_product`
JOIN `ps_product_shop` as c ON a.`id_product`=c.`id_product`
JOIN `ps_product_attribute` as d ON a.`id_product`=d.`id_product`
WHERE b.`id_lang`=1 AND c.`id_shop`=1

SELECT CONCAT(a.`id_product`,'-',g.`id_attribute_group`) AS z, MAX(g.`id_attribute_group`) as y, MAX(a.`id_product`) as x, GROUP_CONCAT(f2.`name`)
FROM `ps_product` as a
JOIN `ps_product_lang` as b ON a.`id_product`=b.`id_product`
JOIN `ps_product_shop` as c ON a.`id_product`=c.`id_product`
JOIN `ps_product_attribute` as d ON a.`id_product`=d.`id_product`
JOIN `ps_product_attribute_combination` as e ON d.`id_product_attribute`=e.`id_product_attribute`
JOIN `ps_attribute` as f ON e.`id_attribute`=f.`id_attribute`
JOIN `ps_attribute_lang` as f2 ON f.`id_attribute`=f2.`id_attribute`
JOIN `ps_attribute_group` as g ON f.`id_attribute_group`=g.`id_attribute_group`
JOIN `ps_attribute_group_lang` as h ON f.`id_attribute_group`=h.`id_attribute_group`
WHERE b.`id_lang`=1 AND c.`id_shop`=1 AND a.`id_product`=1 AND f2.`id_lang`=1 AND h.`id_lang`=1
GROUP BY z

SELECT a.`id_product`,b.`name`,d.`id_product_attribute`,f2.`id_attribute`,f2.`name`,h.`id_attribute_group`,h.`name`,a.`price`,a.`quantity`,d.`price`,d.`quantity`,d.`weight`
FROM `ps_product` as a
JOIN `ps_product_lang` as b ON a.`id_product`=b.`id_product`
JOIN `ps_product_shop` as c ON a.`id_product`=c.`id_product`
JOIN `ps_product_attribute` as d ON a.`id_product`=d.`id_product`
JOIN `ps_product_attribute_combination` as e ON d.`id_product_attribute`=e.`id_product_attribute`
JOIN `ps_attribute` as f ON e.`id_attribute`=f.`id_attribute`
JOIN `ps_attribute_lang` as f2 ON f.`id_attribute`=f2.`id_attribute`
JOIN `ps_attribute_group` as g ON f.`id_attribute_group`=g.`id_attribute_group`
JOIN `ps_attribute_group_lang` as h ON f.`id_attribute_group`=h.`id_attribute_group`
WHERE b.`id_lang`=1 AND c.`id_shop`=1 AND f2.`id_lang`=1 AND h.`id_lang`=1
ORDER BY a.`id_product`,h.`id_attribute_group`,f2.`id_attribute`

SELECT 
			a.id_product as product___id,
			b.name as product___name,
			d.id_product_attribute,
			f2.id_attribute as product___proattgro___att_id,
			f2.name as product___proattgro___att_name,
			h.id_attribute_group as product___proattgro___id,
			h.name as product___proattgro___name,
			a.price as product___price,
			a.price as product___quantity,
			d.price,
			d.quantity,
			d.weight
		FROM ps_product as a
		JOIN ps_product_lang as b ON a.id_product=b.id_product
		JOIN ps_product_shop as c ON a.id_product=c.id_product
		JOIN ps_product_attribute as d ON a.id_product=d.id_product
		JOIN ps_product_attribute_combination as e ON d.id_product_attribute=e.id_product_attribute
		JOIN ps_attribute as f ON e.id_attribute=f.id_attribute
		JOIN ps_attribute_lang as f2 ON f.id_attribute=f2.id_attribute
		JOIN ps_attribute_group as g ON f.id_attribute_group=g.id_attribute_group
		JOIN ps_attribute_group_lang as h ON f.id_attribute_group=h.id_attribute_group
		WHERE b.id_lang=1 AND c.id_shop=1 AND f2.id_lang=1 AND h.id_lang=1
		ORDER BY a.id_product,h.id_attribute_group,f2.id_attribute

ps_product id_product
ps_product_attribute id_product_attribute id_product
ps_product_attribute_combination id_product_attribute id_attribute
ps_attribute id_attribute
ps_attribute_lang id_attribute name

SELECT * FROM `ps_attribute_group` as a
JOIN `ps_attribute` as f ON e.`id_attribute`=f.`id_attribute`
JOIN `ps_attribute_lang` as f2 ON f.`id_attribute`=f2.`id_attribute`
JOIN `ps_attribute_lang` as f2 ON f.`id_attribute`=f2.`id_attribute`
JOIN `ps_attribute_group_lang` AS b ON a.`id_attribute_group`=b.`id_attribute_group`
WHERE b.`id_lang`=1


SELECT 
	a.id_category as id,
	b.name as name
FROM ps_category AS a
LEFT JOIN ps_category_lang as b ON a.id_category=b.id_category
WHERE b.id_lang=1
ORDER BY a.id_category


SELECT a.id_order as id_order,
a.reference as reference,
a.id_carrier as id_carrier,
a.id_customer as id_customer,
a.id_address_delivery as id_address_delivery,
a.id_address_invoice as id_address_invoice,
a.payment as payment_method,
a.current_state as current_state,
b.name as carrier_name,
a2.tracking_number as tracking_number,
a2.shipping_cost_tax_incl as shipping_cost,
a3.product_id as id_product,
a3.product_attribute_id as id_product_attribute,
a3.product_name as product_name,
a3.product_quantity as product_quantity,
c.company as customer_company,
c.firstname as customer_firstname,
c.lastname as customer_lastname,
c.email as customer_email,
c.is_guest as customer_is_guest,
e.firstname as delivery_firstname,
e.lastname as delivery_lastname,
e.company as delivery_company,
e.phone as delivery_phone,
e.address1 as delivery_address1,
e.address2 as delivery_address2,
e.postcode as delivery_postcode,
e.city as delivery_city,
e2.firstname as invoice_firstname,
e2.lastname as invoice_lastname,
e2.company as invoice_company,
e2.phone as invoice_phone,
e2.address1 as invoice_address1,
e2.address2 as invoice_address2,
e2.postcode as invoice_postcode,
e2.city as invoice_city
FROM ps_orders as a
JOIN ps_order_carrier as a2 ON a.id_order=a2.id_order
JOIN ps_order_detail as a3 ON a.id_order=a3.id_order
JOIN ps_order_state as a4 ON a.current_state=a4.id_order_state
JOIN ps_order_state_lang as a4l ON a4.id_order_state=a4l.id_order_state
JOIN ps_carrier as b ON a.id_carrier = b.id_carrier
JOIN ps_carrier_lang as b2 ON a.id_carrier = b2.id_carrier
JOIN ps_customer as c ON a.id_customer = c.id_customer
JOIN ps_product as d ON a3.product_id = d.id_product
JOIN ps_address as e ON a.id_address_delivery = e.id_address
LEFT JOIN ps_address as e2 ON a.id_address_invoice = e2.id_address
WHERE b2.id_lang=1 AND a4l.id_order_state=1