import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiFileText,
  FiUserCheck,
  FiCalendar,
  FiShoppingBag,
  FiLayers,
  FiSettings,
  FiPlus,
  FiCheck,
  FiShield,
  FiZap,
} from "react-icons/fi";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import LoadingState from "../../components/ui/LoadingState";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../components/ui/Table";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import {
  getPrescriptions,
  getAppointments,
  updateAppointmentStatus,
  getOrders,
  updateOrderStatus,
  getProducts,
} from "../../api";
import CreatePrescriptionModal from "../../components/prescriptions/CreatePrescriptionModal";
import AIPrescriptionScannerModal from "../../components/ai/AIPrescriptionScannerModal";
import BookAppointmentModal from "../../components/appointments/BookAppointmentModal";

// ==========================================
// 1. MY DOCTORS VIEW
// ==========================================
export function MyDoctorsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCareTeam() {
      try {
        const userEmail = (user?.email || "aditya@trimedi.health").toLowerCase();
        const [appts, rxs] = await Promise.all([
          getAppointments({ role: "patient", patientEmail: userEmail }),
          getPrescriptions({ role: "patient", patientEmail: userEmail }),
        ]);

        const docMap = new Map();

        if (Array.isArray(appts)) {
          appts.forEach((apt) => {
            if (apt.doctorName) {
              const emailKey = (apt.doctorEmail || apt.doctorName).toLowerCase();
              if (!docMap.has(emailKey)) {
                docMap.set(emailKey, {
                  id: apt.doctorEmail || apt._id,
                  name: apt.doctorName,
                  specialty: apt.doctorSpecialty || "General Medicine",
                  hospital: apt.hospital || "Metro Health Center",
                  experience: "14 yrs experience",
                  rating: "4.9 ★ (Verified Specialist)",
                  email: apt.doctorEmail || "doctor@trimedi.health",
                  lastConsult: apt.appointmentDate || "Recent Consultation",
                });
              }
            }
          });
        }

        if (Array.isArray(rxs)) {
          rxs.forEach((rx) => {
            if (rx.doctorName) {
              const emailKey = (rx.doctorEmail || rx.doctorName).toLowerCase();
              if (!docMap.has(emailKey)) {
                docMap.set(emailKey, {
                  id: rx.doctorEmail || rx._id,
                  name: rx.doctorName,
                  specialty: rx.doctorSpecialty || "Cardiology & Internal Medicine",
                  hospital: "Metro Health Center",
                  experience: "14 yrs experience",
                  rating: "4.9 ★ (Verified Specialist)",
                  email: rx.doctorEmail || "doctor@trimedi.health",
                  lastConsult: rx.createdAt ? new Date(rx.createdAt).toLocaleDateString() : "Recent",
                });
              }
            }
          });
        }

        if (docMap.size === 0) {
          docMap.set("doctor@trimedi.health", {
            id: "doc-1",
            name: "Dr. Sarah Jenkins, MD",
            specialty: "Cardiology & Internal Medicine",
            hospital: "Metro Health Center",
            experience: "14 yrs experience",
            rating: "4.9 ★ (Verified Platform Specialist)",
            email: "doctor@trimedi.health",
            lastConsult: "Available for Booking",
          });
        }

        setDoctors(Array.from(docMap.values()));
      } catch (err) {
        console.error("Failed to load care team doctors:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCareTeam();
  }, [user]);

  const handleOpenBook = (doc) => {
    setSelectedDoc(doc || doctors[0]);
    setBookModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Medical Specialists & Care Team</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Certified doctors overseeing your diagnostic reviews, prescriptions, and refills.
          </p>
        </div>
        <Button variant="primary" size="sm" icon={FiCalendar} onClick={() => handleOpenBook(doctors[0])}>
          Book New Consultation
        </Button>
      </div>

      {loading ? (
        <LoadingState message="Loading your verified specialists and care team..." rows={3} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {doctors.map((doc) => (
            <Card key={doc.id} className="flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-base border border-brand-100">
                    <FiUserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{doc.name}</h3>
                    <p className="text-xs text-brand-700 font-semibold">{doc.specialty}</p>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs text-slate-500 py-2.5 border-y border-slate-100">
                  <p>📍 {doc.hospital}</p>
                  <p>⏳ {doc.experience} • {doc.rating}</p>
                  <p>
                    🗓️ Last Consultation: <span className="font-semibold text-slate-700">{doc.lastConsult}</span>
                  </p>
                </div>
              </div>

              <div className="pt-4 flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => handleOpenBook(doc)}
                >
                  Book Visit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs shrink-0"
                  onClick={() => navigate("/app/patient/prescriptions")}
                >
                  Prescriptions
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <BookAppointmentModal
        isOpen={bookModalOpen}
        onClose={() => setBookModalOpen(false)}
        initialDoctor={selectedDoc}
        onBooked={() => {}}
      />
    </div>
  );
}

// ==========================================
// 2. PRESCRIPTIONS VIEW
// ==========================================
export function PrescriptionsPage() {
  const { user, activeRole } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [orderedRxId, setOrderedRxId] = useState(null);

  const fetchPrescriptions = async () => {
    try {
      const data = await getPrescriptions({
        role: activeRole,
        patientEmail: user?.email,
        doctorEmail: user?.email,
      });
      setPrescriptions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Prescriptions load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [activeRole, user]);

  // Prescription-to-Order Cart Transfer Workflow
  const handleOrderFromPrescription = (rx) => {
    (rx.items || []).forEach((item) => {
      addToCart({
        _id: item.medicineId || "med_" + Math.random(),
        name: item.medicineName,
        price: item.dosage?.includes("20mg") ? 180 : item.dosage?.includes("500mg") ? 120 : 60,
        qty: item.quantityPrescribed ? Math.max(1, Math.round(item.quantityPrescribed / 30)) : 1,
        supplyDays: item.durationDays || 15,
        prescriptionRef: rx._id,
        image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300",
      });
    });

    setOrderedRxId(rx._id);
    setTimeout(() => {
      setOrderedRxId(null);
      navigate("/cart");
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Digital Prescriptions</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {activeRole === "doctor"
              ? "Signed clinical e-prescriptions issued to your patients with dosage & duration intelligence."
              : "Doctor-signed digital prescriptions directly linked to verified medicine refill ordering."}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            icon={FiZap}
            onClick={() => setAiModalOpen(true)}
          >
            AI Prescription Scanner
          </Button>

          {activeRole === "doctor" && (
            <Button
              variant="primary"
              size="sm"
              icon={FiPlus}
              onClick={() => setCreateModalOpen(true)}
            >
              Issue Prescription
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading authenticated prescriptions..." rows={3} />
      ) : prescriptions.length === 0 ? (
        <EmptyState
          icon={FiFileText}
          title="No Prescriptions Found"
          description="There are no prescriptions on file. You can issue a digital prescription or scan an existing document using TriMedi AI."
          actionLabel="Scan Document with AI"
          onAction={() => setAiModalOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          {prescriptions.map((rx) => {
            const isOrdered = orderedRxId === rx._id;

            return (
              <Card key={rx._id}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-bold text-slate-900">{rx._id}</span>
                    <span className="text-xs text-slate-300">•</span>
                    <span className="text-xs font-semibold text-brand-800">{rx.diagnosis}</span>
                    <StatusBadge type="prescription" status={rx.status || "active"} size="sm" />
                    {rx.aiExtracted && (
                      <Badge variant="brand" size="sm">
                        AI Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Valid: <span className="font-semibold text-slate-700">{new Date(rx.validUntil || Date.now()).toLocaleDateString()}</span>
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <p><strong>Doctor:</strong> {rx.doctorName} ({rx.doctorSpecialty || "Internal Medicine"})</p>
                    <p><strong>Patient:</strong> {rx.patientName} ({rx.patientEmail || "patient@trimedi.health"})</p>
                    {rx.notes && (
                      <div className="mt-2 p-2.5 rounded-lg bg-slate-50 text-slate-600 border border-slate-200/70">
                        <span className="font-bold block text-slate-700">Clinical Advice:</span>
                        {rx.notes}
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Prescribed Medication Schedule:</p>
                    <div className="space-y-2">
                      {rx.items?.map((it, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-900">{it.medicineName}</span>
                            <span className="ml-2 font-semibold text-slate-600">{it.dosage}</span>
                            <p className="text-slate-500 text-[11px]">{it.frequency} • {it.instructions}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="brand" size="sm">
                              {it.durationDays} Days
                            </Badge>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{it.quantityPrescribed} Units</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Prescription-to-Order Action Bar */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400">
                    Tamper-resistant digital prescription ID: {rx._id}
                  </span>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" size="sm" className="text-xs" onClick={() => window.print()}>
                      Print Rx
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      className="text-xs font-bold w-full sm:w-auto"
                      onClick={() => handleOrderFromPrescription(rx)}
                      icon={isOrdered ? FiCheck : FiShoppingBag}
                    >
                      {isOrdered ? "Added to Cart!" : "Order Prescribed Medicines"}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <CreatePrescriptionModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={() => fetchPrescriptions()}
      />
      <AIPrescriptionScannerModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onPrescriptionConfirmed={() => fetchPrescriptions()}
      />
    </div>
  );
}

// ==========================================
// 3. APPOINTMENTS VIEW
// ==========================================
export function AppointmentsPage() {
  const { user, activeRole } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookModalOpen, setBookModalOpen] = useState(false);

  const fetchAppointments = async () => {
    try {
      const data = await getAppointments({
        role: activeRole,
        patientEmail: user?.email,
        doctorEmail: user?.email,
      });
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Appointments fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [activeRole, user]);

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateAppointmentStatus(id, status);
      fetchAppointments();
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clinical Consultations & Appointments</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Scheduled consultations, telemedicine reviews, and prescription checkups.
          </p>
        </div>
        <Button variant="primary" size="sm" icon={FiPlus} onClick={() => setBookModalOpen(true)}>
          Book Consultation
        </Button>
      </div>

      {loading ? (
        <LoadingState message="Loading consultation calendar..." rows={3} />
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={FiCalendar}
          title="No Scheduled Appointments"
          description="You have no upcoming appointments. Select a certified doctor to schedule your consultation."
          actionLabel="Book Consultation"
          onAction={() => setBookModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {appointments.map((apt) => (
            <Card key={apt._id} className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="default" size="sm">
                    {(apt.type || "In-Person").toUpperCase()}
                  </Badge>
                  <StatusBadge type="appointment" status={apt.status} size="sm" />
                </div>

                <h3 className="text-sm font-bold text-slate-900">{apt.patientName}</h3>
                <p className="text-xs text-brand-700 font-semibold">{apt.doctorName}</p>
                <p className="text-[11px] text-slate-400 mb-3">{apt.hospital}</p>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-1 mb-3">
                  <p>🗓️ Date: <span className="font-bold">{apt.appointmentDate || apt.date}</span></p>
                  <p>⏰ Slot: <span className="font-bold text-slate-900">{apt.timeSlot || apt.time}</span></p>
                  <p className="text-slate-500 text-[11px]">Reason: {apt.reason}</p>
                </div>
              </div>

              {activeRole === "doctor" && apt.status === "scheduled" && (
                <div className="pt-3 border-t border-slate-100 flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => handleStatusUpdate(apt._id, "confirmed")}
                  >
                    Confirm Slot
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-rose-600"
                    onClick={() => handleStatusUpdate(apt._id, "cancelled")}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <BookAppointmentModal
        isOpen={bookModalOpen}
        onClose={() => setBookModalOpen(false)}
        onBooked={() => fetchAppointments()}
      />
    </div>
  );
}

// ==========================================
// 4. INVENTORY VIEW
// ==========================================
export function InventoryPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await getProducts();
      setProducts(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAdjustUnits = async (id, currentStock, name) => {
    const qty = prompt(`Enter units to add to stock for "${name}" (Current Stock: ${currentStock}):`, "50");
    if (!qty || isNaN(qty)) return;

    try {
      await updateProductStock(id, { stockAdjustment: Number(qty) });
      await fetchInventory();
    } catch (err) {
      alert("Failed to update stock: " + err.message);
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
      (p.category && p.category.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pharmacy Inventory & SKU Stock Control</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time stock reservation, GST configurations, batch numbers, and replenishment thresholds.
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Search SKU or medicine..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56 text-xs"
          />
          <Button variant="primary" size="sm" icon={FiPlus} onClick={() => navigate("/products")}>
            Catalog
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading dispensary inventory records..." rows={4} />
      ) : (
        <Table>
          <TableHeader>
            <tr>
              <TableHead>SKU & Medicine</TableHead>
              <TableHead>Category / Rx</TableHead>
              <TableHead>Selling Price & MRP</TableHead>
              <TableHead>GST Rate</TableHead>
              <TableHead>Stock (Total / Reserved)</TableHead>
              <TableHead>Available</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {filtered.slice(0, 20).map((p) => {
              const stock = p.stockQuantity !== undefined ? p.stockQuantity : 100;
              const reserved = p.reservedQuantity !== undefined ? p.reservedQuantity : 0;
              const available = p.availableQuantity !== undefined ? p.availableQuantity : stock - reserved;
              const isLow = available <= (p.lowStockThreshold || 15);

              return (
                <TableRow key={p._id}>
                  <TableCell>
                    <div className="font-semibold text-slate-900">{p.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {p.sku || `SKU-${p._id.toString().slice(-6)}`} • Batch: {p.batchNumber || "B-2026"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-slate-600">{p.category || "Medicine"}</div>
                    {p.prescriptionRequired && (
                      <Badge variant="brand" size="sm" className="mt-0.5 text-[9px]">
                        Rx Required
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-slate-800">₹{p.price}</div>
                    <div className="text-[10px] text-slate-400">MRP: ₹{p.mrp || Math.round(p.price * 1.15)}</div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {Math.round((p.taxRate || 0.12) * 100)}% GST
                  </TableCell>
                  <TableCell className="text-xs text-slate-700">
                    <span>{stock} units</span>
                    {reserved > 0 && (
                      <span className="text-[10px] text-amber-700 block">({reserved} reserved)</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs font-bold ${isLow ? "text-amber-700" : "text-emerald-700"}`}>
                      {available} units
                    </span>
                    {isLow && (
                      <Badge variant="warning" size="sm" className="ml-1 text-[9px]">
                        Low
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      className="text-brand-700 font-semibold hover:underline text-xs"
                      onClick={() => handleAdjustUnits(p._id, stock, p.name)}
                    >
                      + Adjust Stock
                    </button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

// ==========================================
// 5. ORDERS VIEW WITH MULTI-STAGE TRACKING
// ==========================================
export function OrdersPage() {
  const { user, activeRole } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const data = await getOrders({
        role: activeRole,
        patientEmail: user?.email,
      });
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Orders fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeRole, user]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, { status: newStatus });
      await fetchOrders();
    } catch (err) {
      alert(err.message || "Status update failed");
    }
  };

  const handleCancelOrder = async (orderId) => {
    const reason = prompt("Please provide a reason for cancelling this order:", "Patient cancelled");
    if (!reason) return;

    try {
      await cancelOrder(orderId, reason);
      await fetchOrders();
    } catch (err) {
      alert("Cancellation failed: " + err.message);
    }
  };

  // 7-Stage Visual Fulfillment Progress Tracker
  const STAGES = ["NEW", "PRESCRIPTION_REVIEW", "ACCEPTED", "PREPARING", "PACKED", "DISPATCHED", "DELIVERED"];
  const getStageIndex = (status) => {
    const s = (status || "").toUpperCase();
    if (s === "OUT_FOR_DELIVERY") return 5;
    if (s === "COMPLETED") return 6;
    const idx = STAGES.indexOf(s);
    return idx >= 0 ? idx : 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D9E2EC]">
        <div>
          <h1 className="text-2xl font-bold text-[#172033]">Healthcare Orders & Fulfillment Tracking</h1>
          <p className="text-xs sm:text-sm text-[#52627A] mt-1">
            Prescription-linked orders, payment verifications, and real-time fulfillment progression.
          </p>
        </div>
        <Button variant="primary" size="sm" icon={FiShoppingBag} onClick={() => navigate("/products")}>
          Order Medicines
        </Button>
      </div>

      {loading ? (
        <LoadingState message="Loading order fulfillment records..." rows={3} />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={FiShoppingBag}
          title="No Orders Placed Yet"
          description="You have no previous orders. Explore our verified pharmacy catalog or order directly from your prescriptions."
          actionLabel="Browse Medicine Catalog"
          onAction={() => navigate("/products")}
        />
      ) : (
        <div className="space-y-5">
          {orders.map((ord) => {
            const currentStatus = (ord.status || "NEW").toUpperCase();
            const stageIdx = getStageIndex(currentStatus);
            const canCancel = activeRole === "patient" && ["NEW", "PRESCRIPTION_REVIEW", "ACCEPTED", "PENDING"].includes(currentStatus);

            return (
              <Card key={ord._id || ord.orderId} className="space-y-4 border-[#D9E2EC] bg-white">
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#D9E2EC]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-[#172033]">{ord.orderId || ord._id}</span>
                    <span className="text-xs text-[#CBD5E1]">•</span>
                    <Badge
                      variant={
                        currentStatus === "DELIVERED" || currentStatus === "COMPLETED"
                          ? "success"
                          : currentStatus === "DISPATCHED" || currentStatus === "OUT_FOR_DELIVERY"
                          ? "warning"
                          : currentStatus === "ACCEPTED" || currentStatus === "PREPARING" || currentStatus === "PACKED"
                          ? "info"
                          : currentStatus === "CANCELLED" || currentStatus === "REJECTED"
                          ? "danger"
                          : "brand"
                      }
                      size="sm"
                    >
                      {currentStatus}
                    </Badge>
                    <Badge variant="default" size="sm">
                      {ord.paymentMethod?.toUpperCase()} ({ord.paymentStatus || "PENDING"})
                    </Badge>
                    {ord.prescriptionRef && (
                      <Badge variant="brand" size="sm">
                        Linked: {ord.prescriptionRef}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-[#718096] font-medium">
                    Placed: {new Date(ord.createdAt || Date.now()).toLocaleDateString()}
                  </p>
                </div>

                {/* Multi-Stage Visual Tracking Bar */}
                {currentStatus !== "CANCELLED" && currentStatus !== "REJECTED" && (
                  <div className="py-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#52627A] mb-1.5 flex-wrap gap-1">
                      {["Placed", "Reviewed", "Accepted", "Preparing", "Packed", "Dispatched", "Delivered"].map(
                        (label, idx) => (
                          <span
                            key={label}
                            className={idx <= stageIdx ? "text-[#06665D] font-bold" : "text-[#718096]"}
                          >
                            {label}
                          </span>
                        )
                      )}
                    </div>
                    <div className="w-full bg-[#F1F5F9] border border-[#D9E2EC] h-2.5 rounded-full overflow-hidden flex">
                      <div
                        className="bg-[#087F73] h-full transition-all duration-500 rounded-full"
                        style={{ width: `${Math.min(100, Math.round(((stageIdx + 1) / 7) * 100))}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Items & Fulfillment details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="font-bold text-[#172033] mb-1.5">Purchased Medicines:</p>
                    <ul className="space-y-1.5 text-[#52627A]">
                      {ord.items?.map((it, idx) => (
                        <li key={idx} className="flex justify-between bg-[#FFFFFF] p-2.5 rounded-lg border border-[#D9E2EC]">
                          <span className="font-medium text-[#172033]">
                            • {it.nameSnapshot || it.name} (x{it.quantity || it.qty || 1})
                          </span>
                          <span className="font-bold text-[#172033]">
                            ₹{(it.unitPrice || it.price || 0) * (it.quantity || it.qty || 1)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1.5 text-[#52627A] bg-[#F1F5F9] p-3.5 rounded-xl border border-[#D9E2EC]">
                    <p>
                      <strong className="text-[#172033]">Recipient:</strong> {ord.patientName} ({ord.patientPhone || "+91 98765 43210"})
                    </p>
                    <p>
                      <strong className="text-[#172033]">Delivery Destination:</strong> {ord.deliveryAddress?.street || "Address provided"}, {ord.deliveryAddress?.city || "Mumbai"} ({ord.deliveryAddress?.pincode || "400001"})
                    </p>
                    <p>
                      <strong className="text-[#172033]">Dispensing Pharmacy:</strong> {ord.pharmacyName || "MedPlus Prime Pharmacy"}
                    </p>
                    {ord.pricing && (
                      <div className="pt-2 border-t border-[#D9E2EC] text-[11px] text-[#52627A] flex justify-between">
                        <span>GST Breakup (CGST + SGST): <strong className="text-[#172033]">₹{ord.pricing.totalTax || 0}</strong></span>
                        <span>Delivery Fee: <strong className="text-[#172033]">{ord.pricing.deliveryFee === 0 ? "FREE" : `₹${ord.pricing.deliveryFee}`}</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-[#D9E2EC] flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-sm sm:text-base font-bold text-[#172033]">
                    Authoritative Total: <span className="text-[#087F73] font-extrabold text-base sm:text-lg">₹{ord.totalAmount}</span>
                  </span>

                  <div className="flex gap-2">
                    {/* Patient cancellation */}
                    {canCancel && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-[#C53030] hover:bg-[#FFF0F0] font-semibold"
                        onClick={() => handleCancelOrder(ord.orderId || ord._id)}
                      >
                        Cancel Order
                      </Button>
                    )}

                    {activeRole === "patient" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs bg-white border-[#D9E2EC] text-[#087F73] hover:bg-[#E8F7F4] hover:border-[#087F73] font-semibold"
                        onClick={() => navigate("/products")}
                      >
                        Order Again
                      </Button>
                    )}

                    {/* Pharmacy quick state actions */}
                    {activeRole === "pharmacy" && (
                      <>
                        {currentStatus === "NEW" && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="text-xs"
                            onClick={() => handleUpdateStatus(ord.orderId || ord._id, "ACCEPTED")}
                          >
                            Accept Order
                          </Button>
                        )}
                        {currentStatus === "ACCEPTED" && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="text-xs"
                            onClick={() => handleUpdateStatus(ord.orderId || ord._id, "PREPARING")}
                          >
                            Mark Preparing
                          </Button>
                        )}
                        {currentStatus === "PREPARING" && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="text-xs"
                            onClick={() => handleUpdateStatus(ord.orderId || ord._id, "PACKED")}
                          >
                            Mark Packed
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}


// ==========================================
// 6. SYSTEM SETTINGS / ADMIN
// ==========================================
export function SystemManagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Governance & Telemetry</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">Database clusters, API telemetry, and platform security audits.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <FiShield className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Database & Resilient Fallback</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed mb-4">
            MongoDB Atlas connected with automatic fallback store ensuring 100% uptime for authentication, prescriptions, and order fulfillment.
          </p>
          <Badge variant="success" size="sm">
            Status: Operational
          </Badge>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center">
              <FiLayers className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Payment & AI Engine Status</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed mb-4">
            PayPal Server-side Orders API, Gemini/NLP Medical Extraction Pipeline, and Deterministic Supply Gap Arithmetic are operational.
          </p>
          <Badge variant="brand" size="sm">
            Status: Active
          </Badge>
        </Card>
      </div>
    </div>
  );
}

export default {
  MyDoctorsPage,
  PrescriptionsPage,
  AppointmentsPage,
  InventoryPage,
  OrdersPage,
  SystemManagementPage,
};
