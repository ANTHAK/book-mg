import { Plus } from 'lucide-react';
import type { SessionUser } from '../../types/auth';

type TopbarProps = {
  user: SessionUser;
  onCreateBook: () => void;
};

export function Topbar({ user, onCreateBook }: TopbarProps) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">当前用户</p>
        <h1>{user.email ?? '管理员'}</h1>
      </div>
      <button className="primary-button compact" type="button" onClick={onCreateBook}>
        <Plus size={18} aria-hidden="true" />
        新增图书
      </button>
    </header>
  );
}
