import React from "react";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="home-page">
      {/* Burger Button */}
      <button
        className="menu-button"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        {menuOpen ? "✖" : "☰"}
      </button>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="mobile-menu">
          <Link
            to="/login"
            className="login-link"
            onClick={() => setMenuOpen(false)}
          >
            Login
          </Link>
        </div>
      )}

      {/* ==============================
          SECTION 1: HERO
      ============================== */}
      <section className="hero-section">
        <img src="/atletik-icon.png" alt="Atletik Logo" className="logo" />
        <h1 className="heading">Atletik</h1>
        <h2 className="sub-heading">Welcome to Atletik</h2>
        <p className="text">
          Discover and join sports events near you. Connect with teams, clubs, and players in your area!
        </p>

        <a
          href="https://drive.google.com/uc?export=download&id=1vtuJpwteirRY7kn3ATdSP2DGoiIjkdAT"
          className="download-button"
          download
        >
          ⬇ Download File
        </a>
      </section>

      {/* ==============================
          SECTION 2: INTRODUCTION
      ============================== */}
      <section className="intro-section">
        <h2 className="section-title">Introduction</h2>
        <p className="section-text">
          Welcome to <strong>ATLETIK</strong> — your all-in-one sports promotion platform designed to empower athletes, organizations, and the Taytay LGU community. 
          ATLETIK connects local sports enthusiasts, clubs, and event organizers in one easy-to-use mobile application — helping you discover sporting events, manage groups, and promote active community engagement.
          <br /><br />
          Whether you’re an athlete looking for your next competition, a coach seeking new talents, or an organizer promoting your event, ATLETIK brings everyone together to strengthen the passion for sports within Taytay.
        </p>
      </section>

      {/* ==============================
          SECTION 3: ABOUT US
      ============================== */}
      <section className="about-section">
        <h2 className="section-title">About Us</h2>
        <p className="section-text">
          <strong>ATLETIK: A Sports Promotion Mobile Application for Taytay LGU</strong> is a Capstone Project developed by students from the 
          <br /> <strong>College of Computer Studies, Our Lady of Fatima University – Antipolo City.</strong>
          <br /><br />
          This project aims to create a centralized platform where athletes, sports organizations, and the local government can collaborate to promote and manage sporting events efficiently.
          ATLETIK serves as a bridge between community engagement and digital innovation, showcasing how technology can support local sports development.
        </p>

        <div className="student-list">
          <p><strong>Developed by:</strong></p>
          <p>CALIWAN, JOHN MYER F.</p>
          <p>HALILI, ELLIOT JACOB P.</p>
          <p>LOPEZ, JARED H.</p>
          <p>NEPOMUCENO, SHAN MAICO DR.</p>

          <br />
          <p><strong>In partial fulfillment of the requirements for the degree:</strong></p>
          <p>Bachelor of Science in Information Technology</p>
        </div>
      </section>
    </div>
  );
}

export default Home;
