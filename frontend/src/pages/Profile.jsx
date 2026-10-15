import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import {
  FiUser,
  FiCheckCircle,
  FiEdit2,
  FiSave,
} from "react-icons/fi";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Avatar from "../components/ui/Avatar";
import { updateProfile as apiUpdateProfile } from "../api";

export function Profile() {
  const { user, activeRole, updateUserProfile } = useAuth();
  const { cart = [], total = 0 } = useCart() || {};

  const [edit, setEdit] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "+91 98765 43210",
    specialty: user?.specialty || "Internal Medicine",
    hospital: user?.hospital || "Metro Health Center",
    pharmacyName: user?.pharmacyName || "MedPlus Prime Pharmacy",
    address: user?.address || "74 Health Ave, Sector 4",
    bloodGroup: user?.bloodGroup || "O+",
  });

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (user?._id) {
        await apiUpdateProfile({ _id: user._id, email: user.email, ...formData });
      }
      updateUserProfile(formData);
      setEdit(false);
      setMsg("Profile details saved successfully.");
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <Card>
          <FiUser className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 mb-1">Please Sign In</h3>
          <p className="text-xs text-slate-500 mb-4">You must be authenticated to view your healthcare profile.</p>
          <Button variant="primary" size="sm" onClick={() => (window.location.href = "/auth")}>
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Profile Card */}
      <Card className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
          <Avatar name={user.name} size="xl" />
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{user.name}</h1>
              <Badge variant="brand" size="md">
                {(activeRole || "Patient").toUpperCase()} ACCOUNT
              </Badge>
            </div>
            <p className="text-xs text-slate-500">{user.email}</p>
            <p className="text-xs text-slate-400 mt-1">
              TriMedi Connected Identity • ID: {user._id || "verified-user-2026"}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => setEdit(!edit)}
          icon={edit ? FiSave : FiEdit2}
        >
          {edit ? "Cancel" : "Edit Profile"}
        </Button>
      </Card>

      {msg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <FiCheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      {/* Profile Details Form */}
      <Card>
        <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 mb-5">
          Account & Clinical Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            name="name"
            disabled={!edit}
            value={formData.name}
            onChange={handleChange}
          />

          <Input
            label="Email Address"
            name="email"
            disabled={true}
            value={formData.email}
            helperText="Email is permanently bound to your authenticated identity"
          />

          <Input
            label="Contact Phone Number"
            name="phone"
            disabled={!edit}
            value={formData.phone}
            onChange={handleChange}
          />

          {activeRole === "patient" && (
            <Input
              label="Blood Group"
              name="bloodGroup"
              disabled={!edit}
              value={formData.bloodGroup}
              onChange={handleChange}
            />
          )}

          {activeRole === "doctor" && (
            <>
              <Input
                label="Clinical Specialty"
                name="specialty"
                disabled={!edit}
                value={formData.specialty}
                onChange={handleChange}
              />
              <Input
                label="Hospital / Clinic Name"
                name="hospital"
                disabled={!edit}
                value={formData.hospital}
                onChange={handleChange}
              />
            </>
          )}

          {activeRole === "pharmacy" && (
            <>
              <Input
                label="Pharmacy Store Name"
                name="pharmacyName"
                disabled={!edit}
                value={formData.pharmacyName}
                onChange={handleChange}
              />
              <Input
                label="Store Address"
                name="address"
                disabled={!edit}
                value={formData.address}
                onChange={handleChange}
              />
            </>
          )}
        </div>

        {edit && (
          <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setEdit(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        )}
      </Card>

      {/* Cart summary preview */}
      {activeRole === "patient" && (
        <Card>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h3 className="text-sm font-bold text-slate-900">Current Medicine Cart</h3>
            <Badge variant="brand" size="sm">
              {cart.length} Items
            </Badge>
          </div>

          {cart.length === 0 ? (
            <p className="text-xs text-slate-400">Your cart is currently empty.</p>
          ) : (
            <div className="space-y-2 text-xs">
              {cart.map((it) => (
                <div key={it._id} className="flex justify-between py-2 border-b border-slate-50">
                  <span className="font-semibold text-slate-800">
                    {it.name} (x{it.qty})
                  </span>
                  <span className="font-bold text-slate-900">₹{it.price * it.qty}</span>
                </div>
              ))}
              <div className="pt-2 flex justify-between font-bold text-sm text-slate-900">
                <span>Total Amount</span>
                <span className="text-brand-800">₹{total}</span>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

export default Profile;