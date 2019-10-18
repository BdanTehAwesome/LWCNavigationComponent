Webruntime.moduleRegistry.define('c/userApp', ['lwc', 'lightning/configProvider'], function (lwc, configProvider) { 'use strict';

    function stylesheet(hostSelector, shadowSelector, nativeShadow) {
      return "\n" + (nativeShadow ? (":host{background-color: white;}") : (hostSelector + "{background-color: white;}")) + "\n.background" + shadowSelector + "{background-color: white;}\n.slds-builder-header" + shadowSelector + " {position: relative;display: flex;height: 3.125rem;background: white;color: black;border-bottom: 1px solid #e2dfdf;}\n.slds-builder-header__nav-item.slds-builder-header__nav-item" + shadowSelector + "{border-left: 1px solid #e2dfdf;}\n.slds-builder-header__item.slds-builder-header__item" + shadowSelector + " {border-left: 1px solid #e2dfdf;}\n.slds-builder-header__item" + shadowSelector + "{border-left: none;}\n.tabSelected" + shadowSelector + "{color:red;border-style: solid;border-width: 5px;}\n.notSelected" + shadowSelector + "{colour:yellow;}\n";
    }
    var _implicitStylesheets = [stylesheet];

    function stylesheet$1(hostSelector, shadowSelector, nativeShadow) {
      return "\n" + (nativeShadow ? (":host {display: block;}") : (hostSelector + " {display: block;}")) + "\n";
    }
    var _implicitStylesheets$1 = [stylesheet$1];

    function stylesheet$2(hostSelector, shadowSelector, nativeShadow) {
      return "_:-ms-lang(x)" + shadowSelector + ", svg" + shadowSelector + " {pointer-events: none;}\n";
    }
    var _implicitStylesheets$2 = [stylesheet$2];

    function tmpl($api, $cmp, $slotset, $ctx) {
      const {
        fid: api_scoped_frag_id,
        h: api_element
      } = $api;
      return [api_element("svg", {
        className: $cmp.computedClass,
        attrs: {
          "focusable": "false",
          "data-key": $cmp.name,
          "aria-hidden": "true"
        },
        key: 2
      }, [api_element("use", {
        attrs: {
          "xlink:href": lwc.sanitizeAttribute("use", "http://www.w3.org/2000/svg", "xlink:href", api_scoped_frag_id($cmp.href))
        },
        key: 3
      }, [])])];
    }

    var _tmpl = lwc.registerTemplate(tmpl);
    tmpl.stylesheets = [];

    if (_implicitStylesheets$2) {
      tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitStylesheets$2);
    }
    tmpl.stylesheetTokens = {
      hostAttribute: "lightning-primitiveIcon_primitiveIcon-host",
      shadowAttribute: "lightning-primitiveIcon_primitiveIcon"
    };

    const proto = {
      add(className) {
        if (typeof className === 'string') {
          this[className] = true;
        } else {
          Object.assign(this, className);
        }

        return this;
      },

      invert() {
        Object.keys(this).forEach(key => {
          this[key] = !this[key];
        });
        return this;
      },

      toString() {
        return Object.keys(this).filter(key => this[key]).join(' ');
      }

    };
    function classSet(config) {
      if (typeof config === 'string') {
        const key = config;
        config = {};
        config[key] = true;
      }

      return Object.assign(Object.create(proto), config);
    }

    // NOTE: lightning-utils is a public library. adding new utils here means we

    /**
    An emitter implementation based on the Node.js EventEmitter API:
    https://nodejs.org/dist/latest-v6.x/docs/api/events.html#events_class_eventemitter
    **/

    /**
     * Create a deep copy of an object or array
     * @param {object|array} o - item to be copied
     * @returns {object|array} copy of the item
     */

    /**
     * Utility function to generate an unique guid.
     * used on state objects to provide a performance aid when iterating
     * through the items and marking them for render
     * @returns {String} an unique string ID
     */

    /**
    A string normalization utility for attributes.
    @param {String} value - The value to normalize.
    @param {Object} config - The optional configuration object.
    @param {String} [config.fallbackValue] - The optional fallback value to use if the given value is not provided or invalid. Defaults to an empty string.
    @param {Array} [config.validValues] - An optional array of valid values. Assumes all input is valid if not provided.
    @return {String} - The normalized value.
    **/
    function normalizeString(value, config = {}) {
      const {
        fallbackValue = '',
        validValues,
        toLowerCase = true
      } = config;
      let normalized = typeof value === 'string' && value.trim() || '';
      normalized = toLowerCase ? normalized.toLowerCase() : normalized;

      if (validValues && validValues.indexOf(normalized) === -1) {
        normalized = fallbackValue;
      }

      return normalized;
    }
    /**
    A boolean normalization utility for attributes.
    @param {Any} value - The value to normalize.
    @return {Boolean} - The normalized value.
    **/

    function normalizeBoolean(value) {
      return typeof value === 'string' || !!value;
    }

    const keyCodes = {
      tab: 9,
      backspace: 8,
      enter: 13,
      escape: 27,
      space: 32,
      pageup: 33,
      pagedown: 34,
      end: 35,
      home: 36,
      left: 37,
      up: 38,
      right: 39,
      down: 40,
      delete: 46,
      shift: 16
    };

    const isIE11 = isIE11Test(navigator);
    const isChrome = isChromeTest(navigator); // The following functions are for tests only

    function isIE11Test(navigator) {
      // https://stackoverflow.com/questions/17447373/how-can-i-target-only-internet-explorer-11-with-javascript
      return /Trident.*rv[ :]*11\./.test(navigator.userAgent);
    }
    function isChromeTest(navigator) {
      // https://stackoverflow.com/questions/4565112/javascript-how-to-find-out-if-the-user-browser-is-chrome
      return /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    }

    /**
     * Set an attribute on an element, if it's a normal element
     * it will use setAttribute, if it's an LWC component
     * it will use the public property
     *
     * @param {HTMLElement} element The element to act on
     * @param {String} attribute the attribute to set
     * @param {Any} value the value to set
     */

    // hide panel on scroll

    var _tmpl$1 = void 0;

    // Taken from https://github.com/jonathantneal/svg4everybody/pull/139
    // Remove this iframe-in-edge check once the following is resolved https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/8323875/
    const isEdgeUA = /\bEdge\/.(\d+)\b/.test(navigator.userAgent);
    const inIframe = window.top !== window.self;
    const isIframeInEdge = isEdgeUA && inIframe;
    var isIframeInEdge$1 = lwc.registerComponent(isIframeInEdge, {
      tmpl: _tmpl$1
    });

    // Taken from https://git.soma.salesforce.com/aura/lightning-global/blob/999dc35f948246181510df6e56f45ad4955032c2/src/main/components/lightning/SVGLibrary/stamper.js#L38-L60
    function fetchSvg(url) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.send();

        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            if (xhr.status === 200) {
              resolve(xhr.responseText);
            } else {
              reject(xhr);
            }
          }
        };
      });
    }

    // Which looks like it was inspired by https://github.com/jonathantneal/svg4everybody/blob/377d27208fcad3671ed466e9511556cb9c8b5bd8/lib/svg4everybody.js#L92-L107
    // Modify at your own risk!

    const newerIEUA = /\bTrident\/[567]\b|\bMSIE (?:9|10)\.0\b/;
    const webkitUA = /\bAppleWebKit\/(\d+)\b/;
    const olderEdgeUA = /\bEdge\/12\.(\d+)\b/;
    const isIE = newerIEUA.test(navigator.userAgent) || (navigator.userAgent.match(olderEdgeUA) || [])[1] < 10547 || (navigator.userAgent.match(webkitUA) || [])[1] < 537;
    const supportsSvg = !isIE && !isIframeInEdge$1;
    var supportsSvg$1 = lwc.registerComponent(supportsSvg, {
      tmpl: _tmpl$1
    });

    /**
    This polyfill injects SVG sprites into the document for clients that don't
    fully support SVG. We do this globally at the document level for performance
    reasons. This causes us to lose namespacing of IDs across sprites. For example,
    if both #image from utility sprite and #image from doctype sprite need to be
    rendered on the page, both end up as #image from the doctype sprite (last one
    wins). SLDS cannot change their image IDs due to backwards-compatibility
    reasons so we take care of this issue at runtime by adding namespacing as we
    polyfill SVG elements.

    For example, given "/assets/icons/action-sprite/svg/symbols.svg#approval", we
    replace the "#approval" id with "#${namespace}-approval" and a similar
    operation is done on the corresponding symbol element.
    **/
    const svgTagName = /svg/i;

    const isSvgElement = el => el && svgTagName.test(el.nodeName);

    const requestCache = {};
    const symbolEls = {};
    const svgFragments = {};
    const spritesContainerId = 'slds-svg-sprites';
    let spritesEl;
    function polyfill(el) {
      if (!supportsSvg$1 && isSvgElement(el)) {
        if (!spritesEl) {
          spritesEl = document.createElement('svg');
          spritesEl.xmlns = 'http://www.w3.org/2000/svg';
          spritesEl['xmlns:xlink'] = 'http://www.w3.org/1999/xlink';
          spritesEl.style.display = 'none';
          spritesEl.id = spritesContainerId;
          document.body.insertBefore(spritesEl, document.body.childNodes[0]);
        }

        Array.from(el.getElementsByTagName('use')).forEach(use => {
          // We access the href differently in raptor and in aura, probably
          // due to difference in the way the svg is constructed.
          const src = use.getAttribute('xlink:href') || use.getAttribute('href');

          if (src) {
            // "/assets/icons/action-sprite/svg/symbols.svg#approval" =>
            // ["/assets/icons/action-sprite/svg/symbols.svg", "approval"]
            const parts = src.split('#');
            const url = parts[0];
            const id = parts[1];
            const namespace = url.replace(/[^\w]/g, '-');
            const href = `#${namespace}-${id}`;

            if (url.length) {
              // set the HREF value to no longer be an external reference
              if (use.getAttribute('xlink:href')) {
                use.setAttribute('xlink:href', href);
              } else {
                use.setAttribute('href', href);
              } // only insert SVG content if it hasn't already been retrieved


              if (!requestCache[url]) {
                requestCache[url] = fetchSvg(url);
              }

              requestCache[url].then(svgContent => {
                // create a document fragment from the svgContent returned (is parsed by HTML parser)
                if (!svgFragments[url]) {
                  const svgFragment = document.createRange().createContextualFragment(svgContent);
                  svgFragments[url] = svgFragment;
                }

                if (!symbolEls[href]) {
                  const svgFragment = svgFragments[url];
                  const symbolEl = svgFragment.querySelector(`#${id}`);
                  symbolEls[href] = true;
                  symbolEl.id = `${namespace}-${id}`;
                  spritesEl.appendChild(symbolEl);
                }
              });
            }
          }
        });
      }
    }

    const validNameRe = /^([a-zA-Z]+):([a-zA-Z]\w*)$/;
    let pathPrefix;
    const tokenNameMap = Object.assign(Object.create(null), {
      action: 'lightning.actionSprite',
      custom: 'lightning.customSprite',
      doctype: 'lightning.doctypeSprite',
      standard: 'lightning.standardSprite',
      utility: 'lightning.utilitySprite'
    });
    const tokenNameMapRtl = Object.assign(Object.create(null), {
      action: 'lightning.actionSpriteRtl',
      custom: 'lightning.customSpriteRtl',
      doctype: 'lightning.doctypeSpriteRtl',
      standard: 'lightning.standardSpriteRtl',
      utility: 'lightning.utilitySpriteRtl'
    });
    const defaultTokenValueMap = Object.assign(Object.create(null), {
      'lightning.actionSprite': '/assets/icons/action-sprite/svg/symbols.svg',
      'lightning.actionSpriteRtl': '/assets/icons/action-sprite/svg/symbols.svg',
      'lightning.customSprite': '/assets/icons/custom-sprite/svg/symbols.svg',
      'lightning.customSpriteRtl': '/assets/icons/custom-sprite/svg/symbols.svg',
      'lightning.doctypeSprite': '/assets/icons/doctype-sprite/svg/symbols.svg',
      'lightning.doctypeSpriteRtl': '/assets/icons/doctype-sprite/svg/symbols.svg',
      'lightning.standardSprite': '/assets/icons/standard-sprite/svg/symbols.svg',
      'lightning.standardSpriteRtl': '/assets/icons/standard-sprite/svg/symbols.svg',
      'lightning.utilitySprite': '/assets/icons/utility-sprite/svg/symbols.svg',
      'lightning.utilitySpriteRtl': '/assets/icons/utility-sprite/svg/symbols.svg'
    });

    const getDefaultBaseIconPath = (category, nameMap) => defaultTokenValueMap[nameMap[category]];

    const getBaseIconPath = (category, direction) => {
      const nameMap = direction === 'rtl' ? tokenNameMapRtl : tokenNameMap;
      return configProvider.getToken(nameMap[category]) || getDefaultBaseIconPath(category, nameMap);
    };

    const getMatchAtIndex = index => iconName => {
      const result = validNameRe.exec(iconName);
      return result ? result[index] : '';
    };

    const getCategory = getMatchAtIndex(1);
    const getName = getMatchAtIndex(2);
    const isValidName = iconName => validNameRe.test(iconName);
    const getIconPath = (iconName, direction = 'ltr') => {
      pathPrefix = pathPrefix !== undefined ? pathPrefix : configProvider.getPathPrefix();

      if (isValidName(iconName)) {
        const baseIconPath = getBaseIconPath(getCategory(iconName), direction);

        if (baseIconPath) {
          // This check was introduced the following MS-Edge issue:
          // https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/9655192/
          // If and when this get fixed, we can safely remove this block of code.
          if (isIframeInEdge$1) {
            // protocol => 'https:' or 'http:'
            // host => hostname + port
            const origin = `${window.location.protocol}//${window.location.host}`;
            return `${origin}${pathPrefix}${baseIconPath}#${getName(iconName)}`;
          }

          return `${pathPrefix}${baseIconPath}#${getName(iconName)}`;
        }
      }

      return '';
    };

    const isSafari = window.safari && window.safari.pushNotification && window.safari.pushNotification.toString() === '[object SafariRemoteNotification]'; // [W-3421985] https://bugs.webkit.org/show_bug.cgi?id=162866
    // https://git.soma.salesforce.com/aura/lightning-global/blob/82e8bfd02846fa7e6b3e7549a64be95b619c4b1f/src/main/components/lightning/primitiveIcon/primitiveIconHelper.js#L53-L56

    function safariA11yPatch(svgElement) {
      if (!svgElement || !isSafari) {
        return;
      } // In case we're dealing with a proxied element.


      svgElement = lwc.unwrap(svgElement);
      const use = svgElement.querySelector('use');

      if (!use) {
        return;
      }

      svgElement.insertBefore(document.createTextNode('\n'), use); // If use.nextSibling is null, the text node is added to the end of
      // the list of children of the SVG element.
      // https://developer.mozilla.org/en-US/docs/Web/API/Node/insertBefore

      svgElement.insertBefore(document.createTextNode('\n'), use.nextSibling);
    }

    class LightningPrimitiveIcon extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.iconName = void 0;
        this.src = void 0;
        this.svgClass = void 0;
        this.size = 'medium';
        this.variant = void 0;
        this.privateIconSvgTemplates = configProvider.getIconSvgTemplates();
      }

      get inlineSvgProvided() {
        return !!this.privateIconSvgTemplates;
      }

      renderedCallback() {
        if (this.iconName !== this.prevIconName && !this.inlineSvgProvided) {
          this.prevIconName = this.iconName;
          const svgElement = this.template.querySelector('svg');
          polyfill(svgElement);
          safariA11yPatch(svgElement);
        }
      }

      get href() {
        return this.src || getIconPath(this.iconName, configProvider.getLocale && configProvider.getLocale().dir);
      }

      get name() {
        return getName(this.iconName);
      }

      get normalizedSize() {
        return normalizeString(this.size, {
          fallbackValue: 'medium',
          validValues: ['xx-small', 'x-small', 'small', 'medium', 'large']
        });
      }

      get normalizedVariant() {
        // NOTE: Leaving a note here because I just wasted a bunch of time
        // investigating why both 'bare' and 'inverse' are supported in
        // lightning-primitive-icon. lightning-icon also has a deprecated
        // 'bare', but that one is synonymous to 'inverse'. This 'bare' means
        // that no classes should be applied. So this component needs to
        // support both 'bare' and 'inverse' while lightning-icon only needs to
        // support 'inverse'.
        return normalizeString(this.variant, {
          fallbackValue: '',
          validValues: ['bare', 'error', 'inverse', 'warning', 'success']
        });
      }

      get computedClass() {
        const {
          normalizedSize,
          normalizedVariant
        } = this;
        const classes = classSet(this.svgClass);

        if (normalizedVariant !== 'bare') {
          classes.add('slds-icon');
        }

        switch (normalizedVariant) {
          case 'error':
            classes.add('slds-icon-text-error');
            break;

          case 'warning':
            classes.add('slds-icon-text-warning');
            break;

          case 'success':
            classes.add('slds-icon-text-success');
            break;

          case 'inverse':
          case 'bare':
            break;

          default:
            // if custom icon is set, we don't want to set
            // the text-default class
            if (!this.src) {
              classes.add('slds-icon-text-default');
            }

        }

        if (normalizedSize !== 'medium') {
          classes.add(`slds-icon_${normalizedSize}`);
        }

        return classes.toString();
      }

      resolveTemplate() {
        const name = this.iconName;

        if (isValidName(name)) {
          const [spriteName, iconName] = name.split(':');
          const template = this.privateIconSvgTemplates[`${spriteName}_${iconName}`];

          if (template) {
            return template;
          }
        }

        return _tmpl;
      }

      render() {
        if (this.inlineSvgProvided) {
          return this.resolveTemplate();
        }

        return _tmpl;
      }

    }

    lwc.registerDecorators(LightningPrimitiveIcon, {
      publicProps: {
        iconName: {
          config: 0
        },
        src: {
          config: 0
        },
        svgClass: {
          config: 0
        },
        size: {
          config: 0
        },
        variant: {
          config: 0
        }
      }
    });

    var _lightningPrimitiveIcon = lwc.registerComponent(LightningPrimitiveIcon, {
      tmpl: _tmpl
    });

    function tmpl$1($api, $cmp, $slotset, $ctx) {
      const {
        c: api_custom_element,
        t: api_text,
        h: api_element,
        d: api_dynamic,
        ti: api_tab_index,
        b: api_bind
      } = $api;
      const {
        _m0,
        _m1,
        _m2,
        _m3
      } = $ctx;
      return [api_element("a", {
        attrs: {
          "href": $cmp.computedHref,
          "role": $cmp.computedRole,
          "tabindex": api_tab_index($cmp.computedTabIndex),
          "accesskey": $cmp.computedAccessKey,
          "aria-checked": $cmp.computedAriaChecked,
          "aria-disabled": $cmp.computedAriaDisabled
        },
        key: 2,
        on: {
          "click": _m0 || ($ctx._m0 = api_bind($cmp.handleClick)),
          "focus": _m1 || ($ctx._m1 = api_bind($cmp.handleFocus)),
          "keydown": _m2 || ($ctx._m2 = api_bind($cmp.handleKeyDown)),
          "blur": _m3 || ($ctx._m3 = api_bind($cmp.handleBlur))
        }
      }, [api_element("span", {
        classMap: {
          "slds-truncate": true
        },
        key: 3
      }, [$cmp.isMenuItemCheckbox ? api_custom_element("lightning-primitive-icon", _lightningPrimitiveIcon, {
        props: {
          "iconName": "utility:check",
          "size": "x-small",
          "svgClass": $cmp.computedCheckedIconClass,
          "variant": "bare"
        },
        key: 5
      }, []) : null, $cmp.isDraft ? api_element("abbr", {
        classMap: {
          "slds-indicator_unsaved": true
        },
        attrs: {
          "title": $cmp.draftAlternativeText
        },
        key: 6
      }, [api_text("*")]) : null, $cmp.prefixIconName ? api_custom_element("lightning-primitive-icon", _lightningPrimitiveIcon, {
        props: {
          "iconName": $cmp.prefixIconName,
          "size": "x-small",
          "svgClass": "slds-icon slds-icon_x-small slds-icon-text-default slds-m-right_x-small",
          "variant": "bare"
        },
        key: 8
      }, []) : null, api_dynamic($cmp.label)]), $cmp.iconName ? api_custom_element("lightning-primitive-icon", _lightningPrimitiveIcon, {
        props: {
          "iconName": $cmp.iconName,
          "size": "x-small",
          "svgClass": "slds-icon-text-default slds-m-left_small slds-shrink-none",
          "variant": "bare"
        },
        key: 10
      }, []) : null])];
    }

    var _tmpl$2 = lwc.registerTemplate(tmpl$1);
    tmpl$1.stylesheets = [];

    if (_implicitStylesheets$1) {
      tmpl$1.stylesheets.push.apply(tmpl$1.stylesheets, _implicitStylesheets$1);
    }
    tmpl$1.stylesheetTokens = {
      hostAttribute: "lightning-menuItem_menuItem-host",
      shadowAttribute: "lightning-menuItem_menuItem"
    };

    /**
     * Represents a list item in a menu.
     */

    class LightningMenuItem extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.value = void 0;
        this.label = void 0;
        this.iconName = void 0;
        this._accesskey = null;
        this._disabled = false;
        this._tabindex = '-1';
        this._checked = undefined;
        this._isDraft = false;
        this.prefixIconName = void 0;
        this.href = void 0;
        this.draftAlternativeText = void 0;
      }

      connectedCallback() {
        this.classList.add('slds-dropdown__item');
        this.setAttribute('role', 'presentation');
      }
      /**
       * If present, a draft indicator is shown on the menu item.
       * A draft indicator is denoted by blue asterisk on the left of the menu item.
       * When you use a draft indicator, include alternative text for accessibility using draft-alternative-text.
       * @type {boolean}
       * @default false
       */


      get isDraft() {
        return this._isDraft;
      }

      set isDraft(value) {
        this._isDraft = normalizeBoolean(value);
      }
      /**
       * The keyboard shortcut for the menu item.
       * @type {string}
       */


      get accessKey() {
        return this._accesskey;
      }

      set accessKey(newValue) {
        this._accesskey = newValue;
        this.handleAccessKeyChange(newValue);
      }
      /**
       * Reserved for internal use. Use tabindex instead to indicate if an element should be focusable.
       * tabindex can be set to 0 or -1.
       * The default tabindex value is 0, which means that the menu item is focusable and
       * participates in sequential keyboard navigation. The value -1 means
       * that the menu item is focusable but does not participate in keyboard navigation.
       * @type {number}
       */


      get tabIndex() {
        return this._tabindex;
      }

      set tabIndex(newValue) {
        this._tabindex = newValue;
        this.handleTabIndexChange(newValue);
      }

      handleAccessKeyChange(value) {
        this._accesskey = value;
      }

      handleTabIndexChange(value) {
        this._tabindex = value;
      }

      get computedAccessKey() {
        return this._accesskey;
      }

      get computedTabIndex() {
        return this._tabindex;
      }
      /**
       * If present, the menu item is disabled and users cannot interact with it.
       * @type {boolean}
       * @default false
       */


      get disabled() {
        return this._disabled;
      }

      set disabled(value) {
        this._disabled = normalizeBoolean(value);
      }
      /**
       * If present, a check mark displays on the left of the menu item if it's selected.
       * @type {boolean}
       * @default false
       */


      get checked() {
        return this._checked;
      }

      set checked(value) {
        if (typeof value === 'string') {
          // handle string
          value = normalizeString(value, {
            fallbackValue: undefined,
            validValues: ['true', 'false']
          });

          if (value !== undefined) {
            value = value === 'true';
          }
        }

        if (value !== undefined) {
          // handle boolean which is from above or user
          value = normalizeBoolean(value);
        }

        this._checked = value;
        this.classList.toggle('slds-is-selected', this.checked === true);
      }

      get computedCheckedIconClass() {
        // note that what .slds-icon_selected does is to hide the checked icon
        return classSet('slds-icon slds-icon_x-small slds-icon-text-default slds-m-right_x-small').add({
          'slds-icon_selected': !this.checked
        }).toString();
      }

      get computedHref() {
        // eslint-disable-next-line no-script-url
        return this.href ? this.href : 'javascript:void(0)';
      }

      get computedAriaChecked() {
        return this.isMenuItemCheckbox ? this.checked + '' : null;
      }

      get computedAriaDisabled() {
        // Note: Needed to explicitly set aria-disabled="true"
        return this.disabled ? 'true' : 'false';
      }

      get isMenuItemCheckbox() {
        return this.checked !== undefined;
      }

      get computedRole() {
        return this.isMenuItemCheckbox ? 'menuitemcheckbox' : 'menuitem';
      }

      handleBlur() {
        this.dispatchEvent(new CustomEvent('blur')); // we need to trigger a private blur to make it bubble and be handled by parent button-menu

        this.dispatchEvent(new CustomEvent('privateblur', {
          composed: true,
          bubbles: true,
          cancelable: true
        }));
      }

      handleFocus() {
        // trigger a private focus to make it bubble and be handled by parent button-menu
        // this is used for resetting cancelBlur in button-menu
        this.dispatchEvent(new CustomEvent('privatefocus', {
          bubbles: true,
          cancelable: true
        }));
      }

      handleClick(event) {
        // no action needed when item is disabled
        if (this.disabled) {
          event.preventDefault(); // do nothing and return

          return;
        } // allow HREF to be followed


        if (this.href) ; else {
          event.preventDefault();
          this.dispatchSelect();
        }
      }

      handleKeyDown(event) {
        // no action needed when item is disabled
        if (this.disabled) {
          // do nothing and return
          return;
        }

        if (event.keyCode === keyCodes.space) {
          // follow HREF if a value was provided
          if (this.href) {
            // trigger click behavior
            this.template.querySelector('a').click();
          } else {
            // if no HREF is provided follow usual select behavior
            this.dispatchSelect();
          }
        }
      }
      /**
       *
       * The select event is a non-navigational event.
       * The purpose of the event is to toggle the selected state of a menu item.
       * It will not be dispatched if a menu item has an HREF value to navigate to (other than the default).
       * This event will be handled by the parent button-menu component.
       *
       **/


      dispatchSelect() {
        if (!this.disabled) {
          this.dispatchEvent(new CustomEvent('privateselect', {
            composed: true,
            bubbles: true,
            cancelable: true,
            detail: {
              value: lwc.unwrap(this.value)
            }
          }));
        }
      }
      /**
       * Sets focus on the anchor element in the menu item.
       */


      focus() {
        // set the focus on the anchor element
        this.template.querySelector('a').focus(); // dispatch a focus event for the menu item component

        this.dispatchEvent(new CustomEvent('focus'));
      }

    }

    lwc.registerDecorators(LightningMenuItem, {
      publicProps: {
        value: {
          config: 0
        },
        label: {
          config: 0
        },
        iconName: {
          config: 0
        },
        prefixIconName: {
          config: 0
        },
        href: {
          config: 0
        },
        draftAlternativeText: {
          config: 0
        },
        isDraft: {
          config: 3
        },
        accessKey: {
          config: 3
        },
        tabIndex: {
          config: 3
        },
        disabled: {
          config: 3
        },
        checked: {
          config: 3
        }
      },
      publicMethods: ["focus"],
      track: {
        _accesskey: 1,
        _disabled: 1,
        _tabindex: 1,
        _checked: 1,
        _isDraft: 1
      }
    });

    var _lightningMenuItem = lwc.registerComponent(LightningMenuItem, {
      tmpl: _tmpl$2
    });

    function tmpl$2($api, $cmp, $slotset, $ctx) {
      const {
        b: api_bind,
        c: api_custom_element,
        h: api_element,
        s: api_slot
      } = $api;
      const {
        _m0,
        _m1,
        _m2
      } = $ctx;
      return [api_element("div", {
        classMap: {
          "background": true
        },
        key: 2
      }, [api_element("div", {
        classMap: {
          "slds-m-top_medium": true
        },
        key: 3
      }, [api_element("div", {
        key: 4
      }, [api_element("div", {
        key: 5
      }, [api_element("header", {
        classMap: {
          "slds-builder-header": true
        },
        key: 6
      }, [api_element("nav", {
        classMap: {
          "slds-builder-header__item": true,
          "slds-builder-header__nav": true
        },
        key: 7
      }, [api_custom_element("lightning-menu-item", _lightningMenuItem, {
        className: $cmp.selectedTab.compInf,
        props: {
          "label": "Company Info",
          "title": "company"
        },
        key: 8,
        on: {
          "click": _m0 || ($ctx._m0 = api_bind($cmp.clickEvent))
        }
      }, []), api_custom_element("lightning-menu-item", _lightningMenuItem, {
        className: $cmp.selectedTab.billInf,
        props: {
          "label": "Billing Info",
          "title": "billing"
        },
        key: 9,
        on: {
          "click": _m1 || ($ctx._m1 = api_bind($cmp.clickEvent))
        }
      }, []), api_custom_element("lightning-menu-item", _lightningMenuItem, {
        className: $cmp.selectedTab.empInf,
        props: {
          "label": "Employee Info",
          "title": "employee"
        },
        key: 10,
        on: {
          "click": _m2 || ($ctx._m2 = api_bind($cmp.clickEvent))
        }
      }, [])])])])])]), api_element("div", {
        key: 11
      }, [api_slot("", {
        key: 12
      }, [], $slotset)])])];
    }

    var _tmpl$3 = lwc.registerTemplate(tmpl$2);
    tmpl$2.slots = [""];
    tmpl$2.stylesheets = [];

    if (_implicitStylesheets) {
      tmpl$2.stylesheets.push.apply(tmpl$2.stylesheets, _implicitStylesheets);
    }
    tmpl$2.stylesheetTokens = {
      hostAttribute: "lwc-navComponent_navComponent-host",
      shadowAttribute: "lwc-navComponent_navComponent"
    };

    const routerEvent = [];
    const roots = [];
    const allRoute = [];
    const rootHistory = {};
    const historyPayload = {};
    const globalVars = {
      isLoaded: false
    };

    const registerListener = (eventName, callback, thisArg, rootArg) => {
      if (!routerEvent[eventName]) {
        routerEvent[eventName] = [];
      }

      const duplicate = routerEvent[eventName].find(listener => {
        return listener.callback === callback && listener.thisArg === thisArg;
      });

      if (!duplicate) {
        routerEvent[eventName].push({
          callback,
          thisArg,
          rootArg
        });
      }
    };

    const unregisterAllListeners = thisArg => {
      Object.keys(routerEvent).forEach(eventName => {
        routerEvent[eventName] = routerEvent[eventName].filter(listener => listener.thisArg !== thisArg);
      });
    };

    const backToUrl = (listeners, payload) => {
      if (rootHistory[payload.root]) {
        rootHistory[payload.root].pop();

        if (rootHistory[payload.root].lenght !== 0) {
          let backPayload2 = rootHistory[payload.root].pop();
          listeners.forEach(listener => {
            if (payload.root === listener.rootArg) {
              try {
                rootHistory[payload.root].push(JSON.parse(JSON.stringify(backPayload2)));
                listener.callback.call(listener.thisArg, backPayload2);
              } catch (error) {// fail silently
              }
            }
          });
        }
      } else {
        throw new Error('No root found for ' + payload.to);
      }
    };

    const refreshUrl = (listeners, payload) => {
      if (rootHistory[payload.root]) {
        let latestPayload = rootHistory[payload.root][rootHistory[payload.root].length - 1];
        listeners.forEach(listener => {
          if (payload.root === listener.rootArg) {
            try {
              if (payload.payload) {
                latestPayload.payload = payload.payload;
              }

              listener.callback.call(listener.thisArg, latestPayload);
            } catch (error) {// fail silently
            }
          }
        });
      } else {
        throw new Error('No root found for ' + payload.to);
      }
    };

    const navigateToUrl = (listeners, payload) => {
      if (allRoute[payload.to]) {
        const root = allRoute[payload.to];
        listeners.forEach(listener => {
          if (root === listener.rootArg) {
            try {
              rootHistory[root].push(JSON.parse(JSON.stringify(payload)));
              listener.callback.call(listener.thisArg, payload);
            } catch (error) {// fail silently
            }
          }
        });
      } else {
        throw new Error('No route found for ' + payload.to);
      }
    };

    const fireEvent = (eventName, payload) => {
      try {
        if (routerEvent[eventName]) {
          const listeners = routerEvent[eventName];
          if (eventName === "navigateTo") navigateToUrl(listeners, payload);else if (eventName === "back") backToUrl(listeners, payload);else if (eventName === "refreshUrl") refreshUrl(listeners, payload);
        } else {
          throw new Error('No event forund for ' + eventName);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e, e.stack);
      }
    };

    const registerRouter = (rootName, routes) => {
      try {
        if (roots[rootName]) {
          throw new Error('Duplicate router found ' + rootName + '. Please ensure that router cannot be duplicate');
        }

        roots[rootName] = '';
        rootHistory[rootName] = [];
        routes.forEach(route => {
          var fullpath = rootName === '/' ? route : rootName === route ? rootName : rootName + route;

          if (allRoute[fullpath]) {
            throw new Error('Duplicate router found ' + rootName + route + '. Please ensure that router cannot be duplicate');
          }

          allRoute[fullpath] = rootName;
        });

        window.onhashchange = () => {
          onhashchange();
        };
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e, e.stack);
      }
    };

    const setRouteToURL = detail => {
      let payload = JSON.parse(JSON.stringify(detail));
      location.hash = "#page=" + payload.to;
      historyPayload["#page=" + payload.to] = payload;
      localStorage.setItem('history', JSON.stringify(historyPayload));
    };

    const getRouteFromURL = root => {
      let toReturn = '';

      if (location.hash) {
        let path = location.hash.replace("#page=", "");

        if (path && allRoute[path] && allRoute[path] === root) {
          toReturn = path;
        }
      }

      return toReturn;
    };

    const windowPopState = () => {
      if (localStorage.getItem('history')) {
        let historyPayload2 = JSON.parse(localStorage.getItem('history'));

        if (historyPayload2) {
          let payload = historyPayload2[location.hash];

          if (payload) {
            payload.doNotAddInURL = true;

            if (payload.to) {
              fireEvent('navigateTo', payload);
            }
          }
        }
      }
    };

    const initilizeRouter = () => {
      if (!globalVars.isLoaded) {
        globalVars.isLoaded = true;
        window.addEventListener('popstate', windowPopState);
      }
    };

    class Home extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.selectedTab = {
          compInf: "tabSelected",
          billInf: "notSelected",
          empInf: "notSelected"
        };
        this.currentComponent = "";
      }

      clickEvent(event) {
        var currentcomponent = event.target.title;

        if (currentcomponent === 'company') {
          this.selectedTab.compInf = "tabSelected";
          this.selectedTab.billInf = "notSelected";
          this.selectedTab.empInf = "notSelected";
          this.to = "/companyInfo";
        } else if (currentcomponent === 'billing') {
          this.selectedTab.compInf = "notSelected";
          this.selectedTab.billInf = "tabSelected";
          this.selectedTab.empInf = "notSelected";
          this.to = "/billingInfo";
        } else if (currentcomponent === 'employee') {
          this.selectedTab.compInf = "notSelected";
          this.selectedTab.billInf = "notSelected";
          this.selectedTab.empInf = "tabSelected";
          this.to = "/employeeInfo";
        }

        event.preventDefault();

        try {
          if (!this.to) {
            throw new Error('To attribute is mandetory for navigate');
          }

          this.className = "colourred";
          fireEvent('navigateTo', {
            to: this.to,
            payload: this.payload
          });
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(error, error.stack);
        }

        event.stopPropagation();
      }

    }

    lwc.registerDecorators(Home, {
      track: {
        selectedTab: 1,
        currentComponent: 1
      }
    });

    var _cNavComponent = lwc.registerComponent(Home, {
      tmpl: _tmpl$3
    });

    function tmpl$3($api, $cmp, $slotset, $ctx) {
      const {
        s: api_slot
      } = $api;
      return [api_slot("", {
        key: 2
      }, [], $slotset)];
    }

    var _tmpl$4 = lwc.registerTemplate(tmpl$3);
    tmpl$3.slots = [""];
    tmpl$3.stylesheets = [];
    tmpl$3.stylesheetTokens = {
      hostAttribute: "lwc-router_router-host",
      shadowAttribute: "lwc-router_router"
    };

    class Router extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.payload = {};
        this.root = '';
        this.default = '';
      }

      connectedCallback() {
        try {
          if (!this.root) {
            throw new Error('root is the mandetory attribute for the Router.');
          }

          registerListener("navigateTo", this.navigateToUrl, this, this.root);
          registerListener("back", this.navigateToUrl, this, this.root);
          registerListener("refreshUrl", this.refreshUrl, this, this.root);
          initilizeRouter(); // eslint-disable-next-line @lwc/lwc/no-async-operation

          setTimeout(() => {
            registerRouter(this.root, this.getChildRoute());

            if (parent.location.hash) {
              this.default = getRouteFromURL(this.root);
            }

            if (!this.default) this.default = this.root;
            fireEvent('navigateTo', {
              to: this.default,
              payload: this.payload,
              doNotAddInURL: true
            });
          });
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error(e, e.stack);
        }
      }

      refreshUrl(detail) {
        try {
          this.setCurrentPath('');
          this.navigateToUrl(detail);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error(e, e.stack);
        }
      }

      navigateToUrl(detail) {
        try {
          if (!detail.doNotAddInURL) {
            detail.root = this.root;
            setRouteToURL(detail);
          }

          this.setPayload(detail.payload);
          this.setCurrentPath(detail.to);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error(e, e.stack);
        }
      }

      setPayload(payload) {
        const selectedEvent = new CustomEvent('payloadchange', {
          detail: payload
        });
        this.dispatchEvent(selectedEvent);
      }

      setCurrentPath(currentPath) {
        const allRoutes = this.querySelectorAll("c-route");
        var path = this.root === '/' ? currentPath : currentPath === this.root ? currentPath : currentPath.replace(this.root, '');
        allRoutes.forEach(element => {
          element.setCurrentPath(path);
        });
      }

      getChildRoute() {
        let routes = [];
        const allRoutes = this.querySelectorAll("c-route");
        allRoutes.forEach(element => {
          routes.push(element.getPath());
        });
        return routes;
      }

      disconnectedCallback() {
        unregisterAllListeners(this);
        window.removeEventListener('popstate');
      }

    }

    lwc.registerDecorators(Router, {
      publicProps: {
        payload: {
          config: 0
        },
        root: {
          config: 0
        },
        "default": {
          config: 0
        }
      }
    });

    var _cRouter = lwc.registerComponent(Router, {
      tmpl: _tmpl$4
    });

    function tmpl$4($api, $cmp, $slotset, $ctx) {
      const {
        s: api_slot
      } = $api;
      return [$cmp.hasCurrentPath ? api_slot("", {
        key: 3
      }, [], $slotset) : null];
    }

    var _tmpl$5 = lwc.registerTemplate(tmpl$4);
    tmpl$4.slots = [""];
    tmpl$4.stylesheets = [];
    tmpl$4.stylesheetTokens = {
      hostAttribute: "lwc-route_route-host",
      shadowAttribute: "lwc-route_route"
    };

    class Route extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.path = '';
        this.currentPath = null;
      }

      get hasCurrentPath() {
        return this.path === this.currentPath;
      }

      setCurrentPath(value) {
        this.currentPath = value;
      }

      getPath() {
        return this.path;
      }

    }

    lwc.registerDecorators(Route, {
      publicProps: {
        path: {
          config: 0
        },
        currentPath: {
          config: 0
        }
      },
      publicMethods: ["setCurrentPath", "getPath"]
    });

    var _cRoute = lwc.registerComponent(Route, {
      tmpl: _tmpl$5
    });

    function stylesheet$3(hostSelector, shadowSelector, nativeShadow) {
      return ".slds-align_absolute-center" + shadowSelector + "{padding: 2rem;font-size: 2rem;}\n";
    }
    var _implicitStylesheets$3 = [stylesheet$3];

    function tmpl$5($api, $cmp, $slotset, $ctx) {
      const {
        t: api_text,
        h: api_element
      } = $api;
      return [api_element("div", {
        classMap: {
          "slds-align_absolute-center": true
        },
        key: 2
      }, [api_text("Company Info")])];
    }

    var _tmpl$6 = lwc.registerTemplate(tmpl$5);
    tmpl$5.stylesheets = [];

    if (_implicitStylesheets$3) {
      tmpl$5.stylesheets.push.apply(tmpl$5.stylesheets, _implicitStylesheets$3);
    }
    tmpl$5.stylesheetTokens = {
      hostAttribute: "lwc-companyInfo_companyInfo-host",
      shadowAttribute: "lwc-companyInfo_companyInfo"
    };

    class CompanyInfo extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.payload = {};
      }

    }

    lwc.registerDecorators(CompanyInfo, {
      publicProps: {
        payload: {
          config: 0
        }
      }
    });

    var _cCompanyInfo = lwc.registerComponent(CompanyInfo, {
      tmpl: _tmpl$6
    });

    function stylesheet$4(hostSelector, shadowSelector, nativeShadow) {
      return ".slds-align_absolute-center" + shadowSelector + "{padding: 2rem;font-size: 2rem;}\n";
    }
    var _implicitStylesheets$4 = [stylesheet$4];

    function tmpl$6($api, $cmp, $slotset, $ctx) {
      const {
        t: api_text,
        h: api_element
      } = $api;
      return [api_element("div", {
        classMap: {
          "slds-align_absolute-center": true
        },
        key: 2
      }, [api_text("Billing Info")])];
    }

    var _tmpl$7 = lwc.registerTemplate(tmpl$6);
    tmpl$6.stylesheets = [];

    if (_implicitStylesheets$4) {
      tmpl$6.stylesheets.push.apply(tmpl$6.stylesheets, _implicitStylesheets$4);
    }
    tmpl$6.stylesheetTokens = {
      hostAttribute: "lwc-billingInfo_billingInfo-host",
      shadowAttribute: "lwc-billingInfo_billingInfo"
    };

    class BillingInfo extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.payload = {};
      }

    }

    lwc.registerDecorators(BillingInfo, {
      publicProps: {
        payload: {
          config: 0
        }
      }
    });

    var _cBillingInfo = lwc.registerComponent(BillingInfo, {
      tmpl: _tmpl$7
    });

    function stylesheet$5(hostSelector, shadowSelector, nativeShadow) {
      return ".slds-align_absolute-center" + shadowSelector + "{padding: 2rem;font-size: 2rem;}\n";
    }
    var _implicitStylesheets$5 = [stylesheet$5];

    function tmpl$7($api, $cmp, $slotset, $ctx) {
      const {
        t: api_text,
        h: api_element
      } = $api;
      return [api_element("div", {
        classMap: {
          "slds-align_absolute-center": true
        },
        key: 2
      }, [api_text("Employee Info")])];
    }

    var _tmpl$8 = lwc.registerTemplate(tmpl$7);
    tmpl$7.stylesheets = [];

    if (_implicitStylesheets$5) {
      tmpl$7.stylesheets.push.apply(tmpl$7.stylesheets, _implicitStylesheets$5);
    }
    tmpl$7.stylesheetTokens = {
      hostAttribute: "lwc-employeeInfo_employeeInfo-host",
      shadowAttribute: "lwc-employeeInfo_employeeInfo"
    };

    class Profile extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.payload = {};
      }

    }

    lwc.registerDecorators(Profile, {
      publicProps: {
        payload: {
          config: 0
        }
      }
    });

    var _cEmployeeInfo = lwc.registerComponent(Profile, {
      tmpl: _tmpl$8
    });

    function tmpl$8($api, $cmp, $slotset, $ctx) {
      const {
        c: api_custom_element,
        b: api_bind
      } = $api;
      const {
        _m0
      } = $ctx;
      return [api_custom_element("c-nav-component", _cNavComponent, {
        key: 2
      }, [api_custom_element("c-router", _cRouter, {
        props: {
          "root": "/"
        },
        key: 3,
        on: {
          "payloadchange": _m0 || ($ctx._m0 = api_bind($cmp.handelPayloadChange))
        }
      }, [api_custom_element("c-route", _cRoute, {
        props: {
          "path": "/"
        },
        key: 4
      }, [api_custom_element("c-nav-component", _cNavComponent, {
        props: {
          "payload": $cmp.payload
        },
        key: 5
      }, [])]), api_custom_element("c-route", _cRoute, {
        props: {
          "path": "/companyInfo"
        },
        key: 6
      }, [api_custom_element("c-company-info", _cCompanyInfo, {
        props: {
          "payload": $cmp.payload
        },
        key: 7
      }, [])]), api_custom_element("c-route", _cRoute, {
        props: {
          "path": "/billingInfo"
        },
        key: 8
      }, [api_custom_element("c-billing-info", _cBillingInfo, {
        props: {
          "payload": $cmp.payload
        },
        key: 9
      }, [])]), api_custom_element("c-route", _cRoute, {
        props: {
          "path": "/employeeInfo"
        },
        key: 10
      }, [api_custom_element("c-employee-info", _cEmployeeInfo, {
        props: {
          "payload": $cmp.payload
        },
        key: 11
      }, [])])])])];
    }

    var _tmpl$9 = lwc.registerTemplate(tmpl$8);
    tmpl$8.stylesheets = [];
    tmpl$8.stylesheetTokens = {
      hostAttribute: "lwc-userApp_userApp-host",
      shadowAttribute: "lwc-userApp_userApp"
    };

    class UserApp extends lwc.LightningElement {
      constructor(...args) {
        super(...args);
        this.payload = {};
      }

      handelPayloadChange(event) {
        this.payload = event.detail;
      }

    }

    lwc.registerDecorators(UserApp, {
      publicProps: {
        payload: {
          config: 0
        }
      },
      publicMethods: ["handelPayloadChange"]
    });

    var userApp = lwc.registerComponent(UserApp, {
      tmpl: _tmpl$9
    });

    return userApp;

});
