import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';

export default function ReaderDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('browse');
  const [books, setBooks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState('');
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [loadingTx, setLoadingTx] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchBooks();
    fetchTransactions();
  }, []);

  const fetchBooks = async () => {
    setLoadingBooks(true);
    try {
      const data = await apiFetch('/books');
      setBooks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBooks(false);
    }
  };

  const fetchTransactions = async () => {
    setLoadingTx(true);
    try {
      const data = await apiFetch('/transactions/my');
      setTransactions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTx(false);
    }
  };

  const handleSearch = async (e) => {
    const q = e.target.value;
    setSearch(q);
    if (!q.trim()) {
      fetchBooks();
      return;
    }
    try {
      const data = await apiFetch(`/books/search?q=${encodeURIComponent(q)}`);
      setBooks(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setMsg('');
    try {
      await apiFetch('/users/me', { method: 'DELETE' });
      logout();
    } catch (err) {
      setMsg(err.message);
      setDeleting(false);
    }
  };

  const issuedBooks = transactions.filter((t) => t.status === 'issued');
  const totalFine = transactions.reduce((sum, t) => sum + (t.fine || 0), 0);

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN') : '—');

  return (
    <div className="dashboard" id="reader-dashboard">
      <header className="dash-header">
        <div>
          <h1>Welcome back, {user.name}</h1>
          <p className="dash-subtitle">
            {issuedBooks.length} book{issuedBooks.length !== 1 ? 's' : ''} currently issued
            {totalFine > 0 && <span className="fine-text"> · ₹{totalFine} fine</span>}
          </p>
        </div>
      </header>

      <div className="tab-bar" id="reader-tabs">
        <button className={`tab-btn ${tab === 'browse' ? 'active' : ''}`} onClick={() => setTab('browse')}>
          Browse Books
        </button>
        <button className={`tab-btn ${tab === 'mybooks' ? 'active' : ''}`} onClick={() => setTab('mybooks')}>
          My Books
        </button>
        <button className={`tab-btn ${tab === 'account' ? 'active' : ''}`} onClick={() => setTab('account')}>
          Account
        </button>
      </div>

      {/* Browse Books */}
      {tab === 'browse' && (
        <section className="dash-section">
          <div className="section-toolbar">
            <input
              type="text"
              className="input-search"
              placeholder="Search by title, author, ISBN, or genre…"
              value={search}
              onChange={handleSearch}
              id="book-search"
            />
          </div>
          {loadingBooks ? (
            <p className="loading-text">Loading books…</p>
          ) : books.length === 0 ? (
            <p className="empty-text">No books found.</p>
          ) : (
            <div className="table-wrap">
              <table id="books-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Author</th>
                    <th>ISBN</th>
                    <th>Genre</th>
                    <th>Available</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((b) => (
                    <tr key={b._id}>
                      <td className="cell-primary">{b.title}</td>
                      <td>{b.author}</td>
                      <td className="cell-mono">{b.isbn}</td>
                      <td>{b.genre || '—'}</td>
                      <td>
                        <span className={`badge ${b.availableCopies > 0 ? 'badge-green' : 'badge-red'}`}>
                          {b.availableCopies} / {b.totalCopies}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* My Books */}
      {tab === 'mybooks' && (
        <section className="dash-section">
          {loadingTx ? (
            <p className="loading-text">Loading transactions…</p>
          ) : transactions.length === 0 ? (
            <p className="empty-text">No transactions yet.</p>
          ) : (
            <div className="table-wrap">
              <table id="my-books-table">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Author</th>
                    <th>Issued</th>
                    <th>Due</th>
                    <th>Returned</th>
                    <th>Fine</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t._id}>
                      <td className="cell-primary">{t.bookId?.title || '—'}</td>
                      <td>{t.bookId?.author || '—'}</td>
                      <td>{formatDate(t.issueDate)}</td>
                      <td>{formatDate(t.dueDate)}</td>
                      <td>{formatDate(t.returnDate)}</td>
                      <td>{t.fine > 0 ? `₹${t.fine}` : '—'}</td>
                      <td>
                        <span className={`badge ${t.status === 'issued' ? 'badge-yellow' : 'badge-green'}`}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Account */}
      {tab === 'account' && (
        <section className="dash-section">
          <div className="account-section">
            <h2>Account Settings</h2>
            <div className="account-info">
              <div className="info-row"><span className="info-label">Name</span><span>{user.name}</span></div>
              <div className="info-row"><span className="info-label">Email</span><span>{user.email}</span></div>
              <div className="info-row"><span className="info-label">Role</span><span className="badge badge-blue">{user.role}</span></div>
            </div>
            <div className="danger-zone">
              <h3>Danger Zone</h3>
              <p>Deleting your account is permanent. You must return all issued books first.</p>
              {msg && <div className="alert alert-error">{msg}</div>}
              {!deleteConfirm ? (
                <button className="btn btn-danger" onClick={() => setDeleteConfirm(true)} id="delete-account-btn">
                  Delete my account
                </button>
              ) : (
                <div className="confirm-row">
                  <span>Are you sure?</span>
                  <button className="btn btn-danger" onClick={handleDeleteAccount} disabled={deleting}>
                    {deleting ? 'Deleting…' : 'Yes, delete'}
                  </button>
                  <button className="btn btn-ghost" onClick={() => setDeleteConfirm(false)}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
