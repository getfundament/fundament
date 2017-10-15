/**
 * Tab plugin.
 *
 * @package Fundament
 */
!function(t,n){"use strict";function i(n,i){this.config=t.extend({},t.fn[e].defaults,i),this.elem=n,this.$elem=t(n),this.init()}var e="tab",o={onOpen:function(){},onSelect:function(){},onClose:function(){}};t.extend(i.prototype,{init:function(){}}),t.fn[e]=function(n,o){return this.each(function(){var f=t.data(this,e);f?"string"==typeof n&&f[n]&&f[n].apply(f,Array.isArray(o)?o:[o]):t.data(this,e,new i(this,n))})},t.fn[e].defaults=o}(jQuery,window);
//# sourceMappingURL=tab.js.map
