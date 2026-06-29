import { memo } from "react";
import { useNavigate } from "react-router-dom";
import Eyebrow from "../../components/Eyebrow";
import GoldRule from "../../components/GoldRule";
import { useSession } from "./session-context";

/** Member account — shows the mock session identity + a sign-out path. */
const Account = () => {
  const navigate = useNavigate();
  const { memberId, signOut } = useSession();

  const onSignOut = () => {
    signOut();
    navigate("/investor/login");
  };

  const rows = [
    { k: "Member ID", v: memberId || "—", mono: true },
    { k: "Access Tier", v: "Mandate / Private" },
    { k: "Session", v: "Active · monitored", tone: "graph" as const },
    { k: "Primary Contact", v: "Relationship desk" },
  ];

  return (
    <div className="max-w-3xl">
      <header>
        <Eyebrow index="03">Account</Eyebrow>
        <h1 className="mt-5 text-display text-4xl text-ghost lg:text-5xl">
          Membership & access.
        </h1>
        <p className="mt-4 text-sm font-light leading-relaxed text-silver/60">
          Your member identity and session. Profile management, statements, and
          security controls are illustrative here and land with the full
          investor area.
        </p>
      </header>

      <GoldRule className="my-10" />

      <dl className="border border-gold/10 bg-midnight/40 gold-grid">
        {rows.map((row, i) => (
          <div
            key={row.k}
            className={`flex items-center justify-between gap-6 px-6 py-5 ${
              i !== rows.length - 1 ? "border-b border-silver/5" : ""
            }`}
          >
            <dt className="text-[0.62rem] font-medium uppercase tracking-[0.22em] text-silver/45">
              {row.k}
            </dt>
            <dd
              className={`text-sm ${row.mono ? "font-mono" : "font-light"} ${
                row.tone === "graph" ? "text-graph" : "text-ghost"
              }`}
            >
              {row.v}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 flex flex-col items-start gap-4 border-t border-gold/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[0.66rem] font-light text-silver/45">
          Ending your session returns you to the sign-in gateway.
        </p>
        <button
          type="button"
          onClick={onSignOut}
          className="border border-silver/20 px-6 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-ghost transition-colors hover:border-gold hover:text-gold"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default memo(Account);
