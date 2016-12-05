/*
 backgrid-jquery-autocomplete-cell
 http://github.com/fluffy88/backgrid-jquery-autocomplete-cell

 Copyright (c) 2016 Sean Dunne and contributors
 Licensed under the MIT @license.
 */
(function (root, factory) {

    if (typeof define === 'function' && define.amd) {
        // AMD
        define(["underscore", "backgrid", "jquery", "jquery-ui"], factory);
    } else if (typeof exports === 'object') {
        // CommonJS
        module.exports = factory(require("underscore"), require("backgrid"), require("jquery"), require("jquery-ui"));
    } else {
        // Browser globals
        factory(root._, root.Backgrid, root.$);
    }

}(this, function (_, Backgrid, $) {

    "use strict";

    var exports = {};

    function _split(val) {
        return val.split(/,\s*/);
    }

    function _extractLast(term) {
        return _split(term).pop();
    }

    /**
     AutoCompleteCellEditor is a cell editor that renders an input box with a `jQuery Autocomplete`
     attached.

     See:

     - [jQuery Autocomplete](https://jqueryui.com/autocomplete/)

     @class Backgrid.Extension.AutoCompleteCellEditor
     @extends Backgrid.InputCellEditor
     */
    var AutoCompleteCellEditor = exports.AutoCompleteCellEditor = Backgrid.Extension.AutoCompleteCellEditor = Backgrid.InputCellEditor.extend({

        events: {
            "click": "openAutoComplete",
            "blur": "saveOrCancel",
            "keydown": "autoCompleteOrSave"
        },

        _options: [],

        render: function () {
            AutoCompleteCellEditor.__super__.render.apply(this, arguments);
            this._initAutoComplete();
        },

        openAutoComplete: function () {
            this.$el.autocomplete("search", "");
        },

        autoCompleteOrSave: function (e) {
            if (this._isAutoCompleteAction(e)) {
                e.preventDefault();
            } else {
                AutoCompleteCellEditor.__super__.saveOrCancel.apply(this, arguments);
            }
        },

        _isAutoCompleteAction: function (e) {
            var key = e.keyCode;
            var isAutoCompleteItemFocused = this.$el.autocomplete("instance").menu.active;

            var isUpDown = key === $.ui.keyCode.UP || key === $.ui.keyCode.DOWN;
            var isEnterKey = key === $.ui.keyCode.ENTER && isAutoCompleteItemFocused;

            return isUpDown || isEnterKey;
        },

        setAutoCompleteOptions: function (options) {
            this._options = options || [];
        },

        _initAutoComplete: function () {
            var me = this;

            me.$el.autocomplete({
                minLength: 0,
                source: function (request, response) {
                    response($.ui.autocomplete.filter(me._options, request.term));
                }
            });
        }

    });

    /**
     AutoCompleteCell is a cell class that renders a `jQuery Autocomplete`
     box during edit mode.

     @class Backgrid.Extension.AutoCompleteCell
     @extends Backgrid.StringCell
     */
    var AutoCompleteCell = exports.AutoCompleteCell = Backgrid.Extension.AutoCompleteCell = Backgrid.StringCell.extend({

        className: "autocomplete-cell",

        formatter: Backgrid.StringFormatter,

        editor: AutoCompleteCellEditor,

        autoCompleteOptions: function () {
            return this.column.get("autoCompleteOptions") || [];
        },

        enterEditMode: function () {
            var options = _.result(this, "autoCompleteOptions");
            AutoCompleteCell.__super__.enterEditMode.apply(this, arguments);

            if (_.isArray(options)) {
                this._setOptions(options);
            } else if (this._isDeferred(options)) {
                this._handleDeferred(options);
            } else {
                throw new TypeError("autoCompleteOptions must be one of: Array || Deferred");
            }
        },

        _isDeferred: function (options) {
            return typeof options === 'object' && typeof options.then === 'function';
        },

        _handleDeferred: function (deferred) {
            var me = this;
            deferred.done(function (data, status, jqXHR) {
                var options = (me.parse === undefined) ? data : me.parse(data);
                me._setOptions(options);
            });
        },

        _setOptions: function (options) {
            if (this._isAutoCompleteActiveForCurrentCell()) {
                this.currentEditor.setAutoCompleteOptions(options);
                this.currentEditor.openAutoComplete();
            }
        },

        _isAutoCompleteActiveForCurrentCell: function () {
            return this.currentEditor;
        }

    });

    /**
     AutoCompleteMultipleCellEditor is a cell editor which allows for
     multiple selections that renders an input box with a
     `jQuery Autocomplete` attached.

     See:

     - [jQuery Autocomplete](https://jqueryui.com/autocomplete/)

     @class Backgrid.Extension.AutoCompleteMultipleCellEditor
     @extends Backgrid.Extension.AutoCompleteCellEditor
     */
    var AutoCompleteMultipleCellEditor = exports.AutoCompleteMultipleCellEditor = Backgrid.Extension.AutoCompleteMultipleCellEditor = AutoCompleteCellEditor.extend({

        _isAutoCompleteAction: function (e) {
            var key = e.keyCode;
            var isAutoCompleteItemFocused = this.$el.autocomplete("instance").menu.active;

            var isUpDown = key === $.ui.keyCode.UP || key === $.ui.keyCode.DOWN;
            var isEnterKey = key === $.ui.keyCode.ENTER && isAutoCompleteItemFocused;
            var isTabSelection = key === $.ui.keyCode.TAB && isAutoCompleteItemFocused;

            return isUpDown || isEnterKey || isTabSelection;
        },

        _initAutoComplete: function () {
            var me = this;

            me.$el.autocomplete({
                minLength: 0,
                source: function (request, response) {
                    response($.ui.autocomplete.filter(me._options, _extractLast(request.term)));
                },
                focus: function () {
                    // prevent value inserted on focus
                    return false;
                },
                select: function (event, ui) {
                    var terms = _split(this.value);
                    terms.push(ui.item.value);

                    terms = _.chain(me._options)
                        .map(function (item) {
                            return _.isObject(item) ? item.value : item;
                        })
                        .intersection(terms)
                        .value();

                    terms.push("");
                    this.value = terms.join(", ");
                    return false;
                }
            });
        }

    });

    /**
     AutoCompleteMultipleFormatter converts a list of comma separated items into an array.

     @class Backgrid.Extension.AutoCompleteMultipleFormatter
     @extends Backgrid.StringFormatter
     */
    var AutoCompleteMultipleFormatter = exports.AutoCompleteMultipleFormatter = Backgrid.Extension.AutoCompleteMultipleFormatter = function () { };
    _.extend(AutoCompleteMultipleFormatter.prototype, {

        fromRaw: function (rawData, model) {
            if (_.isUndefined(rawData) || _.isNull(rawData)) return '';
            return rawData.join(", ");
        },

        toRaw: function (formattedData, model) {
            formattedData = formattedData.replace(/,\s*$/, "");
            return _split(formattedData);
        }

    });

    /**
     AutoCompleteMultipleCell is a cell class that displays a comma separated
     list of values and renders a `jQuery Autocomplete` box during edit mode.

     @class Backgrid.Extension.AutoCompleteMultipleCell
     @extends Backgrid.Extension.AutoCompleteCell
     */
    var AutoCompleteMultipleCell = exports.AutoCompleteMultipleCell = Backgrid.Extension.AutoCompleteMultipleCell = AutoCompleteCell.extend({

        className: "autocompletemultiple-cell",

        formatter: AutoCompleteMultipleFormatter,

        editor: AutoCompleteMultipleCellEditor

    });

    return exports;

}));
