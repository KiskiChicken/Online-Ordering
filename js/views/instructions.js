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

define(["backbone", "factory", "jquery_numbermask"], function(Backbone) {
    'use strict';

    App.Views.CoreInstructionsView = {};

    App.Views.CoreInstructionsView.CoreInstructionsModifiersView = App.Views.FactoryView.extend({
        name: 'instructions',
        mod: 'modifiers',
        initialize: function() {
            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
            this.listenTo(this.model, 'change:special', this.update, this);
        },
        render: function() {
            App.Views.FactoryView.prototype.render.apply(this, arguments);
            var self = this,
                inputValue = '',
                opts = {
                    pattern: /^.{0,255}$/,
                    defaultValueInput: {
                        toString: function() {
                            return inputValue;
                        }
                    }
                };
            this.$('.instructions').on('keyup blur', function() {
                // Need trim text values that are more than 255 symbols.
                // It should be assigned to listeners before numberMask initialization.
                if(this.value.length > 255) {
                    inputValue = this.value.slice(0, 255);
                    this.value = inputValue;
                    self.change_special({target: this}); // it has to be invoked due to 'change' event doesn't occur after it
                }
            }).numberMask(opts);
            return this;
        },
        events: {
            'change .instructions': 'change_special'
        },
        change_special: function(e) {
            this.model.set('special', e.target.value, {silent : true});
        },
        update: function() {
            this.$('.instructions').val(this.model.get('special'));
        }
    });

    App.Views.InstructionsView = {};

    App.Views.InstructionsView.InstructionsModifiersView = App.Views.CoreInstructionsView.CoreInstructionsModifiersView;
});