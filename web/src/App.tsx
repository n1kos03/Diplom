import { useState } from 'react'

function App() {
  const [squares, setSquare] = useState(Array(9).fill(''))
  const [whichTurn, setTurn] = useState(true)

  function handleClick(i) {
    const nextSquares = squares.slice()
    if (squares[i] || calculateWinner(squares)) {
      return
    }
    if (whichTurn) {
      nextSquares[i] = 'X'
    } else {
      nextSquares[i] = 'O'
    }
    setSquare(nextSquares)
    setTurn(!whichTurn)
  }

  const winner = calculateWinner(squares)

  return (
  <>
    <div className="winner">{winner + ' wins'}</div>
    <div className="board-row">
      <Squere value={squares[0]} onSquareClick={() =>handleClick(0)}/>
      <Squere value={squares[1]} onSquareClick={() => handleClick(1)}/>
      <Squere value={squares[2]} onSquareClick={() => handleClick(2)}/>
    </div>
    <div className="board-row">
      <Squere value={squares[3]} onSquareClick={() => handleClick(3)}/>
      <Squere value={squares[4]} onSquareClick={() => handleClick(4)}/>
      <Squere value={squares[5]} onSquareClick={() => handleClick(5)}/>
    </div>
    <div className="board-row">
      <Squere value={squares[6]} onSquareClick={() => handleClick(6)}/>
      <Squere value={squares[7]} onSquareClick={() => handleClick(7)}/>
      <Squere value={squares[8]} onSquareClick={() => handleClick(8)}/>
    </div>
  </>
  )
}

function Squere({value, onSquareClick} : {value: string, onSquareClick: () => void}) {
  return <button className="square" onClick={onSquareClick}>{value}</button>
}

function calculateWinner(squares: string[]) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ]
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i]
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares [a]
    }
  }
  return null
}

export default App
