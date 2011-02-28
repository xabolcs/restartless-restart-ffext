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
 *
 * ***** END LICENSE BLOCK ***** */

var l10n = (function(global) {
  let splitter = /(\w+)-\w+/;
  
  dump('l10n begin\n');
  
  // get user's locale
  let locale = Cc["@mozilla.org/chrome/chrome-registry;1"]
      .getService(Ci.nsIXULChromeRegistry).getSelectedLocale("global");

  dump('l10n user locale is '+locale+'\n');
  
  function getStr(aStrBundle, aKey) {
    dump('l10n getStr: aKey='+aKey+'\n');
    if (!aStrBundle) return false;
    try {
      dump('l10n getStr: localized aKey='+aStrBundle.GetStringFromName(aKey)+'\n');
      return aStrBundle.GetStringFromName(aKey);
    } catch (e) { dump('l10n getStr return of '+aKey+' dies: '+e.message+'\n'); }
    return "";
  }

  return function(addon, filename, defaultLocale) {
    dump('l10n return begin\n');
    
    defaultLocale = defaultLocale || "en";
    function filepath(locale) addon
        .getResourceURI("locale/" + locale + "/" + filename).spec

    let defaultBundle = Services.strings.createBundle(filepath(locale));

    let defaultBasicBundle;
    let (locale_base = locale.match(splitter)) {
      if (locale_base) {
        defaultBasicBundle = Services.strings.createBundle(
            filepath(locale_base[1]));
      }
    }

    let addonsDefaultBundle =
        Services.strings.createBundle(filepath(defaultLocale));

    return global._ = function l10n_underscore(aKey, aLocale) {
      dump('l10n_underscore begin, locale: '+aLocale+'\n');
      
      let localeBundle, localeBasicBundle;
      if (aLocale) {
        localeBundle = Services.strings.createBundle(filepath(aLocale));

        let locale_base = aLocale.match(splitter)
        if (locale_base)
          localeBasicBundle = Services.strings.createBundle(
              filepath(locale_base[1]));
      }

      return getStr(localeBundle, aKey)
          || getStr(localeBasicBundle, aKey)
          || (defaultBundle && (getStr(defaultBundle, aKey) || (defaultBundle = null)))
          || (defaultBasicBundle && (getStr(defaultBasicBundle, aKey) || (defaultBasicBundle = null)))
          || getStr(addonsDefaultBundle, aKey);
    }
  }
})(this);
