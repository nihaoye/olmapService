
/**
 * 地址纠错服务
 * @author zhangyuhao
 * @param opt{Object.<string, *>}
 * opt.url {string} 地址纠错的后台地址，会把修改完的数据发到这个地址上<br/>
 * opt.ajaxFields {Array<string>|function|undefined} 传给后台的字段名数组 例如:["id","name","x","y"],如果是一个函数,则自己在函数里面处理这个传递的参数,定义自己默认不传会把点的所有业务数据字段传给后台<br/>
 * opt.map {ol.Map} openlayer的地图对象，注意不是fmap<br/>
 * opt.style {ol.style.Style|undefined} openlayer的样式参考openlayer的api文档,这个样式会应用到开启地图服务操作的feature上<br/>
 * opt.proj {string|undefined} 地图所应用的坐标系，默认是EPSG:4326,此参数会把对应的地图上的坐标转换为EPSG:4326显示出来并把数据提交到后台<br/>
 *
 * opt.datas {Array|undefined} 参数配置,用于在地址纠错操作时气泡显示的字段,(此参数传入后不能更改)默认值为：<br/>
 * <code>
 * [
 *  {
 *    displayName:"经度",//显示的名称
 *    name:"x",//对应的业务字段
 *    type:'x' //类型 x|y|edit
 *  },
 *  {
 *    displayName:"纬度",
 *    name:"y",
 *    type:'y'
 *  }
 *]
 * </code><br/>
 *opt.event.[ok|cancel|open]  {function} 事件回调<br/>
 *
 *
 *
 *
 * @constructor
 */
function AddrCrtService(opt){
    opt=opt||{};
    var _self=this;
    /**
     * @type {string} 后台纠错地址
     *
     */
    this.url=opt.url;
    /**
     * @type {Array<string>|function} 传给后台的字段名数组,函数是一个处理传给后台参数的回调函数,例如:["id","name","x","y"],默认不传会把点的所有业务数据字段传给后台
     */
    this.ajaxFeilds=opt.ajaxFeilds;
    /**
     * @type {Array} 用于显示定位的气泡的内容，配置后不可更改<br/>
     * <code>
     *     {
     *       displayName:"经度",
     *       name:"x",
     *       type:'x'
     *   },
     *{
     *    displayName:"纬度",
     *    name:"y",
     *    type:'y'
     *}
     * </code>
     *
     */
    opt.datas=opt.datas||[
        {
            displayName:"经度",
            name:"x",
            type:'x'
        },
        {
            displayName:"纬度",
            name:"y",
            type:'y'
        }
    ];
    /**
     *
     * @type {RelocateService}
     * 基础操作实例,自己断点进去看有什么
     */
    this.relocate=new RelocateService(opt);
    AddrCrtService.prototype.changeFeatureClient=function(feature,data){
        var client=feature.get("clients");
        _self.relocate.extend(client,data);
    };
    /**
     * @type {{okBefore: AddrCrtService.event.okBefore, ok: AddrCrtService.event.ok, postSuccess: AddrCrtService.event.postSuccess, postFail: AddrCrtService.event.postFail, cancel: AddrCrtService.event.cancel, open: AddrCrtService.event.open}}
     * event.[okBefore,ok,postSuccess,postFail,cancel,open] {function} 事件回调方法,顾名思义,不写了
     */
    this.event={
        okBefore:function(data){

        },
        ok:function(data,feature){

        },
        postSuccess:function(data){

        },
        postFail:function(e){

        },
        cancel:function(){

        },
        open:function(feature){

        }
    };
    /**
     * 开启地址纠错的操作
     *
     * @param feature{ol.Feature|string|number|param} 此参数分三种情况讨论<br/>
     * 1.直接传openlayer的feature实体,这样则不需要传第二个参数<br/>
     * 2.传入feature的id,本方法会帮你找到对应的feature(上图的时候feature需要有id)<br/>
     * 3.传入你的业务上的属性操作，(项目需要在框架的基础上，且调用了框架的上图方式),本方法会调用feature.get("clients")去匹配对应数据的feature,例如:传{devid:12345}<br/>
     * @param layer{ol.layer.Vector|string|undefined} 图层或者图层名称,如果feature传的是ol.Feature,这个参数可不传<br/>
     */
    AddrCrtService.prototype.open=function(feature,layer){
        _self.relocate.open(feature,layer);
    };
    /**
     * 取消地址纠错操作
     */
    AddrCrtService.prototype.cancel=function(){
        _self.relocate.cancel()
    };
    _self.relocate.event.cancel=function(data,feature){
        _self.event.cancel(data,feature)
    };
    /**
     * 开启地址纠错的回调方法
     * @param data
     * @param feature
     */
    _self.relocate.event.open=function(data,feature){
        _self.event.open(data,feature)
    };
    /**
     * 点击确认纠错后的回调方法
     * @param data
     * @param feature
     */
    _self.relocate.event.ok=function(data,feature){
        if(_self.event.okBefore(data)===false){
            return;
        }
        feature.getGeometry().setCoordinates(_self.relocate.getCoordinate());
        _self.changeFeatureClient(_self.relocate.sourceFeature,data);
        var params=_self.relocate.sourceFeature.get("clients");
        if(_self.ajaxFeilds instanceof Array){
            var params2={};
            for(var i=0;i<_self.ajaxFeilds.length;i++){
                params2[_self.ajaxFeilds[i]]=params[_self.ajaxFeilds[i]]
            }
            params=params2;
        }else if(typeof _self.ajaxFeilds ==='function'){
            params=_self.ajaxFeilds(params);
        }
        $.ajax({
            url: _self.url,
            data: JSON.stringify(params),
            type: "post",
            dataType: "json",
            contentType: "application/json",
            success: function (data) {
                _self.event.postSuccess && _self.event.postSuccess(data)
            },
            error: function (e) {
                _self.event.postFail && _self.event.postFail(e);
            }
        });
        _self.event.ok&&_self.event.ok(data,feature);
    }
}



