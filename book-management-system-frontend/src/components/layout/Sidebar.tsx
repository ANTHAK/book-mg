import { BarChart3, BookOpen, Library, LogOut } from 'lucide-react';

type SidebarProps = {
  onLogout: () => void;
};

/**
 * 左侧导航栏。
 *
 * 当前项目只有图书管理和统计锚点，退出按钮由父组件处理状态清理。
 */
export function Sidebar({ onLogout }: SidebarProps) {
  return (
    <aside className="sidebar" aria-label="主导航">
      <div className="sidebar-brand">
        <Library size={28} aria-hidden="true" />
        <span>图书管理系统</span>
      </div>
      <nav>
        <a className="active" href="#books">
          <BookOpen size={18} aria-hidden="true" />
          图书管理
        </a>
        <a href="#stats">
          <BarChart3 size={18} aria-hidden="true" />
          数据概览
        </a>
      </nav>
      <button className="ghost-button" type="button" onClick={onLogout}>
        <LogOut size={18} aria-hidden="true" />
        退出登录
      </button>
    </aside>
  );
}
