import type { BookStats } from '../../types/book';

type StatsGridProps = {
  stats: BookStats;
};

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <section className="stats-grid" id="stats" aria-label="馆藏统计">
      <article>
        <span>馆藏总量</span>
        <strong>{stats.total}</strong>
      </article>
      <article>
        <span>可借阅</span>
        <strong>{stats.available}</strong>
      </article>
      <article>
        <span>已借出</span>
        <strong>{stats.borrowed}</strong>
      </article>
      <article>
        <span>已归档</span>
        <strong>{stats.archived}</strong>
      </article>
    </section>
  );
}
