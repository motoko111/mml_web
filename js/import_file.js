var loadFileAsync = async (filepath, callback) => {
    var k = await fetch(filepath);
    var txt = await k.text();
    if(callback != null) callback(txt);
  };