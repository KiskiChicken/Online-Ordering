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

define(["backbone", "factory"], function(Backbone) {
    'use strict';

    var MaintenanceMainView = App.Views.FactoryView.extend({
        name: 'maintenance',
        mod: 'main',
        render: function() {
            this.model = new Backbone.Model({
                errMsg: App.Data.settings.get('maintenanceMessage')
            });
            App.Views.FactoryView.prototype.render.apply(this, arguments);
            this.listenToOnce(App.Data.mainModel, 'loadCompleted', App.Data.myorder.check_maintenance);
        },
        events: {
            'click .btn': 'reload',
            'click .change-store': 'change_establishment',
        },
        reload: function() {
            window.location.reload();
        },
        /**
         * Show the "Change Establishment" modal window.
         */
        change_establishment: function(e) {
            var ests = App.Data.establishments;
            ests.getModelForView().set({
                storeDefined: true
            }); // get a model for the stores list view
            ests.trigger('loadStoresList');
            // App.Data.mainModel.set('isBlurContent', true);
            e.stopPropagation();
        }
    });

    return new (require('factory'))(function() {
        App.Views.MaintenanceView = {};
        App.Views.MaintenanceView.MaintenanceMainView = MaintenanceMainView;
    });

});