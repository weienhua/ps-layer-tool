//quick_export_png(activeDocument.path.fsName)
// export activeLayer
function quick_export_png(path, layer)
{
    try {
        var options = new ExportOptionsSaveForWeb();
        options.format = SaveDocumentType.PNG;
        options.PNG8 = false;
        options.quality = 100;
        options.transparency = true;
        var file = new File(path + "/a.png");
        alert(file);
        app.activeDocument.exportDocument(file, ExportType.SAVEFORWEB, options);
    }
    catch (e) { 
        alert(path);
        throw(e); 
    }
}

quick_export_png(activeDocument.path.fsName, true);
