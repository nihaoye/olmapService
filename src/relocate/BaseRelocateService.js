

/**
 * 这个是底层的基础服务方法
 * @author zhangyuhao
 * @param opt
 * @constructor
 */
function BaseRelocateService(opt){
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
    BaseRelocateService.prototype._createDatasPosition=function(){
        for(var i=0;i<_self.datas.length;i++){
            if(_self.datas[i].type==='x'){
                _self.datasPosition.x=_self.datas[0];
            }
            if(_self.datas[i].type==='y'){
                _self.datasPosition.y=_self.datas[1];
            }
        }
    };
    BaseRelocateService.prototype._createLocateLayer=function(){
        this.layer=new ol.layer.Vector({
            source:new ol.source.Vector(),
            style:_self.style
        });
        this.map.addLayer(this.layer);
        this.layer.setVisible(false);
        this.layer.setZIndex(999999);
    };
    BaseRelocateService.prototype.get=function(key){
        for(var i=0;i<_self.datas.length;i++){
            if(_self.datas[i].name==key){
                return _self.datas[i]
            }
        }
    };
    BaseRelocateService.prototype.set=function(key, data){
        if(typeof key === "object"){
            var obj=key;

        }else{
            var obj=_self.get(key);
            if(obj){
                obj['value']=data;
            }
        }
    };
    BaseRelocateService.prototype.clearData=function(){
        for(var i=0;i<_self.datas.length;i++){
            _self.datas[i].value="";
        }
    };
    BaseRelocateService.prototype.data2Obj=function(data){
        var obj={};
        for(var i=0;i<data.length;i++){
            obj[data[i].name]=data[i].value
        }
        return obj;
    };
    BaseRelocateService.prototype._createLocateFeature=function(coordinate){
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
    BaseRelocateService.prototype._createOverlay=function(){
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
    BaseRelocateService.prototype.renderData=function(renderData){
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
    BaseRelocateService.prototype.changeRenderDataPosition=function(coordinate){
        var clientCoord=ol.proj.transform(coordinate,_self.proj,'EPSG:4326');
        _self.datasPosition.x.value=clientCoord[0];
        _self.datasPosition.y.value=clientCoord[1];
        _self.renderData();
    };
    BaseRelocateService.prototype._createInteraction=function(){
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
    BaseRelocateService.prototype.setActive=function(boolean){
        if(boolean === undefined){
            boolean=false;
        }
        _self.interaction.translate.setActive(boolean);
        _self.layer.setVisible(boolean);
        if(!boolean){
            _self.overlay.setPosition([-99999999,-999999999]);
        }
    };
    BaseRelocateService.prototype.clear=function(){
        var interactions = _self.map.getInteractions().getArray();
        for(var i=0;i<interactions.length;i++){
            if(interactions[i] instanceof ol.interaction.Select){
                interactions[i].getFeatures().clear();
            }
        }
    };
    BaseRelocateService.prototype.open=function(feature, layer){
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
    BaseRelocateService.prototype.getCoordinate=function(){
        return _self.locateFeature.getGeometry().getCoordinates();
    };
    BaseRelocateService.prototype.findFeature=function(params, layer){
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
    BaseRelocateService.prototype.cancel=function(data, feature){
        _self.clearData();
        _self.setActive(false);
        _self.clear();
        _self.event.cancel(data,feature);
    };
    BaseRelocateService.prototype.close=function(data, feature){
        _self.clearData();
        _self.clear();
        _self.setActive(false);
    };
    BaseRelocateService.prototype.ok=function(data, feature){
        var params=_self.extend({},data);
        _self.event.ok(params,feature);
        _self.clearData();
        _self.setActive(false);
        _self.clear();
    };
    BaseRelocateService.prototype.extend=function extend(dst) {
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

