import { useState, useEffect } from 'react';
import { Link } from 'react-router';


export default function ProductsPage() {
    const[products, setProducts] = useState([]);
    useEffect(() => {
        async function loadProducts() {
            const response = await fetch('https://dummyjson.com/products');
            const data = await response.json();
            setProducts(data.products);
        }
        loadProducts();
    }, []);
    return (
        <>
        <p>{products.length} products found</p>
        <ul>
            {products.map(product => (
                <li key={product.id}>
                    <h2>{product.title}</h2>
                    <p>{product.description}</p>
                    <p>Price: ${product.price}</p>
                    <p>Rating: {product.rating}</p>
                    <p>{product.reviews.length} reviews</p>
                    <img src={product.thumbnail} alt={product.title} />
                    <Link to={`/products/${product.id}`}>View Details</Link>
                </li>
            ))}
        </ul>
        </>
    );
}
// cd "product-browser"
// npm run dev