YUI.add("dd-delegate",function(e){var d=function(f){d.superclass.constructor.apply(this,arguments);},c="container",b="nodes",a=e.Node.create("<div>Temp Node</div>");e.extend(d,e.Base,{_bubbleTargets:e.DD.DDM,dd:null,_shimState:null,_handles:null,_onNodeChange:function(f){this.set("dragNode",f.newVal);},_afterDragEnd:function(f){e.DD.DDM._noShim=this._shimState;this.set("lastNode",this.dd.get("node"));this.get("lastNode").removeClass(e.DD.DDM.CSS_PREFIX+"-dragging");this.dd._unprep();this.dd.set("node",a);},_delMouseDown:function(h){var g=h.currentTarget,f=this.dd;if(g.test(this.get(b))&&!g.test(this.get("invalid"))){this._shimState=e.DD.DDM._noShim;e.DD.DDM._noShim=true;this.set("currentNode",g);f.set("node",g);if(f.proxy){f.set("dragNode",e.DD.DDM._proxy);}else{f.set("dragNode",g);}f._prep();f.fire("drag:mouseDown",{ev:h});}},_onMouseEnter:function(f){this._shimState=e.DD.DDM._noShim;e.DD.DDM._noShim=true;},_onMouseLeave:function(f){e.DD.DDM._noShim=this._shimState;},initializer:function(g){this._handles=[];var h=this.get("dragConfig")||{},f=this.get(c);h.node=a.cloneNode(true);h.bubbleTargets=this;if(this.get("handles")){h.handles=this.get("handles");}this.dd=new e.DD.Drag(h);this.dd.after("drag:end",e.bind(this._afterDragEnd,this));this.dd.on("dragNodeChange",e.bind(this._onNodeChange,this));this.dd.after("drag:mouseup",function(){this._unprep();});this._handles.push(e.delegate(e.DD.Drag.START_EVENT,e.bind(this._delMouseDown,this),f,this.get(b)));this._handles.push(e.on("mouseenter",e.bind(this._onMouseEnter,this),f));this._handles.push(e.on("mouseleave",e.bind(this._onMouseLeave,this),f));e.later(50,this,this.syncTargets);e.DD.DDM.regDelegate(this);},syncTargets:function(){if(!e.Plugin.Drop||this.get("destroyed")){return;}var g,f,h;if(this.get("target")){g=e.one(this.get(c)).all(this.get(b));f=this.dd.get("groups");h=this.get("dragConfig");if(h&&"groups" in h){f=h.groups;}g.each(function(j){this.createDrop(j,f);},this);}return this;},createDrop:function(h,f){var g={useShim:false,bubbleTargets:this};if(!h.drop){h.plug(e.Plugin.Drop,g);}h.drop.set("groups",f);return h;},destructor:function(){if(this.dd){this.dd.destroy();}if(e.Plugin.Drop){var f=e.one(this.get(c)).all(this.get(b));f.unplug(e.Plugin.Drop);}e.each(this._handles,function(g){g.detach();});}},{NAME:"delegate",ATTRS:{container:{value:"body"},nodes:{value:".dd-draggable"},invalid:{value:"input, select, button, a, textarea"},lastNode:{value:a},currentNode:{value:a},dragNode:{value:a},over:{value:false},target:{value:false},dragConfig:{value:null},handles:{value:null}}});e.mix(e.DD.DDM,{_delegates:[],regDelegate:function(f){this._delegates.push(f);},getDelegate:function(g){var f=null;g=e.one(g);e.each(this._delegates,function(h){if(g.test(h.get(c))){f=h;}},this);return f;}});e.namespace("DD");e.DD.Delegate=d;},"@VERSION@",{requires:["dd-drag","event-mouseenter","dd-drop-plugin"],skinnable:false});