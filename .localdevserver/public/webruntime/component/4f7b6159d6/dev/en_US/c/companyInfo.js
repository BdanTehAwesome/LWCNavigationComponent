Webruntime.moduleRegistry.define('c/companyInfo', ['lwc'], function (lwc) { 'use strict';

    function stylesheet(hostSelector, shadowSelector, nativeShadow) {
      return ".slds-align_absolute-center" + shadowSelector + "{padding: 2rem;font-size: 2rem;}\n";
    }
    var _implicitStylesheets = [stylesheet];

    function tmpl($api, $cmp, $slotset, $ctx) {
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

    var _tmpl = lwc.registerTemplate(tmpl);
    tmpl.stylesheets = [];

    if (_implicitStylesheets) {
      tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitStylesheets);
    }
    tmpl.stylesheetTokens = {
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

    var companyInfo = lwc.registerComponent(CompanyInfo, {
      tmpl: _tmpl
    });

    return companyInfo;

});
