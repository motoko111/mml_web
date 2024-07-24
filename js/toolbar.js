class ToobarItem{
    constructor(name, func, icon){
        this.type = "item";
        this.name = name;
        this.icon = icon;
        this.func = func;
        this.nodes = []
    }
    addChild(item){
        this.nodes.push(item);
    }
}

class ToobarLine{
    constructor(){
        this.type = "line";
        this.nodes = []
    }
}

class Toolbar{
    constructor(rootId){
        this.rootId = rootId;
        this.nodes = []
        this.dropdowns = [];
        this.toolItems = [];
        this.mode = "idle";
    }
    closeAllMenus(){
        this.dropdowns.forEach((element) => {
            element.classList.remove("active");
        });
    }
    build(){
        let root = document.getElementById(this.rootId);
        while( root.firstChild ){
            root.removeChild( root.firstChild );
        }
        this.dropdowns.splice(0);
        this.toolItems.splice(0);
        for(let i = 0;i<this.nodes.length;++i){
            let node = this.nodes[i];

            let item_root = document.createElement("div");
                item_root.classList.add('top-toolbar-item');
                let item_root_span = document.createElement("span");
                item_root_span.textContent = node.name;
                let dropdown_root = document.createElement("div");
                dropdown_root.classList.add('dropdown-menu');
                let icon = document.createElement("img");
                icon.classList.add("top-toolbar-item-icon");
                icon.src = node.icon ? node.icon : "";
    
                let showDropdown = () => {
                    const rect = item_root.getBoundingClientRect();
                    const toolbarRect = root.getBoundingClientRect();
        
                    dropdown_root.style.top = `${rect.bottom - toolbarRect.top}px`;
                    dropdown_root.style.left = `${rect.left - toolbarRect.left}px`;
                };
    
                let _this = this;
                item_root_span.addEventListener('click', function(e) {
                    e.stopPropagation(); // イベントの伝播を止める
                    if(_this.mode != "active"){
                        _this.closeAllMenus();
                        if(node.func) node.func();
                        _this.mode = "active";
                        dropdown_root.classList.add("active");
                        showDropdown();
                    }
                });
    
                item_root_span.addEventListener("mouseenter", function(e) {
                    if(_this.mode != "active") return;
                    e.stopPropagation(); // イベントの伝播を止める
                    _this.closeAllMenus();
                    dropdown_root.classList.add("active");
                    showDropdown();
                });
    
                // ドキュメント全体のクリックイベントリスナーを追加
                document.addEventListener('click', function(e) {
                    let result = _this.toolItems.some((v,index,arr) => {
                            if(v.contains(e.target)) return true;
                            return false;
                    })
                    if (!result) {
                        _this.closeAllMenus();
                        _this.mode = "idle";
                    }
                });
    
                node.nodes.forEach((child) => {
                    let item = document.createElement("div");
                    let item_label = document.createElement("p");
                    item_label.classList.add('menu-item-label');
                    let item_icon = document.createElement("img");
                    item_icon.classList.add("menu-item-icon");
                    item_icon.src = child.icon ? child.icon : "assets/icon/save.png";
                    if(child.type == "line"){
                        item_label.textContent = "";
                        item.classList.add('menu-item-line');
                        dropdown_root.appendChild(item);
                    }
                    else{
                        item_label.textContent = child.name;
                        item.classList.add('menu-item');
                        let childNode = child;
                        item.addEventListener('click', function(e) {
                            e.stopPropagation(); // イベントの伝播を止める
                            console.log("child click" + childNode.func)
                            if(childNode.func) childNode.func();
                            _this.closeAllMenus();
                            _this.mode = "idle";
                        });
                        item.appendChild(item_icon);
                        item.appendChild(item_label);
                        dropdown_root.appendChild(item);
                    }
                });
    
                this.dropdowns.push(dropdown_root);
                this.toolItems.push(item_root);
    
                item_root.appendChild(item_root_span);
                item_root.appendChild(dropdown_root)
                root.appendChild(item_root);
            
        }
    }
}