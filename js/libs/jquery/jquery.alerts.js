(function(a){a.alerts={verticalOffset:0,horizontalOffset:0,repositionOnResize:!0,overlayOpacity:0.01,overlayColor:"#FFF",draggable:!0,okButton:"&nbsp;OK&nbsp;",cancelButton:"&nbsp;Cancel&nbsp;",dialogClass:null,alert:function(b,c,d){a.alerts._show(b,null,c,null,"alert",function(a){d&&d(a)})},confirm:function(b,c,d,e){a.alerts._show(b,null,c,d,"confirm",function(a){e&&e(a)})},prompt:function(b,c,d,e,g){a.alerts._show(b,c,d,e,"prompt",function(a){g&&g(a)})},_show:function(b,c,d,e,g,f){a.alerts._hide();
a.alerts._overlay("show");a("BODY").append('<div id="popup_container"><div id="popup_content"><div id="popup_message"></div></div></div>');a.alerts.dialogClass&&a("#popup_container").addClass(a.alerts.dialogClass);var h=a.browser.msie&&6>=parseInt(a.browser.version)?"absolute":"fixed";a("#popup_container").css({position:h,zIndex:99999,padding:0,margin:0,'padding-bottom':'40px'});a("#popup_content").addClass(g);a("#popup_message").text(b);a("#popup_message").html(a("#popup_message").text().replace(/\n/g,"<br />"));a("#popup_container").css({minWidth:a("#popup_container").outerWidth(),
maxWidth:a("#popup_container").outerWidth()});a.alerts._reposition();a.alerts._maintainPosition(!0);switch(g){case "alert":a("#popup_message").after('<div id="popup_panel"><input type="button" value="'+d+'" id="popup_ok" /></div>');a('#popup_panel').hide();a("#popup_ok").click(function(){a.alerts._hide();f(!0)});a("#popup_ok").focus().keypress(function(b){13!=b.keyCode&&27!=b.keyCode||a("#popup_ok").trigger("click")});a('#popup_panel').show();break;case "confirm":a("#popup_message").after('<div id="popup_panel"><input type="button" value="'+d+'" id="popup_ok" /> <input type="button" value="'+
e+'" id="popup_cancel" /></div>');a("#popup_ok").click(function(){a.alerts._hide();f&&f(!0)});a("#popup_cancel").click(function(){a.alerts._hide();f&&f(!1)});a("#popup_ok, #popup_cancel").keypress(function(b){13==b.keyCode&&a("#popup_ok").trigger("click");27==b.keyCode&&a("#popup_cancel").trigger("click")});break;case "prompt":a("#popup_message").append('<br /><input type="text" size="30" id="popup_prompt" />').after('<div id="popup_panel"><input type="button" value="'+d+'" id="popup_ok" /> <input type="button" value="'+
e+'" id="popup_cancel" /></div>'),a("#popup_prompt").width(a("#popup_message").width()),a("#popup_ok").click(function(){var b=a("#popup_prompt").val();a.alerts._hide();f&&f(b)}),a("#popup_cancel").click(function(){a.alerts._hide();f&&f(null)}),a("#popup_prompt, #popup_ok, #popup_cancel").keypress(function(b){13==b.keyCode&&a("#popup_ok").trigger("click");27==b.keyCode&&a("#popup_cancel").trigger("click")}),c&&a("#popup_prompt").val(c),a("#popup_prompt").focus().select()}},_hide:function(){a("#popup_container").remove();
a.alerts._overlay("hide");a.alerts._maintainPosition(!1)},_overlay:function(b){switch(b){case "show":a.alerts._overlay("hide");a("BODY").append('<div id="popup_overlay"></div>');a("#popup_overlay").css({position:"absolute",zIndex:99998,top:"0px",left:"0px",width:"100%",height:'100%',background:a.alerts.overlayColor,opacity:a.alerts.overlayOpacity});break;case "hide":a("#popup_overlay").remove()}},_reposition:function(){var b=a(window).height()/2-a("#popup_container").outerHeight()/2+
a.alerts.verticalOffset,c=a(window).width()/2-a("#popup_container").outerWidth()/2+a.alerts.horizontalOffset;0>b&&(b=0);0>c&&(c=0);a.browser.msie&&6>=parseInt(a.browser.version)&&(b+=a(window).scrollTop());a("#popup_container").css({top:b+"px",bottom:b+'px',left:c+"px"});/*a("#popup_overlay").height(a(document).height())*/},_maintainPosition:function(b){/*if(a.alerts.repositionOnResize)switch(b){case !0:a(window).bind("resize",function(){a.alerts._reposition()});break;case !1:a(window).unbind("resize")}*/}};jAlert=function(b,
c,d){a.alerts.alert(b,c,d)};jConfirm=function(b,c,d,e){a.alerts.confirm(b,c,d,e)};jPrompt=function(b,c,d,e,g){a.alerts.prompt(b,c,d,e,g)}})(jQuery);