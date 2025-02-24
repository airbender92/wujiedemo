// 分类树结构配置
export const categoryConfig = {
    title: '参数分类',
    isShowHead: true,
    draggable: true,
    checkable: false,
    autoExpandParent: true,
    defaultExpandAll: true,
    placeholder: '请输入分类名称',
    rootKey: '-1',
    treeProps: { key: 'id', title: 'paramClassificationName' },
    btns: [
        {
            show: true,
            type: 'add',
            title: '新增'
        },
        {
            show: true,
            type: 'edit',
            title: '编辑'
        },
        {
            show: true,
            type: 'delete',
            title: '删除'
        }
    ]
};