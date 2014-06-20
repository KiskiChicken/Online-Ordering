define(["backbone", "myorder_view"], function(Backbone) {
    'use strict';

    App.Views.MyOrderView.MyOrderMatrixView = App.Views.CoreMyOrderView.CoreMyOrderMatrixView.extend({
        initialize: function() {
            App.Views.CoreMyOrderView.CoreMyOrderMatrixView.prototype.initialize.apply(this, arguments);
            this.listenTo(this.model.get('product'), 'change:attribute_1_selected change:attribute_2_selected', this.attributes_update);
        },
        render: function() {
            App.Views.CoreMyOrderView.CoreMyOrderMatrixView.prototype.render.apply(this, arguments);
            if (this.options.action === 'add') {
                this.$('.action_button').html('Add Item');
            } else {
                this.$('.action_button').html('Update Item');
            }
            var model = this.model,
                view;

            var sold_by_weight = this.model.get_product().get("sold_by_weight"),
                mod = sold_by_weight ? 'Weight' : 'Main';

            view = App.Views.GeneratorView.create('Quantity', {
                el: this.$('.quantity_info'),
                model: model,
                mod: mod
            });
            this.subViews.push(view);

            view = App.Views.GeneratorView.create('Instructions', {
                el: this.$('.product_instructions'),
                model: model,
                mod: 'Modifiers'
            });
            this.subViews.push(view);

            if (App.Data.settings.get('settings_system').special_requests_online === false) {
                view.$el.hide(); // hide special request if not allowed
            }

            setTimeout(this.change_height.bind(this, 1), 20);
            this.interval = this.interval || setInterval(this.change_height.bind(this), 500); // check size every 0.5 sec
            this.$('.modifiers_table_scroll').contentarrow();
            this.attributes_update();
            return this;
        },
        events: {
            'click .action_button:not(.disabled)': 'action',
            'change_height .product_instructions': 'change_height' // if special request button pressed
        },
        attributes_update: function() {
            if (this.model.get('product').check_selected()) {
                this.$('.action_button').removeClass('disabled');
            }
            else {
                this.$('.action_button').addClass('disabled');
            }
        },
        action: function (event) {

            var check = this.model.check_order(),
                self = this;

            if (check.status === 'OK') {
                this.model.get_product().check_gift(function() {
                    if (self.options.action === 'add') {
                        App.Data.myorder.add(self.model);
                    } else {
                        var index = App.Data.myorder.indexOf(self.model) - 1;
                        App.Data.myorder.remove(self.options.real);
                        App.Data.myorder.add(self.model, {at: index});
                    }

                    $('#popup .cancel').trigger('click');
                }, function(errorMsg) {
                    App.Data.errors.alert(errorMsg);
                });
            } else {
                App.Data.errors.alert(check.errorMsg);
            }
        },
        check: function () {
            var check = this.model.check_order(),
                self = this;

            if (check.status === 'OK') {
                this.model.get_product().check_gift(function() {
                    if (self.options.action === 'add') {
                        App.Data.myorder.add(self.model);
                    } else {
                        var index = App.Data.myorder.indexOf(self.model) - 1;
                        App.Data.myorder.remove(self.options.real);
                        App.Data.myorder.add(self.model, {at: index});
                    }

                    $('#popup .cancel').trigger('click');
                }, function(errorMsg) {
                    App.Data.errors.alert(errorMsg);
                });
            } else {
                App.Data.errors.alert(check.errorMsg);
            }
        },
        change_height: function(e) {
            var prev_height = this.prev_height || 0,
                inner_height = $('#popup').outerHeight(),
                prev_window = this.prev_window || 0,
                window_heigth = $(window).height();

            if (e || prev_height !== inner_height || prev_window !== window_heigth) {
                var el = this.$('.modifiers_table_scroll'),
                    wrapper_height,

                    product = this.$('.product_info').outerHeight(),
                    special = this.$('.instruction_block')[0].clientHeight,
                    size = this.$('.quantity_info').outerHeight();

                el.height('auto');
                inner_height = $('#popup').outerHeight();
                wrapper_height = $('.popup_wrapper').height();

                if (wrapper_height < inner_height) {
                        var height = wrapper_height - product - special - size - 117;
                    el.height(height);
                }

                inner_height = $('#popup').outerHeight();
                this.prev_height = inner_height;
                this.prev_window = window_heigth;
            }
        },
        remove: function() {
            this.$('.modifiers_table_scroll').contentarrow('destroy');
            clearInterval(this.interval);
            App.Views.CoreMyOrderView.CoreMyOrderMatrixView.prototype.remove.apply(this, arguments);
        }
    });

    App.Views.MyOrderView.MyOrderItemView = App.Views.CoreMyOrderView.CoreMyOrderItemView.extend({
        editItem: function(e) {
            e.preventDefault();
            var model = this.model;
            App.Data.mainModel.set('popup', {
                    modelName: 'MyOrder',
                    mod: 'Matrix',
                    model: model.clone(),
                    real: model,
                    action: 'update'
                });
        }
    });

    App.Views.MyOrderView.MyOrderItemSpecialView = App.Views.FactoryView.extend({
        name: 'myorder',
        mod: 'itemSpecial',
        render: function() {
            var model = {
                name: this.model.get_product().get('name'),
                special: this.model.get_special()
            };
            this.$el.html(this.template(model));
        }
    });
});
