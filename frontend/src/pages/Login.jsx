import { useState } from "react";
import { loginUser } from "../api";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });

  const handleLogin = async () => {
  const res = await loginUser(form);

  if (res.token) {
    localStorage.setItem("token", res.token);
    localStorage.setItem("user", JSON.stringify(res.user)); // ✅ IMPORTANT

    alert("Login successful");
    window.location.href = "/";
  } else {
    alert(res.message);
  }
};

  return (
    <div className="flex flex-col items-center mt-20 gap-4">

      <h2 className="text-2xl font-bold">Login</h2>

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
        onClick={handleLogin}
        className="bg-green-500 text-white px-4 py-2 w-64"
      >
        Login
      </button>

    </div>
  );
}

export default Login;