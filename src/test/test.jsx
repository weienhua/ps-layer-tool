// 0 x方向排序
// 1 y方向排序
// 2 ps图层从下向上方向排序
var info_sort_id = 0;
// 0 x="" y=""
// 1 x="" y="" w="" h=""
// 2 <Image src="" x="" y="" />
// 3 <Image src="" x="" y="" w="" h="" />
// 4 <Image src="" x="" y="" w="" h="" align="center" alignV="center" />
// 5 <Image src="" x="" y="" w="" h="" centerX="" centerY="" rotation="" />
var info_format_type_id = 4;

try {
    var wh_scale_value = '(1-0.1*sin((#loop-100*0)/300))';
    var rotation_value = '(5*sin((#loop-100*0)/300))';
    var s2t = stringIDToTypeID;
    var layers_list = getSelectedLayers();
    var layers_info_list = getListLayersInfo(layers_list);
    switch (info_sort_id) {
        case 0:
            // 按 x 升序排序
            layers_info_list.sort(function(a, b) {
                if (a.x !== b.x) {
                    return a.x - b.x;
                } else {
                    return a.y - b.y;
                }
            });
            break;
        case 1:
            // 按 y 升序排序
            layers_info_list.sort(function(a, b) {
                if (a.y !== b.y) {
                    return a.y - b.y;
                } else {
                    return a.x - b.x;
                }
            });
            break;
        default:
            break;
    }
    var txt = formatListInfo(layers_info_list,info_format_type_id);
    copyTextToClipboard(txt);
} catch (err) {
    alert("请创建选区或选中图层。\n错误信息：" + err);
}




/**
 * 这个函数接收一个List和类型id，返回处理后的数据String
 * @param layers_list [List]
 * @param typeid number
 * @return String
 */
