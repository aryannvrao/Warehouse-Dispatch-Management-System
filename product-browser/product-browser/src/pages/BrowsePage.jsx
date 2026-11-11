import {useState, useEffect} from 'react'

function BrowsePage() {
  const [products, setProducts] = useState([])
  const [page, setPage] = useState(1)

  useEffect(() => {
    async function loadProducts() {
      const response = await fetch(`https://dummyjson.com/products?limit=10&skip=${(page - 1) * 10}`)
      const data = await response.json()
      setProducts(data.products)
    }
    loadProducts()
  }, [page]);
  return (
    <>
    <button onClick={() => setPage(page - 1)} disabled={page === 1}>Previous</button>
    <span>Page {page}</span>
    <button onClick={() => setPage(page + 1)}>Next</button>

    <ul>
      {products.map(product => (
        <li key={product.id}>
            <img src={product.thumbnail} alt={product.title} />
          <h3>{product.title}</h3>
          <p>{product.description}</p>
        </li>
      ))}
    </ul>
    </>
    )
}

export default BrowsePage