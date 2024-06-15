var loadFileAsync = async (filepath, callback) => {
    G_LoadedMML = false
    var k = await fetch(filepath);
    var txt = await k.text();
    if(callback != null) callback(txt);
  };