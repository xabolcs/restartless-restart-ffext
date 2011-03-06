/* ***** BEGIN LICENSE BLOCK *****
 * Version: MIT/X11 License
 * 
 * Copyright (c) 2010 Erik Vold
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * Contributor(s):
 *   Erik Vold <erikvvold@gmail.com> (Original Author)
 *   Greg Parris <greg.parris@gmail.com>
 *   Nils Maier <maierman@web.de>
 *
 * ***** END LICENSE BLOCK ***** */

const EXPORTED_SYMBOLS = ['main','startupGecko19x'];

const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
const reportError = Cu.reportError;

try {
  Cu.import("resource://gre/modules/Services.jsm");
  Cu.import("resource://gre/modules/AddonManager.jsm");
} catch (ex) {
  
  Services = {
    prefs : Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService),
    scriptloader : Cc["@mozilla.org/moz/jssubscript-loader;1"].getService(Ci.mozIJSSubScriptLoader),
    wm: Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator),
    ww: Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher),
    strings: Cc["@mozilla.org/intl/stringbundle;1"].getService(Ci.nsIStringBundleService),
    obs: Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService),
    prompt: Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService)

  };

  Cu.import("resource://restartless-restart/includes/unload.js");
    
  
  let locale = Cc["@mozilla.org/chrome/chrome-registry;1"]
      .getService(Ci.nsIXULChromeRegistry).getSelectedLocale("global");

  let strings = Services.strings.createBundle("resource://restartless-restart/locale/"+locale+"/rr.properties");
  let stringsDefaultLang = Services.strings.createBundle("resource://restartless-restart/locale/en/rr.properties");
  try {
    
    let stringsBaseLang;
    let splitter = /(\w+)-\w+/;
    let (locale_base = locale.match(splitter)) {
      if (locale_base) {
        reportError(locale_base[1]);
        stringsBaseLang = Services.strings.createBundle(
            "resource://restartless-restart/locale/"+locale_base[1]+"/rr.properties");
      }
    }
  } catch(ex) { reportError(ex); };
  
  var gecko19xAddon = {
    makeURI: function makeURI(aURL, aOriginCharset, aBaseURI) {
      var ioService = Components.classes["@mozilla.org/network/io-service;1"]
                  .getService(Components.interfaces.nsIIOService);
      return ioService.newURI(aURL, aOriginCharset, aBaseURI);
    }
    , getResourceURI: function getResourceURI(aURI) {
      const res = "resource://restartless-restart/";
      //reportError(aURI);
      return {spec: res+aURI};
    }
  }
  
  _ = function l10ngecko19x (aKey, aLocale) {
    let result;
    try {
      result = strings.GetStringFromName(aKey);
    } catch(ex) {
      try { 
        result = stringsBaseLang.GetStringFromName(aKey);
      } catch (aEx) {
        result = stringsDefaultLang.GetStringFromName(aKey);
      }
    }
    return result;
  };
  
  function startupGecko19x(win) {
    main(win);
  }
}


const NS_XUL = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
const keysetID = "restartless-restart-keyset";
const keyID = "RR:Restart";
const fileMenuitemID = "menu_FileRestartItem";

const PREF_BRANCH = Services.prefs.getBranch("extensions.restartless-restart.");
const PREFS = {
  get key() _("restart.ak", getPref("locale")),
  modifiers: "accel,alt",
  locale: undefined
};
let PREF_OBSERVER = {
  observe: function(aSubject, aTopic, aData) {
    if ("nsPref:changed" != aTopic || !(aData in PREFS)) return;
    runOnWindows(function(win) {
      switch (aData) {
        case "locale":
          win.document.getElementById(keyID)
              .setAttribute("label", _("restart", getPref("locale")));
          break;
        default:
          win.document.getElementById(keyID)
              .setAttribute(aData, getPref(aData));
          break;
      }
      addMenuItem(win);
    });
  }
}

let logo = "";

(function(global) global.include = function include(src) (
    Services.scriptloader.loadSubScript(src, global)))(this);

function getPref(aName) {
  try {
    return PREF_BRANCH.getComplexValue(aName, Ci.nsISupportsString).data;
  } catch(e) {}
  return PREFS[aName];
}

function addMenuItem(win) {
  var $ = function(id) win.document.getElementById(id);

  function removeMI() {
    var menuitem = $(fileMenuitemID);
    menuitem && menuitem.parentNode.removeChild(menuitem);
  }
  removeMI();

  // add the new menuitem to File menu
  let (restartMI = win.document.createElementNS(NS_XUL, "menuitem")) {
    restartMI.setAttribute("id", fileMenuitemID);
    restartMI.setAttribute("label", _("restart", getPref("locale")));
    restartMI.setAttribute("accesskey", "R");
    restartMI.setAttribute("key", keyID);
    restartMI.addEventListener("command", restart, true);

    $("menu_FilePopup").insertBefore(restartMI, $("menu_FileQuitItem"));
  }

  unload(removeMI, win);
}

function restart() {
  let canceled = Cc["@mozilla.org/supports-PRBool;1"]
      .createInstance(Ci.nsISupportsPRBool);

  Services.obs.notifyObservers(canceled, "quit-application-requested", "restart");

  if (canceled.data) return false; // somebody canceled our quit request

  Cc['@mozilla.org/toolkit/app-startup;1'].getService(Ci.nsIAppStartup)
      .quit(Ci.nsIAppStartup.eAttemptQuit | Ci.nsIAppStartup.eRestart);

  return true;
}

function main(win) {
  let doc = win.document;
  function $(id) doc.getElementById(id);

  let rrKeyset = doc.createElementNS(NS_XUL, "keyset");
  rrKeyset.setAttribute("id", keysetID);

  // add hotkey
  let (restartKey = doc.createElementNS(NS_XUL, "key")) {
    restartKey.setAttribute("id", keyID);
    restartKey.setAttribute("key", getPref("key"));
    restartKey.setAttribute("modifiers", getPref("modifiers"));
    restartKey.setAttribute("oncommand", "void(0);");
    restartKey.addEventListener("command", restart, true);
    $("mainKeyset").parentNode.appendChild(rrKeyset).appendChild(restartKey);
  }

  // add menu bar item to File menu
  addMenuItem(win);

  // add app menu item to Firefox button for Windows 7
  let appMenu = $("appmenuPrimaryPane"), restartAMI;
  if (appMenu) {
    restartAMI = $(fileMenuitemID).cloneNode(false);
    restartAMI.setAttribute("id", "appmenu_RestartItem");
    restartAMI.setAttribute("class", "menuitem-iconic menuitem-iconic-tooltip");
    restartAMI.style.listStyleImage = "url('" + logo + "')";
    restartAMI.addEventListener("command", restart, true);
    appMenu.insertBefore(restartAMI, $("appmenu-quit"));
  }

  unload(function() {
    rrKeyset.parentNode.removeChild(rrKeyset);
    appMenu && appMenu.removeChild(restartAMI);
  }, win);
}

function install(){}
function uninstall(){}
function startup(data) AddonManager.getAddonByID(data.id, function(addon) {
  include(addon.getResourceURI("includes/l10n.js").spec);
  l10n(addon, "rr.properties");

  var prefs = PREF_BRANCH;
  include(addon.getResourceURI("includes/utils.js").spec);
  logo = addon.getResourceURI("images/refresh_16.png").spec;
  watchWindows(main);
  prefs = prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
  prefs.addObserver("", PREF_OBSERVER, false);
  unload(function() prefs.removeObserver("", PREF_OBSERVER));
});
function shutdown(data, reason) { if (reason !== APP_SHUTDOWN) unload(); }
