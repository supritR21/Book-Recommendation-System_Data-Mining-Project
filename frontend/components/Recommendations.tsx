type Recommendation = {
  isbn: string;
  title: string;
  author?: string;
  confidence: number;
  lift: number;
};

export default function Recommendations({
  data,
}: {
  data: Recommendation[];
}) {
  if (!data.length) return null;

  return (
    <section>
      <p className="recs-header">Recommended reads</p>

      <div className="recs-grid">
        {data.map((item, i) => (
          <div key={i} className="rec-card">
            {/* Left: book info */}
            <div>
              <p className="rec-rank">No. {String(i + 1).padStart(2, "0")}</p>
              <p className="rec-title">{item.title}</p>
              {item.author && (
                <p className="rec-author">{item.author}</p>
              )}
            </div>

            {/* Right: metrics */}
            <div className="rec-metrics">
              <div className="metric-badge">
                <span className="metric-value">
                  {item.confidence.toFixed(2)}
                </span>
                <span className="metric-label">Confidence</span>
                <div className="confidence-bar-wrap">
                  <div
                    className="confidence-bar-fill"
                    style={{ width: `${Math.min(item.confidence * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="metric-badge">
                <span className="metric-value">
                  {item.lift.toFixed(2)}
                </span>
                <span className="metric-label">Lift</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}