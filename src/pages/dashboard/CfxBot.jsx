import React from 'react';
import FeatureGuard from '../../components/FeatureGuard';

const CfxBot = () => {
  return (
    <FeatureGuard feature="bots">
      <div className="bots-page">
        <h2>Trading Bots</h2>
        <p>Manage your automated trading bots here.</p>
        {/* Your bots content */}
      </div>
    </FeatureGuard>
  );
};

export default CfxBot;
