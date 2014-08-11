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

define(['backbone', 'factory'], function(Backbone) {

    App.Views.DeliveryAddressesView = App.Views.FactoryView.extend({
        initialize: function() {
            this.model = App.Data.customer.toJSON();

            var settings = App.Data.settings.get('settings_system'),
                shipping_address = this.model.shipping_address,
                lastAddress;

            lastAddress = this.model.addresses.length &&
                          typeof this.model.addresses[this.model.addresses.length - 1].street_1 === 'string'
                            ? this.model.addresses[this.model.addresses.length - 1] : undefined;

            this.model.addresses = this.model.addresses.filter(getInitialAddresses);
            
            if (this.model.addresses[0] && this.model.addresses[0].country) 
                var country_selected = this.model.addresses[0].country;

            this.model.country = country_selected ? country_selected : (settings.address && settings.address.country);
            this.model.state = settings.address && settings.address.state ? (lastAddress ? lastAddress.state : settings.address.state) : null;
            this.model.province = settings.address.province && this.model.country == "CA" ? (lastAddress ? lastAddress.province : "") : null;
            this.model.originalState = this.model.state;
            this.model.originalProvince = this.model.province;
            this.model.states = getStates();
            this.model.street_1 = lastAddress ? lastAddress.street_1 : '';
            this.model.street_2 = lastAddress ? lastAddress.street_2 : '';
            this.model.city = lastAddress ? lastAddress.city : '';
            this.model.zipcode = lastAddress ? lastAddress.zipcode : '';
            this.model.countries = getCountries();

            this.otherAddress = {
                street_1: lastAddress ? lastAddress.street_1 : '',
                street_2: lastAddress ? lastAddress.street_2 : '',
                city: lastAddress ? lastAddress.city : '',
                zipcode: lastAddress ? lastAddress.zipcode : '',
                country: settings.address ? settings.address.country : undefined
            };
            if(this.model.country === 'US')
                this.otherAddress.state = this.model.state || undefined;
            if(this.model.country === 'CA')
                this.otherAddress.province = this.model.province || undefined;

            this.model.isShippingServices = App.skin == App.Skins.RETAIL;

            if (this.model.isShippingServices)
                this.listenTo(this.options.customer, 'change:shipping_services', this.updateShippingServices, this);

            App.Views.FactoryView.prototype.initialize.apply(this, arguments);
        },
        render: function() {
            this.$el.html(this.template(this.model));

            if (this.model.isShippingServices)
                this.updateShippingServices();

            return this;
        },
        events: {            
            'change select.country': 'countryChange',
            'change select.states': 'changeState',
            'change .shipping-select': 'changeShipping',
            'focus input[name]': 'focus',
            'blur input[name]': 'blur'
        },
        onChangeElem: function(e) {
            e.target.value = fistLetterToUpperCase(e.target.value).trim();
            this.otherAddress[e.target.name] = e.target.value;
            this.trigger('update_address');
        },
        updateShippingServices: function(){
            var customer = this.options.customer,
                shipping_services = customer.get("shipping_services"),
                shipping_status = customer.get("load_shipping_status");
           
            var shipping = this.$('.shipping-select').empty();
            if (!shipping_status || shipping_status == "panding") {
                shipping_services = [];
                this.options.customer.set("shipping_selected", -1);
            } else {
                if (shipping_services.length)
                    this.options.customer.set("shipping_selected", 0);
            }

            for (var index in shipping_services) {
                var name = shipping_services[index].class_of_service + " (" + App.Settings.currency_symbol + 
                           parseFloat(shipping_services[index].shipping_charge).toFixed(2) +")";
                shipping.append('<option value="' + index + '">' + name + '</option>');
            };

            shipping.removeAttr("status");
            if (!shipping_status || shipping_status == "pending" || shipping_services.length == 0) {
                shipping.attr("disabled", "disabled");
                shipping.attr("status", "panding");
            }
            else {
                shipping.removeAttr("disabled");    
            }                
            
            if (shipping_status && shipping_status != "pending" && shipping_services.length == 0) {
                shipping.append('<option value="-1">' + MSG.ERROR_SHIPPING_SERVICES_NOT_FOUND + '</option>');
                shipping.attr("status", "error");
            }
            
            if (!shipping_status) {
                shipping.append('<option value="-1">' + MSG.SHIPPING_SERVICES_SET_ADDRESS + '</option>');
            }
            
            this.$(".shipping-status").html("");
            if (shipping_status == "pending") {
                shipping.append('<option value="-1">' + MSG.SHIPPING_SERVICES_RETRIVE_IN_PROGRESS + '</option>');
                this.$(".shipping-status").spinner();
            }
            
            shipping.change();
        },
        countryChange: function(e) {
            this.otherAddress.country = e.target.value;
            this.model.country = this.otherAddress.country;
            
            if (this.otherAddress.country == 'US') {
                if (typeof this.model.originalState == 'string' && this.model.originalState.length > 0)
                    this.model.state = this.otherAddress.state = this.model.originalState;
                else {
                    this.model.state = this.otherAddress.state = this.model.originalState = "CA";
                }
            } 
            else {
                this.otherAddress.state = undefined;
            }

            if (this.otherAddress.country == 'CA') {
                if (typeof this.model.originalProvince == 'string' && this.model.originalProvince.length > 0)
                    this.model.province = this.otherAddress.province = this.model.originalProvince;
                else {
                    this.model.province = this.otherAddress.province = this.model.originalProvince = "";
                }
            } 
            else {
                this.otherAddress.province = undefined;
            }            

            this.otherAddress.city = '';
            this.otherAddress.street_1 = '';
            this.otherAddress.street_2 = '';
            this.otherAddress.zipcode = '';
            this.options.customer.set('load_shipping_status', '');

            this.render();
            this.trigger('update_address');
        },       
        changeShipping: function(e) {
            var price, 
                value = parseInt(e.currentTarget.value),
                myorder = App.Data.myorder,
                checkout = myorder.checkout,
                oldValue = this.options.customer.get("shipping_selected");

            this.options.customer.set('shipping_selected', value);
            if (value >= 0) {
                price = parseFloat(this.options.customer.get("shipping_services")[value].shipping_charge).toFixed(2) * 1;
                name = this.options.customer.get("shipping_services")[value].class_of_service;
            }
            else {
                price = 0;
                name = MSG.DELIVERY_ITEM;
            }

            myorder.change_dining_option(checkout, checkout.get("dining_option"));
            myorder.total.set_delivery_charge(price);
            myorder.deliveryItem.get("product").set({"price": price, "name": name});
        },
        changeState: function(e) {
            this.otherAddress.state = this.model.originalState = e.target.value;
            this.trigger('update_address');                       
        },
        focus: function(event){
            var name = event.target.name,
                prev = null,
                format = 'format' + name,
                listen = 'listen' + name;
            this[format] = function() {
                if(event.target.value === prev)
                    return;

                try {
                    var start = event.target.selectionStart,
                        end = event.target.selectionEnd,
                        direction = event.target.selectionDirection;
                } catch(e) {
                    console.log('There is not selection API');
                }
                event.target.value = fistLetterToUpperCase(event.target.value);
                prev = event.target.value;
                try {
                    event.target.setSelectionRange(start, end, direction);
                } catch(e) {}
            };
            this[listen] = setInterval(this[format], 50);
        },
        blur: function(event){
            var name = event.target.name,
                format = 'format' + name,
                listen = 'listen' + name;
            clearInterval(this['listen' + name]);
            delete this[format];
            delete this[listen];
            this.onChangeElem(event);
        }
    });

function getCountries(){
    return {
        "AF":"Afghanistan",
        "AX":"Åland Islands",
        "AL":"Albania",
        "DZ":"Algeria",
        "AS":"American Samoa",
        "AD":"AndorrA",
        "AO":"Angola",
        "AI":"Anguilla",
        "AQ":"Antarctica",
        "AG":"Antigua and Barbuda",
        "AR":"Argentina",
        "AM":"Armenia",
        "AW":"Aruba",
        "AU":"Australia",
        "AT":"Austria",
        "AZ":"Azerbaijan",
        "BS":"Bahamas",
        "BH":"Bahrain",
        "BD":"Bangladesh",
        "BB":"Barbados",
        "BY":"Belarus",
        "BE":"Belgium",
        "BZ":"Belize",
        "BJ":"Benin",
        "BM":"Bermuda",
        "BT":"Bhutan",
        "BO":"Bolivia",
        "BA":"Bosnia and Herzegovina",
        "BW":"Botswana",
        "BV":"Bouvet Island",
        "BR":"Brazil",
        "IO":"British Indian Ocean Territory",
        "BN":"Brunei Darussalam",
        "BG":"Bulgaria",
        "BF":"Burkina Faso",
        "BI":"Burundi",
        "KH":"Cambodia",
        "CM":"Cameroon",
        "CA":"Canada",
        "CV":"Cape Verde",
        "KY":"Cayman Islands",
        "CF":"Central African Republic",
        "TD":"Chad",
        "CL":"Chile",
        "CN":"China",
        "CX":"Christmas Island",
        "CC":"Cocos (Keeling) Islands",
        "CO":"Colombia",
        "KM":"Comoros",
        "CG":"Congo",
        "CD":"Congo, The Democratic Republic of the",
        "CK":"Cook Islands",
        "CR":"Costa Rica",
        "CI":"Cote D'Ivoire",
        "HR":"Croatia",
        "CU":"Cuba",
        "CY":"Cyprus",
        "CZ":"Czech Republic",
        "DK":"Denmark",
        "DJ":"Djibouti",
        "DM":"Dominica",
        "DO":"Dominican Republic",
        "EC":"Ecuador",
        "EG":"Egypt",
        "SV":"El Salvador",
        "GQ":"Equatorial Guinea",
        "ER":"Eritrea",
        "EE":"Estonia",
        "ET":"Ethiopia",
        "FK":"Falkland Islands (Malvinas)",
        "FO":"Faroe Islands",
        "FJ":"Fiji",
        "FI":"Finland",
        "FR":"France",
        "GF":"French Guiana",
        "PF":"French Polynesia",
        "TF":"French Southern Territories",
        "GA":"Gabon",
        "GM":"Gambia",
        "GE":"Georgia",
        "DE":"Germany",
        "GH":"Ghana",
        "GI":"Gibraltar",
        "GR":"Greece",
        "GL":"Greenland",
        "GD":"Grenada",
        "GP":"Guadeloupe",
        "GU":"Guam",
        "GT":"Guatemala",
        "GG":"Guernsey",
        "GN":"Guinea",
        "GW":"Guinea-Bissau",
        "GY":"Guyana",
        "HT":"Haiti",
        "HM":"Heard Island and Mcdonald Islands",
        "VA":"Holy See (Vatican City State)",
        "HN":"Honduras",
        "HK":"Hong Kong",
        "HU":"Hungary",
        "IS":"Iceland",
        "IN":"India",
        "ID":"Indonesia",
        "IR":"Iran, Islamic Republic Of",
        "IQ":"Iraq",
        "IE":"Ireland",
        "IM":"Isle of Man",
        "IL":"Israel",
        "IT":"Italy",
        "JM":"Jamaica",
        "JP":"Japan",
        "JE":"Jersey",
        "JO":"Jordan",
        "KZ":"Kazakhstan",
        "KE":"Kenya",
        "KI":"Kiribati",
        "KP":"Korea, Democratic People'S Republic of",
        "KR":"Korea, Republic of",
        "KW":"Kuwait",
        "KG":"Kyrgyzstan",
        "LA":"Lao People'S Democratic Republic",
        "LV":"Latvia",
        "LB":"Lebanon",
        "LS":"Lesotho",
        "LR":"Liberia",
        "LY":"Libyan Arab Jamahiriya",
        "LI":"Liechtenstein",
        "LT":"Lithuania",
        "LU":"Luxembourg",
        "MO":"Macao",
        "MK":"Macedonia, The Former Yugoslav Republic of",
        "MG":"Madagascar",
        "MW":"Malawi",
        "MY":"Malaysia",
        "MV":"Maldives",
        "ML":"Mali",
        "MT":"Malta",
        "MH":"Marshall Islands",
        "MQ":"Martinique",
        "MR":"Mauritania",
        "MU":"Mauritius",
        "YT":"Mayotte",
        "MX":"Mexico",
        "FM":"Micronesia, Federated States of",
        "MD":"Moldova, Republic of",
        "MC":"Monaco",
        "MN":"Mongolia",
        "MS":"Montserrat",
        "MA":"Morocco",
        "MZ":"Mozambique",
        "MM":"Myanmar",
        "NA":"Namibia",
        "NR":"Nauru",
        "NP":"Nepal",
        "NL":"Netherlands",
        "AN":"Netherlands Antilles",
        "NC":"New Caledonia",
        "NZ":"New Zealand",
        "NI":"Nicaragua",
        "NE":"Niger",
        "NG":"Nigeria",
        "NU":"Niue",
        "NF":"Norfolk Island",
        "MP":"Northern Mariana Islands",
        "NO":"Norway",
        "OM":"Oman",
        "PK":"Pakistan",
        "PW":"Palau",
        "PS":"Palestinian Territory, Occupied",
        "PA":"Panama",
        "PG":"Papua New Guinea",
        "PY":"Paraguay",
        "PE":"Peru",
        "PH":"Philippines",
        "PN":"Pitcairn",
        "PL":"Poland",
        "PT":"Portugal",
        "PR":"Puerto Rico",
        "QA":"Qatar",
        "RE":"Reunion",
        "RO":"Romania",
        "RU":"Russian Federation",
        "RW":"Rwanda",
        "SH":"Saint Helena",
        "KN":"Saint Kitts and Nevis",
        "LC":"Saint Lucia",
        "PM":"Saint Pierre and Miquelon",
        "VC":"Saint Vincent and the Grenadines",
        "WS":"Samoa",
        "SM":"San Marino",
        "ST":"Sao Tome and Principe",
        "SA":"Saudi Arabia",
        "SN":"Senegal",
        "CS":"Serbia and Montenegro",
        "SC":"Seychelles",
        "SL":"Sierra Leone",
        "SG":"Singapore",
        "SK":"Slovakia",
        "SI":"Slovenia",
        "SB":"Solomon Islands",
        "SO":"Somalia",
        "ZA":"South Africa",
        "GS":"South Georgia and the South Sandwich Islands",
        "ES":"Spain",
        "LK":"Sri Lanka",
        "SD":"Sudan",
        "SR":"Suriname",
        "SJ":"Svalbard and Jan Mayen",
        "SZ":"Swaziland",
        "SE":"Sweden",
        "CH":"Switzerland",
        "SY":"Syrian Arab Republic",
        "TW":"Taiwan, Province of China",
        "TJ":"Tajikistan",
        "TZ":"Tanzania, United Republic of",
        "TH":"Thailand",
        "TL":"Timor-Leste",
        "TG":"Togo",
        "TK":"Tokelau",
        "TO":"Tonga",
        "TT":"Trinidad and Tobago",
        "TN":"Tunisia",
        "TR":"Turkey",
        "TM":"Turkmenistan",
        "TC":"Turks and Caicos Islands",
        "TV":"Tuvalu",
        "UG":"Uganda",
        "UA":"Ukraine",
        "AE":"United Arab Emirates",
        "GB":"United Kingdom",
        "US":"United States",
        "UM":"United States Minor Outlying Islands",
        "UY":"Uruguay",
        "UZ":"Uzbekistan",
        "VU":"Vanuatu",
        "VE":"Venezuela",
        "VN":"Viet Nam",
        "VG":"Virgin Islands, British",
        "VI":"Virgin Islands, U.S.",
        "WF":"Wallis and Futuna",
        "EH":"Western Sahara",
        "YE":"Yemen",
        "ZM":"Zambia",
        "ZW":"Zimbabwe"
    }
}

    function getStates() {
        return {
            AL: 'Alabama',
            AK: 'Alaska',
            AZ: 'Arizona',
            AR: 'Arkansas',
            CA: 'California',
            CO: 'Colorado',
            CT: 'Connecticut',
            DE: 'Delaware',
            FL: 'Florida',
            GA: 'Georgia',
            HI: 'Hawaii',
            ID: 'Idaho',
            IL: 'Illinois',
            IN: 'Indiana',
            IA: 'Iowa',
            KS: 'Kansas',
            KY: 'Kentucky',
            LA: 'Louisiana',
            ME: 'Maine',
            MD: 'Maryland',
            MA: 'Massachusetts',
            MI: 'Michigan',
            MN: 'Minnesota',
            MS: 'Mississippi',
            MO: 'Missouri',
            MT: 'Montana',
            NE: 'Nebraska',
            NV: 'Nevada',
            NH: 'New Hampshire',
            NJ: 'New Jersey',
            NM: 'New Mexico',
            NY: 'New York',
            NC: 'North Carolina',
            ND: 'North Dakota',
            OH: 'Ohio',
            OK: 'Oklahoma',
            OR: 'Oregon',
            PA: 'Pennsylvania',
            RI: 'Rhode Island',
            SC: 'South Carolina',
            SD: 'South Dakota',
            TN: 'Tennessee',
            TX: 'Texas',
            UT: 'Utah',
            VT: 'Vermont',
            VA: 'Virginia',
            WA: 'Washington',
            WV: 'West Virginia',
            WI: 'Wisconsin',
            WY: 'Wyoming'
        };
    }

    function getInitialAddresses(i) {
        return !i.street_1;
    }
});