"use client";

import React from 'react';
import { X } from '@phosphor-icons/react';
import type { WebtoonData } from '@/utils/webtoonStorage';

interface CutThumbnailGridProps {
  webtoonData: WebtoonData;
  currentCut: number;
  onCutSelect: (index: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function CutThumbnailGrid({
  webtoonData,
  currentCut,
  onCutSelect,
  isOpen,
  onClose,
}: CutThumbnailGridProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[10004] transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-gray-800 rounded-t-3xl z-[10005] transition-transform duration-300 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '70vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg sm:text-xl font-semibold text-white">All Cuts</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-700 text-white transition-colors"
            title="Close"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Thumbnail Grid */}
        <div className="overflow-y-auto p-4" style={{ maxHeight: 'calc(70vh - 60px)' }}>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
            {webtoonData.cuts.map((cut, index) => (
              <button
                key={index}
                onClick={() => onCutSelect(index)}
                className={`aspect-[3/4] rounded-lg border-2 transition-all ${
                  currentCut === index
                    ? "border-blue-500 bg-blue-900/20 scale-105"
                    : "border-gray-600 bg-gray-700 hover:border-gray-500 hover:scale-102"
                }`}
              >
                <div className="w-full h-full flex items-center justify-center text-xs">
                  {cut.imageUrl ? (
                    <img
                      src={cut.imageUrl}
                      alt={`Cut ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span className="text-gray-400 text-[10px] sm:text-xs">Cut {index + 1}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

