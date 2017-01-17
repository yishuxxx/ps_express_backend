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