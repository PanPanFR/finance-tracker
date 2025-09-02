"use client";

import React, { useState, useEffect } from 'react';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category?: string;
  created_at: string;
}

interface TransactionFormProps {
  transaction?: Transaction;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transaction: Omit<Transaction, 'id' | 'created_at'>) => void;
  mode: 'add' | 'edit';
}

export default function TransactionForm({ 
  transaction, 
  isOpen, 
  onClose, 
  onSubmit, 
  mode 
}: TransactionFormProps) {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: ''
  });

  useEffect(() => {
    if (transaction && mode === 'edit') {
      setFormData({
        description: transaction.description,
        amount: transaction.amount.toString(),
        type: transaction.type,
        category: transaction.category || ''
      });
    } else {
      setFormData({
        description: '',
        amount: '',
        type: 'expense',
        category: ''
      });
    }
  }, [transaction, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) return;

    onSubmit({
      description: formData.description,
      amount: parseFloat(formData.amount),
      type: formData.type,
      category: formData.category
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {mode === 'add' ? 'Tambah Transaksi' : 'Edit Transaksi'}
          </h2>
          <button 
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Deskripsi
            </label>
            <input
              type="text"
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="form-input"
              placeholder="e.g., Makan siang, Beli bensin"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label htmlFor="amount" className="form-label">
                Jumlah
              </label>
              <input
                type="number"
                id="amount"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="form-input"
                placeholder="0"
                min="0"
                step="1000"
                required
              />
            </div>

            <div className="form-group flex-1">
              <label htmlFor="quantity" className="form-label">
                Quantity <span className="text-gray-500 text-sm">(optional)</span>
              </label>
              <input
                type="number"
                id="quantity"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="form-input"
                placeholder="1"
                min="0"
                step="0.1"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label htmlFor="type" className="form-label">
                Tipe
              </label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })}
                className="form-select"
              >
                <option value="expense">Pengeluaran</option>
                <option value="income">Pendapatan</option>
              </select>
            </div>

            <div className="form-group flex-1">
              <label htmlFor="category" className="form-label">
                Kategori
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="form-select"
              >
                <option value="">Pilih Kategori</option>
                <option value="Makanan & Minuman">Makanan & Minuman</option>
                <option value="Transportasi">Transportasi</option>
                <option value="Belanja">Belanja</option>
                <option value="Hiburan">Hiburan</option>
                <option value="Kesehatan">Kesehatan</option>
                <option value="Pendidikan">Pendidikan</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              {mode === 'add' ? 'Tambah' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
