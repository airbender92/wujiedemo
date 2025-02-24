import React, { useContext, useEffect, useRef } from 'react'
import { Input, Tree, message, Spin } from 'antd'
import {
    DoubleLeftOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined
} from '@ant-design/icons'
import { SearchTreeContext } from './SearchTreeContext'
import _ from 'lodash'
import './index.less'


const SearchTree = (props) => {
    const { dispatch, state } = useContext(SearchTreeContext)
    const {
        title,
        btns,
        inlineBtns,
        searchValue,
        searchKeys,
        treeData,
        autoExpandParent,
        dataFlatList,
        isShowHead,
        isShowCollapse,
        draggable,
        checkable,
        matchedColor,
        checkedKeys,
        selectedKeys,
        toggleClick,
        treeProps,
        isCollapsed,
        showSearch,
        rootKey,
        loading,
        placeholder = '请输入'
    } = state;

    const collapseClass = !isCollapsed ? 'phy-tree-box expanded' : 'phy-tree-box no-expanded'

    const showBtns = btns.filter(btn => !!btn.show)

    const showInlineBtns = (inlineBtns || []).filter(btn => !!btn.show)

    // 为了支持多个搜索树的ref;
    const searchTreeRefs = useRef({})

    // 可自定义树结构的ref
    const searchTreeRefKey = props.searchTreeRefKey || 'searchTreeRefKey'

    // 按钮组点击事件
    const handleBtnClick = (btn) => {
        const { eventName, type } = btn;
        if (props[eventName]) {
            // 在编辑删除逻辑时treeData 为空时直接提示
            if (['edit', 'delete'].includes(type) && (treeData || []).length === 0) {
                message.warn('没有可操作的节点')
                return;
            }
            props[eventName](btn);
        }
    };

    // 搜索
    const handleSearchTree = (val) => {
        if (props.onSearch) {
            props.onSearch(val);
            return;
        }
        const value = (val || '').trim();
        const { key, title } = treeProps;
        const expandedKeys = dataFlatList.map(item => {
            if (item[title].indexOf(value) > -1) {
                return getParentKey(item[key], treeData, key)
            }
            return null;
            // 过滤null 并且去重
        }).filter(item => ![null, undefined, ''].includes(item))
            .filter((item, i, self) => self.indexOf(item) === i)

        dispatch({ type: 'onUpdateSearchVal', value })
        dispatch({ type: 'onExpand', expandedKeys, autoExpandParent: true })
    }

    // 展开
    const onExpand = (expandedKeys) => {
        dispatch({ type: 'onExpand', expandedKeys, autoExpandParent: false })
    }

    // 开始拖拽
    const onDragEnter = (info) => {
        if (typeof props.onDragEnter === 'function') {
            props.onDragEnter(info)
        }
    };

    const onDrop = info => {
        if (typeof props.onDrop === 'function') {
            props.onDrop(info);
        } else {
            dispatch({ type: 'onDrop', info, onAfterDrop: props.onAfterDrop })
        }
    };

    const onSelect = (selectedKeys, info) => {
        if (selectedKeys.length === 0) {
            // 点击选中的节点，只要新toggleClick值
            dispatch({ type: 'onUpdateState', toggleClick: !toggleClick })
            return;
        }
        if (typeof props.onSelect === 'function') {
            props.onSelect(selectedKeys, { node: info.node.props.dataRef })
        } else {
            dispatch({ type: 'onSelect', selectedKeys, node: info.node.props.dataRef })
        }
    }

    const onCheck = (checkedKeys, info) => {
        if (typeof props.onCheck === 'function') {
            props.onCheck(checkedKeys, info)

        } else {
            dispatch({ type: 'onCheck', checkedKeys })
        }
    }

    // 树盒子大小改变
    const onToggleCollapsed = () => {
        dispatch({ type: 'onToggleCollapsed' })
    }

    const loop = (datas) => {
        return (datas || []).map(function (d) {
            const { key, title } = treeProps;
            // 避免toLowerCase直接修改原数据
            const _dd = { ...d };
            // 大小写不敏感搜索
            let titleLower = (_dd[title] || '').toLowerCase();
            const searchValueLower = (searchValue || '').toLowerCase();

            // 如果搜索项是要实现多个字段都可以匹配搜索
            const arrayTextLower = (searchKeys || []).map(key => (_dd[key] || '').toLowerCase());
            let arrayTextMatched = false;
            if (arrayTextLower.some(text => text.includes(searchValueLower))) {
                arrayTextMatched = true;
            }

            const index = titleLower?.indexOf(searchValueLower);
            const beforeStr = d[title]?.substring(0, index);
            const afterStr = d[title]?.substring(index + searchValue.length);
            const highlightStr = d[title]?.substring(index, index + searchValue.length);

            const inlineBtnsDom = showInlineBtns && d.key !== rootKey && showInlineBtns.filter(btn => d[btn.iconType])
                .map(btn => {
                    const { title, type: iconType, iconDom } = btn;
                    const textColor = (iconType === 'delete' || iconType === 'inlineDelete')
                        ? 'danger' : 'primary';
                    const IconComponent = (iconType === 'plus'
                        ? PlusOutlined
                        : iconType === 'edit'
                            ? EditOutlined
                            : iconType === 'delete'
                                ? DeleteOutlined
                                : iconDom);
                    if (!IconComponent) {
                        return (
                            <a
                                className={`action-btn text-color ${textColor}`}
                                key={iconType}
                                title={title}
                                onClick={() => handleBtnClick({ ...btn, ...d })}
                                type={iconType}
                            >{title}</a>
                        );
                    }
                    return (
                        <IconComponent
                            className={`action-btn text-color ${textColor}`}
                            key={iconType}
                            title={title}
                            onClick={() => handleBtnClick({ ...btn, ...d })}
                            type={iconType}
                        />
                    );
                });

            const titleText = index > -1 ? (
                <>
                    <span title={d[title]}>
                        {beforeStr}
                        <span className='search-tree-highlight-text' style={{ color: matchedColor }}>{highlightStr}</span>
                        <span className={d.className || ''}>{afterStr}</span>
                    </span>
                    <span className='inline-btns'>{inlineBtnsDom}</span>
                </>
            ) : (
                <>
                    <span className={d.className || ''} title={d[title]}>{d[title]}</span>
                    <span className='inline-btns'>{inlineBtnsDom}</span>
                </>
            );

            if (d.children && d.children.length > 0) {
                const children = loop(d.children);
                return {
                    ...d,
                    key: d[key],
                    title: index > -1 || children.length ? titleText : null,
                    children: children.length ? children : undefined,
                    dataRef: d,
                };
            }

            // 如果有index > -1就正常匹配到的高亮展示，然后如果多字段匹配里有就返回正常的title展示，否则就把title置null
            return index > -1 ?
                { ...d, key: d[key], title: titleText, dataRef: d } :
                arrayTextMatched ?
                    { ...d, key: d[key], title: titleText, dataRef: d } :
                    { ...d, key: d[key], title: null, dataRef: d };
        }).filter(item => !!item.title);

    };

    // 搜索滚动高亮到可视区
    useEffect(() => {
        // 自定义滚动逻辑
        if (typeof props.onScrollToHighlight === 'function') {
            props.onScrollToHighlight(searchTreeRefs);
        } else {
            if (searchValue && searchTreeRefs.current?.searchTreeRefKey) {
                const firstHighlightDom = searchTreeRefs.current?.searchTreeRefKey.querySelectorAll('.search-tree-highlight-text')[0];
                if (firstHighlightDom) {
                    // 此处需要判断是否在iframe中使用，否则有bug，在iframe里使用默认值会导致整体滚动；
                    const isInIframe = window.self!== window.top;
                    if (isInIframe) {
                        firstHighlightDom.scrollIntoView({ block: 'nearest', inline:'start' });
                    } else {
                        firstHighlightDom.scrollIntoView();
                    }
                }
            }
        }
    }, [searchValue]);

    const searchBodyClass = isShowHead? 'dr-f-right-body tree-search-body' : 'dr-f-right-body tree-search-body-no-head';
return (
  <div ref={el => searchTreeRefs.current[searchTreeRefKey] = el} className={`al-cloud-float-left search-tree-outer ${collapseClass}`}>
    <div className={loading? 'search-tree-loading-wrapper isLoading' :'search-tree-loading-wrapper'}>
      <Spin spinning={loading}/>
    </div>
    {
      isShowCollapse? <div className='expand-wrap'>
        <div className='expand-box' onClick={onToggleCollapsed}>
          <div className='icon-box'>
            <DoubleLeftOutlined />
          </div>
        </div>
        </div>
      : null
    }
    <div className='search-tree-wrapper dr-layout-left'>
      {
        isShowHead? <div className='search-tree-top dr-f-left-header '>
          <div className='search-tree-title' title={title}>{title}</div>
          <div className='search-tree-btns'>
            {
              showBtns.map((btn, index) => {
                const {title, iconType } = btn;
                const textColor = (iconType === 'delete' || iconType === 'inlineDelete')? 'danger' : 'primary';
                const IconComponent = iconType === 'plus'? PlusOutlined : iconType === 'edit'? EditOutlined : DeleteOutlined;
                return (
                  <IconComponent className={`action-btn text-color ${textColor}`} key={btn.iconType} title={btn.title} onClick={() => handleBtnClick(btn)} type={iconType} />
                );
              })
            }
          </div>
        </div>
      : null
    }
  <div span={24} className={searchBodyClass}>
  {showSearch &&
    <div className='ai-cloud-float-left-body-search'>
      <Input
        prefix={<SearchOutlined />}
        type='primary'
        placeholder={placeholder}
        onChange={(e) => handleSearchTree(e.target.value)}
        allowClear
      />
    </div>
  }
  <Tree
    className='search-tree-content'
    onExpand={onExpand}
    checkedKeys={checkedKeys}
    selectedKeys={selectedKeys}
    expandedKeys={expandedKeys}
    autoExpandParent={autoExpandParent}
    draggable={draggable}
    checkable={checkable}
    onDragEnter={onDragEnter}
    onDrop={onDrop}
    onSelect={onSelect}
    onCheck={onCheck}
    treeData={loop(treeData)}
  />
</div>
</div>
</div>
)
}

SearchTree.displayName = 'SearchTree';
export default SearchTree;


export function getParentKey(key, tree, treeKey) {
    let parentKey;
    for (let i = 0; i < tree.length; i++) {
        const node = tree[i];
       
        if (node.children) {
          if(node.children.some(item => item[treeKey] === key)){
            parentKey = node[treeKey]
          } else if(getParentKey(key, node.children, treeKey)) {
            parentKey = getParentKey(key, node.children, treeKey)
          }
        }
    }
    return parentKey;
}
