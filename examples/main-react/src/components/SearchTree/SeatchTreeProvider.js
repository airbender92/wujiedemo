import React, { useReducer } from'react';
import { SearchTreeContext } from './SearchTreeContext';
import { searchTreeReducer, initialSearchTree } from './searchTreeReducer';

export const SearchTreeProvider = (props) => {
    const { children } = props;
    const [state, dispatch] = useReducer(searchTreeReducer, initialSearchTree);
    return (
        <SearchTreeContext.Provider value={{ state, dispatch }}>
            {children}
        </SearchTreeContext.Provider>
    );
};