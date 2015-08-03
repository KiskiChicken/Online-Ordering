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

define(["categories_view"], function(categories_view) {

    // Represents a parent category. Model's attributes look like {name: <parent_name>, sort: <parent_sort>, subcategories: [<id1>, <id2>, ...]}
    var ParentCategoryView = App.Views.FactoryView.extend({

    });

    var ParentsCategoriesView = App.Views.FactoryView.extend({

    });


    var CategoriesItemView = App.Views.LazyItemView.extend({
        name: 'categories',
        mod: 'item',
        initialize: function() {
            App.Views.LazyItemView.prototype.initialize.apply(this, arguments);
            this.listenTo(this.model, 'change:active', this.show_hide);
            this.show_hide();
        },
        bindings: {

        },
        events: {
            "click": "showProducts"
        },
        showProducts: function(e) {
            e.preventDefault();
            var id = this.model.get('id');
            App.Data.router.navigate("products/" + id, true);
        },
        show_hide: function() {
            if (!this.model.get('active')) {
                this.$el.hide();
            } else {
                this.$el.show();
            }
        }
    });

    var CategoriesItemView = App.Views.LazyItemView.extend({
        name: 'categories',
        mod: 'item',
        initialize: function() {
            App.Views.LazyItemView.prototype.initialize.apply(this, arguments);
            this.listenTo(this.model, 'change:active', this.show_hide);
            this.show_hide();
        },
        bindings: {

        },
        events: {
            "click": "showProducts"
        },
        showProducts: function(e) {
            e.preventDefault();
            var id = this.model.get('id');
            App.Data.router.navigate("products/" + id, true);
        },
        show_hide: function() {
            if (!this.model.get('active')) {
                this.$el.hide();
            } else {
                this.$el.show();
            }
        }
    });

    var CategoriesMainView = App.Views.LazyListView.extend({
        name: 'categories',
        mod: 'main',
        initialize: function() {
            App.Views.LazyListView.prototype.initialize.apply(this, arguments);
            this.listenTo(this.collection, 'load_complete', this.render, this);
        },
        render: function() {
            this.collection.sortEx();
            App.Views.LazyListView.prototype.render.apply(this, arguments);
            return this;
        },
        addItem: function(model) {
            var view = App.Views.GeneratorView.create('Categories', {
                el: $('<li></li>'),
                mod: 'Item',
                model: model
            }, model.cid);

            //trace("AddItem=>",model.get('name'),model.cid, model.escape('parent_sort'), model.escape('sort'), model.get("sort_val"));
            App.Views.LazyListView.prototype.addItem.call(this, view, this.$('.categories'));

            // Right now culcImageSize() is useless because category images can't be download to Revel servers,
            // images are accessed via external url only
            //this.culcImageSize(model);
            this.subViews.push(view);
        }
    });

    return new (require('factory'))(categories_view.initViews.bind(categories_view), function() {
        // App.Views.CategoriesView.CategoriesItemView = CategoriesItemView;
        App.Views.CategoriesView.CategoriesMainView = CategoriesMainView;
    });
});
