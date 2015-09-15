/*
 * Fuel UX Picker
 * https://github.com/ExactTarget/fuelux
 *
 * Copyright (c) 2014 ExactTarget
 * Licensed under the BSD New license.
 */

// -- BEGIN UMD WRAPPER PREFACE --

// For more information on UMD visit:
// https://github.com/umdjs/umd/blob/master/jqueryPlugin.js

(function (factory) {
	if (typeof define === 'function' && define.amd) {
		// if AMD loader is available, register as an anonymous module.
		define(['jquery'], factory);
	} else if (typeof exports === 'object') {
		// Node/CommonJS
		module.exports = factory(require('jquery'));
	} else {
		// OR use browser globals if AMD is not present
		factory(jQuery);
	}
}(function ($) {
	// -- END UMD WRAPPER PREFACE --

	// -- BEGIN MODULE CODE HERE --

	var old = $.fn.picker;
	var EVENT_CALLBACK_MAP = { 'accepted': 'onAccept', 'cancelled': 'onCancel' };
	var DEFAULT_HEIGHT = 234;
	var DEFAULT_WIDTH = 350;

	// PLACARD CONSTRUCTOR AND PROTOTYPE

	var Picker = function Picker(element, options) {
		var self = this;
		this.$element = $(element);
		this.options = $.extend({}, $.fn.picker.defaults, options);

		this.$accept = this.$element.find('.picker-accept');
		this.$cancel = this.$element.find('.picker-cancel');
		this.$field = this.$element.find('.picker-field');
		this.$trigger = this.$element.find('.picker-trigger');
		this.$footer = this.$element.find('.picker-footer');
		this.$header = this.$element.find('.picker-header');
		this.$popup = this.$element.find('.picker-popup');
		this.$body = this.$element.find('.picker-body');

		this.actualValue = null;
		this.clickStamp = '_';
		this.previousValue = '';
		if (this.options.revertOnCancel === -1) {
			this.options.revertOnCancel = (this.$accept.length > 0) ? true : false;
		}

		this.isInput = this.$field.is('input');

		this.$field.on('click.fu.picker', $.proxy(this.toggle, this));
		this.$field.on('keydown.fu.picker', $.proxy(this.keyComplete, this));
		this.$trigger.on('click.fu.picker', $.proxy(this.toggle, this));
		this.$accept.on('click.fu.picker', $.proxy(this.complete, this, 'accepted'));
		this.$cancel.on('click.fu.picker', function (e) {
			e.preventDefault(); self.complete('cancelled');
		});


	};

	Picker.prototype = {
		constructor: Picker,

		complete: function complete(action) {
			var func = this.options[ EVENT_CALLBACK_MAP[action] ];

			var obj = {
				previousValue: this.previousValue,
				contents: this.$body
			};

			if (func) {
				func(obj);
				this.$element.trigger(action + '.fu.picker', obj);
			} else {
				if (action === 'cancelled' && this.options.revertOnCancel) {
					this.$field.val(this.previousValue);
				}

				this.$element.trigger(action + '.fu.picker', obj);
				this.hide();
			}
		},

		keyComplete: function keyComplete(e) {
			if (this.isInput && e.keyCode === 13) {
				this.complete('accepted');
				this.$field.blur();
			} else if (e.keyCode === 27) {
				this.complete('cancelled');
				this.$field.blur();
			}
		},

		destroy: function destroy() {
			this.$element.remove();
			// remove any external bindings
			$(document).off('click.fu.picker.externalClick.' + this.clickStamp);
			// set input value attribute
			this.$element.find('input').each(function () {
				$(this).attr('value', $(this).val());
			});
			// empty elements to return to original markup
			// [none]
			// return string of markup
			return this.$element[0].outerHTML;
		},

		disable: function disable() {
			this.$element.addClass('disabled');
			this.$trigger.attr('disabled', 'disabled');
			this.$field.attr('disabled', 'disabled');
		},

		enable: function enable() {
			this.$element.removeClass('disabled');
			this.$trigger.removeAttr('disabled');
			this.$field.removeAttr('disabled');
		},

		externalClickListener: function externalClickListener(e, force) {
			if (force === true || this.isExternalClick(e)) {
				this.complete(this.options.externalClickAction);
			}
		},

		toggle: function toggle() {
			if (this.$element.hasClass('showing')) {
				this.hide();
			}else{
				this.show();
			}
		},

		hide: function hide() {
			if (!this.$element.hasClass('showing')) {
				return;
			}

			this.$element.removeClass('showing');
			$(document).off('click.fu.picker.externalClick.' + this.clickStamp);
			this.$element.trigger('hidden.fu.picker');
		},

		isExternalClick: function isExternalClick(e) {
			var el = this.$element.get(0);
			var exceptions = this.options.externalClickExceptions || [];
			var $originEl = $(e.target);
			var i, l;

			if (e.target === el || $originEl.parents('.picker:first').get(0) === el) {
				return false;
			} else {
				for (i = 0, l = exceptions.length; i < l; i++) {
					if ($originEl.is(exceptions[i]) || $originEl.parents(exceptions[i]).length > 0) {
						return false;
					}

				}
			}

			return true;
		},

		_isOffscreen: function _isOffscreen() {
			var windowHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
			var scrollTop = $(document).scrollTop();
			var popupTop = this.$popup.offset();
			var popupBottom = popupTop.top + this.$popup.outerHeight(true);

			//if the bottom of the popup goes off the page, but the top does not, dropup.
			if (popupBottom > windowHeight + scrollTop || popupTop.top < scrollTop){
				return true;
			}else{//otherwise, prefer showing the top of the popup only vs the bottom
				return false;
			}
		},

		_display: function _display() {
			this.$popup.css('visibility', 'hidden');

			this._showBelow();

			//if part of the popup is offscreen try to show it above
			if(this._isOffscreen()){
				this._showAbove();

				//if part of the popup is still offscreen, prefer cutting off the bottom
				if(this._isOffscreen()){
					this._showBelow();
				}
			}

			this.$popup.css('visibility', 'visible');
		},

		_showAbove: function _showAbove() {
			this.$popup.css('height', (this.options.height)?this.options.height : DEFAULT_HEIGHT + 'px');
			this.$body.css('height', ((this.options.height)?this.options.height : DEFAULT_HEIGHT) - 73 + 'px');
			this.$popup.css('width', (this.options.width)?this.options.height : DEFAULT_WIDTH + 'px');
			this.$popup.css('top', -(this.$popup.outerHeight(true) + 4) + 'px');
		},

		_showBelow: function _showBelow() {
			this.$popup.css('top', (this.$field.outerHeight(true)+4) + 'px');
			this.$popup.css('height', (this.options.height)?this.options.height : DEFAULT_HEIGHT + 'px');
			this.$body.css('height', ((this.options.height)?this.options.height : DEFAULT_HEIGHT) - 73 + 'px');
			this.$popup.css('width', (this.options.width)?this.options.height : DEFAULT_WIDTH + 'px');
		},

		show: function show() {
			var other;

			if (this.$element.hasClass('showing')) {
				return;
			}

			other = $(document).find('.picker.showing');
			if (other.length > 0) {
				if (other.data('fu.picker') && other.data('fu.picker').options.explicit) {
					return;
				}

				other.picker('externalClickListener', {}, true);
			}

			this.previousValue = this.$field.val();

			this.$element.addClass('showing');

			this._display();

			this.$element.trigger('shown.fu.picker', this.actualValue);
			if (this.actualValue !== null) {
				this.actualValue = null;
			}

			this.clickStamp = new Date().getTime() + (Math.floor(Math.random() * 100) + 1);
			if (!this.options.explicit) {
				$(document).on('click.fu.picker.externalClick.' + this.clickStamp, $.proxy(this.externalClickListener, this));
			}
		},

		setValue: function setValue(value) {
			this.$field.val(value);
		},

		getValue: function getValue() {
			return this.$field.val();
		}
	};

	// PLACARD PLUGIN DEFINITION

	$.fn.picker = function picker(option) {
		var args = Array.prototype.slice.call(arguments, 1);
		var methodReturn;

		var $set = this.each(function () {
			var $this = $(this);
			var data = $this.data('fu.picker');
			var options = typeof option === 'object' && option;

			if (!data) {
				$this.data('fu.picker', (data = new Picker(this, options)));
			}

			if (typeof option === 'string') {
				methodReturn = data[option].apply(data, args);
			}
		});

		return (methodReturn === undefined) ? $set : methodReturn;
	};

	$.fn.picker.defaults = {
		onAccept: undefined,
		onCancel: undefined,
		externalClickAction: 'cancelled',
		externalClickExceptions: [],
		explicit: false,
		revertOnCancel: -1//negative 1 will check for an '.placard-accept' button. Also can be set to true or false
	};

	$.fn.picker.Constructor = Picker;

	$.fn.picker.noConflict = function noConflict() {
		$.fn.picker = old;
		return this;
	};

	// DATA-API

	$(document).on('focus.fu.picker.data-api', '[data-initialize=picker]', function (e) {
		var $control = $(e.target).closest('.picker');
		if (!$control.data('fu.picker')) {
			$control.picker($control.data());
		}
	});

	// Must be domReady for AMD compatibility
	$(function () {
		$('[data-initialize=picker]').each(function () {
			var $this = $(this);
			if ($this.data('fu.picker')) return;
			$this.picker($this.data());
		});
	});

	// -- BEGIN UMD WRAPPER AFTERWORD --
}));
// -- END UMD WRAPPER AFTERWORD --