function formatListInfo(layers_list,typeid) {
    var clipboardTextpre ="<Image ";
    var clipboardText ="";
    for (var i=0; i<layers_list.length; i++) {
        var layer_info = layers_list[i];
        var istxt = layer_info.istxt;
        var name_value = 'src="' + layer_info.name + '.png"';
        var x_value = 'x="' + layer_info.x + '"';
        var y_value = 'y="' + layer_info.y + '"';
        var w_value = 'w="' + layer_info.w + '"';
        var h_value = 'h="' + layer_info.h + '"';
        // var wh_scale_value = '#sx1';
        // var wh_scale_value = '(1-0.1*sin((#loop-100*0)/300))';
        // var rotation_value = '(5*sin((#loop-100*0)/300))';
        var xx_value = 'x="' + layer_info.centerx + '"';
        var yy_value = 'y="' + layer_info.centery + '"';
        var ww_value = 'w="' + layer_info.w + '*' + wh_scale_value + '"';
        var hh_value = 'h="' + layer_info.h + '*' + wh_scale_value + '"';
        var centerX_value = 'centerX="' + layer_info.w +'*0.5'+ '"';
        var centerY_value = 'centerY="' + layer_info.h +'*0.5'+ '"';
        var rotaton_value ;
        var rotation = layer_info.rotation;
        if(rotation == 0 ) {
            rotaton_value = 'rotation="' + rotation_value + '"';
        } else if(typeid == 5) {
            rotaton_value = 'rotation="' + rotation + '+' + rotation_value  + '"';
        } else if(typeid != 5) {
            rotaton_value = 'rotation="' + rotation + '"';
        }
        if(i != 0) {
            clipboardText = clipboardText + '\n';
        }
        if(istxt) {
            var text = layer_info.text;
            var color = layer_info.color;
            var size = 28;

            var T = '<Text textExp="\''+ text +'\'" '
                + 'x="' + layer_info.x + '" '
                + 'y="' + layer_info.centery + '" '
                + 'align="left" '
                + 'alignV="center" '
                + 'bold="false" '
                + 'color="' + color + '" '
                + 'size="' + size + '"/>';
            clipboardText = clipboardText + T;
        } else {
            switch (typeid) {
                case 0:
                    if(rotation == 0 ) {
                        clipboardText = clipboardText + x_value + ' ' + y_value + ' ' ;
                    } else {
                        clipboardText = clipboardText + x_value + ' ' + y_value + ' ' + centerX_value + ' ' + centerY_value + ' ' + rotaton_value + ' ' ;
                    }
                    break;
                case 1:
                    if(rotation == 0 ) {
                        clipboardText = clipboardText + x_value + ' ' + y_value + ' '+ w_value + ' '+ h_value + ' ';
                    } else {
                        clipboardText = clipboardText + x_value + ' ' + y_value + ' '+ w_value + ' '+ h_value + ' ' + centerX_value + ' ' + centerY_value + ' ' + rotaton_value + ' ';
                    }
                    break;
                case 2:
                    if(rotation == 0 ) {
                        clipboardText = clipboardText + clipboardTextpre + name_value + ' ' + x_value + ' ' + y_value + ' />' ;
                    } else {
                        clipboardText = clipboardText + clipboardTextpre + name_value + ' ' + x_value + ' ' + y_value + ' ' + centerX_value + ' ' + centerY_value + ' ' + rotaton_value + ' />' ;
                    }
                    break;
                case 3:
                    if(rotation == 0 ) {
                        clipboardText = clipboardText + clipboardTextpre + name_value + ' ' + x_value + ' ' + y_value + ' '+ w_value + ' '+ h_value + ' />' ;
                    } else {
                        clipboardText = clipboardText + clipboardTextpre + name_value + ' ' + x_value + ' ' + y_value + ' '+ w_value + ' '+ h_value + ' ' + centerX_value + ' ' + centerY_value + ' ' + rotaton_value + ' />' ;
                    }
                    break;
                case 4:
                    if(rotation == 0 ) {
                        clipboardText = clipboardText + clipboardTextpre + name_value + ' ' + xx_value + ' ' + yy_value + ' '+ ww_value + ' '+ hh_value + ' align="center" alignV="center"' + ' scaleType="fill" />' ;
                    } else {
                        clipboardText = clipboardText + clipboardTextpre + name_value + ' ' + xx_value + ' ' + yy_value + ' '+ ww_value + ' '+ hh_value + ' align="center" alignV="center"' + ' ' + centerX_value + ' ' + centerY_value + ' ' + rotaton_value + ' scaleType="fill" />' ;
                    }
                    break;
                case 5:
                    if(rotation == 0 ) {
                        clipboardText = clipboardText + clipboardTextpre + name_value + ' ' + x_value + ' ' + y_value + ' '+ w_value + ' '+ h_value + ' ' + centerX_value + ' ' + centerY_value + ' ' + rotaton_value + ' />' ;
                    } else {
                        clipboardText = clipboardText + clipboardTextpre + name_value + ' ' + x_value + ' ' + y_value + ' '+ w_value + ' '+ h_value + ' ' + centerX_value + ' ' + centerY_value + ' ' + rotaton_value + ' />' ;
                    }
                    break;
                default:
                    break;
            }
        }
        
        // $.writeln(clipboardText);
    }
    return clipboardText;
}

/**
 * 这个函数返回当前选择的所有图层
 * @return List
 */
function getSelectedLayers() {
   // 获取当前选中的所有图层包括图层组
    var ref1 = new ActionReference();
    // 给AR设置一个property，表示你我只要获取targetLayersIDs属性的值，其它的不要给我返回了
    ref1.putProperty(charIDToTypeID("Prpr"), stringIDToTypeID("targetLayersIDs"));
    ref1.putEnumerated(charIDToTypeID('Dcmn'), charIDToTypeID('Ordn'), charIDToTypeID('Trgt'));
    var doc_descriptor = executeActionGet(ref1);
    // 我们可以通过打印发现targetLayersIDs是一个list类型，通过getList拿到一个数组
    // 遍历这个list，拿到图层ID，ActionList的数据结构和AD也差不多，数组里头的元素是ActionReference对象
    var layers_list = doc_descriptor.getList(stringIDToTypeID("targetLayersIDs"));
    return layers_list;
}
/**
 * 这个函数接收一个List的对象，返回这个对象的所有图层(过滤组)的位置和宽高信息 List
 * @param list [List]
 * @return List
 */
