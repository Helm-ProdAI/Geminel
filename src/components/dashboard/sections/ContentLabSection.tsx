"use client";

import { useState } from "react";
import { FlaskConical, Plus, CheckCircle2, Circle, PauseCircle } from "lucide-react";

interface LabTest {
  id: string;
  variable_tested: string;
  hypothesis: string;
  success_metric: string;
  start_date: string;
  end_date?: string;
  status: "active" | "completed" | "paused";
  winner?: "control" | "variant" | "inconclusive";
  confidence?: "high" | "medium" | "low";
  learning?: string;
}

const STATUS_ICON = {
  active:    { Icon: Circle,       color: "#E7C98A",  label: "Active" },
  completed: { Icon: CheckCircle2, color: "#6EC4A0",  label: "Complete" },
  paused:    { Icon: PauseCircle,  color: "#AEB6D4",  label: "Paused" },
};

const WINNER_COLOR = {
  control:      "#6EC4A0",
  variant:      "#7C82D4",
  inconclusive: "#AEB6D4",
};

// Placeholder data — replaced by Supabase when connected
const PLACEHOLDER_TESTS: LabTest[] = [
  {
    id: "1",
    variable_tested: "Hook style — question vs. statement",
    hypothesis: "Question hooks will outperform statement hooks for Teach content because they create open loops.",
    success_metric: "Engagement rate on first 48 hours",
    start_date: "2026-06-01",
    status: "active",
    confidence: "medium",
  },
  {
    id: "2",
    variable_tested: "Carousel vs. Reel for Teach content",
    hypothesis: "Carousels will generate more saves; Reels will generate more reach. Test which drives more profile visits.",
    success_metric: "Profile visits per 1000 impressions",
    start_date: "2026-05-01",
    end_date: "2026-05-31",
    status: "completed",
    winner: "control",
    confidence: "high",
    learning: "Carousels generated 2.4x more saves and 1.8x more profile visits than Reels for Teach content. Reels had 3.1x more raw reach but lower intent signals.",
  },
];

export function ContentLabSection({ brandId }: { brandId: string }) {
  const [tests] = useState<LabTest[]>(PLACEHOLDER_TESTS);
  const [showForm, setShowForm] = useState(false);
  const [newTest, setNewTest] = useState({ variable: "", hypothesis: "", metric: "" });

  const active    = tests.filter((t) => t.status === "active");
  const completed = tests.filter((t) => t.status === "completed");

  return (
    <div className="h-full overflow-y-auto px-8 py-8">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="eyebrow mb-2">Content Lab</div>
            <h1 style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 300, fontSize: 28, color: "#EDEFF7" }}>
              Test, do not guess.
            </h1>
            <p className="mt-1 text-sm" style={{ color: "#AEB6D4", fontWeight: 300 }}>
              One variable at a time. Track what wins. Scale only what earns it.
            </p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 rounded-md px-4 py-2 text-sm transition-all"
            style={{ background: "rgba(231,201,138,0.1)", border: "1px solid rgba(216,183,121,0.28)", color: "#E7C98A" }}
          >
            <Plus className="h-4 w-4" />
            New test
          </button>
        </div>

        {/* New test form */}
        {showForm && (
          <div className="mb-8 rounded-md p-5" style={{ background: "#0E1530", border: "1px solid rgba(216,183,121,0.28)" }}>
            <p className="mb-4 text-sm font-medium" style={{ color: "#EDEFF7" }}>New Content Lab test</p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-xs" style={{ color: "#AEB6D4" }}>Variable being tested</label>
                <input
                  value={newTest.variable}
                  onChange={(e) => setNewTest((p) => ({ ...p, variable: e.target.value }))}
                  placeholder="e.g. Hook style: question vs. statement"
                  className="w-full rounded border px-3 py-2 text-sm outline-none"
                  style={{ background: "rgba(7,11,28,0.6)", borderColor: "rgba(174,182,212,0.2)", color: "#EDEFF7" }}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs" style={{ color: "#AEB6D4" }}>Hypothesis</label>
                <textarea
                  value={newTest.hypothesis}
                  onChange={(e) => setNewTest((p) => ({ ...p, hypothesis: e.target.value }))}
                  placeholder="If we use question hooks, engagement rate will increase because..."
                  rows={2}
                  className="w-full rounded border px-3 py-2 text-sm outline-none resize-none"
                  style={{ background: "rgba(7,11,28,0.6)", borderColor: "rgba(174,182,212,0.2)", color: "#EDEFF7" }}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs" style={{ color: "#AEB6D4" }}>Success metric</label>
                <input
                  value={newTest.metric}
                  onChange={(e) => setNewTest((p) => ({ ...p, metric: e.target.value }))}
                  placeholder="e.g. Engagement rate in first 48 hours"
                  className="w-full rounded border px-3 py-2 text-sm outline-none"
                  style={{ background: "rgba(7,11,28,0.6)", borderColor: "rgba(174,182,212,0.2)", color: "#EDEFF7" }}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  className="rounded px-4 py-2 text-sm"
                  style={{ background: "#E7C98A", color: "#070B1C" }}
                  onClick={() => setShowForm(false)}
                >
                  Add test
                </button>
                <button
                  className="rounded px-4 py-2 text-sm"
                  style={{ color: "#AEB6D4" }}
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active tests */}
        {active.length > 0 && (
          <div className="mb-8">
            <div className="eyebrow mb-4" style={{ letterSpacing: "0.28em" }}>Running now</div>
            <div className="flex flex-col gap-3">
              {active.map((test) => <TestCard key={test.id} test={test} />)}
            </div>
          </div>
        )}

        {/* Completed tests */}
        {completed.length > 0 && (
          <div>
            <div className="eyebrow mb-4" style={{ letterSpacing: "0.28em" }}>Completed</div>
            <div className="flex flex-col gap-3">
              {completed.map((test) => <TestCard key={test.id} test={test} />)}
            </div>
          </div>
        )}

        {tests.length === 0 && (
          <EmptyState icon={FlaskConical} title="No tests yet" sub="Add your first Content Lab test above. One variable at a time." />
        )}
      </div>
    </div>
  );
}

