import React, { useState } from 'react';

interface AccordionItem {
  title: string;
  content: React.ReactNode;
  defaultOpen?: boolean;
}

interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
}

const Accordion = ({ items, allowMultiple = false }: AccordionProps) => {
  const [openItems, setOpenItems] = useState<Set<number>>(
    new Set(items.map((item, index) => (item.defaultOpen ? index : -1)).filter((i) => i !== -1))
  );

  const toggleItem = (index: number) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        if (!allowMultiple) {
          newSet.clear();
        }
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
          <button
            onClick={() => toggleItem(index)}
            className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all duration-200 text-left group"
          >
            <div className="flex items-center gap-3">
              <div className={`w-1 h-6 rounded-full transition-all duration-200 ${
                openItems.has(index) ? 'bg-blue-600' : 'bg-gray-300 group-hover:bg-gray-400'
              }`}></div>
              <span className="font-semibold text-gray-800 text-base">{item.title}</span>
            </div>
            <svg
              className={`w-5 h-5 text-gray-600 transform transition-all duration-200 ${
                openItems.has(index) ? 'rotate-180 text-blue-600' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {openItems.has(index) && (
            <div className="px-6 py-5 bg-white border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
              {item.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Accordion;

