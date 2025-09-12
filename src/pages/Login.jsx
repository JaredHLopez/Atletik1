import React, { useState } from "react";
import supabase from "../helper/supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import "./admin.css"; // Import the separate CSS file

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      // Step 1: Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (authError) {
        setMessage(authError.message);
        setEmail("");
        setPassword("");
        setLoading(false);
        return;
      }

      if (authData?.user) {
        // Step 2: Check if the authenticated user is an admin
        const { data: adminData, error: adminError } = await supabase
          .from('admin')
          .select('*')
          .eq('user_id', authData.user.id)
          .single();

        if (adminError || !adminData) {
          // User is authenticated but not an admin
          console.log('Admin check error:', adminError);
          console.log('Admin data:', adminData);
          
          // Sign out the user since they're not an admin
          await supabase.auth.signOut();
          
          setMessage("Access denied. This account is not authorized as an admin.");
          setEmail("");
          setPassword("");
          setLoading(false);
          return;
        }

        // Step 3: User is authenticated AND is an admin
        console.log('Admin login successful:', adminData);
        setMessage("Login successful! Redirecting...");
        
        // Store admin info in localStorage if needed
        localStorage.setItem('adminData', JSON.stringify(adminData));
        
        // Navigate to dashboard
        navigate("/dashboard");
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage("An unexpected error occurred. Please try again.");
      setEmail("");
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <form className="login" onSubmit={handleSubmit}>
        <h2 className="login-title">Admin Login</h2>
        <br />
        {message && (
          <span 
            style={{ 
              color: message.includes('successful') ? 'green' : 'red',
              fontSize: '14px',
              marginBottom: '10px',
              display: 'block'
            }}
          >
            {message}
          </span>
        )}
        <div className="input-container">
          <input
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            type="email"
            placeholder="Admin Email"
            required
            disabled={loading}
          />
        </div>
        <div className="input-container">
          <input
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            type="password"
            placeholder="Password"
            required
            disabled={loading}
          />
        </div>
        <button 
          type="submit" 
          className="submit"
          disabled={loading}
          style={{
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Verifying...' : 'Log in'}
        </button>
      </form>
    </div>
  );
}

export default Login;