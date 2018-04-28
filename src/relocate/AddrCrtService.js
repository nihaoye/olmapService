
import RelocateService from './BaseRelocateService'
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

