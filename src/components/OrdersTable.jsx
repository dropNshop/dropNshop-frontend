import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { updateOrderStatus } from '../services/api';
import toast from 'react-hot-toast';

export default function OrdersTable({ orders, onOrderUpdate }) {
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingStatus(orderId);
      await updateOrderStatus(orderId, newStatus);
      toast.success('Order status updated successfully');
      onOrderUpdate();
    } catch (error) {
      toast.error(error.message || 'Failed to update order status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-PK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white shadow overflow-hidden rounded-xl">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer Info
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <React.Fragment key={`order-${order.id}`}>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-indigo-100 rounded-full">
                        <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          Order #{order.id}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(order.order_date)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{order.username}</div>
                    <div className="text-sm text-gray-500">{order.email}</div>
                    <div className="text-sm text-gray-500">{order.phone_number}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      Rs. {parseFloat(order.total_amount).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.items.length} item(s)
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      disabled={updatingStatus === order.id}
                      className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(
                        order.status
                      )} border-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50`}
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                      className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                    >
                      {expandedOrder === order.id ? 'Hide Details' : 'View Details'}
                    </button>
                  </td>
                </tr>
                {expandedOrder === order.id && (
                  <tr key={`order-details-${order.id}`} className="bg-gray-50">
                    <td colSpan="5" className="px-6 py-4">
                      <div className="border rounded-lg bg-white p-4">
                        <h4 className="text-lg font-medium text-gray-900 mb-4">Order Details</h4>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <h5 className="text-sm font-medium text-gray-500">Delivery Address</h5>
                            <p className="text-sm text-gray-900 mt-1">{order.delivery_address}</p>
                          </div>
                          <div>
                            <h5 className="text-sm font-medium text-gray-500">Order Type</h5>
                            <p className="text-sm text-gray-900 mt-1">
                              {order.is_online_order ? 'Online Order' : 'In-Store Order'}
                            </p>
                          </div>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-gray-500 mb-2">Items</h5>
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {order.items.map((item) => (
                                <tr key={item.product_id}>
                                  <td className="px-3 py-2">
                                    <div className="text-sm text-gray-900">{item.product_name}</div>
                                    <div className="text-xs text-gray-500">{item.description}</div>
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-900">{item.quantity}</td>
                                  <td className="px-3 py-2 text-sm text-gray-900">
                                    Rs. {parseFloat(item.unit_price).toLocaleString()}
                                  </td>
                                  <td className="px-3 py-2 text-sm font-medium text-gray-900">
                                    Rs. {parseFloat(item.item_total).toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-gray-50">
                              <tr>
                                <td colSpan="3" className="px-3 py-2 text-sm font-medium text-gray-900 text-right">
                                  Total Amount:
                                </td>
                                <td className="px-3 py-2 text-sm font-medium text-gray-900">
                                  Rs. {parseFloat(order.total_amount).toLocaleString()}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

OrdersTable.propTypes = {
  orders: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      status: PropTypes.string.isRequired,
      order_date: PropTypes.string.isRequired,
      username: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
      phone_number: PropTypes.string.isRequired,
      total_amount: PropTypes.string.isRequired,
      delivery_address: PropTypes.string.isRequired,
      is_online_order: PropTypes.number.isRequired,
      items: PropTypes.arrayOf(
        PropTypes.shape({
          product_id: PropTypes.number.isRequired,
          quantity: PropTypes.number.isRequired,
          unit_price: PropTypes.string.isRequired,
          product_name: PropTypes.string.isRequired,
          description: PropTypes.string.isRequired,
          item_total: PropTypes.string.isRequired,
        })
      ).isRequired,
    })
  ).isRequired,
  onOrderUpdate: PropTypes.func.isRequired,
}; 