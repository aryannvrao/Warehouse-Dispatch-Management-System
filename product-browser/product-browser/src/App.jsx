
import ProductsPage from './pages/ProductsPage.jsx'
import {Routes, Route, Link} from 'react-router'
import BrowsePage from './pages/BrowsePage.jsx'
import ProductDetailPage from './pages/ProductDetailPage.jsx'
function App() {
 
  return (
    <>
      <nav>
        <Link to="/">all products</Link> | 
        <Link to="/browse">browse products</Link>
      </nav>
      <Routes>
        <Route path="/" element={<ProductsPage />} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/products/:productId" element={<ProductDetailPage />} />
        <Route path="*" element={<h1>Page not found 404</h1>} />
      </Routes>
    </>
  )
}

export default App
