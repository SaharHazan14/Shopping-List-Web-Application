import { useLocation, useNavigate } from "react-router-dom";

export default function BottomBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const path = location.pathname;
  let label = "";
  if (path === "/dashboard" || path === "/") label = "My Lists";
  else if (path.startsWith("/list/")) label = "Items";
  else label = "";

  return (
    <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, height: 64, background: 'rgba(255,255,255,0.98)', borderTop: '1px solid #e6eef6', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: 'none',
            background: path === '/dashboard' ? '#eefdfa' : 'transparent',
            color: path === '/dashboard' ? '#065f46' : '#334155',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          My Lists
        </button>

        <button
          onClick={() => navigate('/items')}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: 'none',
            background: path === '/items' ? '#eefdfa' : 'transparent',
            color: path === '/items' ? '#065f46' : '#334155',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Items
        </button>

        <div style={{ marginLeft: 8, color: '#94a3b8', fontSize: 13 }}>{label}</div>
      </div>
    </div>
  );
}
