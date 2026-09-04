import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiShoppingBag,
  FiLayers,
  FiAlertTriangle,
  FiCheckCircle,
  FiPlus,
  FiPackage,
  FiClock,
  FiRefreshCw,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import Card, { StatCard } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import LoadingState from "../../components/ui/LoadingState";
import { getDashboardStats } from "../../api";

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
        fetch("http://localhost:5001/api/orders").then((r) => r.json()),
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
      await fetch(`http://localhost:5001/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <LoadingState message="Loading dispensary and real-time fulfillment telemetry..." rows={4} />;
  }

  const { stats, lowStockMedicines = [] } = data || {};

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-950 via-purple-900 to-slate-900 p-6 sm:p-8 text-white relative overflow-hidden shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-purple-200 mb-3 border border-white/10">
            <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-purple-400 animate-pulse" : "bg-amber-400"}`}></span>
            Pharmacy Dispensing & Inventory Network • Real-Time Active
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            {user?.pharmacyName || user?.name || "MedPlus Prime Pharmacy"}
          </h1>
          <p className="text-sm sm:text-base text-purple-200/90 leading-relaxed">
            License: {user?.licenseId || "PHARM-2026-9901"} • Connected to TriMedi Real-Time Dispensing Engine
          </p>

          <div className="flex flex-wrap gap-3 mt-5">
            <Button
              variant="primary"
              size="sm"
              className="bg-purple-500 hover:bg-purple-400 text-white font-bold"
              onClick={() => navigate("/app/pharmacy/orders")}
              icon={FiShoppingBag}
            >
              Fulfill Orders ({liveOrders.length || 6})
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/15 hover:bg-white/25 text-white border-white/20"
              onClick={() => navigate("/app/pharmacy/inventory")}
              icon={FiLayers}
            >
              Inventory Management
            </Button>
          </div>
        </div>

        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 pointer-events-none hidden md:flex items-center justify-center">
          <FiPackage className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Active Orders"
          value={liveOrders.length || stats?.incomingOrders || 14}
          subtitle="Orders in queue"
          icon={FiShoppingBag}
          color="pharmacy"
        />
        <StatCard
          title="In-Process"
          value={liveOrders.filter((o) => o.status === "Processing").length || 2}
          subtitle="Packaging & labeling"
          icon={FiClock}
          color="brand"
        />
        <StatCard
          title="Dispensed Today"
          value={liveOrders.filter((o) => o.status === "Dispensed" || o.status === "Delivered").length || 28}
          subtitle="Dispatched to patients"
          icon={FiCheckCircle}
          color="emerald"
        />
        <StatCard
          title="Low Stock Alerts"
          value={stats?.lowStockAlerts || 4}
          subtitle="SKUs below threshold"
          icon={FiAlertTriangle}
          color="rose"
        />
      </div>

      {/* Two Column Layout: Orders Fulfillment Queue & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders Queue (2 columns wide) */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 flex items-center justify-center">
                <FiShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Order Fulfillment Queue</h3>
                <p className="text-xs text-slate-400">One-click status updates with live patient notifications</p>
              </div>
            </div>
            <Link
              to="/app/pharmacy/orders"
              className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
            >
              All Orders →
            </Link>
          </div>

          <div className="space-y-3">
            {liveOrders.slice(0, 4).map((ord) => (
              <div
                key={ord._id || ord.orderId}
                className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{ord.orderId || ord._id}</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{ord.patientName}</span>
                    <Badge variant="pharmacy" size="sm">
                      {ord.prescriptionRef || "RX-9041"}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {ord.items?.map((i) => `${i.name} (x${i.qty || i.quantity || 1})`).join(", ") || "Atorvastatin 20mg"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Total: <strong className="text-slate-800 dark:text-slate-200">₹{ord.totalAmount || 480}</strong> • Payment: {ord.paymentMethod?.toUpperCase()} ({ord.paymentStatus || "PAID"})
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold text-slate-500">Status:</span>
                  <select
                    value={ord.status || "Processing"}
                    onChange={(e) => handleUpdateStatus(ord._id || ord.orderId, e.target.value)}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-800 text-purple-900 dark:text-purple-200 font-bold focus:outline-none focus:ring-1 focus:ring-purple-500"
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
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 flex items-center justify-center">
                <FiAlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Low Stock SKUs</h3>
                <p className="text-xs text-slate-400">Replenishment needed</p>
              </div>
            </div>
            <Link
              to="/app/pharmacy/inventory"
              className="text-xs font-semibold text-rose-600 hover:text-rose-700"
            >
              Restock
            </Link>
          </div>

          <div className="space-y-3">
            {lowStockMedicines.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-rose-100 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/20 flex items-center justify-between gap-2"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{item.name}</p>
                  <p className="text-[11px] text-slate-500">Category: {item.category}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400 block">
                    {item.stock} left
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Min: {item.minThreshold}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => navigate("/app/pharmacy/inventory")}
              icon={FiPlus}
            >
              Add New Medicine SKU
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default PharmacyDashboard;