/**
 * @private
 * 这个是底层的基础服务方法
 * @author zhangyuhao
 * @param opt
 * @constructor
 */
function RelocateService(opt){
    var _self=this;
    this.map=opt.map;
    this.style=opt.style||new ol.style.Style({
        image: new ol.style.Circle({
            fill: new ol.style.Fill({
                color: 'red'
            }),
            radius:8
        })
    });
    this.layer=opt.layer;
    this.proj=opt.proj||"EPSG:4326";
    this.sourceFeature=null;
    this.locateFeature=null;
    this.interaction={
        select:null,
        translate:null
    };
    this.isActive=false;
    this.event={
        open:function(data){

        },
        ok:function(data){

        },
        cancel:function(data){

        },
        move:function(data){

        }
    };
    this.element=opt.element;
    this.$contentElm=null;
    this.overlay=opt.overlay;
    this.datas=opt.datas||[
        {
            displayName:"经度",
            name:"x",
            type:'x'
        },
        {
            displayName:"纬度",
            name:"y",
            type:'y'
        },
        {
            displayName:"地址",
            name:"address",
            type:'edit'
        }
    ];
    this.datasPosition={x:{},y:{}};
    var init=function(){
        _self._createDatasPosition();
        _self._createLocateLayer();
        _self._createLocateFeature();
        _self._createInteraction();
        _self._createOverlay();
    };
    /**
     * 查找datas里面的坐标字段构建对应的映射,方便修改数据
     * @private
     */
    RelocateService.prototype._createDatasPosition=function(){
        for(var i=0;i<_self.datas.length;i++){
            if(_self.datas[i].type==='x'){
                _self.datasPosition.x=_self.datas[0];
            }
            if(_self.datas[i].type==='y'){
                _self.datasPosition.y=_self.datas[1];
            }
        }
    };
    RelocateService.prototype._createLocateLayer=function(){
        this.layer=new ol.layer.Vector({
            source:new ol.source.Vector(),
            style:_self.style
        });
        this.map.addLayer(this.layer);
        this.layer.setVisible(false);
        this.layer.setZIndex(999999);
    };
    RelocateService.prototype.get=function(key){
        for(var i=0;i<_self.datas.length;i++){
            if(_self.datas[i].name==key){
                return _self.datas[i]
            }
        }
    };
    RelocateService.prototype.set=function(key, data){
        if(typeof key === "object"){
            var obj=key;

        }else{
            var obj=_self.get(key);
            if(obj){
                obj['value']=data;
            }
        }
    };
    RelocateService.prototype.clearData=function(){
        for(var i=0;i<_self.datas.length;i++){
            _self.datas[i].value="";
        }
    };
    RelocateService.prototype.data2Obj=function(data){
        var obj={};
        for(var i=0;i<data.length;i++){
            obj[data[i].name]=data[i].value
        }
        return obj;
    };
    RelocateService.prototype._createLocateFeature=function(coordinate){
        coordinate=coordinate||[-9999999,-9999999];
        if(_self.proj!=="EPSG:4326"){
            coordinate=ol.proj.transform(coordinate,'EPSG:4326',_self.proj);
        }
        this.locateFeature=new ol.Feature({
            geometry:new ol.geom.Point(coordinate),
            style:_self.style,
            name:'locateFeature'
        });
        this.layer.getSource().addFeature(_self.locateFeature);
    };
    RelocateService.prototype._createOverlay=function(){
        var style='<style>.rlc_bubble {\n' +
            '    position: absolute;\n' +
            '    background-color: white;\n' +
            '    -webkit-filter: drop-shadow(0 1px 4px rgba(0,0,0,0.2));\n' +
            '    filter: drop-shadow(0 1px 4px rgba(0,0,0,0.2));\n' +
            '    padding: 8px;\n' +
            '    border-radius: 8px;\n' +
            '    border: 1px solid #cccccc;\n' +
            '    bottom: 5px;\n' +
            '    left: -50px;\n' +
            '    min-width: 280px;\n' +
            '    z-index:99999999;\n' +
            '}\n' +
            '.rlc_bubble:after, .rlc_bubble:before {\n' +
            '    top: 100%;\n' +
            '    border: solid transparent;\n' +
            '    content: " ";\n' +
            '    height: 0;\n' +
            '    width: 0;\n' +
            '    position: absolute;\n' +
            '    pointer-events: none;\n' +
            '}\n' +
            '.rlc_bubble:after {\n' +
            '    border-top-color: white;\n' +
            '    border-width: 10px;\n' +
            '    left: 48px;\n' +
            '    margin-left: -10px;\n' +
            '}\n' +
            '.rlc_bubble:before {\n' +
            '    border-top-color: #cccccc;\n' +
            '    border-width: 11px;\n' +
            '    left: 48px;\n' +
            '    margin-left: -11px;\n' +
            '}\n' +
            '.rlc_close {\n' +
            '    text-decoration: none;\n' +
            '    position: absolute;\n' +
            '    top: 2px;\n' +
            '    right: 8px;\n' +
            '    cursor:pointer;\n' +
            '}\n' +
            '.rlc_close:after {\n' +
            '    content: "✖";\n' +
            '}\n' +
            '.rlc_bubble{\n' +
            '    color:#333;\n' +
            '    background:white;\n' +
            '}\n' +
            '.rlc_header{\n' +
            '    position:relative;\n' +
            '}\n' +
            '.rlc_content{\n' +
            '    padding:5px;\n' +
            '}\n' +
            '.rlc_group{\n' +
            '    margin-bottom:8px;\n' +
            '}\n' +
            '.rlc_opt{\n' +
            '    text-align:right;\n' +
            '}</style>';
        var template='    <div id="relocateBubble_rc" class="rlc_bubble ol-popup">\n' +
            '        <div class="rlc_header"><span class="rlc_close"></span></div>\n' +
            '        <div class="rlc_content">\n' +
            '        </div>\n' +
            '        <div class="rlc_opt"><div class="btn btn-sm btn-primary rlc_ok">确定</div></div>\n' +
            '    </div>';
        if(!_self.element){
            $(style).appendTo('body');
            $(template).appendTo("body");
        }
        _self.element=$("#relocateBubble_rc")[0];
        _self.overlay=new ol.Overlay({
            element:_self.element,
            position:[-9999999,-9999999],
            offset:[0,-20],
            positioning: 'bottom-left'
        });
        _self.$contentElm=$(_self.element).find(".rlc_content");
        $(_self.element).find('.rlc_ok').click(function(){
            _self.ok&&_self.ok(_self.data2Obj(_self.datas),_self.sourceFeature);
        });
        $(_self.element).find('.rlc_close').click(function(){
            _self.cancel&&_self.cancel(_self.data2Obj(_self.datas),_self.sourceFeature);
        });
        $(_self.element).on("change",'input.rlc_val',function(){
            var name=$(this).attr("data-name");
            _self.set(name,$(this).val());
        });
        _self.map.addOverlay(_self.overlay);

    };
    RelocateService.prototype.renderData=function(renderData){
        var str="";//'<div class="rlc_group"><span>经度:</span><span class="rlc_val"></span></div>';
        //var inputStr='<div class="rlc_group"><span>地址:</span><input class="rlc_val" value="" placeholder="请输入新地址"/></div>';
        var datas=renderData||_self.datas||[];
        datas.forEach(function(data){
            if(data.displayName){
                if(data.type!=='edit'){
                    str+='<div class="rlc_group"><span>'+(data["displayName"]||"")+':</span><span class="rlc_val" data-name="'+(data["name"]||"")+'">'+(data["value"]||"")+'</span></div>';
                }else{
                    str+='<div class="rlc_group"><span>'+(data["displayName"]||"")+':</span><input class="rlc_val" data-name="'+(data["name"]||"")+'" value="'+(data["value"]||"")+'" placeholder="请输入'+(data["displayName"]||"")+'"/></div>';
                }
            }
        });
        _self.$contentElm.html(str);
    };
    RelocateService.prototype.changeRenderDataPosition=function(coordinate){
        var clientCoord=ol.proj.transform(coordinate,_self.proj,'EPSG:4326');
        _self.datasPosition.x.value=clientCoord[0];
        _self.datasPosition.y.value=clientCoord[1];
        _self.renderData();
    };
    RelocateService.prototype._createInteraction=function(){
        _self.interaction.translate=new ol.interaction.Translate({
            layers:[_self.layer],
            features:new ol.Collection([_self.locateFeature])
        });
        _self.map.addInteraction(_self.interaction.translate);
        _self.interaction.translate.setActive(false);
        _self.interaction.translate.on("translating",function(e){
            _self.overlay.setPosition(e.coordinate);
            _self.changeRenderDataPosition(e.coordinate);
        })
    };
    RelocateService.prototype.setActive=function(boolean){
        if(boolean === undefined){
            boolean=false;
        }
        _self.interaction.translate.setActive(boolean);
        _self.layer.setVisible(boolean);
        if(!boolean){
            _self.overlay.setPosition([-99999999,-999999999]);
        }
    };
    RelocateService.prototype.clear=function(){
        var interactions = _self.map.getInteractions().getArray();
        for(var i=0;i<interactions.length;i++){
            if(interactions[i] instanceof ol.interaction.Select){
                interactions[i].getFeatures().clear();
            }
        }
    };
    RelocateService.prototype.open=function(feature, layer){
        if(typeof feature!=='undefined'&&(!(feature instanceof ol.Feature))){
            feature=_self.findFeature(feature,layer);
        }
        if(feature instanceof ol.Feature){
            var geo=_self.locateFeature.getGeometry();
            var coordinate=feature.getGeometry().getCoordinates();
            geo.setCoordinates(coordinate);
            _self.overlay.setPosition(coordinate);
            _self.setActive(true);
            var clientCoord=ol.proj.transform(coordinate,_self.proj,'EPSG:4326');
            _self.datasPosition.x.value=clientCoord[0];
            _self.datasPosition.y.value=clientCoord[1];
            _self.renderData();
            _self.sourceFeature=feature;
            _self.event.open(_self.data2Obj(_self.datas),feature);
        }else{
            console.log("检查传入的feature或者检查layer参数")
        }
        setTimeout(function(){
            _self.clear();
        });

    };
    RelocateService.prototype.getCoordinate=function(){
        return _self.locateFeature.getGeometry().getCoordinates();
    };
    RelocateService.prototype.findFeature=function(params, layer){
        var resultFeature=null;
        if(typeof layer==='string'){
            var layers=_self.map.getLayers().getArray();
            for(var i=0;i<layers.length;i++){
                if(layers[i].get("name")===layer){
                    layer=layers[i];
                    break;
                }
            }
        }
        if(layer instanceof ol.layer.Vector){
            var features=layer.getSource().getFeatures();
            if(typeof params==="string"||typeof params==="number"){
                for(var i=0;i<features.length;i++){
                    var id=features[i].get("id");
                    if(id==params){
                        resultFeature=features[i];
                    }
                }
            }else{
                for(var i=0;i<features.length;i++){
                    var client=features[i].get("clients");
                    if(client){
                        resultFeature=features[i];
                        for(k in params){
                            if(client[k]!=params[k]){
                                resultFeature=null;
                                break;
                            }
                        }
                    }
                }
            }
            if(resultFeature){
                return resultFeature;
            }
        }
    };
    RelocateService.prototype.cancel=function(data, feature){
        _self.clearData();
        _self.setActive(false);
        _self.clear();
        _self.event.cancel(data,feature);
    };
    RelocateService.prototype.close=function(data, feature){
        _self.clearData();
        _self.clear();
        _self.setActive(false);
    };
    RelocateService.prototype.ok=function(data, feature){
        var params=_self.extend({},data);
        _self.event.ok(params,feature);
        _self.clearData();
        _self.setActive(false);
        _self.clear();
    };
    RelocateService.prototype.extend=function extend(dst) {
        for (var i = 1, ii = arguments.length; i < ii; i++) {
            var obj = arguments[i];
            if (obj) {
                var keys = Object.keys(obj);
                for (var j = 0, jj = keys.length; j < jj; j++) {
                    var key = keys[j];
                    dst[key] = obj[key];
                }
            }
        }
        return dst;
    };
    init();
}

