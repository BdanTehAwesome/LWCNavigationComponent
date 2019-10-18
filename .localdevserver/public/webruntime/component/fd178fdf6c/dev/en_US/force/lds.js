Webruntime.moduleRegistry.define('force/lds', ['exports', 'assert', 'wire-service', 'lwc', 'logger', 'instrumentation/service', 'aura', 'aura-storage'], function (exports, assert, wireService, lwc, logger, service, aura, storage) { 'use strict';

    assert = assert && assert.hasOwnProperty('default') ? assert['default'] : assert;
    storage = storage && storage.hasOwnProperty('default') ? storage['default'] : storage;

    /* LDS has proxy compat enabled */

    /*
     * Contains general utility functions around types.
     */
    class TypeUtils {
      /*
       * Returns true if the provided value is a function, else false.
       * @param value: any - The value with which to determine if it is a function.
       * @return : boolean - See description.
       */
      isFunction(value) {
        const type = typeof value;

        if (type === 'function') {
          return true;
        }

        return false;
      }
      /*
       * Returns true if the given value is a plain object, else false. A plain object has the following properties:
       * 1. Is not null
       * 2. Has a prototype with a constructor that is "Object".
       * @param value: any - The value with which to determine if it is a plain object.
       * @return : boolean - See description.
       */


      isPlainObject(value) {
        const objectProto = value !== null && typeof value === "object" && Object.getPrototypeOf(value);
        return value !== null && typeof value === "object" && (value.constructor && value.constructor.name === "Object" || objectProto && objectProto.constructor && objectProto.constructor.name === "Object");
      }
      /**
       * Checks whether the argument is a valid object
       * A valid object: Is not a DOM element, is not a native browser class (XMLHttpRequest)
       * is not falsey, and is not an array, error, function, string, or number.
       *
       * @param {Object} value The object to check for
       * @returns {Boolean} True if the value is an object and not an array, false otherwise
       */


      isObject(value) {
        return typeof value === "object" && value !== null && !this.isArray(value);
      }
      /**
       * Checks whether the specified object is an array.
       *
       * @param {Object} value The object to check for.
       * @returns {Boolean} True if the object is an array, or false otherwise.
       */


      isArray(value) {
        return Array.isArray(value);
      }
      /**
       * Checks if the object is of type string.
       *
       * @param {Object} value The object to check for.
       * @returns {Boolean} True if the object is of type string, or false otherwise.
       */


      isString(value) {
        return typeof value === 'string';
      }
      /**
       * Checks if the object is of type number.
       *
       * @param {Object} value The object to check for.
       * @returns {Boolean} True if the object is of type number, or false otherwise.
       */


      isNumber(value) {
        return typeof value === 'number';
      }
      /* WARNING: This must be used inside asserts only. If you are using this for class check for custom(non native) classes, then you must use an explicit check along with it.
       * e.g. thenables/Promises can be checked by using .then method
       * Returns true if the given value is an instance of the given type, else false. Unlike the built-in javascript instanceof operator, this
       * function treats cross frame/window instances as the same.
       * @param value: Object - The value with which to determine if it is of the given type.
       * @param type: Function - A constructor function to check the value against.
       * @return : boolean - See description.
       */


      isInstanceOf(value, type) {
        // Do native operation first. If it is true we don't need to do the cross frame algorithm. Adding this check results
        // in significant perf improvement when evaluating to true, and only a small perf decrease when evaluating to false.
        if (value instanceof type) {
          return true;
        } // Fallback to cross frame algorithm.


        if (type === null || type === undefined) {
          throw new Error("type must be defined");
        }

        if (!this.isFunction(type)) {
          throw new Error("type must be callable");
        }

        if (typeof type.prototype !== "object" && typeof type.prototype !== "function") {
          throw new Error("type has non-object prototype " + typeof type.prototype);
        }

        if (value === null || typeof value !== "object" && typeof value !== "function") {
          return false;
        }

        const prototypeOfValue = Object.getPrototypeOf(value); // There may be no prototype if an object is created with Object.create(null).

        if (prototypeOfValue) {
          if (prototypeOfValue.constructor.name === type.name) {
            return true;
          } else if (prototypeOfValue.constructor.name !== "Object") {
            // Recurse down the prototype chain.
            return this.isInstanceOf(prototypeOfValue, type);
          }
        } // No match!


        return false;
      }

    }
    /*
     * The singleton instance of the class.
     */


    const typeUtils = new TypeUtils();

    /* LDS has proxy compat enabled */

    /* LDS has proxy compat enabled */

    /* LDS has proxy compat enabled */

    /*
     * Thenable implements a function chain that mimics the Promise instance API and can degrade to being backed by Promises
     * if necessary. If no Promises are encountered in the chain this will result in better performance because it chains functions
     * without pushing anything into a future tick in the microtask queue, i.e. it can be synchronous. When Promises go into the
     * same microtask queue they can be slowed down by things already ahead of them in the queue. Using Thenables allows us to
     * be synchronous when we can and degrade to being asynchronous (Promises) when we must.
     *
     * Note that Thenables are a notion from the Promise spec, see section 2.3.3 in https://promisesaplus.com/
     *
     * Note also that Promises are interoperable with the Thenable concept -- they have a construtor to convert a Thenable to a
     * Promise as well as a static method to contruct a Promise from a Thenable. See:
     * <pre><code>
     * new Promise((resolve, reject) => {resolve(thenable);}); // (constructor)
     * Promise.resolve(thenable); // (static)
     * </code></pre>
     *
     * Note that with this Promise interoperability, Thenable works with async/await. E.g. just like you can do the following with
     * Promises:
     * <pre><code>
     * async function asyncFunc() {
     *     var value = await Promise.resolve(1)
     *         .then(x => x * 3)
     *         .then(await Promise.resolve(x => x + 5))
     *         .then(x => x / 2);
     *     return value;
     * }
     * asyncFunc().then(x => {console.log(`x: ${x}`); return x;});
     * // log output: x: 4
     * // result: Promise {[[PromiseStatus]]: "resolved", [[PromiseValue]]: 4}
     * </code></pre>
     * you can also do the same thing with Thenable:
     * <pre><code>
     * async function asyncFunc() {
     *     var value = await Thenable.resolve(1)
     *         .then(x => x * 3)
     *         .then(await Thenable.resolve(x => x + 5))
     *         .then(x => x / 2);
     *     return value;
     * }
     * asyncFunc().then(x => {console.log(`x: ${x}`); return x;});
     * // log output: x: 4
     * // result: Promise {[[PromiseStatus]]: "resolved", [[PromiseValue]]: 4}
     * </code></pre>
     * While this interoperability with async/await may prove very handy when necessary, you should be careful using async/await
     * because once you do you will leave the synchronous chain of Thenables and start an asynchronous chain of Promises.
     */

    class Thenable {
      /*
       * Constructor.
       * @param value: any - The value that the thenable should resolve to.
       * @param rejectionReason: any - The rejection reason if the thenable rejects.
       */
      constructor(executor) {
        if (typeof executor != "function") {
          throw new Error("executor must be a function!");
        }

        this.value = undefined;
        this.rejectionReason = undefined; // This is expected to be synchronous.

        executor(this.resolver.bind(this), this.rejector.bind(this));
      }

      resolver(value) {
        this.value = value;
      }

      rejector(value) {
        this.rejectionReason = value;
      }
      /*
       * Returns a Thenable that is resolved with the provided value.
       * @param value: any - The value for the returned Thenable.
       * @returns Thenable<any> - Returns a Thenable that is resolved with the provided value.
       */


      static resolve(value) {
        return new Thenable(resolve => {
          resolve(value);
        });
      }
      /*
       * Returns a Thenable that is rejected for the provided reason.
       * @param rejectionReason: any - The reason for the returned Thenable's rejection.
       * @returns Thenable<any> - Returns a Thenable that is rejected for the provided reason.
       */


      static reject(rejectionReason) {
        return new Thenable((resolve, reject) => {
          reject(rejectionReason);
        });
      }
      /*
       * Behaves like Promise.all() but uses Thenables synchronously if possible. If all Thenables in the chains are non-Promises,
       * then this returns a Thenable that resolves to an array of results. If a Promise is encountered, then a Promise is returned
       * that resolves to an array of results (same as Promise.all()).
       * @param thenables: Iterable<Thenable|Promise> - The iterable of Thenables or Promises for which to wait.
       * @returns Thenable<Array<any>>|Promise<Array<any>> - If all Thenables in the chains are non-Promises, then this returns a
       * Thenable that resolves to an array of results. If a Promise is encountered, then a Promise is returned that resolves to an
       * array of results (same as Promise.all()).
       */


      static all(thenables) {
        assert(thenables, `thenables was falsy -- should be defined as an iterable of Thenables: ${thenables}`);
        const thenableArray = [...thenables];
        const thenableResultsArray = [];

        while (thenableArray.length > 0) {
          if (typeUtils.isInstanceOf(thenableArray[0], Promise)) {
            break; // We need to degrade to Promise.all() for the remainder.
          }

          const thenable = thenableArray.shift();

          if (thenable.rejectionReason !== undefined) {
            return Thenable.reject(thenable.rejectionReason);
          }

          const thenableValue = thenable.value; // .then check is added to reduce the noise and limit the instanceOf check to thenables

          if (thenableValue && thenableValue.then !== undefined && (typeUtils.isInstanceOf(thenableValue, Thenable) || typeUtils.isInstanceOf(thenableValue, Promise))) {
            thenableArray.unshift(thenableValue);
          } else {
            thenableResultsArray.push(thenableValue);
          }
        }

        if (thenableArray.length > 0) {
          // We degraded to a Promise.all(). Merge whatever results we have so far.
          return Promise.all(thenableArray).then(promiseResultsArray => {
            thenableResultsArray.push.apply(thenableResultsArray, promiseResultsArray);
            return thenableResultsArray;
          });
        }

        return Thenable.resolve(thenableResultsArray);
      }
      /*
       * Returns a Thenable or a Promise based on the input value or rejectionReason. If the value is a Promise
       * then we have to let this convert to a Promise chain and return Promises from here on, otherwise it will
       * return a Thenable.
       * @param value: any - The value for the returned Thenable.
       * @param rejectionReason: any - The reason for the returned Thenable's rejection.
       * @returns Thenable<any> | Promise<any> - Returns a Thenable or a Promise based on the input value or rejectionReason.
       */


      static _resolveOrReject(value, rejectionReason) {
        if (value && value.then !== undefined) {
          if (typeUtils.isInstanceOf(value, Promise)) {
            // We encountered a Promise, so we have to convert to an async Promise chain from here on.
            return value;
          }

          if (value.rejectionReason) {
            return Thenable.reject(value.rejectionReason);
          }

          return Thenable.resolve(value.value);
        }

        if (rejectionReason) {
          return Thenable.reject(rejectionReason);
        }

        return Thenable.resolve(value);
      }
      /*
       * Appends fulfillment and rejection handlers to the Thenable, and returns a new Thenable resolving to the return value of
       * the called handler, or to its original settled value if the Thenable was not handled (i.e. if the relevant handler onFulfilled
       * or onRejected is not a function).
       *
       * This method mirrors its equivalent in the Promise API, but calls everything synchronously if it can. If it encounters a Promise
       * in the chain, this synchronous Thenable chain will convert to an asynchronous Promise chain at that point.
       * @param onFulfilled: function - A Function called if the Thenable is fulfilled. This function has one argument, the fulfillment value.
       * @param onRejected: function - A Function called if the Thenable is rejected. This function has one argument, the rejection reason.
       * @returns Thenable<any> | Promise<any> - Returns a Thenable or a Promise based on output of the onFulfilled or onRejected handler.
       */


      then(onFulfilled, onRejected) {
        let newValue;
        let newRejectionReason;

        try {
          if (this.value === this || this.rejectionReason === this) {
            throw new TypeError("Thenable cannot resolve to itself.");
          }

          if (this.rejectionReason) {
            if (typeof onRejected === "function") {
              if (typeUtils.isInstanceOf(this.rejectionReason, Promise)) {
                return this.rejectionReason.then(undefined, onRejected);
              }

              newValue = onRejected(this.rejectionReason);
            } else {
              newRejectionReason = this.rejectionReason;
            }
          } else if (typeof onFulfilled === "function") {
            if (typeUtils.isInstanceOf(this.value, Promise)) {
              return this.value.then(onFulfilled);
            }

            newValue = onFulfilled(this.value);
          }
        } catch (e) {
          newRejectionReason = e;
        }

        newValue = newValue || this.value;
        return Thenable._resolveOrReject(newValue, newRejectionReason);
      }
      /*
       * Appends a rejection handler callback to the Thenable, and returns a new Thenable resolving to the return value of the callback if it
       * is called, or to its original fulfillment value if the Thenable is instead fulfilled.
       *
       * This method mirrors its equivalent in the Promise API, but calls everything synchronously if it can. If it encounters a Promise
       * in the chain, this synchronous Thenable chain will convert to an asynchronous Promise chain at that point.
       * @param onRejected: function - A Function called if the Thenable is rejected. This function has one argument, the rejection reason.
       * @returns Thenable<any> | Promise<any> - Returns a Thenable or a Promise based on output of the onRejected handler.
       */


      catch(onRejected) {
        return this.then(undefined, onRejected);
      }

    }

    /* LDS has proxy compat enabled */

    function _objectSpread(target){for(var i=1;i<arguments.length;i++){var source=arguments[i]!=null?arguments[i]:{};var ownKeys=Object.keys(source);if(typeof Object.getOwnPropertySymbols==='function'){ownKeys=ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym){return Object.getOwnPropertyDescriptor(source,sym).enumerable;}));}ownKeys.forEach(function(key){_defineProperty(target,key,source[key]);});}return target;}function _defineProperty(obj,key,value){if(key in obj){Object.defineProperty(obj,key,{value:value,enumerable:true,configurable:true,writable:true});}else{obj[key]=value;}return obj;}function _objectWithoutProperties(source,excluded){if(source==null)return {};var target=_objectWithoutPropertiesLoose(source,excluded);var key,i;if(Object.getOwnPropertySymbols){var sourceSymbolKeys=Object.getOwnPropertySymbols(source);for(i=0;i<sourceSymbolKeys.length;i++){key=sourceSymbolKeys[i];if(excluded.indexOf(key)>=0)continue;if(!Object.prototype.propertyIsEnumerable.call(source,key))continue;target[key]=source[key];}}return target;}function _objectWithoutPropertiesLoose(source,excluded){if(source==null)return {};var target={};var sourceKeys=Object.keys(source);var key,i;for(i=0;i<sourceKeys.length;i++){key=sourceKeys[i];if(excluded.indexOf(key)>=0)continue;target[key]=source[key];}return target;}// *******************************************************************************************************************
    const safeValues=new WeakMap();/**
     * Takes a value from LDS and makes it safe for Aura code that could be running in 'compat' mode for IE 11.
     * @param targetObject An object that has been wrapped in a Proxy to make it read only to consumers.
     * @returns An un-proxied but frozen object that can be safely used for read only tasks in Aura code.
     */function getValueForAura(targetObject){if(targetObject===undefined){return targetObject;}// Proxy.getKey should only be defined if we're in compat mode.
    const isCompatMode=Proxy.getKey!==undefined;if(!isCompatMode){// The proxy is safe to return as-is so long as we're not in compat mode or it's already frozen.
    return targetObject;}let safeValue=safeValues.get(targetObject);if(safeValue!==undefined){// We have already unwrapped and frozen something so we don't need to do that again.
    return safeValue;}safeValue=JSON.parse(JSON.stringify(targetObject));safeValues.set(targetObject,safeValue);return safeValue;}/**
     * @see {@link instrumentation.d.ts#markStart}.
     */function markStart(eventName,cacheKeyValueTypeString){const perfKey=_getUniquePerfKey(eventName);const perfContext={cacheKeyValueType:cacheKeyValueTypeString};const perfMarker={perfKey,perfContext};service.markStart(LDS_CACHE_PERF_NAMESPACE,perfKey,perfContext);return perfMarker;}/**
     * @see {@link instrumentation.d.ts#markEnd}.
     */function markEnd(perfMarker){service.markEnd(LDS_CACHE_PERF_NAMESPACE,perfMarker.perfKey,perfMarker.perfContext);}/**
     * @see {@link instrumentation.d.ts#instrumentError}.
     */function instrumentError(error$1,errorSource,errorType,additionalInfo){// Type is any because we are setting fields dynamically on the attribute object at runtime.
    const attributes={additionalInfo:additionalInfo||""};if(error$1.body){attributes.body=JSON.stringify(error$1.body);}if(error$1.stack){attributes.stack=error$1.stack;}if(error$1.message){attributes.message=error$1.message;}try{attributes.error=JSON.stringify(error$1);}catch(exception){// tslint:disable-next-line:no-empty
    }service.error(attributes,errorSource,errorType);}/**
     * @see {@link instrumentation.d.ts#InstrumentationErrorType}.
     */var InstrumentationErrorType;(function(InstrumentationErrorType){InstrumentationErrorType["INFO"]="info";InstrumentationErrorType["WARN"]="warn";InstrumentationErrorType["ERROR"]="error";})(InstrumentationErrorType||(InstrumentationErrorType={}));/**
     * Makes a unique key by appending current time stamp.
     * @param sharedKey - A non-unique key for conversion to unique key.
     * @returns A unique key.
     */function _getUniquePerfKey(sharedKey){// Aura metrics stores transaction and markers using name as a key. This key is an index to all transactions and marks. Requests to LDS
    // for an operation tracked via performance marker can be interleaved leading to override of existing marker of same name.
    // So, LDS needs to use a unique marker name to keep track of key names.
    // Makes a unique perfkey by using MetricsService time which provides high precision time.
    return sharedKey+"."+service.time();}/**
     * LDS Cache namespace for perf markers
     */const LDS_CACHE_PERF_NAMESPACE="lds_cache";/*
     * debug-extension is a private LDS library for internal use by the LDS team ONLY.
     * DO NOT USE!
     */let logsList=[];let debugEnabled=false;// Variable to store reference to the cache. The event listener uses this.
    let _ldsCacheDebug;/*
     * Function to help troubleshoot LDS cache.
     * Only available in debug mode (not in production since asserts are removed).
     * Listens to event requesting cacheData, and does a postMessage with both the cached records and observable data.
     * @param {object} event Event representing request for cache contents.
     */{window.addEventListener("message",event=>{// We only accept messages from ourselves.
    if(event.origin!==window.origin){return;}// Check same window.
    if(event.source!==window){return;}const sendMessage=function(message){window.postMessage(message,window.origin);};if(event.data.type){if(event.data.type==="GET_CACHE_DATA"){const cacheData=[];_ldsCacheDebug._cacheStore.privateMap.forEach((v,k)=>{cacheData.push({key:k,eTag:v.eTag,value:v.value});});const cacheObservablesData=[];_ldsCacheDebug._observablesMap.forEach((v,k)=>{// JSON parse/stringify to avoid serialization error during window.post later.
    cacheObservablesData.push(JSON.parse(JSON.stringify({key:v.root.name,isComplete:v.root.isComplete,lastError:v.root.lastError,lastValue:v.root.lastValue,subscriptionsSize:v.root.subscriptions?v.root.subscriptions.size:null,observablesMapKey:k})));});// Build lru queue order.
    const lruQueueOrder={};let index1=1;if(_ldsCacheDebug._cacheStore.lruQueue&&_ldsCacheDebug._cacheStore.lruQueue._back){let item1=_ldsCacheDebug._cacheStore.lruQueue._back;while(item1){lruQueueOrder[item1.key]=index1;index1++;item1=item1.previous;}}let dependencies={};Object.entries(_ldsCacheDebug.getOrCreateDependencyMap().dependencies).forEach(([key,value])=>{dependencies[key]=Array.from(value);});let dependenciesReverseLookup={};Object.entries(_ldsCacheDebug.getOrCreateDependencyMap().dependenciesReverseLookup).forEach(([key,value])=>{dependenciesReverseLookup[key]=Array.from(value);});let dependenciesResponse={};dependenciesResponse.dependencies=dependencies;dependenciesResponse.dependenciesReverseLookup=dependenciesReverseLookup;sendMessage({type:"CACHE_CONTENTS",cacheData,cacheObservablesData,lruQueueOrder,dependencies:dependenciesResponse},event);}else if(event.data.type==="ENABLE_DEBUG_CACHE"){handleDebug("ENABLE_DEBUG");sendMessage({type:"DEBUG_MESSAGE",message:"Enabled Debug"});}else if(event.data.type&&event.data.type==="DISABLE_DEBUG_CACHE"){handleDebug("DISABLE_DEBUG");sendMessage({type:"DEBUG_MESSAGE",message:"Disabled Debug"});}else if(event.data.type&&event.data.type==="CLEAR_LOGS_CACHE"){handleDebug("CLEAR_LOGS");sendMessage({type:"DEBUG_MESSAGE",message:"Cleared Logs"});}else if(event.data.type&&event.data.type==="GET_LOGS_CACHE"){const logs=handleDebug("GET_LOGS");sendMessage({type:"DEBUG_MESSAGE",logs,message:"Responded with logs."});}else if(event.data.type&&event.data.type==="GET_VERSION_APP"){sendMessage({type:"APP_VERSION",message:"Version 2"});}}});}/*
     * Prepares logging info.
     * @param actionKey: Type of log.
     * @param parametersProvider: Function which provides data to be logged. Lazily evaluated only if required.
     * @param parameters
     * @returns boolean true
     */function handleDebug(actionKey,parametersProvider){if(actionKey==="ENABLE_DEBUG"){// Flag to indicate debugging is enabled.
    debugEnabled=true;}else if(actionKey==="DISABLE_DEBUG"){// Flag to indicate debugging is disabled.
    debugEnabled=false;}else if(actionKey==="GET_LOGS"){// Return logs accumulated so far in this session.
    return logsList;}else if(actionKey==="CLEAR_LOGS"){// Clear the logs.
    logsList=[];}else if(debugEnabled){// Based on the type of logs capture different attributes.
    const date=new Date();const response={timestamp:date,timestampMillis:date.getMilliseconds()};// Copy all parameters.
    Object.assign(response,parametersProvider());if(actionKey==="record-service_commitPuts1"){response.label="Begin Commit Puts";}else if(actionKey==="record-service_commitPuts2"){response.label="Done Commit Puts";}else if(actionKey==="record-service_stagePut"){response.label="Stage Put";}else if(actionKey==="complete-and-remove-observables"){response.label="Complete And Remove Observable";}else if(actionKey==="emit-value"){response.label="Emit Value";}else if(actionKey==="created-observable"){response.label="Created Observable";}else if(actionKey==="emit-suppressed"){response.label="Emit Filtered";}else if(actionKey==="stage-emit"){response.label="Stage Emit";}// Add to list of logs.
    logsList.push(JSON.stringify(response));}// Since this is called from within an assert, return true.
    return true;}/*
     * Sets the specific LdsCache instance to debug.
     * @param ldsCache: LdsCache - The particular LdsCache instance to debug.
     * @returns void
     */function setLdsCacheToDebug(ldsCache){_ldsCacheDebug=ldsCache;}/**
     * This Subscription is based on the ES Observable reference implementation under consideration
     * for ES spec inclusion:
     * https://github.com/tc39/proposal-observable/blob/master/src/Observable.js
     * It is not the same code because the reference impl currently doesn't have good ways to
     * emit change notifications and also and doesn't have a good implementation for multiplexing,
     * but it has the exact same interface.
     */class Subscription{/**
         * Constructor.
         * @param observer An observer object that should have the next, error, and complete handlers.
         * @param unsubscriber Function called when the subscription is unsubscribed.
         */constructor(observer,unsubscriber){this._isClosed=false;this.observer=observer;this.unsubscriber=unsubscriber;}/**
         * From the Subscription interface.
         * @returns True if the subscription is closed, else false.
         */get closed(){return this._isClosed;}/**
         * Internal method - do not call.
         * @param value The next value.
         */next(value){this.observer.next(value);}/**
         * Internal method - do not call.
         * @param error An error has occurred - this is the message.
         */error(error){if(this.observer.error){this.observer.error(error);}}/**
         * From the Subscription interface.
         */unsubscribe(){if(!this._isClosed){this.unsubscriber.removeSubscriber();this._isClosed=true;}}}/**
     * This is used to remove the subscriptions from the exiting observable
     */class Unsubscriber{constructor(){/**
             * Set of subscriptions from which the subscription is removed from
             */this.subscriptions=new Set();}/**
         * remove the subscriptions
         */removeSubscriber(){this.subscriptions.delete(this.subscription);}}/**
     * Conceptually an entity capable of observing an observable.
     * It is a collection of handlers that for responding to streaming events from the observable stream.
     */class Observer{/**
         * constructor
         * @param next Method to call when observable emits a value
         * @param error Method to call when observable emits an error
         * @param complete Method to call when observable retires the observer
         */constructor(next,error,complete){this.next=next;this.error=error;this.complete=complete;}}/**
     * Set to track the values which are being refreshed in 304 use case
     */const lastValueTracker=new Set();/**
     * This Observable is based on the ES Observable reference implementation under consideration
     * for ES spec inclusion:
     * https://github.com/tc39/proposal-observable/blob/master/src/Observable.js
     * It is not the same code because the reference impl currently doesn't have good ways to
     * emit change notifications and also and doesn't have a good implementation for multiplexing,
     * but it has the exact same interface.
     */class Observable{/**
         * Constructor.
         * @param name Name of the observable.
         */constructor(name){/**
             * Set of tracked subscriptions
             */this.subscriptions=new Set();/**
             * Tells if the observable is complete or not
             */this.isComplete=false;this.name=name;{handleDebug("created-observable",()=>{return {observableName:name};});}}/**
         * Wraps a call to next() in a try/catch with error logging/gacking to ensure subsequent subscriptions will also have
         * their next() methods called.
         * @param subscription The Observer's subscription.
         * @param newValue new value for an Observable of which Observers need to be notified.
         */_nextWithErrorHandling(subscription,newValue){try{subscription.next(newValue);}catch(e){// A subscription handler threw an error. Make sure the framework logs and gacks, but then allow other
    // subscriptions to continue receiving emits.
    logger.logError(e);}}/**
         * Wraps a call to error() in a try/catch with error logging/gacking to ensure subsequent subscriptions will also have
         * their error() methods called.
         * @param subscription An Observer's subscription.
         * @param error Error thrown during execution.
         */_errorWithErrorHandling(subscription,error){try{subscription.error(error);}catch(e){// A subscription handler threw an error. Make sure the framework logs and gacks, but then allow other
    // subscriptions to continue receiving emits.
    logger.logError(e);}}/**
         * Wraps a call to complete() in a try/catch with error logging/gacking to ensure subsequent Observers will also have
         * their complete() methods called.
         * @param observer A subscribed Observer.
         */_completeWithErrorHandling(observer){try{if(observer.complete){observer.complete();}}catch(e){// An Observer's complete() threw an error. Make sure the framework logs and gacks, but then allow other
    // completions to continue.
    logger.logError(e);}}/**
         * From the Observable interface. Subscribers can pass up to 3 functions: 1) a next() function,
         * 2) an error() function, and 3) a complete() function.
         * @param observer Observer to which you are subscribing OR the next handler.
         * @param error The error handler.
         * @param complete The complete handler.
         * @returns The subscription.
         */subscribe(observer,error,complete){let observerObj;if(typeof observer==="object"){observerObj=observer;}else{observerObj=new Observer(observer,error,complete);}// TODO W-5804079 - complete should return a subscription, subscribe() should never return undefined
    if(this.isComplete){if(observerObj.complete){// Hotness for completion.
    this._completeWithErrorHandling(observerObj);}return undefined;}// don't re-subscribe if observer is already subscribed
    let currentSubscription;this.subscriptions.forEach(subscriptionObj=>{const subscriptionObserver=subscriptionObj.observer;if(subscriptionObserver===observerObj||subscriptionObserver.next===observer){currentSubscription=subscriptionObj;}});if(currentSubscription){return currentSubscription;}const unsubscriber=new Unsubscriber();const subscription=new Subscription(observerObj,unsubscriber);unsubscriber.subscriptions=this.subscriptions;unsubscriber.subscription=subscription;this.subscriptions.add(subscription);{observerObj.name="Observer: "+this.name;subscription.name="Subscription for Observer: "+observerObj.name;}// Be a BehaviorSubject (emit lastValue upon subscribe.)
    if(this.lastValue!==undefined){this._nextWithErrorHandling(subscription,this.lastValue);}else if(this.lastError!==undefined){this._errorWithErrorHandling(subscription,this.lastError);}return subscription;}/**
         * Internal method - do not call.
         * Emits a value on the observable.
         * @param newValue a new value to emit to all this Observable's Observers.
         */emitValue(newValue){// Runtime error checking.
    if(this.isComplete){throw new Error(`Cannot emit a value to a completed observable. Observable name: ${this.name}, newValue: ${newValue}`);}if(this.lastError){throw new Error(`Cannot emit a value to a observable in error state. Observable name: ${this.name}, newValue: ${newValue}`);}if(newValue===undefined){throw new Error(`newValue cannot be undefined. Observable name: ${this.name}, newValue: ${newValue}`);}// TODO: root observable will not call emitValue if value to written in cache is same as existing one,
    // move this filtering to child observable with changes for records. W-4045855
    this.lastValue=newValue;this.lastError=undefined;{handleDebug("emit-value",()=>{return {observableName:this.name,emitValue:newValue};});}if(this.subscriptions.size>0){this.subscriptions.forEach(subscription=>{this._nextWithErrorHandling(subscription,newValue);});}}/**
         * Internal method - do not call.
         * Emits an error on the observable.
         * @param error The value to emit to all this Observable's Observers.
         */emitError(error){// Runtime error checking.
    // TODO - only do this if going to throw an error
    const errorStr=typeUtils.isString(error)?error:JSON.stringify(error);if(this.isComplete){throw new Error(`Cannot emit an error on a completed observable. Observable name: ${this.name}, error: ${errorStr}`);}if(this.lastError){instrumentError(error,"LDS_OBSERVABLE_IN_ERROR_STATE",InstrumentationErrorType.ERROR,`Observable Name: ${this.name}`);}if(error===undefined){throw new Error(`error cannot be undefined. Observable name: ${this.name}, error: ${error}`);}this.lastValue=undefined;this.lastError=error;this.subscriptions.forEach(subscription=>{if(this._errorWithErrorHandling){this._errorWithErrorHandling(subscription,error);}else{logger.logError(`_errorWithErrorHandling undefined during Observable emitError! Observable name: ${this.name}, err= ${JSON.stringify(error)} +  -- err.message=${error.message}`);}});}/**
         * From the Observable interface.
         * Completes the observable. Nothing else can ever be emitted.
         */complete(){try{this.subscriptions.forEach(subscription=>{const subscriptionObserver=subscription.observer;if(subscriptionObserver.complete){this._completeWithErrorHandling(subscriptionObserver);}if(!subscription.closed){// If the observer didn't unsubscribe during complete(), do it for them to prevent a memory leak.
    subscription.unsubscribe();}});}finally{this.subscriptions.clear();this.lastValue=undefined;this.lastError=undefined;this.isComplete=true;}}/**
         * Stream operator. Transforms items from the caller stream using the specified mapFn.
         * @param mapFn Function which takes a value and returns a new value.
         * @returns A new observable which emits transformed values.
         */map(mapFn){const name=this._constructChainName("Map");const transformedObservable=new Observable(name);this._wireTransformedObservableWithOperation(transformedObservable,value=>{const mappedValue=mapFn(value);transformedObservable.emitValue(mappedValue);});return transformedObservable;}/**
         * Stream operator. Filters items emitted by the source Observable by only emitting an item when it is distinct from the previous item.
         * @param compareFn Function which should return true the previous and new are determined to be different.
         * @returns A new observable which only emits an item when it is distinct from the previous item.
         */distinctUntilChanged(compareFn){const name=this._constructChainName("DistinctUntilChanged");const transformedObservable=new Observable(name);this._wireTransformedObservableWithOperation(transformedObservable,value=>{// TODO: W-5698880 This is not a generic operator anymore because it is using the global lastValueTracker. This needs to be refactored
    // into a custom operator or this operator's name needs to be changed.
    if(compareFn(transformedObservable.lastValue,value)&&!lastValueTracker.has(transformedObservable.lastValue)&&transformedObservable.lastValue!==undefined){this._debugLogEmitSuppressed(value);}else{// The value is different than the last value, so emit or its 304 with new observer
    transformedObservable.emitValue(value);lastValueTracker.delete(transformedObservable.lastValue);}});return transformedObservable;}/**
         * Stream operator. Filter items emitted by the source Observable by only emitting those that satisfy a specified predicate.
         * @param predicateFn Function which should return true if the value passes the filter, else false.
         * @returns A new observable which only emits items that satisfy a specified predicate.
         */filter(predicateFn){const name=this._constructChainName("Filter");const transformedObservable=new Observable(name);this._wireTransformedObservableWithOperation(transformedObservable,value=>{if(predicateFn(value)){// The value passed the filter so we need to emit!
    transformedObservable.emitValue(value);}else{this._debugLogEmitSuppressed(value);}});return transformedObservable;}/**
         * Stream operator. Skips a given number of emits and then always emits.
         * @param count How many emits to skip before passing through all emits.
         * @returns A new observable which emits all values after the given number of emits has taken place.
         */skip(count){const name=this._constructChainName("Skip");const transformedObservable=new Observable(name);let emitsSoFar=0;this._wireTransformedObservableWithOperation(transformedObservable,value=>{emitsSoFar+=1;if(emitsSoFar>count){transformedObservable.emitValue(value);}else{this._debugLogEmitSuppressed(value);}});return transformedObservable;}/**
         * Stream operator. Discard items emitted by an Observable until a specified condition becomes false.
         * @param predicateFn Predicate function which governs the skipping process. skipUntil calls this
         *      function for each item emitted by the source Observable until the function returns false,
         *      whereupon skipUntil begins mirroring the source Observable (starting with that item).
         * @returns A new observable which exhibits the behavior described above.
         */skipUntil(predicateFn){const name=this._constructChainName("SkipUntil");const transformedObservable=new Observable(name);let isSkipping=true;this._wireTransformedObservableWithOperation(transformedObservable,value=>{if(isSkipping){isSkipping=predicateFn(value);}if(!isSkipping){transformedObservable.emitValue(value);}else{this._debugLogEmitSuppressed(value);}});return transformedObservable;}/**
         * Stream operator. Discard item emitted by an Observable if the condition is met.
         * @param predicateFn Predicate function which governs the skipping process. skipIf calls this
         *      function for each item emitted by the source Observable. If the condition is not met, the emit is not skipped,
         *      whereupon skipIf begins mirroring the source Observable (starting with that item).
         * @returns A new observable which exhibits the behavior described above.
         */skipIf(predicateFn){const name=this._constructChainName("SkipIf");const transformedObservable=new Observable(name);this._wireTransformedObservableWithOperation(transformedObservable,value=>{if(!predicateFn(value)){transformedObservable.emitValue(value);}else{this._debugLogEmitSuppressed(value);}});return transformedObservable;}/**
         * Stream operator. Discard the first emitted item by an Observable. Generally, this skips the last-value, which is emitted upon subscribe.
         * @returns A new observable which exhibits the behavior described above.
         */skipOnce(){const name=this._constructChainName("SkipOnce");const transformedObservable=new Observable(name);let hasSkipped=false;this._wireTransformedObservableWithOperation(transformedObservable,value=>{if(hasSkipped){transformedObservable.emitValue(value);}else{// Skip once, then set to true, and never skip again
    hasSkipped=true;this._debugLogEmitSuppressed(value);}});return transformedObservable;}/**
         * Stream operator. Transforms items from the caller stream using the specified mapFn. Differs from
         *      map in that the newly created observable is actually a FilterOnSubscribeBehaviorSubject.
         * @param filterOnSubscribeFn Filter function which gets passed to behavior subject instance.
         * @param mapFn Function which takes a value and returns a new value.
         * @returns A new FilterOnSubscribeBehaviorSubject which emits transformed values.
         */mapWithFilterOnSubscribeBehaviorSubject(filterOnSubscribeFn,mapFn){const name=this._constructChainName("MapWithFilterOnSubscribeBehaviorSubject");const transformedObservable=new FilterOnSubscribeBehaviorSubject(name,filterOnSubscribeFn);this._wireTransformedObservableWithOperation(transformedObservable,value=>{transformedObservable.lastValuePreTransformed=value;const mappedValue=mapFn(value);transformedObservable.emitValue(mappedValue);});return transformedObservable;}/**
         * Wires up the given transformedObservable with the given operationFn. Standardizes the error handling
         * and complete handling.
         * @param transformedObservable The new observable which represents another link in the observable chain by performing the given operationFn.
         * @param operationFn The operation to perform for this link in the observable chain.
         */_wireTransformedObservableWithOperation(transformedObservable,operationFn){const observerTransform=new Observer(value=>{if(transformedObservable.lastError===undefined&&!transformedObservable.isComplete){try{transformedObservable.lastValuePreTransformed=value;operationFn(value);}catch(error){this._throwIfJavascriptCoreError(error);transformedObservable.emitError(error);}}},error=>{if(transformedObservable.lastError===undefined&&!transformedObservable.isComplete){transformedObservable.emitError(error);}},()=>{if(transformedObservable.lastError===undefined&&!transformedObservable.isComplete){transformedObservable.complete();}});this._decorateTransformedObservableWithSubscriptionOptimizationLogic(transformedObservable,observerTransform);}/**
         * Throws the given err if it is a javascript core error.
         * @param err
         */_throwIfJavascriptCoreError(err){if(typeUtils.isInstanceOf(err,ReferenceError)||typeUtils.isInstanceOf(err,TypeError)||typeUtils.isInstanceOf(err,RangeError)||typeUtils.isInstanceOf(err,EvalError)||typeUtils.isInstanceOf(err,SyntaxError)||typeUtils.isInstanceOf(err,URIError)){throw err;}}/**
         * Decorate the subscribe method on the transformed observable to take care of the following:
         * 1. If the transformed observable is not connected to the source observable, then connect it.
         * 2. Return a Subscription<T> instance with a decorated unsubscribe method. This method will disconnect
         *      from the source observable if there are no subscriptions left on the transformed observable.
         * @param transformedObservable The instance of the transformed observable to decorate. It will be modified in place.
         * @param observerTransform  The observer to use in the subscription to the source observable. It contains the transform logic.
         */_decorateTransformedObservableWithSubscriptionOptimizationLogic(transformedObservable,observerTransform){transformedObservable.sourceObservable=this;const originalSubscribeFn=transformedObservable.subscribe;transformedObservable.subscribe=(observer,error,complete)=>{// If not connected to the source yet, then connect.
    if(!transformedObservable.sourceSubscription){transformedObservable.sourceSubscription=transformedObservable.sourceObservable.subscribe(observerTransform,error,complete);}// Call the original subscribe method to get the subscription.
    const originalSubscription=originalSubscribeFn.call(transformedObservable,observer,error,complete);// Decorate the Subscription<T> instance with a new unsubscribe method.
    if(originalSubscription){const originalUnsubscribeFn=originalSubscription.unsubscribe;originalSubscription.unsubscribe=()=>{originalUnsubscribeFn.call(originalSubscription);// Disconnect from the source if there are no other subscriptions on the transformed observable.
    if(transformedObservable.subscriptions.size<=0){transformedObservable.sourceSubscription.unsubscribe();transformedObservable.sourceSubscription=undefined;}};}else{throw new Error("Observer subscription was undefined when constructing filtered record observable. Transformed Observable Name = "+transformedObservable.name);}return originalSubscription;};}/**
         * Constructs the name of the observable by adding the given linkName onto the rest of the chain's name.
         * @param linkName The name of the link in the observable chain.
         * @returns The full chain name for the observable.
         */_constructChainName(linkName){return linkName.trim()+" <= "+this.name;}/**
         * Log an entry that an emit was filtered out.
         * @param value Object that was filtered out.
         */_debugLogEmitSuppressed(value){{handleDebug("emit-suppressed",()=>{return {observableName:this.name,emitValue:value};});}}}/**
     * Created a Behavior subject Observable to handle stale emits
     */class FilterOnSubscribeBehaviorSubject extends Observable{constructor(name,filterOnSubscribeFunction){super(name);this._filterOnSubscribeFunction=filterOnSubscribeFunction;}/**
         * From the Observable interface. Subscribers can pass up to 3 functions: 1) a next() function,
         * 2) an error() function, and 3) a complete() function.
         * @param observer Observer to which you are subscribing OR the next handler.
         * @param error The error handler.
         * @param complete The complete handler.
         * @returns The subscription.
         */subscribe(observer,error,complete){// Do all the same subscribe stuff as in Observable up until the emit logic.
    let observerObj;if(typeof observer==="object"){observerObj=observer;}else{observerObj=new Observer(observer,error,complete);}if(this.isComplete){if(observerObj.complete){// Hotness for completion.
    this._completeWithErrorHandling(observerObj);}return undefined;}// don't re-subscribe if observer is already subscribed
    let currentSubscription;this.subscriptions.forEach(subscriptionObj=>{const subscriptionObserver=subscriptionObj.observer;if(subscriptionObserver===observerObj||subscriptionObserver.next===observer){currentSubscription=subscriptionObj;}});if(currentSubscription){return currentSubscription;}const unsubscriber=new Unsubscriber();const subscription=new Subscription(observerObj,unsubscriber);unsubscriber.subscriptions=this.subscriptions;unsubscriber.subscription=subscription;this.subscriptions.add(subscription);{observerObj.name="Observer (FilterOnSubscribeBehaviorSubject): "+this.name;subscription.name="Subscription for Observer (FilterOnSubscribeBehaviorSubject): "+observerObj.name;}// Be a BehaviorSubject (emit lastValue upon subscribe.)
    if(this.lastValue!==undefined&&this._filterOnSubscribeFunction(this.lastValuePreTransformed||this.lastValue)){this._nextWithErrorHandling(subscription,this.lastValue);}else if(this.lastError!==undefined){this._errorWithErrorHandling(subscription,this.lastError);}return subscription;}}/**
     * @param condition Assert condition
     * @param assertMessage Message to include with error if assertion fails
     * @throws Error with assertMessage if assertion condition is false.
     */function assert$1(condition,assertMessage){if(!condition){throw new Error("Assertion Failed!: "+assertMessage+" : "+condition);}}/**
     * Utility functions used in the LDS layer.
     */ /**
     * Converts to 18-char record ids. Details at http://sfdc.co/bnBMvm.
     * @param recordId A 15- or 18-char record id.
     * @returns An 18-char record id, and throws error if an invalid record id was provided.
     */function to18(recordId){{assert$1(recordId.length===15||recordId.length===18,`Id ${recordId} must be 15 or 18 characters.`);}if(recordId.length===15){// Add the 3 character suffix
    const CASE_DECODE_STRING="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456";for(let offset=0;offset<15;offset+=5){let decodeValue=0;for(let bit=0;bit<5;bit++){const c=recordId[offset+bit];if(c>="A"&&c<="Z"){// tslint:disable-next-line:no-bitwise
    decodeValue+=1<<bit;}}recordId+=CASE_DECODE_STRING[decodeValue];}}return recordId;}/**
     * Returns true if the given lastFetchTime is within the given ttl based on the given nowTime.
     * @param nowTime The now time.
     * @param lastFetchTime The time that the thing was last fetched.
     * @param ttl The time to live.
     * @returns See description.
     */function isWithinTtl(nowTime,lastFetchTime,ttl){if(nowTime-lastFetchTime<ttl){return true;}return false;}/**
     * Determines if the specified value is the CacheWrapper. This gets automatically added around
     * values that are cached using the CacheAccessor.
     * @param value the object to check if wrapped.
     * @returns True if the value is the wrapper or false if undefined or not a wrapper.
     */function isCacheWrapper(value){return value&&value.hasOwnProperty("lastFetchTime")&&value.hasOwnProperty("value");}/**
     * Returns the object API name.
     * @param value The value from which to get the object API name.
     * @returns The object API name.
     */function getObjectApiName(value){if(typeof value==="string"){return value;}else if(value&&typeof value.objectApiName==="string"){return value.objectApiName;}throw new TypeError("Value is not a string, ObjectId, or FieldId.");}/**
     * Returns the field API name, qualified with an object name if possible.
     * @param value The value from which to get the qualified field API name.
     * @return The qualified field API name.
     */function getFieldApiName(value){if(typeof value==="string"){return value;}else if(value&&typeof value.objectApiName==="string"&&typeof value.fieldApiName==="string"){return value.objectApiName+"."+value.fieldApiName;}throw new TypeError("Value is not a string or FieldId.");}/**
     * Split the object API name and field API name from a qualified field name.
     * Eg: Opportunity.Title returns ['Opportunity', 'Title']
     * Eg: Opportunity.Account.Name returns ['Opportunity', 'Account.Name']
     * @param fieldApiName The qualified field name.
     * @return The object and field API names.
     */function splitQualifiedFieldApiName(fieldApiName){const idx=fieldApiName.indexOf(".");if(idx<1){// object api name must non-empty
    throw new TypeError("Value does not include an object API name.");}return [fieldApiName.substring(0,idx),fieldApiName.substring(idx+1)];}/**
     * Checks the type of the value and throws an error if it is incorrect.
     * @param value The value to check.
     * @param type The type of the Object. For instance, 5 has the type Number.
     * @throws If value is not of the expected type Or if value is null/undefined.
     */function checkType(value,type){if(value==null){throw new TypeError("Unexpected null or undefined value.");}if(type===Array&&!Array.isArray(value)||type===Object&&!typeUtils.isPlainObject(value)||type===Function&&!typeUtils.isFunction(value)||!type.prototype.isPrototypeOf(Object(value))&&type!==Array){throw new TypeError("Value does not have expected type: "+type.name+", got: "+value+".");}}/**
     * Results the default function for doing recursive equality call,
     * The default function just checks content of inner objects.
     * @param value1 First value to compare.
     * @param value2 Second value to compare.
     * @param depth Current depth of the recursion.
     * @returns True if the objects are equivalent, False otherwise.
     */function _defaultRecurseFunction(value1,value2,depth){{assert$1(depth>=1,"depth should never drop below 1");}const json1=JSON.stringify(value1);const json2=JSON.stringify(value2);// Previously we were using the recurse function to actually deeply compare objects up to a specified
    // depth of recursion. However this was very slow in IE 11. For now we are abandoning this as the default
    // check in favor of a JSON string comparison which performs better in IE 11 due to fewer function calls
    // and less recursion. See P4 history if retrieving the old way is necessary.
    //
    // IE 11 performance workaround until we have a better strategy (using eTags, cacheVersions, etc.);
    return json1===json2;}/**
     * Check if the two values provided are equal.
     * @param value1 The first value to be checked.
     * @param value2 The second value to be checked.
     * @param recurseFn Function that will be called on members of array or object to check equality. Defaults to _defaultRecurseFunction.
     * @param depth The max recursion depth of the object to check. Defaults to 10.
     * @return Boolean whether the objects are equal.
     */function equivalent(value1,value2,recurseFn,depth){recurseFn=recurseFn!==undefined?recurseFn:_defaultRecurseFunction;depth=depth!==undefined&&depth>0?depth:10;const value1IsValueWrapper=isCacheWrapper(value1);const value2IsValueWrapper=isCacheWrapper(value2);let targetValue1=value1;let targetValue2=value2;if(value1IsValueWrapper){targetValue1=value1.value;}if(value2IsValueWrapper){targetValue2=value2.value;}if(targetValue1===targetValue2){return true;}else if(value1IsValueWrapper&&value2IsValueWrapper){// Try checking eTags.
    const value1ETag=value1.eTag;const value2ETag=value2.eTag;if(value1ETag!==null&&value1ETag!==undefined&&value2ETag!==null&&value2ETag!==undefined){return value1ETag===value2ETag;}}if(typeof targetValue1==="object"&&recurseFn){// Plain object, do default comparison for object values.
    return recurseFn(targetValue1,targetValue2,depth);}return false;}/**
     * Returns an array of values constructed from the given collection.
     * @param collection The collection to be converted into an array.
     * @returns See description.
     */function collectionToArray(collection){const arrayFromCollection=[];const collectionArray=Array.from(collection);for(let len=collectionArray.length,n=0;n<len;n++){arrayFromCollection.push(collectionArray[n]);}return arrayFromCollection;}/**
     * Subscribes to the given observable and returns a promise that resolves when the observable emits or completes, and rejects when the observable errors.
     * @param observable The observable to convert into a promise.
     * @param unsubscribeWhenValueReceived True if the promise should unsubscribe from the observable when a value is received in any
     * of the observer callbacks, or false to not unsubscribe.
     * @param resolveNextCount The numbers of emits on the observable required in order to resolve.
     * @returns See description.
     */function observableToPromise(observable,unsubscribeWhenValueReceived,resolveNextCount){resolveNextCount=resolveNextCount!==undefined?resolveNextCount:1;{assert$1(resolveNextCount>0,"resolveNextCount must be greater than 0");}unsubscribeWhenValueReceived=unsubscribeWhenValueReceived!==undefined?unsubscribeWhenValueReceived:false;return new Promise((resolve,reject)=>{let isDone=false;let subscription;let nextCounter=0;const observer=new Observer(value=>{nextCounter+=1;if(resolveNextCount&&nextCounter>=resolveNextCount){// subscription is null when the next handler is called synchronously from the observable.subscribe invocation.
    if(unsubscribeWhenValueReceived&&subscription){subscription.unsubscribe();}isDone=true;resolve(value);}},err=>{// subscription is null when the error handler is called synchronously from the observable.subscribe invocation.
    if(unsubscribeWhenValueReceived&&subscription){subscription.unsubscribe();}isDone=true;reject(err);},()=>{// subscription is null when the complete handler is called synchronously from the observable.subscribe invocation.
    if(unsubscribeWhenValueReceived&&subscription){subscription.unsubscribe();}isDone=true;resolve();});subscription=observable.subscribe(observer);// The following is true when the observable.subscribe invocation above synchronously invokes one of the handlers on the observer.
    // In that case the handler would not have been able to unsubscribe because subscription wouldn't have been defined yet, which
    // means we need to unsubscribe here.
    if(unsubscribeWhenValueReceived&&isDone&&subscription){subscription.unsubscribe();}});}/**
     * A deterministic JSON stringify implementation. Heavily adapted from https://github.com/epoberezkin/fast-json-stable-stringify.
     * This is needed because insertion order for JSON.stringify(object) affects output:
     * JSON.stringify({a: 1, b: 2})
     *      "{"a":1,"b":2}"
     * JSON.stringify({b: 2, a: 1})
     *      "{"b":2,"a":1}"
     * @param data Data to be JSON-stringified.
     * @returns JSON.stringified value with consistent ordering of keys.
     */function stableJSONStringify(node){// This is for Date values.
    if(node&&node.toJSON&&typeof node.toJSON==="function"){node=node.toJSON();}if(node===undefined){return;}if(typeof node==="number"){return isFinite(node)?""+node:"null";}if(typeof node!=="object"){return JSON.stringify(node);}let i;let out;if(Array.isArray(node)){out="[";for(i=0;i<node.length;i++){if(i){out+=",";}out+=stableJSONStringify(node[i])||"null";}return out+"]";}if(node===null){return "null";}const keys=Object.keys(node).sort();out="";for(i=0;i<keys.length;i++){const key=keys[i];const value=stableJSONStringify(node[key]);if(!value){continue;}if(out){out+=",";}out+=JSON.stringify(key)+":"+value;}return "{"+out+"}";}/**
     * Creates a clone of the object by recursively traversing it.
     * @param objectToClone Object.
     * @returns Cloned object. See description.
     */function cloneDeepCopy(objectToClone){let response=objectToClone;if(objectToClone!==null){if(Array.isArray(objectToClone)){// We want to retain type as Array in the cloned object.
    response=[];for(let len=objectToClone.length,i=0;i<len;i++){response[i]=cloneDeepCopy(objectToClone[i]);}}else if(typeof objectToClone==="object"){response={};const objectToCloneKeys=Object.keys(objectToClone);for(let len=objectToCloneKeys.length,n=0;n<len;n++){const objectToCloneKeysEntry=objectToCloneKeys[n];const objectToCloneEntry=objectToClone[objectToCloneKeysEntry];if(objectToCloneEntry!==undefined){response[objectToCloneKeysEntry]=cloneDeepCopy(objectToCloneEntry);}}}}return response;}/**
     * Deep clones the given valueWrapper (excluding the value property) but uses valueOverride for its value.
     * @param valueWrapper The ValueWrapper instance to copy.
     * @param valueOverride The value to assign to the copied ValueWrapper. Must not be undefined.
     * @param extraInfoObjectOverride Override value for extraInfoObject.
     * @returns The deep cloned ValueWrapper with its value as valueOverride.
     */function cloneWithValueOverride(valueWrapper,valueOverride,extraInfoObjectOverride){return {value:valueOverride,lastFetchTime:valueWrapper.lastFetchTime,eTag:valueWrapper.eTag,extraInfoObject:extraInfoObjectOverride||cloneDeepCopy(valueWrapper.extraInfoObject)};}/**
     * Determines if the given value fulfills the ValueWrapper interface.
     * @param value The value in question.
     * @returns True if the given value fulfills the ValueWrapper interface, else false.
     */function isValueWrapper(value){if(value&&typeof value==="object"&&value.value&&value.lastFetchTime){return true;}return false;}/**
     * A standard delimiter when producing cache keys.
     */const KEY_DELIM=":";/**
     * The valueType to use when building LdsCacheDependenciesCacheKey
     */const LDS_CACHE_DEPENDENCIES_VALUE_TYPE="lds.LdsCacheDependencies";/**
     * Returns the complete string representation of the cache key.
     * @param cacheKey The key we want the string representation for.
     * @returns See description.
     */function serialize(cacheKey){return `${cacheKey.type}${KEY_DELIM}${cacheKey.key}`;}/**
     * Takes a string representation of a cache key and converts it back into a CacheKey object.
     * @param cacheKey The string representation of a cache key.
     * @returns The CacheKey object representation of the cache key string.
     */function deserialize(cacheKey){const firstDelimIndex=cacheKey.indexOf(KEY_DELIM);const key=cacheKey.substr(firstDelimIndex+1);const type=cacheKey.substr(0,firstDelimIndex);{assert$1(type&&type.length>0,`No key found for type ${cacheKey}`);assert$1(key&&key.length>0,`No key existed for ${cacheKey}`);}return {key,type};}/**
     * Check whether this set contains all specified values.
     * @param sourceSet The source set with which to operate.
     * @param targetValues A collection of target values to check to see if they are all contained in the given sourceSet.
     * @returns True if the given sourceSet contains all the given targetValues, else false.
     */function containsAll(sourceSet,targetValues){let doesContainsAll=true;targetValues.forEach(value=>{if(!doesContainsAll){return;}if(!sourceSet.has(value)){doesContainsAll=false;}});return doesContainsAll;}/**
     * Add all the given targetValues to the given sourceSet.
     * @param sourceSet The source set with which to operate.
     * @param targetValues A collection of target values with which to add to the given sourceSet.
     * @returns The sourceSet for chaining calls, like with add().
     */function addAll(sourceSet,targetValues){targetValues.forEach(value=>{sourceSet.add(value);});return sourceSet;}/**
     * Return a new Set that contains all the values of this set combined with the values from the other set.
     * @param sourceSet The source set with which to operate.
     * @param targetValues A collection of target values with which to union to the given sourceSet.
     * @returns A new set of the values that are in both the given sourceSet and the given targetValues.
     */function union(sourceSet,targetValues){const unionSet=new Set(sourceSet);targetValues.forEach(value=>{unionSet.add(value);});return unionSet;}/**
     * Calculates the set of values consisting of values in the given sourceSet that aren't also in the given targetValues.
     * @param sourceSet The source set with which to operate.
     * @param targetValues A collection of target values with which to difference the given sourceSet.
     * @returns A new set consisting of the values in the given sourceSet that aren't also in the given targetValues.
     */function difference(sourceSet,targetValues){const differenceSet=new Set(sourceSet);targetValues.forEach(value=>{differenceSet.delete(value);});return differenceSet;}/**
     * Used to directly access underlying the cache store(s) using during a single cache transaction.
     */class CacheAccessor{/**
         * Constructs a new CacheAccessor.
         * @param ldsCache The LdsCache parent (scope) for this CacheAccessor.
         * @param timeSource The TimeSource for this CacheAccessor.
         */constructor(ldsCache,timeSource){/**
             * Used to track dependencies added by CacheAccessor operations and saved during commitPuts().
             */this._stagedDependencies=Object.create(null);/**
             * An Object holding the key strings of the values that will be put on the Object's key-side, and on the value-side
             * an Object holding the CacheKey, value Object to cache, and value Object to Emit.
             */this._stagedPutsMap=new Map();/**
             * Contains the string representations of cache keys to clear out of the dependency mapping during commitPuts().
             */this._dependencyKeyStringsToClear=new Set();/**
             * Used to track the Observable emits that will be emitted during finish(). The entries are key: CacheKey,
             * value valueToEmit: ValueWrapper
             */this._stagedEmitsMap=new Map();/**
             * Used to cache the cache key strings that have emits staged.
             */this._stagedEmitsKeyStringsSet=new Set();this._ldsCache=ldsCache;this._nowTime=timeSource.now();this._phase=1/* CACHE_ACCESSOR_PHASE_STAGING_PUTS */;{// Used for debugging. Only available in debug mode.
    setLdsCacheToDebug(ldsCache);}}/**
         * Returns the number representing the time snapshot that will be used by this CacheAccessor's transaction. All cache
         * operations in this transaction will share the same timestamp.
         */get nowTime(){{assert$1(this._phase!==2/* CACHE_ACCESSOR_PHASE_FINISHED */,"Cache accessors should not be accessed after they have been finished.");}return this._nowTime;}/**
         * Gets the cached value wrapper using the provided cache key. This will return staged values ahead of values actually in the underlying
         * cache so that cache operations see a consistent view of values that have been manipulated during the operation.
         * @param cacheKey The cache key for the value you want to fetch.
         * @returns The value wrapper if there is a cache hit, otherwise returns undefined.
         */get(cacheKey){const{_phase,_stagedPutsMap,_ldsCache}=this;{assert$1(_phase!==2/* CACHE_ACCESSOR_PHASE_FINISHED */,"Cache accessors should not be accessed after they have been finished.");}const keyString=serialize(cacheKey);const stagedPutItem=_stagedPutsMap.get(keyString);if(stagedPutItem!==undefined){// Staged values should take precedence over values in the cache.
    const stagedValueToCache=stagedPutItem.valueToCache;return stagedValueToCache;}return _ldsCache.getValue(cacheKey);}/**
         * If a value was committed to cache, this will synchronously return it. This must be called after commitPuts() has been called. This is useful
         * for comparing old and new values when handling affected keys to see exactly how they should be handled.
         * @param cacheKey The cache key for the committed cache value you want to fetch - required.
         * @returns Returns the value wrapper if available and part of the cache commit operation, otherwise returns undefined.
         */getCommitted(cacheKey){{assert$1(this._phase!==2/* CACHE_ACCESSOR_PHASE_FINISHED */,"Cache accessors should not be accessed after they have been finished.");}const keyString=serialize(cacheKey);const stagedPutItem=this._stagedPutsMap.get(keyString);if(stagedPutItem){return stagedPutItem.valueToCache;}return undefined;}/**
         * Stages a put to cache and also stages an Observable emit. If the valueToCache is not a ValueWrapper, it will be wrapped on behalf of
         * the caller. One or more dependentCacheKeys should be provided if possible to track dependencies, or [] if putting a root value.
         * @param dependencies An array of zero or more cache keys that depend on the key/value being staged. These are used
         *        by the cache to track dependencies for consumers and let them know what they have affected in the return value of commitPuts().
         * @param cacheKey The cache key for the value you want to put.
         * @param valueToCache The cache value to put. If it is not a ValueWrapper, it will automatically be wrapped.
         * @param valueToEmit The cache value to emit via Observable. Must not be an instance of ValueWrapper since it will automatically be wrapped in an equivalent ValueWrapper as valueToCache.
         * @param valueWrapperOptionalProperties Optional object with properties to set on the ValueWrapper. If valueToCache is a ValueWrapper these will be ignored.
         * @param valueWrapperToEmitExtraInfoObject Object with properties to set on the emitted ValueWrapper.extraInfoObject.
         */stagePut(dependencies,cacheKey,valueToCache,valueToEmit,valueWrapperOptionalProperties,valueWrapperToEmitExtraInfoObject){{assert$1(this._phase===1/* CACHE_ACCESSOR_PHASE_STAGING_PUTS */,"Puts can only be staged before commitPuts()");}// Default values.
    valueWrapperOptionalProperties=valueWrapperOptionalProperties?valueWrapperOptionalProperties:{};const keyString=serialize(cacheKey);let valueWrapperToCache;if(isValueWrapper(valueToCache)){valueWrapperToCache=valueToCache;}else{valueWrapperToCache=this.newValueWrapper(valueToCache,valueWrapperOptionalProperties.eTag,valueWrapperOptionalProperties.extraInfoObject);}const valueWrapperToEmit=cloneWithValueOverride(valueWrapperToCache,valueToEmit,valueWrapperToEmitExtraInfoObject);{handleDebug("record-service_stagePut",()=>{return {dependencies:dependencies.map(dependency=>({cacheKeyString:serialize(dependency.cacheKey),type:dependency.type})),cacheKey:keyString,valueToCache:valueWrapperToCache,valueToEmit:valueWrapperToEmit};});}const stagedPutItem={cacheKey,valueToCache:valueWrapperToCache,valueToEmit:valueWrapperToEmit,triggerAffectedKeys:true};this._stagedPutsMap.set(keyString,stagedPutItem);if(dependencies.length>0){this.stageDependencies(dependencies,cacheKey);}}/**
         * Stages a put which updates the lastFetchTime of the valueWrapper of the given cacheKey. This will stage an emit
         * for the cache value but will not trigger affected keys for it. We don't want affected keys triggered because
         * lastFetchTime is cache internal metadata that affected key handlers would not care about. Affected key handlers should only
         * get triggered if the actual value has changed.
         * @param cacheKey The cache key for the value you want to put.
         * @returns True if the lastFetchTime was updated on the valueWrapper for the given cacheKey, else false.
         */stagePutUpdateLastFetchTime(cacheKey){{assert$1(this._phase===1/* CACHE_ACCESSOR_PHASE_STAGING_PUTS */,"Update last fetch time can only be staged before commitPuts()");}const keyString=serialize(cacheKey);const existingValueWrapper=this.get(cacheKey);if(existingValueWrapper){const valueWrapperToCache=this.newValueWrapper(existingValueWrapper.value,existingValueWrapper.eTag,existingValueWrapper.extraInfoObject);{handleDebug("stageUpdateLastFetchTime",()=>{return {cacheKey:keyString};});}const stagedPutItem={cacheKey,valueToCache:valueWrapperToCache,valueToEmit:valueWrapperToCache,triggerAffectedKeys:false};this._stagedPutsMap.set(keyString,stagedPutItem);return true;}else{return false;}}/**
         * Used in cases where a dependencies should be tracked, but puts cannot be staged using stagePut() because the values that would be put are
         * known to be insufficient for other affected objects that will need to be denormed/emitted in response. In these cases we need to know about
         * the dependency so that a full refresh of that insufficient value can trigger everything to get caught up. Example: merging record values
         * where we don't have enough fields but we can tell the value has changed, therefore we must refresh the entire record with all tracked
         * fields. One or more dependentCacheKeys should be provided.
         * @param dependencies An array of zero or more Dependency objects that describe other cache keys that depend on the key/value being staged. These are used
         *        by the cache to track dependencies for consumers and let them know what they have affected in the return value of commitPuts().
         * @param cacheKey The cache key for the value on which the dependent cache keys depend.
         */stageDependencies(dependencies,cacheKey){const keyString=serialize(cacheKey);const{_stagedDependencies}=this;let dependenciesEntry=_stagedDependencies[keyString];if(dependenciesEntry===undefined){dependenciesEntry=new Map();_stagedDependencies[keyString]=dependenciesEntry;}for(let len=dependencies.length,c=0;c<len;c++){const dependencyCopy=Object.assign(Object.create(null),dependencies[c]);dependenciesEntry.set(serialize(dependencyCopy.cacheKey),dependencyCopy);}}/**
         * Clears the direct dependencies of this cache key. Should only be called when a comprehensive replacement is taking place (i.e. not a
         * merged value that may be missing as complete a view as what existed prior). If not, valid dependencies could be lost.
         * @param cacheKey The cache key for the dependencies you want to clear.
         */stageClearDependencies(cacheKey){{assert$1(this._phase===1/* CACHE_ACCESSOR_PHASE_STAGING_PUTS */,"Dependencies can only be cleared while staging puts, before commitPuts() and before finished().");}const keyString=serialize(cacheKey);this._dependencyKeyStringsToClear.add(keyString);}/**
         * Commits all staged puts to underlying cache stores. This should be called after making all necessary stagePut() calls because afterwards
         * stagePut() will fail.
         * @return The set of cache keys affected by committed puts. If the set contains values
         *      the appropriate response is to perform denorm (if applicable) of any affected values and either A) stage further emits for the
         *      affected keys/values if possible with what's in cache (the cache hit case) or B) refresh them using the appropriate API call
         *      (the cache miss case).
         */commitPuts(){{assert$1(this._phase===1/* CACHE_ACCESSOR_PHASE_STAGING_PUTS */,"Puts can only be committed once, and must be committed before calling stageEmit().");}this._phase=3/* CACHE_ACCESSOR_PHASE_PUTS_COMMITTED */;// Need a Map<CacheKey, Object> to call putAll();
    const cacheKeyToValueMap=new Map();const{_stagedPutsMap}=this;{handleDebug("record-service_commitPuts1",()=>{return {_stagedPutsMap};});}const stagedPutItems=Array.from(_stagedPutsMap.values());const{_stagedDependencies,_ldsCache}=this;for(let len=stagedPutItems.length,n=0;n<len;n++){const stagedPutItem=stagedPutItems[n];const{cacheKey,valueToEmit,valueToCache}=stagedPutItem;cacheKeyToValueMap.set(cacheKey,valueToCache);this._stageEmitInternal(cacheKey,valueToEmit);this.getOrCreateObservables(cacheKey,_ldsCache.getService(cacheKey.type).getCacheValueTtl());// Make sure there will be an observable for every value we're putting in the cache.
    }_ldsCache.putAll(cacheKeyToValueMap);const dependencyMap=this._ldsCache.getOrCreateDependencyMap();this._mergeDependencies(dependencyMap,_stagedDependencies,this._dependencyKeyStringsToClear);this._ldsCache.saveDependencyMap(dependencyMap);// Filter down deps to return to what (A) is marked to trigger affected keys and (B) to what wasn't in the puts/emits and (C) what keys have Observables (if there
    // is no root Observable for the key there is nothing to do in response to it).
    const stagedPutKeys=Array.from(_stagedPutsMap.keys()).filter(key=>{const stagedPutItem=_stagedPutsMap.get(key);return stagedPutItem&&stagedPutItem.triggerAffectedKeys===true?true:false;});const keyStringsToOmit=union(new Set(Object.keys(_stagedDependencies)),stagedPutKeys);const affectedCacheKeysArray=_ldsCache.getAffectedKeys(stagedPutKeys,dependencyMap.dependencies,keyStringsToOmit);{handleDebug("record-service_commitPuts2",()=>{return {affectedCacheKeysArray};});}return new Set(affectedCacheKeysArray);}/**
         * Stages an Observable emit, typically in response to the keys affected by commitPuts() or a prior stageEmit(). This should be called only
         * after making all necessary stagePut() calls because afterwards stagePut() is disallowed (it will fail).
         * @param cacheKey The cache key for the value you want to emit.
         * @param valueToEmit The cache key for the value you want to emit.
         */stageEmit(cacheKey,valueToEmit){{assert$1(this._phase===3/* CACHE_ACCESSOR_PHASE_PUTS_COMMITTED */,"Emits can only be staged after commitPuts().");}const keyString=serialize(cacheKey);{handleDebug("stage-emit",()=>{return {cacheKey:keyString,valueToEmit};});assert$1(!Array.from(this._stagedPutsMap.keys()).includes(keyString),`You should not stage an emit for something that was already committed to cache: ${keyString}`);}this._stageEmitInternal(cacheKey,valueToEmit);}/**
         * Can be used to see if there is already an emit staged for the provided cache key.
         * @param cacheKey The cache key for the value you want to emit.
         * @returns True if there is an emit staged for this cache key, else false.
         */isEmitStaged(cacheKey){{assert$1(this._phase!==2/* CACHE_ACCESSOR_PHASE_FINISHED */,"Cache accessors should not be accessed after they have been finished.");}const keyString=serialize(cacheKey);return this._stagedEmitsKeyStringsSet.has(keyString);}/**
         * Will return the number of staged emits from staging puts and emits.
         * @return The number of staged emits from staging puts and emits.
         */get stagedEmitsCount(){return this._stagedEmitsKeyStringsSet.size;}/**
         * WARNING!!!! ONLY FOR USE BY INTERNAL CACHE CORE. SERVICE METHODS SHOULD NOT CALL THIS METHOD EVER!!!
         * Runs all emits and disposes. The cache accessor cannot be used anymore after this has been called.
         *
         * TODO: We don't want this method exposed to users of CacheAccessor. We need a better way of exposing only what we want to people who use the cache accessor.
         * We should consider decoupling the transaction from the state machine driving the transaction.
         */finishCacheAccessor(){{assert$1(this._phase===3/* CACHE_ACCESSOR_PHASE_PUTS_COMMITTED */,"finish() should only be called once, after puts have been committed.");}this._phase=2/* CACHE_ACCESSOR_PHASE_FINISHED */;const _ldsCache=this._ldsCache;const stagedEmitsMapArray=Array.from(this._stagedEmitsMap.entries());for(let len=stagedEmitsMapArray.length,n=0;n<len;n++){const[cacheKey,valueToEmit]=stagedEmitsMapArray[n];const cacheValueTtl=_ldsCache.getService(cacheKey.type).getCacheValueTtl();const observables=_ldsCache.getOrCreateObservables(cacheKey,cacheValueTtl);// Make sure there will be an observable for every value we're putting in the cache.
    try{observables.root.emitValue(valueToEmit);}catch(err){const errorStr="Unexpected error during Observable emit! err="+JSON.stringify(err)+` -- err.message=${err.message}`;{// tslint:disable-next-line:no-console
    console.log(errorStr);// Better console handling when we're not in PROD.
    assert$1(false,errorStr);}logger.logError(errorStr);}}this._stagedDependencies=Object.create(null);this._dependencyKeyStringsToClear.clear();this._stagedEmitsMap.clear();this._stagedEmitsKeyStringsSet.clear();}/**
         * Gets the observables for the CacheKey, creating them if necessary.
         * @param cacheKey The cache key for the Observable.
         * @param cacheValueTtl TTL for the value to be cached
         * @returns The Observables for the cache key.
         */getOrCreateObservables(cacheKey,cacheValueTtl){{assert$1(this._phase!==2/* CACHE_ACCESSOR_PHASE_FINISHED */,"Cache accessors should not be accessed after they have been finished.");}return this._ldsCache.getOrCreateObservables(cacheKey,cacheValueTtl);}/**
         * Makes a new immutable ValueWrapper with a lastFetchTime consistent with the rest of the CacheAccessor transaction. Optionally an
         * eTag may be provided (if available), as can an arbitrary Object containing information the ValueProvider may desire during a
         * future cache transaction.
         * @param valueToCache The value to be cached - required (must not be undefined). This should not be an already wrapped
         *      value (instanceof ValueWrapper).
         * @param eTag The eTag to be set on the ValueWrapper.
         * @param extraInfoObject An arbitrary object that ValueProviders may use to store additional information about the value being
         *      cached.
         * @returns The provided params wrapped in an immutable ValueWrapper.
         */newValueWrapper(valueToCache,eTag,extraInfoObject){{assert$1(this._phase!==2/* CACHE_ACCESSOR_PHASE_FINISHED */,"Cache accessors should not be accessed after they have been finished.");}return {value:valueToCache,lastFetchTime:this._nowTime,eTag,extraInfoObject};}/**
         * Same as stageEmit() but it doesn't validate lifecycle constraints so it can be called internally from places like stagePut().
         * @param cacheKey The cache key for the value you want to emit.
         * @param valueToEmit The cache key for the value you want to emit.
         */_stageEmitInternal(cacheKey,valueToEmit){const keyString=serialize(cacheKey);this._stagedEmitsKeyStringsSet.add(keyString);this._stagedEmitsMap.set(cacheKey,valueToEmit);}/**
         * Merges the given dependencyMap with the given newDependencies. Clears out old dependencies for those specified by dependenciesToClear.
         * @param dependencyMap The dependency map for the cache.
         * @param newDependencies The keys in the map are string representations of cache
         *      keys and the values are sets of Dependency objects. A given entry value (Set<Dependency>) in
         *      the map represents the known cache keys that are affected when the value represented by the entry key in the
         *      map changes. This map should contain the dependencies for the given cache operation, not everything we've ever
         *      tracked.
         * @param dependenciesToClear The string representations of cache keys that should be cleared out
         *      and replaced by new values in dependencyKeyStringsToClear, if any. Used to reset and recalculated what depends
         *      on a given key.
         */_mergeDependencies(dependencyMap,newDependencies,dependenciesToClear){if(dependenciesToClear.size>0){// Use the reverseLookup index to remove the dependencies.
    const dependenciesToClearArray=Array.from(dependenciesToClear);for(let i=0,length=dependenciesToClearArray.length;i<length;++i){const dependencyToClear=dependenciesToClearArray[i];const reverseLookupEntry=dependencyMap.dependenciesReverseLookup[dependencyToClear];if(reverseLookupEntry){const reverseLookupEntryArray=Array.from(reverseLookupEntry);for(let k=0,reverseLookupEntryArrayLength=reverseLookupEntryArray.length;k<reverseLookupEntryArrayLength;++k){const reverseLookupKey=reverseLookupEntryArray[k];const dependenciesEntryForReverseLookupKey=dependencyMap.dependencies[reverseLookupKey];if(dependenciesEntryForReverseLookupKey){dependenciesEntryForReverseLookupKey.delete(dependencyToClear);if(dependenciesEntryForReverseLookupKey.size===0){delete dependencyMap.dependencies[reverseLookupKey];}}}// Remove the entry.
    delete dependencyMap.dependenciesReverseLookup[dependencyToClear];}}}// Loop through new dependencies and shove them in.
    const newDependenciesKeys=Object.keys(newDependencies);for(let len=newDependenciesKeys.length,n=0;n<len;n++){const newDependenciesKeyString=newDependenciesKeys[n];if(!dependencyMap.dependencies[newDependenciesKeyString]){// Completely new entry.
    dependencyMap.dependencies[newDependenciesKeyString]=new Map(newDependencies[newDependenciesKeyString]);}else{// Existing entry, so merge.
    newDependencies[newDependenciesKeyString].forEach((value,key)=>{dependencyMap.dependencies[newDependenciesKeyString].set(key,value);});}if(dependencyMap.dependencies[newDependenciesKeyString].size>0){// Update the reverse lookup index.
    dependencyMap.dependencies[newDependenciesKeyString].forEach((_dependency,reverseLookupKey)=>{let reverseLookupEntry=dependencyMap.dependenciesReverseLookup[reverseLookupKey];if(!reverseLookupEntry){reverseLookupEntry=new Set();reverseLookupEntry.add(newDependenciesKeyString);dependencyMap.dependenciesReverseLookup[reverseLookupKey]=reverseLookupEntry;}else{reverseLookupEntry.add(newDependenciesKeyString);}});}}}}/**
     * Builds the cache key.
     * @param ldsCacheName The name of the LDS cache used to scope related dependencies.
     * @returns A new cache key representing the LDS_CACHE_DEPENDENCIES_VALUE_TYPE value type.
     */function buildCacheKey(){return {type:LDS_CACHE_DEPENDENCIES_VALUE_TYPE,key:"DEPENDENCY_MAP"};}function fetch(requestUrl,ldsRequestInit){return aura.executeGlobalController(requestUrl,ldsRequestInit.requestParams,ldsRequestInit.options);}/**
     * Mapping between wire name and ui-api resource reference config.
     */const wireAdapterNameToResourceReferenceMapping={"force/lds":{getForm:{categoryType:"UI_API",valueType:"uiapi.FormRepresentation",urlTemplate:{uri:"/services/data/v47.0/ui-api/forms/{apiName}",uriMappings:{apiName:"apiName"}},prefetch:true,batchable:false},getFormSectionUi:{categoryType:"UI_API",valueType:"uiapi.FormSectionUiRepresentation",urlTemplate:{uri:"/services/data/v47.0/ui-api/aggregate-ui",queryMappings:{formFactor:"formFactor",query:"query"}},prefetch:true,batchable:false},getLayout:{categoryType:"UI_API",valueType:"uiapi.RecordLayoutRepresentation",urlTemplate:{uri:"/services/data/v47.0/ui-api/layout/{objectApiName}",uriMappings:{objectApiName:"objectApiName"},queryMappings:{formFactor:"formFactor",layoutType:"layoutType",mode:"mode",recordTypeId:"recordTypeId"}},prefetch:true,batchable:false},getLayoutUserState:{categoryType:"UI_API",valueType:"uiapi.RecordLayoutUserStateRepresentation",urlTemplate:{uri:"/services/data/v47.0/ui-api/layout/{objectApiName}/user-state",uriMappings:{objectApiName:"objectApiName"},queryMappings:{formFactor:"formFactor",layoutType:"layoutType",mode:"mode",recordTypeId:"recordTypeId"}},prefetch:true,batchable:false},getObjectInfo:{categoryType:"UI_API",valueType:"uiapi.ObjectInfoRepresentation",urlTemplate:{uri:"/services/data/v47.0/ui-api/object-info/{objectApiName}",uriMappings:{objectApiName:"objectApiName"}},prefetch:true,batchable:false},getPicklistValues:{categoryType:"UI_API",valueType:"uiapi.PicklistValuesRepresentation",urlTemplate:{uri:"/services/data/v47.0/ui-api/object-info/{objectApiName}/picklist-values/{recordTypeId}/{fieldApiName}",uriMappings:{fieldApiName:"fieldApiName",objectApiName:"objectApiName",recordTypeId:"recordTypeId"}},prefetch:true,batchable:false},getPicklistValuesByRecordType:{categoryType:"UI_API",valueType:"uiapi.PicklistValuesCollectionRepresentation",urlTemplate:{uri:"/services/data/v47.0/ui-api/object-info/{objectApiName}/picklist-values/{recordTypeId}",uriMappings:{recordTypeId:"recordTypeId",objectApiName:"objectApiName"}},prefetch:true,batchable:false},getRecord:{categoryType:"UI_API",valueType:"uiapi.RecordRepresentation",urlTemplate:{uri:"/services/data/v47.0/ui-api/records/{recordId}",uriMappings:{recordId:"recordId"},queryMappings:{childRelationships:"childRelationships",fields:"fields",mode:"mode",layoutTypes:"layoutTypes",pageSize:"pageSize",optionalFields:"optionalFields"}},prefetch:true,batchable:false},getRecordAvatars:{categoryType:"UI_API",valueType:"uiapi.RecordAvatarBulk",urlTemplate:{uri:"/services/data/v47.0/ui-api/record-avatars/batch/{recordIds}",uriMappings:{recordIds:"recordIds"},queryMappings:{formFactor:"formFactor"}},prefetch:false,batchable:false},getRecordCreateDefaults:{categoryType:"UI_API",valueType:"uiapi.RecordDefaultsRepresentation",urlTemplate:{uri:"/services/data/v47.0/ui-api/record-defaults/create/{objectApiName}",uriMappings:{objectApiName:"objectApiName"},queryMappings:{formFactor:"formFactor",optionalFields:"optionalFields",recordTypeId:"recordTypeId"}},prefetch:true,batchable:false},getRecordUi:{categoryType:"UI_API",valueType:"uiapi.RecordUiRepresentation",urlTemplate:{uri:"/services/data/v47.0/ui-api/record-ui/{recordIds}",uriMappings:{recordIds:"recordIds"},queryMappings:{childRelationships:"childRelationships",formFactor:"formFactor",layoutTypes:"layoutTypes",modes:"modes",optionalFields:"optionalFields",pageSize:"pageSize"}},prefetch:true,batchable:false}}};/**
     * Returns object containing mapping for wire adapter name to resource reference configs.
     * @returns Object containing resource reference objects, indexed by wire name.
     */function getResourceReferenceMappings(){return wireAdapterNameToResourceReferenceMapping["force/lds"];}const USE_DEDUPE_KEY="isAggregateUiDedupingEnabled";const USE_DEDUPE_CONFIGURATION_KEY="transport."+USE_DEDUPE_KEY;let getServiceConfiguration;function provideConfiguration(configProvider){getServiceConfiguration=configProvider;}// Ability to check configuration for enablement of features
    /**
     * Class to build a URL Query string.
     */class URLBuilder{constructor(){/**
             * Map containing all of the parameters.
             */this._queryMap=new Map();}/**
         * Setter method for the query string.
         * @param key Key of the parameter.
         * @param value Value of the parameter.
         */set(key,value){this._queryMap.set(key,value);}/**
         * Build method to return the query string.
         * @returns The query string.
         */build(){let queryString="";for(const[key,value]of this._queryMap.entries()){if(queryString.length===0){queryString+="?";}else{queryString+="&";}queryString+=key+"="+value;}return queryString;}}/**
     * Creates and returns a FetchResponse given an fetch promise. Standardizes error responses
     * from Aura actions.
     * TODO: Update CiJ response shape to match REST errors: W-5142315. Once this is completed we can update
     * the logic below to directly consume it instead of generating it.
     * @param fetchResponse - The return value from fetch.
     * @param isAggregateUi Whether its an Aggregate UI API call or not.
     * @param isComposite Whether the caller expects multiple responses
     * @returns Returns a Promise resolved with a FetchResponse object.
     */async function createFetchResponse(fetchResponse,isAggregateUi,isComposite){try{const result=await fetchResponse;if(isAggregateUi){// Aggregate request.
    if(!result.compositeResponse||!result.compositeResponse[0]){throw new Error("Using AggregateUi but received invalid data back from ui-api aggregate-ui endpoint: "+JSON.stringify(result));}if(!isComposite){const compositeResponse=result.compositeResponse[0];const{body,httpStatusCode}=compositeResponse;let ok=true;let statusText="OK";if(httpStatusCode===304){statusText="Not Modified";}else if(httpStatusCode>=400&&httpStatusCode<=599){const errorResponse=body[0];statusText=errorResponse.errorCode;ok=false;}return {ok,status:httpStatusCode,statusText,body};}else{// Return the whole set
    const body=result;// Any individual status may not represent the set; return whatever we get, and the caller must figure out what it means to the composite
    return {ok:true,status:200,statusText:"OK",body};}}// Regular request.
    return getOkFetchResponse(result);}catch(exception){let ok=false;let status=400;let statusText="Bad Request";let body=exception;// Massage the error shape if this error has the ui api error (the data property) wrapped in a bigger error.
    if(exception&&exception.data){// This is an aura controller error shape which has a more specific status.
    // We need to manually assign this value as the status of the FetchResponse
    // and generate the corresponding http status text.
    status=exception.data.statusCode;switch(status){case 304:ok=true;statusText="Not Modified";break;case 404:statusText="Not Found";break;default:statusText="Bad Request";}body=exception.data;}return {ok,status,statusText,body};}}/**
     * From an aggregate bag, extract only the 1 response of interest
     * @param requestUri The URI that identifies which output value (also identified by URI) to extract / return
     * @param aggregateResponse An aggregate (could be 1 or more responses) to inspect
     * @returns The first response from the aggregate that matches the requestUri
     * @throws Error if the requestUri wasn't found in aggregateResponse
     */function extractSingleOperation(requestUri,aggregateResponse){if(aggregateResponse&&aggregateResponse.compositeResponse){for(const response of aggregateResponse.compositeResponse){if(response.url===requestUri){return response;}}}throw new Error("Expected to receive output for "+requestUri+" but it was missing from the response payload");}/**
     * Convert a single-payload operationResponse into a FetchResponse, as used/expected by most wire services
     * @param operationResponse
     * @returns FetchResponse to represent the single payload response
     */function operationResponseToFetchResponse(operationResponse){const{body,httpStatusCode}=operationResponse;let ok=true;let statusText="OK";if(httpStatusCode===304){statusText="Not Modified";}else if(httpStatusCode>=400&&httpStatusCode<=599){const errorResponse=body[0];statusText=errorResponse.errorCode;ok=false;}return {ok,status:httpStatusCode,statusText,body};}/**
     * Type-specific fetch for Aggregate requests. Restructures the input into the right format for the Aura fetch request, with parameters about how to operate
     * @param input Aggregate request
     * @returns Promise to fetch an Aggregate response
     */function fetchAggregate(aggregateRequest){if(aggregateRequest.input.compositeRequest.length===0){throw new Error("Unnecessary request for 0 aggregate requests");}const hotspot=true;const background=false;const longRunning=false;const ldsRequestInit={requestParams:aggregateRequest,options:{hotspot,background,longRunning}};return fetch("RecordUiController.executeAggregateUi",ldsRequestInit).then(response=>{return response;});}const REFERENCE_REGEX=/\$\{\w+\}/g;/**
     * AggregateUi requests may have references to other requests inside the same aggregate request. Given a single request, what are the refernceIds of the dependencies?
     * Example:
     * requestReferences({
     *      httpHeaders: []
     *      referenceId: "ADG_12"
     *      url: ".../object-info?objectApiName=${ADG_4}.objectApiName"
     * })
     *  => ["ADG_4"]
     * This request depends on ADG_4's output to fulfill the objectApiName for this request.
     * @param input OperationInput which may (or may not) reference other requests in the same aggregate request
     * @returns list of referenceIds this request depends on
     */function requestReferences(input){const references=[];let m;do{m=REFERENCE_REGEX.exec(input.url);if(m){references.push(m[1]);}}while(m);return references;}/**
     * @param referenceId unique identifier to a response
     * @param inputs list of responses
     * @returns The operation response that has the same referenceId, or undefined if it's not in the list
     */function getRequestById(referenceId,inputs){return inputs.find(oir=>{return oir.referenceId===referenceId;});}/**
     * Global map between requestUri and the Promise that will contain the data
     * Must span multiple AggregateUiExecutors; truly global
     */const pendingRequestMap=new Map();/**
     * Class to make calls to aggregate-ui. Maintains mapping of requests.
     */class AggregateUiExecutor{constructor(){/**
             * Counter for requests.
             */this._count=0;/**
             * Map between referenceId and valueType for each aggregate-ui request.
             */this.requestValueTypeMapping=new Map();}/**
         * Makes a call to the server for a single representation via aggregate ui for the given wire name and params.
         * Transforms the response into a TransformResponse and rejects if there is a client/server error.
         * @param wireName The name of the wire adapter.
         * @param requestParams Object containing parameters of the ui-api request.
         * @param TTL The TTL of the resource. This is not currently being used in 218. Will be used for mobile.
         * @returns Returns a Promise resolved with a FetchResponse object.
         */executeSingleRequestOverAggregateUi(wireName,requestParams,TTL){this._count++;const resourceReferenceConfig=getResourceReferenceMappings()[wireName];if(!resourceReferenceConfig){throw new Error("Could not find wire mapping for wire adapter: "+wireName+" in wire-name-to-reference-resource-map.ts");}const referenceId="LDS"+"_"+Date.now().toString()+"_"+this._count;const clientOptions=requestParams.clientOptions;const input=this._generateAggregateUiInput(resourceReferenceConfig,requestParams,clientOptions,referenceId,TTL);const aggregateUiInput={input};// Set mapping between reference id and value type. This is only being used for tests
    this.requestValueTypeMapping.set(referenceId,resourceReferenceConfig.valueType);// fetch / filter requested inputs out of the aggregate response
    return this.executeAggregateUi(aggregateUiInput).then(extractSingleOperation.bind(null,input.compositeRequest[0].url)).then(operationResponseToFetchResponse)// Interesting quality of aggregateUi... normally we'd throw an error if the request failed, but AggregateUi fails _individual_ requests, rather than the bucket. So it always succeeds
    .catch(handleFetchException).then(throwIfClientOrServerError);}/**
         * When fetching multiple requests in an aggregate, some may be the same as ones in-flight, and some may need to be freshly requested.
         * Regardless of the details, this function promises to return an Aggregate response of what was asked for in the input
         * @param aggregateRequest A collection of 0 or more UI-API requests to be fetched
         * @returns Promise to gather the requested data; the order of return.compositeResponse is guaranteed to correlate to the order of the request inputs
         */getPromiseForValues(aggregateRequest){const promiseToFulfillOriginalRequest=[];// <inputUri -> OperationInput> of only requests that should be included in the new XHR/batch
    const freshBatch=new Map();// Figure out what we need to freshly request (and what is in-flight)
    for(let i=0;i<aggregateRequest.input.compositeRequest.length;i++){const inputRequest=aggregateRequest.input.compositeRequest[i];if(!pendingRequestMap.has(inputRequest.url)){/*
                    If this request relies on output from other requests, include those in the batch as well

                    Nuance:
                        request: [ getObjectInfo, getRecord(usesObjectInfo)]
                        getObjectInfo is inflight, so we want to wait on that...
                        but the next getRecord USES getObjectInfo (evaluated by aggregateUi on the server). So we need to include it in the batch

                        If we don't we'd dispatch:
                            [ getRecord(missing reference)]
                    */requestReferences(inputRequest).forEach(depReq=>{const dependencyInput=getRequestById(depReq,aggregateRequest.input.compositeRequest);if(!dependencyInput){throw new Error("Request for "+inputRequest.url+" depends on the output of another request ("+depReq+") that's not part of the aggregate");}if(!freshBatch.has(dependencyInput.url)){freshBatch.set(dependencyInput.url,dependencyInput);}});if(!freshBatch.has(inputRequest.url)){freshBatch.set(inputRequest.url,inputRequest);}}}// List version of freshBatch, containing the list of requests
    const freshQueue=Array.from(freshBatch.values());// The promise that kicks off the fresh batch request (or does nothing because all requests are de-duped to in-flight XHRs)
    const promiseFreshValues=freshQueue.length>0?fetchAggregate({input:{compositeRequest:freshQueue}}):new Thenable(()=>undefined);// For each request, check if it's pending
    // - if it's pending, return that promise (for the in-flight XHR)
    // - if it's not pending, depend on the promise for the fresh batch XHR
    for(let i=0;i<aggregateRequest.input.compositeRequest.length;i++){const inputRequest=aggregateRequest.input.compositeRequest[i];// If the request should be requested freshly, depend on the fresh batch & mark that it's pending
    if(!pendingRequestMap.has(inputRequest.url)){// This assumes that the request ID doesn't matter except for setting up the dependencies between things (ensured by the previous phase)
    pendingRequestMap.set(inputRequest.url,promiseFreshValues.then(extractSingleOperation.bind(null,inputRequest.url)));}// Implied else: If the request is in-flight, wait for the value from that XHR (skip)
    promiseToFulfillOriginalRequest.push(pendingRequestMap.get(inputRequest.url));}return Promise.all(promiseToFulfillOriginalRequest).then(this.mergeIntoAggregate);/*
            Some interesting scenarios this section accounts for / handles....

            Scenario 1: fairly normal split-request
                input: [ A, B ]
                A is inflight
                B is fresh

                Promise.all(
                    [
                        XHR1.getA,
                        XHR2.getB
                    ]
                )

            Scenario 2: extracting a single value from an in-flight batch
                input: [getRecord]
                inflight XHR: [ getObjectInfo, getRecord, getRecordAvatars, etc]
                [bigXhr].then(extractSingle) ==> the 1 value you requested

            Scenario 3: timing of whether a dependant should be returned from the latest batch vs the (earlier) in-flight:
            [
                getObjectInfo(A)
                getObjectInfo(A)
                ... huge // downside: depending on this earlier-dispatched request is the slower choice
            ]

            ... what if something changes in the back-end? Early request is out-of-date, but the later one will be "correct"

            [
                getObjectInfo(A)
                getRecord(objectInfo)
                .... but this could be huge, where this is the slower choice. In the end, we don't know which will be better, so we chose to wait on the earlier request
            ]

            [
                getObjectInfo(A)
                // will wait on #2, which may take longer to return than #1
                vs
                // wait on #1 which is in pendingRequestMap
            ]


            [
                getObjectInfo(A)
                getRecord(objectInfo)
                .... but this could be huge, where this is the slower choice. In the end, we don't know which will be better, so we chose to wait on the earlier request
            ]
            alternative to re-requesting in-flight dependencies
            [
                getObjectInfo(A)
            ]

            Scenario 4: inner-field list spread
                Unaddressed (needs wire-adapter logic)
                    [getRecord(fields: A, B)]
                    [getRecord(fields: B, C)]
                    [getRecord(fields: A, D)]

                    We (transport layer) don't/can't understand that these fields are mergable; we only do EXACT request URI matches
            */}/**
         * Aggregates responses into a single response, and marks each as having been fulfilled
         * @param responses Collection of individual responses
         * @returns Aggregate response representing the collection of individual responses
         */mergeIntoAggregate(responses){// Clean up request queue
    for(const response of responses){pendingRequestMap.delete(response.url);}return {compositeResponse:responses};}/**
         * Gather multiple datum in a batch. May result in an XHR to fetch all the requests, or may depend on other in-flight requests
         * @param aggregateRequest Aggregate Input
         * @returns Aggregate Response in the same order as they were requested
         */executeAggregateUi(aggregateRequest){// getServiceConfiguration may not be provided during some tests, but should always be provided in production. Default to de-duping
    if(!getServiceConfiguration||getServiceConfiguration(USE_DEDUPE_CONFIGURATION_KEY)){return this.getPromiseForValues(aggregateRequest);}else{return fetchAggregate(aggregateRequest);}}/**
         * Given a ResourceReferenceConfiguration and a parameters object, fetches the config from wire-mapping.ts file and generates the ui-api aggregate ui input. Example shape:
         * {
         *  "input":
         *      {
         *          "compositeRequest":[
         *              {
         *                  "url":"/services/data/v46.0/ui-api/object-info/Opportunity",
         *                  "referenceId":"lds_ObjectInfo"
         *              }
         *          ]
         *      }
         * }
         *
         * @param resourceReferenceConfig The ResourceReferenceConfiguration for the wire adapter.
         * @param params Object containing parameters of the ui-api request.
         * @param referenceId Unique identifier for the request.
         * @param TTL The TTL of the resource.
         * @returns A composite request representing the valueProvider parameters.
         */_generateAggregateUiInput(resourceReferenceConfig,requestParams,clientOptions,referenceId,_TTL){const aggregateInputRepresentation={compositeRequest:[]};const operationInput=_generateOperationInputRequest(resourceReferenceConfig,requestParams,clientOptions,referenceId,_TTL);aggregateInputRepresentation.compositeRequest.push(operationInput);return aggregateInputRepresentation;}}/**
     * Creates an emittable error object for when an internal LDS error occurs (eg a programmer error).
     * @param errorCode Error code to assist with post-mortem analysis. Generally unique per call site.
     * @param message Error message to assist with post-mortem analysis.
     * @param enableLogging Enable logging a gack to the server.
     * @returns An emittable error object.
     */function getLdsInternalError(errorCode,message,enableLogging){// Capture the stack for internal telemetry
    let stack;try{throw new Error(message);}catch(err){stack=err.stack;}const response={ok:false,status:500,statusText:"Internal Server Error",body:{errorCode,message,stack}};// Send the error to the server to create a gack.
    if(enableLogging){logger.logError(JSON.stringify(response));}return lwc.readonly(response);}/**
     * Creates an emittable error object matching UIAPI's response when a record is not found (eg has been deleted).
     * @returns An emittable error object.
     */function get404FetchResponse(){return lwc.readonly({ok:false,status:404,statusText:"NOT_FOUND",body:[{errorCode:"NOT_FOUND",message:"The requested resource does not exist"}]});}/**
     * Creates a OK status FetchResponse with the provided body.
     * @param body The value to set as the body of the FetchResponse.
     * @returns A 200 OK FetchResponse object with the provided body.
     */function getOkFetchResponse(body){return {ok:true,status:200,statusText:"OK",body};}/**
     * Throws if the given fetchResponse has a status code between 400 and 599 inclusive; otherwise
     * returns the given fetchResponse.
     * @param fetchResponse - The fetchResponse to evaluate.
     * @returns See description.
     * @throws FetchResponse - See description.
     */function throwIfClientOrServerError(fetchResponse){if(fetchResponse.status>=400&&fetchResponse.status<=599){throw lwc.readonly(fetchResponse);}else{return fetchResponse;}}/**
     * Degrade an exception during a fetch into an error-response
     * @param exception
     * @returns FetchResponse with an errored statusCode & the exception as the body
     */function handleFetchException(exception){let ok=false;let status=400;let statusText="Bad Request";let body=exception;// Massage the error shape if this error has the ui api error (the data property) wrapped in a bigger error.
    if(exception&&exception.data){// This is an aura controller error shape which has a more specific status.
    // We need to manually assign this value as the status of the FetchResponse
    // and generate the corresponding http status text.
    status=exception.data.statusCode;switch(status){case 304:ok=true;statusText="Not Modified";break;case 404:statusText="Not Found";break;default:statusText="Bad Request";}body=exception.data;}return {ok,status,statusText,body};}/**
     * Makes a call to the requestUrl using params and options. Transforms the response into a TransformResponse and rejects if there is a client/server error.
     * TODO: Instead of hard coding requests to aura global controller, let's abstract the transport mechanism.
     * Details in this user story: W-5153607.
     * @param requestUrl The request url.
     * @param requestParams Record containing the parameter name string and corressponding value.
     * @param options Object containing Aura actions config in the format { background, hotspot, longRunning }.
     * @returns Returns a Promise resolved with a FetchResponse object.
     */function executeAuraGlobalController(requestUrl,requestParams,options){let hotspot=true;let background=true;let longRunning=false;let storable;if(options){hotspot=options.hotspot;background=options.background;longRunning=options.longRunning;storable=options.storable;}const ldsRequestInit={requestParams,options:{hotspot,background,longRunning,storable}};const transportPerfMarker=markStart("lds_transport",requestParams.type);return createFetchResponse(fetch(requestUrl,ldsRequestInit)).then(transportResponse=>{markEnd(transportPerfMarker);throwIfClientOrServerError(transportResponse);return transportResponse;});}/**
     * The singleton instance of the AggregateUiExecutor.
     */const aggregateUiExecutor=new AggregateUiExecutor();/**
     * Assemble a bag of configs and params into a UI-API OperationInputRequest, primarily by building a URI to the server resource with params
     * @param resourceReferenceConfig Configuration mapping for how the resource URI should be built & have its params mapped
     * @param requestParams Config bag
     * @param clientOptions Can describe whether the eTag header should be set
     * @param referenceId An ID used to lookup the request
     * @param _TTL unused?
     * @returns OperationInputRequest
     */function _generateOperationInputRequest(resourceReferenceConfig,requestParams,clientOptions,referenceId,_TTL){delete requestParams.clientOptions;// Remove clientOptions from the requestParams object since we don't want to parse it.
    let generatedUri=resourceReferenceConfig.urlTemplate.uri;// Fill out uri values - these are all required.
    const uriMappings=resourceReferenceConfig.urlTemplate.uriMappings;if(uriMappings){const uriMappingKeys=Object.keys(uriMappings);for(let n=0,len=uriMappingKeys.length;n<len;n++){const uriMappingKey=uriMappingKeys[n];const uriValueKey=uriMappings[uriMappingKey];const uriValue=requestParams[uriValueKey];if(uriValue!==undefined){generatedUri=generatedUri.replace("{"+uriValueKey+"}",uriValue);delete requestParams[uriValueKey];}}}// Fill out query string parameters.
    const requestParamKeys=Object.keys(requestParams).sort();// sorting the params gives easy comparability by URIs for the pendingRequestMap
    const queryMappings=resourceReferenceConfig.urlTemplate.queryMappings;const queryParameterBuilder=new URLBuilder();if(queryMappings){for(let n=0,len=requestParamKeys.length;n<len;n++){const requestParamKey=requestParamKeys[n];const queryMappingValue=queryMappings[requestParamKey];if(queryMappingValue){const requestParamValue=requestParams[requestParamKey];if(requestParamValue!==undefined){// If we pass in empty array, skip setting the query param.
    if(Array.isArray(requestParamValue)&&requestParamValue.length===0){continue;}queryParameterBuilder.set(queryMappingValue,requestParamValue);}}}generatedUri+=queryParameterBuilder.build();}const operationInput={url:generatedUri,referenceId};if(clientOptions&&clientOptions.eTagToCheck){operationInput.httpHeaders={};operationInput.httpHeaders["If-None-Match"]=`"${clientOptions.eTagToCheck}"`;}return operationInput;}const UI_API_INDEX_PREFIX="ADG_";/**
     * @param wire module + name identifying the wire in use
     * @param params config-bad
     * @param referenceId Identifier of the request (used for cross-input references and retrieval from an aggregate response)
     * @returns OperationInputRepresentation
     */function mapDataDependencyToOperationInput(wire,params,referenceId){const resourceReferenceConfig=getResourceReferenceMappings()[wire.name];if(!resourceReferenceConfig){throw new Error("Could not find wire mapping for wire adapter: "+wire.name+" in wire-name-to-reference-resource-map.ts");}return _generateOperationInputRequest(resourceReferenceConfig,params,undefined,UI_API_INDEX_PREFIX+referenceId);}/**
     * What's the valueType for each of these wires?
     * @param wireNames list of wire names
     * @returns list of value-types classifying the wire
     */function mapWireNamesToValueType(wireNames){return wireNames.map(wireName=>{const resourceReferenceConfig=getResourceReferenceMappings()[wireName];if(!resourceReferenceConfig){throw new Error("Could not find wire mapping for wire adapter: "+wireName+" in wire-name-to-reference-resource-map.ts");}return resourceReferenceConfig.valueType;});}/**
     * Provides client-side caching functionality. Consumers read values from the cache via observables that the cache hands out: one observable maps to one cache value.
     * An observable can emit the following:
     * next:
     *      The cache value for the requested value.   If the value changes it will trigger another next.
     * error:
     *      An error was encountered when trying to provide a value. The value given as the error is a regular object, not an Error object. Reasons:
     *      1. it's what you get from the UI API, nothing more or less
     *      2. it's not being thrown, it's emitted
     *      3. stack trace is not required
     *      4. in a sense this is "data" even though it's data about an error so an object is appropriate
     * complete:
     *      Signals the observable has stopped (not because of an error) and will not be emitting any further values. This happens when a cache value is LRU'd out
     *      of the cache or when a value provider returns a 404 from the server.
     */class LdsCache{/**
         * Constructor.
         * @param cacheName The name for this cache. Used to register cache stats by name.
         * @param cacheStore LDS cache store
         * @param timeSource LDS time source
         */constructor(cacheName,cacheStore,timeSource){/**
             * The map of cache key string representations to core observables.
             */this._observablesMap=new Map();/**
             * A map used to track in-flight value providers so they can be debounced.
             */this._valueProviderDebounceMap=new Map();/**
             * Internal cacheStats object to track cache statistics
             */this._serviceRegistry=new Map();this.timeSource=timeSource;this._cacheStore=cacheStore;this._cacheStats=service.registerCacheStats(cacheName.replace(/\s+/g,"_"));}/**
         * @returns A thenable that resolves when the instance is ready to be accessed.
         */access(){const handler=resolve=>{this._cacheStore.access(()=>{resolve();});};return this._cacheStore.isDurable()?new Promise(handler):new Thenable(handler);}/**
         * Bootstraps the LDS cache by bootstraping the cache store.
         */bootstrap(){this._cacheStore.bootstrap();}/**
         * Stage puts the given value using the given cacheAccessor based associated to the given valueType.
         * @param valueType The value type associated to the given value.
         * @param dependencies A list of cache keys that rely on the given value.
         * @param value The value to stage put.
         * @param cacheAccessor The cache accessor to stage put the value into.
         * @param additionalData An optional property bag object that can be consumed by an actual service implimentation of stagePutValue.
         *
         * @throws TransportResponse - Throws when a service is not found for the given valueType. This is a programmer error!
         */stagePutValue(valueType,dependencies,value,cacheAccessor,additionalData){{this._validateIsReady();}const service$$1=this._serviceRegistry.get(valueType);if(!service$$1){throw getLdsInternalError("SERVICE_NOT_FOUND","Could not find service for valueType: "+valueType.toString(),true);}service$$1.stagePutValue(dependencies,value,cacheAccessor,additionalData);}/**
         * Strips eTags from the given value associated with the given valueType.
         * @param valueType The value type associated to the given value.
         * @param value The value from which to strip the eTags.
         * @returns The given value stripped of all eTags.
         *
         * @throws TransportResponse - Throws when a service is not found in the registry for the given valueType. This is a programmer error!
         */stripETagsFromValue(valueType,value){{this._validateIsReady();}const service$$1=this._serviceRegistry.get(valueType);if(!service$$1){throw getLdsInternalError("SERVICE_NOT_FOUND","Could not find service for valueType: "+valueType.toString(),true);}return service$$1.stripETagsFromValue(value);}/**
         * Gets a value using the value provider and then caches it.
         * @param cacheKey The cache key.
         * @param valueProvider The value provider used to retrieve the value if it is not found in cache or needs to be refreshed.
         * @param finishedCallbacks Respective functions will be invoked on outcome of the get.
         * @returns The observable used to get the value and keep watch on it for changes.
         */get(cacheKey,valueProvider,finishedCallbacks){const keyString=serialize(cacheKey);const cacheKeyValueTypeString=cacheKey.type;const cacheValueTtl=this.getService(cacheKey.type).getCacheValueTtl();const observables=this.getOrCreateObservables(cacheKey,cacheValueTtl);const cacheAccessor=new CacheAccessor(this,this.timeSource);if(this._debounceOrTrackValueProvider(cacheKey,valueProvider)){return observables.finalTransformed;}let finishedExecuted=false;const finished=error=>{{this._untrackValueProvider(cacheKey,valueProvider);}// Invoke any applicable callbacks.
    if(finishedCallbacks){if(finishedCallbacks.errorCallback&&error){finishedCallbacks.errorCallback(error);}else if(finishedCallbacks.successCallback){finishedCallbacks.successCallback();}}finishedExecuted=true;};// Before accessing the cache store we need to make sure the cache is ready.
    this.access().then(()=>{const cacheGetPerfMarker=markStart("lds_cache_get",cacheKeyValueTypeString);const valueWrapper=this._cacheStore.get(cacheKey);markEnd(cacheGetPerfMarker);// Cache get performance tracker
    const valueProviderPerfMarker=markStart("lds_cache_value_provider",cacheKeyValueTypeString);const valueProviderPerfMarkerPerfContext=valueProviderPerfMarker.perfContext;valueProvider.provide(cacheAccessor).then(valueProviderResult=>{// return so the Thenable will remain part of the outer Thenable chain.
    let callbackError;try{if(valueProviderResult===2/* CACHE_MISS */){// With LDS now supporting delete record, there are scenarios where we are returning a CACHE_MISS but do not have anything staged for emit
    // as a temporary solution, I'm removing the below assert. I will follow this up in the next design meeting
    // This was not discovered previously because we have an issue with our record-ui-emulator which is now fixed
    // assert(cacheAccessor.isEmitStaged(cacheKey), `If this was a miss we should have an emit staged for the cache key: ${keyString}`);
    {// tslint:disable-next-line:no-console
    console.log(`LDS Cache: Cache miss for '${keyString}'; value is provided.`);}this._cacheStats.logMisses();cacheAccessor.finishCacheAccessor();valueProviderPerfMarkerPerfContext.keyStatus="cache_miss";}else if(valueProviderResult===1/* CACHE_HIT */){{assert$1(cacheAccessor.stagedEmitsCount===0,`There shouldn't be any staged emits on a cacheAccessor for a cache hit, with key ${keyString}`);// tslint:disable-next-line:no-console
    console.log(`LDS Cache: Cache hit for '${keyString}'`);}// We need to denormalize and emit a value if the root observable for this cache key has never emitted.
    if(observables.root.lastValue===undefined){const service$$1=this.getService(cacheKey.type);try{const denormalizedValue=service$$1.denormalizeValue(valueWrapper.value,cacheAccessor);const valueWrapperToEmit=cloneWithValueOverride(valueWrapper,denormalizedValue);observables.root.emitValue(valueWrapperToEmit);}catch(err){{// tslint:disable-next-line:no-console
    console.log("LDS CACHE: Could not denormalize value for emit on cache hit. Err: "+JSON.stringify(err));}}}this._cacheStats.logHits();valueProviderPerfMarkerPerfContext.keyStatus="cache_hit";}else if(valueProviderResult===3/* CACHE_MISS_REFRESH_UNCHANGED */){this._cacheStats.logMisses();// This was a 304 unchanged, so update the ValueWrapper.lastFetchTime and emit. Consumers of LDS don't care about lastFetchTime so
    // emits get squashed by distinctUntilChanged because the actual value inside the ValueWrapper hasn't changed.
    // We also don't invoke affected key handlers for the same reason.
    const newValueWrapper=cacheAccessor.newValueWrapper(valueWrapper.value,valueWrapper.eTag,valueWrapper.extraInfoObject);cacheAccessor.stagePut([],cacheKey,newValueWrapper,newValueWrapper.value);cacheAccessor.commitPuts();cacheAccessor.finishCacheAccessor();valueProviderPerfMarkerPerfContext.keyStatus="cache_miss_refresh_unchanged";}else if(valueProviderResult===4/* CACHE_RECORD_FROM_ADS */){// This is the special value for receiving local records from ADS.
    {// tslint:disable-next-line:no-console
    console.log(`LDS Cache: Cached record from ADS '${keyString}'`);}cacheAccessor.finishCacheAccessor();}else{{assert$1(false,`LDS Cache: Invalid valueProviderResult returned from value provider: ${valueProviderResult}`);}}}catch(error){callbackError=error;valueProviderPerfMarkerPerfContext.keyStatus="cache_error";// Anything bad happening in this try block would be an LDS bug. Rethrow here as opposed to let the onRejected handler
    // handle it because we don't want Observables to get these errors (they can't really handle them). Rethrow here (as
    // opposed to logError()) so that the UI will display an error overlay that will be hard to miss, as well as gack.
    throw error;}finally{finished(callbackError);markEnd(valueProviderPerfMarker);// ValueProvider performance tracker
    }}).catch(error=>{if(!finishedExecuted){finished({error});}this._handleValueProviderError(observables.root,cacheKey,error);});});return observables.finalTransformed;}/**
         * Returns the value, or undefined, from the cacheStore.
         * @param cacheKey The cache key for the value you want to get.
         * @returns See description.
         */getValue(cacheKey){return this._cacheStore.access(cache=>cache.get(cacheKey));}/**
         * Puts the cached object using the provided key.
         * @param cacheKey The cache key for the value you want to put - required.
         * @param value The cache value to put.
         */put(cacheKey,value){this._cacheStore.access(cache=>cache.put(cacheKey,value));}/**
         * Puts all the values stored in the map into the cache.
         * @param cacheKeyToValueMap  Map of cacheKeys to values to store into cache.
         *      Values can be falsy and still be cached with the exception of undefined, which is treated as a removed
         *      or non-existent value.
         */putAll(cacheKeyToValueMap){this._cacheStore.access(cache=>cache.putAll(cacheKeyToValueMap));}/**
         * CAUTION! Evicts a value from the cache. Does not remove dependencies and does not call any affected key handlers.
         * @param cacheKey The cache key of the thing to evict.
         */evict(cacheKey){{this._validateIsReady();}const perfMarker=markStart("lds_cache_evict",serialize(cacheKey));this._cacheStore.evict(cacheKey);markEnd(perfMarker);}/**
         * Evicts a value from the cache, emits a 404, and deletes the observable. This should be invoked in response
         * to the system of record having the item deleted.
         * DO NOT USE THIS FOR GENERALLY EVICTING VALUES OUT OF THE CACHE. USE evict() for that!
         * @param cacheKey The cache key to delete.
         */deleteValueAndDeleteObservable(cacheKey){{this._validateIsReady();}const perfMarker=markStart("lds_cache_evict_complete_observables",cacheKey.type);// Evict!
    const didEvict=this._cacheStore.evict(cacheKey);if(didEvict){// Emit 404 error on observable and delete it.
    const observables=this._getObservables(cacheKey);const rootObservable=observables?observables.root:undefined;if(rootObservable){const error=get404FetchResponse();rootObservable.emitError(error);}this._deleteObservables(cacheKey);// Get the affected keys.
    const cacheAccessor=new CacheAccessor(this,this.timeSource);const affectedCacheKeysArray=this.getAffectedKeys([serialize(cacheKey)],this.getOrCreateDependencyMap().dependencies);// Clear out the dependency tree for this value.
    this._clearDependencies(cacheKey);// Handle the affected keys.
    this.handleAffectedKeys(affectedCacheKeysArray,cacheAccessor);}markEnd(perfMarker);// Perf tracker for cache eviction
    }/**
         * A convenience method for value providers that will iterate over the affected keys, look up the registered affected key
         * handler for each affected key, and invoke each handler.
         * @param affectedKeys An iterable of affected keys.
         * @param cacheAccessor The CacheAccessor in scope.
         */handleAffectedKeys(affectedKeys,cacheAccessor){{this._validateIsReady();}const affectedKeysArray=Array.from(affectedKeys);for(let len=affectedKeysArray.length,n=0;n<len;n++){const affectedKey=affectedKeysArray[n];const affectedKeyValue=serialize(affectedKey);const affectedKeyHandlerFn=this._getAffectedKeyHandler(affectedKey.type);{assert$1(affectedKeyHandlerFn,`Handler function not found for affected key: ${affectedKeyValue}`);}if(affectedKeyHandlerFn){affectedKeyHandlerFn(affectedKey,cacheAccessor);}}}/**
         * Method for getting affected keys from a dependency map.
         * @param keyStringsIterable The cache key string representations for which you want to get dependent keys.
         * @param dependenciesKeyStringMap The keys in the map are string representations of cache
         *      keys and the values are sets of string representations of cache keys. A given entry value (Set<string>) in
         *      the map represents the known cache keys that are affected when the value represented by the entry key in the
         *      map changes.
         * @param keyStringsToOmit Set of strings to omit from the affected keys.
         * @returns An array of affected cache keys.
         */getAffectedKeys(keyStringsIterable,dependenciesKeyStringMap,keyStringsToOmit){return collectionToArray(this._getTransitiveDependencies(keyStringsIterable,dependenciesKeyStringMap)).filter(keyString=>{// At this point the set of affected keys includes all the dependencies, including anything the consumer has just staged. Strip out the
    // stuff they have staged (puts/dependencies) since there is no point in them responding to that.
    if(keyStringsToOmit){return !keyStringsToOmit.has(keyString);}return true;}).map(keyString=>{return deserialize(keyString);}).filter(cacheKey=>{// We make this check because it's possible a dependency came from a prior session's cache (from durable store), but in the current
    // session we don't have a live Observable for this key yet.
    return !!this._getObservables(cacheKey);});}/**
         * Gets the observable for the CacheKey, creating one if necessary.
         * @param cacheKey The cache key for the Observable.
         * @param cacheValueTtl TTL of the value to be cached
         * @returns The core observables for the cache key.
         */getOrCreateObservables(cacheKey,cacheValueTtl){let observables=this._getObservables(cacheKey);if(observables===undefined){const keyString=serialize(cacheKey);const root=new Observable("RootObservable: "+keyString);const changesOnly=root.distinctUntilChanged((oldValueWrapper,newValueWrapper)=>{if(observables&&observables.changesOnly.subscriptions.size>0){// TODO: we may not need this subscriptions check anymore as it's being done in the observable transform functions (I think?).
    // Double check this and remove if possible.
    // If the changesOnly Observable has any subscriptions then do an actual equivalency check, otherwise
    // don't do an equivalency check for performance reasons.
    // TODO: W-4434441 - choose the best equivalency method based on the cache key's value type.
    // Compare the non-proxy, non-read-only values. Do this because traversing the entire value structure
    // of a proxy takes way too long.
    return equivalent(oldValueWrapper,newValueWrapper);}return false;});const finalTransformed=changesOnly.mapWithFilterOnSubscribeBehaviorSubject(value=>{let shouldEmit=false;if(this.timeSource.now()<value.lastFetchTime+cacheValueTtl){shouldEmit=true;}else{// TTL expired, we are refreshing the value, remove it from the set once the new value is back
    lastValueTracker.add(value);}return shouldEmit;},valueWrapper=>{return lwc.readonly(valueWrapper.value);});observables={root,changesOnly,finalTransformed};this._observablesMap.set(keyString,observables);}return observables;}/**
         * Registers a service associated to a specific value type with the cache.
         * @param service The service to register with the cache.
         *
         * @throws TransportResponse - Throws when a service has already been registered for the given valueType. This is a programmer error!
         */registerService(service$$1){const valueTypes=service$$1.getValueTypes();valueTypes.forEach(valueType=>{if(this._serviceRegistry.has(valueType)){throw getLdsInternalError("SERVICE_ALREADY_REGISTERED","A service has already been registered for valueType: "+service$$1.getValueTypes().toString(),true);}this._serviceRegistry.set(valueType,service$$1);});}/**
         * Returns the registered service for the given valueType, or throws an error if it is not found.
         * @param valueType The value type associated to the service to get.
         * @returns See description.
         *
         * @throws FetchResponse - Throws when a service is not found for the given valueType. This is a programmer error!
         */getService(valueType){const service$$1=this._serviceRegistry.get(valueType);if(service$$1===undefined){throw getLdsInternalError("SERVICE_NOT_FOUND","Could not find service for valueType: "+valueType.toString(),true);}return service$$1;}/**
         * Returns the registered service for the given valueType, or undefined if it is not found.
         * @param valueType The value type associated to the service to get.
         * @returns See description.
         */getServiceOrUndefined(valueType){return this._serviceRegistry.get(valueType);}/**
         * @returns The dependency map. If it doesn't exist it will create it first.
         */getOrCreateDependencyMap(){{this._validateIsReady();}const cacheDepsCacheKey=buildCacheKey();let dependencyMapCacheValue=this.getValue(cacheDepsCacheKey);if(!dependencyMapCacheValue){dependencyMapCacheValue={dependencies:Object.create(null),dependenciesReverseLookup:Object.create(null)};this.put(cacheDepsCacheKey,dependencyMapCacheValue);}return dependencyMapCacheValue;}/**
         * Saves the given dependencyMap back into the cache.
         * @param dependencyMap The dependency map to save.
         */saveDependencyMap(dependencyMap){{this._validateIsReady();}const cacheDepsCacheKey=buildCacheKey();this.put(cacheDepsCacheKey,dependencyMap);}/**
         * Gets the observable for the CacheKey if one exists.
         * @param cacheKey The cache key for the Observable's value.
         * @returns The core observables for the cache key or undefined if there aren't any.
         */_getObservables(cacheKey){const keyString=serialize(cacheKey);return this._observablesMap.get(keyString);}/**
         * Deletes the observables identified by the given cacheKey.
         * @param cacheKey The key for the core observables.
         * @returns void
         */_deleteObservables(cacheKey){this._observablesMap.delete(serialize(cacheKey));}/**
         * Handles any value provider errors by doing the appropriate action on the given observable.
         * @param observable The observable to act on.
         * @param cacheKey The cache key associated with the value provider that threw an error.
         * @param readOnlyError The error wrapped in a read-only membrane.
         */_handleValueProviderError(observable,cacheKey,readOnlyError){observable.emitError(readOnlyError);this._deleteObservables(cacheKey);if(readOnlyError.status===404){// Remove object from cache and clear out the dependencies.
    try{this.evict(cacheKey);// this.clearDependencies(cacheKey);
    }catch(err){{// tslint:disable-next-line:no-console
    console.log(`Error evicting or clearing dependencies for cacheKey=${cacheKey}. err=${JSON.stringify(err)}`);}}}else{// log the error in development mode
    {// tslint:disable-next-line:no-console
    console.log("Exception encountered in value provider: ",readOnlyError);}}}/**
         * Returns true if an equal value provider is already in-flight (tracked), otherwise returns false and tracks the value provider
         * and cache key combination for the duration of a get() operation for the purpose of debouncing simultaneous equivalent get() operations.
         * @param cacheKey The cache key.
         * @param valueProvider The provider used to retrieve the value if it is not found in cache or needs to be refreshed.
         * @returns True if an equal value provider is already in flight (tracked), otherwise false.
         */_debounceOrTrackValueProvider(cacheKey,valueProvider){const keyString=serialize(cacheKey);const{_valueProviderDebounceMap}=this;let inFlightValueProviders=_valueProviderDebounceMap.get(keyString);if(inFlightValueProviders===undefined){inFlightValueProviders=new Set();_valueProviderDebounceMap.set(keyString,inFlightValueProviders);}const inFlightValueProvidersArray=Array.from(inFlightValueProviders);for(let len=inFlightValueProvidersArray.length,n=0;n<len;n++){const inFlightValueProvider=inFlightValueProvidersArray[n];if(valueProvider.equals(inFlightValueProvider)&&inFlightValueProvider.equals(valueProvider)){return true;}}inFlightValueProviders.add(valueProvider);return false;}/**
         * Stops tracking this in-flight value provider for the purpose of debouncing simultaneous equivalent get() operations.
         * @param cacheKey The cache key.
         * @param valueProvider The provider used to retrieve the value if it is not found in cache or needs to be refreshed.
         */_untrackValueProvider(cacheKey,valueProvider){const keyString=serialize(cacheKey);const{_valueProviderDebounceMap}=this;const inFlightValueProviders=_valueProviderDebounceMap.get(keyString);{assert$1(inFlightValueProviders!==undefined,`Expected to find tracked value providers for ${keyString}`);}if(inFlightValueProviders){inFlightValueProviders.delete(valueProvider);if(inFlightValueProviders.size===0){_valueProviderDebounceMap.delete(keyString);}}}/**
         * Takes a set of key string representations and a dependency map and builds a set of all the transitive dependencies for
         * this input (as key string representations). Note that the output may need to be further filtered because this doesn't account
         * for keys you might not want to return, because they are already part of a cache transaction for example.
         * @param keyStringsIterable The cache key string representations for which you want to get dependent keys.
         * @param dependencies The keys in the map are string representations of cache
         *      keys and the values are sets of string representations of cache keys. A given entry value (Set<string>) in
         *      the map represents the known cache keys that are affected when the value represented by the entry key in the
         *      map changes.
         * @return A set containing all of the transitive dependent keys as key string representations for the given
         *      cache key strings.
         */_getTransitiveDependencies(keyStringsIterable,dependencies){const transitiveDepsSet=new Set();const dependenciesEntryArrayToProcess=[];const keyStringsArray=Array.from(keyStringsIterable);for(let len=keyStringsArray.length,n=0;n<len;n++){const keyString=keyStringsArray[n];const nextSet=dependencies[keyString];if(nextSet){dependenciesEntryArrayToProcess.push(nextSet);}}while(dependenciesEntryArrayToProcess.length>0){const dependencySetMap=dependenciesEntryArrayToProcess.shift();if(dependencySetMap){const dependencySetMapArray=Array.from(dependencySetMap.entries());for(let len=dependencySetMapArray.length,n=0;n<len;n++){const[keyString]=dependencySetMapArray[n];if(!transitiveDepsSet.has(keyString)){transitiveDepsSet.add(keyString);const nextSet=dependencies[keyString];if(nextSet){dependenciesEntryArrayToProcess.push(nextSet);}}}}}return transitiveDepsSet;}/**
         * Clears dependencies and the reverse lookup for a given cacheKey. NOTE: Affected keys handlers for the given cacheKey MUST have already been
         * handled before calling this function, otherwise dependent values will not know that they are invalid.
         * Algorithm:
         * 1. Get the reverse lookup entry for cache key.
         * 2. For each item in the entry, lookup the corresponding entry in the dependencies and remove it. If it reduces the set to zero, also remove the entry itself.
         * 3. Remove the reverse lookup entry for cache key.
         * 4. Lookup dependency entry for cache key.
         * 5. For each item in the entry, get the corresponding entry in the reverse lookup and remove the cache key. If it reduces the set to zero, also remove the entry itself.
         * 6. Remove the dependency entry for cache key.
         * @param cacheKey The cacheKey for which to clear all dependencies.
         */_clearDependencies(cacheKey){{this._validateIsReady();}const key=serialize(cacheKey);const dependencyMap=this.getOrCreateDependencyMap();// * 1. Get the reverse lookup entry for cache key.
    const reverseLookupEntry=dependencyMap.dependenciesReverseLookup[key];// * 2. For each item in the entry, get the corresponding entry in the dependencies and remove the cache key. If it reduces the set to zero, also remove the entry itself.
    if(reverseLookupEntry){const reverseLookupEntryArray=Array.from(reverseLookupEntry);for(let i=0,len=reverseLookupEntryArray.length;i<len;++i){const lookupKey=reverseLookupEntryArray[i];const dependenciesEntryForLookupKey=dependencyMap.dependencies[lookupKey];if(dependenciesEntryForLookupKey){dependenciesEntryForLookupKey.delete(key);if(dependenciesEntryForLookupKey.size===0){delete dependencyMap.dependencies[lookupKey];}}}}// * 3. Remove the reverse lookup entry for cache key.
    delete dependencyMap.dependenciesReverseLookup[key];// * 4. Lookup dependency entry for cache key.
    const dependencyEntry=dependencyMap.dependencies[key];// * 5. For each item in the entry, get the corresponding entry in the reverse lookup and remove the cache key. If it reduces the set to zero, also remove the entry itself.
    if(dependencyEntry){const dependencyEntryArray=Array.from(dependencyEntry);for(let i=0,len=dependencyEntryArray.length;i<len;++i){const[lookupKey]=dependencyEntryArray[i];const lookupEntry=dependencyMap.dependenciesReverseLookup[lookupKey];if(lookupEntry){lookupEntry.delete(key);if(lookupEntry.size===0){delete dependencyMap.dependenciesReverseLookup[lookupKey];}}}}// * 6. Remove the dependency entry for cache key.
    delete dependencyMap.dependencies[key];this.saveDependencyMap(dependencyMap);}/**
         * Convenience function to retrieve an affected key handler function from the service associated to the given valueType.
         * @param valueType The value type associated with the affected key handler.
         * @returns The function that should handle affected cache keys with the provided value type when they
         *      have been affected by a value provider's cache changes.
         */_getAffectedKeyHandler(valueType){return this.getService(valueType).getAffectedKeyHandler();}/**
         * Throws an error if the underlying cache store is not ready yet.
         */_validateIsReady(){if(!this._cacheStore.isReady()){throw getLdsInternalError("INVALID_LDS_CACHE_ACCESS","Programmer Error: LDS Cache had attempted access before it was ready!",true);}}}/**
     * A base service implimentation of ILdsService. Services should extend this class.
     */class LdsServiceBase{/**
         * Constructor.
         * @param ldsCache Reference to the LdsCache instance.
         * @param valueTypes The valueTypes which this services is associated.
         */constructor(ldsCache,valueTypes){this._ldsCache=ldsCache;this._valueTypes=valueTypes;}/**
         * By default all services are not persisted to durable storage.
         */isDurable(){return false;}/**
         * @returns The value type with which the service is associated.
         */getValueTypes(){return this._valueTypes;}/**
         * @returns The affected key handler for the service or null if the service doesn't need one (default).
         */getAffectedKeyHandler(){return null;}/**
         * This default implementation just returns the given value as is. If your service normalizes values
         * then you must override this method to properly denormalize it.
         * @param normalizedValue The normalized value to denormalize.
         * @returns The denormalized value.
         */denormalizeValue(normalizedValue,_cacheAccessor){return normalizedValue;}}/**
     * Used to directly access underlying the cache store(s) using during a single cache transaction.
     */class ValueProvider{/**
         * Constructs a new ValueProvider.
         * @param provideFn The function that will provide a new value.
         * @param parameters The parameters for this value provider.
         * @param equalsFn An optional function that will compare one value provider to another
         *      value provider and return true if they are equal. This is used to debounce value provider calls.
         */constructor(provideFn,parameters,equalsFn){this.parameters=parameters;this._provideFn=provideFn;this._equalsFn=equalsFn?equalsFn:otherValueProvider=>{const thisParamsString=JSON.stringify(this.parameters);const thatParamsString=JSON.stringify(otherValueProvider.parameters);return thisParamsString===thatParamsString;};}/**
         * Provides a Thenable that resolves to a ValueProviderResult marker. Along the way this should stage puts and do
         * other necessary cache operations against the CacheAccessor provided as a parameter.
         * @param cacheAccessor The relevant CacheAccessor for this function.
         * @returns The value provider result.
         */provide(cacheAccessor){return this._provideFn(cacheAccessor,this.parameters);}/**
         * An optional function that will compare this value provider to other value providers and return true if they are
         * equal. This is used to debounce value provider calls.
         * @param otherValueProvider Another value provider to compare this one against.
         * @returns True if the value providers are equal.
         */equals(otherValueProvider){return this._equalsFn.call(this,otherValueProvider);}}function toStoreMap(cacheMap){// serialize dependency map
    const depKey=serialize(buildCacheKey());const serializedDepMap=serializeDependencyMap(cacheMap.get(depKey));cacheMap.set(depKey,serializedDepMap);const storedMap={};cacheMap.forEach((value,keyString)=>{storedMap[keyString]=value;});return storedMap;}/**
     * serialize a dependency map using Array.from on Map and Set
     * @param input the dependency map
     */function serializeDependencyMap(input){const depKeys=Object.keys(input.dependencies);const revDepKeys=Object.keys(input.dependenciesReverseLookup);const out={dependencies:{},dependenciesReverseLookup:{}};for(let i=0,length=depKeys.length;i<length;++i){const key=depKeys[i];out.dependencies[key]=Array.from(input.dependencies[key]);}for(let i=0,length=revDepKeys.length;i<length;++i){const key=revDepKeys[i];out.dependenciesReverseLookup[key]=Array.from(input.dependenciesReverseLookup[key]);}return out;}// LDS Durable storage key
    const durableStoreKey="LDS.DURABLE_STORE";// Configure storage parameters here
    const DEFAULT_AURA_STORAGE={persistent:true,secure:true,maxSize:5*1024*1024,expiration:2592000,clearOnInit:false,debugLogging:false};const createDurableStorage=name=>{// See more about AuraStorage here:
    // https://git.soma.salesforce.com/aura/aura/blob/master/aura-impl/src/main/resources/aura/storage/AuraStorage.js
    // W-5920366: Choose a maxSize and expiration.
    const auraParams=Object.assign({},DEFAULT_AURA_STORAGE,{name});const auraStorage=storage.initStorage(auraParams);if(auraStorage.isPersistent()!==true){instrumentError(new Error("Storage instantiated by Aura is not persistent, disabling durable store"),"LDS_AURA_STORAGE_INIT_FAILURE",InstrumentationErrorType.ERROR);return undefined;}auraStorage.suspendSweeping();return auraStorage;};/**
     * Abstraction for reading and writing a CacheMap from disk. Uses auraStorage as the persistent store.
     */class DurableStoreAccessor{/*
         * Constructor.
         * @param storage: AuraStorage - uses AuraStorage for now until further requirements
         * @param writeBehindDelayMs: number - The number of milliseconds to wait before executing a write-behind.
         */constructor(auraStorage,writeBehindDelayMs){/**
             * Write behind buffer key string to value map.
             */this._writeBehindBuffer=new Map();this._auraStorage=auraStorage;this._writeBehindBufferFlushDelayMs=writeBehindDelayMs?writeBehindDelayMs:100;}/**
         * Loads the CacheMap from disk and returns it.
         * @returns A Promise resolving to the CacheMap from disk.
         */loadCache(){this._auraStorage.getSize().then(sizeInKb=>{const marker=markStart("LDS_DURABLE_STORE_BOOTSTRAP_CACHED_SIZE_Kb","root");marker.perfContext.count=sizeInKb;markEnd(marker);});return this._auraStorage.get(durableStoreKey);}/**
         * Saves the given cacheMap to disk in a write behind. Will not actually write it until the buffer is flushed.
         * @param cacheMap The CacheMap to save.
         */saveCache(cacheMap){this._writeBehindBuffer=cacheMap;this._scheduleWriteBehindBufferFlush();}/**
         * Sets the given pruning strategy to be used during cache load.
         * @param pruningStrategy The pruning strategy to be used during cache load.
         */setPruningStrategy(pruningStrategy){this._pruningStrategy=pruningStrategy;}/*
         * Causes the cache store's write-behind buffer to be flushed to Aura Storage Service. This includes puts and evicts.
         * Calling this more than once during the flush delay window will cause any already-scheduled flush to be canceled and
         * a new one to be scheduled in its place.
         */_scheduleWriteBehindBufferFlush(){if(this._writeBehindBufferFlushTimeoutId){// Cancel any existing flush if there is one.
    window.clearTimeout(this._writeBehindBufferFlushTimeoutId);}this._writeBehindBufferFlushTimeoutId=window.setTimeout(this.flush.bind(this),this._writeBehindBufferFlushDelayMs);}/**
         * Given a DependencyMap it will create a clone of it.
         * The Maps and Sets are not deeply cloned.
         * @param dependencyMap
         */cloneDependencyMap(input){// returned clone of DependencyMap
    const out={dependencies:{},dependenciesReverseLookup:{}};// clone dependencies first
    Object.keys(input.dependencies).forEach(key=>{out.dependencies[key]=new Map(input.dependencies[key]);});// clone reverse dependencies lookup
    Object.keys(input.dependenciesReverseLookup).forEach(key=>{out.dependenciesReverseLookup[key]=new Set(input.dependenciesReverseLookup[key]);});return out;}/**
         * Flushes whatever is in the buffer to disk.
         */flush(){Thenable.resolve().then(()=>{const flushMarker=markStart("LDS_DURABLE_STORE_FLUSH","root");// shallow copy the buffer and prune its keys
    const cacheMap=new Map(this._writeBehindBuffer);// execute pruning strategy
    if(this._pruningStrategy){const markerPrunning=markStart("LDS_DURABLE_STORE_PRUNNING","root");const depMapKeyString=serialize(buildCacheKey());// first clone the dependency map so we do not affect current state
    const dependencyMap=this.cloneDependencyMap(cacheMap.get(depMapKeyString));// execute pruning strategy
    this._pruningStrategy.prune(cacheMap,dependencyMap);markEnd(markerPrunning);// set the new dependency map on the CacheMap
    cacheMap.set(depMapKeyString,dependencyMap);}// serialize and resolve
    const markerSerialize=markStart("LDS_DURABLE_STORE_SERIALIZE","root");const storedMap=toStoreMap(cacheMap);markEnd(markerSerialize);markEnd(flushMarker);if(storedMap){return this._auraStorage.set(durableStoreKey,storedMap);}}).catch(e=>{instrumentError(e,"LDS_DURABLE_STORE_FLUSH_ERROR",InstrumentationErrorType.ERROR);return e;}).then(e=>{this._writeBehindBufferFlushTimeoutId=undefined;if(!(e instanceof Error)){this._auraStorage.getSize().then(sizeInKb=>{const marker=markStart("LDS_DURABLE_STORE_FLUSH_SIZE_Kb","root");marker.perfContext.count=sizeInKb;markEnd(marker);});}});}}/**
     * Deserialize a persisted StoredMap into a CacheMap
     * @param storedMap
     */function toCacheMap(storedMap){// create CacheMap Map
    const cacheMap=new Map();// copy all POJOs
    Object.keys(storedMap).forEach(k=>{cacheMap.set(k,storedMap[k]);});// overwrite dependencyMap POJO with a deserialized version
    const dependencyMapKeyString=serialize(buildCacheKey());const serializedMap=storedMap[dependencyMapKeyString];cacheMap.set(dependencyMapKeyString,deserializeDependencyMap(serializedMap));return cacheMap;}/**
     * deserialize a dependency map object stored in DurableStore
     * @param serialized SerializedDependencyMap
     */function deserializeDependencyMap(input){const out=Object.create(null);out.dependencies=Object.create(null);out.dependenciesReverseLookup=Object.create(null);const keys=input?Object.keys(input.dependencies):[];keys.forEach(k=>{out.dependencies[k]=deserializeDependencyEntry(input.dependencies[k]);});out.dependenciesReverseLookup=deserializeReverseDependencyEntry(input.dependenciesReverseLookup);return out;}/**
     * deserialize a dependency entry for DependencyMap
     * @param entries SerializedDependency
     */function deserializeDependencyEntry(input){const out=new Map();for(let i=0,length=input.length;i<length;++i){const key=input[i][0];const value=input[i][1];out.set(key,value);}return out;}/**
     * deserialize a reverse dependency entry
     * @param entries { [key: string]: SerializedReverseDependency }
     */function deserializeReverseDependencyEntry(entries){const out=Object.create(null);Object.keys(entries).forEach(key=>{out[key]=new Set(entries[key]);});return out;}/**
     * A {@link CacheStore} implementation that is backed by an in memory map. This store's APIs return synchronous Thenables where possible.
     */class InMemoryCacheStore{/**
         * Constructor.
         * @param durableStoreAccessor Optional. If provided, backs the in memory cache with a durable store.
         */constructor(durableStoreAccessor){/**
             * Queued up callbacks
             */this.queuedAccessCallbacks=[];this.privateMap=new Map();this._isBootstrapping=true;this._durableStoreAccessor=durableStoreAccessor;}/**
         * @see {@link CacheStore#isDurable}.
         */isDurable(){return !!this._durableStoreAccessor;}/**
         * @see {@link CacheStore#bootstrap}.
         */bootstrap(){const{_durableStoreAccessor}=this;// Hydrate the in memory cache with durable store.
    if(!_durableStoreAccessor){this._isBootstrapping=false;return;}const bootstrapMarker=markStart("LDS_DURABLE_STORE_BOOTSTRAP_TIME","root");_durableStoreAccessor.loadCache().catch(e=>{instrumentError(e,"LDS_DURABLE_STORE_INIT_FAILURE",InstrumentationErrorType.ERROR);return undefined;}).then(storedMap=>{if(storedMap){const marker=markStart("LDS_DURABLE_STORE_BOOTSTRAP_DESERIALIZE","root");// Assign to in memory.
    this.privateMap=toCacheMap(storedMap);markEnd(marker);}this._isBootstrapping=false;// Invoke any queued up callbacks that were waiting on the store to be ready.
    const markerCb=markStart("LDS_DURABLE_STORE_BOOTSTRAP_QUEUED_CALLBACKS","root");this.dequeueCallbacks();markerCb.perfContext.count=this.queuedAccessCallbacks.length;markEnd(markerCb);markEnd(bootstrapMarker);}).catch(e=>{this._isBootstrapping=false;const markerCb=markStart("LDS_DURABLE_STORE_BOOTSTRAP_QUEUED_CALLBACKS","root");this.dequeueCallbacks();markerCb.perfContext.count=this.queuedAccessCallbacks.length;markEnd(markerCb);instrumentError(e,"LDS_DURABLE_STORE_DESERIALIZE_FAILURE",InstrumentationErrorType.ERROR);});}/**
         * @see {@link CacheStore#access}.
         */access(callback){if(this.isReady()){return callback(this);}else{this.queuedAccessCallbacks.push(callback);}}/**
         * @see {@link CacheStore#isReady}.
         */isReady(){return !this._isBootstrapping;}/**
         * @see {@link CacheStore#put}.
         */put(cacheKey,value){this._validateIsReady();this._putInMemoryMap(cacheKey,value);if(this._durableStoreAccessor&&this.isReady()){this._durableStoreAccessor.saveCache(this.privateMap);}}/**
         * @see {@link CacheStore#putAll}.
         */putAll(cacheKeyToValueMap){this._validateIsReady();for(const[cacheKey,value]of cacheKeyToValueMap.entries()){this._putInMemoryMap(cacheKey,value);}if(this._durableStoreAccessor&&this.isReady()){this._durableStoreAccessor.saveCache(this.privateMap);}}/**
         * @see {@link CacheStore#evict}.
         */evict(cacheKey){this._validateIsReady();const keyString=serialize(cacheKey);const found=this.privateMap.has(keyString);if(found){this.privateMap.delete(keyString);}if(this._durableStoreAccessor&&this.isReady()){this._durableStoreAccessor.saveCache(this.privateMap);}return found;}/**
         * @see {@link CacheStore#get}.
         */get(cacheKey){this._validateIsReady();const keyString=serialize(cacheKey);const value=this.privateMap.get(keyString);if(value!==undefined){// Found it.
    // null and other non-undefined falsy values are ok.
    return value;}// Not found.
    return undefined;}/**
         * @see {@link CacheStore#getAll}.
         */getAll(cacheKeysArray){this._validateIsReady();const valuesMap=new Map();cacheKeysArray.forEach(cacheKey=>{const keyString=serialize(cacheKey);const value=this.privateMap.get(keyString);if(value!==undefined){// null and other non-undefined falsy values are ok.
    valuesMap.set(cacheKey,value);}});return valuesMap;}/**
         * @see {@link CacheStore#getNumberOfItems}.
         */getNumberOfItems(){this._validateIsReady();return this.privateMap.size;}dequeueCallbacks(){// Invoke any queued up callbacks that were waiting on the store to be ready.
    this.queuedAccessCallbacks.forEach(cb=>{cb(this);});this.queuedAccessCallbacks=[];}/**
         * Puts a value into the map that backs this in memory cache store.
         * @param cacheKey The key for the value.
         * @param value The value to put.
         */_putInMemoryMap(cacheKey,value){const keyString=serialize(cacheKey);this.privateMap.set(keyString,value);}/**
         * Internal access control enforcement to make sure applicable caching methods are not called before bootstrap is finished.
         */_validateIsReady(){if(!this.isReady()){throw getLdsInternalError("INVALID_CACHE_STORE_ACCESS","Programmer Error: Cache Store had attempted access before it was ready!",true);}}}/**
     * Default time source. Uses Date to measure time.
     */const defaultTimeSource={/**
         * @returns The current time as defined by Date.now().
         */now:()=>{return Date.now();}};/**
     * Pruning strategy which evicts values that are beyond their TTL.
     */class DurableStorePruningStrategy{/**
         * Constructor.
         * @param ldsCache Reference to LdsCache.
         */constructor(ldsCache){this._ldsCache=ldsCache;}/**
         * @see {@link PruningStrategy#prune}.
         */prune(cacheMap,dependencyMap){let updated=false;const markerSizeBefore=markStart("LDS_DURABLE_STORE_PRUNING_STRATEGY_BEFORE","root");markerSizeBefore.perfContext.count=cacheMap.size;markEnd(markerSizeBefore);cacheMap.forEach((_valueWrapper,key)=>{const cacheKey=deserialize(key);const service$$1=this._ldsCache.getServiceOrUndefined(cacheKey.type);const shouldEvict=!service$$1||!service$$1.isDurable();if(shouldEvict){_evictHelper(cacheMap,dependencyMap,key);updated=true;}});const markerSizeAfter=markStart("LDS_DURABLE_STORE_PRUNING_STRATEGY_AFTER","root");markerSizeAfter.perfContext.count=cacheMap.size;markEnd(markerSizeAfter);return updated;}}/**
     * Helper function to evict a value and any ancestors that depend on it for denormalization. Appropriately updates the dependency map.
     *
     * Algorithm:
     * 1. Evict currentCacheKey.
     * 2. Get the reverse lookup entry for currentCacheKey.
     * 3. For each lookupKey, go to corresponding entry in dependencies and remove currentCacheKey from the set. If set is reduced to 0, remove the entry itself.
     * 4. Remove the reverse lookup entry.
     * 5. Lookup dependency entry for currentCacheKey.
     * 6. For each entry, recurse.
     * 7. Remove the dependency entry.
     * @param currentCacheKey The current cache key to be evicted.
     * @param currentCacheKeyString The current cache key to be evicted.
     * @param dependencyMap The dependencyMap to update.
     * @param cacheMap The cacheStore from which to evict values.
     */function _evictHelper(cacheMap,dependencyMap,currentCacheKeyString){// * 1. Evict currKey
    cacheMap.delete(currentCacheKeyString);// * Get the reverse lookup entry for currentCacheKey.
    const reverseLookupEntry=dependencyMap.dependenciesReverseLookup[currentCacheKeyString];// * 3. For each lookupKey, go to corresponding entry in dependencies and remove currKey from the set. If set is reduced to 0, remove the entry itself.
    if(reverseLookupEntry){const reverseLookupEntryArray=Array.from(reverseLookupEntry);for(let i=0,len=reverseLookupEntryArray.length;i<len;++i){const lookupKey=reverseLookupEntryArray[i];const lookupEntry=dependencyMap.dependencies[lookupKey];if(lookupEntry){lookupEntry.delete(currentCacheKeyString);if(lookupEntry.size===0){delete dependencyMap.dependencies[lookupKey];}}}}// * 4. Remove the reverse lookup entry.
    delete dependencyMap.dependenciesReverseLookup[currentCacheKeyString];// * 5. Lookup dependency entry for currKey
    const dependencyEntry=dependencyMap.dependencies[currentCacheKeyString];// * 6. For each entry with an evictable edge, recurse.
    if(dependencyEntry){const dependencyEntryArray=Array.from(dependencyEntry);for(let i=0,len=dependencyEntryArray.length;i<len;++i){const[lookupKey,dependencyInfo]=dependencyEntryArray[i];if(dependencyInfo.type===1/* REQUIRED */){_evictHelper(cacheMap,dependencyMap,lookupKey);}}}// * 7. Remove the dependency entry.
    delete dependencyMap.dependencies[currentCacheKeyString];}/**
     * The valueType to use when building RecordCacheKeys.
     */const RECORD_VALUE_TYPE="uiapi.RecordRepresentation";/**
     * Currently the refresh time in recordLibrary is 30 seconds, so we will keep it the same.
     * This is also the fresh time for actions so having it more consistent would cause the least confusing to our users.
     */const RECORD_TTL=1000*30;/**
     * The master record type id.
     */const MASTER_RECORD_TYPE_ID="012000000000000AAA";/**
     * MAX_DEPTH is the SOQL limit, so we don't denorm past MAX_DEPTH levels.
     */const MAX_DEPTH=5;/**
     * A set of the string names of known view entities. Having this hardcoded list is a hack
     * but there is no metadata yet available to tell us if something is a view, so here we are.
     * See: https://docs.google.com/document/d/17yKaultoME_HxcN-N8g6iaus00023QYI11USYgnODcY/edit.
     */const VIEW_ENTITY_API_NAMES=new Set(["AcceptedEventRelation","AccountPartner","AccountRecordUserAccess","AccountUserTerritory2View","ActivityHistory","AggregateResult","AllOrganization","AllOrganizationValue","AllPackageVersionLm","AllUsersBasic","ApexPackage","ApexPackageIdentifier","AssignmentRule","AttachedContentDocument","AttachedContentNote","AutoResponseRule","CaseStatus","CombinedAttachment","CombinedNote","ContentFolderItem","ContentHubRepository","ContentNote","ContractStatus","CrossOrgLimitUsageHistory","CrossOrgSite","CustomObjectFeed","DeclinedEventRelation","EscalationRule","EventAttendee","EventWhoRelation","FolderedContentDocument","FTestFieldMapping","FTestUnion","FtestViewInheriting","FtestViewNonInheriting","GenericRecordUserAccess","GlobalOrganization","InstalledSubscriberPackage","KnowledgeKeywordSearchHistory","KnowledgeSearchEventHistory","KnowledgeViewEventHistory","KnowledgeVoteEventHistory","LeadStatus","LookedUpFromActivity","MetadataPackage","MetadataPackageVersion","NewsFeed","NoteAndAttachment","OpenActivity","OpportunityPartner","OpportunityStage","OrganizationProperty","OwnedContentDocument","PackagePushError","PackagePushJob","PackagePushRequest","PackageSubscriber","PartnerRole","ProcessInstanceHistory","Project","PublicSolution","QueueMember","RecentlyViewed","RecordVisibility","ServiceAppointmentStatus","SolutionStatus","SubscriberPackage","SubscriberPackageVersion","TaskPriority","TaskStatus","TaskWhoRelation","UndecidedEventRelation","UserListPrefs","UserProfile","UserProfileFeed","UserRecordAccess","WorkOrderLineItemStatus","WorkOrderStatus"]);/**
     * A set of the string names of known ui-api supported entities.
     */const UIAPI_SUPPORTED_ENTITY_API_NAMES=new Set(["Account","AccountTeamMember","Asset","AssetRelationship","AssignedResource","AttachedContentNote","BusinessAccount","Campaign","CampaignMember","﻿CareBarrier","﻿CareBarrierType","Case","Contact","﻿ContactRequest","ContentDocument","ContentNote","ContentVersion","ContentWorkspace","Contract","ContractContactRole","ContractLineItem","Custom Object","Entitlement","EnvironmentHubMember","Lead","LicensingRequest","MaintenanceAsset","MaintenancePlan","MarketingAction","MarketingResource","Note","OperatingHours","Opportunity","OpportunityLineItem","OpportunityTeamMember","Order","OrderItem","PersonAccount","Pricebook2","PricebookEntry","Product2","Quote","QuoteDocument","QuoteLineItem","RecordType","ResourceAbsence","ResourcePreference","ServiceAppointment","ServiceContract","ServiceCrew","ServiceCrewMember","ServiceResource","ServiceResourceCapacity","ServiceResourceSkill","ServiceTerritory","ServiceTerritoryLocation","ServiceTerritoryMember","Shipment","SkillRequirement","SocialPost","Tenant","TimeSheet","TimeSheetEntry","TimeSlot","UsageEntitlement","UsageEntitlementPeriod","User","WorkOrder","WorkOrderLineItem","WorkType"]);/**
     * The valueType to use when building ObjectInfoCacheKey.
     */const OBJECT_INFO_VALUE_TYPE="uiapi.ObjectInfoRepresentation";/**
     * Time to live for the ObjectInfo cache value. 15 minutes.
     */const OBJECT_INFO_TTL=15*60*1000;/**
     * Builds the cache key using objectApiName.
     * @param objectApiName The objectApiName.
     * @returns A new cache key representing the ObjectInfo value type.
     */function buildCacheKey$1(objectApiName){return {type:OBJECT_INFO_VALUE_TYPE,key:`${objectApiName}`};}/**
     * Provides functionality to read object info data from the cache. Can refresh the data from the server.
     */class ObjectInfoService extends LdsServiceBase{constructor(ldsCache){super(ldsCache,[OBJECT_INFO_VALUE_TYPE]);}isDurable(){return true;}getCacheValueTtl(){return OBJECT_INFO_TTL;}/**
         * Gets an object info.
         * @param objectApiName The API name of the object to retrieve.
         * @returns An observable of the object info.
         */getObjectInfo(objectApiName){const objectApiNameString=getObjectApiName(objectApiName);const cacheKey=buildCacheKey$1(objectApiNameString);const valueProviderParameters={cacheKey,objectApiName:objectApiNameString};const valueProvider=this._getValueProvider(valueProviderParameters);return this._ldsCache.get(cacheKey,valueProvider);}/**
         * Stage puts the given object info.
         * @param dependencies List of dependent cache keys.
         * @param objectInfo The object info value to cache.
         * @param cacheAccessor An object to access cache directly.
         * @returns A Thenable which resolves when the stagePut has completed.
         */stagePutValue(dependencies,objectInfo,cacheAccessor){const objectInfoCacheKey=buildCacheKey$1(objectInfo.apiName);const existingValueWrapper=cacheAccessor.get(objectInfoCacheKey);const eTag=objectInfo.eTag;if(existingValueWrapper&&existingValueWrapper.eTag===eTag){cacheAccessor.stageDependencies(dependencies,objectInfoCacheKey);cacheAccessor.stagePutUpdateLastFetchTime(objectInfoCacheKey);return;}// Strip out the eTag from the value. We don't want to emit eTags!
    objectInfo=this.stripETagsFromValue(objectInfo);cacheAccessor.stagePut(dependencies,objectInfoCacheKey,objectInfo,objectInfo,{eTag});}/**
         * Strips all eTag properties from the given objectInfo by directly deleting them.
         * @param objectInfo The objectInfo from which to strip the eTags.
         * @returns The given objectInfo with its eTags stripped.
         */stripETagsFromValue(objectInfo){delete objectInfo.eTag;return objectInfo;}/**
         * Creates the ValueProvider for the ObjectInfo by taking ObjectInfoValueProviderParams as input
         * returns Value Provider instance of the objectInfo
         * @param valueProviderParams Parameters to create Value Provider for ObjectInfo
         */_getValueProvider(valueProviderParams){return new ValueProvider((cacheAccessor,valueProviderParameters)=>{const{cacheKey,objectApiName,localFreshObjectInfo,forceProvide}=valueProviderParameters;if(forceProvide){return this._getFreshValue(cacheAccessor,cacheKey,objectApiName,localFreshObjectInfo);}const existingValueWrapper=cacheAccessor.get(cacheKey);if(existingValueWrapper&&existingValueWrapper.value!==undefined){const nowTime=cacheAccessor.nowTime;const lastFetchTime=existingValueWrapper.lastFetchTime;const needsRefresh=nowTime>lastFetchTime+OBJECT_INFO_TTL;if(needsRefresh){// Value is stale, get a fresh value.
    return this._getFreshValue(cacheAccessor,cacheKey,objectApiName,localFreshObjectInfo,existingValueWrapper.eTag);}// The value is not stale so it's a cache hit.
    return Thenable.resolve(1/* CACHE_HIT */);}// No existing value, get a fresh value.
    return this._getFreshValue(cacheAccessor,cacheKey,objectApiName,localFreshObjectInfo);},valueProviderParams);}hasValidCachedValue(cacheAccessor,params){const cacheKey=buildCacheKey$1(params.objectApiName);const existingValueWrapper=cacheAccessor.get(cacheKey);return !!existingValueWrapper&&existingValueWrapper.value!==undefined&&cacheAccessor.nowTime<=existingValueWrapper.lastFetchTime+OBJECT_INFO_TTL;}/**
         * Gets a fresh value and processes it into the cache with the cacheAccessor.
         * @param cacheAccessor An object to transactionally access the cache.
         * @param cacheKey The cache key for the object info.
         * @param objectApiName The object API name for the object info.
         * @param localFreshObjectInfo A ObjectInfo value you want explicitly put into cache instead of getting the value from the server.
         * @param eTagToCheck eTag to send to the server to determine if we already have the latest value. If we do the server will return a 304.
         * @returns Returns a thenable of ValueProviderResult representing the outcome of the value provider.
         */_getFreshValue(cacheAccessor,cacheKey,objectApiName,localFreshObjectInfo,eTagToCheck){let transportResponseThenable;// If the objectInfo is provided, we don't go to the server to fetch it.
    if(localFreshObjectInfo){transportResponseThenable=Thenable.resolve(getOkFetchResponse(localFreshObjectInfo));}else{const params={objectApiName};if(eTagToCheck){params.clientOptions={eTagToCheck};}{transportResponseThenable=aggregateUiExecutor.executeSingleRequestOverAggregateUi("getObjectInfo",params,OBJECT_INFO_TTL);}}return transportResponseThenable.then(transportResponse=>{// Cache miss refresh unchanged.
    if(transportResponse.status===304){return 3/* CACHE_MISS_REFRESH_UNCHANGED */;}const freshValue=transportResponse.body;cacheAccessor.stageClearDependencies(cacheKey);this.stagePutValue([],freshValue,cacheAccessor);const affectedKeys=cacheAccessor.commitPuts();this._ldsCache.handleAffectedKeys(affectedKeys,cacheAccessor);return 2/* CACHE_MISS */;});}}const{isArray}=Array;/**
     * Map between target values and refresh promise function
     */const wiredTargetValueToConfigMap=new WeakMap();/**
     * Generates a new wire adapter.
     * @param service Function to invoke, with the resolved configuration, to get an observable or undefined.
     * @returns The new wire adapter.
     */function generateWireAdapter(service$$1){return wiredEventTarget=>{let subscription;let config;// initialize the wired property with a properly shaped object so cmps can use <template if:true={wiredProperty.data}>
    wiredEventTarget.dispatchEvent(new wireService.ValueChangedEvent({data:undefined,error:undefined}));function unsubscribe(){if(subscription){subscription.unsubscribe();subscription=undefined;}}const refreshCallback=()=>{return new Promise((resolve,reject)=>{const metaConfig={forceProvide:true,finishedCallbacks:{successCallback:resolve,errorCallback:reject}};service$$1(config,metaConfig);});};const observer={next:data=>{const wiredTargetValue={data,error:undefined};wiredTargetValueToConfigMap.set(wiredTargetValue,refreshCallback);wiredEventTarget.dispatchEvent(new wireService.ValueChangedEvent(wiredTargetValue));},error:error=>{const wiredTargetValue={data:undefined,error};wiredTargetValueToConfigMap.set(wiredTargetValue,refreshCallback);wiredEventTarget.dispatchEvent(new wireService.ValueChangedEvent(wiredTargetValue));unsubscribe();},complete:unsubscribe};wiredEventTarget.addEventListener("connect",()=>{// if already subscribed or no config set then noop
    if(subscription||!config){return;}// no subscription (eg was disconnected so subscription released) so get a new one
    const serviceResult=service$$1(config);if(serviceResult){if(serviceResult.then){const thenable=serviceResult;thenable.then(observable=>{if(observable){subscription=observable.subscribe(observer);}}).catch(err=>{if(observer.error){observer.error(err);}});}else{const observable=serviceResult;subscription=observable.subscribe(observer);}}});wiredEventTarget.addEventListener("disconnect",()=>{unsubscribe();});wiredEventTarget.addEventListener("config",newConfig=>{config=newConfig;unsubscribe();const serviceResult=service$$1(config);if(serviceResult){if(serviceResult.then){const thenable=serviceResult;thenable.then(observable=>{if(observable){subscription=observable.subscribe(observer);}}).catch(err=>{if(observer.error){observer.error(err);}});}else{const observable=serviceResult;subscription=observable.subscribe(observer);}}});};}/**
     * Gets a standard error message for imperative invocation not being supported.
     * @param id The adapter id.
     * @returns Error object to be thrown.
     */function generateError(id){return new Error(`Imperative use is not supported. Use @wire(${id}).`);}/**
     * Checks for the Map containing refreshAdaptor Promise and invokes the promise if exist
     * @param wiredTargetValue {data:..,error:..} Wired value returned by adapter
     * @returns Promise which either resolves in the Promise to fetch the refresh Value or error if adapter does not support refresh
     */function refreshWireAdapter(wiredTargetValue){wiredTargetValue=lwc.unwrap(wiredTargetValue);const refreshPromise=wiredTargetValueToConfigMap.get(wiredTargetValue);if(refreshPromise){return refreshPromise();}return Promise.reject(new Error("Refresh failed because resolved configuration is not available."));}/**
     * Validates an @wire config is well-formed.
     * @param id The adapter id.
     * @param config The @wire config to validate.
     * @param required The keys the config must contain.
     * @param supported The keys the config may contain.
     * @param unsupported The keys the config must not contain.
     * @param oneof The keys the config must contain at least one of.
     * @throws An error if config doesn't satisfy the provided key sets.
     */function validateConfig(id,config,required,supported,unsupported,oneof){if(required.some(req=>!(req in config))){throw new Error(`@wire(${id}) configuration must specify ${required.join(", ")}`);}if(oneof&&!oneof.some(req=>req in config)){throw new Error(`@wire(${id}) configuration must specify one of ${oneof.join(", ")}`);}if(unsupported&&unsupported.some(req=>req in config)){throw new Error(`@wire(${id}) configuration must not specify ${unsupported.join(", ")}`);}if(Object.keys(config).some(key=>!supported.includes(key))){throw new Error(`@wire(${id}) configuration supports only ${supported.join(", ")}`);}}/**
     * Converts a value to an array. If the value is null/undefined, an empty array is returned.
     * @param value The value to convert to an array.
     * @returns value if it's an array; an empty array if value is null/undefined; otherwise value wrapped in an array.
     */function toArray(value){if(isArray(value)){return value;}if(value!=null){return [value];}return [];}/**
     * @param value The array to inspect.
     * @returns True if the array is non-empty and contains only non-empty strings.
     */function isArrayOfNonEmptyStrings(value){if(value.length===0){return false;}return value.every(v=>typeof v==="string"&&v.trim().length>0);}/**
     * Returns the field API name, qualified with an object name if possible.
     * @param value The value from which to get the qualified field API name.
     * @return The qualified field API name.
     */function getFieldApiName$1(value){if(typeof value==="string"){return value;}else if(value&&typeof value.objectApiName==="string"&&typeof value.fieldApiName==="string"){return value.objectApiName+"."+value.fieldApiName;}return undefined;}/**
     * Wire adapter id: getObjectInfo.
     * @throws Always throws an error when invoked. Imperative invocation is not supported.
     */function getObjectInfo(){throw generateError("getObjectInfo");}/**
     * Generates the wire adapter for Object Info.
     */class ObjectInfoWireAdapterGenerator{/**
         * Constructor.
         * @param objectInfoService Reference to the ObjectInfoService instance.
         */constructor(objectInfoService){this._objectInfoService=objectInfoService;}/**
         * Generates the wire adapter for @wire getObjectInfo.
         * @returns See description
         */generateGetObjectInfoWireAdapter(){const wireAdapter=generateWireAdapter(this.serviceGetObjectInfo.bind(this));return wireAdapter;}/**
         * @private Made public for testing.
         * Services getObjectInfo @wire.
         * @param config contains objectApiName
         * @returns Observable stream that emits an object info.
         */serviceGetObjectInfo(config){if(!config){return undefined;}{const required=["objectApiName"];const supported=["objectApiName"];validateConfig("getObjectInfo",config,required,supported);}if(!config.objectApiName){return undefined;}return this._objectInfoService.getObjectInfo(config.objectApiName);}}/**
     * CacheAccessorWrapper that can track records and object-infos to use to inform recordLibrary where appropriate during commitPuts().
     */class RecordCacheAccessorWrapper{/**
         * Constructor
         * @param cacheAccessor Cache Accessor of LDS Cache.
         * @param adsBridge Ads Bridge ref to inform ADS about records.
         */constructor(cacheAccessor,adsBridge){/**
             * Map of records to inform the ADS cache.
             */this._recordsToInform=new Map();/**
             * Map of object-infos to inform the ADS.
             */this._objectInfos=new Map();this._cacheAccessor=cacheAccessor;this._adsBridge=adsBridge;}/**
         * current time from CacheAccessor.
         * @returns current time from CacheAccessor.
         */get nowTime(){return this._cacheAccessor.nowTime;}/**
         * Returns the Thenable containing ValueWrapper from the cache.
         * @param cacheKey Cachekey for the object in the cache.
         * @returns The value from the cache or undefined if not found.
         */get(cacheKey){return this._cacheAccessor.get(cacheKey);}/**
         * Returns the ValueWrapper for the cachekey.
         * @param cacheKey Cachekey for the object in the cache.
         * @returns ValueWrapper from the cache.
         */getCommitted(cacheKey){return this._cacheAccessor.getCommitted(cacheKey);}/**
         * Stage put the values using cacheAccessor.
         * @param dependencies Dependent keys for which this value to be cached is dependent on.
         * @param cacheKey Cachekey for the object in the cache.
         * @param valueToCache Value to cache in the LDS.
         * @param valueToEmit Value to emit.
         * @param optionalValueWrapperParams Extra Params need to normalize this value in the cache.
         * @param valueWrapperToEmitExtraInfoObject Object with properties to set on the emitted ValueWrapper.extraInfoObject.
         *
         */stagePut(dependencies,cacheKey,valueToCache,valueToEmit,optionalValueWrapperParams,valueWrapperToEmitExtraInfoObject){const type=cacheKey.type;if(type===OBJECT_INFO_VALUE_TYPE&&valueToEmit!==null){this._objectInfos.set(valueToEmit.apiName,valueToEmit);}else if(type===RECORD_VALUE_TYPE){// Note, when a record is staged more than once (multiple nested instances of the same record) the latest record
    // should be the most merged and should be the most complete, and overwriting it in the map lets that one win.
    this._recordsToInform.set(valueToEmit.id,valueToEmit);}this._cacheAccessor.stagePut(dependencies,cacheKey,valueToCache,valueToEmit,optionalValueWrapperParams,valueWrapperToEmitExtraInfoObject);}/**
         * Invokes CacheAccessor's stagePutUpdateLastFetchTime.
         * @param cacheKey Cachekey for the object in the cache.
         */stagePutUpdateLastFetchTime(cacheKey){this._cacheAccessor.stagePutUpdateLastFetchTime(cacheKey);}/**
         * Invokes CacheAccessor's stageDependencies with the values passed, take a look at CacheAccessor for more information.
         * @param dependencies Dependent keys for which this value to be cached is dependent on.
         * @param cacheKey Cachekey for the object in the cache.
         */stageDependencies(dependencies,cacheKey){return this._cacheAccessor.stageDependencies(dependencies,cacheKey);}/**
         * Clear the dependencies for the cacheKey passed.
         * @param cacheKey Cachekey for the object in the cache.
         */stageClearDependencies(cacheKey){return this._cacheAccessor.stageClearDependencies(cacheKey);}/**
         * Invokes the commitPuts of CacheAccessor, inform the ADS using adsbridge and returns the affected Keys.
         * @returns The set of cache keys that are affected by the commit.
         */commitPuts(){const affectedKeys=this._cacheAccessor.commitPuts();const recordsToInformArray=Array.from(this._recordsToInform.values());for(let len=recordsToInformArray.length,n=0;n<len;n++){const record=recordsToInformArray[n];const objectInfoIfAvailable=this._objectInfos.get(record.apiName);this._adsBridge.informRecordLib(record,objectInfoIfAvailable);// If we have an object info then great, otherwise, let this retrieve it if necessary.
    }return affectedKeys;}/**
         * Invokes the CacheAccessor's stageEmit.
         * @param cacheKey Cachekey for the object in the cache.
         * @param valueToEmit ValueWrapper of the value to be emitted.
         */stageEmit(cacheKey,valueToEmit){return this._cacheAccessor.stageEmit(cacheKey,valueToEmit);}/**
         * Invokes the CacheAccessor's isEmitStaged and returns true if the value for the cacheKey is staged for emit.
         * @param cacheKey Cachekey for the object in the cache.
         * @returns True if an emit is staged for the given cacheKey, else false.
         */isEmitStaged(cacheKey){return this._cacheAccessor.isEmitStaged(cacheKey);}/**
         *  method that returns the number of staged emits from staging puts and emits.
         *  @returns the number of staged emits from staging puts and emits.
         */get stagedEmitsCount(){return this._cacheAccessor.stagedEmitsCount;}/**
         * Gets the observables for the CacheKey, creating them if necessary.
         * @param cacheKey The cache key for the Observable.
         * @returns The observables for the cache key.
         */getOrCreateObservables(cacheKey){return this._cacheAccessor.getOrCreateObservables(cacheKey,RECORD_TTL);}/**
         * Makes a new immutable ValueWrapper with a lastFetchTime consistent with the rest of the CacheAccessor transaction. Optionally an
         * eTag may be provided (if available), as can an arbitrary Object containing information the ValueProvider may desire during a
         * future cache transaction.
         * @param valueToCache The value to be cached required (must not be undefined). This should not be an already wrapped
         *      value (instanceof ValueWrapper).
         * @param eTagOverride The eTag to be set on the ValueWrapper.
         * @param extraInfoObject An arbitrary object that ValueProviders may use to store additional information about the value being
         *      cached.
         * @returns The provided params wrapped in an immutable ValueWrapper.
         */newValueWrapper(valueToCache,eTagOverride,extraInfoObject){return this._cacheAccessor.newValueWrapper(valueToCache,eTagOverride,extraInfoObject);}}const SYSTEM_MODSTAMP="SystemModstamp";const DISPLAY_VALUE="displayValue";/**
     * Builds the cache key for type filtered record.
     * @param recordId
     * @param requiredFields  List of required fields.
     * @param optionalFields List of optional fields
     * @returns A new cache key representing the RECORD_VALUE_TYPE value type.
     */function buildFilteredRecordObservableKey(recordId,requiredFields,optionalFields){const fields=collectionToArray(requiredFields).sort().join(",");const optional=collectionToArray(optionalFields).sort().join(",");return {type:RECORD_VALUE_TYPE,key:`${recordId}${KEY_DELIM}${fields}${KEY_DELIM}${optional}`};}/**
     * Builds the cache key for record.
     * @param recordId The record id.
     * @returns  A new CacheKey which represents a RECORD_VALUE_TYPE.
     */function buildRecordCacheKey(recordId){{assert$1(recordId.length===18,"Record Id length should be 18 characters.");}return {type:RECORD_VALUE_TYPE,key:`${recordId}`};}/**
     * Tells you if an objectApiName is that of a known view entity. Note: LDS does not currently support view entities, so this
     * method can be used to make sure they don't end up in the cache. If they are cached without proper support they can "stomp"
     * other records of a primary entity because they often share IDs.
     * @param objectApiName the object API name from a record.
     * @return True if the provided objectApiName is that of a known view entity.
     */function isKnownViewEntity(objectApiName){return VIEW_ENTITY_API_NAMES.has(objectApiName);}/**
     * Tells you if an objectApiName is supported by UI API or not.
     * Note: LDS does not currently support all the entities, the list is limited to UI API supported entities
     * @param objectApiName the object API name from a record.
     * @return True if the provided objectApiName is supported in UI API.
     */function isSupportedEntity(objectApiName){return objectApiName.endsWith("__c")||UIAPI_SUPPORTED_ENTITY_API_NAMES.has(objectApiName);}/**
     * Used to check if SystemModstamps are present and different for the given records.
     * @param firstRecord The first record.
     * @param secondRecord The second record.
     * @returns false if SystemModstamp values exist in both records and are same.
     *          true if SystemModstamp values exist in both records and are different OR one or both record's
     *          systemModstamp do not have a value.
     */function systemModstampsAreDifferent(firstRecord,secondRecord){// treat systemModstamp being null/undefined as being present and different and thereby return true
    // entities like ContentNote(and may be a few more entities) do not have a systemModstamp and thereby the value will be null
    return firstRecord.systemModstamp==null&&secondRecord.systemModstamp==null||firstRecord.systemModstamp!==secondRecord.systemModstamp;}/**
     * Recursively get spanning records within record.
     * @param record The record from which we want to retrieve spanning records.
     * @param records Set of records passed from recursive call
     * @returns Set containing all spanning record Ids.
     */function getSpanningRecords(record,records){function checkSpanning(fieldValue){// this is going to check if the provided value is a spanning field
    // we don't want to count polymorphic Owner as a spanning field so it never gets replaced by wrong user record
    return isRecordRepresentation(fieldValue)&&fieldValue.apiName!=="Name";}if(!records){records=new Set();}if(checkSpanning(record)){const recordFields=record.fields;const recordFieldNamesArray=Object.keys(recordFields);for(let len=recordFieldNamesArray.length,n=0;n<len;n++){// we should add assert here to make sure that every field has a value
    const fieldValue=recordFields[recordFieldNamesArray[n]].value;if(fieldValue&&checkSpanning(fieldValue)){records.add(fieldValue);getSpanningRecords(fieldValue,records);}}}return records;}/**
     * Checks that for all field values in sourceRecord is same as targetRecord except for SystemModstamp and spanned record.
     * @param sourceRecord record to iterate over all fields and check value against target
     * @param targetRecord targetRecord
     * @return true if record is same (as explained in description)
     */function areFieldsEqualForRecords(sourceRecord,targetRecord){return Object.keys(sourceRecord).every(prop=>{if(prop!==SYSTEM_MODSTAMP&&prop!==DISPLAY_VALUE&&!isTypeOfLdsRecord(sourceRecord[prop])&&targetRecord[prop]){if(sourceRecord[prop]===targetRecord[prop]){return true;}if(isRecordRepresentation(sourceRecord[prop])&&isRecordRepresentation(targetRecord[prop])){return areFieldsEqualForRecords(sourceRecord[prop],targetRecord[prop]);}else{return false;}}return true;});}/**
     * Checks that passed object is record or spanned record (in LDS spanned record has marker(true) with id for actual record entry).
     * @param obj Record(normalized or de/normalized object
     * @return true if object is record or spanned record to its parent
     */function isTypeOfLdsRecord(obj){return isRecordRepresentation(obj)||isRecordMarker(obj);}/**
     * Merges two record markers, taking the depth of the shallower marker.
     * Note: this can't be in record-marker-utils, causes a loop.
     * @param sourceMarker The source marker which may have different values.
     * @param targetMarker The marker to change if there are different values in the source marker.
     * @returns True if any changes were made to the target marker, otherwise false.
     */function mergeRecordMarkers(sourceMarker,targetMarker){let changesMade=false;if(targetMarker.id!==sourceMarker.id){targetMarker.id=sourceMarker.id;changesMade=true;}if(targetMarker.recordTypeId!==sourceMarker.recordTypeId){targetMarker.recordTypeId=sourceMarker.recordTypeId;changesMade=true;}if(targetMarker.depth!==sourceMarker.depth){targetMarker.depth=Math.min(sourceMarker.depth,targetMarker.depth);changesMade=true;}const sourceFields=sourceMarker.fields;const targetFields=targetMarker.fields;let fieldsChanged=false;if(changesMade&&targetFields.length!==sourceFields.length){targetMarker.fields=sourceFields;fieldsChanged=true;}else{for(let c=0;c<sourceFields.length;++c){const sourceField=sourceFields[c];if(!targetFields.includes(sourceField)){targetFields.push(sourceField);fieldsChanged=true;}}}changesMade=changesMade||fieldsChanged;return changesMade;}/**
     * Applies any changes in the sourceRecord to the targetRecord if it would result in a change to the targetRecord. This will
     * not copy over new eTag properties (ignores them) and if any other changes are made, it will clear the eTag property in the
     * targetRecord because it has been rendered useless.
     * @param sourceRecord A record that may have different values.
     * @param targetRecord The record to change if there are different values in the source record.
     * @returns true if any changes were made to the targetRecord.
     */function deepRecordCopy(sourceRecord,targetRecord){let changesMade=false;const sourceRecordKeysArray=Object.keys(sourceRecord);for(let len=sourceRecordKeysArray.length,n=0;n<len;n++){const recordProp=sourceRecordKeysArray[n];const targetRecordPropValue=targetRecord[recordProp];// TODO: Remove this hack when W-5775123 is done
    if(recordProp==="recordTypeInfo"){if(!sourceRecord[recordProp]&&targetRecord[recordProp]){continue;}else if(sourceRecord[recordProp]&&!targetRecord[recordProp]){targetRecord[recordProp]=sourceRecord[recordProp];changesMade=true;}}if(targetRecordPropValue&&typeUtils.isPlainObject(targetRecordPropValue)){if(isRecordMarker(targetRecordPropValue)&&isRecordMarker(sourceRecord[recordProp])){const markerChangesMade=mergeRecordMarkers(sourceRecord[recordProp],targetRecordPropValue);changesMade=changesMade||markerChangesMade;}else if(isRecordMarker(targetRecordPropValue)&&!isRecordMarker(sourceRecord[recordProp])){changesMade=true;targetRecord[recordProp]=sourceRecord[recordProp];}else{const deepChangesMade=deepRecordCopy(sourceRecord[recordProp],targetRecord[recordProp]);changesMade=changesMade||deepChangesMade;}}else if(recordProp!=="eTag"&&targetRecord[recordProp]!==sourceRecord[recordProp]){changesMade=true;targetRecord[recordProp]=sourceRecord[recordProp];}}if(changesMade&&isRecordRepresentation(targetRecord)){// If a record has been merged we can no longer use its ETag -- it will no longer be correct.
    delete targetRecord.eTag;}return changesMade;}/**
     * Returns the record type id contained in the given record. If the record doesn't have that info, it will
     * return the MASTER_RECORD_TYPE_ID.
     * @param record The record from which to extract the record type id.
     * @returns recordTypeId of the record.
     */function getRecordTypeIdFromRecord(record){return record.recordTypeInfo&&record.recordTypeInfo.recordTypeId||MASTER_RECORD_TYPE_ID;}/**
     * Returns a new object that has a list of fields that has been filtered by edited fields. Only contains fields that have been
     * edited from their original values (excluding Id which is always copied over.)
     * @param recordInput The uiapi.RecordInput object to filter.
     * @param originalRecord The Record object that contains the original field values.
     * @returns uiapi.RecordInput, see the description
     */function createRecordInputFilteredByEditedFields(recordInput,originalRecord){const filteredRecordInput=getRecordInput();// Always copy over any existing id.
    if(originalRecord.id){filteredRecordInput.fields.Id=originalRecord.id;}const recordInputFields=recordInput.fields;const originalRecordFields=originalRecord.fields;const recordInputFieldPropertyNames=Object.getOwnPropertyNames(recordInputFields);for(let len=recordInputFieldPropertyNames.length,n=0;n<len;n++){const fieldName=recordInputFieldPropertyNames[n];let originalRecordFieldsEntry;if(originalRecordFields){originalRecordFieldsEntry=originalRecordFields[fieldName];}if(!originalRecordFieldsEntry||originalRecordFields&&recordInputFields[fieldName]!==originalRecordFieldsEntry.value){filteredRecordInput.fields[fieldName]=recordInputFields[fieldName];}}return filteredRecordInput;}/**
     * Returns an object with its data populated from the given record. All fields with values that aren't nested records will be assigned.
     * This object can be used to create a record.
     * @param record The record that contains the source data.
     * @param objectInfo The ObjectInfo corresponding to the apiName on the record. If provided, only fields that are createable=true
     *        (excluding Id) will be assigned to the object return value.
     * @returns uiapi.RecordInput See description.
     */function generateRecordInputForCreate(record,objectInfo){const recordInput=_generateRecordInput(record,true,objectInfo);recordInput.apiName=record.apiName;// fields.Id is not required for CREATE which might have been copied over, so delete fields.Id
    delete recordInput.fields.Id;return recordInput;}/**
     * Returns an object with its data populated from the given record. All fields with values that aren't nested records will be assigned.
     * This object can be used to update a record.
     * @param record The record that contains the source data.
     * @param objectInfo The ObjectInfo corresponding to the apiName on the record.
     *        If provided, only fields that are updateable=true (excluding Id) will be assigned to the object return value.
     * @returns uiapi.RecordInput See description.
     */function generateRecordInputForUpdate(record,objectInfo){const recordInput=_generateRecordInput(record,false,objectInfo);if(!record.id){throw new Error("record must have id for update");}// Always copy over any existing id.
    recordInput.fields.Id=record.id;return recordInput;}/**
     * Gets the cache key for the given record.
     * @param record The record for which to get the cache key.
     * @returns The CacheKey for the record.
     */function getRecordCacheKey(record){return buildRecordCacheKey(record.id);}/**
     * Returns an object with its data populated from the given record. All fields with values that aren't nested records will be assigned.
     * @param record The record that contains the source data.
     * @param create used to decide whether to use updateable or createable flag in objectInfo.
     * @param objectInfo The ObjectInfo corresponding to the apiName on the record.
     *        If provided, only fields that are updateable=true (excluding Id) will be assigned to the object return value.
     * @returns uiapi.RecordInput
     */function _generateRecordInput(record,create,objectInfo){const recordInput=getRecordInput();const recordFields=record.fields;let objectInfoFields;if(objectInfo){objectInfoFields=objectInfo.fields;}// Copy fields. If they provided an objectInfo, only copy over updateable fields.
    const recordFieldPropertyNames=Object.getOwnPropertyNames(recordFields);for(let len=recordFieldPropertyNames.length,n=0;n<len;n++){const fieldName=recordFieldPropertyNames[n];const recordFieldsFieldNameEntry=recordFields[fieldName].value;if(objectInfoFields){const objectInfoFieldsFieldNameValue=objectInfoFields[fieldName];if(objectInfoFieldsFieldNameValue){if(create){if(objectInfoFieldsFieldNameValue.createable===true){recordInput.fields[fieldName]=recordFieldsFieldNameEntry;}}else if(objectInfoFieldsFieldNameValue.updateable===true){recordInput.fields[fieldName]=recordFieldsFieldNameEntry;}}}else{recordInput.fields[fieldName]=recordFieldsFieldNameEntry;}}return recordInput;}/**
     * Gets a new Record Input.
     */function getRecordInput(){return {apiName:undefined,fields:{}};}/**
     * Gets a field's value from a record.
     * @param record The record.
     * @param field The qualified API name of the field to return.
     * @returns The field's value (which may be a record in the case of spanning fields), or undefined if the field isn't found.
     */function getFieldValue(record,field){const unqualifiedField=splitQualifiedFieldApiName(getFieldApiName(field))[1];const fields=unqualifiedField.split(".");let r=record;while(fields.length>0&&r&&r.fields){const f=fields.shift();const fvr=r.fields[f];if(fvr===undefined){return undefined;}else{r=fvr.value;}}return r;}/**
     * Gets a field's display value from a record.
     * @param record The record.
     * @param field The qualified API name of the field to return.
     * @returns The field's display value, or undefined if the field isn't found.
     */function getFieldDisplayValue(record,field){const unqualifiedField=splitQualifiedFieldApiName(getFieldApiName(field))[1];const fields=unqualifiedField.split(".");let r=record;while(r&&r.fields){const f=fields.shift();const fvr=r.fields[f];if(fvr===undefined){return undefined;}else if(fields.length>0){r=fvr.value;}else{return fvr.displayValue;}}return r;}/**
     * Examines an object to see if it appears to be a normalization marker.
     * Note this can't be included in record-marker-utils because that would cause a loop
     * between that class and record-service-utils.
     * @param object An object to inspect to see if it is a record marker.
     * @returns True if the provided object is a marker for a record, otherwise false.
     */function isRecordMarker(object){return object&&object.___marker&&object.id&&object.fields!==undefined;}/**
     * Returns a wrapper for a CacheAccessor that can track records and object infos to use to inform recordLibrary where appropriate during
     * commitPuts().
     * TODO: W-5043986 - Formalize this as a real type.
     * @param cacheAccessor The cache accessor to wrap.
     * @param adsBridgeObj
     * @returns A wrapper for a CacheAccessor that can track records and object infos to use to inform recordLibrary where appropriate during
     *                   commitPuts().
     */function wrapCacheAccessor(cacheAccessor,adsBridgeObj){return new RecordCacheAccessorWrapper(cacheAccessor,adsBridgeObj);}/**
     * Given an array of markers representing normalized record values, this returns a Thenable that resolves to an array of the denormalized records.
     * This is intended to be used during denormalization, and is preferred over simply iterating over fromRecordMarker() because it can do some
     * optimizations like only denormalizing a given record once.
     * @param recordService The recordService instance.
     * @param cacheAccessor The CacheAccessor in scope for this operation.
     * @param recordMarkerArray The record marker representing a normalized record.
     * @returns An array of the denormalized records (or undefined if a particular record could not be denormalized).
     */function fromRecordMarkers(recordService,cacheAccessor,recordMarkerArray){const markersMap=new Map();const denormalizedRecordsArray=[];// Figure out how deep we have to denorm each record, accounting for the fact that it could show up more than
    // once in the list. Store everything in a map so we dedup the records we need to denorm.
    for(let c=0;c<recordMarkerArray.length;++c){const recordMarker=recordMarkerArray[c];const recordId=recordMarker.id;const lastMarker=markersMap.get(recordId);if(lastMarker===undefined){markersMap.set(recordMarker.id,recordMarker);}else if(recordMarker.depth<lastMarker.depth){markersMap.set(recordMarker.id,recordMarker);}}for(const value of markersMap.values()){denormalizedRecordsArray.push(fromRecordMarker(recordService,cacheAccessor,value));}const denormalizedRecordsMap=new Map();const finalDenormalizedRecordsArray=[];// Re-index the denormalized records into a map.
    for(let c=0;c<denormalizedRecordsArray.length;++c){const denormalizedRecord=denormalizedRecordsArray[c];if(denormalizedRecord){denormalizedRecordsMap.set(denormalizedRecord.id,denormalizedRecord);}}// Pluck the records out of the map and put them back in the same order as the original recordMarkerArray.
    for(let c=0;c<recordMarkerArray.length;++c){const recordMarker=recordMarkerArray[c];finalDenormalizedRecordsArray.push(denormalizedRecordsMap.get(recordMarker.id));}return finalDenormalizedRecordsArray;}/**
     * Given a marker representing a normalized record value, this returns a Thenable that resolves to the denormalized record. This is intended
     * to be used during denormalization.
     * @param recordService The recordService instance.
     * @param cacheAccessor The CacheAccessor in scope for this operation.
     * @param recordMarker The record marker representing a normalized record.
     * @returns The denormalized record or undefined if it could not be denormalized.
     */function fromRecordMarker(recordService,cacheAccessor,recordMarker){const cacheKey=buildRecordCacheKey(recordMarker.id);const normalizedRecordValueWrapper=cacheAccessor.get(cacheKey);if(normalizedRecordValueWrapper){const markerFieldNames=getUnqualifiedFieldNamesFromRecordMarker(recordMarker);try{const denormalizedRecord=recordService.denormalizeValue(normalizedRecordValueWrapper.value,cacheAccessor,recordMarker.depth);if(denormalizedRecord){return createFilteredRecordFromRecord(denormalizedRecord,markerFieldNames);}}catch(err){// Catch error and return undefined.
    }}return undefined;}/**
     * Returns an array of unqualified field names taken off the given recordMarker.
     * @param recordMarker The recordMarker instance to extract unqualified field names off of.
     * @returns See description.
     */function getUnqualifiedFieldNamesFromRecordMarker(recordMarker){const apiNameReg=new RegExp(`^${recordMarker.apiName}\\.`);const unqualifiedFieldNames=[];const recordMarkerFields=recordMarker.fields;if(recordMarkerFields){for(let i=0,length=recordMarkerFields.length;i<length;++i){const qualifiedFieldName=recordMarkerFields[i];const unqualifiedFieldName=qualifiedFieldName.replace(apiNameReg,"");unqualifiedFieldNames.push(unqualifiedFieldName);}}return unqualifiedFieldNames;}/**
     * Creates and returns a new filtered record from the given record that only contains the fields specified by allowedFields. Deep clone for now.
     * Will change to shallow copy in future.
     * @param record The record from which to create the filtered record.
     * @param allowedFields An object map keyed by the qualified field names to include in the filtered record.
     * @returns See description.
     */function createFilteredRecordFromRecord(record,allowedFields){const splitField=/^([\w]+)\.(.*)$/;// W-4126359: Proxy and Array.includes are not supported in aura compat mode.
    const filterRecord=(scopedRecord,scopedAllowedFields)=>{const scopedRecordFieldsArray=Object.keys(scopedRecord.fields);for(let len=scopedRecordFieldsArray.length,n=0;n<len;n++){const fieldName=scopedRecordFieldsArray[n];// spanned record case
    if(isRecordRepresentation(scopedRecord.fields[fieldName].value)){const nextAllowedList=scopedAllowedFields.filter(field=>{return field.substring(0,fieldName.length)===fieldName&&splitField.test(field);}).map(field=>{const execVal=splitField.exec(field);if(execVal&&execVal.length>2){return execVal[2];}return "";});const filteredSpannedRecord=filterRecord(scopedRecord.fields[fieldName].value,nextAllowedList.filter(Boolean));if(Object.keys(filteredSpannedRecord.fields).length>0){// only include spanned record if we have access to at least one of its fields.
    scopedRecord.fields[fieldName].value=filteredSpannedRecord;}else{delete scopedRecord.fields[fieldName];}}else if(scopedRecord.fields[fieldName].value===null&&scopedAllowedFields.reduce((accumulator,currentValue)=>{return accumulator||currentValue.split(".")[0]===fieldName;// weird formatting requirement from eslint
    },false));else if(scopedAllowedFields.indexOf(fieldName)===-1){// single field value case
    delete scopedRecord.fields[fieldName];}}// Remove the etag field from the root of the filtered record. Etags don't apply to filtered records because we are changing the number of fields on the record which
    // invalidates the etag. If we didn't remove this field, the equivalence check on the final distinctUntilChanged operator on the filtered observable stream would think
    // the record has changed because the etag has changed, even if all the other data remained the same.
    delete scopedRecord.eTag;return scopedRecord;};const currentRecord=cloneDeepCopy(record);return filterRecord(currentRecord,allowedFields);}/**
     * Checks if the value passed is of shape of RecordRepresentation
     * @param value
     * @returns true if the value passed is of uiapi.RecordRepresentation shape
     */function isRecordRepresentation(value){return value&&value.id!==undefined&&value.fields!==undefined&&value.apiName!==undefined&&value.systemModstamp!==undefined;}/**
     * Creates and returns a marker for the given record that should be used to replace records and nested records during normalization.
     * @param cacheAccessor The CacheAccessor in scope for this operation.
     * @param record The record to use to create the marker.
     * @param depth The depth at which this record exists in a nested record structure. The root record would be depth 0 while
     *        a first level spanning field would be depth 1. Depths greater than 5 are not supported or necessary because SOQL doesn't
     *        support more than 5 levels of record spanning.
     * @param objectInfo Optional. The objectInfo for the record. If specified, this includes the fields from the relationships
     *        this record can have.
     * @returns a marker for the given record that should be used to replace records and nested records during normalization
     */function toRecordMarker(cacheAccessor,record,depth,objectInfo){const id=record.id;const recordTypeId=record.recordTypeInfo&&record.recordTypeInfo.recordTypeId;const recordFields=new Set();recursivelyGatherFieldNames(record.apiName,record,recordFields);if(objectInfo){// Add fields from the lookup relationship record based on objectInfo metadata.
    const fieldsWithRelations=Array.from(Object.values(objectInfo.fields)).filter(field=>field.relationshipName);fieldsWithRelations.forEach(field=>{field.referenceToInfos.forEach(referenceToInfo=>{// Include the Id field. Ex: Opportunity.Account.Id, Opportunity.relation1__r.Id
    recordFields.add(record.apiName+"."+field.relationshipName+".Id");// Include any other fields. Ex: Opportunity.Account.Name, Opportunity.relation1__r.Name
    referenceToInfo.nameFields.forEach(nameField=>recordFields.add(record.apiName+"."+field.relationshipName+"."+nameField));});});}return {id,recordTypeId,depth,___marker:true,timestamp:cacheAccessor.nowTime,fields:collectionToArray(recordFields),apiName:record.apiName,lastModifiedById:record.lastModifiedById,lastModifiedDate:record.lastModifiedDate,systemModstamp:record.systemModstamp};}/**
     * Recursively adds field expressions to the provided set. Field expressions should be in the form of
     * <object-API-name>.<relation-name>*.<field-name>, e.g. "Account.Parent.Name".
     * @param fieldExpressionPrefix Any object API name and spanning field prefix for this record's fields. It should at least be an object API name at the root record level.
     * @param record The relevant record.
     * @param fieldNamesSet The set being used to gather all field names. This is an in/out parameter all fields
     *        will be added to this set.
     */function recursivelyGatherFieldNames(fieldExpressionPrefix,record,fieldNamesSet){const recordFields=record.fields;const fieldNamesArray=Object.keys(recordFields);for(let len=fieldNamesArray.length,n=0;n<len;n++){const fieldName=fieldNamesArray[n];const fieldValue=recordFields[fieldNamesArray[n]].value;const fieldExpression=`${fieldExpressionPrefix}.${fieldName}`;if(isRecordRepresentation(fieldValue)){recursivelyGatherFieldNames(fieldExpression,fieldValue,fieldNamesSet);}else{fieldNamesSet.add(fieldExpression);}}}/**
     * Adds all fields found in the given normalizedRecord into the provided fieldNamesSet. Produces fully qualified field names.
     * Since this is a normalized record there is no recursion because there is no nested spanning records, only markers.
     * @param normalizedRecord The relevant normalized record.
     * @param fieldNamesSet The set being used to gather all field names. This is an in/out parameter - all fields
     *        will be added to this set.
     */function gatherFieldNamesFromNormalizedRecord(normalizedRecord,fieldNamesSet){const fieldNamesArray=Object.keys(normalizedRecord.fields);const apiName=normalizedRecord.apiName;for(let fieldNamesArrayIndex=0,fieldNamesArrayLength=fieldNamesArray.length;fieldNamesArrayIndex<fieldNamesArrayLength;++fieldNamesArrayIndex){const fieldName=fieldNamesArray[fieldNamesArrayIndex];const fieldValue=normalizedRecord.fields[fieldName].value;const fieldExpression=`${apiName}.${fieldName}`;if(isRecordMarker(fieldValue)){const unqualifiedFieldNames=getUnqualifiedFieldNamesFromRecordMarker(fieldValue);// Qualify the field names by adding the api name and field name to each unqualified field name. Example: Opportunity.Owner.Id;
    for(let unqualifiedFieldNamesIndex=0,length=unqualifiedFieldNames.length;unqualifiedFieldNamesIndex<length;++unqualifiedFieldNamesIndex){const unqualifiedFieldName=unqualifiedFieldNames[unqualifiedFieldNamesIndex];const qualifiedFieldName=`${fieldExpression}.${unqualifiedFieldName}`;fieldNamesSet.add(qualifiedFieldName);}}else if(isRecordRepresentation(fieldValue)){// The only reason we should have a RecordRepresentation instead of a marker in a normalizedRecord is if it is a Name object. We need to recurse into
    // the RecordRepresentation to get those field names too. We need a solution to normalize polymorphic spanning fields: W-5188138.
    recursivelyGatherFieldNames(fieldExpression,fieldValue,fieldNamesSet);}else{fieldNamesSet.add(fieldExpression);}}}/**
     * Returns a set of all the fields in a given record.
     * @param record The record.
     * @returns Set of all fields.
     */function getFieldsFromRecord(record){const recordFieldsSet=new Set();gatherFieldNamesFromNormalizedRecord(record,recordFieldsSet);return recordFieldsSet;}/**
     * Returns true if the second record contains all the fields that the first record has.
     * @param firstRecord the first record.
     * @param secondRecord the second record.
     * @returns true if the second record contains all the fields that the first record has, otherwise false.
     */function secondRecordContainsAllFieldsInFirstRecord(firstRecord,secondRecord){return containsAll(getFieldsFromRecord(secondRecord),getFieldsFromRecord(firstRecord));}/**
     * Returns fields of the targetRecord that aren't present in the sourceRecord.
     * @param sourceRecord The source record.
     * @param targetRecord The target record.
     * @returns Set of strings that are present in the target record but not in the sourceRecord.
     */function getDifferentFieldsBetweenRecords(sourceRecord,targetRecord){return difference(getFieldsFromRecord(sourceRecord),getFieldsFromRecord(targetRecord));}/**
     * Produces a list of all the fields to remain in the record. Will throw an error if a required field is missing. Ignores missing optional fields.
     * @param record The record object which has all fields.
     * @param requiredFields The list of required fields to remain in the record.
     * @param optionalFields The list of optional fields to remain in the record.
     * @returns A list of unqualified fields to remain in the record.
     */function getFullFieldsListForFilteredObservable(record,requiredFields,optionalFields){if(record===undefined){throw getLdsInternalError("UNDEFINED_RECORD",`Trying to get fields list for undefined record, requiredFields: ${requiredFields} optionalFields: ${optionalFields}`,true);}const apiNameLength=record.apiName.length+1;// +1 for the '.'
    const unqualifiedRequiredFields=requiredFields.map(field=>{if(getFieldValue(record,field)===undefined){if(field.startsWith(record.apiName+".")){throw getLdsInternalError("INVALID_FIELD",`No such column '${field.substring(apiNameLength)}' on entity '${record.apiName}'. If you are attempting to use a custom field, be sure to append the '__c' after the custom field name. Please reference your WSDL or the describe call for the appropriate names.`,false);}throw getLdsInternalError("INVALID_FIELD",`Entity name for the provided record didn't match required field ${field}`,true);}return field.substring(apiNameLength);});const unqualifiedOptionalFields=optionalFields.filter(field=>field.startsWith(record.apiName)).map(field=>field.substring(apiNameLength));return unqualifiedRequiredFields.concat(unqualifiedOptionalFields);}/**
     * Adds record id to active request list.
     * @param recordIdsToIsRefreshingMap The active request list.
     * @param recordId The record id to track.
     */function addRecordToRefreshList(recordIdsToIsRefreshingMap,recordId){let refreshingCount=recordIdsToIsRefreshingMap.get(recordId);if(refreshingCount===undefined){refreshingCount=1;}else{refreshingCount+=1;}recordIdsToIsRefreshingMap.set(recordId,refreshingCount);}/**
     * Removes record id from active request list.
     * @param recordIdsToIsRefreshingMap The active request list.
     * @param recordId The record id to remove.
     */function removeRecordFromRefreshList(recordIdsToIsRefreshingMap,recordId){let refreshingCount=recordIdsToIsRefreshingMap.get(recordId)||0;if(refreshingCount<=1){recordIdsToIsRefreshingMap.delete(recordId);}else{refreshingCount-=1;recordIdsToIsRefreshingMap.set(recordId,refreshingCount);}}/**
     * The valueType to use when building LayoutCacheKey.
     */const LAYOUT_VALUE_TYPE="uiapi.RecordLayoutRepresentation";/**
     * Time to live for a layout cache value. 15 minutes.
     */const LAYOUT_TTL=15*60*1000;/**
     * The master record type id.
     */const MASTER_RECORD_TYPE_ID$1="012000000000000AAA";/**
     * Constructs a cache key for the Layout value type.
     * @param objectApiName The object api name with which the layout is associated.
     * @param recordTypeId The record type id with which the layout is associated.
     * @param layoutType The layout type with which the layout is associated.
     * @param mode The mode with which the layout is associated.
     * @returns CacheKey A new cache key representing the Layout value type.
     */function buildCacheKey$2(objectApiName,recordTypeId,layoutType,mode){{assert$1(objectApiName,"A non-empty objectApiName must be provided.");assert$1(layoutType,"A non-empty layoutType must be provided.");assert$1(mode,"A non-empty mode must be provided.");assert$1(recordTypeId!==null&&recordTypeId!==undefined,"recordTypeId must be defined.");assert$1(recordTypeId.length===18,"Record Type Id length should be 18 characters.");}return {type:LAYOUT_VALUE_TYPE,key:`${objectApiName.toLowerCase()}${KEY_DELIM}${recordTypeId}${KEY_DELIM}${layoutType.toLowerCase()}${KEY_DELIM}${mode.toLowerCase()}`};}/**
     * Returns an array of qualifiedFieldNames taken from the given layout.
     * @param layout The layout object from which to get the qualified field names.
     * @param objectInfo The object info object associated with the layout.
     * @throws An error if invalid layout or objectInfo is provided.
     * @returns See description.
     */function getQualifiedFieldApiNamesFromLayout(layout,objectInfo){if(!layout){throw new Error("layout must be defined");}if(!objectInfo){throw new Error("objectInfo must be defined");}const qualifiedFieldNames=[];for(let sectionsIndex=0,sectionsLength=layout.sections.length;sectionsIndex<sectionsLength;++sectionsIndex){const section=layout.sections[sectionsIndex];for(let rowsIndex=0,rowsLength=section.layoutRows.length;rowsIndex<rowsLength;++rowsIndex){const row=section.layoutRows[rowsIndex];for(let itemsIndex=0,itemsLength=row.layoutItems.length;itemsIndex<itemsLength;++itemsIndex){const item=row.layoutItems[itemsIndex];for(let componentsIndex=0,componentsLength=item.layoutComponents.length;componentsIndex<componentsLength;++componentsIndex){const component=item.layoutComponents[componentsIndex];if(component.apiName&&component.componentType==="Field"){if(isReferenceFieldNameWithRelationshipName(component.apiName,objectInfo)){const spanningFieldName=getSpanningFieldName(objectInfo,component.apiName);// By default, include the "Id" field on spanning records that are on the layout.
    qualifiedFieldNames.push(`${objectInfo.apiName}.${spanningFieldName}.Id`);// Most entities default to "Name" for nameField. However, there are some exceptions.
    let nameField="Name";const spanningFieldObjectInfo=objectInfo.fields[component.apiName];if(spanningFieldObjectInfo){const referenceToInfos=spanningFieldObjectInfo.referenceToInfos;const firstReferenceToInfos=referenceToInfos&&referenceToInfos[0];const firstNameField=firstReferenceToInfos&&firstReferenceToInfos.nameFields&&firstReferenceToInfos.nameFields[0];if(firstReferenceToInfos&&firstNameField){// If this is an entity with multiple referencesToInfos, or there are multiple nameFields- use the first one if "Name" isn't present.
    if(referenceToInfos.length>1||firstReferenceToInfos.nameFields.length>1){const seenNameField=referenceToInfos.find(ref=>{return ref.nameFields.find(field=>field===nameField)!==undefined;});if(!seenNameField){nameField=firstNameField;}}else{nameField=firstNameField;}}}qualifiedFieldNames.push(`${objectInfo.apiName}.${spanningFieldName}.${nameField}`);}qualifiedFieldNames.push(`${objectInfo.apiName}.${component.apiName}`);}}}}}return qualifiedFieldNames;}/**
     * Returns true if the field specified by the given fieldName is a reference field that also has
     * a relationship name, else false. Also returns false if the objectInfo has no data for that fieldName.
     * @param fieldName The fieldName of the field to check.
     * @param objectInfo The object info that contains the metadata for the field.
     * @returns See description.
     */function isReferenceFieldNameWithRelationshipName(fieldName,objectInfo){if(!objectInfo.fields[fieldName]){return false;}if(objectInfo.fields[fieldName].reference&&objectInfo.fields[fieldName].relationshipName){return true;}return false;}/**
     * Returns the spanning field name for the given referenceFieldName.
     * @param referenceFieldName The field name of the reference field from which to get the spanning field name.
     * @throws An error for unsupported reference field name.
     * @returns See description.
     */function getSpanningFieldName(objectInfo,referenceFieldName){if(objectInfo.fields[referenceFieldName]&&objectInfo.fields[referenceFieldName].relationshipName){return objectInfo.fields[referenceFieldName].relationshipName;}throw new Error(`Unsupported referenceFieldName: ${referenceFieldName}`);}const TEMPLATE_DURABLE_CACHE_TTL_240_KEY="templateDurableTtl240";const FOUR_HOURS=240*60*1000;/**
     * Provides functionality to read layout data from the cache. Can refresh the data from the server.
     */class LayoutService extends LdsServiceBase{/**
         * Constructor.
         * @param ldsCache Reference to the LdsCache instance.
         */constructor(ldsCache,getServiceConfiguration){super(ldsCache,[LAYOUT_VALUE_TYPE]);// should stay in sync with template TTL
    this.ttl=getServiceConfiguration(TEMPLATE_DURABLE_CACHE_TTL_240_KEY)?FOUR_HOURS:LAYOUT_TTL;}getCacheValueTtl(){return this.ttl;}isDurable(){return true;}/**
         * Retrieves a layout from the cache. If it doesn't exist in the cache it will retrieve it from the server and put it into the cache.
         * @param objectApiName The object api name of the layout to retrieve.
         * @param layoutType The layout type of the layout to retrieve.
         * @param mode The mode of the layout to retrieve.
         * @param recordTypeId The record type id of the layout to retrieve.
         */getLayout(objectApiName,layoutType,mode,recordTypeId){recordTypeId=to18(recordTypeId);const cacheKey=buildCacheKey$2(objectApiName,recordTypeId,layoutType,mode);const valueProviderParameters={cacheKey,objectApiName,layoutType,mode,recordTypeId,forceProvide:false};const valueProvider=this._createLayoutValueProvider.call(this,valueProviderParameters);return this._ldsCache.get(cacheKey,valueProvider);}/**
         * Stage puts the given layout.
         * @param dependencies List of dependent cache keys.
         * @param layout The layout value to cache.
         * @param cacheAccessor An object to access cache directly.
         * @param additionalData A property bag with additional values that are needed to generate the cache key.
         * @returns A Thenable that resolves when the stagePut has completed.
         */stagePutValue(dependencies,layout,cacheAccessor,additionalData){const layoutCacheKey=buildCacheKey$2(additionalData.objectApiName,additionalData.recordTypeId,layout.layoutType,layout.mode);const existingValueWrapper=cacheAccessor.get(layoutCacheKey);const eTag=layout.eTag;if(existingValueWrapper&&existingValueWrapper.eTag===eTag){cacheAccessor.stageDependencies(dependencies,layoutCacheKey);cacheAccessor.stagePutUpdateLastFetchTime(layoutCacheKey);return;}// Strip out the eTag from the value. We don't want to emit eTags!
    layout=this.stripETagsFromValue(layout);cacheAccessor.stagePut(dependencies,layoutCacheKey,layout,layout,{eTag});}/**
         * Strips all eTag properties from the given layout by directly deleting them.
         * @param layout The layout from which to strip the eTags.
         * @returns The given layout with its eTags stripped.
         */stripETagsFromValue(layout){delete layout.eTag;return layout;}/**
         * Creates a value provider to retrieve a Layout.
         * @param valueProviderParameters The parameters for the value provider as an object.
         * @returns ValueProvider The value provider to retrieve a Layout.
         */_createLayoutValueProvider(valueProviderParameters){const{cacheKey,objectApiName,layoutType,mode,recordTypeId,forceProvide}=valueProviderParameters;const valueProvider=new ValueProvider(cacheAccessor=>{if(forceProvide){return this._getFreshValue.call(this,cacheAccessor,cacheKey,objectApiName,layoutType,mode,recordTypeId);}const existingValueWrapper=cacheAccessor.get(cacheKey);if(existingValueWrapper&&existingValueWrapper.value!==undefined){const nowTime=cacheAccessor.nowTime;const lastFetchTime=existingValueWrapper.lastFetchTime;const needsRefresh=nowTime>lastFetchTime+LAYOUT_TTL;if(needsRefresh){// Value is stale; get a fresh value.
    return this._getFreshValue.call(this,cacheAccessor,cacheKey,objectApiName,layoutType,mode,recordTypeId,existingValueWrapper.eTag);}// The value is not stale so it's a cache hit.
    return Thenable.resolve(1/* CACHE_HIT */);}// No existing value; get a fresh value.
    return this._getFreshValue.call(this,cacheAccessor,cacheKey,objectApiName,layoutType,mode,recordTypeId);},valueProviderParameters);return valueProvider;}hasValidCachedValue(cacheAccessor,params){const cacheKey=buildCacheKey$2(params.objectApiName,params.recordTypeId,params.layoutType,params.mode);const existingValueWrapper=cacheAccessor.get(cacheKey);return !!existingValueWrapper&&existingValueWrapper.value!==undefined&&cacheAccessor.nowTime<=existingValueWrapper.lastFetchTime+LAYOUT_TTL;}/**
         * Gets a fresh value and processes it into the cache with the cacheAccessor.
         * @param cacheAccessor An object to transactionally access the cache.
         * @param cacheKey The cache key for the layout.
         * @param objectApiName The objectApiName of the layout.
         * @param layoutType The layoutType of the layout.
         * @param mode The mode of the layout.
         * @param recordTypeId The recordTypeId of the layout.
         * @param eTagToCheck eTag to send to the server to determine if we already have the latest value. If we do the server will return a 304.
         * @returns Thenable<ValueProviderResult> Returns a thenable representing the outcome of value provider
         */_getFreshValue(cacheAccessor,cacheKey,objectApiName,layoutType,mode,recordTypeId,eTagToCheck){let layoutThenable;const params={objectApiName,layoutType,mode,recordTypeId,clientOptions:undefined};if(eTagToCheck){params.clientOptions={eTagToCheck};}{layoutThenable=aggregateUiExecutor.executeSingleRequestOverAggregateUi("getLayout",params,LAYOUT_TTL);}return layoutThenable.then(transportResponse=>{// Cache miss refresh unchanged.
    if(transportResponse.status===304){return 3/* CACHE_MISS_REFRESH_UNCHANGED */;}// Cache miss.
    cacheAccessor.stageClearDependencies(cacheKey);const freshLayout=transportResponse.body;this.stagePutValue([],freshLayout,cacheAccessor,{objectApiName,recordTypeId});const affectedKeys=cacheAccessor.commitPuts();this._ldsCache.handleAffectedKeys(affectedKeys,cacheAccessor);return 2/* CACHE_MISS */;});}}/**
     * Wire adapter id: getLayout.
     * @throws Error Always throws when invoked. Imperative invocation is not supported.
     * @returns void
     */function getLayout(){throw generateError("getLayout");}/**
     * Generates the wire adapters for:
     *      * @wire getLayout
     */class LayoutWireAdapterGenerator{/**
         * Constructor.
         * @param layoutService Reference to the layoutService instance.
         */constructor(layoutService){this._layoutService=layoutService;}/*
         * Generates the wire adapter for getlayout.
         * @returns WireAdapter - See description.
         */generateGetLayoutWireAdapter(){const wireAdapter=generateWireAdapter(this.serviceGetLayout.bind(this));return wireAdapter;}/**
         * @private
         * Service getlayout @wire.
         * @param config Config params for the service.
         * @return Observable stream that emits a layout object.
         */serviceGetLayout(config){if(!config){return undefined;}{const required=["objectApiName","layoutType","mode"];const supported=["objectApiName","recordTypeId","layoutType","mode"];validateConfig("getlayout",config,required,supported);}const{objectApiName,layoutType,mode,recordTypeId}=config;if(!objectApiName||!layoutType||!mode||recordTypeId===undefined){return undefined;}return this._layoutService.getLayout(objectApiName,layoutType,mode,recordTypeId||MASTER_RECORD_TYPE_ID$1);}}/**
     * The type to use when building RecordUiCacheKey.
     */const RECORD_UI_VALUE_TYPE="uiapi.RecordUiRepresentation";/**
     * Time to live for RecordUi object. 15 minutes.
     */const RECORD_UI_TTL=15*60*1000;/**
     * Returns a RecordUiCacheKeyParams based on a keyString. Throws an error if it can't be done because a bad string is provided.
     * @param keyString A cache key string derived from a RecordUi CacheKey.
     * @returns A RecordUiCacheKeyParams based on a keyString.
     */function getRecordUiCacheKeyParams(cacheKey){{assert$1(cacheKey.type===RECORD_UI_VALUE_TYPE,`valueType was expected to be RECORD_UI_VALUE_TYPE but was not: ${cacheKey.type.toString()}`);}const key=cacheKey.key;const localKeyParts=key.split(KEY_DELIM);const recordIds=localKeyParts[0].split(",");let layoutTypes=[];if(localKeyParts.length>1&&localKeyParts[1]!==""){layoutTypes=localKeyParts[1].split(",");}let modes=[];if(localKeyParts.length>2&&localKeyParts[2]!==""){modes=localKeyParts[2].split(",");}let optionalFields=[];if(localKeyParts.length>3&&localKeyParts[3]!==""){optionalFields=localKeyParts[3].split(",");}return {recordIds,layoutTypes,modes,optionalFields};}/**
     * @param recordUi The recordUi from which to create a builder.
     * @returns CacheKey A RecordUi CacheKey based on the given recordUi.
     */function buildCacheKeyFromRecordUi(recordUi){const extracted={layoutTypes:{},modes:{}};Object.keys(recordUi.layouts).forEach(apiName=>{const recordTypeIds=recordUi.layouts[apiName];Object.keys(recordTypeIds).forEach(recordTypeId=>{const layouts=recordTypeIds[recordTypeId];Object.assign(extracted.layoutTypes,layouts);Object.keys(layouts).forEach(layout=>{const modes=layouts[layout];Object.assign(extracted.modes,modes);});});});return buildCacheKey$3(Object.keys(recordUi.records),Object.keys(extracted.layoutTypes),Object.keys(extracted.modes),[]);}/**
     * Builds the cache key.
     * @param recordIds The record ids.
     * @param layoutTypes The layout types.
     * @param modes: The modes.
     * @param optionalFields The list of optional fields.
     * @returns A new cache key representing the RecordUi value type.
     */function buildCacheKey$3(recordIds,layoutTypes,modes,optionalFields){function errorFormatter(_literals,key,valueFound,singleValue){let base=`${key} should be a string list, but received ${valueFound}`;if(singleValue){base+=`, list contains an entry with value ${singleValue}`;}return base;}function constructKeyFromStringList(list,key){{list.forEach(field=>{assert$1(field,errorFormatter`${key}${list}${field}`);});}return list.join(",");}{assert$1(recordIds.length,"Non-empty recordIds must be provided.");assert$1(layoutTypes?layoutTypes.length:false,"Non-empty layoutTypes must be provided.");assert$1(modes?modes.length:false,"Non-empty modes must be provided.");}const recordId=constructKeyFromStringList(recordIds.sort(),"recordIds");const layoutType=constructKeyFromStringList(layoutTypes.map(type=>type.toLowerCase()).sort(),"layoutTypes");const mode=constructKeyFromStringList(modes.map(modeItem=>modeItem.toLowerCase()).sort(),"modes");const optionalField=constructKeyFromStringList(optionalFields.sort(),"optionalFields");return {type:RECORD_UI_VALUE_TYPE,key:`${recordId}${KEY_DELIM}${layoutType}${KEY_DELIM}${mode}${KEY_DELIM}${optionalField}`};}/**
     * The type to use when building LayoutCacheKey.
     */const LAYOUT_USER_STATE_VALUE_TYPE="uiapi.RecordLayoutUserStateRepresentation";/**
     * Time to live for a layout user state cache value. 15 minutes.
     */const LAYOUT_USER_STATE_TTL=15*60*1000;/**
     * The master record type id.
     */const MASTER_RECORD_TYPE_ID$2="012000000000000AAA";/**
     * Constructs a cache key for the Layout value type.
     * Layout cache key is used as cache key for layout data provided by UI API.
     * @param objectApiName The object api name with which the layout is associated.
     * @param recordTypeId The record type id with which the layout is associated.
     * @param layoutType The layout type with which the layout is associated.
     * @param mode The mode with which the layout is associated.
     * @returns A new cache key representing the Layout value type.
     */function buildCacheKey$4(objectApiName,recordTypeId,layoutType,mode){{assert$1(objectApiName,"A non-empty objectApiName must be provided.");assert$1(recordTypeId,"recordTypeId must be defined.");assert$1(layoutType,"A non-empty layoutType must be provided.");assert$1(mode,"A non-empty mode must be provided.");assert$1(recordTypeId.length===18,"Record Type Id length should be 18 characters.");}return {type:LAYOUT_USER_STATE_VALUE_TYPE,key:`${objectApiName.toLowerCase()}${KEY_DELIM}${recordTypeId}${KEY_DELIM}${layoutType.toLowerCase()}${KEY_DELIM}${mode.toLowerCase()}`};}/**
     * Provides functionality to read layout data from the cache. Can refresh the data from the server.
     */class LayoutUserStateService extends LdsServiceBase{/**
         * Constructor.
         * @param ldsCache Reference to the LdsCache instance.
         */constructor(ldsCache){super(ldsCache,[LAYOUT_USER_STATE_VALUE_TYPE]);}getCacheValueTtl(){return LAYOUT_USER_STATE_TTL;}isDurable(){return true;}/**
         * Gets a layout user state.
         * @param objectApiName Object API name of the layout to retrieve.
         * @param recordTypeId Record type id of the layout to retrieve.
         * @param layoutType Type of layout to retrieve.
         * @param mode Layout mode to retrieve.
         * @returns An observable of the layout user state.
         */getLayoutUserState(objectApiName,recordTypeId,layoutType,mode){objectApiName=getObjectApiName(objectApiName);recordTypeId=to18(recordTypeId);const cacheKey=buildCacheKey$4(objectApiName,recordTypeId,layoutType,mode);const valueProviderParameters={cacheKey,objectApiName,recordTypeId,layoutType,mode};const valueProvider=this._createLayoutUserStateValueProvider(valueProviderParameters);return this._ldsCache.get(cacheKey,valueProvider);}/**
         * Stage puts the given layoutUserState.
         * @param dependencies List of dependent cache keys.
         * @param layoutUserState The layoutUserState value to cache.
         * @param cacheAccessor An object to access cache directly.
         * @param additionalData Property bag that contains additional values needed for generating the cache key.
         */stagePutValue(dependencies,layoutUserState,cacheAccessor,additionalData){const layoutUserStateCacheKey=buildCacheKey$4(additionalData.objectApiName,additionalData.recordTypeId,additionalData.layoutType,additionalData.mode);cacheAccessor.stagePut(dependencies,layoutUserStateCacheKey,layoutUserState,layoutUserState);}/**
         * There are no eTags to strip from layout user state so just return the given value unchanged.
         * @param layoutUserState
         * @returns The given layoutUserState unchanged.
         */stripETagsFromValue(layoutUserState){return layoutUserState;}/**
         * Updates the layout user state associated with the given parameters.
         * NOTE: This is a WRITE-BEHIND style update.
         * @param objectApiName The object api name associated with the layout user state.
         * @param recordTypeId The record type id associated with the layout user state.
         * @param layoutType The layout type associated with the layout user state.
         * @param mode The mode associated with the layout user state.
         * @param layoutUserStateInput Input specifying how to change the layoutUserState. Of the shape:
         *      {
         *          sectionUserStates: {
         *              sectionId1: {
         *                  collapsed: true
         *              }
         *              ...
         *          }
         *      }
         * @return A Promise resolved to the new layoutUserState value.
         */async updateLayoutUserState(objectApiName,recordTypeId,layoutType,mode,layoutUserStateInput){objectApiName=getObjectApiName(objectApiName);// Use the existing cache value and mutate it based on the given layoutUserStateInput. We do this so we can do an optimistic client side update so changes get
    // propagated immediately instead of having to wait on a server call. An optimistic update is only possible if all the sectionUserState ids exist in the cache value.
    let doOptimisticUpdate=true;const cachedLayoutUserState=await observableToPromise((await this.getLayoutUserState(objectApiName,recordTypeId,layoutType,mode)),true);const updatedLayoutUserState=cloneDeepCopy(cachedLayoutUserState);Object.keys(layoutUserStateInput.sectionUserStates).forEach(sectionId=>{if(!cachedLayoutUserState.sectionUserStates[sectionId]){// They are trying to update a section that isn't in the cached value so cancel the optimistic update.
    doOptimisticUpdate=false;}else{updatedLayoutUserState.sectionUserStates[sectionId].collapsed=layoutUserStateInput.sectionUserStates[sectionId].collapsed;}});const layoutUserStateCacheKey=buildCacheKey$4(objectApiName,recordTypeId,layoutType,mode);if(doOptimisticUpdate){// Do an optimistic update to the client cache so state will update immediately on the client.
    const valueProviderParameters={cacheKey:layoutUserStateCacheKey,objectApiName,recordTypeId,layoutType,mode,localFreshLayoutUserState:updatedLayoutUserState,forceProvide:true};const valueProvider=this._createLayoutUserStateValueProvider(valueProviderParameters);await observableToPromise(this._ldsCache.get(layoutUserStateCacheKey,valueProvider),true);}// Persist the state to the server.
    const apiParameters={objectApiName,recordTypeId,layoutType,mode,userState:layoutUserStateInput};executeAuraGlobalController("RecordUiController.updateLayoutUserState",apiParameters);return updatedLayoutUserState;}/**
         * Constructs a value provider to retrieve a user's layout state.
         * @param valueProviderParameters The parameters for the value provider as an object.
         * @returns The value provider to retrieve a user's layout state.
         */_createLayoutUserStateValueProvider(valueProviderParameters){const{cacheKey,objectApiName,recordTypeId,layoutType,mode,localFreshLayoutUserState,forceProvide}=valueProviderParameters;const valueProvider=new ValueProvider(cacheAccessor=>{if(forceProvide){return this._getFreshValue(cacheAccessor,objectApiName,recordTypeId,layoutType,mode,localFreshLayoutUserState);}const existingValueWrapper=cacheAccessor.get(cacheKey);if(existingValueWrapper&&existingValueWrapper.value!==undefined){const nowTime=cacheAccessor.nowTime;const lastFetchTime=existingValueWrapper.lastFetchTime;const needsRefresh=nowTime>lastFetchTime+LAYOUT_USER_STATE_TTL;if(needsRefresh){// Value is stale; get a fresh value.
    return this._getFreshValue(cacheAccessor,objectApiName,recordTypeId,layoutType,mode,localFreshLayoutUserState);}// The value is not stale so it's a cache hit.
    return Thenable.resolve(1/* CACHE_HIT */);}// No existing value; get a fresh value.
    return this._getFreshValue(cacheAccessor,objectApiName,recordTypeId,layoutType,mode,localFreshLayoutUserState);},valueProviderParameters);return valueProvider;}hasValidCachedValue(cacheAccessor,params){const cacheKey=buildCacheKey$4(params.objectApiName,params.recordTypeId,params.layoutType,params.mode);const existingValueWrapper=cacheAccessor.get(cacheKey);return !!existingValueWrapper&&existingValueWrapper.value!==undefined&&cacheAccessor.nowTime<=existingValueWrapper.lastFetchTime+LAYOUT_USER_STATE_TTL;}/**
         * Gets a fresh value and processes it into the cache with the cacheAccessor.
         * @param cacheAccessor An object to transactionally access the cache.
         * @param objectApiName The objectApiName of the layoutUserState.
         * @param recordTypeId The recordTypeId of the layoutUserState.
         * @param layoutType The layoutType of the layoutUserState.
         * @param mode The mode of the layoutUserState.
         * @param localFreshLayoutUserState Optional. A layoutUserState value you want explicitly put into cache instead of getting the value from the server.
         * @returns Returns a string representing the outcome of the value provider.
         */_getFreshValue(cacheAccessor,objectApiName,recordTypeId,layoutType,mode,localFreshLayoutUserState){let layoutUserStateThenable=null;// If the layoutUserState is provided, we don't go to server to fetch it.
    if(localFreshLayoutUserState){layoutUserStateThenable=Thenable.resolve(getOkFetchResponse(localFreshLayoutUserState));}else{const params={objectApiName,recordTypeId,layoutType,mode};{layoutUserStateThenable=aggregateUiExecutor.executeSingleRequestOverAggregateUi("getLayoutUserState",params,LAYOUT_USER_STATE_TTL);}}return layoutUserStateThenable.then(transportResponse=>{// Cache miss.
    const freshLayoutUserState=transportResponse.body;this.stagePutValue([],freshLayoutUserState,cacheAccessor,{objectApiName,recordTypeId,layoutType,mode});const affectedKeys=cacheAccessor.commitPuts();this._ldsCache.handleAffectedKeys(affectedKeys,cacheAccessor);return 2/* CACHE_MISS */;});}}/**
     * Wire adapter id: getLayoutUserState.
     * @throws Error Always throws when invoked. Imperative invocation is not supported.
     * @returns void
     */function getLayoutUserState(){throw generateError("getLayoutUserState");}/**
     * Generates the wire adapters for:
     *      * @wire getLayoutUserState
     */class LayoutUserStateWireAdapterGenerator{/**
         * Constructor.
         * @param layoutUserStateService Reference to the LayoutUserStateService instance.
         */constructor(layoutUserStateService){this._layoutUserStateService=layoutUserStateService;}/*
         * Generates the wire adapter for getLayoutUserState.
         * @returns WireAdapter - See description.
         */generateGetLayoutUserStateWireAdapter(){const wireAdapter=generateWireAdapter(this.serviceGetLayoutUserState.bind(this));return wireAdapter;}/**
         * @private
         * Service getLayoutUserState @wire.
         * @param config Config params for the service.
         * @return Observable stream that emits a layout user state object.
         */serviceGetLayoutUserState(config){if(!config){return undefined;}{const required=["objectApiName","recordTypeId","layoutType","mode"];const supported=["objectApiName","recordTypeId","layoutType","mode"];validateConfig("getLayoutUserState",config,required,supported);}const{objectApiName,layoutType,mode,recordTypeId}=config;if(!objectApiName||!layoutType||!mode||recordTypeId===undefined){return undefined;}return this._layoutUserStateService.getLayoutUserState(objectApiName,recordTypeId||MASTER_RECORD_TYPE_ID$2,layoutType,mode);}}/**
     * Provides functionality to read record ui data from the cache. Can refresh the data from the server.
     * We do not utilize caching or sending eTags to the server for this value type because it gets invalidated
     * quickly on the client from having its atoms updated.
     */class RecordUiService extends LdsServiceBase{/**
         * Constructor.
         * @param ldsCache Reference to the LdsCache instance.
         * @param adsBridge Reference to the AdsBridge instance.
         */constructor(ldsCache,adsBridge){super(ldsCache,[RECORD_UI_VALUE_TYPE]);this._adsBridge=adsBridge;}getCacheValueTtl(){return RECORD_UI_TTL;}/**
         * Gets a record UI.
         * @param recordIds Id of the records to retrieve.
         * @param layoutTypes Layouts defining the fields to retrieve.
         * @param modes Layout modes defining the fields to retrieve.
         * @param optionalFields Qualified field API names to retrieve. If any are inaccessible then they are silently omitted.
         * @returns An observable of record values.
         */getRecordUi(recordIds,layoutTypes,modes,optionalFields){const uniqueOptionalFields=collectionToArray(new Set(optionalFields));const cacheKey=buildCacheKey$3(recordIds,layoutTypes,modes,uniqueOptionalFields);const recordUiValueProviderParams={cacheKey,recordIds,layoutTypes,modes,optionalFields:uniqueOptionalFields,forceProvide:false};const valueProvider=this._createRecordUiValueProvider(recordUiValueProviderParams);return this._ldsCache.get(cacheKey,valueProvider);}/**
         * Helper method to kick off a refresh for a Record UI.
         * @param affectedKey The cache key for the recordUi to refresh.
         */refreshRecordUi(affectedKey){// When a record type changes in a record it can affect the layouts that should be present in the RecordUi. Because of this for now we
    // do a full refresh of the RecordUi.
    const{recordIds,layoutTypes,modes,optionalFields}=getRecordUiCacheKeyParams(affectedKey);// We need to refresh, but we're already in a cache transaction. Kick this to a Promise to get this out of the cache operation we're
    // already in the middle of.
    Promise.resolve().then(()=>{const forceProvide=true;// Use _createRecordUiValueProvider() instead of getRecordUi() so we can force value providing.
    const recordUiValueProviderParams={cacheKey:affectedKey,recordIds,layoutTypes,modes,optionalFields,forceProvide};const valueProvider=this._createRecordUiValueProvider(recordUiValueProviderParams);this._ldsCache.get(affectedKey,valueProvider);});}/**
         * Stage puts the given recordUi.
         * @param dependencies An array of dependent cache keys.
         * @param recordUi The recordUi to cache.
         * @param cacheAccessor An object to access cache directly.
         * @param additionalData A property bag with additional values that determine how normalization occurs.
         */stagePutValue(dependencies,recordUi,cacheAccessor,additionalData){// Defaults.
    additionalData=additionalData?additionalData:{rootRecordMerge:true};// fetch parameters from recordUi json and build cache key
    const recordUiCacheKey=buildCacheKeyFromRecordUi(recordUi);this._normalizeAndStagePutRecordUi(dependencies,recordUi,cacheAccessor,recordUiCacheKey,additionalData.rootRecordMerge);}/**
         * Caches a record ui. Use this when you want to put a record ui into the cache that you already have locally.
         * @param recordUiCacheKey The cache key for the record ui to cache.
         * @param recordUi The denormalized record ui object to cache.
         * @param rootRecordMerge True if we should attempt to merge the root record during normalization. This should only happen from ADS bridge
         *      code paths. If this request originated from LDS, then we know the record has all the fields we are interested in and is the freshest version.
         * @returns Returns an observable that emits values for the given cache key.
         */cacheRecordUi(recordUiCacheKey,recordUi,rootRecordMerge){rootRecordMerge=rootRecordMerge===true;const{recordIds,layoutTypes,modes,optionalFields}=getRecordUiCacheKeyParams(recordUiCacheKey);const forceProvide=true;const recordUiValueProviderParams={cacheKey:recordUiCacheKey,recordIds,layoutTypes,modes,optionalFields,forceProvide,localFreshRecordUi:recordUi,rootRecordMerge};const valueProvider=this._createRecordUiValueProvider(recordUiValueProviderParams);return this._ldsCache.get(recordUiCacheKey,valueProvider);}/**
         * Strips all eTag properties from the given recordUi by directly deleting them.
         * @param recordUi The recordUi from which to strip the eTags.
         * @returns The given recordUi with its eTags stripped.
         */stripETagsFromValue(recordUi){delete recordUi.eTag;// Strip eTags from object infos.
    const objectInfos=recordUi.objectInfos;const objectApiNames=Object.keys(objectInfos);for(let len=objectApiNames.length,n=0;n<len;++n){const objectApiName=objectApiNames[n];const objectInfo=objectInfos[objectApiName];objectInfos[objectApiName]=this._ldsCache.stripETagsFromValue(OBJECT_INFO_VALUE_TYPE,objectInfo);}// Strip eTags from layouts.
    const layouts=recordUi.layouts;const layoutObjectApiNames=Object.keys(layouts);for(let len=layoutObjectApiNames.length,layoutObjectApiNameIndex=0;layoutObjectApiNameIndex<len;++layoutObjectApiNameIndex){const objectApiName=layoutObjectApiNames[layoutObjectApiNameIndex];const layoutsUnderObjectApiNames=recordUi.layouts[objectApiName];const recordTypeIds=Object.keys(layoutsUnderObjectApiNames);for(let recordTypeIdsLen=recordTypeIds.length,recordTypeIdIndex=0;recordTypeIdIndex<recordTypeIdsLen;++recordTypeIdIndex){const recordTypeId=recordTypeIds[recordTypeIdIndex];const layoutsUnderRecordTypeIds=layoutsUnderObjectApiNames[recordTypeId];const layoutTypes=Object.keys(layoutsUnderRecordTypeIds);for(let layoutTypesLen=layoutTypes.length,layoutTypeIndex=0;layoutTypeIndex<layoutTypesLen;++layoutTypeIndex){const layoutType=layoutTypes[layoutTypeIndex];const layoutsUnderLayoutTypes=layoutsUnderRecordTypeIds[layoutType];const modes=Object.keys(layoutsUnderLayoutTypes);for(let modeLength=modes.length,modeIndex=0;modeIndex<modeLength;++modeIndex){const mode=modes[modeIndex];const layout=layoutsUnderLayoutTypes[mode];layoutsUnderLayoutTypes[mode]=this._ldsCache.stripETagsFromValue(LAYOUT_VALUE_TYPE,layout);}}}}// Strip eTags from records.
    const records=recordUi.records;const recordIds=Object.keys(records);for(let n=0,len=recordIds.length;n<len;++n){const recordId=recordIds[n];const record=records[recordId];this._ldsCache.stripETagsFromValue(RECORD_VALUE_TYPE,record);}return recordUi;}getAffectedKeyHandler(){return (affectedKey,cacheAccessor)=>{{assert$1(affectedKey.type===RECORD_UI_VALUE_TYPE,`Expected RECORD_UI_VALUE_TYPE value type for RecordUi: ${affectedKey.type.toString()}`);}let refreshRecordUi=false;// We need to detect if any of the records' record types have changed. If they have, we must fully refresh this RecordInfo. If not, we
    // can just denorm and stage an emit for it.
    const recordUiWrapper=cacheAccessor.get(affectedKey);if(recordUiWrapper){const normalizedRecordUi=recordUiWrapper.value;const recordMarkers=normalizedRecordUi.records;const recordIds=Object.keys(recordMarkers);for(let c=0,len=recordIds.length;c<len;++c){const recordId=recordIds[c];const recordMarker=recordMarkers[recordId];{assert$1(recordMarker&&isRecordMarker(recordMarker),`Expected to find a marker for record ${recordId} but instead found ${recordMarker}`);}const recordMarkerRecordTypeId=recordMarker.recordTypeId;const recordCacheKey=buildRecordCacheKey(recordId);const refreshedRecordValueWrapper=cacheAccessor.getCommitted(recordCacheKey);if(refreshedRecordValueWrapper){const refreshedRecord=refreshedRecordValueWrapper.value;// A record matching this marker has been committed as part of this cache transaction. See if its record type changed.
    // If it did we need to do a full refresh of this RecordUi, otherwise we can just denorm/emit it. We don't need to
    // worry about records that weren't committed as part of this cache transaction because they haven't changed.
    // We use null rather than undefined here to be consistent with what we'll find in the API JSON payloads.
    const refreshedRecordTypeId=refreshedRecord.recordTypeInfo?refreshedRecord.recordTypeInfo.recordTypeId:null;if(recordMarkerRecordTypeId!==refreshedRecordTypeId){refreshRecordUi=true;break;}}}// Maybe an ObjectInfo changed, if so determining its effect could be difficult so do a full refresh to be sure we get it right.
    if(!refreshRecordUi){// Don't make further checks if we don't need to.
    const objectInfoMarkers=normalizedRecordUi.objectInfos;const objectApiNames=Object.keys(objectInfoMarkers);for(let c=0,len=objectApiNames.length;c<len;++c){const objectApiName=objectApiNames[c];const objectInfoMarker=objectInfoMarkers[objectApiName];const objectInfoETag=objectInfoMarker.eTag;const objectInfoCacheKey=buildCacheKey$1(objectApiName);const refreshedObjectInfoValueWrapper=cacheAccessor.getCommitted(objectInfoCacheKey);if(refreshedObjectInfoValueWrapper){if(objectInfoETag!==refreshedObjectInfoValueWrapper.eTag){refreshRecordUi=true;break;}}}}}if(refreshRecordUi){this.refreshRecordUi(affectedKey);return;}// A full refresh is unnecessary -- just do denorm and staging of an emit.
    const normalizedRecordUiValueWrapper=cacheAccessor.get(affectedKey);if(normalizedRecordUiValueWrapper){try{const recordUi=this.denormalizeValue(normalizedRecordUiValueWrapper.value,cacheAccessor);// Denorm was successful
    if(recordUi){const recordUiValueWrapperToEmit=cloneWithValueOverride(normalizedRecordUiValueWrapper,recordUi);cacheAccessor.stageEmit(affectedKey,recordUiValueWrapperToEmit);return;}}catch(err){// Denormalization failed for some reason. Could be because there are missing pieces.
    this.refreshRecordUi(affectedKey);return;}}};}/**
         * Gets a fresh value and processes it into the cache with the cacheAccessor.
         * @param cacheAccessor An object to transactionally access the cache.
         * @param cacheKey The cache key for the recordUi.
         * @param recordIds The list of record ids for the recordUi.
         * @param layoutTypes The list of layout types for the recordUi.
         * @param modes The list of modes for the recordUi.
         * @param optionalFields The list of optional fields for the recordUi.
         * @param rootRecordMerge True if the cache should attempt to merge the record values instead of replacing them.
         * @param localFreshRecordUi Optional. A recordUi value you want explicitly put into cache instead of getting the value from the server.
         * @returns Returns a ValueProviderResult as the outcome of the operation.
         */_getFreshValue(cacheAccessor,cacheKey,recordIds,layoutTypes,modes,optionalFields,rootRecordMerge,localFreshRecordUi){if(rootRecordMerge===undefined){rootRecordMerge=false;}let transportResponseThenable;if(localFreshRecordUi){// If the recordUi is provided, we don't go to server to fetch it.
    transportResponseThenable=Thenable.resolve(getOkFetchResponse(localFreshRecordUi));}else{if(optionalFields){optionalFields=optionalFields.slice().sort();}const params={recordIds,layoutTypes,modes,optionalFields};{transportResponseThenable=aggregateUiExecutor.executeSingleRequestOverAggregateUi("getRecordUi",params,RECORD_UI_TTL);}}return transportResponseThenable.then(transportResponse=>{// Cache miss.
    // It's a cache miss and we are going normalize the recordUi, mark, and merge the spanning records, then stage and commit puts for the
    // records which are merged successfully. Finally we will denorm and stage emits for affected values that haven't changed
    // but depend on changed values.
    const freshRecordUiValue=transportResponse.body;cacheAccessor.stageClearDependencies(cacheKey);// Nothing should depend on this yet; included for completeness.
    this._normalizeAndStagePutRecordUi([],freshRecordUiValue,cacheAccessor,cacheKey,rootRecordMerge);const affectedKeys=cacheAccessor.commitPuts();this._ldsCache.handleAffectedKeys(affectedKeys,cacheAccessor);return 2/* CACHE_MISS */;});}/**
         * Returns true if the existing recordUi cache value is valid, else false.
         * @param cacheAccessor The cacheAccessor.
         * @param normalizedRecordUi The existing recordUi cache value.
         * @returns See description.
         */_validateRecordUiCacheValue(cacheAccessor,normalizedRecordUi){try{const denormalizedRecordUi=this.denormalizeValue(normalizedRecordUi,cacheAccessor);return !!denormalizedRecordUi;}catch(err){return false;}}/**
         * Denormalizes a the given normalizedRecordUi value. Will piece back together all the actual values
         * for object infos, records, layouts, etc.
         * @param normalizedRecordUi The normalizedRecordUi to denormalize.
         * @param cacheAccessor The cache accessor.
         * @returns The denormalized record ui value.
         * @throws FetchReponse Throws an error if the denormalize cannot be completed successfully.
         */denormalizeValue(normalizedRecordUi,cacheAccessor){const objectToClone=normalizedRecordUi;const denormalizedRecordUi=cloneDeepCopy(objectToClone);// Object info denormalization.
    const objectInfos=normalizedRecordUi.objectInfos;const objectApiNames=Object.keys(objectInfos);for(let len=objectApiNames.length,n=0;n<len;n++){const objectApiName=objectApiNames[n];const objectInfoCacheKey=buildCacheKey$1(objectApiName);const cachedObjectInfoValueWrapper=cacheAccessor.get(objectInfoCacheKey);if(cachedObjectInfoValueWrapper){denormalizedRecordUi.objectInfos[objectApiName]=cachedObjectInfoValueWrapper.value;}else{throw getLdsInternalError("DENORMALIZE_FAILED","Did not get an object info back for marker: "+serialize(objectInfoCacheKey),true);}}// Records denormalization.
    const recordMarkersArray=[];const recordIds=Object.keys(normalizedRecordUi.records);for(let len=recordIds.length,n=0;n<len;n++){const recordId=recordIds[n];const recordMarker=normalizedRecordUi.records[recordId];recordMarkersArray.push(recordMarker);// TODO: what we have (and had since 210) is the full version of the record, not filtered to the set of fields that were requested. Revisit.
    }const denormalizedRecordsArray=fromRecordMarkers(this._recordService,cacheAccessor,recordMarkersArray);if(denormalizedRecordsArray.length!==recordMarkersArray.length){throw getLdsInternalError("DENORMALIZE_FAILED",`Expected ${recordMarkersArray.length} records but received ${denormalizedRecordsArray.length}`,true);}for(let c=0,len=denormalizedRecordsArray.length;c<len;++c){const denormalizedRecord=denormalizedRecordsArray[c];if(denormalizedRecord){denormalizedRecordUi.records[denormalizedRecord.id]=denormalizedRecord;}else{throw getLdsInternalError("DENORMALIZE_FAILED",`Did not get a denormalized record back for marker: ${recordMarkersArray[c].id}`,false);}}// Layout denormalization.
    const cachedLayoutInfo=normalizedRecordUi.layouts;const cachedLayoutInfoObjectApiNames=Object.keys(cachedLayoutInfo);for(let len=cachedLayoutInfoObjectApiNames.length,n=0;n<len;n++){const objectApiName=cachedLayoutInfoObjectApiNames[n];const recordTypeIds=Object.keys(cachedLayoutInfo[objectApiName]);for(let recordTypeIdsLength=recordTypeIds.length,n1=0;n1<recordTypeIdsLength;n1++){const recordTypeId=recordTypeIds[n1];const layoutTypes=Object.keys(cachedLayoutInfo[objectApiName][recordTypeId]);for(let layoutTypesLength=layoutTypes.length,n2=0;n2<layoutTypesLength;n2++){const layoutType=layoutTypes[n2];const modes=Object.keys(cachedLayoutInfo[objectApiName][recordTypeId][layoutType]);for(let modesLength=modes.length,n3=0;n3<modesLength;n3++){const mode=modes[n3];const layoutCacheKey=buildCacheKey$2(objectApiName,recordTypeId,layoutType,mode);const cachedLayoutValueWrapper=cacheAccessor.get(layoutCacheKey);if(cachedLayoutValueWrapper){denormalizedRecordUi.layouts[objectApiName][recordTypeId][layoutType][mode]=cachedLayoutValueWrapper.value;}else{throw getLdsInternalError("DENORMALIZE_FAILED","Did not get a denormalized layout back for marker: "+serialize(layoutCacheKey),true);}}}}}// Layout user state denormalization.
    const layoutUserStates=normalizedRecordUi.layoutUserStates;const layoutIds=Object.keys(layoutUserStates);for(let len=layoutIds.length,n=0;n<len;n++){const layoutId=layoutIds[n];// Find the key identifiers for this layout id in the layouts section of the record ui.
    const layoutUserStateMarker=normalizedRecordUi.layoutUserStates[layoutId];const layoutUserStateCacheKey=buildCacheKey$4(layoutUserStateMarker.objectApiName,layoutUserStateMarker.recordTypeId,layoutUserStateMarker.layoutType,layoutUserStateMarker.mode);const cachedLayoutUserStateValueWrapper=cacheAccessor.get(layoutUserStateCacheKey);if(cachedLayoutUserStateValueWrapper){denormalizedRecordUi.layoutUserStates[layoutId]=cachedLayoutUserStateValueWrapper.value;}else{throw getLdsInternalError("DENORMALIZE_FAILED","Did not get a denormalized layout user state for marker: "+serialize(layoutUserStateCacheKey),true);}}// The denormalized RecordUi should now be ready to go.
    return denormalizedRecordUi;}/**
         * Returns a Thenable that resolves once the RecordUi has been normalized and all necessary puts staged.
         * @param dependencies List of dependent cache keys that depend on the given recordUi.
         * @param denormalizedRecordUi Record UI denormalized value
         * @param cacheAccessor An object to access cache directly
         * @param recordUiCacheKey Cache key for Record UI
         * @param rootRecordMerge True if we should attempt to merge the root record during normalization. This should only happen from ADS bridge
         *      code paths. If this request originated from LDS, then we know the record has all the fields we are interested in and is the freshest version.
         */_normalizeAndStagePutRecordUi(dependencies,denormalizedRecordUi,cacheAccessor,recordUiCacheKey,rootRecordMerge){const objectToClone=denormalizedRecordUi;const normalizedRecordUi=cloneDeepCopy(objectToClone);// Object Info normalization
    const objectInfos=denormalizedRecordUi.objectInfos;const objectApiNames=Object.keys(objectInfos);for(let len=objectApiNames.length,n=0;n<len;n++){const objectApiName=objectApiNames[n];const objectInfo=objectInfos[objectApiName];// Construct the marker.
    normalizedRecordUi.objectInfos[objectApiName]={objectApiName:objectInfo.apiName,eTag:objectInfo.eTag};this._ldsCache.stagePutValue(OBJECT_INFO_VALUE_TYPE,[{cacheKey:recordUiCacheKey,type:1/* REQUIRED */}],objectInfo,cacheAccessor);}// Layout normalization
    const layouts=denormalizedRecordUi.layouts;const fieldsOnLayoutByObjectApiName={};const layoutObjectApiNames=Object.keys(layouts);for(let len=layoutObjectApiNames.length,n=0;n<len;n++){const objectApiName=layoutObjectApiNames[n];const recordTypeIdObjects=layouts[objectApiName];const recordTypeIds=Object.keys(recordTypeIdObjects);for(let recordTypeIdsLength=recordTypeIds.length,n1=0;n1<recordTypeIdsLength;n1++){const recordTypeId=recordTypeIds[n1];const layoutTypes=recordTypeIdObjects[recordTypeId];const layoutTypeIds=Object.keys(layoutTypes);for(let layoutTypesLength=layoutTypeIds.length,n2=0;n2<layoutTypesLength;n2++){const layoutType=layoutTypeIds[n2];const modeObjects=layoutTypes[layoutType];const modes=Object.keys(modeObjects);for(let modesLength=modes.length,n3=0;n3<modesLength;n3++){const mode=modes[n3];const layout=modeObjects[mode];// Keep track of the set of fields on the layouts.
    if(fieldsOnLayoutByObjectApiName[objectApiName]===undefined){fieldsOnLayoutByObjectApiName[objectApiName]=new Set();}addAll(fieldsOnLayoutByObjectApiName[objectApiName],getQualifiedFieldApiNamesFromLayout(layout,denormalizedRecordUi.objectInfos[objectApiName]));// Construct the marker for layout.
    normalizedRecordUi.layouts[objectApiName][recordTypeId][layoutType][mode]={objectApiName,recordTypeId,layoutType:layout.layoutType,mode:layout.mode,eTag:layout.eTag};this._ldsCache.stagePutValue(LAYOUT_VALUE_TYPE,[{cacheKey:recordUiCacheKey,type:1/* REQUIRED */}],layout,cacheAccessor,{objectApiName,recordTypeId});}}}}// Layout user state normalization.
    const layoutUserStates=denormalizedRecordUi.layoutUserStates;const layoutIds=Object.keys(layoutUserStates);for(let len=layoutIds.length,n=0;n<len;n++){const layoutId=layoutIds[n];const layoutUserState=layoutUserStates[layoutId];// Find the key identifiers for this layout id in the layouts section of the record ui.
    const layoutUserStateKeyParts=this._getLayoutUserStateKeyPartsFromRecordUiByLayoutId(denormalizedRecordUi,layoutId);{assert$1(layoutUserStateKeyParts,"layoutUserStateKeyParts must not be falsy");}const objectApiName=layoutUserStateKeyParts.objectApiName;const recordTypeId=layoutUserStateKeyParts.recordTypeId;const layoutType=layoutUserStateKeyParts.layoutType;const mode=layoutUserStateKeyParts.mode;// add Marker for the Layout user states
    normalizedRecordUi.layoutUserStates[layoutId]={objectApiName:layoutUserStateKeyParts.objectApiName,recordTypeId:layoutUserStateKeyParts.recordTypeId,layoutType:layoutUserStateKeyParts.layoutType,mode:layoutUserStateKeyParts.mode};this._ldsCache.stagePutValue(LAYOUT_USER_STATE_VALUE_TYPE,[{cacheKey:recordUiCacheKey,type:1/* REQUIRED */}],layoutUserState,cacheAccessor,{objectApiName,recordTypeId,layoutType,mode});}// Record normalization
    const recordService=this._ldsCache.getService(RECORD_VALUE_TYPE);const records=denormalizedRecordUi.records;const recordIds=Object.keys(records);for(let len=recordIds.length,n=0;n<len;n++){const recordId=recordIds[n];const record=records[recordId];// Ensure record service tracks ALL the fields on the layouts. This won't necessarily happen
    // when the record gets merged because the record might not have all the fields that are on the full layout.
    const fieldsOnLayout=fieldsOnLayoutByObjectApiName[record.apiName];if(fieldsOnLayout){recordService.addFieldsToTrack(recordId,fieldsOnLayout);}normalizedRecordUi.records[recordId]=toRecordMarker(cacheAccessor,record,0,denormalizedRecordUi.objectInfos[record.apiName]);this._ldsCache.stagePutValue(RECORD_VALUE_TYPE,[{cacheKey:recordUiCacheKey,type:1/* REQUIRED */}],record,cacheAccessor,{rootRecordMerge});}// Stage put the record ui.
    // Strip out the eTag from the value. We don't want to emit eTags!
    delete normalizedRecordUi.eTag;denormalizedRecordUi=this.stripETagsFromValue(denormalizedRecordUi);// Record ui will not store an eTag because it is an aggregate value.
    cacheAccessor.stagePut(dependencies,recordUiCacheKey,normalizedRecordUi,denormalizedRecordUi);}/**
         * Constructs and returns the layout user state cache key parts by layout id extracted from the given recordUi.
         * @param recordUi The recordUi to search for the given layoutId.
         * @param layoutId The layoutId of the layout with which to associate the userState update.
         * @returns See description.
         */_getLayoutUserStateKeyPartsFromRecordUiByLayoutId(recordUi,layoutId){// Search through the recordUi.layouts tree structure to find the matching layout with the given layoutId.
    const objectApiNames=Object.keys(recordUi.layouts);for(let len=objectApiNames.length,objectApiNameIndex=0;objectApiNameIndex<len;++objectApiNameIndex){const objectApiName=objectApiNames[objectApiNameIndex];const recordTypeIds=Object.keys(recordUi.layouts[objectApiName]);for(let recordTypeIdsLen=recordTypeIds.length,recordTypeIdIndex=0;recordTypeIdIndex<recordTypeIdsLen;++recordTypeIdIndex){const recordTypeId=recordTypeIds[recordTypeIdIndex];const layoutTypes=Object.keys(recordUi.layouts[objectApiName][recordTypeId]);for(let layoutTypesLen=layoutTypes.length,layoutTypeIndex=0;layoutTypeIndex<layoutTypesLen;++layoutTypeIndex){const layoutType=layoutTypes[layoutTypeIndex];const modes=Object.keys(recordUi.layouts[objectApiName][recordTypeId][layoutType]);for(let modeLength=modes.length,modeIndex=0;modeIndex<modeLength;++modeIndex){const mode=modes[modeIndex];const layout=recordUi.layouts[objectApiName][recordTypeId][layoutType][mode];if(layout.id===layoutId){// We found the matching layout, so construct the payload and return.
    return {objectApiName,recordTypeId,layoutType,mode};}}}}}// A matching layout was not found!
    return null;}/**
         * Constructs a value provider to retrieve a RecordUi.
         * @param recordUiValueProviderParameters See RecordUiValueProviderParams for a description of each parameter.
         * @returns The value provider to retrieve a RecordUi.
         */_createRecordUiValueProvider(recordUiValueProviderParameters){const valueProvider=new ValueProvider((cacheAccessor,recordUiValueProviderParams)=>{const{cacheKey,recordIds,layoutTypes,modes,optionalFields,localFreshRecordUi}=recordUiValueProviderParams;let{forceProvide,rootRecordMerge}=recordUiValueProviderParams;// Set defaults.
    forceProvide=forceProvide===true;rootRecordMerge=rootRecordMerge===true;// We need to inform recordLibrary of new records, wrap the cache accessor which will track all new things in this
    // cache operation and let commitPuts() handle the informs.
    cacheAccessor=wrapCacheAccessor(cacheAccessor,this._adsBridge);// W-5043986: Fix this as part of this story.
    // TODO: since we're effectively unioning all the fields for each entity type together, we need to add tracking for this on the return
    // once we know all the records and their entity types. We're not doing that yet.
    if(forceProvide){return this._getFreshValue(cacheAccessor,cacheKey,recordIds,layoutTypes,modes,optionalFields,rootRecordMerge,localFreshRecordUi);}const existingValueWrapper=cacheAccessor.get(cacheKey);if(existingValueWrapper&&existingValueWrapper.value!==undefined){const nowTime=cacheAccessor.nowTime;const lastFetchTime=existingValueWrapper.lastFetchTime;// check for ttl expiry
    const needsRefresh=nowTime>lastFetchTime+RECORD_UI_TTL;if(needsRefresh){// Value is stale; get a fresh value.
    return this._getFreshValue(cacheAccessor,cacheKey,recordIds,layoutTypes,modes,optionalFields,rootRecordMerge,localFreshRecordUi);}// Value is not stale, but we still need to validate the cached value
    const isValid=this._validateRecordUiCacheValue(cacheAccessor,existingValueWrapper.value);if(isValid){// make a call to recordService.getRecordWithFields which will update the record in case it's expired.
    // once the record gets updated, the record-ui's affected key handler will get invoked and thereby an updated record-ui will be emitted.
    const firstRecordId=recordIds[0];const trackedRecordFields=this._recordService.getFieldsForRecord(firstRecordId);const trackedRecordFieldsArray=collectionToArray(trackedRecordFields);// record service is used to check/refresh the record, if the record is stale, the service will refresh it otherwise will return a cache hit.
    this._recordService.getRecordWithFields(firstRecordId,[],trackedRecordFieldsArray);return Thenable.resolve(1/* CACHE_HIT */);}// Existing value is not valid; get a fresh value.
    return this._getFreshValue(cacheAccessor,cacheKey,recordIds,layoutTypes,modes,optionalFields,rootRecordMerge,localFreshRecordUi);}// No existing value; get a fresh value.
    return this._getFreshValue(cacheAccessor,cacheKey,recordIds,layoutTypes,modes,optionalFields,rootRecordMerge,localFreshRecordUi);},recordUiValueProviderParameters);return valueProvider;}// Quick-access to the logic in _createRecordUiValueProvider, and could be used to refactor that for readability
    hasValidCachedValue(cacheAccessor,params){const{recordIds,layoutTypes,modes,uniqueOptionalFields}=params;const cacheKey=buildCacheKey$3(recordIds,layoutTypes,modes,uniqueOptionalFields);const existingValueWrapper=cacheAccessor.get(cacheKey);return !!existingValueWrapper&&existingValueWrapper.value!==undefined&&cacheAccessor.nowTime<=existingValueWrapper.lastFetchTime+RECORD_UI_TTL&&this._validateRecordUiCacheValue(cacheAccessor,existingValueWrapper.value);}/**
         * @returns Reference to the RecordService instance.
         */get _recordService(){return this._ldsCache.getService(RECORD_VALUE_TYPE);}}/**
     * Wire adapter id: getRecordUi.
     * @throws Error - Always throws when invoked. Imperative invocation is not supported.
     */function getRecordUi(){throw generateError("getRecordUi");}/**
     * Generates the wire adapters for:
     *      * @wire getRecordUi
     */class RecordUiWireAdapterGenerator{/**
         * Constructor.
         * @param recordUiService Reference to the RecordUiService instance.
         */constructor(recordUiService){this._recordUiService=recordUiService;}/**
         * Generates the wire adapter for @wire getRecordUi.
         * @returns See description.
         */generateGetRecordUiWireAdapter(){const wireAdapter=generateWireAdapter(this._serviceGetRecordUi.bind(this));return wireAdapter;}/**
         * @private Made public for testing.
         * Service @wire getRecordUi.
         * @param config Config params for the service. The type is or'd with any so that we can test sending bad configs. Consumers will be able to send us bad configs.
         * @return Observable stream that emits a record ui object.
         */_serviceGetRecordUi(config){if(!config){return undefined;}{// validate schema
    const required=["modes","layoutTypes","recordIds"];const supported=["layoutTypes","modes","optionalFields","recordIds"];const unsupported=["formFactor","childRelationships","pageSize"];// TODO W-6220452 (formFactor), W-4421501 (childRelationships, pageSize)
    validateConfig("getRecordUi",config,required,supported,unsupported);}// toArray() + isArrayOfNonEmptyStrings() provides a runtime guarantee that a value is a
    // string[] with length > 0.
    const recordIds=toArray(config.recordIds);const layoutTypes=toArray(config.layoutTypes);const modes=toArray(config.modes);let optionalFields=toArray(config.optionalFields);if(!isArrayOfNonEmptyStrings(recordIds)){return undefined;}if(!isArrayOfNonEmptyStrings(layoutTypes)){return undefined;}if(!isArrayOfNonEmptyStrings(modes)){return undefined;}optionalFields=optionalFields.map(getFieldApiName$1);if(optionalFields.length!==0&&!isArrayOfNonEmptyStrings(optionalFields)){return undefined;}return this._recordUiService.getRecordUi(recordIds.map(to18),layoutTypes,modes,optionalFields);}}/**
     * Provides crud functionality for records in the cache. Can refresh records with data from the server.
     * We do not utilize caching or sending eTags to the server for this value type because it gets invalidated
     * quickly on the client from having its atoms updated.
     */class RecordService extends LdsServiceBase{/**
         * Constructor.
         * @param ldsCache Reference to the LdsCache instance.
         * @param adsBridge Reference to the AdsBridge instance.
         */constructor(ldsCache,adsBridge){super(ldsCache,[RECORD_VALUE_TYPE]);/**
             * Mapping of record id -> fields requested by ADS. LDS is not currently interested in these but we will add these fields to fetch on CACHE_MISS or refresh.
             */this._recordIdsToFieldsToRefreshMap=new Map();/**
             * Mapping of record id -> readOnly observable.
             */this._recordIdsToReadOnlyObservablesMap=new Map();/**
             * Mapping of filtered observable cache key -> filtered observable.
             */this._filteredObservables=new Map();/**
             * Mapping of record id -> number of current active refreshes. This is used to prevent filtered observables
             * from emitting old values while a refresh(s) is happening.
             */this._recordIdsToIsRefreshingMap=new Map();/**
             * Set of entities that have had server calls to UI API fail.
             */this._unsupportedEntitiesSet=new Set();this._adsBridge=adsBridge;}/**
         * Returns the ttl for records.
         */getCacheValueTtl(){return RECORD_TTL;}/**
         * Gets a record.
         * @param recordId Id of the record to retrieve.
         * @param fields Qualified field API names to retrieve. If any are inaccessible then an error is emitted.
         * @param optionalFields Qualified field API names to retrieve. If any are inaccessible then they are silently omitted.
         * @returns An observable of the record.
         */getRecordWithFields(recordId,fields,optionalFields){return this.getRecordWithFieldsWithMetaConfig(recordId,fields,optionalFields);}/**
         * WARNING: PLEASE DO NOT USE THIS METHOD DIRECTLY FROM RECORD SERVICE, CONTACT LDS TEAM FOR MORE INFORMATION
         * Note: This method is used to refresh the record by skipping the cache, and must not be exported to force-lds-records
         * Gets a record with with additional retrieval configuration.
         * @param recordId Id of the record to retrieve.
         * @param fields Qualified field API names to retrieve. If any are inaccessible then an error is emitted.
         * @param optionalFields Qualified field API names to retrieve. If any are inaccessible then they are silently omitted.
         * @param metaConfig Retrieval configuration.
         *        forceProvide - if true then the cache is skipped
         *        successCallback - callback to be invoked after the refresh is complete
         *        errorCallback - callback to be invoked after the refresh fails
         * @returns An observable of the record.
         */getRecordWithFieldsWithMetaConfig(recordId,fields,optionalFields,metaConfig){const filteredObservable=this._privateGetRecordWithFields(recordId,fields,optionalFields,undefined,false,false,metaConfig);return filteredObservable;}/**
         * Gets a record by layoutType. The given layoutType specifies which fields will be returned on the record as well as any fields additionally specified
         * by fields and optionalFields.
         * @param recordId Id of the record to retrieve.
         * @param layoutTypes List of layoutTypes identifying the layouts from which to grab the field list.
         * @param modes List of modes identifying the layouts from which to grab the field list.
         * @param optionalFields Qualified field API names to retrieve in additional to those on the layout(s). If any are inaccessible then they are silently omitted.
         * @returns A thenable that resolves to an observable of the record.
         */getRecordWithLayouts(recordId,layoutTypes,modes,optionalFields){return this.getRecordWithLayoutsWithMetaConfig(recordId,layoutTypes,modes,optionalFields);}/**
         * WARNING: PLEASE DO NOT USE THIS METHOD DIRECTLY FROM RECORD SERVICE, CONTACT LDS TEAM FOR MORE INFORMATION
         * Note: This method is used to refresh the record by skipping the cache, and must not be exported to force-lds-records
         * Gets a record with layouts with with additional retrieval configuration.
         * @param recordId Id of the record to retrieve.
         * @param layoutTypes List of layoutTypes identifying the layouts from which to grab the field list.
         * @param modes List of modes identifying the layouts from which to grab the field list.
         * @param optionalFields Qualified field API names to retrieve in additional to those on the layout(s). If any are inaccessible then they are silently omitted.
         * @param metaConfig Retrieval configuration.
         *        forceProvide - if true then the cache is skipped
         *        successCallback - callback to be invoked after the refresh is complete
         *        errorCallback - callback to be invoked after the refresh fails
         * @returns An observable of the record.
         * @throws Throws an error when input fails validation.
         */getRecordWithLayoutsWithMetaConfig(recordId,layoutTypes,modes,optionalFields,metaConfig){let objectApiName;let recordTypeId;let record;let layouts=[];let objectInfo;return this._ldsCache.access().then(()=>{// Try to get the record so we can grab the objectApiName and recordTypeId so we can get the metadata
    // necessary to figure out the fields on the layouts.
    const recordCacheKey=buildRecordCacheKey(recordId);const recordValueWrapper=this._ldsCache.getValue(recordCacheKey);if(recordValueWrapper!==undefined&&isWithinTtl(this._ldsCache.timeSource.now(),recordValueWrapper.lastFetchTime,RECORD_TTL)){record=recordValueWrapper.value;}const results=[];if(record!==undefined){// Try to get the object info and layouts so we can get the fields list.
    objectApiName=record.apiName;recordTypeId=record.recordTypeInfo?record.recordTypeInfo.recordTypeId:MASTER_RECORD_TYPE_ID;const objectInfoCacheKey=buildCacheKey$1(record.apiName);results.push(this._ldsCache.getValue(objectInfoCacheKey));for(let layoutTypesLen=layoutTypes.length,layoutTypesIndex=0;layoutTypesIndex<layoutTypesLen;layoutTypesIndex++){for(let modesLen=modes.length,modesIndex=0;modesIndex<modesLen;modesIndex++){const layoutType=layoutTypes[layoutTypesIndex];const mode=modes[modesIndex];const layoutCacheKey=buildCacheKey$2(objectApiName,recordTypeId,layoutType,mode);results.push(this._ldsCache.getValue(layoutCacheKey));}}}// Validate object info and layouts retrieved from cache.
    if(results.length){const objectInfoValueWrapper=results[0];if(objectInfoValueWrapper!==undefined&&isWithinTtl(this._ldsCache.timeSource.now(),objectInfoValueWrapper.lastFetchTime,OBJECT_INFO_TTL)){objectInfo=objectInfoValueWrapper.value;}const layoutValueWrappers=results.slice(1);for(let len=layoutValueWrappers.length,n=0;n<len;n++){const layoutValueWrapper=layoutValueWrappers[n];if(layoutValueWrapper!==undefined&&isWithinTtl(this._ldsCache.timeSource.now(),layoutValueWrapper.lastFetchTime,LAYOUT_TTL)){layouts.push(layoutValueWrapper.value);}else{layouts=[];break;}}}const fieldsOnLayouts=new Set();if(record&&objectInfo&&layouts.length>0){// We have all the necessary metadata to get the fields on the given layouts, so let's get them!
    for(let len=layouts.length,n=0;n<len;n++){const layout=layouts[n];addAll(fieldsOnLayouts,getQualifiedFieldApiNamesFromLayout(layout,objectInfo));}// We finally have the fields on the layout, so now we can make a call to get the record.
    // NOTE: If we had to make the getRecordUi call earlier this will be a cache hit!
    return Thenable.resolve(this._privateGetRecordWithFields(recordId,collectionToArray(fieldsOnLayouts),optionalFields,undefined,false,false,metaConfig));}else{// At this point we are unable to get the fields list for the layout from the cache because we lack the necessary metadata.
    // We need to retrieve this metadata from the server by making a bulk call to record ui (this will also
    // get us the record too so the call later to get the record will just be a cache hit!)
    const recordUiService=this._ldsCache.getService(RECORD_UI_VALUE_TYPE);return observableToPromise(recordUiService.getRecordUi([recordId],layoutTypes,modes,optionalFields),true).then(recordUi=>{const layoutsKeys=Object.keys(recordUi.layouts);for(let layoutsKeysIndex=0,layoutsKeyIndexLength=layoutsKeys.length;layoutsKeysIndex<layoutsKeyIndexLength;++layoutsKeysIndex){const currObjectApiName=layoutsKeys[layoutsKeysIndex];const layoutsForObjectApiName=recordUi.layouts[currObjectApiName];const layoutsForObjectApiNameKeys=Object.keys(layoutsForObjectApiName);for(let layoutsForObjectApiNameKeysIndex=0,layoutsForObjectApiNameKeysLength=layoutsForObjectApiNameKeys.length;layoutsForObjectApiNameKeysIndex<layoutsForObjectApiNameKeysLength;++layoutsForObjectApiNameKeysIndex){const currRecordTypeId=layoutsForObjectApiNameKeys[layoutsForObjectApiNameKeysIndex];const layoutsForRecordTypeId=layoutsForObjectApiName[currRecordTypeId];const layoutsForRecordTypeIdKeys=Object.keys(layoutsForRecordTypeId);for(let layoutsForRecordTypeIdKeysIndex=0,layoutsForRecordTypeIdKeysLength=layoutsForRecordTypeIdKeys.length;layoutsForRecordTypeIdKeysIndex<layoutsForRecordTypeIdKeysLength;++layoutsForRecordTypeIdKeysIndex){const currLayoutType=layoutsForRecordTypeIdKeys[layoutsForRecordTypeIdKeysIndex];const layoutsForLayoutType=layoutsForRecordTypeId[currLayoutType];const layoutsForLayoutTypeKeys=Object.keys(layoutsForLayoutType);for(let layoutsForLayoutTypeKeysIndex=0,layoutsForLayoutTypeKeysLength=layoutsForLayoutTypeKeys.length;layoutsForLayoutTypeKeysIndex<layoutsForLayoutTypeKeysLength;++layoutsForLayoutTypeKeysIndex){const currMode=layoutsForLayoutTypeKeys[layoutsForLayoutTypeKeysIndex];const layout=layoutsForLayoutType[currMode];addAll(fieldsOnLayouts,getQualifiedFieldApiNamesFromLayout(layout,recordUi.objectInfos[recordUi.records[recordId].apiName]));}}}}return this._privateGetRecordWithFields(recordId,collectionToArray(fieldsOnLayouts),optionalFields,undefined,false,false,metaConfig);});}});}/**
         * Creates a new record using the properties defined in the given recordInput.
         * @param recordInput The RecordInput object to use to create the record.
         * @returns A promise that will resolve with the newly created record.
         *          The record will contain data for the list of fields as defined by the applicable layout
         *          for the record
         */async createRecord(recordInput){if(!recordInput){throw new Error("recordInput must be provided");}if(!recordInput.fields){throw new Error("recordInput must have its fields property set");}if(!("allowSaveOnDuplicate"in recordInput)){recordInput.allowSaveOnDuplicate=false;}checkType(recordInput.allowSaveOnDuplicate,Boolean);const transportResponse=await this._makeServerCall(undefined,"RecordUiController.createRecord",{recordInput});const newRecord=transportResponse.body;// Put the value into the cache by doing a get with a value provider that returns our newRecord object locally.
    // This will start the flow of going through all the due diligence of tracking fields, normalizing the record,
    // processing spanning records, etc.
    const newRecordCacheKey=getRecordCacheKey(newRecord);const fieldSet=new Set();recursivelyGatherFieldNames(newRecord.apiName,newRecord,fieldSet);const recordValueProviderParams={cacheKey:newRecordCacheKey,recordId:newRecord.id,optionalFields:collectionToArray(fieldSet),forceProvide:true,localFreshRecord:newRecord,rootRecordMerge:false,informRecordLib:true,resolveRootMerge:false};const localValueProviderForNewRecord=this._createRecordValueProvider(recordValueProviderParams);const observableForNewRecord=this._privateGetRecordWithFields(newRecord.id,[],collectionToArray(fieldSet),localValueProviderForNewRecord,undefined,undefined,undefined,true);// Only resolve when we get an emit for the newRecord. Then we will know it is in the cache. Since we are passing in a local value provider that already has the record,
    // the observable will have emitted by the time the above statement returns. This means when we subscribe the hotness value will be the most recent.
    return observableToPromise(observableForNewRecord,false,1);}/**
         * Updates a given record with updates described in the given recordInput object. Must have the recordInput.fields.Id property set to the record id
         * of the record to update.
         * @param recordInput The record input representation to use to update the record.
         * @param clientOptions Should take ifUnmodifiedSince to check for conflicts for update
         * @returns A promise that will resolve with the patched record. The record will contain data for the list of fields as defined by the
         *          applicable layout for the record as well as any specified additionalFieldsToReturn.
         */async updateRecord(recordInput,clientOptions){if(!recordInput){throw new Error("recordInput must be provided");}if(!recordInput.fields||!recordInput.fields.Id){throw new Error("recordInput must have its fields.Id property set");}if(!("allowSaveOnDuplicate"in recordInput)){recordInput.allowSaveOnDuplicate=false;}checkType(recordInput.allowSaveOnDuplicate,Boolean);// TODO: When W-4302741 gets finished, update this code to request for additional fields for any that we might already be tracking
    // for the record. This will relinquish the need to make a separate GET call for getting a fresh copy of ALL the fields
    // we need.
    const transportResponse=await this._makeServerCall(recordInput.fields.Id,"RecordUiController.updateRecord",{recordId:recordInput.fields.Id,recordInput,clientOptions});const updatedRecord=transportResponse.body;// Request a fresh copy of the record from UIAPI. This will ensure we get a fresh value for all the fields we are tracking. Force an eviction.
    const fieldSet=new Set();recursivelyGatherFieldNames(updatedRecord.apiName,updatedRecord,fieldSet);// Resolve the promise when the refresh has completed.
    const resultPromise=new Promise((resolve,reject)=>{const successCallback=()=>{resolve(this.stripETagsFromValue(updatedRecord));};const metaConfig={forceProvide:true,finishedCallbacks:{successCallback,errorCallback:reject}};// When W-4302741 is finished we will not need to make this call.
    this._privateGetRecordWithFields(updatedRecord.id,[],collectionToArray(fieldSet),undefined,true,true,metaConfig,true);});return resultPromise;}/**
         * Deletes a record given the recordId.
         * @param recordId The 18 char record ID for the record to be retrieved.
         * @returns A promise that resolves when the record is deleted.
         */async deleteRecord(recordId){if(!recordId){throw new Error("recordId must be provided");}await this._makeServerCall(recordId,"RecordUiController.deleteRecord",{recordId});const recordCacheKey=buildRecordCacheKey(recordId);return this._ldsCache.access().then(()=>{this._ldsCache.deleteValueAndDeleteObservable(recordCacheKey);});}/**
         * Stage puts the given record.
         * @param dependencies An array of dependent cache keys.
         * @param record The record to cache.
         * @param cacheAccessor An object to access cache directly.
         * @param additionalData A property bag with additional values that are needed to generate the cache key.
         * @returns True if the operation succeeded, else false.
         */stagePutValue(dependencies,record,cacheAccessor,additionalData){if(additionalData.optionalFields){this.addFieldsToTrack(record.id,additionalData.optionalFields);}this.mergeRecordAndStagePut(dependencies,record,cacheAccessor,additionalData.rootRecordMerge,additionalData.resolveRootMerge);}/**
         * Strips all eTag properties from the record by directly deleting them (including nested records.)
         * @param record The record from which to strip the eTags.
         * @returns The same record object with its eTags stripped.
         */stripETagsFromValue(record){delete record.eTag;const fields=record.fields;if(fields){const fieldKeys=Object.keys(fields);for(let n=0,len=fieldKeys.length;n<len;n++){const field=fields[fieldKeys[n]];if(field){const fieldValue=field.value;if(isRecordRepresentation(fieldValue)){// Found a spanning record, so let's recurse!
    this.stripETagsFromValue(fieldValue);}}}}return record;}/**
         * Affected Key handler for record.
         * @returns The affected key handler for this service.
         */getAffectedKeyHandler(){return (affectedKey,cacheAccessor)=>{const normalizedRecordValueWrapper=cacheAccessor.get(affectedKey);if(normalizedRecordValueWrapper&&normalizedRecordValueWrapper.value){try{const record=this.denormalizeValue(normalizedRecordValueWrapper.value,cacheAccessor);if(record){const recordValueWrapperToEmit=cloneWithValueOverride(normalizedRecordValueWrapper,record);cacheAccessor.stageEmit(affectedKey,recordValueWrapperToEmit);}}catch(err){// Denormalization of record failed since record was deleted, proceed to refresh
    const recordId=affectedKey.key;const optionalFields=this.getFieldsForRecord(recordId);this._privateGetRecordWithFields(recordId,[],collectionToArray(optionalFields),undefined,false,true);}}};}/**
         * Takes the normalized record and cacheAccessor and returns the denormalized record.
         * @param normalizedRecord The record to denormalized. This should always be a normalized record that came from the cache.
         * @param cacheAccessor The CacheAccessor in scope for this operation.
         * @param depth This is a recursive call and this parameter is used to indicate what depth we're at so in cyclical cases we don't
         *        continue denormalizing forever. The SOQL limit is 5 levels, so this will denormalize to a depth of 5. Most callers do not need to
         *        provide this since they are denormalizing a top level record, so this param is optional.
         * @returns The denormalized record.
         */denormalizeValue(normalizedRecord,cacheAccessor,depth){if(depth==null){depth=0;}const value=this._denormalizeValueHelper(normalizedRecord,cacheAccessor,depth);if(!value){throw getLdsInternalError("DENORMALIZE_FAILED","Unexpectedly received undefined from denormalizeValueHelper.",true);}return value;}/**
         * Adds the given objectApiName to the list of unsupported entities.
         * @param objectApiName The object api name to add to the list of unsupported entities.
         */addUnsupportedEntity(objectApiName){this._unsupportedEntitiesSet.add(objectApiName);}/**
         * Get tracked fields for the given record from an in-memory Map
         * @param recordId The record id.
         * @returns the tracked fields for the record
         */getFieldsForRecord(recordId){// Check to see if we've ever requested these fields before.
    const _recordIdsToFieldsRequestedMap=this._saveableState._recordIdsToFieldsRequestedMap;let trackedRecordFields=_recordIdsToFieldsRequestedMap.get(recordId);if(!trackedRecordFields){trackedRecordFields=new Set();_recordIdsToFieldsRequestedMap.set(recordId,trackedRecordFields);}return trackedRecordFields;}/**
         * Set fields requested by ADS, that LDS is not interested in for the given record from an in-memory Map
         * @param recordId The record id.
         * @returns the tracked fields for the record
         */setADSFieldsForRecord(recordId){// Check to see if we've ever requested these fields before.
    const _recordIdsToFieldsToRefreshMap=this._recordIdsToFieldsToRefreshMap;let refreshRecordFields=_recordIdsToFieldsToRefreshMap.get(recordId);if(!refreshRecordFields){refreshRecordFields=new Set();_recordIdsToFieldsToRefreshMap.set(recordId,refreshRecordFields);}return refreshRecordFields;}/**
         * Get fields requested by ADS, that LDS is not interested in for the given record from an in-memory Map
         * @param recordId
         * @returns the tracked fields for the record
         */getADSFieldsForRecord(recordId){// Check to see if we've ever requested these fields before.
    const _recordIdsToFieldsToRefreshMap=this._recordIdsToFieldsToRefreshMap;const refreshRecordFields=_recordIdsToFieldsToRefreshMap.get(recordId);return refreshRecordFields;}/**
         * Record UI service (and possibly others?) sometimes need to inform record service to track fields that aren't
         * necessarily in the record they are normalizing. For instance, when record ui gets a record by layout type and mode,
         * all the fields in the layout won't necessarily be returned in the record (spanning id fields might not be set so those
         * fields won't get returned on the record even though they are on the layout!).
         * @param recordId The record id.
         * @param fields A list of fields to add to the tracked fields list for the given recordId.
         */addFieldsToTrack(recordId,fields){if(fields.length===0){return;}const trackedRecordFields=this.getFieldsForRecord(recordId);addAll(trackedRecordFields,fields);this._cacheSaveableState();}/**
         * TODO: Reexamine why record-uis.js needs this function. Should we really be exporting it?!
         * @param rootRecord Root record stored in LDS cache
         * @returns record fields for that root record
         */gatherAndTrackSpanningFields(rootRecord){const recordFieldsSet=new Set();recursivelyGatherFieldNames(rootRecord.apiName,rootRecord,recordFieldsSet);this.addFieldsToTrack(rootRecord.id,collectionToArray(recordFieldsSet));return recordFieldsSet;}/**
         * Takes an array of denormalized root records and does the work of normalizing and merging the root and all nested records.
         * Finally it stages puts for all records.
         * @param dependencies The common cache keys that depend on all of these records - required but may be empty.
         *        This list will be added to any other dependent cache keys already being tracked for these records.
         * @param denormalizedRecordsArray The denormalized root records to be cached.
         * @param cacheAccessor The CacheAccessor in scope for this operation.
         * @param rootRecordMerge RecordService has an addRecord() method which is used by ADS to add records into LDS cache. When this is called from
         *        addRecords() we need to merge the ADS record with what exists in the LDS cache because LDS may be tracking more fields than ADS is giving us.
         *        For scenarios within the LDS Records Module, if we have fetched a fresh value from the server and if it's a root record, there is no need for a
         *        merge because LDS should have retrieved all necessary fields.
         * @returns The array of cache keys for the records to be cached or refreshed as a
         *          result of this operation. The array should not contain duplicate cache keys.
         */mergeRecordsAndStagePuts(dependencies,denormalizedRecordsArray,cacheAccessor,rootRecordMerge){const cacheKeysMap=new Map();const arrayOfArrayOfCacheKeys=[];for(let len=denormalizedRecordsArray.length,c=0;c<len;++c){const denormalizedRecord=denormalizedRecordsArray[c];arrayOfArrayOfCacheKeys.push(this.mergeRecordAndStagePut(dependencies,denormalizedRecord,cacheAccessor,rootRecordMerge,false));}// Merge all returned cache keys into one array, not an array of arrays. Also remove duplicate keys if any.
    for(let len=arrayOfArrayOfCacheKeys.length,c=0;c<len;++c){const arrayOfCacheKeys=arrayOfArrayOfCacheKeys[c];for(let length1=arrayOfCacheKeys.length,i=0;i<length1;++i){const cacheKey=arrayOfCacheKeys[i];cacheKeysMap.set(serialize(cacheKey),cacheKey);}}return Array.from(cacheKeysMap.values());}/**
         * Takes a denormalized root record and does the work of normalizing and merging the root and all nested records.
         * Finally it stages puts for all merged records.
         * @param dependencies The cache keys that depend on this record - required but may be empty. This list
         *        will be added to any other dependent cache keys already being tracked for this record.
         * @param denormalizedRecord The denormalized root record to be cached.
         * @param cacheAccessor The CacheAccessor in scope for this operation.
         * @param rootRecordMerge RecordService has an addRecord() method which is used by ADS to add records into LDS cache. When this is called from
         *        addRecords() we need to merge the ADS record with what exists in the LDS cache because LDS may be tracking more fields than ADS is giving us.
         *        For scenarios within the LDS Records Module, if we have fetched a fresh value from the server and if it's a root record, there is no need for a
         *        merge because LDS should have retrieved all necessary fields.
         * @param resolveRootMerge true if during merge for a root record we should accept the record even if it has fewer fields than the existing record.
         * @param filteredRecordObservableCacheKey Cache Key if this is coming from a filtered record request.
         * @returns A Thenable that resolves to the array of cache keys for the records to be cached or refreshed as a
         *          result of this operation. The array should not contain duplicate cache keys.
         */mergeRecordAndStagePut(dependencies,denormalizedRecord,cacheAccessor,rootRecordMerge,resolveRootMerge,filteredRecordObservableCacheKey){// Check for view entities. LDS does not currently support view entities, so this we check to make sure they don't end up in the cache.
    // If they are cached without proper support they can "stomp" other records of a primary entity because they often share IDs.
    {assert$1(!isKnownViewEntity(denormalizedRecord.apiName),`View entities are not supported: ${denormalizedRecord.apiName}`);if(!denormalizedRecord.lastModifiedById||!denormalizedRecord.lastModifiedDate||!denormalizedRecord.systemModstamp){// tslint:disable-next-line:no-console
    console.log(`target record is missing required properties(lastModifiedDate, systemModstamp, lastModifiedById): ${JSON.stringify(denormalizedRecord)}`);}}if(!rootRecordMerge){// This is a full value replacement, so clear old dependencies and let them be recalculated.
    const recordCacheKey=buildRecordCacheKey(denormalizedRecord.id);cacheAccessor.stageClearDependencies(recordCacheKey);}// The normalized records(including spanning records with dependencies).
    const normalizedRecordsWithDependencies=this._getNormalizedRecordsWithDependencies(denormalizedRecord,cacheAccessor,dependencies,0);// Merge fields across the normalized records.
    const cacheKeyToNormalizedRecordsWithDependenciesMap=new Map();for(let len=normalizedRecordsWithDependencies.length,n=0;n<len;n++){const normalizedRecordWithDependencies=normalizedRecordsWithDependencies[n];if(cacheKeyToNormalizedRecordsWithDependenciesMap.has(serialize(normalizedRecordWithDependencies.sourceCachekey))){const normalizedRecordWithDependenciesFromMap=cacheKeyToNormalizedRecordsWithDependenciesMap.get(serialize(normalizedRecordWithDependencies.sourceCachekey));if(normalizedRecordWithDependenciesFromMap){// Use non-null LastModifiedById, LastModifiedDate, SystemModstamp as these could be null for the same record occuring multiple times.
    normalizedRecordWithDependencies.objectToCache.lastModifiedById=normalizedRecordWithDependencies.objectToCache.lastModifiedById||normalizedRecordWithDependenciesFromMap.objectToCache.lastModifiedById;normalizedRecordWithDependencies.objectToCache.lastModifiedDate=normalizedRecordWithDependencies.objectToCache.lastModifiedDate||normalizedRecordWithDependenciesFromMap.objectToCache.lastModifiedDate;normalizedRecordWithDependencies.objectToCache.systemModstamp=normalizedRecordWithDependencies.objectToCache.systemModstamp||normalizedRecordWithDependenciesFromMap.objectToCache.systemModstamp;Object.assign(normalizedRecordWithDependencies.objectToCache.fields,normalizedRecordWithDependenciesFromMap.objectToCache.fields);Object.assign(normalizedRecordWithDependencies.objectToEmit.fields,normalizedRecordWithDependenciesFromMap.objectToEmit.fields);}}cacheKeyToNormalizedRecordsWithDependenciesMap.set(serialize(normalizedRecordWithDependencies.sourceCachekey),normalizedRecordWithDependencies);}return this._mergeRecordsAndStagePuts(normalizedRecordsWithDependencies,cacheAccessor,rootRecordMerge,resolveRootMerge,filteredRecordObservableCacheKey);}/**
         * For use externally by ADS BRIDGE ONLY. This is exposed because ads-bridge needs special access to import records from ADS into LDS.
         * @param recordId Id of the record to retrieve.
         * @param fields Qualified field API names to retrieve. If any are inaccessible then an error is emitted.
         * @param optionalFields Qualified field API names to retrieve. If any are inaccessible then they are silently omitted.
         * @param overrideValueProvider ValueProvider to fetch, normalize and cache the values.
         * @param returnFinalTransformedObservable True to return a finalTransformed observable, false for an observable whose emitted values are mutable.
         * @param forceProvide True to skip the cache and force a server call.
         * @param metaConfig Retrieval configuration.
         *        forceProvide - if true then the cache is skipped
         *        successCallback - callback to be invoked after the refresh is complete
         *        errorCallback - callback to be invoked after the refresh fails
         * @param emitLastValue True to ignore the stored lastValue emitted during observableConstruction, if there is one.
         *        Generally, you'd want to skip this because the value is stale
         * @param isFromAdsBridge - True if this request is coming from ADS Bridge.
         * @returns An observable of the record.
         */_privateGetRecordWithFields(recordId,fields,optionalFields,overrideValueProvider,returnFinalTransformedObservable,forceProvide,metaConfig,emitLastValue,isFromAdsBridge){recordId=to18(recordId);const cacheKey=buildRecordCacheKey(recordId);const trackedRecordFields=this.getFieldsForRecord(recordId);const refreshRecordFields=this.getADSFieldsForRecord(recordId);const requestedFields=addAll(new Set(fields),optionalFields);const requestOnlyHasTrackedFields=containsAll(trackedRecordFields,requestedFields);// Adjust the optional fields we're requesting to include any other fields we're tracking that aren't already part of the required fields
    // Using Array.push to join the new fields from requestedFields instead of Set.addAll because when sets are converted to arrays
    // via collectionToArray the ordering is determined by insertion order of items. Any additional fields should be appended to preserve ordering.
    const newFields=collectionToArray(difference(requestedFields,trackedRecordFields));const adjustedOptionalFields=collectionToArray(trackedRecordFields);for(let len=newFields.length,n=0;n<len;n++){adjustedOptionalFields.push(newFields[n]);}forceProvide=forceProvide||!containsAll(trackedRecordFields,adjustedOptionalFields)||metaConfig&&metaConfig.forceProvide;// Add in fields that ADS has requested but LDS is not interested in.
    if(refreshRecordFields){const refreshFields=collectionToArray(difference(refreshRecordFields,adjustedOptionalFields));for(let len=refreshFields.length,n=0;n<len;n++){adjustedOptionalFields.push(refreshFields[n]);}}if(forceProvide&&!isFromAdsBridge){addRecordToRefreshList(this._recordIdsToIsRefreshingMap,recordId);}const filteredRecordObservableKey=buildFilteredRecordObservableKey(recordId,fields,optionalFields);const recordValueProviderParams={cacheKey,recordId,optionalFields:adjustedOptionalFields,forceProvide,rootRecordMerge:false,informRecordLib:true,resolveRootMerge:false,filteredRecordObservableCacheKey:filteredRecordObservableKey};const valueProvider=overrideValueProvider?overrideValueProvider:this._createRecordValueProvider(recordValueProviderParams);const finishedCallbacks=metaConfig&&metaConfig.finishedCallbacks;this._ldsCache.get(cacheKey,valueProvider,finishedCallbacks);const observables=this._ldsCache.getOrCreateObservables(cacheKey,this.getCacheValueTtl());this._recordIdsToReadOnlyObservablesMap.set(recordId,observables.finalTransformed);// check if we already have a filtered observable for the fields, and create it if not
    const _filteredObservables=this._filteredObservables;let filteredObservable=_filteredObservables.get(serialize(filteredRecordObservableKey));if(!filteredObservable){// We pass observables.root here so that any new filteredObservable chain gets all emits from the root.
    filteredObservable=this._constructFilteredObservable(filteredRecordObservableKey,observables.root,fields,optionalFields,requestOnlyHasTrackedFields,emitLastValue);_filteredObservables.set(serialize(filteredRecordObservableKey),filteredObservable);}if(returnFinalTransformedObservable){return observables.finalTransformed;}return filteredObservable;}/**
         * What fields does LDS know exist about the given recordId?
         * @param recordId
         * @returns Set<string> of fields that can be fetched for the record during a refresh
         */getAllKnownFields(recordId){if(recordId){recordId=to18(recordId);return new Set([...this.getFieldsForRecord(recordId),...(this.getADSFieldsForRecord(recordId)||[])]);}return new Set();}/**
         * /**
         * For use externally by ADS BRIDGE ONLY. This is exposed because ads-bridge needs special access to import records from ADS into LDS.
         * Constructs a value provider to retrieve a Record.
         * @param valueProviderParameters: { cacheKey, recordId, optionalFields, forceProvide = false, record, rootRecordMerge = false, informRecordLib = true } -
         *        The parameters for the value provider as an object. Each object should contain the following fields:
         *        - cacheKey: CacheKey - The relevant cache key for the Record.
         *        - recordId: Array<string> - The 18 char IDs of the records to retrieve.
         *        - optionalFields: Array<string> - This array should contain every field being tracked for this record as well as any new fields we need to get.
         *        - forceProvide: boolean - True if we need to get fresh value from the server or use the provided value (record param) and skip the cache,
         *          otherwise false. Optional - defaults to false.
         *        - record: object - A Record value you want explicitly put into cache - should be used in conjunction with a true value for forceProvide. When
         *          this is done, no actual API call will be made.
         *        - rootRecordMerge: boolean - RecordService has an addRecord() method which is used by ADS to add records into LDS cache. When this is called from
         *          addRecords() we need to merge the ADS record with what exists in the LDS cache because LDS may be tracking more fields than ADS is giving us.
         *          For scenarios within the LDS Records Module, if we have fetched a fresh value from the server and if it's a root record, there is no need for a
         *          merge because LDS should have retrieved all necessary fields. Optional - defaults to false.
         *        - informRecordLib: boolean - true if this should notify recordLibrary of any records being added due to this operation, otherwise false.
         *        - resolveRootMerge: boolean - true if during merge for a root record we should accept the record even if it has fewer fields than the existing record.
         *          defaults to false.
         * @param vpEqualsFn - a value provider equals function that allows the caller to specify whether to debounce the valueprovider or not
         * @returns ValueProvider: The value provider to retrieve a Record.
         */_createRecordValueProvider(valueProviderParameters,vpEqualsFn){return new ValueProvider((cacheAccessor,{// Do NOT set defaults here. See W-4840393.
    cacheKey,recordId,optionalFields,forceProvide,localFreshRecord,rootRecordMerge,informRecordLib,resolveRootMerge,filteredRecordObservableCacheKey})=>{// Explicitly set defaults. Cannot use deconstruction in function param due to EDGE issue. See W-4840393
    forceProvide=forceProvide||false;informRecordLib=informRecordLib===undefined?true:informRecordLib;resolveRootMerge=resolveRootMerge||false;optionalFields=optionalFields||[];rootRecordMerge=rootRecordMerge||false;if(informRecordLib){// If we need to inform recordLibrary of new records, wrap the cache accessor which will track all new things in this
    // cache operation and let commitPuts() handle the informs.
    cacheAccessor=wrapCacheAccessor(cacheAccessor,this._adsBridge);}if(forceProvide){return this._getFreshValue(cacheAccessor,recordId,optionalFields,rootRecordMerge,localFreshRecord,resolveRootMerge,filteredRecordObservableCacheKey);}const existingValueWrapper=cacheAccessor.get(cacheKey);if(existingValueWrapper&&existingValueWrapper.value!==undefined){const nowTime=cacheAccessor.nowTime;const lastFetchTime=existingValueWrapper.lastFetchTime;// check for ttl expiry
    const needsRefresh=nowTime>lastFetchTime+RECORD_TTL;if(needsRefresh){// Value is stale; get a fresh value.
    return this._getFreshValue(cacheAccessor,recordId,optionalFields,rootRecordMerge,localFreshRecord,resolveRootMerge,filteredRecordObservableCacheKey);}return Thenable.resolve(1/* CACHE_HIT */);}// No existing value; get a fresh value.
    return this._getFreshValue(cacheAccessor,recordId,optionalFields,rootRecordMerge,localFreshRecord,resolveRootMerge,filteredRecordObservableCacheKey);},valueProviderParameters,vpEqualsFn);}hasValidCachedValue(cacheAccessor,params){const cacheKey=buildRecordCacheKey(params.recordId);const existingValueWrapper=cacheAccessor.get(cacheKey);return !!existingValueWrapper&&existingValueWrapper.value!==undefined&&cacheAccessor.nowTime<=existingValueWrapper.lastFetchTime+RECORD_TTL&&this._validateRecordCacheValue(params,existingValueWrapper.value);}_validateRecordCacheValue(params,normalizedRecord){// If we have all the requested fields in the cache, we don't need to fetch this record (again)
    // TODO: Is it okay to request the (partial) record via Aggregate?
    let requestedFields=params.optionalFields;requestedFields=requestedFields.map(fullyQualifiedFieldName=>{// Turn ObjectApiName.Id -> Id
    const fieldParts=fullyQualifiedFieldName.split(".");if(fieldParts.length===2){return fieldParts[1];}else if(fieldParts.length===1){return fullyQualifiedFieldName;}else{return fullyQualifiedFieldName.substring(fieldParts[0].length+1);}});return normalizedRecord.fields&&requestedFields.every(paramName=>{const storedParamValue=normalizedRecord.fields[paramName];return storedParamValue!==undefined;},true);}/**
         * Takes the normalized record and cacheAccessor and returns the denormalized record.
         * @param normalizedRecord The record to denormalized. This should always be a normalized record that came from the cache.
         * @param cacheAccessor The CacheAccessor in scope for this operation.
         * @param depth This is a recursive call and this parameter is used to indicate what depth we're at so in cyclical cases we don't
         *        continue denormalizing forever. The SOQL limit is 5 levels, so this will denormalize to a depth of 5. Most callers do not need to
         *        provide this since they are denormalizing a top level record, so this param is optional.
         * @returns A denormalized record or undefined if a nested record can't be found in the cache or MAX_DEPTH has been reached.
         */_denormalizeValueHelper(normalizedRecord,cacheAccessor,depth){// MAX_DEPTH is the SOQL limit, so we don't denorm past MAX_DEPTH levels.
    if(depth>MAX_DEPTH){return;}const denormalizedRecord=cloneDeepCopy(normalizedRecord);const denormalizedRecordFields=denormalizedRecord.fields;{assert$1(denormalizedRecordFields,`Where are the denormalizedRecordFields? ${denormalizedRecordFields}`);}const denormalizedRecordFieldsArray=Object.entries(denormalizedRecordFields);for(let len=denormalizedRecordFieldsArray.length,n=0;n<len;n++){const[fieldName,field]=denormalizedRecordFieldsArray[n];{assert$1(field,`Found malformed field with no field value structure: ${fieldName}, ${field}`);}if(isRecordMarker(field.value)){const fieldValue=field.value;const recordId=fieldValue.id;const cacheKey=buildRecordCacheKey(recordId);const spanningRecordValueWrapper=cacheAccessor.get(cacheKey);if(!spanningRecordValueWrapper){// TODO: W-5450972 maybe the record LRUed out =( -- consider if we should make this impossible (run out of memory instead?).
    throw getLdsInternalError("DENORMALIZE_FAILED",`Did not find record for '${recordId}'`,false);}const normalizedSpanningRecord=spanningRecordValueWrapper.value;// If depth is more than MAX_DEPTH do not try to denormalize further. This can happen in case we have a cycle in denorm records.
    if(Math.max(depth+1,fieldValue.depth)>MAX_DEPTH){// Delete the spanning field as we do not want to gather field names via recursivelyGatherFieldNames for the parent record.
    delete denormalizedRecordFields[fieldName];}else{// Proceed to denormalize spanning record.
    const denormalizedSpanningRecord=this._denormalizeValueHelper(normalizedSpanningRecord,cacheAccessor,Math.max(depth+1,fieldValue.depth));if(denormalizedSpanningRecord){const spanningRecordMarkerFieldsArray=fieldValue.fields;const fieldsInSpanningRecordSet=new Set();recursivelyGatherFieldNames(denormalizedSpanningRecord.apiName,denormalizedSpanningRecord,fieldsInSpanningRecordSet);const missingFields=spanningRecordMarkerFieldsArray.filter(fieldApiName=>!fieldsInSpanningRecordSet.has(fieldApiName));if(missingFields.length>0){// We don't have enough fields to satisfy the marker.
    // Check the conflict records map for an entry and if an entry exists, utilize the value from map to denorm the record correctly.
    const recordFromConflictRecordsMap=this._saveableState._mergeConflictRecordsMap.get(normalizedSpanningRecord.id);// the conflict records map also does not have an entry for this record and thereby we cannot denorm the record correctly.
    if(!recordFromConflictRecordsMap){// filter the <fieldName>__r fields before throwing error
    if(missingFields.filter(fieldApiName=>!fieldApiName.endsWith("__r")).length>0){const spanningRecordFieldsArray=collectionToArray(fieldsInSpanningRecordSet);const missingFieldsError=JSON.stringify({expectedFields:spanningRecordMarkerFieldsArray,actualFields:spanningRecordFieldsArray});const missingFieldsErrorMessage=`Did not find all necessary fields for record: '${recordId}': '${missingFieldsError}'`;instrumentError({message:missingFieldsErrorMessage},"LDS.recordService.necessaryFieldsMissing",InstrumentationErrorType.WARN,"DENORMALIZE_FAILED");throw getLdsInternalError("DENORMALIZE_FAILED",missingFieldsErrorMessage,false);}}const spanningRecordMarkerFieldsSet=new Set();addAll(spanningRecordMarkerFieldsSet,spanningRecordMarkerFieldsArray);for(let fieldsLength=missingFields.length,m=0;m<fieldsLength;m++){const apiNameReg=new RegExp(`^${denormalizedSpanningRecord.apiName}\\.`);const fieldApiName=missingFields[m].replace(apiNameReg,"");const missingFieldValue=recordFromConflictRecordsMap&&recordFromConflictRecordsMap.fields[fieldApiName];if(missingFieldValue===undefined){// if we have missing field and it is <fieldName>__r then we add { value: null, displayValue: null };
    // because the <fieldName>__c is undefined at this point otherwise we have a value for <fieldName>__r
    if(fieldApiName.endsWith("__r")){denormalizedSpanningRecord.fields[fieldApiName]={value:null,displayValue:null};}else{const spanningRecordFieldsArray=collectionToArray(fieldsInSpanningRecordSet);// the conflicts records map does not contain a value for a field.
    const missingFieldError=JSON.stringify({expectedFields:spanningRecordMarkerFieldsArray,actualFields:spanningRecordFieldsArray});const missingFieldErrorMessage=`Missing field(s) : '${missingFieldError}' in conflicting record '${recordId}'`;instrumentError({message:missingFieldErrorMessage},"LDS.recordService.necessaryFieldsMissingInConflictMap",InstrumentationErrorType.WARN,"DENORMALIZE_FAILED");throw getLdsInternalError("DENORMALIZE_FAILED",missingFieldErrorMessage,false);}}else{denormalizedSpanningRecord.fields[fieldApiName]=missingFieldValue;}}}// TODO: ideally we'd keep track of the name field (in extra properties?) and use that instead of hardcoding 'Name' which
    // is right most of the time but not all of the time. We need to examine the ObjectInfo to get the correct Name field
    // 100% of the time.
    // Note: the use of null over undefined below is intentional -- since this is a serializable JSON payload we will be using
    // null rather than undefined.
    // Note: we cast from NormalizedFieldValueRepresentation to uiapi.FieldValueRepresentation deliberately: we are denorm'ing
    const nameField=normalizedSpanningRecord.fields.Name;const nameFieldDisplayValue=nameField!==undefined?nameField.displayValue:null;const nameFieldValue=nameField!==undefined?nameField.value:null;// Use the old displayValue we had if we can't find a new one to use.
    const displayValue=nameField&&nameFieldDisplayValue||nameFieldValue||field.displayValue;denormalizedRecordFields[fieldName]={displayValue,value:denormalizedSpanningRecord};}}}}// Returning the final denormalized record.
    return denormalizedRecord;}/**
         * Gets a fresh value and processes it into the cache with the cacheAccessor.
         * @param cacheAccessor An object to transactionally access the cache.
         * @param recordId The record id for the record.
         * @param optionalFields The list of optional fields for the record.
         * @param rootRecordMerge True if the cache should attempt to merge the record values instead of replacing them.
         * @param localFreshRecord Optional. A record value you want explicitly put into cache instead of getting the value from the server.
         * @param resolveRootMerge true if during merge for a root record we should accept the record even if it has fewer fields than the existing record.
         * @param filteredRecordObservableCacheKey Cache Key if this is coming from a filtered record request.
         * @returns Returns a Thenable that resolves to the string representing the outcome of the value provider.
         */_getFreshValue(cacheAccessor,recordId,optionalFields,rootRecordMerge,localFreshRecord,resolveRootMerge,filteredRecordObservableCacheKey){let transportResponseThenable;// If the record is provided, we don't go to server to fetch it.
    if(localFreshRecord){transportResponseThenable=Thenable.resolve(getOkFetchResponse(localFreshRecord));}else{if(optionalFields){optionalFields=optionalFields.slice().sort();}const params={recordId,fields:[],optionalFields};transportResponseThenable=this._makeAggregateServerCall("getRecord",params);}return transportResponseThenable.then(transportResponse=>{// Cache miss.
    // It's a cache miss and we are going normalize, mark, and merge the spanning records, then stage and commit puts for the
    // records which are merged successfully. Finally we will denorm and stage emits for affected records that haven't changed
    // but depend on changed records.
    const freshRecord=transportResponse.body;this.mergeRecordAndStagePut([],freshRecord,cacheAccessor,rootRecordMerge,resolveRootMerge,filteredRecordObservableCacheKey);// we are here, because ADS gave us records or we requested records from within LDS.
    // so if the conflict records map has an entry then delete the entry.
    this._saveableState._mergeConflictRecordsMap.delete(recordId);// Save the record service state.
    this._cacheSaveableState();const affectedKeys=cacheAccessor.commitPuts();this._ldsCache.handleAffectedKeys(affectedKeys,cacheAccessor);if(localFreshRecord){return 4/* CACHE_RECORD_FROM_ADS */;}return 2/* CACHE_MISS */;});}/**
         * Persists the saveable state to the cache.
         */_cacheSaveableState(){const recordServiceStateCacheKey=buildRecordServiceStateCacheKey();return this._ldsCache.put(recordServiceStateCacheKey,this._saveableState);}/**
         * Returns an array of objects {dependentCacheKeysArray, recordCacheKey, normalizedRecord, denormalizedRecord, isRoot} that will be
         * used to normalized and merge the record and any nested records into the cache.
         * @param denormalizedRecord A denormalized record or record we get from UI-API.
         * @param cacheAccessor The CacheAccessor in scope for this operation.
         * @param dependencies An array of zero or more cache keys that depend on the key/value being staged. These are used
         *        by the cache to track dependencies for consumers and let them know what they have affected in the return value of commitPuts().
         * @param depth This is a recursive call and this parameter is used to indicate what depth we're at so in cyclical cases we don't
         *        continue denormalizing forever. The SOQL limit is 5 levels, so this will denormalize to a depth of 5. Callers should also provide a
         *        correct value consciously in this case, so this param is required.
         * @returns Returns an array of StagePutObject {dependentCacheKeysArray, recordCacheKey, normalizedRecord, denormalizedRecord, isRoot}
         *          that will be used to normalized and merge the record and any nested records into the cache.
         */_getNormalizedRecordsWithDependencies(denormalizedRecord,cacheAccessor,dependencies,depth){{assert$1(depth>=0&&depth<=5,`Invalid depth: ${depth}`);}const normalizedRecord=cloneDeepCopy(denormalizedRecord);let stagePutObjectArray=[];const recordCacheKey=buildRecordCacheKey(normalizedRecord.id);const normalizedRecordFieldsArray=Object.keys(normalizedRecord.fields);for(let len=normalizedRecordFieldsArray.length,n=0;n<len;n++){const fieldName=normalizedRecordFieldsArray[n];const normalizedRecordFieldValue=normalizedRecord.fields[fieldName].value;// TODO: Do NOT cache spanning records that have apiName === "Name" because we have not figured out yet how to deal with record stomping scenarios in LDS.
    // Optimially the salesforce APIs will be fixed so they don't return inconsistent data.
    if(isRecordRepresentation(normalizedRecordFieldValue)&&normalizedRecordFieldValue.apiName!=="Name"){const spanningRecord=normalizedRecordFieldValue;const spanningRecordDepth=depth+1;const stagePutObject=this._getNormalizedRecordsWithDependencies(spanningRecord,cacheAccessor,[{cacheKey:recordCacheKey,type:1/* REQUIRED */}],spanningRecordDepth);stagePutObjectArray=stagePutObjectArray.concat(stagePutObject);const marker=toRecordMarker(cacheAccessor,spanningRecord,spanningRecordDepth);normalizedRecord.fields[fieldName].value=marker;}}const isRoot=depth===0;const eTag=normalizedRecord.eTag;// Delete the eTag. We don't want to store the eTag as part of the value!
    delete normalizedRecord.eTag;// Delete the eTags from the denormalizedRecord. We don't want to emit values with eTag properties!
    denormalizedRecord=this.stripETagsFromValue(denormalizedRecord);stagePutObjectArray.push({dependencies,sourceCachekey:recordCacheKey,objectToCache:normalizedRecord,objectToEmit:denormalizedRecord,root:isRoot,eTag});return stagePutObjectArray;}/**
         * Given the provided normalized records (root and spanning), this goes through all the records, merges them, and and stages puts for them.
         * @param stagePutObjects Each object in the array should look like
         *        { dependentRecordKeyArray, recordCacheKey, normalizedRecord, denormalizedRecord, isRoot }.
         * @param cacheAccessor The CacheAccessor in scope for this operation.
         * @param rootRecordMerge RecordService has an addRecord() method which is used by ADS to add records into LDS cache. When this is called from
         *        addRecords() we need to merge the ADS record with what exists in the LDS cache because LDS may be tracking more fields than ADS is giving us.
         *        For scenarios within the LDS Records Module, if we have fetched a fresh value from the server and if it's a root record, there is no need for a
         *        merge because LDS should have retrieved all necessary fields.
         * @param resolveRootMerge true if during merge for a root record we should accept the record even if it has fewer fields than the existing record.
         * @param filteredRecordObservableCacheKey Cache Key if this is coming from a filtered record request.
         * @returns The array of cache keys for the records to be cached or refreshed as a
         *          result of this operation. The array should not contain duplicate cache keys.
         */_mergeRecordsAndStagePuts(stagePutObjects,cacheAccessor,rootRecordMerge,resolveRootMerge,filteredRecordObservableCacheKey){const cacheKeysArray=[];for(let len=stagePutObjects.length,n=0;n<len;n++){const stagePutObject=stagePutObjects[n];const existingValue=cacheAccessor.get(stagePutObject.sourceCachekey);const valueWrapperOptionalProperties={eTag:stagePutObject.eTag};let valueWrapperToEmitExtraInfoObject;if(filteredRecordObservableCacheKey){valueWrapperToEmitExtraInfoObject={filteredRecordObservableCacheKey};}if(existingValue){const mergedNormalizedRecord=this._mergeRecord(existingValue.value,stagePutObject.objectToCache,rootRecordMerge,stagePutObject.root,resolveRootMerge);if(mergedNormalizedRecord){this.gatherAndTrackSpanningFields(stagePutObject.objectToEmit);const denormalizedRecord=this.denormalizeValue(mergedNormalizedRecord,cacheAccessor);if(denormalizedRecord){cacheAccessor.stagePut(stagePutObject.dependencies,stagePutObject.sourceCachekey,mergedNormalizedRecord,denormalizedRecord,valueWrapperOptionalProperties,valueWrapperToEmitExtraInfoObject);cacheKeysArray.push(stagePutObject.sourceCachekey);}}// The merge wasn't successful so a full record refresh should have been queued, however we still need to track that
    // things depend on this record, so track the dependencies.
    if(stagePutObject.dependencies&&stagePutObject.dependencies.length>0){cacheAccessor.stageDependencies(stagePutObject.dependencies,stagePutObject.sourceCachekey);}}else{this.gatherAndTrackSpanningFields(stagePutObject.objectToEmit);cacheAccessor.stagePut(stagePutObject.dependencies,stagePutObject.sourceCachekey,stagePutObject.objectToCache,stagePutObject.objectToEmit,valueWrapperOptionalProperties,valueWrapperToEmitExtraInfoObject);}cacheKeysArray.push(stagePutObject.sourceCachekey);}// Dedeuplicate the cache keys.
    const cacheKeysMap=new Map();for(let len=cacheKeysArray.length,c=0;c<len;c++){const cacheKey=cacheKeysArray[c];cacheKeysMap.set(serialize(cacheKey),cacheKey);}return Array.from(cacheKeysMap.values());}/**
         * Returns a merged and normalized record. If the merge results in a conflict, we request fresh record with all tracked fields for the record.
         * @param existingNormalizedRecord The existing record in the cache.
         * @param newNormalizedRecord The new record we want to merge into the cache.
         * @param rootRecordMerge RecordService has an addRecord() method which is used by ADS to add records into LDS cache. When this is called from
         *        addRecords() we need to merge the ADS record with what exists in the LDS cache because LDS may be tracking more fields than ADS is giving us.
         *        For scenarios within the LDS Records Module, if we have fetched a fresh value from the server and if it's a root record, there is no need for a
         *        merge because LDS should have retrieved all necessary fields.
         * @param isRoot Whether the existingRecord and newNormalizedRecord are root records (true) or nested spanning records (false).
         * @param resolveRootMerge true if during merge for a root record we should accept the record even if it has fewer fields than the existing record.
         * @returns The merged record.
         */_mergeRecord(existingNormalizedRecord,newNormalizedRecord,rootRecordMerge,isRoot,resolveRootMerge){// cannot merge record with different id
    if(existingNormalizedRecord.id!==newNormalizedRecord.id||existingNormalizedRecord.apiName!==newNormalizedRecord.apiName){throw new Error("Id or API Name cannot be different for merging records.");}const newNormalizedRecordContainsAllFieldsOfExistingNormalizedRecord=secondRecordContainsAllFieldsInFirstRecord(existingNormalizedRecord,newNormalizedRecord);// For scenarios within the LDS Records Module, if we fetched a fresh value from the server and if it's a root record:
    // If all existing fields are in newRecord there is no need to merge and so return the newNormalizedRecord
    // If all existing fields are not in newRecord but this was obtained with resolveRootMerge true, then accept the new record.
    if(!rootRecordMerge&&isRoot&&(newNormalizedRecordContainsAllFieldsOfExistingNormalizedRecord||resolveRootMerge)){return newNormalizedRecord;}const sysModstampsAreDifferent=systemModstampsAreDifferent(newNormalizedRecord,existingNormalizedRecord);if(!sysModstampsAreDifferent){// if systemModstamps are same, then we can merge the 2 records
    const mergedRecord=cloneDeepCopy(existingNormalizedRecord);deepRecordCopy(newNormalizedRecord,mergedRecord);return mergedRecord;}// systemModstamps are different
    if(newNormalizedRecordContainsAllFieldsOfExistingNormalizedRecord){// systemModstamps are different and the second record has all fields contained in the first record
    // so no need to merge. return the fresh record
    return newNormalizedRecord;}// systemModstamps are different but the second record does not have all fields contained in the first record
    // so it's a merge conflict and before we queue a fresh request, merge the records and store the mergedRecord in a map
    // which may be(scenario is when we detect that the marker has more fields listed than what we have committed in cache) utilized when we denormalize records
    // See W-5302879 for more details.
    {// tslint:disable-next-line:no-console
    console.log("LDS Cache: Record merge conflict for record: "+existingNormalizedRecord.id+" -- kicking off refresh.");}const conflictMergedRecord=cloneDeepCopy(existingNormalizedRecord);deepRecordCopy(newNormalizedRecord,conflictMergedRecord);// @ts-ignore TODO: W-5908928 - remove the ts-ignore when this (and all the other private methods) gets moved into the class as a private method.
    this._saveableState._mergeConflictRecordsMap.set(newNormalizedRecord.id,conflictMergedRecord);// queue a fresh request for the conflicted record as a root record with all the tracked fields.
    const objectApiName=newNormalizedRecord.apiName;// check and log if we are making a server call for unsupported UI API entity
    if(!isSupportedEntity(objectApiName)){instrumentError({message:`Merge conflict for Unsupported entity: ${objectApiName}`},"LDS.recordService.mergeConflict",InstrumentationErrorType.WARN);}// for unsupported UI API entities don't send xhr as it is going to fail
    // @ts-ignore
    if(this._unsupportedEntitiesSet.has(objectApiName)){return newNormalizedRecord;}if(existingNormalizedRecord.systemModstamp==null||newNormalizedRecord.systemModstamp==null){instrumentError({message:`Merge conflict due to null systemModstamp. Existing systemModstamp: ${existingNormalizedRecord.systemModstamp}, New systemModstamp: ${newNormalizedRecord.systemModstamp}, objectApiName: ${objectApiName}, recordId: ${existingNormalizedRecord.id}, differentFieldsInExistingRecord: ${JSON.stringify(Array.from(getDifferentFieldsBetweenRecords(existingNormalizedRecord,newNormalizedRecord)))}, differentFieldsInNewRecord: ${JSON.stringify(Array.from(getDifferentFieldsBetweenRecords(newNormalizedRecord,existingNormalizedRecord)))} `},"LDS.recordService.mergeConflict",InstrumentationErrorType.INFO);}else{instrumentError({message:`Merge conflict due to different systemModstamp. Existing systemModstamp: ${existingNormalizedRecord.systemModstamp}, New systemModstamp: ${newNormalizedRecord.systemModstamp}, objectApiName: ${objectApiName}, recordId: ${existingNormalizedRecord.id}`},"LDS.recordService.mergeConflict",InstrumentationErrorType.INFO);}const allFieldNamesSet=new Set();// if we reached here it means that fields are not same for records and SystemModstamp is different/not present then re-fetch it with all the fields
    const trackedRecordFields=this.getFieldsForRecord(existingNormalizedRecord.id);gatherFieldNamesFromNormalizedRecord(newNormalizedRecord,allFieldNamesSet);gatherFieldNamesFromNormalizedRecord(existingNormalizedRecord,allFieldNamesSet);this.addFieldsToTrack(existingNormalizedRecord.id,collectionToArray(allFieldNamesSet));const trackedRecordFieldsArray=collectionToArray(trackedRecordFields);const refreshRecordFields=this.getADSFieldsForRecord(existingNormalizedRecord.id);// Add in fields that ADS has requested but LDS is not interested in.
    if(refreshRecordFields){const refreshFields=collectionToArray(difference(refreshRecordFields,trackedRecordFieldsArray));for(let len=refreshFields.length,n=0;n<len;n++){trackedRecordFieldsArray.push(refreshFields[n]);}}// evict existing entry and send the request with allFields
    const cacheKey=buildRecordCacheKey(existingNormalizedRecord.id);const recordValueProviderParams={cacheKey,recordId:existingNormalizedRecord.id,optionalFields:trackedRecordFieldsArray,forceProvide:true,rootRecordMerge:false,informRecordLib:true,resolveRootMerge:true};const valueProvider=this._createRecordValueProvider(recordValueProviderParams,()=>{return false;// value provider's equal function specifically returning false so that we make a server call
    });// Make the request to get the fresh record.
    this._privateGetRecordWithFields(existingNormalizedRecord.id,[],trackedRecordFieldsArray,valueProvider,false,true);}/**
         * Constructs an Observable that will emit a record with only those fields given by the requiredFields and optionalFields parameters.
         * If a required field is missing during an emit attempt, an error will be emitted. If an optional field is missing then it will be ignored.
         * @param filteredRecordCacheKey The filtered record key identifying the filtered observable.
         * @param observableToFilter The observable that emits a record object that we want to filter down the fields on.
         * @param requiredFields The list of required fields to remain in the record.
         * @param optionalFields The list of optional fields to remain in the record.
         * @param requestOnlyHasTrackedFields check if the request has tracked fields only
         * @param emitLastValue True to ignore the stored lastValue emitted during observableConstruction, if there is one.
         *        Generally, you'd want to skip this because the value is stale
         * @returns An observable the emits a record with a filtered fields list.
         */_constructFilteredObservable(filteredRecordCacheKey,observableToFilter,requiredFields,optionalFields,requestOnlyHasTrackedFields,emitLastValue){let filteredObservable=observableToFilter;// root observable
    // If this request has previously untracked fields then we need to wait for the refresh to come back before allowing
    // emits through. This is necessary because we don't want the field filter to throw an error until it is
    // acting on the fresh value that contains the new fields.
    if(!requestOnlyHasTrackedFields){// If there's a lastValue, but the request includes untracked fields, we know it won't satisfy our expectations
    if(!emitLastValue&&filteredObservable.lastValue){filteredObservable=filteredObservable.skipOnce();}filteredObservable=filteredObservable.skipIf(valueWrapper=>{const record=valueWrapper.value;const recordId=record.id;let emittedRecordMissingRequiredField=false;for(let len=requiredFields.length,i=0;i<len;i++){if(getFieldValue(record,requiredFields[i])===undefined){emittedRecordMissingRequiredField=true;break;}}const emitCacheKey=valueWrapper.extraInfoObject&&valueWrapper.extraInfoObject.filteredRecordObservableCacheKey;// The emit satisfies, so let it through.
    if(!emittedRecordMissingRequiredField){return false;}else{// The record still has active refreshes, so continue to skip.
    // Note: we may be able to remove this now, but leaving it in to verify initial fix.
    if(this._recordIdsToIsRefreshingMap.has(recordId)){return true;}else{// If the emit is from the actual wire adapter that made the call, let it through to error. This would happen if the
    // requireField requested was invalid, or inaccesible.
    if(emitCacheKey&&emitCacheKey.key===filteredRecordCacheKey.key){return false;}else{// Otherwise, we got an emit from another adapter's request so continue to skip.
    return true;}}}});}filteredObservable=filteredObservable.map(valueWrapper=>{const value=valueWrapper.value;// Transform the record into a record that only contains the fields requested.
    const fullFieldsList=getFullFieldsListForFilteredObservable(value,requiredFields,optionalFields);const newFilteredRecord=createFilteredRecordFromRecord(value,fullFieldsList);return cloneWithValueOverride(valueWrapper,newFilteredRecord);}).distinctUntilChanged((previousValue,newValue)=>{if(previousValue===undefined){return false;}// Only allow new values to be emitted.
    return equivalent(previousValue.value,newValue.value);}).mapWithFilterOnSubscribeBehaviorSubject(value=>{let shouldEmit=false;if(this._ldsCache.timeSource.now()<value.lastFetchTime+this.getCacheValueTtl()){shouldEmit=true;}else{// TTL expired
    lastValueTracker.add(value);}return shouldEmit;},valueWrapper=>{return lwc.readonly(valueWrapper.value);});// Subscribe to the new filtered observable so that when it completes (or errors) we know to remove the filtered observable from the map.
    const errorCompleteSubscription=filteredObservable.subscribe(new Observer(()=>{return;},()=>{this._filteredObservables.delete(serialize(filteredRecordCacheKey));}),()=>{this._filteredObservables.delete(serialize(filteredRecordCacheKey));});// Decorate the subscribe method to return a Subscription instance with a decorated unsubscribe method which will dispose the filtered observable if
    // the subscriptions count drops below 1. (Not 0 because of the above subscription which will always be there but doesn't signify that
    // there is someone interested in this filtered observable externally.
    const recordServiceFilteredObservables=this._filteredObservables;const originalSubscribeFn=filteredObservable.subscribe;filteredObservable.subscribe=(observer,...args)=>{const originalSubscription=originalSubscribeFn.call(filteredObservable,observer,...args);if(originalSubscription){const originalSubscriptionUnsubscribeFn=originalSubscription.unsubscribe;originalSubscription.unsubscribe=()=>{originalSubscriptionUnsubscribeFn.call(originalSubscription);if(filteredObservable.subscriptions.size<=1){if(errorCompleteSubscription&&!errorCompleteSubscription.closed){errorCompleteSubscription.unsubscribe();}recordServiceFilteredObservables.delete(serialize(filteredRecordCacheKey));}};}return originalSubscription;};return filteredObservable;}/**
         * Executes the global aura controller request. Tracks active requests by record id.
         * @param recordId The record id pertaining to the request.
         * @param controllerName The name of the global controller to execute.
         * @param parameters An object map containing the parameters of the request.
         * @returns TransportResponse from the server
         */async _makeServerCall(recordId,controllerName,parameters){if(recordId){addRecordToRefreshList(this._recordIdsToIsRefreshingMap,recordId);}const result=await executeAuraGlobalController(controllerName,parameters);if(recordId){removeRecordFromRefreshList(this._recordIdsToIsRefreshingMap,recordId);}return result;}/**
         * Executes the aggregate-ui server request. Tracks active requests by record id.
         * @param wireName The name of the wire adapter.
         * @param parameters Object containing parameters of the ui-api request.
         * @returns TransportResponse from the server
         */async _makeAggregateServerCall(wireName,parameters){const recordId=parameters.recordId;const result=await aggregateUiExecutor.executeSingleRequestOverAggregateUi(wireName,parameters,RECORD_TTL);// Originally, this call was happening at the beginning of _privateGetRecordWithFields:
    // However, parallel requests can cause the following issue if the getRecord requests/xhrs happen as follows:
    // 1. Wire Adapter 1: getRecord("Id") - trackedFields: [Id]
    // 2. XHR for 1 goes out
    // 3. Wire Adapter 2: getRecord("Id", "Name") - trackedFields: [Id, Name]
    // 4. XHR for 2 goes out
    // 5. Wire Adapter 3: getRecord("Name") - trackedFields: [Id, Name]
    // 6. XHR for 1 comes back with only "Id" field and emits to root observable, which causes error
    // because at Step 5 "Name" was in tracked fields already, the filtered observable was called with requestOnlyHasTrackedFields = true
    // which skipped the previously added skipIf logic (which skips root emits if there are outstanding requests or the emit does not satisfy required fields).
    this.addFieldsToTrack(recordId,parameters.optionalFields);// Make sure we're tracking all requested fields.
    removeRecordFromRefreshList(this._recordIdsToIsRefreshingMap,recordId);return result;}get _saveableState(){if(!this._saveableStateData){// Load it from the cache.
    const valueFromCache=this._ldsCache.getValue(buildRecordServiceStateCacheKey());if(valueFromCache){this._saveableStateData=valueFromCache;}else{// Nothing in the cache, create a new state.
    this._saveableStateData={_recordIdsToFieldsRequestedMap:new Map(),_mergeConflictRecordsMap:new Map()};}}return this._saveableStateData;}}/**
     * The value type for the record service state.
     */const RECORD_SERVICE_STATE_VALUE_TYPE="lds.recordServiceState";/**
     * Builds the cache key for the record service state.
     * @param ldsCacheName The name of the LDS cache used to scope related dependencies.
     * @returns A new cache key representing the LDS_CACHE_DEPENDENCIES_VALUE_TYPE value type.
     */function buildRecordServiceStateCacheKey(){return {type:RECORD_SERVICE_STATE_VALUE_TYPE,key:`record-service-state`};}/**
     * Wire adapter id: getRecord.
     * @throws Error Always throws when invoked. Imperative invocation is not supported.
     * @returns void
     */function getRecord(){throw generateError("getRecord");}/*
     * Singleton class which contains the wire adapter ids and wire adapter functions for servicing
     * @wires in the lds-records module. Handles registering the wire adapters with the wire service.
     */class RecordWireAdapterGenerator{/**
         * Constructor.
         * @param recordService Reference to the RecordService instance.
         */constructor(recordService){this._recordService=recordService;}/*
         * Generates the wire adapter for getRecord.
         * @returns WireAdapter - See description.
         */generateGetRecordWireAdapter(){const wireAdapter=generateWireAdapter(this.serviceGetRecord.bind(this));return wireAdapter;}/**
         * @private
         * Service getRecord @wire.
         * @param config Config params for the service.
         * @param metaConfig WireRefreshMetaConfig to refresh the cache from System of Records (SOR)
         * @return Observable stream that emits a record object.
         */serviceGetRecord(config,metaConfig){if(!config){return undefined;}{// validate schema
    const required=["recordId"];const oneof=["fields","optionalFields","layoutTypes"];const supported=["fields","layoutTypes","modes","optionalFields","recordId"];const unsupported=["childRelationships","pageSize"];// TODO W-4421501, W-4045854
    validateConfig("getRecord",config,required,supported,unsupported,oneof);}if(typeof config.recordId!=="string"||config.recordId.trim().length===0){return undefined;}const recordId=to18(config.recordId);// toArray() + isArrayOfNonEmptyStrings() provides a runtime guarantee that a value is a
    // string[] with length > 0.
    const fields=toArray(config.fields).map(getFieldApiName$1);if(fields.length!==0&&!isArrayOfNonEmptyStrings(fields)){return undefined;}const optionalFields=toArray(config.optionalFields).map(getFieldApiName$1);if(optionalFields.length!==0&&!isArrayOfNonEmptyStrings(optionalFields)){return undefined;}const layoutTypes=toArray(config.layoutTypes);if(layoutTypes.length!==0&&!isArrayOfNonEmptyStrings(layoutTypes)){return undefined;}// one of the following must be present
    if(layoutTypes.length===0&&fields.length===0&&optionalFields.length===0){return undefined;}// if a layout-based load
    if(layoutTypes.length>0){const modes=toArray(config.modes);if(modes.length!==0&&!isArrayOfNonEmptyStrings(modes)){return undefined;}// default value is View
    if(modes.length===0){modes.push("View");}if(metaConfig){return this._recordService.getRecordWithLayoutsWithMetaConfig(recordId,layoutTypes,modes,optionalFields,metaConfig);}return this._recordService.getRecordWithLayouts(recordId,layoutTypes,modes,optionalFields);}if(metaConfig){return this._recordService.getRecordWithFieldsWithMetaConfig(recordId,fields,optionalFields,metaConfig);}return this._recordService.getRecordWithFields(recordId,fields,optionalFields);}}/**
     * Do not use this unless calling from force:recordLibrary. This is a special API only for force:recordLibrary.
     */class AdsBridge{/**
         * Getter for receiveFromLdsCallback.
         * This function is a hook back to recordLibrary to let it know when lds-records retrieves records on its own
         * or from the Raptor side of things. When necessary we use this to keep recordLibrary up to date with records
         * we know about and records/fields it may not have.
         */get receiveFromLdsCallback(){return this._receiveFromLdsCallback;}/**
         * Setter for receiveFromLdsCallback.
         * Can be called from non-typed context!
         */set receiveFromLdsCallback(value){if(value!==undefined&&value!==null){checkType(value,Function);}this._receiveFromLdsCallback=value;}/**
         * Getter for retrieving the base record data from the ADS cache only (no XHR).
         * This function is a hook into force:recordLibrary to allow the getRecordLayoutTemplate service to get the base record
         * data of the given recordId.
         */get getBaseRecordDataFromCacheCallback(){return this._getBaseRecordDataFromCacheCallback;}/**
         * Setter for the getBaseRecordDataFromCacheCallback.
         */set getBaseRecordDataFromCacheCallback(value){this._getBaseRecordDataFromCacheCallback=value;}/**
         * Constructor.
         * @param ldsCache Reference to the LdsCache instance.
         */constructor(ldsCache){if(Object.getPrototypeOf(this).constructor!==AdsBridge){throw new TypeError("AdsBridge is final and cannot be extended.");}this._ldsCache=ldsCache;}/**
         * Can be called from non-typed context!
         * Do not use this unless calling from force:recordLibrary. This is a special API only for force:recordLibrary.
         * This will:
         * - remove the record from the LdsCache
         * - if eviction is due to a record being unable to be accessed and there is an error message, it should be propagated to observable.error().
         * Questions:
         * - Q: What should we do if there is no existing value or observable? A: Returning null is fine.
         * - Q: Should we be passing next(null) to Observers? What if there are existing Observers out there? Null is a weird contract. A: not doing next(null) is fine.
         * - Q: In order to evict() should you have to provide a non-null replacement value? A: No.
         * - Q: Is the error param a String or an Error? A: it's a string.
         * - Q: Do you need evict() to return anything, like the Observable? A: No.
         * @param recordId The 18 char record ID.
         * @returns A Thenable which will be resolved once the evict is completed.
         */evict(recordId){{assert$1(typeof recordId==="string","recordId must be a string");}// Must ensure ldsCache is ready for access before doing operation.
    return this._ldsCache.access().then(()=>{const cacheKey=buildRecordCacheKey(recordId);return this._ldsCache.deleteValueAndDeleteObservable(cacheKey);});}/**
         * Can be called from non-typed context!
         * Tells you all of the required and optional fields that lds-records is tracking for a given record.
         * @param recordId The 18 char record ID.
         * @returns A Thenable which resolves to an array of qualified field names that lds-records is tracking for a given record.
         *      Will be empty if there are no fields being tracked.
         */getTrackedFieldsForRecord(recordId){{assert$1(typeof recordId==="string","recordId must be a string");}// Must ensure ldsCache is ready for access before doing operation.
    return this._ldsCache.access().then(()=>{const trackedRecordFieldsSet=this._recordService.getFieldsForRecord(recordId);const trackedRecordFields=collectionToArray(trackedRecordFieldsSet);return trackedRecordFields;});}/**
         * Can be called from non-typed context!
         * Do not use this unless calling from force:recordLibrary. This is a special API only for force:recordLibrary.
         * Sticks the value in the TIC and then returns the root (unfiltered) Observable. Adds the fields on the record to the map of required fields in use.
         *
         * This will need to handle merge/replace logic, based on last modified time of the record. (If the times are the same, merge. If the times are different, replace.).
         *
         * TODO: the current merge logic does a straight up merge and does not take SystemModstamp into account yet.
         *
         * Questions:
         * - What should we do we do here if the record we are replacing has more fields than this record? We'd like to to queue a subsequent update, but for view entities
         * will not always have fields that can be easily replaced (they don't exist on the default entity type that the ID will match). Examples are cases where records are
         * allowed to be pushed into RecordGvp and used in conjunction with force:recordCollection. A: If we go with merge, SystemModstamp is preferred, otherwise LastModifiedDate.
         * Other options may include not merging and tracking fields/recordReps by objectApiName. TODO.
         * @param newRecords The records to be added to the LdsCache.
         * @param uiapiEntityWhitelist Whitelist of uiapi entities as key and string value of false to indicate it is unsupported. TODO: Refactor this into a blacklist of boolean!
         * @returns The list of results containing recordId and corresponding the root (unfiltered) Observables.
         */addRecords(newRecords,uiapiEntityWhitelist){{assert$1(newRecords,"newRecords must be provided");assert$1(typeUtils.isArray(newRecords),"newRecords must be an array");}// Process the record if LDS has an observable with something listening to it
    // Otherwise note the fields ADS is tracking for the record.
    const recordsWithObservers=new Map();const recordsWithNoObservers=new Map();for(let newRecordsLen=newRecords.length,n=0;n<newRecordsLen;n++){const newRecord=newRecords[n];const normalizedRecord=this.getRecordValueFromCache(newRecord.id);if(normalizedRecord===undefined){// we dont have a value for root record in the cache.
    // parent record is not subscribed check if the spanning records are subscribed
    recordsWithNoObservers.set(newRecord.id,newRecord);const spanningRecords=getSpanningRecords(newRecord);if(spanningRecords){spanningRecords.forEach(spanningRecord=>{const normalizedSpanningRecord=this.getRecordValueFromCache(spanningRecord.id);if(normalizedSpanningRecord!==undefined){// record existing in the cache
    const exitingSpanningRecord=recordsWithObservers.get(spanningRecord.id);// TODO : Before adding into the Map, check for duplicates and merge the fields
    if(!exitingSpanningRecord||!areFieldsEqualForRecords(exitingSpanningRecord,spanningRecord)){recordsWithObservers.set(spanningRecord.id,spanningRecord);}else{recordsWithNoObservers.set(spanningRecord.id,spanningRecord);}}else{recordsWithNoObservers.set(spanningRecord.id,spanningRecord);}});}}else{// Parent is subscribed, don't look at the spanning records since we update them as part of parent caching
    recordsWithObservers.set(newRecord.id,newRecord);}}const addRecordResults=[];recordsWithObservers.forEach((recordWithObserver,recordId)=>{const objectApiName=recordWithObserver.apiName;const allFieldNamesSet=new Set();recursivelyGatherFieldNames(objectApiName,recordWithObserver,allFieldNamesSet);const trackedRecordFields=this._recordService.getFieldsForRecord(recordId);const combinedFields=addAll(new Set(allFieldNamesSet),trackedRecordFields);// TODO: Why is this a string value for a boolean? Fix it!
    if(uiapiEntityWhitelist&&uiapiEntityWhitelist[objectApiName]==="false"){this._recordService.addUnsupportedEntity(objectApiName);}const cacheKey=buildRecordCacheKey(recordId);const forceProvide=true;const rootRecordMerge=true;// This is coming from ADS so LDS will not necessarily be getting all the fields it needs, therefore merging is the best option.
    const informRecordLib=false;// addRecord() (this method) is only called from recordLibrary, so it doesn't need to inform itself.
    const resolveRootMerge=false;// resolveRootMerge is passed true when we detect a merge conflict, since this record is being provided to us from ADS, resolveRootMerge = false.
    const recordValueProviderParams={cacheKey,recordId,optionalFields:collectionToArray(combinedFields),forceProvide,localFreshRecord:recordWithObserver,rootRecordMerge,informRecordLib,resolveRootMerge};// TODO: Remove the private method usage once we have serviceToValueType working
    const valueProvider=this._recordService._createRecordValueProvider(recordValueProviderParams);addRecordResults.push({recordId,rootObservable:this._recordService._privateGetRecordWithFields(recordId,[],collectionToArray(combinedFields),valueProvider,false,false,undefined,true,true)});});// Although LDS is not interested in these records currently and is discarding this notification,
    // keep track of the fields ADS is tracking for these records so that we include these in the future when LDS load these records.
    recordsWithNoObservers.forEach(recordWithNoObserver=>{const recordId=recordWithNoObserver.id;const objectApiName=recordWithNoObserver.apiName;const allFieldNamesSet=new Set();recursivelyGatherFieldNames(objectApiName,recordWithNoObserver,allFieldNamesSet);addAll(this._recordService.setADSFieldsForRecord(recordId),allFieldNamesSet);});return addRecordResults;}/**
         * Can be called from non-typed context!
         * Do not use this unless calling from raptor wire sevices.
         *
         * Sticks the value in LDS and then returns the root (unfiltered) Observable.
         * @param recordUi The record to add.
         * @returns The root (unfiltered) Observable.
         */addRecordUi(recordUi){{assert$1(recordUi,"recordUi must be provided");}const cacheKey=buildCacheKeyFromRecordUi(recordUi);const rootRecordMerge=true;return this._recordUiService.cacheRecordUi(cacheKey,recordUi,rootRecordMerge);}/**
         * Tells ADS about a record that LDS has retrieved.
         * @param record The record retrieved by LDS and informed to ADS.
         * @param objectInfo The object info associated with the record, if available.
         */informRecordLib(record,objectInfo){const recordId=record.id;const apiName=record.apiName;if(this._receiveFromLdsCallback){if(recordId&&apiName){const nameFields=objectInfo&&Array.isArray(objectInfo.nameFields)?objectInfo.nameFields:[];let nameField="Name";if(nameFields.length>0&&!nameFields.includes("Name")){nameField=nameFields[0];// Default to whatever.
    }const objectMetadata={};objectMetadata[apiName]={_keyPrefix:objectInfo?objectInfo.keyPrefix:recordId.substring(0,3),_nameField:nameField,_entityLabel:objectInfo?objectInfo.label:apiName,_canUseLapi:"true"};// ADS expects records.recordId.apiName.record structure. See W-4147555.
    const records={};records[recordId]={};records[recordId][apiName]={isPrimary:true,record:getValueForAura(record)};// We retrieved a new record from the server. Let recordLib know about it.
    this._receiveFromLdsCallback(records,objectMetadata);}else{{// This doesn't look like a record and it's not a cache hit - why are we getting it?
    assert$1(false,`This object should be a record, but it is not: ${record}`);}}}}/**
         * Returns the normalized record data from the cache using cacheKey
         * @param recordId
         * @returns Thenable containing Normalized record
         */getRecordValueFromCache(recordId){const cacheKey=buildRecordCacheKey(recordId);return this._ldsCache.getValue(cacheKey);}/**
         * Reference to the RecordService instance.
         */get _recordService(){return this._ldsCache.getService(RECORD_VALUE_TYPE);}/**
         * Reference to the RecordUiService instance.
         */get _recordUiService(){return this._ldsCache.getService(RECORD_UI_VALUE_TYPE);}}/**
     * The type to use when building ApexCacheKey.
     */const APEX_VALUE_TYPE="lds.Apex";/**
     * Time to live for the Apex cache value. 5 minutes.
     */const APEX_TTL=5*60*1000;/**
     * Constructs a cache key for the Apex value type.
     * @param namespace The name space.
     * @param classname The class name.
     * @param functionName The function name.
     * @param isContinuation Indicates whether the Apex method returns a continuation.
     * @param params The params.
     * @returns A new cache key representing the Apex value type.
     */function buildCacheKey$5(namespace,classname,functionName,isContinuation,params){return {type:APEX_VALUE_TYPE,key:`${namespace}${KEY_DELIM}${classname}${KEY_DELIM}${functionName}${KEY_DELIM}${isContinuation}${KEY_DELIM}${params?stableJSONStringify(params):""}`};}/**
     * Gets a field value from an Apex sObject.
     * @param sobject The sObject holding the field.
     * @param field The qualified API name of the field to return.
     * @returns The field's value. If it doesn't exist, undefined is returned.
     */function getSObjectValue(sObject,field){const unqualifiedField=splitQualifiedFieldApiName(getFieldApiName(field))[1];const fields=unqualifiedField.split(".");while(fields.length>0){const nextField=fields.shift();// if field or path to field is not found then return undefined
    if(!(nextField in sObject)){return undefined;}sObject=sObject[nextField];}return sObject;}/**
     * Provides functionality to read apex action data from the cache. Can refresh the data from the server.
     */class ApexService extends LdsServiceBase{/**
         * Constructor.
         * @param ldsCache Reference to the LdsCache instance.
         */constructor(ldsCache){super(ldsCache,[APEX_VALUE_TYPE]);}getCacheValueTtl(){return APEX_TTL;}/**
         * Checks the cache to see if a value is cached and is within TTL and if so returns the value cached.
         * If the value is not cached or TTL-ed, makes a call to the ApexActionController to fetch the apex controller value.
         *  - If the apex controller value is cacheable, caches the value and returns the value.
         *  - If the apex controller value is not cacheable, then returns the value.
         * @param namespace The namespace of the Apex controller.
         * @param classname The class name of the Apex controller.
         * @param method The method of the Apex controller.
         * @param isContinuation Indicates whether the Apex method returns a continuation.
         * @param params The parameters to pass into the apex action controller.
         * @returns See description.
         */runApex(namespace,classname,method,isContinuation,params){const cacheKey=buildCacheKey$5(namespace,classname,method,isContinuation,params);return this._ldsCache.access().then(()=>{const apexValueWrapper=this._ldsCache.getValue(cacheKey);if(apexValueWrapper!==undefined&&isWithinTtl(this._ldsCache.timeSource.now(),apexValueWrapper.lastFetchTime,APEX_TTL)){// value exists in cache is not TTL-ed, so return the value.
    return apexValueWrapper.value;}// value either does not exist in cache or is TTL-ed
    // fetch fresh value from server
    return executeAuraGlobalController("ApexActionController.execute",{namespace,classname,method,isContinuation,params,cacheable:false},{background:false,hotspot:false,longRunning:isContinuation}).then(transportResponse=>{const localFreshApex=transportResponse.body;if(localFreshApex.cacheable){// if apex method is cacheable, then call the value provider which will cache the response and convert the observable to a promise and returns the promise.
    // At this point we know that the value does not exist in cache or is TTL-ed so we can bypass the additional cache get.
    const valueProviderParameters={cacheKey,namespace,classname,method,isContinuation,params,metaConfig:{forceProvide:true},localFreshApex};// create a value provider and call ldsCache.get to cache the local value.
    return observableToPromise(this._ldsCache.get(cacheKey,this._createApexValueProvider(valueProviderParameters)),true);}else{// if the apex method is not cacheable, then return the response without caching it.
    return localFreshApex.returnValue;}});});}/**
         * Retrieves an apex controller value from the cache. If it doesn't exist in the cache it will retrieve it from the server and put it into the cache.
         * @param namespace The namespace of the Apex controller.
         * @param classname The class name of the Apex controller.
         * @param method The method of the Apex controller.
         * @param isContinuation Whether this Apex method returns a continuation object.
         * @param params The parameters to pass into the Apex controller.
         * @param metaConfig Optional configuration object.
         */getApex(namespace,classname,method,isContinuation,params,metaConfig){const cacheKey=buildCacheKey$5(namespace,classname,method,isContinuation,params);const valueProviderParameters={cacheKey,namespace,classname,method,isContinuation,params,metaConfig};const finishedCallbacks=metaConfig&&metaConfig.finishedCallbacks;return this._ldsCache.get(cacheKey,this._createApexValueProvider(valueProviderParameters),finishedCallbacks);}/**
         * Constructs a value provider to retrieve an apex action.
         * @param valueProviderParameters The parameters for the value provider as an object.
         * @returns The value provider to retrieve an Apex controller value.
         */_createApexValueProvider(valueProviderParameters){const{cacheKey,namespace,classname,method,isContinuation,params,metaConfig,localFreshApex}=valueProviderParameters;const valueProvider=new ValueProvider(cacheAccessor=>{if(metaConfig&&metaConfig.forceProvide){return this._getFreshValue(cacheAccessor,cacheKey,namespace,classname,method,isContinuation,params,localFreshApex);}const existingValueWrapper=cacheAccessor.get(cacheKey);if(existingValueWrapper&&existingValueWrapper.value!==undefined){const nowTime=cacheAccessor.nowTime;const lastFetchTime=existingValueWrapper.lastFetchTime;// check for ttl expiry
    const needsRefresh=nowTime>lastFetchTime+APEX_TTL;if(needsRefresh){// Trigger a refresh. We don't care about the return value of this, we just need to force an API call
    // to keep the Observable's data stream alive.
    return this._getFreshValue(cacheAccessor,cacheKey,namespace,classname,method,isContinuation,params,localFreshApex);}return Thenable.resolve(1/* CACHE_HIT */);}return this._getFreshValue(cacheAccessor,cacheKey,namespace,classname,method,isContinuation,params,localFreshApex);},valueProviderParameters);return valueProvider;}/**
         * Gets a fresh value and processes it into the cache with the cacheAccessor.
         * @param cacheAccessor An object to transactionally access the cache.
         * @param cacheKey The cache key for the apex action.
         * @param namespace The namespace of the Apex controller.
         * @param classname The class name of the Apex controller.
         * @param method The method of the Apex controller.
         * @param isContinuation Whether the Apex method returns a continuation object.
         * @param params The parameters to pass into the apex action controller.
         * @param localFreshApex An apex value to explicitly put into cache.
         * @returns Returns a ValueProviderResult representing the outcome of the value provider.
         */_getFreshValue(cacheAccessor,cacheKey,namespace,classname,method,isContinuation,params,localFreshApex){let transportResponseThenable;// If the apex value is provided, we don't go to server to fetch it.
    if(localFreshApex){transportResponseThenable=Thenable.resolve(getOkFetchResponse(localFreshApex));}else{transportResponseThenable=executeAuraGlobalController("ApexActionController.execute",{namespace,classname,method,isContinuation,params,cacheable:true},{hotspot:false,background:false,longRunning:isContinuation});}return transportResponseThenable.then(transportResponse=>{const apexCacheValue=transportResponse.body;// nothing to normalize
    this.stagePutValue([],apexCacheValue.returnValue,cacheAccessor,cacheKey);const affectedKeys=cacheAccessor.commitPuts();this._ldsCache.handleAffectedKeys(affectedKeys,cacheAccessor);return Thenable.resolve(2/* CACHE_MISS */);});}/**
         * @param dependencies An array of cache keys that depend on the given apex value.
         * @param value The value to stagePut.
         * @param cacheAccessor An object to access cache directly.
         */stagePutValue(dependencies,value,cacheAccessor,additionalData){cacheAccessor.stagePut(dependencies,additionalData,value,value);}/**
         * TODO: Make this actually strip out the eTags!
         * Strips all eTag properties from the given value by directly deleting them.
         * @param value The value from which to strip the eTags.
         * @returns The given value with its eTags stripped.
         */stripETagsFromValue(value){return value;}}/**
     * Generates the wire adapter for Apex.
     */class ApexWireAdapterGenerator{/**
         * Constructor.
         * @param apexService Reference to the ApexService instance.
         */constructor(apexService){this._apexService=apexService;}/**
         * Generates the wire adapter for getApex.
         * @param namespace namespace of the Apex controller.
         * @param classname classname of the Apex controller.
         * @param method method name of the Apex controller.
         * @param isContinuation Indicates whether the Apex method returns a continuation object.
         * @returns See description.
         */generateGetApexWireAdapter(namespace,classname,method,isContinuation){const wireAdapter=generateWireAdapter((config,metaConfig)=>{return this._serviceGetApex(namespace,classname,method,isContinuation,config,metaConfig);});return wireAdapter;}/**
         * Returns the method which invokes the Apex GlobalController with the config passed
         * @param namespace namespace of the Apex controller.
         * @param classname classname of the Apex controller.
         * @param method method name of the Apex controller.
         * @param isContinuation indicates whether the Apex method returns a continuation object.
         */getApexInvoker(namespace,classname,method,isContinuation){return config=>{return this._apexService.runApex(namespace,classname,method,isContinuation,config);};}/**
         * Service getApex @wire.
         * @param namespace namespace of the Apex controller.
         * @param classname classname of the Apex controller.
         * @param method method name of the Apex controller.
         * @param isContinuation Indicates whether the Apex method returns a continuation object.
         * @param config Config params for the service.
         * @param metaConfig Additional configuration to specify cache behavior.
         * @returns Observable stream that emits Apex controller values.
         */_serviceGetApex(namespace,classname,method,isContinuation,config,metaConfig){if(!this._validateApexConfig(config)){return undefined;}return this._apexService.getApex(namespace,classname,method,isContinuation,config,metaConfig);}/**
         *  Validates the apex request configuration passed in from @wire.
         *  @param config The configuration object passed from @wire.
         *  @returns True if config is null/undefined or false if it does not contain undefined values.
         */_validateApexConfig(config){if(config){const values=Object.values(config);if(values&&values.indexOf(undefined)!==-1){return false;}}return true;}}/**
     * The valueType to use when building FormCacheKey.
     */const FORM_VALUE_TYPE="uiapi.FormRepresentation";/**
     * Time to live for a form cache value. 30 days.
     */const FORM_TTL=2592000000;/**
     * Constructs a cache key for the Form value type.
     * @param apiName The api name of the form.
     * @returns A new cache key representing the Form value type.
     */function buildCacheKey$6(apiName){{assert$1(apiName,"A non-empty apiName must be provided.");}return {type:FORM_VALUE_TYPE,key:`${apiName}`};}/*
     * Provides functionality to read form data from the cache. Can refresh the data from the server.
     */class FormService extends LdsServiceBase{/**
         * Constructor.
         * @param ldsCache Reference to the LdsCache instance.
         */constructor(ldsCache){super(ldsCache,[FORM_VALUE_TYPE]);}getCacheValueTtl(){return FORM_TTL;}/**
         * Retrieves a form from the cache. If it doesn't exist in the cache it will retrieve it from the server and put it into the cache.
         * @param apiName The object api name of the layout to retrieve.
         * @returns The observable used to get the value and keep watch on it for changes.
         */getForm(apiName){const cacheKey=buildCacheKey$6(apiName);const valueProviderParameters={cacheKey,apiName,forceProvide:false};const valueProvider=this._createFormValueProvider(valueProviderParameters);return this._ldsCache.get(cacheKey,valueProvider);}/**
         * Stage puts the given form.
         * @param dependencies An array of cache keys that depend on the given formUi.
         * @param form The form to cache.
         * @param cacheAccessor An object to access cache directly.
         * @returns A Thenable that resolves when the stagePut has completed.
         */stagePutValue(dependencies,form,cacheAccessor){const formCacheKey=buildCacheKey$6(form.apiName);const existingValueWrapper=cacheAccessor.get(formCacheKey);const eTag=form.eTag;if(existingValueWrapper&&existingValueWrapper.eTag===eTag){cacheAccessor.stageDependencies(dependencies,formCacheKey);cacheAccessor.stagePutUpdateLastFetchTime(formCacheKey);return;}// Strip out the eTag from the value. We don't want to emit eTags!
    form=this.stripETagsFromValue(form);cacheAccessor.stagePut(dependencies,formCacheKey,form,form,{eTag});}/**
         * Strips all eTag properties from the given form by directly deleting them.
         * @param form The form from which to strip the eTags.
         * @returns The given form object with its eTags stripped.
         */stripETagsFromValue(form){delete form.eTag;return form;}/**
         * Constructs a value provider to retrieve a Form.
         * @param valueProviderParameters The parameters for the value provider as an object.
         * @returns The value provider to retrieve a form.
         */_createFormValueProvider(valueProviderParameters){const{// Do NOT set defaults here. See W-4840393.
    cacheKey,apiName,forceProvide}=valueProviderParameters;const formValueProvider=new ValueProvider(cacheAccessor=>{if(forceProvide){return this._getFreshValue(cacheAccessor,cacheKey,apiName);}const existingValueWrapper=cacheAccessor.get(cacheKey);if(existingValueWrapper&&existingValueWrapper.value!==undefined){const nowTime=cacheAccessor.nowTime;const lastFetchTime=existingValueWrapper.lastFetchTime;const needsRefresh=nowTime>lastFetchTime+FORM_TTL;if(needsRefresh){// Value is stale; get a fresh value.
    return this._getFreshValue(cacheAccessor,cacheKey,apiName,existingValueWrapper.eTag);}// The value is not stale so it's a cache hit.
    return Thenable.resolve(1/* CACHE_HIT */);}// No existing value; get a fresh value.
    return this._getFreshValue(cacheAccessor,cacheKey,apiName);},valueProviderParameters);return formValueProvider;}hasValidCachedValue(cacheAccessor,params){const cacheKey=buildCacheKey$6(params.apiName);const existingValueWrapper=cacheAccessor.get(cacheKey);return !!existingValueWrapper&&existingValueWrapper.value!==undefined&&cacheAccessor.nowTime<=existingValueWrapper.lastFetchTime+FORM_TTL;}/**
         * Gets a fresh value and processes it into the cache with the cacheAccessor.
         * @param cacheAccessor An object to transactionally access the cache.
         * @param cacheKey The cache key for the form.
         * @param apiName The form api name of the form to retrieve.
         * @param eTagToCheck eTag to send to the server to determine if we already have the latest value. If we do the server will return a 304.
         * @returns Returns a ValueProviderResult representing the outcome of the value provider.
         */_getFreshValue(cacheAccessor,cacheKey,apiName,eTagToCheck){// If the form is provided, we don't go to server to fetch it.
    const params={apiName};let transportResponseThenable;if(eTagToCheck){params.clientOptions={eTagToCheck};}{transportResponseThenable=aggregateUiExecutor.executeSingleRequestOverAggregateUi("getForm",params,FORM_TTL);}return transportResponseThenable.then(transportResponse=>{// Cache miss refresh unchanged.
    if(transportResponse.status===304){return 3/* CACHE_MISS_REFRESH_UNCHANGED */;}// Cache miss.
    const freshForm=transportResponse.body;cacheAccessor.stageClearDependencies(cacheKey);// Nothing should depend on this yet; included for completeness.
    this.stagePutValue([],freshForm,cacheAccessor);const affectedKeys=cacheAccessor.commitPuts();this._ldsCache.handleAffectedKeys(affectedKeys,cacheAccessor);return 2/* CACHE_MISS */;});}}/**
     * The type to use when building FormUiCacheKey.
     */const FORM_UI_VALUE_TYPE="uiapi.FormSectionUiRepresentation";/**
     * The valueType to use when building FormSectionUiObservableCacheKey.
     */const FORM_SECTION_UI_OBSERVABLE_VALUE_TYPE="lds.FormSectionUiObservable";/**
     * Time to live for FormUi object. 15 minutes.
     */const FORM_UI_TTL=15*60*1000;/**
     * Builds the key for the form section ui observable.
     * @param recordId The record id.
     * @param formName The form name for the cache key.
     * @param sectionName The section name for the cache key.
     * @returns A new cache key representing the FORM_SECTION_UI_OBSERVABLE_VALUE_TYPE value type.
     */function buildFormSectionUiObservableKey(recordId,formName,sectionName){{assert$1(recordId,"Non-empty recordId must be provided.");assert$1(formName,"Non-empty formName must be provided.");assert$1(sectionName,"Non-empty sectionName must be provided.");}return {type:FORM_SECTION_UI_OBSERVABLE_VALUE_TYPE,key:`${recordId}${KEY_DELIM}${formName}${KEY_DELIM}${sectionName}`};}/**
     * Returns a FormUiCacheKeyParams based on the given cacheKey.
     * @param cacheKey A FormUi CacheKey.
     * @returns A FormUiCacheKeyParams.
     */function buildFormUiCacheKeyParamsFromCacheKey(cacheKey){{assert$1(cacheKey.type===FORM_UI_VALUE_TYPE,`valueType was expected to be FORM_UI_VALUE_TYPE but was not: ${cacheKey.type.toString()}`);}const key=cacheKey.key;const localKeyParts=key.split(KEY_DELIM);let formNames=[];if(localKeyParts.length>1&&localKeyParts[1]!==""){formNames=localKeyParts[1].split(",");}return {recordIds:localKeyParts[0].split(","),formNames};}/**
     * Constructs a cache key for the FormUi value type.
     * @param recordIds The record ids for the cache key.
     * @param formNames The form names for the cache key.
     * @returns A new cache key representing the FormUi value type.
     */function buildFormUiCacheKey(recordIds,formNames){recordIds=recordIds.slice();formNames=formNames.slice();/**
         * Tagged template helper function for formatting key errors.
         * @param literals The template strings.
         * @param key Identifies the subkey.
         * @param valueFound The list of values that were attempted to be combined into a subkey.
         * @param singleValue The individual value that triggered the error.
         * @returns A formatted error string describing the error.
         */function errorFormatter(_literals,key,valueFound,singleValue){let base=`${key} should be a string list, but received ${valueFound}`;if(singleValue){base+=`, list contains an entry with value ${singleValue}`;}return base;}/**
         * Constructs a subkey from the given list.
         * @param list List of values to combine into a subkey.
         * @param key Identifier for the subkey. Used in errors.
         * @returns The constructed subkey.
         */function constructKeyFromStringList(list,key){{list.forEach(field=>{assert$1(field,errorFormatter`${key}${list}${field}`);});}return list.join(",");}{assert$1(recordIds.length,"Non-empty recordIds must be provided.");assert$1(formNames.length,"Non-empty formNames must be provided.");}const recordIds2=constructKeyFromStringList(recordIds,"recordIds");const formNames2=constructKeyFromStringList(formNames,"formsNames");return {type:FORM_UI_VALUE_TYPE,key:`${recordIds2}${KEY_DELIM}${formNames2}`};}/**
     * Transforms and returns the given aggregateUi representation into a FormUiRepresentation.
     * @param aggregateUi The instance of AggregateUiRepresentation to transform into a FormUiRepresentation.
     * @returns See description.
     */function transformAggregateUiRepresentationIntoFormUiRepresentation(aggregateUi){delete aggregateUi.layoutUserStates;delete aggregateUi.layouts;return aggregateUi;}/**
     * Provides functionality to read record ui data from the cache. Can refresh the data from the server.
     * We do not utilize caching or sending eTags to the server for this value type because it gets invalidated
     * quickly on the client from having its atoms updated.
     */class FormUiService extends LdsServiceBase{/**
         * Constructor.
         * @param ldsCache Reference to the LdsCache instance.
         * @param adsBridge Reference to the AdsBridge instance.
         */constructor(ldsCache,adsBridge){super(ldsCache,[FORM_UI_VALUE_TYPE]);this._adsBridge=adsBridge;this._formSectionUiObservables=new Map();}getCacheValueTtl(){return FORM_UI_TTL;}/**
         * Returns an observable for a FormSectionUi value specified by the given inputs.
         * @param formApiName The form name of the form that the section belongs to.
         * @param formSectionApiName The section name of the form.
         * @param recordId The record id of the record to include in the form section ui.
         * @returns See description.
         */getFormSectionUi(formApiName,formSectionApiName,recordId){// Validate input.
    checkType(formApiName,String);checkType(formSectionApiName,String);checkType(recordId,String);const cacheKey=buildFormUiCacheKey([recordId],[formApiName]);const valueProvider=this._createFormUiValueProvider({cacheKey,recordId,formApiName,forceProvide:false});this._ldsCache.get(cacheKey,valueProvider);// Use an observable chain to transform the form-ui into a form-section-ui.
    const formSectionUiObservableKey=buildFormSectionUiObservableKey(recordId,formApiName,formSectionApiName);const formSectionUiObservables=this._formSectionUiObservables;let formSectionUiObservable=formSectionUiObservables.get(serialize(formSectionUiObservableKey));if(!formSectionUiObservable){const formUiCoreObservables=this._ldsCache.getOrCreateObservables(cacheKey,this.getCacheValueTtl());// We pass observables.changesOnly here so that any formSectionUi observables don't have their chains executed if the formUi isn't different.
    // This should save on perf.
    formSectionUiObservable=this._constructFormSectionUiObservable(formSectionUiObservableKey,formUiCoreObservables.finalTransformed,formApiName,formSectionApiName,recordId);formSectionUiObservables.set(serialize(formSectionUiObservableKey),formSectionUiObservable);}return formSectionUiObservable;}/**
         * Normalizes the given FormUi value and stage puts it and all its sub-values. Use this when you have a FormUi value locally and you want to commit it as part
         * of an existing CacheAccessor transaction.
         * @param dependencies An array of cache keys that depend on the given formUi.
         * @param aggregateUi The aggregateUi response value.
         * @param cacheAccessor An object to access cache directly.
         * @param additionalData Property bag that contains additional values for determining how stagePutting happens.
         */stagePutValue(dependencies,formUi,cacheAccessor,additionalData){// Defaults.
    additionalData=additionalData?additionalData:{rootRecordMerge:true};const formUiCacheKey=buildFormUiCacheKey(Object.keys(formUi.records),Object.keys(formUi.forms));this._normalizeAndStagePutFormUi(dependencies,formUi,cacheAccessor,formUiCacheKey,additionalData.rootRecordMerge);}/**
         * Strips all eTag properties from the given formUi by directly deleting them.
         * @param formUi The formUi from which to strip the eTags.
         * @returns The given formUi with its eTags stripped.
         */stripETagsFromValue(formUi){delete formUi.eTag;// Strip eTags from object infos.
    const objectInfos=formUi.objectInfos;const objectApiNames=Object.keys(objectInfos);for(let len=objectApiNames.length,n=0;n<len;++n){const objectApiName=objectApiNames[n];const objectInfo=objectInfos[objectApiName];objectInfos[objectApiName]=this._ldsCache.stripETagsFromValue(OBJECT_INFO_VALUE_TYPE,objectInfo);}// Strip eTags from forms.
    const forms=formUi.forms;const formApiNames=Object.keys(forms);for(let formApiNameIndex=0,len=formApiNames.length;formApiNameIndex<len;++formApiNameIndex){const formApiName=formApiNames[formApiNameIndex];const form=formUi.forms[formApiName];formUi.forms[formApiName]=this._ldsCache.stripETagsFromValue(FORM_VALUE_TYPE,form);}// Strip eTags from records.
    const records=formUi.records;const recordIds=Object.keys(records);for(let n=0,len=recordIds.length;n<len;++n){const recordId=recordIds[n];const record=records[recordId];this._ldsCache.stripETagsFromValue(RECORD_VALUE_TYPE,record);}return formUi;}/**
         * Takes the normalized formUi and cacheAccessor and returns the denormalized formUi.
         * @param normalizedFormUi The formUi to denormalized. This should always be a normalized formUi that came from the cache.
         * @param cacheAccessor The CacheAccessor in scope for this operation.
         * @returns A Thenable that will resolve to the denormalized formUi.
         */denormalizeValue(normalizedFormUi,cacheAccessor){const objectToClone=normalizedFormUi;const denormalizedFormUi=cloneDeepCopy(objectToClone);// Object infos denormalization.
    const objectInfos=normalizedFormUi.objectInfos;const objectApiNames=Object.keys(objectInfos);for(let len=objectApiNames.length,n=0;n<len;n++){const objectApiName=objectApiNames[n];const objectInfoCacheKey=buildCacheKey$1(objectApiName);const cachedObjectInfoValueWrapper=cacheAccessor.get(objectInfoCacheKey);if(cachedObjectInfoValueWrapper){denormalizedFormUi.objectInfos[objectApiName]=cachedObjectInfoValueWrapper.value;}else{throw getLdsInternalError("DENORMALIZE_FAILED","Did not get an object info back for marker: "+serialize(objectInfoCacheKey),true);}}// Forms denormalization.
    const forms=normalizedFormUi.forms;const formApiNames=Object.keys(forms);for(let len=formApiNames.length,n=0;n<len;n++){const formApiName=formApiNames[n];const formCacheKey=buildCacheKey$6(formApiName);const cachedFormValueWrapper=cacheAccessor.get(formCacheKey);if(cachedFormValueWrapper){denormalizedFormUi.forms[formApiName]=cachedFormValueWrapper.value;}else{throw getLdsInternalError("DENORMALIZE_FAILED","Did not get a form back for marker: "+serialize(formCacheKey),true);}}// Records denormalization.
    const recordMarkersArray=[];const recordIds=Object.keys(normalizedFormUi.records);for(let len=recordIds.length,n=0;n<len;n++){const recordId=recordIds[n];const recordMarker=normalizedFormUi.records[recordId];recordMarkersArray.push(recordMarker);// TODO: what we have (and had since 210) is the full version of the record, not filtered to the set of fields that were requested. Revisit.
    }const recordService=this._ldsCache.getService(RECORD_VALUE_TYPE);const denormalizedRecordsArray=fromRecordMarkers(recordService,cacheAccessor,recordMarkersArray);if(denormalizedRecordsArray.length!==recordMarkersArray.length){throw getLdsInternalError("DENORMALIZE_FAILED",`Expected ${recordMarkersArray.length} records but received ${denormalizedRecordsArray.length}`,true);}for(let len=denormalizedRecordsArray.length,c=0;c<len;++c){const denormalizedRecord=denormalizedRecordsArray[c];if(denormalizedRecord){denormalizedFormUi.records[denormalizedRecord.id]=denormalizedRecord;}else{throw getLdsInternalError("DENORMALIZE_FAILED",`Did not get a denormalized record back for marker: ${recordMarkersArray[c].id}`,true);}}// The denormalized FormUi should now be ready to go.
    return denormalizedFormUi;}/**
         * @returns The affected key handler for this service.
         */getAffectedKeyHandler(){return (affectedKey,cacheAccessor)=>{{assert$1(affectedKey.type===FORM_UI_VALUE_TYPE,`Expected FORM_UI_VALUE_TYPE value type for FormUi: ${affectedKey.type.toString()}`);}const formUiWrapper=cacheAccessor.get(affectedKey);let refreshFormUi=false;if(formUiWrapper&&formUiWrapper.value){const normalizedFormUi=formUiWrapper.value;// We need to detect if any of the records' record types have changed. If they have, we must fully refresh. If not, we
    // can just denorm and stage an emit for it.
    const recordMarkers=normalizedFormUi.records;const recordIds=Object.keys(recordMarkers);for(let len=recordIds.length,c=0;c<len;++c){const recordId=recordIds[c];const recordMarker=recordMarkers[recordId];const recordMarkerRecordTypeId=recordMarker.recordTypeId;const recordCacheKey=buildRecordCacheKey(recordId);const refreshedRecordValueWrapper=cacheAccessor.getCommitted(recordCacheKey);if(refreshedRecordValueWrapper){// TODO: Update this to NormalizedRecord type when record-service is converted to typescript.
    const refreshedRecord=refreshedRecordValueWrapper.value;// A record matching this marker has been committed as part of this cache transaction. See if its record type changed.
    // If it did we need to do a full refresh of this FormUi, otherwise we can just denorm/emit it. We don't need to
    // worry about records that weren't committed as part of this cache transaction because they haven't changed.
    // We use null rather than undefined here to be consistent with what we'll find in the API JSON payloads.
    const refreshedRecordTypeId=refreshedRecord.recordTypeInfo?refreshedRecord.recordTypeInfo.recordTypeId:null;if(recordMarkerRecordTypeId!==refreshedRecordTypeId){refreshFormUi=true;break;}}}// Maybe an ObjectInfo changed, if so determining its effect could be difficult so do a full refresh to be sure we get it right.
    if(!refreshFormUi){// Don't make further checks if we don't need to.
    const objectInfoMarkers=normalizedFormUi.objectInfos;const objectApiNames=Object.keys(objectInfoMarkers);for(let len=objectApiNames.length,c=0;c<len;++c){const objectApiName=objectApiNames[c];const objectInfoMarker=objectInfoMarkers[objectApiName];const objectInfoETag=objectInfoMarker.eTag;const objectInfoCacheKey=buildCacheKey$1(objectApiName);const refreshedObjectInfoValueWrapper=cacheAccessor.getCommitted(objectInfoCacheKey);if(refreshedObjectInfoValueWrapper){if(objectInfoETag!==refreshedObjectInfoValueWrapper.eTag){refreshFormUi=true;break;}}}}}if(refreshFormUi){this._refreshFormUi(affectedKey);return;}// A full refresh is unnecessary -- just do denorm and staging of an emit.
    const normalizedFormUiValueWrapper=cacheAccessor.get(affectedKey);if(normalizedFormUiValueWrapper){const normalizedFormUi=normalizedFormUiValueWrapper.value;try{const formUi=this.denormalizeValue(normalizedFormUi,cacheAccessor);if(formUi){// Denormalization was successful, return formUi
    const formUiValueWrapperToEmit=cloneWithValueOverride(normalizedFormUiValueWrapper,formUi);cacheAccessor.stageEmit(affectedKey,formUiValueWrapperToEmit);}else{// Denormalization of formUi failed, proceed to refresh
    this._refreshFormUi(affectedKey);}}catch(err){// Denormalization of formUi failed, proceed to refresh
    this._refreshFormUi(affectedKey);}}};}/**
         * Constructs a value provider to retrieve a FormUi.
         * @param formUiValueProviderParameters: Parameters object for the ValueProvider. See the interface for property descriptions.
         * @returns ValueProvider: The value provider to retrieve a FormUi.
         */_createFormUiValueProvider(formUiValueProviderParameters){const valueProvider=new ValueProvider((cacheAccessor,formUiValueProviderParams)=>{const{cacheKey,recordId,formApiName,localFreshFormUi}=formUiValueProviderParams;let{forceProvide,rootRecordMerge}=formUiValueProviderParams;// Explicitly set defaults.
    forceProvide=forceProvide!==undefined?forceProvide:false;// When W-5029346 is completed, we can set rootRecordMerge to false!
    rootRecordMerge=rootRecordMerge!==undefined?rootRecordMerge:true;// We need to inform recordLibrary of new records, wrap the cache accessor which will track all new things in this
    // cache operation and let commitPuts() handle the informs.
    cacheAccessor=wrapCacheAccessor(cacheAccessor,this._adsBridge);if(forceProvide){return this._getFreshValue(cacheAccessor,cacheKey,recordId,formApiName,rootRecordMerge,localFreshFormUi);}const existingValueWrapper=cacheAccessor.get(cacheKey);if(existingValueWrapper&&existingValueWrapper.value!==undefined){const existingValue=existingValueWrapper.value;const nowTime=cacheAccessor.nowTime;const lastFetchTime=existingValueWrapper.lastFetchTime;// Check for ttl expiry
    const needsRefresh=nowTime>lastFetchTime+FORM_UI_TTL;if(needsRefresh){// Value is stale; get a fresh value.
    return this._getFreshValue(cacheAccessor,cacheKey,recordId,formApiName,rootRecordMerge,localFreshFormUi);}// Value is not stale, but we still need to validate the cached value.
    const value=this._validateExistingFormUiCacheValue(cacheAccessor,existingValue);if(value){return Thenable.resolve(1/* CACHE_HIT */);}// Existing value is not valid; get a fresh value.
    return this._getFreshValue(cacheAccessor,cacheKey,recordId,formApiName,rootRecordMerge,localFreshFormUi);}// No existing value; get a fresh value.
    return this._getFreshValue(cacheAccessor,cacheKey,recordId,formApiName,rootRecordMerge,localFreshFormUi);},formUiValueProviderParameters);return valueProvider;}hasValidCachedValue(cacheAccessor,params){const cacheKey=buildFormUiCacheKey(params.recordIds,params.formNames);const existingValueWrapper=cacheAccessor.get(cacheKey);return !!existingValueWrapper&&existingValueWrapper.value!==undefined&&cacheAccessor.nowTime<=existingValueWrapper.lastFetchTime+FORM_UI_TTL;}/**
         * Gets a fresh value and processes it into the cache with the cacheAccessor.
         * @param cacheAccessor An object to transactionally access the cache.
         * @param cacheKey The cache key for the formUi.
         * @param recordId The char ID of the record to retrieve.
         * @param formApiName The form api name of the form to retrieve.
         * @param rootRecordMerge True if the cache should attempt to merge the record values instead of replacing them.
         * @param localFreshFormUi A formUi value you want explicitly put into cache instead of getting the value from the server.
         * @returns Returns a Thenable that resolves to the outcome of the ValueProvider.
         */_getFreshValue(cacheAccessor,cacheKey,recordId,formApiName,rootRecordMerge,localFreshFormUi){let transportResponseThenable;// If the formUi is provided, we don't go to server to fetch it.
    if(localFreshFormUi){transportResponseThenable=Thenable.resolve(getOkFetchResponse(localFreshFormUi));}else{const params={query:`FormWithRecord:${formApiName}:${recordId}`};{transportResponseThenable=aggregateUiExecutor.executeSingleRequestOverAggregateUi("getFormSectionUi",params,FORM_UI_TTL);}}return transportResponseThenable.then(transportResponse=>{// Cache miss
    const freshAggregateUiValue=transportResponse.body;// Transform the aggregate ui value into a formUi value.
    delete freshAggregateUiValue.layoutUserStates;delete freshAggregateUiValue.layouts;const freshFormUiValue=freshAggregateUiValue;// It's a cache miss and we are going normalize the formUi.
    cacheAccessor.stageClearDependencies(cacheKey);// Nothing should depend on this yet; included for completeness.
    this._normalizeAndStagePutFormUi([],freshFormUiValue,cacheAccessor,cacheKey,rootRecordMerge);const affectedKeys=cacheAccessor.commitPuts();this._ldsCache.handleAffectedKeys(affectedKeys,cacheAccessor);return 2/* CACHE_MISS */;});}/**
         * Returns true if the existing formUi cache value is valid, else false.
         * @param cacheAccessor The cacheAccessor.
         * @param normalizedFormUi The existing normalized formUi cache value.
         * @returns See description.
         */_validateExistingFormUiCacheValue(cacheAccessor,normalizedFormUi){try{const denormalizedFormUi=this.denormalizeValue(normalizedFormUi,cacheAccessor);return !!denormalizedFormUi;}catch(err){return false;}}/**
         * Returns a Thenable that resolves once the FormUi has been normalized and all necessary puts staged.
         * @param dependencies An array of cache keys which depend on the given denormalizedFormUi.
         * @param denormalizedFormUi FormUi denormalized value.
         * @param cacheAccessor An object to access cache directly.
         * @param formUiCacheKey Cache key for Record UI.
         * @param rootRecordMerge True if we should attempt to merge the root record during normalization. This should only happen from ADS bridge
         *      code paths. If this request originated from LDS, then we know the record has all the fields we are interested in and is the freshest version.
         */_normalizeAndStagePutFormUi(dependencies,denormalizedFormUi,cacheAccessor,formUiCacheKey,rootRecordMerge){const objectToClone=denormalizedFormUi;const normalizedFormUi=cloneDeepCopy(objectToClone);// Object Info normalization
    const objectInfos=denormalizedFormUi.objectInfos;const objectApiNames=Object.keys(objectInfos);for(let len=objectApiNames.length,n=0;n<len;n++){const objectApiName=objectApiNames[n];const objectInfo=objectInfos[objectApiName];// Construct the marker.
    normalizedFormUi.objectInfos[objectApiName]={objectApiName:objectInfo.apiName,eTag:objectInfo.eTag};this._ldsCache.stagePutValue(OBJECT_INFO_VALUE_TYPE,[{cacheKey:formUiCacheKey,type:1/* REQUIRED */}],objectInfo,cacheAccessor);}// Forms normalization
    const forms=denormalizedFormUi.forms;const formApiNames=Object.keys(forms);for(let len=formApiNames.length,n=0;n<len;n++){const formApiName=formApiNames[n];const form=forms[formApiName];// Construct the marker.
    normalizedFormUi.forms[formApiName]={formApiName,eTag:form.eTag};this._ldsCache.stagePutValue(FORM_VALUE_TYPE,[{cacheKey:formUiCacheKey,type:1/* REQUIRED */}],form,cacheAccessor);}// Records normalization
    const records=denormalizedFormUi.records;const recordIds=Object.keys(records);for(let len=recordIds.length,n=0;n<len;n++){const recordId=recordIds[n];const record=records[recordId];normalizedFormUi.records[recordId]=toRecordMarker(cacheAccessor,record,0);this._ldsCache.stagePutValue(RECORD_VALUE_TYPE,[{cacheKey:formUiCacheKey,type:1/* REQUIRED */}],record,cacheAccessor,{rootRecordMerge});}// Strip out the eTag from the value. We don't want to emit eTags!
    const eTag=normalizedFormUi.eTag;delete normalizedFormUi.eTag;denormalizedFormUi=this.stripETagsFromValue(denormalizedFormUi);// Stage put the formUi.
    cacheAccessor.stagePut(dependencies,formUiCacheKey,normalizedFormUi,denormalizedFormUi,{eTag});}/**
         * Constructs and returns an Observable that will emit a form section ui for the given sectionName.
         * @param formSectionUiObservableKey The form section ui observable key identifying the form section ui observable.
         * @param formUiObservable The observable that emits a formUi object from which we will construct the particular form section ui object.
         * @param formApiName The form api name of the form for which the form section is a part.
         * @param formSectionApiName The section name of the section for which to create a form section ui object.
         * @param recordId The record id of the record to include as part of the form-section-ui.
         * @returns See description.
         */_constructFormSectionUiObservable(formSectionUiObservableKey,formUiObservable,formApiName,formSectionApiName,recordId){const formSectionUiObservable=formUiObservable.map(value=>{const formSectionUi=this._createFormSectionUiFromFormUi(value,formApiName,formSectionApiName,recordId);return formSectionUi;}).distinctUntilChanged((previousValue,newValue)=>{// Only allow new values to be emitted.
    return equivalent(previousValue,newValue);}).map(changedValue=>{// Map it to the read only value so consumers can't change stuff owned by the cache.
    if(changedValue===undefined){return changedValue;}return lwc.readonly(changedValue);});// Subscribe to the new filtered observable so that when it completes (or errors) we know to remove the filtered observable from the map.
    formSectionUiObservable.subscribe({next:()=>{return;},error:()=>{this._formSectionUiObservables.delete(serialize(formSectionUiObservableKey));},complete:()=>{this._formSectionUiObservables.delete(serialize(formSectionUiObservableKey));}});// Decorate the subscribe method to return a Subscription instance with a decorated unsubscribe method which will dispose the filtered observable if
    // the subscriptions count drops below 1. (Not 0 because of the above subscription which will always be there but doesn't signify that
    // there is someone interested in this filtered observable externally.
    const formSectionUiObservables=this._formSectionUiObservables;const originalSubscribeFn=formSectionUiObservable.subscribe;formSectionUiObservable.subscribe=(observer,...args)=>{const originalSubscription=originalSubscribeFn.call(formSectionUiObservable,observer,...args);const originalSubscriptionUnsubscribeFn=originalSubscription.unsubscribe;originalSubscription.unsubscribe=()=>{originalSubscriptionUnsubscribeFn.call(originalSubscription);if(formSectionUiObservable.subscriptions.size<=1){formSectionUiObservables.delete(serialize(formSectionUiObservableKey));}};return originalSubscription;};return formSectionUiObservable;}/**
         * Returns a formSectionUi object crafted from the given formUi object for the given sectionName.
         * This object is NOT a deep clone from the given formUi.
         * @param formUi The formUi object from which to create the formSectionUi object.
         * @param formApiName The api name of the form.
         * @param sectionApiName The api name of the section for which to create the formSectionUi object.
         * @param recordId The record id of the record for the form.
         */_createFormSectionUiFromFormUi(formUi,formApiName,sectionApiName,recordId){// Shallow copy the formUi.
    // TODO: The way this code is written is not compatible with the types so an any type is used. We need to consider
    // a type safe way to build the new object, but this should be considered in another story
    // because it will have perf implications.
    const formSectionUi=Object.assign({},formUi);// Get the form specified by the form api name, get the form section specified by the section api name, and assign.
    const formSection=formUi.forms[formApiName].sections.find(value=>{return value.apiName===sectionApiName;});formSectionUi.formSection=Object.assign({},formSection);delete formSectionUi.forms;// Get the record specified by the record id, filter the fields, and assign.
    const fullRecord=formUi.records[recordId];const objectInfoForRecordAndLayout=formUi.objectInfos[fullRecord.apiName];const filteredRecordFields=this._getFieldApiNamesFromFormSection(formSectionUi.formSection,objectInfoForRecordAndLayout);const filteredRecord=createFilteredRecordFromRecord(formSectionUi.records[recordId],filteredRecordFields);formSectionUi.record=filteredRecord;delete formSectionUi.records;// Filter the objectInfos.
    const objectInfoApiNamesForFormSection=this._getObjectApiNamesForFormSection(filteredRecordFields,formSectionUi.record.apiName,formSectionUi.objectInfos);const objectInfosForFormSection=objectInfoApiNamesForFormSection.reduce((accumulator,value)=>{accumulator[value]=formSectionUi.objectInfos[value];return accumulator;},{});formSectionUi.objectInfos=objectInfosForFormSection;return formSectionUi;}/**
         * Returns a set of field api names that are contained in the given form section.
         * @param formSection The FormSectionRepresentation object.
         * @param objectInfo The object info of the entity associated with the form.
         * @returns See description.
         */_getFieldApiNamesFromFormSection(formSection,objectInfo){const qualifiedFieldApiNames=new Set();for(let formSectionRowsLength=formSection.formSectionRows.length,formSectionRowsIndex=0;formSectionRowsIndex<formSectionRowsLength;++formSectionRowsIndex){const formRow=formSection.formSectionRows[formSectionRowsIndex];for(let formItemsLength=formRow.formItems.length,formItemsIndex=0;formItemsIndex<formItemsLength;++formItemsIndex){const formItem=formRow.formItems[formItemsIndex];for(let formSubitemsLength=formItem.formSubitems.length,formSubitemsIndex=0;formSubitemsIndex<formSubitemsLength;++formSubitemsIndex){const formSubitem=formItem.formSubitems[formSubitemsIndex];if(formSubitem.subitemType==="Field"){const formFieldSubitem=formSubitem;const spanningFieldName=objectInfo.fields[formFieldSubitem.apiName].relationshipName;if(spanningFieldName){// By default, include "Id" and "Name" fields on spanning records that are on the layout.
    qualifiedFieldApiNames.add(`${spanningFieldName}.Id`);qualifiedFieldApiNames.add(`${spanningFieldName}.Name`);}qualifiedFieldApiNames.add(`${formFieldSubitem.apiName}`);}}}}return collectionToArray(qualifiedFieldApiNames);}/**
         * Returns a list of the used object api names by the form section.
         * @param fields An array of the field api names in the form section.
         * @param formObjectApiName The object api name for the form.
         * @param objectInfos An object map of objectApiName -> objectInfo.
         * @returns See description.
         */_getObjectApiNamesForFormSection(fields,formObjectApiName,objectInfos){const objectInfo=objectInfos[formObjectApiName];const usedObjectApiNames=new Set();usedObjectApiNames.add(formObjectApiName);const fieldsWithoutSpanningFields=fields.filter(fieldApiName=>{// Filter out spanning fields.
    return !fieldApiName.includes(".");});for(let fieldsWithoutSpanningFieldsLength=fieldsWithoutSpanningFields.length,fieldsWithoutSpanningFieldsIndex=0;fieldsWithoutSpanningFieldsIndex<fieldsWithoutSpanningFieldsLength;++fieldsWithoutSpanningFieldsIndex){const fieldApiName=fieldsWithoutSpanningFields[fieldsWithoutSpanningFieldsIndex];const fieldRep=objectInfo.fields[fieldApiName];const referenceToInfos=fieldRep.referenceToInfos;for(let referenceToInfosLength=referenceToInfos.length,referenceToInfosIndex=0;referenceToInfosIndex<referenceToInfosLength;++referenceToInfosIndex){const referenceToInfo=referenceToInfos[referenceToInfosIndex];const usedObjectInfo=objectInfos[referenceToInfo.apiName];if(!usedObjectInfo){throw Error("Unable to find ObjectInfo "+referenceToInfo.apiName);}usedObjectApiNames.add(usedObjectInfo.apiName);}}return collectionToArray(usedObjectApiNames);}/**
         * Helper method to kick off a refresh for a Form UI. Called from within the affectedKeyHandler so
         * _ldsCache access function is not needed.
         * @param affectedKey The cache key for the Form UI to refresh.
         */_refreshFormUi(affectedKey){// When a record type changes in a record it can affect the form that should be present in the FormUi. Because of this for now we
    // do a full refresh of the FormUi.
    const params=buildFormUiCacheKeyParamsFromCacheKey(affectedKey);const recordId=params.recordIds[0];const formApiName=params.formNames[0];// We need to refresh, but we're already in a cache transaction. Kick this to a Promise to get this out of the cache operation we're
    // already in the middle of.
    Promise.resolve().then(()=>{const forceProvide=true;const valueProvider=this._createFormUiValueProvider({cacheKey:affectedKey,recordId,formApiName,forceProvide});this._ldsCache.get(affectedKey,valueProvider);});}}/**
     * Wire adapter id: getFormSectionUi.
     * @throws Error - Always throws when invoked. Imperative invocation is not supported.
     */function getFormSectionUi(){throw generateError("getFormSectionUi");}/**
     * Generates the wire adapter for getFormSectionUi
     */class FormUiWireAdapterGenerator{/**
         * Constructor.
         * @param formUiService Reference to the FormUiService instance.
         */constructor(formUiService){this._formUiService=formUiService;}/**
         * Generates the wire adapter for @wire getFormSectionUi.
         * @returns Returns the generated wire adapter for getFormSectionUi
         */generateGetFormSectionUiWireAdapter(){const wireAdapter=generateWireAdapter(this._serviceGetFormSectionUi.bind(this));return wireAdapter;}/**
         * @private Made public for testing.
         * Service getFormSectionUi @wire.
         * Can be called from an untyped context.
         * @param config Config params for the service.
         * @return Observable stream that emits a form section ui object.
         *
         * @private Public for testing purposes.
         */_serviceGetFormSectionUi(config){if(!config||!config.recordId||!config.formName||!config.sectionName){return undefined;}return this._formUiService.getFormSectionUi(config.formName,config.sectionName,config.recordId);}}/*
     * The valueType to use when building ListUiCacheKeyBuilder.
     */const LIST_UI_VALUE_TYPE="lds.ListUi";const LIST_INFO_VALUE_TYPE="lds.ListInfo";const LIST_RECORDS_VALUE_TYPE="lds.ListRecords";const LIST_VIEWS_VALUE_TYPE="lds.ListViews";// TTL for list collection related data
    const LIST_COLLECTION_TTL=30*1000;// 30 second ttl
    // TTL for list-ui related data
    const LIST_UI_TTL=15*60*1000;// 15 minute ttl
    // chunk size for caching list-records
    const DEFAULT_LIST_RECORDS_CHUNK_SIZE=25;// chunk size for caching list collections
    const DEFAULT_LIST_COLLECTION_CHUNK_SIZE=50;// listViewApiName to pass to getListUi() to request the MRU list
    const MRU=Symbol.for("MRU");// default page sizes if caller does not specify
    const DEFAULT_LIST_COLLECTION_PAGE_SIZE=20;const DEFAULT_LIST_RECORDS_PAGE_SIZE=50;// default page token if caller does not specify
    const DEFAULT_PAGE_TOKEN="0";// shared utility functions
    /**
     * String template for error messages.
     *
     * @param literals string literals from the template
     * @param key key for which the problem was detected
     * @param valueFound value that was supplied for key (if any)
     * @param singleValue existing value contained in list (?)
     * @return formatted error message
     */function _errorFormatter(_literals,key,valueFound,singleValue){return `${key} should be a string list, but received ${valueFound}`+(singleValue?`, list contains an entry with value ${singleValue}`:"");}/**
     * Converts a list to a string suitable for inclusion in a CacheKey. The
     * list is not permitted to contain any null or undefined values.
     *
     * @param list list
     * @param key key associated with list, only used in case of errors
     * @return list, formatted as a string
     */function _listToString(list=[],key){// TODO - can be removed once all calling code is cleaned up to use undefined rather than null
    list=list||[];list.forEach(field=>{if(!field){throw new TypeError(_errorFormatter`${key}${list}${field}`);}});return list.join(",");}/**
     * Indicates if the supplied value is null or undefined.
     *
     * @param x value to be checked
     * @return true if x is null or undefined; false otherwise
     */function _nullish(x){return x===null||x===undefined;}/**
     * Converts a string from a CacheKey to a listViewApiName.
     *
     * @param s CacheKey string
     * @return listViewApiName associated with s
     */function _stringToListViewApiName(s){return s?s.startsWith("Symbol(")?Symbol.for(s.slice(7,-1)):s:undefined;}/**
     * Converts a string from a CacheKey to a list of strings.
     *
     * @param s CacheKey string
     * @return list of values that were used to generate s
     */function _stringToList(s){return s?s.split(","):undefined;}/**
     * Constructs a cache key for a list-info.
     */class ListInfoCacheKeyBuilder{/**
         * Sets the objectApiName, listViewApiName, and listViewId for the list-info
         * CacheKey.
         *
         * @param objectApiName objectApiName for the list-info cache key
         * @param listViewApiName listViewApiName for the list-info cache key
         * @param listViewId listViewId for the list-info cache key
         * @returns the current object, to allow method chaining
         */setListReference(objectApiName,listViewApiName,listViewId){if(listViewId||objectApiName&&listViewApiName){this._objectApiName=objectApiName;this._listViewApiName=listViewApiName;this._listViewId=listViewId;}else{throw new TypeError(`Either objectApiName (${objectApiName}) AND listViewApiName (${String(listViewApiName)}) or listViewId (${listViewId}) must be set`);}return this;}/**
         * Sets the objectApiName, listViewApiName, and listViewId to match the corresponding
         * fields of a list-ui CacheKey.
         *
         * @param listUiCacheKey list-ui cache key to be copied
         * @returns the current object, to allow method chaining
         */setListUiCacheKey(listUiCacheKey){const pieces=listUiCacheKey.key.split(KEY_DELIM,3);this._objectApiName=pieces[0];this._listViewApiName=_stringToListViewApiName(pieces[1]);this._listViewId=pieces[2];return this;}/**
         * Builds the cache key for a list-info.
         *
         * @returns a new cache key for a list-info
         */build(){return {type:LIST_INFO_VALUE_TYPE,key:`${this._objectApiName||""}${KEY_DELIM}${this._listViewApiName?this._listViewApiName.toString():""}${KEY_DELIM}${this._listViewId||""}`};}}/**
     * Constructs a cache key for a list-records.
     */class ListRecordsCacheKeyBuilder{/**
         * Returns the fields associated with the list-records.
         *
         * @returns fields associated with the list-records
         */get fields(){return this._fields;}/**
         * Sets the fields for the list-records.
         *
         * @param fields fields for the list-records
         */set fields(fields){this.fields=fields;}/**
         * Sets the fields for the list-records.
         *
         * @param fields fields for the list-records
         * @returns the current object, to allow method chaining
         */setFields(fields){this._fields=fields;return this;}/**
         * Returns the listViewApiName associated with the list-records.
         *
         * @returns listViewApiName associated with the list-records
         */get listViewApiName(){return this._listViewApiName;}/**
         * Returns the listViewApiId associated with the list-records.
         *
         * @returns listViewApiId associated with the list-records
         */get listViewId(){return this._listViewId;}/**
         * Returns the objectApiName associated with the list-records.
         *
         * @returns objectApiName associated with the list-records
         */get objectApiName(){return this._objectApiName;}/**
         * Returns the optionalFields associated with the list-records.
         *
         * @returns optionalFields associated with the list-records
         */get optionalFields(){return this._optionalFields;}/**
         * Sets the optionalFields for the list-records.
         *
         * @param optionalFields optionalFields for the list-records
         */set optionalFields(optionalFields){this._optionalFields=optionalFields;}/**
         * Sets the optionalFields for the list-records.
         *
         * @param optionalFields optionalFields for the list-records
         * @returns the current object, to allow method chaining
         */setOptionalFields(optionalFields){this._optionalFields=optionalFields;return this;}/**
         * Returns the pageToken associated with the list-records.
         *
         * @returns pageToken associated with the list-records
         */get pageToken(){return this._pageToken;}/**
         * Sets the pageToken for the list-records.
         *
         * @param pagToken pageToken for the list-records
         */set pageToken(pageToken){this._pageToken=pageToken;}/**
         * Sets the pageToken for the list-records.
         *
         * @param pagToken pageToken for the list-records
         * @returns the current object, to allow method chaining
         */setPageToken(pageToken){this._pageToken=pageToken;return this;}/**
         * Returns the sortBy associated with the list-records.
         *
         * @returns sortBy associated with the list-records
         */get sortBy(){return this._sortBy;}/**
         * Sets the sortBy for the list-records.
         *
         * @param sortBy sortBy for the list-records
         */set sortBy(sortBy){this._sortBy=sortBy;}/**
         * Sets the sortBy for the list-records.
         *
         * @param sortBy sortBy for the list-records
         * @returns the current object, to allow method chaining
         */setSortBy(sortBy){this._sortBy=sortBy;return this;}/**
         * Sets the list reference fields (objectApiName, listViewApiName, and
         * listViewId) for this list-records. Note that either listViewId, or objectApiName
         * and listViewApiName must be supplied.
         *
         * @param objectApiName objectApiName to set
         * @param listViewApiName listViewApiName to set
         * @param listViewId listViewId to set
         * @returns the current object, to allow method chaining
         */setListReference(objectApiName,listViewApiName,listViewId){if(listViewId||objectApiName&&listViewApiName){this._objectApiName=objectApiName;this._listViewApiName=listViewApiName;this._listViewId=listViewId;}else{throw new TypeError(`Either objectApiName (${objectApiName}) AND listViewApiName (${String(listViewApiName)}) or listViewId (${listViewId}) must be set`);}return this;}/**
         * Sets the fields for this list-records cache key based on an existing list-records
         * cache key.
         *
         * @param cacheKey list-records cacheKey
         * @returns the current object, to allow method chaining
         */setListRecordsCacheKey(listRecordsCacheKey){const pieces=listRecordsCacheKey.key.split(KEY_DELIM);this._objectApiName=pieces[0]||undefined;this._listViewApiName=_stringToListViewApiName(pieces[1]);this._listViewId=pieces[2]||undefined;this._pageToken=pieces[3]||undefined;this._sortBy=pieces[4]||undefined;this._fields=_stringToList(pieces[5]);this._optionalFields=_stringToList(pieces[6]);return this;}/**
         * Sets the fields for this list-records cache key based on an existing list-ui
         * cache key.
         *
         * @param cacheKey list-ui cacheKey
         * @returns the current object, to allow method chaining
         */setListUiCacheKey(listUiCacheKey){const pieces=listUiCacheKey.key.split(KEY_DELIM);this._objectApiName=pieces[0]||undefined;this._listViewApiName=_stringToListViewApiName(pieces[1]);this._listViewId=pieces[2]||undefined;this._pageToken=pieces[3]||undefined;this._sortBy=pieces[5]||undefined;this._fields=_stringToList(pieces[6]);this._optionalFields=_stringToList(pieces[7]);return this;}/**
         * Builds the cache key for a list-records.
         *
         * @returns a new cache key for a list-records
         */build(){return {type:LIST_RECORDS_VALUE_TYPE,key:`${this._objectApiName||""}${KEY_DELIM}${this._listViewApiName?this._listViewApiName.toString():""}${KEY_DELIM}${this._listViewId||""}${KEY_DELIM}${_nullish(this._pageToken)?DEFAULT_PAGE_TOKEN:this._pageToken}${KEY_DELIM}${this._sortBy||""}${KEY_DELIM}${_listToString(this._fields,"fields")}${KEY_DELIM}${_listToString(this._optionalFields,"optionalFields")}`};}}/**
     * Constructs a cache key for a list-ui.
     */class ListUiCacheKeyBuilder{/**
         * Returns the fields associated with the list-ui.
         *
         * @returns fields associated with the list-ui
         */get fields(){return this._fields;}/**
         * Sets the fields for the list-ui.
         *
         * @param fields fields for the list-ui
         */set fields(fields){this._fields=fields;}/**
         * Sets the fields for the list-ui.
         *
         * @param fields fields for the list-ui
         * @returns the current object, to allow method chaining
         */setFields(fields){this._fields=fields;return this;}/**
         * Returns the listViewApiName associated with the list-ui.
         *
         * @returns listViewApiName associated with the list-ui
         */get listViewApiName(){return this._listViewApiName;}/**
         * Returns the listViewApiId associated with the list-ui.
         *
         * @returns listViewApiId associated with the list-ui
         */get listViewId(){return this._listViewId;}/**
         * Returns the objectApiName associated with the list-ui.
         *
         * @returns objectApiName associated with the list-ui
         */get objectApiName(){return this._objectApiName;}/**
         * Returns the optionalFields associated with the list-ui.
         *
         * @returns optionalFields associated with the list-ui
         */get optionalFields(){return this._optionalFields;}/**
         * Sets the optionalFields for the list-ui.
         *
         * @param optionalFields optionalFields for the list-ui
         */set optionalFields(optionalFields){this._optionalFields=optionalFields;}/**
         * Sets the optionalFields for the list-ui.
         *
         * @param optionalFields optionalFields for the list-ui
         * @returns the current object, to allow method chaining
         */setOptionalFields(optionalFields){this._optionalFields=optionalFields;return this;}/**
         * Returns the pageSize associated with the list-ui.
         *
         * @returns pageSize associated with the list-ui
         */get pageSize(){return this._pageSize;}/**
         * Sets the pageSize for the list-ui.
         *
         * @param pagSize pageSize for the list-ui
         */set pageSize(pageSize){this._pageSize=pageSize;}/**
         * Sets the pageSize for the list-ui.
         *
         * @param pagSize pageSize for the list-ui
         * @returns the current object, to allow method chaining
         */setPageSize(pageSize){this._pageSize=pageSize;return this;}/**
         * Returns the pageToken associated with the list-ui.
         *
         * @returns pageToken associated with the list-ui
         */get pageToken(){return this._pageToken;}/**
         * Sets the pageToken for the list-ui.
         *
         * @param pagToken pageToken for the list-ui
         */set pageToken(pageToken){this._pageToken=pageToken;}/**
         * Sets the pageToken for the list-ui.
         *
         * @param pagToken pageToken for the list-ui
         * @returns the current object, to allow method chaining
         */setPageToken(pageToken){this._pageToken=pageToken;return this;}/**
         * Returns the sortBy associated with the list-ui.
         *
         * @returns sortBy associated with the list-ui
         */get sortBy(){return this._sortBy;}/**
         * Sets the sortBy for the list-ui.
         *
         * @param sortBy sortBy for the list-ui
         */set sortBy(sortBy){this._sortBy=sortBy;}/**
         * Sets the sortBy for the list-ui.
         *
         * @param sortBy sortBy for the list-ui
         * @returns the current object, to allow method chaining
         */setSortBy(sortBy){this._sortBy=sortBy;return this;}/**
         * Sets the list reference fields (objectApiName, listViewApiName, and
         * listViewId) for this list-ui. Note that either listViewId, or objectApiName
         * and listViewApiName must be supplied.
         *
         * @param objectApiName objectApiName to set
         * @param listViewApiName listViewApiName to set
         * @param listViewId listViewId to set
         * @returns the current object, to allow method chaining
         */setListReference(objectApiName,listViewApiName,listViewId){if(listViewId||objectApiName&&listViewApiName){this._objectApiName=objectApiName;this._listViewApiName=listViewApiName;this._listViewId=listViewId;}else{throw new TypeError(`Either objectApiName (${objectApiName}) AND listViewApiName (${String(listViewApiName)}) or listViewId (${listViewId}) must be set`);}return this;}/**
         * Sets the fields for this list-ui cache key based on an existing list-ui
         * cache key.
         *
         * @param cacheKey list-ui cacheKey
         * @returns the current object, to allow method chaining
         */setListUiCacheKey(listUiCacheKey){const pieces=listUiCacheKey.key.split(KEY_DELIM);this._objectApiName=pieces[0]||undefined;this._listViewApiName=_stringToListViewApiName(pieces[1]);this._listViewId=pieces[2]||undefined;this._pageToken=pieces[3]||undefined;this._pageSize=pieces[4]?parseInt(pieces[4],10):DEFAULT_LIST_RECORDS_PAGE_SIZE;this._sortBy=pieces[5]||undefined;this._fields=_stringToList(pieces[6]);this._optionalFields=_stringToList(pieces[7]);return this;}/**
         * Builds the cache key for a list-ui.
         *
         * @returns a new cache key for a list-ui
         */build(){return {type:LIST_UI_VALUE_TYPE,key:`${this._objectApiName||""}${KEY_DELIM}${this._listViewApiName?this._listViewApiName.toString():""}${KEY_DELIM}${this._listViewId||""}${KEY_DELIM}${_nullish(this._pageToken)?DEFAULT_PAGE_TOKEN:this._pageToken}${KEY_DELIM}${this._pageSize}${KEY_DELIM}${this._sortBy||""}${KEY_DELIM}${_listToString(this._fields,"fields")}${KEY_DELIM}${_listToString(this._optionalFields,"optionalFields")}`};}}/**
     * Constructs a cache key for a list collection.
     */class ListCollectionCacheKeyBuilder{/**
         * Returns the objectApiName associated with the list collection.
         *
         * @returns objectApiName associated with the list collection
         */get objectApiName(){return this._objectApiName;}/**
         * Sets the objectApiName of the list collection.
         *
         * @param objectApiName objectApiName associated with the list collection
         */set objectApiName(objectApiName){this._objectApiName=objectApiName;}/**
         * Sets the objectApiName of the list collection.
         *
         * @param objectApiName objectApiName associated with the list collection
         * @returns the current object, to allow method chaining
         */setObjectApiName(objectApiName){this._objectApiName=objectApiName;return this;}/**
         * Returns the pageSize associated with the list collection.
         *
         * @returns pageSize associated with the list collection
         */get pageSize(){return this._pageSize;}/**
         * Sets the pageSize for the list collection.
         *
         * @param pagSize pageSize for the list collection
         */set pageSize(pageSize){this._pageSize=pageSize;}/**
         * Sets the pageSize for the list collection.
         *
         * @param pagSize pageSize for the list collection
         * @returns the current object, to allow method chaining
         */setPageSize(pageSize){this._pageSize=pageSize;return this;}/**
         * Returns the pageToken associated with the list collection.
         *
         * @returns pageToken associated with the list collection
         */get pageToken(){return this._pageToken;}/**
         * Sets the pageToken for the list collection.
         *
         * @param pagToken pageToken for the list collection
         */set pageToken(pageToken){this._pageToken=pageToken;}/**
         * Sets the pageToken for the list collection.
         *
         * @param pagToken pageToken for the list collection
         * @returns the current object, to allow method chaining
         */setPageToken(pageToken){this._pageToken=pageToken;return this;}/**
         * Returns the query associated with the list collection.
         *
         * @returns query associated with the list collection
         */get q(){return this._q;}/**
         * Sets the query for the list collection.
         *
         * @param q query for the list collection
         */set q(q){this._q=q;}/**
         * Sets the query for the list collection.
         *
         * @param q query for the list collection
         * @returns the current object, to allow method chaining
         */setQ(q){this._q=q;return this;}/**
         * Copies an existing list collection cache key.
         * Note that by default we do NOT copy pageSize as we don't want it when
         * searching for cached list views.
         *
         * @param cacheKey existing list collection cache key
         * @param copyPageSize if truthy, copy pageSize; otherwise set pageSize of this
         *   cache key to undefined
         * @returns the current object, to allow method chaining
         */setListCollectionCacheKey(cacheKey,copyPageSize=false){// TODO - should we assert cacheKey is LIST_VIEWS_VALUE_TYPE?
    const pieces=cacheKey.key.split(KEY_DELIM);this._objectApiName=pieces[0];this._pageToken=pieces[1];this._pageSize=copyPageSize&&pieces[2]?parseInt(pieces[2],10):undefined;this._q=pieces[3]||undefined;return this;}/**
         * Builds the cache key for a list collection.
         *
         * @returns a new cache key for a list collection
         */build(){return {type:LIST_VIEWS_VALUE_TYPE,key:`${this._objectApiName}${KEY_DELIM}${_nullish(this._pageToken)?DEFAULT_PAGE_TOKEN:this._pageToken}${KEY_DELIM}${this._pageSize||""}${KEY_DELIM}${this._q||""}`};}}/**
     * Cache utilities that deal with list-ui, list-info, and list-records
     * data in the LDS cache.
     */ // fetch functions
    /**
     * Fetches a list collection from the server.
     *
     * @param cacheKey cache key for the list collection to be retrieved
     * @param pageSize pageSize for the list collection
     * @return raw list collection data
     */function fetchListCollection(cacheKey,pageSize){const listCollectionCacheKeyBuilder=new ListCollectionCacheKeyBuilder().setListCollectionCacheKey(cacheKey);const params={objectApiName:listCollectionCacheKeyBuilder.objectApiName,pageToken:listCollectionCacheKeyBuilder.pageToken,pageSize,q:listCollectionCacheKeyBuilder.q};if(params.pageToken===DEFAULT_PAGE_TOKEN){delete params.pageToken;}if(!params.q){delete params.q;}return executeAuraGlobalController("ListUiController.getListsByObjectName",params).then(response=>{if(response.status===200){return response.body;}throw response.statusText;});}/**
     * Fetches a list-records from the server.
     *
     * @param cacheKey cache key for the list-records to be retrieved
     * @param pageSize pageSize for the list-records
     * @return raw list-records, as returned by the server
     */function fetchListRecords(cacheKey,pageSize){const listRecordsCacheKeyBuilder=new ListRecordsCacheKeyBuilder().setListRecordsCacheKey(cacheKey);const params={pageToken:listRecordsCacheKeyBuilder.pageToken,pageSize,sortBy:listRecordsCacheKeyBuilder.sortBy,fields:listRecordsCacheKeyBuilder.fields,optionalFields:listRecordsCacheKeyBuilder.optionalFields};let method;if(listRecordsCacheKeyBuilder.listViewId){params.listViewId=listRecordsCacheKeyBuilder.listViewId;method="ListUiController.getListRecordsById";}else if(listRecordsCacheKeyBuilder.listViewApiName===MRU){params.objectApiName=listRecordsCacheKeyBuilder.objectApiName;method="MruListUiController.getMruListRecords";}else{params.objectApiName=listRecordsCacheKeyBuilder.objectApiName;params.listViewApiName=listRecordsCacheKeyBuilder.listViewApiName;method="ListUiController.getListRecordsByName";}if(!params.fields){delete params.fields;}if(!params.optionalFields){delete params.optionalFields;}if(params.pageToken===DEFAULT_PAGE_TOKEN){delete params.pageToken;}if(!params.sortBy){delete params.sortBy;}return executeAuraGlobalController(method,params).then(response=>{if(response.status===200){return response.body;}throw response.statusText;});}/**
     * Fetches a list-ui from the server.
     *
     * @param cacheKey cache key for list-ui to be retrieved
     * @return raw list-ui, as returned by the server
     */function fetchListUi(cacheKey){const listUiCacheKeyBuilder=new ListUiCacheKeyBuilder().setListUiCacheKey(cacheKey);const params={pageToken:listUiCacheKeyBuilder.pageToken,pageSize:listUiCacheKeyBuilder.pageSize,sortBy:listUiCacheKeyBuilder.sortBy,fields:listUiCacheKeyBuilder.fields,optionalFields:listUiCacheKeyBuilder.optionalFields};let method;if(listUiCacheKeyBuilder.listViewId){params.listViewId=listUiCacheKeyBuilder.listViewId;method="ListUiController.getListUiById";}else if(listUiCacheKeyBuilder.listViewApiName===MRU){params.objectApiName=listUiCacheKeyBuilder.objectApiName;method="MruListUiController.getMruListUi";}else{params.objectApiName=listUiCacheKeyBuilder.objectApiName;params.listViewApiName=listUiCacheKeyBuilder.listViewApiName;method="ListUiController.getListUiByName";}if(!params.fields){delete params.fields;}if(!params.optionalFields){delete params.optionalFields;}if(params.pageToken===DEFAULT_PAGE_TOKEN){delete params.pageToken;}if(!params.sortBy){delete params.sortBy;}return executeAuraGlobalController(method,params).then(response=>{if(response.status===200){return response.body;}throw response.statusText;});}// pageToken functions
    /**
     * Converts a record offset to the corresponding pageToken.
     *
     * @param offset offset
     * @returns pageToken
     */function offsetToPageToken(offset){return String(offset);}/**
     * Returns the pageTokens and urls for a given pageToken/pageSize.
     *
     * @param pageToken page token
     * @param pageSize page size
     * @param endOfData true-ish if this is the end of the data
     * @param sampleUrl sample url to use as a pattern for constructing returned urls
     * @return (current|previous|next)Page(Token|Url)
     */function pageTokensAndUrls(pageToken,pageSize,endOfData,sampleUrl){const offset=pageTokenToOffset(pageToken);const previousOffset=offset===0?null:Math.max(offset-pageSize,0);const nextOffset=endOfData?null:offset+pageSize;const urlFor=(_offset,size)=>{return _offset===null?null:sampleUrl.replace(/([&?]pageToken=)[^&+]/,`$1${offsetToPageToken(_offset)}`).replace(/([&?]pageSize=)\d+/,`$1${size}`);};return {currentPageToken:pageToken||offsetToPageToken(offset),currentPageUrl:urlFor(offset,pageSize),previousPageToken:previousOffset===null?null:offsetToPageToken(previousOffset),previousPageUrl:urlFor(previousOffset,pageSize),nextPageToken:nextOffset===null?null:offsetToPageToken(nextOffset),nextPageUrl:urlFor(nextOffset,pageSize)};}/**
     * Parses a pageToken and returns the corresponding record offset.
     *
     * @param pageToken page token
     * @return record offset associated with the pageToken
     */function pageTokenToOffset(pageToken){return parseInt(pageToken||DEFAULT_PAGE_TOKEN,10);}// chunk functions
    /**
     * Returns the pageTokens for the chunks that encompass the specified pageToken
     * and pageSize.
     *
     * @param pageToken page token
     * @param pageSize page size
     * @param chunkSize chunk size
     * @return pageTokens for the chunks, offset of original pageToken within the first chunk
     */function chunkPageTokensFor(pageToken,pageSize,chunkSize){let offset;[pageToken,pageSize,offset]=snapToChunkBoundaries(pageToken,pageSize,chunkSize);const pageTokens=[];while(pageSize>0){pageTokens.push(pageToken);pageSize-=chunkSize;pageToken=offsetToPageToken(pageTokenToOffset(pageToken)+chunkSize);}return [pageTokens,offset];}/**
     * Adjusts a pageToken & pageSize so that both are aligned on cache chunk
     * boundaries.
     *
     * @param pageToken initial pageToken
     * @param pageSize initial pageSize
     * @param chunkSize chunk size
     * @return adjusted pageToken, adjusted pageSize, offset of new pageToken relative to old pageToken
     */function snapToChunkBoundaries(pageToken,pageSize,chunkSize){const offset=pageTokenToOffset(pageToken);// round pageToken down to the nearest chunk boundary
    const offsetAdjustment=offset%chunkSize;// round pageSize up to the nearest chunk boundary
    pageSize=chunkSize*Math.ceil((pageSize+offsetAdjustment)/chunkSize);return [offsetToPageToken(offset-offsetAdjustment),pageSize,offsetAdjustment];}/**
     */class ListUiCacheUtils{constructor(cacheAccessor,{chunkSize,ttl}){this.cacheAccessor=cacheAccessor;this.chunkSize=chunkSize;this.ttl=ttl;}/**
         * Locates as many list collections as possible from the LDS cache for the specified
         * cache key and returns the associated ValueWrappers for them.
         *
         * @param listCollectionCacheKey CacheKey that describes the list views to be retrieved
         * @return ValueWrapper[] for the list views found in the cache, the CacheKeys for those
         *    ValueWrappers, and the offset of the first list view within ValueWrapper[0]. Note
         *    that the ValueWrapper array may contain undefined and/or expired entries.
         */collectCachedLists(listCollectionCacheKey){const listCollectionCacheKeyBuilder=new ListCollectionCacheKeyBuilder().setListCollectionCacheKey(listCollectionCacheKey,true);const[pageTokens,offset]=chunkPageTokensFor(listCollectionCacheKeyBuilder.pageToken,listCollectionCacheKeyBuilder.pageSize,this.chunkSize);// we don't want a pageSize in the constituent keys
    listCollectionCacheKeyBuilder.setPageSize(undefined);const listCollectionCacheKeys=pageTokens.map(pageToken=>listCollectionCacheKeyBuilder.setPageToken(pageToken).build());const valueWrappers=listCollectionCacheKeys.map(cacheKey=>this.cacheAccessor.get(cacheKey));return [valueWrappers,listCollectionCacheKeys,offset];}/**
         * Locates as many list-records as possible from the LDS cache for the specified list-ui
         * and returns the associated ValueWrappers for them.
         *
         * @param listUiCacheKey CacheKey that describes the records to be retrieved
         * @return ValueWrapper[] for the list-records found in the cache, the CacheKeys for those
         *    ValueWrappers, and the offset of the first record within ValueWrapper[0]. Note
         *    that the ValueWrapper array may contain undefined and/or expired entries.
         */collectCachedRecords(listUiCacheKey){const listUiCacheKeyBuilder=new ListUiCacheKeyBuilder().setListUiCacheKey(listUiCacheKey);const[pageTokens,offset]=chunkPageTokensFor(listUiCacheKeyBuilder.pageToken,listUiCacheKeyBuilder.pageSize,this.chunkSize);const listRecordsCacheKeyBuilder=new ListRecordsCacheKeyBuilder().setListUiCacheKey(listUiCacheKey);const listRecordsCacheKeys=pageTokens.map(pageToken=>listRecordsCacheKeyBuilder.setPageToken(pageToken).build());const listRecordsValueWrappers=listRecordsCacheKeys.map(listRecordsCacheKey=>this.cacheAccessor.get(listRecordsCacheKey));return [listRecordsValueWrappers,listRecordsCacheKeys,offset];}/**
         * Fabricates a list collection from its pieces.
         *
         * @param listCollectionValueWrappers ValueWrappers contianing the list data
         * @param offset offset of the first list view within the first list-collection
         * @param listCollectionCacheKey CacheKey for the list-collection
         * @return the assembled list collection
         */constructListCollection(listCollectionValueWrappers,offset,listCollectionCacheKey){const listCollectionCacheKeyBuilder=new ListCollectionCacheKeyBuilder().setListCollectionCacheKey(listCollectionCacheKey,true);// assemble the list data
    let remaining=listCollectionCacheKeyBuilder.pageSize;let endOfData=true;const lists=[].concat(...listCollectionValueWrappers.map(listCollectionValueWrapper=>{const listCollection=listCollectionValueWrapper.value;const count=Math.min(listCollection.lists.length-offset,remaining);const listData=listCollection.lists.slice(offset,offset+count);// we've reached the end of the data if we used all these records and there aren't any more
    endOfData=offset+count>=listCollection.lists.length&&!listCollection.nextPageToken;offset=0;remaining-=count;return listData;}));const samplePageUrl=listCollectionValueWrappers[0].value.currentPageUrl;const{currentPageToken,currentPageUrl,previousPageToken,previousPageUrl,nextPageToken,nextPageUrl}=pageTokensAndUrls(listCollectionCacheKeyBuilder.pageToken,listCollectionCacheKeyBuilder.pageSize,endOfData,samplePageUrl);// put everything together
    return {count:lists.length,lists,currentPageToken,currentPageUrl,previousPageToken,previousPageUrl,nextPageToken,nextPageUrl};}/**
         * Fabricates a list-ui from its pieces
         *
         * @param recordService The recordService instance.
         * @param listInfoValueWrapper the list-info
         * @param listRecordsValueWrappers the list-records
         * @param offset offset of the first record within the first list-records
         * @param listUiCacheKey CacheKey for the list-ui
         * @return the list-ui
         */constructListUi(recordService,listInfoValueWrapper,listRecordsValueWrappers,offset,listUiCacheKey){const listUiCacheKeyBuilder=new ListUiCacheKeyBuilder().setListUiCacheKey(listUiCacheKey);// start with a copy of the list-info
    const info=cloneDeepCopy(listInfoValueWrapper.value);// we're hiding etags from consumers
    delete info.eTag;// expand the markers back into records
    let remaining=listUiCacheKeyBuilder.pageSize;let endOfData=true;const records=listRecordsValueWrappers.map(valueWrapper=>{const listRecords=valueWrapper.value;const count=Math.min(listRecords.records.length-offset,remaining);const markers=listRecords.records.slice(offset,offset+count);// we've reached the end of the data if we used all these records and there aren't any more
    endOfData=offset+count>=listRecords.records.length&&!listRecords.nextPageToken;offset=0;remaining-=count;return fromRecordMarkers(recordService,this.cacheAccessor,markers);});const{currentPageToken,currentPageUrl,previousPageToken,previousPageUrl,nextPageToken,nextPageUrl}=pageTokensAndUrls(listUiCacheKeyBuilder.pageToken,listUiCacheKeyBuilder.pageSize,endOfData,listRecordsValueWrappers[0].value.currentPageUrl);// add the records to the list-ui
    const listUi={info,records:{count:0,currentPageToken,currentPageUrl,previousPageToken,previousPageUrl,nextPageToken,nextPageUrl,records:[].concat(...records)}};listUi.records.count=listUi.records.records.length;return listUi;}/**
         * Indicates if a ValueWrapper from the LDS cache is expired.
         *
         * @param valueWrapper value from the LDS cache to be checked
         * @param ttl maximum age, in millisecondss; if a ttl <= 0 is specified the ttl check is skipped
         * @return truthy if value is expired; falsy if not
         */expired(valueWrapper,ttl=this.ttl){return !valueWrapper||valueWrapper.value===undefined||!valueWrapper.extraInfoObject||ttl>0&&this.cacheAccessor.nowTime>valueWrapper.extraInfoObject.serverFetchTime+ttl;}/**
         * Fetches list views from the server and stagePuts the data. Note that this method
         * adjusts the starting pageToken and pageSize so that complete chunks of list views are
         * retrieved.
         *
         * @param listCollectionCacheKey CacheKey describing the list views to be retrieved
         * @param pageSize number of list views to be retrieved
         * @return list-collection ValueWrappers, CacheKeys, offset of the first list view within the
         *    first ValueWrapper
         */fetchAndStagePutListCollection(listCollectionCacheKey,pageSize){const listCollectionCacheKeyBuilder=new ListCollectionCacheKeyBuilder().setListCollectionCacheKey(listCollectionCacheKey);// adjust pageToken & pageSize so that we ask for full chunks of records
    let offset;[listCollectionCacheKeyBuilder.pageToken,pageSize,offset]=snapToChunkBoundaries(listCollectionCacheKeyBuilder.pageToken,pageSize,this.chunkSize);offset+=0;// eslint is retarded
    listCollectionCacheKey=listCollectionCacheKeyBuilder.build();return fetchListCollection(listCollectionCacheKey,pageSize).then(listCollection=>{return this.stagePutListCollections(listCollectionCacheKey,listCollection);}).then(([listCollectionValueWrappers,listCollectionCacheKeys])=>{// type inference thinks this is any[] - need to be explicit
    return [listCollectionValueWrappers,listCollectionCacheKeys,offset];});}/**
         * Fetches a list-records from the server and stagePuts its data. Note that this method
         * adjusts the starting pageToken and pageSize so that complete chunks of records are
         * retrieved.
         *
         * @param recordService Reference to RecordService for stage putting records
         * @param listRecordsCacheKey CacheKey describing the records to be retrieved
         * @param pageSize number of records to be retrieved
         * @return list-records ValueWrappers, list-records CacheKeys, offset of the first record
         *    within the first ValueWrapper
         */fetchAndStagePutListRecords(recordService,listRecordsCacheKey,pageSize){const listRecordsCacheKeyBuilder=new ListRecordsCacheKeyBuilder().setListRecordsCacheKey(listRecordsCacheKey);// adjust pageToken & pageSize so that we ask for full chunks of records
    let offset;[listRecordsCacheKeyBuilder.pageToken,pageSize,offset]=snapToChunkBoundaries(listRecordsCacheKeyBuilder.pageToken,pageSize,this.chunkSize);listRecordsCacheKey=listRecordsCacheKeyBuilder.build();return fetchListRecords(listRecordsCacheKey,pageSize).then(listRecords=>{// split the records into chunks & add them to the LDS cache
    // note that we make an assumption here that these will not be the only list-records
    // in the cache so we don't need to force a stagePut - this is true most of the time
    // but can break in certain edge-case scenarios, e.g. the list-records from a previous
    // list-ui have expired but the list-info hasn't, or someone previously requested a
    // list-ui with 0 records
    return this.stagePutListRecords(recordService,listRecordsCacheKey,listRecords,false);}).then(([listRecordsValueWrappers,listRecordsCacheKeys])=>{// type inference thinks this is any[] - need to be explicit
    return [listRecordsValueWrappers,listRecordsCacheKeys,offset];});}/**
         * Fetches a list-ui from the server and stagePuts its constituent pieces.
         * Note that the list-ui itself is discarded.
         *
         * @param recordService Reference to RecordService for stage putting records.
         * @param listUiCacheKey CacheKey of the list-ui to be retrieved
         * @return list-info ValueWrapper, list-records ValueWrappers, list-records CacheKeys, offset
         *    of first record within first ValueWrapper
         */fetchAndStagePutListUi(recordService,listUiCacheKey){const listUiCacheKeyBuilder=new ListUiCacheKeyBuilder().setListUiCacheKey(listUiCacheKey);// adjust pageToken & pageSize so that we ask for full chunks of records
    let offset;[listUiCacheKeyBuilder.pageToken,listUiCacheKeyBuilder.pageSize,offset]=snapToChunkBoundaries(listUiCacheKeyBuilder.pageToken,listUiCacheKeyBuilder.pageSize,this.chunkSize);offset+=0;// eslint is retarded
    listUiCacheKey=listUiCacheKeyBuilder.build();return fetchListUi(listUiCacheKey).then(listUi=>{// extract and cache the list-ui
    const listInfoCacheKey=new ListInfoCacheKeyBuilder().setListUiCacheKey(listUiCacheKey).build();const listInfoValueWrapper=this.cacheAccessor.newValueWrapper(listUi.info,listUi.info.eTag,{serverFetchTime:this.cacheAccessor.nowTime});this.cacheAccessor.stagePut([],listInfoCacheKey,listInfoValueWrapper,listUi.info);// split the list-records into chunks and add them to the cache
    const listRecordsCacheKey=new ListRecordsCacheKeyBuilder().setListUiCacheKey(listUiCacheKey).build();// note that if we've fetched a list-ui, this are almost certainly the only records
    // in the cache so we force a stagePut
    // nested then's are gross, but this one is needed for scope
    const[listRecordsValueWrappers,listRecordsCacheKeys]=this.stagePutListRecords(recordService,listRecordsCacheKey,listUi.records,true);// note that we do NOT cache the list-ui itself since it doesn't contain any interesting data;
    // we'll just construct a new list-ui from the cached list-info and list-records when we need it
    // type inference thinks this is any[] - need to be explicit
    return [listInfoValueWrapper,listRecordsValueWrappers,listRecordsCacheKeys,offset];});}/**
         * Computes the effective server fetch time for a constructed list artifact,
         * stagePuts it to the LDS cache, and sets up the LDS cache dependencies for it.
         *
         * @param artifactCacheKey CacheKey for the list artifact
         * @param artifact the data to be stored in the cache
         * @param valueWrappers the ValueWrappers that were used to construct the artifact; used to
         *    compute the effective fetch time
         * @param cacheKeys CacheKeys on which the artifact depends
         */stagePutListArtifact(artifactCacheKey,artifact,valueWrappers,cacheKeys){const oldestFetchTime=valueWrappers.reduce((oldest,valueWrapper)=>{const serverFetchTime=valueWrapper.extraInfoObject?valueWrapper.extraInfoObject.serverFetchTime:oldest;return Math.min(oldest,serverFetchTime);},this.cacheAccessor.nowTime);// Need to save the artifact cache key so that the denormalizeValue method on the service class has enough info to denormalize a list ui from a list ui artifact (normalized).
    const artifactValueWrapper=this.cacheAccessor.newValueWrapper({cacheKey:artifactCacheKey},undefined,{serverFetchTime:oldestFetchTime});this.cacheAccessor.stagePut([],artifactCacheKey,artifactValueWrapper,artifact);cacheKeys.forEach(cacheKey=>this.cacheAccessor.stageDependencies([{cacheKey:artifactCacheKey,type:1/* REQUIRED */}],cacheKey));}/**
         * Breaks a collection of list views into chunks and stagePuts them to the
         * LDS cache.
         *
         * @param listCollectionCacheKey CacheKey for the list collection
         * @param listCollection list collection as returned from the UI API
         * @return ValueWrappers and associated CacheKeys used to stagePut the list views
         */stagePutListCollections(listCollectionCacheKey,listCollection){const offset=pageTokenToOffset(listCollection.currentPageToken);{assert$1(offset%this.chunkSize===0,"list-collection must start on a chunk boundary");}const chunkCacheKeyBuilder=new ListCollectionCacheKeyBuilder().setListCollectionCacheKey(listCollectionCacheKey);const valueWrappers=[];const cacheKeys=[];// always stagePut at least one list collection, even if it is empty; this
    // is necessary to correctly keep track of collections with no lists
    let forceStagePut=true;for(let i=0;i<listCollection.count||forceStagePut;i+=this.chunkSize){// only force one stagePut
    forceStagePut=false;const chunkCacheKey=chunkCacheKeyBuilder.setPageToken(offsetToPageToken(offset+i)).build();const lists=listCollection.lists.slice(i,i+this.chunkSize);const chunkListCollection={// we'll use this url as a template for constructing urls to return to our callers - the
    // pageToken and pageSize values will be replaced so it's not important that they're correct
    currentPageUrl:listCollection.currentPageUrl,// used both to mark the end of the data & when fetching more records
    nextPageToken:i+this.chunkSize>=listCollection.count?listCollection.nextPageToken:offsetToPageToken(offset+i+this.chunkSize),lists,count:lists.length};const chunkValueWrapper=this.cacheAccessor.newValueWrapper(chunkListCollection,undefined,{serverFetchTime:this.cacheAccessor.nowTime});this.cacheAccessor.stagePut([],chunkCacheKey,chunkValueWrapper,chunkListCollection);valueWrappers.push(chunkValueWrapper);cacheKeys.push(chunkCacheKey);}// type inference doesn't do what we want here - need to be explicit
    return Thenable.resolve([valueWrappers,cacheKeys]);}/**
         * stagePuts a list-records
         *
         * @param recordService Reference to RecordService used for stage putting records.
         * @param listRecordsCacheKey CacheKey for the list-records
         * @param listRecords list-records data
         * @param forceStagePut if true always stagePut a list-records, even if it is empty; this is necessary
         *    to correctly keep track of lists with no records
         * @return ValueWrappers and associated CacheKeys used to stagePut the list-records
         */stagePutListRecords(recordService,listRecordsCacheKey,listRecords,forceStagePut){const offset=pageTokenToOffset(listRecords.currentPageToken);{assert$1(offset%this.chunkSize===0,"list-records must start on a chunk boundary");}const chunkCacheKeyBuilder=new ListRecordsCacheKeyBuilder().setListRecordsCacheKey(listRecordsCacheKey);const valueWrappers=[];const cacheKeys=[];for(let i=0;i<listRecords.count||forceStagePut;i+=this.chunkSize){// only force one stagePut
    forceStagePut=false;const records=listRecords.records.slice(i,i+this.chunkSize);const chunkCacheKey=chunkCacheKeyBuilder.setPageToken(offsetToPageToken(offset+i)).build();// clear any dependencies from this chunk to previous records
    this.cacheAccessor.stageClearDependencies(chunkCacheKey);// lds-records owns record data, so let them merge our record data with whatever they already have
    recordService.mergeRecordsAndStagePuts([{cacheKey:chunkCacheKey,type:1/* REQUIRED */}],records,this.cacheAccessor,true);const chunkListRecords={// we need the etag to match up later
    listInfoETag:listRecords.listInfoETag,// we'll use this url as a template for constructing urls to return to our callers - the
    // pageToken and pageSize values will be replaced so it's not important that they're correct
    currentPageUrl:listRecords.currentPageUrl,// used both to mark the end of the data & when fetching more records
    nextPageToken:i+this.chunkSize>=listRecords.count?listRecords.nextPageToken:offsetToPageToken(offset+i+this.chunkSize),// defer to lds-records for record data when this is pulled back out of the cache
    records:records.map(record=>toRecordMarker(this.cacheAccessor,record,0))};const chunkValueWrapper=this.cacheAccessor.newValueWrapper(chunkListRecords,undefined,{serverFetchTime:this.cacheAccessor.nowTime});this.cacheAccessor.stagePut([],chunkCacheKey,chunkValueWrapper,chunkListRecords);valueWrappers.push(chunkValueWrapper);cacheKeys.push(chunkCacheKey);}// type inference doesn't do what we want here - need to be explicit
    return [valueWrappers,cacheKeys];}}/**
     * Provider function for list-uis.
     *
     * @param cacheAccessor accessor to get to the LDS cache
     * @param parameters parameters indicating what value is to be returned;
     * @returns provide result
     */function provide(cacheAccessor,parameters){const cacheUtils=new ListUiCacheUtils(cacheAccessor,{chunkSize:parameters.chunkSize,ttl:parameters.ttl});const listUiValueWrapper=cacheAccessor.get(parameters.listUiCacheKey);// if we already have a value & it's not expired then we're done
    if(!cacheUtils.expired(listUiValueWrapper,parameters.ttl)){return Thenable.resolve(1/* CACHE_HIT */);}// cache value was missing or too old, see which pieces we do have
    let valueWrappers;let cacheKeys;// see if we have the list-info
    const listInfoCacheKey=new ListInfoCacheKeyBuilder().setListUiCacheKey(parameters.listUiCacheKey).build();const listInfoValueWrapper=cacheAccessor.get(listInfoCacheKey);let resultThenable;if(cacheUtils.expired(listInfoValueWrapper)){resultThenable=cacheUtils.fetchAndStagePutListUi(parameters.recordService,parameters.listUiCacheKey);}else{const[listRecordsValueWrappers,listRecordsCacheKeys,offset]=cacheUtils.collectCachedRecords(parameters.listUiCacheKey);// toss out all the list-records at or past the first expired one
    const firstExpired=listRecordsValueWrappers.findIndex(valueWrapper=>cacheUtils.expired(valueWrapper));if(firstExpired>=0){listRecordsValueWrappers.splice(firstExpired);listRecordsCacheKeys.splice(firstExpired);}// If any of the list-records don't match the list-info then just reload everything.
    // In theory it might be possible to save/reuse some of the list-records, but this
    // should be rare & the logic would be complex.
    if(listRecordsValueWrappers.find(valueWrapper=>{return valueWrapper.value.listInfoETag!==listInfoValueWrapper.value.eTag;})){resultThenable=cacheUtils.fetchAndStagePutListUi(parameters.recordService,parameters.listUiCacheKey);}else{const listUiCacheKeyBuilder=new ListUiCacheKeyBuilder().setListUiCacheKey(parameters.listUiCacheKey);// see how many records we found
    let recordsFound=listRecordsValueWrappers.reduce((sum,valueWrapper)=>sum+valueWrapper.value.records.length,0);if(listRecordsValueWrappers.length>0){recordsFound-=offset;}// if we found enough records or hit the end of the data then we're done
    if(recordsFound>=listUiCacheKeyBuilder.pageSize||listRecordsValueWrappers.length>0&&!listRecordsValueWrappers[listRecordsValueWrappers.length-1].value.nextPageToken){// type inference doesn't do what we want here - need to be explicit
    resultThenable=Thenable.resolve([listInfoValueWrapper,listRecordsValueWrappers,listRecordsCacheKeys,offset]);}else{// fetch the missing records
    let pageTokenToFetch;if(listRecordsValueWrappers.length>0){// we want to fetch the nextPageToken from the last chunk of records we got
    pageTokenToFetch=listRecordsValueWrappers[listRecordsValueWrappers.length-1].value.nextPageToken;}else{// if no records were found, use the caller-supplied pageToken
    pageTokenToFetch=listUiCacheKeyBuilder.pageToken;}// TODO - pageTokenToFetch is of type string|null|undefined whereas setPageToken() requires string|undefined
    const listRecordsCacheKey=new ListRecordsCacheKeyBuilder().setListUiCacheKey(parameters.listUiCacheKey).setPageToken(pageTokenToFetch).build();// fetch the remainder of the records from the server
    resultThenable=cacheUtils.fetchAndStagePutListRecords(parameters.recordService,listRecordsCacheKey,listUiCacheKeyBuilder.pageSize-recordsFound).then(([fetchedListRecordsValueWrappers,fetchedListRecordsCacheKeys,fetchedOffset])=>{{// TODO - seems like there might be cases where this could be non-0 if we used the caller's pageToken above?
    assert$1(fetchedOffset===0,"unexpected offset returned from fetching records");}// If any of the list-records don't match the list-info then just reload everything.
    // In theory it might be possible to save/reuse some of the list-records, but this
    // should be rare & the logic would be complex.
    if(fetchedListRecordsValueWrappers.find(valueWrapper=>{return valueWrapper.value.listInfoETag!==listInfoValueWrapper.value.eTag;})){return cacheUtils.fetchAndStagePutListUi(parameters.recordService,parameters.listUiCacheKey);}// type inference doesn't do what we want here - need to be explicit
    return [listInfoValueWrapper,[...listRecordsValueWrappers,...fetchedListRecordsValueWrappers],[...listRecordsCacheKeys,...fetchedListRecordsCacheKeys],offset];});}}}return resultThenable.then(([listInfoValueWrapper2,listRecordsValueWrappers,listRecordsCacheKeys,offset])=>{// save the ValueWrappers and CacheKeys for the next step
    valueWrappers=[listInfoValueWrapper2,...listRecordsValueWrappers];cacheKeys=[listInfoCacheKey,...listRecordsCacheKeys];// assemble the pieces back into a list-ui
    const listUi=cacheUtils.constructListUi(parameters.recordService,listInfoValueWrapper2,listRecordsValueWrappers,offset,parameters.listUiCacheKey);cacheUtils.stagePutListArtifact(parameters.listUiCacheKey,listUi,valueWrappers,cacheKeys);const affectedKeys=cacheAccessor.commitPuts();parameters.ldsCache.handleAffectedKeys(affectedKeys,cacheAccessor);return 2/* CACHE_MISS */;});}/**
     * Indicates if two list-ui ValueProviders are equivalent.
     *
     * @param otherValueProvider ValueProvider
     * @return true if the two ValueProviders are equivalent; false if not
     */function equals(otherValueProvider){// ValueProviders are equivalent if they have the same parameters
    const p1=this.parameters;const p2=otherValueProvider.parameters;// check if same number of keys & all keys equal
    return Object.keys(p1).length===Object.keys(p2).length&&Object.keys(p1).every(key=>p1[key]===p2[key]);}/**
     * Provider function for list-uis collections.
     *
     * @param cacheAccessor accessor to get to the LDS cache
     * @param parameters parameters indicating what value is to be returned;
     * @returns provide result
     */function provide$1(cacheAccessor,parameters){const cacheUtils=new ListUiCacheUtils(cacheAccessor,{chunkSize:parameters.chunkSize,ttl:parameters.ttl});const listCollectionValueWrapper=cacheAccessor.get(parameters.listCollectionCacheKey);// if we already have a value & it's not expired then we're done
    if(!cacheUtils.expired(listCollectionValueWrapper,parameters.ttl)){return Thenable.resolve(1/* CACHE_HIT */);}// cache value was missing or too old, see which pieces we do have
    let valueWrappers;let cacheKeys;let resultThenable;const[listCollectionValueWrappers,listCollectionCacheKeys,offset]=cacheUtils.collectCachedLists(parameters.listCollectionCacheKey);// toss out all the list-collections at or past the first expired one
    const firstExpired=listCollectionValueWrappers.findIndex(valueWrapper=>cacheUtils.expired(valueWrapper));if(firstExpired>=0){listCollectionValueWrappers.splice(firstExpired);listCollectionCacheKeys.splice(firstExpired);}// from here on out, all ValueWrappers exist and have values or, stated more cleverly:
    // assert(listCollectionValueWrappers.every(vw => vw && vw.value))
    const listCollectionCacheKeyBuilder=new ListCollectionCacheKeyBuilder().setListCollectionCacheKey(parameters.listCollectionCacheKey,true);// see how many lists we found
    let listsFound=listCollectionValueWrappers.reduce((sum,valueWrapper)=>sum+valueWrapper.value.count,0);if(listCollectionValueWrappers.length>0){listsFound-=offset;}// if we found enough lists or hit the end of the data then we're done
    if(listCollectionCacheKeyBuilder.pageSize&&listsFound>=listCollectionCacheKeyBuilder.pageSize||listCollectionValueWrappers.length>0&&!listCollectionValueWrappers[listCollectionValueWrappers.length-1].value.nextPageToken){// type inference here doesn't match the type inference for the next then() therefore I need to be explicit
    resultThenable=Thenable.resolve([listCollectionValueWrappers,listCollectionCacheKeys,offset]);}else{// fetch the missing lists
    let pageTokenToFetch;if(listCollectionValueWrappers.length>0){// we want to fetch the nextPageToken from the last chunk of list views we got
    pageTokenToFetch=listCollectionValueWrappers[listCollectionValueWrappers.length-1].value.nextPageToken;}else{// if no list views were found, use the caller-supplied pageToken
    pageTokenToFetch=listCollectionCacheKeyBuilder.pageToken;}// TODO - pageTokenToFetch is of type string|null|undefined whereas setPageToken() requires string|undefined
    const listCollectionCacheKey=new ListCollectionCacheKeyBuilder().setListCollectionCacheKey(parameters.listCollectionCacheKey).setPageToken(pageTokenToFetch).build();const pageSize=listCollectionCacheKeyBuilder.pageSize?listCollectionCacheKeyBuilder.pageSize-listsFound:DEFAULT_LIST_COLLECTION_PAGE_SIZE;// fetch the remainder of the lists from the server
    resultThenable=cacheUtils.fetchAndStagePutListCollection(listCollectionCacheKey,pageSize).then(([fetchedListCollectionValueWrappers,fetchedListCollectionCacheKeys,_fetchedOffset])=>{// type inference here doesn't match the type inference for the next then() therefore I need to be explicit
    const result=[[...listCollectionValueWrappers,...fetchedListCollectionValueWrappers],[...listCollectionCacheKeys,...fetchedListCollectionCacheKeys],offset];return result;});}return resultThenable.then(([listCollectionValueWrappers2,listCollectionCacheKeys2,offset2])=>{// save the ValueWrappers and CacheKeys for the next step
    valueWrappers=listCollectionValueWrappers2;cacheKeys=listCollectionCacheKeys2;// assemble the pieces back into a list-ui
    const listCollection=cacheUtils.constructListCollection(listCollectionValueWrappers2,offset2,parameters.listCollectionCacheKey);cacheUtils.stagePutListArtifact(parameters.listCollectionCacheKey,listCollection,valueWrappers,cacheKeys);const affectedKeys=cacheAccessor.commitPuts();parameters.ldsCache.handleAffectedKeys(affectedKeys,cacheAccessor);return 2/* CACHE_MISS */;});}/**
     * Indicates if two list-ui ValueProviders are equivalent.
     *
     * @param otherValueProvider
     * @return true if the two ValueProviders are equivalent; false if not
     */function equals$1(otherValueProvider){// ValueProviders are equivalent if they have the same parameters
    const p1=this.parameters;const p2=otherValueProvider.parameters;// check if same number of keys & all keys equal
    return Object.keys(p1).length===Object.keys(p2).length&&Object.keys(p1).every(key=>p1[key]===p2[key]);}/*
     * Provides functionality to read list ui data from the cache. Can refresh the data from the server.
     */class ListUiService extends LdsServiceBase{/*
         * Constructor.
         *
         * @param ldsCache the LdsCache instance that backs this service
         */constructor(ldsCache){super(ldsCache,[LIST_UI_VALUE_TYPE,LIST_RECORDS_VALUE_TYPE,LIST_VIEWS_VALUE_TYPE,LIST_INFO_VALUE_TYPE]);/**
             *
             */this.listRecordsChunkSize=DEFAULT_LIST_RECORDS_CHUNK_SIZE;/**
             *
             */this.listCollectionChunkSize=DEFAULT_LIST_COLLECTION_CHUNK_SIZE;/**
             * TTL for cached list-ui data
             */this.listUiTTL=LIST_UI_TTL;}getCacheValueTtl(){return LIST_UI_TTL;}/**
         * Returns an observable for a list-ui constructed from the given inputs.
         *
         * @param objectApiName The API name of the List View's entity (must be specified along with listViewApiName)
         * @param listViewApiName List View API name (must be specified with objectApiName)
         * @param listViewId Id of the List View (may be specified without objectApiName or listViewApiName)
         * @param pageToken Page id of records to retrieve
         * @param pageSize Number of records to retrieve at once
         * @param sortBy A qualified field API name on which to sort
         * @param fields An array of qualified field API names of fields to include.
         * @param optionalFields An array of qualified field API names of optional fields to include.
         * @param q Query string to filter list views (only for list of lists)
         * @returns {Observable} See description.
         */getListUi(params){let cacheKey;let valueProvider;let fieldsAsStrings;let optionalFieldsAsStrings;let pageSize=params.pageSize;// convert importable schema to string
    const objectApiName=params.objectApiName&&getObjectApiName(params.objectApiName);const sortBy=params.sortBy&&getFieldApiName(params.sortBy);const listViewId=params.listViewId&&getObjectApiName(params.listViewId);if(params.fields){fieldsAsStrings=Array.isArray(params.fields)?params.fields.map(field=>getFieldApiName(field)):[];}if(params.optionalFields){optionalFieldsAsStrings=Array.isArray(params.optionalFields)?params.optionalFields.map(field=>getFieldApiName(field)):[];}// If we have a list id or an api and dev name then its a request for list-ui
    if(listViewId||objectApiName&&params.listViewApiName){if(pageSize==null){pageSize=DEFAULT_LIST_RECORDS_PAGE_SIZE;}cacheKey=new ListUiCacheKeyBuilder().setListReference(objectApiName,params.listViewApiName,listViewId).setPageToken(params.pageToken).setPageSize(pageSize).setSortBy(sortBy).setFields(fieldsAsStrings).setOptionalFields(optionalFieldsAsStrings).build();valueProvider=new ValueProvider(provide,{ldsCache:this._ldsCache,recordService:this._recordService,listUiCacheKey:cacheKey,ttl:LIST_UI_TTL,chunkSize:this.listRecordsChunkSize},equals);}else if(objectApiName){if(pageSize==null){pageSize=DEFAULT_LIST_COLLECTION_PAGE_SIZE;}cacheKey=new ListCollectionCacheKeyBuilder().setObjectApiName(objectApiName).setPageToken(params.pageToken).setPageSize(pageSize).setQ(params.q).build();valueProvider=new ValueProvider(provide$1,{ldsCache:this._ldsCache,listCollectionCacheKey:cacheKey,ttl:LIST_COLLECTION_TTL,chunkSize:this.listCollectionChunkSize},equals$1);}if(cacheKey&&valueProvider&&pageSize>0){return this._ldsCache.get(cacheKey,valueProvider);}return undefined;}/* Exposed function to consumers.
         * Allows to save a new sort order
         */async saveSort(objectApiName,listViewApiName,listViewId/* , newSortBy*/){// TODO: Doesn't save for now, only invalidates the right caches
    // TODO: We need to invalidate all caches that are without sortBy (in all variations)
    // newSortBy = newSortBy ? newSortBy : [];
    // newSortBy = Array.isArray(newSortBy) ? newSortBy : [newSortBy];
    const cacheKey=new ListUiCacheKeyBuilder().setListReference(getObjectApiName(objectApiName),listViewApiName,listViewId)// .setFields(fields)
    // .setOptionalFields(optionalFields)
    .build();return this._ldsCache.access().then(()=>{this._ldsCache.evict(cacheKey);});}/* Exposed function to consumers.
         * Allows to save column widths
         */async saveColumnWidths(objectApiName,listViewApiName,listViewId/* , columnWidthMapping*/){// TODO: Doesn't save for now, only invalidates the right caches
    // TODO: We need to invalidate all caches of that list id (in all variations)
    const cacheKey=new ListUiCacheKeyBuilder().setListReference(getObjectApiName(objectApiName),listViewApiName,listViewId)// .setFields(fields)
    // .setOptionalFields(optionalFields)
    .build();return this._ldsCache.access().then(()=>{this._ldsCache.evict(cacheKey);});}/**
         * TODO: When this service class gets refactored into multiple services and updated to typescript, this method needs to be implimented!
         * @param dependencies List of dependent cache keys.
         * @param value The value to cache.
         * @param cacheAccessor An object to access cache directly.
         * @returns A thenable which resolves when the stage put is completed.
         */stagePutValue(_dependencies,_value,_cacheAccessor){// TODO: Implement this!
    throw getLdsInternalError("UNSUPPORTED_OPERATION","Lists service does not implement stagePutValue",true);}/**
         * TODO: When this service class gets refactored into multiple services and updated to typescript, this method needs to be implimented!
         * Strips all eTag properties from the given value by directly deleting them.
         * @returns The given value with its eTags stripped.
         * @param value The value from which to strip the eTags.
         */stripETagsFromValue(value){return value;}/**
         * Affected Key handler. Whenever the list ui cache key is affected we need to denormalize what we have
         * in the cache and re-emit this to the consumer.
         *
         * For example: Since we chain together list-ui -> list-records -> records markers,
         * whenever a record changes from record home we will be notified of that change
         * and we need to denormalize our list-ui which will fetch the latest cached record
         * data using the saved record markers.
         * @returns The affected key handler for this service.
         */getAffectedKeyHandler(){return (affectedKey,cacheAccessor)=>{// TODO: Once this service is split into multiple services, the following check for the secondary types can be removed.
    // We don't want to handle affected keys for these secondary types.
    if(affectedKey.type===LIST_VIEWS_VALUE_TYPE||affectedKey.type===LIST_RECORDS_VALUE_TYPE||affectedKey.type===LIST_INFO_VALUE_TYPE){return;}const listUiValueWrapper=cacheAccessor.get(affectedKey);if(!listUiValueWrapper){return;}const cacheUtils=new ListUiCacheUtils(cacheAccessor,{chunkSize:this.listRecordsChunkSize,ttl:this.listUiTTL});// list-ui missing, ignore key
    if(cacheUtils.expired(listUiValueWrapper,0)){return;}const listUi=this.denormalizeValue(listUiValueWrapper.value,cacheAccessor);const listUiValueWrapperToEmit=cloneWithValueOverride(listUiValueWrapper,listUi);cacheAccessor.stageEmit(affectedKey,listUiValueWrapperToEmit);};}/**
         * Denormalizes the given normalizedListUi artifact and returns the result.
         * @param normalizedListUi The normalizedListUi to denormalize.
         * @param cacheAccessor Used to access the cache.
         * @returns The denormalized list ui.
         */denormalizeValue(normalizedListUi,cacheAccessor){const listUiCacheKey=normalizedListUi.cacheKey;const cacheUtils=new ListUiCacheUtils(cacheAccessor,{chunkSize:this.listRecordsChunkSize,ttl:this.listUiTTL});const listInfoCacheKey=new ListInfoCacheKeyBuilder().setListUiCacheKey(listUiCacheKey).build();const listInfoValueWrapper=cacheAccessor.get(listInfoCacheKey);if(!listInfoValueWrapper){throw getLdsInternalError("DENORMALIZE_FAILED","Could not find a listInfo for the corresponding key: "+listInfoCacheKey,true);}const[listRecordsValueWrappers/* listRecordsCacheKeys */,,offset]=cacheUtils.collectCachedRecords(listUiCacheKey);// toss out all the list-records at or past the first missing one (we can still use
    // expired values for this scenario)
    const firstMissing=listRecordsValueWrappers.findIndex(valueWrapper=>cacheUtils.expired(valueWrapper,0));if(firstMissing>=0){listRecordsValueWrappers.splice(firstMissing);}// from here on out, all ValueWrappers exist and have values or, stated more cleverly:
    // if ("development" !== 'production') {
    //     assert(listRecordsValueWrappers.every(lrvw => lrvw && lrvw.value))
    // }
    const listUiCacheKeyBuilder=new ListUiCacheKeyBuilder().setListUiCacheKey(listUiCacheKey);// we must either have all the records or have hit the end of the list to continue
    const recordsFound=listRecordsValueWrappers.reduce((sum,valueWrapper)=>sum+valueWrapper.value.records.length,0)-offset;if(recordsFound<listUiCacheKeyBuilder.pageSize&&listRecordsValueWrappers.length>0&&listRecordsValueWrappers[listRecordsValueWrappers.length-1].value.nextPageToken);// make sure we're not mixing data from different versions of the
    const mismatchedEtags=listRecordsValueWrappers.find(valueWrapper=>{const recordEtag=valueWrapper.value.listInfoETag;const metadataEtag=listInfoValueWrapper.value.eTag;return recordEtag!==metadataEtag;});if(mismatchedEtags){// TODO - fork this off for background processing - we need to refetch the data
    throw getLdsInternalError("DENORMALIZED_FAILED","Found mismatched etags for list",true);}// assemble the pieces back into a list-ui
    const listUi=cacheUtils.constructListUi(this._recordService,listInfoValueWrapper,listRecordsValueWrappers,offset,listUiCacheKey);return listUi;}/**
         * Reference to the RecordService instance.
         */get _recordService(){return this._ldsCache.getService(RECORD_VALUE_TYPE);}}/*
     * Generates the wire adapter for List Ui
     */class ListUiWireAdapterGenerator{/*
         * Constructor.
         * @param listUiService Reference to the ListUiService instance.
         */constructor(listUiService){this._listUiService=listUiService;}/*
         * Generates the wire adapter for getObjectInfo.
         * @returns WireAdapter - See description.
         */generateGetListUiWireAdapter(){const wireAdapter=generateWireAdapter(this._serviceGetListUi.bind(this));return wireAdapter;}/*
         * Service getListUi @wire.
         * @private
         * @param config: Config params for the service.
         * @return Observable stream that emits a list ui.
         */_serviceGetListUi(config){if(!config.listViewId&&!config.objectApiName){return undefined;}return this._listUiService.getListUi(config);}}/*
     * Wire adapter id: getListUi.
     * @throws Error - Always throws when invoked. Imperative invocation is not supported.
     * @returns void
     */function getListUi(){throw generateError("getListUi");}/**
     * Lookup actions value type
     */const LOOKUP_ACTIONS_VALUE_TYPE="lds.LookupActions";/**
     * Lookup actions value expires in 5 minutes in cache
     */const LOOKUP_ACTIONS_TTL=5*60*1000;/**
     * Returns a comma delimited string insensitive to letter cases and order of the input strings
     * @param array An array of strings
     * @return see description
     */function stableCommaDelimitedString(array){return array&&array.length?[...array].sort().join(","):"";}/**
     * Returns an array of lower cased strings
     * @param array An array of strings
     * @return see description
     */function toLowerCase(array){return array&&array.length?array.map(elem=>elem.toLowerCase()):array;}/**
     * Builds a cache key for lookup actions
     * @param objectApiNames The list of object api names
     * @param formFactor The form factor
     * @param sections The sections
     * @param actionTypes The action types
     * @return See description
     */function buildCacheKey$7(objectApiNames,formFactor,sections,actionTypes){{assert$1(objectApiNames.length,"A non-empty objectApiNames must be provided.");}const objectApiName=stableCommaDelimitedString(toLowerCase(objectApiNames));formFactor=(formFactor||"").toLowerCase();const section=stableCommaDelimitedString(toLowerCase(sections));const actionType=stableCommaDelimitedString(toLowerCase(actionTypes));return {type:LOOKUP_ACTIONS_VALUE_TYPE,key:[objectApiName,formFactor,section,actionType].join(KEY_DELIM)};}/**
     * Value type for action definition
     */const ACTION_DEFINITION_VALUE_TYPE="lds.ActionDefinition";/**
     * Function builds a marker from a cache key
     * @param actionDefinitionCacheKey
     * @return A marker of an action definition
     */function buildActionDefinitionMarker(actionDefinitionCacheKey){return {key:serialize(actionDefinitionCacheKey)};}/**
     * Builder builds a cache key from a marker
     * @param marker The marker of an action definition
     * @return A cache key for an action definition
     */function buildCacheKeyFromMarker(marker){return {type:ACTION_DEFINITION_VALUE_TYPE,key:marker.key.split(KEY_DELIM).slice(1).join(KEY_DELIM)};}/**
     * @param externalId The external id
     * @return A cache key for action definition
     */function buildCacheKey$8(externalId){return {type:ACTION_DEFINITION_VALUE_TYPE,key:externalId.split(KEY_DELIM).slice(5).join(KEY_DELIM)};}/**
     * Normalize an action payload. The call doesn't mutate the input payload.
     * @param cacheAccessor The cache accessor
     * @param fnForCacheKeyDependenciesOfKey A function provided by endpoint to specify the cache key and its non-action-hierarchical dependencies given a key
     * @param cacheKey The cache key of the payload, usually available from within the caller (the endpoint) before this call
     * @param payload The de-normalized action payload returned from Ui Api
     */function normalizePayload(cacheAccessor,fnForCacheKeyDependenciesOfKey,cacheKey,payload){// a function to normalize one key value pair of an action payload
    const normalizeAndStageSingleKeyedPayload=(key,multipleKeyedPayloadCacheKeys,valueWrapperProperties)=>{// for a provided key,
    // cache key is the cache key of the single keyed payload,
    // dependencies are non-action-hierarchical ones each end point has the best knowledge what they are
    const{cacheKey:singleKeyedPayloadCacheKey,dependencies:interModuleDependencies,getSingleActionByApiNameCacheKey}=fnForCacheKeyDependenciesOfKey(key);const singleKeyedPayloadDependency={cacheKey:singleKeyedPayloadCacheKey,type:1/* REQUIRED */};const multipleKeyedPayloadDependencyArray=multipleKeyedPayloadCacheKeys.map(currCacheKey=>{return {cacheKey:currCacheKey,type:1/* REQUIRED */};});// a function to extract action definition from the action payload and replace it with a marker
    const extractActionDefinition=platformActionRepresentation=>{// a set of hard coded fields extracted as the action definition
    const{actionTarget,actionTargetType,apiName,iconUrl,label,primaryColor,subtype,type}=platformActionRepresentation,rest=_objectWithoutProperties(platformActionRepresentation,["actionTarget","actionTargetType","apiName","iconUrl","label","primaryColor","subtype","type"]);const actionDefinition={actionTarget,actionTargetType,apiName,iconUrl,label,primaryColor,subtype,type};const actionDefinitionCacheKey=buildCacheKey$8(rest.externalId);// stage action definition payload and their dependencies
    const dependencies=[singleKeyedPayloadDependency,...multipleKeyedPayloadDependencyArray];if(getSingleActionByApiNameCacheKey){dependencies.push({cacheKey:getSingleActionByApiNameCacheKey(apiName),type:1/* REQUIRED */});}cacheAccessor.stagePut(dependencies,actionDefinitionCacheKey,actionDefinition,actionDefinition);const marker=buildActionDefinitionMarker(actionDefinitionCacheKey);return _objectSpread({},rest,{actionDefinition:marker});};// prepare single key payload by extracting action definition, value could be either a single action or a list of actions
    const value=payload.actions[key];const singleKeyedPayload={actions:{}};singleKeyedPayload.actions[key]={actions:value.actions.map(extractActionDefinition)};// prepare de-normalized payload to emit, making sure it has the necessary action payload envelop so that no payload transformation on a cache hit
    const valueToEmit={actions:{}};valueToEmit.actions[key]={actions:value.actions};// stage single keyed payload
    cacheAccessor.stagePut(multipleKeyedPayloadDependencyArray,singleKeyedPayloadCacheKey,singleKeyedPayload,valueToEmit,valueWrapperProperties);// when non-action-hierarchical dependencies are provided by endpoint, stage them up
    if(interModuleDependencies){interModuleDependencies.forEach(dependency=>{cacheAccessor.stageDependencies([singleKeyedPayloadDependency],dependency);});}// normalize for requests of retrievalMode "All" with a single action api name
    if(getSingleActionByApiNameCacheKey){singleKeyedPayload.actions[key].actions.forEach((normalizedAction,index)=>{const singleActionPayload={actions:{}};singleActionPayload.actions[key]={actions:[normalizedAction]};const singleActionValueToEmit={actions:{}};singleActionValueToEmit.actions[key]={actions:[value.actions[index]]};const singleActionByApiNameCacheKey=getSingleActionByApiNameCacheKey(value.actions[index].apiName);cacheAccessor.stagePut([],singleActionByApiNameCacheKey,singleActionPayload,singleActionValueToEmit);});}return [singleKeyedPayloadCacheKey,valueToEmit];};const keys=Object.keys(payload.actions);if(keys.length===0){// no normalization at all
    cacheAccessor.stagePut([],cacheKey,payload,{actions:payload.actions});}else if(keys.length===1){// normalize the only key, there is no multiple keyed payload cache keys specified
    normalizeAndStageSingleKeyedPayload(keys[0],[],{eTag:payload.eTag});}else{const{normalized,denormalized}=keys.reduce((result,key)=>{// the following call fully stages up single keyed payload and their dependencies
    const[singleKeyedPayloadCacheKey,singleKeyedPayloadToEmit]=normalizeAndStageSingleKeyedPayload(key,[cacheKey]);// replaces single keyed payload with a marker
    result.normalized.actions[key]={key:serialize(singleKeyedPayloadCacheKey)};result.denormalized.actions[key]=singleKeyedPayloadToEmit.actions[key];return result;},{normalized:{actions:{}},denormalized:{actions:{}}});// stages up multiple keyed payload
    cacheAccessor.stagePut([],cacheKey,normalized,denormalized,{eTag:payload.eTag});}}/**
     * A utility function to get cache value from the cache accessor.
     * The use of this function is private to de-normalization process since lds-cache currently never evicts
     * thus the function assumes the value always exists in the cache during de-normalization.
     *
     * @param cacheAccessor The cache accessor
     * @param cacheKey The cache key
     * @return The value of the value wrapper if exists
     */function getValue(cacheAccessor,cacheKey){const valueWrapper=cacheAccessor.get(cacheKey);if(valueWrapper&&valueWrapper.value){return valueWrapper.value;}throw new Error(`Value not found for cache key: ${serialize(cacheKey)}`);}/**
     * De-normalize an action payload. The call doesn't mutate the normalized payload in the cache. It doesn't emit payload with eTag.
     *
     * @param cacheAccessor The cache accessor
     * @param affectedKey The affected cache key of the payload to be de-normalized
     * @param fnForCacheKeyDependenciesOfKey A function provided by end point to specify the cache key given a key
     * @return A de-normalized action payload
     */function denormalizeValue(cacheAccessor,normalizedPayload){// a function to replace a marker with an action definition retrieved from the cache
    const restoreActionDefinition=normalizedAction=>{const{actionDefinition:actionDefinitionMarker}=normalizedAction,rest=_objectWithoutProperties(normalizedAction,["actionDefinition"]);// reconstruct the cache key by the marker
    const cacheKey=buildCacheKeyFromMarker(actionDefinitionMarker);const myValue=getValue(cacheAccessor,cacheKey);return Object.assign({},myValue,rest);};// a function to de-normalize single keyed payload, the value could either be a single action or a list of actions
    const denormalizeSingleKeyedPayload=payload=>{const actions=payload.actions.map(restoreActionDefinition);return {actions};};const keys=Object.keys(normalizedPayload.actions);if(keys.length===0){return {actions:{}};}else if(keys.length===1){// de-normalize the only key/value pair
    const key=keys[0];const actions=denormalizeSingleKeyedPayload(normalizedPayload.actions[key]);const singleKeyedPayload={actions:{}};singleKeyedPayload.actions[key]=actions;return singleKeyedPayload;}else{// de-normalize each key, replace each normalized value with de-normalized payload
    const multipleKeyedPayload={actions:_objectSpread({},normalizedPayload.actions)};Object.keys(multipleKeyedPayload.actions).map(key=>{const cacheKey=deserialize(multipleKeyedPayload.actions[key].key);const normalizedSingleKeyedPayload=getValue(cacheAccessor,cacheKey);// de-normalize single keyed payload
    const singleOrMultipleRawActions=denormalizeSingleKeyedPayload(normalizedSingleKeyedPayload.actions[key]);multipleKeyedPayload.actions[key]=singleOrMultipleRawActions;});return multipleKeyedPayload;}}// eslint-disable-next-line lwc/no-compat-execute
    /**
     * The ui api end point of lookup actions
     */const ACTIONS_GLOBAL_CONTROLLER="ActionsController.getLookupActions";/**
     * Service to retrieve lookup actions via UI API
     */class LookupActionsService extends LdsServiceBase{/**
         * Constructor.
         * @param ldsCache Reference to the LdsCache instance.
         * @param affectedKeyHandlerInspector Used by tests to inspect the affectedKeyHandler.
         * @param valueProviderFunctionInspector Used by tests to inspect the valueProviderFunction.
         */constructor(ldsCache,functionProvidesValueProviderFunction){super(ldsCache,[LOOKUP_ACTIONS_VALUE_TYPE]);/**
             * Implementation of affected key handler for this service
             */this.affectedKeyHandler=(affectedKey,cacheAccessor)=>{const oldValueWrapper=cacheAccessor.get(affectedKey);if(oldValueWrapper){const updatedActionPayloadToEmit=denormalizeValue(cacheAccessor,oldValueWrapper.value);const valueWrapper=cloneWithValueOverride(oldValueWrapper,updatedActionPayloadToEmit);cacheAccessor.stageEmit(affectedKey,valueWrapper);}};this._functionProvidesValueProviderFunction=functionProvidesValueProviderFunction;}getCacheValueTtl(){return LOOKUP_ACTIONS_TTL;}/**
         * @return A higher order of function that returns an affected key handler
         */getAffectedKeyHandler(){return this.affectedKeyHandler;}/**
         * Retrieves lookup actions
         *
         * @param objectApiNameArray Object API names of lookup actions to retrieve.
         * @param requestParams Options to filter the resulting actions by formFactor, sections, or actionTypes
         * @returns A collections of actions categorized by their associated object api name
         *
         */getLookupActions(objectApiNameArray,requestParams){const objectApiNames=objectApiNameArray.map(getObjectApiName);const parameters=Object.assign({},{objectApiNames},requestParams);const cacheKey=buildCacheKey$7(parameters.objectApiNames,parameters.formFactor,parameters.sections,parameters.actionTypes);const valueProviderFunction=this._functionProvidesValueProviderFunction?this._functionProvidesValueProviderFunction(cacheKey,parameters,false):this.getValueProviderFn(cacheKey,parameters,false);return this._ldsCache.get(cacheKey,new ValueProvider(valueProviderFunction,{}));}/**
         * Stage puts the given action.
         * @param dependencies List of dependent cache keys.
         * @param action The action to stagePut.
         * @param cacheAccessor An object to access cache directly.
         * @param lookupActionsParameters Data to build cache key with
         */stagePutValue(dependencies,action,cacheAccessor,lookupActionsParameters){const recordActionCacheKey=buildCacheKey$7(lookupActionsParameters.objectApiNames,lookupActionsParameters.formFactor,lookupActionsParameters.sections,lookupActionsParameters.actionTypes);return cacheAccessor.stagePut(dependencies,recordActionCacheKey,action,action);}/**
         * Strips all eTag properties from the given action by directly deleting them.
         * @param action The action from which to strip the eTags.
         * @returns The given action with its eTags stripped.
         */stripETagsFromValue(action){delete action.eTag;return action;}/**
         * Denormalizes the given normalizedValue and returns it.
         * @param normalizedValue The normalizedValue to denormalize.
         * @param cacheAccessor Used to access the cache.
         * @returns The denormalized lookup actions value.
         */denormalizeValue(normalizedValue,cacheAccessor){const denormalizedValue=denormalizeValue(cacheAccessor,normalizedValue);return denormalizedValue;}/**
         * A higher order function to provide a value provider function
         * @param cacheKey The cache key
         * @param params The lookup action parameters for the transaction
         * @param forceFetch Indicates whether a server round trip is forced
         * @return A value provider function
         */getValueProviderFn(cacheKey,params,forceFetch){return cacheAccessor=>{const cacheEntry=cacheAccessor.get(cacheKey);if(!forceFetch&&this.doesCacheEntryHasValue(cacheEntry)&&this.hasNotExpired(cacheAccessor.nowTime,cacheEntry)){return Thenable.resolve(1/* CACHE_HIT */);}return this.primeCacheEntries(params,cacheAccessor,cacheKey).then(result=>{if(cacheEntry&&cacheEntry.eTag&&result.eTag&&cacheEntry.eTag===result.eTag){return 3/* CACHE_MISS_REFRESH_UNCHANGED */;}else{return 2/* CACHE_MISS */;}});};}/**
         * Makes a server round trip and normalizes the response
         * @param parameters The lookup action parameters for the round trip
         * @param cacheAccessor The cache accessor for the transaction
         * @param cacheKey The cache key for the payload
         * @return The action representation
         */primeCacheEntries(parameters,cacheAccessor,cacheKey){return executeAuraGlobalController(ACTIONS_GLOBAL_CONTROLLER,parameters).then(response=>{const result=response.body;normalizePayload(cacheAccessor,this.getCacheKeyDependencyOfKey.bind(this,parameters),cacheKey,result);const affectedKeys=cacheAccessor.commitPuts();this._ldsCache.handleAffectedKeys(affectedKeys,cacheAccessor);return result;});}/**
         * Calculates the cache key and dependencies provided the parameters for the request
         * @param formFactor The form factor
         * @param sections The sections
         * @param actionTypes The action types
         * @param objectApiName The object api name
         * @return The cache key of the request along with their dependencies
         */getCacheKeyDependencyOfKey({formFactor,sections,actionTypes},objectApiName){const cacheKey=buildCacheKey$7([objectApiName],formFactor,sections,actionTypes);return {cacheKey,dependencies:[]};}/**
         * A function to check whether cache entry has expired
         * @param now Current timestamp
         * @param entry Cache entry
         * @returns Whether cache entry has expired
         */hasNotExpired(now,entry){return !isNaN(now)&&!isNaN(entry.lastFetchTime)&&now-entry.lastFetchTime<LOOKUP_ACTIONS_TTL;}/**
         * A function to check whether cache entry has a value
         * @param entry Cache entry
         * @return Whether the cache entry has a value
         */doesCacheEntryHasValue(entry){return entry?entry.value!==undefined:false;}}/**
     * Wire adapter id: getLookupActions.
     * @throws Always throws when invoked. Imperative invocation is not supported.
     */function getLookupActions(){throw generateError("getLookupActions");}/**
     * Generates the wire adapter for Lookup Actions.
     */class LookupActionsWireAdapterGenerator{/**
         * Constructor.
         * @param lookupActionsService Reference to the LookupActionsService instance.
         */constructor(lookupActionsService){this._lookupActionsService=lookupActionsService;}/**
         * Generates the wire adapter for getLookupActions.
         * @returns See description.
         */generateGetLookupActionsWireAdapter(){return generateWireAdapter(this.serviceGetLookupActions.bind(this));}/**
         * Service getLookupActions @wire.
         * @param config Config params for the service.
         * @return Observable stream that emits lookup actions.
         */serviceGetLookupActions(config){return this._lookupActionsService.getLookupActions(config.objectApiNames,config.requestParams);}}const LOOKUP_RECORDS_VALUE_TYPE="lds.LookupRecords";/**
     * Time to live for the LookupRecords cache value is 2 minutes.
     */const LOOKUP_RECORDS_TTL=2*60*1000;/**
     * Computes a key for lookup records caching.
     * @param fieldApiName - The qualified field api name.
     * @param targetApiName - The target entity api name.
     * @param requestParams - The request params to filter data.
     * @returns - A key for caching.
     */function computeKey(fieldApiName="",targetApiName="",requestParams={}){const requestParamKeys=Object.keys(requestParams).sort();const paramKeys=[];requestParamKeys.forEach(key=>{paramKeys.push(key);paramKeys.push(String(requestParams[key]));});// TODO - W-5590585 - Make lookups UI API and wire adapter case insensitive.
    // Currently, lookups UI API supports case insensitive targetApiName hence lowercase it while building key.
    return `${fieldApiName}${KEY_DELIM}${targetApiName.toLowerCase()}${KEY_DELIM}${paramKeys.join(KEY_DELIM)}`;}/**
     * Builds a cache key.
     * @param fieldApiName - The fieldApiName used to build the cache key.
     * @param targetApiName - The targetApiName used to build the cache key.
     * @param requestParams - The requestParams used to build the cache key.
     */function buildCacheKey$9(fieldApiName,targetApiName,requestParams){{assert$1(fieldApiName,"A non-empty fieldApiName must be provided.");assert$1(targetApiName,"A non-empty targetApiName must be provided.");assert$1(requestParams,"A non-empty requestParams must be provided.");}return {type:LOOKUP_RECORDS_VALUE_TYPE,key:computeKey(fieldApiName,targetApiName,requestParams)};}/**
     * Provides functionality to fetch lookup results for records.
     */class LookupRecordsService extends LdsServiceBase{constructor(ldsCache){super(ldsCache,[LOOKUP_RECORDS_VALUE_TYPE]);}getCacheValueTtl(){return LOOKUP_RECORDS_TTL;}/**
         * Gets lookup records.
         * @param fieldApiName - The qualified field API name.
         * @param targetApiName - The target object API name.
         * @param requestParams - Request params to filter data.
         * @returns - The observable used to get the value and keep watch on it for changes.
         */getLookupRecords(fieldApiName,targetApiName,requestParams={}){fieldApiName=getFieldApiName(fieldApiName);targetApiName=getObjectApiName(targetApiName);const cacheKey=buildCacheKey$9(fieldApiName,targetApiName,requestParams);const valueProviderParameters={cacheKey,fieldApiName,targetApiName,requestParams};const valueProvider=this._getValueProvider(valueProviderParameters);return this._ldsCache.get(cacheKey,valueProvider);}/**
         * Creates a ValueProvider for the LookupRecords.
         * @param valueProviderParams - Parameters to create ValueProvider for LookupRecords.
         * @returns - A value Provider instance.
         */_getValueProvider(valueProviderParams){const valueProvider=new ValueProvider((cacheAccessor,valueProviderParameters)=>{const{cacheKey,fieldApiName,targetApiName,requestParams,localFreshLookupRecords,forceProvide}=valueProviderParameters;if(forceProvide){return this._getFreshValue(cacheAccessor,cacheKey,fieldApiName,targetApiName,requestParams,localFreshLookupRecords);}const existingValueWrapper=cacheAccessor.get(cacheKey);if(existingValueWrapper&&existingValueWrapper.value!==undefined){const nowTime=cacheAccessor.nowTime;const lastFetchTime=existingValueWrapper.lastFetchTime;const needsRefresh=nowTime>lastFetchTime+LOOKUP_RECORDS_TTL;if(needsRefresh){// The value is stale, get a fresh one.
    return this._getFreshValue(cacheAccessor,cacheKey,fieldApiName,targetApiName,requestParams,localFreshLookupRecords,existingValueWrapper.eTag);}// The value is not stale so it's a cache hit.
    return Thenable.resolve(1/* CACHE_HIT */);}// No existing value, get a fresh value.
    return this._getFreshValue(cacheAccessor,cacheKey,fieldApiName,targetApiName,requestParams,localFreshLookupRecords);},valueProviderParams);return valueProvider;}/**
         * Gets a fresh value and processes it into the cache with the cacheAccessor.
         * @param cacheAccessor - An object to transactionally access the cache.
         * @param cacheKey - The cache key for the object info.
         * @param fieldApiName - The qualified field api name.
         * @param targetApiName - The target entity api name.
         * @param requestParams - Request params to filter data.
         * @param localFreshLookupRecords - Lookup records value you want explicitly put into cache instead of getting the value from the server.
         * @param eTagToCheck - eTag to send to the server to determine if we already have the latest value. If we do the server will return a 304.
         * @returns - A thenable of ValueProviderResult representing the outcome of the value provider.
         */_getFreshValue(cacheAccessor,cacheKey,fieldApiName,targetApiName,requestParams,localFreshLookupRecords,eTagToCheck){let transportResponseThenable;const params={fieldApiName,targetApiName,requestParams};// If the lookup records are provided, we don't go to the server to fetch it.
    if(localFreshLookupRecords){transportResponseThenable=Thenable.resolve(getOkFetchResponse(localFreshLookupRecords));}else{if(eTagToCheck){params.clientOptions={eTagToCheck};}// TODO - W-5528819 @wire(getLookupRecords) and LookupController.getLookupRecords params are inconsistent.
    const[objectApiName,unqualifiedFieldApiName]=splitQualifiedFieldApiName(fieldApiName);const auraControllerParams=_objectSpread({objectApiName,fieldApiName:unqualifiedFieldApiName,targetApiName},requestParams);transportResponseThenable=executeAuraGlobalController("LookupController.getLookupRecords",auraControllerParams);}return transportResponseThenable.then(transportResponse=>{// Cache miss refresh unchanged.
    if(transportResponse.status===304){return 3/* CACHE_MISS_REFRESH_UNCHANGED */;}const freshValue=transportResponse.body;cacheAccessor.stageClearDependencies(cacheKey);this.stagePutValue([],freshValue,cacheAccessor,params);const affectedKeys=cacheAccessor.commitPuts();this._ldsCache.handleAffectedKeys(affectedKeys,cacheAccessor);return 2/* CACHE_MISS */;});}/**
         * Stage puts the given lookup records.
         * @param dependencies - A list of dependent cache keys.
         * @param lookupRecords - The lookup records value to cache.
         * @param cacheAccessor - An object to access cache directly.
         * @returns - A thenable on completing the stagePut operation.
         */stagePutValue(dependencies,lookupRecords,cacheAccessor,params){const cacheKey=buildCacheKey$9(params.fieldApiName,params.targetApiName,params.requestParams);const existingValueWrapper=cacheAccessor.get(cacheKey);const eTag=lookupRecords.eTag;if(existingValueWrapper&&existingValueWrapper.eTag===eTag){cacheAccessor.stageDependencies(dependencies,cacheKey);cacheAccessor.stagePutUpdateLastFetchTime(cacheKey);return;}// Strip out the eTag from the value.
    lookupRecords=this.stripETagsFromValue(lookupRecords);cacheAccessor.stagePut(dependencies,cacheKey,lookupRecords,lookupRecords,{eTag});}/**
         * Strips eTag from the given LookupRecords.
         * @param LookupRecords - The LookupRecords from which to strip the eTag.
         * @returns - LookupRecords without eTag.
         */stripETagsFromValue(lookupRecords){delete lookupRecords.eTag;return lookupRecords;}}/**
     * Generates the wire adapter for Lookup Records.
     */class LookupRecordsWireAdapterGenerator{/**
         * Constructor.
         * @param lookupRecordsService - Reference to the LookupRecordsService instance.
         */constructor(lookupRecordsService){this._lookupRecordsService=lookupRecordsService;}/**
         * Generates the wire adapter for @wire getLookupRecords.
         */generateGetLookupRecordsWireAdapter(){const wireAdapter=generateWireAdapter(this.serviceGetLookupRecords.bind(this));return wireAdapter;}/**
         * Service @wire getLookupRecords.
         * @private Made public for testing.
         * @param config - Config params for the service.
         * @returns - An observable stream that emits lookup records.
         */serviceGetLookupRecords(config){if(!config||!config.fieldApiName||!config.targetApiName){return undefined;}return this._lookupRecordsService.getLookupRecords(config.fieldApiName,config.targetApiName,config.requestParams);}}/**
     * Return the wire adapter id.
     */function getLookupRecords(){throw generateError("getLookupRecords");}/**
     * The valueType to use when building PicklistCacheKey.
     */const PICKLIST_VALUES_VALUE_TYPE="uiapi.PicklistValuesRepresentation";/**
     * Time to live for the Picklist cache value. 5 minutes.
     */const PICKLIST_VALUES_TTL=5*60*1000;/**
     * Builds the cache key for the single picklist field api
     * @param objectApiName The objectApiName used to build the picklist cache key.
     * @param recordTypeId The recordTypeId used to build the picklist cache key.
     * @param fieldApiName The fieldApiName used to build the picklist cache key.
     * @returns A new cache key representing the Picklist value type.
     */function buildCacheKey$a(objectApiName,recordTypeId,fieldApiName){{assert$1(objectApiName,"A non-empty objectApiName must be provided.");assert$1(recordTypeId,"A non-empty recordTypeId must be provided.");assert$1(fieldApiName,"A non-empty fieldApiName must be provided.");assert$1(recordTypeId.length===18,"Record Type Id length should be 18 characters.");}return {type:PICKLIST_VALUES_VALUE_TYPE,key:`${objectApiName.toLowerCase()}${KEY_DELIM}${recordTypeId}${KEY_DELIM}${fieldApiName}`};}/**
     * Provides functionality to read picklist data from the cache. Can refresh the data from the server.
     * We do not utilize caching or sending eTags to the server for the PicklistsByRecordType value type because it gets invalidated
     * quickly on the client from having its atoms updated.
     */class PicklistValuesService extends LdsServiceBase{/**
         * Constructor.
         * @param ldsCache Reference to the LdsCache instance.
         */constructor(ldsCache){super(ldsCache,[PICKLIST_VALUES_VALUE_TYPE]);}getCacheValueTtl(){return PICKLIST_VALUES_TTL;}/**
         * Gets picklist values for a picklist field.
         * @param fieldApiName The picklist field's qualified API name.
         * @param recordTypeId The record type id. Pass '012000000000000AAA' for the master record type.
         * @returns An observable for the picklist values.
         */getPicklistValues(fieldApiName,recordTypeId){fieldApiName=getFieldApiName(fieldApiName);const[objectApiName,unqualifiedFieldApiName]=splitQualifiedFieldApiName(fieldApiName);recordTypeId=to18(recordTypeId);const cacheKey=buildCacheKey$a(objectApiName,recordTypeId,unqualifiedFieldApiName);const vpArgs={cacheKey,objectApiName,recordTypeId,fieldApiName:unqualifiedFieldApiName,forceProvide:false};return this._ldsCache.get(cacheKey,this._createPicklistValueProvider(vpArgs));}/**
         * Stage puts the given picklist values object.
         * @param dependencies An array of dependent cache keys.
         * @param picklistValues The picklist to cache.
         * @param cacheAccessor An object to access cache directly.
         * @param additionalData A property bag with additional values that are needed to generate the cache key.
         * @returns A Thenable that resolves when the stagePut has completed.
         */stagePutValue(dependencies,picklistValues,cacheAccessor,additionalData){const picklistCacheKey=buildCacheKey$a(additionalData.objectApiName,additionalData.recordTypeId,additionalData.fieldApiName);const eTag=picklistValues.eTag;const existingValueWrapper=cacheAccessor.get(picklistCacheKey);if(existingValueWrapper&&existingValueWrapper.eTag===eTag){cacheAccessor.stageDependencies(dependencies,picklistCacheKey);cacheAccessor.stagePutUpdateLastFetchTime(picklistCacheKey);return;}// Strip out the eTag from the value. We don't want to emit eTags!
    picklistValues=this.stripETagsFromValue(picklistValues);cacheAccessor.stagePut(dependencies,picklistCacheKey,picklistValues,picklistValues,{eTag});}/**
         * Strips all eTag properties from the given picklist by directly deleting them.
         * @param picklistValues The picklist from which to strip the eTags.
         * @returns The given picklist with its eTags stripped.
         */stripETagsFromValue(picklistValues){delete picklistValues.eTag;return picklistValues;}/**
         * Constructs a value provider to retrieve picklist values.
         * @param valueProviderParameters The parameters for the value provider as an object.
         * @returns The value provider to retrieve picklist values.
         */_createPicklistValueProvider(valueProviderParameters){const{// Do NOT set defaults here. See W-4840393.
    cacheKey,objectApiName,recordTypeId,fieldApiName,forceProvide}=valueProviderParameters;const picklistValueProvider=new ValueProvider(cacheAccessor=>{if(forceProvide){return this._getFreshValue(cacheAccessor,cacheKey,objectApiName,recordTypeId,fieldApiName);}const existingValueWrapper=cacheAccessor.get(cacheKey);if(existingValueWrapper&&existingValueWrapper.value!==undefined){const nowTime=cacheAccessor.nowTime;const lastFetchTime=existingValueWrapper.lastFetchTime;// check for ttl expiry
    const needsRefresh=nowTime>lastFetchTime+PICKLIST_VALUES_TTL;if(needsRefresh){// Value is stale; get a fresh value.
    return this._getFreshValue(cacheAccessor,cacheKey,objectApiName,recordTypeId,fieldApiName,existingValueWrapper.eTag);}// The value is not stale so it's a cache hit.
    return Thenable.resolve(1/* CACHE_HIT */);}// No existing value; get a fresh value.
    return this._getFreshValue(cacheAccessor,cacheKey,objectApiName,recordTypeId,fieldApiName);},valueProviderParameters);return picklistValueProvider;}hasValidCachedValue(cacheAccessor,params){const cacheKey=buildCacheKey$a(params.objectApiName,params.recordTypeId,params.fieldApiName);const existingValueWrapper=cacheAccessor.get(cacheKey);return !!existingValueWrapper&&existingValueWrapper.value!==undefined&&cacheAccessor.nowTime<=existingValueWrapper.lastFetchTime+PICKLIST_VALUES_TTL;}/**
         * Gets a fresh value and processes it into the cache with the cacheAccessor.
         * @param cacheAccessor An object to transactionally access the cache.
         * @param cacheKey The cache key for the picklistValues.
         * @param objectApiName The objectApiName of the picklistValues.
         * @param recordTypeId The recordTypeId of the picklistValues.
         * @param fieldApiName The fieldApiName of the picklistValues.
         * @param eTagToCheck eTag to send to the server to determine if we already have the latest value. If we do the server will return a 304.
         * @returns Returns a ValueProviderResult representing the outcome of the value provider.
         */_getFreshValue(cacheAccessor,cacheKey,objectApiName,recordTypeId,fieldApiName,eTagToCheck){let picklistValuesThenable;const params={objectApiName,recordTypeId,fieldApiName};if(eTagToCheck){params.clientOptions={eTagToCheck};}{picklistValuesThenable=aggregateUiExecutor.executeSingleRequestOverAggregateUi("getPicklistValues",params,PICKLIST_VALUES_TTL);}return picklistValuesThenable.then(transportResponse=>{// Cache miss refresh unchanged.
    if(transportResponse.status===304){return 3/* CACHE_MISS_REFRESH_UNCHANGED */;}// Cache miss.
    const freshPicklist=transportResponse.body;// nothing to normalize
    {assert$1(freshPicklist.eTag!==undefined,`eTag was undefined for: ${cacheKey}`);}this.stagePutValue([],freshPicklist,cacheAccessor,{objectApiName,recordTypeId,fieldApiName});const affectedKeys=cacheAccessor.commitPuts();this._ldsCache.handleAffectedKeys(affectedKeys,cacheAccessor);return 2/* CACHE_MISS */;});}}/**
     * Wire adapter id: getPicklistValues.
     * @throws Always throws an error when invoked. Imperative invocation is not supported.
     */function getPicklistValues(){throw generateError("getPicklistValues");}/**
     * Generates the wire adapters for:
     * @wire getPicklistValues
     * @wire getPicklistValuesByRecordType
     */class PicklistValuesWireAdapterGenerator{/**
         * Constructor.
         * @param picklistValuesService Reference to the PicklistValuesService instance.
         */constructor(picklistValuesService){this._picklistValuesService=picklistValuesService;}/**
         * Generates the wire adapter for getPicklistValues.
         * @returns Returns the generated wire adapter for getPicklistValues
         */generateGetPicklistValuesWireAdapter(){const wireAdapter=generateWireAdapter(this.serviceGetPicklistValues.bind(this));return wireAdapter;}/**
         * @private Made public for testing.
         * Services getPicklistValues @wire.
         * @param config Config params for the service.
         * @return Observable stream that emits a picklist values object.
         */serviceGetPicklistValues(config){if(!config){return undefined;}{const required=["fieldApiName","recordTypeId"];const supported=["fieldApiName","recordTypeId"];validateConfig("getPicklistValues",config,required,supported);}if(!config.recordTypeId||!config.fieldApiName){return undefined;}return this._picklistValuesService.getPicklistValues(config.fieldApiName,config.recordTypeId);}}/**
     * The valueType to use when building PicklistRecordTypeCacheKey.
     */const PICKLIST_VALUES_BY_RT_VALUE_TYPE="uiapi.PicklistValuesCollectionRepresentation";/**
     * Time to live for the Picklist cache value. 5 minutes.
     */const PICKLIST_VALUES_BY_RECORD_TYPE_TTL=5*60*1000;/**
     * Returns a PickListValuesByRecordTypeCacheKeyParams based on a cacheKey. Throws an error if it can't be done because a bad string is provided.
     * @param cacheKey PicklistValuesByRecordType cache key.
     * @returns See description
     */function getPicklistValuesByRecordTypeCacheKeyParams(cacheKey){const key=cacheKey.key;const localKeyParts=key.split(KEY_DELIM);{assert$1(localKeyParts.length===2,`localKeyParts did not have the required parts(objectApiName and recordTypeId): ${localKeyParts}`);assert$1(cacheKey.type===PICKLIST_VALUES_BY_RT_VALUE_TYPE,`valueType was expected to be PICKLIST_VALUES_BY_RT_VALUE_TYPE but was not: ${cacheKey.type.toString()}`);}return {objectApiName:localKeyParts[0],recordTypeId:localKeyParts[1]};}/**
     * Builds the cache key for the picklist record type api.
     * @param objectApiName The objectApiName used to build the picklist cache key.
     * @param recordTypeId The recordTypeId used to build the picklist cache key.
     * @returns A new cache key representing the Picklist record type value type.
     */function buildCacheKey$b(objectApiName,recordTypeId){{assert$1(objectApiName,"A non-empty objectApiName must be provided.");assert$1(recordTypeId,"A non-empty recordTypeId must be provided.");assert$1(recordTypeId.length===18,"Record Type Id length should be 18 characters.");}return {type:PICKLIST_VALUES_BY_RT_VALUE_TYPE,key:`${objectApiName.toLowerCase()}${KEY_DELIM}${recordTypeId}`};}/**
     * Provides functionality to read picklist data from the cache. Can refresh the data from the server.
     * We do not utilize caching or sending eTags to the server for the PicklistsByRecordType value type because it gets invalidated
     * quickly on the client from having its atoms updated.
     */class PicklistValuesByRecordTypeService extends LdsServiceBase{/**
         * Constructor.
         * @param ldsCache Reference to the LdsCache instance.
         */constructor(ldsCache){super(ldsCache,[PICKLIST_VALUES_BY_RT_VALUE_TYPE]);}getCacheValueTtl(){return PICKLIST_VALUES_BY_RECORD_TYPE_TTL;}/**
         * Gets picklist values for all picklist fields of an object and record type.
         * @param objectApiName API name of the object.
         * @param recordTypeId Record type id. Pass '012000000000000AAA' for the master record type.
         * @returns An observable of the picklist values.
         */getPicklistValuesByRecordType(objectApiName,recordTypeId){objectApiName=getObjectApiName(objectApiName);recordTypeId=to18(recordTypeId);const cacheKey=buildCacheKey$b(objectApiName,recordTypeId);const vpArgs={cacheKey,objectApiName,recordTypeId,forceProvide:false};return this._ldsCache.get(cacheKey,this._createPicklistValuesByRecordTypeValueProvider(vpArgs));}/**
         * Stage puts the given picklistsByRecordType and all its normalized values.
         * @param dependencies An array of dependent cache keys.
         * @param picklistsByRecordType The picklistsByRecordType to cache.
         * @param cacheAccessor An object to access cache directly.
         * @param additionalData A property bag with additional values that are needed to generate the cache key.
         */stagePutValue(dependencies,picklistsByRecordType,cacheAccessor,additionalData){const picklistsByRecordTypeCacheKey=buildCacheKey$b(additionalData.objectApiName,additionalData.recordTypeId);// This is an any so we can transform the cloned object into the normalized form.
    const normalizedPicklistsByRecordType=cloneDeepCopy(picklistsByRecordType);// Picklist normalization
    const picklistFieldValues=normalizedPicklistsByRecordType.picklistFieldValues;const picklistFieldValuesKeys=Object.keys(picklistFieldValues);for(let n=0,len=picklistFieldValuesKeys.length;n<len;++n){const picklistFieldName=picklistFieldValuesKeys[n];const picklist=picklistsByRecordType.picklistFieldValues[picklistFieldName];// add marker for the pick list value
    picklistFieldValues[picklistFieldName]={eTag:picklist.eTag,objectApiName:additionalData.objectApiName,recordTypeId:additionalData.recordTypeId};const picklistValuesStagePutAdditionalData={objectApiName:additionalData.objectApiName,recordTypeId:additionalData.recordTypeId,fieldApiName:picklistFieldName};this._ldsCache.stagePutValue(PICKLIST_VALUES_VALUE_TYPE,[{cacheKey:picklistsByRecordTypeCacheKey,type:1/* REQUIRED */}],picklist,cacheAccessor,picklistValuesStagePutAdditionalData);}// Stage put the picklistsByRecordType
    // Strip out the eTag from the value. We don't want to emit eTags!
    delete normalizedPicklistsByRecordType.eTag;picklistsByRecordType=this.stripETagsFromValue(picklistsByRecordType);// PicklistsByRecordType will not store an eTag because it is an aggregate value.
    cacheAccessor.stagePut(dependencies,picklistsByRecordTypeCacheKey,normalizedPicklistsByRecordType,picklistsByRecordType);}/**
         * Strips all eTag properties from the given picklistsByRecordType by directly deleting them.
         * @param picklistsByRecordType The picklists for a recordtype.
         * @returns The given picklistsByRecordType with its eTags stripped.
         */stripETagsFromValue(picklistsByRecordType){// Delete the eTag off the root object.
    delete picklistsByRecordType.eTag;// Delete the eTags for each picklist.
    const picklistFieldValues=picklistsByRecordType.picklistFieldValues;const picklistFieldValuesKeys=Object.keys(picklistFieldValues);for(let n=0,len=picklistFieldValuesKeys.length;n<len;++n){const picklistFieldValueKey=picklistFieldValuesKeys[n];const picklist=picklistFieldValues[picklistFieldValueKey];picklistFieldValues[picklistFieldValueKey]=this._ldsCache.stripETagsFromValue(PICKLIST_VALUES_VALUE_TYPE,picklist);}return picklistsByRecordType;}/**
         * Denormalizes the given noramlizedPicklistValuesByRecordType and returns it.
         * @param normalizedPicklistValuesByRecordType The normalized picklist values by record type to denormalize.
         * @param cacheAccessor Used to access the cache.
         * @returns The denormalized picklist values by record type.
         */denormalizeValue(normalizedPicklistValuesByRecordType,cacheAccessor){// Any used so we can morph types.
    const denormalizedPicklistValuesByRecordType=cloneDeepCopy(normalizedPicklistValuesByRecordType);// Picklist values denormalization.
    const picklistFieldValues=normalizedPicklistValuesByRecordType.picklistFieldValues;const picklistFieldValuesKeys=Object.keys(picklistFieldValues);for(let n=0,len=picklistFieldValuesKeys.length;n<len;++n){const picklistFieldValuesKey=picklistFieldValuesKeys[n];const picklistFieldValuesMarker=picklistFieldValues[picklistFieldValuesKey];const picklistValuesCacheKey=buildCacheKey$a(picklistFieldValuesMarker.objectApiName,picklistFieldValuesMarker.recordTypeId,picklistFieldValuesKey);const cachedPicklistValuesValueWrapper=cacheAccessor.get(picklistValuesCacheKey);if(cachedPicklistValuesValueWrapper){denormalizedPicklistValuesByRecordType.picklistFieldValues[picklistFieldValuesKey]=cachedPicklistValuesValueWrapper.value;}else{throw getLdsInternalError("DENORMALIZE_FAILED","Did not get a picklist values back for marker: "+serialize(picklistValuesCacheKey),true);}}return denormalizedPicklistValuesByRecordType;}/**
         * @returns The affected key handler for this service.
         */getAffectedKeyHandler(){return (affectedKey,_cacheAccessor)=>{const affectedKeyValueType=affectedKey.type;{assert$1(affectedKeyValueType===PICKLIST_VALUES_BY_RT_VALUE_TYPE,`Unexpected value type for Record: ${affectedKeyValueType===undefined?"undefined":affectedKeyValueType.toString()}`);}const keyBuilder=getPicklistValuesByRecordTypeCacheKeyParams(affectedKey);const objectApiName=keyBuilder.objectApiName;const recordTypeId=keyBuilder.recordTypeId;// When one of the picklists fields have changed, need to do a full refresh of the picklistsByRecordType. This
    // handler will only ever be invoked if a picklist field value has actually changed so we don't need to
    // check anything, just kick off a refresh.
    // Kick this to a Promise to get this out of the cache operation we're already in the middle of.
    Promise.resolve().then(()=>{const forceProvide=true;const vpArgs={cacheKey:affectedKey,objectApiName,recordTypeId,forceProvide};// Use the ValueProvider's provider instead of getPicklistValuesByRecordType() so we can force value providing.
    this._ldsCache.get(affectedKey,this._createPicklistValuesByRecordTypeValueProvider(vpArgs));});};}/**
         * Constructs a value provider to retrieve all picklist values for a record type.
         * @param valueProviderParameters The parameters for the value provider as an object.
         * @returns The value provider to retrieve picklist by record type values.
         */_createPicklistValuesByRecordTypeValueProvider(valueProviderParameters){const{// Do NOT set defaults here. See W-4840393.
    cacheKey,objectApiName,recordTypeId,forceProvide}=valueProviderParameters;const picklistsByRecordTypeValueProvider=new ValueProvider(cacheAccessor=>{if(forceProvide){return this._getFreshValue(cacheAccessor,objectApiName,recordTypeId);}const existingValueWrapper=cacheAccessor.get(cacheKey);if(existingValueWrapper&&existingValueWrapper.value!==undefined){const nowTime=cacheAccessor.nowTime;const lastFetchTime=existingValueWrapper.lastFetchTime;// check for ttl expiry
    const needsRefresh=nowTime>lastFetchTime+PICKLIST_VALUES_BY_RECORD_TYPE_TTL;if(needsRefresh){// Value is stale, get a fresh value.
    // return this._getFreshPicklistsByRecordTypeValue(cacheAccessor, cacheKey, objectApiName, recordTypeId, existingValueWrapper.eTag);
    return this._getFreshValue(cacheAccessor,objectApiName,recordTypeId);}// The value is not stale so it's a cache hit.
    return Thenable.resolve(1/* CACHE_HIT */);}// No existing value, get a fresh value.
    return this._getFreshValue(cacheAccessor,objectApiName,recordTypeId);},valueProviderParameters);return picklistsByRecordTypeValueProvider;}hasValidCachedValue(cacheAccessor,params){const cacheKey=buildCacheKey$b(params.objectApiName,params.recordTypeId);const existingValueWrapper=cacheAccessor.get(cacheKey);return !!existingValueWrapper&&existingValueWrapper.value!==undefined&&cacheAccessor.nowTime<=existingValueWrapper.lastFetchTime+PICKLIST_VALUES_BY_RECORD_TYPE_TTL;}/**
         * Gets a fresh value for picklists by record type and processes it into the cache with the cacheAccessor.
         * @param cacheAccessor An object to transactionally access the cache.
         * @param objectApiName The objectApiName of the picklistsByRecordTypeValue.
         * @param recordTypeId The recordTypeId of the picklistsByRecordTypeValue.
         * @returns Returns a ValueProviderResult representing the outcome of the value provider.
         */_getFreshValue(cacheAccessor,objectApiName,recordTypeId){let picklistValuesByRecordTypeThenable;const params={objectApiName,recordTypeId};{picklistValuesByRecordTypeThenable=aggregateUiExecutor.executeSingleRequestOverAggregateUi("getPicklistValuesByRecordType",params,PICKLIST_VALUES_BY_RECORD_TYPE_TTL);}return picklistValuesByRecordTypeThenable.then(transportResponse=>{// Cache miss.
    const freshPicklistsByRecordType=transportResponse.body;this.stagePutValue([],freshPicklistsByRecordType,cacheAccessor,{objectApiName,recordTypeId});const affectedKeys=cacheAccessor.commitPuts();this._ldsCache.handleAffectedKeys(affectedKeys,cacheAccessor);return 2/* CACHE_MISS */;});}}/**
     * Wire adapter id: getPicklistValuesByRecordType.
     * @throws Always throws an error when invoked. Imperative invocation is not supported.
     */function getPicklistValuesByRecordType(){throw generateError("getPicklistValuesByRecordType");}/**
     * Generates the wire adapters for:
     * @wire getPicklistValuesByRecordType
     */class PicklistValuesByRecordTypeWireAdapterGenerator{/**
         * Constructor.
         * @param picklistValuesByRecordTypeService Reference to the PicklistValuesByRecordTypeService instance.
         */constructor(picklistValuesByRecordTypeService){this._picklistValuesByRecordTypeService=picklistValuesByRecordTypeService;}/**
         * Generates the wire adapter for @wire getPicklistValuesByRecordType.
         * @returns Returns the generated wire adapter for getPicklistValuesByRecordType
         */generateGetPicklistValuesByRecordTypeWireAdapter(){const wireAdapter=generateWireAdapter(this.serviceGetPicklistValuesByRecordType.bind(this));return wireAdapter;}/**
         * @private Made public for testing.
         * Services getPicklistValuesByRecordType @wire.
         * @param config Config params for the service.
         * @return Observable stream that emits a picklist values by record type object.
         */serviceGetPicklistValuesByRecordType(config){if(!config){return undefined;}{const required=["objectApiName","recordTypeId"];const supported=["objectApiName","recordTypeId"];validateConfig("getPicklistValuesByRecordType",config,required,supported);}if(!config.objectApiName||!config.recordTypeId){return undefined;}return this._picklistValuesByRecordTypeService.getPicklistValuesByRecordType(config.objectApiName,config.recordTypeId);}}/**
     * The valueType to use when building RecordAvatarsCacheKey.
     */const RECORD_AVATAR_BULK_VALUE_TYPE="uiapi.RecordAvatarBulk";/**
     * Time to live for the RecordAvatars cache value. 5 minutes.
     */const RECORD_AVATAR_BULK_TTL=5*60*1000;/**
     * Constructs a cache key for the RecordAvatars value type.
     * @param recordIds An array of recordIds.
     * @returns A new cache key representing the RecordAvatars value type.
     */function buildCacheKey$c(recordIds){{assert$1(recordIds.length,"A non-empty recordIds must be provided.");}return {type:RECORD_AVATAR_BULK_VALUE_TYPE,key:`${JSON.stringify(recordIds)}`};}/**
     * Transforms and returns the given RecordAvatarBulk into RecordAvatarRepresentations.
     * This is a shallow copy of RecordAvatarRepresentation entries contained in the provided RecordAvatarBulk
     * @param recordAvatarBulk The instance of RecordAvatarBulk to transform into a RecordAvatarRepresentations.
     * @returns RecordAvatarRepresentations transformed from the provided RecordAvatarBulk
     */function createRecordAvatarRepresentationsFromRecordAvatarBulk(recordAvatarBulk){const results=[];let hasErrors=false;const recordAvatarIds=Object.keys(recordAvatarBulk);for(let len=recordAvatarIds.length,n=0;n<len;n++){results.push(recordAvatarBulk[recordAvatarIds[n]]);if(recordAvatarBulk[recordAvatarIds[n]].statusCode!==200){hasErrors=true;}}return {hasErrors,results};}/**
     * Transforms the given RecordAvatarRepresentations into a RecordAvatarBulk using the provided recordAvatarIds
     * This is a shallow copy of RecordAvatarRepresentation entries contained in the provided RecordAvatarRepresentations
     * @param freshRecordAvatarsValue Instance of RecordAvatarRepresentations to index based on recordAvatarIds
     * @param recordAvatarIds Ids to index new RecordAvatarBulk with
     * @returns RecordAvatarBulk instance transformed from the args
     */function createRecordAvatarBulkFromRecordAvatarRepresentations(freshRecordAvatarsValue,recordAvatarIds){const recordAvatarBulk={};for(let len=freshRecordAvatarsValue.results.length,n=0;n<len;n++){const recordAvatarId=recordAvatarIds[n];const recordAvatarRepresentation=freshRecordAvatarsValue.results[n];recordAvatarBulk[recordAvatarId]=recordAvatarRepresentation;}return recordAvatarBulk;}/**
     * The valueType to use when building RecordAvatarCacheKey.
     */const RECORD_AVATAR_VALUE_TYPE="uiapi.RecordAvatarRepresentation";/**
     * Time to live for the RecordAvatar cache value. 5 minutes.
     */const RECORD_AVATAR_TTL=5*60*1000;/**
     * Constructs a cache key for the RecordAvatar value type.
     * @param recordId The recordId.
     * @returns CacheKey - A new cache key representing the RecordAvatar value type.
     */function buildCacheKey$d(recordId){{assert$1(recordId,"A non-empty recordId must be provided.");}return {type:RECORD_AVATAR_VALUE_TYPE,key:`${recordId}`};}/**
     * Provides functionality to read record avatar data from the cache. Can refresh the data from the server.
     * We do not utilize caching or sending eTags to the server for this value type because it gets invalidated
     * quickly on the client from having its atoms updated.
     */class RecordAvatarService extends LdsServiceBase{/**
         * Constructor.
         * @param ldsCache Reference to the LdsCache instance.
         */constructor(ldsCache){super(ldsCache,[RECORD_AVATAR_VALUE_TYPE]);}getCacheValueTtl(){return RECORD_AVATAR_TTL;}/**
         * Stage puts the given recordAvatar.
         * @param dependencies An array of dependent cache keys.
         * @param recordAvatar The recordAvatar to cache.
         * @param cacheAccessor An object to access cache directly.
         * @param additionalData A property bag with additional values that are needed to generate the cache key.
         * @returns A Thenable that resolves when the stagePut has completed.
         */stagePutValue(dependencies,recordAvatar,cacheAccessor,additionalData){const recordAvatarCacheKey=buildCacheKey$d(additionalData.recordAvatarId);const existingRecordAvatarValueWrapper=cacheAccessor.get(recordAvatarCacheKey);let eTag;if(recordAvatar.result.eTag){eTag=recordAvatar.result.eTag;}if(existingRecordAvatarValueWrapper&&existingRecordAvatarValueWrapper.eTag===eTag){cacheAccessor.stageDependencies(dependencies,recordAvatarCacheKey);cacheAccessor.stagePutUpdateLastFetchTime(recordAvatarCacheKey);return;}// Strip out the eTag from the value. We don't want to emit eTags!
    recordAvatar=this.stripETagsFromValue(recordAvatar);cacheAccessor.stagePut(dependencies,recordAvatarCacheKey,recordAvatar,recordAvatar,{eTag});}/**
         * Strips all eTag properties from the given recordAvatar by directly deleting them.
         * @param recordAvatar The recordAvatar from which to strip the eTags.
         * @returns The given recordAvatar with its eTags stripped.
         */stripETagsFromValue(recordAvatar){delete recordAvatar.result.eTag;return recordAvatar;}}/**
     * Provides functionality to read record avatar data from the cache. Can refresh the data from the server.
     * We do not utilize caching or sending eTags to the server for this value type because it gets invalidated
     * quickly on the client from having its atoms updated.
     */class RecordAvatarBulkService extends LdsServiceBase{/**
         * Constructor.
         * @param ldsCache Reference to the LdsCache instance.
         */constructor(ldsCache){super(ldsCache,[RECORD_AVATAR_BULK_VALUE_TYPE]);}getCacheValueTtl(){return RECORD_AVATAR_BULK_TTL;}/**
         * Retrieves avatars specified for the specified record Ids.
         * @param recordIds The array of record ids.
         * @returns An observable for the avatar values specified by the given parameters.
         */getRecordAvatars(recordIds){// Remove any duplicates and sort the recordIds.
    // We sort so that same set of recordIds specified in any order results in the same avatar group key.
    let uniqueRecordIds=collectionToArray(new Set(recordIds)).sort();uniqueRecordIds=uniqueRecordIds.map(to18);const recordAvatarBulkCacheKey=buildCacheKey$c(uniqueRecordIds);const vpArgs={recordIds:uniqueRecordIds,cacheKey:recordAvatarBulkCacheKey,forceProvide:false};return this._ldsCache.get(recordAvatarBulkCacheKey,this._createRecordAvatarBulkValueProvider(vpArgs));}/**
         * Stage put the recordAvatars.
         * Usage Example: This is used by record-layouts module to store the avatars it fetches into the cache.
         * @param dependencies An array of dependent cache keys which depend on this stage put.
         * @param recordAvatars Object with a results array of objects representing avatars
         *      results[0].result = result_avatar_for_001xx12345
         *      results[1].result = result_avatar_for_005xx56789
         *      results[2].result = result_404
         * @param cacheAccessor Cache Accessor used in the scope of this operation.
         * @param additionalData bag of required data for stagePut. Expects the following:
         *      {
         *          recordIds: string[]
         *      }
         */stagePutValue(dependencies,recordAvatars,cacheAccessor,additionalData){if(recordAvatars&&recordAvatars.results&&recordAvatars.results.length){// Avenues exist that do not send this along. That's *okay*, we can deal with it by inspecting the inbound information.
    // The natural format of recordAvatarBulk is RecordAvatarRepresentations. As of 218 some paths do not return this from the server.
    // ones that DO return this format, in case of error, do not include the recordId of the RecordAvatarInvalidResult
    if(!additionalData||!additionalData.recordAvatarIds||!additionalData.recordAvatarIds.length){const recordIds=[];for(let idx=0,len=recordAvatars.results.length;idx<len;idx++){const anAvatar=recordAvatars.results[idx];if(anAvatar.statusCode===200){const validResult=anAvatar.result;recordIds.push(validResult.recordId);}else{// If the status code is !== 200, there was a problem, which means there's NO associated recordId with this data
    // we presently have no choice but to skip putting this entry unless RecordAvatarInvalidResult entries begin to include recordId data from the services
    recordAvatars.results.splice(idx,1);idx--;len--;}}additionalData={recordAvatarIds:recordIds};}if(additionalData.recordAvatarIds.length){const recordAvatarBulk=createRecordAvatarBulkFromRecordAvatarRepresentations(recordAvatars,additionalData.recordAvatarIds);const recordAvatarBulkCacheKey=buildCacheKey$c(additionalData.recordAvatarIds);this._normalizeAndStagePutRecordAvatarBulk(dependencies,recordAvatarBulk,cacheAccessor,recordAvatarBulkCacheKey);}}}/**
         * Strips all eTag properties from the given recordAvatarBulk by directly deleting them.
         * @param recordAvatarBulk The recordAvatarBulk from which to strip the eTags.
         * @returns The given recordAvatarBulk with its eTags stripped.
         */stripETagsFromValue(recordAvatarBulk){const recordIds=Object.keys(recordAvatarBulk);for(let len=recordIds.length,n=0;n<len;n++){const recordId=recordIds[n];const recordAvatar=recordAvatarBulk[recordId];recordAvatarBulk[recordId]=this._ldsCache.stripETagsFromValue(RECORD_AVATAR_VALUE_TYPE,recordAvatar);}return recordAvatarBulk;}/**
         * Denormalize the normalizedAvatars.
         * @param normalizedAvatars The normalized group avatar.
         * @param affectedKey The key that we are denormalizing.
         * @param cacheAccessor The cacheAccessor used in scope for this operation.
         * @returns The Thenable that will resolve to the denormalized avatars or undefined if a nested avatar cannot be found in the cache.
         */denormalizeValue(normalizedAvatars,cacheAccessor){const denormedAvatars={};const avatarRecordIds=Object.keys(normalizedAvatars);for(let len=avatarRecordIds.length,n=0;n<len;n++){const avatarRecordId=avatarRecordIds[n];const avatarMarker=normalizedAvatars[avatarRecordId];const avatarCacheKey=buildCacheKey$d(avatarMarker.id);const avatar=cacheAccessor.get(avatarCacheKey);if(!avatar){throw getLdsInternalError("DENORMALIZE_FAILED",`Did not find avatar for '${serialize(avatarCacheKey)}''}`,true);}const avatarValue=avatar.value;{assert$1(avatarValue,"avatar.value was falsy");}// Individual avatar values are frozen in cache, so clone will optimize and return same value here.
    denormedAvatars[avatarRecordId]=cloneDeepCopy(avatarValue);}return denormedAvatars;}/**
         * @returns The affected key handler for this service.
         */getAffectedKeyHandler(){return (avatarsAffectedKey,cacheAccessor)=>{{assert$1(avatarsAffectedKey.type===RECORD_AVATAR_BULK_VALUE_TYPE,`Unexpected value type: ${avatarsAffectedKey.type.toString()}`);}// Get avatars group normed value. This will have markers for each avatar.
    const avatarsValueWrapper=cacheAccessor.get(avatarsAffectedKey);if(avatarsValueWrapper){const avatarsValue=avatarsValueWrapper.value;{assert$1(avatarsValueWrapper,`avatarsWrapper is falsy`);assert$1(avatarsValue,`avatarsWrapperValue is falsy ${avatarsValue}`);}if(avatarsValueWrapper&&avatarsValue){// Denorm value (replace marker for each avatar with actual value) and stageemit.
    const denormedAvatars=this.denormalizeValue(avatarsValue,cacheAccessor);const recordAvatarsValueWrapperToEmit=cloneWithValueOverride(avatarsValueWrapper,denormedAvatars);cacheAccessor.stageEmit(avatarsAffectedKey,recordAvatarsValueWrapperToEmit);}}};}/**
         * Constructs a valueProvider to retrieve Avatars for a group of recordIds and cache them if there is a CACHE_MISS.
         * @param valueProviderParameters The parameters for the value provider as an object.
         * @returns Value Provider to retrieve Avatars.
         */_createRecordAvatarBulkValueProvider(valueProviderParameters){const{cacheKey,recordIds,forceProvide}=valueProviderParameters;const recordAvatarBulkValueProvider=new ValueProvider(cacheAccessor=>{if(forceProvide){// Here we refresh all individual avatars.
    const cachedRecordAvatarBulk={};return this._getFreshValue(cacheAccessor,cacheKey,recordIds,cachedRecordAvatarBulk);}const existingValueWrapper=cacheAccessor.get(cacheKey);if(existingValueWrapper&&existingValueWrapper.value!==undefined){// We have the record avatar bulk value already in the cache.
    const nowTime=cacheAccessor.nowTime;const lastFetchTime=existingValueWrapper.lastFetchTime;// check for ttl expiry.
    const needsRefresh=nowTime>lastFetchTime+RECORD_AVATAR_BULK_TTL;if(needsRefresh){// TTL for avatars group value has expired. Refresh individual avatars within group whose TTL has expired.
    // Pass false for useCacheIndividualAvatarsWithoutCheckingTtl so that we only use individual avatars that have not expired.
    const recordAvatarIdsToFetchAndRecordAvatarBulkInCache=this._getRecordAvatarIdsToFetchFromServer(recordIds,cacheAccessor,false);return this._getFreshValue(cacheAccessor,cacheKey,recordAvatarIdsToFetchAndRecordAvatarBulkInCache.recordIdsToFetch,recordAvatarIdsToFetchAndRecordAvatarBulkInCache.cachedRecordAvatarBulk);}return Thenable.resolve(1/* CACHE_HIT */);}// We do not have this avatars value in cache. Determine which individual avatar values we already have.
    // Pass true for useCacheIndividualAvatarsWithoutCheckingTtl. In this case, we use individual avatar values from cache as long without checking ttl.
    const recordIdsToFetchAndRecordAvatarsInCache=this._getRecordAvatarIdsToFetchFromServer(recordIds,cacheAccessor,true);return this._getFreshValue(cacheAccessor,cacheKey,recordIdsToFetchAndRecordAvatarsInCache.recordIdsToFetch,recordIdsToFetchAndRecordAvatarsInCache.cachedRecordAvatarBulk);},valueProviderParameters);return recordAvatarBulkValueProvider;}/**
         * Gets a fresh value and processes it into the cache with the cacheAccessor.
         * @param cacheAccessor An object to transactionally access the cache.
         * @param cacheKey The cache key for the recordAvatars.
         * @param recordIds The list of record ids for the recordAvatars.
         * @param recordIdsToFetch The list of record ids identifying which record avatars to fetch from the server.
         * @param cachedRecordAvatarBulk The list of record ids identifying which record avatars are already in cache and should be COMBINED with the response from the server.
         * @returns Returns a thenable representing the outcome of the value provider.
         */_getFreshValue(cacheAccessor,cacheKey,recordIdsToFetch,cachedRecordAvatarBulk){let transportResponseThenable;const params={recordIds:recordIdsToFetch};if(recordIdsToFetch.length>0){// If we need to fetch any from the server.
    {transportResponseThenable=aggregateUiExecutor.executeSingleRequestOverAggregateUi("getRecordAvatars",params,RECORD_AVATAR_BULK_TTL);}}else{// We did not need to fetch any from server. Set to empty.
    const results=[];transportResponseThenable=Thenable.resolve(getOkFetchResponse({results}));}return transportResponseThenable.then(transportResponse=>{// Cache miss.
    const freshRecordAvatarsValue=transportResponse.body;// Transform the response into the shape cached by LDS and normalize it.
    let recordAvatarBulk=createRecordAvatarBulkFromRecordAvatarRepresentations(freshRecordAvatarsValue,recordIdsToFetch);recordAvatarBulk=Object.assign(recordAvatarBulk,cachedRecordAvatarBulk);this._normalizeAndStagePutRecordAvatarBulk([],recordAvatarBulk,cacheAccessor,cacheKey);const affectedKeys=cacheAccessor.commitPuts();this._ldsCache.handleAffectedKeys(affectedKeys,cacheAccessor);return 2/* CACHE_MISS */;});}/**
         * Takes the denormalized avatars and normalizes it.
         * Then stagePuts the normalized group avatar and the individual avatars.
         * @param dependentCacheKeys An array of dependent cache keys.
         * @param recordAvatarBulk The denormalized avatars to be cached.
         * @param cacheAccessor Cache Accessor reference.
         * @param recordAvatarBulkCacheKey The cache key for the group avatar.
         */_normalizeAndStagePutRecordAvatarBulk(dependentCacheKeys,recordAvatarBulk,cacheAccessor,recordAvatarBulkCacheKey){const objectToClone=recordAvatarBulk;const normalizedRecordAvatarBulk=cloneDeepCopy(objectToClone);// Stage put the individual avatar entries.
    const recordAvatarIds=Object.keys(normalizedRecordAvatarBulk);for(let len=recordAvatarIds.length,n=0;n<len;n++){const recordAvatarRecordId=recordAvatarIds[n];const recordAvatar=recordAvatarBulk[recordAvatarRecordId];// Replace avatar value with marker. Include id and eTag in the marker.
    normalizedRecordAvatarBulk[recordAvatarRecordId]={id:recordAvatarRecordId,eTag:recordAvatar.result.eTag};const recordAvatarStagePutAdditionalData={recordAvatarId:recordAvatarRecordId};this._ldsCache.stagePutValue(RECORD_AVATAR_VALUE_TYPE,[{cacheKey:recordAvatarBulkCacheKey,type:1/* REQUIRED */}],recordAvatar,cacheAccessor,recordAvatarStagePutAdditionalData);}// Stage put the normalized bulk object.
    recordAvatarBulk=this.stripETagsFromValue(recordAvatarBulk);cacheAccessor.stagePut(dependentCacheKeys,recordAvatarBulkCacheKey,normalizedRecordAvatarBulk,recordAvatarBulk);}/**
         * From the parameter specifying a list of all recordIds that we need avatars for,
         * this function returns
         *  1) A list of recordIds that need their avatars fetched from the server.
         *  2) For values that already exist in the cache, it returns recordIdAvatarsInCache as below
         *       recordIdAvatarsInCache["001xx12345"] = avatar_for_001xx12345
         *       recordIdAvatarsInCache["005xx55667"] = avatar_for_005xx55667
         * Values in cache as checked for ttl based on th ignoreTtl flag.
         * @param recordIds An array of recordIds we need avatars for.
         * @param cacheAccessor Cache Accessor used in the scope of this operation.
         * @param useCacheIndividualAvatarsWithoutCheckingTtl True if we need to use values from cache ignoring their ttl.
         * @returns Thenable resolves to an object {recordIdsToFetch, recordIdAvatarsInCache} - See description.
         */_getRecordAvatarIdsToFetchFromServer(recordIds,cacheAccessor,useCacheIndividualAvatarsWithoutCheckingTtl){const recordIdsToFetch=[];const recordAvatarBulkFromCache={};for(let len=recordIds.length,n=0;n<len;n++){const recordId=recordIds[n];const avatarCacheKey=buildCacheKey$d(recordId);const recordAvatarValueWrapper=cacheAccessor.get(avatarCacheKey);let fetch=true;const avatarValue=recordAvatarValueWrapper!==undefined?recordAvatarValueWrapper.value:undefined;if(recordAvatarValueWrapper!=null&&avatarValue!=null){// We have a avatar value in cache.
    if(useCacheIndividualAvatarsWithoutCheckingTtl){// We do not care about ttl. Since value in cache is available, set fetch to false.
    fetch=false;}else{// We care about ttl expired.
    const nowTime=cacheAccessor.nowTime;const lastFetchTime=recordAvatarValueWrapper.lastFetchTime;// check for ttl expiry. If expiree, refresh individual avatars whose TTL has expired.
    const needsRefresh=nowTime>lastFetchTime+RECORD_AVATAR_BULK_TTL;if(!needsRefresh){fetch=false;// We have avatar and ttl has not expired.
    }}}if(fetch){recordIdsToFetch.push(recordId);}else{recordAvatarBulkFromCache[recordId]=avatarValue;}}// Need to clone the cached values because they are going to be renormalized.
    const recordIdsToFetchAndRecordAvatarsInCache={recordIdsToFetch,cachedRecordAvatarBulk:cloneDeepCopy(recordAvatarBulkFromCache)};return recordIdsToFetchAndRecordAvatarsInCache;}}/**
     * Wire adapter id: getRecordAvatars.
     * @throws Always throws when invoked. Imperative invocation is not supported.
     */function getRecordAvatars(){throw generateError("getRecordAvatars");}/**
     * Generates the wire adapters for:
     *      * @wire getRecordAvatars
     */class RecordAvatarBulkWireAdapterGenerator{/**
         * Constructor.
         * @param recordAvatarBulkService Reference to the RecordAvatarBulkService instance.
         */constructor(recordAvatarBulkService){this._recordAvatarBulkService=recordAvatarBulkService;}/**
         * Generates the wire adapter for @wire getRecordAvatars.
         * @returns See description.
         */generateGetRecordAvatarsWireAdapter(){const wireAdapter=generateWireAdapter(this.serviceGetRecordAvatars.bind(this));return wireAdapter;}/**
         * @private Made public for testing.
         * Service getRecordAvatars @wire.
         * @param config Config params for the service.
         * @return Observable stream that emits a record avatars object.
         */serviceGetRecordAvatars(config){if(!config||!config.recordIds){return undefined;}return this._recordAvatarBulkService.getRecordAvatars(config.recordIds);}}/**
     * The valueType to use when building RecordCreateDefaultsCacheKey.
     */const RECORD_CREATE_DEFAULTS_VALUE_TYPE="uiapi.RecordDefaultsRepresentation";/**
     * Time to live for RecordCreateDefaults object. 15 minutes.
     */const RECORD_CREATE_DEFAULTS_TTL=15*60*1000;/**
     * Constructs a cache key for the RecordCreateDefaults value type.
     * @param objectApiName The object api name.
     * @param formFactor The form factor.
     * @param recordTypeId The record type id.
     * @param optionalFields The list of optional fields.
     * @returns A new cache key representing the RecordCreateDefaults value type.
     */function buildCacheKey$e(objectApiName,formFactor,recordTypeId,optionalFields){function errorFormatter(_literals,key,valueFound,singleValue){let base=`${key} should be a string list, but received ${valueFound}`;if(singleValue){base+=`, list contains an entry with value ${singleValue}`;}return base;}function constructKeyFromStringList(key,list){if(list===undefined){return "";}{list.forEach(field=>{assert$1(field,errorFormatter`${key}${list}${field}`);});}return list.join(",");}{if(recordTypeId){assert$1(recordTypeId.length===18,"Record Type Id length should be 18 characters.");}}const cacheKeyPartFormFactor2=formFactor?formFactor.toLowerCase():"Large";const cacheKeyPartRecordTypeId2=recordTypeId?recordTypeId:MASTER_RECORD_TYPE_ID;const cacheKeyPartOptionalFields2=constructKeyFromStringList("optionalFields",optionalFields?optionalFields.sort():undefined);return {type:RECORD_CREATE_DEFAULTS_VALUE_TYPE,key:`${objectApiName.toLowerCase()}${KEY_DELIM}${cacheKeyPartFormFactor2}${KEY_DELIM}${cacheKeyPartRecordTypeId2}${KEY_DELIM}${cacheKeyPartOptionalFields2}`};}/**
     * Returns a RecordCreateDefaultsCacheKeyParams based on a CacheKey.
     * @param cacheKey A cache key string derived from a RecordCreateDefaults CacheKey.
     * @returns See description.
     */function getRecordCreateDefaultsCacheKeyParams(cacheKey){{assert$1(cacheKey.type===RECORD_CREATE_DEFAULTS_VALUE_TYPE,`valueType was expected to be RECORD_CREATE_DEFAULTS_VALUE_TYPE but was not: ${cacheKey.type.toString()}`);}const key=cacheKey.key;const localKeyParts=key.split(KEY_DELIM);const optionalFields=localKeyParts[3]===""?[]:localKeyParts[3].split(",");return {objectApiName:localKeyParts[0],recordTypeId:localKeyParts[2],formFactor:localKeyParts[1],optionalFields};}/**
     * Provides functionality to read record create defaults data from the cache. Can refresh the data from the server.
     */class RecordDefaultsService extends LdsServiceBase{/*
         * Constructor.
         * @param ldsCache Reference to the LdsCache instance.
         */constructor(ldsCache){super(ldsCache,[RECORD_CREATE_DEFAULTS_VALUE_TYPE]);}getCacheValueTtl(){return RECORD_CREATE_DEFAULTS_TTL;}/**
         * Gets record create default values.
         * @param objectApiName API name of the object.
         * @param formFactor Form factor. Possible values are 'Small', 'Medium', 'Large'. Large is default.
         * @param recordTypeId Record type id.
         * @param optionalFields Qualified field API names. If any are inaccessible then they are silently omitted.
         * @returns An observable of record create default values.
         */getRecordCreateDefaults(objectApiName,formFactor,recordTypeId,optionalFields){// Process arguments and check for validity.
    objectApiName=getObjectApiName(objectApiName);if(formFactor!==undefined&&typeof formFactor!=="string"){throw new TypeError(`Expected to get a string for formFactor but instead got ${formFactor}`);}formFactor=formFactor||"Large";if(recordTypeId!==undefined&&typeof recordTypeId!=="string"){throw new TypeError(`Expected to get a string for recordTypeId but instead got ${recordTypeId}`);}recordTypeId=recordTypeId?to18(recordTypeId):MASTER_RECORD_TYPE_ID;if(optionalFields&&!Array.isArray(optionalFields)){throw new TypeError(`Expected to get an array for optionalFields but instead got ${optionalFields}`);}const processedOptionalFields=(optionalFields||[]).map(getFieldApiName);const cacheKey=buildCacheKey$e(objectApiName,formFactor,recordTypeId,processedOptionalFields);const valueProviderParameters={cacheKey,objectApiName,formFactor,recordTypeId,optionalFields:processedOptionalFields,forceProvide:false};const valueProvider=this._createRecordDefaultsValueProvider(valueProviderParameters);return this._ldsCache.get(cacheKey,valueProvider);}/*
         * Stage puts the given recordAvatar.
         * @param dependentCacheKeys An array of dependent cache keys.
         * @param recordAvatar The recordAvatar to cache.
         * @param cacheAccessor An object to access cache directly.
         * @param additionalData A property bag with additional values that are needed to generate the cache key.
         */stagePutValue(dependencies,recordCreateDefaults,cacheAccessor,additionalData){const recordCreateDefaultsCacheKey=buildCacheKey$e(additionalData.objectApiName,additionalData.formFactor,additionalData.recordTypeId,additionalData.optionalFields);this._normalizeAndStagePutRecordCreateDefaults(recordCreateDefaults,cacheAccessor,recordCreateDefaultsCacheKey,dependencies);}/**
         * Strips all eTag properties from the given recordCreateDefaults by directly deleting them.
         * @param recordCreateDefaults The recordCreateDefaults from which to strip the eTags.
         * @returns recordCreateDefaults with its eTags stripped.
         */stripETagsFromValue(recordCreateDefaults){delete recordCreateDefaults.eTag;// Strip eTags from object infos.
    const objectInfos=recordCreateDefaults.objectInfos;const objectApiNames=Object.keys(objectInfos);for(let len=objectApiNames.length,n=0;n<len;++n){const objectApiName=objectApiNames[n];const objectInfo=objectInfos[objectApiName];objectInfos[objectApiName]=this._ldsCache.stripETagsFromValue(OBJECT_INFO_VALUE_TYPE,objectInfo);}// Strip eTags from layout.
    const layout=recordCreateDefaults.layout;recordCreateDefaults.layout=this._ldsCache.stripETagsFromValue(LAYOUT_VALUE_TYPE,layout);// Strip eTags from record.
    const record=recordCreateDefaults.record;recordCreateDefaults.record=this._ldsCache.stripETagsFromValue(RECORD_VALUE_TYPE,record);return recordCreateDefaults;}/**
         * Denormalize record create defaults value.
         * @param normalizedRecordCreateDefaults RecordCreateDefaults normalized value.
         * @param cacheAccessor An object to access the cache directly.
         * @returns Denormalized RecordCreateDefaults.
         * @throws FetchResponse Throws an error if denormalization fails for some reason.
         */denormalizeValue(normalizedRecordCreateDefaults,cacheAccessor){const objectToClone=normalizedRecordCreateDefaults;const denormalizedRecordCreateDefaults=cloneDeepCopy(objectToClone);// Denormalize object infos.
    Object.keys(normalizedRecordCreateDefaults.objectInfos).forEach(objectApiName=>{const objectInfoCacheKey=buildCacheKey$1(objectApiName);const cachedObjectInfoValueWrapper=cacheAccessor.get(objectInfoCacheKey);if(cachedObjectInfoValueWrapper){denormalizedRecordCreateDefaults.objectInfos[objectApiName]=cachedObjectInfoValueWrapper.value;}else{throw getLdsInternalError("DENORMALIZE_FAILED","Did not get an object info back for marker: "+serialize(objectInfoCacheKey),true);}});// Denormalize layout.
    const layoutCacheKey=buildCacheKey$2(normalizedRecordCreateDefaults.layout.objectApiName,normalizedRecordCreateDefaults.layout.recordTypeId,normalizedRecordCreateDefaults.layout.layoutType,normalizedRecordCreateDefaults.layout.mode);const cachedLayoutValueWrapper=cacheAccessor.get(layoutCacheKey);if(cachedLayoutValueWrapper){denormalizedRecordCreateDefaults.layout=cachedLayoutValueWrapper.value;}else{throw getLdsInternalError("DENORMALIZE_FAILED","Did not get a layout back for marker: "+serialize(layoutCacheKey),true);}// The denormalized recordCreateDefaults should now be ready to go.
    return denormalizedRecordCreateDefaults;}/**
         * @returns The affected key handler for this service.
         */getAffectedKeyHandler(){return (affectedKey,_cacheAccessor)=>{{assert$1(affectedKey.type===RECORD_CREATE_DEFAULTS_VALUE_TYPE,`Expected RECORD_CREATE_DEFAULTS_VALUE_TYPE value type for RecordCreateDefaults: ${affectedKey.type.toString()}`);}const recordCreateDefaultsCacheKeyParams=getRecordCreateDefaultsCacheKeyParams(affectedKey);const objectApiName=recordCreateDefaultsCacheKeyParams.objectApiName;const formFactor=recordCreateDefaultsCacheKeyParams.formFactor;const recordTypeId=recordCreateDefaultsCacheKeyParams.recordTypeId;const optionalFields=recordCreateDefaultsCacheKeyParams.optionalFields;// We need to refresh, but we're already in a cache transaction. Kick this to a Promise to get this out of the cache operation we're
    // already in the middle of.
    Promise.resolve().then(()=>{const valueProviderParameters={cacheKey:affectedKey,objectApiName,formFactor,recordTypeId,optionalFields,forceProvide:true};const valueProvider=this._createRecordDefaultsValueProvider(valueProviderParameters);this._ldsCache.get(affectedKey,valueProvider);});};}/**
         * Constructs a value provider to retrieve record default values.
         * @param valueProviderParameters: Parameters for the record create defaults value provider.
         * @returns The value provider to retrieve record defaults.
         */_createRecordDefaultsValueProvider(valueProviderParameters){const valueProvider=new ValueProvider((cacheAccessor,valueProviderParams)=>{const{cacheKey,objectApiName,formFactor,recordTypeId,optionalFields,forceProvide}=valueProviderParams;if(forceProvide){return this._getFreshValue(cacheAccessor,cacheKey,objectApiName,formFactor,recordTypeId,optionalFields);}const existingValueWrapper=cacheAccessor.get(cacheKey);if(existingValueWrapper&&existingValueWrapper.value!==undefined){// Determine if the value in the cache needs a refresh.
    const nowTime=cacheAccessor.nowTime;const lastFetchTime=existingValueWrapper.lastFetchTime;// check for ttl expiry
    const needsRefresh=nowTime>lastFetchTime+RECORD_CREATE_DEFAULTS_TTL;if(needsRefresh){// Value is stale, get a fresh value.
    return this._getFreshValue(cacheAccessor,cacheKey,objectApiName,formFactor,recordTypeId,optionalFields);}// Value is not stale, but we still need to validate it.
    const isValid=this._validateRecordCreateDefaultsCacheValue(cacheAccessor,existingValueWrapper.value);if(isValid){// Value contained in the cache is determined to be valid so return a cache hit!
    return Thenable.resolve(1/* CACHE_HIT */);}// Existing value is not valid; get a fresh value.
    return this._getFreshValue(cacheAccessor,cacheKey,objectApiName,formFactor,recordTypeId,optionalFields);}// No existing value; get a fresh value.
    return this._getFreshValue(cacheAccessor,cacheKey,objectApiName,formFactor,recordTypeId,optionalFields);},valueProviderParameters);return valueProvider;}hasValidCachedValue(cacheAccessor,params){const cacheKey=buildCacheKey$e(params.objectApiName,params.formfactor,params.recordTypeId,params.optionalFields);const existingValueWrapper=cacheAccessor.get(cacheKey);return !!existingValueWrapper&&existingValueWrapper.value!==undefined&&cacheAccessor.nowTime<=existingValueWrapper.lastFetchTime+RECORD_CREATE_DEFAULTS_TTL&&this._validateRecordCreateDefaultsCacheValue(cacheAccessor,existingValueWrapper.value);}/**
         * Gets a fresh value and processes it into the cache with the cacheAccessor.
         * @param cacheAccessor An object to transactionally access the cache.
         * @param cacheKey The cache key for the recordCreateDefaults.
         * @param objectApiName The objectApiName of the recordCreateDefaults.
         * @param formFactor The formFactor of the recordCreateDefaults.
         * @param recordTypeId The recordTypeId of the recordCreateDefaults.
         * @param optionalFields The list of optional fields for the recordCreateDefaults.
         * @returns ValueProvider result representing the outcome of the value provider.
         */_getFreshValue(cacheAccessor,cacheKey,objectApiName,formFactor,recordTypeId,optionalFields){const params={objectApiName,formFactor,recordTypeId,optionalFields};let transportResponseThenable;{transportResponseThenable=aggregateUiExecutor.executeSingleRequestOverAggregateUi("getRecordCreateDefaults",params,RECORD_CREATE_DEFAULTS_TTL);}return transportResponseThenable.then(transportResponse=>{// Cache miss.
    const freshRecordCreateDefaults=transportResponse.body;cacheAccessor.stageClearDependencies(cacheKey);// Nothing should depend on this yet; included for completeness.
    this.stagePutValue([],freshRecordCreateDefaults,cacheAccessor,{objectApiName,formFactor,recordTypeId,optionalFields});const affectedKeys=cacheAccessor.commitPuts();this._ldsCache.handleAffectedKeys(affectedKeys,cacheAccessor);return 2/* CACHE_MISS */;});}/**
         * Returns true if the existing formUi cache value is valid, else false.
         * @param cacheAccessor The cacheAccessor.
         * @param normalizedRecordCreateDefaults The existing recordCreateDefaults cache value.
         * @returns See description.
         */_validateRecordCreateDefaultsCacheValue(cacheAccessor,normalizedRecordCreateDefaults){const denormalizedRecordCreateDefaults=this.denormalizeValue(normalizedRecordCreateDefaults,cacheAccessor);return !!denormalizedRecordCreateDefaults;}/**
         * Normalize record create defaults value.
         * @param denormalizedRecordCreateDefaults RecordCreateDefaults denormalized value
         * @param cacheAccessor An object to access cache directly.
         * @param recordCreateDefaultsCacheKey The cache key for RecordCreateDefaults.
         */_normalizeAndStagePutRecordCreateDefaults(denormalizedRecordCreateDefaults,cacheAccessor,recordCreateDefaultsCacheKey,dependencies){const objectToClone=denormalizedRecordCreateDefaults;const normalizedRecordCreateDefaults=cloneDeepCopy(objectToClone);// Object Info normalization
    const objectInfos=denormalizedRecordCreateDefaults.objectInfos;Object.keys(objectInfos).forEach(apiName=>{const objectInfo=objectInfos[apiName];// Construct the marker.
    normalizedRecordCreateDefaults.objectInfos[apiName]={objectApiName:objectInfo.apiName,eTag:objectInfo.eTag};this._ldsCache.stagePutValue(OBJECT_INFO_VALUE_TYPE,[{cacheKey:recordCreateDefaultsCacheKey,type:1/* REQUIRED */}],objectInfo,cacheAccessor);});// Layout normalization
    const layout=denormalizedRecordCreateDefaults.layout;const objectApiName=denormalizedRecordCreateDefaults.record.apiName;// Construct the marker for layout. We need to keep the following data on the marker so that we have the necessary data
    // to recreate the layout cache key during denormalization and for checking for refresh during the affected key handler.
    const recordTypeId=getRecordTypeIdFromRecord(denormalizedRecordCreateDefaults.record);// Add Layout Marker
    normalizedRecordCreateDefaults.layout={recordTypeId,objectApiName,layoutType:layout.layoutType,mode:layout.mode,eTag:layout.eTag};this._ldsCache.stagePutValue(LAYOUT_VALUE_TYPE,[{cacheKey:recordCreateDefaultsCacheKey,type:1/* REQUIRED */}],layout,cacheAccessor,{objectApiName,recordTypeId});// Stage put the record create defaults.
    // Strip out the eTag from the value. We don't want to emit eTags!
    const eTag=normalizedRecordCreateDefaults.eTag;delete normalizedRecordCreateDefaults.eTag;denormalizedRecordCreateDefaults=this.stripETagsFromValue(denormalizedRecordCreateDefaults);cacheAccessor.stagePut(dependencies,recordCreateDefaultsCacheKey,normalizedRecordCreateDefaults,denormalizedRecordCreateDefaults,{eTag});}}/**
     * Wire adapter id: getRecordCreateDefaults.
     * @throws Error - Always throws when invoked. Imperative invocation is not supported.
     * @returns void
     */function getRecordCreateDefaults(){throw generateError("getRecordCreateDefaults");}/**
     * Generates the wire adapters for:
     * @wire getRecordCreateDefaults
     */class RecordDefaultsWireAdapterGenerator{/*
         * Constructor.
         * @param recordDefaultsService Reference to the RecordDefaultsService instance.
         */constructor(recordDefaultsService){this._recordDefaultsService=recordDefaultsService;}/**
         * Generates the wire adapter for @wire getRecordCreateDefaults
         * @returns See description.
         */generateGetRecordCreateDefaultsWireAdapter(){const wireAdapter=generateWireAdapter(this._serviceGetRecordCreateDefaults.bind(this));return wireAdapter;}/**
         * Service getRecordCreateDefaults @wire.
         * @private Made public for testing.
         * @param config Config params for the service. The type is or'd with any so that we can test sending bad configs. Consumers will be able to send us bad configs.
         * @return Observable stream that emits a recordCreateDefaults object.
         */_serviceGetRecordCreateDefaults(config){if(!config){return undefined;}{const required=["objectApiName"];const supported=["formFactor","objectApiName","optionalFields","recordTypeId"];validateConfig("getRecordCreateDefaults",config,required,supported);}if(!config.objectApiName){return undefined;}return this._recordDefaultsService.getRecordCreateDefaults(config.objectApiName,config.formFactor,config.recordTypeId,config.optionalFields);}}/**
     * Value type for Record Edit Actions
     */const RECORD_EDIT_ACTIONS_VALUES_VALUE_TYPE="lds.RecordEditActions";/**
     * Record Edit Actions expires in 5 seconds in the cache
     */const RECORD_EDIT_ACTIONS_TTL=5*60*1000;/**
     * Builds a CacheKey for Record Edit Actions
     * @param recordIds Sets the recordIds.
     * @param formFactor Set the formfactor.
     * @param sections Sets the sections.
     * @param actionsTypes Set the action types.
     * @return A CacheKey for Record Edit Actions
     */function buildCacheKey$f(recordIds,formFactor,sections,actionTypes){{assert$1(recordIds.length,"A non-empty recordIds must be provided");}const recordId=stableCommaDelimitedString(recordIds.map(to18));formFactor=(formFactor||"").toLowerCase();const section=stableCommaDelimitedString(toLowerCase(sections));const actionType=stableCommaDelimitedString(toLowerCase(actionTypes));const key=[recordId,formFactor,section,actionType].join(KEY_DELIM);return {type:RECORD_EDIT_ACTIONS_VALUES_VALUE_TYPE,key};}/** The ui api endpoint of record edit actions
     */const ACTIONS_GLOBAL_CONTROLLER$1="ActionsController.getRecordEditActions";/**
     * Service to retrieve Record Edit Actions via UI API
     * @extends LdsServiceBase
     */class RecordEditActionsService extends LdsServiceBase{constructor(ldsCache,functionProvidesValueProviderFunction){super(ldsCache,[RECORD_EDIT_ACTIONS_VALUES_VALUE_TYPE]);/**
             * Implementation of affected key handler for this service
             */this.affectedKeyHandler=(affectedKey,cacheAccessor)=>{const oldValueWrapper=cacheAccessor.get(affectedKey);if(oldValueWrapper){const updatedActionPayloadToEmit=denormalizeValue(cacheAccessor,oldValueWrapper.value);const valueWrapper=cloneWithValueOverride(oldValueWrapper,updatedActionPayloadToEmit);cacheAccessor.stageEmit(affectedKey,valueWrapper);}};this._functionProvidesValueProviderFunction=functionProvidesValueProviderFunction;}getCacheValueTtl(){return RECORD_EDIT_ACTIONS_TTL;}/**
         * Checks if cache entry has a value
         * @param entry Cache Entry
         * @return True if cache entry has a value
         */doesCacheEntryHaveValue(entry){return !!entry&&entry.value!==undefined;}/**
         * Checks if cache entry has expired
         * @param now Current timestamp
         * @param entry
         * @return True if cache has expired
         */hasNotExpired(now,entry){return !isNaN(now)&&!isNaN(entry.lastFetchTime)&&now-entry.lastFetchTime<RECORD_EDIT_ACTIONS_TTL;}/**
         * A higher order function to return an affected key handler
         */getAffectedKeyHandler(){return this.affectedKeyHandler;}/**
         * Retrieves Record Edit Actions through either a Cache hit or a fresh API call
         * @param recordIds records with the action
         * @param requestParams options to filter the resulting actions by form factor, section, or action type
         * @returns collection of actions grouped by associated object api name
         */getRecordEditActions(recordIds,requestParams){const parameters=Object.assign({},{recordId:recordIds},requestParams);const cacheKey=this.buildCacheKey(parameters);const valueProviderFunction=this._functionProvidesValueProviderFunction?this._functionProvidesValueProviderFunction(cacheKey,parameters,false):this.getValueProviderFn(cacheKey,parameters,false);return this._ldsCache.get(cacheKey,new ValueProvider(valueProviderFunction,{}));}/**
         * Stage puts the given action.
         * @param dependencies List of dependent cache keys.
         * @param action The action to stagePut.
         * @param cacheAccessor An object to access cache directly.
         */stagePutValue(dependencies,action,cacheAccessor,additionalData){const recordActionCacheKey=this.buildCacheKey(additionalData);cacheAccessor.stagePut(dependencies,recordActionCacheKey,action,action);}/**
         * Strips all eTag properties from the given action by directly deleting them.
         * @param action The action from which to strip the eTags.
         * @returns The given action with its eTags stripped.
         */stripETagsFromValue(action){delete action.eTag;return action;}/**
         * Denormalizes the given normalizedValue and returns it.
         * @param normalizedValue The normalizedValue to denormalize.
         * @param cacheAccessor Used to access the cache.
         * @returns The denormalized record edit actions value.
         */denormalizeValue(normalizedValue,cacheAccessor){const denormalizedValue=denormalizeValue(cacheAccessor,normalizedValue);return denormalizedValue;}/**
         * Generates a function for constructing a value provider
         * @param cacheKey Key associated with parameters
         * @param params Required for retrieving data from source
         * @param forceFetch Indicates whether a server round trip is forced
         * @returns value provider function for status of cache query: CACHE_MISS/CACHE_HIT/CACHE_MISS_REFRESH_UNCHANGED
         */getValueProviderFn(cacheKey,params,forceFetch){return cacheAccessor=>{const cacheEntry=cacheAccessor.get(cacheKey);if(!forceFetch&&this.doesCacheEntryHaveValue(cacheEntry)&&this.hasNotExpired(cacheAccessor.nowTime,cacheEntry)){return Thenable.resolve(1/* CACHE_HIT */);}return this.primeCacheEntries(params,cacheAccessor,cacheKey).then(result=>{if(cacheEntry&&cacheEntry.eTag&&result.eTag&&cacheEntry.eTag===result.eTag){return 3/* CACHE_MISS_REFRESH_UNCHANGED */;}else{return 2/* CACHE_MISS */;}});};}/**
         * Fetches data from server, primes cache entry, and performs related housekeeping
         * @param parameters Required for retrieval of data from server
         * @param cacheAccessor Accessor to underlying data for the transaction
         * @param cacheKey Key associated with request
         * @returns A raw payload from the server
         */primeCacheEntries(parameters,cacheAccessor,cacheKey){return executeAuraGlobalController(ACTIONS_GLOBAL_CONTROLLER$1,parameters).then(response=>{const result=response.body;normalizePayload(cacheAccessor,this.getCacheKeyDependencyOfKey.bind(this,parameters),cacheKey,result);const affectedKeys=cacheAccessor.commitPuts();this._ldsCache.handleAffectedKeys(affectedKeys,cacheAccessor);return result;});}/**
         * Builds cache key from Record Edit request parameters
         * @param parameters Record edit action parameters
         * @return A cache key for the Record Edit actions
         */buildCacheKey(parameters){const{recordId,formFactor,actionTypes,sections}=parameters;return buildCacheKey$f(recordId,formFactor,sections,actionTypes);}/**
         *  Returns a CacheKeyDependencies object which links the action's cache key with the cache keys of its dependencies.
         * @param requestParameters
         * @param recordId
         * @return Cache key along with its dependencies
         */getCacheKeyDependencyOfKey({formFactor,sections,actionTypes},recordId){const cacheKey=buildCacheKey$f([recordId],formFactor,sections,actionTypes);return {cacheKey,dependencies:[]};}}/**
     * Wire adapter id: getRecordEditValues.
     * @throws Always throws an error when invoked. Imperative invocation is not supported.
     */function getRecordEditActions(){throw generateError("getRecordEditActionValues");}/**
     * Generates the wire adapter for Record Edit Actions.
     */class RecordEditActionsWireAdapterGenerator{constructor(recordEditActionsService){this._recordEditActionsService=recordEditActionsService;}/**
         * Generates the wire adapter for getRecordEditActions.
         * @return See description.
         */generateGetRecordEditActionsWireAdapter(){return generateWireAdapter(this.serviceGetRecordEditActions.bind(this));}/**
         * Service getRecordEditActions @wire.
         * @param recordIds Records containing action.
         * @param config Optional parameters like formFactor to further filter results by.
         * @return Observable stream that emits record edit actions.
         */serviceGetRecordEditActions(config){return this._recordEditActionsService.getRecordEditActions(config.recordIds,config.requestParameters);}}/**
     * The valueType to use when building RecordFormSectionCacheKeys.
     */const RECORD_FORM_SECTION_VALUE_TYPE="lds.ModuleRecordFormSection";/**
     * The valueType to use when building FormSectionDynamicComponent.
     */const FORM_SECTION_DYNAMIC_COMPONENT_VALUE_TYPE="lds.FormSectionDynamicComponent";/**
     * Time to live for the Form cache value. 30 days.
     */const RECORD_FORM_SECTION_VALUES_TTL=2592000000;/**
     * The master record type id.
     */const MASTER_RECORD_TYPE_ID$3="012000000000000AAA";/**
     * Builds the record form section cache key.
     * @param recordId The record id with which the form is associated.
     * @param mode The mode with which the form is associated.
     * @param formName The form name with which the form is associated.
     * @param formSection The section name with which the form is associated.
     * @returns A new cache key representing the record form section value type.
     */function buildRecordFormSectionCacheKey(recordId,mode,formName,formSection){{assert$1(recordId,"A non-empty recordId must be provided.");assert$1(formName,"A non-empty formName must be provided.");assert$1(formSection,"A non-empty sectionName must be provided.");assert$1(mode,"A non-empty mode must be provided.");}return {type:RECORD_FORM_SECTION_VALUE_TYPE,key:`${recordId}${KEY_DELIM}${formName}${KEY_DELIM}${formSection}${KEY_DELIM}${mode}`};}/**
     * Returns a RecordFormSectionCacheKey based on a cacheKey.
     * @param cacheKey The cacheKey object for form.
     * @returns The cache key builder based on a cacheKey.
     */function getRecordFormSectionCacheKeyParams(cacheKey){const key=cacheKey.key;const localKeyParts=key.split(KEY_DELIM);{assert$1(localKeyParts.length===4,`localKeyParts did not have the required parts(recordId, formName, sectionName and mode): ${localKeyParts}`);assert$1(cacheKey.type===RECORD_FORM_SECTION_VALUE_TYPE,`valueType was expected to be RECORD_FORM_VALUE_TYPE but was not: ${cacheKey.type.toString()}`);}return {recordId:localKeyParts[0],formName:localKeyParts[1],formSection:localKeyParts[2],mode:localKeyParts[3]};}/**
     * Builds the cache key.
     * @param objectApiName The object api name with which the form descriptor is associated.
     * @param recordTypeId: The record type id with which the form descriptor is associated.
     * @param formName The form name with which the form descriptor is associated.
     * @param formSection The section name with which the form descriptor is associated.
     * @param mode The mode with which the layout descriptor is associated.
     * @returns A new cache key representing the descriptor record layout value type.
     */function buildFormSectionDynamicComponentCacheKey(objectApiName,recordTypeId,formName,formSection,mode){{assert$1(objectApiName,"A non-empty objectApiName must be provided.");assert$1(recordTypeId!==null&&recordTypeId!==undefined,"recordTypeId must be defined.");assert$1(formName,"A non-empty formName must be provided.");assert$1(formSection,"A non-empty sectionName must be provided.");assert$1(mode,"A non-empty mode must be provided.");}return {type:FORM_SECTION_DYNAMIC_COMPONENT_VALUE_TYPE,key:`${objectApiName}${KEY_DELIM}${recordTypeId}${KEY_DELIM}${formName}${KEY_DELIM}${formSection}${KEY_DELIM}${mode}`};}/*
     * TODO: This class needs to be separated out into multiple service classes so there is a one to one mapping
     * of VALUE_TYPE to service class.
     * Provides functionality to fetch form's dynamic component from the cache. Can refresh the data from the server.
     */class RecordFormService extends LdsServiceBase{/**
         * Constructor.
         * @param ldsCache Reference to the LdsCache instance.
         * @param adsBridge Reference to the AdsBridge instance.
         */constructor(ldsCache,adsBridge){super(ldsCache,[FORM_SECTION_DYNAMIC_COMPONENT_VALUE_TYPE,RECORD_FORM_SECTION_VALUE_TYPE]);this._adsBridge=adsBridge;}getCacheValueTtl(){return RECORD_FORM_SECTION_VALUES_TTL;}/**
         * Get a form section's dynamic component.
         * @param recordId The record id for which the form's dynamic component is being requested.
         * @param formName The form name for which the the form's dynamic component is being requested.
         * @param formSection formSection The section name for which the the form's dynamic component is being requested.
         * @param mode The mode for which the the form's dynamic component is being requested.
         * @returns An observable that emits the form's dynamic component.
         */getFormSectionComponent(recordId,formName,formSection,mode){const recordFormSectionCacheKey=buildRecordFormSectionCacheKey(recordId,mode,formName,formSection);const valueProviderParameters={recordFormSectionCacheKey,recordId,formName,formSection,mode,forceProvide:false,recordTypeChanged:false};return this._ldsCache.get(recordFormSectionCacheKey,this._createFormSectionDynamicComponentValueProvider(valueProviderParameters));}/**
         * Stage puts the given dynamicComponent value.
         * @param dependencies An array of dependent cache keys.
         * @param dynamicComponent The dynamicComponent to cache.
         * @param cacheAccessor An object to access cache directly.
         * @param additionalData A property bag with additional values that are needed to generate the cache key.
         * @returns True if the value was successfully stagePutted, else false.
         */stagePutValue(dependencies,dynamicComponent,cacheAccessor,additionalData){const formSectionDynamicComponentCacheKey=buildFormSectionDynamicComponentCacheKey(additionalData.objectApiName,additionalData.recordTypeId,additionalData.formName,additionalData.formSection,additionalData.mode);const recordFormSectionCacheKey=buildRecordFormSectionCacheKey(additionalData.recordId,additionalData.mode,additionalData.formName,additionalData.formSection);this._normalizeAndStagePutDynamicComponent(dependencies,cacheAccessor,additionalData.recordId,formSectionDynamicComponentCacheKey,recordFormSectionCacheKey,dynamicComponent);}/**
         * Strips all eTag properties from the given dynamicComponent by directly deleting them.
         * @param dynamicComponent The dynamicComponent from which to strip the eTags.
         * @returns The given dynamicComponent with its eTags stripped.
         */stripETagsFromValue(dynamicComponent){return dynamicComponent;}/**
         * Affected key handler for FormSectionDynamicComponent values. The cache will call this handler when a FormSectionDynamicComponent cache value
         * could have been affected by a change in another related cache key value.
         * @returns The affected key handler for this service.
         */getAffectedKeyHandler(){return (affectedKey,cacheAccessor)=>{// TODO: Once this service is split into multiple services, the following check for the secondary types can be removed.
    // We don't want to handle affected keys for any secondary types.
    if(affectedKey.type===FORM_SECTION_DYNAMIC_COMPONENT_VALUE_TYPE){return;}const normalizedRecordFormSectionValueWrapper=cacheAccessor.get(affectedKey);if(normalizedRecordFormSectionValueWrapper){const normalizedRecordFormSectionValue=normalizedRecordFormSectionValueWrapper.value;{assert$1(normalizedRecordFormSectionValueWrapper.value,`normalizedRecordFormValueWrapper.value was falsy: ${normalizedRecordFormSectionValueWrapper}`);}// fetch params from affected key
    const keyBuilder=getRecordFormSectionCacheKeyParams(affectedKey);const recordId=keyBuilder.recordId;const formName=keyBuilder.formName;const formSection=keyBuilder.formSection;const mode=keyBuilder.mode;// figure out if the recordTypeId of the record has changed
    const recordCacheKey=buildRecordCacheKey(recordId);const refreshedRecordValueWrapper=cacheAccessor.getCommitted(recordCacheKey);const existingRecordTypeId=normalizedRecordFormSectionValue.recordTypeId;let recordTypeChanged=false;if(refreshedRecordValueWrapper){const refreshedRecord=refreshedRecordValueWrapper.value;{assert$1(refreshedRecord,`unexpected falsy value for refreshedRecord: ${refreshedRecord}`);}const newRecordTypeId=refreshedRecord.recordTypeInfo?refreshedRecord.recordTypeInfo.recordTypeId:MASTER_RECORD_TYPE_ID$3;if(newRecordTypeId!==existingRecordTypeId){recordTypeChanged=true;}}if(!recordTypeChanged){// if recordTypeId has not changed, there is no need to force refresh, denorm the value of form's dynamic component and emit
    const denormedDynamicComponent=this._denormalizeRecordFormSectionDynamicComponent(normalizedRecordFormSectionValue,cacheAccessor,affectedKey);if(denormedDynamicComponent&&denormedDynamicComponent.dynamicComponentDescriptor){const dynamicComponentValueWrapperToEmit=cloneWithValueOverride(normalizedRecordFormSectionValueWrapper,denormedDynamicComponent);cacheAccessor.stageEmit(affectedKey,dynamicComponentValueWrapperToEmit);return undefined;}}// When recordTypeId has changed, we need to do figure out whether we need a full refresh of the recordFormCache.
    // or the form's dynamic component with updated recordType already exists in cache.
    // However we're already in a cache transaction.
    // Kick this to a Promise to get this out of the cache operation we're already in the middle of.
    // and then figure out if we have everything required in cache or we need to queue a fresh request
    Promise.resolve().then(()=>{const forceProvide=false;// For now set it to false, if we cannot find the updated form's dynamic component in cache, we will make it forceProvide
    recordTypeChanged=true;// we know that record type has changed, so ignore the force provide until we cannot find the updated form's dynamic component in cache
    const vpArgs={recordFormSectionCacheKey:affectedKey,recordId,formName,formSection,mode,forceProvide,recordTypeChanged};this._ldsCache.get(affectedKey,this._createFormSectionDynamicComponentValueProvider(vpArgs));});}};}/**
         * Constructs a value provider to retrieve a form section dynamic component.
         * @param valueProviderParameters See RecordFormSectionValueProviderParameters description.
         * @returns The value provider to retrieve the form's dynamic component.
         */_createFormSectionDynamicComponentValueProvider(valueProviderParameters){const{// Do NOT set defaults here. See W-4840393.
    recordFormSectionCacheKey,recordId,formName,formSection,mode,forceProvide,recordTypeChanged}=valueProviderParameters;const formSectionDynamicComponentValueProvider=new ValueProvider(cacheAccessor=>{const cacheAccessorWrapped=wrapCacheAccessor(cacheAccessor,this._adsBridge);const apiCallFn=(dynamicComponent,formSectionDynamicComponentCacheKey)=>{let formSectionDynamicComponentThenable;// If the dynamicComponent is provided, we don't go to server to fetch it.
    if(dynamicComponent){formSectionDynamicComponentThenable=Thenable.resolve(dynamicComponent);}else{const params={components:[{type:"FormSectionDetailPanel",attributes:{recordId,formName,formSection,mode}}]};formSectionDynamicComponentThenable=executeAuraGlobalController("DynamicComponentController.generateComponentsAndFetchData",params).then(results=>{// only return the first result since we only requested a single result
    return results?results.body[0]:undefined;});}return formSectionDynamicComponentThenable.then(freshValue=>{if(!dynamicComponent){// we do not have a dynamic component, so we should have formUi and recordAvatars.
    {assert$1(freshValue.aggregateUi,`aggregateUi was not found: $freshValue.aggregateUi`);assert$1(freshValue.recordAvatars,`recordAvatars was not found: $freshValue.recordAvatars`);}const record=freshValue.aggregateUi.records[recordId];// Normalize and stage put the formUi.
    // Pass in rootRecordMerge as true since we didn't request the aggregateUi with all tracked fields for applicable records.
    const formUiRepresentation=transformAggregateUiRepresentationIntoFormUiRepresentation(freshValue.aggregateUi);this._ldsCache.stagePutValue(FORM_UI_VALUE_TYPE,[],formUiRepresentation,cacheAccessorWrapped,{rootRecordMerge:true});// stage put the record avatars
    this._ldsCache.stagePutValue(RECORD_AVATAR_BULK_VALUE_TYPE,[],freshValue.recordAvatars,cacheAccessorWrapped);// build the the form's dynamic component cache key
    formSectionDynamicComponentCacheKey=this._buildFormSectionDynamicComponentCacheKey(record,formName,formSection,mode);dynamicComponent=freshValue.dynamicComponent;// normalize and stage put the dynamic component
    this._normalizeAndStagePutDynamicComponent([],cacheAccessorWrapped,recordId,formSectionDynamicComponentCacheKey,recordFormSectionCacheKey,dynamicComponent);}else if(formSectionDynamicComponentCacheKey){{assert$1(formSectionDynamicComponentCacheKey.type===FORM_SECTION_DYNAMIC_COMPONENT_VALUE_TYPE,`Unexpected value type for form: ${formSectionDynamicComponentCacheKey.type.toString()}`);}// update dependency and stage put only the form's dynamic component
    this._stageDependencyNormalizeAndStagePutFormSection(cacheAccessorWrapped,recordId,formSectionDynamicComponentCacheKey,recordFormSectionCacheKey,dynamicComponent);}const affectedKeys=cacheAccessor.commitPuts();this._ldsCache.handleAffectedKeys(affectedKeys,cacheAccessor);return 2/* CACHE_MISS */;});};const lookForFormSectionDynamicComponentInCache=()=>{// check if there exists a record in cache
    const recordCacheKey=buildRecordCacheKey(recordId);const existingRecordValue=cacheAccessorWrapped.get(recordCacheKey);if(existingRecordValue&&existingRecordValue.value!==undefined){const record=existingRecordValue.value;// build the form dynamic component cache key
    const formSectionDynamicComponentCacheKey=this._buildFormSectionDynamicComponentCacheKey(record,formName,formSection,mode);// check if the form dynamic component exists in the cache
    const existingFormSectionDynamicComponent=cacheAccessorWrapped.get(formSectionDynamicComponentCacheKey);if(existingFormSectionDynamicComponent&&existingFormSectionDynamicComponent.value!==undefined){const formSectionNowTime=cacheAccessorWrapped.nowTime;const formSectionLastFetchTime=existingFormSectionDynamicComponent.lastFetchTime;// check for ttl expiry of the form's dynamic component
    const formSectionDynamicComponentNeedsRefresh=formSectionNowTime>formSectionLastFetchTime+RECORD_FORM_SECTION_VALUES_TTL;if(formSectionDynamicComponentNeedsRefresh){// if form dynamic component is present in cache and ttl of form dynamic component has expired, then fetch everything from DynamicComponentController
    return apiCallFn();}// if form dynamic component is present in cache and ttl has not expired, then stagePut the dynamic component and return CACHE_MISS
    return apiCallFn(existingFormSectionDynamicComponent.value,formSectionDynamicComponentCacheKey);}// if form dynamic component is not present in cache then fetch everything from DynamicComponentController
    return apiCallFn();}// if record is not present in cache then fetch everything from DynamicComponentController
    return apiCallFn();};// if recordType has changed, then look for form dynamic component with new recordType in cache, and if the form dynamic component with new recordType is not present in cache,
    // we fetch everything from DynamicComponentController
    if(recordTypeChanged){return lookForFormSectionDynamicComponentInCache();}if(forceProvide){return apiCallFn();}const existingValueWrapper=cacheAccessorWrapped.get(recordFormSectionCacheKey);if(existingValueWrapper&&existingValueWrapper.value!==undefined){const nowTime=cacheAccessorWrapped.nowTime;const lastFetchTime=existingValueWrapper.lastFetchTime;// check for ttl expiry
    const needsRefresh=nowTime>lastFetchTime+RECORD_FORM_SECTION_VALUES_TTL;if(needsRefresh){// Trigger a refresh. We don't care about the return value of this, we just need to force an API call
    // to keep the Observable's data stream alive.
    return apiCallFn();}return Thenable.resolve(1/* CACHE_HIT */);}// look for form's dynamic component in cache, and it the form's dynamic component is not present in cache,
    // we fetch everything from DynamicComponentController
    return lookForFormSectionDynamicComponentInCache();},valueProviderParameters);return formSectionDynamicComponentValueProvider;}/**
         * Normalize the form dynamic component and create dependency for record section form on the form dynamic component and the record.
         * @param dependencies An array of dependent cache keys.
         * @param cacheAccessor An object to access cache directly.
         * @param recordId The id of the record on which the record form depends.
         * @param formSectionDynamicComponentCacheKey Cache key for form's dynamic component.
         * @param recordFormSectionCacheKey Cache key for record form.
         * @param denormalizedDynamicComponent The form's dynamic component that needs to be normalized.
         * @returns True if the operation succeeded, else false.
         */_normalizeAndStagePutDynamicComponent(dependencies,cacheAccessor,recordId,formSectionDynamicComponentCacheKey,recordFormSectionCacheKey,denormalizedDynamicComponent){// stage the dependency for record form section cache key on the record cache key so that if recordTypeId changes, then we get notified and we can handle the changes appropriately
    const recordCacheKey=buildRecordCacheKey(recordId);cacheAccessor.stageDependencies([{cacheKey:recordFormSectionCacheKey,type:2/* NOTIFICATION */}],recordCacheKey);// the form dynamic component is not based on recordId. it's based on objectApiName, formName, formSection, mode and recordTypeId
    // if we store the recordId as well, then there is chance of returning a wrong recordId within the dynamicComponent in the case of CACHE_HIT
    // thereby delete the recordId on the dynamicComponent before stagePut
    delete denormalizedDynamicComponent.recordId;cacheAccessor.stagePut([{cacheKey:recordFormSectionCacheKey,type:1/* REQUIRED */}],formSectionDynamicComponentCacheKey,denormalizedDynamicComponent,denormalizedDynamicComponent);const recordFormSectionCacheKeyParams=getRecordFormSectionCacheKeyParams(recordFormSectionCacheKey);const normalizedDynamicComponent={formName:denormalizedDynamicComponent.formName,formSection:denormalizedDynamicComponent.formSection,objectApiName:denormalizedDynamicComponent.objectApiName,recordTypeId:denormalizedDynamicComponent.recordTypeId,dynamicComponentType:denormalizedDynamicComponent.dynamicComponentType,mode:recordFormSectionCacheKeyParams.mode};cacheAccessor.stagePut(dependencies,recordFormSectionCacheKey,normalizedDynamicComponent,denormalizedDynamicComponent);}/**
         * Stage put record form section and stage dependencies on the already existing form dynamic component and record that exists in cache.
         * @param cacheAccessor An object to access cache directly.
         * @param recordId The id of the record on which the record form depends.
         * @param formSectionDynamicComponentCacheKey Cache key for form's dynamic component.
         * @param recordFormSectionCacheKey Cache key for record form.
         * @param denormalizedDynamicComponent The form's dynamic component that needs to be normalized.
         */_stageDependencyNormalizeAndStagePutFormSection(cacheAccessor,recordId,formSectionDynamicComponentCacheKey,recordFormSectionCacheKey,denormalizedDynamicComponent){// stage the dependency for record form cache key on the record cache key so that if recordTypeId changes, then we get notified and we can handle the changes appropriately
    const recordCacheKey=buildRecordCacheKey(recordId);cacheAccessor.stageDependencies([{cacheKey:recordFormSectionCacheKey,type:2/* NOTIFICATION */}],recordCacheKey);// stage dependency for record form cache key on the form dynamic component
    cacheAccessor.stageDependencies([{cacheKey:recordFormSectionCacheKey,type:1/* REQUIRED */}],formSectionDynamicComponentCacheKey);// normalize and stage put the form's dynamic component
    const recordFormSectionCacheKeyParams=getRecordFormSectionCacheKeyParams(recordFormSectionCacheKey);// add marker for the record form
    const normalizedDynamicComponent={formName:denormalizedDynamicComponent.formName,formSection:denormalizedDynamicComponent.formSection,objectApiName:denormalizedDynamicComponent.objectApiName,recordTypeId:denormalizedDynamicComponent.recordTypeId,dynamicComponentType:denormalizedDynamicComponent.dynamicComponentType,mode:recordFormSectionCacheKeyParams.mode};cacheAccessor.stagePut([],recordFormSectionCacheKey,normalizedDynamicComponent,denormalizedDynamicComponent);}/**
         * Takes the normalized record form section dynamic component and cacheAccessor and returns the denormalized record form section dynamic component.
         * @param normalizedRecordFormSectionDynamicComponent The record form to be denormalized. This should always be a normalized record form that came from the cache.
         * @param cacheAccessor The CacheAccessor in scope for this operation.
         * @param recordFormSectionCacheKey Cache key for the record form.
         * @returns See description.
         */_denormalizeRecordFormSectionDynamicComponent(normalizedRecordFormSectionDynamicComponent,cacheAccessor,recordFormSectionCacheKey){{assert$1(recordFormSectionCacheKey.type!==undefined,`Value type for RecordForm was undefined.`);assert$1(recordFormSectionCacheKey.type===RECORD_FORM_SECTION_VALUE_TYPE,`Expected RECORD_FORM_VALUE_TYPE value type for RecordForm: ${recordFormSectionCacheKey.type.toString()}`);}let denormalizedRecordFormSectionDynamicComponent=null;// build the form's dynamic component cache key object
    const formSectionDynamicComponentCacheKey=buildFormSectionDynamicComponentCacheKey(normalizedRecordFormSectionDynamicComponent.objectApiName,normalizedRecordFormSectionDynamicComponent.recordTypeId,normalizedRecordFormSectionDynamicComponent.formName,normalizedRecordFormSectionDynamicComponent.formSection,normalizedRecordFormSectionDynamicComponent.mode);const formSectionDynamicComponentValueWrapper=cacheAccessor.get(formSectionDynamicComponentCacheKey);if(formSectionDynamicComponentValueWrapper){denormalizedRecordFormSectionDynamicComponent=cloneDeepCopy(formSectionDynamicComponentValueWrapper.value);}else{throw getLdsInternalError("DENORMALIZE_ERROR","Did not get a form section dynamic component back for marker: "+serialize(formSectionDynamicComponentCacheKey),true);}return denormalizedRecordFormSectionDynamicComponent;}/**
         * Helper method to build the form's dynamic component cache key.
         * @param record The record used to fetch the recordTypeId to construct the form's dynamic component cache key.
         * @param formName The form name used to construct the form's dynamic component cache key.
         * @param sectionName The section name used to construct the form's dynamic component cache key.
         * @param mode The mode used to construct the form's dynamic component cache key.
         * @returns The form's dynamic component cache key.
         */_buildFormSectionDynamicComponentCacheKey(record,formName,formSection,mode){const recordTypeId=record.recordTypeInfo?record.recordTypeInfo.recordTypeId:MASTER_RECORD_TYPE_ID$3;return buildFormSectionDynamicComponentCacheKey(record.apiName,recordTypeId,formName,formSection,mode);}}/**
     * The valueType to use when building RecordLayoutCacheKeys.
     */const RECORD_LAYOUT_VALUE_TYPE="lds.ModuleRecordLayout";/**
     * The valueType to use when building DescriptorRecordLayout.
     */const DESCRIPTOR_RECORD_LAYOUT_VALUE_TYPE="lds.DescriptorRecordLayout";/**
     * Time to live for the RecordLayout cache value. 30 days.
     */const RECORD_LAYOUT_VALUES_TTL=2592000000;/**
     * The master record type id.
     */const MASTER_RECORD_TYPE_ID$4="012000000000000AAA";function hasModule(module){return aura.hasModule(module);}function getModule(descriptor){return aura.getModule(descriptor);}// import { transform } from "typescript";
    // import { ldsCacheReferenceForTestingOnly } from "src/targets/lwc/lds";
    const TEMPLATE_REQUEST_URL="DynamicComponentController.getTemplateDescriptorWithExpansion";const USE_ADG_KEY="isTemplateAdgEnabled";const USE_ADG_CONFIGURATION_KEY="DescriptorRollup."+USE_ADG_KEY;const TEMPLATE_DURABLE_CACHE_TTL_240_KEY$1="templateDurableTtl240";// ADG Template TTL: long enough to get re-use, but not so long that users wait forever to get layout updates from admin changes
    const ADG_MODULE_TTL=15*60*1000;// 15 minutes -- should stay in sync with Layout (because the module is generated based off the Layout)
    const FOUR_HOURS$1=240*60*1000;/**
     * Requests a template with expansion hints which may return more data that is needed as part of the template. The additional data
     * that is returned from the server is injected into the LDS caches. This method returns just the template to the caller.
     *
     * @param requestParams The parameters to pass to the server side
     * @param cacheAccessor Used to inject data into the lds caches
     * @param ldsCache Reference to the LdsCache instance
     * @param requestingServiceValueType the value type of the service requesting the template
     * @returns A promise of the template layout descriptor
     */function executeTemplateController(requestParams,cacheAccessor,ldsCache,requestingServiceValueType,getServiceConfiguration,forceRefresh){// The controller returns a different response shape based on the RaptorFlexipagePerm:
    // Off: Uses the existing DynamicComponentController and its existing response type.
    // On: New response shape
    // we can cast this as GenericTemplateRequestParams is a super set of the more specific types
    const genericRequestParams=requestParams;const params={type:genericRequestParams.type,attributes:Object.assign({},genericRequestParams.params,genericRequestParams.expansionHints)};if(getServiceConfiguration(USE_ADG_CONFIGURATION_KEY)){return resolveTemplateViaADG(params,cacheAccessor,ldsCache,requestingServiceValueType,getServiceConfiguration,forceRefresh);}return fetchTemplateWithData(params,cacheAccessor,ldsCache,requestingServiceValueType);}function getTemplateTTL(getServiceConfiguration){return getServiceConfiguration(TEMPLATE_DURABLE_CACHE_TTL_240_KEY$1)?FOUR_HOURS$1:ADG_MODULE_TTL;}function resolveTemplateViaADG(params,cacheAccessor,ldsCache,requestingServiceValueType,getServiceConfiguration,forceRefresh){// While this is yet another location that builds module names, doing so here will avoid an XHR (if the server logic was used).
    const targetModuleName=buildTargetModuleName(params);return getRollupModule(targetModuleName,cacheAccessor,requestingServiceValueType,getServiceConfiguration,forceRefresh).then(rollupModule=>{const rawRollupModule=rollupModule;const ADG=getAdgFromRollupModule(rawRollupModule);// TODO: Immutable ADG -> List requests
    // Seed $recordId with literals / actual values out of attributes and expansion hints
    const concreteRequests=initializeADG(params.attributes,ADG);// new type: intermediate? concrete? DG
    const preparedRequests=getResolvableDependencies(concreteRequests,ldsCache,cacheAccessor,getServiceConfiguration).map(injectRefreshInfo.bind(null,ldsCache));// TODO: Break up into sub-groups separated by transformWire
    const preparedUiRequests=convertDataDepsToAggregateUi(preparedRequests);// How can we abstract this process such that we don't explicitly depend on AggregateUi?
    // TODO: Break-off Template calls & their children to the adapter
    const targetModule=rawRollupModule.targetModule;if(preparedUiRequests.input.compositeRequest.length===0){return packageTemplateDescriptor(targetModule,params);}const asyncCacheAccessor=new CacheAccessor(ldsCache,ldsCache.timeSource);// queue up aggregateUi for everything the ADG specified, and start rendering the template ASAP by returning before the data has returned
    callAggregateUi(preparedUiRequests).then(function(data){const requestedValueTypes=mapWireNamesToValueType(preparedRequests.map(req=>req.type.name));// Use input DataDependencies to do hacky transformations for certain wires (layout user states, I'm looking at you)
    stagePutAggregateResponse(requestedValueTypes,preparedRequests,data,asyncCacheAccessor,ldsCache);asyncCacheAccessor.commitPuts();asyncCacheAccessor.finishCacheAccessor();});return packageTemplateDescriptor(targetModule,params);});}function buildTargetModuleName(params){const lowerCaseType=params.type.substring(0,1).toLowerCase()+params.type.substring(1);if(params.type==="DetailPanel"||params.type==="HighlightsPanel"){assert$1(params.attributes.objectApiName,"ADG Flow requires objectApiName be passed into the wire");assert$1(params.attributes.recordTypeId,"ADG Flow requires recordTypeId");return "forceGenerated__"+lowerCaseType+"_"+params.attributes.objectApiName+"___"+params.attributes.recordTypeId+"___"+params.attributes.layoutType+"___"+params.attributes.mode;}else if(params.type==="Action"){assert$1(params.attributes.actionApiName,"Action Flow requires actionApiName be passed into the wire");assert$1(params.attributes.recordId,"Action Flow requires recordId");assert$1(params.attributes.timestamp,"Action Flow requires timestamp");return "forceGenerated__"+lowerCaseType+"_"+params.attributes.actionApiName+"___"+params.attributes.recordId+"___"+params.attributes.timestamp;}else{return "forceGenerated__"+lowerCaseType+"_"+params.attributes.pageDeveloperName+"___"+params.attributes.objectApiName;}}function packageTemplateDescriptor(descriptor,params){if(params.type==="DetailPanel"||params.type==="HighlightsPanel"){return {descriptor,additionalParams:{objectApiName:params.attributes.objectApiName,recordTypeId:params.attributes.recordTypeId}};}else if(params.type==="Flexipage"){return {descriptor,additionalParams:{}};}else{return {descriptor,additionalParams:{}};}}// TODO: Why does getModule say it returns a string? Modules are most certainly not strings
    function getRollupModule(moduleName,cacheAccessor,requestingServiceValueType,getServiceConfiguration,forceRefresh){const rollupParams={type:"Rollup",attributes:{targetModule:moduleName}};const rollupDescriptorCacheKey=buildRollupDescriptorCacheKey(rollupParams,requestingServiceValueType);const cachedRollupDescriptor=lookForRollupDescriptorInCache(rollupDescriptorCacheKey,cacheAccessor,forceRefresh);// TODO: Template wire adapters register dependencies on the inputs. We should too
    let promiseValue;if(cachedRollupDescriptor&&cachedRollupDescriptor){promiseValue=Thenable.resolve(cachedRollupDescriptor);}else{promiseValue=getFreshRollupDescriptor(rollupParams,getServiceConfiguration,forceRefresh);}return promiseValue.then(rollupDescriptor=>{// Normalize and stage put the layout component descriptor
    // const normalizedObjectComponentDescriptor = getNormalizedComponentDescriptor(rollupDescriptorCacheKey);
    cacheAccessor.stagePut([],rollupDescriptorCacheKey,rollupDescriptor,rollupDescriptor);return rollupDescriptor;}).then(getRollupModuleByDescriptor);}// TODO: Use the TTL of the targetModule / caller service
    const ADG_DESCRIPTOR_TTL=2592000000;// 30 days
    function lookForRollupDescriptorInCache(rollupDescriptorCacheKey,cacheAccessor,forceRefresh){const existingRollupDescriptor=cacheAccessor.get(rollupDescriptorCacheKey);if(existingRollupDescriptor&&existingRollupDescriptor.value!==undefined){const existingRollupDescriptorValue=existingRollupDescriptor.value;const nowTime=cacheAccessor.nowTime;const descriptorLastFetchTime=existingRollupDescriptor.lastFetchTime;// check for ttl expiry of the layout descriptor
    const layoutDescriptorNeedsRefresh=nowTime>descriptorLastFetchTime+ADG_DESCRIPTOR_TTL||!hasModule(existingRollupDescriptorValue)||forceRefresh;if(layoutDescriptorNeedsRefresh){return undefined;}return existingRollupDescriptorValue;}}function buildRollupDescriptorCacheKey(rollupParams,requestingServiceValueType){const targetModule=rollupParams.attributes.targetModule;return {type:requestingServiceValueType,key:`rollup${KEY_DELIM}${targetModule}`};}/*
    function getNormalizedComponentDescriptor(rollupDescriptorCacheKey: CacheKey): object {
        const key = rollupDescriptorCacheKey.key;
        const localKeyParts = key.split(KEY_DELIM);
        return { dynamicComponentType: localKeyParts[0], targetModule: localKeyParts[1] };
    }
    */function getFreshRollupDescriptor(rollupParams,getServiceConfiguration,forceRefresh){const needsRefresh=!!forceRefresh;const ttl=getTemplateTTL(getServiceConfiguration);const transportConfig={hotspot:true,background:false,longRunning:false,storable:{ignoreExisting:needsRefresh,refresh:ttl,/*
                 * TODO: test if setting this to true is safe & useful. What would refresh the action (for us)
                 * We wouldn't have the calling wire in that case, but we should be able to stage-put the new
                 * ADG, which should re-call any active wires (which have dependencies on the cacheKey), and
                 * we'd re-evaluate the ADG & get any expired or missing data.
                 * The page could be currently visible, or in the background. The biggest risk seems to come from
                 * some critical change, like if the RecordType changes, and we get a refresh; will we refresh correctly?
                 */executeCallbackIfUpdated:false}};return executeAuraGlobalController(TEMPLATE_REQUEST_URL,rollupParams,transportConfig).then(transportResponse=>{// Full clone takes mem/cpu, but guarantees we won't accidentally screw with a cached value accidentally
    const valueMap=transformResponse(cloneDeepCopy(transportResponse.body));return valueMap["lds.DescriptorRollup"][0].representation;});}function getRollupModuleByDescriptor(moduleName){if(hasModule(moduleName)){return getModule(moduleName);}throw new Error("Failed to get rollup module for: "+moduleName);}function getAdgFromRollupModule(rollupModule){return rollupModule.ADG;}function initializeADG(expansionHints,ADG){return ADG.dependencies.map(dep=>{const concreteConfig={};Object.keys(dep.config).forEach(k=>{const inputValue=dep.config[k];if(inputValue&&inputValue.indexOf("$")===0){const paramKey=inputValue.substring(1);// Inter-dependencies will be handeled elsewhere
    if(paramKey.indexOf("@")!==0){const seedValue=expansionHints[paramKey];if(seedValue){// Push the expansion hint into the wire config
    concreteConfig[k]=seedValue;return;}}}concreteConfig[k]=dep.config[k];});return {id:dep.id,type:{module:dep.type.module,name:dep.type.name},config:concreteConfig};});}const UNBATCHABLE_WIRES=["getRecordAvatars","getActionTemplate","getRecordLayoutTemplate"];const UNBATCHABLE_MODULES=["force/ldsTransform","@salesforce"];// TODO: Test without export?
    function getResolvableDependencies(dataDependencies,ldsCache,cacheAccessor,getServiceConfiguration){const resolvableDependencies=[];const indexMap={};dataDependencies.forEach((dep,depIdx)=>{if(!isDependencyResolvable(dep)||isDependencyCached(dep,ldsCache,cacheAccessor,getServiceConfiguration)){indexMap[depIdx]=null;return;}indexMap[depIdx]=resolvableDependencies.length;resolvableDependencies.push({id:indexMap[dep.id],type:dep.type,config:dep.config});});// Because unresolvable deps weren't copied over, we need to re-index the ones that were
    reindexDependencies(resolvableDependencies,indexMap);// TODO: It's possible that we have a chain of dependencies off unresolvable deps
    // Recurse until all are resolvable?
    const hasUnresolvableChain=!!resolvableDependencies.find(dep=>{return !isConfigResolvable(dep.config);});if(hasUnresolvableChain){return getResolvableDependencies(resolvableDependencies,ldsCache,cacheAccessor,getServiceConfiguration);}return resolvableDependencies;}function isDependencyResolvable(dependency){return UNBATCHABLE_WIRES.indexOf(dependency.type.name)===-1&&UNBATCHABLE_MODULES.indexOf(dependency.type.module)===-1&&isConfigResolvable(dependency.config);}function isConfigResolvable(config){const configKeys=Object.keys(config);for(let i=0;i<configKeys.length;i++){const configVal=config[configKeys[i]];if(configVal===undefined){return false;}// $foo returns false
    // $@foo_0@ is allowed
    if(configVal.indexOf("$")===0&&configVal.indexOf("$@")!==0){return false;}}return true;}function isDependencyCached(dependency,ldsCache,cacheAccessor,getServiceConfiguration){// If there's a dependency on the output of another wire, we don't know this input and therefore don't know the cacheKey or know if it's cached, so we should make this request
    if(configHasReference(dependency.config)){return false;}// const valueType = getValueTypeFromWireIdentity(dependency.type);
    // const service = ldsCache.getService(valueType);
    // Originally, I was hoping to dynamically get the service & check "are you cached? {params}" but ILdsService/BaseService doesn't have anything
    // like that, nor is there any consistency among Services on dealing with config-bags in any way beyond trying to fetch a value
    const adsBridge=new AdsBridge(ldsCache);const rawConfigBag=dependency.config;switch(dependency.type.name){// Scoped cases because of duplicate variables per case
    // Sync'd to list in wire-name-to-reference-resource-map.ts
    case"getRecordUi":{// const recordUiService: any = ldsCache.getService("uiapi.RecordUiRepresentation");
    const recordUiService=new RecordUiService(ldsCache,adsBridge);return recordUiService.hasValidCachedValue(cacheAccessor,{recordIds:listize(rawConfigBag.recordIds),layoutTypes:listize(rawConfigBag.layoutTypes),modes:listize(rawConfigBag.modes),uniqueOptionalFields:listize(rawConfigBag.uniqueOptionalFields)});}case"getRecord":{const recordService=new RecordService(ldsCache,adsBridge);return recordService.hasValidCachedValue(cacheAccessor,{recordId:rawConfigBag.recordId,optionalFields:listize(rawConfigBag.optionalFields)});}case"getLayout":{const layoutService=new LayoutService(ldsCache,getServiceConfiguration);return layoutService.hasValidCachedValue(cacheAccessor,rawConfigBag);}case"getLayoutUserState":{const layoutUserStateService=new LayoutUserStateService(ldsCache);return layoutUserStateService.hasValidCachedValue(cacheAccessor,rawConfigBag);}case"getObjectInfo":{const objectInfoService=new ObjectInfoService(ldsCache);return objectInfoService.hasValidCachedValue(cacheAccessor,rawConfigBag);}case"getForm":{const formService=new FormService(ldsCache);return formService.hasValidCachedValue(cacheAccessor,rawConfigBag);}case"getFormSectionUi":{const formSectionUiService=new FormUiService(ldsCache,adsBridge);return formSectionUiService.hasValidCachedValue(cacheAccessor,{recordIds:listize(rawConfigBag.recordIds),formNames:listize(rawConfigBag.formNames)});}case"getPicklistValues":{const picklistValuesService=new PicklistValuesService(ldsCache);return picklistValuesService.hasValidCachedValue(cacheAccessor,rawConfigBag);}case"getPicklistValuesByRecordType":{const picklistValuesByRecordTypeSerivce=new PicklistValuesByRecordTypeService(ldsCache);return picklistValuesByRecordTypeSerivce.hasValidCachedValue(cacheAccessor,rawConfigBag);/* TODO: needs Id-checking similar to records
            } case "getRecordAvatars": {
                const recordAvatarService = new RecordAvatarBulkService(ldsCache);
                return recordAvatarService.hasValidCachedValue(cacheAccessor, rawConfigBag);
                */}case"getCreateDefaults":{const recordDefaultsService=new RecordDefaultsService(ldsCache);return recordDefaultsService.hasValidCachedValue(cacheAccessor,rawConfigBag);}// TODO: Presumably we'll need the rest of the Services
    default:return false;}}/**
     * When the ADG is fetching a dependency, it should do so like the wire Service would, which in many cases,
     * involves fetching everything the system knows about the particular resource.
     * e.g. During getRecord(fields: [A, B]), if the system has previously fetched [C, D], then the request should be
     * for [A, B, C, D], to ensure that both consumers have up-to-date information. Likewise, the ADG should do the same,
     * and get this extra request-set injected into the dependency
     * @param ldsCache
     * @param dependency Single dependency being requseted
     * @returns New Dependency for the same resource, but potentially more info/data about the Resource
     */function injectRefreshInfo(ldsCache,dependency){const configChanges={};// Hack edging on the side of feature: If the wireService knows about more fields than the ADG does (e.g. warm when coming from a List page), do a record refresh along with our "new" (ish?) request
    if(dependency.type.name==="getRecord"){const recordId=dependency.config.recordId;if(!recordId.startsWith("$")){const requestedFields=new Set(dependency.config.optionalFields.split(","));if(requestedFields.size>0){const recordService=ldsCache.getService("uiapi.RecordRepresentation");const knownFields=recordService.getAllKnownFields(recordId);// de-dupe add using a Set
    knownFields.forEach(f=>{requestedFields.add(f);});// Sort the fields to improve de-duping by requestUri in transport-utils
    const mergedRequestedFields=Array.from(requestedFields).sort();// Turn it back into the ADG expected form: comma-separated list
    configChanges.optionalFields=mergedRequestedFields.join(",");}}}if(Object.keys(configChanges).length===0){// Avoid an unnecessary copy if there weren't any changes
    return dependency;}else{return {id:dependency.id,type:dependency.type,// clone config to be cautious
    config:Object.assign({},dependency.config,configChanges)};}}function configHasReference(config){return Object.keys(config).reduce((accum,key)=>{return accum||config[key]&&config[key].indexOf("$@")===0;},false);}// Convert from comma-separated string list to real list, with null guards
    function listize(val){if(!val){return [];}return val.split(",");}function extractReferenceIndex(configValue){if(!configValue||configValue.indexOf("@")!==1){return null;}const indexDelim=configValue.indexOf("@",2);return Number(configValue.substring(2,indexDelim));}function reindexDependencies(resolvableDependencies,indexMap){for(let ri=0;ri<resolvableDependencies.length;ri++){const rDep=resolvableDependencies[ri];Object.keys(rDep.config).forEach(rConfigKey=>{const rConfigVal=rDep.config[rConfigKey];const referencesIndex=extractReferenceIndex(rConfigVal);if(referencesIndex!==null){const indexDelim=rConfigVal.indexOf("@",2);// Pass the index to depend on through the indexMap to get the new
    // index inside resolvableDependencies
    const newIndex=indexMap[referencesIndex];if(newIndex===null){// This depends on a wire that's not resolvable
    // use `$` as a bit of a hack to mark this input as unresolvable
    rDep.config[rConfigKey]="$";}else{rDep.config[rConfigKey]="$@"+newIndex+"@"+rConfigVal.substring(indexDelim+1);}}});}}function convertDataDepsToAggregateUi(dependencies){const aggregateInputs=dependencies.map(dataDependency=>{reconfigureReferences(dataDependency.config);// TODO: Pass through the wire services to build up our requests
    // FYI: This is a destructive operation; the logic will/may delete attributes from the config
    // Clone config to prevent destruction to our input DataDependencies
    return mapDataDependencyToOperationInput(dataDependency.type,Object.assign({},dataDependency.config),dataDependency.id);});return {input:{compositeRequest:aggregateInputs}};}function reconfigureReferences(config){const keys=Object.keys(config);for(let i=0;i<keys.length;i++){let val=config[keys[i]];if(val.indexOf("$@")===0){// ADG uses $@n@.foo while aggregateUi uses @{n.foo}
    val="{"+val.substring(2);val="@"+val.replace("@","")+"}";config[keys[i]]=val;}}}function callAggregateUi(uiRequests){return aggregateUiExecutor.executeAggregateUi(uiRequests);}// TODO: Not important for templates, but lets say we're returning many templates; we'd need to match for the exact one we requested
    /**
     * Remove the requested valueType out of the valueMap, and return it
     */function extractCurrentRequestFromValueMap(valueMap,requestingServiceValueType){const serviceRequestedValues=valueMap[requestingServiceValueType];delete valueMap[requestingServiceValueType];return serviceRequestedValues;}function stagePutValueMap(valueMap,cacheAccessor,ldsCache){// normalize and stage put the various pieces of information
    const entries=Object.entries(valueMap);for(const[valueType,values]of entries){const _values=values;for(let i=0,l=_values.length;i<l;i++){const value=_values[i];// Timing of stagePut vs wires getting called -- does each wire get called after _all_ stage puts, or intermingled between puts?
    ldsCache.stagePutValue(valueType,[],value.representation,cacheAccessor,value.additionalParams);}}}function stagePutAggregateResponse(requestedValueTypes,inputDependencies,aggregateResponse,cacheAccessor,ldsCache){for(let i=0;i<aggregateResponse.compositeResponse.length;i++){const{body,httpStatusCode,additionalParams}=preStagePutTransform(aggregateResponse.compositeResponse[i],inputDependencies[i]);const valueType=requestedValueTypes[i];if(httpStatusCode===200){ldsCache.stagePutValue(valueType,[],body,cacheAccessor,additionalParams);}}}function preStagePutTransform(response,inputDependency){switch(inputDependency.type.name){case"getLayout":case"getLayoutUserState":return {body:response.body,httpStatusCode:response.httpStatusCode,// getLayout* look at additional params -- I'm assuming this was because in the server-fetched world, the input params were not known,
    // but they're necessary to do a stagePut. Ideally, I'd say the URI should be reversed to build the cacheKey instead of relying on
    // additionalParams. But... at least for now, this is an easier hack
    additionalParams:inputDependency.config};}return {body:response.body,httpStatusCode:response.httpStatusCode,additionalParams:{}};}function fetchTemplateWithData(params,cacheAccessor,ldsCache,requestingServiceValueType){return executeAuraGlobalController(TEMPLATE_REQUEST_URL,params).then(transportResponse=>{// Full clone takes mem/cpu, but guarantees we won't accidentally screw with a cached value accidentally
    const valueMap=transformResponse(cloneDeepCopy(transportResponse.body));const templates=extractCurrentRequestFromValueMap(valueMap,requestingServiceValueType);stagePutValueMap(valueMap,cacheAccessor,ldsCache);// assumption that there is only one and the server doesn't send more back.
    // as the server code is extended we might need to extend this code
    const referenceMappedRepresentation=templates[0];// TODO: API is return getModule ?
    if(params.type==="DetailPanel"||params.type==="HighlightsPanel"){const newResult={descriptor:referenceMappedRepresentation.representation,additionalParams:referenceMappedRepresentation.additionalParams};return newResult;}else if(params.type==="Flexipage"){const newResult={descriptor:referenceMappedRepresentation.representation,additionalParams:referenceMappedRepresentation.additionalParams};return newResult;}else if(params.type==="Action"){const newResult={descriptor:referenceMappedRepresentation.representation,additionalParams:referenceMappedRepresentation.additionalParams};return newResult;}else{const newResult={descriptor:referenceMappedRepresentation.representation,additionalParams:referenceMappedRepresentation.additionalParams};return newResult;}});}/**
     * This function transforms the old controllers data shape into the new one
     *
     * @param valueMap the new data shape
     * @return the emulated new data shape
     */function transformResponse(valueMap){// Mutate to save mem/cpu from copying
    if(valueMap.recordAvatars){const recordAvatars=valueMap.recordAvatars[0].representation;const avatarAdditionalData={recordAvatarIds:Object.keys(recordAvatars)};valueMap["uiapi.RecordAvatarBulk"]=[{representation:createRecordAvatarRepresentationsFromRecordAvatarBulk(recordAvatars),additionalParams:avatarAdditionalData}];delete valueMap.recordAvatars;}return valueMap;}/**
     * Constructs a cache key for the layout descriptor value type.
     * @param objectApiName The object api name with which the layout descriptor is associated.
     * @param recordTypeId The record type id with which the layout descriptor is associated.
     * @param layoutType The layout type with which the layout descriptor is associated.
     * @param mode The mode with which the layout descriptor is associated.
     * @param dynamicComponentType The dynamicComponentType with which the layout descriptor is associated.
     * @returns A new cache key representing the descriptor record layout value type.
     */function buildDescriptorLayoutCacheKey(objectApiName,recordTypeId,layoutType,mode,dynamicComponentType){{assert$1(objectApiName,"A non-empty objectApiName must be provided.");assert$1(recordTypeId!==null&&recordTypeId!==undefined,"recordTypeId must be defined.");assert$1(layoutType,"A non-empty layoutType must be provided.");assert$1(mode,"A non-empty mode must be provided.");assert$1(dynamicComponentType,"A non-empty dynamic component type must be provided.");}return {type:DESCRIPTOR_RECORD_LAYOUT_VALUE_TYPE,key:`${objectApiName.toLowerCase()}${KEY_DELIM}${recordTypeId}${KEY_DELIM}${layoutType.toLowerCase()}${KEY_DELIM}${mode}${KEY_DELIM}${dynamicComponentType}`};}/**
     * Returns a DescriptorLayoutCacheKeyParams based on a cacheKey.
     * @param cacheKey The cacheKey object for layout
     * @returns A DescriptorLayoutCacheKeyParams based on a cacheKey.
     */function getDescriptorLayoutCacheKeyParams(cacheKey){const key=cacheKey.key;const localKeyParts=key.split(KEY_DELIM);{assert$1(cacheKey.type===DESCRIPTOR_RECORD_LAYOUT_VALUE_TYPE,`valueType was expected to be DESCRIPTOR_RECORD_LAYOUT_VALUE_TYPE but was not: ${cacheKey.type.toString()}`);assert$1(localKeyParts.length===5,`localKeyParts did not have the required parts(objectApiName, recordTypeId, layoutType, mode and dynamicComponentType): ${localKeyParts}`);}return {objectApiName:localKeyParts[0],recordTypeId:localKeyParts[1],layoutType:localKeyParts[2],mode:localKeyParts[3],dynamicComponentType:localKeyParts[4]};}/**
     * Constructs a cache key for the record layout value type.
     * @param recordId The record id with which the record layout is associated.
     * @param mode The mode with which the record layout is associated.
     * @param layoutType The layout type with which the record layout is associated.
     * @param dynamicComponentType The dynamic component type with which the record layout is associated.
     * @param objectApiName The API name of the record identified by recordId.
     * @returns A new cache key representing the record layout value type.
     */function buildRecordLayoutCacheKey(recordId,mode,layoutType,dynamicComponentType,objectApiName){{assert$1(recordId,"A recordId must be provided to build a RecordLayoutCacheKey");assert$1(layoutType,"A non-empty layoutType must be provided.");assert$1(mode,"A non-empty mode must be provided.");assert$1(dynamicComponentType,"A non-empty dynamic component type must be provided.");assert$1(objectApiName,"A non-empty objectApiName must be provided.");assert$1(recordId.length===18,"Record Id length should be 18 characters.");}return {type:RECORD_LAYOUT_VALUE_TYPE,key:`${recordId}${KEY_DELIM}${layoutType.toLowerCase()}${KEY_DELIM}${mode.toLowerCase()}${KEY_DELIM}${dynamicComponentType}${KEY_DELIM}${objectApiName.toLowerCase()}`};}/**
     * Returns a RecordLayoutCacheKeyParams based on a cacheKey. Throws an error if it can't be done because a bad string is provided.
     * @param cacheKey The cacheKey object for layout
     * @returns A RecordLayoutCacheKeyParams based on a cacheKey.
     */function getRecordLayoutCacheKeyParams(cacheKey){const key=cacheKey.key;const localKeyParts=key.split(KEY_DELIM);{assert$1(localKeyParts.length===5,`localKeyParts did not have the required parts(recordId, layoutType, mode and dynamicComponentType): ${localKeyParts}`);assert$1(cacheKey.type===RECORD_LAYOUT_VALUE_TYPE,`valueType was expected to be RECORD_LAYOUT_VALUE_TYPE but was not: ${cacheKey.type.toString()}`);}return {recordId:localKeyParts[0],layoutType:localKeyParts[1],mode:localKeyParts[2],dynamicComponentType:localKeyParts[3],objectApiName:localKeyParts[4]};}/**../../shared/utils/template/template-utils
     * TODO: Split out this service into two (one for each value provider).
     * Provides functionality to fetch layout descriptor from the cache. Can refresh the data from the server.
     */class RecordLayoutService extends LdsServiceBase{/**
         * Constructor.
         * @param ldsCache Reference to the LdsCache instance.
         * @param adsBridge Reference to the AdsBridge instance.
         */constructor(ldsCache,adsBridge,getServiceConfiguration){super(ldsCache,[DESCRIPTOR_RECORD_LAYOUT_VALUE_TYPE,RECORD_LAYOUT_VALUE_TYPE]);/**
             * Mapping of module observable cache key -> module observable.
             */this._moduleObservables=new Map();this._adsBridge=adsBridge;this._getServiceConfiguration=getServiceConfiguration;}getCacheValueTtl(){return RECORD_LAYOUT_VALUES_TTL;}/**
         * Gets a layout template's descriptor.
         * @param recordId The record id for which the layout descriptor is being requested.
         * @param layoutType The layout type for which the layout descriptor is being requested.
         * @param mode The mode for which the layout descriptor is being requested.
         * @param dynamicComponentType The component for which this layout is loaded.
         * @param objectApiName The apiName for the entity of the record of the given recordId.
         * @returns An observable that emits the layout descriptor.
         */getLayoutTemplateDescriptor(recordId,layoutType,mode,dynamicComponentType,objectApiName){checkType(recordId,String);checkType(layoutType,String);checkType(mode,String);checkType(dynamicComponentType,String);checkType(objectApiName,String);recordId=to18(recordId);const recordLayoutCacheKey=buildRecordLayoutCacheKey(recordId,mode,layoutType,dynamicComponentType,objectApiName);const valueProviderParameters={recordLayoutCacheKey,recordId,layoutType,mode,dynamicComponentType,objectApiName,forceProvide:false,recordTypeChanged:false};return this._ldsCache.get(recordLayoutCacheKey,this._createLayoutTemplateDescriptorValueProvider(valueProviderParameters));}/**
         * Stage puts the given dynamicComponentDescriptor.
         * @param dependencies An array of dependent cache keys.
         * @param dynamicComponentDescriptor The dynamicComponentDescriptor to cache.
         * @param cacheAccessor An object to access cache directly.
         * @param additionalData A property bag with additional values that are needed to generate the cache key.
         */stagePutValue(dependencies,dynamicComponentDescriptor,cacheAccessor,additionalData){const layoutDescriptorCacheKey=buildDescriptorLayoutCacheKey(additionalData.objectApiName,additionalData.recordTypeId,additionalData.layoutType,additionalData.mode,additionalData.dynamicComponentType);const recordLayoutCacheKey=buildRecordLayoutCacheKey(additionalData.recordId,additionalData.mode,additionalData.layoutType,additionalData.dynamicComponentType,additionalData.objectApiName);this._normalizeAndStagePutComponentDescriptor(dependencies,cacheAccessor,additionalData.recordId,layoutDescriptorCacheKey,recordLayoutCacheKey,dynamicComponentDescriptor);}/**
         * Strips all eTag properties from the given dynamicComponentDescriptor by directly deleting them.
         * @param dynamicComponentDescriptor The dynamicComponentDescriptor from which to strip the eTags.
         * @returns The given dynamicComponentDescriptor with its eTags stripped.
         */stripETagsFromValue(dynamicComponentDescriptor){return dynamicComponentDescriptor;}/**
         * Returns the recordTypeId if it's present on the record. Otherwise, returns null.
         * @param record The record to get the recordTypeId from
         */_getRecordTypeIdFromRecord(record){// TODO W-6281152 - if the recordTypeInfo is undefined, the record has been loaded without it.
    // this is possible if this record was loaded as a nested record.
    if(!("recordTypeInfo"in record)){return undefined;}// a falsy recordTypeInfo or recordTypeId is equivalent to the master record type
    if(!record.recordTypeInfo||!record.recordTypeInfo.recordTypeId){return MASTER_RECORD_TYPE_ID$4;}return record.recordTypeInfo.recordTypeId;}/**
         * Get the record from the LDS cache, ADS cache, or fetch it from the server. Only return the record from
         * the cache if it contains a recordTypeId.
         *
         * @param recordId the recordID for the record being requested.
         * @param layoutType the layoutType used to populate the record request when fetching from the server.
         * @param objectApiName the API name of the entity for the record with the provided recordId.
         */_getOrFetchRecord(cacheAccessor,recordId,objectApiName){const recordCacheKey=buildRecordCacheKey(recordId);// get the record from the LDS cache only. if the record exists, return the record only if the rtId is present.
    const cachedRecordWrapper=cacheAccessor.get(recordCacheKey);const recordFromLds=cachedRecordWrapper&&cachedRecordWrapper.value&&cachedRecordWrapper.value;if(recordFromLds&&this._getRecordTypeIdFromRecord(recordFromLds)){return Thenable.resolve(recordFromLds);}// if not present in the LDS cache, then check the ADS cache.
    let getRecordFromAdsPromise;if(this._adsBridge&&this._adsBridge.getBaseRecordDataFromCacheCallback){getRecordFromAdsPromise=this._adsBridge.getBaseRecordDataFromCacheCallback(recordId);}else{getRecordFromAdsPromise=Thenable.resolve(null);}// only return the record from ADS if the rtId is present.
    return getRecordFromAdsPromise.then(recordFromAds=>{if(recordFromAds&&this._getRecordTypeIdFromRecord(recordFromAds)){return recordFromAds;}// nothing in either the LDS or ADS cache. fetch a fresh record from the server.
    // we really want the recordTypeId here, but rtId won't be present on objects without record types, so supply the Id
    // to satisfy the field list requirement
    const qualifiedIdFieldName=objectApiName+".Id";return observableToPromise(this._recordService.getRecordWithFieldsWithMetaConfig(recordId,[qualifiedIdFieldName],[],{forceProvide:true}),true).catch(()=>{// if we can't get the record from checking the cache, then allow the flow to continue to get a fresh layout
    return null;});});}/**
         * Gets a layout template as module.
         * @param recordId The record id for which the layout descriptor is being requested.
         * @param layoutType The layout type for which the layout descriptor is being requested.
         * @param mode The mode for which the layout descriptor is being requested.
         * @param dynamicComponentType The component for which this layout is loaded.
         * @param objectApiName the API name of the entity for the record with the provided recordId.
         * @returns An observable that emits the layout template module.
         */getLayoutTemplateModule(recordId,layoutType,mode,dynamicComponentType,objectApiName){checkType(recordId,String);checkType(layoutType,String);checkType(mode,String);checkType(dynamicComponentType,String);checkType(objectApiName,String);const recordLayoutCacheKey=buildRecordLayoutCacheKey(recordId,mode,layoutType,dynamicComponentType,objectApiName);this.getLayoutTemplateDescriptor(recordId,layoutType,mode,dynamicComponentType,objectApiName);// check if we already have a module observable for the layout template, and create it if not
    const _moduleObservables=this._moduleObservables;const moduleObservable=_moduleObservables.get(serialize(recordLayoutCacheKey));if(!moduleObservable){// We pass observables.unwrapped here
    const observables=this._ldsCache.getOrCreateObservables(recordLayoutCacheKey,this.getCacheValueTtl());const newObservable=this._constructModuleObservable(recordLayoutCacheKey,observables.finalTransformed);_moduleObservables.set(serialize(recordLayoutCacheKey),newObservable);return newObservable;}return moduleObservable;}/**
         * Affected key handler for RecordLayoutDynamicComponent values. The cache will call this handler when a RecordLayoutDynamicComponent cache value
         * could have been affected by a change in another related cache key value.
         * @returns The affected key handler for this service.
         */getAffectedKeyHandler(){return (affectedKey,cacheAccessor)=>{// TODO: Once this service is split into multiple services, the following check for the secondary types can be removed.
    // We don't want to handle affected keys for any secondary types.
    if(affectedKey.type===DESCRIPTOR_RECORD_LAYOUT_VALUE_TYPE){return;}const normalizedRecordLayoutValueWrapper=cacheAccessor.get(affectedKey);if(normalizedRecordLayoutValueWrapper){// Fetch params from affected key
    const recordLayoutCacheKeyParams=getRecordLayoutCacheKeyParams(affectedKey);const recordId=recordLayoutCacheKeyParams.recordId;const layoutType=recordLayoutCacheKeyParams.layoutType;const mode=recordLayoutCacheKeyParams.mode;const dynamicComponentType=recordLayoutCacheKeyParams.dynamicComponentType;const objectApiName=recordLayoutCacheKeyParams.objectApiName;// Figure out if the recordTypeId of the record has changed
    const recordCacheKey=buildRecordCacheKey(recordId);const refreshedRecordValueWrapper=cacheAccessor.getCommitted(recordCacheKey);const existingRecord=normalizedRecordLayoutValueWrapper.value;const existingRecordTypeId=existingRecord.recordTypeId;let recordTypeChanged=false;if(refreshedRecordValueWrapper){const refreshedRecord=refreshedRecordValueWrapper.value;{assert$1(refreshedRecord,`unexpected falsy value for refreshedRecord: ${refreshedRecord}`);}const newRecordTypeId=refreshedRecord.recordTypeInfo?refreshedRecord.recordTypeInfo.recordTypeId:MASTER_RECORD_TYPE_ID$4;if(newRecordTypeId!==existingRecordTypeId){recordTypeChanged=true;}}if(!recordTypeChanged){// if recordTypeId has not changed, there is no need to force refresh, denorm the value of component descriptor and emit
    const denormedComponentDescriptor=this._denormalizeRecordLayout(existingRecord,cacheAccessor,affectedKey);if(denormedComponentDescriptor&&hasModule(denormedComponentDescriptor)){const componentDescriptorValueWrapperToEmit=cloneWithValueOverride(normalizedRecordLayoutValueWrapper,denormedComponentDescriptor);cacheAccessor.stageEmit(affectedKey,componentDescriptorValueWrapperToEmit);return;}}// When recordTypeId has changed, we need to do figure out whether we need a full refresh of the recordLayoutCache.
    // or the layout descriptor with updated recordType already exists in cache.
    // However we're already in a cache transaction.
    // Kick this to a Promise to get this out of the cache operation we're already in the middle of.
    // and then figure out if we have everything required in cache or we need to queue a fresh request
    Promise.resolve().then(()=>{const forceProvide=false;// For now set it to false, if we cannot find the updated layout descriptor in cache, we will make it forceProvide
    recordTypeChanged=true;// we know that record type has changed, so ignore the force provide until we cannot find the updated layout descriptor in cache
    const vpArgs={recordLayoutCacheKey:affectedKey,recordId,layoutType,mode,dynamicComponentType,objectApiName,forceProvide,recordTypeChanged};this._ldsCache.get(affectedKey,this._createLayoutTemplateDescriptorValueProvider(vpArgs));return undefined;});}};}/**
         * Constructs an Observable that will emit a record with only those fields given by the requiredFields and optionalFields parameters.
         * If a required field is missing during an emit attempt, an error will be emitted. If an optional field is missing then it will be ignored.
         * @param recordLayoutCacheKey The record layout templatekey identifying the module observable.
         * @param observableToFilter The observable that emits an aura module
         * @returns Observable An observable the emits an aura module
         */_constructModuleObservable(recordLayoutCacheKey,observableToFilter){let moduleObservable=observableToFilter;moduleObservable=moduleObservable.filter(hasModule).map(getModule);// Subscribe to the new filtered observable so that when it completes (or errors) we know to remove the filtered observable from the map.
    const errorCompleteSubscription=moduleObservable.subscribe({next:()=>{/* do nothing */},error:()=>{this._moduleObservables.delete(serialize(recordLayoutCacheKey));},complete:()=>{this._moduleObservables.delete(serialize(recordLayoutCacheKey));}});// Decorate the subscribe method to return a Subscription instance with a decorated unsubscribe method which will dispose the module observable if
    // the subscriptions count drops below 1. (Not 0 because of the above subscription which will always be there but doesn't signify that
    // there is someone interested in this module observable externally.
    const _moduleObservables=this._moduleObservables;const originalSubscribeFn=moduleObservable.subscribe;moduleObservable.subscribe=(observer,...args)=>{const originalSubscription=originalSubscribeFn.call(moduleObservable,observer,...args);if(originalSubscription){const originalSubscriptionUnsubscribeFn=originalSubscription.unsubscribe;originalSubscription.unsubscribe=()=>{originalSubscriptionUnsubscribeFn.call(originalSubscription);if(moduleObservable.subscriptions.size<=1){if(errorCompleteSubscription&&!errorCompleteSubscription.closed){errorCompleteSubscription.unsubscribe();}_moduleObservables.delete(serialize(recordLayoutCacheKey));}};}return originalSubscription;};return moduleObservable;}/**
         * Constructs a value provider to retrieve a layout descriptor.
         * @param valueProviderParameters The parameters for the value provider as an object.
         * @returns The value provider to retrieve a layout descriptor.
         */_createLayoutTemplateDescriptorValueProvider(valueProviderParameters){const{recordLayoutCacheKey,recordId,layoutType,mode,dynamicComponentType,objectApiName,forceProvide,recordTypeChanged}=valueProviderParameters;const layoutTemplateDescriptorValueProvider=new ValueProvider(cacheAccessor=>{cacheAccessor=wrapCacheAccessor(cacheAccessor,this._adsBridge);// W-5043986: Fix this as part of this story.
    // if recordType has changed, then look for layout descriptor with new recordType in cache, and if the layout descriptor with new recordType is not present in cache,
    // we fetch everything from DynamicComponentController
    if(recordTypeChanged){return this._lookForLayoutDescriptorInCache(cacheAccessor,recordId,layoutType,mode,dynamicComponentType,recordLayoutCacheKey,objectApiName);}if(forceProvide||this._getServiceConfiguration(USE_ADG_CONFIGURATION_KEY)){return this._getRecordAndGetFreshValue(cacheAccessor,recordId,layoutType,mode,dynamicComponentType,recordLayoutCacheKey,objectApiName);}const existingValueWrapper=cacheAccessor.get(recordLayoutCacheKey);if(existingValueWrapper&&existingValueWrapper.value!==undefined){const nowTime=cacheAccessor.nowTime;const lastFetchTime=existingValueWrapper.lastFetchTime;// check for ttl expiry
    const needsRefresh=nowTime>lastFetchTime+RECORD_LAYOUT_VALUES_TTL;if(needsRefresh){// Trigger a refresh. We don't care about the return value of this, we just need to force an API call
    // to keep the Observable's data stream alive.
    return this._getRecordAndGetFreshValue(cacheAccessor,recordId,layoutType,mode,dynamicComponentType,recordLayoutCacheKey,objectApiName);}return Thenable.resolve(1/* CACHE_HIT */);}// look for layout descriptor in cache, and it the layout descriptor is not present in cache,
    // we fetch everything from DynamicComponentController
    return this._lookForLayoutDescriptorInCache(cacheAccessor,recordId,layoutType,mode,dynamicComponentType,recordLayoutCacheKey,objectApiName);},valueProviderParameters);return layoutTemplateDescriptorValueProvider;}/**
         * Normalize the layout descriptor and create dependency for record layout on the layout descriptor and the record.
         * @param dependencies Dependencies on the record layout.
         * @param cacheAccessor An object to access cache directly.
         * @param recordId The id of the record on which the record layout depends.
         * @param layoutDescriptorCacheKey Cache key for layout descriptor.
         * @param recordLayoutCacheKey Cache key for record layout.
         * @param dynamicComponentDescriptor The layout descriptor that needs to be normalized.
         * @returns True if the operation succeeded, else false.
         */_normalizeAndStagePutComponentDescriptor(dependencies,cacheAccessor,recordId,layoutDescriptorCacheKey,recordLayoutCacheKey,dynamicComponentDescriptor){// stage the dependency for record layout cache key on the record cache key so that if recordTypeId changes, then we get notified and we can handle the changes appropriately
    const recordCacheKey=buildRecordCacheKey(recordId);cacheAccessor.stageDependencies([{cacheKey:recordLayoutCacheKey,type:2/* NOTIFICATION */}],recordCacheKey);const normalizedObjectComponentDescriptor=this._getNormalizedComponentDescriptor(layoutDescriptorCacheKey);cacheAccessor.stagePut([{cacheKey:recordLayoutCacheKey,type:2/* NOTIFICATION */}],layoutDescriptorCacheKey,dynamicComponentDescriptor,dynamicComponentDescriptor);cacheAccessor.stagePut(dependencies,recordLayoutCacheKey,normalizedObjectComponentDescriptor,dynamicComponentDescriptor);}/**
         * Stage put record layout and stage dependencies on the already existing layout descriptor and record that exists in cache.
         * @param cacheAccessor An object to access cache directly.
         * @param recordId The id of the record on which the record layout depends.
         * @param layoutDescriptorCacheKey Cache key for layout descriptor.
         * @param recordLayoutCacheKey Cache key for record layout.
         * @param dynamicComponentDescriptor The layout descriptor that needs to be normalized.
         * @returns True if the operation succeeded, else false.
         */_stageDependencyNormalizeAndStagePutRecordLayout(cacheAccessor,recordId,layoutDescriptorCacheKey,recordLayoutCacheKey,dynamicComponentDescriptor){// Stage the dependency for record layout cache key on the record cache key so that if recordTypeId changes, then we get notified and we can handle the changes appropriately
    const recordCacheKey=buildRecordCacheKey(recordId);cacheAccessor.stageDependencies([{cacheKey:recordLayoutCacheKey,type:2/* NOTIFICATION */}],recordCacheKey);// Stage dependency for record layout cache key on the layout descriptor
    cacheAccessor.stageDependencies([{cacheKey:recordLayoutCacheKey,type:1/* REQUIRED */}],layoutDescriptorCacheKey);// Normalize and stage put the layout component descriptor
    const normalizedObjectComponentDescriptor=this._getNormalizedComponentDescriptor(layoutDescriptorCacheKey);cacheAccessor.stagePut([],recordLayoutCacheKey,normalizedObjectComponentDescriptor,dynamicComponentDescriptor);}/**
         * Helper function to normalize and create marker for layout component descriptor.
         * @param layoutDescriptorCacheKey Cache key for the layout descriptor.
         * @returns Record layout marker.
         */_getNormalizedComponentDescriptor(layoutDescriptorCacheKey){const descriptorLayoutCacheKeyParams=getDescriptorLayoutCacheKeyParams(layoutDescriptorCacheKey);const normalizedObjectComponentDescriptor={objectApiName:descriptorLayoutCacheKeyParams.objectApiName,recordTypeId:descriptorLayoutCacheKeyParams.recordTypeId,layoutType:descriptorLayoutCacheKeyParams.layoutType,mode:descriptorLayoutCacheKeyParams.mode,dynamicComponentType:descriptorLayoutCacheKeyParams.dynamicComponentType};return normalizedObjectComponentDescriptor;}/**
         * Takes the normalized record layout and cacheAccessor and returns the denormalized record layout.
         * @param normalizedRecordLayout The record layout to be denormalized. This should always be a normalized record layout that came from the cache.
         * @param cacheAccessor The CacheAccessor in scope for this operation.
         * @param recordLayoutCacheKey Cache key for the record layout.
         * @returns The denormalized record layout.
         */_denormalizeRecordLayout(normalizedRecordLayout,cacheAccessor,recordLayoutCacheKey){{assert$1(recordLayoutCacheKey.type===RECORD_LAYOUT_VALUE_TYPE,`Expected RECORD_LAYOUT_VALUE_TYPE value type for RecordLayout: ${recordLayoutCacheKey.type.toString()}`);}const objToClone=normalizedRecordLayout;let denormalizedRecordLayout=objToClone;// build the layout descriptor cache key object
    const layoutDescriptorCacheKey=buildDescriptorLayoutCacheKey(normalizedRecordLayout.objectApiName,normalizedRecordLayout.recordTypeId,normalizedRecordLayout.layoutType,normalizedRecordLayout.mode,normalizedRecordLayout.dynamicComponentType);const layoutDescriptorValueWrapper=cacheAccessor.get(layoutDescriptorCacheKey);if(layoutDescriptorValueWrapper){denormalizedRecordLayout=layoutDescriptorValueWrapper.value;}return denormalizedRecordLayout;}/**
         * Helper method to build the layout descriptor cache key.
         * @param record The record used to fetch the recordTypeId to construct the layout descriptor cache key.
         * @param layoutType The layout type used to construct the layout descriptor cache key.
         * @param mode The mode used to construct the layout descriptor cache key.
         * @param dynamicComponentType The component for which this layout is loaded.
         * @returns The layout descriptor cache key.
         */_buildLayoutDescriptorCacheKeyWithRecord(record,layoutType,mode,dynamicComponentType){const recordTypeId=record.recordTypeInfo?record.recordTypeInfo.recordTypeId:MASTER_RECORD_TYPE_ID$4;return this._buildLayoutDescriptorCacheKey(record.apiName,recordTypeId,layoutType,mode,dynamicComponentType);}/**
         * Helper method to build the layout descriptor cache key.
         * @param apiName The api name used to construct the layout descriptor cache key.
         * @param recordTypeId The recordTypeId used to construct the layout descriptor cache key.
         * @param layoutType The layout type used to construct the layout descriptor cache key.
         * @param mode The mode used to construct the layout descriptor cache key.
         * @param dynamicComponentType The component for which this layout is loaded.
         * @returns The layout descriptor cache key.
         */_buildLayoutDescriptorCacheKey(apiName,recordTypeId,layoutType,mode,dynamicComponentType){return buildDescriptorLayoutCacheKey(apiName,recordTypeId,layoutType,mode,dynamicComponentType);}/**
         * Gets a fresh value and processes it into the cache with the cacheAccessor.
         * @param cacheAccessor An object to access cache directly.
         * @param recordId The id of the record on which the record layout depends.
         * @param layoutType The layout type for which the layout descriptor is being requested.
         * @param mode The mode for which the layout descriptor is being requested.
         * @param dynamicComponentType The component for which this layout is loaded.
         * @param recordLayoutCacheKey Cache key for record layout.
         * @param dynamicComponentDescriptor The layout descriptor that needs to be normalized. Optional.
         * @param layoutDescriptorCacheKey layoutDescriptorCacheKey Cache key for layout descriptor. Optional.
         * @param recordTypeId the recordTypeId of the record of the record layout. Optional
         * @param apiName the object API name of the record for the record layout. Optional
         */_getFreshValue(cacheAccessor,recordId,layoutType,mode,dynamicComponentType,recordLayoutCacheKey,dynamicComponentDescriptor,layoutDescriptorCacheKey,recordTypeId,objectApiName){recordTypeId=recordTypeId||"";objectApiName=objectApiName||"";let layoutTemplateDescriptorThenable;// If the dynamicComponentDescriptor is provided, we don't go to server to fetch it.
    if(dynamicComponentDescriptor){layoutTemplateDescriptorThenable=Thenable.resolve(undefined);}else{const params={type:dynamicComponentType,params:{layoutType,mode,objectApiName,recordTypeId},expansionHints:{recordId}};layoutTemplateDescriptorThenable=executeTemplateController(params,cacheAccessor,this._ldsCache,DESCRIPTOR_RECORD_LAYOUT_VALUE_TYPE,this._getServiceConfiguration);}return layoutTemplateDescriptorThenable.then(freshValue=>{if(!dynamicComponentDescriptor){{assert$1(freshValue.additionalParams.objectApiName,`objectApiName is required for record layout template`);assert$1(freshValue.additionalParams.recordTypeId,`objectApiName is required for record layout template`);}// build the layout descriptor cache key
    layoutDescriptorCacheKey=this._buildLayoutDescriptorCacheKey(freshValue.additionalParams.objectApiName,freshValue.additionalParams.recordTypeId,layoutType,mode,dynamicComponentType);dynamicComponentDescriptor=freshValue.descriptor;// normalize and stage put the component descriptor
    this._normalizeAndStagePutComponentDescriptor([],cacheAccessor,recordId,layoutDescriptorCacheKey,recordLayoutCacheKey,dynamicComponentDescriptor);}else{{assert$1(layoutDescriptorCacheKey,`layoutDescriptorCacheKey should be provided: $layoutDescriptorCacheKey`);}if(layoutDescriptorCacheKey){{assert$1(layoutDescriptorCacheKey.type!==undefined,`Value type for layout descriptor was undefined.`);assert$1(layoutDescriptorCacheKey.type===DESCRIPTOR_RECORD_LAYOUT_VALUE_TYPE,`Unexpected value type for layout: ${layoutDescriptorCacheKey.type.toString()}`);}// update dependency and stage put only the record layout
    this._stageDependencyNormalizeAndStagePutRecordLayout(cacheAccessor,recordId,layoutDescriptorCacheKey,recordLayoutCacheKey,dynamicComponentDescriptor);}}const affectedKeys=cacheAccessor.commitPuts();this._ldsCache.handleAffectedKeys(affectedKeys,cacheAccessor);return 2/* CACHE_MISS */;});}/**
         * Gets the record to gather the recordTypeId and apiName. Then gets a fresh value and processes it into the cache with the cacheAccessor.
         * @param cacheAccessor An object to access cache directly.
         * @param recordId The id of the record on which the record layout depends.
         * @param layoutType The layout type for which the layout descriptor is being requested.
         * @param mode The mode for which the layout descriptor is being requested.
         * @param dynamicComponentType The component for which this layout is loaded.
         * @param recordLayoutCacheKey Cache key for record layout.
         * @param objectApiName the API name of the entity for the record with the provided recordId.
         */_getRecordAndGetFreshValue(cacheAccessor,recordId,layoutType,mode,dynamicComponentType,recordLayoutCacheKey,objectApiName){return this._getOrFetchRecord(cacheAccessor,recordId,objectApiName).then(fetchedRecord=>{const recordTypeId=fetchedRecord?this._getRecordTypeIdFromRecord(fetchedRecord):undefined;// if we can't supply the rtId, then getFreshValue will fetch the layout using the recordId
    return this._getFreshValue(cacheAccessor,recordId,layoutType,mode,dynamicComponentType,recordLayoutCacheKey,undefined,undefined,recordTypeId,objectApiName);});}/**
         * Helper function to check the cache for a layout descriptor.
         * @param cacheAccessor An object to access cache directly.
         * @param recordId The id of the record on which the record layout depends.
         * @param layoutType The layout type for which the layout descriptor is being requested.
         * @param mode The mode for which the layout descriptor is being requested.
         * @param dynamicComponentType The component for which this layout is loaded.
         * @param objectApiName The API name of the entity for the record with the provided recordId.
         */_lookForLayoutDescriptorInCache(cacheAccessor,recordId,layoutType,mode,dynamicComponentType,recordLayoutCacheKey,objectApiName){// get the record in the cache or fetch the record from the server so we can use the recordTypeId
    // to build a cache key and retrieve the template from the cache
    return this._getOrFetchRecord(cacheAccessor,recordId,objectApiName).then(fetchedRecord=>{const recordTypeId=fetchedRecord?this._getRecordTypeIdFromRecord(fetchedRecord):undefined;if(!fetchedRecord||!recordTypeId){// failed to retrieve the record or the recordTypeId. get a fresh value for the layout using the recordId
    return this._getFreshValue(cacheAccessor,recordId,layoutType,mode,dynamicComponentType,recordLayoutCacheKey);}// build the layout descriptor cache key
    const layoutDescriptorCacheKey=this._buildLayoutDescriptorCacheKeyWithRecord(fetchedRecord,layoutType,mode,dynamicComponentType);// check if the layout descriptor exists in the cache
    const existingLayoutDescriptor=cacheAccessor.get(layoutDescriptorCacheKey);if(existingLayoutDescriptor&&existingLayoutDescriptor.value!==undefined){const existingLayoutDescriptorValue=existingLayoutDescriptor.value;const layoutNowTime=cacheAccessor.nowTime;const layoutLastFetchTime=existingLayoutDescriptor.lastFetchTime;// check for ttl expiry of the layout descriptor
    const layoutDescriptorNeedsRefresh=layoutNowTime>layoutLastFetchTime+RECORD_LAYOUT_VALUES_TTL||!hasModule(existingLayoutDescriptorValue);if(layoutDescriptorNeedsRefresh){// if layout descriptor is present in cache and ttl of layout descriptor has expired, then fetch everything from DynamicComponentController
    return this._getFreshValue(cacheAccessor,recordId,layoutType,mode,dynamicComponentType,recordLayoutCacheKey,undefined,undefined,recordTypeId,objectApiName);}// if layout descriptor is present in cache and ttl has not expired, then stagePut the descriptor and return CACHE_MISS
    return this._getFreshValue(cacheAccessor,recordId,layoutType,mode,dynamicComponentType,recordLayoutCacheKey,existingLayoutDescriptorValue,layoutDescriptorCacheKey,recordTypeId,objectApiName);}// if layout descriptor is not present in cache then fetch everything from DynamicComponentController
    return this._getFreshValue(cacheAccessor,recordId,layoutType,mode,dynamicComponentType,recordLayoutCacheKey,undefined,undefined,recordTypeId,objectApiName);});}/**
         * Reference to the RecordService instance.
         */get _recordService(){return this._ldsCache.getService(RECORD_VALUE_TYPE);}}/**
     * Wire adapter id: getRecordLayoutTemplate.
     * @throws Error - Always throws when invoked. Imperative invocation is not supported.
     */function getRecordLayoutTemplate(){throw generateError("getRecordLayoutTemplate");}/**
     * Generates the wire adapters for:
     *      * @wire getRecordLayoutTemplate
     */class RecordLayoutWireAdapterGenerator{/**
         * Constructor.
         * @param recordLayoutService Reference to the RecordLayoutService instance.
         */constructor(recordLayoutService){this._recordLayoutService=recordLayoutService;}/**
         * Generates the wire adapter for @wire getLayoutTemplate.
         * @returns See description.
         */generateGetRecordLayoutTemplateWireAdapter(){const wireAdapter=generateWireAdapter(this._serviceGetRecordLayoutTemplate.bind(this));return wireAdapter;}/**
         * @private Made public for testing.
         * Service @wire getRecordUi.
         * @param config Config params for the service. The type is or'd with any so that we can test sending bad configs. Consumers will be able to send us bad configs.
         * @return Observable stream that emits a record layout template object.
         */_serviceGetRecordLayoutTemplate(config){if(!config){return undefined;}if(!config.recordId||!config.layoutType||!config.mode||!config.dynamicComponentType||!config.objectApiName){return undefined;}const recordId=to18(config.recordId);return this._recordLayoutService.getLayoutTemplateModule(recordId,config.layoutType,config.mode,config.dynamicComponentType,config.objectApiName);}}/**
     * Value type for relatedListRecord actions
     */const RELATEDLISTRECORD_ACTIONS_VALUE_TYPE="lds.RelatedListRecordActions";/**
     * relatedListRecordActions expires in 5 minutes in the cache
     */const RELATEDLISTRECORD_ACTIONS_TTL=5*60*1000;/**
     * Cache key builder for relatedListRecord actions
     * @param recordId record ids
     * @param relatedListRecordIds
     * @param formFactor The form factor
     * @param sections The list of sections
     * @param actionTypes The list of action types
     * @returns Cache key for related list record actions
     */function buildCacheKey$g(recordId,relatedListRecordIds,formFactor,sections,actionTypes){{assert$1(recordId,"A non-empty recordId must be provided");assert$1(relatedListRecordIds.length,"A non-empty relatedListRecordIds must be provided");}const recordId2=to18(recordId);const relatedListRecordIds2=stableCommaDelimitedString(relatedListRecordIds.map(to18));const formFactor2=(formFactor||"").toLowerCase();const sections2=stableCommaDelimitedString(toLowerCase(sections));const actionTypes2=stableCommaDelimitedString(toLowerCase(actionTypes));const key=[recordId2,relatedListRecordIds2,formFactor2,sections2,actionTypes2].join(KEY_DELIM);return {type:RELATEDLISTRECORD_ACTIONS_VALUE_TYPE,key};}/**
     * Quick and dirty function to reconstruct related-list-record actions parameters from a cache key
     * @param affectedKey A cache key
     * @returns RelatedListRecord actions parameters
     */function reconstructRelatedListActionsParameters(affectedKey){const reverseJoin=str=>str?str.split(","):[];const[,recordId,relatedListRecordIds,formFactor,sections,actionTypes]=serialize(affectedKey).split(KEY_DELIM);return {recordId,relatedListRecordIds:reverseJoin(relatedListRecordIds),formFactor,sections:reverseJoin(sections),actionTypes:reverseJoin(actionTypes)};}/**
     * The ui api end point of relatedListRecord actions
     */const ACTIONS_GLOBAL_CONTROLLER$2="ActionsController.getRelatedListRecordActions";/**
     * RelatedListRecord actions service
     * @extends LdsServiceBase
     */class RelatedListRecordActionsService extends LdsServiceBase{constructor(ldsCache,functionProvidesValueProviderFunction){super(ldsCache,[RELATEDLISTRECORD_ACTIONS_VALUE_TYPE]);/**
             * @returns A higher order of function that returns an affected key handler
             */this.affectedKeyHandler=(affectedKey,cacheAccessor)=>{const parameters=reconstructRelatedListActionsParameters(affectedKey);const hasDependencyUpdated=parameters.relatedListRecordIds.some(relatedListRecordId=>{const{dependencies}=this.getCacheKeyDependencyOfKey(parameters,parameters.recordId+","+relatedListRecordId);return dependencies.some(dependency=>!!cacheAccessor.getCommitted(dependency));});if(hasDependencyUpdated){this._ldsCache.get(affectedKey,new ValueProvider(this.getValueProviderFn(affectedKey,parameters,true),{}));return;}const oldValueWrapper=cacheAccessor.get(affectedKey);if(oldValueWrapper){const updatedActionPayloadToEmit=denormalizeValue(cacheAccessor,oldValueWrapper.value);const transformedPayloadToEmit=payloadTransformToRecordIdKey(updatedActionPayloadToEmit);const valueWrapper=cloneWithValueOverride(oldValueWrapper,transformedPayloadToEmit);cacheAccessor.stageEmit(affectedKey,valueWrapper);}};this._functionProvidesValueProviderFunction=functionProvidesValueProviderFunction;}getCacheValueTtl(){return RELATEDLISTRECORD_ACTIONS_TTL;}/**
         * @returns A higher order function to return an affected key handler
         */getAffectedKeyHandler(){return this.affectedKeyHandler;}/**
         * Wire service to provide relatedListRecord actions
         * @param recordId The recordId for its relatedListRecord actions
         * @param relatedListRecordIds the list of relatedListRecord ids for their relatedListRecord actions
         * @param requestParams The request parameters to filter the resulting actions
         * @returns Observable of the list of relatedListRecord actions
         */getRelatedListRecordActions(recordIdEntry,relatedListRecordIdsEntry,requestParams){const parameters=Object.assign({},{recordId:recordIdEntry},{relatedListRecordIds:relatedListRecordIdsEntry},requestParams);const cacheKey=this.buildCacheKey(parameters);const valueProviderFunction=this._functionProvidesValueProviderFunction?this._functionProvidesValueProviderFunction(cacheKey,parameters,false):this.getValueProviderFn(cacheKey,parameters,false);return this._ldsCache.get(cacheKey,new ValueProvider(valueProviderFunction,{}));}/**
         * Stage puts the given action.
         * @param dependencies List of dependent cache keys.
         * @param action The action to stagePut.
         * @param cacheAccessor An object to access cache directly.
         * @param additionalData
         */stagePutValue(dependencies,action,cacheAccessor,additionalData){const relatedListRecordActionCacheKey=this.buildCacheKey(additionalData);cacheAccessor.stagePut(dependencies,relatedListRecordActionCacheKey,action,action);}/**
         * Strips all eTag properties from the this._functionProvidesValueProviderFunctiongiven action by directly deleting them.
         * @param action The action from which to strip the eTags.
         * @returns The given action with its eTags stripped.
         */stripETagsFromValue(action){delete action.eTag;return action;}/**
         * Denormalizes the given normalizedValue and returns it.
         * @param normalizedValue The normalizedValue to denormalize.
         * @param cacheAccessor Used to access the cache.
         * @returns The denormalized related list record actions value.
         */denormalizeValue(normalizedValue,cacheAccessor){const denormalizedValue=denormalizeValue(cacheAccessor,normalizedValue);return denormalizedValue;}/**
         * A higher order function to provide a value provider function
         * @param cacheKey The cache key
         * @param params The relatedListRecord action parameters for the transaction
         * @param forceFetch Indicates whether a server round trip is forced
         * @returns A value provider function
         */getValueProviderFn(cacheKey,params,forceFetch){return cacheAccessor=>{const cacheEntry=cacheAccessor.get(cacheKey);if(!forceFetch&&this.doesCacheEntryHasValue(cacheEntry)&&this.hasNotExpired(cacheAccessor.nowTime,cacheEntry)){return Thenable.resolve(1/* CACHE_HIT */);}return this.primeCacheEntries(params,cacheAccessor,cacheKey).then(result=>{if(cacheEntry&&cacheEntry.eTag&&result.eTag&&cacheEntry.eTag===result.eTag){return 3/* CACHE_MISS_REFRESH_UNCHANGED */;}else{return 2/* CACHE_MISS */;}});};}/**
         * Makes a server round trip and normalizes the response
         * @param parameters The relatedlistRecord action parameters for the round trip
         * @param cacheAccessor The cache accessor for the transaction
         * @param cacheKey The cache key for the payload
         * @returns The action representation
         */primeCacheEntries(parameters,cacheAccessor,cacheKey){return executeAuraGlobalController(ACTIONS_GLOBAL_CONTROLLER$2,parameters).then(response=>{const result=response.body;const transformedResult=payloadTransformToGroupedIdKey(result);normalizePayload(cacheAccessor,this.getCacheKeyDependencyOfKey.bind(this,parameters),cacheKey,transformedResult);const affectedKeys=cacheAccessor.commitPuts();this._ldsCache.handleAffectedKeys(affectedKeys,cacheAccessor);return result;});}/**
         * Builds a relatedListRecord action cache key from parameters
         * @param parameters The relatedListRecord actions parameters
         * @returns A cache key for relatedListRecord actions
         */buildCacheKey(parameters){const{recordId,relatedListRecordIds,formFactor,actionTypes,sections}=parameters;return buildCacheKey$g(recordId,relatedListRecordIds,formFactor,sections,actionTypes);}/**
         * Calculates the cache key and dependencies provided the parameters for the request
         * @param formFactor The form factor
         * @param sections The sections
         * @param actionTypes The action types
         * @param key - recordId+relatedListRecordId
         * @returns The cache key of the request along with their dependencies
         */getCacheKeyDependencyOfKey({formFactor,sections,actionTypes},key){const recordId=key.split(",")[0];const relatedListRecordId=key.split(",")[1];const cacheKey=buildCacheKey$g(recordId,[relatedListRecordId],formFactor,sections,actionTypes);const relatedListRecordCacheKey=buildRecordCacheKey(relatedListRecordId);return {cacheKey,dependencies:[relatedListRecordCacheKey]};}/**
         * A function to check whether cache entry has expired
         * @param now Current timestamp
         * @param entry Cache entry
         * @returns Whether cache entry has expired
         */hasNotExpired(now,entry){return !isNaN(now)&&!isNaN(entry.lastFetchTime)&&now-entry.lastFetchTime<RELATEDLISTRECORD_ACTIONS_TTL;}/**
         * A function to check whether cache entry has a value
         * @param entry Cache entry
         * @returns Whether the cache entry has a value
         */doesCacheEntryHasValue(entry){return entry?entry.value!==undefined:false;}}/**
     * Transform action payload to {actions: {recordId+relatedListId: {actions: []}}, {...}}
     * @param standardPayload - the orignial payload
     * @returns {actions: {recordId+relatedListId: {actions: []}}, {...}}
     */function payloadTransformToGroupedIdKey(standardPayload){const recordId=Object.keys(standardPayload.actions)[0];const actions=standardPayload.actions[recordId].actions;const result={actions:{},eTag:standardPayload.eTag,url:standardPayload.url};for(const action of actions){const key=action.sourceObject+","+action.relatedListRecordId;if(result.actions[key]){result.actions[key].actions.push(action);}else{result.actions[key]={actions:[action],links:standardPayload.actions[recordId].links,url:standardPayload.actions[recordId].url};}}return result;}/**
     * Transform action payload back as standard payload
     * @param payload
     * @returns standardPayload
     */function payloadTransformToRecordIdKey(payload){const originalKeys=Object.keys(payload.actions);const recordId=originalKeys[0].split(",")[0];const result={actions:{}};let actionsResult=[];for(const originalKey of originalKeys){const actions=payload.actions[originalKey].actions;actionsResult=actionsResult.concat(actions);}result.actions[recordId]={actions:actionsResult};return result;}/**
     * Wire adapter id: getRelatedListRecord
     * @throws Always throws when invoked. Imperative invocation is not supported.
     */function getRelatedListRecordActions(){throw generateError("getRelatedListRecordActions");}/**
     * Generates the wire adapter for RelatedListRecord Actions.
     */class RelatedListRecordActionsWireAdapterGenerator{constructor(relatedListRecordActionsService){this._relatedListRecordActionsService=relatedListRecordActionsService;}/**
         * Generates the wire adapter for getRelatedListRecordActions.
         * @returns WireAdapter - See description.
         */generateGetRelatedListRecordActionsWireAdapter(){return generateWireAdapter(this.serviceGetRelatedListRecordActions.bind(this));}/**
         * Service getRelatedListRecordActions @wire.
         * @param recordId
         * @param relatedListRecordIds
         * @param config
         * @returns relatedListRecordActions
         */serviceGetRelatedListRecordActions(config){return this._relatedListRecordActionsService.getRelatedListRecordActions(config.recordId,config.relatedListRecordIds,config.requestParameters);}}/**
     * The valueType to use when building DescriptorFlexipage.
     */const FLEXIPAGE_DESCRIPTOR_VALUE_TYPE="lds.DescriptorFlexipage";/**
     * Time to live for a flexipage descriptor cache value. 30 days.
     */const FLEXIPAGE_DESCRIPTOR_TTL=2592000000;// 30 days.
    /**
     * Constructs a cache key for the Flexipage Template.
     * @param pageDeveloperName Developer Name of the Flexipage
     * @param objectApiName The object api name with which the Flexipage is associated.
     * @returns CacheKey A new cache key representing the Layout value type.
     */function buildCacheKey$h(pageDeveloperName,objectApiName){return {type:FLEXIPAGE_DESCRIPTOR_VALUE_TYPE,key:`${pageDeveloperName}${KEY_DELIM}${objectApiName}`};}/**
     * Generated Component Type for Flexipages
     */const FLEXIPAGE_GENERATED_COMPONENT_TYPE="Flexipage";/**
     * Flexipage save cookie
     */const FLEXIPAGE_SAVE_COOKIE="flexipagesSaved";/**
     * Provides functionality to read flexipage descriptor from the cache. Can refresh the data from the server.
     */class FlexipageService extends LdsServiceBase{/**
         * Constructor.
         * @param ldsCache Reference to the LdsCache instance.
         */constructor(ldsCache,getServiceConfiguration){super(ldsCache,[FLEXIPAGE_DESCRIPTOR_VALUE_TYPE]);this._ttl=FLEXIPAGE_DESCRIPTOR_TTL;this._getServiceConfiguration=getServiceConfiguration;}getCacheValueTtl(){return this._ttl;}setTtl(value){const ttl=parseInt(value,10);this._ttl=isNaN(ttl)?FLEXIPAGE_DESCRIPTOR_TTL:ttl;}/**
         * Strips all eTag properties from the given dynamicComponentDescriptor by directly deleting them.
         * @param dynamicComponentDescriptor The dynamicComponentDescriptor from which to strip the eTags.
         * @returns The given dynamicComponentDescriptor with its eTags stripped.
         */stripETagsFromValue(dynamicComponentDescriptor){return dynamicComponentDescriptor;}/**
         * Stage puts the given dynamicComponentDescriptor.
         * @param dependencies An array of dependent cache keys.
         * @param generatedComponentDescriptor The generatedComponentDescriptor to cache.
         * @param cacheAccessor An object to access cache directly.
         * @param additionalData A property bag with additional values that are needed to generate the cache key.
         */stagePutValue(dependencies,generatedComponentDescriptor,cacheAccessor,additionalData){const cacheKey=buildCacheKey$h(additionalData.pageDeveloperName,additionalData.objectApiName);this.normalizeAndStagePut(dependencies,cacheKey,generatedComponentDescriptor,cacheAccessor);}/**
         * Normalizes and stage puts given generatedComponentDescriptor
         * @param dependencies An array of dependent cache keys.
         * @param cacheKey utilized by the value provider to fetch the value.
         * @param generatedComponentDescriptor The generatedComponentDescriptor to cache.
         * @param cacheAccessor An object to access cache directly.
         */normalizeAndStagePut(dependencies,cacheKey,generatedComponentDescriptor,cacheAccessor){cacheAccessor.stagePut(dependencies,cacheKey,generatedComponentDescriptor,generatedComponentDescriptor);}/**
         * Gets a Flexipage as a Module
         * @param pageDeveloperName The developer name of the page for which descriptor is being fetched.
         * @param objectApiName For Record Home/Object Home, Api Name of the Object flexipage belongs to.
         * @param expansionHints Expansion hints to be used for fetching dependent data
         * @returns The observable used to get the value and keep watch on it for changes.
         */getFlexipageTemplateModule(pageDeveloperName,objectApiName,expansionHints){const cacheKey=buildCacheKey$h(pageDeveloperName,objectApiName);this.getFlexipageDescriptor(pageDeveloperName,objectApiName,expansionHints);const observables=this._ldsCache.getOrCreateObservables(cacheKey,this.getCacheValueTtl());return this._constructModuleObservable(observables.finalTransformed);}/**
         * Retrieves flexipage descriptor from the cache. If it doesn't exist in the cache it will retrieve it from the server and put it into the cache.
         * @param pageDeveloperName The developer name of the page for which descriptor is being fetched.
         * @param objectApiName For Record Home/Object Home, Api Name of the Object flexipage belongs to.
         * @param expansionHints Expansion hints to be used for fetching dependent data
         * @returns The observable used to get the value and keep watch on it for changes.
         */getFlexipageDescriptor(pageDeveloperName,objectApiName,expansionHints){const cacheKey=buildCacheKey$h(pageDeveloperName,objectApiName);const valueProviderParameters={cacheKey,pageDeveloperName,objectApiName,expansionHints};const valueProvider=this._createFlexipageValueProvider(valueProviderParameters);return this._ldsCache.get(cacheKey,valueProvider);}/**
         * Constructs a value provider to retrieve a Flexipage.
         * @param valueProviderParameters The parameters for the value provider as an object.
         * @returns The value provider to retrieve a flexipage.
         */_createFlexipageValueProvider(valueProviderParameters){const{cacheKey,pageDeveloperName,objectApiName,expansionHints}=valueProviderParameters;const flexipageValueProvider=new ValueProvider(cacheAccessor=>{const existingValueWrapper=cacheAccessor.get(cacheKey);if(existingValueWrapper&&existingValueWrapper.value!==undefined){const nowTime=cacheAccessor.nowTime;const lastFetchTime=existingValueWrapper.lastFetchTime;const needsRefresh=nowTime>lastFetchTime+this._ttl||!hasModule(existingValueWrapper.value)||this._isPageInCookie(pageDeveloperName);if(needsRefresh||this._getServiceConfiguration(USE_ADG_CONFIGURATION_KEY)){// Value is stale; get a fresh value.
    return this._getFreshValue(cacheAccessor,pageDeveloperName,objectApiName,expansionHints,needsRefresh);}// The value is not stale so it's a cache hit.
    return Thenable.resolve(1/* CACHE_HIT */);}// No existing value; get a fresh value.
    return this._getFreshValue(cacheAccessor,pageDeveloperName,objectApiName,expansionHints,this._isPageInCookie(pageDeveloperName));},valueProviderParameters);return flexipageValueProvider;}/**
         * Updates the cookie and removes pageDevName
         * @param pageDevName
         */_updatedPageLoaded(pageDevName){const cookieValue=this._getCookie(FLEXIPAGE_SAVE_COOKIE);if(cookieValue!=null){const values=cookieValue.split(",");const index=values.indexOf(pageDevName);if(index>-1){values.splice(index,1);this._setCookie(FLEXIPAGE_SAVE_COOKIE,values.join());}}}/**
         * finds if pageDevName in cookie
         * @param pageDevName
         * @returns true if the pageDevname is in cookie
         */_isPageInCookie(pageDevName){const cookieValue=this._getCookie(FLEXIPAGE_SAVE_COOKIE);if(cookieValue!=null){const values=cookieValue.split(",");const index=values.indexOf(pageDevName);if(index>-1){return true;}else{return false;}}return false;}/**
         * Gets cookie with name
         * @param name cookie name
         * @returns String cookie value
         */_getCookie(name){const unescapeCookieVal=decodeURIComponent;const dc=document.cookie;// dc is set in setCookie so if getCookie is called before setCookie, dc could be null which would result in NPE.
    if(!dc){return null;}const prefix=name+"=";let begin=dc.indexOf("; "+prefix);if(begin===-1){begin=dc.indexOf(prefix);if(begin!==0){return null;}}else{begin+=2;}let end=document.cookie.indexOf(";",begin);if(end===-1){end=dc.length;}return unescapeCookieVal(dc.substring(begin+prefix.length,end));}/**
         * Updates cookie with new value
         * @param name cookie name
         * @param value cookie value
         */_setCookie(name,value){const escapeCookieVal=encodeURIComponent;document.cookie=name+"="+escapeCookieVal(value)+"; path=/";}/**
         * Constructs an Observable with Module defintion for a given Observable with descriptor
         * @param observableToFilter The observable that emits an aura module
         * @returns Observable An observable the emits an aura module
         */_constructModuleObservable(observableToFilter){let moduleObservable=observableToFilter;moduleObservable=moduleObservable.filter(hasModule).map(getModule);return moduleObservable;}/**
         * Gets a fresh value and processes it into the cache with the cacheAccessor.
         * @param cacheAccessor An object to transactionally access the cache.
         * @param apiName The form api name of the form to retrieve.
         * @param eTagToCheck eTag to send to the server to determine if we already have the latest value. If we do the server will return a 304.
         * @returns Returns a ValueProviderResult representing the outcome of the value provider.
         */_getFreshValue(cacheAccessor,pageDeveloperName,objectApiName,expansionHints,needsRefresh){const params={type:FLEXIPAGE_GENERATED_COMPONENT_TYPE,params:{pageDeveloperName,objectApiName},expansionHints};return executeTemplateController(params,cacheAccessor,this._ldsCache,FLEXIPAGE_DESCRIPTOR_VALUE_TYPE,this._getServiceConfiguration,needsRefresh).then(freshValue=>{const descriptor=freshValue.descriptor;if(freshValue.additionalParams){this.setTtl(freshValue.additionalParams.flexipageTtl);}const descriptorCacheKey=buildCacheKey$h(pageDeveloperName,objectApiName);cacheAccessor.stageClearDependencies(descriptorCacheKey);// Nothing should depend on this yet; included for completeness.
    this._updatedPageLoaded(pageDeveloperName);this.normalizeAndStagePut([],descriptorCacheKey,descriptor,cacheAccessor);const affectedKeys=cacheAccessor.commitPuts();this._ldsCache.handleAffectedKeys(affectedKeys,cacheAccessor);return 2/* CACHE_MISS */;});}}/**
     * Wire adapter id: getFlexipageTemplate.
     * @throws Error - Always throws when invoked. Imperative invocation is not supported.
     * @returns void
     */function getFlexipageTemplate(){throw generateError("getFlexipageTemplate");}/**
     * Generates Wire adapters for
     *   @wireAdapter getFlexipageTemplate
     */class FlexipageWireAdapterGenerator{/**
         * Constructor.
         * @param flexipageService Reference to the FlexipageService instance.
         */constructor(flexipageService){this._flexipageService=flexipageService;}/**
         * Generates the wire adapter for getRecord.
         * @returns WireAdapter - See description.
         */generateGetFlexipageTemplateWireAdapter(){const wireAdapter=generateWireAdapter(this._serviceGetFlexipageTemplate.bind(this));return wireAdapter;}/**
         * @private Made public for testing.
         * Service getFlexipageTemplate @wire.
         * @param config: object - Config params for the service.
         * @return Observable<object> - Observable stream that emits a Flexipage Module.
         */_serviceGetFlexipageTemplate(config){if(!config){return undefined;}if(!config.pageDeveloperName){return undefined;}return this._flexipageService.getFlexipageTemplateModule(config.pageDeveloperName,config.objectApiName,{recordId:config.recordId});}}/**
     * The valueType to use when building DescriptorActionTemplate.
     */const ACTION_DESCRIPTOR_VALUE_TYPE="lds.DescriptorActionModule";/**
     * Time to live for a action descriptor cache value. 30 days.
     */const ACTION_DESCRIPTOR_TTL=2592000000;// 30 days.
    /**
     * Constructs a cache key for the ActionTemplate Template.
     * @param actionApiName Api Name of the Action.
     * @param recordId Id of the associated record.
     * @returns CacheKey A new cache key representing the Layout value type.
     */function buildCacheKey$i(actionApiName,recordId,timestamp){return {type:ACTION_DESCRIPTOR_VALUE_TYPE,key:`${actionApiName}${KEY_DELIM}${recordId}${KEY_DELIM}${timestamp}`};}/**
     * Generated Component Type for ActionTemplate
     */const ACTION_GENERATED_COMPONENT_TYPE="Action";/**
     * Provides functionality to read action template descriptor from the cache. Can refresh the data from the server.
     */class ActionTemplateService extends LdsServiceBase{/**
         * Constructor.
         * @param ldsCache Reference to the LdsCache instance.
         */constructor(ldsCache,getServiceConfiguration){super(ldsCache,[ACTION_DESCRIPTOR_VALUE_TYPE]);this._getServiceConfiguration=getServiceConfiguration;}getCacheValueTtl(){return ACTION_DESCRIPTOR_TTL;}/**
         * There are no eTags to strip from dynamicComponentDescriptor so just return the given value unchanged.
         * @param dynamicComponentDescriptor
         * @returns The given dynamicComponentDescriptor unchanged.
         */stripETagsFromValue(dynamicComponentDescriptor){return dynamicComponentDescriptor;}/**
         * Stage puts the given dynamicComponentDescriptor.
         * @param dependencies An array of dependent cache keys.
         * @param generatedComponentDescriptor The generatedComponentDescriptor to cache.
         * @param cacheAccessor An object to access cache directly.
         * @param additionalData A property bag with additional values that are needed to generate the cache key.
         */stagePutValue(dependencies,generatedComponentDescriptor,cacheAccessor,additionalData){const cacheKey=buildCacheKey$i(additionalData.actionApiName,additionalData.recordId,additionalData.timestamp);this.normalizeAndStagePut(dependencies,cacheKey,generatedComponentDescriptor,cacheAccessor);}/**
         * Normalizes and stage puts given generatedComponentDescriptor
         * @param dependencies An array of dependent cache keys.
         * @param cacheKey utilized by the value provider to fetch the value.
         * @param generatedComponentDescriptor The generatedComponentDescriptor to cache.
         * @param cacheAccessor An object to access cache directly.
         */normalizeAndStagePut(dependencies,cacheKey,generatedComponentDescriptor,cacheAccessor){cacheAccessor.stagePut(dependencies,cacheKey,generatedComponentDescriptor,generatedComponentDescriptor);}/**
         * Gets an ActionTemplate as a Module
         * @param actionApiName Api Name of the Action.
         * @param recordId Id of the associated record.
         * @param expansionHints Expansion hints to be used for fetching dependent data
         * @returns The observable used to get the value and keep watch on it for changes.
         */getActionTemplateModule(actionApiName,recordId,timestamp,expansionHints){const cacheKey=buildCacheKey$i(actionApiName,recordId,timestamp);this.getActionDescriptor(actionApiName,recordId,timestamp,expansionHints);const observables=this._ldsCache.getOrCreateObservables(cacheKey,this.getCacheValueTtl());return this._constructModuleObservable(observables.finalTransformed);}/**
         * Retrieves action descriptor from the cache. If it doesn't exist in the cache it will retrieve it from the server and put it into the cache.
         * @param actionApiName Api Name of the Action.
         * @param recordId Id of the associated record.
         * @param expansionHints Expansion hints to be used for fetching dependent data
         * @returns The observable used to get the value and keep watch on it for changes.
         */getActionDescriptor(actionApiName,recordId,timestamp,expansionHints){const cacheKey=buildCacheKey$i(actionApiName,recordId,timestamp);const valueProviderParameters={cacheKey,actionApiName,recordId,timestamp,expansionHints};const valueProvider=this._createActionValueProvider(valueProviderParameters);return this._ldsCache.get(cacheKey,valueProvider);}/**
         * Constructs a value provider to retrieve an ActionTemplate.
         * @param valueProviderParameters The parameters for the value provider as an object.
         * @returns The value provider to retrieve a ActionTemplate.
         */_createActionValueProvider(valueProviderParameters){const{cacheKey,actionApiName,recordId,timestamp,expansionHints}=valueProviderParameters;const actionValueProvider=new ValueProvider(cacheAccessor=>{const existingValueWrapper=cacheAccessor.get(cacheKey);if(existingValueWrapper&&existingValueWrapper.value!==undefined){const nowTime=cacheAccessor.nowTime;const lastFetchTime=existingValueWrapper.lastFetchTime;const needsRefresh=nowTime>lastFetchTime+ACTION_DESCRIPTOR_TTL||!hasModule(existingValueWrapper.value);if(needsRefresh){// Value is stale; get a fresh value.
    return this._getFreshValue(cacheAccessor,actionApiName,recordId,timestamp,expansionHints);}// The value is not stale so it's a cache hit.
    return Thenable.resolve(1/* CACHE_HIT */);}// No existing value; get a fresh value.
    return this._getFreshValue(cacheAccessor,actionApiName,recordId,timestamp,expansionHints);},valueProviderParameters);return actionValueProvider;}/**
         * Constructs an Observable with Module defintion for a given Observable with descriptor
         * @param observableToFilter The observable that emits an aura module
         * @returns Observable An observable the emits an aura module
         */_constructModuleObservable(observableToFilter){let moduleObservable=observableToFilter;moduleObservable=moduleObservable.filter(hasModule).map(getModule);return moduleObservable;}/**
         * Gets a fresh value and processes it into the cache with the cacheAccessor.
         * @param cacheAccessor An object to transactionally access the cache.
         * @param actionApiName Api Name of the Action.
         * @param recordId Id of the associated record.
         * @param expansionHints Expansion hints to be used for fetching dependent data
         * @returns Returns a ValueProviderResult representing the outcome of the value provider.
         */_getFreshValue(cacheAccessor,actionApiName,recordId,timestamp,expansionHints){const params={type:ACTION_GENERATED_COMPONENT_TYPE,params:{actionApiName,recordId,timestamp},expansionHints};return executeTemplateController(params,cacheAccessor,this._ldsCache,ACTION_DESCRIPTOR_VALUE_TYPE,this._getServiceConfiguration).then(freshValue=>{const descriptor=freshValue.descriptor;const descriptorCacheKey=buildCacheKey$i(actionApiName,recordId,timestamp);cacheAccessor.stageClearDependencies(descriptorCacheKey);// Nothing should depend on this yet; included for completeness.
    this.normalizeAndStagePut([],descriptorCacheKey,descriptor,cacheAccessor);const affectedKeys=cacheAccessor.commitPuts();this._ldsCache.handleAffectedKeys(affectedKeys,cacheAccessor);return 2/* CACHE_MISS */;});}}/**
     * Wire adapter id: getActionTemplate.
     * @throws Error - Always throws when invoked. Imperative invocation is not supported.
     * @returns void
     */function getActionTemplate(){throw generateError("getActionTemplate");}/**
     * Generates Wire adapters for
     *   @wireAdapter getActionTemplate
     */class ActionTemplateWireAdapterGenerator{/**
         * Constructor.
         * @param ActionTemplateService Reference to the ActionTemplateService instance.
         */constructor(actionTemplateService){this._actionTemplateService=actionTemplateService;}/**
         * Generates the wire adapter for getActionTemplate.
         * @returns WireAdapter - See description.
         */generateGetActionTemplateWireAdapter(){const wireAdapter=generateWireAdapter(this._serviceGetActionTemplate.bind(this));return wireAdapter;}/**
         * @private Made public for testing.
         * Service getActionTemplate @wire.
         * @param config: object - Config params for the service.
         * @return Observable<object> - Observable stream that emits an ActionTemplate.
         */_serviceGetActionTemplate(config){if(!config||!config.actionApiName||!config.recordId||!config.timestamp){return undefined;}return this._actionTemplateService.getActionTemplateModule(config.actionApiName,config.recordId,config.timestamp,{});}}/**
     * Value type for record actions
     */const RECORD_ACTIONS_VALUE_TYPE="lds.RecordActions";/**
     * Record actions expires in 5 minutes in the cache
     */const RECORD_ACTIONS_TTL=5*60*1000;/**
     * Cache key builder for record actions
     * @param recordIds The list of record ids
     * @param formFactor The form factor
     * @param sections The list of sections
     * @param actionTypes The list of action types
     * @param retrievalMode Sets the retrieval mode
     * @param apiNames Sets the Api Names
     * @return A cache key for record actions
     */function buildCacheKey$j(recordIds,formFactor,sections,actionTypes,retrievalMode,apiNames){{assert$1(recordIds.length,"A non-empty recordIds must be provided");}const recordId=stableCommaDelimitedString(recordIds.map(to18));formFactor=(formFactor||"").toLowerCase();const section=stableCommaDelimitedString(toLowerCase(sections));const actionType=stableCommaDelimitedString(toLowerCase(actionTypes));retrievalMode=(retrievalMode||"").toLowerCase();const apiName=stableCommaDelimitedString(apiNames);const key=[recordId,formFactor,section,actionType,retrievalMode,apiName].join(KEY_DELIM);return {type:RECORD_ACTIONS_VALUE_TYPE,key};}/**
     * Quick and dirty function to reconstruct record actions parameters from a cache key
     * @param affectedKey A cache key
     * @return Record actions parameters
     */function reconstructRecordActionsParameters(affectedKey){const reverseJoin=str=>str?str.split(","):[];const[,recordIds,formFactor,sections,actionTypes,retrievalMode,apiNames]=serialize(affectedKey).split(KEY_DELIM);return {recordId:reverseJoin(recordIds),formFactor,sections:reverseJoin(sections),actionTypes:reverseJoin(actionTypes),retrievalMode,apiNames:reverseJoin(apiNames)};}/**
     * The ui api end point of record actions
     */const ACTIONS_GLOBAL_CONTROLLER$3="ActionsController.getRecordActions";/**
     * Record actions service
     */class RecordActionsService extends LdsServiceBase{/**
         * Constructor.
         * @param ldsCache Reference to the LdsCache instance.
         * @param affectedKeyHandlerInspector Used by tests to inspect the affectedKeyHandler.
         * @param valueProviderFunctionInspector Used by tests to inspect the valueProviderFunction.
         */constructor(ldsCache,functionProvidesValueProviderFunction){super(ldsCache,[RECORD_ACTIONS_VALUE_TYPE,ACTION_DEFINITION_VALUE_TYPE]);/**
             * Affected key handler instance for the service
             */this.affectedKeyHandler=(affectedKey,cacheAccessor)=>{const parameters=reconstructRecordActionsParameters(affectedKey);const hasDependencyUpdated=parameters.recordId.some(recordId=>{const{dependencies}=this.getCacheKeyDependencyOfKey(parameters,recordId);return dependencies.some(dependency=>!!cacheAccessor.getCommitted(dependency));});if(hasDependencyUpdated){this._ldsCache.get(affectedKey,new ValueProvider(this.getValueProviderFn(affectedKey,parameters,true),{}));return;}const oldValueWrapper=cacheAccessor.get(affectedKey);if(oldValueWrapper){const updatedActionPayloadToEmit=denormalizeValue(cacheAccessor,oldValueWrapper.value);const valueWrapper=cloneWithValueOverride(oldValueWrapper,updatedActionPayloadToEmit);cacheAccessor.stageEmit(affectedKey,valueWrapper);}};this._functionProvidesValueProviderFunction=functionProvidesValueProviderFunction;}getCacheValueTtl(){return RECORD_ACTIONS_TTL;}/**
         * A function to check whether cache entry has expired
         * @param now Current timestamp
         * @param entry Cache entry
         * @returns Whether cache entry has expired
         */hasNotExpired(now,entry){return !isNaN(now)&&!isNaN(entry.lastFetchTime)&&now-entry.lastFetchTime<RECORD_ACTIONS_TTL;}/**
         * A function to check whether cache entry has a value
         * @param entry Cache entry
         * @return Whether the cache entry has a value
         */doesCacheEntryHasValue(entry){return entry?entry.value!==undefined:false;}/**
         * @return A higher order of function that returns an affected key handler
         */getAffectedKeyHandler(){return this.affectedKeyHandler;}/**
         * Wire service to provide record actions
         * @param The list of recordIds for their record detail actions
         * @param optionalParameters The optional parameters to further filter the resultant actions
         * @return Observable of the list of record actions
         */getRecordActions(recordIds,requestParams){const parameters=Object.assign({},{recordId:recordIds},requestParams);const cacheKey=this.buildCacheKey(parameters);const valueProviderFunction=this._functionProvidesValueProviderFunction?this._functionProvidesValueProviderFunction(cacheKey,parameters,false):this.getValueProviderFn(cacheKey,parameters,false);return this._ldsCache.get(cacheKey,new ValueProvider(valueProviderFunction,{}));}/**
         * Stage puts the given action.
         * @param dependencies List of dependent cache keys.
         * @param action The action to stagePut.
         * @param cacheAccessor An object to access cache directly.
         * @param additionalData Data to build cache key with
         */stagePutValue(dependencies,action,cacheAccessor,additionalData){const recordActionCacheKey=this.buildCacheKey(additionalData);cacheAccessor.stagePut(dependencies,recordActionCacheKey,action,action);}/**
         * Strips all eTag properties from the given action by directly deleting them.
         * @param action The action from which to strip the eTags.
         * @returns The given action with its eTags stripped.
         */stripETagsFromValue(action){delete action.eTag;return action;}/**
         * Denormalizes the given normalizedValue and returns it.
         * @param normalizedValue The normalizedValue to denormalize.
         * @param cacheAccessor Used to access the cache.
         * @returns The denormalized record actions value.
         */denormalizeValue(normalizedValue,cacheAccessor){const denormalizedValue=denormalizeValue(cacheAccessor,normalizedValue);return denormalizedValue;}/**
         * A higher order function to provide a value provider function
         * @param cacheKey The cache key
         * @param params The record action parameters for the transaction
         * @param forceFetch Indicates whether a server round trip is forced
         * @return A value provider function
         */getValueProviderFn(cacheKey,params,forceFetch){return cacheAccessor=>{const cacheEntry=cacheAccessor.get(cacheKey);if(!forceFetch&&this.doesCacheEntryHasValue(cacheEntry)&&this.hasNotExpired(cacheAccessor.nowTime,cacheEntry)){return Thenable.resolve(1/* CACHE_HIT */);}return this.primeCacheEntries(params,cacheAccessor,cacheKey).then(result=>{if(cacheEntry&&cacheEntry.eTag&&result.eTag&&cacheEntry.eTag===result.eTag){return 3/* CACHE_MISS_REFRESH_UNCHANGED */;}else{return 2/* CACHE_MISS */;}});};}/**
         * Makes a server round trip and normalizes the response
         * @param parameters The record action parameters for the round trip
         * @param cacheAccessor The cache accessor for the transaction
         * @param cacheKey The cache key for the payload
         * @return The action representation
         */primeCacheEntries(parameters,cacheAccessor,cacheKey){return executeAuraGlobalController(ACTIONS_GLOBAL_CONTROLLER$3,parameters).then(response=>{const result=response.body;normalizePayload(cacheAccessor,this.getCacheKeyDependencyOfKey.bind(this,parameters),cacheKey,result);const affectedKeys=cacheAccessor.commitPuts();this._ldsCache.handleAffectedKeys(affectedKeys,cacheAccessor);return result;});}/**
         * Builds a record action cache key from parameters
         * @param parameters The record actions parameters
         * @return A cache key for record actions
         */buildCacheKey(parameters){const{recordId:recordIds,formFactor,actionTypes,sections,retrievalMode,apiNames}=parameters;return buildCacheKey$j(recordIds,formFactor,sections,actionTypes,retrievalMode,apiNames);}/**
         * Calculates the cache key and dependencies provided the parameters for the request
         * @param formFactor The form factor
         * @param sections The sections
         * @param actionTypes The action types
         * @param recordId The record id
         * @return The cache key of the request along with their dependencies
         */getCacheKeyDependencyOfKey({formFactor,sections,actionTypes,retrievalMode,apiNames},recordId){const cacheKey=buildCacheKey$j([recordId],formFactor,sections,actionTypes,retrievalMode,apiNames);const recordCacheKey=buildRecordCacheKey(recordId);return {cacheKey,dependencies:[recordCacheKey],getSingleActionByApiNameCacheKey:apiName=>{return buildCacheKey$j([recordId],formFactor,sections,actionTypes,"All",[apiName]);}};}}/**
     * Wire adapter id: getRecordActions.
     * @throws Always throws when invoked. Imperative invocation is not supported.
     */function getRecordActions(){throw generateError("getRecordActions");}/**
     * Generates the wire adapter for Record Actions.
     */class RecordActionsWireAdapterGenerator{/**
         * Constructor.
         * @param recordActionsService Reference to the RecordActionsService instance.
         */constructor(recordActionsService){this._recordActionsService=recordActionsService;}/**
         * Generates the wire adapter for getRecordActions.
         * @returns See description.
         */generateGetRecordActionsWireAdapter(){return generateWireAdapter(this.serviceGetRecordActions.bind(this));}/**
         * Service getRecordActions @wire
         * @param config Parameters for the service
         * @returns Observable stream that emits record actions.
         */serviceGetRecordActions(config){return this._recordActionsService.getRecordActions(config.recordIds,config.requestParameters);}}/*
     * This is the container for LDS in lwc core.
     */const isLDSDurableStoreEnabled=typeof $A!=="undefined"&&$A.get("$Browser.S1Features.isLDSDurableStoreEnabled");let storeAccessor;// create durable store accessor if required
    if(isLDSDurableStoreEnabled){const storage$$1=createDurableStorage("LDS");storeAccessor=typeof storage$$1!=="undefined"?new DurableStoreAccessor(storage$$1,5000):undefined;}// Create the cache layer
    const cacheStore=new InMemoryCacheStore(storeAccessor);exports.ldsCacheReferenceForTestingOnly=new LdsCache("LDS Production Cache",cacheStore,defaultTimeSource);// set pruning strategy for durable store accessor
    if(storeAccessor){const pruningStrategy=new DurableStorePruningStrategy(exports.ldsCacheReferenceForTestingOnly);storeAccessor.setPruningStrategy(pruningStrategy);}// Create ads bridge.
    const adsBridge=new AdsBridge(exports.ldsCacheReferenceForTestingOnly);function checkS1Features(key){return typeof $A!=="undefined"&&$A.get("$Browser.S1Features."+key);}// TODO: This would be better served as a class
    function getServiceConfiguration$1(key){switch(key){case USE_ADG_CONFIGURATION_KEY:return checkS1Features(USE_ADG_KEY);case USE_DEDUPE_CONFIGURATION_KEY:return checkS1Features(USE_DEDUPE_KEY);case TEMPLATE_DURABLE_CACHE_TTL_240_KEY$1:return checkS1Features(TEMPLATE_DURABLE_CACHE_TTL_240_KEY$1);default:return false;}}provideConfiguration(getServiceConfiguration$1);// Create services.
    const apexService=new ApexService(exports.ldsCacheReferenceForTestingOnly);const formService=new FormService(exports.ldsCacheReferenceForTestingOnly);const formUiService=new FormUiService(exports.ldsCacheReferenceForTestingOnly,adsBridge);const layoutService=new LayoutService(exports.ldsCacheReferenceForTestingOnly,getServiceConfiguration$1);const layoutUserStateService=new LayoutUserStateService(exports.ldsCacheReferenceForTestingOnly);const listUiService=new ListUiService(exports.ldsCacheReferenceForTestingOnly);const lookupActionsService=new LookupActionsService(exports.ldsCacheReferenceForTestingOnly);const lookupRecordsService=new LookupRecordsService(exports.ldsCacheReferenceForTestingOnly);const objectInfoService=new ObjectInfoService(exports.ldsCacheReferenceForTestingOnly);const picklistValuesService=new PicklistValuesService(exports.ldsCacheReferenceForTestingOnly);const picklistValuesByRecordTypeService=new PicklistValuesByRecordTypeService(exports.ldsCacheReferenceForTestingOnly);const recordActionsService=new RecordActionsService(exports.ldsCacheReferenceForTestingOnly);const relatedListRecordActionsService=new RelatedListRecordActionsService(exports.ldsCacheReferenceForTestingOnly);const recordAvatarService=new RecordAvatarService(exports.ldsCacheReferenceForTestingOnly);const recordAvatarBulkService=new RecordAvatarBulkService(exports.ldsCacheReferenceForTestingOnly);const recordDefaultsService=new RecordDefaultsService(exports.ldsCacheReferenceForTestingOnly);const recordEditActionsService=new RecordEditActionsService(exports.ldsCacheReferenceForTestingOnly);const recordFormService=new RecordFormService(exports.ldsCacheReferenceForTestingOnly,adsBridge);const recordLayoutService=new RecordLayoutService(exports.ldsCacheReferenceForTestingOnly,adsBridge,getServiceConfiguration$1);const recordService=new RecordService(exports.ldsCacheReferenceForTestingOnly,adsBridge);const recordUiService=new RecordUiService(exports.ldsCacheReferenceForTestingOnly,adsBridge);const flexipageService=new FlexipageService(exports.ldsCacheReferenceForTestingOnly,getServiceConfiguration$1);const actionTemplateService=new ActionTemplateService(exports.ldsCacheReferenceForTestingOnly,getServiceConfiguration$1);// Register services.
    exports.ldsCacheReferenceForTestingOnly.registerService(apexService);exports.ldsCacheReferenceForTestingOnly.registerService(formService);exports.ldsCacheReferenceForTestingOnly.registerService(formUiService);exports.ldsCacheReferenceForTestingOnly.registerService(layoutService);exports.ldsCacheReferenceForTestingOnly.registerService(layoutUserStateService);exports.ldsCacheReferenceForTestingOnly.registerService(listUiService);exports.ldsCacheReferenceForTestingOnly.registerService(lookupActionsService);exports.ldsCacheReferenceForTestingOnly.registerService(lookupRecordsService);exports.ldsCacheReferenceForTestingOnly.registerService(objectInfoService);exports.ldsCacheReferenceForTestingOnly.registerService(picklistValuesService);exports.ldsCacheReferenceForTestingOnly.registerService(picklistValuesByRecordTypeService);exports.ldsCacheReferenceForTestingOnly.registerService(recordActionsService);exports.ldsCacheReferenceForTestingOnly.registerService(relatedListRecordActionsService);exports.ldsCacheReferenceForTestingOnly.registerService(recordAvatarService);exports.ldsCacheReferenceForTestingOnly.registerService(recordAvatarBulkService);exports.ldsCacheReferenceForTestingOnly.registerService(recordService);exports.ldsCacheReferenceForTestingOnly.registerService(recordDefaultsService);exports.ldsCacheReferenceForTestingOnly.registerService(recordFormService);exports.ldsCacheReferenceForTestingOnly.registerService(recordLayoutService);exports.ldsCacheReferenceForTestingOnly.registerService(recordUiService);exports.ldsCacheReferenceForTestingOnly.registerService(flexipageService);exports.ldsCacheReferenceForTestingOnly.registerService(actionTemplateService);// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Apex
    // /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Exports.
    // Apex wire adapters are registered in salesforce-scoped-module-resolver lwc module. Therefore we just expose the methods
    // to generate the wire adapters and don't actually register them here.
    const apexWireAdapterGenerator=new ApexWireAdapterGenerator(apexService);const getApexInvoker=apexWireAdapterGenerator.getApexInvoker.bind(apexWireAdapterGenerator);const generateGetApexWireAdapter=apexWireAdapterGenerator.generateGetApexWireAdapter.bind(apexWireAdapterGenerator);// //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Form Ui
    // //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Wire adapter.
    const formUiWireAdapterGenerator=new FormUiWireAdapterGenerator(formUiService);wireService.register(getFormSectionUi,formUiWireAdapterGenerator.generateGetFormSectionUiWireAdapter());// TODO W-4846954 - do not export getFormSectionUiObservable that returns an observable
    const getFormSectionUiObservable=formUiService.getFormSectionUi.bind(formUiService);// //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Layout
    // //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Wire Adapter
    const layoutWireAdapterGenerator=new LayoutWireAdapterGenerator(layoutService);wireService.register(getLayout,layoutWireAdapterGenerator.generateGetLayoutWireAdapter());// TODO W-4846954 - do not export Observable methods.
    const getLayoutObservable=layoutService.getLayout.bind(layoutService);// //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Layout User State
    // //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Wire Adapter
    const layoutUserStateWireAdapterGenerator=new LayoutUserStateWireAdapterGenerator(layoutUserStateService);wireService.register(getLayoutUserState,layoutUserStateWireAdapterGenerator.generateGetLayoutUserStateWireAdapter());const updateLayoutUserState=layoutUserStateService.updateLayoutUserState.bind(layoutUserStateService);// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // List Ui
    // /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Wire adapter.
    const listUiWireAdapterGenerator=new ListUiWireAdapterGenerator(listUiService);wireService.register(getListUi,listUiWireAdapterGenerator.generateGetListUiWireAdapter());const saveSort=listUiService.saveSort.bind(listUiService);const saveColumnWidths=listUiService.saveColumnWidths.bind(listUiService);// //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Lookup Actions
    // //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Wire adapter.
    const lookupActionsWireAdapterGenerator=new LookupActionsWireAdapterGenerator(lookupActionsService);wireService.register(getLookupActions,lookupActionsWireAdapterGenerator.generateGetLookupActionsWireAdapter());// //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Record Actions
    // //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Wire adapter.
    const recordActionsWireAdapterGenerator=new RecordActionsWireAdapterGenerator(recordActionsService);wireService.register(getRecordActions,recordActionsWireAdapterGenerator.generateGetRecordActionsWireAdapter());// //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Relatedlist Record Actions
    // //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Wire adapter.
    const relatedListRecordActionsWireAdapterGenerator=new RelatedListRecordActionsWireAdapterGenerator(relatedListRecordActionsService);wireService.register(getRelatedListRecordActions,relatedListRecordActionsWireAdapterGenerator.generateGetRelatedListRecordActionsWireAdapter());// //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Lookup Records
    // //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Wire adapter.
    const lookupRecordsWireAdapterGenerator=new LookupRecordsWireAdapterGenerator(lookupRecordsService);wireService.register(getLookupRecords,lookupRecordsWireAdapterGenerator.generateGetLookupRecordsWireAdapter());// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Object Info
    // /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Wire adapter.
    const objectInfoWireAdapterGenerator=new ObjectInfoWireAdapterGenerator(objectInfoService);wireService.register(getObjectInfo,objectInfoWireAdapterGenerator.generateGetObjectInfoWireAdapter());// TODO W-4846954 - do not export *Observable methods.
    const getObjectInfoObservable=objectInfoService.getObjectInfo.bind(objectInfoService);// //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Picklist values
    // /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Wire adapter.
    const picklistValuesWireAdapterGenerator=new PicklistValuesWireAdapterGenerator(picklistValuesService);wireService.register(getPicklistValues,picklistValuesWireAdapterGenerator.generateGetPicklistValuesWireAdapter());// TODO W-4846954 - do not export *Observable methods.
    const getPicklistValuesObservable=picklistValuesService.getPicklistValues.bind(picklistValuesService);// //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Picklist values by record type
    // /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Wire adapter.
    const picklistValuesByRecordTypeWireAdapterGenerator=new PicklistValuesByRecordTypeWireAdapterGenerator(picklistValuesByRecordTypeService);wireService.register(getPicklistValuesByRecordType,picklistValuesByRecordTypeWireAdapterGenerator.generateGetPicklistValuesByRecordTypeWireAdapter());// TODO W-4846954 - do not export *Observable methods.
    const getPicklistValuesByRecordTypeObservable=picklistValuesByRecordTypeService.getPicklistValuesByRecordType.bind(picklistValuesByRecordTypeService);// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Record
    // /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Wire adapter.
    const recordWireAdapterGenerator=new RecordWireAdapterGenerator(recordService);wireService.register(getRecord,recordWireAdapterGenerator.generateGetRecordWireAdapter());// TODO W-4846954 - do not export getRecordWithFieldsObservable that returns an observable
    const getRecordWithFieldsObservable=recordService.getRecordWithFields.bind(recordService);const createRecord=recordService.createRecord.bind(recordService);const updateRecord=recordService.updateRecord.bind(recordService);const deleteRecord=recordService.deleteRecord.bind(recordService);// //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Record Avatar
    // /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Wire adapter.
    const recordAvatarWireAdapterGenerator=new RecordAvatarBulkWireAdapterGenerator(recordAvatarBulkService);wireService.register(getRecordAvatars,recordAvatarWireAdapterGenerator.generateGetRecordAvatarsWireAdapter());// TODO W-4846954 - do not export getRecordAvatarsObservable that returns an observable
    const getRecordAvatarsObservable=recordAvatarBulkService.getRecordAvatars.bind(recordAvatarBulkService);// //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Record Create Defaults
    // /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Wire adapter.
    const recordDefaultsWireAdapterGenerator=new RecordDefaultsWireAdapterGenerator(recordDefaultsService);wireService.register(getRecordCreateDefaults,recordDefaultsWireAdapterGenerator.generateGetRecordCreateDefaultsWireAdapter());// TODO W-4846954 - do not export getRecordCreateDefaultsObservable that returns an observable
    const getRecordCreateDefaultsObservable=recordDefaultsService.getRecordCreateDefaults.bind(recordDefaultsService);// //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Record Edit Actions
    // //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Wire adapter.
    const recordEditActionsWireAdapterGenerator=new RecordEditActionsWireAdapterGenerator(recordEditActionsService);wireService.register(getRecordEditActions,recordEditActionsWireAdapterGenerator.generateGetRecordEditActionsWireAdapter());// //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Record Form
    // /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Exports.
    // TODO W-4846954 - do not export getFormSectionComponent. Expose an @wire instead.
    const getFormSectionComponent=recordFormService.getFormSectionComponent.bind(recordFormService);// //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Record Layout
    // /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Wire adapter.
    const recordLayoutWireAdapterGenerator=new RecordLayoutWireAdapterGenerator(recordLayoutService);wireService.register(getRecordLayoutTemplate,recordLayoutWireAdapterGenerator.generateGetRecordLayoutTemplateWireAdapter());// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Record Ui
    // /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Wire adapter.
    const recordUiWireAdapterGenerator=new RecordUiWireAdapterGenerator(recordUiService);wireService.register(getRecordUi,recordUiWireAdapterGenerator.generateGetRecordUiWireAdapter());// TODO W-4846954 - do not export getRecordUiObservable that returns an observable
    const getRecordUiObservable=recordUiService.getRecordUi.bind(recordUiService);// //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Flexipages
    // /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Wire adapter.
    const flexipageWireAdapterGenerator=new FlexipageWireAdapterGenerator(flexipageService);wireService.register(getFlexipageTemplate,flexipageWireAdapterGenerator.generateGetFlexipageTemplateWireAdapter());// //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Actions
    // //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Wire adapter.
    const actionTemplateWireAdapterGenerator=new ActionTemplateWireAdapterGenerator(actionTemplateService);wireService.register(getActionTemplate,actionTemplateWireAdapterGenerator.generateGetActionTemplateWireAdapter());// ////////////////////////
    // Trigger bootstrap to ready the cache. If a durableStoreAccessor is configured this will load durable store from disk and into memory.
    exports.ldsCacheReferenceForTestingOnly.bootstrap();

    exports.MRU = MRU;
    exports.Observable = Observable;
    exports.adsBridge = adsBridge;
    exports.createRecord = createRecord;
    exports.createRecordInputFilteredByEditedFields = createRecordInputFilteredByEditedFields;
    exports.deleteRecord = deleteRecord;
    exports.generateError = generateError;
    exports.generateGetApexWireAdapter = generateGetApexWireAdapter;
    exports.generateRecordInputForCreate = generateRecordInputForCreate;
    exports.generateRecordInputForUpdate = generateRecordInputForUpdate;
    exports.generateWireAdapter = generateWireAdapter;
    exports.getActionTemplate = getActionTemplate;
    exports.getApexInvoker = getApexInvoker;
    exports.getFieldDisplayValue = getFieldDisplayValue;
    exports.getFieldValue = getFieldValue;
    exports.getFlexipageTemplate = getFlexipageTemplate;
    exports.getFormSectionComponent = getFormSectionComponent;
    exports.getFormSectionUi = getFormSectionUi;
    exports.getFormSectionUiObservable = getFormSectionUiObservable;
    exports.getLayout = getLayout;
    exports.getLayoutObservable = getLayoutObservable;
    exports.getLayoutUserState = getLayoutUserState;
    exports.getListUi = getListUi;
    exports.getLookupActions = getLookupActions;
    exports.getLookupRecords = getLookupRecords;
    exports.getObjectInfo = getObjectInfo;
    exports.getObjectInfoObservable = getObjectInfoObservable;
    exports.getPicklistValues = getPicklistValues;
    exports.getPicklistValuesByRecordType = getPicklistValuesByRecordType;
    exports.getPicklistValuesByRecordTypeObservable = getPicklistValuesByRecordTypeObservable;
    exports.getPicklistValuesObservable = getPicklistValuesObservable;
    exports.getRecord = getRecord;
    exports.getRecordActions = getRecordActions;
    exports.getRecordAvatars = getRecordAvatars;
    exports.getRecordAvatarsObservable = getRecordAvatarsObservable;
    exports.getRecordCreateDefaults = getRecordCreateDefaults;
    exports.getRecordCreateDefaultsObservable = getRecordCreateDefaultsObservable;
    exports.getRecordEditActions = getRecordEditActions;
    exports.getRecordInput = getRecordInput;
    exports.getRecordLayoutTemplate = getRecordLayoutTemplate;
    exports.getRecordUi = getRecordUi;
    exports.getRecordUiObservable = getRecordUiObservable;
    exports.getRecordWithFieldsObservable = getRecordWithFieldsObservable;
    exports.getRelatedListRecordActions = getRelatedListRecordActions;
    exports.getSObjectValue = getSObjectValue;
    exports.getValueForAura = getValueForAura;
    exports.recursivelyGatherFieldNames = recursivelyGatherFieldNames;
    exports.refresh = refreshWireAdapter;
    exports.saveColumnWidths = saveColumnWidths;
    exports.saveSort = saveSort;
    exports.updateLayoutUserState = updateLayoutUserState;
    exports.updateRecord = updateRecord;

    Object.defineProperty(exports, '__esModule', { value: true });

});
