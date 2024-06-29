import React from 'react';

interface MouseProps {
  color: 'red' | 'blue';
}

const Mouse: React.FC<MouseProps> = ({ color }) => {
  return <div className={`w-8 h-8 bg-${color=="red"?"orange":"green"}-500 rounded-full`}></div>;
};

export default Mouse;