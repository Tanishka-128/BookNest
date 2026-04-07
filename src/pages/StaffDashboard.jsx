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

  useEffect(() => {
    fetchBooks();
    fetchTransactions();
  }, []);

  // ---- Books ----
  const fetchBooks = async () => {
    setLoadingBooks(true);
    try {
      setBooks(await apiFetch('/books'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBooks(false);
    }
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
      setTxMsg({ text: 'Book issued successfully', type: 'success' });
      fetchTransactions();
      fetchBooks();
    } catch (err) {
      setTxMsg({ text: err.message, type: 'error' });
    }
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
                <div className="form-group">
                  <label>Reader Email</label>
                  <input
                    type="email"
                    value={issueForm.readerEmail}
                    onChange={(e) => setIssueForm({ ...issueForm, readerEmail: e.target.value })}
                    placeholder="reader@example.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Book</label>
                  <select
                    value={issueForm.bookId}
                    onChange={(e) => setIssueForm({ ...issueForm, bookId: e.target.value })}
                    required
                  >
                    <option value="">Select a book</option>
                    {books
                      .filter((b) => b.availableCopies > 0)
                      .map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.title} — {b.author} ({b.availableCopies} left)
                        </option>
                      ))}
                  </select>
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
                <button type="submit" className="btn btn-primary" id="issue-submit">
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
