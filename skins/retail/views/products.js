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

define(["products_view"], function(products_view) {
    'use strict';

    var ProductListItemView = App.Views.CoreProductView.CoreProductListItemView.extend({
        showModifiers: function() {
            var myorder = new App.Models.Myorder(),
                isStanfordItem = App.Data.is_stanford_mode && this.model.get('is_gift'),
                def = myorder.add_empty(this.model.get('id'), this.model.get('id_category'));

            $('#main-spinner').css('font-size', App.Data.getSpinnerSize() + 'px').addClass('ui-visible');
            def.then(function() {
                $('#main-spinner').removeClass('ui-visible');
                App.Data.mainModel.set('popup', {
                    modelName: 'MyOrder',
                    mod: isStanfordItem ? 'StanfordItem' : 'Matrix',
                    className: isStanfordItem ? 'stanford-reload-item' : '',
                    model: myorder.clone(),
                    action: 'add'
                });
            });
        },
        show_hide: function() {
            this.parent = this.parent && this.parent.length ? this.parent : this.$el.parent();
            if (!this.model.get('active')) {
                this.$el.detach();
            } else {
                this.parent.append(this.$el);
            }
        }
    });

    var ProductListView = App.Views.CoreProductView.CoreProductListView.extend({
        initialize: function() {
            this.listenTo(this.options.filter, 'change', this.sortItems, this);
            this.listenTo(this.options.filter, 'change', this.filterItems, this);
            App.Views.CoreProductView.CoreProductListView.prototype.initialize.apply(this, arguments);
        },
        render: function() {
            App.Views.CoreProductView.CoreProductListView.prototype.render.apply(this, arguments);
            this.sortItems(this.options.filter, 1);
            this.filterItems(this.options.filter);
            return this;
        },
        sortItems: function(model, force) {
            var filter = this.options.filter,
                attr = filter.get('sort'),
                order = filter.get('order'),
                changed = model.changed;
            if('sort' in changed || 'order' in changed || force)
                App.Views.CoreProductView.CoreProductListView.prototype.sortItems.call(this, attr, order);
        },
        filterItems: function(model) {
            var attribute1 = model.get('attribute1'),
                attribute2 = model.get('attribute2'),
                changed = model.changed;
            if(!attribute1 || !attribute2 || !('attribute1' in changed || 'attribute2' in changed)) {
                return;
            }
            this.subViews.forEach(function(view) {
                var values1 = view.model.get('attribute_1_values'),
                    values2 = view.model.get('attribute_2_values');
                if(needToHide(values1, attribute1) || needToHide(values2, attribute2))
                    view.$el.hide();
                else
                    view.$el.removeAttr('style'); // instead of show() because show adds display:list-item
            });
            function needToHide(values, value) {1
                return value == 1 ? false : !Array.isArray(values) || values.indexOf(value) == -1;
            }
        }
    });

    var ProductModifiersView = App.Views.CoreProductView.CoreProductModifiersView.extend({
        render: function() {
            App.Views.CoreProductView.CoreProductModifiersView.prototype.render.apply(this, arguments);
            this.showImage({
                currentTarget: this.$('.images > li:first')
            });
            return this;
        },
        events: function() {
            var parent = App.Views.CoreProductView.CoreProductModifiersView.prototype.events;
            return $.extend(parent, {
                'click li[data-index]': 'showImage',
                'keyup .gift_card_price': 'keyup'
            });
        },
        showImage: function(event) {
            var images = this.model.get_product().get('images'),
                li = $(event.currentTarget),
                index = li.attr('data-index'),
                image = this.$('.large');
            image.attr('src', images[index]);
            loadSpinner(image);
            this.$('.images > li').removeClass('active');
            li.addClass('active');
        },
        update_price: function() {
            var initial_price = round_monetary_currency(this.model.get('initial_price'));
            this.$('.price').text(initial_price);
        },
        keyup: function(e) {
            var initial_price = round_monetary_currency(this.model.get('initial_price')),
                formatPrice = round_monetary_currency(e.target.value),
                floatValue = parseFloat(e.target.value);
            if(formatPrice != initial_price && !isNaN(floatValue)) {
                this.model.set('initial_price', floatValue);
                this.product.set('price', floatValue);
            }
        }
    });

    return new (require('factory'))(products_view.initViews.bind(products_view), function() {
        App.Views.ProductView.ProductListItemView = ProductListItemView;
        App.Views.ProductView.ProductListView = ProductListView;
        App.Views.ProductView.ProductModifiersView = ProductModifiersView;
    });
});
