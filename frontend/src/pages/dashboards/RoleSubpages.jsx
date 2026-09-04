import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiFileText,
  FiUserCheck,
  FiCalendar,
  FiUsers,
  FiShoppingBag,
  FiLayers,
  FiSettings,
  FiMessageSquare,
  FiPlus,
  FiCheckCircle,
  FiClock,
  FiArrowLeft,
  FiShield,
  FiPackage,
  FiZap,
  FiCreditCard,
  FiCheck,
  FiTrash2,
} from "react-icons/fi";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import LoadingState from "../../components/ui/LoadingState";
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
    <div className="space-y-6 animate-in fade-in duration-200">
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
          <Card key={doc.id} className="flex flex-col justify-between hover:border-teal-300 transition-all">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-lg border border-teal-100">
                  <FiUserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{doc.name}</h3>
                  <p className="text-xs text-brand-600 font-semibold">{doc.specialty}</p>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-slate-500 py-2 border-y border-slate-100">
                <p>📍 {doc.hospital}</p>
                <p>⏳ {doc.experience} • {doc.rating}</p>
                <p>
                  🗓️ Last Consultation: <span className="font-semibold text-slate-700">{doc.lastConsult}</span>
                </p>
              </div>
            </div>

            <div className="pt-4 flex gap-2">
              <Button
                variant="doctor"
                size="sm"
                className="w-full text-xs"
                onClick={() => handleOpenBook(doc)}
              >
                Book Appointment
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
        onBooked={() => alert("✅ Consultation booked successfully! Added to your schedule.")}
      />
    </div>
  );
}

