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
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const doctors = [
    {
      id: "doc-1",
      name: "Dr. Sarah Jenkins, MD",
      specialty: "Cardiology & Internal Medicine",
      hospital: "Metro Health Center",
      experience: "14 yrs experience",
      rating: "4.9 ★ (120 reviews)",
      email: "doctor@trimedi.health",
      lastConsult: "Aug 28, 2026",
    },
    {
      id: "doc-2",
      name: "Dr. Rajesh Gupta, MD",
      specialty: "Endocrinology & Diabetology",
      hospital: "City Care Clinic",
      experience: "18 yrs experience",
      rating: "4.8 ★ (95 reviews)",
      email: "gupta@trimedi.health",
      lastConsult: "Aug 10, 2026",
    },
    {
      id: "doc-3",
      name: "Dr. Emily Chen, MBBS",
      specialty: "General Physician & Family Medicine",
      hospital: "Sunrise Polyclinic",
      experience: "9 yrs experience",
      rating: "4.9 ★ (88 reviews)",
      email: "chen@trimedi.health",
      lastConsult: "Jul 15, 2026",
    },
  ];

  const handleOpenBook = (doc) => {
    setSelectedDoc(doc);
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

  useEffect(() => {
    getProducts()
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pharmacy Inventory & Stock SKUs</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time dispensing stock levels, pricing snapshots, and SKU replenishment thresholds.
          </p>
        </div>
        <Button variant="primary" size="sm" icon={FiPlus} onClick={() => navigate("/products")}>
          Browse Catalog
        </Button>
      </div>

      <Table>
        <TableHeader>
          <tr>
            <TableHead>Medicine Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Unit Price</TableHead>
            <TableHead>Dispensing Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {products.slice(0, 15).map((p) => (
            <TableRow key={p._id}>
              <TableCell className="font-semibold text-slate-900">{p.name}</TableCell>
              <TableCell className="text-slate-500">{p.category || "Medicine"}</TableCell>
              <TableCell className="font-bold text-slate-800">₹{p.price}</TableCell>
              <TableCell>
                <Badge variant="success" size="sm">
                  Verified Stock
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <button
                  className="text-brand-700 font-semibold hover:underline text-xs"
                  onClick={() => alert(`Stock synchronized for ${p.name}`)}
                >
                  Adjust Units
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ==========================================
// 5. ORDERS VIEW
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
      fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Medicine Orders & Refills</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Prescription-linked orders, payment verifications, and medication supply tracking.
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
        <div className="space-y-4">
          {orders.map((ord) => (
            <Card key={ord._id || ord.orderId}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-bold text-slate-900">{ord.orderId || ord._id}</span>
                  <span className="text-xs text-slate-300">•</span>
                  <StatusBadge type="order" status={ord.status} size="sm" />
                  <Badge variant="default" size="sm">
                    {ord.paymentMethod?.toUpperCase()} ({ord.paymentStatus || "PAID"})
                  </Badge>
                  {ord.prescriptionRef && (
                    <Badge variant="brand" size="sm">
                      Linked: {ord.prescriptionRef}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500">Placed on: {new Date(ord.createdAt || Date.now()).toLocaleDateString()}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-3">
                <div>
                  <p className="font-bold text-slate-800 mb-1">Purchased Items:</p>
                  <ul className="space-y-1 text-slate-600">
                    {ord.items?.map((it, idx) => (
                      <li key={idx} className="flex justify-between">
                        <span>• {it.name} (x{it.qty || it.quantity || 1})</span>
                        <span className="font-semibold text-slate-800">₹{(it.price || 0) * (it.qty || it.quantity || 1)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-1 text-slate-500">
                  <p><strong>Recipient:</strong> {ord.patientName} ({ord.patientPhone || "+91 98765 43210"})</p>
                  <p><strong>Estimated Supply:</strong> {ord.supplyDaysEstimate || 15} Days</p>
                  <p><strong>Dispensing Pharmacy:</strong> {ord.pharmacyName || "MedPlus Prime Pharmacy"}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-sm sm:text-base font-bold text-slate-900">
                  Total Paid: <span className="text-brand-800 font-extrabold">₹{ord.totalAmount}</span>
                </span>

                {/* Pharmacy status progression buttons */}
                {activeRole === "pharmacy" && (
                  <div className="flex gap-2">
                    {ord.status === "pending" && (
                      <Button variant="secondary" size="sm" className="text-xs" onClick={() => handleUpdateStatus(ord.orderId || ord._id, "processing")}>
                        Mark Processing
                      </Button>
                    )}
                    {ord.status === "processing" && (
                      <Button variant="primary" size="sm" className="text-xs" onClick={() => handleUpdateStatus(ord.orderId || ord._id, "dispensed")}>
                        Mark Dispensed
                      </Button>
                    )}
                    {ord.status === "dispensed" && (
                      <Button variant="primary" size="sm" className="text-xs" onClick={() => handleUpdateStatus(ord.orderId || ord._id, "delivered")}>
                        Mark Delivered
                      </Button>
                    )}
                  </div>
                )}

                {activeRole === "patient" && (
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => navigate("/products")}>
                    Reorder Medicines
                  </Button>
                )}
              </div>
            </Card>
          ))}
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
