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
function generateTreeNode(depth, maxDepth, childCount) {
    const node = {
        key: Math.random().toString(36).substr(2, 9),
        title: generateRandomTitle()
    };
    if (depth < maxDepth) {
        node.children = [];
        for (let i = 0; i < childCount; i++) {
            node.children.push(generateTreeNode(depth + 1, maxDepth, childCount));
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
    const nodesPerLevel = Math.floor(totalNodes / (Math.pow(childCount, maxDepth - 1)));
    for (let i = 0; i < nodesPerLevel; i++) {
        root.children.push(generateTreeNode(1, maxDepth, childCount));
    }
    return root;
}

export default generateTreeNode;