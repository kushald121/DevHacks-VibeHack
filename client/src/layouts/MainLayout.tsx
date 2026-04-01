import type { PropsWithChildren, ReactNode } from 'react'
import SidebarRail from '../components/SidebarRail'
import TopNav from '../components/TopNav'

type Props = PropsWithChildren<{
  right: ReactNode
}>

export default function MainLayout({ children, right }: Props) {
  return (
    <div className="ui-shell">
      <div className="ui-orb ui-orb--one" aria-hidden />
      <div className="ui-orb ui-orb--two" aria-hidden />
      <SidebarRail />
      <div className="ui-shell__content">
        <TopNav />
        <div className="ui-shell__grid">
          <main>{children}</main>
          <aside>{right}</aside>
        </div>
      </div>
    </div>
  )
}
