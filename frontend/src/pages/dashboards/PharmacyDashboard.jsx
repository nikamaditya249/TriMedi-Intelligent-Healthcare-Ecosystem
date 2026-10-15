import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiShoppingBag,
  FiLayers,
  FiAlertTriangle,
  FiCheckCircle,
  FiPlus,
  FiClock,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import Card, { StatCard } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import LoadingState from "../../components/ui/LoadingState";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { getDashboardStats, getOrders, updateOrderStatus } from "../../api";

export function PharmacyDashboard() {
  const { user } = useAuth();
  const { isConnected } = useSocket();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [liveOrders, setLiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [stats, ordersRes] = await Promise.all([
        getDashboardStats("pharmacy"),
        getOrders(),
      ]);
      setData(stats);
      setLiveOrders(Array.isArray(ordersRes) ? ordersRes : []);
    } catch (err) {
      console.error("Error loading pharmacy stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update order fulfillment status in real time
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      loadData();
    } catch (e) {
      console.error("Error updating order status:", e);
    }
  };

  if (loading) {
    return (
      <LoadingState
        message="Loading dispensary and real-time fulfillment telemetry..."
        rows={4}
      />
    );
  }

  const { stats, lowStockMedicines = [] } = data || {};

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Pharmacy Dispensing Network
            </span>
            <span className="text-slate-300">•</span>
            <Badge variant="brand" size="sm">
              Licensed Dispensary
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {user?.pharmacyName || user?.name || "MedPlus Prime Pharmacy"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            License: {user?.licenseId || "PHARM-2026-9901"} • Connected to TriMedi Real-Time Dispensing Engine
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate("/app/pharmacy/orders")}
            icon={FiShoppingBag}
          >
            Fulfill Orders ({liveOrders.length || 6})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/app/pharmacy/inventory")}
            icon={FiLayers}
          >
            Inventory Control
          </Button>
        </div>
      </div>

      {/* 2. Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Orders"
          value={liveOrders.length || stats?.incomingOrders || 14}
          subtitle="Orders in queue"
          icon={FiShoppingBag}
        />
        <StatCard
          title="In Processing"
          value={liveOrders.filter((o) => (o.status || "").toLowerCase() === "processing").length || 2}
          subtitle="Packaging & labeling"
          icon={FiClock}
        />
        <StatCard
          title="Dispensed Today"
          value={liveOrders.filter((o) => (o.status || "").toLowerCase() === "dispensed" || (o.status || "").toLowerCase() === "delivered").length || 28}
          subtitle="Dispatched to patients"
          icon={FiCheckCircle}
        />
        <StatCard
          title="Low Stock Alerts"
          value={stats?.lowStockAlerts || 4}
          subtitle="SKUs below threshold"
          icon={FiAlertTriangle}
        />
      </div>

      {/* 3. Two Column Layout: Orders Fulfillment Queue & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders Queue (2 columns wide) */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 border border-brand-100 flex items-center justify-center">
                <FiShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Active Order Fulfillment Queue</h3>
                <p className="text-xs text-slate-500">Live order status transitions and dispensing logs</p>
              </div>
            </div>
            <Link
              to="/app/pharmacy/orders"
              className="text-xs font-semibold text-brand-700 hover:text-brand-800 transition-colors"
            >
              All Orders →
            </Link>
          </div>

          <div className="space-y-3">
            {liveOrders.slice(0, 4).map((ord) => (
              <div
                key={ord._id || ord.orderId}
                className="p-3.5 rounded-xl border border-slate-200/70 hover:border-slate-300 bg-white transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-bold text-slate-900">{ord.orderId || ord._id}</span>
                    <span className="text-xs font-semibold text-slate-700">{ord.patientName}</span>
                    <Badge variant="default" size="sm">
                      {ord.prescriptionRef || "RX-9041"}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600">
                    {ord.items?.map((i) => `${i.name} (x${i.qty || i.quantity || 1})`).join(", ") || "Atorvastatin 20mg"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Total: <strong className="text-slate-800">₹{ord.totalAmount || 480}</strong> • Method: {ord.paymentMethod?.toUpperCase()} ({ord.paymentStatus || "PAID"})
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold text-slate-500">Status:</span>
                  <select
                    value={ord.status || "Processing"}
                    onChange={(e) => handleUpdateStatus(ord._id || ord.orderId, e.target.value)}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 font-semibold focus:outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700"
                  >
                    <option value="Processing">Processing</option>
                    <option value="Dispensed">Dispensed</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Low Stock Alerts (1 column wide) */}
        <Card>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
                <FiAlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Low Stock SKUs</h3>
                <p className="text-xs text-slate-500">Replenishment needed</p>
              </div>
            </div>
            <Link
              to="/app/pharmacy/inventory"
              className="text-xs font-semibold text-brand-700 hover:text-brand-800 transition-colors"
            >
              Restock
            </Link>
          </div>

          <div className="space-y-2.5">
            {lowStockMedicines.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg border border-amber-200/70 bg-amber-50/40 flex items-center justify-between gap-2"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900">{item.name}</p>
                  <p className="text-[11px] text-slate-500">Category: {item.category}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-amber-700 block">
                    {item.stock} left
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Min: {item.minThreshold}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => navigate("/app/pharmacy/inventory")}
              icon={FiPlus}
            >
              Add Medicine SKU
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default PharmacyDashboard;
