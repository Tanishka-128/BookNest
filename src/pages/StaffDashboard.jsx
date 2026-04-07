import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';

export default function StaffDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('books');

  // Books state
  const [books, setBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [bookForm, setBookForm] = useState({ title: '', author: '', isbn: '', genre: '', totalCopies: '' });
  const [editingBook, setEditingBook] = useState(null);
  const [bookMsg, setBookMsg] = useState({ text: '', type: '' });

  // Transactions state
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [issueForm, setIssueForm] = useState({ readerEmail: '', bookId: '', dueDays: '14' });
  const [txMsg, setTxMsg] = useState({ text: '', type: '' });

  // Autocomplete state for issue form
  const [readerQuery, setReaderQuery] = useState('');
  const [readerSuggestions, setReaderSuggestions] = useState([]);
  const [showReaderDropdown, setShowReaderDropdown] = useState(false);
  const [bookQuery, setBookQuery] = useState('');
  const [bookSuggestions, setBookSuggestions] = useState([]);
  const [showBookDropdown, setShowBookDropdown] = useState(false);
  const [selectedBookLabel, setSelectedBookLabel] = useState('');

  // Requests state
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [reqMsg, setReqMsg] = useState({ text: '', type: '' });
  const [approvingId, setApprovingId] = useState(null);

  // Book search state
  const [bookSearch, setBookSearch] = useState('');

  useEffect(() => {
    fetchBooks();
    fetchTransactions();
    fetchRequests();
  }, []);

  // ---- Books ----
  const fetchBooks = async (search = '') => {
    setLoadingBooks(true);
    try {
      const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
      setBooks(await apiFetch(`/books${query}`));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBooks(false);
    }
  };

  const handleBookSearch = (e) => {
    const val = e.target.value;
    setBookSearch(val);
    fetchBooks(val);
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    setBookMsg({ text: '', type: '' });
    try {
      if (editingBook) {
        await apiFetch(`/books/${editingBook}`, { method: 'PUT', body: bookForm });
        setBookMsg({ text: 'Book updated', type: 'success' });
      } else {
        await apiFetch('/books', { method: 'POST', body: bookForm });
        setBookMsg({ text: 'Book added', type: 'success' });
      }
      setBookForm({ title: '', author: '', isbn: '', genre: '', totalCopies: '' });
      setEditingBook(null);
      fetchBooks();
    } catch (err) {
      setBookMsg({ text: err.message, type: 'error' });
    }
  };

  const startEdit = (book) => {
    setEditingBook(book._id);
    setBookForm({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      genre: book.genre || '',
      totalCopies: String(book.totalCopies),
    });
    setBookMsg({ text: '', type: '' });
  };

  const cancelEdit = () => {
    setEditingBook(null);
    setBookForm({ title: '', author: '', isbn: '', genre: '', totalCopies: '' });
  };

  const deleteBook = async (id) => {
    if (!confirm('Delete this book?')) return;
    try {
      await apiFetch(`/books/${id}`, { method: 'DELETE' });
      fetchBooks();
      setBookMsg({ text: 'Book deleted', type: 'success' });
    } catch (err) {
      setBookMsg({ text: err.message, type: 'error' });
    }
  };

  // ---- Transactions ----
  const fetchTransactions = async () => {
    setLoadingTx(true);
    try {
      setTransactions(await apiFetch('/transactions'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTx(false);
    }
  };

  const handleIssue = async (e) => {
    e.preventDefault();
    setTxMsg({ text: '', type: '' });
    try {
      await apiFetch('/transactions/issue', { method: 'POST', body: issueForm });
      setIssueForm({ readerEmail: '', bookId: '', dueDays: '14' });
      setReaderQuery('');
      setBookQuery('');
      setSelectedBookLabel('');
      setTxMsg({ text: 'Book issued successfully', type: 'success' });
      fetchTransactions();
      fetchBooks();
    } catch (err) {
      setTxMsg({ text: err.message, type: 'error' });
    }
  };

  // ---- Autocomplete handlers ----
  const handleReaderSearch = async (e) => {
    const val = e.target.value;
    setReaderQuery(val);
    setIssueForm({ ...issueForm, readerEmail: val });
    if (val.trim().length < 2) {
      setReaderSuggestions([]);
      setShowReaderDropdown(false);
      return;
    }
    try {
      const users = await apiFetch(`/users?search=${encodeURIComponent(val.trim())}`);
      const readers = users.filter((u) => u.role === 'reader');
      setReaderSuggestions(readers);
      setShowReaderDropdown(readers.length > 0);
    } catch (err) {
      console.error(err);
    }
  };

  const selectReader = (reader) => {
    setReaderQuery(reader.email);
    setIssueForm({ ...issueForm, readerEmail: reader.email });
    setShowReaderDropdown(false);
    setReaderSuggestions([]);
  };

  const handleBookAutocomplete = async (e) => {
    const val = e.target.value;
    setBookQuery(val);
    setSelectedBookLabel('');
    setIssueForm({ ...issueForm, bookId: '' });
    if (val.trim().length < 2) {
      setBookSuggestions([]);
      setShowBookDropdown(false);
      return;
    }
    try {
      const results = await apiFetch(`/books?search=${encodeURIComponent(val.trim())}`);
      const available = results.filter((b) => b.availableCopies > 0);
      setBookSuggestions(available);
      setShowBookDropdown(available.length > 0);
    } catch (err) {
      console.error(err);
    }
  };

  const selectBook = (book) => {
    setBookQuery('');
    setSelectedBookLabel(`${book.title} — ${book.author} (${book.availableCopies} left)`);
    setIssueForm({ ...issueForm, bookId: book._id });
    setShowBookDropdown(false);
    setBookSuggestions([]);
  };

  const handleReturn = async (id) => {
    setTxMsg({ text: '', type: '' });
    try {
      const result = await apiFetch(`/transactions/return/${id}`, { method: 'POST' });
      const fineMsg = result.fine > 0 ? ` Fine: ₹${result.fine}` : '';
      setTxMsg({ text: `Book returned.${fineMsg}`, type: 'success' });
      fetchTransactions();
      fetchBooks();
    } catch (err) {
      setTxMsg({ text: err.message, type: 'error' });
    }
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN') : '—');

  // ---- Requests ----
  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      setRequests(await apiFetch('/transactions/requests/pending'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleApprove = async (id) => {
    setApprovingId(id);
    setReqMsg({ text: '', type: '' });
    try {
      await apiFetch(`/transactions/${id}/approve`, { method: 'PUT' });
      setReqMsg({ text: 'Request approved and book issued', type: 'success' });
      fetchRequests();
      fetchTransactions();
      fetchBooks(bookSearch);
    } catch (err) {
      setReqMsg({ text: err.message, type: 'error' });
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div className="dashboard" id="staff-dashboard">
      <header className="dash-header">
        <div>
          <h1>Staff Panel</h1>
          <p className="dash-subtitle">Manage books and transactions</p>
        </div>
      </header>

      <div className="tab-bar" id="staff-tabs">
        <button className={`tab-btn ${tab === 'books' ? 'active' : ''}`} onClick={() => setTab('books')}>
          Books
        </button>
        <button className={`tab-btn ${tab === 'requests' ? 'active' : ''}`} onClick={() => setTab('requests')}>
          Requests {requests.length > 0 && <span className="badge badge-red" style={{ marginLeft: '0.35rem' }}>{requests.length}</span>}
        </button>
        <button className={`tab-btn ${tab === 'transactions' ? 'active' : ''}`} onClick={() => setTab('transactions')}>
          Transactions
        </button>
      </div>

      {/* Books Tab */}
      {tab === 'books' && (
        <section className="dash-section">
          {bookMsg.text && (
            <div className={`alert alert-${bookMsg.type}`}>{bookMsg.text}</div>
          )}

          <div className="form-card">
            <h2>{editingBook ? 'Edit Book' : 'Add New Book'}</h2>
            <form onSubmit={handleBookSubmit} className="inline-form" id="book-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={bookForm.title}
                    onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Author</label>
                  <input
                    type="text"
                    value={bookForm.author}
                    onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>ISBN</label>
                  <input
                    type="text"
                    value={bookForm.isbn}
                    onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Genre</label>
                  <input
                    type="text"
                    value={bookForm.genre}
                    onChange={(e) => setBookForm({ ...bookForm, genre: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Total Copies</label>
                  <input
                    type="number"
                    min="1"
                    value={bookForm.totalCopies}
                    onChange={(e) => setBookForm({ ...bookForm, totalCopies: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" id="book-submit">
                  {editingBook ? 'Update Book' : 'Add Book'}
                </button>
                {editingBook && (
                  <button type="button" className="btn btn-ghost" onClick={cancelEdit}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="section-toolbar">
            <input
              type="text"
              className="input-search"
              placeholder="Search by title or author…"
              value={bookSearch}
              onChange={handleBookSearch}
              id="staff-book-search"
            />
          </div>

          {loadingBooks ? (
            <p className="loading-text">Loading…</p>
          ) : books.length === 0 ? (
            <p className="empty-text">No books in the system.</p>
          ) : (
            <div className="table-wrap">
              <table id="staff-books-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Author</th>
                    <th>ISBN</th>
                    <th>Genre</th>
                    <th>Copies</th>
                    <th>Available</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((b) => (
                    <tr key={b._id}>
                      <td className="cell-primary">{b.title}</td>
                      <td>{b.author}</td>
                      <td className="cell-mono">{b.isbn}</td>
                      <td>{b.genre || '—'}</td>
                      <td>{b.totalCopies}</td>
                      <td>
                        <span className={`badge ${b.availableCopies > 0 ? 'badge-green' : 'badge-red'}`}>
                          {b.availableCopies}
                        </span>
                      </td>
                      <td className="cell-actions">
                        <button className="btn btn-sm btn-ghost" onClick={() => startEdit(b)}>Edit</button>
                        <button className="btn btn-sm btn-danger-ghost" onClick={() => deleteBook(b._id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Requests Tab */}
      {tab === 'requests' && (
        <section className="dash-section">
          {reqMsg.text && (
            <div className={`alert alert-${reqMsg.type}`}>{reqMsg.text}</div>
          )}

          <div className="form-card">
            <h2>Pending Book Requests</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '-0.5rem' }}>
              Readers have requested the following books. Approve to issue them.
            </p>
          </div>

          {loadingRequests ? (
            <p className="loading-text">Loading requests…</p>
          ) : requests.length === 0 ? (
            <p className="empty-text">No pending requests.</p>
          ) : (
            <div className="table-wrap">
              <table id="pending-requests-table">
                <thead>
                  <tr>
                    <th>Reader</th>
                    <th>Book</th>
                    <th>Requested On</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r._id}>
                      <td>
                        <div className="cell-primary">{r.readerId?.name || '—'}</div>
                        <div className="cell-sub">{r.readerId?.email || ''}</div>
                      </td>
                      <td className="cell-primary">{r.bookId?.title || '—'}</td>
                      <td>{formatDate(r.createdAt)}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleApprove(r._id)}
                          disabled={approvingId === r._id}
                          id={`approve-${r._id}`}
                        >
                          {approvingId === r._id ? 'Approving…' : 'Approve Request'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Transactions Tab */}
      {tab === 'transactions' && (
        <section className="dash-section">
          {txMsg.text && (
            <div className={`alert alert-${txMsg.type}`}>{txMsg.text}</div>
          )}

          <div className="form-card">
            <h2>Issue a Book</h2>
            <form onSubmit={handleIssue} className="inline-form" id="issue-form">
              <div className="form-grid">
                <div className="form-group" style={{ position: 'relative' }}>
                  <label>Reader (search by name or email)</label>
                  <input
                    type="text"
                    value={readerQuery}
                    onChange={handleReaderSearch}
                    onFocus={() => readerSuggestions.length > 0 && setShowReaderDropdown(true)}
                    onBlur={() => setTimeout(() => setShowReaderDropdown(false), 200)}
                    placeholder="Type to search reader…"
                    required
                    autoComplete="off"
                    id="reader-search-input"
                  />
                  {showReaderDropdown && (
                    <div className="autocomplete-dropdown" id="reader-suggestions">
                      {readerSuggestions.map((r) => (
                        <div
                          key={r._id}
                          className="autocomplete-item"
                          onMouseDown={() => selectReader(r)}
                        >
                          <span className="autocomplete-name">{r.name}</span>
                          <span className="autocomplete-sub">{r.email}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="form-group" style={{ position: 'relative' }}>
                  <label>Book (search by title or author)</label>
                  {selectedBookLabel ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', flex: 1 }}>{selectedBookLabel}</span>
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        onClick={() => { setSelectedBookLabel(''); setIssueForm({ ...issueForm, bookId: '' }); }}
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={bookQuery}
                      onChange={handleBookAutocomplete}
                      onFocus={() => bookSuggestions.length > 0 && setShowBookDropdown(true)}
                      onBlur={() => setTimeout(() => setShowBookDropdown(false), 200)}
                      placeholder="Type to search book…"
                      autoComplete="off"
                      id="book-search-input"
                    />
                  )}
                  {showBookDropdown && (
                    <div className="autocomplete-dropdown" id="book-suggestions">
                      {bookSuggestions.map((b) => (
                        <div
                          key={b._id}
                          className="autocomplete-item"
                          onMouseDown={() => selectBook(b)}
                        >
                          <span className="autocomplete-name">{b.title}</span>
                          <span className="autocomplete-sub">{b.author} • {b.availableCopies} available</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>Due in (days)</label>
                  <input
                    type="number"
                    min="1"
                    value={issueForm.dueDays}
                    onChange={(e) => setIssueForm({ ...issueForm, dueDays: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" id="issue-submit" disabled={!issueForm.readerEmail || !issueForm.bookId}>
                  Issue Book
                </button>
              </div>
            </form>
          </div>

          {loadingTx ? (
            <p className="loading-text">Loading…</p>
          ) : transactions.length === 0 ? (
            <p className="empty-text">No transactions yet.</p>
          ) : (
            <div className="table-wrap">
              <table id="transactions-table">
                <thead>
                  <tr>
                    <th>Reader</th>
                    <th>Book</th>
                    <th>Issued</th>
                    <th>Due</th>
                    <th>Returned</th>
                    <th>Fine</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t._id}>
                      <td>
                        <div className="cell-primary">{t.readerId?.name || '—'}</div>
                        <div className="cell-sub">{t.readerId?.email || ''}</div>
                      </td>
                      <td className="cell-primary">{t.bookId?.title || '—'}</td>
                      <td>{formatDate(t.issueDate)}</td>
                      <td>{formatDate(t.dueDate)}</td>
                      <td>{formatDate(t.returnDate)}</td>
                      <td>{t.fine > 0 ? `₹${t.fine}` : '—'}</td>
                      <td>
                        <span className={`badge ${t.status === 'issued' ? 'badge-yellow' : 'badge-green'}`}>
                          {t.status}
                        </span>
                      </td>
                      <td>
                        {t.status === 'issued' ? (
                          <button className="btn btn-sm btn-primary" onClick={() => handleReturn(t._id)}>
                            Return
                          </button>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
