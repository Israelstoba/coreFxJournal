import React from 'react';
import FeatureGuard from '../../components/FeatureGuard';

const Playbooks = () => {
  return (
    <FeatureGuard feature="strategies">
      <div className="playbooks-page">
        <h2>Custom Strategies & Playbooks</h2>
        <p>Your custom trading strategies will appear here.</p>
        {/* Your playbooks content */}
      </div>
    </FeatureGuard>
  );
};

export default Playbooks;
