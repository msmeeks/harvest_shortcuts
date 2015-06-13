// ==UserScript==
// @name       Harvest Shortcuts
// @namespace  http://userscripts.org/users/540094
// @version    0.2.2
// @description  Adds the ability to create shortcuts for timers.
// @match      https://*.harvestapp.com/time*

// ==/UserScript==

// TODO
// * Fix window height problem (shortcuts go off the page if the window is too short)
// * Shortcut manager
//   * Delete individual shortcuts
//   * Order shortcuts
//   * Export shortcuts
//   * Import shortcuts
//   * Delete all short cuts
//   * View shortcut stats

var run = function() {
    add_styles();
    
    // Create shortcut list
    var $shortcut_list = $('<div id="__shortcut_list__">');
    
    // Make the shortcut list sticky when scrolling, like the new entry button
    $(document).on('scroll', function(t){
        if ($(t.target).scrollTop() >= 160) {
            $shortcut_list.addClass('sticky');
        } else {
            $shortcut_list.removeClass('sticky');
        }
    });
    
    // Add shortcut list to the page
    var $new_entry_button = $('.button-new-time-entry').after($shortcut_list)
    
    loadShortcuts();
    
    // Add a listener to add the create shortcut form to the new entry form when the new entry button is clicked
    $new_entry_button.on('click', function(){
        setTimeout(add_create_shortcut_form, 50)
    });
};


// Helper functions
var addShortcutButton = function(cfg) {
    var $shortcut = $('<a class="btn button">' + cfg.name + '</a>');
    
    // Start a recess timer when the recess button is clicked
    $shortcut.on('click', function() {
        // Directly post the data for the timer
        now = new Date();
        date = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate();
        
        params = {
            project_id: cfg.project,
            task_id: cfg.task,
            spent_at: date,
            timer_started_at: 'now',
            notes: cfg.notes || ''
        };
        
        $.ajax({
            type: 'POST',
            url: '/time/api.json',
            contentType: 'application/json; charset=utf-8',
            dataType: 'json',
            data: JSON.stringify(params),
            success: function(data, textStatus, jqXHR) {        
                // Update shortcut analytics
                var shortcuts = getValue('shortcuts', {});
                shortcuts[cfg.name].count++;
                shortcuts[cfg.name].lastUsed = now;
                setValue('shortcuts', shortcuts);
                
                //TODO: Determine if there is a better way to refresh the running timers
                location.reload();
            }
        });
    });
    
    var $shortcut_container = $('<div class="btn-group">');
    
    // Add ability to delete
    var $shortcut_deleter = $('<a class="btn button button-important" style="display:none; font-weight:bold; width:25px; left:-25px;">X</a>');
    $shortcut_deleter.click(function(){delete_shortcut(cfg.name);});
    $shortcut_container.append($shortcut_deleter);
    $shortcut_container.hover(function(){$shortcut_deleter.show();}, function(){$shortcut_deleter.hide();});
    
    $shortcut_container.append($shortcut);
    $('#__shortcut_list__').append($shortcut_container);
};

var loadShortcuts = function() {
    // Clear the shortcuts
    $('#__shortcut_list__').empty();
    
    // Add the current shortcuts
    var priorShortcuts = getValue('shortcuts', {});
    for (var key in priorShortcuts) {
        if (priorShortcuts.hasOwnProperty(key)) {
            addShortcutButton(priorShortcuts[key]);
        }
    }
};

var add_create_shortcut_form = function() {
    console.log('here');
    var $new_entry_form = $('.new-entry-form');
    var $name = $('<input type="text" style="width:100px; margin:0 10px;" placeholder="Name"/>');
    var $btn = $('<a href="#" class="button button-small button-cancel">Create Shortcut</a>');
    var $form = $('<div class="form-field-actions entry-delete-confirmation">Create a shortcut for this timer:</div>');
    
    $form.append($name).append($btn);
    
    $('.new-entry-form .entry-delete-confirmation').after($form);
    
    $btn.on('click', function() {
        var shortcuts = getValue('shortcuts', {});
        var name = $name.val();
        var now = new Date();
        
        shortcuts[name] = {
            name: name,
            project: $('.new-entry-form [name="projects"]').val(),
            task: $('.new-entry-form [name="tasks"]').val(),
            notes: $('.new-entry-form [name="notes"]').val(),
            count: 0,
            lastUsed: now,
            created: now
        };
        
        setValue('shortcuts', shortcuts);
        
        loadShortcuts();
    });
};

var clear_shortcuts = function() {
    setValue('shortcuts', {});
    
    loadShortcuts();
};

var delete_shortcut = function(name) {
    var shortcuts = getValue('shortcuts', {});
    shortcuts[name] = undefined;
    setValue('shortcuts', shortcuts);
    
    loadShortcuts();
};