function TestCard({ test }: { test: LabTest }) {
  const st = STATUS_ICON[test.status];
  const Icon = st.Icon;

  return (
    <div className="rounded-md p-5" style={{ background: "#0E1530", border: "1px solid rgba(174,182,212,0.1)" }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Icon className="h-3.5 w-3.5" style={{ color: st.color }} />
            <span className="text-xs" style={{ color: st.color }}>{st.label}</span>
            {test.winner && (
              <span
                className="rounded-full px-2 py-0.5 text-xs"
                style={{ background: `${WINNER_COLOR[test.winner]}18`, color: WINNER_COLOR[test.winner], border: `1px solid ${WINNER_COLOR[test.winner]}40` }}
              >
                {test.winner === "control" ? "Control won" : test.winner === "variant" ? "Variant won" : "Inconclusive"}
              </span>
            )}
          </div>
          <p className="text-sm font-medium" style={{ color: "#EDEFF7" }}>{test.variable_tested}</p>
          <p className="mt-1 text-xs" style={{ color: "#AEB6D4", fontWeight: 300 }}>{test.hypothesis}</p>
          <p className="mt-2 text-xs" style={{ color: "rgba(174,182,212,0.6)" }}>
            Measuring: {test.success_metric}
          </p>
          {test.learning && (
            <div className="mt-3 rounded px-3 py-2" style={{ background: "rgba(110,196,160,0.06)", border: "1px solid rgba(110,196,160,0.15)" }}>
              <p className="text-xs" style={{ color: "#6EC4A0" }}>Learning: {test.learning}</p>
            </div>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs" style={{ color: "#AEB6D4" }}>Started</p>
          <p className="text-xs" style={{ color: "#EDEFF7" }}>{test.start_date}</p>
          {test.end_date && (
            <>
              <p className="mt-1 text-xs" style={{ color: "#AEB6D4" }}>Ended</p>
              <p className="text-xs" style={{ color: "#EDEFF7" }}>{test.end_date}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Icon className="h-10 w-10 mb-4" style={{ color: "rgba(216,183,121,0.3)" }} />
      <p style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 300, color: "#EDEFF7" }}>{title}</p>
      <p className="mt-1 text-sm" style={{ color: "#AEB6D4" }}>{sub}</p>
    </div>
  );
}
