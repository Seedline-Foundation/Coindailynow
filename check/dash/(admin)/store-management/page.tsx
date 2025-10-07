// Admin Store Management Dashboard
import React from "react";

export default function StoreManagementPage() {
  return (
    <main>
      <h1>Store Management</h1>
      <ul>
        <li><a href="/storefront/api/admin/products">Manage Products</a></li>
        <li><a href="/storefront/api/admin/orders">View Orders</a></li>
        <li><a href="/storefront/api/admin/settings">Store Settings</a></li>
      </ul>
      {/* Add product management, order list, and settings UI here */}
    </main>
  );
}
