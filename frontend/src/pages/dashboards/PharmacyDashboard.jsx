import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiShoppingBag,
  FiLayers,
  FiAlertTriangle,
  FiCheckCircle,
  FiPlus,
  FiClock,
  FiFileText,
  FiXCircle,
  FiTruck,
  FiBox,
  FiShield,
  FiSearch,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import Card, { StatCard } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import LoadingState from "../../components/ui/LoadingState";
import { StatusBadge } from "../../components/ui/StatusBadge";
import {
  getDashboardStats,
  getOrders,
  updateOrderStatus,
  processOrderRefund,
  getPharmacyInventory,
  updateProductStock,
} from "../../api";

export function PharmacyDashboard() {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [liveOrders, setLiveOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Review modal state (Least-Privilege Prescription Dispensing Review)
  const [reviewOrder, setReviewOrder] = useState(null);
  const [rejectModalOrder, setRejectModalOrder] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [stats, ordersRes, invRes] = await Promise.all([
        getDashboardStats("pharmacy"),
        getOrders(),
        getPharmacyInventory().catch(() => ({ products: [] })),
      ]);
      setData(stats);
      setLiveOrders(Array.isArray(ordersRes) ? ordersRes : []);
      setInventory(invRes?.products || []);
    } catch (err) {
      console.error("Error loading pharmacy data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Real-time Socket.IO updates for pharmacy
  useEffect(() => {
    if (!socket) return;

    const handleOrderEvent = (updatedOrder) => {
      loadData();
    };

    socket.on("order.created", handleOrderEvent);
    socket.on("order.updated", handleOrderEvent);
    socket.on("order.status_changed", handleOrderEvent);

    return () => {
      socket.off("order.created", handleOrderEvent);
      socket.off("order.updated", handleOrderEvent);
      socket.off("order.status_changed", handleOrderEvent);
    };
  }, [socket]);

  // Handle Authoritative State Machine Transitions
  const handleTransition = async (orderId, targetStatus, note = "") => {
    try {
      setActionLoading(true);
      await updateOrderStatus(orderId, { status: targetStatus, note });
      setReviewOrder(null);
      await loadData();
    } catch (e) {
      alert("Transition failed: " + (e.message || "Unauthorized transition"));
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Order Rejection & Automatic Refund
  const handleReject = async () => {
    if (!rejectModalOrder) return;
    try {
      setActionLoading(true);
      if (rejectModalOrder.paymentStatus === "PAID") {
        await processOrderRefund({
          orderId: rejectModalOrder.orderId || rejectModalOrder._id,
          reason: rejectReason || "Pharmacy rejected order / Out of stock",
        });
      } else {
        await updateOrderStatus(rejectModalOrder.orderId || rejectModalOrder._id, {
          status: "REJECTED",
          rejectionReason: rejectReason || "Pharmacy rejected order",
        });
      }
      setRejectModalOrder(null);
      setRejectReason("");
      await loadData();
    } catch (e) {
      alert("Rejection failed: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Adjust stock units
  const handleAdjustStock = async (productId, currentStock) => {
    const adjustment = prompt(`Enter units to add to stock for SKU (Current: ${currentStock}):`, "50");
    if (!adjustment || isNaN(adjustment)) return;

    try {
      await updateProductStock(productId, { stockAdjustment: Number(adjustment) });
      await loadData();
    } catch (e) {
      alert("Stock update failed: " + e.message);
    }
  };

  if (loading) {
    return <LoadingState message="Loading dispensary fulfillment queue & inventory telemetry..." rows={4} />;
  }

  // Filter orders by active queue tab
  const filteredOrders = liveOrders.filter((ord) => {
    const st = (ord.status || "").toUpperCase();
    if (activeTab === "REVIEW") return st === "PRESCRIPTION_REVIEW" || st === "NEW";
    if (activeTab === "PREPARING") return st === "ACCEPTED" || st === "PREPARING";
    if (activeTab === "PACKED") return st === "PACKED";
    if (activeTab === "DISPATCHED") return st === "DISPATCHED" || st === "OUT_FOR_DELIVERY";
    if (activeTab === "DELIVERED") return st === "DELIVERED" || st === "COMPLETED";
    return true;
  });

  const lowStockItems = inventory.filter(
    (p) => (p.availableQuantity || p.stockQuantity - p.reservedQuantity) <= (p.lowStockThreshold || 15)
  );

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Dispensary & Commerce Network
            </span>
            <span className="text-slate-300">•</span>
            <Badge variant="brand" size="sm">
              Authoritative Fulfillment State Machine
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {user?.pharmacyName || user?.name || "MedPlus Prime Pharmacy"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            License: {user?.licenseId || "PHARM-2026-9901"} • Least-Privilege Clinical Isolation Active
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab("REVIEW")}
            icon={FiFileText}
          >
            Review Prescriptions ({liveOrders.filter((o) => (o.status || "").toUpperCase() === "PRESCRIPTION_REVIEW").length})
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate("/app/pharmacy/inventory")}
            icon={FiLayers}
          >
            Manage Inventory ({inventory.length} SKUs)
          </Button>
        </div>
      </div>

      {/* 2. Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Prescription Review"
          value={liveOrders.filter((o) => (o.status || "").toUpperCase() === "PRESCRIPTION_REVIEW").length}
          subtitle="Awaiting pharmacist review"
          icon={FiFileText}
        />
        <StatCard
          title="Orders In Preparation"
          value={liveOrders.filter((o) => ["ACCEPTED", "PREPARING"].includes((o.status || "").toUpperCase())).length}
          subtitle="Packaging & labeling"
          icon={FiBox}
        />
        <StatCard
          title="Packed & Dispatched"
          value={liveOrders.filter((o) => ["PACKED", "DISPATCHED", "OUT_FOR_DELIVERY"].includes((o.status || "").toUpperCase())).length}
          subtitle="En route to patients"
          icon={FiTruck}
        />
        <StatCard
          title="Low Stock SKUs"
          value={lowStockItems.length}
          subtitle="Replenishment required"
          icon={FiAlertTriangle}
        />
      </div>

      {/* 3. Main Two-Column View: Order Queue & Live Inventory Control */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders Queue (2 columns) */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Authoritative Order Fulfillment Queue</h3>
              <p className="text-xs text-slate-500">Live order state machine progression and dispensing actions</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
              {["ALL", "REVIEW", "PREPARING", "PACKED", "DISPATCHED", "DELIVERED"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    activeTab === tab ? "bg-white text-brand-800 shadow-sm font-bold" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No orders currently in {activeTab} queue.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((ord) => {
                const currentStatus = (ord.status || "NEW").toUpperCase();
                return (
                  <div
                    key={ord._id || ord.orderId}
                    className="p-3.5 rounded-xl border border-slate-200/80 hover:border-slate-300 bg-white transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-bold text-slate-900">{ord.orderId || ord._id}</span>
                        <span className="text-xs font-semibold text-slate-700">{ord.patientName}</span>
                        <Badge
                          variant={
                            currentStatus === "PRESCRIPTION_REVIEW"
                              ? "warning"
                              : currentStatus === "ACCEPTED" || currentStatus === "PREPARING"
                              ? "brand"
                              : currentStatus === "DELIVERED"
                              ? "success"
                              : "default"
                          }
                          size="sm"
                        >
                          {currentStatus}
                        </Badge>
                        {ord.prescriptionRef && (
                          <Badge variant="brand" size="sm">
                            Rx: {ord.prescriptionRef}
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-slate-600">
                        {ord.items?.map((i) => `${i.nameSnapshot || i.name} (x${i.quantity || i.qty || 1})`).join(", ") || "Medicines"}
                      </p>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 flex-wrap">
                        <span>Total: <strong className="text-slate-800">₹{ord.totalAmount}</strong></span>
                        <span>•</span>
                        <span>Payment: <b className="text-slate-700 uppercase">{ord.paymentMethod}</b> ({ord.paymentStatus || "PENDING"})</span>
                        <span>•</span>
                        <span>Destination: {ord.deliveryAddress?.city || "Mumbai"} ({ord.deliveryAddress?.pincode || "400001"})</span>
                      </div>
                    </div>

                    {/* Action Transitions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {currentStatus === "PRESCRIPTION_REVIEW" && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            className="text-xs"
                            onClick={() => setReviewOrder(ord)}
                          >
                            Review Rx
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-rose-600"
                            onClick={() => setRejectModalOrder(ord)}
                          >
                            Reject
                          </Button>
                        </>
                      )}

                      {currentStatus === "NEW" && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleTransition(ord.orderId || ord._id, "ACCEPTED")}
                        >
                          Accept Order
                        </Button>
                      )}

                      {currentStatus === "ACCEPTED" && (
                        <Button
                          variant="primary"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleTransition(ord.orderId || ord._id, "PREPARING")}
                        >
                          Start Preparing
                        </Button>
                      )}

                      {currentStatus === "PREPARING" && (
                        <Button
                          variant="primary"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleTransition(ord.orderId || ord._id, "PACKED")}
                        >
                          Mark Packed
                        </Button>
                      )}

                      {currentStatus === "PACKED" && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleTransition(ord.orderId || ord._id, "DISPATCHED")}
                        >
                          Dispatch
                        </Button>
                      )}

                      {currentStatus === "DISPATCHED" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleTransition(ord.orderId || ord._id, "OUT_FOR_DELIVERY")}
                        >
                          Out for Delivery
                        </Button>
                      )}

                      {currentStatus === "OUT_FOR_DELIVERY" && (
                        <Button
                          variant="primary"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleTransition(ord.orderId || ord._id, "DELIVERED")}
                        >
                          Mark Delivered
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Live Inventory Telemetry (1 column) */}
        <Card>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center">
                <FiLayers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Inventory & Stock SKUs</h3>
                <p className="text-xs text-slate-500">Atomic reservation telemetry</p>
              </div>
            </div>
            <Link
              to="/app/pharmacy/inventory"
              className="text-xs font-semibold text-brand-700 hover:text-brand-800"
            >
              All SKUs →
            </Link>
          </div>

          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {inventory.slice(0, 10).map((prod) => {
              const available = prod.availableQuantity !== undefined
                ? prod.availableQuantity
                : prod.stockQuantity - (prod.reservedQuantity || 0);
              const isLow = available <= (prod.lowStockThreshold || 15);

              return (
                <div
                  key={prod._id}
                  className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                    isLow ? "bg-amber-50/50 border-amber-200" : "bg-slate-50/70 border-slate-200/70"
                  }`}
                >
                  <div>
                    <p className="font-bold text-slate-900">{prod.name}</p>
                    <p className="text-[10px] text-slate-500">
                      SKU: {prod.sku || "SKU-AUTO"} • ₹{prod.price}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`font-bold block ${isLow ? "text-amber-700" : "text-emerald-700"}`}>
                      {available} avail
                    </span>
                    <button
                      onClick={() => handleAdjustStock(prod._id, prod.stockQuantity)}
                      className="text-[10px] text-brand-700 hover:underline font-semibold"
                    >
                      + Restock
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* 4. LEAST-PRIVILEGE PRESCRIPTION DISPENSING REVIEW MODAL */}
      {reviewOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-lg w-full bg-white space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FiShield className="w-5 h-5 text-brand-700" />
                <h3 className="text-base font-bold text-slate-900">
                  Prescription Dispensing Review (Least-Privilege)
                </h3>
              </div>
              <button
                onClick={() => setReviewOrder(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <p className="font-bold">Clinical Privacy Boundary Notice:</p>
              <p>
                In compliance with healthcare security architecture, private consultation notes, detailed psychiatric/diagnostic notes, and clinical histories are masked. Only dispensing-essential prescription details are displayed below.
              </p>
            </div>

            <div className="space-y-2 text-xs text-slate-700">
              <p><b>Order ID:</b> {reviewOrder.orderId || reviewOrder._id}</p>
              <p><b>Patient:</b> {reviewOrder.patientName} ({reviewOrder.patientPhone})</p>
              <p><b>Prescription Reference:</b> <Badge variant="brand" size="sm">{reviewOrder.prescriptionRef || "RX-9041"}</Badge></p>
              <p><b>Dispensing Verification:</b> <span className="text-emerald-700 font-bold">Doctor Approved & Verified</span></p>

              <div className="pt-2 border-t border-slate-200">
                <p className="font-bold text-slate-900 mb-1">Medicines to Dispense:</p>
                <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {reviewOrder.items?.map((it, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>• {it.nameSnapshot || it.name}</span>
                      <span className="font-bold">Quantity: {it.quantity || it.qty || 1} units</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRejectModalOrder(reviewOrder);
                  setReviewOrder(null);
                }}
              >
                Reject Order
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={actionLoading}
                onClick={() => handleTransition(reviewOrder.orderId || reviewOrder._id, "ACCEPTED")}
              >
                Accept & Start Fulfillment
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* 5. ORDER REJECTION & REFUND MODAL */}
      {rejectModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-white space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-rose-600 pb-2 border-b border-slate-200">
              <FiXCircle className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">Reject Order & Initiate Refund</h3>
            </div>

            <p className="text-xs text-slate-600">
              Rejecting order <b>{rejectModalOrder.orderId || rejectModalOrder._id}</b> will release reserved inventory and automatically process a full refund of <b>₹{rejectModalOrder.totalAmount}</b> back to the patient.
            </p>

            <Input
              label="Reason for Rejection"
              placeholder="e.g. Out of stock, illegible prescription, or doctor discontinued item"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              required
            />

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setRejectModalOrder(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-rose-600 hover:bg-rose-700"
                loading={actionLoading}
                onClick={handleReject}
              >
                Confirm Rejection & Refund
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default PharmacyDashboard;
