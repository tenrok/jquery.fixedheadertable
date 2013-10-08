"use strict";
/*global $, jQuery*/
/*!
 * jquery.fixedHeaderTable. The jQuery fixedHeaderTable plugin
 *
 * Copyright (c) 2011 Mark Malek
 * http://fixedheadertable.com
 *
 * Licensed under MIT
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * http://docs.jquery.com/Plugins/Authoring
 * jQuery authoring guidelines
 *
 * Launch  : October 2009
 * Version : 1.3
 * Released: May 9th, 2011
 *
 * 
 * all CSS sizing (width,height) is done in pixels (px)
 */

(function ($) {
    $.fn.fixedHeaderTable = function (method) {
        // plugin's default options
        var defaults = {
            width:          '100%',
            height:         '100%',
            themeClass:     'fht-default',
            borderCollapse:  true,
            fixedColumns:    0, // fixed first columns
            fixedColumn:     false, // For backward-compatibility
            sortable:        false,
            autoShow:        true, // hide table after its created
            footer:          false, // show footer
            cloneHeadToFoot: false, // clone head and use as footer
            autoResize:      false, // resize table if its parent wrapper changes size
            create:          null // callback after plugin completes
        };

        var settings = {};

        // private methods
        var helpers = {
            /*
            * return void
            * format the input value: width, height and fixedColumns
            * width and height and fixedColumns are supposed to be number
            */
            _formatInputNumberString: function () {
                settings.width = settings.width.toString();
                settings.height = settings.height.toString();
                settings.fixedColumns = parseInt(settings.fixedColumns, 10);
            },
            /*
            * return the maximum cell count in one row
            */
            _getMaxCountOfRow: function ($obj) {
                var count = 0;
                $obj.find("tr").each(function () {
                    if (count < $(this).children().length) {
                        count = $(this).children().length;
                    }
                });
                return count;
            },
            /*
            * return void
            * insert the label to recognize the cell gonna be fixed
            */
            _insertFixedLabel: function ($obj, maxCount) {
                var $self = $obj,
                    leftRowspanValues,
                    colspan,
                    count;
                if (settings.fixedColumns && settings.fixedColumns > 0) {
                    $self.find("thead tr").each(function () {
                        leftRowspanValues = 0;
                        $(this).children().each(function () {
                            if (leftRowspanValues < settings.fixedColumns) {
                                $(this).addClass("fixed-column-cell");
                                colspan = $(this).attr("colspan");
                                leftRowspanValues += colspan ? parseInt(colspan, 10) : 1;
                            }
                        });
                    });
                    $self.find("tfoot tr").each(function () {
                        leftRowspanValues = 0;
                        $(this).children().each(function () {
                            if (leftRowspanValues < settings.fixedColumns) {
                                $(this).addClass("fixed-column-cell");
                                colspan = $(this).attr("colspan");
                                leftRowspanValues += colspan ? parseInt(colspan, 10) : 1;
                            }
                        });
                    });
                    $self.find("tbody tr").each(function () {
                        leftRowspanValues = settings.fixedColumns + $(this).children().length - maxCount;
                        $(this).children().each(function () {
                            if (leftRowspanValues > 0) {
                                $(this).addClass("fixed-column-cell");
                                colspan = $(this).attr("colspan");
                                leftRowspanValues -= colspan ? parseInt(colspan, 10) : 1;
                            }
                        });
                    });
                }
            },
            /*
             * return boolean
             * True if a thead and tbody exist.
             */
            _isTable: function ($obj) {
                var $self = $obj,
                    hasTable = $self.is('table'),
                    hasThead = $self.find('thead').length > 0,
                    hasTbody = $self.find('tbody').length > 0;

                if (hasTable && hasThead && hasTbody) {
                    return true;
                }
                return false;
            },
            /*
             * return void
             * bind scroll event
             */
            _bindScroll: function ($obj, tableProps) {
                var $self = $obj,
                    $wrapper = $self.closest('.fht-table-wrapper'),
                    $thead = $self.siblings('.fht-thead'),
                    $tfoot = $self.siblings('.fht-tfoot');

                $self.bind('scroll', function () {
                    if (settings.fixedColumns > 0) {
                        var $fixedColumns = $wrapper.find('.fht-fixed-column');
                        $fixedColumns.find('.fht-tbody table').css({'margin-top': -$self.scrollTop()});
                    }
                    $thead.find('table').css({'margin-left': -this.scrollLeft});
                    if (settings.footer || settings.cloneHeadToFoot) {
                        $tfoot.find('table').css({'margin-left': -this.scrollLeft});
                    }
                });
            },
            /*
             * return void
             */
            _fixHeightWithCss: function ($obj, tableProps) {
                if (settings.includePadding) {
                    $obj.css({
                        'height': $obj.height() + tableProps.border
                    });
                } else {
                    $obj.css({
                        'height': $obj.parent().height() + tableProps.border
                    });
                }
            },
            /*
             * return void
             */
            _fixWidthWithCss: function ($obj, tableProps, width) {
                if (settings.includePadding) {
                    $obj.each(function (index) {
                        $(this).css({
                            'width': width === undefined ? $(this).width() + tableProps.border : width + tableProps.border
                        });
                    });
                } else {
                    $obj.each(function (index) {
                        $(this).css({
                            'width': width === undefined ? $(this).parent().width() + tableProps.border : width + tableProps.border
                        });
                    });
                }
            },
            /*
             * return void
             */
            _setupFixedColumn: function ($obj, obj, tableProps) {
                var $self = $obj,
                    self = obj,
                    $wrapper = $self.closest('.fht-table-wrapper'),
                    $fixedBody = $wrapper.find('.fht-fixed-body'),
                    $fixedColumn = $wrapper.find('.fht-fixed-column'),
                    //for thead remove the original tr, it will be generated below
                    $thead = $('<div class="fht-thead"><table class="fht-table"><thead></thead></table></div>'),
                    $tbody = $('<div class="fht-tbody"><table class="fht-table"><tbody></tbody></table></div>'),
                    $tfoot = $('<div class="fht-tfoot"><table class="fht-table"><tfoot></tfoot></table></div>'),
                    $firstThChildren = [],
                    $firstTdChildren = [],
                    fixedColumnWidth,
                    fixedBodyWidth = $wrapper.width(),
                    fixedBodyHeight = $fixedBody.find('.fht-tbody').height() - settings.scrollbarOffset,
                    $newRow,
                    tdWidths = [];

                $thead.find('table.fht-table').addClass(settings.originalTable.attr('class'));
                $tbody.find('table.fht-table').addClass(settings.originalTable.attr('class'));
                $tfoot.find('table.fht-table').addClass(settings.originalTable.attr('class'));

                //recalculate the heads with multiple column variables
                $fixedBody.find('.fht-thead thead tr').each(function () {
                    var colspan = $(this).find('th:first-child').attr('colspan');
                    $firstThChildren.push($(this).find('th:lt(' + settings.fixedColumns / (colspan ? parseInt(colspan, 10) : 1) + ')'));
                });
                fixedColumnWidth = settings.fixedColumns * tableProps.border;
                //consider the border of the cell, we take the last row which consists of at least one row variable
                //to calculate the width of the header
                $.each($firstThChildren[$firstThChildren.length - 1], function (index) {
                    fixedColumnWidth += $(this).outerWidth(true);
                });

                // scan each cell in each row of headers, not just one row, Fix cell heights
                $.each($firstThChildren, function () {
                    helpers._fixHeightWithCss($(this), tableProps);
                    helpers._fixWidthWithCss($(this), tableProps);
                });

                //get the width of each cell in last row in the header, since last row consists of the row variables
                $.each($firstThChildren[$firstThChildren.length - 1], function () {
                    tdWidths.push($(this).width());
                });

                //here, to figure out if the cell is category part,
                //we can find it by checking if the class name 'fixed-column-cell' exists,
                //if null or undefined, it's not
                $fixedBody.find('tbody tr').each(function () {
                    var reverseArray = $(this).find('.fixed-column-cell').toArray().reverse();
                    $.each(reverseArray, function (index) {
                        helpers._fixHeightWithCss($(this), tableProps);
                        helpers._fixWidthWithCss($(this), tableProps, tdWidths[(settings.fixedColumns - index - 1) % settings.fixedColumns]);
                    });
                    $firstTdChildren.push(reverseArray.reverse());
                });

                // clone header
                $.each($firstThChildren, function () {
                    //append a new row for each row in the headers
                    $thead.find('thead').append($("<tr></tr>").append($(this).clone()));
                });
                $thead.appendTo($fixedColumn);

                $.each($firstTdChildren, function (index) {
                    $tbody.find('tbody').append($("<tr></tr>").append($(this).clone()));
                });
                $tbody.appendTo($fixedColumn).css({
                    'margin-top': -1,
                    'height': fixedBodyHeight + tableProps.border
                });

                // set width of fixed column wrapper
                $fixedColumn.css({
                    'height': 0,
                    'width': fixedColumnWidth
                });

                // bind mousewheel events
                var maxTop = $fixedColumn.find('.fht-tbody .fht-table').height() - $fixedColumn.find('.fht-tbody').height();
                $fixedColumn.find('.fht-tbody .fht-table').bind('mousewheel', function (event, delta, deltaX, deltaY) {
                    if (deltaY === 0) {return; }
                    var top = parseInt($(this).css('marginTop'), 10) + (deltaY > 0 ? 120 : -120);
                    if (top > 0) {top = 0; }
                    if (top < -maxTop) {top = -maxTop; }
                    $(this).css('marginTop', top);
                    $fixedBody.find('.fht-tbody').scrollTop(-top).scroll();
                    return false;
                });
                // set width of body table wrapper
                $fixedBody.css({'width': fixedBodyWidth});

                // setup clone footer with fixed column
                if (settings.footer === true) {
                    if (settings.cloneHeadToFoot === true) {
                        $.each($firstThChildren, function () {
                            $tfoot.find('tfoot').append($("<tr></tr>").append($(this).clone()));
                        });
                    } else {
                        var $firstTdFootChild = $fixedBody.find('.fht-tfoot tr > *:lt(' + settings.fixedColumns + ')');
                        helpers._fixHeightWithCss($firstTdFootChild, tableProps);
                        var $cell = ($firstTdFootChild.find('div.fht-cell').length) ?
                                    $(this).find('div.fht-cell') : $('<div class="fht-cell"></div>').appendTo($firstTdFootChild);
                        $tfoot.find('tfoot').append($("<tr></tr>").append($firstTdFootChild.clone()));
                        // $tfoot.find('tfoot t:lt(' + settings.fixedColumns + ')').each(function (index) {
                        //     $(this).width($firstTdFootChild.width());
                        // });
                    }
                    $tfoot.appendTo($fixedColumn);
                    // Set (view width) of $tfoot div to width of table (this accounts for footers with a colspan)
                    var footwidth = $tfoot.find('table').innerWidth();
                    $tfoot.css({
                        'top': settings.scrollbarOffset,
                        'width': footwidth
                    });
                }
            },
            /*
             * return void
             */
            _setupTableFooter: function ($obj, obj, tableProps) {
                var $self = $obj,
                    self = obj,
                    $wrapper = $self.closest('.fht-table-wrapper'),
                    $tfoot = $self.find('tfoot'),
                    $divFoot = $wrapper.find('div.fht-tfoot');
                if (!$divFoot.length) {
                    if (settings.fixedColumns > 0) {
                        $divFoot = $('<div class="fht-tfoot"><table class="fht-table"></table></div>').appendTo($wrapper.find('.fht-fixed-body'));
                    } else {
                        $divFoot = $('<div class="fht-tfoot"><table class="fht-table"></table></div>').appendTo($wrapper);
                    }
                }
                $divFoot.find('table.fht-table').addClass(settings.originalTable.attr('class'));
                if (!$tfoot.length && settings.cloneHeadToFoot === true) {
                    var $divHead = $wrapper.find('div.fht-thead');
                    $divFoot.empty();
                    $divHead.find('table').clone().appendTo($divFoot);
                } else if ($tfoot.length && settings.cloneHeadToFoot === false) {
                    $divFoot.find('table').append($tfoot).css({
                        'margin-top': -tableProps.border
                    });
                    helpers._setupClone($divFoot, tableProps.tfoot);
                }
            },
            /*
             * return object
             * Widths of each thead cell and tbody cell for the first rows.
             * Used in fixing widths for the fixed header and optional footer.
             * The original table props only fetch the first tr of thead, tbody, tfoot, 
             * which doesn't fit the situation with multiple row variables.
             * So we have to get props of each tr to clone the table
             */
            _getTableProps: function ($obj) {
                var tableProp = {
                    thead: {},
                    tbody: {},
                    tfoot: {},
                    border: 0
                },
                    borderCollapse = 1;
                if (settings.borderCollapse === true) {
                    borderCollapse = 2;
                }
                tableProp.border = ($obj.find('th:first-child').outerWidth() - $obj.find('th:first-child').innerWidth()) / borderCollapse;
                // tableProp.border = 0;
                $obj.find('thead tr').each(function (trIndex) {
                    tableProp.thead[trIndex] = [];
                    $(this).find("th").each(function (thIndex) {
                        tableProp.thead[trIndex][thIndex] = $(this).width() + tableProp.border;
                    });
                });
                $obj.find('tfoot tr').each(function (trIndex) {
                    tableProp.tfoot[trIndex] = [];
                    if ($(this).find("td").length) {
                        $(this).find("td").each(function (thIndex) {
                            tableProp.tfoot[trIndex][thIndex] = $(this).width() + tableProp.border;
                        });
                    } else if ($(this).find("th").length) {
                        $(this).find("th").each(function (thIndex) {
                            tableProp.tfoot[trIndex][thIndex] = $(this).width() + tableProp.border;
                        });
                    }
                });
                $obj.find('tbody tr').each(function (trIndex) {
                    tableProp.tbody[trIndex] = [];
                    $(this).find("td").each(function (tdIndex) {
                        tableProp.tbody[trIndex][tdIndex] = $(this).width() + tableProp.border;
                    });
                });
                return tableProp;
            },
            /*
             * return void
             * Fix widths of each cell in the first row of obj.
             */
            _setupClone: function ($obj, cellArray) {
                var $self = $obj,
                    selector = (($self.find('tbody').length) ? 'tbody' : (($self.find('tfoot').length) ? 'tfoot' : 'thead')) + ' tr',
                    subselector = ($self.find('tbody').length) ? 'td' : (($self.find('thead').length) ? 'th' : 'td');
                if ('td' === subselector && !$self.find("tfoot td").length) {
                    subselector = 'th';
                }
                $self.find(selector).each(function (trIndex) {
                    $(this).find(subselector).each(function (tdIndex) {
                        var $cell = ($(this).find('div.fht-cell').length) ? $(this).find('div.fht-cell') : $('<div class="fht-cell"></div>').appendTo($(this));
                        $cell.css({'width': parseInt(cellArray[trIndex][tdIndex], 10)});
                        /*
                         * Fixed Header and Footer should extend the full width
                         * to align with the scrollbar of the body 
                         */
                        if (!$(this).closest('.fht-tbody').length && $(this).is(':last-child') && !$(this).closest('.fht-fixed-column').length
                                && (!$(this).parent().is(':last-child') || $(this).parent().is(':first-child'))) {
                            var padding = (($(this).innerWidth() - $(this).width()) / 2) + settings.scrollbarOffset;
                            $(this).css({'padding-right': padding + 'px'});
                        }
                    });
                });
            },

            /*
             * return boolean
             * Determine how the browser calculates fixed widths with padding for tables
             * true if width = padding + width
             * false if width = width
             */
            _isPaddingIncludedWithWidth: function () {
                var $obj = $('<table class="fht-table"><tr><td style="padding: 10px; font-size: 10px;">test</td></tr></table>'),
                    defaultHeight,
                    newHeight;
                $obj.addClass(settings.originalTable.attr('class'));
                $obj.appendTo('body');
                defaultHeight = $obj.find('td').height();
                $obj.find('td').css('height', $obj.find('tr').height());
                newHeight = $obj.find('td').height();
                $obj.remove();
                return defaultHeight !== newHeight;
            },
            /*
             * return int
             * get the width of the browsers scroll bar
             */
            _getScrollbarWidth: function () {
                var scrollbarWidth = 0;
                if (!scrollbarWidth) {
                    if (/msie/.test(navigator.userAgent.toLowerCase())) {
                        var $textarea1 = $('<textarea cols="10" rows="2"></textarea>')
                                .css({ position: 'absolute', top: -1000, left: -1000 }).appendTo('body'),
                            $textarea2 = $('<textarea cols="10" rows="2" style="overflow: hidden;"></textarea>')
                                .css({ position: 'absolute', top: -1000, left: -1000 }).appendTo('body');
                        scrollbarWidth = $textarea1.width() - $textarea2.width() + 2; // + 2 for border offset
                        $textarea1.add($textarea2).remove();
                    } else {
                        var $div = $('<div />')
                            .css({ width: 100, height: 100, overflow: 'auto', position: 'absolute', top: -1000, left: -1000 })
                            .prependTo('body').append('<div />').find('div')
                            .css({ width: '100%', height: 200 });
                        scrollbarWidth = 100 - $div.width();
                        $div.parent().remove();
                    }
                }
                return scrollbarWidth;
            }
        };

        // public methods
        var methods = {
            init: function (options) {
                settings = $.extend({}, defaults, options);

                // iterate through all the DOM elements we are attaching the plugin to
                return this.each(function () {
                    var $self = $(this), // reference the jQuery version of the current DOM element
                        self = this; // reference to the actual DOM element
                    if (helpers._isTable($self)) {
                        methods.setup.apply(this, Array.prototype.slice.call(arguments, 1));
                        if ($.isFunction(settings.create)) {settings.create.call(this); }
                    } else {
                        $.error('Invalid table mark-up');
                    }
                });
            },

            /*
             * Setup table structure for fixed headers and optional footer
             */
            setup: function (options) {
                var $self  = $(this),
                    self = this,
                    $thead = $self.find('thead'),
                    $tfoot = $self.find('tfoot'),
                    $tbody = $self.find('tbody'),
                    $wrapper,
                    $divHead,
                    $divFoot,
                    $divBody,
                    $fixedBody,
                    $fixedHeadRow,
                    $temp,
                    tfootHeight = 0,
                    widthMinusScrollbar,
                    maxCount;
                settings.originalTable = $(this).clone();
                settings.includePadding = helpers._isPaddingIncludedWithWidth();
                settings.scrollbarOffset = helpers._getScrollbarWidth();
                settings.themeClassName = settings.themeClass;
                helpers._formatInputNumberString();
                maxCount = helpers._getMaxCountOfRow($self);
                helpers._insertFixedLabel($self, maxCount);

                if (settings.width.toString().search('%') > -1) {
                    widthMinusScrollbar = $self.parent().width() - settings.scrollbarOffset;
                } else {
                    widthMinusScrollbar = settings.width - settings.scrollbarOffset;
                }
                $self.css({
                    width: widthMinusScrollbar
                });

                if (!$self.closest('.fht-table-wrapper').length) {
                    $self.addClass('fht-table');
                    $self.wrap('<div class="fht-table-wrapper"></div>');
                }

                $wrapper = $self.closest('.fht-table-wrapper');
                if (settings.fixedColumn === true && settings.fixedColumns <= 0) {
                    settings.fixedColumns = 1;
                }

                if (settings.fixedColumns > 0 && $wrapper.find('.fht-fixed-column').length === 0) {
                    $self.wrap('<div class="fht-fixed-body"></div>');
                    var $fixedColumns = $('<div class="fht-fixed-column"></div>').prependTo($wrapper);
                    $fixedBody = $wrapper.find('.fht-fixed-body');
                }

                $wrapper.css({
                    width: settings.width,
                    height: settings.height
                }).addClass(settings.themeClassName);

                if (!$self.hasClass('fht-table-init')) {
                    $self.wrap('<div class="fht-tbody"></div>');
                }

                $divBody = $self.closest('.fht-tbody');
                var tableProps = helpers._getTableProps($self);
                helpers._setupClone($divBody, tableProps.tbody);

                if (!$self.hasClass('fht-table-init')) {
                    if (settings.fixedColumns > 0) {
                        $divHead = $('<div class="fht-thead"><table class="fht-table"></table></div>').prependTo($fixedBody);
                    } else {
                        $divHead = $('<div class="fht-thead"><table class="fht-table"></table></div>').prependTo($wrapper);
                    }
                    $divHead.find('table.fht-table').addClass(settings.originalTable.attr('class'));
                    $thead.clone().appendTo($divHead.find('table'));
                } else {
                    $divHead = $wrapper.find('div.fht-thead');
                }

                helpers._setupClone($divHead, tableProps.thead);
                $self.css('margin-top', -$divHead.outerHeight(true));

                /*
                 * Check for footer
                 * Setup footer if present
                 */
                if (settings.footer === true) {
                    helpers._setupTableFooter($self, self, tableProps);
                    if (!$tfoot.length) {
                        $tfoot = $wrapper.find('div.fht-tfoot table');
                    }
                    tfootHeight = $tfoot.outerHeight(true);
                }

                var tbodyHeight = $wrapper.height() - $thead.outerHeight(true) - tfootHeight - tableProps.border;
                $divBody.css('height', tbodyHeight);
                $self.addClass('fht-table-init');
                if (typeof settings.altClass) {
                    methods.altRows.apply(self);
                }
                if (settings.fixedColumns > 0) {
                    helpers._setupFixedColumn($self, self, tableProps);
                }
                if (!settings.autoShow) {
                    $wrapper.hide();
                }
                helpers._bindScroll($divBody, tableProps);
                return self;
            },

            /*
             * Resize the table
             * Incomplete - not implemented yet
             */
            resize: function (options) {
                var $self = $(this),
                    self = this;
                return self;
            },
            /*
             * Add CSS class to alternating rows
             */
            altRows: function (arg1) {
                var $self = $(this),
                    self = this,
                    altClass = (typeof arg1) ? arg1 : settings.altClass;
                $self.closest('.fht-table-wrapper')
                    .find('tbody tr:odd:not(:hidden)')
                    .addClass(altClass);
            },
            /*
             * Show a hidden fixedHeaderTable table
             */
            show: function (arg1, arg2, arg3) {
                var $self = $(this),
                    self = this,
                    $wrapper = $self.closest('.fht-table-wrapper');

                // User provided show duration without a specific effect
                if (typeof arg1 && typeof arg1 === 'number') {
                    $wrapper.show(arg1, function () {
                        if ($.isFunction(arg2)) {arg2.call(this); }
                    });
                } else if (typeof arg1 && typeof arg1 === 'string' && typeof arg2 && typeof arg2 === 'number') {
                    // User provided show duration with an effect
                    $wrapper.show(arg1, arg2, function () {
                        if ($.isFunction(arg3)) {arg3.call(this); }
                    });
                } else {
                    $self.closest('.fht-table-wrapper').show();
                    if ($.isFunction(arg1)) {arg1.call(this); }
                }
                return self;
            },
            /*
             * Hide a fixedHeaderTable table
             */
            hide: function (arg1, arg2, arg3) {
                var $self = $(this),
                    self = this,
                    $wrapper = $self.closest('.fht-table-wrapper');
                // User provided show duration without a specific effect
                if (typeof arg1 && typeof arg1 === 'number') {
                    $wrapper.hide(arg1, function () {
                        if ($.isFunction(arg3)) {arg3.call(this); }
                    });
                } else if (typeof arg1 && typeof arg1 === 'string' && typeof arg2 && typeof arg2 === 'number') {
                    $wrapper.hide(arg1, arg2, function () {
                        if ($.isFunction(arg3)) {arg3.call(this); }
                    });
                } else {
                    $self.closest('.fht-table-wrapper').hide();
                    if ($.isFunction(arg3)) {arg3.call(this); }
                }
                return self;
            },
            /*
             * Destory fixedHeaderTable and return table to original state
             */
            destroy: function () {
                var $self = $(this),
                    self = this,
                    $wrapper = $self.closest('.fht-table-wrapper');
                $self.insertBefore($wrapper)
                    .removeAttr('style')
                    .append($wrapper.find('tfoot'))
                    .removeClass('fht-table fht-table-init')
                    .find('.fht-cell')
                    .remove();
                $wrapper.remove();
                return self;
            }
        };

        // if a method as the given argument exists
        if (methods[method]) {
            // call the respective method
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
            // if an object is given as method OR nothing is given as argument
        }

        if (typeof method !== 'object' && method) {
            // trigger an error
            $.error('Method "' +  method + '" does not exist in fixedHeaderTable plugin!');
        } else {
            // call the initialization method
            return methods.init.apply(this, arguments);
            // otherwise
        }
    };
}(jQuery));
