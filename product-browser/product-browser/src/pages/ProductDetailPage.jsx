import { useEffect, useState } from 'react'
import {Link,useParams} from 'react-router'

function ProductDetailPage() {
    const {productId} = useParams();
    const [product, setProduct] = useState(null);

    useEffect(() => {
        async function loadProduct() {
            const response = await fetch(`https://dummyjson.com/products/${productId}`);
            const data = await response.json();
            setProduct(data);
        }
        loadProduct();
    }, [productId]);

    if (!product) {
        return <p>Loading...</p>;
    }

    return (
        <>
            <Link to="/">Back to Products</Link>
            <div>
                <h1>{product.title}</h1>
                <p>{product.description}</p>
                <p>Price: ${product.price}</p>
                <p>Rating: {product.rating}</p>
                <img src={product.thumbnail} alt={product.title} />
                <section>
                    <h2>Reviews</h2>
                    {product.reviews?.length ? (
                        product.reviews.map((review, index) => (
                            <article key={`${review.reviewerEmail}-${review.date}-${index}`}>
                                <h3>{review.reviewerName}</h3>
                                <p>Rating: {review.rating}</p>
                                <p>{review.comment}</p>
                                <time dateTime={review.date}>{review.date}</time>
                            </article>
                        ))
                    ) : (
                        <p>No reviews available.</p>
                    )}
                </section>
            </div>
        </>
    );
}
export default ProductDetailPage