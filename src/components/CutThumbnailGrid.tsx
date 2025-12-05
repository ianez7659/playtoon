"use client";

import React from 'react';
import type { WebtoonData } from '@/utils/webtoonStorage';

interface CutThumbnailGridProps {
  webtoonData: WebtoonData;
  currentCut: number;
  onCutSelect: (index: number) => void;
}

export default function CutThumbnailGrid({
  webtoonData,
  currentCut,
  onCutSelect,
}: CutThumbnailGridProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">All Cuts</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {webtoonData.cuts.map((cut, index) => (
          <button
            key={index}
            onClick={() => onCutSelect(index)}
            className={`aspect-[3/4] rounded-lg border-2 transition-colors ${
              currentCut === index
                ? "border-blue-500 bg-blue-900/20"
                : "border-gray-600 bg-gray-700 hover:border-gray-500"
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
                <span className="text-gray-400">Cut {index + 1}</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

