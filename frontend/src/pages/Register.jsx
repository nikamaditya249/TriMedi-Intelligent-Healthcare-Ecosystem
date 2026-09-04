import { useState } from "react";
import { registerUser } from "../api";

function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleRegister = async () => {
    const res = await registerUser(form);

    alert(res.message);
    window.location.href = "/login";
  };

  return (
    <div className="flex flex-col items-center mt-20 gap-4">

      <h2 className="text-2xl font-bold">Register</h2>

      <input
        placeholder="Name"
        className="border p-2 w-64"
        onChange={(e) =>
          setForm({ ...form, name: e.target.value })
        }
      />

      <input
        placeholder="Email"
        className="border p-2 w-64"
        onChange={(e) =>
          setForm({ ...form, email: e.target.value })
        }
      />

      <input
        type="password"
        placeholder="Password"
        className="border p-2 w-64"
        onChange={(e) =>
          setForm({ ...form, password: e.target.value })
        }
      />

      <button
        onClick={handleRegister}
        className="bg-blue-500 text-white px-4 py-2 w-64"
      >
        Register
      </button>

    </div>
  );
}

export default Register;