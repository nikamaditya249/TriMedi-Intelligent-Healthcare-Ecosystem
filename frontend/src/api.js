const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

/**
 * Universal safe fetch helper with error handling & token attachment
 */
async function request(endpoint, options = {}) {
  const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    const contentType = res.headers.get("content-type");
    const data = contentType && contentType.includes("application/json") ? await res.json() : null;

    if (!res.ok) {
      const errorMsg = data?.message || data?.error || `Request failed with status ${res.status}`;
      return { success: false, error: errorMsg, status: res.status, ...data };
    }

    return data;
  } catch (err) {
    console.error(`API Request error [${endpoint}]:`, err);
    return {
      success: false,
      error: "Unable to reach the TriMedi server. Please verify your connection.",
      offline: true,
    };
  }
}

// -------------------------------------------------------------
// 1. PRODUCTS & MEDICINE CATALOG
// -------------------------------------------------------------
export const getProducts = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const endpoint = query ? `/products?${query}` : `/products`;
  const res = await request(endpoint);
  return Array.isArray(res) ? res : res?.products || [];
};

export const addProduct = async (productData) => {
  return request("/products", {
    method: "POST",
    body: JSON.stringify(productData),
  });
};

// -------------------------------------------------------------
// 2. AUTHENTICATION & PROFILE
// -------------------------------------------------------------
export const registerUser = async (data) => {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const loginUser = async (data) => {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const getCurrentUser = async (token) => {
  return request("/auth/me", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
};

export const updateProfile = async (userData) => {
  return request("/auth/profile", {
    method: "PUT",
    body: JSON.stringify(userData),
  });
};

// -------------------------------------------------------------
// 3. DASHBOARD STATS & TELEMETRY
// -------------------------------------------------------------
export const getDashboardStats = async (role = "patient") => {
  const res = await request(`/stats/dashboard?role=${role}`);
  return res || { stats: {} };
};

// -------------------------------------------------------------
// 4. DIGITAL PRESCRIPTIONS
// -------------------------------------------------------------
export const getPrescriptions = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const endpoint = query ? `/prescriptions?${query}` : `/prescriptions`;
  const res = await request(endpoint);
  return Array.isArray(res) ? res : [];
};

export const getPrescriptionById = async (id) => {
  return request(`/prescriptions/${id}`);
};

export const createPrescription = async (prescriptionData) => {
  return request("/prescriptions", {
    method: "POST",
    body: JSON.stringify(prescriptionData),
  });
};

export const updatePrescriptionStatus = async (id, status) => {
  return request(`/prescriptions/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
};

// -------------------------------------------------------------
// 5. APPOINTMENTS
// -------------------------------------------------------------
export const getAppointments = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const endpoint = query ? `/appointments?${query}` : `/appointments`;
  const res = await request(endpoint);
  return Array.isArray(res) ? res : [];
};

export const bookAppointment = async (appointmentData) => {
  return request("/appointments", {
    method: "POST",
    body: JSON.stringify(appointmentData),
  });
};

export const updateAppointmentStatus = async (id, status) => {
  return request(`/appointments/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
};

// -------------------------------------------------------------
// 6. ORDERS & FULFILLMENT
// -------------------------------------------------------------
export const getOrders = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const endpoint = query ? `/orders?${query}` : `/orders`;
  const res = await request(endpoint);
  return Array.isArray(res) ? res : [];
};

export const getOrderById = async (id) => {
  return request(`/orders/${id}`);
};

export const createOrder = async (orderData) => {
  return request("/orders", {
    method: "POST",
    body: JSON.stringify(orderData),
  });
};

export const updateOrderStatus = async (id, statusData) => {
  const payload = typeof statusData === "string" ? { status: statusData } : statusData;
  return request(`/orders/${id}/status`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
};

export const cancelOrder = async (id, note = "") => {
  return request(`/orders/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status: "CANCELLED", note }),
  });
};

// -------------------------------------------------------------
// 7. SMART REFILL INTELLIGENCE & ORDER AGAIN
// -------------------------------------------------------------
export const getRefillStatus = async (userEmail) => {
  const endpoint = userEmail ? `/refill/status?userEmail=${encodeURIComponent(userEmail)}` : "/refill/status";
  return request(endpoint);
};

export const createOrderAgainDraft = async (payload) => {
  return request("/refill/order-again-draft", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const getMedicationSupplyIntelligence = async (patientEmail) => {
  const endpoint = patientEmail
    ? `/intelligence/supply-summary?patientEmail=${encodeURIComponent(patientEmail)}`
    : `/intelligence/supply-summary`;
  return request(endpoint);
};

// -------------------------------------------------------------
// 8. PAYMENTS (RAZORPAY INDIA-FIRST + PAYPAL + REFUNDS)
// -------------------------------------------------------------
export const getPaymentConfig = async () => {
  return request("/payment/config");
};

export const createRazorpayOrder = async (orderPayload) => {
  return request("/payment/razorpay/create-order", {
    method: "POST",
    body: JSON.stringify(orderPayload),
  });
};

export const verifyRazorpayPayment = async (verifyPayload) => {
  return request("/payment/razorpay/verify", {
    method: "POST",
    body: JSON.stringify(verifyPayload),
  });
};

export const processOrderRefund = async (refundPayload) => {
  return request("/payment/refund", {
    method: "POST",
    body: JSON.stringify(refundPayload),
  });
};

export const getPharmacyInventory = async () => {
  return request("/products/inventory");
};

export const updateProductStock = async (id, payload) => {
  return request(`/products/${id}/stock`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const getPayPalConfig = async () => {
  return request("/paypal/config");
};

export const createPayPalOrder = async (cartPayload) => {
  return request("/paypal/create-order", {
    method: "POST",
    body: JSON.stringify(cartPayload),
  });
};

export const capturePayPalOrder = async (capturePayload) => {
  return request("/paypal/capture-order", {
    method: "POST",
    body: JSON.stringify(capturePayload),
  });
};


// -------------------------------------------------------------
// 9. ASSISTIVE HEALTHCARE AI
// -------------------------------------------------------------
export const extractPrescriptionWithAI = async (documentPayload) => {
  return request("/ai/extract-prescription", {
    method: "POST",
    body: JSON.stringify(documentPayload),
  });
};

export const simplifyInstructionsWithAI = async (payload) => {
  return request("/ai/simplify-instructions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const draftDoctorQuestionWithAI = async (payload) => {
  return request("/ai/draft-doctor-question", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const summarizeConsultationWithAI = async (payload) => {
  return request("/ai/summarize-consultation", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const getDoctorQuestionsWithAI = async (payload) => {
  return request("/ai/doctor-questions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const getAIAudits = async () => {
  return request("/ai/audits");
};

// -------------------------------------------------------------
// 9.5 PRIVACY, CONSENT, SECURITY & UPLOADS (PHASE 5)
// -------------------------------------------------------------
export const getConsents = async (email) => {
  const query = email ? `?email=${encodeURIComponent(email)}` : "";
  return request(`/consent${query}`);
};

export const grantConsent = async (payload) => {
  return request("/consent", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const revokeConsent = async (payload) => {
  return request("/consent/revoke", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const getPrivacySettings = async () => {
  return request("/privacy/settings");
};

export const exportPatientData = async (payload = {}) => {
  return request("/privacy/export-data", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const requestAccountDeletion = async (payload = {}) => {
  return request("/privacy/request-deletion", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const uploadPrescriptionDocument = async (payload) => {
  return request("/uploads/prescription", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const invokeBreakGlass = async (payload) => {
  return request("/consultations/break-glass", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const getSecurityEvents = async (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return request(`/stats/security-events${q ? `?${q}` : ""}`);
};

export const logoutUser = async () => {
  return request("/auth/logout", { method: "POST" });
};

export const forgotPassword = async (payload) => {
  return request("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const resetPassword = async (payload) => {
  return request("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const changePassword = async (payload) => {
  return request("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

// -------------------------------------------------------------
// 9B. MEDICATION INTELLIGENCE & ADHERENCE
// -------------------------------------------------------------
export const getMedications = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const endpoint = query ? `/medications?${query}` : `/medications`;
  return request(endpoint);
};

export const getTodayDoseSchedule = async () => {
  return request("/medications/schedule/today");
};

export const recordDose = async (medicationId, dosePayload) => {
  return request(`/medications/${medicationId}/dose`, {
    method: "POST",
    body: JSON.stringify(dosePayload),
  });
};

export const getMedicationTimeline = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const endpoint = query ? `/medications/timeline?${query}` : `/medications/timeline`;
  return request(endpoint);
};

export const checkMedicationSafety = async (safetyPayload) => {
  return request("/medications/safety-check", {
    method: "POST",
    body: JSON.stringify(safetyPayload),
  });
};

// -------------------------------------------------------------
// 10. REAL-TIME NOTIFICATIONS & CHAT
// -------------------------------------------------------------
export const getNotifications = async (userEmail, role = "patient") => {
  return request(`/notifications?userEmail=${encodeURIComponent(userEmail)}&role=${role}`);
};

export const markNotificationRead = async (id) => {
  return request(`/notifications/${id}/read`, { method: "PATCH" });
};

export const markAllNotificationsRead = async (userEmail) => {
  return request("/notifications/read-all", {
    method: "PATCH",
    body: JSON.stringify({ userEmail }),
  });
};

export const getConversations = async (userEmail, role = "patient") => {
  return request(`/chat/conversations?userEmail=${encodeURIComponent(userEmail)}&role=${role}`);
};

export const getMessages = async (conversationId, userEmail) => {
  return request(`/chat/messages/${conversationId}?userEmail=${encodeURIComponent(userEmail)}`);
};

export const sendMessage = async (messagePayload) => {
  return request("/chat/messages", {
    method: "POST",
    body: JSON.stringify(messagePayload),
  });
};

// -------------------------------------------------------------
// 11. CLINIC QUEUE & PATIENT CHECK-IN WORKFLOW
// -------------------------------------------------------------
export const getClinicQueue = async (doctorEmail = "", clinicName = "") => {
  const query = new URLSearchParams();
  if (doctorEmail) query.append("doctorEmail", doctorEmail);
  if (clinicName) query.append("clinicName", clinicName);
  const qStr = query.toString();
  return request(`/queue${qStr ? `?${qStr}` : ""}`);
};

export const checkInAppointment = async (appointmentId, priority = "normal", notes = "") => {
  return request("/queue/check-in", {
    method: "POST",
    body: JSON.stringify({ appointmentId, priority, notes }),
  });
};

export const callPatientInQueue = async (queueId) => {
  return request(`/queue/${queueId}/call`, { method: "PUT" });
};

export const startConsultation = async (queueId, appointmentId) => {
  return request(`/queue/${queueId}/start`, {
    method: "PUT",
    body: JSON.stringify({ appointmentId }),
  });
};

export const completeConsultationEncounter = async (consultationId, prescriptionData = null, queueId = null) => {
  return request(`/consultations/${consultationId}/complete`, {
    method: "POST",
    body: JSON.stringify({ prescriptionData, queueId }),
  });
};

export const updateQueueStatus = async (queueId, status, reason = "") => {
  return request(`/queue/${queueId}/status`, {
    method: "PUT",
    body: JSON.stringify({ status, reason }),
  });
};

// -------------------------------------------------------------
// 12. DOCTOR CONSULTATION & LONGITUDINAL MEDICAL RECORDS
// -------------------------------------------------------------
export const initConsultation = async (payload) => {
  return request("/consultations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const getConsultationEncounter = async (appointmentId) => {
  return request(`/consultations/encounter/${appointmentId}`);
};

export const saveConsultationNotes = async (consultationId, notesPayload) => {
  return request(`/consultations/${consultationId}`, {
    method: "PUT",
    body: JSON.stringify(notesPayload),
  });
};

export const getPatientMedicalRecord = async (patientEmail) => {
  const endpoint = patientEmail
    ? `/consultations/patient-record?patientEmail=${encodeURIComponent(patientEmail)}`
    : `/consultations/patient-record`;
  return request(endpoint);
};

export const approvePrescription = async (prescriptionId, approvalNotes = "") => {
  return request(`/prescriptions/${prescriptionId}/approve`, {
    method: "POST",
    body: JSON.stringify({ approvalNotes }),
  });
};

// -------------------------------------------------------------
// 13. RECEPTION OPERATIONS & DOCTOR VERIFICATION
// -------------------------------------------------------------
export const getReceptionTodayAppointments = async () => {
  return request("/reception/today-appointments");
};

export const registerReceptionPatient = async (patientPayload) => {
  return request("/reception/register-patient", {
    method: "POST",
    body: JSON.stringify(patientPayload),
  });
};

export const updateReceptionAppointmentStatus = async (appointmentId, status, reason = "") => {
  return request(`/reception/appointments/${appointmentId}/status`, {
    method: "PUT",
    body: JSON.stringify({ status, reason }),
  });
};

export const verifyDoctorCredential = async (doctorId, status, notes = "", verifiedBy = "") => {
  return request(`/auth/doctor/${doctorId}/verify`, {
    method: "PUT",
    body: JSON.stringify({ status, notes, verifiedBy }),
  });
};

export default {
  getProducts,
  addProduct,
  registerUser,
  loginUser,
  getCurrentUser,
  updateProfile,
  getDashboardStats,
  getPrescriptions,
  getPrescriptionById,
  createPrescription,
  updatePrescriptionStatus,
  approvePrescription,
  getAppointments,
  bookAppointment,
  updateAppointmentStatus,
  checkInAppointment,
  getClinicQueue,
  callPatientInQueue,
  startConsultation,
  completeConsultationEncounter,
  updateQueueStatus,
  initConsultation,
  getConsultationEncounter,
  saveConsultationNotes,
  getPatientMedicalRecord,
  getReceptionTodayAppointments,
  registerReceptionPatient,
  updateReceptionAppointmentStatus,
  verifyDoctorCredential,
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  getRefillStatus,
  createOrderAgainDraft,
  getMedicationSupplyIntelligence,
  getPayPalConfig,
  createPayPalOrder,
  capturePayPalOrder,
  extractPrescriptionWithAI,
  simplifyInstructionsWithAI,
  draftDoctorQuestionWithAI,
  summarizeConsultationWithAI,
  getDoctorQuestionsWithAI,
  getAIAudits,
  getMedications,
  getTodayDoseSchedule,
  recordDose,
  getMedicationTimeline,
  checkMedicationSafety,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getConversations,
  getMessages,
  sendMessage,
  getConsents,
  grantConsent,
  revokeConsent,
  getPrivacySettings,
  exportPatientData,
  requestAccountDeletion,
  uploadPrescriptionDocument,
  invokeBreakGlass,
  getSecurityEvents,
  logoutUser,
  forgotPassword,
  resetPassword,
  changePassword,
};