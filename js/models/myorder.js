/*
 * Revel Systems Online Ordering Application
 *
 *  Copyright (C) 2014 by Revel Systems
 *
 * This file is part of Revel Systems Online Ordering open source application.
 *
 * Revel Systems Online Ordering open source application is free software: you
 * can redistribute it and/or modify it under the terms of the GNU General
 * Public License as published by the Free Software Foundation, either
 * version 3 of the License, or (at your option) any later version.
 *
 * Revel Systems Online Ordering open source application is distributed in the
 * hope that it will be useful, but WITHOUT ANY WARRANTY; without even the
 * implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Revel Systems Online Ordering Application.
 * If not, see <http://www.gnu.org/licenses/>.
 */

define(["backbone", 'total', 'checkout', 'products'], function(Backbone) {
    'use strict';

    App.Models.Myorder = Backbone.Model.extend({
        defaults: {
            product: null, //App.Models.Product,
            modifiers: null,
            id_product: null, // id_product
            sum : 0, // total myorder sum (initial_price + modifiers price)
            quantity : 1,
            weight : 1,
            quantity_prev : 1,
            special : '',
            initial_price: null // product price including modifier "size",
        },
        product_listener: false, // check if listeners for product is present
        modifier_listener: false, // check if listeners for modifiers is preset
        current_modifiers_model: false, // current modifiers model
        initialize : function() {
            this.listenTo(this, 'change', this.change);
            this.listenTo(this, 'change:special', this.change_modifier_special);
        },
        get_product: function() {
            return this.get('product').get_product();
        },
        get_modifiers: function() {
            return this.get('product').get_modifiers() || this.get('modifiers');
        },
        get_initial_price: function() {
           var modifiers = this.get_modifiers(),
               size = modifiers && modifiers.getSizeModel();

           if (size) {
               return size.get('price');
           } else {
               return this.get_product().get('price');
           }

        },
        change_special: function() { // logic when modifier special changed
            var settings = App.Data.settings.get('settings_system');
            if(settings && !settings.special_requests_online)
                return;
            var modifiers = this.get_modifiers(),
                specText = modifiers ? modifiers.get_special_text() : "";

            if (specText !== "") {
                this.set({special: specText}, {ignoreChangeModifierSpecial: true});
            }
        },
        change_modifier_special: function(model, value, opts) { // logic when special field change
            if (opts.ignoreChangeModifierSpecial) return;
            var modifiers = this.get_modifiers();

            modifiers && value && modifiers.check_special(value);
        },
        change: function() {
            if (this.get('product') && !this.product_listener) {
                this.product_listener = true;
                this.listenTo(this.get('product'),'change',function() { // bubble change event
                    this.trigger('change',this);
                });
                this.listenTo(this.get('product'), 'change:attribute_1_selected change:attribute_2_selected', function() { // listen to change product attributes
                    this.modifier_listener = false;
                    this.set({
                        id_product: this.get_product().get('id'),
                        sum: this.get_modelsum(), // depend on quantity
                        initial_price: this.get_initial_price()
                    });
                    this.trigger('change',this);
                });
                this.listenTo(this.get('product'), 'change:price', function() {
                    this.set('initial_price', this.get_initial_price());
                });
            }

            var modifiers = this.get_modifiers();
            if (modifiers && !this.modifier_listener) {
                this.modifier_listener = true;
                this.current_modifiers_model && this.stopListening(this.current_modifiers_model); // save current modifiers model, after change product attributes, modifiers models and listeners changed
                this.current_modifiers_model = modifiers;
                !this.get('special') && this.change_special();
                this.listenTo(modifiers, 'modifiers_special', this.change_special);
                this.listenTo(modifiers, 'modifiers_size', function(price) {
                    this.set('initial_price', price);
                });
            }
        },
        get_myorder_tax_rate: function() { // tax per one product
            var product = this.get_product();

            if (!this.collection) { // this.collection is undefined on Confirm page -> Return to Menu btn click
                return 0;
            }

            var surcharge = this.get_myorder_surcharge_rate() || 0,
                prevailingTax = this.collection.total.get('prevailing_tax'),
                is_tax_included = App.TaxCodes.is_tax_included(this.collection.total.get('tax_country')),
                dining_option = this.collection.checkout.get('dining_option'),
                delivery_cold_untaxed = App.Data.settings.get('settings_system').delivery_cold_untaxed,
                isEatin = dining_option === 'DINING_OPTION_EATIN',
                isDelivery = dining_option === 'DINING_OPTION_DELIVERY',
                tax;

            if (!(isEatin || isDelivery && !delivery_cold_untaxed) && product.get('is_cold') || product.get('is_gift')  ||
                  (product.id == null && product.get('name') == MSG.BAG_CHARGE_ITEM)) {
                return 0;
            } else {
                if (!is_tax_included) {
                    return (product.get('tax') + prevailingTax * surcharge ) / 100;
                } else {
                    tax = product.get('tax');
                    return tax / (100 + tax);
                }
            }
        },
        get_myorder_surcharge_rate: function() {
            var product = this.get_product(),
                tax_country = this.collection.total.get('tax_country'),
                is_tax_included = App.TaxCodes.is_tax_included(tax_country),
                surcharge  = this.collection.total.get('prevailing_surcharge');

            if (product.get('is_gift') || is_tax_included) {
                return 0;
            } else {
                return surcharge / 100;
            }
        },
        /**
         * initiate order without product and modifiers
         */
        add_empty: function (id_product, id_category) {
            var self = this,
                product_load = App.Collections.Products.init(id_category), // load product
                modifier_load = App.Collections.ModifierBlocks.init(id_product), // load product modifiers
                product_child_load = $.Deferred(), // load child products
                loadOrder = $.Deferred(),
                product;


            product_load.then(function() {
                product = App.Data.products[id_category].get(id_product);
                product.get_child_products().then(product_child_load.resolve);
            });

            $.when(product_child_load, modifier_load).then(function() {
                self.set({
                    product: product,
                    id_product: id_product,
                    modifiers: App.Data.modifiers[id_product]
                });
                self.set({
                    sum: self.get_modelsum(), // sum with modifiers
                    initial_price: self.get_initial_price()
                });
                loadOrder.resolve();
            });

            return loadOrder;
        },
        /**
         *  create order from JSON. Used in paypal skin, when repeat order
         */
        addJSON: function(data) {
            this.set({
                product: new App.Models.Product().addJSON(data.product),
                modifiers: new App.Collections.ModifierBlocks().addJSON(data.modifiers),
                id_product: data.id_product,
                quantity: data.product.sold_by_weight ? 1 : data.quantity,
                weight: data.weight ? data.weight : 1
            });
            data.special && this.set('special', data.special, {silent: true});
            // gift_card_number in order item (backend), move to product
            if (!this.get('product').get('gift_card_number') && data.gift_card_number) {
                this.get('product').set('gift_card_number', data.gift_card_number);
            }
            if (!data.id_product) {
                this.set('id_product', data.product.id);
            }

            return this;

        },
        get_modelsum: function() {
            var sold_by_weight = this.get("product") ?  this.get("product").get('sold_by_weight') : false,
                weight = this.get('weight'),
                productSum = this.get_initial_price();

                if (sold_by_weight && weight) {
                    productSum *= weight;
                }

            var modifiers = this.get_modifiers(),
                modifiersSum = modifiers ? modifiers.get_sum() : 0;

            return (productSum + modifiersSum) * this.get('quantity');
        },
        get_special: function() {
            var settings = App.Data.settings.get('settings_system');
            if(settings && !settings.special_requests_online) {
                return '';
            } else if (this.get('special')) {
                 return this.get('special');
            } else if (this.get_modifiers())
                 return this.get_modifiers().get_special_text();
            else return "";
         },
         clone: function() {
            var order = new App.Models.Myorder();
            for (var key in this.attributes) {
                var value = this.get(key);
                if (value && value.clone) { value = value.clone(); }
                order.set(key, value, {silent: true });
            }
            order.trigger('change', order, {clone: true});
            return order;
         },
         update: function(newModel) {
            for (var key in newModel.attributes) {
                var value = newModel.get(key);
                if (value && value.update) { this.get(key).update(value); }
                else { this.set(key, value, {silent: true}); }
            }
            this.trigger('change',this);
            return this;
         },
         /**
          * check if we could add this order to cart
          * not check_gift here, due to async
          */
         check_order: function() {
            var product = this.get_product(),
                modifiers = this.get_modifiers(),
                size = modifiers.getSizeModel(),
                dining_option = this.collection ? this.collection.checkout.get('dining_option') : '',
                isDelivery = dining_option == 'DINING_OPTION_DELIVERY',

                forced = modifiers.checkForced();

            if (product.get("sold_by_weight") && !this.get("weight")) {
                return {
                    status: 'ERROR',
                    errorMsg: ERROR.BLOCK_WEIGHT_IS_NOT_VALID
                };
            }

            if (!App.Data.timetables.check_order_enable(isDelivery)) {
                return {
                    status: 'ERROR',
                    errorMsg: ERROR.BLOCK_STORE_IS_CLOSED
                };
            }

            if (!product.check_selected()) {
                return {
                    status: 'ERROR',
                    errorMsg: ERROR.SELECT_PRODUCT_ATTRIBUTES
                };
            }

            if (size || size === undefined) {
                if(Array.isArray(forced)) {
                    return {
                        status: 'ERROR',
                        errorMsg: ERROR.FORCED_MODIFIER + forced.map(function(modifier) {
                            return modifier.get('name');
                        }).join(', ')
                    };
                }
            } else if (size === null) {
                    return {
                        status: 'ERROR',
                        errorMsg: ERROR.SELECT_SIZE_MODIFIER
                    };
            }

            return {
                status: 'OK'
            };
         },
         /**
          * get product attribute type
          */
         get_attribute_type: function() {
             return this.get('product').get('attribute_type');
         },
         /**
          * get attributes in list
          */
         get_attributes_list: function() {
             return this.get('product').get_attributes_list();
         },
         /**
          * check order item before repeat
          */
         check_repeat: function() {
            var product = this.get('product'),
                modifiers = this.get('modifiers'),
                result_prod,
                result_modifiers;

            if(!product) {
                return;
            }

            result_prod = product.check_repeat(this.collection);
            if (result_prod === 'remove changed') {
                return 'remove changed';
            } else if (result_prod === 'remove') {
                return 'remove';
            }

            if(modifiers) {
                result_modifiers = modifiers.check_repeat();
            }

            if (result_prod || result_modifiers) {
                return 'changed';
            }
         },
         /**
          * check if order is gift
          */
         is_gift: function() {
             return this.get_product().get('is_gift');
         },
         /**
          * information about item for submit
          */
         item_submit: function() {
                var modifiers = [],
                    modifiers_price = this.get('sum') / this.get('quantity') - this.get('initial_price'),
                    special = this.get_special(),
                    modifiersModel = this.get_modifiers();

                if (modifiersModel) {
                    modifiers = modifiersModel.modifiers_submit();
                }

                var currency_symbol = App.Data.settings.get('settings_system').currency_symbol,
                    uom = App.Data.settings.get("settings_system").scales.default_weighing_unit,
                    product = this.get_product().toJSON(),
                    price = this.get('initial_price') || product.price,//model.get('sum');
                    item_tax = this.get_myorder_tax_rate() * this.get('sum'),

                    item_obj = {
                        modifier_amount: modifiers_price,
                        modifieritems: modifiers,
                        initial_price: price,
                        special_request: special,
                        price: price,
                        product: product.id,
                        product_name_override: product.name,
                        quantity: this.get('quantity'),
                        tax_amount: item_tax,
                        tax_rate: product.tax,//model.get_product_tax_rate(),
                        is_cold: product.is_cold
                    };

                    if (product.sold_by_weight) {
                        var num_digits = Math.abs((App.Data.settings.get("settings_system").scales.number_of_digits_to_right_of_decimal).toFixed(0)*1),
                            label_for_manual_weights = App.Data.settings.get("settings_system").scales.label_for_manual_weights;

                        item_obj.weight = this.get('weight');

                        var str_label_for_manual_weights = label_for_manual_weights ? " " + label_for_manual_weights : "",
                            str_uom = uom ? "/" + uom : "";

                        //constuct product_name_override as it's done by POS:
                        item_obj.product_name_override = product.name + "\n " + item_obj.weight.toFixed(num_digits) + str_label_for_manual_weights + " @ "
                            + currency_symbol + round_monetary_currency(item_obj.initial_price) + str_uom;
                    }


                if (product.gift_card_number) {
                    item_obj.gift_card_number = product.gift_card_number;
                }

                return item_obj;
         },
         get_all_line: function() {
            var modifiers = this.get_modifiers();
            return modifiers ? modifiers.get_all_line(true) : '';
         }
    });

    App.Models.DeliveryChargeItem = App.Models.Myorder.extend({
        initialize: function() {
            var charge = this.get('total').get_delivery_charge() * 1;
            this.set({
                product: new App.Models.Product({
                    name: MSG.DELIVERY_ITEM,
                    price: charge,
                    tax: this.get('total').get('prevailing_tax')
                }),
                initial_price: charge,
                sum: charge
            });
            App.Models.Myorder.prototype.initialize.apply(this, arguments);
        }
    });

    App.Models.BagChargeItem = App.Models.Myorder.extend({
        initialize: function() {
            var charge = this.get('total').get_bag_charge() * 1;
            this.set({
                product: new App.Models.Product({
                    name: MSG.BAG_CHARGE_ITEM,
                    price: charge,
                    tax: 0
                }),
                initial_price: charge,
                sum: charge
            });
            App.Models.Myorder.prototype.initialize.apply(this, arguments);
        }
    });

    App.Collections.Myorders = Backbone.Collection.extend({
        model: App.Models.Myorder,
        quantity: 0,
        total: null, // total model
        paymentResponse: null, // contains payment response
        initialize: function( ) {
            this.total = new App.Models.Total();
            this.checkout = new App.Models.Checkout();
            this.checkout.set('dining_option', 'DINING_OPTION_TOGO');

            this.listenTo(this.checkout, 'change:dining_option', this.change_dining_option);

            this.listenTo(this, 'add', this.onModelAdded);
            this.listenTo(this, 'remove', this.onModelRemoved);
            this.listenTo(this, 'change', this.onModelChange);
        },
        change_dining_option: function(model, value, opts) {
            var obj, bag_charge = this.total.get_bag_charge() * 1,
                delivery_charge = this.total.get_delivery_charge() * 1;

            if(typeof opts !== 'object'  || !opts.avoid_delivery) {
                if (value === 'DINING_OPTION_DELIVERY' && delivery_charge !== 0) {
                    if (!this.deliveryItem) {
                        this.deliveryItem = new App.Models.DeliveryChargeItem({total: this.total});
                    }
                    obj = this.find(function(model) {
                        return model.get('product').id == null &&
                               model.get('product').get('name') == MSG.DELIVERY_ITEM;
                    });
                    if (obj == undefined)
                       this.add(this.deliveryItem);

                } else {
                    this.remove(this.deliveryItem);
                }

                if ((value === 'DINING_OPTION_DELIVERY' || value === 'DINING_OPTION_TOGO') &&  bag_charge !== 0) {
                    if (!this.bagChargeItem) {
                        this.bagChargeItem = new App.Models.BagChargeItem({total: this.total});
                    }
                    obj = this.find(function(model) {
                        return model.get('product').id == null &&
                               model.get('product').get('name') == MSG.BAG_CHARGE_ITEM;
                    });
                    if (obj == undefined)
                       this.add(this.bagChargeItem);

                } else {
                    this.remove(this.bagChargeItem);
                }
            }
            this.recalculate_tax();
        },
        get_remaining_delivery_amount: function() {
            if (this.checkout.get('dining_option') === 'DINING_OPTION_DELIVERY') {
                return this.total.get_remaining_delivery_amount();
            }
            return null;
        },
        get_delivery_charge: function() {
            if (this.checkout.get('dining_option') === 'DINING_OPTION_DELIVERY') {
                return this.total.get_delivery_charge();
            }
            return null;
        },
        get_bag_charge: function() {
            if (this.checkout.get('dining_option') === 'DINING_OPTION_DELIVERY' ||
                this.checkout.get('dining_option') === 'DINING_OPTION_TOGO' ) {
                return this.total.get_bag_charge();
            }
            return null;
        },
        /**
         * get quantity withour delivery charge and bag charge items
         */
        get_only_product_quantity: function() {
            var quantity = this.quantity;

            this.get(this.deliveryItem) && quantity--;
            this.get(this.bagChargeItem) && quantity--;

            return quantity;
        },
        /**
         *  create orders from JSON.
         */
        addJSON: function(data) {
            var self = this;
            data && data.forEach(function(element) {
                if (element.product.id) { // not add delivery and bag charge items
                    var myorder = new App.Models.Myorder();
                    myorder.addJSON(element);
                    self.add(myorder);
                    myorder.set('initial_price', myorder.get_initial_price());
                }
            });
        },
        clone: function() {
            var orders = new App.Collections.Myorders();
            this.each(function(order) {
               orders.add(order.clone()) ;
            });
            return orders;
        },
        /**
         * if products in cart are only gift products, change dining option to DINING_OPTION_ONLINE
         */
        change_only_gift_dining_option: function() {
            var counter = 0;
            this.each(function(el) {
                el.is_gift() && counter++;
            });

            if (counter && counter === this.get_only_product_quantity()) {
                this.checkout.set('dining_option', 'DINING_OPTION_ONLINE');
                return true;
            } else if (this.checkout.get('dining_option') === 'DINING_OPTION_ONLINE') {
                this.checkout.revert_dining_option();
            }
            return false;
        },
        /**
         * get quantity without delivery charge and bag charge and gift items
         */
        not_gift_product_quantity: function() {
            var quantity = this.get_only_product_quantity();

            this.each(function(el) {
                el.is_gift() && quantity--;
            });

            return quantity;
        },
        /**
         *  Recalculate total when model add
         */
        onModelAdded: function(model) {
            var sum = model.get_modelsum(),
                total = this.total.get('total'),
                countProd = model.get('quantity'),
                taxNew = this.total.get('tax') + model.get_myorder_tax_rate() * sum,
                surchargeNew = this.total.get('surcharge') + model.get_myorder_surcharge_rate() * sum;

            total += sum;
            this.quantity += countProd;

            model.set({
                'sum' : sum,
                'quantity_prev' : countProd
            }, {silent: true});

            this.total.set({
                total: total,
                tax: taxNew,
                surcharge: surchargeNew
            });

            this.change_only_gift_dining_option();
        },
        /**
         *  Recalculate total when model remove
         */
        onModelRemoved: function(model) {
            var sum = model.get('sum'),
                total = this.total.get('total') - sum,
                taxNew = this.total.get('tax') - model.get_myorder_tax_rate() * sum,
                surchargeNew = this.total.get('surcharge') - model.get_myorder_surcharge_rate() * sum;

            this.quantity -= model.get('quantity');

            this.total.set({
                total: total,
                tax: taxNew,
                surcharge: surchargeNew
            });

            this.change_only_gift_dining_option();
        },
        /**
         *  Recalculate total when model change
         */
        onModelChange: function(model) {
            var sum = model.get('sum'),
                countProdPrev = model.get('quantity_prev'),

                sumNew = model.get_modelsum(),
                countProdNew = model.get('quantity'),

                total = this.total.get('total'),
                totalNew = total + sumNew - sum,

                taxNew = this.total.get('tax') + model.get_myorder_tax_rate() * (sumNew - sum),
                surchargeNew = this.total.get('surcharge') + model.get_myorder_surcharge_rate() * (sumNew - sum);

            this.quantity = this.quantity + countProdNew - countProdPrev;

            model.set({
                'sum': sumNew,
                'quantity_prev': countProdNew
            }, {silent: true});

            this.total.set({
                total: totalNew,
                tax: taxNew,
                surcharge: surchargeNew
            });
            model.changedAttributes() && model.changedAttributes().sum && model.trigger('update:sum', model);
        },
        /**
         * save order to localstorage
         */
        saveOrders: function() {
            var data = this.clone(); // create one more bagcharge item via cloning, need to delete both

            // need remove bag charge / delivery charge item from storage
            var obj = this.find(function(model) {
                return model.get('product').id == null &&
                       model.get('product').get('name') == MSG.DELIVERY_ITEM;
            });
            data.remove(obj);

            obj = this.find(function(model) {
                return model.get('product').id == null &&
                       model.get('product').get('name') == MSG.BAG_CHARGE_ITEM;
            });
            data.remove(obj);

            setData('orders', data);
            this.checkout.saveCheckout();
            this.total.saveTotal();
        },
        /**
         * load order from localstorage
         */
        loadOrders: function() {
            this.empty_myorder();
            this.checkout.loadCheckout();
            this.total.loadTotal();
            var orders = getData('orders');
            if (orders) {
                this.addJSON(orders);
            }
        },
        recalculate_tax: function() {
            var tax = 0;
            this.each(function(model) {
                tax += model.get_myorder_tax_rate() * model.get('sum');
            });
            this.total.set('tax', tax);
        },
        /**
         *
         * check collection myorders
         */
        _check_cart: function(isTip) {
            var subtotal = this.total.get_subtotal() * 1,
                tip = this.total.get_tip() * 1,
                isDelivery = this.checkout.get('dining_option') === 'DINING_OPTION_DELIVERY',
                isOnlyGift = this.checkout.get('dining_option') === 'DINING_OPTION_ONLINE';

            if (this.get_only_product_quantity() === 0) {
                return {
                    status: 'ERROR',
                    errorMsg: MSG.ERROR_PRODUCT_NOT_SELECTED
                };
            }

            if (isTip && tip > subtotal) {
                return {
                    status: 'ERROR',
                    errorMsg: MSG.ERROR_GRATUITY_EXCEEDS
                };
            }

            if (isDelivery) {
                var remain = this.total.get_remaining_delivery_amount();
                if (remain > 0 ) {
                    return {
                        status: 'ERROR',
                        errorMsg: MSG.ADD_MORE_FOR_DELIVERY.replace('%s', App.Data.settings.get('settings_system').currency_symbol + remain)
                    };
                }
            }

            var sum_quantity = this.not_gift_product_quantity(),
                min_items = App.Data.settings.get("settings_system").min_items;

            if (sum_quantity < min_items && !isOnlyGift) {
                return {
                    status: 'ERROR_QUANTITY',
                    errorMsg: msgFrm(MSG.ERROR_MIN_ITEMS_LIMIT, min_items)
                };
            }

            return {
                status: 'OK'
            };
        },
        /**
         * check models;
         * options: {
         *     checkout: true - test checkout model
         *     customer: true - test customer model
         *     card: true - test card model
         *     order: true - test myorders collection
         *     tip: true - test add flag isTip to order test,
         *     validation: true - test whole order on backend
         * }
         * success - callback if checked is OK
         * error - callback or alert if checked is ERROR
         */
        check_order: function(options, success, error) {
            error = error || App.Data.errors.alert.bind(App.Data.errors);
            var fields = [],
                errorMsg = '',
                self = this,
                dining_option = this.checkout.get('dining_option');

            if (options.card) {
                var card = App.Data.card,
                    check_card = card.check();

                if (check_card.status === 'ERROR') {
                    errorMsg = check_card.errorMsg;
                } else if (check_card.status === 'ERROR_EMPTY_FIELDS') {
                    fields = fields.concat(check_card.errorList);
                }
            }

            if (options.checkout) {
                var checkout = this.checkout,
                    check_checkout = checkout.check();

                if (check_checkout.status === 'ERROR') {
                    return error(check_checkout.errorMsg);
                } else if (check_checkout.status === 'ERROR_EMPTY_FIELDS') {
                    fields = fields.concat(check_checkout.errorList);
                }
            }

            if (options.order) {
                var check_order = this._check_cart(options.tip);

                if (check_order.status === 'ERROR_QUANTITY') {
                    if (!arguments[2]) { // if we don't set error callback, use usuall two button alert message or if we on the first page
                        return alert_message({
                            message: check_order.errorMsg,
                            is_confirm: true,
                            confirm: {
                                cancel: 'Add Items',
                                ok: 'Ok',
                                cancel_hide: options.first_page
                            },
                            callback: function(result) {
                                if(!result) {
                                    App.Data.router.navigate('index', true);
                                }
                            }
                        });
                    } else {
                        return error(check_order.errorMsg);
                    }
                }
                if (check_order.status !== 'OK') {
                    return error(check_order.errorMsg);
                }
            }

            if (options.customer) {
                var customer = App.Data.customer,
                    check_customer = customer.check(dining_option);

                if (check_customer.status === 'ERROR') {
                    errorMsg = check_customer.errorMsg;
                } else if (check_customer.status === 'ERROR_EMPTY_FIELDS') {
                    fields = fields.concat(check_customer.errorList);
                }
            }

            if (fields.length) {
                return error(MSG.ERROR_EMPTY_NOT_VALID_DATA.replace(/%s/, fields.join(', ')));
            } else if (errorMsg) {
                return error(errorMsg);
            } else if (options.customer && dining_option === 'DINING_OPTION_DELIVERY') {
                customer.validate_address(success, error);
            } else {
                if (options.validation) {
                    var tmp_model = new Backbone.View();
                    tmp_model.listenTo(this, 'paymentResponseValid', function() {
                        success();
                        tmp_model.remove();
                        self.trigger('paymentInProcessValid');
                    });
                    tmp_model.listenTo(this, 'paymentFailedValid', function(message) {
                        error(message);
                        tmp_model.remove();
                        self.trigger('paymentInProcessValid');
                    });
                    this.pay_order_and_create_order_backend(4, true);
                } else {
                    success();
                }
            }
        },
        /**
         * Pay order and create order to backend.
         */
        pay_order_and_create_order_backend: function(type_payment, validation) {
            if(this.paymentInProgress)
                return;
            this.paymentInProgress = true;
            var only_gift = this.checkout.get('dining_option') === 'DINING_OPTION_ONLINE';

            if(!only_gift) {
                var pickup = this.checkout.get('pickupTS'),
                    currentTime = App.Data.timetables.base(),
                    delivery = this.checkout.get('dining_option') === 'DINING_OPTION_DELIVERY',
                    time = App.Data.timetables.current_dining_time(delivery).getTime(),
                    lastPickupTime,
                    lastPT,
                    isASAP = this.checkout.get("isPickupASAP");

                if (pickup) pickup = new Date(time > pickup ? time : pickup);

                if(!pickup || !App.Data.timetables.checking_work_shop(pickup, delivery)) { //pickup may by null or string
                    this.trigger('cancelPayment');
                    delete this.paymentInProgress;
                    return App.Data.errors.alert(MSG.ERROR_STORE_IS_CLOSED);
                }

                if (isASAP) {
                    lastPT = App.Data.timetables.getLastPTforWorkPeriod(currentTime);
                    if (lastPT instanceof Date){
                        lastPickupTime = format_date_1(lastPT);
                    }
                    if (lastPT === 'not-found') {
                       //TODO: test this case by unit tests and remove this trace:
                    }
                    //for lastPT = "all-the-day" we should not pass any pickupTime to server. i.e. lastPickupTime is undefined
                }

                this.checkout.set({
                    'pickupTime': pickupToString(pickup),
                    'createDate': format_date_1(currentTime),
                    'pickupTimeToServer': isASAP ? 'ASAP' : format_date_1(pickup),
                    'lastPickupTime': lastPickupTime
                });
            }
            this.trigger('paymentInProcess');
            this.submit_order_and_pay(type_payment, validation);
        },

        submit_order_and_pay: function(payment_type, validation) {
            var myorder = this,
                get_parameters = App.Data.get_parameters,
                skin = App.Data.settings.get('skin'),
                total = myorder.total.get_all(),
                items = [],
                order_info = {},
                payment_info = {
                    tip: total.tip,
                    type: payment_type
                },
                order = {
                    skin: skin,
                    establishmentId: App.Data.settings.get("establishment"),
                    items: items,
                    orderInfo: order_info,
                    paymentInfo: payment_info
                };

            myorder.each(function(model) {
                items.push(model.item_submit());
            });

            var call_name = [],
                checkout = this.checkout.toJSON(),
                card = App.Data.card && App.Data.card.toJSON(),
                customer = App.Data.customer.toJSON();

            order_info.created_date = checkout.createDate;
            order_info.pickup_time = checkout.pickupTimeToServer;
            order_info.lastPickupTime = checkout.lastPickupTime;
            order_info.tax = total.tax;
            order_info.subtotal = total.subtotal;
            order_info.final_total = total.final_total;
            order_info.surcharge = total.surcharge;
            order_info.dining_option = DINING_OPTION[checkout.dining_option];

            if (checkout.pickupTimeToServer === 'ASAP') {
                checkout.pickupTime = 'ASAP (' + checkout.pickupTime + ')';
            }

            var contactName = $.trim(customer.first_name + ' ' + customer.last_name);
            contactName && call_name.push(contactName);
            checkout.pickupTime && call_name.push(checkout.pickupTime);

            if (customer.phone) {
                call_name.push(customer.phone);
                payment_info.phone = customer.phone;
            }
            if (customer.email) {
                payment_info.email = customer.email;
            }
            payment_info.first_name = customer.first_name;
            payment_info.last_name = customer.last_name;

            if(checkout.dining_option === 'DINING_OPTION_DELIVERY') {
                payment_info.address = customer.addresses[customer.shipping_address === -1 ? customer.addresses.length - 1 : customer.shipping_address];
            }

            switch (payment_type) {
                case 2: // pay with card
                    var address = null;
                    if (card.street) {
                        address = {
                            street: card.street,
                            city: card.city,
                            state: card.state,
                            zip: card.zip
                        };
                    }

                    var cardNumber = $.trim(card.cardNumber);
                    payment_info.cardInfo = {
                        firstDigits: cardNumber.substring(0, 4),
                        lastDigits: cardNumber.substring(cardNumber.length - 4),
                        firstName: card.firstName,
                        lastName: card.secondName,
                        address: address
                    };
                    var payment = App.Data.settings.get_payment_process();
                    if (get_parameters.pay) {
                        if(get_parameters.pay === 'true') {
                            if (payment.paypal_direct_credit_card) {
                                payment_info.payment_id = checkout.payment_id;
                            } else if (payment.usaepay) {
                                payment_info.transaction_id = get_parameters.UMrefNum;
                            }
                        } else {
                            if (payment.paypal_direct_credit_card) {
                                myorder.paymentResponse = {status: 'error', errorMsg: 'Payment Canceled'};
                            } else if (payment.usaepay) {
                                myorder.paymentResponse = {status: 'error', errorMsg: get_parameters.UMerror};
                            }
                            myorder.trigger('paymentResponse');
                            return;
                        }
                    } else {
                        if (payment.paypal_direct_credit_card) {
                            payment_info.cardInfo.expMonth = card.expMonth,
                            payment_info.cardInfo.expDate = card.expDate,
                            payment_info.cardInfo.cardNumber = cardNumber;
                            payment_info.cardInfo.securityCode = card.securityCode;
                        }
                    }
                    break;
                case 3: // pay with paypal account
                    if (get_parameters.pay) {
                        if(get_parameters.pay === 'true') {
                            payment_info.payer_id = get_parameters.PayerID;
                            payment_info.payment_id = checkout.payment_id;
                        }  else {
                            myorder.paymentResponse = {status: 'error', errorMsg: 'Payment Canceled'};
                            myorder.trigger('paymentResponse');
                            return;
                        }
                    }
                    break;
                case 4: // pay with cash
                    break;
            }

            order_info.call_name = call_name.join(' / ');

            if (customer.email || checkout.email) {
                order.notifications = [{
                    skin: skin,
                    type: 'email',
                    destination: customer.email || checkout.email
                }];
            }

            if(checkout.rewardCard) {
                payment_info.reward_card = checkout.rewardCard ? checkout.rewardCard.toString() : '';
            }

            var myorder_json = JSON.stringify(order);
            $.ajax({
                type: "POST",
                url: App.Data.settings.get("host") + "/weborders/" + (validation ? "pre_validate/" : "create_order_and_pay/"),
                data: myorder_json,
                dataType: "json",
                success: function(data) {
                    if (!data || !data.status) {
                        reportErrorFrm(MSG.ERROR_OCCURRED + MSG.ERROR_INCORRECT_AJAX_DATA);
                        return;
                    }
                    myorder.paymentResponse = data instanceof Object ? data : {};

                    switch(data.status) {
                        case "OK":
                            if (validation) {
                                myorder.trigger('paymentResponseValid');
                            } else {
                                myorder.trigger('paymentResponse');
                            }

                            break;
                        case "REDIRECT": // need to complete payment on external site
                            if(data.data && data.data.payment_id) {
                                myorder.checkout.set('payment_id', data.data.payment_id);
                            }

                            myorder.checkout.set('payment_type', payment_type);
                            myorder.checkout.saveCheckout();

                            if (data.data.url) {
                                window.location = data.data.url;
                            } else if (data.data.action && data.data.query) {
                                doFormRedirect(data.data.action, data.data.query);
                            }
                            return;
                        case "INSUFFICIENT_STOCK":
                            var message = '<span style="color: red;"> <b>' + MSG.ERROR_INSUFFICIENT_STOCK + '</b> </span> <br />';
                            for (var i = 0, j = data.responseJSON.length; i < j; i++) {
                                var current_element = data.responseJSON[i],
                                    order = myorder.where({id_product: current_element.id}),
                                    product = order[0].get_product(),
                                    name_product = product.get("name"),
                                    stock_amount = current_element.stock_amount,
                                    initial_product = App.Data.products[product.get('id_category')].get_product(current_element.id);

                                if (stock_amount === 0) {
                                    myorder.remove(order);
                                    initial_product.set('active', false);
                                } else {
                                    initial_product.set('stock_amount', current_element.stock_amount);
                                }
                                message += "<b>" + name_product + "</b>: requested - " + current_element.requested + ", stock amount - " + current_element.stock_amount + ". <br />";
                            }

                            data.errorMsg = message;
                            reportError(data.errorMsg);
                            break;
                        case "ORDERS_PICKUPTIME_LIMIT":
                            data.errorMsg = MSG.ERROR_ORDERS_PICKUPTIME_LIMIT;
                            reportErrorFrm(data.errorMsg);
                            break;
                        case "REWARD CARD UNDEFINED":
                            reportErrorFrm(MSG.REWARD_CARD_UNDEFINED);
                            break;
                        default:
                            data.errorMsg = MSG.ERROR_OCCURRED + data.errorMsg;
                            reportErrorFrm(data.errorMsg);
                    }//end of switch
                },
                error: function(xhr) {
                    myorder.paymentResponse = {
                        status: 'ERROR',
                        errorMsg: MSG.ERROR_SUBMIT_ORDER
                    };
                    reportErrorFrm(MSG.ERROR_SUBMIT_ORDER);
                },
                complete: function(xhr, result) {
                    payment_type === 1 && $.mobile.loading("hide");
                    delete myorder.paymentInProgress;
                }
            });

            function reportErrorFrm(message) {
                if (validation) {
                    myorder.trigger('paymentFailedValid', [message]);
                } else {
                    myorder.trigger('paymentFailed');
                    App.Data.errors.alert_red(message);
                }
            }

            function reportError(message) {
                if (validation) {
                    myorder.trigger('paymentFailedValid', [message]);
                } else {
                    myorder.trigger('paymentFailed', [message]);
                }
            }

            function doFormRedirect(action, query) {
                var newForm= $('<form>', {
                    'action': action,
                    'method': 'post'
                });
                for(var i in query) {
                    newForm.append($('<input>', {
                        name: i,
                        value: processValue(query[i]),
                        type: 'hidden'
                    }));
                }

              newForm.appendTo(document.body).submit();
            }

            function processValue(value) {
                var card = App.Data.card && App.Data.card.toJSON();
                var map = {
                    '$cardNumber': card.cardNumber,
                    '$expMonth': card.expMonth,
                    '$expDate': card.expDate,
                    '$securityCode': card.securityCode
                };

                for(var key in map) {
                    if(value && (typeof value === 'string' || value instanceof String)) {
                        value = replaceAll(key, map[key], value);
                    }
                }

                return value;
            }
        },

        empty_myorder: function() {
            this.remove(this.models); // this can lead to add bagChargeItem or/and deliveryItem automaticaly,
                                      // so one/two items still exist in the collection and total is non zero.
            this.remove(this.bagChargeItem);
            this.remove(this.deliveryItem);

            this.total.empty(); //this is for reliability cause of raunding errors exist.

            this.checkout.set('dining_option', 'DINING_OPTION_ONLINE');
        }
    });
});