var add_styles = function() {
    // Add new CSS rules
    GM_addStyle('#__shortcut_list__ { position:absolute; top:100px; }');
    GM_addStyle('#__shortcut_list__.sticky { position: fixed; top:120px; }');
    GM_addStyle('#__shortcut_list__ .button { display:block; margin-left:-95px; width:80px; margin-top:10px; padding:0 2px; text-align:center; }');
    
    // Bootrap add on
    GM_addStyle('.btn-group { position: relative; *zoom: 1; *margin-left: .3em; }');
    GM_addStyle('.btn-group:before, .btn-group:after { display: table; content: ""; }');
    GM_addStyle('.btn-group:after { clear: both; }');
    GM_addStyle('.btn-group:first-child { *margin-left: 0; }');
    //GM_addStyle('.btn-group + .btn-group { margin-left: 5px; }');
    GM_addStyle('.btn-toolbar { margin-top: 9px; margin-bottom: 9px; }');
    GM_addStyle('.btn-toolbar .btn-group { display: inline-block; *display: inline; /* IE7 inline-block hack */ *zoom: 1; }');
    GM_addStyle('.btn-group .btn { position: relative; float: left; margin-left: -1px; -webkit-border-radius: 0; -moz-border-radius: 0; border-radius: 0; }');
    GM_addStyle('.btn-group .btn:first-child { margin-left: 0; -webkit-border-top-left-radius: 4px; -moz-border-radius-topleft: 4px; border-top-left-radius: 4px; -webkit-border-bottom-left-radius: 4px; -moz-border-radius-bottomleft: 4px; border-bottom-left-radius: 4px; }');
    GM_addStyle('.btn-group .btn:last-child, .btn-group .dropdown-toggle { -webkit-border-top-right-radius: 4px; -moz-border-radius-topright: 4px; border-top-right-radius: 4px; -webkit-border-bottom-right-radius: 4px; -moz-border-radius-bottomright: 4px; border-bottom-right-radius: 4px; }');
    GM_addStyle('.btn-group .btn.large:first-child { margin-left: 0; -webkit-border-top-left-radius: 6px; -moz-border-radius-topleft: 6px; border-top-left-radius: 6px; -webkit-border-bottom-left-radius: 6px; -moz-border-radius-bottomleft: 6px; border-bottom-left-radius: 6px; }');
    GM_addStyle('.btn-group .btn.large:last-child, .btn-group .large.dropdown-toggle { -webkit-border-top-right-radius: 6px; -moz-border-radius-topright: 6px; border-top-right-radius: 6px; -webkit-border-bottom-right-radius: 6px; -moz-border-radius-bottomright: 6px; border-bottom-right-radius: 6px; }');
    GM_addStyle('.btn-group .btn:hover, .btn-group .btn:focus, .btn-group .btn:active, .btn-group .btn.active { z-index: 2; }');
    GM_addStyle('.btn-group .dropdown-toggle:active, .btn-group.open .dropdown-toggle { outline: 0; }');
    GM_addStyle('.btn-group .dropdown-toggle { padding-left: 8px; padding-right: 8px; -webkit-box-shadow: inset 1px 0 0 rgba(255, 255, 255, 0.125), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 1px 2px rgba(0, 0, 0, 0.05); -moz-box-shadow: inset 1px 0 0 rgba(255, 255, 255, 0.125), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 1px 2px rgba(0, 0, 0, 0.05); box-shadow: inset 1px 0 0 rgba(255, 255, 255, 0.125), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 1px 2px rgba(0, 0, 0, 0.05); *padding-top: 5px; *padding-bottom: 5px; }');
    GM_addStyle('.btn-group.open { *z-index: 1000; }');
    GM_addStyle('.btn-group.open .dropdown-menu { display: block; margin-top: 1px; -webkit-border-radius: 5px; -moz-border-radius: 5px; border-radius: 5px; }');
    GM_addStyle('.btn-group.open .dropdown-toggle { background-image: none; -webkit-box-shadow: inset 0 1px 6px rgba(0, 0, 0, 0.15), 0 1px 2px rgba(0, 0, 0, 0.05); -moz-box-shadow: inset 0 1px 6px rgba(0, 0, 0, 0.15), 0 1px 2px rgba(0, 0, 0, 0.05); box-shadow: inset 0 1px 6px rgba(0, 0, 0, 0.15), 0 1px 2px rgba(0, 0, 0, 0.05); }');
    GM_addStyle('.btn .caret { margin-top: 7px; margin-left: 0; }');
    GM_addStyle('.btn:hover .caret, .open.btn-group .caret { opacity: 1; filter: alpha(opacity=100); }');
    GM_addStyle('.btn-primary .caret, .btn-danger .caret, .btn-info .caret, .btn-success .caret, .btn-inverse .caret { border-top-color: #ffffff; opacity: 0.75; filter: alpha(opacity=75); }');
    GM_addStyle('.btn-small .caret { margin-top: 4px; }');
};

