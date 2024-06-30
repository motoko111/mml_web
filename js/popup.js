let popupId = 0;

async function popup(txt){
    popupId++;
    popupId%=100;

    let id = popupId;

    const popupContainer = document.getElementById('popupContainer');
    const logContent = document.getElementById('logContent');
    
    // 元のデータを削除
    while( logContent.firstChild ){
        logContent.removeChild( logContent.firstChild );
    }

    // ログに追加
    const logEntry = document.createElement('div');
    logEntry.textContent = txt;
    logContent.appendChild(logEntry);
    
    // ポップアップを表示
    popupContainer.classList.remove('hidden');
    popupContainer.classList.remove('hide');
    popupContainer.classList.add('show');
    popupContainer.classList.remove('error');

    await new Promise(resolve => setTimeout(resolve, 500));
    if(popupId != id) return;

    await new Promise(resolve => setTimeout(resolve, 2000));
    if(popupId != id) return;

    popupContainer.classList.remove('show');
    popupContainer.classList.add('hide');

    await new Promise(resolve => setTimeout(resolve, 500));
    if(popupId != id) return;

    popupContainer.classList.remove('hide');
    popupContainer.classList.add('hidden');
}

async function popupError(txt){
    popupId++;
    popupId%=100;

    let id = popupId;

    const popupContainer = document.getElementById('popupContainer');
    const logContent = document.getElementById('logContent');
    
    // 元のデータを削除
    while( logContent.firstChild ){
        logContent.removeChild( logContent.firstChild );
    }

    // ログに追加
    const logEntry = document.createElement('div');
    logEntry.textContent = txt;
    logContent.appendChild(logEntry);
    
    // ポップアップを表示
    popupContainer.classList.remove('hidden');
    popupContainer.classList.remove('hide');
    popupContainer.classList.add('show');
    popupContainer.classList.add('error');

    await new Promise(resolve => setTimeout(resolve, 500));
    if(popupId != id) return;

    await new Promise(resolve => setTimeout(resolve, 2000));
    if(popupId != id) return;

    popupContainer.classList.remove('show');
    popupContainer.classList.add('hide');

    await new Promise(resolve => setTimeout(resolve, 500));
    if(popupId != id) return;

    popupContainer.classList.remove('hide');
    popupContainer.classList.add('hidden');
}