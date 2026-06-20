"use client";

/** Premium orbit loader for the owner admin boot screen */
export default function PremiumAdminLoader() {
  return (
    <div className="oa-premium-loader" aria-hidden="true">
      <div className="oa-premium-loader-rings">
        <span className="oa-premium-loader-ring oa-premium-loader-ring--outer" />
        <span className="oa-premium-loader-ring oa-premium-loader-ring--mid" />
        <span className="oa-premium-loader-ring oa-premium-loader-ring--inner" />
        <span className="oa-premium-loader-core" />
      </div>
      <div className="oa-premium-loader-track">
        <div className="oa-premium-loader-fill" />
      </div>
    </div>
  );
}
