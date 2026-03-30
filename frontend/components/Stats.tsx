"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

const STAT_KEYS: { key: string; label: string }[] = [
  { key: "users",        label: "Readers"      },
  { key: "books",        label: "Books"        },
  { key: "ratings",      label: "Ratings"      },
  { key: "transactions", label: "Transactions" },
  { key: "rules",        label: "Rules"        },
];

export default function Stats() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.get("/stats").then((res) => setStats(res.data));
  }, []);

  if (!stats) return null;

  return (
    <div className="stats-grid">
      {STAT_KEYS.map(({ key, label }) => (
        <div className="stat-card" key={key}>
          <span className="stat-value">
            {Number(stats[key]).toLocaleString()}
          </span>
          <span className="stat-label">{label}</span>
        </div>
      ))}
    </div>
  );
}