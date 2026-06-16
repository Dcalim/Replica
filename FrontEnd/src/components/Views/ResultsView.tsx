import React from 'react'
import { useAppDispatch } from '../../store/store'
import { setCurrentView } from '../../reducers/ui'
import { VIEWS } from '../../models/constant'

const ResultsView = () => {
  const dispatch = useAppDispatch();

  return (
    <div>
      {/* <button onClick={() => dispatch(setCurrentView(VIEWS.UPLOAD))}>Upload</button> */}
      <h1>Results</h1>
    </div>
  )
}

export default ResultsView