function getListLayersInfo(list) {
    var res = [];
    for (var i = 0; i < list.count; i++) {
        var layer_ref = list.getReference(i);
        var layer_des = executeActionGet(layer_ref);

        var layer_section = typeIDToStringID(layer_des.getEnumerationValue(s2t("layerSection")));
        // 跳过组
        if (layer_section === "layerSectionStart") {
            continue;
        }
        if (layer_section === "layerSectionContent") {
            var isSmartObject = layer_des.hasKey(s2t("smartObject"));
            var layer_pos;
            if (isSmartObject) {
                layer_pos = getSmartObjectInfo(layer_des);
            } else {
                // 普通图层直接AM获取
                layer_pos = getNormalPos(layer_des);
            }
            res.push(layer_pos);
        }
    }

    return res;
}
/**
 * 这个函数接收一个AD，返回智能对象数据
 * @param desc 
{
    "istxt":"1",
    "name":"title",
    "x":"120",
    "y":"80",
    "w":"400",
    "h":"200",
    "scale":"1",
    "rotation":"0",
}
 */
function getSmartObjectInfo(desc) {


    if (!desc.hasKey(s2t("smartObjectMore"))) {
        return null;
    }

    var soMore = desc.getObjectValue(s2t("smartObjectMore"));

    // var layer_name = desc.getString(s2t("name"));
    var layer_name = getLayerPathByDesc(desc);

    // ---------- 原始尺寸 ----------
    var size = soMore.getObjectValue(s2t("size"));
    var originW = size.getUnitDoubleValue(s2t("width"));
    var originH = size.getUnitDoubleValue(s2t("height"));

    // ---------- transform ----------
    var tf = soMore.getList(s2t("transform"));

    var x1 = tf.getDouble(0);
    var y1 = tf.getDouble(1);

    var x2 = tf.getDouble(2);
    var y2 = tf.getDouble(3);

    var x3 = tf.getDouble(4);
    var y3 = tf.getDouble(5);

    var x4 = tf.getDouble(6);
    var y4 = tf.getDouble(7);

    // ---------- 渲染尺寸 ----------
    var renderW = Math.sqrt(Math.pow(x2-x1,2) + Math.pow(y2-y1,2));
    var renderH = Math.sqrt(Math.pow(x4-x1,2) + Math.pow(y4-y1,2));

    // ---------- 缩放 ----------
    var scaleX = renderW / originW;
    var scaleY = renderH / originH;

    // ---------- 旋转 ----------
    var rotation = Math.atan2(y2-y1, x2-x1) * 180 / Math.PI;
    
    // ---------- flip 翻转 ----------
    var rotationX = 0;
    var rotationY = 0;
    var vx = {x:x2-x1, y:y2-y1};
    var vy = {x:x4-x1, y:y4-y1};
    var cross = vx.x*vy.y - vx.y*vy.x;
    var flip = cross < 0 ? 1 : 0;
    // 判断水平还是垂直
    if(flip) {
        // 水平翻转：宽向量x分量为负
        if(vx.x < 0) rotationX = 180;
        // 垂直翻转：高向量y分量为负
        if(vy.y < 0) rotationY = 180;
    }
    object = {
        istxt:0,
        name:layer_name,
        x: toFix2(x1).toString(),
        y: toFix2(y1).toString(),

        w: toFix2(renderW).toString(),
        h: toFix2(renderH).toString(),

        centerx: toFix2((x1+x2+x3+x4)*0.25).toString(),
        centery: toFix2((y1+y2+y3+y4)*0.25).toString(),

        // scaleX: toFix2(scaleX).toString(),
        // scaleY: toFix2(scaleY).toString(),

        rotation: toFix2(rotation).toString(),
        flip: flip,
        rotationX: toFix2(rotationX).toString(),
        rotationY: toFix2(rotationY).toString(),
        // originW: toFix2(originW).toString(),
        // originH: toFix2(originH).toString()
    };
    return object;
}

/**
 * 这个函数接收一个数，保留整数位
 * @param num
 * @return num 
 */
function toFix2(num) {
    return Math.round(num);
}

/**
 * 这个函数接收一个AD的对象，返回这个对象的位置和宽高信息 string
 * @param desc [ActionDescriptor]
 * @return object
{
    "istxt":"1",
    "name":"title",
    "x":"120",
    "y":"80",
    "w":"400",
    "h":"200",
    "text":"Hello World",
    "fontSize":48,
    "color":"#FF0000"
}
 */
