(function(d){"function"===typeof define&&define.amd?define(["jquery"],d):d(jQuery)})(function(d){function n(a){return a}function p(a){return decodeURIComponent(a.replace(k," "))}function l(a){0===a.indexOf('"')&&(a=a.slice(1,-1).replace(/\\"/g,'"').replace(/\\\\/g,"\\"));try{return e.json?JSON.parse(a):a}catch(c){}}var k=/\+/g,e=d.cookie=function(a,c,b){if(void 0!==c){b=d.extend({},e.defaults,b);if("number"===typeof b.expires){var g=b.expires,f=b.expires=new Date;f.setDate(f.getDate()+g)}c=e.json?
JSON.stringify(c):String(c);return document.cookie=[e.raw?a:encodeURIComponent(a),"=",e.raw?c:encodeURIComponent(c),b.expires?"; expires="+b.expires.toUTCString():"",b.path?"; path="+b.path:"",b.domain?"; domain="+b.domain:"",b.secure?"; secure":""].join("")}c=e.raw?n:p;b=document.cookie.split("; ");for(var g=a?void 0:{},f=0,k=b.length;f<k;f++){var h=b[f].split("="),m=c(h.shift()),h=c(h.join("="));if(a&&a===m){g=l(h);break}a||(g[m]=l(h))}return g};e.defaults={};d.removeCookie=function(a,c){return void 0!==
d.cookie(a)?(d.cookie(a,"",d.extend({},c,{expires:-1})),!0):!1}});