// Storage helpers
const __GM_STORAGE_PREFIX = [
    '', GM_info.script.namespace, GM_info.script.name, ''].join('***');

var setValue = function(key, value) {
    return GM_SuperValue.set(__GM_STORAGE_PREFIX + key, value);
};
var getValue = function(key, value, defaultValue) {
    return GM_SuperValue.get(__GM_STORAGE_PREFIX + key, value, defaultValue);
};

// Define GM_addStyle, if it is missing
if (typeof GM_addStyle === 'undefined') {
    GM_addStyle = function(css) {
        var head = document.getElementsByTagName('head')[0],
            style = document.createElement('style');
        if (!head) {return}
        style.type = 'text/css';
        try {style.innerHTML = css}
        catch(x) {style.innerText = css}
        head.appendChild(style);
    };
}
// END Helper function






/***************************************************************************************
****************************************************************************************
*****   Super GM_setValue and GM_getValue.js
*****
*****   This library extends the Greasemonkey GM_setValue and GM_getValue functions to
*****   handle any javascript variable type.
*****
*****   Add it to your GM script with:
*****       // @require http://userscripts.org/scripts/source/107941.user.js
*****
*****
*****   Usage:
*****       GM_SuperValue.set           (varName, varValue);
*****       var x = GM_SuperValue.get   (varName, defaultValue);
*****
*****   Test mode:
*****       GM_SuperValue.runTestCases  (bUseConsole);
*****
*/