function getNormalPos(desc) {

    var istxt = 0;
    var object = {};

    // var layer_name = desc.getString(s2t("name"));
    var layer_name = getLayerPathByDesc(desc);

    // bounds
    var bounds = desc.getObjectValue(s2t("bounds"));

    var left   = bounds.getUnitDoubleValue(s2t("left"));
    var top    = bounds.getUnitDoubleValue(s2t("top"));
    var width  = bounds.getUnitDoubleValue(s2t("width"));
    var height = bounds.getUnitDoubleValue(s2t("height"));

    // ---------- 文本图层 ----------
    if (desc.hasKey(s2t("textKey"))) {
        istxt = 1;
        var textKey = desc.getObjectValue(s2t("textKey"));

        // 文本内容
        if (textKey.hasKey(s2t("textKey"))) {
            var object_text = textKey.getString(s2t("textKey"));
        }

        var textStyleRange = textKey.getList(s2t("textStyleRange"));
        var textStyle = textStyleRange.getObjectValue(0).getObjectValue(s2t("textStyle"));

        // 字号
        if (textStyle.hasKey(s2t("size"))) {
            var object_fontSize = textStyle.getUnitDoubleValue(s2t("size")).toString();
        }

        // 颜色
        if (textStyle.hasKey(s2t("color"))) {

            var color = textStyle.getObjectValue(s2t("color"));

            var r = Math.round(color.getDouble(s2t("red")));
            var g = Math.round(color.getDouble(s2t("green")));
            var b = Math.round(color.getDouble(s2t("blue")));

            var object_color = rgbToHex(r, g, b);
        }
    }
    object = {
        istxt:istxt,
        name: layer_name,
        x: toFix2(left).toString(),
        y: toFix2(top).toString(),
        w: toFix2(width).toString(),
        h: toFix2(height).toString(),
        centerx: toFix2(left+width*0.5).toString(),
        centery: toFix2(top+height*0.5).toString(),
        text: object_text,
        fontSize: object_fontSize,
        color: object_color,
        rotation: 0,
        flip: 0,
        rotationX: 0,
        rotationY: 0,
    };
    return object;
}

/**
 * 这个函数接收一个AD，返回layer
 * @param desc
 * @return layer
 */
function getLayerObjectByAD(desc) {
    // 获取layerID
    // 只在智能对象时选中图层
    // var oldState = app.activeDocument.activeHistoryState;
    var layerID = desc.getInteger(s2t("layerID"));
    selectLayerByID(layerID);
    var layer = app.activeDocument.activeLayer;
    // app.activeDocument.activeHistoryState = oldState;
    return layer;
}
/**
 * 这个函数接收一个id，选中这个图层
 * @param id 
 */
function selectLayerByID(id) {

    var desc = new ActionDescriptor();
    var ref = new ActionReference();

    ref.putIdentifier(stringIDToTypeID("layer"), id);

    desc.putReference(charIDToTypeID("null"), ref);
    desc.putBoolean(stringIDToTypeID("makeVisible"), false);

    executeAction(charIDToTypeID("slct"), desc, DialogModes.NO);
}
/**
 * 这个函数接收一个layer，返回完整路径
 * @param layer
 * @return string
 */
function getLayerPathByLayer(layer) {

    var names = [];
    var cur = layer;

    while (cur && cur.typename !== "Document") {
        names.unshift(cur.name);
        cur = cur.parent;
    }

    return names.join("/");
}
/**
 * 这个函数接收一个AD，返回完整路径
 * @param desc
 * @return string
 */
function getLayerPathByDesc(desc) {


    if (!desc.hasKey(s2t("layerID"))) {
        return "";
    }

    
    var layer = getLayerObjectByAD(desc);
    // 用 DOM 找图层
    // var layerID = desc.getInteger(s2t("layerID"));
    // var layer = findLayerByID(app.activeDocument, layerID);

    if (!layer) return "";

    return getLayerPathByLayer(layer);
}
/**
 * 这个函数接收一个父级和id，返回id 图层
 * @param parent
 * @param id
 * @return layer
 */
function findLayerByID(parent, id) {

    for (var i = 0; i < parent.layers.length; i++) {

        var layer = parent.layers[i];

        if (layer.id === id) {
            return layer;
        }

        if (layer.typename === "LayerSet") {
            var found = findLayerByID(layer, id);
            if (found) return found;
        }
    }

    return null;
}
// RGB → HEX
function rgbToHex(r,g,b){
    return "#" + ((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
}
/**
 * 这个函数接收一个String，将其赋值到剪贴板上
 * @param txt [String]
 */
function copyTextToClipboard(txt) {
    var desc = new ActionDescriptor();
    desc.putString(stringIDToTypeID("textData"), txt);
    executeAction(stringIDToTypeID("textToClipboard"), desc, DialogModes.NO);
}