"use strict";
var timespan = { };

timespan.milliseconds = function(ms) { return ms; };
timespan.seconds = function(s) { return s * 1000; };
timespan.minutes = function(m) { return m * 60 * 1000; };
timespan.hours = function(h) { return h * 60 * 60 * 1000; };
timespan.days = function(d) { return d * 24 * 60 * 60 * 1000; };