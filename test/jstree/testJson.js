import jQuery from 'jquery';
import 'jstree';
import 'jstree/dist/themes/default/style.min.css';

window.$ = window.jQuery = jQuery;

$(function() {
    var flatData = [
        { "id" : "1", "parent" : "#", "text" : "根节点" },
        { "id" : "2", "parent" : "1", "text" : "子节点 1" },
        { "id" : "3", "parent" : "1", "text" : "子节点 2" },
        { "id" : "4", "parent" : "2", "text" : "子节点 1.1" },
        { "id" : "5", "parent" : "2", "text" : "子节点 1.2" },
        { "id" : "6", "parent" : "7", "text" : "子节点 999" },
        { "id" : "8", "parent" : "6", "text" : "子节点 999" },
    ];

    // 处理孤立节点
    var orphanNodes = [];
    var validParents = new Set(flatData.map(item => item.id));
    validParents.add('#');

    flatData.forEach(item => {
        if (!validParents.has(item.parent)) {
            orphanNodes.push(item);
            item.parent = '#';
            item.text += ' (孤立节点)';
        }
    });

    $('#jstree').jstree({
        "core" : {
            "check_callback" : true,
            "data" : flatData
        },
        "plugins" : ["dnd", "contextmenu", "wholerow"]
    });

    $('#save').on('click', function() {
        var jsonData = $('#jstree').jstree(true).get_json('#', {flat:true});
        $('#json-output').text(JSON.stringify(jsonData, null, 2));
    });

    // 显示孤立节点信息
    if (orphanNodes.length > 0) {
        var orphanInfo = '发现以下孤立节点：\n' + 
            orphanNodes.map(node => `ID: ${node.id}, 原父节点: ${node.parent}`).join('\n');
        console.log(orphanInfo);
        alert(orphanInfo);
    }
});