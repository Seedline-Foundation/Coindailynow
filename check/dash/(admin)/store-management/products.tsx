"use client";
import Image from 'next/image';
// Admin Product Management UI
import React, { useEffect, useState } from "react";
import type { Product } from "@/storefront/types/product";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");

  useEffect(() => {
    fetch('/storefront/api/admin/products')
      .then(res => res.json())
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/storefront/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, price, description, image, id: Date.now(), printfulId: 0 }),
    });
    setName(""); setPrice(0); setDescription(""); setImage("");
    setLoading(true);
    fetch('/storefront/api/admin/products')
      .then(res => res.json())
      .then(setProducts)
      .finally(() => setLoading(false));
  };

  return (
    <main>
      <h1>Products</h1>
      <form onSubmit={handleAddProduct} style={{ marginBottom: 24 }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" required />
        <input value={price} onChange={e => setPrice(Number(e.target.value))} placeholder="Price" type="number" min={0} required />
        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" required />
        <input value={image} onChange={e => setImage(e.target.value)} placeholder="Image URL" required />
        <button type="submit">Add Product</button>
      </form>
      {loading ? <p>Loading...</p> : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Price</th>
              <th>Description</th>
              <th>Image</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>{product.name}</td>
                <td>${product.price}</td>
                <td>{product.description}</td>
                <td><Image src={product.image} alt={product.name} width={50} height={50} /> </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