var GM_SuperValue = new function () {
    
    var JSON_MarkerStr  = 'json_val: ';
    var FunctionMarker  = 'function_code: ';
    
    function ReportError (msg) {
        if (console && console.error)
            console.log (msg);
        else
            throw new Error (msg);
    }
    
    //--- Check that the environment is proper.
    if (typeof GM_setValue != "function")
        ReportError ('This library requires Greasemonkey! GM_setValue is missing.');
    if (typeof GM_getValue != "function")
        ReportError ('This library requires Greasemonkey! GM_getValue is missing.');
    
    
    /*--- set ()
        GM_setValue (http://wiki.greasespot.net/GM_setValue) only stores:
        strings, booleans, and integers (a limitation of using Firefox
        preferences for storage).

        This function extends that to allow storing any data type.

        Parameters:
            varName
                String: The unique (within this script) name for this value.
                Should be restricted to valid Javascript identifier characters.
            varValue
                Any valid javascript value.  Just note that it is not advisable to
                store too much data in the Firefox preferences.

        Returns:
            undefined
    */
    this.set = function (varName, varValue) {
        
        if ( ! varName) {
            ReportError ('Illegal varName sent to GM_SuperValue.set().');
            return;
        }
        if (/[^\w _-]/.test (varName) ) {
            ReportError ('Suspect, probably illegal, varName sent to GM_SuperValue.set().');
        }
        
        switch (typeof varValue) {
            case 'undefined':
                ReportError ('Illegal varValue sent to GM_SuperValue.set().');
                break;
            case 'boolean':
            case 'string':
                //--- These 2 types are safe to store, as is.
                GM_setValue (varName, varValue);
                break;
            case 'number':
                /*--- Numbers are ONLY safe if they are integers.
                    Note that hex numbers, EG 0xA9, get converted
                    and stored as decimals, EG 169, automatically.
                    That's a feature of JavaScript.

                    Also, only a 32-bit, signed integer is allowed.
                    So we only process +/-2147483647 here.
                */
                if (varValue === parseInt (varValue)  &&  Math.abs (varValue) < 2147483647)
                {
                    GM_setValue (varName, varValue);
                    break;
                }
            case 'object':
                /*--- For all other cases (but functions), and for
                    unsafe numbers, store the value as a JSON string.
                */
                var safeStr = JSON_MarkerStr + JSON.stringify (varValue);
                GM_setValue (varName, safeStr);
                break;
            case 'function':
                /*--- Functions need special handling.
                */
                var safeStr = FunctionMarker + varValue.toString ();
                GM_setValue (varName, safeStr);
                break;
                
            default:
                ReportError ('Unknown type in GM_SuperValue.set()!');
                break;
        }
    }//-- End of set()
    
    
    /*--- get ()
        GM_getValue (http://wiki.greasespot.net/GM_getValue) only retieves:
        strings, booleans, and integers (a limitation of using Firefox
        preferences for storage).

        This function extends that to allow retrieving any data type -- as
        long as it was stored with GM_SuperValue.set().

        Parameters:
            varName
                String: The property name to get. See GM_SuperValue.set for details.
            defaultValue
                Optional. Any value to be returned, when no value has previously
                been set.

        Returns:
            When this name has been set...
                The variable or function value as previously set.

            When this name has not been set, and a default is provided...
                The value passed in as a default

            When this name has not been set, and default is not provided...
                undefined
    */
    this.get = function (varName, defaultValue) {
        
        if ( ! varName) {
            ReportError ('Illegal varName sent to GM_SuperValue.get().');
            return;
        }
        if (/[^\w _-]/.test (varName) ) {
            ReportError ('Suspect, probably illegal, varName sent to GM_SuperValue.get().');
        }
        
        //--- Attempt to get the value from storage.
        var varValue    = GM_getValue (varName);
        if (!varValue)
            return defaultValue;
        
        //--- We got a value from storage. Now unencode it, if necessary.
        if (typeof varValue == "string") {
            //--- Is it a JSON value?
            var regxp       = new RegExp ('^' + JSON_MarkerStr + '(.+)$');
            var m           = varValue.match (regxp);
            if (m  &&  m.length > 1) {
                varValue    = JSON.parse ( m[1] );
                return varValue;
            }
            
            //--- Is it a function?
            var regxp       = new RegExp ('^' + FunctionMarker + '((?:.|\n|\r)+)$');
            var m           = varValue.match (regxp);
            if (m  &&  m.length > 1) {
                varValue    = eval ('(' + m[1] + ')');
                return varValue;
            }
        }
        
        return varValue;
    }//-- End of get()
    
    
    /*--- runTestCases ()
        Tests storage and retrieval every every knid of value.
        Note: makes extensive use of the console.

        Parameters:
            bUseConsole
                Boolean: If this is true, uses the console environment to store
                the data.  Useful for dev test.
        Returns:
            true, if pass.  false, otherwise.
    */
    this.runTestCases = function (bUseConsole) {
        
        if (bUseConsole) {
            //--- Set up the environment to use local JS, and not the GM environment.
            this.testStorage    = {};
            var context         = this;
            this.oldSetFunc     = (typeof GM_setValue == "function") ? GM_setValue : null;
            this.oldGetFunc     = (typeof GM_getValue == "function") ? GM_getValue : null;
            
            GM_setValue    = function (varName, varValue) {
                console.log ('Storing: ', varName, ' as: ', varValue);
                context.testStorage[varName] = varValue;
            }
            
            GM_getValue    = function (varName, defaultValue) {
                var varValue    = context.testStorage[varName];
                if (!varValue)
                    varValue    = defaultValue;
                
                console.log ('Retrieving: ', varName, '. Got: ', varValue);
                
                return varValue;
            }
        }
        
        var dataBefore  =   [null, true, 1, 1.1, -1.0, 2.0E9,  2.77E9,  2.0E-9, 0xA9, 'string',
                             [1,2,3], {a:1, B:2}, function () {a=7; console.log ("Neat! Ain't it?"); }
                            ];
        
        for (var J = 0;  J <= dataBefore.length;  J++)
        {
            var X       = dataBefore[J];
            console.log (J, ': ', typeof X, X);
            
            this.set ('Test item ' + J, X);
            console.log ('\n');
        }
        
        console.log ('\n***********************\n***********************\n\n');
        
        var dataAfter   = [];
        
        for (var J = 0;  J < dataBefore.length;  J++)
        {
            var X       = this.get ('Test item ' + J);
            dataAfter.push (X);
            console.log ('\n');
        }
        
        console.log (dataBefore);
        console.log (dataAfter);
        
        dataAfter[12]();
        
        //--- Now test for pass/fail.  The objects won't be identical but contenets are.
        var bPass;
        if (dataBefore.toString()  ==  dataAfter.toString() ) {
            var pfStr   = 'PASS!';
            bPass       = true;
        } else {
            var pfStr   = 'FAIL!';
            bPass       = false;
        }
        console.log ( "\n***************************        \
\n***************************        \
\n***************************        \
\n*****     " + pfStr + "       *****        \
\n***************************        \
\n***************************        \
\n***************************\n");
        
        if (bUseConsole) {
            //--- Restore the GM functions.
            GM_setValue    = this.oldSetFunc;
            GM_getValue    = this.oldGetFunc;
        }
        else {
            //--- Clean up the FF storage!
            
            for (var J = 0;  J < dataBefore.length;  J++)
            {
                GM_deleteValue ('Test item ' + J);
            }
        }
        
        return bPass;
        
    }//-- End of runTestCases()
};


//GM_SuperValue.runTestCases  (true);

//--- EOF for GM shim

run();
