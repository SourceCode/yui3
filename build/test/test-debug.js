YUI.add('test', function(Y) {

    /**
     * YUI JavaScript Testing Framework
     *
     * @module yuitest
     */

    
    Y.namespace("Test");
    
    /**
     * Test case containing various tests to run.
     * @param template An object containing any number of test methods, other methods,
     *                 an optional name, and anything else the test case needs.
     * @class Case
     * @namespace Test
     * @constructor
     */
    Y.Test.Case = function (template /*:Object*/) {
        
        /**
         * Special rules for the test case. Possible subobjects
         * are fail, for tests that should fail, and error, for
         * tests that should throw an error.
         */
        this._should /*:Object*/ = {};
        
        //copy over all properties from the template to this object
        for (var prop in template) {
            this[prop] = template[prop];
        }    
        
        //check for a valid name
        if (!Y.Lang.isString(this.name)){
            /**
             * Name for the test case.
             */
            this.name /*:String*/ = "testCase" + Y.guid();
        }
    
    };
            
    Y.Test.Case.prototype = {  
    
        /**
         * Resumes a paused test and runs the given function.
         * @param {Function} segment (Optional) The function to run.
         *      If omitted, the test automatically passes.
         * @return {Void}
         * @method resume
         */
        resume : function (segment /*:Function*/) /*:Void*/ {
            Y.Test.Runner.resume(segment);
        },
    
        /**
         * Causes the test case to wait a specified amount of time and then
         * continue executing the given code.
         * @param {Function} segment (Optional) The function to run after the delay.
         *      If omitted, the TestRunner will wait until resume() is called.
         * @param {int} delay (Optional) The number of milliseconds to wait before running
         *      the function. If omitted, defaults to zero.
         * @return {Void}
         * @method wait
         */
        wait : function (segment /*:Function*/, delay /*:int*/) /*:Void*/{
            var args = arguments;
            if (Y.Lang.isFunction(args[0])){
                throw new Y.Test.Wait(args[0], args[1]);
            } else {
                throw new Y.Test.Wait(function(){
                    Y.Assert.fail("Timeout: wait() called but resume() never called.");
                }, (Y.Lang.isNumber(args[0]) ? args[0] : 10000));
            }
        },
    
        //-------------------------------------------------------------------------
        // Stub Methods
        //-------------------------------------------------------------------------
    
        /**
         * Function to run before each test is executed.
         * @return {Void}
         * @method setUp
         */
        setUp : function () /*:Void*/ {
        },
        
        /**
         * Function to run after each test is executed.
         * @return {Void}
         * @method tearDown
         */
        tearDown: function () /*:Void*/ {    
        }
    };
    
    /**
     * Represents a stoppage in test execution to wait for an amount of time before
     * continuing.
     * @param {Function} segment A function to run when the wait is over.
     * @param {int} delay The number of milliseconds to wait before running the code.
     * @class Wait
     * @namespace Test
     * @constructor
     *
     */
    Y.Test.Wait = function (segment /*:Function*/, delay /*:int*/) {
        
        /**
         * The segment of code to run when the wait is over.
         * @type Function
         * @property segment
         */
        this.segment /*:Function*/ = (Y.Lang.isFunction(segment) ? segment : null);
    
        /**
         * The delay before running the segment of code.
         * @type int
         * @property delay
         */
        this.delay /*:int*/ = (Y.Lang.isNumber(delay) ? delay : 0);        
    };


        
    Y.namespace("Test");
    
    /**
     * A test suite that can contain a collection of TestCase and TestSuite objects.
     * @param {String||Object} data The name of the test suite or an object containing
     *      a name property as well as setUp and tearDown methods.
     * @namespace Test
     * @class Suite
     * @constructor
     */
    Y.Test.Suite = function (data /*:String||Object*/) {
    
        /**
         * The name of the test suite.
         * @type String
         * @property name
         */
        this.name /*:String*/ = "";
    
        /**
         * Array of test suites and
         * @private
         */
        this.items /*:Array*/ = [];
    
        //initialize the properties
        if (Y.Lang.isString(data)){
            this.name = data;
        } else if (Y.Lang.isObject(data)){
            Y.mix(this, data, true);
        }
    
        //double-check name
        if (this.name === ""){
            this.name = "testSuite" + Y.guid();
        }
    
    };
    
    Y.Test.Suite.prototype = {
        
        /**
         * Adds a test suite or test case to the test suite.
         * @param {Y.Test.Suite||Y.Test.Case} testObject The test suite or test case to add.
         * @return {Void}
         * @method add
         */
        add : function (testObject /*:Y.Test.Suite*/) /*:Void*/ {
            if (testObject instanceof Y.Test.Suite || testObject instanceof Y.Test.Case) {
                this.items.push(testObject);
            }
        },
        
        //-------------------------------------------------------------------------
        // Stub Methods
        //-------------------------------------------------------------------------
    
        /**
         * Function to run before each test is executed.
         * @return {Void}
         * @method setUp
         */
        setUp : function () /*:Void*/ {
        },
        
        /**
         * Function to run after each test is executed.
         * @return {Void}
         * @method tearDown
         */
        tearDown: function () /*:Void*/ {
        }
        
    };

    
    /*
     * Runs test suites and test cases, providing events to allowing for the
     * interpretation of test results.
     * @namespace Test
     * @class Runner
     * @static
     */
    Y.Test.Runner = (function(){
    
        /**
         * A node in the test tree structure. May represent a TestSuite, TestCase, or
         * test function.
         * @param {Variant} testObject A TestSuite, TestCase, or the name of a test function.
         * @class TestNode
         * @constructor
         * @private
         */
        function TestNode(testObject /*:Variant*/){
        
            /**
             * The TestSuite, TestCase, or test function represented by this node.
             * @type Variant
             * @property testObject
             */
            this.testObject = testObject;
            
            /**
             * Pointer to this node's first child.
             * @type TestNode
             * @property firstChild
             */        
            this.firstChild /*:TestNode*/ = null;
            
            /**
             * Pointer to this node's last child.
             * @type TestNode
             * @property lastChild
             */        
            this.lastChild = null;
            
            /**
             * Pointer to this node's parent.
             * @type TestNode
             * @property parent
             */        
            this.parent = null; 
       
            /**
             * Pointer to this node's next sibling.
             * @type TestNode
             * @property next
             */        
            this.next = null;
            
            /**
             * Test results for this test object.
             * @type object
             * @property results
             */                
            this.results /*:Object*/ = {
                passed : 0,
                failed : 0,
                total : 0,
                ignored : 0
            };
            
            //initialize results
            if (testObject instanceof Y.Test.Suite){
                this.results.type = "testsuite";
                this.results.name = testObject.name;
            } else if (testObject instanceof Y.Test.Case){
                this.results.type = "testcase";
                this.results.name = testObject.name;
            }
           
        }
        
        TestNode.prototype = {
        
            /**
             * Appends a new test object (TestSuite, TestCase, or test function name) as a child
             * of this node.
             * @param {Variant} testObject A TestSuite, TestCase, or the name of a test function.
             * @return {Void}
             */
            appendChild : function (testObject /*:Variant*/) /*:Void*/{
                var node = new TestNode(testObject);
                if (this.firstChild === null){
                    this.firstChild = this.lastChild = node;
                } else {
                    this.lastChild.next = node;
                    this.lastChild = node;
                }
                node.parent = this;
                return node;
            }       
        };
    
        /**
         * Runs test suites and test cases, providing events to allowing for the
         * interpretation of test results.
         * @namespace Test
         * @class Runner
         * @static
         */
        function TestRunner(){
        
            //inherit from EventProvider
            TestRunner.superclass.constructor.apply(this,arguments);
            
            /**
             * Suite on which to attach all TestSuites and TestCases to be run.
             * @type Y.Test.Suite
             * @property masterSuite
             * @static
             * @private
             */
            this.masterSuite /*:Y.Test.Suite*/ = new Y.Test.Suite("YUI Test Results");        
    
            /**
             * Pointer to the current node in the test tree.
             * @type TestNode
             * @private
             * @property _cur
             * @static
             */
            this._cur = null;
            
            /**
             * Pointer to the root node in the test tree.
             * @type TestNode
             * @private
             * @property _root
             * @static
             */
            this._root = null;
            
            /**
             * Indicates if the TestRunner will log events or not.
             * @type Boolean
             * @property _log
             * @private
             * @static
             */
            this._log = true;
            
            //create events
            var events = [
                this.TEST_CASE_BEGIN_EVENT,
                this.TEST_CASE_COMPLETE_EVENT,
                this.TEST_SUITE_BEGIN_EVENT,
                this.TEST_SUITE_COMPLETE_EVENT,
                this.TEST_PASS_EVENT,
                this.TEST_FAIL_EVENT,
                this.TEST_IGNORE_EVENT,
                this.COMPLETE_EVENT,
                this.BEGIN_EVENT
            ];
            for (var i=0; i < events.length; i++){
                this.subscribe(events[i], this._logEvent, this, true);
            }      
       
        }
        
        Y.extend(TestRunner, Y.Event.Target, {
        
            //-------------------------------------------------------------------------
            // Constants
            //-------------------------------------------------------------------------
             
            /**
             * Fires when a test case is opened but before the first 
             * test is executed.
             * @event testcasebegin
             * @static
             */         
            TEST_CASE_BEGIN_EVENT /*:String*/ : "testcasebegin",
            
            /**
             * Fires when all tests in a test case have been executed.
             * @event testcasecomplete
             * @static
             */        
            TEST_CASE_COMPLETE_EVENT /*:String*/ : "testcasecomplete",
            
            /**
             * Fires when a test suite is opened but before the first 
             * test is executed.
             * @event testsuitebegin
             * @static
             */        
            TEST_SUITE_BEGIN_EVENT /*:String*/ : "testsuitebegin",
            
            /**
             * Fires when all test cases in a test suite have been
             * completed.
             * @event testsuitecomplete
             * @static
             */        
            TEST_SUITE_COMPLETE_EVENT /*:String*/ : "testsuitecomplete",
            
            /**
             * Fires when a test has passed.
             * @event pass
             * @static
             */        
            TEST_PASS_EVENT /*:String*/ : "pass",
            
            /**
             * Fires when a test has failed.
             * @event fail
             * @static
             */        
            TEST_FAIL_EVENT /*:String*/ : "fail",
            
            /**
             * Fires when a test has been ignored.
             * @event ignore
             * @static
             */        
            TEST_IGNORE_EVENT /*:String*/ : "ignore",
            
            /**
             * Fires when all test suites and test cases have been completed.
             * @event complete
             * @static
             */        
            COMPLETE_EVENT /*:String*/ : "complete",
            
            /**
             * Fires when the run() method is called.
             * @event begin
             * @static
             */        
            BEGIN_EVENT /*:String*/ : "begin",    
            
            //-------------------------------------------------------------------------
            // Logging-Related Methods
            //-------------------------------------------------------------------------
    
            
            /**
             * Disable logging via Y.log(). Test output will not be visible unless
             * TestRunner events are subscribed to.
             * @return {Void}
             * @method disableLogging
             * @static
             */
            disableLogging: function(){
                this._log = false;
            },    
            
            /**
             * Enable logging via Y.log(). Test output is published and can be read via
             * logreader.
             * @return {Void}
             * @method enableLogging
             * @static
             */
            enableLogging: function(){
                this._log = true;
            },
            
            /**
             * Logs TestRunner events using Y.log().
             * @param {Object} event The event object for the event.
             * @return {Void}
             * @method _logEvent
             * @private
             * @static
             */
            _logEvent: function(event){
                
                //data variables
                var message /*:String*/ = "";
                var messageType /*:String*/ = "";
                
                switch(event.type){
                    case this.BEGIN_EVENT:
                        message = "Testing began at " + (new Date()).toString() + ".";
                        messageType = "info";
                        break;
                        
                    case this.COMPLETE_EVENT:
                        message = "Testing completed at " + (new Date()).toString() + ".\nPassed:" + 
                            event.results.passed + " Failed:" + event.results.failed + " Total:" + event.results.total;
                        messageType = "info";
                        break;
                        
                    case this.TEST_FAIL_EVENT:
                        message = event.testName + ": " + event.error.getMessage();
                        messageType = "fail";
                        break;
                        
                    case this.TEST_IGNORE_EVENT:
                        message = event.testName + ": ignored.";
                        messageType = "ignore";
                        break;
                        
                    case this.TEST_PASS_EVENT:
                        message = event.testName + ": passed.";
                        messageType = "pass";
                        break;
                        
                    case this.TEST_SUITE_BEGIN_EVENT:
                        message = "Test suite \"" + event.testSuite.name + "\" started.";
                        messageType = "info";
                        break;
                        
                    case this.TEST_SUITE_COMPLETE_EVENT:
                        message = "Test suite \"" + event.testSuite.name + "\" completed.\nPassed:" + 
                            event.results.passed + " Failed:" + event.results.failed + " Total:" + event.results.total;
                        messageType = "info";
                        break;
                        
                    case this.TEST_CASE_BEGIN_EVENT:
                        message = "Test case \"" + event.testCase.name + "\" started.";
                        messageType = "info";
                        break;
                        
                    case this.TEST_CASE_COMPLETE_EVENT:
                        message = "Test case \"" + event.testCase.name + "\" completed.\nPassed:" + 
                            event.results.passed + " Failed:" + event.results.failed + " Total:" + event.results.total;
                        messageType = "info";
                        break;
                    default:
                        message = "Unexpected event " + event.type;
                        message = "info";
                }
            
                //only log if required
                if (this._log){
                    Y.log(message, messageType, "TestRunner");
                }
            },

            //-------------------------------------------------------------------------
            // Test Tree-Related Methods
            //-------------------------------------------------------------------------
    
            /**
             * Adds a test case to the test tree as a child of the specified node.
             * @param {TestNode} parentNode The node to add the test case to as a child.
             * @param {Y.Test.Case} testCase The test case to add.
             * @return {Void}
             * @static
             * @private
             * @method _addTestCaseToTestTree
             */
           _addTestCaseToTestTree : function (parentNode /*:TestNode*/, testCase /*:Y.Test.Case*/) /*:Void*/{
                
                //add the test suite
                var node = parentNode.appendChild(testCase);
                
                //iterate over the items in the test case
                for (var prop in testCase){
                    if (prop.indexOf("test") === 0 && Y.Lang.isFunction(testCase[prop])){
                        node.appendChild(prop);
                    }
                }
             
            },
            
            /**
             * Adds a test suite to the test tree as a child of the specified node.
             * @param {TestNode} parentNode The node to add the test suite to as a child.
             * @param {Y.Test.Suite} testSuite The test suite to add.
             * @return {Void}
             * @static
             * @private
             * @method _addTestSuiteToTestTree
             */
            _addTestSuiteToTestTree : function (parentNode /*:TestNode*/, testSuite /*:Y.Test.Suite*/) /*:Void*/ {
                
                //add the test suite
                var node = parentNode.appendChild(testSuite);
                
                //iterate over the items in the master suite
                for (var i=0; i < testSuite.items.length; i++){
                    if (testSuite.items[i] instanceof Y.Test.Suite) {
                        this._addTestSuiteToTestTree(node, testSuite.items[i]);
                    } else if (testSuite.items[i] instanceof Y.Test.Case) {
                        this._addTestCaseToTestTree(node, testSuite.items[i]);
                    }                   
                }            
            },
            
            /**
             * Builds the test tree based on items in the master suite. The tree is a hierarchical
             * representation of the test suites, test cases, and test functions. The resulting tree
             * is stored in _root and the pointer _cur is set to the root initially.
             * @return {Void}
             * @static
             * @private
             * @method _buildTestTree
             */
            _buildTestTree : function () /*:Void*/ {
            
                this._root = new TestNode(this.masterSuite);
                this._cur = this._root;
                
                //iterate over the items in the master suite
                for (var i=0; i < this.masterSuite.items.length; i++){
                    if (this.masterSuite.items[i] instanceof Y.Test.Suite) {
                        this._addTestSuiteToTestTree(this._root, this.masterSuite.items[i]);
                    } else if (this.masterSuite.items[i] instanceof Y.Test.Case) {
                        this._addTestCaseToTestTree(this._root, this.masterSuite.items[i]);
                    }                   
                }            
            
            }, 
        
            //-------------------------------------------------------------------------
            // Private Methods
            //-------------------------------------------------------------------------
            
            /**
             * Handles the completion of a test object's tests. Tallies test results 
             * from one level up to the next.
             * @param {TestNode} node The TestNode representing the test object.
             * @return {Void}
             * @method _handleTestObjectComplete
             * @private
             */
            _handleTestObjectComplete : function (node /*:TestNode*/) /*:Void*/ {
                if (Y.Lang.isObject(node.testObject)){
                    node.parent.results.passed += node.results.passed;
                    node.parent.results.failed += node.results.failed;
                    node.parent.results.total += node.results.total;                
                    node.parent.results.ignored += node.results.ignored;                
                    node.parent.results[node.testObject.name] = node.results;
                
                    if (node.testObject instanceof Y.Test.Suite){
                        node.testObject.tearDown();
                        this.fire(this.TEST_SUITE_COMPLETE_EVENT, { testSuite: node.testObject, results: node.results});
                    } else if (node.testObject instanceof Y.Test.Case){
                        this.fire(this.TEST_CASE_COMPLETE_EVENT, { testCase: node.testObject, results: node.results});
                    }      
                } 
            },                
            
            //-------------------------------------------------------------------------
            // Navigation Methods
            //-------------------------------------------------------------------------
            
            /**
             * Retrieves the next node in the test tree.
             * @return {TestNode} The next node in the test tree or null if the end is reached.
             * @private
             * @static
             * @method _next
             */
            _next : function () /*:TestNode*/ {
            
                if (this._cur.firstChild) {
                    this._cur = this._cur.firstChild;
                } else if (this._cur.next) {
                    this._cur = this._cur.next;            
                } else {
                    while (this._cur && !this._cur.next && this._cur !== this._root){
                        this._handleTestObjectComplete(this._cur);
                        this._cur = this._cur.parent;
                    }
                    
                    if (this._cur == this._root){
                        this._cur.results.type = "report";
                        this._cur.results.timestamp = (new Date()).toLocaleString();
                        this._cur.results.duration = (new Date()) - this._cur.results.duration;                            
                        this.fire(this.COMPLETE_EVENT, { results: this._cur.results});
                        this._cur = null;
                    } else {
                        this._handleTestObjectComplete(this._cur);               
                        this._cur = this._cur.next;                
                    }
                }
            
                return this._cur;
            },
            
            /**
             * Runs a test case or test suite, returning the results.
             * @param {Y.Test.Case|Y.Test.Suite} testObject The test case or test suite to run.
             * @return {Object} Results of the execution with properties passed, failed, and total.
             * @private
             * @method _run
             * @static
             */
            _run : function () /*:Void*/ {
            
                //flag to indicate if the TestRunner should wait before continuing
                var shouldWait /*:Boolean*/ = false;
                
                //get the next test node
                var node = this._next();
                
                if (node !== null) {
                    var testObject = node.testObject;
                    
                    //figure out what to do
                    if (Y.Lang.isObject(testObject)){
                        if (testObject instanceof Y.Test.Suite){
                            this.fire(this.TEST_SUITE_BEGIN_EVENT, { testSuite: testObject });
                            testObject.setUp();
                        } else if (testObject instanceof Y.Test.Case){
                            this.fire(this.TEST_CASE_BEGIN_EVENT, { testCase: testObject });
                        }
                        
                        //some environments don't support setTimeout
                        if (typeof setTimeout != "undefined"){                    
                            setTimeout(function(){
                                Y.Test.Runner._run();
                            }, 0);
                        } else {
                            this._run();
                        }
                    } else {
                        this._runTest(node);
                    }
    
                }
            },
            
            _resumeTest : function (segment /*:Function*/) /*:Void*/ {
            
                //get relevant information
                var node /*:TestNode*/ = this._cur;
                
                //if there's no node, it probably means a wait() was called after resume()
                if (!node){
                    //TODO: Handle in some way?
                    //console.log("wait() called after resume()");
                    //this.fire("error", { testCase: "(unknown)", test: "(unknown)", error: new Error("wait() called after resume()")} );
                    return;
                }
                
                var testName /*:String*/ = node.testObject;
                var testCase /*:Y.Test.Case*/ = node.parent.testObject;
            
                //cancel other waits if available
                if (testCase.__yui_wait){
                    clearTimeout(testCase.__yui_wait);
                    delete testCase.__yui_wait;
                }

                //get the "should" test cases
                var shouldFail /*:Object*/ = (testCase._should.fail || {})[testName];
                var shouldError /*:Object*/ = (testCase._should.error || {})[testName];
                
                //variable to hold whether or not the test failed
                var failed /*:Boolean*/ = false;
                var error /*:Error*/ = null;
                    
                //try the test
                try {
                
                    //run the test
                    segment.apply(testCase);
                    
                    //if it should fail, and it got here, then it's a fail because it didn't
                    if (shouldFail){
                        error = new Y.Assert.ShouldFail();
                        failed = true;
                    } else if (shouldError){
                        error = new Y.Assert.ShouldError();
                        failed = true;
                    }
                               
                } catch (thrown /*:Error*/){

                    //cancel any pending waits, the test already failed
                    if (testCase.__yui_wait){
                        clearTimeout(testCase.__yui_wait);
                        delete testCase.__yui_wait;
                    }                    
                
                    //figure out what type of error it was
                    if (thrown instanceof Y.Assert.Error) {
                        if (!shouldFail){
                            error = thrown;
                            failed = true;
                        }
                    } else if (thrown instanceof Y.Test.Wait){
                    
                        if (Y.Lang.isFunction(thrown.segment)){
                            if (Y.Lang.isNumber(thrown.delay)){
                            
                                //some environments don't support setTimeout
                                if (typeof setTimeout != "undefined"){
                                    testCase.__yui_wait = setTimeout(function(){
                                        Y.Test.Runner._resumeTest(thrown.segment);
                                    }, thrown.delay);
                                } else {
                                    throw new Error("Asynchronous tests not supported in this environment.");
                                }
                            }
                        }
                        
                        return;
                    
                    } else {
                        //first check to see if it should error
                        if (!shouldError) {                        
                            error = new Y.Assert.UnexpectedError(thrown);
                            failed = true;
                        } else {
                            //check to see what type of data we have
                            if (Y.Lang.isString(shouldError)){
                                
                                //if it's a string, check the error message
                                if (thrown.message != shouldError){
                                    error = new Y.Assert.UnexpectedError(thrown);
                                    failed = true;                                    
                                }
                            } else if (Y.Lang.isFunction(shouldError)){
                            
                                //if it's a function, see if the error is an instance of it
                                if (!(thrown instanceof shouldError)){
                                    error = new Y.Assert.UnexpectedError(thrown);
                                    failed = true;
                                }
                            
                            } else if (Y.Lang.isObject(shouldError)){
                            
                                //if it's an object, check the instance and message
                                if (!(thrown instanceof shouldError.constructor) || 
                                        thrown.message != shouldError.message){
                                    error = new Y.Assert.UnexpectedError(thrown);
                                    failed = true;                                    
                                }
                            
                            }
                        
                        }
                    }
                    
                }
                
                //fire appropriate event
                if (failed) {
                    this.fire(this.TEST_FAIL_EVENT, { testCase: testCase, testName: testName, error: error });
                } else {
                    this.fire(this.TEST_PASS_EVENT, { testCase: testCase, testName: testName });
                }
                
                //run the tear down
                testCase.tearDown();
                
                //update results
                node.parent.results[testName] = { 
                    result: failed ? "fail" : "pass",
                    message: error ? error.getMessage() : "Test passed",
                    type: "test",
                    name: testName
                };
                
                if (failed){
                    node.parent.results.failed++;
                } else {
                    node.parent.results.passed++;
                }
                node.parent.results.total++;
    
                //set timeout not supported in all environments
                if (typeof setTimeout != "undefined"){
                    setTimeout(function(){
                        Y.Test.Runner._run();
                    }, 0);
                } else {
                    this._run();
                }
            
            },
                    
            /**
             * Runs a single test based on the data provided in the node.
             * @param {TestNode} node The TestNode representing the test to run.
             * @return {Void}
             * @static
             * @private
             * @name _runTest
             */
            _runTest : function (node /*:TestNode*/) /*:Void*/ {
            
                //get relevant information
                var testName /*:String*/ = node.testObject;
                var testCase /*:Y.Test.Case*/ = node.parent.testObject;
                var test /*:Function*/ = testCase[testName];
                
                //get the "should" test cases
                var shouldIgnore /*:Object*/ = (testCase._should.ignore || {})[testName];
                
                //figure out if the test should be ignored or not
                if (shouldIgnore){
                
                    //update results
                    node.parent.results[testName] = { 
                        result: "ignore",
                        message: "Test ignored",
                        type: "test",
                        name: testName
                    };
                    
                    node.parent.results.ignored++;
                    node.parent.results.total++;
                
                    this.fire(this.TEST_IGNORE_EVENT, { testCase: testCase, testName: testName });
                    
                    //some environments don't support setTimeout
                    if (typeof setTimeout != "undefined"){                    
                        setTimeout(function(){
                            Y.Test.Runner._run();
                        }, 0);              
                    } else {
                        this._run();
                    }
    
                } else {
                
                    //run the setup
                    testCase.setUp();
                    
                    //now call the body of the test
                    this._resumeTest(test);                
                }
    
            },        
            
            //-------------------------------------------------------------------------
            // Protected Methods
            //-------------------------------------------------------------------------   
        
            /*
             * Fires events for the TestRunner. This overrides the default fire()
             * method from EventProvider to add the type property to the data that is
             * passed through on each event call.
             * @param {String} type The type of event to fire.
             * @param {Object} data (Optional) Data for the event.
             * @method fire
             * @static
             * @protected
             */
            fire : function (type /*:String*/, data /*:Object*/) /*:Void*/ {
                data = data || {};
                data.type = type;
                TestRunner.superclass.fire.call(this, type, data);
            },
            
            //-------------------------------------------------------------------------
            // Public Methods
            //-------------------------------------------------------------------------   
        
            /**
             * Adds a test suite or test case to the list of test objects to run.
             * @param testObject Either a TestCase or a TestSuite that should be run.
             * @return {Void}
             * @method add
             * @static
             */
            add : function (testObject /*:Object*/) /*:Void*/ {
                this.masterSuite.add(testObject);
            },
            
            /**
             * Removes all test objects from the runner.
             * @return {Void}
             * @method clear
             * @static
             */
            clear : function () /*:Void*/ {
                this.masterSuite.items = [];
            },
            
            /**
             * Resumes the TestRunner after wait() was called.
             * @param {Function} segment The function to run as the rest
             *      of the haulted test.
             * @return {Void}
             * @method resume
             * @static
             */
            resume : function (segment /*:Function*/) /*:Void*/ {
                this._resumeTest(segment || function(){});
            },
        
            /**
             * Runs the test suite.
             * @return {Void}
             * @method run
             * @static
             */
            run : function (testObject /*:Object*/) /*:Void*/ {
                
                //pointer to runner to avoid scope issues 
                var runner = Y.Test.Runner;
    
                //build the test tree
                runner._buildTestTree();
                            
                //set when the test started
                runner._root.results.duration = (new Date()).valueOf();
                
                //fire the begin event
                runner.fire(runner.BEGIN_EVENT);
           
                //begin the testing
                runner._run();
            }    
        });
        
        return new TestRunner();
        
    })();

  
    /**
     * The Assert object provides functions to test JavaScript values against
     * known and expected results. Whenever a comparison (assertion) fails,
     * an error is thrown.
     *
     * @class Assert
     * @static
     */
    Y.Assert = {
    
        //-------------------------------------------------------------------------
        // Helper Methods
        //-------------------------------------------------------------------------
        
        /**
         * Formats a message so that it can contain the original assertion message
         * in addition to the custom message.
         * @param {String} customMessage The message passed in by the developer.
         * @param {String} defaultMessage The message created by the error by default.
         * @return {String} The final error message, containing either or both.
         * @protected
         * @static
         * @method _formatMessage
         */
        _formatMessage : function (customMessage /*:String*/, defaultMessage /*:String*/) /*:String*/ {
            var message = customMessage;
            if (Y.Lang.isString(customMessage) && customMessage.length > 0){
                return Y.Lang.substitute(customMessage, { message: defaultMessage });
            } else {
                return defaultMessage;
            }        
        },
        
        //-------------------------------------------------------------------------
        // Generic Assertion Methods
        //-------------------------------------------------------------------------
        
        /** 
         * Forces an assertion error to occur.
         * @param {String} message (Optional) The message to display with the failure.
         * @method fail
         * @static
         */
        fail : function (message /*:String*/) /*:Void*/ {
            throw new Y.Assert.Error(Y.Assert._formatMessage(message, "Test force-failed."));
        },       
        
        //-------------------------------------------------------------------------
        // Equality Assertion Methods
        //-------------------------------------------------------------------------    
        
        /**
         * Asserts that a value is equal to another. This uses the double equals sign
         * so type cohersion may occur.
         * @param {Object} expected The expected value.
         * @param {Object} actual The actual value to test.
         * @param {String} message (Optional) The message to display if the assertion fails.
         * @method areEqual
         * @static
         */
        areEqual : function (expected /*:Object*/, actual /*:Object*/, message /*:String*/) /*:Void*/ {
            if (expected != actual) {
                throw new Y.Assert.ComparisonFailure(Y.Assert._formatMessage(message, "Values should be equal."), expected, actual);
            }
        },
        
        /**
         * Asserts that a value is not equal to another. This uses the double equals sign
         * so type cohersion may occur.
         * @param {Object} unexpected The unexpected value.
         * @param {Object} actual The actual value to test.
         * @param {String} message (Optional) The message to display if the assertion fails.
         * @method areNotEqual
         * @static
         */
        areNotEqual : function (unexpected /*:Object*/, actual /*:Object*/, 
                             message /*:String*/) /*:Void*/ {
            if (unexpected == actual) {
                throw new Y.Assert.UnexpectedValue(Y.Assert._formatMessage(message, "Values should not be equal."), unexpected);
            }
        },
        
        /**
         * Asserts that a value is not the same as another. This uses the triple equals sign
         * so no type cohersion may occur.
         * @param {Object} unexpected The unexpected value.
         * @param {Object} actual The actual value to test.
         * @param {String} message (Optional) The message to display if the assertion fails.
         * @method areNotSame
         * @static
         */
        areNotSame : function (unexpected /*:Object*/, actual /*:Object*/, message /*:String*/) /*:Void*/ {
            if (unexpected === actual) {
                throw new Y.Assert.UnexpectedValue(Y.Assert._formatMessage(message, "Values should not be the same."), unexpected);
            }
        },
    
        /**
         * Asserts that a value is the same as another. This uses the triple equals sign
         * so no type cohersion may occur.
         * @param {Object} expected The expected value.
         * @param {Object} actual The actual value to test.
         * @param {String} message (Optional) The message to display if the assertion fails.
         * @method areSame
         * @static
         */
        areSame : function (expected /*:Object*/, actual /*:Object*/, message /*:String*/) /*:Void*/ {
            if (expected !== actual) {
                throw new Y.Assert.ComparisonFailure(Y.Assert._formatMessage(message, "Values should be the same."), expected, actual);
            }
        },    
        
        //-------------------------------------------------------------------------
        // Boolean Assertion Methods
        //-------------------------------------------------------------------------    
        
        /**
         * Asserts that a value is false. This uses the triple equals sign
         * so no type cohersion may occur.
         * @param {Object} actual The actual value to test.
         * @param {String} message (Optional) The message to display if the assertion fails.
         * @method isFalse
         * @static
         */
        isFalse : function (actual /*:Boolean*/, message /*:String*/) {
            if (false !== actual) {
                throw new Y.Assert.ComparisonFailure(Y.Assert._formatMessage(message, "Value should be false."), false, actual);
            }
        },
        
        /**
         * Asserts that a value is true. This uses the triple equals sign
         * so no type cohersion may occur.
         * @param {Object} actual The actual value to test.
         * @param {String} message (Optional) The message to display if the assertion fails.
         * @method isTrue
         * @static
         */
        isTrue : function (actual /*:Boolean*/, message /*:String*/) /*:Void*/ {
            if (true !== actual) {
                throw new Y.Assert.ComparisonFailure(Y.Assert._formatMessage(message, "Value should be true."), true, actual);
            }
    
        },
        
        //-------------------------------------------------------------------------
        // Special Value Assertion Methods
        //-------------------------------------------------------------------------    
        
        /**
         * Asserts that a value is not a number.
         * @param {Object} actual The value to test.
         * @param {String} message (Optional) The message to display if the assertion fails.
         * @method isNaN
         * @static
         */
        isNaN : function (actual /*:Object*/, message /*:String*/) /*:Void*/{
            if (!isNaN(actual)){
                throw new Y.Assert.ComparisonFailure(Y.Assert._formatMessage(message, "Value should be NaN."), NaN, actual);
            }    
        },
        
        /**
         * Asserts that a value is not the special NaN value.
         * @param {Object} actual The value to test.
         * @param {String} message (Optional) The message to display if the assertion fails.
         * @method isNotNaN
         * @static
         */
        isNotNaN : function (actual /*:Object*/, message /*:String*/) /*:Void*/{
            if (isNaN(actual)){
                throw new Y.Assert.UnexpectedValue(Y.Assert._formatMessage(message, "Values should not be NaN."), NaN);
            }    
        },
        
        /**
         * Asserts that a value is not null. This uses the triple equals sign
         * so no type cohersion may occur.
         * @param {Object} actual The actual value to test.
         * @param {String} message (Optional) The message to display if the assertion fails.
         * @method isNotNull
         * @static
         */
        isNotNull : function (actual /*:Object*/, message /*:String*/) /*:Void*/ {
            if (Y.Lang.isNull(actual)) {
                throw new Y.Assert.UnexpectedValue(Y.Assert._formatMessage(message, "Values should not be null."), null);
            }
        },
    
        /**
         * Asserts that a value is not undefined. This uses the triple equals sign
         * so no type cohersion may occur.
         * @param {Object} actual The actual value to test.
         * @param {String} message (Optional) The message to display if the assertion fails.
         * @method isNotUndefined
         * @static
         */
        isNotUndefined : function (actual /*:Object*/, message /*:String*/) /*:Void*/ {
            if (Y.Lang.isUndefined(actual)) {
                throw new Y.Assert.UnexpectedValue(Y.Assert._formatMessage(message, "Value should not be undefined."), undefined);
            }
        },
    
        /**
         * Asserts that a value is null. This uses the triple equals sign
         * so no type cohersion may occur.
         * @param {Object} actual The actual value to test.
         * @param {String} message (Optional) The message to display if the assertion fails.
         * @method isNull
         * @static
         */
        isNull : function (actual /*:Object*/, message /*:String*/) /*:Void*/ {
            if (!Y.Lang.isNull(actual)) {
                throw new Y.Assert.ComparisonFailure(Y.Assert._formatMessage(message, "Value should be null."), null, actual);
            }
        },
            
        /**
         * Asserts that a value is undefined. This uses the triple equals sign
         * so no type cohersion may occur.
         * @param {Object} actual The actual value to test.
         * @param {String} message (Optional) The message to display if the assertion fails.
         * @method isUndefined
         * @static
         */
        isUndefined : function (actual /*:Object*/, message /*:String*/) /*:Void*/ {
            if (!Y.Lang.isUndefined(actual)) {
                throw new Y.Assert.ComparisonFailure(Y.Assert._formatMessage(message, "Value should be undefined."), undefined, actual);
            }
        },    
        
        //--------------------------------------------------------------------------
        // Instance Assertion Methods
        //--------------------------------------------------------------------------    
       
        /**
         * Asserts that a value is an array.
         * @param {Object} actual The value to test.
         * @param {String} message (Optional) The message to display if the assertion fails.
         * @method isArray
         * @static
         */
        isArray : function (actual /*:Object*/, message /*:String*/) /*:Void*/ {
            if (!Y.Lang.isArray(actual)){
                throw new Y.Assert.UnexpectedValue(Y.Assert._formatMessage(message, "Value should be an array."), actual);
            }    
        },
       
        /**
         * Asserts that a value is a Boolean.
         * @param {Object} actual The value to test.
         * @param {String} message (Optional) The message to display if the assertion fails.
         * @method isBoolean
         * @static
         */
        isBoolean : function (actual /*:Object*/, message /*:String*/) /*:Void*/ {
            if (!Y.Lang.isBoolean(actual)){
                throw new Y.Assert.UnexpectedValue(Y.Assert._formatMessage(message, "Value should be a Boolean."), actual);
            }    
        },
       
        /**
         * Asserts that a value is a function.
         * @param {Object} actual The value to test.
         * @param {String} message (Optional) The message to display if the assertion fails.
         * @method isFunction
         * @static
         */
        isFunction : function (actual /*:Object*/, message /*:String*/) /*:Void*/ {
            if (!Y.Lang.isFunction(actual)){
                throw new Y.Assert.UnexpectedValue(Y.Assert._formatMessage(message, "Value should be a function."), actual);
            }    
        },
       
        /**
         * Asserts that a value is an instance of a particular object. This may return
         * incorrect results when comparing objects from one frame to constructors in
         * another frame. For best results, don't use in a cross-frame manner.
         * @param {Function} expected The function that the object should be an instance of.
         * @param {Object} actual The object to test.
         * @param {String} message (Optional) The message to display if the assertion fails.
         * @method isInstanceOf
         * @static
         */
        isInstanceOf : function (expected /*:Function*/, actual /*:Object*/, message /*:String*/) /*:Void*/ {
            if (!(actual instanceof expected)){
                throw new Y.Assert.ComparisonFailure(Y.Assert._formatMessage(message, "Value isn't an instance of expected type."), expected, actual);
            }
        },
        
        /**
         * Asserts that a value is a number.
         * @param {Object} actual The value to test.
         * @param {String} message (Optional) The message to display if the assertion fails.
         * @method isNumber
         * @static
         */
        isNumber : function (actual /*:Object*/, message /*:String*/) /*:Void*/ {
            if (!Y.Lang.isNumber(actual)){
                throw new Y.Assert.UnexpectedValue(Y.Assert._formatMessage(message, "Value should be a number."), actual);
            }    
        },    
        
        /**
         * Asserts that a value is an object.
         * @param {Object} actual The value to test.
         * @param {String} message (Optional) The message to display if the assertion fails.
         * @method isObject
         * @static
         */
        isObject : function (actual /*:Object*/, message /*:String*/) /*:Void*/ {
            if (!Y.Lang.isObject(actual)){
                throw new Y.Assert.UnexpectedValue(Y.Assert._formatMessage(message, "Value should be an object."), actual);
            }
        },
        
        /**
         * Asserts that a value is a string.
         * @param {Object} actual The value to test.
         * @param {String} message (Optional) The message to display if the assertion fails.
         * @method isString
         * @static
         */
        isString : function (actual /*:Object*/, message /*:String*/) /*:Void*/ {
            if (!Y.Lang.isString(actual)){
                throw new Y.Assert.UnexpectedValue(Y.Assert._formatMessage(message, "Value should be a string."), actual);
            }
        },
        
        /**
         * Asserts that a value is of a particular type. 
         * @param {String} expectedType The expected type of the variable.
         * @param {Object} actualValue The actual value to test.
         * @param {String} message (Optional) The message to display if the assertion fails.
         * @method isTypeOf
         * @static
         */
        isTypeOf : function (expectedType /*:String*/, actualValue /*:Object*/, message /*:String*/) /*:Void*/{
            if (typeof actualValue != expectedType){
                throw new Y.Assert.ComparisonFailure(Y.Assert._formatMessage(message, "Value should be of type " + expectedType + "."), expected, typeof actualValue);
            }
        }
    };
    
    //-----------------------------------------------------------------------------
    // Assertion errors
    //-----------------------------------------------------------------------------
    
    /**
     * Error is thrown whenever an assertion fails. It provides methods
     * to more easily get at error information and also provides a base class
     * from which more specific assertion errors can be derived.
     *
     * @param {String} message The message to display when the error occurs.
     * @namespace Assert
     * @class Error
     * @constructor
     */ 
    Y.Assert.Error = function (message /*:String*/){
    
        //call superclass
        arguments.callee.superclass.constructor.call(this, message);
        
        /*
         * Error message. Must be duplicated to ensure browser receives it.
         * @type String
         * @property message
         */
        this.message /*:String*/ = message;
        
        /**
         * The name of the error that occurred.
         * @type String
         * @property name
         */
        this.name /*:String*/ = "Assert Error";
    };
    
    //inherit methods
    Y.extend(Y.Assert.Error, Error, {
    
        /**
         * Returns a fully formatted error for an assertion failure. This should
         * be overridden by all subclasses to provide specific information.
         * @method getMessage
         * @return {String} A string describing the error.
         */
        getMessage : function () /*:String*/ {
            return this.message;
        },
        
        /**
         * Returns a string representation of the error.
         * @method toString
         * @return {String} A string representation of the error.
         */
        toString : function () /*:String*/ {
            return this.name + ": " + this.getMessage();
        },
        
        /**
         * Returns a primitive value version of the error. Same as toString().
         * @method valueOf
         * @return {String} A primitive value version of the error.
         */
        valueOf : function () /*:String*/ {
            return this.toString();
        }
    
    });
    
    /**
     * ComparisonFailure is subclass of Error that is thrown whenever
     * a comparison between two values fails. It provides mechanisms to retrieve
     * both the expected and actual value.
     *
     * @param {String} message The message to display when the error occurs.
     * @param {Object} expected The expected value.
     * @param {Object} actual The actual value that caused the assertion to fail.
     * @namespace Assert 
     * @extends Assert.Error
     * @class ComparisonFailure
     * @constructor
     */ 
    Y.Assert.ComparisonFailure = function (message /*:String*/, expected /*:Object*/, actual /*:Object*/){
    
        //call superclass
        arguments.callee.superclass.constructor.call(this, message);
        
        /**
         * The expected value.
         * @type Object
         * @property expected
         */
        this.expected /*:Object*/ = expected;
        
        /**
         * The actual value.
         * @type Object
         * @property actual
         */
        this.actual /*:Object*/ = actual;
        
        /**
         * The name of the error that occurred.
         * @type String
         * @property name
         */
        this.name /*:String*/ = "ComparisonFailure";
        
    };
    
    //inherit methods
    Y.extend(Y.Assert.ComparisonFailure, Y.Assert.Error, {
    
        /**
         * Returns a fully formatted error for an assertion failure. This message
         * provides information about the expected and actual values.
         * @method toString
         * @return {String} A string describing the error.
         */
        getMessage : function () /*:String*/ {
            return this.message + "\nExpected: " + this.expected + " (" + (typeof this.expected) + ")"  +
                "\nActual:" + this.actual + " (" + (typeof this.actual) + ")";
        }
    
    });
    
    /**
     * UnexpectedValue is subclass of Error that is thrown whenever
     * a value was unexpected in its scope. This typically means that a test
     * was performed to determine that a value was *not* equal to a certain
     * value.
     *
     * @param {String} message The message to display when the error occurs.
     * @param {Object} unexpected The unexpected value.
     * @namespace Assert
     * @extends Assert.Error
     * @class UnexpectedValue
     * @constructor
     */ 
    Y.Assert.UnexpectedValue = function (message /*:String*/, unexpected /*:Object*/){
    
        //call superclass
        arguments.callee.superclass.constructor.call(this, message);
        
        /**
         * The unexpected value.
         * @type Object
         * @property unexpected
         */
        this.unexpected /*:Object*/ = unexpected;
        
        /**
         * The name of the error that occurred.
         * @type String
         * @property name
         */
        this.name /*:String*/ = "UnexpectedValue";
        
    };
    
    //inherit methods
    Y.extend(Y.Assert.UnexpectedValue, Y.Assert.Error, {
    
        /**
         * Returns a fully formatted error for an assertion failure. The message
         * contains information about the unexpected value that was encountered.
         * @method getMessage
         * @return {String} A string describing the error.
         */
        getMessage : function () /*:String*/ {
            return this.message + "\nUnexpected: " + this.unexpected + " (" + (typeof this.unexpected) + ") ";
        }
    
    });
    
    /**
     * ShouldFail is subclass of Error that is thrown whenever
     * a test was expected to fail but did not.
     *
     * @param {String} message The message to display when the error occurs.
     * @namespace Assert
     * @extends Assert.Error
     * @class ShouldFail
     * @constructor
     */  
    Y.Assert.ShouldFail = function (message /*:String*/){
    
        //call superclass
        arguments.callee.superclass.constructor.call(this, message || "This test should fail but didn't.");
        
        /**
         * The name of the error that occurred.
         * @type String
         * @property name
         */
        this.name /*:String*/ = "ShouldFail";
        
    };
    
    //inherit methods
    Y.extend(Y.Assert.ShouldFail, Y.Assert.Error);
    
    /**
     * ShouldError is subclass of Error that is thrown whenever
     * a test is expected to throw an error but doesn't.
     *
     * @param {String} message The message to display when the error occurs.
     * @namespace Assert
     * @extends Assert.Error
     * @class ShouldError
     * @constructor
     */  
    Y.Assert.ShouldError = function (message /*:String*/){
    
        //call superclass
        arguments.callee.superclass.constructor.call(this, message || "This test should have thrown an error but didn't.");
        
        /**
         * The name of the error that occurred.
         * @type String
         * @property name
         */
        this.name /*:String*/ = "ShouldError";
        
    };
    
    //inherit methods
    Y.extend(Y.Assert.ShouldError, Y.Assert.Error);
    
    /**
     * UnexpectedError is subclass of Error that is thrown whenever
     * an error occurs within the course of a test and the test was not expected
     * to throw an error.
     *
     * @param {Error} cause The unexpected error that caused this error to be 
     *                      thrown.
     * @namespace Assert
     * @extends Assert.Error
     * @class UnexpectedError
     * @constructor
     */  
    Y.Assert.UnexpectedError = function (cause /*:Object*/){
    
        //call superclass
        arguments.callee.superclass.constructor.call(this, "Unexpected error: " + cause.message);
        
        /**
         * The unexpected error that occurred.
         * @type Error
         * @property cause
         */
        this.cause /*:Error*/ = cause;
        
        /**
         * The name of the error that occurred.
         * @type String
         * @property name
         */
        this.name /*:String*/ = "UnexpectedError";
        
        /**
         * Stack information for the error (if provided).
         * @type String
         * @property stack
         */
        this.stack /*:String*/ = cause.stack;
        
    };
    
    //inherit methods
    Y.extend(Y.Assert.UnexpectedError, Y.Assert.Error);
    

    
    /**
     * The ArrayAssert object provides functions to test JavaScript array objects
     * for a variety of cases.
     *
     * @class ArrayAssert
     * @static
     */
     
    Y.ArrayAssert = {
    
        /**
         * Asserts that a value is present in an array. This uses the triple equals 
         * sign so no type cohersion may occur.
         * @param {Object} needle The value that is expected in the array.
         * @param {Array} haystack An array of values.
         * @param {String} message (Optional) The message to display if the assertion fails.
         * @method contains
         * @static
         */
        contains : function (needle /*:Object*/, haystack /*:Array*/, 
                               message /*:String*/) /*:Void*/ {
            
            var found /*:Boolean*/ = false;
            
            //begin checking values
            for (var i=0; i < haystack.length && !found; i++){
                if (haystack[i] === needle) {
                    found = true;
                }
            }
            
            if (!found){
                Y.Assert.fail(Y.Assert._formatMessage(message, "Value " + needle + " (" + (typeof needle) + ") not found in array [" + haystack + "]."));
            }
        },
    
        /**
         * Asserts that a set of values are present in an array. This uses the triple equals 
         * sign so no type cohersion may occur. For this assertion to pass, all values must
         * be found.
         * @param {Object[]} needles An array of values that are expected in the array.
         * @param {Array} haystack An array of values to check.
         * @param {String} message (Optional) The message to display if the assertion fails.
         * @method containsItems
         * @static
         */
        containsItems : function (needles /*:Object[]*/, haystack /*:Array*/, 
                               message /*:String*/) /*:Void*/ {
    
            //begin checking values
            for (var i=0; i < needles.length; i++){
                this.contains(needles[i], haystack, message);
            }
        },
    
        /**
         * Asserts that a value matching some condition is present in an array. This uses
         * a function to determine a match.
         * @param {Function} matcher A function that returns true if the items matches or false if not.
         * @param {Array} haystack An array of values.
         * @param {String} message (Optional) The message to display if the assertion fails.
         * @method containsMatch
         * @static
         */
        containsMatch : function (matcher /*:Function*/, haystack /*:Array*/, 
                               message /*:String*/) /*:Void*/ {
            
            //check for valid matcher
            if (typeof matcher != "function"){
                throw new TypeError("ArrayAssert.containsMatch(): First argument must be a function.");
            }
            
            var found /*:Boolean*/ = false;
            
            //begin checking values
            for (var i=0; i < haystack.length && !found; i++){
                if (matcher(haystack[i])) {
                    found = true;
                }
            }
            
            if (!found){
                Y.Assert.fail(Y.Assert._formatMessage(message, "No match found in array [" + haystack + "]."));
            }
        },
    
        /**
         * Asserts that a value is not present in an array. This uses the triple equals 
         * Asserts that a value is not present in an array. This uses the triple equals 
         * sign so no type cohersion may occur.
         * @param {Object} needle The value that is expected in the array.
         * @param {Array} haystack An array of values.
         * @param {String} message (Optional) The message to display if the assertion fails.
         * @method doesNotContain
         * @static
         */
        doesNotContain : function (needle /*:Object*/, haystack /*:Array*/, 
                               message /*:String*/) /*:Void*/ {
            
            var found /*:Boolean*/ = false;
            
            //begin checking values
            for (var i=0; i < haystack.length && !found; i++){
                if (haystack[i] === needle) {
                    found = true;
                }
            }
            
            if (found){
                Y.Assert.fail(Y.Assert._formatMessage(message, "Value found in array [" + haystack + "]."));
            }
        },
    
        /**
         * Asserts that a set of values are not present in an array. This uses the triple equals 
         * sign so no type cohersion may occur. For this assertion to pass, all values must
         * not be found.
         * @param {Object[]} needles An array of values that are not expected in the array.
         * @param {Array} haystack An array of values to check.
         * @param {String} message (Optional) The message to display if the assertion fails.
         * @method doesNotContainItems
         * @static
         */
        doesNotContainItems : function (needles /*:Object[]*/, haystack /*:Array*/, 
                               message /*:String*/) /*:Void*/ {
    
            for (var i=0; i < needles.length; i++){
                this.doesNotContain(needles[i], haystack, message);
            }
    
        },
            
        /**
         * Asserts that no values matching a condition are present in an array. This uses
         * a function to determine a match.
         * @param {Function} matcher A function that returns true if the items matches or false if not.
         * @param {Array} haystack An array of values.
         * @param {String} message (Optional) The message to display if the assertion fails.
         * @method doesNotContainMatch
         * @static
         */
        doesNotContainMatch : function (matcher /*:Function*/, haystack /*:Array*/, 
                               message /*:String*/) /*:Void*/ {
            
            //check for valid matcher
            if (typeof matcher != "function"){
                throw new TypeError("ArrayAssert.doesNotContainMatch(): First argument must be a function.");
            }
    
            var found /*:Boolean*/ = false;
            
            //begin checking values
            for (var i=0; i < haystack.length && !found; i++){
                if (matcher(haystack[i])) {
                    found = true;
                }
            }
            
            if (found){
                Y.Assert.fail(Y.Assert._formatMessage(message, "Value found in array [" + haystack + "]."));
            }
        },
            
        /**
         * Asserts that the given value is contained in an array at the specified index.
         * This uses the triple equals sign so no type cohersion will occur.
         * @param {Object} needle The value to look for.
         * @param {Array} haystack The array to search in.
         * @param {int} index The index at which the value should exist.
         * @param {String} message (Optional) The message to display if the assertion fails.
         * @method indexOf
         * @static
         */
        indexOf : function (needle /*:Object*/, haystack /*:Array*/, index /*:int*/, message /*:String*/) /*:Void*/ {
        
            //try to find the value in the array
            for (var i=0; i < haystack.length; i++){
                if (haystack[i] === needle){
                    Y.Assert.areEqual(index, i, message || "Value exists at index " + i + " but should be at index " + index + ".");
                    return;
                }
            }
            
            //if it makes it here, it wasn't found at all
            Y.Assert.fail(Y.Assert._formatMessage(message, "Value doesn't exist in array [" + haystack + "]."));
        },
            
        /**
         * Asserts that the values in an array are equal, and in the same position,
         * as values in another array. This uses the double equals sign
         * so type cohersion may occur. Note that the array objects themselves
         * need not be the same for this test to pass.
         * @param {Array} expected An array of the expected values.
         * @param {Array} actual Any array of the actual values.
         * @param {String} message (Optional) The message to display if the assertion fails.
         * @method itemsAreEqual
         * @static
         */
        itemsAreEqual : function (expected /*:Array*/, actual /*:Array*/, 
                               message /*:String*/) /*:Void*/ {
            
            //one may be longer than the other, so get the maximum length
            var len /*:int*/ = Math.max(expected.length, actual.length);
           
            //begin checking values
            for (var i=0; i < len; i++){
                Y.Assert.areEqual(expected[i], actual[i], 
                    Y.Assert._formatMessage(message, "Values in position " + i + " are not equal."));
            }
        },
        
        /**
         * Asserts that the values in an array are equivalent, and in the same position,
         * as values in another array. This uses a function to determine if the values
         * are equivalent. Note that the array objects themselves
         * need not be the same for this test to pass.
         * @param {Array} expected An array of the expected values.
         * @param {Array} actual Any array of the actual values.
         * @param {Function} comparator A function that returns true if the values are equivalent
         *      or false if not.
         * @param {String} message (Optional) The message to display if the assertion fails.
         * @return {Void}
         * @method itemsAreEquivalent
         * @static
         */
        itemsAreEquivalent : function (expected /*:Array*/, actual /*:Array*/, 
                               comparator /*:Function*/, message /*:String*/) /*:Void*/ {
            
            //make sure the comparator is valid
            if (typeof comparator != "function"){
                throw new TypeError("ArrayAssert.itemsAreEquivalent(): Third argument must be a function.");
            }
            
            //one may be longer than the other, so get the maximum length
            var len /*:int*/ = Math.max(expected.length, actual.length);
            
            //begin checking values
            for (var i=0; i < len; i++){
                if (!comparator(expected[i], actual[i])){
                    throw new Y.Assert.ComparisonFailure(Y.Assert._formatMessage(message, "Values in position " + i + " are not equivalent."), expected[i], actual[i]);
                }
            }
        },
        
        /**
         * Asserts that an array is empty.
         * @param {Array} actual The array to test.
         * @param {String} message (Optional) The message to display if the assertion fails.
         * @method isEmpty
         * @static
         */
        isEmpty : function (actual /*:Array*/, message /*:String*/) /*:Void*/ {        
            if (actual.length > 0){
                Y.Assert.fail(Y.Assert._formatMessage(message, "Array should be empty."));
            }
        },    
        
        /**
         * Asserts that an array is not empty.
         * @param {Array} actual The array to test.
         * @param {String} message (Optional) The message to display if the assertion fails.
         * @method isNotEmpty
         * @static
         */
        isNotEmpty : function (actual /*:Array*/, message /*:String*/) /*:Void*/ {        
            if (actual.length === 0){
                Y.Assert.fail(Y.Assert._formatMessage(message, "Array should not be empty."));
            }
        },    
        
        /**
         * Asserts that the values in an array are the same, and in the same position,
         * as values in another array. This uses the triple equals sign
         * so no type cohersion will occur. Note that the array objects themselves
         * need not be the same for this test to pass.
         * @param {Array} expected An array of the expected values.
         * @param {Array} actual Any array of the actual values.
         * @param {String} message (Optional) The message to display if the assertion fails.
         * @method itemsAreSame
         * @static
         */
        itemsAreSame : function (expected /*:Array*/, actual /*:Array*/, 
                              message /*:String*/) /*:Void*/ {
            
            //one may be longer than the other, so get the maximum length
            var len /*:int*/ = Math.max(expected.length, actual.length);
            
            //begin checking values
            for (var i=0; i < len; i++){
                Y.Assert.areSame(expected[i], actual[i], 
                    Y.Assert._formatMessage(message, "Values in position " + i + " are not the same."));
            }
        },
        
        /**
         * Asserts that the given value is contained in an array at the specified index,
         * starting from the back of the array.
         * This uses the triple equals sign so no type cohersion will occur.
         * @param {Object} needle The value to look for.
         * @param {Array} haystack The array to search in.
         * @param {int} index The index at which the value should exist.
         * @param {String} message (Optional) The message to display if the assertion fails.
         * @method lastIndexOf
         * @static
         */
        lastIndexOf : function (needle /*:Object*/, haystack /*:Array*/, index /*:int*/, message /*:String*/) /*:Void*/ {
        
            //try to find the value in the array
            for (var i=haystack.length; i >= 0; i--){
                if (haystack[i] === needle){
                    Y.Assert.areEqual(index, i, Y.Assert._formatMessage(message, "Value exists at index " + i + " but should be at index " + index + "."));
                    return;
                }
            }
            
            //if it makes it here, it wasn't found at all
            Y.Assert.fail(Y.Assert._formatMessage(message, "Value doesn't exist in array."));        
        }
        
    };


    /**
     * The ObjectAssert object provides functions to test JavaScript objects
     * for a variety of cases.
     *
     * @class ObjectAssert
     * @static
     */
    Y.ObjectAssert = {
    
        areEqual: function(expected /*:Object*/, actual /*:Object*/, message /*:String*/) /*:Void*/ {
            Y.Object.each(expected, function(value, name){
                Y.Assert.areEqual(expected[name], actual[name], Y.Assert._formatMessage(message, "Values should be equal for property " + name));
            });            
        },
        
        /**
         * Asserts that an object has a property with the given name.
         * @param {String} propertyName The name of the property to test.
         * @param {Object} object The object to search.
         * @param {String} message (Optional) The message to display if the assertion fails.
         * @method has
         * @static
         */    
        has : function (propertyName /*:String*/, object /*:Object*/, message /*:String*/) /*:Void*/ {
            if (!(propertyName in object)){
                Y.Assert.fail(Y.Assert._formatMessage(message, "Property '" + propertyName + "' not found on object."));
            }    
        },
        
        /**
         * Asserts that an object has all properties of a reference object.
         * @param {Object} refObject The object whose properties should be on the object to test.
         * @param {Object} object The object to search.
         * @param {String} message (Optional) The message to display if the assertion fails.
         * @method hasAll
         * @static
         */    
        hasAll : function (refObject /*:Object*/, object /*:Object*/, message /*:String*/) /*:Void*/ {
            Y.Object.each(refObject, function(value, name){
                if (!(name in object)){
                    Y.Assert.fail(Y.Assert._formatMessage(message, "Property '" + name + "' not found on object."));
                }    
            });
        },
        
        /**
         * Asserts that a property with the given name exists on an object instance (not on its prototype).
         * @param {String} propertyName The name of the property to test.
         * @param {Object} object The object to search.
         * @param {String} message (Optional) The message to display if the assertion fails.
         * @method owns
         * @static
         */    
        owns : function (propertyName /*:String*/, object /*:Object*/, message /*:String*/) /*:Void*/ {
            if (!object.hasOwnProperty(propertyName)){
                Y.Assert.fail(Y.Assert._formatMessage(message, "Property '" + propertyName + "' not found on object instance."));
            }     
        },
        
        /**
         * Asserts that all properties on a given object also exist on an object instance (not on its prototype).
         * @param {Object} refObject The object whose properties should be owned by the object to test.
         * @param {Object} object The object to search.
         * @param {String} message (Optional) The message to display if the assertion fails.
         * @method ownsAll
         * @static
         */    
        ownsAll : function (refObject /*:Object*/, object /*:Object*/, message /*:String*/) /*:Void*/ {
            Y.Object.each(refObject, function(value, name){
                if (!object.hasOwnProperty(name)){
                    Y.Assert.fail(Y.Assert._formatMessage(message, "Property '" + name + "' not found on object instance."));
                }     
            });
        }
    };


    
    /**
     * The DateAssert object provides functions to test JavaScript Date objects
     * for a variety of cases.
     *
     * @class DateAssert
     * @static
     */
     
    Y.DateAssert = {
    
        /**
         * Asserts that a date's month, day, and year are equal to another date's.
         * @param {Date} expected The expected date.
         * @param {Date} actual The actual date to test.
         * @param {String} message (Optional) The message to display if the assertion fails.
         * @method datesAreEqual
         * @static
         */
        datesAreEqual : function (expected /*:Date*/, actual /*:Date*/, message /*:String*/){
            if (expected instanceof Date && actual instanceof Date){
                Y.AssertareEqual(expected.getFullYear(), actual.getFullYear(), Y.Assert_formatMessage(message, "Years should be equal."));
                Y.AssertareEqual(expected.getMonth(), actual.getMonth(), Y.Assert_formatMessage(message, "Months should be equal."));
                Y.AssertareEqual(expected.getDate(), actual.getDate(), Y.Assert_formatMessage(message, "Day of month should be equal."));
            } else {
                throw new TypeError("DateY.AssertdatesAreEqual(): Expected and actual values must be Date objects.");
            }
        },
    
        /**
         * Asserts that a date's hour, minutes, and seconds are equal to another date's.
         * @param {Date} expected The expected date.
         * @param {Date} actual The actual date to test.
         * @param {String} message (Optional) The message to display if the assertion fails.
         * @method timesAreEqual
         * @static
         */
        timesAreEqual : function (expected /*:Date*/, actual /*:Date*/, message /*:String*/){
            if (expected instanceof Date && actual instanceof Date){
                Y.AssertareEqual(expected.getHours(), actual.getHours(), Y.Assert_formatMessage(message, "Hours should be equal."));
                Y.AssertareEqual(expected.getMinutes(), actual.getMinutes(), Y.Assert_formatMessage(message, "Minutes should be equal."));
                Y.AssertareEqual(expected.getSeconds(), actual.getSeconds(), Y.Assert_formatMessage(message, "Seconds should be equal."));
            } else {
                throw new TypeError("DateY.AsserttimesAreEqual(): Expected and actual values must be Date objects.");
            }
        }
        
    };

    
    Y.namespace("Test.Format");
    
    /**
     * Returns test results formatted as a JSON string. Requires JSON utility.
     * @param {Object} result The results object created by TestRunner.
     * @return {String} A JSON-formatted string of results.
     * @namespace Test.Format
     * @method JSON
     * @static
     */
    Y.Test.Format.JSON = function(results /*:Object*/) /*:String*/ {
        return Y.JSON.stringify(results);
    };
    
    /**
     * Returns test results formatted as an XML string.
     * @param {Object} result The results object created by TestRunner.
     * @return {String} An XML-formatted string of results.
     * @namespace Test.Format
     * @method XML
     * @static
     */
    Y.Test.Format.XML = function(results /*:Object*/) /*:String*/ {
    
        var l = Y.Lang;
        var xml /*:String*/ = "<" + results.type + " name=\"" + results.name.replace(/"/g, "&quot;").replace(/'/g, "&apos;") + "\"";
        
        if (results.type == "test"){
            xml += " result=\"" + results.result + "\" message=\"" + results.message + "\">";
        } else {
            xml += " passed=\"" + results.passed + "\" failed=\"" + results.failed + "\" ignored=\"" + results.ignored + "\" total=\"" + results.total + "\">";
            Y.Object.each(results, function(value, prop){
                if (l.isObject(value) && !l.isArray(value)){
                    xml += arguments.callee(value);
                }
            });        
        }
    
        xml += "</" + results.type + ">";
        
        return xml;
    
    };


    Y.namespace("Test");
    
    /**
     * An object capable of sending test results to a server.
     * @param {String} url The URL to submit the results to.
     * @param {Function} format (Optiona) A function that outputs the results in a specific format.
     *      Default is Y.Test.Format.XML.
     * @constructor
     * @namespace Test
     * @class Reporter
     */
    Y.Test.Reporter = function(url /*:String*/, format /*:Function*/) {
    
        /**
         * The URL to submit the data to.
         * @type String
         * @property url
         */
        this.url /*:String*/ = url;
    
        /**
         * The formatting function to call when submitting the data.
         * @type Function
         * @property format
         */
        this.format /*:Function*/ = format || Y.Test.Format.XML;
    
        /**
         * Extra fields to submit with the request.
         * @type Object
         * @property _fields
         * @private
         */
        this._fields /*:Object*/ = new Object();
        
        /**
         * The form element used to submit the results.
         * @type HTMLFormElement
         * @property _form
         * @private
         */
        this._form /*:HTMLElement*/ = null;
    
        /**
         * Iframe used as a target for form submission.
         * @type HTMLIFrameElement
         * @property _iframe
         * @private
         */
        this._iframe /*:HTMLElement*/ = null;
    };
    
    Y.Test.Reporter.prototype = {
    
        //restore missing constructor
        constructor: Y.Test.Reporter,
    
        /**
         * Adds a field to the form that submits the results.
         * @param {String} name The name of the field.
         * @param {Variant} value The value of the field.
         * @return {Void}
         * @method addField
         */
        addField : function (name /*:String*/, value /*:Variant*/) /*:Void*/{
            this._fields[name] = value;    
        },
        
        /**
         * Removes all previous defined fields.
         * @return {Void}
         * @method addField
         */
        clearFields : function() /*:Void*/{
            this._fields = new Object();
        },
    
        /**
         * Cleans up the memory associated with the TestReporter, removing DOM elements
         * that were created.
         * @return {Void}
         * @method destroy
         */
        destroy : function() /*:Void*/ {
            if (this._form){
                this._form.parentNode.removeChild(this._form);
                this._form = null;
            }        
            if (this._iframe){
                this._iframe.parentNode.removeChild(this._iframe);
                this._iframe = null;
            }
            this._fields = null;
        },
    
        /**
         * Sends the report to the server.
         * @param {Object} results The results object created by TestRunner.
         * @return {Void}
         * @method report
         */
        report : function(results /*:Object*/) /*:Void*/{
        
            //if the form hasn't been created yet, create it
            if (!this._form){
                this._form = document.createElement("form");
                this._form.method = "post";
                this._form.style.visibility = "hidden";
                this._form.style.position = "absolute";
                this._form.style.top = 0;
                document.body.appendChild(this._form);
            
                //IE won't let you assign a name using the DOM, must do it the hacky way
                if (Y.UA.ie){
                    this._iframe = document.createElement("<iframe name=\"yuiTestTarget\" />");
                } else {
                    this._iframe = document.createElement("iframe");
                    this._iframe.name = "yuiTestTarget";
                }
    
                this._iframe.src = "javascript:false";
                this._iframe.style.visibility = "hidden";
                this._iframe.style.position = "absolute";
                this._iframe.style.top = 0;
                document.body.appendChild(this._iframe);
    
                this._form.target = "yuiTestTarget";
            }
    
            //set the form's action
            this._form.action = this.url;
        
            //remove any existing fields
            while(this._form.hasChildNodes()){
                this._form.removeChild(this._form.lastChild);
            }
            
            //create default fields
            this._fields.results = this.format(results);
            this._fields.useragent = navigator.userAgent;
            this._fields.timestamp = (new Date()).toLocaleString();
    
            //add fields to the form
            Y.Object.each(this._fields, function(value, prop){
                if (typeof value != "function"){
                    var input = document.createElement("input");
                    input.type = "hidden";
                    input.name = prop;
                    input.value = value;
                    this._form.appendChild(input);
                }
            });
    
            //remove default fields
            delete this._fields.results;
            delete this._fields.useragent;
            delete this._fields.timestamp;
            
            if (arguments[1] !== false){
                this._form.submit();
            }
        
        }
    
    };

    /**
     * Creates a new mock object.
     * @class Mock
     * @constructor
     * @param {Object} template (Optional) An object whose methods
     *      should be stubbed out on the mock object.
     */
    Y.Mock = function(template){
    
        //use blank object is nothing is passed in
        template = template || {};
        
        var mock = null;
        
        //try to create mock that keeps prototype chain intact
        try {
            mock = Y.Object(template);
        } catch (ex) {
            mock = {};
            Y.log("Couldn't create mock with prototype.", "warn", "Mock");
        }
        
        //create new versions of the methods so that they don't actually do anything
        Y.Object.each(template, function(name){
            if (Y.Lang.isFunction(template[name])){
                mock[name] = function(){
                    Y.Assert.fail("Method " + name + "() was called but was not expected to be.");
                };
            }
        });
        
        //return it
        return mock;    
    };
        
    /**
     * Assigns an expectation to a mock object. This is used to create
     * methods and properties on the mock object that are monitored for
     * calls and changes, respectively.
     * @param {Object} mock The object to add the expectation to.
     * @param {Object} expectation An object defining the expectation. For
     *      a method, the keys "method" and "args" are required with
     *      an optional "returns" key available. For properties, the keys
     *      "property" and "value" are required.
     * @return {void}
     * @method expect
     * @static
     */ 
    Y.Mock.expect = function(mock /*:Object*/, expectation /*:Object*/){

        //make sure there's a place to store the expectations
        if (!mock.__expectations) {
            mock.__expectations = {};
        }

        //method expectation
        if (expectation.method){
            var name = expectation.method,
                args = expectation.args || expectation.arguments || [],
                result = expectation.returns,
                callCount = Y.Lang.isNumber(expectation.callCount) ? expectation.callCount : 1,
                error = expectation.error,
                run = expectation.run || function(){};
                
            //save expectations
            mock.__expectations[name] = expectation;
            expectation.callCount = callCount;
            expectation.actualCallCount = 0;
                
            //process arguments
            Y.Array.each(args, function(arg, i, array){
                if (!(array[i] instanceof Y.Mock.Value)){
                    array[i] = Y.Mock.Value(Y.Assert.areSame, [arg], "Argument " + i + " of " + name + "() is incorrect.");
                }
            });
        
            //if the method is expected to be called
            if (callCount > 0){
                mock[name] = function(){   
                    expectation.actualCallCount++;
                    Y.Assert.areEqual(args.length, arguments.length, "Method " + name + "() passed incorrect number of arguments.");
                    for (var i=0, len=args.length; i < len; i++){
                        if (args[i]){
                            args[i].verify(arguments[i]);
                        } else {
                            Y.Assert.fail("Argument " + i + " (" + arguments[i] + ") was not expected to be used.");
                        }
                        
                    }                

                    run.apply(this, arguments);
                    
                    if (error){
                        throw error;
                    }
                    
                    return result;
                };
            } else {
            
                //method should fail if called when not expected
                mock[name] = function(){
                    Y.Assert.fail("Method " + name + "() should not have been called.");
                };
            }
        } else if (expectation.property){
            //save expectations
            mock.__expectations[name] = expectation;
        }
    };

    /**
     * Verifies that all expectations of a mock object have been met and
     * throws an assertion error if not.
     * @param {Object} mock The object to verify..
     * @return {void}
     * @method verify
     * @static
     */ 
    Y.Mock.verify = function(mock /*:Object*/){    
        Y.Object.each(mock.__expectations, function(expectation){
            if (expectation.method) {
                Y.Assert.areEqual(expectation.callCount, expectation.actualCallCount, "Method " + expectation.method + "() wasn't called the expected number of times.");
            } else if (expectation.property){
                Y.Assert.areEqual(expectation.value, mock[expectation.property], "Property " + expectation.property + " wasn't set to the correct value."); 
            }
        });    
    };

    Y.Mock.Value = function(method, args, message){
        if (this instanceof Y.Mock.Value){
            this.verify = function(value){
                args = [].concat(args || []);
                args.push(value);
                args.push(message);
                method.apply(null, args);
            };
        } else {
            return new Y.Mock.Value(method, args, message);
        }
    };
    
    Y.Mock.Value.Any = Y.Mock.Value(function(){});
    Y.Mock.Value.Boolean = Y.Mock.Value(Y.Assert.isBoolean);
    Y.Mock.Value.Number = Y.Mock.Value(Y.Assert.isNumber);
    Y.Mock.Value.String = Y.Mock.Value(Y.Assert.isString);
    Y.Mock.Value.Object = Y.Mock.Value(Y.Assert.isObject);
    Y.Mock.Value.Function = Y.Mock.Value(Y.Assert.isFunction);



}, '@VERSION@' ,{requires:['substitute','event-custom','array','oop','event-target','event-simulate']});
