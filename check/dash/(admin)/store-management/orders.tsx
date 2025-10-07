// Admin Orders Management UI
'use client';
import React, { useEffect, useState } from "react";

type Order = {
  id: string;
  items: Array<{
    productId: number;
    variantId?: number;
    quantity: number;
  }>;
  total: number;
  status: string;
  createdAt: string;
  customer: {
    name: string;
    email: string;
    address: string;
  };
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/storefront/api/admin/orders')
      .then(res => res.json())
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main>
      <h1>Orders</h1>
      {loading ? <p>Loading...</p> : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.customer.name} ({order.customer.email})</td>
                <td>${order.total.toFixed(2)}</td>
                <td>{order.status}</td>
                <td>{new Date(order.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
