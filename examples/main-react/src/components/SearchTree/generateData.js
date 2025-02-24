// 生成随机字符串作为节点的标题
function generateRandomTitle() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < 5; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

// 递归生成树节点
function generateTreeNode(depth, maxDepth, childCount, remainingNodes) {
    const node = {
        key: Math.random().toString(36).substr(2, 9),
        title: generateRandomTitle()
    };
    if (depth < maxDepth && remainingNodes > 0) {
        node.children = [];
        const childrenToGenerate = Math.min(childCount, remainingNodes);
        for (let i = 0; i < childrenToGenerate; i++) {
            const nodesLeft = remainingNodes - i - 1;
            node.children.push(generateTreeNode(depth + 1, maxDepth, childCount, Math.floor(nodesLeft / childCount)));
        }
    }
    return node;
}

// 生成根节点
function generateTreeData(totalNodes, maxDepth, childCount) {
    const root = {
        key: 'root',
        title: 'Root Node',
        children: []
    };
    let remainingNodes = totalNodes;
    while (remainingNodes > 0) {
        const nodesToGenerate = Math.min(childCount, remainingNodes);
        for (let i = 0; i < nodesToGenerate; i++) {
            root.children.push(generateTreeNode(1, maxDepth, childCount, Math.floor((remainingNodes - i - 1) / childCount)));
        }
        remainingNodes -= nodesToGenerate;
    }
    return root;
}

export default generateTreeData;