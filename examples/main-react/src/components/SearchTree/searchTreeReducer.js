import { message } from 'antd';

export const searchTreeReducer = (state, action) => {
    switch (action.type) {
        case 'onInitCfg': {
            const { btns, inlineBtns, rootKey, treeProps = { key: 'key', title: 'title' }, ...restCfg } = action;
            const formatBtns = handleBtns(btns);
            const formatInlineBtns = handleBtns(inlineBtns);
            delete restCfg.type;
            return {
                ...state,
                ...restCfg,
                rootKey,
                treeProps,
                selectedKeys: rootKey ? [rootKey] : [],
                btns: formatBtns,
                inlineBtns: formatInlineBtns,
                activeNode: rootKey ? {
                    key: rootKey,
                    title: '全部',
                    [treeProps.key]: rootKey,
                    [treeProps.title]: '全部'
                } : null
            };
        }
        case 'setTreeData': {
            // initWithSelectedNode 是默认指定的选中节点
            const { treeData, initWithSelectedNode } = action;
            const { rootKey, treeProps: { key = 'key', title = 'title' } } = state;
            let { dataFlatList, defaultExpandedKeys } = generateFlatList([...(treeData || [])], key, title);
            let activeNode = state.activeNode;
            let selectedKeys = state.selectedKeys;
            if (state.activeNode) {
                const matched = dataFlatList.find(item => item[key] === activeNode[key]);
                if (matched) {
                    activeNode = matched;
                } else {
                    if (rootKey) {
                        activeNode = {
                            key: rootKey,
                            title: '全部',
                            [key]: rootKey,
                            [title]: '全部'
                        };
                        selectedKeys = [rootKey]
                    }
                }
            } else {
                if (rootKey) {
                    activeNode = {
                        key: rootKey,
                        title: '全部',
                        [key]: rootKey,
                        [title]: '全部'
                    };
                    selectedKeys = [rootKey];
                } else {
                    activeNode = dataFlatList[0];
                    if (!activeNode) {
                        selectedKeys = [];
                    } else {
                        selectedKeys = [activeNode[key]];
                    }
                }
            }
            if ((treeData || []).length === 0) {
                activeNode = null;
                selectedKeys = [];
            }
            // 如果有默认指定的高亮节点，用于返回到列表页高亮原来的节点
            if (initWithSelectedNode) {
                activeNode = initWithSelectedNode.activeNode;
                selectedKeys = initWithSelectedNode.selectedKeys;
            }
            return {
                ...state,
                dataFlatList,
                activeNode,
                selectedKeys,
                treeData,
                expandedKeys: state.defaultExpandAll ? defaultExpandedKeys : state.expandedKeys
            };
        }
        case 'onUpdateSearchVal': {
            const { value } = action;
            return {
                ...state,
                searchValue: value
            };
        }
        case 'onExpand': {
            const { expandedKeys, autoExpandParent } = action;
            return {
                ...state,
                expandedKeys,
                autoExpandParent
            };
        }
        case 'onSelect': {
            const { selectedKeys } = action;
            const { dataFlatList, toggleClick, treeData, treeProps: { key: treeKey } } = state;
            const matched = dataFlatList.find(item => item[treeKey] === selectedKeys[0]);
            console.time('calcParentNode');
            // 获取父节点node
            const parentNode = getParentNode(selectedKeys[0], treeData, treeKey);
            console.timeEnd('calcParentNode')
            console.log('parentNode', parentNode)
            return {
                ...state,
                selectedKeys,
                parentNode,
                activeNode: matched,
                toggleClick: !toggleClick
            };
        }
        case 'onCheck': {
            const { checkedKeys } = action;
            return {
                ...state,
                checkedKeys
            };
        }
        case 'onDragEnter': {
            return state;
        }
        case 'onDrop': {
            const { info, onAfterDrop } = action;
            const { data, next } = handleOnDrop(info, state);
            if (onAfterDrop && next) {
                onAfterDrop(data);
            }
            return {
                ...state,
                treeData: data
            };
        }

        case 'onToggleCollapsed': {
            return {
                ...state,
                isCollapsed: !state.isCollapsed
            };
        }
        case 'onUpdateState': {
            const { ...restAction } = action;
            delete restAction.type;
            return {
                ...state,
                ...(restAction || {})
            };
        }
        case 'onUpdateBtns': {
            const { btns } = action;
            const formatBtns = handleBtns(btns);
            return {
                ...state,
                btns: formatBtns
            };
        }
        default:
            throw new Error();
    }
}


