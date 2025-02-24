import React from 'react'

export const SearchTreeContext = React.createContext(null)

if(process.env.NODE_ENV !== 'production') {
    SearchTreeContext.displayName = 'SearchTreeContext'
}