import React from 'react'
import './Result.css' // si tu préfères séparer le CSS

const Result = ({ estimate }) => {
  return (
    <div className="result-container">
      <h2 className="speed-effect text-4xl font-bold text-green-500 mt-6">
        💰 Estimation du prix : {estimate} MAD
      </h2>
    </div>
  )
}

export default Result
