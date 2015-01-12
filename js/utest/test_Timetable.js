define(['timetable'], function() {
        
    var timetables;

    $.ajax({
        type: "GET",
        url: "js/utest/data/Timetable.json",
        dataType: "json",
        async: false,
        success: function(data) {
            timetables = data;
        }
    });

    describe('App.Models.WorkingDay', function() {
        var model, def, set0, set01, set1, set1n, set2, set2n, set3, set4, set4n, defSet1, defSet2, timeSettings, times = [];

        beforeEach(function() {
            def =  {
                timetable: [],
                options: [],
                curTime: null
            },
            set01 = {
                timetable: false,
                curTime: new Date(2013, 10, 10)
            }, 
            set0 = {
                timetable: null,
                curTime: new Date(2013, 10, 10)
            }, 
            set1 = {
                timetable: [{to: "11:00", from: "09:00"}],
                curTime: new Date(2013, 10, 10)
            },
            set1n = [{to: 660, from: 540}],
            defSet1 = {
                timetable: [{to: "11:00", from: "09:00"}],
                options: [],
                curTime: new Date(2013, 10, 10)
            },
            set2 = {
                timetable: [{to: "12:00", from: "09:20"}, {to: "11:30", from: "09:00"}],
                curTime: new Date(2013, 10, 10)
            }, 
            set2n = [{to: 720, from: 560}, {to: 690, from: 540}],
            defSet2 = {
                timetable: [{to: "12:00", from: "09:20"}, {to: "11:30", from: "09:00"}],
                options: [],
                curTime: new Date(2013, 10, 10)
            },
            set3 = {
                timetable: [{to: "11:00", from: "10:10"}],
                curTime: new Date(2013, 10, 10)
            },
            set4 = {
                timetable: [{to: "13:00", from: "10:00"}],
                curTime: new Date(2013, 10, 10)
            },
            set4n = [{to: 780, from: 600}];
            for(var i = 1, j = 5; i <= j; i++) {
                times[i] = deepClone(timetables['times' + i]);
            }
            
            this.settings = deepClone(App.Data.settings.get('settings_system'));
            timeSettings = {
                estimated_delivery_time: 45,
                estimated_order_preparation_time: 17,
                online_order_time_slot: 20,
                online_order_start_time_offset: 25,
                online_order_end_time_offset: 35
            };
            var system = App.Data.settings.get('settings_system');
            system.estimated_delivery_time = timeSettings.estimated_delivery_time;
            system.estimated_order_preparation_time = timeSettings.estimated_order_preparation_time;
            system.online_order_time_slot = timeSettings.online_order_time_slot;
            system.online_order_start_time_offset = timeSettings.online_order_start_time_offset;
            system.online_order_end_time_offset = timeSettings.online_order_end_time_offset;
            model = new App.Models.WorkingDay();
        });
        
        afterEach(function() {
            App.Data.settings.set('settings_system', this.settings);
        });


        it("Environment", function() {
            expect(App.Models.WorkingDay).toBeDefined();
        });

        // App.Models.WorkingDay
        it("Create App.Models.WorkingDay", function() {
           expect(model.toJSON()).toEqual(def);

           model.set(set1);
           expect(model.toJSON()).toEqual(defSet1);
        });

        // App.Models.WorkingDay Initialization settings
        it("Initialization parameters App.Models.WorkingDay", function() {
           expect(model.pickup_time_interval).toBe(timeSettings.online_order_time_slot);
           expect(model.start_time).toBe(timeSettings.online_order_start_time_offset);
           expect(model.end_time).toBe(timeSettings.online_order_end_time_offset);
           expect(model.delivery_time).toBe(timeSettings.estimated_delivery_time);
           expect(model.preparation_time).toBe(timeSettings.estimated_order_preparation_time);
        });

        // App.Models.WorkingDay function update
        it("App.Models.WorkingDay Function update", function() {
           model.set(set1);
           model.update(set2);
           expect(model.toJSON()).toEqual(defSet2);
        });

        // App.Models.WorkingDay function get_dining_offset
        it("App.Models.WorkingDay Function get_dining_offset", function() {
           expect(model.get_dining_offset()).toEqual(timeSettings.estimated_order_preparation_time * 60 * 1000);
           expect(model.get_dining_offset(true)).toEqual(timeSettings.estimated_delivery_time * 60 * 1000);
        });

        // App.Models.WorkingDay function _isAllTheDay
        describe("App.Models.WorkingDay Function _isAllTheDay", function() {
            
            it('timetable is null', function() {
                model.set('timetable', null);
                expect(model._isAllTheDay()).toBe(true);
            });
            
            it('timetable is true', function() {
                model.set('timetable', true);
                expect(model._isAllTheDay()).toBe(true);
            });
            
            it('timetable is false', function() {
                model.set('timetable', false);
                expect(model._isAllTheDay()).toBe(false);
            });
            
            it('timetable is array', function() {
                model.set('timetable', []);
                expect(model._isAllTheDay()).toBe(false);
            });
        });

        // App.Models.WorkingDay function _isClosedToday
        describe("App.Models.WorkingDay Function _isClosedToday", function() {
            
            it('timetable is false', function() {
                model.set('timetable', false);
                expect(model._isClosedToday()).toBe(true);
            });
            
            it('timetable is []', function() {
                model.set('timetable', []);
                expect(model._isClosedToday()).toBe(true);
            });
            
            it('timetable is true', function() {
                model.set('timetable', true);
                expect(model._isClosedToday()).toBe(false);
            });
        });

        // App.Models.WorkingDay function _pickupTimesForPeriod
        describe("App.Models.WorkingDay Function _pickupTimesForPeriod", function() {

            beforeEach(function() {
               model.set(set1);
            });

            it('from 09:00 to 11:30', function() {
                expect(model._pickupTimesForPeriod(set2n[1])).toEqual([582, 602, 622]);
                /**
                 * 9:00 + online_order_start_time_offset + estimated_order_preparation_time  = 9:42
                 * 11:30 - online_order_end_time_offset - estimated_order_preparation_time  = 10:38
                 * 9:42 <= pickup time <= 10:55
                 * 
                 * 9:42 = 9 * 60 + 42 = 582
                 * 10:02
                 * 10:22
                 */
            });

            it('from 10:00 to 13:00, delivery option', function() {
                model.set(set4);
                expect(model._pickupTimesForPeriod(set4n[0], true)).toEqual([670, 690]);
                /**
                 * 10:00 + online_order_start_time_offset + estimated_delivery_time = 11:10
                 * 13:00  - online_order_end_time_offset - estimated_delivery_time  = 11:40
                 * 11:10 <= pickup time <= 11:40
                 * 
                 * 11:10 = 11 * 60 + 10 = 670
                 * 11:30
                 */
            });

            it('from 10:10 to 11:00', function() {
                expect(model._pickupTimesForPeriod(set3.timetable[0])).toEqual([]);
            });

            it('all the day', function() {
                expect(model._pickupTimesForPeriod('all-the-day')).toEqual(times[2]);
            });
        });
        
        // App.Models.WorkingDay function _unionPeriods
        describe("App.Models.WorkingDay Function _unionPeriods. ", function() {
            
            it('Empty array', function() {
                expect(model._unionPeriods([])).toEqual([]);
            });
            
            it('Single period', function() {
                expect(model._unionPeriods([{to: "12:00", from: "09:00"}])).toEqual([{to: 720, from: 540}]);
            });
            
            it('Merge two into one period 1212', function() {
                expect(model._unionPeriods([{to: "12:00", from: "09:20"}, {to: "11:30", from: "09:00"}])).toEqual([{to: 720, from: 540}]);
            });
            
            it('Merge two into one period 1221', function() {
                expect(model._unionPeriods([{to: "12:00", from: "09:00"}, {to: "11:30", from: "09:00"}])).toEqual([{to: 720, from: 540}]);
            });
            
            it('Not merged periods', function() {
                expect(model._unionPeriods([{to: "12:00", from: "09:20"}, {to: "21:30", from: "19:00"}])).toEqual([{to: 720, from: 560}, {to: 1290, from: 1140}]);
            });
            
            it('Combine merged and not merged periods', function() {
                expect(model._unionPeriods([{to: "12:00", from: "09:20"}, {to: "11:00", from: "09:00"}, {to: "21:30", from: "19:00"}])).
                        toEqual([{to: 720, from: 540}, {to: 1290, from: 1140}]);
            });
        });
            

        // App.Models.WorkingDay function _pickupSumTimes
        describe("App.Models.WorkingDay Function _pickupSumTimes", function() {
            
            var times2, func;
            
            beforeEach(function() {
               times2 = deepClone(timetables.times2);
               func = spyOn(App.Models.WorkingDay.prototype, "_pickupTimesForPeriod").and.returnValue([]);
            });

            it('_pickupSumTimes for all the day table', function() {
                spyOn(App.Models.WorkingDay.prototype, "_isAllTheDay").and.returnValue(true);
                model._pickupSumTimes();
                expect(func).toHaveBeenCalledWith('all-the-day');
            });

            it('_pickupSumTimes for not all the day and closed all day', function() {
                spyOn(App.Models.WorkingDay.prototype, "_isAllTheDay").and.returnValue(false);
                spyOn(App.Models.WorkingDay.prototype, "_isClosedToday").and.returnValue(true);
                expect(model._pickupSumTimes()).toEqual([]);
                expect(func).not.toHaveBeenCalled();
            });

            it('_pickupSumTimes from 09:00 to 11:30', function() {
                spyOn(App.Models.WorkingDay.prototype, "_isAllTheDay").and.returnValue(false);
                spyOn(App.Models.WorkingDay.prototype, "_isClosedToday").and.returnValue(false);
                model.update(set1);
                model._pickupSumTimes();
                expect(func).toHaveBeenCalledWith(set1n[0], undefined);
                expect(func.calls.count()).toBe(1);
            }); 

            it('_pickupSumTimes from 10:00 to 14:00. check delivery option', function() {
                spyOn(App.Models.WorkingDay.prototype, "_isAllTheDay").and.returnValue(false);
                spyOn(App.Models.WorkingDay.prototype, "_isClosedToday").and.returnValue(false);
                model.update(set4);
                model._pickupSumTimes(true);
                expect(func).toHaveBeenCalledWith(set4n[0], true);
                expect(func.calls.count()).toBe(1);
            }); 

            // should call _pickupTimesForPeriod with 9:00 to 12:00
            it('_pickupSumTimes from 09:00 to 11:30 and from 09:20 to 12:00. check functions calls', function() {
                var val = [{to: 720, from: 540}];
                spyOn(App.Models.WorkingDay.prototype, "_isAllTheDay").and.returnValue(false);
                spyOn(App.Models.WorkingDay.prototype, "_isClosedToday").and.returnValue(false);
                spyOn(App.Models.WorkingDay.prototype, "_unionPeriods").and.returnValue(val);
                model.update(set2);
                model._pickupSumTimes();
                expect(func.calls.count()).toBe(1);
                expect(func.calls.argsFor(0)[0]).toBe(val[0]);
            }); 
        });
        
        // App.Models.WorkingDay function checking_work_shop
        describe("Function checking_work_shop", function() {
            
            beforeEach(function() {
               spyOn(model, '_unionPeriods').and.returnValue(set4n);
               model.set(set4);
            });
            
            it('checking_work_shop closed', function() {
                model.set('timetable', false);
                expect(model.checking_work_shop()).toBe(false);         
            });
            
            it('checking_work_shop always open', function() {
                model.set('timetable', true);                    
                expect(model.checking_work_shop()).toBe(true);
                
                model.set('timetable', null);
                expect(model.checking_work_shop()).toBe(true);
            });
            
            it('checking_work_shop timetable is defined, time not in every period', function() {                
                model.set('curTime', new Date(2014, 3, 10, 14, 00));     
                expect(model.checking_work_shop()).toBe(false);                
            });
            
            it('checking_work_shop timetable is defined, time in offset period', function() {
                model.set('curTime', new Date(2014, 3, 10, 10, 20));     
                expect(model.checking_work_shop()).toBe(false);
                
                model.set('curTime', new Date(2014, 3, 10, 12, 30));
                expect(model.checking_work_shop()).toBe(false);
                
            });
            
            it('checking_work_shop timetable is defined, time in preparation offset period', function() {
                model.set('curTime', new Date(2014, 3, 10, 10, 40));    
                expect(model.checking_work_shop()).toBe(true);
                
                model.set('curTime', new Date(2014, 3, 10, 12, 09));    
                expect(model.checking_work_shop()).toBe(false);
            });
            
            it('checking_work_shop timetable is defined, time in delivery offset period', function() {
                model.set('curTime', new Date(2014, 3, 10, 11, 09));    
                expect(model.checking_work_shop(true)).toBe(true);
                
                model.set('curTime', new Date(2014, 3, 10, 11, 41));    
                expect(model.checking_work_shop(true)).toBe(false);
            });
            
            it('checking_work_shop timetable is defined, time inside available period', function() {
                model.set('curTime', new Date(2014, 3, 10, 11, 15));    
                expect(model.checking_work_shop(true)).toBe(true);
                
                model.set('curTime', new Date(2014, 3, 10, 11, 41));    
                expect(model.checking_work_shop()).toBe(true);
            });
        });

        // App.Models.WorkingDay function pickupTimeOptions
        describe("App.Models.WorkingDay Function pickupTimeOptions", function() {

            var func, array = [];
            
            beforeEach(function() {
               func = spyOn(App.Models.WorkingDay.prototype, "_pickupSumTimes").and.callFake(function() { return array; });
            });
            
            it('pickupTimeOptions test _pickupSumTimes arguments calls without delivery', function() { 
                spyOn(model, 'checking_work_shop')
                model.pickupTimeOptions();
                expect(func).toHaveBeenCalledWith(undefined);
            });
            
            it('pickupTimeOptions test _pickupSumTimes arguments calls with delivery', function() { 
                spyOn(model, 'checking_work_shop');
                model.pickupTimeOptions({today: false, isDelivery: true});
                expect(func).toHaveBeenCalledWith(true);
            });
            
            it('pickupTimeOptions for empty available pickuptime array', function() { 
                spyOn(model, 'checking_work_shop');
                array = [];
                expect(model.pickupTimeOptions()).toEqual(['closed']);
            });

            it('pickupTimeOptions for 10:00 and 10:20 pickup times and curTime 9:40 preparation time 17 delivery false', function() { 
                array = times[1];
                model.update({curTime: new Date(2013, 10, 10, 9, 40)});
                expect(model.pickupTimeOptions()).toEqual(["10:00am", "10:20am"]);           
            });

            it('pickupTimeOptions for 10:00 and 10:20 pickup times and curTime 9:50 preparation time 17 delivery false today true', function() { 
                array = times[1];
                model.update({curTime: new Date(2013, 10, 10, 9, 50)});
                expect(model.pickupTimeOptions({today: true})).toEqual(["ASAP (17 min)", "10:20am"]);           
            });

            it('pickupTimeOptions for 10:00 and 10:20 pickup times and curTime 10:10 preparation time 0 delivery false today true', function() { 
                array = times[1];
                model.preparation_time = 0;
                model.update({curTime: new Date(2013, 10, 10, 10, 10)});
                expect(model.pickupTimeOptions({today: true})).toEqual(["ASAP", "10:20am"]);           
            });

            it('pickupTimeOptions for 10:00 pickup times, curTime 10:10, delivery false, today true, checking_work_shop true ', function() { 
                array = [times[1][0]];
                spyOn(model, 'checking_work_shop').and.returnValue(true);
                model.update({curTime: new Date(2013, 10, 10, 10, 10)});
                expect(model.pickupTimeOptions({today: true})).toEqual(["ASAP (17 min)"]);
            });

            it('pickupTimeOptions for 10:00 pickup times, curTime 10:10, delivery false, today true, checking_work_shop false ', function() { 
                array = [times[1][0]];
                spyOn(model, 'checking_work_shop').and.returnValue(false);
                model.update({curTime: new Date(2013, 10, 10, 10, 10)});
                expect(model.pickupTimeOptions({today: true})).toEqual(["closed"]);
            });

            it('pickupTimeOptions for empty pickup times, curTime 10:10, delivery false, today true, checking_work_shop true ', function() { 
                array = [];
                spyOn(model, 'checking_work_shop').and.returnValue(true);
                model.update({curTime: new Date(2013, 10, 10, 10, 10)});
                expect(model.pickupTimeOptions({today: true})).toEqual(["ASAP (17 min)"]);
            });

            it('pickupTimeOptions for 10:00 and 10:20 pickup times and curTime 9:50 preparation time 17 delivery false today false', function() { 
                array = times[1];
                model.update({curTime: new Date(2013, 10, 10, 9, 50)});
                expect(model.pickupTimeOptions()).toEqual(["10:00am", "10:20am"]);           
            });
        });

        describe("App.Models.WorkingDay Function getLastPTforPeriod", function() {
            
            var time, time1;
            
            beforeEach(function() {
               time = new Date(2013, 10, 10, 10, 55),
               time1 = new Date(2013, 10, 10, 11, 00);
            });
            
            it('all the day', function() {
                spyOn(App.Models.WorkingDay.prototype, "_isAllTheDay").and.returnValue(true);
                expect(model.getLastPTforPeriod(time)).toBe('all-the-day');
            });
            
            it('empty available pickup times', function() {
                spyOn(App.Models.WorkingDay.prototype, "_isAllTheDay").and.returnValue(false);
                spyOn(App.Models.WorkingDay.prototype, "_pickupSumTimes").and.returnValue([]);
                expect(model.getLastPTforPeriod(time)).toBe('not-found');
            });
            
            it('not found pickup time more than current time', function() {
                spyOn(App.Models.WorkingDay.prototype, "_isAllTheDay").and.returnValue(false);
                spyOn(App.Models.WorkingDay.prototype, "_pickupSumTimes").and.returnValue([650]);
                expect(model.getLastPTforPeriod(time)).toBe('not-found');
            });
            
            it('found pickup time less than current time', function() {
                spyOn(App.Models.WorkingDay.prototype, "_isAllTheDay").and.returnValue(false);
                spyOn(App.Models.WorkingDay.prototype, "_pickupSumTimes").and.returnValue([660]);
                expect(model.getLastPTforPeriod(time).getTime()).toBe(time1.getTime());
            });
            
            it('test delivery options', function() {
                spyOn(App.Models.WorkingDay.prototype, "_isAllTheDay").and.returnValue(false);
                var func = spyOn(App.Models.WorkingDay.prototype, "_pickupSumTimes").and.returnValue([]);
                model.getLastPTforPeriod(time, true);
                expect(func).toHaveBeenCalledWith(true);
            });         
        });  
    });
    
    describe('App.Models.Timetable', function() {
        
        var model, def, timetable, month, weekDays, dateFake = function() {
            this.getTime = function() {
                return 1390396163616;
            };
        };
        
        beforeEach(function () {
            this.working_day = App.Models.WorkingDay;
            App.Models.WorkingDay = Backbone.Model.extend({
                update: function() {},
                get_dining_offset: function() {},
                pickupTimeOptions: function() {},
                checking_work_shop: function() {}
            });
            this.timetables = App.Data.settings.get("settings_system").timetables;
            this.server_time = App.Data.settings.get("settings_system").server_time;
            App.Data.settings.get("settings_system").timetables = [];
            App.Data.settings.get("settings_system").holidays = [];
            App.Data.settings.get("settings_system").server_time = 0;
            
            model = new App.Models.Timetable();
            
            timetable = deepClone(timetables.timetable);
            month = deepClone(timetables.month);
            weekDays = deepClone(timetables.weekDays);
            def = {
                timetables: [],
                server_time: 0,
                holidays: []
            };
        });
        
        afterEach(function() {
            App.Data.settings.get("settings_system").timetables = this.timetables;
            App.Data.settings.get("settings_system").server_time = this.server_time;  
            App.Models.WorkingDay = this.working_day;
        });
        
        it("Environment", function() {
            expect(App.Models.Timetable).toBeDefined();
        });

        it("Create App.Models.Timetable", function() {
            expect(model.workingDay.__proto__).toEqual(App.Models.WorkingDay.prototype);
            expect(model.toJSON()).toEqual(def);
        });
        
        it('App.Models.Timetable Function _get_month_id', function() {
            var res = month.filter(function(element, i) {
                return model._get_month_id(element) !== i;
            });
            expect(res.length).toBe(0);
        });
        
        it('App.Models.Timetable Function get_day_of_week', function() {
            var res = weekDays.filter(function(element, i) {
                return model.get_day_of_week(i) !== element;
            });
            expect(res.length).toBe(0);
        });
        
        it('App.Models.Timetable Function current_dining_time', function() {
            var date = new Date(),
                base = spyOn(App.Models.Timetable.prototype,'base').and.returnValue(date),
                offset = spyOn(App.Models.WorkingDay.prototype,'get_dining_offset').and.returnValue(10);
                
            expect(model.current_dining_time('param').getTime()).toBe(date.getTime() + 10);
            expect(offset).toHaveBeenCalledWith('param');
        });
        
        it('App.Models.Timetable Function get_current_time', function() {
            var date = new Date(),
                date2 = new Date(date.getTime() - 1000);
                
            expect(model.get_current_time(date).getTime()).toBe(date.getTime());
            
            model.set('server_time', -1000);
            expect(model.get_current_time(date).getTime()).toBe(date2.getTime());
        });
        
        it('App.Models.Timetable Function base', function() {
            spyOn(window, 'Date').and.callFake(dateFake);
            spyOn(model, 'get_current_time');
            model.base();
            
            expect(model.get_current_time).toHaveBeenCalled();
            expect(model.get_current_time.calls.mostRecent().args[0].getTime()).toBe(new dateFake().getTime());
        });
        
        describe('App.Models.Timetable Function _get_timetable', function() {
            var date = new Date(2014, 0, 22),
                date2 = new Date(2014, 0, 1),
                date3 = new Date(2014, 1, 2),
                date5 = new Date(2014, 3, 6); // April 6 sunday
            
            it('_get_timetable empty timetables', function() {
                expect(model._get_timetable(date)).toBeNull();
            });
            
            it('_get_timetable closed', function() {
                model.set('timetables', timetable);
                expect(model._get_timetable(date)).toBe(false);         
            });
            
            it('_get_timetable always open', function() {
                model.set('timetables', timetable);
                expect(model._get_timetable(date2)).toEqual({});
                
                expect(model._get_timetable(date3)).toEqual({});
            });
            
            it('_get_timetable timetable is defined', function() {
                model.set('timetables', timetable);
                
                expect(model._get_timetable(date5)).toEqual(timetable[2].timetable_data);
            });

            it('_get_timetable timetable across year', function() {
                model.set('timetables', deepClone(timetables.timetable3));
                
                expect(model._get_timetable(date2)).toEqual({});
            });
            
        });

        describe("App.Models.Timetable Function isHoliday", function() {
            
            it('Timetable does not contain _testCurTime field', function() {
                expect(model.get("_testCurTime")).toEqual( undefined );
            });

            var set1 = {
                timetables: timetable,
                holidays: [{date:"Jan, 1", name:"Holiday#1"}],
                _testCurTime: new Date(2020, 0, 1)
            }
            it('isHoliday for Jan-1 and cur_time = Jan-1-2020', function() {
                model.set(set1);               
                expect(model.isHoliday(model.get("_testCurTime"))).toEqual( true );
            });
            
            var set2 = {
                timetables: timetable,
                holidays: [{date:"Jan, 2", name:"Holiday#1"}],
                _testCurTime: new Date(2020, 0, 1)
            };
            it('isHoliday for Jan-2 and cur_time = Jan-1-2020', function() {
                model.set(set2);               
                expect(model.isHoliday(model.get("_testCurTime"))).toEqual( false );
            });
            
            var set3 = {
                holidays: [{date:"Feb, 5", name:"H1"}, {date:"Mar, 17", name:"H2"}, {date:"Apr, 5", name:""}],
                _testCurTime: new Date(2014, 3, 5)
            };
            it('isHoliday for [Feb-5, Mar-17, Apr-5] and cur_time = Apr-5', function() {
                model.set(set3);               
                expect(model.isHoliday(model.get("_testCurTime"))).toEqual( true );
            });

            var set4 = {
                holidays: [{date:"Feb, 5", name:"H1"}, {date:"Mar, 17", name:"H2"}, {date:"Apr, 5", name:""}],
                _testCurTime: new Date(2014, 2, 18)
            };
            it('isHoliday for [Feb-5, Mar-17, Apr-5] and cur_time = Mar-18', function() {
                model.set(set4);               
                expect(model.isHoliday(model.get("_testCurTime"))).toEqual( false );
            });                  
        });
        
        describe('App.Models.Timetable Function get_working_hours', function() {
            var date = new Date(2014, 0, 22),
                date2 = new Date(2014, 0, 1), // Jan 1. Wednesday. One day timetable
                date3 = new Date(2014, 1, 2), // Feb 2. sunday. Inside timetable
                date5 = new Date(2014, 3, 6), // April 6 sunday
                date6 = new Date(2014, 3, 8), // April 8 tuesday
                date7 = new Date(2014, 3, 9); // April 9 wednesday
                
            it('get_working_hours empty timetables', function() {
                expect(model.get_working_hours(date)).toBeNull();
            });
            
            it('get_working_hours closed', function() {
                model.set('timetables', timetable);
                expect(model.get_working_hours(date)).toBe(false);         
            });
            
            it('get_working_hours always open', function() {
                model.set('timetables', timetable);
                expect(model.get_working_hours(date2)).toBe(true);
                
                expect(model.get_working_hours(date3)).toBe(true);
            });
            
            it('get_working_hours timetable is defined but day undefined', function() {
                model.set('timetables', timetable);
                
                expect(model.get_working_hours(date5)).toBe(false);
            });
            
            it('get_working_hours timetable is defined and empty day', function() {
                model.set('timetables', timetable);
                
                expect(model.get_working_hours(date6)).toEqual([]);
            });
            
            it('get_working_hours timetable is defined and defined day. 12-hours format', function() {
                model.set('timetables', timetable);
                
                expect(model.get_working_hours(date7)).toEqual(timetable[2].timetable_data.wednesday12);
            });
            
            it('get_working_hours timetable is defined and defined day. 24-hours format', function() {
                model.set('timetables', timetable);
                
                expect(model.get_working_hours(date7, 1)).toEqual(timetable[2].timetable_data.wednesday);
            });

            it('get_working_hours always open, but the Holiday in that day', function() {
                model.set('timetables', timetable);
                model.set('holidays', [{date:"Mar, 17", name:"H1"}, {date:"Feb, 29", name:"H2"}, {date:"Jan, 1", name:""}]);  
                expect(model.get_working_hours(date2)).toBe(false);                
                expect(model.get_working_hours(date3)).toBe(true);
            });

            it('get_working_hours closed and no Holiday in that day', function() {
                model.set('timetables', timetable);
                model.set('holidays', [{date:"Mar, 30", name:"H1"}]);
                expect(model.get_working_hours(date)).toBe(false);         
            });

            it('get_working_hours closed and Holiday in that day', function() {
                model.set('timetables', timetable);
                model.set('holidays', [{date:"Jan, 22", name:"H1"}]);
                expect(model.get_working_hours(date)).toBe(false);         
            });

            it('get_working_hours timetable is defined and defined day but Holiday in that day. 12-hours format', function() {
                model.set('timetables', timetable);
                model.set('holidays', [{date:"Mar, 17", name:"H1"}, {date:"Feb, 29", name:"H2"}, {date:"Apr, 9", name:"H3"}]);
                expect(model.get_working_hours(date7)).toEqual( false );
            });

        });
        
        describe('App.Models.Timetable Function get_timetable_on_week', function() {
            var date = new Date(2014, 0, 22),
                dateBase,
                counter, getTimetable,
                table;
            
            beforeEach(function() {
                spyOn(model,'base').and.callFake(function() {
                    return new Date(dateBase);
                });
                spyOn(model,'get_working_hours').and.callFake(function() {
                    return table();
                });
                dateBase = new Date(date);
                getTimetable = deepClone(timetables.getTimetable);
                counter = false;
                table = function() { return counter; };
            });
            
            it('get_timetable_on_week empty timetables', function() {
                counter = null;
                expect(model.get_timetable_on_week()).toBeNull();
            });
            
            it('get_timetable_on_week calls get_working_hours arguments', function() {
                model.set('timetables', timetable);
                model.get_timetable_on_week(date); // check result;
                
                var calls = model.get_working_hours.calls.allArgs(); // check get_working_hours calls
                expect(calls.length).toBe(7);
                expect(calls.filter(function(element, i) {
                    return element[0].getTime() !== dateBase.setTime(date.getTime() + i * 1000 * 60 * 60 * 24);
                }).length).toBe(0);
            });
            
            it('get_timetable_on_week check result', function() {
                model.set('timetables', timetable);
                counter = 0;
                table = function() { return counter++; };
                
                expect(model.get_timetable_on_week(date)).toEqual(getTimetable); // check result;
            });            
        });
        
        describe('App.Models.Timetable Function checking_work_shop', function() {
            var date = new Date(2014, 0, 22), // 22 Jan wednesday
                obj = {},
                obj1 = {};
             
            beforeEach(function() {                
                spyOn(model,'get_working_hours').and.returnValue(obj);
                spyOn(model.workingDay, 'update');
                spyOn(model.workingDay, 'checking_work_shop');
            });
            
            it('check method calls', function() {
                model.checking_work_shop(date, obj1);
                expect(model.get_working_hours).toHaveBeenCalledWith(date,1);
                expect(model.workingDay.update).toHaveBeenCalledWith({timetable: obj, curTime : date});
                expect(model.workingDay.checking_work_shop).toHaveBeenCalledWith(obj1);
            });
        });

        describe('App.Models.Timetable Function getPickupList', function() {
            var date = new Date(2014, 0, 22),
                dateBase,
                counter, getTimetable,
                table;
            
            beforeEach(function() {
                spyOn(model,'base').and.callFake(function() {
                    return new Date(dateBase);
                });
                spyOn(model,'get_working_hours').and.callFake(function() {
                    return table();
                });
                spyOn(model.workingDay,'update');
                spyOn(model.workingDay,'pickupTimeOptions').and.returnValue('pickup');
                
                dateBase = new Date(date);
                getTimetable = deepClone(timetables.getTimetable);
                counter = 0;
                table = function() { return counter++; };
            });
            
            it('getPickupList get_working_hours calls', function() {
                model.getPickupList();
                
                var calls = model.get_working_hours.calls.allArgs(); // check get_working_hours calls
                expect(calls.length).toBe(7);
                expect(calls.filter(function(element, i) {
                    return !(element[0].getTime() === new Date(date.getTime() + 24 * 60 * 60 * 1000 * i).getTime() && element[1] === 1);
                }).length).toBe(0);
            });
            
            it('getPickupList update calls', function() {
                model.getPickupList();
                
                var calls = model.workingDay.update.calls.allArgs(); // check get_working_hours calls
                expect(calls.length).toBe(7);
                expect(calls.filter(function(element, i) {
                    return !(element[0].timetable === i && element[0].curTime.getTime() === date.getTime());
                }).length).toBe(0);
            });
            
            it('getPickupList pickupTimeOptions calls', function() {
                model.getPickupList();
                
                var calls = model.workingDay.pickupTimeOptions.calls.allArgs(); // check get_working_hours calls
                expect(calls.length).toBe(7);
                expect(calls.filter(function(element, i) {
                    return !(i === 0 && element[0] === true || true); // only first call with arguments today.
                }).length).toBe(0);
            });
            
            it('getPickupList pickupTimeOptions calls isDelivery = true', function() {
                model.getPickupList(true);
                
                var calls = model.workingDay.pickupTimeOptions.calls; // check get_working_hours calls
                expect(calls.mostRecent().args[0].isDelivery).toBe(true);
            });
            
            it('getPickupList test workingDay and date attribute in result', function() {
                var pickup = model.getPickupList();
                expect(pickup.length).toBe(7);
                expect(pickup.filter(function(element) {
                    return element.workingDay !== 'pickup';
                }).length).toBe(0);
                expect(pickup.filter(function(element, i) {
                    return !(element.date.getTime() === new Date(date.getTime() + 24 * 60 * 60 * 1000 * i).getTime());
                }).length).toBe(0);
            });
            
            it('getPickupList test weekDay in result. Test today, tomorrow', function() {
                var pickup = model.getPickupList();
                expect(pickup[0].weekDay).toBe('Today');
                expect(pickup[1].weekDay).toBe('Tomorrow');
            });
            
            it('getPickupList test weekDay in result. Test 1st, 2nd, 3rd, 4th', function() {
                dateBase = new Date(2014, 0, 30);
                var pickup = model.getPickupList();
                expect(pickup[2].weekDay).toBe('Saturday, February 1st');
                expect(pickup[3].weekDay).toBe('Sunday, February 2nd');
                expect(pickup[4].weekDay).toBe('Monday, February 3rd');
                expect(pickup[5].weekDay).toBe('Tuesday, February 4th');
            });
            
            it('getPickupList test weekDay in result. Test 11th, 12th, 13th', function() {
                dateBase = new Date(2014, 0, 9);
                var pickup = model.getPickupList();
                expect(pickup[2].weekDay).toBe('Saturday, January 11th');
                expect(pickup[3].weekDay).toBe('Sunday, January 12th');
                expect(pickup[4].weekDay).toBe('Monday, January 13th');
                expect(pickup[5].weekDay).toBe('Tuesday, January 14th');
            });
            
            it('getPickupList test weekDay in result. Test 21st, 22nd, 23rd, 24th', function() {
                dateBase = new Date(2014, 0, 19);
                var pickup = model.getPickupList();
                expect(pickup[2].weekDay).toBe('Tuesday, January 21st');
                expect(pickup[3].weekDay).toBe('Wednesday, January 22nd');
                expect(pickup[4].weekDay).toBe('Thursday, January 23rd');
                expect(pickup[5].weekDay).toBe('Friday, January 24th');
            });
            
            it('getPickupList test weekDay in result. Test 31st', function() {
                dateBase = new Date(2014, 0, 29);
                var pickup = model.getPickupList();
                expect(pickup[2].weekDay).toBe('Friday, January 31st');
            });
        });
        
        describe('Function check_order_enable.', function() {
            var base = {}, check_work;
            
            beforeEach(function() {
                spyOn(App.Models.Timetable.prototype, 'base').and.callFake(function() {
                    return base;
                });
                spyOn(App.Models.Timetable.prototype, 'checking_work_shop').and.callFake(function() {
                    return check_work;
                });
                this.accept = App.Data.settings.get('settings_system').accept_online_orders_when_store_is_closed;
                App.Data.settings.get('settings_system').accept_online_orders_when_store_is_closed = false;
            });
            
            afterEach(function() {
                App.Data.settings.get('settings_system').accept_online_orders_when_store_is_closed = this.accept;
            });
            
            it('Check function checking_work_shop call and calls arguments', function() {
                model.check_order_enable();
                
                expect(model.base).toHaveBeenCalled();
                expect(model.checking_work_shop).toHaveBeenCalledWith(base, undefined);
            });
            
            it('Work open now and accept true', function() {
                check_work = true;
                App.Data.settings.get('settings_system').accept_online_orders_when_store_is_closed = true;
                
                expect(model.check_order_enable()).toBe(true);
            });
            
            it('Work open now and accept false', function() {
                check_work = true;
                App.Data.settings.get('settings_system').accept_online_orders_when_store_is_closed = false;
                
                expect(model.check_order_enable()).toBe(true);
            });
            
            it('Work close now and accept true', function() {
                check_work = false;
                App.Data.settings.get('settings_system').accept_online_orders_when_store_is_closed = true;
                
                expect(model.check_order_enable()).toBe(true);
            });
            
            it('Work close now and accept false', function() {
                check_work = false;
                App.Data.settings.get('settings_system').accept_online_orders_when_store_is_closed = false;
                
                expect(model.check_order_enable()).toBe(false);
            });
        });
    });
});