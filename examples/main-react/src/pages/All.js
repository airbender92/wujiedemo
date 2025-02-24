import React, { useContext, useEffect } from 'react';
import SearchTree from '../components/SearchTree';
import { SearchTreeContext } from '../components/SearchTree/SearchTreeContext';

import { categoryConfig } from './treeConfig';

import { SearchTreeProvider } from '../components/SearchTree/SeatchTreeProvider'
import generateTreeNode from '../components/SearchTree/generateData'


const CategoryTree = () => {

  const treeContext = useContext(SearchTreeContext);
  const { dispatch } = treeContext;

  // 初始化配置
  const handleInitConfig = () => {
    dispatch({ type: 'onInitCfg', ...categoryConfig });
  };

  /*
  获取数据
  */
  const handleInitData = async () => {
    const result = generateTreeNode(100, 4, 3);
    dispatch({
      type: 'setTreeData',
      treeData: result
    });
  };

  useEffect(() => {
    handleInitConfig();
    handleInitData();
  }, []);

  return (

    <SearchTree />
  )
}

const All = () => {
  return <SearchTreeProvider>
    <div className='param-wrapper'>
      <CategoryTree />
    </div>

  </SearchTreeProvider>
}




export default All;