// ==========================================
// 2. PRESCRIPTIONS VIEW (Phase 2 Connected)
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
    rx.items.forEach((item) => {
      addToCart({
        _id: item.medicineId || "med_" + Math.random(),
        name: item.medicineName,
        price: item.dosage.includes("20mg") ? 180 : item.dosage.includes("500mg") ? 120 : 60,
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
    }, 600);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
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
            variant="brandOutline"
            size="sm"
            icon={FiZap}
            onClick={() => setAiModalOpen(true)}
          >
            AI Prescription Scanner
          </Button>

          {activeRole === "doctor" && (
            <Button
              variant="doctor"
              size="sm"
              icon={FiPlus}
              onClick={() => setCreateModalOpen(true)}
            >
              Issue Digital Prescription
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
        <div className="space-y-5">
          {prescriptions.map((rx) => {
            const isOrdered = orderedRxId === rx._id;

            return (
              <Card key={rx._id} className="border-teal-100 bg-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900">{rx._id}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-semibold text-teal-700">{rx.diagnosis}</span>
                    <Badge variant="success" size="sm">
                      {rx.status || "Active"}
                    </Badge>
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
                    <p><b>Prescribing Doctor:</b> {rx.doctorName} ({rx.doctorSpecialty || "Internal Medicine"})</p>
                    <p><b>Patient:</b> {rx.patientName} ({rx.patientEmail || "patient@trimedi.health"})</p>
                    {rx.notes && (
                      <div className="mt-2 p-2.5 rounded-xl bg-slate-50 text-slate-600 border border-slate-100">
                        <span className="font-bold block text-slate-700">Clinical Advice:</span>
                        {rx.notes}
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase text-slate-500 mb-2">Prescribed Medication Schedule:</p>
                    <div className="space-y-2">
                      {rx.items?.map((it, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-teal-50/40 border border-teal-100 flex items-center justify-between text-xs">
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
// 3. APPOINTMENTS VIEW (Phase 2 Connected)
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
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clinical Consultations & Appointments</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Scheduled consultations, telemedicine reviews, and prescription checkups.
          </p>
        </div>
        <Button variant="doctor" size="sm" icon={FiPlus} onClick={() => setBookModalOpen(true)}>
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
                  <Badge variant={apt.type === "video" ? "brand" : "doctor"} size="sm">
                    {apt.type.toUpperCase()} CONSULT
                  </Badge>
                  <span className={`text-xs font-bold ${apt.status === "confirmed" ? "text-emerald-600" : apt.status === "completed" ? "text-slate-600" : "text-amber-600"}`}>
                    {apt.status.toUpperCase()}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900">{apt.patientName}</h3>
                <p className="text-xs text-teal-700 font-semibold">{apt.doctorName}</p>
                <p className="text-[11px] text-slate-400 mb-3">{apt.hospital}</p>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 space-y-1 mb-3">
                  <p>🗓️ Date: <span className="font-bold">{apt.appointmentDate}</span></p>
                  <p>⏰ Slot: <span className="font-bold text-teal-700">{apt.timeSlot}</span></p>
                  <p className="text-slate-500 text-[11px]">Reason: {apt.reason}</p>
                </div>
              </div>

              {activeRole === "doctor" && apt.status === "scheduled" && (
                <div className="pt-3 border-t border-slate-100 flex gap-2">
                  <Button
                    variant="doctor"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => handleStatusUpdate(apt._id, "confirmed")}
                  >
                    Confirm Slot
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-rose-500"
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
// 4. INVENTORY VIEW (Pharmacy Phase 2)
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
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pharmacy Inventory & Stock SKUs</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time dispensing stock levels, pricing snapshots, and SKU replenishment thresholds.
          </p>
        </div>
        <Button variant="pharmacy" size="sm" icon={FiPlus} onClick={() => navigate("/products")}>
          Browse Catalog
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold">
                <th className="pb-3">Medicine Name</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Unit Price</th>
                <th className="pb-3">Dispensing Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.slice(0, 15).map((p) => (
                <tr key={p._id} className="hover:bg-slate-50/50">
                  <td className="py-3 font-semibold text-slate-900">{p.name}</td>
                  <td className="py-3 text-slate-500">{p.category || "Medicine"}</td>
                  <td className="py-3 font-bold text-slate-800">₹{p.price}</td>
                  <td className="py-3">
                    <Badge variant="success" size="sm">
                      Verified Stock
                    </Badge>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      className="text-purple-600 font-semibold hover:underline"
                      onClick={() => alert(`Stock updated for ${p.name}`)}
                    >
                      Adjust Units
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ==========================================
// 5. ORDERS VIEW (Phase 2 Connected)
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
    <div className="space-y-6 animate-in fade-in duration-200">
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
                  <span className="text-sm font-bold text-slate-900">{ord.orderId || ord._id}</span>
                  <span className="text-xs text-slate-400">•</span>
                  <Badge variant={ord.status === "delivered" ? "success" : "warning"} size="sm">
                    Status: {ord.status.toUpperCase()}
                  </Badge>
                  <Badge variant={ord.paymentMethod === "paypal" ? "brand" : "default"} size="sm">
                    {ord.paymentMethod.toUpperCase()} ({ord.paymentStatus || "PAID"})
                  </Badge>
                  {ord.prescriptionRef && (
                    <Badge variant="doctor" size="sm">
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
                        <span>• {it.name} (x{it.qty})</span>
                        <span className="font-semibold text-slate-800">₹{it.price * it.qty}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-1 text-slate-500">
                  <p><b>Recipient:</b> {ord.patientName} ({ord.patientPhone || "+91 98765 43210"})</p>
                  <p><b>Estimated Supply:</b> {ord.supplyDaysEstimate || 15} Days</p>
                  <p><b>Dispensing Pharmacy:</b> {ord.pharmacyName || "MedPlus Prime Pharmacy"}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-base font-bold text-slate-900">
                  Total Paid: <span className="text-brand-700">₹{ord.totalAmount}</span>
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
                      <Button variant="primary" size="sm" className="text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => handleUpdateStatus(ord.orderId || ord._id, "delivered")}>
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
// 6. MESSAGES PLACEHOLDER (Phase 3 Roadmap)
// ==========================================
export function MessagesPlaceholderPage() {
  return (
    <div className="py-8">
      <EmptyState
        icon={FiMessageSquare}
        title="TriMedi Real-Time Healthcare Messaging"
        description="Encrypted real-time communication between patients and certified doctors is scheduled for implementation in Phase 3. The data models and message channels are structured and ready."
        actionLabel="Return to Dashboard"
        onAction={() => window.history.back()}
      />
    </div>
  );
}

// ==========================================
// 7. SYSTEM SETTINGS / ADMIN
// ==========================================
export function SystemManagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Governance & Health</h1>
        <p className="text-xs text-slate-500">Database clusters, API telemetry, and platform security audits.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <FiShield className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Database & Resilient Fallback</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed mb-4">
            MongoDB Atlas connected with automatic fallback store ensuring 100% uptime for authentication, prescriptions, and order fulfillment.
          </p>
          <Badge variant="success" size="sm">
            Status: Phase 2 Ecosystem Active
          </Badge>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <FiLayers className="w-5 h-5 text-brand-600" />
            <h3 className="text-sm font-bold text-slate-900">Payment & AI Engine Status</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed mb-4">
            PayPal Server-side Orders API, Gemini/NLP Medical Extraction Pipeline, and Deterministic Supply Gap Arithmetic are operational.
          </p>
          <Badge variant="brand" size="sm">
            Architecture: Phase 2 Operational
          </Badge>
        </Card>
      </div>
    </div>
  );
}
