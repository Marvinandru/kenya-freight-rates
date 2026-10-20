import React, { useEffect, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  CircleHelp,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Plane,
  Plus,
  ShieldCheck,
  X,
} from "lucide-react";
import { RatesProvider, useRates } from "./context/RatesContext";
import { AuthModal } from "./components/AuthModal";
import { QuotePage } from "./pages/QuotePage";
import { ShipmentsPage } from "./pages/ShipmentsPage";
import { RateManager } from "./pages/RateManager";
import logo from "./assets/spedire-logo.jpg";

class ErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="panel empty-state">
        <h1>Something interrupted this page</h1>
        <p>
          Your saved shipments and files remain in your account. Reload to try
          again.
        </p>
        <button
          className="button primary"
          onClick={() => window.location.reload()}
        >
          Reload page
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
function HelpPage() {
  return (
    <>
      <div className="page-heading compact">
        <div className="eyebrow">A CLEARER WAY TO EXPORT</div>
        <h1>A little help along the way.</h1>
        <p>What to expect from your estimate, booking request and documents.</p>
      </div>
      <div className="help-grid">
        {[
          [
            "How does booking work?",
            "Start with your cargo details, compare estimates, and send a booking request. The cargo desk checks the rate and airline space before confirming. A request is not a space reservation.",
          ],
          [
            "What does the estimate include?",
            "The breakdown includes air freight, fuel and indicative local fees. Destination handling, duties, insurance and delivery are excluded. Fee rules and the final total need cargo desk confirmation. All estimates are in USD.",
          ],
          [
            "What is chargeable weight?",
            "Air freight uses the higher of gross weight and volumetric weight. This calculator uses length × width × height in centimetres × pieces ÷ 6,000. Without dimensions, the result is provisional. Final weighing may change the price.",
          ],
          [
            "Which documents do I need?",
            "An invoice and packing list are the starting point. Plant products and animal products have different supporting certificates. The checklist is guidance; your cargo team must confirm destination and commodity requirements.",
          ],
          [
            "How does AI intake work?",
            "When enabled, you can choose to send a PDF or image to OpenAI to suggest document fields and source evidence. You must consent before extraction. It can make mistakes; it cannot authenticate a certificate or approve a shipment. Uploads work without AI.",
          ],
          [
            "Are my documents private?",
            "You must sign in to access your shipments. Files are kept in private storage accessible to the shipment owner and authorized cargo staff. Downloading retrieves the original file.",
          ],
          [
            "What happens after I upload?",
            "Documents await staff review. If changes are needed, the cargo desk leaves feedback in your shipment workspace. Uploading a certificate does not mean the issuing authority has validated it.",
          ],
          [
            "When should I pay?",
            "Wait for the cargo desk to confirm your quote and payment instructions. This release does not collect payments, verify bank transfers or provide online flight tracking.",
          ],
        ].map(([title, body]) => (
          <section className="panel" key={title}>
            <h2>{title}</h2>
            <p>{body}</p>
          </section>
        ))}
      </div>
    </>
  );
}
function OperationsPage() {
  const { isStaff } = useRates();
  const [view, setView] = useState("queue");
  if (!isStaff)
    return (
      <div className="notice error">
        This workspace is only available to cargo staff.
      </div>
    );
  return (
    <>
      <div className="segmented operations-tabs">
        <button
          className={view === "queue" ? "selected" : ""}
          onClick={() => setView("queue")}
        >
          Shipment queue
        </button>
        <button
          className={view === "rates" ? "selected" : ""}
          onClick={() => setView("rates")}
        >
          Rate management
        </button>
      </div>
      {view === "queue" ? <ShipmentsPage operations /> : <RateManager />}
    </>
  );
}
function Workspace() {
  const {
    user,
    isStaff,
    authLoading,
    profile,
    logout,
    setAuthDialog,
    isConfigured,
    notification,
    notify,
    authDialog,
  } = useRates();
  const [route, setRoute] = useState(
    () => window.location.hash.replace(/^#/, "") || "/quote",
  );
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const update = () => {
      setRoute(window.location.hash.replace(/^#/, "") || "/quote");
      setMobile(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  useEffect(() => {
    document.title = `${route.startsWith("/shipments") ? "My shipments" : route === "/help" ? "Help" : route === "/operations" ? "Work queue" : "New quote"} · Spedire Kenya`;
  }, [route]);
  const shipmentId = route.startsWith("/shipments/")
    ? route.split("/")[2]
    : null;
  const nav = [
    ["/quote", "New quote", Plus],
    ["/shipments", "My shipments", Package],
    ["/help", "Help & guidance", CircleHelp],
    ...(isStaff ? [["/operations", "Work queue", LayoutDashboard]] : []),
  ];
  async function signOut() {
    try {
      await logout();
    } catch (err) {
      notify(err.message, "error");
    }
  }
  return (
    <div className="app-shell">
      <a
        href="#main"
        className="skip-link"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        Skip to content
      </a>
      <aside className={`sidebar ${mobile ? "mobile-open" : ""}`}>
        <a href="#/quote" className="brand">
          <img src={logo} alt="" />
          <span>
            spedire<span className="brand-country">KENYA · AIR CARGO</span>
          </span>
        </a>
        <button
          className="icon-button mobile-close"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        >
          <X size={20} />
        </button>
        <div className="workspace-label">EXPORTER WORKSPACE</div>
        <nav aria-label="Main navigation">
          {nav.map(([href, label, Icon]) => (
            <a
              key={href}
              href={`#${href}`}
              aria-current={
                route === href || (href === "/shipments" && shipmentId)
                  ? "page"
                  : undefined
              }
              className={
                route === href || (href === "/shipments" && shipmentId)
                  ? "nav-link active"
                  : "nav-link"
              }
            >
              <Icon size={19} />
              {label}
              {href === "/quote" && (
                <ArrowUpRight size={15} className="nav-trailing" />
              )}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <ShieldCheck size={20} />
            <p>
              Your export workspace<span>Quotes, files and the next step.</span>
            </p>
          </div>
          {user ? (
            <div className="account-block">
              <div className="avatar">
                {(profile?.full_name || user.email || "E")
                  .slice(0, 1)
                  .toUpperCase()}
              </div>
              <div>
                <strong>
                  {profile?.full_name ||
                    user.user_metadata?.full_name ||
                    "Exporter"}
                </strong>
                <small>{profile?.company_name || user.email}</small>
              </div>
              <button
                className="icon-button"
                aria-label="Sign out"
                onClick={signOut}
              >
                <LogOut size={17} />
              </button>
            </div>
          ) : (
            <button
              className="button secondary full"
              disabled={authLoading}
              onClick={() => setAuthDialog("login")}
            >
              {authLoading ? "Checking account…" : "Sign in to your account"}
            </button>
          )}
        </div>
      </aside>
      <div className="workspace-main">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            aria-label="Open navigation"
            onClick={() => setMobile(true)}
            aria-expanded={mobile}
          >
            <Menu size={21} />
          </button>
          <div className="breadcrumb">
            <Plane size={16} />
            <span>Fresh cargo. One clear journey.</span>
          </div>
          <div className="topbar-right">
            <span className="origin-label">
              <i />
              Nairobi, Kenya
            </span>
            {!user && !authLoading && (
              <button
                className="button secondary small"
                onClick={() => setAuthDialog("signup")}
              >
                Create account
                <ArrowUpRight size={15} />
              </button>
            )}
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          {!isConfigured && (
            <div className="preview-banner">
              <span className="preview-dot" />
              <p>
                <strong>Preview workspace</strong> · Sample estimates. Connect
                the database to enable accounts, shipment requests and uploads.
              </p>
              <a href="#/help">
                How it works
                <ArrowUpRight size={14} />
              </a>
            </div>
          )}
          <ErrorBoundary key={route}>
            {route === "/quote" || route === "/" ? (
              <QuotePage />
            ) : route === "/shipments" || shipmentId ? (
              <ShipmentsPage
                key={shipmentId || "list"}
                shipmentId={shipmentId}
              />
            ) : route === "/operations" ? (
              <OperationsPage />
            ) : route === "/help" ? (
              <HelpPage />
            ) : (
              <section className="panel empty-state">
                <h1>Page not found</h1>
                <a href="#/quote" className="button primary">
                  Start a quote
                </a>
              </section>
            )}
          </ErrorBoundary>
          <footer className="workspace-footer">
            <span>© {new Date().getFullYear()} Spedire Kenya</span>
            <span>Built around your next shipment.</span>
          </footer>
        </main>
      </div>
      <AuthModal key={authDialog ? "open" : "closed"} />
      {notification && (
        <div
          className={`toast ${notification.type === "error" ? "toast-error" : ""}`}
          role={notification.type === "error" ? "alert" : "status"}
        >
          <CheckCircle2 size={19} />
          <p>{notification.message}</p>
        </div>
      )}
    </div>
  );
}
export default function App() {
  return (
    <ErrorBoundary>
      <RatesProvider>
        <Workspace />
      </RatesProvider>
    </ErrorBoundary>
  );
}
