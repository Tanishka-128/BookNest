import { useState, useEffect } from 'react';
import { apiFetch } from '../api';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      setUsers(await apiFetch('/users'));
    } catch (err) {
      setMsg({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (userId, newRole) => {
    setMsg({ text: '', type: '' });
    try {
      await apiFetch(`/users/${userId}/role`, {
        method: 'PATCH',
        body: { role: newRole },
      });
      setMsg({ text: `Role updated to ${newRole}. The user must re-login to see changes.`, type: 'success' });
      fetchUsers();
    } catch (err) {
      setMsg({ text: err.message, type: 'error' });
    }
  };

  const filteredUsers = users.filter((u) => {
    if (filter === 'all') return true;
    return u.role === filter;
  });

  const counts = {
    all: users.length,
    reader: users.filter((u) => u.role === 'reader').length,
    staff: users.filter((u) => u.role === 'staff').length,
    admin: users.filter((u) => u.role === 'admin').length,
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN');

  return (
    <div className="dashboard" id="admin-dashboard">
      <header className="dash-header">
        <div>
          <h1>Admin Panel</h1>
          <p className="dash-subtitle">Manage users and assign roles</p>
        </div>
      </header>

      {/* Stats */}
      <div className="stats-row" id="admin-stats">
        <div className="stat-item">
          <span className="stat-value">{counts.all}</span>
          <span className="stat-label">Total Users</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{counts.reader}</span>
          <span className="stat-label">Readers</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{counts.staff}</span>
          <span className="stat-label">Staff</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{counts.admin}</span>
          <span className="stat-label">Admins</span>
        </div>
      </div>

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      {/* Filter tabs */}
      <div className="tab-bar" id="admin-filter">
        {['all', 'reader', 'staff', 'admin'].map((f) => (
          <button
            key={f}
            className={`tab-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
          </button>
        ))}
      </div>

      <section className="dash-section">
        {loading ? (
          <p className="loading-text">Loading users…</p>
        ) : filteredUsers.length === 0 ? (
          <p className="empty-text">No users found.</p>
        ) : (
          <div className="table-wrap">
            <table id="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u._id}>
                    <td className="cell-primary">{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span
                        className={`badge ${
                          u.role === 'admin' ? 'badge-purple' : u.role === 'staff' ? 'badge-blue' : 'badge-gray'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td className="cell-actions">
                      {u.role === 'reader' && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => updateRole(u._id, 'staff')}
                        >
                          Promote to Staff
                        </button>
                      )}
                      {u.role === 'staff' && (
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => updateRole(u._id, 'reader')}
                        >
                          Demote to Reader
                        </button>
                      )}
                      {u.role === 'admin' && (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
