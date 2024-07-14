
let nowDialog = null;
let nowDialogBack = null;
let nowDialogOptions = null;

let onClick = function(event){
    if(!nowDialog) return;
    if (event.target === nowDialog) {
        hideDialog();
    }
}

async function dialog(title,content,option){

    nowDialog = null;
    nowDialogBack = null;

    if(!option){
        option = {
            close:true,
        }
    }

    nowDialogOptions = option;

    const root = document.getElementById('dialogOverlay');
    //const back = document.getElementById('dialogBack');
    const contentDiv = document.getElementById('dialogContent');

    root.removeEventListener('click', onClick);
    
    // 元のデータを削除
    while( contentDiv.firstChild ){
        contentDiv.removeChild( contentDiv.firstChild );
    }

    // ヘッダ
    const header = document.createElement('h2');
    header.textContent = title;
    header.style = "";
    if(title) contentDiv.appendChild(header);

    // 中身
    if(content){
        if(typeof content === 'string'){
            const entry = document.createElement('div');
            entry.textContent = content;
            contentDiv.appendChild(entry);
        }
        else{
            contentDiv.appendChild(content);
        }
    }

    // ポップアップを表示
    root.classList.remove('hidden');
    root.classList.remove('hide');
    root.classList.add('show');

    await new Promise(resolve => setTimeout(resolve, 500));

    nowDialog = root;
    //nowDialogBack = back;

    if(option.close) nowDialog.addEventListener('click', onClick);
}

async function hideDialog(){
    if(!nowDialog) return;

    nowDialog.classList.remove('show');
    nowDialog.classList.add('hide');

    await new Promise(resolve => setTimeout(resolve, 10));

    nowDialog.classList.remove('hide');
    nowDialog.classList.add('hidden');

    nowDialog.removeEventListener('click', onClick);

    if(nowDialogOptions.onClose) nowDialogOptions.onClose();
}