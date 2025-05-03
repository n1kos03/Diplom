import { Link } from 'react-router-dom'

const NotFoundPage = () => {
  return (
    <div>
      <h1>404 - Page not found</h1>
      <Link to={"/"}>
        <button>Go backHome</button>
      </Link>
    </div>
  )
}

export default NotFoundPage