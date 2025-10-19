import { useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="home-page">
      <div id={'frosted-glass'} />
      {/* Burger Button */}
      <header>
        <nav>
          <img src="/atletik-icon.png" alt="Atletik Logo" className="logo" />

          <div>
            <button
                className="menu-button"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle menu"
            >
              {menuOpen ?
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                       className="icon icon-tabler icons-tabler-outline icon-tabler-x">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <path d="M18 6l-12 12"/>
                    <path d="M6 6l12 12"/>
                  </svg>
                  :
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                       className="icon icon-tabler icons-tabler-outline icon-tabler-menu-2">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <path d="M4 6l16 0"/>
                    <path d="M4 12l16 0"/>
                    <path d="M4 18l16 0"/>
                  </svg>
              }
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
          </div>
        </nav>
      </header>
      {/* ==============================
          SECTION 1: HERO
      ============================== */}
      <section className="hero-section">
        <div id="color-bomb" />
        <div id="hero-content-container">
          <img src="/home-feed.png" alt="Atletik Logo" className="appImage" />
          {/*<h1 className="heading">Atletik</h1>*/}
          {/*<h2 className="sub-heading">Welcome to Atletik</h2>*/}
          <p className="text hero-text">
            Discover and join sports events near you with <span className="logo-callout">Atletik</span>. Connect with teams, clubs, and players in your area!
          </p>

          <a
              href="https://drive.google.com/uc?export=download&id=1vtuJpwteirRY7kn3ATdSP2DGoiIjkdAT"
              // href="https://github.com/ElliotJcbH/Releases/releases/download/Atletik/Atletik-v1.0.0-alpha.1.apk"
              className="download-button"
              download
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                 className="icon icon-tabler icons-tabler-outline icon-tabler-download">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2"/>
              <path d="M7 11l5 5l5 -5"/>
              <path d="M12 4l0 12"/>
            </svg>
            Download APK
          </a>
        </div>
      </section>

      {/* ==============================
          SECTION 2: INTRODUCTION
      ============================== */}
      <section className="intro-section">
        <h2 className="section-title">Introduction</h2>
        <p className="section-text">
          Welcome to <span className="logo-callout">Atletik</span> — your all-in-one sports promotion platform designed to empower athletes,
          organizations, and the Taytay LGU community.
          <span className="logo-callout">Atletik</span> connects local sports enthusiasts, clubs, and event organizers in one easy-to-use mobile application — helping you discover sporting events, manage groups, and promote active community engagement.
          <br /><br />
          Whether you’re an athlete looking for your next competition, a coach seeking new talents, or an organizer promoting your event, <span className="logo-callout">Atletik</span> brings everyone together to strengthen the passion for sports within Taytay.
        </p>
        <iframe id="video" src="https://www.youtube.com/embed/N4Tls5MLINY" title="Atletik Video Presentation" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowfullscreen />
        </section>

      {/* ==============================
          SECTION 3: ABOUT US
      ============================== */}
      <section className="about-section">
        <h2 className="section-title">About Us</h2>
        <p className="section-text">
          <span className="logo-callout">Atletik</span>: A Sports Promotion Mobile Application for Taytay LGU is a Capstone Project developed by students of the
          College of Computer Studies, Our Lady of Fatima University – Antipolo City.
          <br /><br />
          This project aims to create a centralized platform where athletes, sports organizations, and the local government can collaborate to promote and manage sporting events efficiently.
          <span className="logo-callout">Atletik</span> serves as a bridge between community engagement and digital innovation, showcasing how technology can support local sports development.
        </p>

        <div className="student-list">
          <p id="developers-tag">Developers</p>
          <p>CALIWAN, JOHN MYER F.</p>
          <p>HALILI, ELLIOT JACOB P.</p>
          <p>LOPEZ, JARED H.</p>
          <p>NEPOMUCENO, SHAN MAICO DR.</p>

          <br />
          <p>In partial fulfillment of the requirements for the degree</p>
          <p id="degree-tag">Bachelor of Science in Information Technology</p>
        </div>
      </section>
    </div>
  );
}

export default Home;
