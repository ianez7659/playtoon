"use client";

import React, { useState } from 'react';
import Button from './Button';

interface CutInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (cutCount: number) => void;
}

export default function CutInputModal({ isOpen, onClose, onConfirm }: CutInputModalProps) {
  const [cutCount, setCutCount] = useState<number>(2);
  const [error, setError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cutCount < 2 || cutCount > 20) {
      setError('Number of cuts must be between 2 and 20.');
      return;
    }
    
    setError('');
    onConfirm(cutCount);
    onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setCutCount(value);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Set Number of Webtoon Cuts</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="cutCount" className="block text-sm font-medium text-gray-700 mb-2">
              Enter the number of cuts to create (2-20)
            </label>
            <input
              type="number"
              id="cutCount"
              min="2"
              max="20"
              value={cutCount}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter number of cuts"
            />
            {error && (
              <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
          </div>
          
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
            >
              Create
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
