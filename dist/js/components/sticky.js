/**
 * Sticky plugin.
 *
 * @package Fundament
 */
!function(e,t,i){"use strict";function n(t,i){this.namespace="."+o+"."+Fm.createID(),this.config=e.extend({},e.fn[o].defaults,i),this.elem=t,this.$elem=e(t),this.$context=this.$elem.closest(this.config.context),this.calc={},this.isStick=!1,this.isBound=!1,this.recalc=Fm.debounce(this.calculate.bind(this),200),h.on("load",this.init.bind(this))}var o="sticky",s={context:null,mask:!0,observe:!1,topOffset:0,bottomOffset:0,scrollSpace:200,onStick:function(){},onUnStick:function(){},onBound:function(){},onUnBound:function(){}},c={mask:"sticky-mask",stick:"stick",bound:"bound"},a={mask:".sticky-mask"},h=e(t),f=h.height();e.extend(n.prototype,{init:function(){if(!this.$context.length)return console.warn("Undefined context element");this.bind(),this.observe(),this.calculate()},calculate:function(){var e=this,t=e.calc;if(f=h.height(),e.isStick&&e.make("unStick"),t.contextOffset=e.$context.offset(),t.contextHeight=e.$context.outerHeight(),t.elemOffset=e.$elem.offset(),t.elemSize={width:e.$elem.outerWidth(),height:e.$elem.outerHeight()},t.elemSize.height+e.config.scrollSpace>=t.contextHeight)return console.warn("Insufficient scrolling space available"),this.destroy();e.setBounds(),requestAnimationFrame(e.update.bind(e))},setBounds:function(){var e=this,t=e.calc,i=e.config;t.bounds={top:t.elemOffset.top-i.topOffset,bottom:t.contextOffset.top+t.contextHeight-i.bottomOffset},t.elemSize.height>f?(t.overSized=t.elemSize.height-f+i.bottomOffset,t.bounds.top+=t.overSized+i.topOffset,t.bounds.bottom+=i.topOffset):t.overSized=0},bind:function(){var e=this;h.on("resize"+e.namespace,e.recalc).on("scroll"+e.namespace,function(){requestAnimationFrame(e.update.bind(e))})},unbind:function(){h.off("resize"+this.namespace).off("scroll"+this.namespace)},update:function(){var e=this,i=e.calc,n=t.pageYOffset,o=n+e.config.topOffset+i.elemSize.height-i.overSized;!e.isStick&&n>=i.bounds.top?(e.make("stick"),o>=i.bounds.bottom&&e.make("bound")):e.isStick&&n<i.bounds.top?e.make("unStick"):!e.isBound&&o>=i.bounds.bottom?e.make("bound"):e.isBound&&o<i.bounds.bottom&&e.make("unBound")},make:function(e){var t=this,i=t.calc;return{fixed:function(){t.$elem.css({position:"fixed",top:i.overSized?-i.overSized:t.config.topOffset,bottom:"",width:i.elemSize.width}),t.isStick=!0},stick:function(){t.make("fixed"),t.mask("show"),t.$elem.addClass(c.stick),t.config.onStick.call(t.elem)},unStick:function(){t.clear(),t.mask("hide"),t.isBound=!1,t.isStick=!1,t.config.onUnStick.call(t.elem)},bound:function(){t.$elem.css({position:"absolute",top:"",bottom:t.config.bottomOffset}).addClass(c.bound),t.isBound=!0,t.config.onBound.call(t.elem)},unBound:function(){t.make("fixed"),t.$elem.removeClass(c.bound),t.isBound=!1,t.config.onUnBound.call(t.elem)}}[e].apply(t)},mask:function(t){var i=this,n=i.calc,o=this.$elem.next(a.mask);if(i.config.mask)return{show:function(){o.length?o.css({width:n.elemSize.width,height:n.elemSize.height}).show():e("<div/>",{class:c.mask,css:{width:n.elemSize.width,height:n.elemSize.height}}).insertAfter(i.$elem)},hide:function(){o.hide()},remove:function(){o.remove()}}[t].apply(i)},clear:function(){this.$elem.css({position:"",top:"",bottom:"",width:""}).removeClass(c.stick+" "+c.bound)},observe:function(){!this.config.observe||!1 in t||(this.observer=new MutationObserver(this.recalc),this.observer.observe(this.elem,{childList:!0,subtree:!0}),this.contextObserver=new MutationObserver(this.recalc),this.contextObserver.observe(this.$context[0],{childList:!0,subtree:!0}))},setting:function(t){e.extend(this.config,t)},destroy:function(){this.hasOwnProperty("observer")&&(this.observer.disconnect(),this.contextObserver.disconnect()),this.unbind(),this.clear(),this.mask("remove"),e.data(this.elem,o,null)}}),e.fn[o]=function(t,i){return this.each(function(){var s=e.data(this,o);s?"string"==typeof t&&s[t]&&s[t].apply(s,Array.isArray(i)?i:[i]):e.data(this,o,new n(this,t))})},e.fn[o].defaults=s}(jQuery,window,document);
//# sourceMappingURL=sticky.js.map