export const initialSearchTree = {
    loading: false,
    title: '',
    btns: [],
    searchValue: '',
    // 多字段匹配搜索，比如搜索时既要按title匹配，又要按attr1匹配，可以这样使用searchKeys: ['title', 'attr1']
    searchKeys: undefined,
    matchedColor: 'inherit',
    // 根节点key(通常是'全部' 默认-1，不可拖拽，页不可放置其上)
    rootKey: '',
    // 树key title映射
    treeProps: { key: 'key', title: 'title' },
    selectedKeys: [],
    checkedKeys: [],
    expandedKeys: [],
    treeData: [],
    autoExpandParent: false,
    activeNode: null,
    parentNode: null,
    dataFlatList: [],
    isShowHead: true,
    isShowCollapse: false,
    showSearch: true,
    draggable: false,
    checkable: false,
    cantDropMessage: '',
    isCollapsed: false,
    toggleClick: false,
};


// capital first letter of a string
function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// 格式化按钮组参数
function handleBtns(btns) {
    (btns || []).forEach(btn => {
        const { type } = btn;
        if (type === 'add') {
            btn.iconType = 'plus';
            btn.eventName = 'onAdd';
        } else if (type === 'edit') {
            btn.iconType = 'edit';
            btn.eventName = 'onEdit';
        } else if (type === 'delete') {
            btn.iconType = 'delete';
            btn.eventName = 'onDelete';
        } else {
            const capitalString = capitalizeFirstLetter(type);
            btn.iconType = type;
            btn.eventName = `on${capitalString}`;
        }
    });
    return btns;
}

// 生成展平数据
function generateFlatList(datas, key = 'key', title = 'title') {
    const dataFlatList = [];
    const defaultExpandedKeys = [];

    function gener(data) {
        for (let i = 0; i < data.length; i++) {
            const node = data[i];
            dataFlatList.push({
                ...node,
                key: node[key],
                title: node[title]
            });
            if (node.children) {
                defaultExpandedKeys.push(node[key]);
                gener(node.children);
            }
        }
    }
    gener(datas);
    return { dataFlatList, defaultExpandedKeys };
}

function handleOnDrop(info, state) {
    const { key: nodeKey } = state.treeProps;
    const dropKey = info.node.props.eventKey;
    const dragKey = info.dragNode.props.eventKey;
    const dragPos = info.dragNode.props.pos.split('-');
    const dropPos = info.node.props.pos.split('-');
    /**
     * 0 - 放置在节点元素上
     * 1 - 放置在目标元素的下方（目标元素为gap上方的元素）
     * -1 - 放置在目标元素的上方（目标元素为gap下方的元素）
     */
    const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);
    // 根节点禁止拖拽
    if (dragKey === state.rootKey) {
        message.warning('当前节点禁止拖拽');
        return { data: state.treeData, next: false };
    }
    // 禁止节点放置在根节点之上（根节点之上的位置,此时目标元素为gap下方的元素）
    if (dropKey === state.rootKey && dropPosition === -1) {
        message.warning('当前位置禁止放置');
        return { data: state.treeData, next: false };
    }
    // 只能同层级拖拽
    if (dragPos.length !== dropPos.length ||
        dragPos.slice(0, dragPos.length - 1).join('-') !==
        dropPos.slice(0, dropPos.length - 1).join('-')) {
        message.warning(state.cantDropMessage || '仅同层级节点可拖拽排序');
        return { data: state.treeData, next: false };
    }
    const loop = (data, key, callback) => {
        data.forEach((item, index, arr) => {
            if (item[nodeKey] === key) {
                return callback(item, index, arr);
            }
            if (item.children) {
                return loop(item.children, key, callback);
            }
        });
    };
    const data = [...state.treeData]
    if (!info.dropToGap) {
        return { data, next: true }
    }

    // find dragObject
    let dragObj;
    loop(data, dragKey, (item, index, arr) => {
        arr.splice(index, 1);
        dragObj = item;
    });

    if (!info.dropToGap) {
        // Drop on the content
        loop(data, dropKey, item => {
            item.children = item.children || [];
            item.children.push(dragObj);
        });
    } else if (
        (info.node.props.children || []).length > 0 &&
        info.node.props.expanded &&
        dropPosition === -1
    ) {
        loop(data, dropKey, item => {
            item.children = item.children || [];
            item.children.unshift(dragObj);
        });
    } else {
        let ar;
        let i;
        loop(data, dropKey, (item, index, arr) => {
            ar = arr;
            i = index;
        });
        if (dropPosition === -1) {
            ar.splice(i, 0, dragObj);
        } else {
            ar.splice(i + 1, 0, dragObj);
        }
    }
    return { data, next: true };
}


function getParentNode (nodeKey, treeData, treeKey) {
    const stack = [...treeData];
    while(stack.length > 0){
        const node = stack.pop();
        if(node.children) {
            if(node.children.some(item => item[treeKey] === nodeKey)) {
                return node;
            }
            stack.push(...node.children)
        }
    }
    return null;
}