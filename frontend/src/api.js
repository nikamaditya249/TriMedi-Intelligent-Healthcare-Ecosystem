const BASE_URL = "http://localhost:5001/api";

// 1. PRODUCTS & MEDICINE CATALOG
export const getProducts = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const url = query ? `${BASE_URL}/products?${query}` : `${BASE_URL}/products`;
  const res = await fetch(url);
  return res.json();
};

// 2. AUTHENTICATION
export const registerUser = async (data) => {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const loginUser = async (data) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const getCurrentUser = async (token) => {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const updateProfile = async (userData) => {
  const res = await fetch(`${BASE_URL}/auth/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  return res.json();
};

// 3. DASHBOARD STATS
export const getDashboardStats = async (role = "patient") => {
  const res = await fetch(`${BASE_URL}/stats/dashboard?role=${role}`);
  return res.json();
};

// 4. DIGITAL PRESCRIPTIONS
export const getPrescriptions = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const url = query ? `${BASE_URL}/prescriptions?${query}` : `${BASE_URL}/prescriptions`;
  const res = await fetch(url);
  return res.json();
};

export const getPrescriptionById = async (id) => {
  const res = await fetch(`${BASE_URL}/prescriptions/${id}`);
  return res.json();
};

export const createPrescription = async (prescriptionData) => {
  const res = await fetch(`${BASE_URL}/prescriptions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(prescriptionData),
  });
  return res.json();
};

export const updatePrescriptionStatus = async (id, status) => {
  const res = await fetch(`${BASE_URL}/prescriptions/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return res.json();
};

// 5. APPOINTMENTS
export const getAppointments = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const url = query ? `${BASE_URL}/appointments?${query}` : `${BASE_URL}/appointments`;
  const res = await fetch(url);
  return res.json();
};

export const bookAppointment = async (appointmentData) => {
  const res = await fetch(`${BASE_URL}/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(appointmentData),
  });
  return res.json();
};

export const updateAppointmentStatus = async (id, status) => {
  const res = await fetch(`${BASE_URL}/appointments/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return res.json();
};

// 6. ORDERS & FULFILLMENT
export const getOrders = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const url = query ? `${BASE_URL}/orders?${query}` : `${BASE_URL}/orders`;
  const res = await fetch(url);
  return res.json();
};

export const getOrderById = async (id) => {
  const res = await fetch(`${BASE_URL}/orders/${id}`);
  return res.json();
};

export const createOrder = async (orderData) => {
  const res = await fetch(`${BASE_URL}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderData),
  });
  return res.json();
};

export const updateOrderStatus = async (id, statusData) => {
  const res = await fetch(`${BASE_URL}/orders/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(statusData),
  });
  return res.json();
};

// 7. PAYPAL INTEGRATION
export const getPayPalConfig = async () => {
  const res = await fetch(`${BASE_URL}/paypal/config`);
  return res.json();
};

export const createPayPalOrder = async (cartPayload) => {
  const res = await fetch(`${BASE_URL}/paypal/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cartPayload),
  });
  return res.json();
};

export const capturePayPalOrder = async (capturePayload) => {
  const res = await fetch(`${BASE_URL}/paypal/capture-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(capturePayload),
  });
  return res.json();
};

// 8. AI PRESCRIPTION UNDERSTANDING
export const extractPrescriptionWithAI = async (documentPayload) => {
  const res = await fetch(`${BASE_URL}/ai/extract-prescription`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(documentPayload),
  });
  return res.json();
};

// 9. MEDICATION SUPPLY INTELLIGENCE
export const getMedicationSupplyIntelligence = async (patientEmail) => {
  const url = patientEmail
    ? `${BASE_URL}/intelligence/supply-summary?patientEmail=${encodeURIComponent(patientEmail)}`
    : `${BASE_URL}/intelligence/supply-summary`;
  const res = await fetch(url);
  return res.json();
};