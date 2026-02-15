// import React from 'react';
// import { useFeatureAccess } from '../hooks/useFeatureAccess';
// import { Lock, Crown, AlertCircle } from 'lucide-react';
// import './_featureGuard.scss';

// const FeatureGuard = ({ feature, children, fallback }) => {
//   const { hasAccess, loading, isPro, isSuspended } = useFeatureAccess();

//   if (loading) {
//     return (
//       <div className="feature-loading">
//         <div className="spinner"></div>
//         <p>Checking access...</p>
//       </div>
//     );
//   }

//   if (isSuspended()) {
//     return (
//       <div className="feature-blocked suspended">
//         <div className="blocked-icon">
//           <AlertCircle size={48} />
//         </div>
//         <h2>Account Suspended</h2>
//         <p>
//           Your account has been suspended. Please contact support for
//           assistance.
//         </p>
//       </div>
//     );
//   }

//   if (!hasAccess(feature)) {
//     if (fallback) {
//       return fallback;
//     }

//     return (
//       <div className="feature-blocked">
//         <div className="blocked-icon">
//           <Lock size={48} />
//         </div>
//         <h2>Premium Feature</h2>
//         <p>Upgrade to Pro to unlock {feature} and more amazing features!</p>
//         <div className="upgrade-benefits">
//           <div className="benefit">
//             <Crown size={20} />
//             <span>Unlimited Journal Entries</span>
//           </div>
//           <div className="benefit">
//             <Crown size={20} />
//             <span>Advanced Analytics</span>
//           </div>
//           <div className="benefit">
//             <Crown size={20} />
//             <span>Custom Strategies</span>
//           </div>
//           <div className="benefit">
//             <Crown size={20} />
//             <span>Bot Trading Access</span>
//           </div>
//         </div>
//         <button className="upgrade-btn">
//           <Crown size={20} />
//           Upgrade to Pro - $29.99/month
//         </button>
//       </div>
//     );
//   }

//   return <>{children}</>;
// };

// export default FeatureGuard;

import React from 'react';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { Lock, Crown, AlertCircle } from 'lucide-react';
import './_featureGuard.scss';

const FeatureGuard = ({ feature, children, fallback }) => {
  const { hasAccess, loading, isPro, isSuspended } = useFeatureAccess();

  if (loading) {
    return (
      <div className="feature-loading">
        <div className="spinner"></div>
        <p>Checking access...</p>
      </div>
    );
  }

  if (isSuspended()) {
    return (
      <div className="feature-blocked suspended">
        <div className="blocked-icon">
          <AlertCircle size={48} />
        </div>
        <h2>Account Suspended</h2>
        <p>
          Your account has been suspended. Please contact support for
          assistance.
        </p>
        <a href="mailto:support@corefx.com" className="contact-support-btn">
          Contact Support
        </a>
      </div>
    );
  }

  if (!hasAccess(feature)) {
    if (fallback) {
      return fallback;
    }

    return (
      <div className="feature-blocked">
        <div className="blocked-icon">
          <Lock size={48} />
        </div>
        <h2>Premium Feature</h2>
        <p>Upgrade to Pro to unlock {feature} and more amazing features!</p>
        <div className="upgrade-benefits">
          <div className="benefit">
            <Crown size={20} />
            <span>Unlimited Journal Entries</span>
          </div>
          <div className="benefit">
            <Crown size={20} />
            <span>Advanced Analytics</span>
          </div>
          <div className="benefit">
            <Crown size={20} />
            <span>Custom Strategies</span>
          </div>
          <div className="benefit">
            <Crown size={20} />
            <span>Bot Trading Access</span>
          </div>
        </div>
        <button
          className="upgrade-btn"
          onClick={() => alert('Payment integration coming soon!')}
        >
          <Crown size={20} />
          Upgrade to Pro - $29.99/month
        </button>
      </div>
    );
  }

  // User has access - show the content
  return <>{children}</>;
};

export default FeatureGuard;
